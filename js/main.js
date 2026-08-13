// ===========================================================
// MAIN — point d'entrée de l'application : orchestration générale.
//
// La logique concrète vit dans des modules dédiés :
//   - state.js     : état centralisé du jeu
//   - camera.js    : déplacement/zoom de la caméra
//   - input.js     : entrées souris/tactile
//   - resources.js : nœuds de ressources et collecte
//   - storage.js   : sauvegarde/chargement (IndexedDB)
//   - renderer.js  : génération du terrain et dessin de la scène
//
// main.js garde : démarrage, écran de chargement, statut réseau,
// Service Worker, et le système de temps + la boucle de jeu.
// ===========================================================

// ---------------------------------------------------------
// SERVICE WORKER — activation du mode hors ligne
// ---------------------------------------------------------
function enregistrerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker non supporté par ce navigateur.');
    return;
  }
  if (location.protocol === 'file:') {
    console.warn('Service Worker désactivé : la page est ouverte en file://. Utilisez un serveur local pour tester le mode hors ligne.');
    return;
  }

  navigator.serviceWorker.register(BASE_PATH + 'sw.js', { scope: BASE_PATH })
    .then((enregistrement) => {
      console.log('Service Worker enregistré, scope :', enregistrement.scope);
    })
    .catch((erreur) => {
      console.error('Échec de l\'enregistrement du Service Worker :', erreur);
    });
}

// ---------------------------------------------------------
// STATUT RÉSEAU — indicateur en ligne / hors ligne
// ---------------------------------------------------------
function majStatutReseau() {
  const badge = document.getElementById('statut-reseau');
  const texte = document.getElementById('statut-reseau-texte');
  if (navigator.onLine) {
    badge.classList.remove('hors-ligne');
    texte.textContent = 'En ligne';
    clearTimeout(majStatutReseau._t);
    majStatutReseau._t = setTimeout(() => badge.classList.add('discret'), 2500);
  } else {
    badge.classList.add('hors-ligne');
    badge.classList.remove('discret');
    texte.textContent = 'Hors ligne';
  }
}
window.addEventListener('online', majStatutReseau);
window.addEventListener('offline', majStatutReseau);

// ---------------------------------------------------------
// ÉCRAN DE CHARGEMENT
// ---------------------------------------------------------
function masquerEcranChargement() {
  const ecran = document.getElementById('ecran-chargement');
  ecran.classList.add('masque');
  setTimeout(() => ecran.remove(), 600);
}

// ---------------------------------------------------------
// CANEVAS
// ---------------------------------------------------------
const canvas = document.getElementById('canvas-jeu');
const ctx = canvas.getContext('2d');

function redimensionnerCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', redimensionnerCanvas);
redimensionnerCanvas();

// ---------------------------------------------------------
// SYSTÈME DE TEMPS — indépendant du taux de rafraîchissement de
// l'écran. `temps.total` (secondes depuis le lancement) et
// `temps.delta` (secondes depuis la frame précédente) sont ce que
// tous les futurs systèmes de jeu (production, déplacement des
// unités, minuteries de combat...) devront utiliser pour rester
// cohérents quel que soit l'appareil.
// ---------------------------------------------------------
const temps = {
  total: 0,
  delta: 0,
  enPause: false
};
let dernierHorodatage = null;
const DELTA_MAX = 0.25; // borne (secondes) pour éviter un bond après une mise en arrière-plan

function mettreAJourTemps(horodatageActuel) {
  // Garde défensive symétrique à celle de storage.js : un horodatage
  // invalide ne doit jamais produire un delta NaN qui se propagerait
  // silencieusement dans tout le reste du jeu.
  if (!Number.isFinite(horodatageActuel)) {
    temps.delta = 0;
    return;
  }
  if (dernierHorodatage === null) dernierHorodatage = horodatageActuel;
  let delta = (horodatageActuel - dernierHorodatage) / 1000;
  delta = clamp(delta, 0, DELTA_MAX);
  dernierHorodatage = horodatageActuel;

  temps.delta = temps.enPause ? 0 : delta;
  temps.total += temps.delta;
}

// ---------------------------------------------------------
// BOUCLE DE JEU
// ---------------------------------------------------------
function boucle(horodatageActuel) {
  // App en arrière-plan : on ne calcule ni ne dessine rien, et on
  // réinitialise la référence de temps pour éviter un bond au retour.
  if (document.hidden) {
    dernierHorodatage = null;
    requestAnimationFrame(boucle);
    return;
  }

  mettreAJourTemps(horodatageActuel);
  mettreAJourAutoSave(temps.delta);
  mettreAJourProduction(temps.delta);
  rendreScene(temps);

  requestAnimationFrame(boucle);
}

// ---------------------------------------------------------
// RACCOURCIS DE TEST — sauvegarde/chargement/suppression manuels.
// Provisoire : sera remplacé par de vrais boutons dans ui.js. Permet
// de tester dès maintenant toute l'API de storage.js sans attendre
// l'interface.
//   S = sauvegarder sur l'emplacement "manuel"
//   L = charger l'emplacement "manuel"
//   Suppr = supprimer l'emplacement "manuel"
// ---------------------------------------------------------
window.addEventListener('keydown', (e) => {
  const touche = e.key.toLowerCase();
  if (touche === 's') {
    sauvegarderPartie('manuel')
      .then(() => console.log('Sauvegarde manuelle effectuée (emplacement "manuel").'))
      .catch((erreur) => console.error('Échec de la sauvegarde manuelle :', erreur));
  } else if (touche === 'l') {
    chargerPartie('manuel')
      .then((sauvegarde) => {
        if (sauvegarde) {
          appliquerInstantane(sauvegarde);
          console.log('Sauvegarde manuelle chargée.');
        } else {
          console.log('Aucune sauvegarde sur l\'emplacement "manuel".');
        }
      })
      .catch((erreur) => console.error('Échec du chargement :', erreur));
  } else if (touche === 'delete' || touche === 'backspace') {
    supprimerSauvegarde('manuel')
      .then(() => console.log('Sauvegarde manuelle supprimée.'))
      .catch((erreur) => console.error('Échec de la suppression :', erreur));
  } else if (RACCOURCIS_PRODUCTION[touche]) {
    const [typeBatiment, typeUnite] = RACCOURCIS_PRODUCTION[touche];
    const batiment = trouverBatiment(typeBatiment);
    if (!batiment) return;
    const succes = mettreEnFileProduction(batiment, typeUnite);
    console.log(succes
      ? `${TYPES_UNITE[typeUnite].label} mise en production (${TYPES_BATIMENT_PRODUCTION[typeBatiment].label}).`
      : `Impossible de produire ${TYPES_UNITE[typeUnite].label} pour le moment.`);
  }
});

// Raccourcis de test pour la production — provisoire, sera remplacé
// par le vrai menu de production de ui.js.
//   1 = Ouvrière (Nurserie)      4 = Fourmi rouge (Caserne)
//   2 = Nourrice (Nurserie)      5 = Fourmi charpentière (Caserne)
//   3 = Éclaireuse (École des éclaireuses)
const RACCOURCIS_PRODUCTION = {
  '1': ['nurserie', 'ouvriere'],
  '2': ['nurserie', 'nourrice'],
  '3': ['ecoleEclaireuses', 'eclaireuse'],
  '4': ['caserne', 'fourmiRouge'],
  '5': ['caserne', 'fourmiCharpentiere']
};

// ---------------------------------------------------------
// DÉMARRAGE
// ---------------------------------------------------------
enregistrerServiceWorker();
majStatutReseau();
initialiserInput();

demarrerPartie().finally(() => {
  requestAnimationFrame(boucle);
  setTimeout(masquerEcranChargement, 400);
});

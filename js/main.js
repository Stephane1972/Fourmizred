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
  // APK Android (vague 14) : la WebView sert le jeu depuis un domaine
  // virtuel local (WebViewAssetLoader, voir android/README-APK.md) sous
  // /assets/www/, jamais sous BASE_PATH ("/Fourmizred/") — un enregistrement
  // échouerait donc systématiquement (chemin introuvable) sans rien
  // apporter : l'APK embarque déjà tous les fichiers, il n'a besoin
  // d'aucun cache réseau. Le Service Worker reste utile et actif pour le
  // déploiement navigateur (GitHub Pages), seul cas où ce chemin n'est
  // pas emprunté.
  if (location.hostname === 'appassets.androidplatform.net') {
    console.log('Service Worker désactivé : contenu déjà embarqué dans l\'APK (WebViewAssetLoader).');
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

  // Une fois la partie gagnée ou perdue, on fige la simulation
  // (plus de production, récolte ni combat) mais la scène reste
  // rendue pour que le champ de bataille final reste visible sous
  // le message de victoire/défaite.
  if (!etat.resultatPartie) {
    mettreAJourProduction(temps.delta);
    mettreAJourRecolte(temps.delta);
    mettreAJourCombat(temps.delta);
    mettreAJourDefenses(temps.delta);
    mettreAJourLaboratoires(temps.delta);
    mettreAJourMission(temps.delta);
    // Détecte le mouvement de chaque unité (voir units.js) pour animer
    // pattes et antennes dans le rendu — indépendant du rendu lui-même,
    // pour que l'animation ne saute jamais au retour d'une unité à l'écran.
    mettreAJourAnimationUnites(temps.delta);
  }

  rendreScene(temps);

  requestAnimationFrame(boucle);
}

// ---------------------------------------------------------
// RACCOURCIS CLAVIER — sauvegarde/chargement/suppression manuels.
// Coexistent avec les boutons tactiles équivalents du panneau
// "Partie" ajoutés par js/ui.js (vague 13) : les deux appellent
// exactement les mêmes fonctions de storage.js, sans différence de
// comportement. Conservés pour un usage clavier/desktop rapide.
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
  } else if (touche === 'c') {
    // Annule tous les ordres (récolte et combat) des unités
    // actuellement sélectionnées — provisoire, sera un bouton dans ui.js.
    const selectionnees = etat.unites.filter((u) => u.faction === 'joueur' && u.selectionnee);
    for (const u of selectionnees) annulerOrdres(u);
    console.log(`Ordres annulés pour ${selectionnees.length} unité(s).`);
  } else if (RACCOURCIS_DEFENSE[touche]) {
    activerPlacementDefense(RACCOURCIS_DEFENSE[touche]);
  } else if (RACCOURCIS_LABORATOIRE[touche]) {
    activerPlacementLaboratoire(RACCOURCIS_LABORATOIRE[touche]);
  }
});

// Raccourcis de test pour armer le mode de placement d'un
// laboratoire — provisoire, sera un menu de construction dans ui.js.
//   B = Laboratoire biologique     O = Observatoire
//   H = Laboratoire chimique       T = Centre de stratégie
//   G = Centre de génétique
const RACCOURCIS_LABORATOIRE = {
  'b': 'laboratoireBiologique',
  'h': 'laboratoireChimique',
  'g': 'centreGenetique',
  'o': 'observatoire',
  't': 'centreStrategie'
};

// Raccourcis de test pour armer le mode de placement d'une défense —
// provisoire, sera un menu de construction dans ui.js.
//   6 = Mur de résine        9 = Piège à mandibules
//   7 = Porte blindée        0 = Tourelle à acide
//   8 = Lance-venin
const RACCOURCIS_DEFENSE = {
  '6': 'murResine',
  '7': 'porteBlindee',
  '8': 'lanceVenin',
  '9': 'piegeMandibules',
  '0': 'tourelleAcide'
};

// Raccourcis clavier pour la production — coexistent avec le vrai
// menu de production tactile de ui.js (vague 13), mêmes fonctions
// appelées des deux côtés.
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

// ===========================================================
// MAIN — point d'entrée de l'application : orchestration générale.
//
// La logique concrète vit dans des modules dédiés :
//   - state.js     : état centralisé du jeu
//   - camera.js    : déplacement/zoom de la caméra
//   - input.js     : entrées souris/tactile
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
  rendreScene(temps);

  requestAnimationFrame(boucle);
}

// ---------------------------------------------------------
// DÉMARRAGE
// ---------------------------------------------------------
enregistrerServiceWorker();
majStatutReseau();
genererTerrain();
initialiserInput();
requestAnimationFrame(boucle);

setTimeout(masquerEcranChargement, 400);

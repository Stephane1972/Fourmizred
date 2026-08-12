// ===========================================================
// MAIN — point d'entrée de l'application : orchestration générale.
//
// La logique concrète vit désormais dans des modules dédiés :
//   - state.js     : état centralisé du jeu
//   - camera.js    : déplacement/zoom de la caméra
//   - input.js     : entrées souris/tactile
//   - renderer.js  : dessin de la scène
//
// main.js ne garde que ce qui ne rentre nulle part ailleurs :
// démarrage, écran de chargement, statut réseau, Service Worker.
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
// BOUCLE PRINCIPALE
// ---------------------------------------------------------
function boucle() {
  rendreScene();
  requestAnimationFrame(boucle);
}

// ---------------------------------------------------------
// DÉMARRAGE
// ---------------------------------------------------------
enregistrerServiceWorker();
majStatutReseau();
initialiserInput();
boucle();

setTimeout(masquerEcranChargement, 400);

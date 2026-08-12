// ===========================================================
// MAIN — point d'entrée de l'application.
//
// À ce stade (vague 1), ce fichier gère :
//   - l'enregistrement du service worker (fonctionnement hors ligne)
//   - l'écran de chargement
//   - l'indicateur en ligne / hors ligne
//   - un rendu minimal du canevas, pour valider que tout le pipeline
//     (HTML → CSS → JS → Canvas) fonctionne correctement
//
// Le vrai moteur de jeu (renderer.js, camera.js, input.js, state.js...)
// sera ajouté dans les prochaines vagues. main.js s'allégera alors
// pour ne garder que l'orchestration générale.
// ===========================================================

// ---------------------------------------------------------
// SERVICE WORKER — activation du mode hors ligne
// ---------------------------------------------------------
function enregistrerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker non supporté par ce navigateur.');
    return;
  }
  // Les service workers ne fonctionnent pas sous file:// — c'est une
  // restriction du navigateur, pas un bug du projet. Voir le README
  // pour tester en local avec un petit serveur HTTP.
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
    // Le jeu étant hors-ligne par conception, on estompe le badge
    // après un court instant pour ne pas encombrer l'écran.
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
// CANEVAS — rendu minimal de validation (sera remplacé par
// renderer.js dans une prochaine vague)
// ---------------------------------------------------------
const canvas = document.getElementById('canvas-jeu');
const ctx = canvas.getContext('2d');

function redimensionnerCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', redimensionnerCanvas);
redimensionnerCanvas();

function rendreEcranValidation() {
  ctx.fillStyle = PALETTE.sol;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  const taille = 48;
  for (let x = 0; x < canvas.width; x += taille) {
    for (let y = 0; y < canvas.height; y += taille) {
      if (((x / taille) + (y / taille)) % 2 === 0) {
        ctx.fillRect(x, y, taille, taille);
      }
    }
  }

  ctx.fillStyle = '#3a2818';
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px Arial';
  ctx.fillText(NOM_JEU, canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = '14px Arial';
  ctx.fillText(SOUS_TITRE_JEU, canvas.width / 2, canvas.height / 2 + 16);
  ctx.font = '12px Arial';
  ctx.fillStyle = 'rgba(58,40,24,0.6)';
  ctx.fillText('Socle technique v' + VERSION_JEU + ' — moteur de jeu à venir', canvas.width / 2, canvas.height / 2 + 40);
}

function boucle() {
  rendreEcranValidation();
  requestAnimationFrame(boucle);
}

// ---------------------------------------------------------
// DÉMARRAGE
// ---------------------------------------------------------
enregistrerServiceWorker();
majStatutReseau();
boucle();

// Petit délai volontaire avant de masquer l'écran de chargement,
// pour éviter un flash trop brutal même quand tout charge très vite.
setTimeout(masquerEcranChargement, 400);

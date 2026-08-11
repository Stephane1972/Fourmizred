// ===========================================================
// ÉTAT — références DOM, état global du jeu, caméra, deltaTime,
// grille d'exploration. Chargé tôt : les autres modules s'appuient
// sur ces variables globales.
// ===========================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const minicarte = document.getElementById('minicarte');
const ctxMini = minicarte.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ---------------------------------------------------------
// CARTE
// ---------------------------------------------------------
const MAP_W = 3000;
const MAP_H = 2000;

// ---------------------------------------------------------
// EXPLORATION — mémorise les zones découvertes, pour la mini-carte
// ---------------------------------------------------------
const TAILLE_CELLULE = 100;
const GRILLE_COLS = Math.ceil(MAP_W / TAILLE_CELLULE);
const GRILLE_ROWS = Math.ceil(MAP_H / TAILLE_CELLULE);
const grilleExploree = new Uint8Array(GRILLE_COLS * GRILLE_ROWS);

function celluleExploree(worldX, worldY) {
  const cx = Math.max(0, Math.min(GRILLE_COLS - 1, Math.floor(worldX / TAILLE_CELLULE)));
  const cy = Math.max(0, Math.min(GRILLE_ROWS - 1, Math.floor(worldY / TAILLE_CELLULE)));
  return grilleExploree[cy * GRILLE_COLS + cx] === 1;
}

function reveler(worldX, worldY, rayon) {
  const c0 = Math.max(0, Math.floor((worldX - rayon) / TAILLE_CELLULE));
  const c1 = Math.min(GRILLE_COLS - 1, Math.floor((worldX + rayon) / TAILLE_CELLULE));
  const r0 = Math.max(0, Math.floor((worldY - rayon) / TAILLE_CELLULE));
  const r1 = Math.min(GRILLE_ROWS - 1, Math.floor((worldY + rayon) / TAILLE_CELLULE));
  for (let ry = r0; ry <= r1; ry++) {
    for (let rx = c0; rx <= c1; rx++) {
      grilleExploree[ry * GRILLE_COLS + rx] = 1;
    }
  }
}

// ---------------------------------------------------------
// CAMÉRA
// ---------------------------------------------------------
let camX = MAP_W / 2 - canvas.width / 2;
let camY = MAP_H / 2 - canvas.height / 2;
const camSpeed = 12;

// ---------------------------------------------------------
// deltaTime : normalise la vitesse du jeu quel que soit le taux de
// rafraîchissement de l'écran (60Hz, 90Hz, 120Hz...). dt = 1 correspond
// à une frame de référence à 60 images/seconde.
// ---------------------------------------------------------
let dt = 1;
let dernierTemps = performance.now();

function majDeltaTime() {
  const maintenant = performance.now();
  dt = (maintenant - dernierTemps) / (1000 / 60);
  dt = Math.max(0, Math.min(dt, 3)); // borne pour éviter un bond après une pause/mise en arrière-plan
  dernierTemps = maintenant;
}

function updateCamera() {
  const v = camSpeed * dt;
  if (touches['arrowup'] || touches['z']) camY -= v;
  if (touches['arrowdown'] || touches['s']) camY += v;
  if (touches['arrowleft'] || touches['q']) camX -= v;
  if (touches['arrowright'] || touches['d']) camX += v;
  camX = Math.max(0, Math.min(MAP_W - canvas.width, camX));
  camY = Math.max(0, Math.min(MAP_H - canvas.height, camY));
}

// ---------------------------------------------------------
// ÉCONOMIE & POPULATIONS
// ---------------------------------------------------------
let nourritureAuNid = 0;
const fourmis = [];
const ennemis = [];
const insectes = [];
const batiments = [];
let modePlacement = null; // 'chambre' ou null

// ---------------------------------------------------------
// BÂTIMENTS — définitions
// ---------------------------------------------------------
const TYPES_BATIMENT = {
  chambre: {
    label: 'Chambre',
    cout: 150,
    rayon: 26,
    couleur: '#4a3018',
    coutProduction: 40,
    delaiProduction: 300 // ~5s à 60fps
  }
};
const COUT_SOLDAT = 80;

// ---------------------------------------------------------
// COMBAT — constantes
// ---------------------------------------------------------
const MAX_ENNEMIS = 14;
let minuteurSpawnEnnemi = 200;
const DETECTION_ENNEMI = 220;
const PORTEE_ATTAQUE = 18;
const COOLDOWN_ATTAQUE = 45;

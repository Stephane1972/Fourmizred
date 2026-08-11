// ===========================================================
// MINI-CARTE — zones explorées, fourmis, ennemis au contact
// ===========================================================
const ECHELLE_MINI_X = minicarte.width / MAP_W;
const ECHELLE_MINI_Y = minicarte.height / MAP_H;
const RAYON_DETECTION_MINICARTE = 160; // un ennemi n'apparaît que s'il est proche d'une fourmi

function dessinerMinicarte() {
  ctxMini.fillStyle = '#0a0805';
  ctxMini.fillRect(0, 0, minicarte.width, minicarte.height);

  // Zones explorées
  ctxMini.fillStyle = '#6b5738';
  for (let ry = 0; ry < GRILLE_ROWS; ry++) {
    for (let rx = 0; rx < GRILLE_COLS; rx++) {
      if (grilleExploree[ry * GRILLE_COLS + rx] === 1) {
        ctxMini.fillRect(
          rx * TAILLE_CELLULE * ECHELLE_MINI_X,
          ry * TAILLE_CELLULE * ECHELLE_MINI_Y,
          TAILLE_CELLULE * ECHELLE_MINI_X + 1,
          TAILLE_CELLULE * ECHELLE_MINI_Y + 1
        );
      }
    }
  }

  // Nid joueur
  ctxMini.fillStyle = '#f0e0c0';
  ctxMini.beginPath();
  ctxMini.arc(nid.x * ECHELLE_MINI_X, nid.y * ECHELLE_MINI_Y, 4, 0, Math.PI * 2);
  ctxMini.fill();

  // Nid ennemi, seulement s'il a été découvert
  if (celluleExploree(nidEnnemi.x, nidEnnemi.y)) {
    ctxMini.fillStyle = '#e05050';
    ctxMini.beginPath();
    ctxMini.arc(nidEnnemi.x * ECHELLE_MINI_X, nidEnnemi.y * ECHELLE_MINI_Y, 4, 0, Math.PI * 2);
    ctxMini.fill();
  }

  // Fourmis joueur (toujours visibles)
  ctxMini.fillStyle = '#3ae03a';
  for (const f of fourmis) {
    ctxMini.fillRect(f.x * ECHELLE_MINI_X - 1, f.y * ECHELLE_MINI_Y - 1, 2, 2);
  }

  // Ennemis, seulement au contact direct d'une fourmi joueur
  ctxMini.fillStyle = '#e03a3a';
  for (const e of ennemis) {
    let proche = false;
    for (const f of fourmis) {
      if (Math.hypot(f.x - e.x, f.y - e.y) < RAYON_DETECTION_MINICARTE) { proche = true; break; }
    }
    if (proche) ctxMini.fillRect(e.x * ECHELLE_MINI_X - 1, e.y * ECHELLE_MINI_Y - 1, 2, 2);
  }

  // Rectangle représentant la vue caméra actuelle
  ctxMini.strokeStyle = 'rgba(255,255,255,0.8)';
  ctxMini.lineWidth = 1;
  ctxMini.strokeRect(
    camX * ECHELLE_MINI_X, camY * ECHELLE_MINI_Y,
    canvas.width * ECHELLE_MINI_X, canvas.height * ECHELLE_MINI_Y
  );
}

function recentrerDepuisMinicarte(clientX, clientY) {
  const rect = minicarte.getBoundingClientRect();
  const worldX = (clientX - rect.left) / ECHELLE_MINI_X;
  const worldY = (clientY - rect.top) / ECHELLE_MINI_Y;
  camX = Math.max(0, Math.min(MAP_W - canvas.width, worldX - canvas.width / 2));
  camY = Math.max(0, Math.min(MAP_H - canvas.height, worldY - canvas.height / 2));
}

minicarte.addEventListener('pointerdown', e => {
  e.stopPropagation();
  recentrerDepuisMinicarte(e.clientX, e.clientY);
});

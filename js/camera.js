// ===========================================================
// CAMERA — déplacement, zoom, et conversions entre coordonnées
// écran (pixels sur le canvas) et coordonnées monde (position dans
// la carte du jeu). Toute la logique de "où regarde-t-on" vit ici ;
// input.js pilote la caméra, renderer.js l'utilise pour dessiner.
// ===========================================================

function deplacerCamera(dx, dy) {
  const cam = etat.camera;
  cam.x -= dx / cam.zoom;
  cam.y -= dy / cam.zoom;
  clamperCamera();
}

function zoomerCamera(facteur, centreEcranX, centreEcranY) {
  const cam = etat.camera;
  const ancienZoom = cam.zoom;

  // Point du monde sous le doigt/curseur avant le zoom
  const mondeX = cam.x + (centreEcranX - canvas.width / 2) / ancienZoom;
  const mondeY = cam.y + (centreEcranY - canvas.height / 2) / ancienZoom;

  cam.zoom = clamp(cam.zoom * facteur, cam.zoomMin, cam.zoomMax);

  // Recentre pour que ce même point du monde reste sous le doigt/curseur
  // après le zoom (zoom "vers le point visé", pas vers le centre écran)
  cam.x = mondeX - (centreEcranX - canvas.width / 2) / cam.zoom;
  cam.y = mondeY - (centreEcranY - canvas.height / 2) / cam.zoom;

  clamperCamera();
}

function clamperCamera() {
  const cam = etat.camera;
  const demiLargeurVisible = (canvas.width / cam.zoom) / 2;
  const demiHauteurVisible = (canvas.height / cam.zoom) / 2;

  // Si la carte est plus petite que la fenêtre visible (zoom très réduit),
  // on centre simplement au lieu de clamper dans un intervalle inversé.
  if (demiLargeurVisible * 2 >= etat.carte.largeur) {
    cam.x = etat.carte.largeur / 2;
  } else {
    cam.x = clamp(cam.x, demiLargeurVisible, etat.carte.largeur - demiLargeurVisible);
  }
  if (demiHauteurVisible * 2 >= etat.carte.hauteur) {
    cam.y = etat.carte.hauteur / 2;
  } else {
    cam.y = clamp(cam.y, demiHauteurVisible, etat.carte.hauteur - demiHauteurVisible);
  }
}

// Coordonnée écran (pixels canvas) -> coordonnée monde
function ecranVersMonde(ex, ey) {
  const cam = etat.camera;
  return {
    x: cam.x + (ex - canvas.width / 2) / cam.zoom,
    y: cam.y + (ey - canvas.height / 2) / cam.zoom
  };
}

// Coordonnée monde -> coordonnée écran (pixels canvas)
function mondeVersEcran(mx, my) {
  const cam = etat.camera;
  return {
    x: (mx - cam.x) * cam.zoom + canvas.width / 2,
    y: (my - cam.y) * cam.zoom + canvas.height / 2
  };
}

// Rectangle du monde actuellement visible à l'écran, avec une marge
// optionnelle (utile pour ne pas faire "sauter" un élément dessiné
// juste hors champ). Utilisé par renderer.js pour ignorer tout ce qui
// est hors écran et ne pas gaspiller de temps de rendu inutilement.
function zoneVisibleMonde(marge) {
  const cam = etat.camera;
  const m = marge || 0;
  const demiLargeur = (canvas.width / cam.zoom) / 2 + m;
  const demiHauteur = (canvas.height / cam.zoom) / 2 + m;
  return {
    x1: cam.x - demiLargeur,
    y1: cam.y - demiHauteur,
    x2: cam.x + demiLargeur,
    y2: cam.y + demiHauteur
  };
}

// ===========================================================
// INPUT — entrées souris/tactile/clavier. À cette vague, uniquement
// le pilotage de la caméra (glisser pour déplacer, molette/pincement
// pour zoomer). La sélection d'unités et les ordres arriveront avec
// units.js à une prochaine vague.
// ===========================================================

const pointeursActifs = new Map();
let modeGlissement = null; // 'camera' | null
let dernierPointUnique = null;
let distancePincementPrecedente = null;

function initialiserInput() {
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointeursActifs.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointeursActifs.size === 1) {
      modeGlissement = 'camera';
      dernierPointUnique = { x: e.clientX, y: e.clientY };
    } else if (pointeursActifs.size === 2) {
      distancePincementPrecedente = distanceEntrePointeurs();
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!pointeursActifs.has(e.pointerId)) return;
    pointeursActifs.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointeursActifs.size === 1 && modeGlissement === 'camera') {
      const dx = e.clientX - dernierPointUnique.x;
      const dy = e.clientY - dernierPointUnique.y;
      deplacerCamera(dx, dy);
      dernierPointUnique = { x: e.clientX, y: e.clientY };
    } else if (pointeursActifs.size === 2) {
      const distanceActuelle = distanceEntrePointeurs();
      if (distancePincementPrecedente) {
        const facteur = distanceActuelle / distancePincementPrecedente;
        const centre = centreEntrePointeurs();
        zoomerCamera(facteur, centre.x, centre.y);
      }
      distancePincementPrecedente = distanceActuelle;
    }
  });

  function finPointeur(e) {
    pointeursActifs.delete(e.pointerId);
    if (pointeursActifs.size === 0) {
      modeGlissement = null;
      dernierPointUnique = null;
    }
    if (pointeursActifs.size < 2) {
      distancePincementPrecedente = null;
    }
  }
  canvas.addEventListener('pointerup', finPointeur);
  canvas.addEventListener('pointercancel', finPointeur);

  // Molette (desktop) : zoom centré sur la position du curseur
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const facteur = e.deltaY < 0 ? 1.1 : 0.9;
    zoomerCamera(facteur, e.clientX, e.clientY);
  }, { passive: false });
}

function distanceEntrePointeurs() {
  const pts = Array.from(pointeursActifs.values());
  return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
}

function centreEntrePointeurs() {
  const pts = Array.from(pointeursActifs.values());
  return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
}

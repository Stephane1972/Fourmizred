// ===========================================================
// INPUT — sélection, déplacement, caméra, aide, bouton retour Android
// ===========================================================

document.getElementById('btn-aide').addEventListener('click', () => {
  document.getElementById('panneau-aide').classList.toggle('visible');
});

// ---------------------------------------------------------
// Clavier (défilement caméra desktop)
// ---------------------------------------------------------
const touches = {};
window.addEventListener('keydown', e => touches[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => touches[e.key.toLowerCase()] = false);

// ---------------------------------------------------------
// Sélection & déplacement — unifié souris ET tactile (Pointer Events)
// ---------------------------------------------------------
let selectionEnCours = false;
let selStart = { x: 0, y: 0 };
let selEnd = { x: 0, y: 0 };
let selPointerId = null;

const activePointers = new Map();
let panMode = false;
let panStartMid = { x: 0, y: 0 };
let panStartCam = { x: 0, y: 0 };

const SEUIL_GLISSEMENT = 8;
const RAYON_TOUCHE_FOURMI = 22;
const RAYON_TOUCHE_RESSOURCE = 26;

const selInfo = document.getElementById('selection-info');

canvas.addEventListener('contextmenu', e => e.preventDefault());

function trouverFourmiSous(clientX, clientY) {
  const worldX = clientX + camX, worldY = clientY + camY;
  let plusProche = null, meilleureDist = RAYON_TOUCHE_FOURMI;
  for (const f of fourmis) {
    const d = Math.hypot(f.x - worldX, f.y - worldY);
    if (d < meilleureDist) { meilleureDist = d; plusProche = f; }
  }
  return plusProche;
}

function trouverRessourceSous(clientX, clientY) {
  const worldX = clientX + camX, worldY = clientY + camY;
  for (const r of ressources) {
    if (r.quantite <= 0) continue;
    if (Math.hypot(r.x - worldX, r.y - worldY) < RAYON_TOUCHE_RESSOURCE) return r;
  }
  return null;
}

function ordonnerAction(clientX, clientY) {
  const ressourceTouchee = trouverRessourceSous(clientX, clientY);
  const selectionnees = fourmis.filter(f => f.selectionnee);
  if (ressourceTouchee) {
    selectionnees.forEach(f => f.ordonnerRecolte(ressourceTouchee));
  } else {
    const worldX = clientX + camX, worldY = clientY + camY;
    selectionnees.forEach((f, i) => {
      const angle = (i / Math.max(1, selectionnees.length)) * Math.PI * 2;
      const rayon = selectionnees.length > 1 ? 18 : 0;
      f.ordonnerDeplacementLibre(worldX + Math.cos(angle) * rayon, worldY + Math.sin(angle) * rayon);
    });
  }
}

function majTexteSelection() {
  const n = fourmis.filter(f => f.selectionnee).length;
  document.getElementById('selection-text').textContent = n > 0 ? `${n} fourmi(s) sélectionnée(s)` : 'Aucune fourmi sélectionnée';
}

document.getElementById('btn-stop').addEventListener('click', () => {
  fourmis.forEach(f => f.selectionnee = false);
  majTexteSelection();
});

canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId);
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  // Mode placement de bâtiment actif : ce tap/clic pose le bâtiment et rien d'autre
  if (modePlacement && !(e.pointerType === 'mouse' && e.button === 2)) {
    const worldX = e.clientX + camX, worldY = e.clientY + camY;
    const pose = placerBatiment(modePlacement, worldX, worldY);
    if (pose) afficherMessage('Chambre construite');
    modePlacement = null;
    document.getElementById('btn-construire-chambre').classList.remove('actif');
    return;
  }

  // Clic droit souris = ordre de déplacement immédiat (comportement desktop classique)
  if (e.pointerType === 'mouse' && e.button === 2) {
    ordonnerAction(e.clientX, e.clientY);
    return;
  }
  if (e.pointerType === 'mouse' && e.button !== 0) return;

  if (activePointers.size === 2) {
    // Deux doigts posés : on bascule en mode défilement de la carte
    selectionEnCours = false;
    panMode = true;
    const pts = Array.from(activePointers.values());
    panStartMid = milieu(pts[0], pts[1]);
    panStartCam = { x: camX, y: camY };
    return;
  }

  if (activePointers.size === 1 && !panMode) {
    selectionEnCours = true;
    selPointerId = e.pointerId;
    selStart = { x: e.clientX, y: e.clientY };
    selEnd = { ...selStart };
  }
});

canvas.addEventListener('pointermove', e => {
  if (!activePointers.has(e.pointerId)) return;
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (panMode && activePointers.size === 2) {
    const pts = Array.from(activePointers.values());
    const mid = milieu(pts[0], pts[1]);
    camX = panStartCam.x - (mid.x - panStartMid.x);
    camY = panStartCam.y - (mid.y - panStartMid.y);
    camX = Math.max(0, Math.min(MAP_W - canvas.width, camX));
    camY = Math.max(0, Math.min(MAP_H - canvas.height, camY));
    return;
  }

  if (selectionEnCours && e.pointerId === selPointerId) {
    selEnd = { x: e.clientX, y: e.clientY };
  }
});

function finPointeur(e) {
  activePointers.delete(e.pointerId);

  if (panMode) {
    if (activePointers.size < 2) panMode = false;
    return;
  }

  if (selectionEnCours && e.pointerId === selPointerId) {
    selectionEnCours = false;
    const distanceGlissee = Math.hypot(selEnd.x - selStart.x, selEnd.y - selStart.y);

    if (distanceGlissee > SEUIL_GLISSEMENT) {
      const x1 = Math.min(selStart.x, selEnd.x) + camX;
      const x2 = Math.max(selStart.x, selEnd.x) + camX;
      const y1 = Math.min(selStart.y, selEnd.y) + camY;
      const y2 = Math.max(selStart.y, selEnd.y) + camY;
      for (const f of fourmis) {
        f.selectionnee = (f.x >= x1 && f.x <= x2 && f.y >= y1 && f.y <= y2);
      }
      majTexteSelection();
    } else {
      const fourmiTouchee = trouverFourmiSous(selStart.x, selStart.y);
      if (fourmiTouchee) {
        fourmis.forEach(f => f.selectionnee = (f === fourmiTouchee));
        majTexteSelection();
      } else if (e.pointerType !== 'mouse') {
        const dejaSelectionnees = fourmis.some(f => f.selectionnee);
        if (dejaSelectionnees) ordonnerAction(selStart.x, selStart.y);
      } else {
        fourmis.forEach(f => f.selectionnee = false);
        majTexteSelection();
      }
    }
  }
}

canvas.addEventListener('pointerup', finPointeur);
canvas.addEventListener('pointercancel', finPointeur);

// ---------------------------------------------------------
// Cycle de vie de l'app (pause en arrière-plan)
// ---------------------------------------------------------
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) dernierTemps = performance.now();
});

// ---------------------------------------------------------
// INTÉGRATION ANDROID (Capacitor) : bouton retour physique
// ---------------------------------------------------------
// Ce bloc ne fait rien dans un navigateur classique (window.Capacitor
// n'existe pas). Dans l'app Android empaquetée, le bouton retour
// physique/geste système fermerait sinon l'app instantanément sans
// prévenir — on demande une confirmation à la place.
if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
  window.Capacitor.Plugins.App.addListener('backButton', () => {
    if (confirm('Quitter Fourmizred ?')) {
      window.Capacitor.Plugins.App.exitApp();
    }
  });
}

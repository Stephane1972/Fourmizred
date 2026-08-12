// ===========================================================
// RENDERER — dessine la scène en fonction de l'état de la caméra.
// À cette vague : un sol uni + une grille de repérage + les limites
// de la carte, pour valider visuellement que déplacement et zoom
// fonctionnent. Les bâtiments/unités/effets viendront aux prochaines
// vagues, une fois buildings.js/units.js/combat.js en place.
// ===========================================================

const TAILLE_CASE_GRILLE = 100;

function rendreScene() {
  ctx.fillStyle = '#16110a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(etat.camera.zoom, etat.camera.zoom);
  ctx.translate(-etat.camera.x, -etat.camera.y);

  // Sol de la carte
  ctx.fillStyle = PALETTE.sol;
  ctx.fillRect(0, 0, etat.carte.largeur, etat.carte.hauteur);

  // Grille de repérage (une ligne tous les TAILLE_CASE_GRILLE)
  ctx.strokeStyle = 'rgba(58,40,24,0.15)';
  ctx.lineWidth = 1 / etat.camera.zoom;
  for (let x = 0; x <= etat.carte.largeur; x += TAILLE_CASE_GRILLE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, etat.carte.hauteur);
    ctx.stroke();
  }
  for (let y = 0; y <= etat.carte.hauteur; y += TAILLE_CASE_GRILLE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(etat.carte.largeur, y);
    ctx.stroke();
  }

  // Bordure nette des limites de la carte
  ctx.strokeStyle = 'rgba(58,40,24,0.5)';
  ctx.lineWidth = 4 / etat.camera.zoom;
  ctx.strokeRect(0, 0, etat.carte.largeur, etat.carte.hauteur);

  // Repère central, pour se situer pendant les tests
  ctx.fillStyle = 'rgba(58,40,24,0.4)';
  ctx.beginPath();
  ctx.arc(etat.carte.largeur / 2, etat.carte.hauteur / 2, 14 / etat.camera.zoom, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  dessinerSurcoucheDebug();
}

// Petit panneau de diagnostic (position/zoom caméra), utile pendant
// le développement — sera retiré ou caché derrière une option une
// fois l'interface de jeu réelle (ui.js) en place.
function dessinerSurcoucheDebug() {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(8, canvas.height - 44, 230, 36);
  ctx.fillStyle = '#f0e0c0';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(
    `caméra x:${Math.round(etat.camera.x)} y:${Math.round(etat.camera.y)} zoom:${etat.camera.zoom.toFixed(2)}`,
    16, canvas.height - 22
  );
}

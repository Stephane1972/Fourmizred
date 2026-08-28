// ===========================================================
// OBSTACLES — rochers physiques qui bloquent réellement le passage,
// contrairement aux cailloux/touffes d'herbe du terrain (renderer.js),
// purement décoratifs. Point 7 du rapport d'audit : différé tant
// qu'aucun obstacle n'existait, ce module en introduit — donc un
// vrai évitement devient nécessaire, implémenté ici en déviation
// locale (tangente autour du rocher qui gêne), pas un pathfinding en
// grille complet : largement suffisant pour quelques rochers épars
// sur une carte de cette taille, et infiniment plus léger à calculer
// sur un téléphone d'entrée de gamme qu'un vrai A*.
//
// Contrairement au terrain décoratif ("purement décoratif, régénéré
// à chaque lancement"), les rochers sont persistés en sauvegarde
// (storage.js) au même titre que les nœuds de ressource : au chargement
// d'une partie, une unité ne doit jamais se retrouver à l'intérieur
// d'un rocher qui n'existait pas la fois précédente.
// ===========================================================

const rochers = [];

function genererObstacles() {
  rochers.length = 0;
  const { largeur, hauteur } = etat.carte;
  const nombre = Math.round(10 * (largeur * hauteur) / (3000 * 2000));

  let tentatives = 0;
  while (rochers.length < nombre && tentatives < nombre * 25) {
    tentatives++;
    const x = nombreAleatoire(150, largeur - 150);
    const y = nombreAleatoire(150, hauteur - 150);
    const rayon = nombreAleatoire(35, 65);

    // Jamais collé à la fourmilière, à la colonie rivale, à un autre
    // rocher, à un nœud de ressource ou à un bâtiment déjà posé — les
    // rochers sont générés en dernier dans l'ordre de démarrage
    // (storage.js/missions.js/ui.js), précisément pour pouvoir vérifier
    // contre tout ce qui existe déjà plutôt que l'inverse.
    if (distance(x, y, fourmiliere.x, fourmiliere.y) < 260) continue;
    if (distance(x, y, nidEnnemi.x, nidEnnemi.y) < 260) continue;
    if (rochers.some((r) => distance(x, y, r.x, r.y) < rayon + r.rayon + 140)) continue;
    if (noeudsRessource.some((n) => distance(x, y, n.x, n.y) < rayon + 60)) continue;
    if (etat.batiments.some((b) => distance(x, y, b.x, b.y) < rayon + 90)) continue;

    rochers.push({ x, y, rayon });
  }
}

// ---------------------------------------------------------
// ÉVITEMENT — calcule l'angle à suivre depuis (x,y) vers
// (cibleX,cibleY), dévié en tangente si un rocher coupe ce segment
// dans les `lookahead` unités qui viennent. Ne regarde jamais plus
// loin que nécessaire pour le pas de cette frame : pas de recherche
// de chemin globale, juste "y a-t-il un caillou juste devant moi ?".
// ---------------------------------------------------------
function angleEvitement(x, y, cibleX, cibleY, lookahead) {
  const angleDirect = Math.atan2(cibleY - y, cibleX - x);
  const dx = cibleX - x, dy = cibleY - y;
  const longueurSegment = Math.hypot(dx, dy);
  if (longueurSegment < 1) return angleDirect;

  const ux = dx / longueurSegment, uy = dy / longueurSegment;
  const porteeVerif = Math.min(longueurSegment, lookahead);

  for (const r of rochers) {
    const versRocherX = r.x - x, versRocherY = r.y - y;
    const t = versRocherX * ux + versRocherY * uy;
    if (t < 0 || t > porteeVerif) continue;

    const px = x + ux * t, py = y + uy * t;
    const dPerp = distance(px, py, r.x, r.y);
    const marge = r.rayon + 16;
    if (dPerp < marge) {
      // Dévie du côté opposé à celui où se trouve le rocher par
      // rapport à la trajectoire (produit vectoriel signé).
      const cross = ux * versRocherY - uy * versRocherX;
      const cote = cross >= 0 ? -1 : 1;
      return angleDirect + cote * 0.95;
    }
  }
  return angleDirect;
}

// Avance un objet {x,y} vers une cible d'un pas (vitesse*delta),
// contournant les rochers sur le trajet — remplace le calcul manuel
// "angle = atan2(...)" jusqu'ici dupliqué dans resources.js, combat.js
// et colonies.js. Retourne la distance restante AVANT ce déplacement,
// pratique pour les appelants qui testent l'arrivée juste après.
function avancerVers(objet, cibleX, cibleY, vitesse, delta, distanceArret) {
  const marge = distanceArret || 0;
  const d = distance(objet.x, objet.y, cibleX, cibleY);
  if (d <= marge) return d;

  const angle = angleEvitement(objet.x, objet.y, cibleX, cibleY, vitesse * delta + 30);
  const pas = Math.min(vitesse * delta, d - marge + 1);
  objet.x += Math.cos(angle) * pas;
  objet.y += Math.sin(angle) * pas;
  return d;
}

// ---------------------------------------------------------
// RENDU — rochers gris, avec la même ombre portée partagée que les
// structures (voir renderer.js → activerOmbrePortee).
// ---------------------------------------------------------
function dessinerObstacles(ctx) {
  const zone = zoneVisibleMonde(80);
  for (const r of rochers) {
    if (r.x + r.rayon < zone.x1 || r.x - r.rayon > zone.x2 ||
        r.y + r.rayon < zone.y1 || r.y - r.rayon > zone.y2) continue;

    const degrade = ctx.createRadialGradient(r.x - r.rayon * 0.3, r.y - r.rayon * 0.3, r.rayon * 0.1, r.x, r.y, r.rayon);
    degrade.addColorStop(0, '#8a8478');
    degrade.addColorStop(1, '#4a463e');
    ctx.fillStyle = degrade;
    activerOmbrePortee(10, 4);
    ctx.beginPath();
    ctx.ellipse(r.x, r.y, r.rayon, r.rayon * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    desactiverOmbrePortee();
    ctx.strokeStyle = '#2a2820';
    ctx.lineWidth = 2 / etat.camera.zoom;
    ctx.stroke();
  }
}

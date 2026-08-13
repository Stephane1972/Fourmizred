// ===========================================================
// RENDERER — génère et dessine la scène : terrain, fourmilière,
// retours tactiles. Piloté par la caméra (camera.js) et le temps
// (main.js). Les bâtiments/unités/effets de combat viendront aux
// prochaines vagues (buildings.js, units.js, combat.js).
// ===========================================================

// ---------------------------------------------------------
// TERRAIN — généré une seule fois au chargement, sur toute la carte.
// Le rendu, lui, ne dessine que ce qui est visible (voir rendreScene).
// ---------------------------------------------------------
const tachesTerrain = [];
const caillouxTerrain = [];
const brindillesTerrain = [];

function genererTerrain() {
  const { largeur, hauteur } = etat.carte;

  // Deux couches de taches de sol : une large et douce, une petite
  // et plus contrastée par-dessus, pour un effet de profondeur.
  const densite = (largeur * hauteur) / (3000 * 2000); // adapte la quantité à la taille réelle de la carte
  for (let i = 0; i < 55 * densite; i++) {
    tachesTerrain.push({
      x: Math.random() * largeur,
      y: Math.random() * hauteur,
      rayon: 35 + Math.random() * 70,
      couleur: Math.random() > 0.5 ? '#c9ab7c' : '#e0c69a',
      opacite: 0.35 + Math.random() * 0.25
    });
  }
  for (let i = 0; i < 90 * densite; i++) {
    tachesTerrain.push({
      x: Math.random() * largeur,
      y: Math.random() * hauteur,
      rayon: 8 + Math.random() * 22,
      couleur: Math.random() > 0.5 ? '#b89568' : '#ecd7ab',
      opacite: 0.5 + Math.random() * 0.3
    });
  }

  for (let i = 0; i < 140 * densite; i++) {
    caillouxTerrain.push({
      x: Math.random() * largeur,
      y: Math.random() * hauteur,
      rayon: 1.5 + Math.random() * 2.5,
      couleur: Math.random() > 0.5 ? '#8a7355' : '#a89070'
    });
  }

  for (let i = 0; i < 200 * densite; i++) {
    brindillesTerrain.push({
      x: Math.random() * largeur,
      y: Math.random() * hauteur,
      hauteur: 4 + Math.random() * 5,
      angle: nombreAleatoire(-0.5, 0.5)
    });
  }
}

// ---------------------------------------------------------
// FOURMILIÈRE — cœur de la colonie, au centre de la carte.
// Purement visuelle à ce stade ; deviendra un vrai bâtiment
// interactif (production, PV...) avec buildings.js.
// ---------------------------------------------------------
const fourmiliere = {
  x: etat.carte.largeur / 2,
  y: etat.carte.hauteur / 2,
  rayon: 70
};

function dessinerFourmiliere(ctx, temps) {
  const { x, y, rayon } = fourmiliere;

  // Chemin de terre battue tout autour, façon zone piétinée
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#b89568';
  ctx.beginPath();
  ctx.ellipse(x, y, rayon * 1.7, rayon * 1.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Légère respiration animée (démontre le système de temps : la
  // fourmilière "vit" même sans aucune unité ni bâtiment encore actifs)
  const respiration = Math.sin(temps.total * 1.2) * 3;

  const degrade = ctx.createRadialGradient(x - 15, y - 12, 4, x, y, rayon + respiration);
  degrade.addColorStop(0, ajusterCouleur('#3a2818', 35));
  degrade.addColorStop(1, '#3a2818');
  ctx.fillStyle = degrade;
  ctx.beginPath();
  ctx.ellipse(x, y, rayon + respiration, (rayon + respiration) * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#241a10';
  ctx.lineWidth = 3 / etat.camera.zoom;
  ctx.stroke();

  ctx.fillStyle = '#f0e0c0';
  ctx.font = `${14 / etat.camera.zoom}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('Fourmilière', x, y - rayon - 14 / etat.camera.zoom);
}

// ---------------------------------------------------------
// TEXTES FLOTTANTS — retour visuel de collecte ("+20" qui monte et
// s'estompe). Réutilisable par n'importe quel système du jeu.
// ---------------------------------------------------------
const textesFlottants = [];
const DUREE_TEXTE_FLOTTANT = 0.9; // secondes

function ajouterTexteFlottant(x, y, texte, couleur) {
  textesFlottants.push({ x, y, texte, couleur, age: 0 });
}

function mettreAJourEtDessinerTextesFlottants(ctx, delta) {
  for (let i = textesFlottants.length - 1; i >= 0; i--) {
    const t = textesFlottants[i];
    t.age += delta;
    if (t.age >= DUREE_TEXTE_FLOTTANT) { textesFlottants.splice(i, 1); continue; }
    const progression = t.age / DUREE_TEXTE_FLOTTANT;
    ctx.globalAlpha = 1 - progression;
    ctx.fillStyle = t.couleur;
    ctx.font = `bold ${13 / etat.camera.zoom}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(t.texte, t.x, t.y - progression * 20 / etat.camera.zoom);
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------
// RETOURS TACTILES — petit anneau qui s'estompe à l'endroit touché,
// pour donner un repère visuel immédiat sur écran tactile.
// ---------------------------------------------------------
const retoursTactiles = [];
const DUREE_RETOUR_TACTILE = 0.4; // secondes

function ajouterRetourTactile(x, y) {
  retoursTactiles.push({ x, y, age: 0 });
}

function mettreAJourEtDessinerRetoursTactiles(ctx, delta) {
  for (let i = retoursTactiles.length - 1; i >= 0; i--) {
    const r = retoursTactiles[i];
    r.age += delta;
    if (r.age >= DUREE_RETOUR_TACTILE) { retoursTactiles.splice(i, 1); continue; }
    const t = r.age / DUREE_RETOUR_TACTILE;
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = '#ffd27a';
    ctx.lineWidth = 2 / etat.camera.zoom;
    ctx.beginPath();
    ctx.arc(r.x, r.y, (6 + t * 18) / etat.camera.zoom, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------
// RENDU PRINCIPAL — appelé chaque frame par la boucle de jeu (main.js)
// ---------------------------------------------------------
function rendreScene(temps) {
  ctx.fillStyle = '#16110a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(etat.camera.zoom, etat.camera.zoom);
  ctx.translate(-etat.camera.x, -etat.camera.y);

  // Sol de base
  ctx.fillStyle = PALETTE.sol;
  ctx.fillRect(0, 0, etat.carte.largeur, etat.carte.hauteur);

  // Zone visible (+ marge) : tout ce qui est en dehors n'est pas dessiné
  const zone = zoneVisibleMonde(100);

  for (const t of tachesTerrain) {
    if (t.x + t.rayon < zone.x1 || t.x - t.rayon > zone.x2 ||
        t.y + t.rayon < zone.y1 || t.y - t.rayon > zone.y2) continue;
    ctx.globalAlpha = t.opacite;
    ctx.fillStyle = t.couleur;
    ctx.beginPath();
    ctx.ellipse(t.x, t.y, t.rayon, t.rayon * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const c of caillouxTerrain) {
    if (c.x < zone.x1 || c.x > zone.x2 || c.y < zone.y1 || c.y > zone.y2) continue;
    ctx.fillStyle = c.couleur;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.rayon, c.rayon * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(90,110,50,0.5)';
  ctx.lineWidth = 1 / etat.camera.zoom;
  for (const b of brindillesTerrain) {
    if (b.x < zone.x1 || b.x > zone.x2 || b.y < zone.y1 || b.y > zone.y2) continue;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x + Math.sin(b.angle) * 3, b.y - b.hauteur);
    ctx.stroke();
  }

  // Bordure nette des limites de la carte
  ctx.strokeStyle = 'rgba(58,40,24,0.5)';
  ctx.lineWidth = 4 / etat.camera.zoom;
  ctx.strokeRect(0, 0, etat.carte.largeur, etat.carte.hauteur);

  for (const noeud of noeudsRessource) {
    if (noeud.x < zone.x1 || noeud.x > zone.x2 || noeud.y < zone.y1 || noeud.y > zone.y2) continue;
    dessinerNoeudRessource(ctx, noeud);
  }

  dessinerFourmiliere(ctx, temps);
  mettreAJourEtDessinerTextesFlottants(ctx, temps.delta);
  mettreAJourEtDessinerRetoursTactiles(ctx, temps.delta);

  ctx.restore();

  dessinerSurcoucheDebug(temps);
}

// Petit panneau de diagnostic, utile pendant le développement — sera
// caché derrière une option une fois l'interface réelle (ui.js) en place.
function dessinerSurcoucheDebug(temps) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(8, canvas.height - 66, 300, 58);
  ctx.fillStyle = '#f0e0c0';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(
    `cam x:${Math.round(etat.camera.x)} y:${Math.round(etat.camera.y)} zoom:${etat.camera.zoom.toFixed(2)} · t:${temps.total.toFixed(1)}s`,
    16, canvas.height - 44
  );
  // Stock de ressources — provisoire, remplacé par une vraie barre
  // d'interface (ui.js) à une prochaine vague.
  const r = etat.ressources;
  ctx.fillText(
    `🌾${formaterNombre(r.nourriture)}  💧${formaterNombre(r.eau)}  🪵${formaterNombre(r.materiaux)}  👥${r.population}/${r.populationMax}`,
    16, canvas.height - 22
  );
}

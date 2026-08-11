// ===========================================================
// TERRAIN — génération du sol, des nids et des ressources,
// et fonction de rendu principale de la carte.
// ===========================================================

// Taches de terrain, en deux couches pour un effet de profondeur
// (une couche de base large et douce, une couche de détail plus petite
// et plus contrastée par-dessus).
const tachesTerrain = [];
for (let i = 0; i < 55; i++) {
  tachesTerrain.push({
    x: Math.random() * MAP_W,
    y: Math.random() * MAP_H,
    r: 35 + Math.random() * 70,
    c: Math.random() > 0.5 ? '#c9ab7c' : '#e0c69a',
    opacite: 0.35 + Math.random() * 0.25
  });
}
for (let i = 0; i < 90; i++) {
  tachesTerrain.push({
    x: Math.random() * MAP_W,
    y: Math.random() * MAP_H,
    r: 8 + Math.random() * 22,
    c: Math.random() > 0.5 ? '#b89568' : '#ecd7ab',
    opacite: 0.5 + Math.random() * 0.3
  });
}

// Petits cailloux épars, purement décoratifs
const cailloux = [];
for (let i = 0; i < 140; i++) {
  cailloux.push({
    x: Math.random() * MAP_W,
    y: Math.random() * MAP_H,
    r: 1.5 + Math.random() * 2.5,
    teinte: Math.random() > 0.5 ? '#8a7355' : '#a89070'
  });
}

// Brins d'herbe épars, pour casser la monotonie du sol
const brindilles = [];
for (let i = 0; i < 200; i++) {
  brindilles.push({
    x: Math.random() * MAP_W,
    y: Math.random() * MAP_H,
    hauteur: 4 + Math.random() * 5,
    angle: nombreAleatoire(-0.5, 0.5)
  });
}

// Ressources de nourriture : petits amas de champignons, en quantité finie
const ressources = [];
for (let i = 0; i < 8; i++) {
  const nbChampignons = 2 + Math.floor(Math.random() * 3);
  const champignons = [];
  for (let c = 0; c < nbChampignons; c++) {
    champignons.push({
      dx: nombreAleatoire(-9, 9),
      dy: nombreAleatoire(-6, 6),
      taille: nombreAleatoire(0.7, 1.15)
    });
  }
  ressources.push({
    x: 200 + Math.random() * (MAP_W - 400),
    y: 200 + Math.random() * (MAP_H - 400),
    quantite: 300,
    quantiteInitiale: 300,
    champignons
  });
}

// Le nid de départ (joueur) et le nid ennemi
const nid = { x: MAP_W / 2, y: MAP_H / 2 };
reveler(nid.x, nid.y, 350);
const nidEnnemi = { x: MAP_W - 350, y: MAP_H - 300 };

// ---------------------------------------------------------
// Dessine un amas de champignons (une ressource de nourriture)
// ---------------------------------------------------------
function dessinerRessource(ctx, r, sx, sy) {
  const echelleGlobale = 0.4 + 0.6 * (r.quantite / r.quantiteInitiale);
  for (const ch of r.champignons) {
    const cx = sx + ch.dx * echelleGlobale;
    const cy = sy + ch.dy * echelleGlobale;
    const t = ch.taille * echelleGlobale * 9;

    // Ombre portée légère
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + t * 0.5, t * 0.6, t * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pied
    ctx.fillStyle = '#e8dcc0';
    ctx.fillRect(cx - t * 0.12, cy - t * 0.1, t * 0.24, t * 0.6);

    // Chapeau
    ctx.fillStyle = '#7ab255';
    ctx.beginPath();
    ctx.ellipse(cx, cy - t * 0.15, t * 0.6, t * 0.4, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#5a8a3a';
    ctx.beginPath();
    ctx.ellipse(cx - t * 0.15, cy - t * 0.25, t * 0.22, t * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------------------------------------------------------
// Dessine un nid (joueur ou ennemi) avec un dégradé simple pour le relief
// ---------------------------------------------------------
function dessinerNid(ctx, nx, ny, couleurBase, couleurBord, couleurTexte, label) {
  const degrade = ctx.createRadialGradient(nx - 12, ny - 10, 4, nx, ny, 48);
  degrade.addColorStop(0, ajusterCouleur(couleurBase, 35));
  degrade.addColorStop(1, couleurBase);
  ctx.fillStyle = degrade;
  ctx.beginPath();
  ctx.ellipse(nx, ny, 45, 35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = couleurBord;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = couleurTexte;
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(label, nx, ny - 45);
}

// ---------------------------------------------------------
// Rendu complet du terrain visible à l'écran
// ---------------------------------------------------------
function dessinerTerrain(ctx) {
  ctx.fillStyle = '#d9c199';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const t of tachesTerrain) {
    const sx = t.x - camX, sy = t.y - camY;
    if (sx < -100 || sx > canvas.width + 100 || sy < -100 || sy > canvas.height + 100) continue;
    ctx.globalAlpha = t.opacite;
    ctx.fillStyle = t.c;
    ctx.beginPath();
    ctx.ellipse(sx, sy, t.r, t.r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Chemin de terre battue autour du nid (piétiné par la colonie)
  const nx0 = nid.x - camX, ny0 = nid.y - camY;
  if (nx0 > -140 && nx0 < canvas.width + 140 && ny0 > -140 && ny0 < canvas.height + 140) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#b89568';
    ctx.beginPath();
    ctx.ellipse(nx0, ny0, 110, 85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  for (const c of cailloux) {
    const sx = c.x - camX, sy = c.y - camY;
    if (sx < -10 || sx > canvas.width + 10 || sy < -10 || sy > canvas.height + 10) continue;
    ctx.fillStyle = c.teinte;
    ctx.beginPath();
    ctx.ellipse(sx, sy, c.r, c.r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(90,110,50,0.5)';
  ctx.lineWidth = 1;
  for (const b of brindilles) {
    const sx = b.x - camX, sy = b.y - camY;
    if (sx < -10 || sx > canvas.width + 10 || sy < -10 || sy > canvas.height + 10) continue;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.sin(b.angle) * 3, sy - b.hauteur);
    ctx.stroke();
  }

  dessinerNid(ctx, nx0, ny0, '#3a2818', '#241a10', '#f0e0c0', 'Nid');

  const enx = nidEnnemi.x - camX, eny = nidEnnemi.y - camY;
  if (enx > -60 && enx < canvas.width + 60 && eny > -60 && eny < canvas.height + 60) {
    dessinerNid(ctx, enx, eny, '#3a1414', '#1a0808', '#f0c0c0', 'Nid ennemi');
  }

  // Bâtiments construits
  for (const b of batiments) {
    const def = TYPES_BATIMENT[b.type];
    const bx = b.x - camX, by = b.y - camY;
    if (bx < -60 || bx > canvas.width + 60 || by < -60 || by > canvas.height + 60) continue;
    const degrade = ctx.createRadialGradient(bx - 8, by - 6, 2, bx, by, def.rayon);
    degrade.addColorStop(0, ajusterCouleur(def.couleur, 30));
    degrade.addColorStop(1, def.couleur);
    ctx.fillStyle = degrade;
    ctx.beginPath();
    ctx.ellipse(bx, by, def.rayon, def.rayon * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#241a10';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#f0e0c0';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(def.label, bx, by - def.rayon - 6);
    const progression = 1 - (b.minuteurProduction / def.delaiProduction);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(bx - 18, by + def.rayon + 4, 36, 4);
    ctx.fillStyle = '#3ae03a';
    ctx.fillRect(bx - 18, by + def.rayon + 4, 36 * progression, 4);
  }

  // Ressources (amas de champignons)
  for (const r of ressources) {
    if (r.quantite <= 0) continue;
    const sx = r.x - camX, sy = r.y - camY;
    if (sx < -40 || sx > canvas.width + 40 || sy < -40 || sy > canvas.height + 40) continue;
    dessinerRessource(ctx, r, sx, sy);
  }
}

// ===========================================================
// RESOURCES — nœuds de ressources récoltables posés sur la carte
// (nourriture, eau, matériaux). Les phéromones et la population ne
// sont pas des nœuds sur la carte : elles vivent uniquement dans
// `etat.ressources` (voir state.js) et seront gérées par
// buildings.js / units.js aux prochaines vagues.
//
// À cette vague, les nœuds sont uniquement posés et affichés — la
// récolte réelle (une unité qui vient prélever dedans) arrivera avec
// units.js.
// ===========================================================

const TYPES_RESSOURCE = {
  nourriture: {
    label: 'Graines',
    quantiteBase: 300,
    couleurPrincipale: '#c9a227',
    couleurAccent: '#8a6a15'
  },
  eau: {
    label: 'Point d\'eau',
    quantiteBase: 500,
    couleurPrincipale: '#3a7ca8',
    couleurAccent: '#1f4a63'
  },
  materiaux: {
    label: 'Brindilles',
    quantiteBase: 250,
    couleurPrincipale: '#8a6a45',
    couleurAccent: '#5a4428'
  }
};

const noeudsRessource = [];

// Distance minimale à respecter par rapport à la fourmilière, pour ne
// pas faire apparaître un nœud directement dessus.
const DISTANCE_MIN_FOURMILIERE = 220;

function genererRessources() {
  const { largeur, hauteur } = etat.carte;
  const densite = (largeur * hauteur) / (3000 * 2000);

  ajouterNoeuds('nourriture', Math.round(10 * densite));
  ajouterNoeuds('eau', Math.round(5 * densite));
  ajouterNoeuds('materiaux', Math.round(8 * densite));
}

function ajouterNoeuds(type, quantite) {
  const def = TYPES_RESSOURCE[type];
  for (let i = 0; i < quantite; i++) {
    let x, y, essais = 0;
    do {
      x = 150 + Math.random() * (etat.carte.largeur - 300);
      y = 150 + Math.random() * (etat.carte.hauteur - 300);
      essais++;
    } while (distance(x, y, fourmiliere.x, fourmiliere.y) < DISTANCE_MIN_FOURMILIERE && essais < 20);

    noeudsRessource.push({
      type,
      x, y,
      quantite: def.quantiteBase,
      quantiteInitiale: def.quantiteBase,
      // Petite variation visuelle par nœud, pour que deux nœuds du
      // même type ne soient jamais parfaitement identiques à l'écran
      variationTaille: nombreAleatoire(0.85, 1.2),
      angleVariation: nombreAleatoire(0, Math.PI * 2)
    });
  }
}

// ---------------------------------------------------------
// RENDU d'un nœud de ressource — appelé par renderer.js
// ---------------------------------------------------------
function dessinerNoeudRessource(ctx, noeud) {
  if (noeud.quantite <= 0) return;
  const def = TYPES_RESSOURCE[noeud.type];
  const echelle = (0.4 + 0.6 * (noeud.quantite / noeud.quantiteInitiale)) * noeud.variationTaille;

  if (noeud.type === 'eau') {
    ctx.fillStyle = def.couleurAccent;
    ctx.beginPath();
    ctx.ellipse(noeud.x, noeud.y, 22 * echelle, 15 * echelle, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = def.couleurPrincipale;
    ctx.beginPath();
    ctx.ellipse(noeud.x, noeud.y, 18 * echelle, 12 * echelle, 0, 0, Math.PI * 2);
    ctx.fill();
    // Reflet
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(noeud.x - 5 * echelle, noeud.y - 4 * echelle, 5 * echelle, 2.5 * echelle, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (noeud.type === 'materiaux') {
    ctx.strokeStyle = def.couleurPrincipale;
    ctx.lineWidth = 2.5 * echelle;
    for (let i = 0; i < 4; i++) {
      const a = noeud.angleVariation + i * 0.7;
      const long = 12 * echelle;
      ctx.beginPath();
      ctx.moveTo(noeud.x - Math.cos(a) * long, noeud.y - Math.sin(a) * long * 0.5);
      ctx.lineTo(noeud.x + Math.cos(a) * long, noeud.y + Math.sin(a) * long * 0.5);
      ctx.stroke();
    }
    return;
  }

  // Nourriture : petit amas de graines
  ctx.fillStyle = def.couleurAccent;
  ctx.beginPath();
  ctx.ellipse(noeud.x, noeud.y + 2 * echelle, 16 * echelle, 8 * echelle, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = def.couleurPrincipale;
  const positions = [[-6, -2], [0, -5], [6, -2], [-3, 1], [3, 1]];
  for (const [dx, dy] of positions) {
    ctx.beginPath();
    ctx.ellipse(noeud.x + dx * echelle, noeud.y + dy * echelle, 4 * echelle, 3 * echelle, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

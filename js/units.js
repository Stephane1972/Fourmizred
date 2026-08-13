// ===========================================================
// UNITS — définition des types d'unités et de leurs statistiques,
// et gestion des instances vivantes (etat.unites, voir state.js).
//
// À cette vague : uniquement la PRODUCTION. Les unités produites
// apparaissent près de leur bâtiment et y restent (légère animation
// de repos). Le déplacement, la sélection et les ordres viendront à
// une prochaine vague (probablement un input.js étendu + un vrai
// système de commande).
// ===========================================================

const TYPES_UNITE = {
  ouvriere: {
    label: 'Ouvrière',
    cout: { nourriture: 30 },
    tempsProduction: 8,
    pv: 40,
    vitesse: 60,
    capacite: 'Peut collecter les ressources de la carte',
    couleur: '#8a6a45'
  },
  nourrice: {
    label: 'Nourrice',
    cout: { nourriture: 25, eau: 10 },
    tempsProduction: 10,
    pv: 30,
    vitesse: 45,
    capacite: 'Accélère la croissance des larves à proximité',
    couleur: '#c9a8d8'
  },
  eclaireuse: {
    label: 'Éclaireuse',
    cout: { nourriture: 20 },
    tempsProduction: 6,
    pv: 25,
    vitesse: 110,
    capacite: 'Grand rayon de vision, repère les menaces au loin',
    couleur: '#e0c69a'
  },
  fourmiRouge: {
    label: 'Fourmi rouge',
    cout: { nourriture: 40, materiaux: 15 },
    tempsProduction: 14,
    pv: 70,
    vitesse: 55,
    capacite: 'Morsure acide, dégâts bonus contre unités légères',
    couleur: '#c0402a'
  },
  fourmiCharpentiere: {
    label: 'Fourmi charpentière',
    cout: { nourriture: 35, materiaux: 30 },
    tempsProduction: 16,
    pv: 90,
    vitesse: 50,
    capacite: 'Mandibules puissantes, dégâts bonus contre bâtiments',
    couleur: '#5a3820'
  }
};

let prochainIdUnite = 1;

// Crée une instance d'unité à la sortie d'un bâtiment de production.
// Appelée par buildings.js quand une production arrive à son terme.
function creerUnite(typeUnite, batiment) {
  const def = TYPES_UNITE[typeUnite];
  const defBatiment = TYPES_BATIMENT_PRODUCTION[batiment.type];
  const angle = Math.random() * Math.PI * 2;
  const rayonSortie = defBatiment.rayon + 18;

  etat.unites.push({
    id: prochainIdUnite++,
    type: typeUnite,
    x: batiment.x + Math.cos(angle) * rayonSortie,
    y: batiment.y + Math.sin(angle) * rayonSortie,
    pv: def.pv,
    pvMax: def.pv,
    vitesse: def.vitesse,
    faction: 'joueur',
    phaseIdle: Math.random() * Math.PI * 2
  });
}

// ---------------------------------------------------------
// RENDU — simple mais distinct par type (couleur propre à chaque
// unité). Un vrai modèle détaillé pourra remplacer ceci plus tard.
// ---------------------------------------------------------
function dessinerUnite(ctx, u, temps) {
  const def = TYPES_UNITE[u.type];
  if (!def) return;
  const respiration = Math.sin(temps.total * 2 + u.phaseIdle) * 1.4;

  ctx.save();
  ctx.translate(u.x, u.y + respiration);

  // Ombre
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(1, 2, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Abdomen
  ctx.fillStyle = def.couleur;
  ctx.beginPath();
  ctx.ellipse(-2, 0, 6, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tête
  ctx.fillStyle = ajusterCouleur(def.couleur, -30);
  ctx.beginPath();
  ctx.ellipse(6, 0, 3.2, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Barre de vie, seulement si l'unité a déjà été blessée
  if (u.pv < u.pvMax) {
    const largeur = 16;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(u.x - largeur / 2, u.y - 14, largeur, 3);
    ctx.fillStyle = u.pv / u.pvMax > 0.3 ? '#3ae03a' : '#e0503c';
    ctx.fillRect(u.x - largeur / 2, u.y - 14, largeur * (u.pv / u.pvMax), 3);
  }
}

function dessinerUnites(ctx, temps) {
  const zone = zoneVisibleMonde(40);
  for (const u of etat.unites) {
    if (u.x < zone.x1 || u.x > zone.x2 || u.y < zone.y1 || u.y > zone.y2) continue;
    dessinerUnite(ctx, u, temps);
  }
}

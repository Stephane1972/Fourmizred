// ===========================================================
// UNITS — définition des types d'unités et de leurs statistiques,
// et gestion des instances vivantes (etat.unites, voir state.js).
//
// Le combat (dégâts, portée, sélection, ordres) vit dans combat.js,
// qui s'appuie sur les statistiques définies ici.
// ===========================================================

const TYPES_UNITE = {
  ouvriere: {
    label: 'Ouvrière',
    cout: { nourriture: 30 },
    tempsProduction: 8,
    pv: 40,
    vitesse: 60,
    degats: 2,
    portee: 14,
    cadenceAttaque: 1.5,
    capaciteTransport: 20,
    capacite: 'Peut collecter les ressources de la carte',
    couleur: '#8a6a45'
  },
  nourrice: {
    label: 'Nourrice',
    cout: { nourriture: 25, eau: 10 },
    tempsProduction: 10,
    pv: 30,
    vitesse: 45,
    degats: 1,
    portee: 14,
    cadenceAttaque: 1.8,
    capaciteTransport: 8,
    capacite: 'Accélère la croissance des larves à proximité',
    couleur: '#c9a8d8'
  },
  eclaireuse: {
    label: 'Éclaireuse',
    cout: { nourriture: 20 },
    tempsProduction: 6,
    pv: 25,
    vitesse: 110,
    degats: 3,
    portee: 16,
    cadenceAttaque: 1.2,
    capaciteTransport: 0,
    capacite: 'Grand rayon de vision, repère les menaces au loin',
    couleur: '#e0c69a'
  },
  fourmiRouge: {
    label: 'Fourmi rouge',
    cout: { nourriture: 40, materiaux: 15 },
    tempsProduction: 14,
    pv: 70,
    vitesse: 55,
    degats: 12,
    portee: 18,
    cadenceAttaque: 0.9,
    capaciteTransport: 0,
    capacite: 'Morsure acide, dégâts bonus contre unités légères',
    couleur: '#c0402a'
  },
  fourmiCharpentiere: {
    label: 'Fourmi charpentière',
    cout: { nourriture: 35, materiaux: 30 },
    tempsProduction: 16,
    pv: 90,
    vitesse: 50,
    degats: 16,
    portee: 20,
    cadenceAttaque: 1.0,
    capaciteTransport: 0,
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

  etat.unites.push(creerInstanceUnite(
    typeUnite,
    batiment.x + Math.cos(angle) * rayonSortie,
    batiment.y + Math.sin(angle) * rayonSortie,
    'joueur'
  ));
}

// Fabrique brute d'une instance d'unité — utilisée à la fois par la
// production (ci-dessus) et par combat.js pour poser la colonie
// ennemie de départ.
function creerInstanceUnite(typeUnite, x, y, faction) {
  const def = TYPES_UNITE[typeUnite];
  return {
    id: prochainIdUnite++,
    type: typeUnite,
    x, y,
    pv: def.pv,
    pvMax: def.pv,
    vitesse: def.vitesse,
    faction,
    selectionnee: false,
    ordre: null,        // null | 'attaquer'  (combat.js)
    cibleId: null,       // id de l'unité ciblée par un ordre d'attaque
    cooldownAttaque: 0,
    // Récolte (voir resources.js)
    fileOrdres: [],       // [{ type: 'recolter', noeudId }]
    etatRecolte: 'idle',  // idle | versRessource | recolte | versNid | depose
    noeudCibleId: null,
    cargo: 0,
    typeCargo: null,
    minuteurRecolte: 0,
    tacheActuelle: 'Inactive',
    phaseIdle: Math.random() * Math.PI * 2
  };
}

const RAYON_TOUCHE_UNITE = 20;

// Trouve l'unité vivante la plus proche d'un point du monde, avec un
// filtre de faction optionnel. Utilisée par input.js pour la
// sélection et le ciblage.
function trouverUniteSous(mondeX, mondeY, faction) {
  let plusProche = null, meilleureDist = RAYON_TOUCHE_UNITE;
  for (const u of etat.unites) {
    if (u.pv <= 0) continue;
    if (faction && u.faction !== faction) continue;
    const d = distance(u.x, u.y, mondeX, mondeY);
    if (d < meilleureDist) { meilleureDist = d; plusProche = u; }
  }
  return plusProche;
}

// ---------------------------------------------------------
// RENDU — simple mais distinct par type (couleur propre à chaque
// unité), avec une teinte rougeâtre pour la faction ennemie afin de
// distinguer immédiatement alliés et adversaires au combat.
// ---------------------------------------------------------
function dessinerUnite(ctx, u, temps) {
  const def = TYPES_UNITE[u.type];
  if (!def) return;

  // Anneau de sélection, au sol, ne suit pas l'animation de repos
  if (u.selectionnee) {
    ctx.strokeStyle = '#3ae03a';
    ctx.lineWidth = 1.5 / etat.camera.zoom;
    ctx.beginPath();
    ctx.ellipse(u.x, u.y, 12, 8, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Tâche actuelle — affichée seulement pour l'unité sélectionnée,
    // pour ne pas encombrer l'écran quand plusieurs unités sont visibles.
    if (u.tacheActuelle) {
      ctx.fillStyle = '#f0e0c0';
      ctx.font = `${10.5 / etat.camera.zoom}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(u.tacheActuelle, u.x, u.y - 20 / etat.camera.zoom);
    }
  }

  // Cargaison transportée, visible sur toutes les unités (pas
  // seulement la sélectionnée) pour repérer d'un coup d'œil qui
  // ramène des ressources.
  if (u.cargo > 0 && u.typeCargo && TYPES_RESSOURCE[u.typeCargo]) {
    ctx.fillStyle = TYPES_RESSOURCE[u.typeCargo].couleurPrincipale;
    ctx.beginPath();
    ctx.ellipse(u.x, u.y - 12 / etat.camera.zoom, 3.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const respiration = Math.sin(temps.total * 2 + u.phaseIdle) * 1.4;
  const couleurCorps = u.faction === 'ennemi' ? ajusterCouleur('#8a2418', 0) : def.couleur;

  ctx.save();
  ctx.translate(u.x, u.y + respiration);

  // Ombre
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(1, 2, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Abdomen
  ctx.fillStyle = couleurCorps;
  ctx.beginPath();
  ctx.ellipse(-2, 0, 6, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tête
  ctx.fillStyle = ajusterCouleur(couleurCorps, -30);
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

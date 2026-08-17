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
  },

  // ---------------------------------------------------------
  // UNITÉS AVANCÉES — niveaux 3 à 5, du plus faible au plus puissant.
  // Chacune ajoute un champ `faiblesse` (nouveau) et `batimentRequis`
  // (nouveau) en plus des statistiques habituelles. `batimentRequis`
  // référence soit un bâtiment déjà construit (caserne, nurserie,
  // ecoleEclaireuses), soit "chambreSpecialistes" — un bâtiment prévu
  // au plan d'origine mais pas encore construit à ce stade : ces
  // unités-là sont donc définies mais pas encore productibles.
  // ---------------------------------------------------------

  // --- Niveau 3 ---
  fourmiTisserande: {
    label: 'Fourmi tisserande',
    cout: { nourriture: 45, materiaux: 30 },
    tempsProduction: 12,
    pv: 110,
    vitesse: 65,
    degats: 10,
    portee: 16,
    cadenceAttaque: 1.2,
    capaciteTransport: 15,
    capacite: 'Combat et récolte à la fois ; tisse de la soie pour renforcer les structures alliées (effet à venir)',
    faiblesse: 'PV modestes pour son coût, mal adaptée au combat prolongé',
    batimentRequis: 'chambreSpecialistes',
    couleur: '#3a6a4a'
  },
  fourmiLegionnaire: {
    label: 'Fourmi légionnaire',
    cout: { nourriture: 50, materiaux: 20 },
    tempsProduction: 16,
    pv: 120,
    vitesse: 60,
    degats: 16,
    portee: 20,
    cadenceAttaque: 0.9,
    capaciteTransport: 0,
    capacite: 'Discipline de formation : efficace en groupe, coordonnée au combat',
    faiblesse: 'Perd son efficacité si isolée du reste de sa colonne',
    batimentRequis: 'caserne',
    couleur: '#6a3a2a'
  },
  fourmiChimiste: {
    label: 'Fourmi chimiste',
    cout: { nourriture: 45, materiaux: 35 },
    tempsProduction: 15,
    pv: 100,
    vitesse: 55,
    degats: 24,
    portee: 24,
    cadenceAttaque: 1.4,
    capaciteTransport: 0,
    capacite: 'Projection chimique à distance, ignore une partie de la résistance adverse',
    faiblesse: 'Peu de PV et cadence de tir lente : vulnérable au corps-à-corps rapide',
    batimentRequis: 'chambreSpecialistes',
    couleur: '#8a7a2a'
  },
  fourmiVolante: {
    label: 'Fourmi volante',
    cout: { nourriture: 40 },
    tempsProduction: 10,
    pv: 90,
    vitesse: 130,
    degats: 14,
    portee: 18,
    cadenceAttaque: 1.0,
    capaciteTransport: 5,
    capacite: 'Vole directement vers sa cible, la plus rapide de toutes les unités',
    faiblesse: 'Peu de PV, cible facile pour les défenses à longue portée',
    batimentRequis: 'ecoleEclaireuses',
    couleur: '#c9c9e0',
    tailleMultiplicateur: 0.9
  },

  // --- Niveau 4 ---
  fourmiBouledogue: {
    label: 'Fourmi bouledogue',
    cout: { nourriture: 70, materiaux: 40 },
    tempsProduction: 20,
    pv: 200,
    vitesse: 50,
    degats: 28,
    portee: 16,
    cadenceAttaque: 1.0,
    capaciteTransport: 0,
    capacite: 'Morsure écrasante, parmi les plus robustes au corps-à-corps',
    faiblesse: 'Très lente, facile à contourner ou à harceler à distance',
    batimentRequis: 'caserne',
    couleur: '#4a1a1a',
    tailleMultiplicateur: 1.3
  },
  fourmiPiege: {
    label: 'Fourmi piège',
    cout: { materiaux: 60 },
    tempsProduction: 14,
    pv: 70,
    vitesse: 20,
    degats: 35,
    portee: 18,
    cadenceAttaque: 2.2,
    capaciteTransport: 0,
    capacite: 'Embuscade : dégâts d\'ouverture très élevés au premier contact',
    faiblesse: 'Très peu de PV, ne survit pas à un combat prolongé une fois repérée',
    batimentRequis: 'chambreSpecialistes',
    couleur: '#2a2418'
  },
  fourmiBalleDeFusil: {
    label: 'Fourmi balle de fusil',
    cout: { nourriture: 90, materiaux: 20 },
    tempsProduction: 22,
    pv: 170,
    vitesse: 75,
    degats: 32,
    portee: 16,
    cadenceAttaque: 1.1,
    capaciteTransport: 0,
    capacite: 'Piqûre parmi les plus douloureuses de la nature, dégâts élevés et fiables',
    faiblesse: 'Coût élevé en nourriture, longue à produire',
    batimentRequis: 'caserne',
    couleur: '#8a1a1a'
  },
  soldatGeant: {
    label: 'Soldat géant',
    cout: { nourriture: 100, materiaux: 60 },
    tempsProduction: 26,
    pv: 280,
    vitesse: 40,
    degats: 26,
    portee: 22,
    cadenceAttaque: 1.3,
    capaciteTransport: 0,
    capacite: 'Gabarit imposant, la plus grande réserve de PV de toutes les unités classiques',
    faiblesse: 'Très lent et coûteux, cible prioritaire évidente pour l\'adversaire',
    batimentRequis: 'caserne',
    couleur: '#3a2818',
    tailleMultiplicateur: 1.6
  },

  // --- Niveau 5 ---
  fourmiExplosive: {
    label: 'Fourmi explosive',
    cout: { nourriture: 60, materiaux: 80 },
    tempsProduction: 18,
    pv: 50,
    vitesse: 70,
    degats: 80,
    portee: 14,
    cadenceAttaque: 5,
    capaciteTransport: 0,
    capacite: 'Dégâts d\'un seul coup les plus élevés du jeu — l\'auto-destruction au contact n\'est pas encore codée : elle combat pour l\'instant comme une unité normale, très fragile',
    faiblesse: 'PV extrêmement faibles, meurt en un ou deux coups adverses',
    batimentRequis: 'chambreSpecialistes',
    couleur: '#c04020',
    tailleMultiplicateur: 0.85
  },
  reineGuerriere: {
    label: 'Reine guerrière',
    cout: { nourriture: 200, materiaux: 150 },
    tempsProduction: 60,
    pv: 400,
    vitesse: 35,
    degats: 35,
    portee: 24,
    cadenceAttaque: 1.0,
    capaciteTransport: 0,
    capacite: 'Unité d\'élite ultime : PV et dégâts les plus élevés du jeu',
    faiblesse: 'Coût et temps de production prohibitifs ; perte lourde de conséquence si elle tombe',
    batimentRequis: 'chambreSpecialistes',
    couleur: '#4a1a3a',
    tailleMultiplicateur: 1.9
  },

  // Menaces sauvages — ne sont produites par aucun bâtiment, seulement
  // posées sur la carte au démarrage (voir combat.js). Ne recherchent
  // pas activement à s'entretuer avec la colonie rivale : elles n'en
  // veulent qu'à vos unités et à votre fourmilière.
  araignee: {
    label: 'Araignée',
    cout: {},
    tempsProduction: 0,
    pv: 150,
    vitesse: 35,
    degats: 20,
    portee: 20,
    cadenceAttaque: 1.3,
    capaciteTransport: 0,
    capacite: 'Morsure venimeuse redoutable, attaque quiconque approche',
    couleur: '#3a1f4a',
    tailleMultiplicateur: 1.8
  },
  scarabee: {
    label: 'Scarabée',
    cout: {},
    tempsProduction: 0,
    pv: 80,
    vitesse: 45,
    degats: 10,
    portee: 16,
    cadenceAttaque: 1.0,
    capaciteTransport: 0,
    capacite: 'Carapace résistante, fonce droit sur ses cibles',
    couleur: '#2a3a1a',
    tailleMultiplicateur: 1.4
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

  if (etat.progressionMission) etat.progressionMission.unitesProduites++;
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

  // Anneau rouge sur toute unité actuellement désignée comme cible
  // par un ordre d'attaque d'une unité alliée — rend la "sélection
  // d'une cible" visible, pas seulement effective en interne.
  const estCiblee = etat.unites.some((a) => a.faction === 'joueur' && a.ordre === 'attaquer' && a.cibleId === u.id);
  if (estCiblee) {
    ctx.strokeStyle = '#e0503c';
    ctx.lineWidth = 1.5 / etat.camera.zoom;
    ctx.beginPath();
    ctx.ellipse(u.x, u.y, 13, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  const respiration = Math.sin(temps.total * 2 + u.phaseIdle) * 1.4;
  const couleurCorps = u.faction === 'ennemi' && !def.tailleMultiplicateur ? ajusterCouleur('#8a2418', 0) : def.couleur;
  const echelle = def.tailleMultiplicateur || 1;

  ctx.save();
  ctx.translate(u.x, u.y + respiration);

  // Ombre
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(1, 2, 7 * echelle, 3 * echelle, 0, 0, Math.PI * 2);
  ctx.fill();

  // Abdomen
  ctx.fillStyle = couleurCorps;
  ctx.beginPath();
  ctx.ellipse(-2, 0, 6 * echelle, 4.5 * echelle, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tête
  ctx.fillStyle = ajusterCouleur(couleurCorps, -30);
  ctx.beginPath();
  ctx.ellipse(6 * echelle * 0.85, 0, 3.2 * echelle, 2.8 * echelle, 0, 0, Math.PI * 2);
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

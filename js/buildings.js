// ===========================================================
// BUILDINGS — bâtiments de production et gestion de leurs files.
//
// À cette vague, seuls les 3 bâtiments producteurs d'unités existent
// (Nurserie, Caserne, École des éclaireuses), placés automatiquement
// autour de la fourmilière. La construction manuelle de bâtiments
// (choisir où les poser) viendra à une prochaine vague.
//
// Les instances de bâtiments vivent dans `etat.batiments` (voir
// state.js) — elles sont donc automatiquement incluses dans les
// sauvegardes par storage.js, sans modification nécessaire de ce
// dernier pour leur structure.
// ===========================================================

const TYPES_BATIMENT_PRODUCTION = {
  nurserie: {
    label: 'Nurserie',
    unitesProduisibles: ['ouvriere', 'nourrice', 'jeuneReine'],
    rayon: 42,
    couleur: '#5a3d2e'
  },
  caserne: {
    label: 'Caserne',
    unitesProduisibles: ['fourmiRouge', 'fourmiCharpentiere', 'fourmiLegionnaire', 'fourmiBouledogue', 'fourmiBalleDeFusil', 'soldatGeant'],
    rayon: 46,
    couleur: '#4a2818'
  },
  ecoleEclaireuses: {
    label: 'École des éclaireuses',
    unitesProduisibles: ['eclaireuse', 'fourmiVolante'],
    rayon: 38,
    couleur: '#3a5040'
  },
  // Bâtiment de production constructible par le joueur (pas auto-placé
  // comme les 3 ci-dessus) — voir activerPlacementBatimentProduction /
  // placerBatimentProduction plus bas, même principe que les
  // laboratoires (research.js) et les défenses (defenses.js). Débloque
  // les unités spécialisées déjà définies dans units.js avec
  // `batimentRequis: 'chambreSpecialistes'` (fourmiTisserande,
  // fourmiChimiste, fourmiPiege, fourmiExplosive, reineGuerriere).
  chambreSpecialistes: {
    label: 'Chambre des spécialistes',
    unitesProduisibles: ['fourmiTisserande', 'fourmiChimiste', 'fourmiPiege', 'fourmiExplosive', 'reineGuerriere', 'ouvriereInfiltratrice', 'fourmiCamouflee'],
    rayon: 44,
    couleur: '#4a2a5a',
    cout: { materiaux: 250, nourriture: 150 },
    tempsConstruction: 25
  }
};

// Place les 3 bâtiments producteurs autour de la fourmilière. Appelé
// uniquement au démarrage d'une PARTIE NEUVE (storage.js s'occupe de
// ne pas rappeler cette fonction quand une sauvegarde est chargée,
// puisque etat.batiments contient alors déjà les bâtiments sauvegardés).
function genererBatimentsProduction() {
  const positions = {
    nurserie: { x: fourmiliere.x - 200, y: fourmiliere.y },
    caserne: { x: fourmiliere.x + 200, y: fourmiliere.y },
    ecoleEclaireuses: { x: fourmiliere.x, y: fourmiliere.y + 200 }
  };
  for (const [type, pos] of Object.entries(positions)) {
    etat.batiments.push({
      type,
      x: pos.x,
      y: pos.y,
      fileProduction: [], // { typeUnite, tempsRestant, tempsTotal }
      pointRalliement: null, // voir activerCiblageRalliement / definirPointRalliement, plus bas
      garnison: { unites: [], pv: 0, pvMax: 0, cooldownAttaque: 0 } // voir garnirBatiment / evacuerGarnison, plus bas
    });
  }
}

function trouverBatiment(type) {
  return etat.batiments.find((b) => b.type === type);
}

function trouverBatimentProductionSous(mondeX, mondeY) {
  for (const b of etat.batiments) {
    const def = TYPES_BATIMENT_PRODUCTION[b.type];
    if (!def || b.enConstruction) continue;
    if (distance(b.x, b.y, mondeX, mondeY) < def.rayon + 12) return b;
  }
  return null;
}

// ---------------------------------------------------------
// POINT DE RALLIEMENT — même principe que les autres modes de
// ciblage (fondation, super-arme) : armé depuis le panneau Production
// (ui.js), un tap sur la carte le fixe. Toute unité fraîchement créée
// par ce bâtiment s'y rend ensuite automatiquement (voir units.js →
// creerUnite), sans que le joueur ait à la sélectionner à chaque
// sortie.
// ---------------------------------------------------------
let modeCiblageRalliement = null;

function activerCiblageRalliement(type) {
  modeCiblageRalliement = modeCiblageRalliement === type ? null : type;
  if (modeCiblageRalliement) {
    modePlacementDefense = null;
    modePlacementLaboratoire = null;
    modePlacementBatimentProduction = null;
    modeCiblageFondation = false;
    modeCiblageSuperarme = false;
    modeDemolition = false;
  }
}

function definirPointRalliement(type, x, y) {
  const b = trouverBatiment(type);
  if (!b) return false;
  b.pointRalliement = { x: clamp(x, 0, etat.carte.largeur), y: clamp(y, 0, etat.carte.hauteur) };
  ajouterRetourTactile(b.pointRalliement.x, b.pointRalliement.y);
  return true;
}

// ---------------------------------------------------------
// GARNISON — des unités combattantes sélectionnées peuvent entrer
// dans un bâtiment de production pour tirer depuis l'intérieur, comme
// les civils garnissant un bâtiment dans Command & Conquer. L'unité
// quitte complètement la carte (retirée de etat.unites) tant qu'elle
// est garnie : le bâtiment agrège les dégâts et les PV de tout son
// contingent (voir resoudreCombatsGarnison, combat.js).
//
// Seules les unités avec des dégâts > 0 peuvent être garnies — pas de
// sens à y planquer une récolteuse ou une jeune reine, qui ne peuvent
// de toute façon rien y faire d'utile en combat.
// ---------------------------------------------------------
function garnirBatiment(batiment, unitesSelectionnees) {
  const def = TYPES_BATIMENT_PRODUCTION[batiment.type];
  if (!def || batiment.enConstruction) return 0;

  // Bâtiment restauré depuis une sauvegarde antérieure à cette
  // fonctionnalité : pas de champ garnison encore posé dessus.
  if (!batiment.garnison) batiment.garnison = { unites: [], pv: 0, pvMax: 0, cooldownAttaque: 0 };

  const eligibles = unitesSelectionnees.filter((u) => TYPES_UNITE[u.type].degats > 0 && u.pv > 0);
  if (eligibles.length === 0) return 0;

  for (const u of eligibles) {
    batiment.garnison.unites.push({ type: u.type, pv: u.pv, rang: u.rang || 0 });
    batiment.garnison.pv += u.pv;
    batiment.garnison.pvMax += u.pvMax;
    const idx = etat.unites.indexOf(u);
    if (idx !== -1) etat.unites.splice(idx, 1);
    // Population inchangée : ces unités ne sont pas mortes, juste
    // planquées — voir evacuerGarnison, qui les fait ressortir sans
    // recréer de coût ni de nouveau décompte de population.
  }
  ajouterTexteFlottant(batiment.x, batiment.y - def.rayon - 10, `+${eligibles.length} en garnison`, '#8ac6ff');
  return eligibles.length;
}

// Fait ressortir toute la garnison d'un bâtiment, unité par unité,
// avec leurs PV et rang conservés tels quels.
function evacuerGarnison(batiment) {
  if (!batiment.garnison || batiment.garnison.unites.length === 0) return 0;

  const angleDepart = Math.random() * Math.PI * 2;
  batiment.garnison.unites.forEach((g, i) => {
    const angle = angleDepart + i * 0.6;
    const u = creerInstanceUnite(g.type, batiment.x + Math.cos(angle) * 26, batiment.y + Math.sin(angle) * 26, 'joueur');
    u.pv = g.pv;
    u.pvMax = Math.round(TYPES_UNITE[g.type].pv * (RANGS_VETERANCE[g.rang || 0].bonusPv || 1));
    u.rang = g.rang;
    etat.unites.push(u);
  });

  const nb = batiment.garnison.unites.length;
  batiment.garnison = { unites: [], pv: 0, pvMax: 0, cooldownAttaque: 0 };
  ajouterTexteFlottant(batiment.x, batiment.y, `${nb} unité(s) évacuée(s)`, '#f0e0c0');
  return nb;
}

// ---------------------------------------------------------
// DÉMOLITION (voir aussi defenses.js → demolirSous, qui appelle ceci)
// ---------------------------------------------------------
function demolirBatimentProduction(batiment) {
  const def = TYPES_BATIMENT_PRODUCTION[batiment.type];
  if (!def.cout) return false; // Nurserie/Caserne/École : jamais démolissables (irremplaçables)

  if (batiment.garnison && batiment.garnison.unites.length > 0) evacuerGarnison(batiment);
  rembourserMoitie(def.cout);
  const idx = etat.batiments.indexOf(batiment);
  if (idx !== -1) etat.batiments.splice(idx, 1);
  ajouterTexteFlottant(batiment.x, batiment.y, def.label + ' démoli(e) (+ressources)', '#e0b84a');
  return true;
}

// ---------------------------------------------------------
// PLACEMENT (bâtiments de production constructibles uniquement, donc
// ici seulement chambreSpecialistes) — même principe que
// activerPlacementDefense (defenses.js) / activerPlacementLaboratoire
// (research.js) : mode armé, mutuellement exclusif, consommé par un
// tap sur la carte (voir input.js).
// ---------------------------------------------------------
let modePlacementBatimentProduction = null;

function activerPlacementBatimentProduction(type) {
  modePlacementBatimentProduction = modePlacementBatimentProduction === type ? null : type;
  if (modePlacementBatimentProduction) {
    modePlacementDefense = null;
    modePlacementLaboratoire = null;
    modeCiblageFondation = false;
    modeCiblageSuperarme = false;
    modeCiblageRalliement = null;
    modeDemolition = false;
  }
}

function placerBatimentProduction(type, x, y) {
  const def = TYPES_BATIMENT_PRODUCTION[type];
  if (!def || !def.cout) return false; // les 3 bâtiments de départ ne sont pas replaçables
  if (!peutPayer(def.cout)) {
    ajouterTexteFlottant(x, y, 'Ressources insuffisantes', '#e0503c');
    return false;
  }
  payerCout(def.cout);
  etat.batiments.push({
    type,
    x, y,
    fileProduction: [],
    enConstruction: true,
    tempsRestantConstruction: def.tempsConstruction,
    pointRalliement: null,
    garnison: { unites: [], pv: 0, pvMax: 0, cooldownAttaque: 0 }
  });
  return true;
}

function peutPayer(cout) {
  for (const ressource in cout) {
    if ((etat.ressources[ressource] || 0) < cout[ressource]) return false;
  }
  return true;
}

function payerCout(cout) {
  for (const ressource in cout) {
    etat.ressources[ressource] -= cout[ressource];
  }
}

// Met une unité en file de production sur un bâtiment donné.
// Retourne true si la mise en file a réussi, false sinon (ressources
// insuffisantes, population au maximum, ou unité non produisible par
// ce bâtiment).
function mettreEnFileProduction(batiment, typeUnite) {
  const defBatiment = TYPES_BATIMENT_PRODUCTION[batiment.type];
  const defUnite = TYPES_UNITE[typeUnite];
  if (!defBatiment || !defUnite) return false;
  if (!defBatiment.unitesProduisibles.includes(typeUnite)) return false;
  if (batiment.enConstruction) {
    ajouterTexteFlottant(batiment.x, batiment.y - defBatiment.rayon - 10, 'Construction en cours', '#e0503c');
    return false;
  }

  if (etat.ressources.population >= etat.ressources.populationMax) {
    ajouterTexteFlottant(batiment.x, batiment.y - defBatiment.rayon - 10, 'Population max', '#e0503c');
    return false;
  }
  if (!peutPayer(defUnite.cout)) {
    ajouterTexteFlottant(batiment.x, batiment.y - defBatiment.rayon - 10, 'Ressources insuffisantes', '#e0503c');
    return false;
  }

  payerCout(defUnite.cout);
  // La place de population est réservée dès la mise en file, pas
  // seulement à la sortie — sinon on pourrait mettre en file plus
  // d'unités que la limite ne le permet réellement.
  etat.ressources.population++;

  batiment.fileProduction.push({
    typeUnite,
    tempsRestant: defUnite.tempsProduction,
    tempsTotal: defUnite.tempsProduction
  });
  return true;
}

// Avance toutes les files de production d'un pas de temps, ainsi que
// le décompte de construction des bâtiments de production posés par le
// joueur (chambreSpecialistes). Appelé depuis la boucle de jeu (main.js).
function mettreAJourProduction(delta) {
  for (const b of etat.batiments) {
    if (!TYPES_BATIMENT_PRODUCTION[b.type]) continue;

    if (b.enConstruction) {
      b.tempsRestantConstruction -= delta;
      if (b.tempsRestantConstruction <= 0) b.enConstruction = false;
      continue; // pas de production tant que le bâtiment n'est pas achevé
    }

    if (!b.fileProduction || b.fileProduction.length === 0) continue;
    const item = b.fileProduction[0];
    item.tempsRestant -= delta;
    if (item.tempsRestant <= 0) {
      creerUnite(item.typeUnite, b);
      b.fileProduction.shift();
    }
  }
}

// ---------------------------------------------------------
// RENDU
// ---------------------------------------------------------
function dessinerBatimentProduction(ctx, b) {
  const def = TYPES_BATIMENT_PRODUCTION[b.type];

  if (b.enConstruction) ctx.globalAlpha = 0.5;

  const degrade = ctx.createRadialGradient(b.x - 10, b.y - 8, 3, b.x, b.y, def.rayon);
  degrade.addColorStop(0, ajusterCouleur(def.couleur, 30));
  degrade.addColorStop(1, def.couleur);
  ctx.fillStyle = degrade;
  activerOmbrePortee(11, 4);
  ctx.beginPath();
  ctx.ellipse(b.x, b.y, def.rayon, def.rayon * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  desactiverOmbrePortee();
  ctx.strokeStyle = '#1a120a';
  ctx.lineWidth = 2.5 / etat.camera.zoom;
  ctx.stroke();

  dessinerIconeBatimentProduction(ctx, b.type, b.x, b.y, def.rayon);

  ctx.fillStyle = '#f0e0c0';
  ctx.font = `${12 / etat.camera.zoom}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(b.enConstruction ? def.label + '…' : def.label, b.x, b.y - def.rayon - 8 / etat.camera.zoom);

  if (b.enConstruction) {
    const progression = 1 - b.tempsRestantConstruction / def.tempsConstruction;
    const largeurBarre = def.rayon * 1.3;
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(b.x - largeurBarre / 2, b.y + def.rayon + 6 / etat.camera.zoom, largeurBarre, 5 / etat.camera.zoom);
    ctx.fillStyle = '#8ac6ff';
    ctx.fillRect(b.x - largeurBarre / 2, b.y + def.rayon + 6 / etat.camera.zoom, largeurBarre * progression, 5 / etat.camera.zoom);
    return;
  }

  // File de production : barre de progression de l'unité en cours +
  // pastille indiquant combien d'unités attendent derrière
  if (b.fileProduction && b.fileProduction.length > 0) {
    const item = b.fileProduction[0];
    const progression = 1 - item.tempsRestant / item.tempsTotal;
    const largeurBarre = def.rayon * 1.3;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(b.x - largeurBarre / 2, b.y + def.rayon + 6 / etat.camera.zoom, largeurBarre, 5 / etat.camera.zoom);
    ctx.fillStyle = '#ffd27a';
    ctx.fillRect(b.x - largeurBarre / 2, b.y + def.rayon + 6 / etat.camera.zoom, largeurBarre * progression, 5 / etat.camera.zoom);

    if (b.fileProduction.length > 1) {
      ctx.fillStyle = '#f0e0c0';
      ctx.font = `${10 / etat.camera.zoom}px Arial`;
      ctx.fillText('+' + (b.fileProduction.length - 1), b.x, b.y + def.rayon + 22 / etat.camera.zoom);
    }
  }

  // Garnison (voir garnirBatiment/evacuerGarnison, plus haut) —
  // pastille avec le nombre d'occupants + petite barre de PV agrégés,
  // décalée à droite pour ne jamais chevaucher la barre de production
  // ci-dessus.
  if (b.garnison && b.garnison.unites.length > 0) {
    const decalageX = def.rayon + 4 / etat.camera.zoom;
    ctx.fillStyle = 'rgba(20,15,8,0.75)';
    ctx.beginPath();
    ctx.arc(b.x + decalageX, b.y - def.rayon * 0.5, 9 / etat.camera.zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8ac6ff';
    ctx.lineWidth = 1.5 / etat.camera.zoom;
    ctx.stroke();
    ctx.fillStyle = '#8ac6ff';
    ctx.font = `bold ${10 / etat.camera.zoom}px Arial`;
    ctx.fillText(String(b.garnison.unites.length), b.x + decalageX, b.y - def.rayon * 0.5 + 3.5 / etat.camera.zoom);

    if (b.garnison.pv < b.garnison.pvMax) {
      const largeurBarreG = def.rayon * 0.9;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(b.x - largeurBarreG / 2, b.y - def.rayon - 20 / etat.camera.zoom, largeurBarreG, 4 / etat.camera.zoom);
      ctx.fillStyle = '#8ac6ff';
      ctx.fillRect(b.x - largeurBarreG / 2, b.y - def.rayon - 20 / etat.camera.zoom, largeurBarreG * (b.garnison.pv / b.garnison.pvMax), 4 / etat.camera.zoom);
    }
  }
}

// Petit symbole distinctif par type de bâtiment, dessiné par-dessus
// l'ellipse colorée — sans ça, tous les bâtiments de production ne
// se distinguaient que par leur teinte, difficile à lire d'un coup
// d'œil sur un petit écran.
function dessinerIconeBatimentProduction(ctx, type, x, y, rayon) {
  const echelle = rayon / 44;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2 * echelle / etat.camera.zoom;

  if (type === 'nurserie') {
    // Petit amas d'œufs
    for (const [dx, dy] of [[-6, 2], [0, -2], [6, 2]]) {
      ctx.beginPath();
      ctx.ellipse(x + dx * echelle, y + dy * echelle, 4 * echelle, 5 * echelle, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'caserne') {
    // Mandibules croisées
    ctx.beginPath();
    ctx.moveTo(x - 9 * echelle, y - 7 * echelle);
    ctx.lineTo(x + 9 * echelle, y + 7 * echelle);
    ctx.moveTo(x + 9 * echelle, y - 7 * echelle);
    ctx.lineTo(x - 9 * echelle, y + 7 * echelle);
    ctx.stroke();
  } else if (type === 'ecoleEclaireuses') {
    // Œil (vigilance/exploration)
    ctx.beginPath();
    ctx.ellipse(x, y, 9 * echelle, 5 * echelle, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 3 * echelle, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'chambreSpecialistes') {
    // Petit cristal facetté (spécialisation/chimie)
    ctx.beginPath();
    ctx.moveTo(x, y - 9 * echelle);
    ctx.lineTo(x + 7 * echelle, y - 1 * echelle);
    ctx.lineTo(x, y + 9 * echelle);
    ctx.lineTo(x - 7 * echelle, y - 1 * echelle);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 9 * echelle);
    ctx.lineTo(x, y + 9 * echelle);
    ctx.stroke();
  }
}

function dessinerBatimentsProduction(ctx) {
  const zone = zoneVisibleMonde(80);
  for (const b of etat.batiments) {
    if (!TYPES_BATIMENT_PRODUCTION[b.type]) continue; // ignore les défenses (voir defenses.js)
    if (b.x < zone.x1 || b.x > zone.x2 || b.y < zone.y1 || b.y > zone.y2) continue;
    dessinerBatimentProduction(ctx, b);
  }
}

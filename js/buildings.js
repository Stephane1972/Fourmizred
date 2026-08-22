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
      fileProduction: [] // { typeUnite, tempsRestant, tempsTotal }
    });
  }
}

function trouverBatiment(type) {
  return etat.batiments.find((b) => b.type === type);
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
    tempsRestantConstruction: def.tempsConstruction
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
  ctx.beginPath();
  ctx.ellipse(b.x, b.y, def.rayon, def.rayon * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a120a';
  ctx.lineWidth = 2.5 / etat.camera.zoom;
  ctx.stroke();

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
}

function dessinerBatimentsProduction(ctx) {
  const zone = zoneVisibleMonde(80);
  for (const b of etat.batiments) {
    if (!TYPES_BATIMENT_PRODUCTION[b.type]) continue; // ignore les défenses (voir defenses.js)
    if (b.x < zone.x1 || b.x > zone.x2 || b.y < zone.y1 || b.y > zone.y2) continue;
    dessinerBatimentProduction(ctx, b);
  }
}

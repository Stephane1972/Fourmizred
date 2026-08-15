// ===========================================================
// DEFENSES — bâtiments défensifs constructibles à l'emplacement
// choisi par le joueur. Vivent dans etat.batiments, au même titre
// que les bâtiments de production (buildings.js) — c'est ce qui
// leur donne automatiquement une sauvegarde IndexedDB sans code
// supplémentaire dans storage.js, puisque celui-ci sauvegarde déjà
// tout le tableau etat.batiments tel quel.
// ===========================================================

const TYPES_DEFENSE = {
  murResine: {
    label: 'Mur de résine',
    cout: { materiaux: 60 },
    tempsConstruction: 5,
    pv: 300,
    attaque: false,
    couleur: '#8a4a3a'
  },
  porteBlindee: {
    label: 'Porte blindée',
    cout: { materiaux: 100 },
    tempsConstruction: 8,
    pv: 500,
    attaque: false,
    couleur: '#5a5a5a'
  },
  lanceVenin: {
    label: 'Lance-venin',
    cout: { materiaux: 80, nourriture: 20 },
    tempsConstruction: 10,
    pv: 150,
    attaque: true,
    degats: 14,
    portee: 140,
    cadenceAttaque: 1.5,
    couleur: '#4a7a3a'
  },
  piegeMandibules: {
    label: 'Piège à mandibules',
    cout: { materiaux: 50 },
    tempsConstruction: 6,
    pv: 100,
    attaque: true,
    degats: 30,
    portee: 40,
    cadenceAttaque: 2.5,
    couleur: '#3a2a1a'
  },
  tourelleAcide: {
    label: 'Tourelle à acide',
    cout: { materiaux: 120, nourriture: 30 },
    tempsConstruction: 12,
    pv: 200,
    attaque: true,
    degats: 18,
    portee: 180,
    cadenceAttaque: 1.2,
    couleur: '#7a8a2a'
  }
};

const RATIO_REPARATION = 5; // PV restaurés par matériau dépensé
const RAYON_TOUCHE_DEFENSE = 30;

// ---------------------------------------------------------
// PLACEMENT — mode d'armement (touches 6-0, provisoire en attendant
// un vrai menu dans ui.js) puis pose au tap suivant sur la carte.
// ---------------------------------------------------------
let modePlacementDefense = null;

function activerPlacementDefense(type) {
  modePlacementDefense = modePlacementDefense === type ? null : type;
  if (modePlacementDefense) {
    console.log(`Mode placement : ${TYPES_DEFENSE[type].label} — touchez la carte pour la construire.`);
  }
}

function placerDefense(type, x, y) {
  const def = TYPES_DEFENSE[type];
  if (!def) return false;
  if (!peutPayer(def.cout)) {
    ajouterTexteFlottant(x, y, 'Matériaux insuffisants', '#e0503c');
    return false;
  }
  payerCout(def.cout);
  etat.batiments.push({
    type,
    x, y,
    pv: def.pv,
    pvMax: def.pv,
    enConstruction: true,
    tempsRestantConstruction: def.tempsConstruction,
    cooldownAttaque: 0
  });
  return true;
}

function trouverDefenseSous(mondeX, mondeY) {
  for (const b of etat.batiments) {
    if (!TYPES_DEFENSE[b.type]) continue;
    if (distance(b.x, b.y, mondeX, mondeY) < RAYON_TOUCHE_DEFENSE) return b;
  }
  return null;
}

// ---------------------------------------------------------
// RÉPARATION — consomme des matériaux pour restaurer des PV, au
// tarif de RATIO_REPARATION PV par matériau. Ne répare jamais plus
// que nécessaire ni plus que ce que le stock permet.
// ---------------------------------------------------------
function reparerDefense(defense) {
  if (!defense || defense.enConstruction || defense.pv >= defense.pvMax) return false;

  const pvManquants = defense.pvMax - defense.pv;
  const materiauxNecessaires = Math.ceil(pvManquants / RATIO_REPARATION);
  const materiauxUtilises = Math.min(materiauxNecessaires, etat.ressources.materiaux);

  if (materiauxUtilises <= 0) {
    ajouterTexteFlottant(defense.x, defense.y - 20, 'Matériaux insuffisants', '#e0503c');
    return false;
  }

  etat.ressources.materiaux -= materiauxUtilises;
  defense.pv = Math.min(defense.pvMax, defense.pv + materiauxUtilises * RATIO_REPARATION);
  ajouterTexteFlottant(defense.x, defense.y - 20, '+' + (materiauxUtilises * RATIO_REPARATION) + ' PV', '#3ae03a');
  return true;
}

// ---------------------------------------------------------
// MISE À JOUR — construction, attaque automatique, dégâts subis,
// destruction. Appelée depuis la boucle de jeu (main.js).
// ---------------------------------------------------------
function mettreAJourDefenses(delta) {
  // Construction en cours, rechargement, et tir automatique
  for (const b of etat.batiments) {
    const def = TYPES_DEFENSE[b.type];
    if (!def) continue; // pas une défense (bâtiment de production)

    if (b.enConstruction) {
      b.tempsRestantConstruction -= delta;
      if (b.tempsRestantConstruction <= 0) b.enConstruction = false;
      continue;
    }
    if (b.pv <= 0) continue;

    if (b.cooldownAttaque > 0) b.cooldownAttaque -= delta;

    if (def.attaque && b.cooldownAttaque <= 0) {
      let cible = null, meilleureDist = def.portee;
      for (const u of etat.unites) {
        if (u.faction !== 'ennemi' || u.pv <= 0) continue;
        const d = distance(b.x, b.y, u.x, u.y);
        if (d < meilleureDist) { meilleureDist = d; cible = u; }
      }
      if (cible) {
        cible.pv = Math.max(0, cible.pv - def.degats);
        b.cooldownAttaque = def.cadenceAttaque;
        ajouterTexteFlottant(cible.x, cible.y - 10, '-' + def.degats, '#c8e070');
      }
    }
  }

  // Unités ennemies à portée endommagent les défenses alliées
  // (une seule défense attaquée par unité et par tour, pour éviter
  // qu'une unité ne tire simultanément sur plusieurs cibles)
  for (const u of etat.unites) {
    if (u.faction !== 'ennemi' || u.pv <= 0 || u.cooldownAttaque > 0) continue;
    const defU = TYPES_UNITE[u.type];
    for (const b of etat.batiments) {
      const defB = TYPES_DEFENSE[b.type];
      if (!defB || b.enConstruction || b.pv <= 0) continue;
      const d = distance(u.x, u.y, b.x, b.y);
      if (d <= defU.portee) {
        b.pv = Math.max(0, b.pv - defU.degats);
        u.cooldownAttaque = defU.cadenceAttaque;
        break;
      }
    }
  }

  // Destruction des défenses tombées à 0 PV
  for (let i = etat.batiments.length - 1; i >= 0; i--) {
    const b = etat.batiments[i];
    if (TYPES_DEFENSE[b.type] && b.pv <= 0) {
      etat.batiments.splice(i, 1);
    }
  }
}

// ---------------------------------------------------------
// RENDU
// ---------------------------------------------------------
function dessinerDefense(ctx, b) {
  const def = TYPES_DEFENSE[b.type];
  const estMur = b.type === 'murResine' || b.type === 'porteBlindee';

  ctx.save();
  if (b.enConstruction) ctx.globalAlpha = 0.5;

  ctx.fillStyle = def.couleur;
  ctx.strokeStyle = '#1a120a';
  ctx.lineWidth = 2 / etat.camera.zoom;
  if (estMur) {
    ctx.fillRect(b.x - 18, b.y - 10, 36, 20);
    ctx.strokeRect(b.x - 18, b.y - 10, 36, 20);
  } else {
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 15, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Petit canon indiquant que la structure attaque automatiquement
    if (def.attaque) {
      ctx.strokeStyle = ajusterCouleur(def.couleur, -40);
      ctx.lineWidth = 3 / etat.camera.zoom;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + 10, b.y - 6);
      ctx.stroke();
    }
  }
  ctx.restore();

  ctx.fillStyle = '#f0e0c0';
  ctx.font = `${10 / etat.camera.zoom}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(
    b.enConstruction ? def.label + '…' : def.label,
    b.x, b.y - 24 / etat.camera.zoom
  );

  if (!b.enConstruction && b.pv < b.pvMax) {
    const largeur = 30;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(b.x - largeur / 2, b.y + 18, largeur, 4 / etat.camera.zoom);
    ctx.fillStyle = b.pv / b.pvMax > 0.3 ? '#3ae03a' : '#e0503c';
    ctx.fillRect(b.x - largeur / 2, b.y + 18, largeur * (b.pv / b.pvMax), 4 / etat.camera.zoom);
  }

  // Pendant la construction, une barre de progression plutôt qu'une
  // barre de vie (la structure n'est pas encore endommageable)
  if (b.enConstruction) {
    const progression = 1 - b.tempsRestantConstruction / def.tempsConstruction;
    const largeur = 30;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(b.x - largeur / 2, b.y + 18, largeur, 4 / etat.camera.zoom);
    ctx.fillStyle = '#ffd27a';
    ctx.fillRect(b.x - largeur / 2, b.y + 18, largeur * progression, 4 / etat.camera.zoom);
  }
}

function dessinerDefenses(ctx) {
  const zone = zoneVisibleMonde(60);
  for (const b of etat.batiments) {
    if (!TYPES_DEFENSE[b.type]) continue;
    if (b.x < zone.x1 || b.x > zone.x2 || b.y < zone.y1 || b.y > zone.y2) continue;
    dessinerDefense(ctx, b);
  }
}

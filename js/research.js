// ===========================================================
// RESEARCH — bâtiments de recherche et arbre de technologies.
// Comme les défenses (defenses.js), les laboratoires vivent dans
// etat.batiments : leur sauvegarde IndexedDB est donc déjà couverte
// par storage.js sans code supplémentaire. etat.technologies (un
// tableau d'identifiants de technologies acquises) existe depuis la
// toute première vague, prévu justement pour cet usage.
// ===========================================================

const TYPES_LABORATOIRE = {
  laboratoireBiologique: {
    label: 'Laboratoire biologique',
    cout: { materiaux: 150, nourriture: 80 },
    tempsConstruction: 15,
    couleur: '#3a6a3a'
  },
  laboratoireChimique: {
    label: 'Laboratoire chimique',
    cout: { materiaux: 160, nourriture: 60 },
    tempsConstruction: 15,
    couleur: '#7a6a1a'
  },
  centreGenetique: {
    label: 'Centre de génétique',
    cout: { materiaux: 200, nourriture: 100 },
    tempsConstruction: 20,
    couleur: '#5a3a6a'
  },
  observatoire: {
    label: 'Observatoire',
    cout: { materiaux: 120, eau: 40 },
    tempsConstruction: 12,
    couleur: '#3a4a7a'
  },
  centreStrategie: {
    label: 'Centre de stratégie',
    cout: { materiaux: 180, nourriture: 90 },
    tempsConstruction: 18,
    couleur: '#6a3a2a'
  }
};

// ---------------------------------------------------------
// ARBRE DE RECHERCHE — deux paliers par laboratoire, le second
// nécessitant le premier. La plupart décrivent un effet "à venir"
// (même principe que les capacités d'unités) ; celles du Centre de
// stratégie sont réellement appliquées dès leur achèvement, pour
// prouver que le système fonctionne bout en bout sans toucher au
// combat déjà testé des vagues précédentes.
// ---------------------------------------------------------
const ARBRE_RECHERCHE = {
  bioCarapaceI: {
    label: 'Carapace renforcée I',
    categorie: 'laboratoireBiologique',
    cout: { materiaux: 100, nourriture: 50 },
    tempsRecherche: 30,
    prerequis: null,
    description: 'Renforce la résistance de toutes les unités (effet à venir).'
  },
  bioCarapaceII: {
    label: 'Carapace renforcée II',
    categorie: 'laboratoireBiologique',
    cout: { materiaux: 200, nourriture: 100 },
    tempsRecherche: 60,
    prerequis: 'bioCarapaceI',
    description: 'Renforce encore la résistance de toutes les unités (effet à venir).'
  },
  chimToxineI: {
    label: 'Toxines concentrées I',
    categorie: 'laboratoireChimique',
    cout: { materiaux: 120, nourriture: 40 },
    tempsRecherche: 35,
    prerequis: null,
    description: 'Augmente les dégâts de toutes les unités (effet à venir).'
  },
  chimToxineII: {
    label: 'Toxines concentrées II',
    categorie: 'laboratoireChimique',
    cout: { materiaux: 220, nourriture: 80 },
    tempsRecherche: 65,
    prerequis: 'chimToxineI',
    description: 'Augmente encore les dégâts de toutes les unités (effet à venir).'
  },
  genSelectionI: {
    label: 'Sélection génétique I',
    categorie: 'centreGenetique',
    cout: { materiaux: 150, nourriture: 80 },
    tempsRecherche: 40,
    prerequis: null,
    description: 'Réduit le temps de production des unités (effet à venir).'
  },
  genSelectionII: {
    label: 'Sélection génétique II',
    categorie: 'centreGenetique',
    cout: { materiaux: 250, nourriture: 130 },
    tempsRecherche: 70,
    prerequis: 'genSelectionI',
    description: 'Réduit encore le temps de production des unités (effet à venir).'
  },
  obsOptiqueI: {
    label: 'Optique composée I',
    categorie: 'observatoire',
    cout: { materiaux: 90, eau: 30 },
    tempsRecherche: 25,
    prerequis: null,
    description: 'Augmente le rayon de détection des éclaireuses (effet à venir).'
  },
  obsOptiqueII: {
    label: 'Optique composée II',
    categorie: 'observatoire',
    cout: { materiaux: 160, eau: 60 },
    tempsRecherche: 50,
    prerequis: 'obsOptiqueI',
    description: 'Augmente encore le rayon de détection (effet à venir).'
  },
  stratPopulationI: {
    label: 'Organisation de la colonie I',
    categorie: 'centreStrategie',
    cout: { materiaux: 130, nourriture: 70 },
    tempsRecherche: 35,
    prerequis: null,
    description: '+5 population maximale.',
    effet: () => { etat.ressources.populationMax += 5; }
  },
  stratPopulationII: {
    label: 'Organisation de la colonie II',
    categorie: 'centreStrategie',
    cout: { materiaux: 230, nourriture: 120 },
    tempsRecherche: 65,
    prerequis: 'stratPopulationI',
    description: '+10 population maximale supplémentaires.',
    effet: () => { etat.ressources.populationMax += 10; }
  },
  // Super-arme (voir superarme.js) — technologie de fin d'arbre du
  // Centre de stratégie : aucun effet() ici, le simple fait qu'elle
  // soit dans etat.technologies (via technologieDejaAcquise) suffit à
  // débloquer le bouton d'activation dans le panneau Recherche (ui.js).
  stratSuperarme: {
    label: 'Pluie acide (super-arme)',
    categorie: 'centreStrategie',
    cout: { materiaux: 400, nourriture: 250 },
    tempsRecherche: 120,
    prerequis: 'stratPopulationII',
    description: 'Débloque une frappe dévastatrice à zone, activable depuis le panneau Partie (long temps de recharge).'
  }
};

// ---------------------------------------------------------
// PLACEMENT — mode d'armement (touches B/H/G/O/T, provisoire en
// attendant un vrai menu dans ui.js) puis pose au tap suivant.
// ---------------------------------------------------------
let modePlacementLaboratoire = null;

function activerPlacementLaboratoire(type) {
  modePlacementLaboratoire = modePlacementLaboratoire === type ? null : type;
  if (modePlacementLaboratoire) {
    modePlacementDefense = null; // les deux modes de placement sont mutuellement exclusifs
    modePlacementBatimentProduction = null;
    modeCiblageFondation = false;
    modeCiblageSuperarme = false;
    modeCiblageRalliement = null;
    console.log(`Mode placement : ${TYPES_LABORATOIRE[type].label} — touchez la carte pour le construire.`);
  }
}

function placerLaboratoire(type, x, y) {
  const def = TYPES_LABORATOIRE[type];
  if (!def) return false;
  if (!peutPayer(def.cout)) {
    ajouterTexteFlottant(x, y, 'Ressources insuffisantes', '#e0503c');
    return false;
  }
  payerCout(def.cout);
  etat.batiments.push({
    type,
    x, y,
    enConstruction: true,
    tempsRestantConstruction: def.tempsConstruction,
    fileRecherche: [] // { techId, tempsRestant, tempsTotal }
  });
  return true;
}

function trouverLaboratoire(type) {
  return etat.batiments.find((b) => b.type === type);
}

// ---------------------------------------------------------
// FILE DE RECHERCHE
// ---------------------------------------------------------
function technologieDejaAcquise(techId) {
  return etat.technologies.includes(techId);
}

function prerequisRempli(techId) {
  const tech = ARBRE_RECHERCHE[techId];
  return !tech.prerequis || technologieDejaAcquise(tech.prerequis);
}

function mettreEnFileRecherche(labo, techId) {
  const tech = ARBRE_RECHERCHE[techId];
  if (!labo || !tech) return false;
  if (labo.enConstruction) {
    ajouterTexteFlottant(labo.x, labo.y - 40, 'Construction en cours', '#e0503c');
    return false;
  }
  if (tech.categorie !== labo.type) return false;
  if (technologieDejaAcquise(techId)) {
    ajouterTexteFlottant(labo.x, labo.y - 40, 'Déjà acquise', '#e0503c');
    return false;
  }
  if (!prerequisRempli(techId)) {
    ajouterTexteFlottant(labo.x, labo.y - 40, 'Prérequis manquant', '#e0503c');
    return false;
  }
  if (labo.fileRecherche.some((o) => o.techId === techId)) return false;
  if (!peutPayer(tech.cout)) {
    ajouterTexteFlottant(labo.x, labo.y - 40, 'Ressources insuffisantes', '#e0503c');
    return false;
  }

  payerCout(tech.cout);
  labo.fileRecherche.push({ techId, tempsRestant: tech.tempsRecherche, tempsTotal: tech.tempsRecherche });
  return true;
}

// ---------------------------------------------------------
// MISE À JOUR — construction puis avancement des files de recherche.
// Appelée depuis la boucle de jeu (main.js).
// ---------------------------------------------------------
function mettreAJourLaboratoires(delta) {
  for (const b of etat.batiments) {
    if (!TYPES_LABORATOIRE[b.type]) continue;

    if (b.enConstruction) {
      b.tempsRestantConstruction -= delta;
      if (b.tempsRestantConstruction <= 0) b.enConstruction = false;
      continue;
    }

    if (!b.fileRecherche || b.fileRecherche.length === 0) continue;
    const item = b.fileRecherche[0];
    item.tempsRestant -= delta;
    if (item.tempsRestant <= 0) {
      if (!technologieDejaAcquise(item.techId)) {
        etat.technologies.push(item.techId);
        const tech = ARBRE_RECHERCHE[item.techId];
        if (tech.effet) tech.effet();
        ajouterTexteFlottant(b.x, b.y - 30, tech.label + ' acquise !', '#3ae03a');
      }
      b.fileRecherche.shift();
    }
  }
}

// ---------------------------------------------------------
// RENDU
// ---------------------------------------------------------
function dessinerLaboratoire(ctx, b) {
  const def = TYPES_LABORATOIRE[b.type];

  ctx.save();
  if (b.enConstruction) ctx.globalAlpha = 0.5;
  const degrade = ctx.createRadialGradient(b.x - 10, b.y - 8, 3, b.x, b.y, 34);
  degrade.addColorStop(0, ajusterCouleur(def.couleur, 30));
  degrade.addColorStop(1, def.couleur);
  ctx.fillStyle = degrade;
  activerOmbrePortee(10, 3);
  ctx.beginPath();
  ctx.ellipse(b.x, b.y, 34, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  desactiverOmbrePortee();
  ctx.strokeStyle = '#1a120a';
  ctx.lineWidth = 2 / etat.camera.zoom;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#f0e0c0';
  ctx.font = `${11 / etat.camera.zoom}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(
    b.enConstruction ? def.label + '…' : def.label,
    b.x, b.y - 40 / etat.camera.zoom
  );

  const largeur = 40;
  if (b.enConstruction) {
    const progression = 1 - b.tempsRestantConstruction / def.tempsConstruction;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(b.x - largeur / 2, b.y + 30, largeur, 4 / etat.camera.zoom);
    ctx.fillStyle = '#ffd27a';
    ctx.fillRect(b.x - largeur / 2, b.y + 30, largeur * progression, 4 / etat.camera.zoom);
  } else if (b.fileRecherche && b.fileRecherche.length > 0) {
    const item = b.fileRecherche[0];
    const progression = 1 - item.tempsRestant / item.tempsTotal;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(b.x - largeur / 2, b.y + 30, largeur, 4 / etat.camera.zoom);
    ctx.fillStyle = '#7ad0ff';
    ctx.fillRect(b.x - largeur / 2, b.y + 30, largeur * progression, 4 / etat.camera.zoom);
    if (b.fileRecherche.length > 1) {
      ctx.fillText('+' + (b.fileRecherche.length - 1), b.x, b.y + 46 / etat.camera.zoom);
    }
  }
}

function dessinerLaboratoires(ctx) {
  const zone = zoneVisibleMonde(80);
  for (const b of etat.batiments) {
    if (!TYPES_LABORATOIRE[b.type]) continue;
    if (b.x < zone.x1 || b.x > zone.x2 || b.y < zone.y1 || b.y > zone.y2) continue;
    dessinerLaboratoire(ctx, b);
  }
}

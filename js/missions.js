// ===========================================================
// MISSIONS — dix scénarios jouables, chacun avec ses objectifs,
// sa composition d'ennemis propre, ses ressources de départ, ses
// conditions de victoire/défaite, et une récompense.
//
// Moteur générique : chaque objectif a un `type` évalué par
// evaluerObjectif(). Une mission est gagnée quand TOUS ses
// objectifs sont remplis. La défaite reste toujours possible par
// destruction de la fourmilière, et en plus par expiration du
// temps si `dureeLimite` est définie.
//
// Types d'objectif supportés :
//   collecterRessource   { ressource, montant }
//   eliminerEnnemis       (aucun paramètre : élimine tout ce qui est hostile)
//   produireUnites        { quantite }
//   survivre              { duree }
//   rechercherTechnologie { techId }
//   atteindrePopulation   { quantite }
//   construireBatiment    { batimentType, quantite }
//   fonderNid             { quantite } — nids secondaires vivants (colonies.js)
//   capturerColonieRivale  (aucun paramètre : nidEnnemi.capturee, infiltration.js)
//   garnirBatiment         (aucun paramètre : au moins un bâtiment occupé, buildings.js)
//   utiliserSuperarme     { quantite } — déclenchements réussis (superarme.js)
// ===========================================================

const MISSIONS = {
  1: {
    titre: 'Première galerie',
    objectifs: [
      { type: 'collecterRessource', ressource: 'nourriture', montant: 100, description: 'Récolter 100 nourriture' }
    ],
    ennemis: {},
    ressourcesDepart: { nourriture: 50, eau: 50, materiaux: 50 },
    dureeLimite: null,
    recompense: { ressource: 'materiaux', montant: 100 }
  },
  2: {
    titre: 'Récolte urgente',
    objectifs: [
      { type: 'collecterRessource', ressource: 'nourriture', montant: 400, description: 'Récolter 400 nourriture avant la fin du temps imparti' }
    ],
    ennemis: { colonie: ['ouvriere', 'ouvriere'] },
    ressourcesDepart: { nourriture: 100, eau: 100, materiaux: 100 },
    dureeLimite: 180,
    recompense: { ressource: 'nourriture', montant: 200 }
  },
  3: {
    titre: 'La colonie rivale',
    objectifs: [
      { type: 'eliminerEnnemis', description: 'Éliminer la colonie rivale' }
    ],
    ennemis: { colonie: ['fourmiRouge', 'fourmiRouge', 'fourmiRouge', 'ouvriere', 'ouvriere'] },
    ressourcesDepart: { nourriture: 200, eau: 200, materiaux: 150 },
    dureeLimite: null,
    recompense: { ressource: 'materiaux', montant: 150 }
  },
  4: {
    titre: 'Le territoire rouge',
    objectifs: [
      { type: 'eliminerEnnemis', description: "Repousser l'incursion de fourmis rouges" }
    ],
    ennemis: { colonie: ['fourmiRouge', 'fourmiRouge', 'fourmiRouge', 'fourmiRouge', 'fourmiRouge', 'fourmiRouge'] },
    ressourcesDepart: { nourriture: 250, eau: 150, materiaux: 200 },
    dureeLimite: null,
    recompense: { ressource: 'nourriture', montant: 300 }
  },
  5: {
    titre: "L'invasion des araignées",
    objectifs: [
      { type: 'eliminerEnnemis', description: 'Éliminer toutes les araignées' }
    ],
    ennemis: { sauvages: ['araignee', 'araignee', 'araignee', 'araignee'] },
    ressourcesDepart: { nourriture: 250, materiaux: 250, eau: 150 },
    dureeLimite: null,
    recompense: { ressource: 'materiaux', montant: 250 }
  },
  6: {
    titre: 'Le pont de feuilles',
    objectifs: [
      { type: 'produireUnites', quantite: 5, description: 'Produire 5 unités' },
      { type: 'survivre', duree: 120, description: 'Tenir 2 minutes' }
    ],
    ennemis: { sauvages: ['scarabee', 'scarabee', 'scarabee'] },
    ressourcesDepart: { nourriture: 200, materiaux: 150, eau: 100 },
    dureeLimite: null,
    recompense: { ressource: 'eau', montant: 200 }
  },
  7: {
    titre: 'La guerre des pucerons',
    objectifs: [
      { type: 'collecterRessource', ressource: 'nourriture', montant: 600, description: 'Récolter 600 nourriture en territoire contesté' }
    ],
    ennemis: { colonie: ['ouvriere', 'ouvriere', 'fourmiRouge'], sauvages: ['scarabee', 'scarabee'] },
    ressourcesDepart: { nourriture: 150, materiaux: 150, eau: 150 },
    dureeLimite: 300,
    recompense: { ressource: 'nourriture', montant: 400 }
  },
  8: {
    titre: 'Le laboratoire secret',
    objectifs: [
      { type: 'rechercherTechnologie', techId: 'stratPopulationI', description: 'Achever la recherche "Organisation de la colonie I"' }
    ],
    ennemis: { sauvages: ['araignee', 'araignee'] },
    ressourcesDepart: { nourriture: 300, materiaux: 400, eau: 150 },
    dureeLimite: null,
    recompense: { ressource: 'materiaux', montant: 300 }
  },
  9: {
    titre: 'La grande migration',
    objectifs: [
      { type: 'atteindrePopulation', quantite: 10, description: 'Atteindre une population de 10 fourmis' }
    ],
    ennemis: { sauvages: ['araignee', 'scarabee', 'scarabee'] },
    ressourcesDepart: { nourriture: 300, materiaux: 200, eau: 150 },
    dureeLimite: null,
    recompense: { ressource: 'nourriture', montant: 500 }
  },
  10: {
    titre: 'La guerre des reines',
    objectifs: [
      { type: 'eliminerEnnemis', description: 'Anéantir les dernières forces ennemies' }
    ],
    ennemis: {
      colonie: ['fourmiRouge', 'fourmiRouge', 'fourmiRouge', 'fourmiCharpentiere', 'fourmiCharpentiere', 'ouvriere', 'ouvriere'],
      sauvages: ['araignee', 'araignee', 'scarabee', 'scarabee']
    },
    ressourcesDepart: { nourriture: 400, materiaux: 400, eau: 200 },
    dureeLimite: null,
    recompense: { ressource: 'materiaux', montant: 1000 }
  },
  // ------------------------------------------------------------
  // Missions 11-14 — chacune force explicitement l'usage d'une des
  // mécaniques avancées introduites après la campagne d'origine
  // (jeune reine, infiltration, garnison, super-arme), qu'aucune des
  // dix premières missions ne demandait jusqu'ici.
  // ------------------------------------------------------------
  11: {
    titre: "L'expansion",
    objectifs: [
      { type: 'fonderNid', quantite: 1, description: 'Fonder un nid secondaire avec une jeune reine' },
      { type: 'collecterRessource', ressource: 'materiaux', montant: 300, description: 'Récolter 300 matériaux' }
    ],
    ennemis: { sauvages: ['scarabee', 'scarabee'] },
    ressourcesDepart: { nourriture: 300, materiaux: 250, eau: 150 },
    dureeLimite: null,
    recompense: { ressource: 'nourriture', montant: 400 }
  },
  12: {
    titre: 'Frappe chirurgicale',
    objectifs: [
      { type: 'capturerColonieRivale', description: "Infiltrer et capturer la colonie rivale plutôt que l'anéantir" }
    ],
    ennemis: { colonie: ['fourmiRouge', 'fourmiRouge', 'fourmiRouge', 'fourmiRouge', 'ouvriere', 'ouvriere'] },
    ressourcesDepart: { nourriture: 400, materiaux: 400, eau: 200 },
    dureeLimite: null,
    recompense: { ressource: 'materiaux', montant: 500 }
  },
  13: {
    titre: 'Garnison de fortune',
    objectifs: [
      { type: 'garnirBatiment', description: 'Garnir un bâtiment de production avec des unités combattantes' },
      { type: 'survivre', duree: 150, description: 'Tenir 2m30 sous les assauts répétés' }
    ],
    ennemis: {
      colonie: ['fourmiRouge', 'fourmiRouge', 'fourmiRouge', 'fourmiCharpentiere'],
      sauvages: ['araignee', 'scarabee', 'scarabee']
    },
    ressourcesDepart: { nourriture: 350, materiaux: 300, eau: 200 },
    dureeLimite: null,
    recompense: { ressource: 'eau', montant: 400 }
  },
  14: {
    titre: 'Le déluge',
    objectifs: [
      { type: 'utiliserSuperarme', quantite: 1, description: 'Déclencher la Pluie acide au moins une fois' },
      { type: 'eliminerEnnemis', description: "Achever l'invasion" }
    ],
    ennemis: {
      colonie: ['fourmiRouge', 'fourmiRouge', 'fourmiRouge', 'fourmiRouge', 'fourmiCharpentiere', 'fourmiCharpentiere', 'ouvriere', 'ouvriere'],
      sauvages: ['araignee', 'araignee', 'scarabee', 'scarabee']
    },
    // Généreux à dessein : chercher stratPopulationI → II → stratSuperarme
    // (plus le Centre de stratégie qui les porte) coûte à lui seul
    // environ 940 matériaux / 530 nourriture avant même de compter
    // l'entretien d'une armée pendant ce temps.
    ressourcesDepart: { nourriture: 750, materiaux: 950, eau: 300 },
    dureeLimite: null,
    recompense: { ressource: 'materiaux', montant: 1500 }
  }
};

// ---------------------------------------------------------
// DÉBLOCAGE — progression séquentielle : la mission 1 est toujours
// accessible, chaque suivante nécessite la précédente terminée.
// etat.missionsCompletees persiste entre les sessions (storage.js).
// ---------------------------------------------------------
function missionDebloquee(id) {
  if (id === 1) return true;
  return etat.missionsCompletees.includes(id - 1);
}

// ---------------------------------------------------------
// GÉNÉRATION DES ENNEMIS PROPRES À UNE MISSION
// ---------------------------------------------------------
function genererEnnemisMissionColonie(composition) {
  // positionnerNidEnnemi() (combat.js) fixe x/y ; capturee est remis à
  // false explicitement ici, sinon une capture d'une partie précédente
  // resterait bloquée à `true` sur ce même objet nidEnnemi réutilisé.
  positionnerNidEnnemi();
  nidEnnemi.capturee = false;
  composition.forEach((type, i) => {
    const angle = (i / composition.length) * Math.PI * 2;
    etat.unites.push(creerInstanceUnite(
      type,
      nidEnnemi.x + Math.cos(angle) * (nidEnnemi.rayon + 20),
      nidEnnemi.y + Math.sin(angle) * (nidEnnemi.rayon + 20),
      'ennemi'
    ));
  });
}

function genererEnnemisMissionSauvages(composition) {
  for (const type of composition) {
    let x, y, essais = 0;
    do {
      x = 200 + Math.random() * (etat.carte.largeur - 400);
      y = 200 + Math.random() * (etat.carte.hauteur - 400);
      essais++;
    } while (essais < 30 && distance(x, y, fourmiliere.x, fourmiliere.y) < 400);
    etat.unites.push(creerInstanceUnite(type, x, y, 'ennemi'));
  }
}

// ---------------------------------------------------------
// DÉMARRAGE D'UNE MISSION
// ---------------------------------------------------------
function demarrerMission(id) {
  const mission = MISSIONS[id];
  if (!mission) {
    console.warn('Mission inconnue :', id);
    return false;
  }
  if (!missionDebloquee(id)) {
    console.warn(`Mission ${id} verrouillée — terminez d'abord la mission ${id - 1}.`);
    return false;
  }

  nouvellePartie();
  genererTerrain();
  initialiserBrouillard();
  genererRessources();
  genererBatimentsProduction();
  // Remise à zéro explicite, même pour une mission sans colonie rivale
  // (mission.ennemis.colonie absent) : nidEnnemi est un objet unique
  // réutilisé d'une partie à l'autre, jamais recréé.
  nidEnnemi.capturee = false;
  genererObstacles();

  Object.assign(etat.ressources, mission.ressourcesDepart);

  if (mission.ennemis.colonie) genererEnnemisMissionColonie(mission.ennemis.colonie);
  if (mission.ennemis.sauvages) genererEnnemisMissionSauvages(mission.ennemis.sauvages);

  etat.missionActuelle = id;
  etat.progressionMission = {
    tempsEcoule: 0,
    unitesProduites: 0,
    superarmesUtilisees: 0,
    baselineRessources: { ...etat.ressources }
  };
  etat.resultatPartie = null;

  console.log(`Mission ${id} démarrée : ${mission.titre}`);
  return true;
}

// ---------------------------------------------------------
// ÉVALUATION D'UN OBJECTIF
// ---------------------------------------------------------
function evaluerObjectif(objectif, progression) {
  switch (objectif.type) {
    case 'collecterRessource': {
      const gagne = etat.ressources[objectif.ressource] - (progression.baselineRessources[objectif.ressource] || 0);
      return gagne >= objectif.montant;
    }
    case 'eliminerEnnemis':
      return etat.unites.filter((u) => u.faction === 'ennemi' && u.pv > 0).length === 0;
    case 'produireUnites':
      return progression.unitesProduites >= objectif.quantite;
    case 'survivre':
      return progression.tempsEcoule >= objectif.duree;
    case 'rechercherTechnologie':
      return etat.technologies.includes(objectif.techId);
    case 'atteindrePopulation':
      return etat.ressources.population >= objectif.quantite;
    case 'construireBatiment':
      return etat.batiments.filter((b) => b.type === objectif.batimentType).length >= (objectif.quantite || 1);
    case 'fonderNid':
      return etat.basesSecondaires.length >= (objectif.quantite || 1);
    case 'capturerColonieRivale':
      return nidEnnemi.capturee;
    case 'garnirBatiment':
      return etat.batiments.some((b) => TYPES_BATIMENT_PRODUCTION[b.type] && b.garnison && b.garnison.unites.length > 0);
    case 'utiliserSuperarme':
      return (progression.superarmesUtilisees || 0) >= (objectif.quantite || 1);
    default:
      return false;
  }
}

function appliquerRecompenseMission(mission) {
  if (mission.recompense && mission.recompense.ressource) {
    etat.ressources[mission.recompense.ressource] =
      (etat.ressources[mission.recompense.ressource] || 0) + mission.recompense.montant;
  }
}

// ---------------------------------------------------------
// MISE À JOUR — appelée depuis la boucle de jeu (main.js) tant
// qu'une mission est active et que la partie n'est pas terminée.
// ---------------------------------------------------------
function mettreAJourMission(delta) {
  if (!etat.missionActuelle || etat.resultatPartie) return;

  const mission = MISSIONS[etat.missionActuelle];
  const progression = etat.progressionMission;
  progression.tempsEcoule += delta;

  if (fourmiliere.pv <= 0) {
    etat.resultatPartie = 'defaite';
    jouerDefaite();
    return;
  }
  if (mission.dureeLimite && progression.tempsEcoule >= mission.dureeLimite) {
    etat.resultatPartie = 'defaite';
    jouerDefaite();
    return;
  }

  const objectifsRemplis = mission.objectifs.every((obj) => evaluerObjectif(obj, progression));
  if (objectifsRemplis) {
    appliquerRecompenseMission(mission);
    if (!etat.missionsCompletees.includes(etat.missionActuelle)) {
      etat.missionsCompletees.push(etat.missionActuelle);
    }
    etat.resultatPartie = 'victoire';
    jouerVictoire();
  }
}

// ---------------------------------------------------------
// RENDU — petit panneau d'objectifs, visible seulement en mission
// ---------------------------------------------------------
function dessinerPanneauMission() {
  if (!etat.missionActuelle) return;
  const mission = MISSIONS[etat.missionActuelle];
  const progression = etat.progressionMission;
  if (!mission || !progression) return;

  const lignes = mission.objectifs.map((obj) =>
    (evaluerObjectif(obj, progression) ? '✅ ' : '⏳ ') + (obj.description || obj.type)
  );
  if (mission.dureeLimite) {
    const restant = Math.max(0, Math.ceil(mission.dureeLimite - progression.tempsEcoule));
    lignes.push(`⏱ Temps restant : ${restant}s`);
  }

  const hauteur = 28 + lignes.length * 15;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(8, 8, 270, hauteur);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd27a';
  ctx.font = 'bold 12px Arial';
  ctx.fillText(`Mission ${etat.missionActuelle} — ${mission.titre}`, 16, 24);
  ctx.font = '11px Arial';
  ctx.fillStyle = '#f0e0c0';
  lignes.forEach((ligne, i) => ctx.fillText(ligne, 16, 40 + i * 15));
}

// ===========================================================
// COMBAT — ordres d'attaque, calcul des dégâts, gestion de la
// portée, destruction des unités à 0 PV, et la colonie rivale.
//
// Règle centrale qui empêche les unités alliées de se blesser entre
// elles : resoudreCombats() ne compare JAMAIS deux unités de la même
// faction. Les paires ne sont formées qu'entre 'joueur' et 'ennemi'.
// ===========================================================

// ---------------------------------------------------------
// ORDRE D'ATTAQUE — donné par input.js quand une unité alliée
// sélectionnée touche une unité ennemie
// ---------------------------------------------------------
function ordonnerAttaque(unite, cibleId) {
  unite.ordre = 'attaquer';
  unite.cibleId = cibleId;
}

// ---------------------------------------------------------
// DÉPLACEMENT LIBRE — la seule façon, jusqu'ici, de faire marcher une
// unité quelque part était de lui donner un ordre de récolte ou
// d'attaque : impossible de simplement la positionner sur un point du
// terrain. Sert à la fois au tap sur terrain vide avec une sélection
// active (input.js) et au point de ralliement d'un bâtiment de
// production (buildings.js → creerUnite).
// ---------------------------------------------------------
function ordonnerDeplacementLibre(unite, x, y) {
  // Un ordre de déplacement explicite doit interrompre ce que l'unité
  // faisait avant, comme dans n'importe quel RTS — sans ça, le garde-
  // fou de deplacerUnitesLibres (plus bas, qui protège le point de
  // ralliement d'un conflit avec un ordre AUTOMATIQUE en cours) annule
  // silencieusement ce déplacement dès la frame suivante dès qu'un
  // ordre de récolte/attaque/infiltration est encore actif : c'était
  // un vrai bug, trouvé à l'audit — taper "aller ici" sur une unité en
  // train de récolter ne faisait rigoureusement rien.
  if (unite.etatFondation === 'construction') {
    ajouterTexteFlottant(unite.x, unite.y - 14, 'Fondation en cours', '#e0503c');
    return;
  }
  unite.ordre = null;         // annule un ordre d'attaque OU d'infiltration en cours
  unite.cibleId = null;
  unite.fileOrdres = [];      // vide la file de récolte
  unite.etatRecolte = 'idle';
  unite.noeudCibleId = null;
  unite.etatFondation = 'idle';
  unite.fondationCible = null;

  unite.destinationLibre = { x, y };
  unite.tacheActuelle = 'En déplacement';
}

function deplacerUnitesLibres(delta) {
  for (const u of etat.unites) {
    if (u.faction !== 'joueur' || u.pv <= 0 || !u.destinationLibre) continue;

    // Tout ordre plus spécifique prend le pas et annule le
    // déplacement libre en cours plutôt que de tourner en même temps
    // que lui (deux systèmes de mouvement sur la même unité produiraient
    // un déplacement erratique).
    if (u.ordre === 'attaquer' || u.etatFondation !== 'idle' ||
        (u.ordre === 'infiltrer') || u.etatRecolte !== 'idle') {
      u.destinationLibre = null;
      continue;
    }

    const def = TYPES_UNITE[u.type];
    const d = distance(u.x, u.y, u.destinationLibre.x, u.destinationLibre.y);
    if (d <= 6) {
      u.destinationLibre = null;
      if (u.tacheActuelle === 'En déplacement') u.tacheActuelle = 'Inactive';
      continue;
    }
    const angle = Math.atan2(u.destinationLibre.y - u.y, u.destinationLibre.x - u.x);
    const pas = Math.min(def.vitesse * delta, d);
    u.x += Math.cos(angle) * pas;
    u.y += Math.sin(angle) * pas;
  }
}

// `attaquant` est optionnel : quand fourni, la cible retient qui l'a
// touchée en dernier (dernierAttaquantId), pour que nettoyerUnitesMortes()
// sache à qui créditer l'expérience si ce coup est fatal. Les dégâts
// qui ne viennent pas d'une unité (super-arme, voir superarme.js) ne
// créditent personne — c'est voulu, ce ne sont pas des kills "à l'unité".
function infligerDegats(cible, degats, attaquant) {
  cible.pv = Math.max(0, cible.pv - degats);
  if (attaquant) cible.dernierAttaquantId = attaquant.id;
  ajouterEclatCombat(cible.x, cible.y, '#ffcf6a');
}

// ---------------------------------------------------------
// VÉTÉRANCE — une unité qui accumule des kills gagne en rang, avec un
// bonus permanent de dégâts et de PV (façon Command & Conquer). Le
// bonus de PV est appliqué une fois pour toutes à la promotion (pvMax
// est directement relevé, pv soigné du même delta) plutôt que recalculé
// à la volée : plus simple, et cohérent avec l'affichage de la barre
// de vie (units.js) qui compare toujours u.pv à u.pvMax directement.
// ---------------------------------------------------------
const RANGS_VETERANCE = [
  { label: 'Recrue', seuilExperience: 0, bonusDegats: 1 },
  { label: 'Vétérane', seuilExperience: 3, bonusDegats: 1.2, bonusPv: 1.15 },
  { label: 'Élite', seuilExperience: 7, bonusDegats: 1.45, bonusPv: 1.35 }
];

function degatsEffectifs(u) {
  const def = TYPES_UNITE[u.type];
  const rang = RANGS_VETERANCE[u.rang || 0];
  return Math.round(def.degats * rang.bonusDegats);
}

function ajouterExperience(attaquant) {
  if (!attaquant || attaquant.pv <= 0) return;
  attaquant.rang = attaquant.rang || 0;
  attaquant.experience = (attaquant.experience || 0) + 1;

  const prochain = RANGS_VETERANCE[attaquant.rang + 1];
  if (!prochain || attaquant.experience < prochain.seuilExperience) return;

  const ancienPvMax = attaquant.pvMax;
  attaquant.rang++;
  attaquant.pvMax = Math.round(TYPES_UNITE[attaquant.type].pv * prochain.bonusPv);
  attaquant.pv = Math.min(attaquant.pvMax, attaquant.pv + (attaquant.pvMax - ancienPvMax));
  ajouterTexteFlottant(attaquant.x, attaquant.y - 16, prochain.label + ' !', '#ffd27a');
}

// ---------------------------------------------------------
// CAMOUFLAGE — une unité dont le type porte `camouflage: true`
// (fourmiCamouflee, units.js) est invisible aux yeux d'un adversaire
// qui n'a pas la capacité `detecteur: true` (araignée/scarabée pour
// l'instant), sauf pendant les quelques secondes qui suivent sa
// propre attaque : agir la révèle temporairement, façon "stealth"
// classique de Command & Conquer.
// ---------------------------------------------------------
const DUREE_REVELATION_CAMOUFLAGE = 4; // secondes de visibilité forcée après avoir attaqué

function estCamouflee(u) { return !!TYPES_UNITE[u.type].camouflage; }
function estDetecteur(u) { return !!TYPES_UNITE[u.type].detecteur; }

function estIndetectablePar(cible, observateur) {
  if (!estCamouflee(cible)) return false;
  if (estDetecteur(observateur)) return false;
  return cible.tempsDepuisAttaque >= DUREE_REVELATION_CAMOUFLAGE;
}

// ---------------------------------------------------------
// MISE À JOUR — appelée depuis la boucle de jeu (main.js)
// ---------------------------------------------------------
function mettreAJourCombat(delta) {
  deplacerUnitesEnAttaque(delta);
  deplacerMenacesSauvages(delta);
  deplacerInfiltratrices(delta);
  deplacerUnitesLibres(delta);
  mettreAJourRenfortsEnnemis(delta);
  refroidirCooldowns(delta);
  resoudreCombats();
  resoudreAttaquesFourmiliere();
  nettoyerUnitesMortes();
  verifierFinDePartie();
}

// Une unité avec un ordre d'attaque avance vers sa cible tant qu'elle
// n'est pas à portée. Une fois à portée, elle s'arrête : les dégâts
// sont gérés séparément par resoudreCombats() (qui s'applique aussi
// aux unités ennemies statiques, sans ordre explicite — elles se
// défendent quand on vient à leur contact).
function deplacerUnitesEnAttaque(delta) {
  for (const u of etat.unites) {
    if (u.ordre !== 'attaquer' || !u.cibleId) continue;
    const cible = etat.unites.find((c) => c.id === u.cibleId);
    if (!cible || cible.pv <= 0) {
      u.ordre = null;
      u.cibleId = null;
      continue;
    }
    const def = TYPES_UNITE[u.type];
    const d = distance(u.x, u.y, cible.x, cible.y);
    if (d > def.portee) {
      const angle = Math.atan2(cible.y - u.y, cible.x - u.x);
      const pas = Math.min(def.vitesse * delta, d - def.portee + 1);
      u.x += Math.cos(angle) * pas;
      u.y += Math.sin(angle) * pas;
    }
  }
}

function refroidirCooldowns(delta) {
  for (const u of etat.unites) {
    if (u.cooldownAttaque > 0) u.cooldownAttaque -= delta;
    // Alimente la fenêtre de révélation du camouflage (voir plus haut) —
    // incrémenté pour toutes les unités, mais seul TYPES_UNITE[u.type].camouflage
    // en tient compte ailleurs ; aucun coût à le tenir à jour pour les autres.
    u.tempsDepuisAttaque = (u.tempsDepuisAttaque || 0) + delta;
  }
}

// Toute paire (unité joueur, unité ennemie) mutuellement à portée
// échange des dégâts, chacune selon sa propre cadence. C'est la
// seule fonction qui applique des dégâts — et elle ne forme jamais
// de paire entre deux unités de la même faction. Une unité camouflée
// non détectée par l'autre (voir estIndetectablePar) ne peut ni être
// visée, ni initier elle-même une attaque : ce n'est qu'au moment où
// ELLE frappe que le camouflage tombe (voir la mise à jour de
// tempsDepuisAttaque ci-dessous).
function resoudreCombats() {
  const joueurs = etat.unites.filter((u) => u.faction === 'joueur' && u.pv > 0);
  const ennemis = etat.unites.filter((u) => u.faction === 'ennemi' && u.pv > 0);

  for (const j of joueurs) {
    const defJ = TYPES_UNITE[j.type];
    for (const e of ennemis) {
      if (e.pv <= 0) continue;
      const defE = TYPES_UNITE[e.type];
      const d = distance(j.x, j.y, e.x, e.y);

      if (d <= defJ.portee && j.cooldownAttaque <= 0 && !estIndetectablePar(e, j)) {
        infligerDegats(e, degatsEffectifs(j), j);
        j.cooldownAttaque = defJ.cadenceAttaque;
        if (estCamouflee(j)) j.tempsDepuisAttaque = 0;
      }
      if (e.pv > 0 && d <= defE.portee && e.cooldownAttaque <= 0 && !estIndetectablePar(j, e)) {
        infligerDegats(j, degatsEffectifs(e), e);
        e.cooldownAttaque = defE.cadenceAttaque;
        if (estCamouflee(e)) e.tempsDepuisAttaque = 0;
      }
    }
  }
}

// Détruit toute unité à 0 PV, libère la population si c'était une
// unité alliée, et annule l'ordre de quiconque la ciblait.
function nettoyerUnitesMortes() {
  for (let i = etat.unites.length - 1; i >= 0; i--) {
    const u = etat.unites[i];
    if (u.pv > 0) continue;

    // Crédite l'expérience à qui a porté le coup fatal, s'il est
    // toujours vivant (voir ajouterExperience, plus haut).
    if (u.dernierAttaquantId) {
      const attaquant = etat.unites.find((a) => a.id === u.dernierAttaquantId && a.pv > 0);
      if (attaquant) ajouterExperience(attaquant);
    }

    // Petit nuage de poussière à la mort — même système que les
    // éclats de combat (renderer.js), teinté brun/gris pour bien le
    // distinguer visuellement d'un simple coup porté.
    ajouterEclatCombat(u.x, u.y, 'rgba(120,105,80,0.9)');

    if (u.faction === 'joueur') {
      etat.ressources.population = Math.max(0, etat.ressources.population - 1);
    }
    for (const autre of etat.unites) {
      if (autre.cibleId === u.id) {
        autre.ordre = null;
        autre.cibleId = null;
      }
    }
    etat.unites.splice(i, 1);
  }
}

// ---------------------------------------------------------
// COLONIE RIVALE — premier ennemi présent sur la carte. Uniquement
// des types déjà existants (pas d'unité rare/spéciale à ce stade).
// `capturee` (voir infiltration.js) : une fois vraie, la colonie
// rivale change de camp visuellement et la partie est gagnée — mais
// l'objet lui-même n'est jamais recréé, juste réinitialisé à chaque
// nouvelle partie (voir genererColonieEnnemie).
// ---------------------------------------------------------
const nidEnnemi = { x: 0, y: 0, rayon: 60, capturee: false };

// Position déterministe (dépend uniquement de fourmiliere, toujours
// fixée au centre de la carte) — factorisée pour pouvoir être
// réappliquée après le chargement d'une sauvegarde (storage.js),
// puisque cette position elle-même n'a pas besoin d'être persistée.
function positionnerNidEnnemi() {
  nidEnnemi.x = clamp(fourmiliere.x + 1400, 250, etat.carte.largeur - 250);
  nidEnnemi.y = clamp(fourmiliere.y + 900, 250, etat.carte.hauteur - 250);
}

function genererColonieEnnemie() {
  positionnerNidEnnemi();
  nidEnnemi.capturee = false;

  const composition = ['fourmiRouge', 'fourmiRouge', 'fourmiRouge', 'ouvriere', 'ouvriere'];
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

function dessinerNidEnnemi(ctx) {
  const { x, y, rayon, capturee } = nidEnnemi;

  ctx.globalAlpha = 0.3;
  ctx.fillStyle = capturee ? '#20401a' : '#5a2020';
  ctx.beginPath();
  ctx.ellipse(x, y, rayon * 1.5, rayon * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const degrade = ctx.createRadialGradient(x - 12, y - 10, 4, x, y, rayon);
  degrade.addColorStop(0, ajusterCouleur(capturee ? '#1a3a1a' : '#3a1414', 30));
  degrade.addColorStop(1, capturee ? '#1a3a1a' : '#3a1414');
  ctx.fillStyle = degrade;
  activerOmbrePortee(12, 4);
  ctx.beginPath();
  ctx.ellipse(x, y, rayon, rayon * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  desactiverOmbrePortee();
  ctx.strokeStyle = '#1a0808';
  ctx.lineWidth = 3 / etat.camera.zoom;
  ctx.stroke();

  ctx.fillStyle = capturee ? '#c0f0c0' : '#f0c0c0';
  ctx.font = `${14 / etat.camera.zoom}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(capturee ? 'Nid conquis' : 'Colonie rivale', x, y - rayon - 14 / etat.camera.zoom);
}

// ---------------------------------------------------------
// RENFORTS ENNEMIS — la colonie rivale n'est plus un simple garnison
// statique posée une fois pour toutes : tant qu'elle n'est pas
// capturée (infiltration.js), elle envoie de nouvelles vagues à
// intervalle régulier, de plus en plus rapprochées et nombreuses —
// exactement le comportement d'une IA C&C qui produit en continu
// depuis sa base plutôt que de rester passive après sa garnison
// initiale. Uniquement en partie libre : les missions (missions.js)
// gèrent leur propre composition ennemie, pensée pour rester stable.
// ---------------------------------------------------------
const INTERVALLE_RENFORT_INITIAL = 45; // secondes avant la 1ère vague
const INTERVALLE_RENFORT_MIN = 20;     // plancher, jamais plus rapide que ça
const REDUCTION_INTERVALLE_PAR_VAGUE = 3;
const BASSIN_RENFORT = ['fourmiRouge', 'fourmiRouge', 'fourmiCharpentiere', 'ouvriere'];

function mettreAJourRenfortsEnnemis(delta) {
  if (etat.missionActuelle || nidEnnemi.capturee) return;

  etat.renfortEnnemi.tempsRestant -= delta;
  if (etat.renfortEnnemi.tempsRestant > 0) return;

  etat.renfortEnnemi.vagues++;
  etat.renfortEnnemi.tempsRestant = Math.max(
    INTERVALLE_RENFORT_MIN,
    INTERVALLE_RENFORT_INITIAL - etat.renfortEnnemi.vagues * REDUCTION_INTERVALLE_PAR_VAGUE
  );

  const taille = Math.min(2 + etat.renfortEnnemi.vagues, 8);
  for (let i = 0; i < taille; i++) {
    const type = BASSIN_RENFORT[Math.floor(Math.random() * BASSIN_RENFORT.length)];
    const angle = Math.random() * Math.PI * 2;
    etat.unites.push(creerInstanceUnite(
      type,
      nidEnnemi.x + Math.cos(angle) * (nidEnnemi.rayon + 20),
      nidEnnemi.y + Math.sin(angle) * (nidEnnemi.rayon + 20),
      'ennemi'
    ));
  }
  ajouterTexteFlottant(nidEnnemi.x, nidEnnemi.y - nidEnnemi.rayon - 20, `Renfort ennemi (vague ${etat.renfortEnnemi.vagues})`, '#e08a3c');
}

// ---------------------------------------------------------
// MENACES SAUVAGES — araignées et scarabées, indépendantes de la
// colonie rivale. Contrairement à celle-ci (toujours statique à ce
// stade, en attendant ai.js), elles rôdent activement : elles
// foncent sur la première unité alliée qui passe à leur portée de
// détection, et se dirigent vers la fourmilière si rien à proximité
// — c'est ce qui rend une défaite par destruction de la fourmilière
// réellement possible dès cette vague.
// ---------------------------------------------------------
const DETECTION_MENACE = 260;
const DISTANCE_MIN_NIDS = 350;

function genererMenacesSauvages() {
  const composition = ['araignee', 'araignee', 'araignee', 'scarabee', 'scarabee', 'scarabee'];
  for (const type of composition) {
    let x, y, essais = 0;
    do {
      x = 200 + Math.random() * (etat.carte.largeur - 400);
      y = 200 + Math.random() * (etat.carte.hauteur - 400);
      essais++;
    } while (
      essais < 30 &&
      (distance(x, y, fourmiliere.x, fourmiliere.y) < DISTANCE_MIN_NIDS ||
       distance(x, y, nidEnnemi.x, nidEnnemi.y) < 250)
    );
    etat.unites.push(creerInstanceUnite(type, x, y, 'ennemi'));
  }
}

function estMenaceSauvage(unite) {
  return unite.type === 'araignee' || unite.type === 'scarabee';
}

function deplacerMenacesSauvages(delta) {
  for (const c of etat.unites) {
    if (c.pv <= 0 || c.faction !== 'ennemi' || !estMenaceSauvage(c)) continue;
    const def = TYPES_UNITE[c.type];

    let cible = null, meilleureDist = DETECTION_MENACE;
    for (const j of etat.unites) {
      if (j.faction !== 'joueur' || j.pv <= 0) continue;
      const d = distance(c.x, c.y, j.x, j.y);
      if (d < meilleureDist) { meilleureDist = d; cible = j; }
    }

    // Correction : une menace sauvage sans cible détectée à proximité
    // reste sur place au lieu de foncer par défaut sur la fourmilière.
    // Avant ce correctif, les 6 menaces générées en partie libre
    // (et celles des missions) chargeaient toutes le nid dès la
    // première image de jeu — avant même que le joueur ait eu le
    // temps de produire la moindre unité —, ce qui rendait la partie
    // quasiment injouable. Une menace "sauvage" doit rester neutre
    // tant qu'elle n'est pas provoquée par une unité du joueur qui
    // s'approche.
    if (!cible) continue;

    const d = distance(c.x, c.y, cible.x, cible.y);
    if (d > def.portee) {
      const angle = Math.atan2(cible.y - c.y, cible.x - c.x);
      const pas = Math.min(def.vitesse * delta, d - def.portee + 1);
      c.x += Math.cos(angle) * pas;
      c.y += Math.sin(angle) * pas;
    }
  }
}

// ---------------------------------------------------------
// STRUCTURES DESTRUCTIBLES — fourmilière ET nids secondaires (voir
// colonies.js) : toute unité ennemie à portée de l'une ou l'autre lui
// inflige ses dégâts effectifs (bonus de vétérance inclus), exactement
// comme contre une unité (même cooldown). Un nid secondaire détruit
// est retiré, mais — contrairement à la fourmilière — ne met jamais
// fin à la partie (voir verifierFinDePartie).
// ---------------------------------------------------------
function resoudreAttaquesFourmiliere() {
  for (const u of etat.unites) {
    if (u.faction !== 'ennemi' || u.pv <= 0 || u.cooldownAttaque > 0) continue;
    const def = TYPES_UNITE[u.type];
    const degats = degatsEffectifs(u);

    if (fourmiliere.pv > 0 && distance(u.x, u.y, fourmiliere.x, fourmiliere.y) <= fourmiliere.rayon + 8) {
      fourmiliere.pv = Math.max(0, fourmiliere.pv - degats);
      u.cooldownAttaque = def.cadenceAttaque;
      continue;
    }

    for (const base of etat.basesSecondaires) {
      if (base.pv <= 0) continue;
      if (distance(u.x, u.y, base.x, base.y) <= base.rayon + 8) {
        base.pv = Math.max(0, base.pv - degats);
        u.cooldownAttaque = def.cadenceAttaque;
        break;
      }
    }
  }

  for (let i = etat.basesSecondaires.length - 1; i >= 0; i--) {
    if (etat.basesSecondaires[i].pv <= 0) {
      ajouterTexteFlottant(etat.basesSecondaires[i].x, etat.basesSecondaires[i].y, 'Nid avancé détruit', '#e0503c');
      etat.basesSecondaires.splice(i, 1);
    }
  }
}

// ---------------------------------------------------------
// VICTOIRE / DÉFAITE
// ---------------------------------------------------------
function verifierFinDePartie() {
  if (etat.resultatPartie) return;
  if (etat.missionActuelle) return; // une mission gère ses propres conditions (missions.js)

  if (fourmiliere.pv <= 0) {
    etat.resultatPartie = 'defaite';
    return;
  }
  const hostilesRestants = etat.unites.filter((u) => u.faction === 'ennemi' && u.pv > 0).length;
  if (hostilesRestants === 0) {
    etat.resultatPartie = 'victoire';
  }
}

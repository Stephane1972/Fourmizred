// ===========================================================
// INFILTRATION — l'Ouvrière infiltratrice capture la colonie rivale
// (nidEnnemi, combat.js) en s'y rendant, façon "ingénieur" de Command
// & Conquer qui capture un bâtiment ennemi en y entrant.
//
// Contrairement à un ingénieur C&C classique face à un bâtiment à PV,
// nidEnnemi n'a pas de PV ici : la capture est donc instantanée à
// l'arrivée plutôt que conditionnée à des dégâts préalables. Le
// risque, comme dans C&C, est entièrement dans le trajet :
// l'infiltratrice ne se défend jamais (degats: 0) et meurt au moindre
// contact ennemi — elle doit s'y faufiler, pas s'y frayer un chemin.
// ===========================================================

function ordonnerInfiltration(unite) {
  if (unite.type !== 'ouvriereInfiltratrice' || unite.pv <= 0 || nidEnnemi.capturee) return;
  unite.ordre = 'infiltrer';
  unite.tacheActuelle = 'Infiltration de la colonie rivale';
}

function trouverNidEnnemiSous(x, y) {
  if (nidEnnemi.capturee) return false;
  return distance(x, y, nidEnnemi.x, nidEnnemi.y) < nidEnnemi.rayon + 15;
}

// Appelée depuis mettreAJourCombat (combat.js), avant refroidirCooldowns
// pour que la capture d'un aller simple se règle avant toute résolution
// de dégâts ce tour-ci.
function deplacerInfiltratrices(delta) {
  if (nidEnnemi.capturee) return;

  for (const u of etat.unites) {
    if (u.faction !== 'joueur' || u.type !== 'ouvriereInfiltratrice' || u.pv <= 0 || u.ordre !== 'infiltrer') continue;

    const d = distance(u.x, u.y, nidEnnemi.x, nidEnnemi.y);
    if (d > nidEnnemi.rayon) {
      avancerVers(u, nidEnnemi.x, nidEnnemi.y, u.vitesse, delta, nidEnnemi.rayon);
    } else {
      capturerNidEnnemi(u);
      return; // une capture suffit ; inutile de continuer ce tour-ci
    }
  }
}

function capturerNidEnnemi(infiltratrice) {
  nidEnnemi.capturee = true;
  ajouterTexteFlottant(nidEnnemi.x, nidEnnemi.y - nidEnnemi.rayon - 14, 'Colonie rivale capturée !', '#3ae03a');
  // L'infiltratrice est absorbée par la prise de contrôle du nid,
  // exactement comme un ingénieur C&C qui disparaît en capturant le
  // bâtiment (nettoyerUnitesMortes, combat.js, la retire proprement).
  infiltratrice.pv = 0;

  // En mission, une capture est une victoire au même titre qu'un
  // objectif rempli : on applique la même récompense que
  // verifierFinMission (missions.js) l'aurait fait plutôt que de
  // court-circuiter silencieusement la mission en cours.
  if (etat.missionActuelle && !etat.resultatPartie) {
    const mission = MISSIONS[etat.missionActuelle];
    appliquerRecompenseMission(mission);
    if (!etat.missionsCompletees.includes(etat.missionActuelle)) {
      etat.missionsCompletees.push(etat.missionActuelle);
    }
  }
  etat.resultatPartie = 'victoire';
  jouerVictoire();
}

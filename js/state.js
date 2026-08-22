// ===========================================================
// STATE — état centralisé du jeu. Toute donnée qui évolue pendant
// une partie (caméra, ressources, bâtiments, unités...) vit ici,
// dans un seul objet global `etat`. Les autres modules le lisent et
// le modifient directement — pas de copie locale qui se désynchronise.
//
// La persistance (sauvegarde/chargement) est gérée par storage.js,
// qui sérialise directement les champs de cet objet (voir
// construireInstantane()/appliquerInstantane() dans ce fichier).
// ===========================================================

const CARTE_LARGEUR = 4000;
const CARTE_HAUTEUR = 3000;

const etat = {
  version: VERSION_JEU,

  carte: {
    largeur: CARTE_LARGEUR,
    hauteur: CARTE_HAUTEUR
  },

  camera: {
    x: CARTE_LARGEUR / 2,
    y: CARTE_HAUTEUR / 2,
    zoom: 1,
    zoomMin: 0.4,
    zoomMax: 2.5
  },

  // Ressources de départ — modifiées en jeu par la récolte
  // (resources.js), la production (buildings.js) et les coûts de
  // construction/recherche (defenses.js, research.js).
  ressources: {
    nourriture: 200,
    eau: 200,
    materiaux: 100,
    pheromones: 0,
    population: 0,
    populationMax: 10
  },
  batiments: [],
  unites: [],
  // Nids secondaires fondés par une Jeune reine (voir colonies.js) —
  // chacun est un point de dépôt de récolte et un objectif destructible
  // au même titre que la fourmilière, mais sa perte ne met jamais fin
  // à la partie (voir verifierFinDePartie, combat.js).
  basesSecondaires: [],
  // Super-arme "Pluie acide" (voir superarme.js), débloquée par la
  // technologie stratSuperarme (research.js). Le seul état à
  // persister est le temps de recharge restant : le déblocage
  // lui-même se déduit de etat.technologies, déjà sauvegardé.
  superarme: { cooldownRestant: 0 },
  // Renforts périodiques de la colonie rivale (voir combat.js →
  // mettreAJourRenfortsEnnemis) — n'agit qu'en partie libre (voir la
  // garde sur etat.missionActuelle), pour ne pas perturber l'équilibrage
  // fait main des missions (missions.js).
  renfortEnnemi: { tempsRestant: 45, vagues: 0 },
  missionActuelle: null,
  progressionMission: null, // { tempsEcoule, unitesProduites, baselineRessources }
  missionsCompletees: [],   // identifiants des missions terminées — persiste entre les sessions
  technologies: [],
  resultatPartie: null // null | 'victoire' | 'defaite'
};

// Réinitialise l'état à une nouvelle partie (sera appelé par
// storage.js à la vague 3 pour le bouton "Nouvelle partie").
function nouvellePartie() {
  etat.camera.x = CARTE_LARGEUR / 2;
  etat.camera.y = CARTE_HAUTEUR / 2;
  etat.camera.zoom = 1;
  etat.ressources.nourriture = 200;
  etat.ressources.eau = 200;
  etat.ressources.materiaux = 100;
  etat.ressources.pheromones = 0;
  etat.ressources.population = 0;
  etat.ressources.populationMax = 10;
  etat.batiments.length = 0;
  etat.unites.length = 0;
  etat.basesSecondaires.length = 0;
  etat.superarme.cooldownRestant = 0;
  etat.renfortEnnemi.tempsRestant = 45;
  etat.renfortEnnemi.vagues = 0;
  etat.missionActuelle = null;
  etat.progressionMission = null;
  // etat.missionsCompletees n'est volontairement PAS réinitialisé ici :
  // c'est une progression de campagne qui doit survivre à une nouvelle
  // partie standard, seule demarrerMission() (missions.js) y touche.
  etat.technologies.length = 0;
  etat.resultatPartie = null;
  // fourmiliere est défini dans renderer.js, chargé avant que cette
  // fonction ne soit réellement appelée (au démarrage, via storage.js)
  fourmiliere.pv = fourmiliere.pvMax;
}

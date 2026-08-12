// ===========================================================
// CONFIG — constantes globales, chargé en tout premier.
// ===========================================================

// -----------------------------------------------------------
// BASE_PATH : chemin de base du projet sur GitHub Pages.
//
// - Si le jeu est publié à la racine d'un domaine ou d'un compte
//   GitHub (ex: https://votre-compte.github.io/), laissez "/".
// - Si le jeu est publié comme "project site" (ex:
//   https://votre-compte.github.io/Fourmizred/), la valeur doit
//   être "/Fourmizred/" (le nom EXACT du dépôt, avec un / au
//   début ET à la fin).
//
// Cette constante est utilisée par sw.js (enregistrement et chemins
// du cache) et par main.js (enregistrement du service worker) — il
// n'y a qu'UN SEUL endroit à modifier ici pour que tout le reste
// du projet suive automatiquement.
// -----------------------------------------------------------
const BASE_PATH = "/Fourmizred/";

// Version du jeu — sert aussi à nommer le cache du service worker
// (voir sw.js). Incrémentez cette chaîne à chaque changement de
// fichiers précachés pour forcer la mise à jour du cache hors ligne.
const VERSION_JEU = "0.1.0";

// Nom affiché dans l'interface (jamais le nom d'un jeu protégé)
const NOM_JEU = "Ant Commander";
const SOUS_TITRE_JEU = "La Guerre des Colonies";

// Palette de couleurs partagée par les modules de rendu (renderer.js,
// ui.js...) dans les prochaines vagues. Centralisée ici pour éviter
// les couleurs codées en dur dispersées dans le code.
const PALETTE = {
  fond: '#16110a',
  sol: '#d9c199',
  panneauFond: 'rgba(0,0,0,0.6)',
  texte: '#f0e0c0',
  accent: '#d9a25c',
  danger: '#e0503c',
  succes: '#3ae03a'
};

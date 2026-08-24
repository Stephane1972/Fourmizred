// ===========================================================
// GROUPES DE CONTRÔLE — équivalent tactile du Ctrl+chiffre / chiffre
// de Command & Conquer. Sans clavier fiable sur mobile, l'un et
// l'autre passent par le même bouton, distingués par la durée
// d'appui (voir dessinerBarreGroupes dans ui.js pour les gestionnaires
// tactiles) :
//   - tap bref  → RAPPEL : sélectionne le groupe et centre la caméra
//   - appui long (450ms+) → ASSIGNATION : remplace le groupe par la
//     sélection actuelle
//
// Chaque groupe stocke des identifiants d'unité (u.id), pas les
// unités elles-mêmes : robuste si une unité du groupe meurt entre
// deux rappels (filtrée automatiquement), et léger à sauvegarder
// (voir storage.js).
// ===========================================================

const NOMBRE_GROUPES_CONTROLE = 5;

function assignerGroupeControle(index) {
  const selectionnees = etat.unites.filter((u) => u.faction === 'joueur' && u.pv > 0 && u.selectionnee);
  etat.groupesControle[index] = selectionnees.map((u) => u.id);
  return selectionnees.length;
}

// Sélectionne le groupe (en ne gardant que les unités encore vivantes)
// et centre la caméra sur leur position moyenne — comme le rappel
// d'un groupe de contrôle dans n'importe quel RTS.
function rappelerGroupeControle(index) {
  const ids = etat.groupesControle[index] || [];
  const vivantes = [];

  for (const u of etat.unites) {
    u.selectionnee = false;
    if (u.faction === 'joueur' && u.pv > 0 && ids.includes(u.id)) {
      u.selectionnee = true;
      vivantes.push(u);
    }
  }

  // Le groupe se nettoie tout seul des unités mortes au fil des rappels,
  // plutôt que de garder des identifiants morts indéfiniment.
  etat.groupesControle[index] = vivantes.map((u) => u.id);

  if (vivantes.length === 0) return false;

  const centreX = vivantes.reduce((s, u) => s + u.x, 0) / vivantes.length;
  const centreY = vivantes.reduce((s, u) => s + u.y, 0) / vivantes.length;
  centrerCameraSur(centreX, centreY);
  return true;
}

function groupeControleEstVide(index) {
  return !etat.groupesControle[index] || etat.groupesControle[index].length === 0;
}

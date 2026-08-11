// ===========================================================
// UTILS — petites fonctions partagées par tous les autres modules
// ===========================================================

function afficherMessage(texte) {
  const el = document.getElementById('message-jeu');
  el.textContent = texte;
  el.style.opacity = '1';
  clearTimeout(afficherMessage._t);
  afficherMessage._t = setTimeout(() => { el.style.opacity = '0'; }, 1800);
}

function milieu(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// Éclaircit (delta > 0) ou assombrit (delta < 0) une couleur hexadécimale.
// Utilisé pour donner à chaque fourmi/insecte une légère variation de
// teinte individuelle, afin d'éviter l'effet "copier-coller" quand
// plusieurs unités identiques sont regroupées à l'écran.
function ajusterCouleur(hex, delta) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  r = Math.max(0, Math.min(255, r + delta));
  g = Math.max(0, Math.min(255, g + delta));
  b = Math.max(0, Math.min(255, b + delta));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function nombreAleatoire(min, max) {
  return min + Math.random() * (max - min);
}

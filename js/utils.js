// ===========================================================
// UTILS — fonctions utilitaires génériques, indépendantes de
// l'état du jeu. Peut être utilisé par n'importe quel autre module.
// ===========================================================

function clamp(valeur, min, max) {
  return Math.max(min, Math.min(max, valeur));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function nombreAleatoire(min, max) {
  return min + Math.random() * (max - min);
}

function entierAleatoire(min, max) {
  return Math.floor(nombreAleatoire(min, max + 1));
}

function ajusterCouleur(hex, delta) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  r = clamp(r + delta, 0, 255);
  g = clamp(g + delta, 0, 255);
  b = clamp(b + delta, 0, 255);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Formate un grand nombre en chaîne lisible (ex: 12500 -> "12,5k"),
// utile pour l'affichage des ressources dans la barre d'interface.
function formaterNombre(n) {
  if (n < 1000) return String(Math.floor(n));
  if (n < 1000000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
}

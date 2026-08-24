// ===========================================================
// BROUILLARD DE GUERRE — grille de cellules à trois états, comme dans
// n'importe quel RTS classique :
//   - jamais vu      → noir opaque
//   - déjà exploré, hors de vue actuelle → voile sombre semi-transparent
//     (on se souvient du terrain, pas de ce qui s'y passe maintenant)
//   - actuellement visible → aucun voile
//
// Volontairement une grille grossière (cellules de 100 unités monde)
// plutôt qu'un calcul de ligne de vue précis : largement suffisant
// pour l'effet recherché, et bon marché à recalculer chaque frame
// même sur un téléphone d'entrée de gamme.
// ===========================================================

const TAILLE_CELLULE_BROUILLARD = 100;
const RAYON_VISION_UNITE = 160;
const RAYON_VISION_FOURMILIERE = 260;
const RAYON_VISION_BASE_SECONDAIRE = 220;
const RAYON_VISION_BATIMENT = 190;

let grilleBrouillard = null; // { largeur, hauteur, explore: Uint8Array, visible: Uint8Array }

function initialiserBrouillard() {
  const largeur = Math.ceil(etat.carte.largeur / TAILLE_CELLULE_BROUILLARD);
  const hauteur = Math.ceil(etat.carte.hauteur / TAILLE_CELLULE_BROUILLARD);
  grilleBrouillard = {
    largeur,
    hauteur,
    explore: new Uint8Array(largeur * hauteur),
    visible: new Uint8Array(largeur * hauteur)
  };
}

function revelerZone(grille, x, y, rayon) {
  const cx = Math.floor(x / TAILLE_CELLULE_BROUILLARD);
  const cy = Math.floor(y / TAILLE_CELLULE_BROUILLARD);
  const rc = Math.ceil(rayon / TAILLE_CELLULE_BROUILLARD);
  for (let gy = cy - rc; gy <= cy + rc; gy++) {
    if (gy < 0 || gy >= grille.hauteur) continue;
    for (let gx = cx - rc; gx <= cx + rc; gx++) {
      if (gx < 0 || gx >= grille.largeur) continue;
      const wx = gx * TAILLE_CELLULE_BROUILLARD + TAILLE_CELLULE_BROUILLARD / 2;
      const wy = gy * TAILLE_CELLULE_BROUILLARD + TAILLE_CELLULE_BROUILLARD / 2;
      if (distance(wx, wy, x, y) > rayon) continue;
      const idx = gy * grille.largeur + gx;
      grille.visible[idx] = 1;
      grille.explore[idx] = 1;
    }
  }
}

// Recalcule entièrement la visibilité actuelle (pas l'exploration,
// qui elle ne fait qu'augmenter) à partir de toutes les unités et
// structures alliées vivantes. Appelée chaque frame (main.js).
function mettreAJourBrouillard() {
  if (!grilleBrouillard) return;
  grilleBrouillard.visible.fill(0);

  for (const u of etat.unites) {
    if (u.faction !== 'joueur' || u.pv <= 0) continue;
    revelerZone(grilleBrouillard, u.x, u.y, RAYON_VISION_UNITE);
  }
  if (fourmiliere.pv > 0) revelerZone(grilleBrouillard, fourmiliere.x, fourmiliere.y, RAYON_VISION_FOURMILIERE);
  for (const b of etat.basesSecondaires) {
    if (b.pv > 0) revelerZone(grilleBrouillard, b.x, b.y, RAYON_VISION_BASE_SECONDAIRE);
  }
  for (const b of etat.batiments) {
    revelerZone(grilleBrouillard, b.x, b.y, RAYON_VISION_BATIMENT);
  }
}

// Petits utilitaires réutilisés ailleurs (renderer.js → minicarte) —
// une cellule hors grille est toujours considérée non explorée/non
// visible (donc masquée), jamais une erreur.
function celluleVisible(x, y) {
  if (!grilleBrouillard) return true;
  const gx = Math.floor(x / TAILLE_CELLULE_BROUILLARD);
  const gy = Math.floor(y / TAILLE_CELLULE_BROUILLARD);
  if (gx < 0 || gy < 0 || gx >= grilleBrouillard.largeur || gy >= grilleBrouillard.hauteur) return false;
  return grilleBrouillard.visible[gy * grilleBrouillard.largeur + gx] === 1;
}

function celluleExploree(x, y) {
  if (!grilleBrouillard) return true;
  const gx = Math.floor(x / TAILLE_CELLULE_BROUILLARD);
  const gy = Math.floor(y / TAILLE_CELLULE_BROUILLARD);
  if (gx < 0 || gy < 0 || gx >= grilleBrouillard.largeur || gy >= grilleBrouillard.hauteur) return false;
  return grilleBrouillard.explore[gy * grilleBrouillard.largeur + gx] === 1;
}

// Ne dessine que les cellules de la zone actuellement à l'écran (+
// une petite marge), jamais la grille entière — le coût reste
// constant quel que soit la taille de la carte.
function dessinerBrouillard(ctx) {
  if (!grilleBrouillard) return;
  const zone = zoneVisibleMonde(TAILLE_CELLULE_BROUILLARD);
  const gx1 = Math.max(0, Math.floor(zone.x1 / TAILLE_CELLULE_BROUILLARD));
  const gx2 = Math.min(grilleBrouillard.largeur - 1, Math.ceil(zone.x2 / TAILLE_CELLULE_BROUILLARD));
  const gy1 = Math.max(0, Math.floor(zone.y1 / TAILLE_CELLULE_BROUILLARD));
  const gy2 = Math.min(grilleBrouillard.hauteur - 1, Math.ceil(zone.y2 / TAILLE_CELLULE_BROUILLARD));

  for (let gy = gy1; gy <= gy2; gy++) {
    for (let gx = gx1; gx <= gx2; gx++) {
      const idx = gy * grilleBrouillard.largeur + gx;
      if (grilleBrouillard.visible[idx]) continue;
      ctx.fillStyle = grilleBrouillard.explore[idx] ? 'rgba(8,7,4,0.86)' : 'rgba(4,3,2,0.97)';
      ctx.fillRect(
        gx * TAILLE_CELLULE_BROUILLARD, gy * TAILLE_CELLULE_BROUILLARD,
        TAILLE_CELLULE_BROUILLARD + 1, TAILLE_CELLULE_BROUILLARD + 1 // +1 : évite un liseré entre cellules au rendu
      );
    }
  }
}

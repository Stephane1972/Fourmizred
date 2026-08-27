// ===========================================================
// SUPERARME — "Pluie acide", frappe dévastatrice à zone débloquée par
// la technologie stratSuperarme (research.js), façon super-arme de
// Command & Conquer (Ion Cannon / Nuke) : long temps de recharge,
// ciblage manuel sur la carte, dégâts de zone à toute unité ennemie
// prise dans le rayon d'effet.
//
// Le déblocage se lit directement dans etat.technologies (déjà
// sauvegardé par storage.js) ; seul le temps de recharge restant
// (etat.superarme.cooldownRestant, voir state.js) a besoin d'être
// persisté séparément.
// ===========================================================

const SUPERARME_COOLDOWN = 90; // secondes
const SUPERARME_RAYON = 150;
const SUPERARME_DEGATS = 90;

// ---------------------------------------------------------
// MODE DE CIBLAGE — armé depuis le panneau "Recherche" (ui.js), même
// principe que modeCiblageFondation (colonies.js) et les modes de
// placement de defenses.js/research.js : mutuellement exclusif avec
// eux, un tap sur la carte le consomme (voir input.js).
// ---------------------------------------------------------
let modeCiblageSuperarme = false;

function superarmeDebloquee() {
  return technologieDejaAcquise('stratSuperarme');
}

function activerCiblageSuperarme() {
  if (!superarmeDebloquee() || etat.superarme.cooldownRestant > 0) return;
  modeCiblageSuperarme = true;
  modePlacementDefense = null;
  modePlacementLaboratoire = null;
  modePlacementBatimentProduction = null;
  modeCiblageFondation = false;
  modeCiblageRalliement = null;
  modeDemolition = false;
}

// Déclenche réellement la frappe sur un point de la carte. Retourne
// false sans rien faire si la super-arme n'est pas prête (verrou de
// sécurité en plus du contrôle déjà fait par activerCiblageSuperarme,
// au cas où le cooldown se terminerait entre l'armement et le tap).
function declencherSuperarme(x, y) {
  if (!superarmeDebloquee() || etat.superarme.cooldownRestant > 0) return false;

  const cibleX = clamp(x, 0, etat.carte.largeur);
  const cibleY = clamp(y, 0, etat.carte.hauteur);

  let touches = 0;
  for (const u of etat.unites) {
    if (u.faction !== 'ennemi' || u.pv <= 0) continue;
    if (distance(u.x, u.y, cibleX, cibleY) <= SUPERARME_RAYON) {
      infligerDegats(u, SUPERARME_DEGATS);
      touches++;
    }
  }

  etat.superarme.cooldownRestant = SUPERARME_COOLDOWN;
  effetsSuperarme.push({ x: cibleX, y: cibleY, age: 0 });
  jouerSuperarme();
  if (etat.progressionMission) {
    etat.progressionMission.superarmesUtilisees = (etat.progressionMission.superarmesUtilisees || 0) + 1;
  }
  // Pluie de gouttes acides — une vingtaine de traits qui tombent à
  // des positions/vitesses/décalages aléatoires dans le rayon
  // d'effet, en plus du cercle d'onde de choc ci-dessus.
  for (let i = 0; i < 22; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rayon = Math.random() * SUPERARME_RAYON * 0.9;
    gouttesSuperarme.push({
      x: cibleX + Math.cos(angle) * rayon,
      y: cibleY + Math.sin(angle) * rayon,
      retard: Math.random() * 0.5,
      age: 0
    });
  }
  ajouterTexteFlottant(
    cibleX, cibleY - SUPERARME_RAYON - 10,
    touches > 0 ? `Pluie acide : ${touches} touché(s)` : 'Pluie acide',
    '#8aff5a'
  );
  return true;
}

// Décompte le temps de recharge — appelée depuis la boucle de jeu
// (main.js), comme les autres minuteries du jeu.
function mettreAJourSuperarme(delta) {
  if (etat.superarme.cooldownRestant > 0) {
    etat.superarme.cooldownRestant = Math.max(0, etat.superarme.cooldownRestant - delta);
  }
}

// ---------------------------------------------------------
// RENDU — un cercle qui se dilate et s'estompe à l'impact
// ---------------------------------------------------------
const effetsSuperarme = [];
const DUREE_EFFET_SUPERARME = 0.8;
// Gouttes de la pluie acide (déclenchées dans declencherSuperarme,
// plus haut) — chacune tombe verticalement à l'écran (repère monde)
// avec un léger retard aléatoire pour un effet d'averse, pas d'une
// simple ligne de pluie synchronisée.
const gouttesSuperarme = [];
const DUREE_CHUTE_GOUTTE = 0.5;
const HAUTEUR_CHUTE_GOUTTE = 40;

function dessinerEffetsSuperarme(ctx, delta) {
  for (let i = effetsSuperarme.length - 1; i >= 0; i--) {
    const e = effetsSuperarme[i];
    e.age += delta;
    if (e.age >= DUREE_EFFET_SUPERARME) { effetsSuperarme.splice(i, 1); continue; }

    const t = e.age / DUREE_EFFET_SUPERARME;
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = '#8aff5a';
    ctx.lineWidth = 3 / etat.camera.zoom;
    ctx.beginPath();
    ctx.arc(e.x, e.y, SUPERARME_RAYON * (0.4 + t * 0.6), 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(138,255,90,0.12)';
    ctx.beginPath();
    ctx.arc(e.x, e.y, SUPERARME_RAYON, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (let i = gouttesSuperarme.length - 1; i >= 0; i--) {
    const g = gouttesSuperarme[i];
    if (g.retard > 0) { g.retard -= delta; continue; }
    g.age += delta;
    if (g.age >= DUREE_CHUTE_GOUTTE) { gouttesSuperarme.splice(i, 1); continue; }

    const t = g.age / DUREE_CHUTE_GOUTTE;
    const y = g.y - HAUTEUR_CHUTE_GOUTTE * (1 - t);
    ctx.globalAlpha = 0.75 * (1 - t * 0.4);
    ctx.strokeStyle = '#a8ff7a';
    ctx.lineWidth = 1.5 / etat.camera.zoom;
    ctx.beginPath();
    ctx.moveTo(g.x, y);
    ctx.lineTo(g.x, y + 7 / etat.camera.zoom);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ===========================================================
// COLONIES — fondation de nouveaux nids par la Jeune reine, unité
// mobile façon "MCV" (Command & Conquer) : elle voyage jusqu'au site
// choisi par le joueur puis s'y déploie pour devenir un second point
// d'ancrage de la colonie.
//
// Les nids secondaires (etat.basesSecondaires) sont des points de
// dépôt de récolte et des objectifs destructibles au même titre que
// la fourmilière principale (voir combat.js → resoudreAttaquesFourmiliere),
// mais leur perte ne met jamais fin à la partie : seule la
// destruction de la fourmilière d'origine le peut (voir
// verifierFinDePartie, combat.js) — étendre son territoire est donc
// un pari offensif, pas un point de défaite supplémentaire.
// ===========================================================

const DUREE_FONDATION = 12;          // secondes de "construction" une fois sur site
const RAYON_ARRIVEE_FONDATION = 20;
const RAYON_BASE_SECONDAIRE = 55;
const PV_BASE_SECONDAIRE = 250;
// Distance minimale à respecter par rapport à TOUTE base existante
// (fourmilière, nid secondaire ou colonie ennemie) pour qu'un site de
// fondation soit valide — évite de fonder un nid collé à un autre.
const DISTANCE_MIN_FONDATION = 300;

let prochainIdBase = 1;

// ---------------------------------------------------------
// MODE DE CIBLAGE — armé depuis le panneau "Partie" (ui.js), même
// principe que les modes de placement de defenses.js/research.js :
// mutuellement exclusif avec eux, un tap sur la carte le consomme
// (voir input.js).
// ---------------------------------------------------------
let modeCiblageFondation = false;

function activerCiblageFondation() {
  modeCiblageFondation = true;
  modePlacementDefense = null;
  modePlacementLaboratoire = null;
  modePlacementBatimentProduction = null;
  modeCiblageSuperarme = false;
  modeCiblageRalliement = null;
  modeDemolition = false;
}

function toutesBasesAlliees() {
  const bases = [fourmiliere];
  for (const b of etat.basesSecondaires) {
    if (b.pv > 0) bases.push(b);
  }
  return bases;
}

// Base alliée (fourmilière ou nid secondaire encore en vie) la plus
// proche d'un point donné — utilisée par resources.js pour le retour
// de récolte, désormais qu'il peut exister plus d'un nid.
function trouverBaseAllieeProche(x, y) {
  let meilleure = fourmiliere, meilleureDistance = Infinity;
  for (const b of toutesBasesAlliees()) {
    const d = distance(x, y, b.x, b.y);
    if (d < meilleureDistance) { meilleureDistance = d; meilleure = b; }
  }
  return meilleure;
}

function siteFondationValide(x, y) {
  for (const b of toutesBasesAlliees()) {
    if (distance(x, y, b.x, b.y) < DISTANCE_MIN_FONDATION) return false;
  }
  if (distance(x, y, nidEnnemi.x, nidEnnemi.y) < DISTANCE_MIN_FONDATION) return false;
  return true;
}

// Donne l'ordre de fondation à toutes les jeunes reines actuellement
// sélectionnées et inactives (pas déjà en route ou en construction).
// Retourne le nombre d'unités effectivement commandées.
function ordonnerFondationPourSelection(x, y) {
  const cibleX = clamp(x, 100, etat.carte.largeur - 100);
  const cibleY = clamp(y, 100, etat.carte.hauteur - 100);

  if (!siteFondationValide(cibleX, cibleY)) {
    ajouterTexteFlottant(cibleX, cibleY, 'Trop près d\'un autre nid', '#e0503c');
    return 0;
  }

  const candidates = etat.unites.filter((u) =>
    u.faction === 'joueur' && u.type === 'jeuneReine' && u.pv > 0 &&
    u.etatFondation === 'idle' && u.selectionnee
  );
  for (const u of candidates) {
    u.fondationCible = { x: cibleX, y: cibleY };
    u.etatFondation = 'enRoute';
    u.tacheActuelle = 'En route pour fonder un nid';
  }
  if (candidates.length > 0) ajouterRetourTactile(cibleX, cibleY);
  return candidates.length;
}

// ---------------------------------------------------------
// MISE À JOUR — trajet vers le site choisi, puis décompte de
// construction, puis naissance du nouveau nid. Appelée depuis la
// boucle de jeu (main.js).
// ---------------------------------------------------------
function mettreAJourFondation(delta) {
  for (let i = etat.unites.length - 1; i >= 0; i--) {
    const u = etat.unites[i];
    if (u.faction !== 'joueur' || u.type !== 'jeuneReine' || u.pv <= 0) continue;

    if (u.etatFondation === 'enRoute' && u.fondationCible) {
      const d = distance(u.x, u.y, u.fondationCible.x, u.fondationCible.y);
      if (d > RAYON_ARRIVEE_FONDATION) {
        avancerVers(u, u.fondationCible.x, u.fondationCible.y, u.vitesse, delta, RAYON_ARRIVEE_FONDATION);
      } else {
        u.etatFondation = 'construction';
        u.minuteurFondation = DUREE_FONDATION;
        u.tacheActuelle = 'Fondation du nid en cours';
      }
    } else if (u.etatFondation === 'construction') {
      u.minuteurFondation -= delta;
      if (u.minuteurFondation <= 0) {
        etat.basesSecondaires.push({
          id: prochainIdBase++,
          x: u.x, y: u.y,
          rayon: RAYON_BASE_SECONDAIRE,
          pv: PV_BASE_SECONDAIRE,
          pvMax: PV_BASE_SECONDAIRE
        });
        ajouterTexteFlottant(u.x, u.y - RAYON_BASE_SECONDAIRE - 10, 'Nouveau nid fondé !', '#3ae03a');
        // La jeune reine devient le nid : elle est consommée à la
        // fondation, exactement comme un MCV qui se déploie en base.
        etat.ressources.population = Math.max(0, etat.ressources.population - 1);
        etat.unites.splice(i, 1);
      }
    }
  }
}

// ---------------------------------------------------------
// RENDU
// ---------------------------------------------------------
function dessinerBaseSecondaire(ctx, b) {
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#5a4020';
  ctx.beginPath();
  ctx.ellipse(b.x, b.y, b.rayon * 1.6, b.rayon * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const degrade = ctx.createRadialGradient(b.x - 12, b.y - 10, 4, b.x, b.y, b.rayon);
  degrade.addColorStop(0, ajusterCouleur('#4a3018', 30));
  degrade.addColorStop(1, '#4a3018');
  ctx.fillStyle = degrade;
  activerOmbrePortee(12, 4);
  ctx.beginPath();
  ctx.ellipse(b.x, b.y, b.rayon, b.rayon * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  desactiverOmbrePortee();
  ctx.strokeStyle = '#241a10';
  ctx.lineWidth = 2.5 / etat.camera.zoom;
  ctx.stroke();

  ctx.fillStyle = '#f0e0c0';
  ctx.font = `${12 / etat.camera.zoom}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('Nid avancé', b.x, b.y - b.rayon - 10 / etat.camera.zoom);

  if (b.pv < b.pvMax) {
    const largeur = b.rayon * 1.3;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(b.x - largeur / 2, b.y + b.rayon + 6 / etat.camera.zoom, largeur, 5 / etat.camera.zoom);
    ctx.fillStyle = b.pv / b.pvMax > 0.3 ? '#3ae03a' : '#e0503c';
    ctx.fillRect(b.x - largeur / 2, b.y + b.rayon + 6 / etat.camera.zoom, largeur * (b.pv / b.pvMax), 5 / etat.camera.zoom);
  }
}

function dessinerBasesSecondaires(ctx) {
  const zone = zoneVisibleMonde(80);
  for (const b of etat.basesSecondaires) {
    if (b.x < zone.x1 || b.x > zone.x2 || b.y < zone.y1 || b.y > zone.y2) continue;
    dessinerBaseSecondaire(ctx, b);
  }
}

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

function infligerDegats(cible, degats) {
  cible.pv = Math.max(0, cible.pv - degats);
}

// ---------------------------------------------------------
// MISE À JOUR — appelée depuis la boucle de jeu (main.js)
// ---------------------------------------------------------
function mettreAJourCombat(delta) {
  deplacerUnitesEnAttaque(delta);
  refroidirCooldowns(delta);
  resoudreCombats();
  nettoyerUnitesMortes();
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
  }
}

// Toute paire (unité joueur, unité ennemie) mutuellement à portée
// échange des dégâts, chacune selon sa propre cadence. C'est la
// seule fonction qui applique des dégâts — et elle ne forme jamais
// de paire entre deux unités de la même faction.
function resoudreCombats() {
  const joueurs = etat.unites.filter((u) => u.faction === 'joueur' && u.pv > 0);
  const ennemis = etat.unites.filter((u) => u.faction === 'ennemi' && u.pv > 0);

  for (const j of joueurs) {
    const defJ = TYPES_UNITE[j.type];
    for (const e of ennemis) {
      if (e.pv <= 0) continue;
      const defE = TYPES_UNITE[e.type];
      const d = distance(j.x, j.y, e.x, e.y);

      if (d <= defJ.portee && j.cooldownAttaque <= 0) {
        infligerDegats(e, defJ.degats);
        j.cooldownAttaque = defJ.cadenceAttaque;
      }
      if (e.pv > 0 && d <= defE.portee && e.cooldownAttaque <= 0) {
        infligerDegats(j, defE.degats);
        e.cooldownAttaque = defE.cadenceAttaque;
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
// ---------------------------------------------------------
const nidEnnemi = { x: 0, y: 0, rayon: 60 };

function genererColonieEnnemie() {
  nidEnnemi.x = clamp(fourmiliere.x + 1400, 250, etat.carte.largeur - 250);
  nidEnnemi.y = clamp(fourmiliere.y + 900, 250, etat.carte.hauteur - 250);

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
  const { x, y, rayon } = nidEnnemi;

  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#5a2020';
  ctx.beginPath();
  ctx.ellipse(x, y, rayon * 1.5, rayon * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const degrade = ctx.createRadialGradient(x - 12, y - 10, 4, x, y, rayon);
  degrade.addColorStop(0, ajusterCouleur('#3a1414', 30));
  degrade.addColorStop(1, '#3a1414');
  ctx.fillStyle = degrade;
  ctx.beginPath();
  ctx.ellipse(x, y, rayon, rayon * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a0808';
  ctx.lineWidth = 3 / etat.camera.zoom;
  ctx.stroke();

  ctx.fillStyle = '#f0c0c0';
  ctx.font = `${14 / etat.camera.zoom}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('Colonie rivale', x, y - rayon - 14 / etat.camera.zoom);
}

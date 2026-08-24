// ===========================================================
// RENDERER — génère et dessine la scène : terrain, fourmilière,
// bâtiments, unités, effets de combat, retours tactiles, panneaux de
// mission et de fin de partie. Piloté par la caméra (camera.js) et
// le temps (main.js). La surcouche de diagnostic (dessinerSurcoucheDebug,
// plus bas) est masquée par défaut depuis la vague 13 — la vraie
// barre de ressources visible par le joueur est dans js/ui.js.
// ===========================================================

// ---------------------------------------------------------
// MINICARTE — coin haut-droit de l'écran, dans l'espace déjà réservé
// par la barre de ressources HTML (voir menu.css). Vue d'ensemble
// figée (pas de tap dessus pour l'instant) : fourmilière, nids
// secondaires, colonie rivale et toutes les unités vivantes, plus le
// rectangle de la zone actuellement visible par la caméra.
// ---------------------------------------------------------
const LARGEUR_MINICARTE = 76;
const HAUTEUR_MINICARTE = 52;

function dessinerMinicarte() {
  const marge = 10;
  const mx = canvas.width - LARGEUR_MINICARTE - marge;
  const my = marge + 34; // sous le bouton plein écran / la barre de ressources

  const echelleX = LARGEUR_MINICARTE / etat.carte.largeur;
  const echelleY = HAUTEUR_MINICARTE / etat.carte.hauteur;
  const versMinicarte = (x, y) => [mx + x * echelleX, my + y * echelleY];

  ctx.fillStyle = 'rgba(10,8,4,0.68)';
  ctx.strokeStyle = 'rgba(217,162,92,0.55)';
  ctx.lineWidth = 1;
  ctx.fillRect(mx, my, LARGEUR_MINICARTE, HAUTEUR_MINICARTE);
  ctx.strokeRect(mx, my, LARGEUR_MINICARTE, HAUTEUR_MINICARTE);

  ctx.save();
  ctx.beginPath();
  ctx.rect(mx, my, LARGEUR_MINICARTE, HAUTEUR_MINICARTE);
  ctx.clip();

  // Unités — un pixel chacune, colorées par camp. Les ennemies ne
  // s'affichent que dans une cellule actuellement visible (voir
  // brouillard.js) : la minicarte ne doit pas trahir leur position
  // une fois hors de vue, sinon le brouillard de guerre ne sert à rien.
  for (const u of etat.unites) {
    if (u.pv <= 0) continue;
    if (u.faction === 'ennemi' && !celluleVisible(u.x, u.y)) continue;
    const [ux, uy] = versMinicarte(u.x, u.y);
    ctx.fillStyle = u.faction === 'joueur' ? 'rgba(130,205,255,0.9)' : 'rgba(224,80,60,0.75)';
    ctx.fillRect(ux - 0.5, uy - 0.5, 1.2, 1.2);
  }

  // Nids secondaires
  ctx.fillStyle = '#e0b84a';
  for (const b of etat.basesSecondaires) {
    if (b.pv <= 0) continue;
    const [bx, by] = versMinicarte(b.x, b.y);
    ctx.beginPath();
    ctx.arc(bx, by, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fourmilière
  const [fx, fy] = versMinicarte(fourmiliere.x, fourmiliere.y);
  ctx.fillStyle = '#3ae03a';
  ctx.beginPath();
  ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Colonie rivale — verte si capturée, comme sur la carte principale.
  // N'apparaît qu'une fois explorée : sa position ne doit pas être un
  // cadeau gratuit avant d'avoir vraiment envoyé une unité par là-bas.
  if (celluleExploree(nidEnnemi.x, nidEnnemi.y)) {
    const [nx, ny] = versMinicarte(nidEnnemi.x, nidEnnemi.y);
    ctx.fillStyle = nidEnnemi.capturee ? '#3ae03a' : '#e0503c';
    ctx.beginPath();
    ctx.arc(nx, ny, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rectangle de la zone actuellement visible par la caméra
  const zone = zoneVisibleMonde(0);
  const [zx1, zy1] = versMinicarte(clamp(zone.x1, 0, etat.carte.largeur), clamp(zone.y1, 0, etat.carte.hauteur));
  const [zx2, zy2] = versMinicarte(clamp(zone.x2, 0, etat.carte.largeur), clamp(zone.y2, 0, etat.carte.hauteur));
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1;
  ctx.strokeRect(zx1, zy1, Math.max(2, zx2 - zx1), Math.max(2, zy2 - zy1));

  ctx.restore();
}

// Rectangle de sélection en cours de glissement (voir input.js →
// rectangleSelection, coordonnées écran) — un simple cadre semi-
// transparent, dessiné tout en haut du rendu puisqu'il est en repère
// écran, indépendant de la caméra/du zoom.
function dessinerRectangleSelection() {
  if (!rectangleSelection) return;
  const x = Math.min(rectangleSelection.x1, rectangleSelection.x2);
  const y = Math.min(rectangleSelection.y1, rectangleSelection.y2);
  const largeur = Math.abs(rectangleSelection.x2 - rectangleSelection.x1);
  const hauteur = Math.abs(rectangleSelection.y2 - rectangleSelection.y1);

  ctx.fillStyle = 'rgba(58, 224, 58, 0.14)';
  ctx.fillRect(x, y, largeur, hauteur);
  ctx.strokeStyle = 'rgba(58, 224, 58, 0.85)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, largeur, hauteur);
}

// ---------------------------------------------------------
// OMBRE PORTÉE PARTAGÉE — petit helper réutilisé par tous les
// dessinateurs de structures (fourmilière ci-dessous, mais aussi
// buildings.js, defenses.js, research.js, resources.js, colonies.js,
// combat.js → nid ennemi) pour un rendu cohérent sans dupliquer les
// mêmes 3 lignes partout.
// ---------------------------------------------------------
function activerOmbrePortee(blur = 12, decalageY = 4) {
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = blur / etat.camera.zoom;
  ctx.shadowOffsetY = decalageY / etat.camera.zoom;
}

function desactiverOmbrePortee() {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

// ---------------------------------------------------------
// ÉCLATS DE COMBAT — petit flash lumineux à l'impact de chaque coup
// porté (voir combat.js → infligerDegats), en plus des textes
// flottants de dégâts. Volontairement bref et discret pour rester
// lisible même avec plusieurs combats simultanés.
// ---------------------------------------------------------
const eclatsCombat = [];
const DUREE_ECLAT_COMBAT = 0.22;

function ajouterEclatCombat(x, y, couleur) {
  eclatsCombat.push({ x, y, couleur, age: 0 });
}

function mettreAJourEtDessinerEclatsCombat(ctx, delta) {
  for (let i = eclatsCombat.length - 1; i >= 0; i--) {
    const e = eclatsCombat[i];
    e.age += delta;
    if (e.age >= DUREE_ECLAT_COMBAT) { eclatsCombat.splice(i, 1); continue; }

    const t = e.age / DUREE_ECLAT_COMBAT;
    const rayon = (5 + t * 9) / etat.camera.zoom;
    const degrade = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, rayon);
    degrade.addColorStop(0, e.couleur);
    degrade.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = (1 - t) * 0.75;
    ctx.fillStyle = degrade;
    ctx.beginPath();
    ctx.arc(e.x, e.y, rayon, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------
// CYCLE JOUR/NUIT — voile bleuté progressif par-dessus toute la
// scène (terrain, unités, structures compris), qui va et vient très
// lentement pour ne jamais gêner la lisibilité du jeu (opacité
// plafonnée à 0.4 en pleine "nuit"). Purement décoratif : aucune
// unité ne se comporte différemment selon l'heure.
// ---------------------------------------------------------
const DUREE_CYCLE_JOUR = 300; // secondes pour un cycle jour → nuit → jour complet

function dessinerEclairageJourNuit(temps) {
  // 0 = nuit profonde, 1 = plein midi
  const cycle = (Math.sin((temps.total / DUREE_CYCLE_JOUR) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
  const opaciteNuit = (1 - cycle) * 0.4;
  if (opaciteNuit <= 0.01) return;
  ctx.fillStyle = `rgba(12,18,48,${opaciteNuit})`;
  ctx.fillRect(0, 0, etat.carte.largeur, etat.carte.hauteur);
}

// ---------------------------------------------------------
// TERRAIN — généré une seule fois au chargement, sur toute la carte.
// Le rendu, lui, ne dessine que ce qui est visible (voir rendreScene).
// ---------------------------------------------------------
const tachesTerrain = [];
const caillouxTerrain = [];
const brindillesTerrain = [];
const touffesHerbeTerrain = [];
const fleursTerrain = [];
// Poussière/pollen ambiants — purement décoratifs, dérivent lentement
// sur tout l'écran (coordonnées écran, pas monde) pour donner une
// impression d'air vivant sans rien coûter en gameplay.
const particulesAmbiantes = [];
for (let i = 0; i < 46; i++) {
  particulesAmbiantes.push({
    x: Math.random(),
    y: Math.random(),
    taille: 0.6 + Math.random() * 1.6,
    derive: 4 + Math.random() * 10,
    phase: Math.random() * Math.PI * 2,
    opaciteBase: 0.12 + Math.random() * 0.18
  });
}

function genererTerrain() {
  const { largeur, hauteur } = etat.carte;

  // Deux couches de taches de sol : une large et douce, une petite
  // et plus contrastée par-dessus, pour un effet de profondeur.
  const densite = (largeur * hauteur) / (3000 * 2000); // adapte la quantité à la taille réelle de la carte
  for (let i = 0; i < 55 * densite; i++) {
    tachesTerrain.push({
      x: Math.random() * largeur,
      y: Math.random() * hauteur,
      rayon: 35 + Math.random() * 70,
      couleur: Math.random() > 0.5 ? '#c9ab7c' : '#e0c69a',
      opacite: 0.35 + Math.random() * 0.25
    });
  }
  for (let i = 0; i < 90 * densite; i++) {
    tachesTerrain.push({
      x: Math.random() * largeur,
      y: Math.random() * hauteur,
      rayon: 8 + Math.random() * 22,
      couleur: Math.random() > 0.5 ? '#b89568' : '#ecd7ab',
      opacite: 0.5 + Math.random() * 0.3
    });
  }

  for (let i = 0; i < 140 * densite; i++) {
    caillouxTerrain.push({
      x: Math.random() * largeur,
      y: Math.random() * hauteur,
      rayon: 1.5 + Math.random() * 2.5,
      couleur: Math.random() > 0.5 ? '#8a7355' : '#a89070'
    });
  }

  for (let i = 0; i < 200 * densite; i++) {
    brindillesTerrain.push({
      x: Math.random() * largeur,
      y: Math.random() * hauteur,
      hauteur: 4 + Math.random() * 5,
      angle: nombreAleatoire(-0.5, 0.5)
    });
  }

  // Touffes d'herbe — 3 brins courts par touffe, légèrement balancés
  // au fil du temps (voir rendreScene) pour donner un environnement
  // qui respire, pas juste un décor figé.
  for (let i = 0; i < 70 * densite; i++) {
    touffesHerbeTerrain.push({
      x: Math.random() * largeur,
      y: Math.random() * hauteur,
      hauteur: 6 + Math.random() * 6,
      couleur: Math.random() > 0.5 ? '#5c7a3a' : '#4a6830',
      phase: Math.random() * Math.PI * 2
    });
  }

  // Petites fleurs sauvages — très éparses, juste assez pour égayer
  // sans distraire du gameplay.
  const couleursFleurs = ['#f0d8e8', '#f5e08a', '#e8e8e8'];
  for (let i = 0; i < 16 * densite; i++) {
    fleursTerrain.push({
      x: Math.random() * largeur,
      y: Math.random() * hauteur,
      rayon: 2 + Math.random() * 1.5,
      couleur: couleursFleurs[Math.floor(Math.random() * couleursFleurs.length)]
    });
  }
}

// ---------------------------------------------------------
// FOURMILIÈRE — cœur de la colonie, au centre de la carte. Possède
// désormais des PV : sa destruction entraîne la défaite (voir
// combat.js → verifierFinDePartie).
// ---------------------------------------------------------
const fourmiliere = {
  x: etat.carte.largeur / 2,
  y: etat.carte.hauteur / 2,
  rayon: 70,
  pv: 500,
  pvMax: 500
};

function dessinerFourmiliere(ctx, temps) {
  const { x, y, rayon } = fourmiliere;

  // Chemin de terre battue tout autour, façon zone piétinée
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#b89568';
  ctx.beginPath();
  ctx.ellipse(x, y, rayon * 1.7, rayon * 1.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Légère respiration animée (démontre le système de temps : la
  // fourmilière "vit" même sans aucune unité ni bâtiment encore actifs)
  const respiration = Math.sin(temps.total * 1.2) * 3;

  const degrade = ctx.createRadialGradient(x - 15, y - 12, 4, x, y, rayon + respiration);
  degrade.addColorStop(0, ajusterCouleur('#3a2818', 35));
  degrade.addColorStop(1, '#3a2818');
  ctx.fillStyle = degrade;
  activerOmbrePortee(14, 5);
  ctx.beginPath();
  ctx.ellipse(x, y, rayon + respiration, (rayon + respiration) * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  desactiverOmbrePortee();
  ctx.strokeStyle = '#241a10';
  ctx.lineWidth = 3 / etat.camera.zoom;
  ctx.stroke();

  ctx.fillStyle = '#f0e0c0';
  ctx.font = `${14 / etat.camera.zoom}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('Fourmilière', x, y - rayon - 14 / etat.camera.zoom);

  // Barre de vie, affichée seulement une fois blessée
  if (fourmiliere.pv < fourmiliere.pvMax) {
    const largeur = rayon * 1.3;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - largeur / 2, y + rayon + 6 / etat.camera.zoom, largeur, 5 / etat.camera.zoom);
    ctx.fillStyle = fourmiliere.pv / fourmiliere.pvMax > 0.3 ? '#3ae03a' : '#e0503c';
    ctx.fillRect(x - largeur / 2, y + rayon + 6 / etat.camera.zoom, largeur * (fourmiliere.pv / fourmiliere.pvMax), 5 / etat.camera.zoom);
  }
}

// ---------------------------------------------------------
// TEXTES FLOTTANTS — retour visuel de collecte ("+20" qui monte et
// s'estompe). Réutilisable par n'importe quel système du jeu.
// ---------------------------------------------------------
const textesFlottants = [];
const DUREE_TEXTE_FLOTTANT = 0.9; // secondes

function ajouterTexteFlottant(x, y, texte, couleur) {
  textesFlottants.push({ x, y, texte, couleur, age: 0 });
}

function mettreAJourEtDessinerTextesFlottants(ctx, delta) {
  for (let i = textesFlottants.length - 1; i >= 0; i--) {
    const t = textesFlottants[i];
    t.age += delta;
    if (t.age >= DUREE_TEXTE_FLOTTANT) { textesFlottants.splice(i, 1); continue; }
    const progression = t.age / DUREE_TEXTE_FLOTTANT;
    ctx.globalAlpha = 1 - progression;
    ctx.fillStyle = t.couleur;
    ctx.font = `bold ${13 / etat.camera.zoom}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(t.texte, t.x, t.y - progression * 20 / etat.camera.zoom);
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------
// RETOURS TACTILES — petit anneau qui s'estompe à l'endroit touché,
// pour donner un repère visuel immédiat sur écran tactile.
// ---------------------------------------------------------
const retoursTactiles = [];
const DUREE_RETOUR_TACTILE = 0.4; // secondes

function ajouterRetourTactile(x, y) {
  retoursTactiles.push({ x, y, age: 0 });
}

function mettreAJourEtDessinerRetoursTactiles(ctx, delta) {
  for (let i = retoursTactiles.length - 1; i >= 0; i--) {
    const r = retoursTactiles[i];
    r.age += delta;
    if (r.age >= DUREE_RETOUR_TACTILE) { retoursTactiles.splice(i, 1); continue; }
    const t = r.age / DUREE_RETOUR_TACTILE;
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = '#ffd27a';
    ctx.lineWidth = 2 / etat.camera.zoom;
    ctx.beginPath();
    ctx.arc(r.x, r.y, (6 + t * 18) / etat.camera.zoom, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------
// RENDU PRINCIPAL — appelé chaque frame par la boucle de jeu (main.js)
// ---------------------------------------------------------
function rendreScene(temps) {
  ctx.fillStyle = '#16110a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(etat.camera.zoom, etat.camera.zoom);
  ctx.translate(-etat.camera.x, -etat.camera.y);

  // Sol de base — dégradé radial plutôt qu'une teinte plate, pour une
  // sensation de profondeur/éclairage même sans aucune texture image.
  const centreX = etat.carte.largeur / 2;
  const centreY = etat.carte.hauteur / 2;
  const degradeSol = ctx.createRadialGradient(
    centreX, centreY, 0,
    centreX, centreY, Math.max(etat.carte.largeur, etat.carte.hauteur) * 0.7
  );
  degradeSol.addColorStop(0, ajusterCouleur(PALETTE.sol, 14));
  degradeSol.addColorStop(0.65, PALETTE.sol);
  degradeSol.addColorStop(1, ajusterCouleur(PALETTE.sol, -20));
  ctx.fillStyle = degradeSol;
  ctx.fillRect(0, 0, etat.carte.largeur, etat.carte.hauteur);

  // Zone visible (+ marge) : tout ce qui est en dehors n'est pas dessiné
  const zone = zoneVisibleMonde(100);

  for (const t of tachesTerrain) {
    if (t.x + t.rayon < zone.x1 || t.x - t.rayon > zone.x2 ||
        t.y + t.rayon < zone.y1 || t.y - t.rayon > zone.y2) continue;
    ctx.globalAlpha = t.opacite;
    ctx.fillStyle = t.couleur;
    ctx.beginPath();
    ctx.ellipse(t.x, t.y, t.rayon, t.rayon * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const c of caillouxTerrain) {
    if (c.x < zone.x1 || c.x > zone.x2 || c.y < zone.y1 || c.y > zone.y2) continue;
    ctx.fillStyle = c.couleur;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.rayon, c.rayon * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(90,110,50,0.5)';
  ctx.lineWidth = 1 / etat.camera.zoom;
  for (const b of brindillesTerrain) {
    if (b.x < zone.x1 || b.x > zone.x2 || b.y < zone.y1 || b.y > zone.y2) continue;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x + Math.sin(b.angle) * 3, b.y - b.hauteur);
    ctx.stroke();
  }

  // Touffes d'herbe — 3 brins par touffe, balancés doucement par le
  // temps pour un environnement qui a l'air vivant même sans unité à
  // proximité.
  ctx.lineWidth = 1.4 / etat.camera.zoom;
  for (const h of touffesHerbeTerrain) {
    if (h.x < zone.x1 || h.x > zone.x2 || h.y < zone.y1 || h.y > zone.y2) continue;
    const balancement = Math.sin(temps.total * 1.4 + h.phase) * 3;
    ctx.strokeStyle = h.couleur;
    for (const decalage of [-2.5, 0, 2.5]) {
      ctx.beginPath();
      ctx.moveTo(h.x + decalage, h.y);
      ctx.quadraticCurveTo(
        h.x + decalage + balancement * 0.5, h.y - h.hauteur * 0.6,
        h.x + decalage + balancement, h.y - h.hauteur
      );
      ctx.stroke();
    }
  }

  // Petites fleurs sauvages
  for (const f of fleursTerrain) {
    if (f.x < zone.x1 || f.x > zone.x2 || f.y < zone.y1 || f.y > zone.y2) continue;
    ctx.fillStyle = f.couleur;
    for (const angle of [0, 1.25, 2.5, 3.75, 5]) {
      ctx.beginPath();
      ctx.ellipse(f.x + Math.cos(angle) * f.rayon, f.y + Math.sin(angle) * f.rayon * 0.8, f.rayon * 0.7, f.rayon * 0.5, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#e0b84a';
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.rayon * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bordure nette des limites de la carte
  ctx.strokeStyle = 'rgba(58,40,24,0.5)';
  ctx.lineWidth = 4 / etat.camera.zoom;
  ctx.strokeRect(0, 0, etat.carte.largeur, etat.carte.hauteur);

  for (const noeud of noeudsRessource) {
    if (noeud.x < zone.x1 || noeud.x > zone.x2 || noeud.y < zone.y1 || noeud.y > zone.y2) continue;
    dessinerNoeudRessource(ctx, noeud, temps);
  }

  dessinerBatimentsProduction(ctx);
  dessinerDefenses(ctx);
  dessinerLaboratoires(ctx);
  dessinerNidEnnemi(ctx);
  dessinerFourmiliere(ctx, temps);
  dessinerBasesSecondaires(ctx);
  dessinerUnites(ctx, temps);
  dessinerEffetsSuperarme(ctx, temps.delta);
  mettreAJourEtDessinerEclatsCombat(ctx, temps.delta);
  mettreAJourEtDessinerTextesFlottants(ctx, temps.delta);
  mettreAJourEtDessinerRetoursTactiles(ctx, temps.delta);
  mettreAJourBrouillard();
  dessinerBrouillard(ctx);
  dessinerEclairageJourNuit(temps);

  ctx.restore();

  // Poussière ambiante — dessinée en coordonnées écran (donc après le
  // ctx.restore() ci-dessus), pour dériver à une vitesse constante à
  // l'écran quel que soit le niveau de zoom.
  mettreAJourEtDessinerParticulesAmbiantes(temps.delta);

  // Vignette cinématique — assombrit légèrement les bords de l'écran
  // pour attirer l'œil vers le centre de l'action, un effet de
  // profondeur qui ne coûte qu'un seul dégradé par frame.
  const vignette = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, canvas.height * 0.32,
    canvas.width / 2, canvas.height / 2, canvas.height * 0.78
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  dessinerMinicarte();
  dessinerRectangleSelection();

  // Vague 13 : la vraie barre de ressources est désormais affichée par
  // js/ui.js (HTML, lisible sur petit écran) — la surcouche de debug
  // canvas ci-dessous reste disponible pour le développement mais
  // masquée par défaut (bascule : touche D, voir ui.js).
  if (afficherSurcoucheDebug) dessinerSurcoucheDebug(temps);
  dessinerPanneauMission();
  dessinerEcranFinDePartie();
}

// Fait dériver et dessine les particules de poussière ambiante
// (définies plus haut, coordonnées normalisées 0..1 par rapport à la
// taille de l'écran) — un fil décoratif continu, indépendant du zoom
// ou de la position de la caméra.
function mettreAJourEtDessinerParticulesAmbiantes(delta) {
  for (const p of particulesAmbiantes) {
    p.x += Math.cos(p.phase) * p.derive * delta / canvas.width;
    p.y += Math.sin(p.phase * 0.7) * (p.derive * 0.4) * delta / canvas.height - (p.derive * 0.15 * delta) / canvas.height;
    if (p.x < -0.02) p.x = 1.02;
    if (p.x > 1.02) p.x = -0.02;
    if (p.y < -0.02) p.y = 1.02;
    if (p.y > 1.02) p.y = -0.02;

    ctx.globalAlpha = p.opaciteBase;
    ctx.fillStyle = '#f0e0c0';
    ctx.beginPath();
    ctx.arc(p.x * canvas.width, p.y * canvas.height, p.taille, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Bascule de la surcouche de diagnostic (position caméra, zoom,
// horloge de partie) — utile en développement, masquée par défaut
// pour ne pas polluer l'écran sur mobile. Voir ui.js pour la touche.
let afficherSurcoucheDebug = false;

// Voile sombre + message centré, dessiné par-dessus toute la scène
// (en coordonnées écran, donc non affecté par la caméra) une fois
// que etat.resultatPartie est défini par combat.js.
function dessinerEcranFinDePartie() {
  if (!etat.resultatPartie) return;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const victoire = etat.resultatPartie === 'victoire';
  ctx.textAlign = 'center';

  ctx.fillStyle = victoire ? '#3ae03a' : '#e0503c';
  ctx.font = 'bold 42px Arial';
  ctx.fillText(victoire ? 'VICTOIRE' : 'DÉFAITE', canvas.width / 2, canvas.height / 2 - 10);

  ctx.fillStyle = '#f0e0c0';
  ctx.font = '15px Arial';
  ctx.fillText(
    victoire ? 'Toutes les menaces ont été éliminées.' : 'La fourmilière a été détruite.',
    canvas.width / 2, canvas.height / 2 + 26
  );
}

// Petit panneau de diagnostic, utile pendant le développement — sera
// caché derrière une option une fois l'interface réelle (ui.js) en place.
function dessinerSurcoucheDebug(temps) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(8, canvas.height - 66, 300, 58);
  ctx.fillStyle = '#f0e0c0';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(
    `cam x:${Math.round(etat.camera.x)} y:${Math.round(etat.camera.y)} zoom:${etat.camera.zoom.toFixed(2)} · t:${temps.total.toFixed(1)}s`,
    16, canvas.height - 44
  );
  // Stock de ressources — uniquement dans la surcouche de diagnostic
  // (masquée par défaut, touche D). La vraie barre visible par le
  // joueur est construite par js/ui.js (vague 13).
  const r = etat.ressources;
  ctx.fillText(
    `🌾${formaterNombre(r.nourriture)}  💧${formaterNombre(r.eau)}  🪵${formaterNombre(r.materiaux)}  👥${r.population}/${r.populationMax}  🐜${etat.unites.length}`,
    16, canvas.height - 22
  );
}

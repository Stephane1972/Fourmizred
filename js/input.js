// ===========================================================
// INPUT — entrées souris/tactile/clavier : pilotage de la caméra
// (glisser pour déplacer, molette/pincement pour zoomer), sélection
// d'unités (tap = une seule ; appui prolongé puis glisser = rectangle
// de sélection multiple), ordres (récolte, attaque, réparation,
// déplacement libre) et placement de défenses/laboratoires/points de
// ralliement au tap. Les raccourcis clavier de production et le menu
// tactile équivalent sont dans main.js et js/ui.js.
// ===========================================================

const pointeursActifs = new Map();
let modeGlissement = null; // 'camera' | 'selection' | null
let dernierPointUnique = null;
let distancePincementPrecedente = null;
let distanceTotaleGlissee = 0; // pour distinguer un tap d'un glissement

const SEUIL_TAP = 6; // px : en-dessous, on considère que c'est un tap, pas un glissement

// Sélection au rectangle — armée par un appui prolongé sans bouger
// (voir pointerdown), PAS par un simple glissement rapide : ainsi le
// geste le plus courant (glisser tout de suite pour faire défiler la
// caméra) continue de fonctionner exactement comme avant, sans aucune
// régression. Seul un doigt qu'on pose et qu'on laisse un court
// instant avant de bouger déclenche le rectangle.
const DELAI_ARMEMENT_SELECTION = 160; // ms
let minuteurArmementSelection = null;
let rectangleSelection = null; // { x1, y1, x2, y2 } en coordonnées écran, pendant le glissement

function initialiserInput() {
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointeursActifs.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointeursActifs.size === 1) {
      modeGlissement = 'camera';
      dernierPointUnique = { x: e.clientX, y: e.clientY };
      distanceTotaleGlissee = 0;
      canvas.classList.add('saisie'); // curseur "main fermée" pendant le glisser (desktop)

      const idPointeurArme = e.pointerId;
      clearTimeout(minuteurArmementSelection);
      minuteurArmementSelection = setTimeout(() => {
        // Toujours le même (et unique) doigt, pas encore parti en
        // glissement caméra, et aucun mode de placement/ciblage en
        // cours : on arme le rectangle de sélection à sa position
        // actuelle plutôt qu'à celle d'il y a 160ms.
        if (pointeursActifs.size !== 1 || !pointeursActifs.has(idPointeurArme)) return;
        if (distanceTotaleGlissee >= SEUIL_TAP) return;
        if (modePlacementDefense || modePlacementLaboratoire || modePlacementBatimentProduction ||
            modeCiblageFondation || modeCiblageSuperarme || modeCiblageRalliement) return;

        const p = pointeursActifs.get(idPointeurArme);
        modeGlissement = 'selection';
        rectangleSelection = { x1: p.x, y1: p.y, x2: p.x, y2: p.y };
        canvas.classList.remove('saisie');
      }, DELAI_ARMEMENT_SELECTION);
    } else if (pointeursActifs.size === 2) {
      clearTimeout(minuteurArmementSelection);
      modeGlissement = null; // un deuxième doigt annule tout mode en cours -> pincement
      rectangleSelection = null;
      distancePincementPrecedente = distanceEntrePointeurs();
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!pointeursActifs.has(e.pointerId)) return;
    pointeursActifs.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointeursActifs.size === 1 && modeGlissement === 'camera') {
      const dx = e.clientX - dernierPointUnique.x;
      const dy = e.clientY - dernierPointUnique.y;
      distanceTotaleGlissee += Math.hypot(dx, dy);
      deplacerCamera(dx, dy);
      dernierPointUnique = { x: e.clientX, y: e.clientY };
    } else if (pointeursActifs.size === 1 && modeGlissement === 'selection') {
      rectangleSelection.x2 = e.clientX;
      rectangleSelection.y2 = e.clientY;
    } else if (pointeursActifs.size === 2) {
      clearTimeout(minuteurArmementSelection);
      const distanceActuelle = distanceEntrePointeurs();
      if (distancePincementPrecedente) {
        const facteur = distanceActuelle / distancePincementPrecedente;
        const centre = centreEntrePointeurs();
        zoomerCamera(facteur, centre.x, centre.y);
      }
      distancePincementPrecedente = distanceActuelle;
    }
  });

  function finPointeur(e) {
    clearTimeout(minuteurArmementSelection);

    if (modeGlissement === 'selection' && rectangleSelection) {
      const largeurEcran = Math.abs(rectangleSelection.x2 - rectangleSelection.x1);
      const hauteurEcran = Math.abs(rectangleSelection.y2 - rectangleSelection.y1);
      if (largeurEcran < SEUIL_TAP && hauteurEcran < SEUIL_TAP) {
        // Appui prolongé mais relâché quasiment sans bouger : ce n'est
        // PAS un vrai rectangle de sélection, juste un tap un peu lent
        // (très courant au doigt) — on exécute le tap normal plutôt que
        // de désélectionner aveuglément, sinon un simple tap un peu
        // appuyé sur une unité échouerait silencieusement à la sélectionner.
        executerTap(e.clientX, e.clientY);
      } else {
        finaliserRectangleSelection(rectangleSelection);
      }
      rectangleSelection = null;
    } else if (pointeursActifs.size === 1 && distanceTotaleGlissee < SEUIL_TAP) {
      executerTap(e.clientX, e.clientY);
    }

    pointeursActifs.delete(e.pointerId);
    if (pointeursActifs.size === 0) {
      modeGlissement = null;
      dernierPointUnique = null;
      rectangleSelection = null;
      canvas.classList.remove('saisie');
    }
    if (pointeursActifs.size < 2) {
      distancePincementPrecedente = null;
    }
  }
  canvas.addEventListener('pointerup', finPointeur);
  canvas.addEventListener('pointercancel', finPointeur);

  // Molette (desktop) : zoom centré sur la position du curseur
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const facteur = e.deltaY < 0 ? 1.1 : 0.9;
    zoomerCamera(facteur, e.clientX, e.clientY);
  }, { passive: false });
}

// Exécute un tap simple (clic ou appui bref) à une position écran
// donnée : placement/ciblage en cours en priorité absolue, sinon
// sélection/ordre selon ce qui se trouve sous le doigt. Appelée à la
// fois pour un tap ordinaire et pour un appui prolongé relâché sans
// glissement réel (voir finPointeur, ci-dessus).
function executerTap(clientX, clientY) {
  const point = ecranVersMonde(clientX, clientY);

  if (modePlacementDefense) {
    placerDefense(modePlacementDefense, point.x, point.y);
    modePlacementDefense = null;
  } else if (modePlacementLaboratoire) {
    placerLaboratoire(modePlacementLaboratoire, point.x, point.y);
    modePlacementLaboratoire = null;
  } else if (modePlacementBatimentProduction) {
    placerBatimentProduction(modePlacementBatimentProduction, point.x, point.y);
    modePlacementBatimentProduction = null;
  } else if (modeCiblageFondation) {
    ordonnerFondationPourSelection(point.x, point.y);
    modeCiblageFondation = false;
  } else if (modeCiblageSuperarme) {
    declencherSuperarme(point.x, point.y);
    modeCiblageSuperarme = false;
  } else if (modeCiblageRalliement) {
    definirPointRalliement(modeCiblageRalliement, point.x, point.y);
    modeCiblageRalliement = null;
  } else {
    const uniteAlliee = trouverUniteSous(point.x, point.y, 'joueur');
    const uniteEnnemie = !uniteAlliee ? trouverUniteSous(point.x, point.y, 'ennemi') : null;
    const cibleNidEnnemi = !uniteAlliee && !uniteEnnemie && trouverNidEnnemiSous(point.x, point.y);

    if (uniteAlliee) {
      // Sélectionne uniquement cette unité (remplace la sélection précédente)
      for (const u of etat.unites) u.selectionnee = false;
      uniteAlliee.selectionnee = true;
    } else if (uniteEnnemie) {
      // Toutes les unités alliées actuellement sélectionnées reçoivent
      // l'ordre d'attaquer la cible touchée.
      const selectionnees = etat.unites.filter((u) => u.faction === 'joueur' && u.selectionnee);
      for (const u of selectionnees) ordonnerAttaque(u, uniteEnnemie.id);
    } else if (cibleNidEnnemi) {
      // Une infiltratrice sélectionnée s'y rend pour capturer la
      // colonie rivale (infiltration.js) ; sans ça, on prévient le
      // joueur plutôt que de ne rien faire silencieusement.
      const infiltratrices = etat.unites.filter((u) =>
        u.faction === 'joueur' && u.type === 'ouvriereInfiltratrice' && u.pv > 0 && u.selectionnee
      );
      if (infiltratrices.length > 0) {
        for (const u of infiltratrices) ordonnerInfiltration(u);
      } else {
        ajouterTexteFlottant(nidEnnemi.x, nidEnnemi.y - nidEnnemi.rayon - 10, 'Nécessite une ouvrière infiltratrice', '#e0503c');
      }
    } else {
      const defense = trouverDefenseSous(point.x, point.y);
      const noeud = !defense ? trouverNoeudSous(point.x, point.y) : null;
      if (defense) {
        reparerDefense(defense);
      } else if (noeud) {
        const selectionnees = etat.unites.filter((u) => u.faction === 'joueur' && u.selectionnee);
        const recolteuses = selectionnees.filter((u) => TYPES_UNITE[u.type].capaciteTransport > 0);
        if (recolteuses.length > 0) {
          for (const u of recolteuses) donnerOrdreRecolte(u, noeud);
        } else {
          // Aucune unité sélectionnée capable de transporter (ou
          // aucune sélection du tout) : comportement précédent
          // conservé, la colonie prélève directement dans le stock.
          collecterRessource(noeud);
        }
      } else {
        // Terrain vide : les unités actuellement sélectionnées s'y
        // rendent (déplacement libre, voir combat.js), plutôt que
        // de simplement désélectionner comme avant — beaucoup plus
        // proche du réflexe RTS habituel. S'il n'y a rien à
        // déplacer, ce tap déselectionne comme précédemment.
        const selectionnees = etat.unites.filter((u) => u.faction === 'joueur' && u.selectionnee && u.pv > 0);
        if (selectionnees.length > 0) {
          for (const u of selectionnees) ordonnerDeplacementLibre(u, point.x, point.y);
        } else {
          for (const u of etat.unites) u.selectionnee = false;
        }
        ajouterRetourTactile(point.x, point.y);
      }
    }
  }
}

// Convertit le rectangle de sélection (coordonnées écran) en monde et
// sélectionne toutes les unités alliées vivantes qui s'y trouvent.
// N'est appelée que pour un rectangle réellement tracé (voir
// finPointeur ci-dessus, qui route un rectangle quasi ponctuel vers
// executerTap à la place).
function finaliserRectangleSelection(rectEcran) {
  const p1 = ecranVersMonde(rectEcran.x1, rectEcran.y1);
  const p2 = ecranVersMonde(rectEcran.x2, rectEcran.y2);
  const xMin = Math.min(p1.x, p2.x), xMax = Math.max(p1.x, p2.x);
  const yMin = Math.min(p1.y, p2.y), yMax = Math.max(p1.y, p2.y);

  for (const u of etat.unites) {
    if (u.faction !== 'joueur' || u.pv <= 0) { u.selectionnee = false; continue; }
    u.selectionnee = u.x >= xMin && u.x <= xMax && u.y >= yMin && u.y <= yMax;
  }
}

function distanceEntrePointeurs() {
  const pts = Array.from(pointeursActifs.values());
  return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
}

function centreEntrePointeurs() {
  const pts = Array.from(pointeursActifs.values());
  return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
}

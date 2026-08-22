// ===========================================================
// INPUT — entrées souris/tactile/clavier : pilotage de la caméra
// (glisser pour déplacer, molette/pincement pour zoomer), sélection
// d'unités, ordres (récolte, attaque, réparation) et placement de
// défenses/laboratoires au tap. Les raccourcis clavier de production
// et le menu tactile équivalent sont dans main.js et js/ui.js.
// ===========================================================

const pointeursActifs = new Map();
let modeGlissement = null; // 'camera' | null
let dernierPointUnique = null;
let distancePincementPrecedente = null;
let distanceTotaleGlissee = 0; // pour distinguer un tap d'un glissement

const SEUIL_TAP = 6; // px : en-dessous, on considère que c'est un tap, pas un glissement

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
    } else if (pointeursActifs.size === 2) {
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
    } else if (pointeursActifs.size === 2) {
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
    // Si le pointeur n'a quasiment pas bougé, c'est un tap/clic simple.
    if (pointeursActifs.size === 1 && distanceTotaleGlissee < SEUIL_TAP) {
      const point = ecranVersMonde(e.clientX, e.clientY);

      // Priorité absolue : un mode de placement (défense OU
      // laboratoire) est actif, ce tap le construit et rien d'autre
      // ne se passe ce coup-ci.
      if (modePlacementDefense) {
        placerDefense(modePlacementDefense, point.x, point.y);
        modePlacementDefense = null;
      } else if (modePlacementLaboratoire) {
        placerLaboratoire(modePlacementLaboratoire, point.x, point.y);
        modePlacementLaboratoire = null;
      } else if (modeCiblageFondation) {
        ordonnerFondationPourSelection(point.x, point.y);
        modeCiblageFondation = false;
      } else if (modeCiblageSuperarme) {
        declencherSuperarme(point.x, point.y);
        modeCiblageSuperarme = false;
      } else {
        const uniteAlliee = trouverUniteSous(point.x, point.y, 'joueur');
        const uniteEnnemie = !uniteAlliee ? trouverUniteSous(point.x, point.y, 'ennemi') : null;

        if (uniteAlliee) {
          // Sélectionne uniquement cette unité (remplace la sélection précédente)
          for (const u of etat.unites) u.selectionnee = false;
          uniteAlliee.selectionnee = true;
        } else if (uniteEnnemie) {
          // Toutes les unités alliées actuellement sélectionnées reçoivent
          // l'ordre d'attaquer la cible touchée.
          const selectionnees = etat.unites.filter((u) => u.faction === 'joueur' && u.selectionnee);
          for (const u of selectionnees) ordonnerAttaque(u, uniteEnnemie.id);
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
            for (const u of etat.unites) u.selectionnee = false;
            ajouterRetourTactile(point.x, point.y);
          }
        }
      }
    }

    pointeursActifs.delete(e.pointerId);
    if (pointeursActifs.size === 0) {
      modeGlissement = null;
      dernierPointUnique = null;
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

function distanceEntrePointeurs() {
  const pts = Array.from(pointeursActifs.values());
  return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
}

function centreEntrePointeurs() {
  const pts = Array.from(pointeursActifs.values());
  return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
}

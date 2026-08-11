// ===========================================================
// BÂTIMENTS — placement, production, boutons du panneau de construction
// ===========================================================

function placerBatiment(type, worldX, worldY) {
  const def = TYPES_BATIMENT[type];
  if (nourritureAuNid < def.cout) {
    afficherMessage('Pas assez de nourriture');
    return false;
  }
  nourritureAuNid -= def.cout;
  document.getElementById('compteur-nourriture').textContent = nourritureAuNid;
  batiments.push({ type, x: worldX, y: worldY, minuteurProduction: def.delaiProduction });
  return true;
}

document.getElementById('btn-construire-chambre').addEventListener('click', () => {
  const bouton = document.getElementById('btn-construire-chambre');
  if (modePlacement === 'chambre') {
    modePlacement = null;
    bouton.classList.remove('actif');
    return;
  }
  modePlacement = 'chambre';
  bouton.classList.add('actif');
  afficherMessage('Touchez/cliquez la carte pour placer la Chambre');
});

document.getElementById('btn-produire-soldat').addEventListener('click', () => {
  if (nourritureAuNid < COUT_SOLDAT) {
    afficherMessage('Pas assez de nourriture');
    return;
  }
  nourritureAuNid -= COUT_SOLDAT;
  document.getElementById('compteur-nourriture').textContent = nourritureAuNid;
  const angle = Math.random() * Math.PI * 2;
  fourmis.push(new Fourmi(
    nid.x + Math.cos(angle) * 70,
    nid.y + Math.sin(angle) * 70,
    'joueur',
    'soldat'
  ));
  afficherMessage('Soldat produit');
});

// Production automatique des bâtiments (appelée depuis la boucle principale)
function mettreAJourProductionBatiments() {
  for (const b of batiments) {
    const def = TYPES_BATIMENT[b.type];
    b.minuteurProduction -= dt;
    if (b.minuteurProduction <= 0) {
      if (nourritureAuNid >= def.coutProduction) {
        nourritureAuNid -= def.coutProduction;
        document.getElementById('compteur-nourriture').textContent = nourritureAuNid;
        const angle = Math.random() * Math.PI * 2;
        fourmis.push(new Fourmi(
          b.x + Math.cos(angle) * (def.rayon + 15),
          b.y + Math.sin(angle) * (def.rayon + 15),
          'joueur'
        ));
      }
      b.minuteurProduction = def.delaiProduction;
    }
  }
}

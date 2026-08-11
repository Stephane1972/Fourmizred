// ===========================================================
// MAIN — peuplement initial et boucle de jeu
// ===========================================================

// Population de départ, autour du nid
for (let i = 0; i < 10; i++) {
  const a = (i / 10) * Math.PI * 2;
  fourmis.push(new Fourmi(
    nid.x + Math.cos(a) * 70,
    nid.y + Math.sin(a) * 70,
    'joueur'
  ));
}

// Faune d'ambiance
genererInsectes();

// ---------------------------------------------------------
// BOUCLE PRINCIPALE
// ---------------------------------------------------------
function loop() {
  // Si l'app est en arrière-plan (onglet caché ou app Android minimisée),
  // on ne fait ni calcul ni rendu — économise la batterie et évite un
  // bond de deltaTime au retour au premier plan.
  if (document.hidden) {
    requestAnimationFrame(loop);
    return;
  }

  majDeltaTime();
  updateCamera();
  dessinerTerrain(ctx);

  for (const insecte of insectes) {
    insecte.update();
    insecte.draw(ctx, camX, camY);
  }

  // Apparition périodique des ennemis
  minuteurSpawnEnnemi -= dt;
  if (minuteurSpawnEnnemi <= 0 && ennemis.length < MAX_ENNEMIS) {
    const angle = Math.random() * Math.PI * 2;
    ennemis.push(new Fourmi(
      nidEnnemi.x + Math.cos(angle) * 60,
      nidEnnemi.y + Math.sin(angle) * 60,
      'ennemi'
    ));
    minuteurSpawnEnnemi = 220;
  }
  ecarterEnnemiAI();
  resoudreCombats();

  mettreAJourProductionBatiments();

  for (const f of fourmis) {
    f.update();
    f.draw(ctx, camX, camY);
    reveler(f.x, f.y, 130);
  }

  for (const e of ennemis) {
    e.update();
    e.draw(ctx, camX, camY);
  }

  dessinerMinicarte();

  // Rectangle de sélection en cours
  if (selectionEnCours) {
    const x = Math.min(selStart.x, selEnd.x);
    const y = Math.min(selStart.y, selEnd.y);
    const w = Math.abs(selEnd.x - selStart.x);
    const h = Math.abs(selEnd.y - selStart.y);
    ctx.strokeStyle = 'rgba(58,224,58,0.9)';
    ctx.fillStyle = 'rgba(58,224,58,0.15)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  }

  requestAnimationFrame(loop);
}
loop();

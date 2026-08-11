// ===========================================================
// COMBAT — IA basique de la colonie ennemie et résolution des accrochages
// ===========================================================

function ecarterEnnemiAI() {
  for (const e of ennemis) {
    if (e.hp <= 0) continue;
    let cible = null, meilleureDist = DETECTION_ENNEMI;
    for (const f of fourmis) {
      const d = Math.hypot(f.x - e.x, f.y - e.y);
      if (d < meilleureDist) { meilleureDist = d; cible = f; }
    }
    if (cible) {
      e.cible = { x: cible.x, y: cible.y };
    } else if (!e.cible) {
      e.cible = {
        x: nidEnnemi.x + (Math.random() - 0.5) * 300,
        y: nidEnnemi.y + (Math.random() - 0.5) * 300
      };
    }
  }
}

function resoudreCombats() {
  for (const f of fourmis) if (f.minuteurAttaque > 0) f.minuteurAttaque -= dt;
  for (const e of ennemis) if (e.minuteurAttaque > 0) e.minuteurAttaque -= dt;

  for (const f of fourmis) {
    if (f.hp <= 0) continue;
    for (const e of ennemis) {
      if (e.hp <= 0) continue;
      if (Math.hypot(f.x - e.x, f.y - e.y) < PORTEE_ATTAQUE) {
        if (f.minuteurAttaque <= 0) { e.hp -= f.degats; f.minuteurAttaque = COOLDOWN_ATTAQUE; }
        if (e.minuteurAttaque <= 0) { f.hp -= e.degats; e.minuteurAttaque = COOLDOWN_ATTAQUE; }
        break;
      }
    }
  }

  for (let i = fourmis.length - 1; i >= 0; i--) if (fourmis[i].hp <= 0) fourmis.splice(i, 1);
  for (let i = ennemis.length - 1; i >= 0; i--) if (ennemis[i].hp <= 0) ennemis.splice(i, 1);
}

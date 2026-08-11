// ===========================================================
// INSECTES D'AMBIANCE — faune décorative sans effet de gameplay,
// pour rendre le monde vivant (pucerons, coccinelles, scarabées).
// ===========================================================
class Insecte {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'puceron' | 'coccinelle' | 'scarabee'
    this.origineX = x;
    this.origineY = y;
    this.angle = Math.random() * Math.PI * 2;
    this.phase = Math.random() * Math.PI * 2;
    this.cible = null;
    this.minuteurRepos = nombreAleatoire(30, 150);

    if (type === 'puceron') {
      this.vitesse = 0; // les pucerons ne se déplacent pas, ils restent groupés
      this.rayonErrance = 0;
      this.taille = nombreAleatoire(2, 3);
    } else if (type === 'coccinelle') {
      this.vitesse = 0.35;
      this.rayonErrance = 220;
      this.taille = nombreAleatoire(4, 5);
    } else {
      this.vitesse = 0.22;
      this.rayonErrance = 160;
      this.taille = nombreAleatoire(5, 6.5);
    }
  }

  update() {
    if (this.vitesse === 0) return; // pucerons statiques

    if (this.cible) {
      const dx = this.cible.x - this.x, dy = this.cible.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 3) {
        this.cible = null;
        this.minuteurRepos = nombreAleatoire(60, 200);
      } else {
        this.angle = Math.atan2(dy, dx);
        const v = this.vitesse * dt;
        this.x += Math.cos(this.angle) * v;
        this.y += Math.sin(this.angle) * v;
        this.phase += v * 0.6;
      }
    } else {
      this.minuteurRepos -= dt;
      if (this.minuteurRepos <= 0) {
        this.cible = {
          x: this.origineX + nombreAleatoire(-this.rayonErrance, this.rayonErrance),
          y: this.origineY + nombreAleatoire(-this.rayonErrance, this.rayonErrance)
        };
      }
    }
  }

  draw(ctx, camX, camY) {
    const sx = this.x - camX, sy = this.y - camY;
    if (sx < -20 || sx > canvas.width + 20 || sy < -20 || sy > canvas.height + 20) return;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.angle);

    if (this.type === 'puceron') {
      ctx.fillStyle = '#b8d888';
      ctx.beginPath();
      ctx.ellipse(0, 0, this.taille, this.taille * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'coccinelle') {
      const balancement = Math.sin(this.phase) * 0.3;
      ctx.rotate(balancement);
      ctx.fillStyle = '#c23b2c';
      ctx.beginPath();
      ctx.ellipse(0, 0, this.taille, this.taille * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3a1810';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, -this.taille * 0.75);
      ctx.lineTo(0, this.taille * 0.75);
      ctx.stroke();
      ctx.fillStyle = '#1a0d08';
      [[-0.35, -0.2], [0.35, -0.2], [-0.35, 0.3], [0.35, 0.3]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.ellipse(dx * this.taille, dy * this.taille, this.taille * 0.16, this.taille * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.ellipse(this.taille * 0.85, 0, this.taille * 0.35, this.taille * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Scarabée
      const balancement = Math.sin(this.phase) * 0.2;
      ctx.rotate(balancement);
      ctx.fillStyle = '#2a2416';
      ctx.beginPath();
      ctx.ellipse(0, 0, this.taille, this.taille * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.ellipse(-this.taille * 0.2, -this.taille * 0.2, this.taille * 0.4, this.taille * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1a1610';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -this.taille * 0.6);
      ctx.lineTo(0, this.taille * 0.6);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ---------------------------------------------------------
// Peuplement initial de la faune d'ambiance
// ---------------------------------------------------------
function genererInsectes() {
  // Colonies de pucerons, groupées près de quelques ressources
  for (const r of ressources) {
    if (Math.random() > 0.6) continue; // pas toutes les ressources
    const nb = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < nb; i++) {
      insectes.push(new Insecte(
        r.x + nombreAleatoire(-14, 14),
        r.y + nombreAleatoire(-14, 14),
        'puceron'
      ));
    }
  }

  // Coccinelles et scarabées, dispersés sur la carte
  for (let i = 0; i < 10; i++) {
    insectes.push(new Insecte(Math.random() * MAP_W, Math.random() * MAP_H, 'coccinelle'));
  }
  for (let i = 0; i < 7; i++) {
    insectes.push(new Insecte(Math.random() * MAP_W, Math.random() * MAP_H, 'scarabee'));
  }
}

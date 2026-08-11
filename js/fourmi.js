// ===========================================================
// FOURMI — unité contrôlable (ouvrière ou soldat, joueur ou ennemi)
// ===========================================================
class Fourmi {
  constructor(x, y, faction, type) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.type = type || 'ouvriere'; // 'ouvriere' ou 'soldat'
    this.vitesseMax = this.type === 'soldat' ? 2.0 : 2.4;
    this.taille = this.type === 'soldat' ? 14 : 11;
    this.phase = Math.random() * Math.PI * 2;
    this.selectionnee = false;
    this.cible = null; // {x, y} ou null

    // Légère variation de teinte individuelle, pour casser l'effet
    // "copier-coller" quand plusieurs fourmis identiques se regroupent
    this.variance = Math.round(nombreAleatoire(-10, 10));

    // Combat
    this.faction = faction || 'joueur'; // 'joueur' ou 'ennemi'
    this.hpMax = this.type === 'soldat' ? 170 : 100;
    this.hp = this.hpMax;
    this.degats = this.type === 'soldat' ? 13 : 7;
    this.minuteurAttaque = 0;

    // Récolte (les soldats ne récoltent pas)
    this.etat = 'idle'; // idle | versRessource | recolte | versNid | depose
    this.ressourceCible = null;
    this.cargo = 0;
    this.cargoMax = 20;
    this.minuteur = 0;
  }

  ordonnerRecolte(ressource) {
    if (this.type === 'soldat') {
      this.ordonnerDeplacementLibre(ressource.x, ressource.y);
      return;
    }
    this.ressourceCible = ressource;
    this.etat = 'versRessource';
    this.cible = { x: ressource.x, y: ressource.y };
  }

  ordonnerDeplacementLibre(x, y) {
    this.ressourceCible = null;
    this.etat = 'idle';
    this.cible = { x, y };
  }

  update() {
    // Déplacement vers la cible courante, quel que soit l'état
    if (this.cible) {
      const dx = this.cible.x - this.x;
      const dy = this.cible.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) {
        this.cible = null;
      } else {
        this.angle = Math.atan2(dy, dx);
        const v = Math.min(this.vitesseMax * dt, dist);
        this.x += Math.cos(this.angle) * v;
        this.y += Math.sin(this.angle) * v;
        this.phase += v * 0.5;
      }
      return; // en mouvement : pas de changement d'état ce tour-ci
    }

    // Arrivée à destination : que faire selon l'état ?
    if (this.etat === 'versRessource') {
      if (!this.ressourceCible || this.ressourceCible.quantite <= 0) {
        this.etat = 'idle';
        this.ressourceCible = null;
        return;
      }
      this.etat = 'recolte';
      this.minuteur = 60; // ~1s de récolte sur place
    } else if (this.etat === 'recolte') {
      this.minuteur -= dt;
      if (this.minuteur <= 0) {
        const r = this.ressourceCible;
        if (r) {
          const pris = Math.min(this.cargoMax, r.quantite);
          this.cargo = pris;
          r.quantite -= pris;
        }
        this.etat = 'versNid';
        this.cible = { x: nid.x, y: nid.y };
      }
    } else if (this.etat === 'versNid') {
      this.etat = 'depose';
      this.minuteur = 20; // petite pause de déchargement
    } else if (this.etat === 'depose') {
      this.minuteur -= dt;
      if (this.minuteur <= 0) {
        nourritureAuNid += this.cargo;
        document.getElementById('compteur-nourriture').textContent = nourritureAuNid;
        this.cargo = 0;
        if (this.ressourceCible && this.ressourceCible.quantite > 0) {
          // Boucle automatique façon Harvester : retour à la ressource
          this.etat = 'versRessource';
          this.cible = { x: this.ressourceCible.x, y: this.ressourceCible.y };
        } else {
          this.etat = 'idle';
          this.ressourceCible = null;
        }
      }
    }
  }

  dessinerPatte(ctx, ax, ay, longueur, offsetPhase, cote, inclinaison) {
    const balancement = Math.sin(this.phase + offsetPhase) * 0.5;
    const angleBase = (cote > 0 ? 1.0 : -1.0) + inclinaison * cote;
    const coudeX = ax + Math.cos(angleBase + balancement * 0.4) * longueur * 0.5;
    const coudeY = ay + Math.sin(angleBase + balancement * 0.4) * longueur * 0.5 + longueur * 0.2;
    const boutX = coudeX + Math.cos(angleBase + balancement) * longueur * 0.5;
    const boutY = coudeY + Math.sin(angleBase + balancement) * longueur * 0.4 + longueur * 0.3;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(coudeX, coudeY);
    ctx.lineTo(boutX, boutY);
    ctx.stroke();
  }

  draw(ctx, camX, camY) {
    const sx = this.x - camX, sy = this.y - camY;
    if (sx < -30 || sx > canvas.width + 30 || sy < -30 || sy > canvas.height + 30) return;

    // Ombre portée au sol, sous la fourmi (donne un peu de profondeur)
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(sx + 2, sy + 3, this.taille * 0.9, this.taille * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(sx, sy);

    // Anneau de sélection / cible
    if (this.selectionnee) {
      ctx.strokeStyle = '#3ae03a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Cargaison de nourriture transportée
    if (this.cargo > 0) {
      ctx.fillStyle = '#5a8a3a';
      ctx.beginPath();
      ctx.ellipse(0, -14, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.rotate(this.angle);
    ctx.scale(this.taille / 10, this.taille / 10);

    const base = this.faction === 'ennemi'
      ? { abdomen: '#4a1414', thorax: '#7a2a12', tete: '#2a0f08', patte: '#5a1c10' }
      : { abdomen: '#1c1c1c', thorax: '#6b2f18', tete: '#241512', patte: '#3a1c12' };
    const couleurs = {
      abdomen: ajusterCouleur(base.abdomen, this.variance),
      thorax: ajusterCouleur(base.thorax, this.variance),
      tete: ajusterCouleur(base.tete, this.variance),
      patte: ajusterCouleur(base.patte, this.variance)
    };

    ctx.lineWidth = 1.1;
    ctx.strokeStyle = couleurs.patte;

    this.dessinerPatte(ctx, 3, 1.5, 11, 0, 1, -0.7);
    this.dessinerPatte(ctx, 1, 2, 11, Math.PI, 1, 0.1);
    this.dessinerPatte(ctx, -1, 1.8, 10, 0, 1, 0.9);
    this.dessinerPatte(ctx, 3, -1.5, 11, Math.PI, -1, -0.7);
    this.dessinerPatte(ctx, 1, -2, 11, 0, -1, 0.1);
    this.dessinerPatte(ctx, -1, -1.8, 10, Math.PI, -1, 0.9);

    ctx.fillStyle = couleurs.abdomen;
    ctx.beginPath();
    ctx.ellipse(-6, 0, 5.5, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Reflet doux sur l'abdomen, pour le volume
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.ellipse(-6, -1.2, 2.4, 1.3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = couleurs.thorax;
    ctx.beginPath();
    ctx.ellipse(1, 0, 3.2, 2.3, 0, 0, Math.PI * 2);
    ctx.fill();

    const echelleTete = this.type === 'soldat' ? 1.55 : 1.0;
    ctx.fillStyle = couleurs.tete;
    ctx.beginPath();
    ctx.ellipse(8, 0, 3.2 * echelleTete, 2.7 * echelleTete, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.type === 'soldat') {
      // Mandibules en crochet, comme sur le modèle de référence du Soldat
      const mx = 8 + 2.5 * echelleTete;
      const lm = 2.1;
      ctx.fillStyle = couleurs.tete;
      [-1, 1].forEach(cote => {
        const b = 1.3 * echelleTete;
        ctx.beginPath();
        ctx.moveTo(mx, cote * b);
        ctx.quadraticCurveTo(mx + lm * 2.6, cote * b * 0.55, mx + lm * 3.6, cote * 0.15);
        ctx.quadraticCurveTo(mx + lm * 2.5, cote * b * 0.15, mx + lm * 2.9, cote * -0.35);
        ctx.quadraticCurveTo(mx + lm * 1.8, cote * b * 0.75, mx, cote * b * 0.5);
        ctx.closePath();
        ctx.fill();
      });
    }

    ctx.restore();

    // Barre de vie, affichée seulement si la fourmi a déjà été blessée
    if (this.hp < this.hpMax) {
      const largeur = 18;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(sx - largeur / 2, sy - 20, largeur, 3);
      ctx.fillStyle = this.hp / this.hpMax > 0.3 ? '#3ae03a' : '#e03a3a';
      ctx.fillRect(sx - largeur / 2, sy - 20, largeur * (this.hp / this.hpMax), 3);
    }
  }
}

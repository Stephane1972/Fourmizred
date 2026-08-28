// ===========================================================
// RESOURCES — nœuds de ressources récoltables posés sur la carte
// (nourriture, eau, matériaux). Les phéromones et la population ne
// sont pas des nœuds sur la carte : elles vivent uniquement dans
// `etat.ressources` (voir state.js), gérées par buildings.js /
// units.js.
//
// La récolte réelle (une unité qui vient prélever dans un nœud) est
// gérée par mettreAJourRecolte() dans ce fichier, appelée par la
// boucle de jeu (main.js).
// ===========================================================

const TYPES_RESSOURCE = {
  nourriture: {
    label: 'Graines',
    quantiteBase: 300,
    couleurPrincipale: '#c9a227',
    couleurAccent: '#8a6a15'
  },
  eau: {
    label: 'Point d\'eau',
    quantiteBase: 500,
    couleurPrincipale: '#3a7ca8',
    couleurAccent: '#1f4a63'
  },
  materiaux: {
    label: 'Brindilles',
    quantiteBase: 250,
    couleurPrincipale: '#8a6a45',
    couleurAccent: '#5a4428'
  }
};

const noeudsRessource = [];
let prochainIdNoeud = 1;

// Distance minimale à respecter par rapport à la fourmilière, pour ne
// pas faire apparaître un nœud directement dessus.
const DISTANCE_MIN_FOURMILIERE = 220;

function genererRessources() {
  const { largeur, hauteur } = etat.carte;
  const densite = (largeur * hauteur) / (3000 * 2000);

  ajouterNoeuds('nourriture', Math.round(10 * densite));
  ajouterNoeuds('eau', Math.round(5 * densite));
  ajouterNoeuds('materiaux', Math.round(8 * densite));
}

function ajouterNoeuds(type, quantite) {
  const def = TYPES_RESSOURCE[type];
  for (let i = 0; i < quantite; i++) {
    let x, y, essais = 0;
    do {
      x = 150 + Math.random() * (etat.carte.largeur - 300);
      y = 150 + Math.random() * (etat.carte.hauteur - 300);
      essais++;
    } while (distance(x, y, fourmiliere.x, fourmiliere.y) < DISTANCE_MIN_FOURMILIERE && essais < 20);

    noeudsRessource.push({
      id: prochainIdNoeud++,
      type,
      x, y,
      quantite: def.quantiteBase,
      quantiteInitiale: def.quantiteBase,
      // Petite variation visuelle par nœud, pour que deux nœuds du
      // même type ne soient jamais parfaitement identiques à l'écran
      variationTaille: nombreAleatoire(0.85, 1.2),
      angleVariation: nombreAleatoire(0, Math.PI * 2)
    });
  }
}

function trouverNoeudParId(id) {
  return noeudsRessource.find((n) => n.id === id) || null;
}

// Trouve, parmi les nœuds encore non épuisés, le plus proche d'un
// point donné pour un type de ressource donné. Utilisée pour la
// récolte continue : quand le nœud assigné à une unité est épuisé,
// on lui en cherche un autre du même type plutôt que de l'arrêter.
function trouverNoeudRessourceProche(type, x, y) {
  let meilleur = null, meilleureDistance = Infinity;
  for (const n of noeudsRessource) {
    if (n.type !== type || n.quantite <= 0) continue;
    const d = distance(x, y, n.x, n.y);
    if (d < meilleureDistance) { meilleureDistance = d; meilleur = n; }
  }
  return meilleur;
}

// ---------------------------------------------------------
// COLLECTE SIMPLE — toucher/cliquer un nœud prélève directement une
// petite quantité dans le stock de la colonie. Pas encore d'unité
// qui vient récolter automatiquement : ce sera le rôle de units.js.
// ---------------------------------------------------------
const MONTANT_COLLECTE_PAR_TAP = 20;
const RAYON_TOUCHE_NOEUD = 26;

function trouverNoeudSous(mondeX, mondeY) {
  for (const n of noeudsRessource) {
    if (n.quantite <= 0) continue;
    if (distance(n.x, n.y, mondeX, mondeY) < RAYON_TOUCHE_NOEUD) return n;
  }
  return null;
}

function collecterRessource(noeud) {
  if (noeud.quantite <= 0) return 0;
  const preleve = Math.min(MONTANT_COLLECTE_PAR_TAP, noeud.quantite);
  noeud.quantite -= preleve;
  etat.ressources[noeud.type] += preleve;
  const def = TYPES_RESSOURCE[noeud.type];
  ajouterTexteFlottant(noeud.x, noeud.y - 12, '+' + preleve, def.couleurPrincipale);
  return preleve;
}

// ---------------------------------------------------------
// ORDRES DE RÉCOLTE — cycle complet pour les unités capables de
// transporter des ressources (capaciteTransport > 0) : trajet vers
// le nœud, récolte limitée par la capacité, retour à la fourmilière,
// dépôt, puis reprise automatique si le nœud a encore de la
// ressource. Plusieurs nœuds peuvent être empilés dans la file
// d'ordres d'une même unité.
// ---------------------------------------------------------
const DUREE_RECOLTE = 2;   // secondes passées sur le nœud à récolter
const DUREE_DEPOSE = 0.5;  // secondes passées à la fourmilière à décharger

// Ajoute un ordre de récolte à la file de l'unité. Si l'unité est
// inactive, l'ordre démarre immédiatement ; sinon il attend son tour.
function donnerOrdreRecolte(unite, noeud) {
  const def = TYPES_UNITE[unite.type];
  if (!def || def.capaciteTransport <= 0) return false;

  unite.fileOrdres.push({ type: 'recolter', noeudId: noeud.id, typeRessource: noeud.type });
  if (unite.etatRecolte === 'idle' && unite.fileOrdres.length === 1) {
    demarrerProchainOrdreRecolte(unite);
  }
  return true;
}

// Passe au premier ordre de la file (ou repasse en inactif si elle
// est vide). Saute silencieusement tout ordre dont le nœud a
// disparu ou est épuisé.
function demarrerProchainOrdreRecolte(unite) {
  if (unite.fileOrdres.length === 0) {
    unite.etatRecolte = 'idle';
    unite.noeudCibleId = null;
    unite.tacheActuelle = 'Inactive';
    return;
  }
  const ordre = unite.fileOrdres[0];
  let noeud = trouverNoeudParId(ordre.noeudId);
  if (!noeud || noeud.quantite <= 0) {
    // Le nœud assigné à cet ordre est épuisé (ou a disparu) : avant
    // d'abandonner, on cherche un nœud de même type de ressource
    // encore disponible, pour que la récolte continue automatiquement
    // sans que le joueur ait à réassigner l'unité (voir aussi les
    // mêmes bascules dans mettreAJourRecolte, plus bas).
    const typeRessource = ordre.typeRessource || (noeud ? noeud.type : null);
    const remplacement = typeRessource ? trouverNoeudRessourceProche(typeRessource, unite.x, unite.y) : null;
    if (remplacement) {
      ordre.noeudId = remplacement.id;
      ordre.typeRessource = remplacement.type;
      noeud = remplacement;
    } else {
      unite.fileOrdres.shift();
      demarrerProchainOrdreRecolte(unite);
      return;
    }
  }
  unite.noeudCibleId = noeud.id;
  unite.etatRecolte = 'versRessource';
  unite.tacheActuelle = 'En route vers ' + TYPES_RESSOURCE[noeud.type].label;
}

// Annule tous les ordres (récolte ET combat) d'une unité, et la
// remet immédiatement en état inactif.
function annulerOrdres(unite) {
  unite.fileOrdres = [];
  unite.etatRecolte = 'idle';
  unite.noeudCibleId = null;
  unite.tacheActuelle = 'Inactive';
  unite.ordre = null;
  unite.cibleId = null;
  unite.destinationLibre = null; // voir combat.js → ordonnerDeplacementLibre
}

// Avance le cycle de récolte de toutes les unités alliées concernées.
// Appelée depuis la boucle de jeu (main.js).
function mettreAJourRecolte(delta) {
  for (const u of etat.unites) {
    if (u.faction !== 'joueur' || u.etatRecolte === 'idle') continue;
    const def = TYPES_UNITE[u.type];

    if (u.etatRecolte === 'versRessource') {
      let noeud = trouverNoeudParId(u.noeudCibleId);
      if (!noeud || noeud.quantite <= 0) {
        const ordreActuel = u.fileOrdres[0];
        const typeRessource = ordreActuel ? (ordreActuel.typeRessource || (noeud ? noeud.type : null)) : null;
        const remplacement = typeRessource ? trouverNoeudRessourceProche(typeRessource, u.x, u.y) : null;
        if (remplacement && ordreActuel) {
          ordreActuel.noeudId = remplacement.id;
          ordreActuel.typeRessource = remplacement.type;
          u.noeudCibleId = remplacement.id;
          u.tacheActuelle = 'En route vers ' + TYPES_RESSOURCE[remplacement.type].label;
          continue;
        }
        u.fileOrdres.shift();
        demarrerProchainOrdreRecolte(u);
        continue;
      }
      const d = distance(u.x, u.y, noeud.x, noeud.y);
      if (d > RAYON_TOUCHE_NOEUD) {
        avancerVers(u, noeud.x, noeud.y, def.vitesse, delta, RAYON_TOUCHE_NOEUD);
      } else {
        u.etatRecolte = 'recolte';
        u.minuteurRecolte = DUREE_RECOLTE;
        u.tacheActuelle = 'Récolte de ' + TYPES_RESSOURCE[noeud.type].label;
      }
    } else if (u.etatRecolte === 'recolte') {
      u.minuteurRecolte -= delta;
      if (u.minuteurRecolte <= 0) {
        const noeud = trouverNoeudParId(u.noeudCibleId);
        if (noeud && noeud.quantite > 0) {
          const preleve = Math.min(def.capaciteTransport, noeud.quantite);
          u.cargo = preleve;
          u.typeCargo = noeud.type;
          noeud.quantite -= preleve;
        }
        u.etatRecolte = 'versNid';
        u.tacheActuelle = 'Retour à la fourmilière';
      }
    } else if (u.etatRecolte === 'versNid') {
      // Retourne au nid allié le plus proche — la fourmilière d'origine
      // ou tout nid secondaire fondé par une jeune reine (colonies.js) —
      // plutôt que systématiquement la fourmilière de départ.
      const base = trouverBaseAllieeProche(u.x, u.y);
      const d = distance(u.x, u.y, base.x, base.y);
      if (d > base.rayon) {
        avancerVers(u, base.x, base.y, def.vitesse, delta, base.rayon);
      } else {
        u.etatRecolte = 'depose';
        u.minuteurRecolte = DUREE_DEPOSE;
        u.tacheActuelle = 'Dépôt des ressources';
      }
    } else if (u.etatRecolte === 'depose') {
      u.minuteurRecolte -= delta;
      if (u.minuteurRecolte <= 0) {
        if (u.cargo > 0 && u.typeCargo) {
          etat.ressources[u.typeCargo] = (etat.ressources[u.typeCargo] || 0) + u.cargo;
          etat.statistiques.ressourcesRecoltees += u.cargo;
          const baseDepot = trouverBaseAllieeProche(u.x, u.y);
          ajouterTexteFlottant(baseDepot.x, baseDepot.y - baseDepot.rayon - 10, '+' + u.cargo, '#f0e0c0');
        }
        u.cargo = 0;
        u.typeCargo = null;

        // Retour automatique : si le nœud ciblé par l'ordre en tête de
        // file a encore de la ressource, on y repart directement sans
        // dépiler l'ordre (boucle façon Harvester). S'il est épuisé,
        // on cherche un nœud de même type de ressource encore
        // disponible avant d'abandonner l'ordre — la fourmi passe
        // ainsi d'elle-même à une ressource similaire, sans
        // intervention du joueur. Ce n'est qu'à défaut de tout
        // remplacement qu'on dépile et qu'on passe à l'ordre suivant
        // (ou à l'inactivité s'il n'y en a plus).
        const ordreActuel = u.fileOrdres[0];
        const noeud = ordreActuel ? trouverNoeudParId(ordreActuel.noeudId) : null;
        if (noeud && noeud.quantite > 0) {
          u.etatRecolte = 'versRessource';
          u.tacheActuelle = 'En route vers ' + TYPES_RESSOURCE[noeud.type].label;
        } else {
          const typeRessource = ordreActuel ? (ordreActuel.typeRessource || (noeud ? noeud.type : null)) : null;
          const remplacement = typeRessource ? trouverNoeudRessourceProche(typeRessource, u.x, u.y) : null;
          if (remplacement && ordreActuel) {
            ordreActuel.noeudId = remplacement.id;
            ordreActuel.typeRessource = remplacement.type;
            u.etatRecolte = 'versRessource';
            u.tacheActuelle = 'En route vers ' + TYPES_RESSOURCE[remplacement.type].label;
          } else {
            if (ordreActuel) u.fileOrdres.shift();
            demarrerProchainOrdreRecolte(u);
          }
        }
      }
    }
  }
}

function dessinerNoeudRessource(ctx, noeud, temps) {
  if (noeud.quantite <= 0) return;
  const def = TYPES_RESSOURCE[noeud.type];
  const echelle = (0.4 + 0.6 * (noeud.quantite / noeud.quantiteInitiale)) * noeud.variationTaille;

  // Ombre au sol — une simple ellipse sombre semi-transparente plutôt
  // qu'un flou de canevas (ctx.shadowBlur) : avec potentiellement des
  // dizaines de nœuds visibles à l'écran, cette version reste bon
  // marché tout en donnant le même effet de profondeur.
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(noeud.x + 2 * echelle, noeud.y + 4 * echelle, 15 * echelle, 6 * echelle, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  if (noeud.type === 'eau') {
    ctx.fillStyle = def.couleurAccent;
    ctx.beginPath();
    ctx.ellipse(noeud.x, noeud.y, 22 * echelle, 15 * echelle, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = def.couleurPrincipale;
    ctx.beginPath();
    ctx.ellipse(noeud.x, noeud.y, 18 * echelle, 12 * echelle, 0, 0, Math.PI * 2);
    ctx.fill();
    // Reflet principal
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(noeud.x - 5 * echelle, noeud.y - 4 * echelle, 5 * echelle, 2.5 * echelle, 0, 0, Math.PI * 2);
    ctx.fill();
    // Scintillement animé — 2 petits reflets qui glissent doucement
    // sur la surface pour que l'eau ne soit jamais parfaitement figée.
    if (temps) {
      const t = temps.total;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      const sx1 = noeud.x + Math.cos(t * 0.6 + noeud.angleVariation) * 9 * echelle;
      const sy1 = noeud.y + Math.sin(t * 0.6 + noeud.angleVariation) * 5 * echelle;
      ctx.beginPath();
      ctx.ellipse(sx1, sy1, 1.6 * echelle, 0.9 * echelle, 0, 0, Math.PI * 2);
      ctx.fill();
      const sx2 = noeud.x + Math.cos(t * -0.45 + noeud.angleVariation + 2) * 11 * echelle;
      const sy2 = noeud.y + Math.sin(t * -0.45 + noeud.angleVariation + 2) * 6 * echelle;
      ctx.beginPath();
      ctx.ellipse(sx2, sy2, 1.1 * echelle, 0.7 * echelle, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (noeud.type === 'materiaux') {
    ctx.strokeStyle = def.couleurPrincipale;
    ctx.lineWidth = 2.5 * echelle;
    for (let i = 0; i < 4; i++) {
      const a = noeud.angleVariation + i * 0.7;
      const long = 12 * echelle;
      ctx.beginPath();
      ctx.moveTo(noeud.x - Math.cos(a) * long, noeud.y - Math.sin(a) * long * 0.5);
      ctx.lineTo(noeud.x + Math.cos(a) * long, noeud.y + Math.sin(a) * long * 0.5);
      ctx.stroke();
    }
    return;
  }

  // Nourriture : petit amas de graines
  ctx.fillStyle = def.couleurAccent;
  ctx.beginPath();
  ctx.ellipse(noeud.x, noeud.y + 2 * echelle, 16 * echelle, 8 * echelle, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = def.couleurPrincipale;
  const positions = [[-6, -2], [0, -5], [6, -2], [-3, 1], [3, 1]];
  for (const [dx, dy] of positions) {
    ctx.beginPath();
    ctx.ellipse(noeud.x + dx * echelle, noeud.y + dy * echelle, 4 * echelle, 3 * echelle, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

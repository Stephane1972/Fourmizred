// ===========================================================
// RESOURCES — nœuds de ressources récoltables posés sur la carte
// (nourriture, eau, matériaux). Les phéromones et la population ne
// sont pas des nœuds sur la carte : elles vivent uniquement dans
// `etat.ressources` (voir state.js) et seront gérées par
// buildings.js / units.js aux prochaines vagues.
//
// À cette vague, les nœuds sont uniquement posés et affichés — la
// récolte réelle (une unité qui vient prélever dedans) arrivera avec
// units.js.
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

  unite.fileOrdres.push({ type: 'recolter', noeudId: noeud.id });
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
  const noeud = trouverNoeudParId(ordre.noeudId);
  if (!noeud || noeud.quantite <= 0) {
    unite.fileOrdres.shift();
    demarrerProchainOrdreRecolte(unite);
    return;
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
}

// Avance le cycle de récolte de toutes les unités alliées concernées.
// Appelée depuis la boucle de jeu (main.js).
function mettreAJourRecolte(delta) {
  for (const u of etat.unites) {
    if (u.faction !== 'joueur' || u.etatRecolte === 'idle') continue;
    const def = TYPES_UNITE[u.type];

    if (u.etatRecolte === 'versRessource') {
      const noeud = trouverNoeudParId(u.noeudCibleId);
      if (!noeud || noeud.quantite <= 0) {
        u.fileOrdres.shift();
        demarrerProchainOrdreRecolte(u);
        continue;
      }
      const d = distance(u.x, u.y, noeud.x, noeud.y);
      if (d > RAYON_TOUCHE_NOEUD) {
        const angle = Math.atan2(noeud.y - u.y, noeud.x - u.x);
        const pas = Math.min(def.vitesse * delta, d - RAYON_TOUCHE_NOEUD + 1);
        u.x += Math.cos(angle) * pas;
        u.y += Math.sin(angle) * pas;
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
      const d = distance(u.x, u.y, fourmiliere.x, fourmiliere.y);
      if (d > fourmiliere.rayon) {
        const angle = Math.atan2(fourmiliere.y - u.y, fourmiliere.x - u.x);
        const pas = Math.min(def.vitesse * delta, d - fourmiliere.rayon + 1);
        u.x += Math.cos(angle) * pas;
        u.y += Math.sin(angle) * pas;
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
          ajouterTexteFlottant(fourmiliere.x, fourmiliere.y - fourmiliere.rayon - 10, '+' + u.cargo, '#f0e0c0');
        }
        u.cargo = 0;
        u.typeCargo = null;

        // Retour automatique : si le nœud ciblé par l'ordre en tête de
        // file a encore de la ressource, on y repart directement sans
        // dépiler l'ordre (boucle façon Harvester). Sinon on passe au
        // suivant dans la file, ou on repasse inactive s'il n'y en a plus.
        const ordreActuel = u.fileOrdres[0];
        const noeud = ordreActuel ? trouverNoeudParId(ordreActuel.noeudId) : null;
        if (noeud && noeud.quantite > 0) {
          u.etatRecolte = 'versRessource';
          u.tacheActuelle = 'En route vers ' + TYPES_RESSOURCE[noeud.type].label;
        } else {
          if (ordreActuel) u.fileOrdres.shift();
          demarrerProchainOrdreRecolte(u);
        }
      }
    }
  }
}

function dessinerNoeudRessource(ctx, noeud) {
  if (noeud.quantite <= 0) return;
  const def = TYPES_RESSOURCE[noeud.type];
  const echelle = (0.4 + 0.6 * (noeud.quantite / noeud.quantiteInitiale)) * noeud.variationTaille;

  if (noeud.type === 'eau') {
    ctx.fillStyle = def.couleurAccent;
    ctx.beginPath();
    ctx.ellipse(noeud.x, noeud.y, 22 * echelle, 15 * echelle, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = def.couleurPrincipale;
    ctx.beginPath();
    ctx.ellipse(noeud.x, noeud.y, 18 * echelle, 12 * echelle, 0, 0, Math.PI * 2);
    ctx.fill();
    // Reflet
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(noeud.x - 5 * echelle, noeud.y - 4 * echelle, 5 * echelle, 2.5 * echelle, 0, 0, Math.PI * 2);
    ctx.fill();
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

// ===========================================================
// UNITS — définition des types d'unités et de leurs statistiques,
// et gestion des instances vivantes (etat.unites, voir state.js).
//
// Le combat (dégâts, portée, sélection, ordres) vit dans combat.js,
// qui s'appuie sur les statistiques définies ici.
// ===========================================================

const TYPES_UNITE = {
  ouvriere: {
    label: 'Ouvrière',
    cout: { nourriture: 30 },
    tempsProduction: 8,
    pv: 40,
    vitesse: 60,
    degats: 2,
    portee: 14,
    cadenceAttaque: 1.5,
    capaciteTransport: 20,
    capacite: 'Peut collecter les ressources de la carte',
    couleur: '#8a6a45'
  },
  nourrice: {
    label: 'Nourrice',
    cout: { nourriture: 25, eau: 10 },
    tempsProduction: 10,
    pv: 30,
    vitesse: 45,
    degats: 1,
    portee: 14,
    cadenceAttaque: 1.8,
    capaciteTransport: 8,
    capacite: 'Accélère la croissance des larves à proximité',
    couleur: '#c9a8d8'
  },
  eclaireuse: {
    label: 'Éclaireuse',
    cout: { nourriture: 20 },
    tempsProduction: 6,
    pv: 25,
    vitesse: 110,
    degats: 3,
    portee: 16,
    cadenceAttaque: 1.2,
    capaciteTransport: 0,
    capacite: 'Grand rayon de vision, repère les menaces au loin',
    couleur: '#e0c69a'
  },
  fourmiRouge: {
    label: 'Fourmi rouge',
    cout: { nourriture: 40, materiaux: 15 },
    tempsProduction: 14,
    pv: 70,
    vitesse: 55,
    degats: 12,
    portee: 18,
    cadenceAttaque: 0.9,
    capaciteTransport: 0,
    capacite: 'Morsure acide, dégâts bonus contre unités légères',
    couleur: '#c0402a'
  },
  fourmiCharpentiere: {
    label: 'Fourmi charpentière',
    cout: { nourriture: 35, materiaux: 30 },
    tempsProduction: 16,
    pv: 90,
    vitesse: 50,
    degats: 16,
    portee: 20,
    cadenceAttaque: 1.0,
    capaciteTransport: 0,
    capacite: 'Mandibules puissantes, dégâts bonus contre bâtiments',
    couleur: '#5a3820'
  },

  // ---------------------------------------------------------
  // UNITÉS AVANCÉES — niveaux 3 à 5, du plus faible au plus puissant.
  // Chacune ajoute un champ `faiblesse` (nouveau) et `batimentRequis`
  // (nouveau) en plus des statistiques habituelles. `batimentRequis`
  // référence soit un bâtiment déjà construit (caserne, nurserie,
  // ecoleEclaireuses), soit "chambreSpecialistes" — désormais
  // constructible par le joueur (voir buildings.js), ce qui rend ces
  // unités réellement productibles une fois le bâtiment achevé.
  // ---------------------------------------------------------

  // --- Niveau 3 ---
  fourmiTisserande: {
    label: 'Fourmi tisserande',
    cout: { nourriture: 45, materiaux: 30 },
    tempsProduction: 12,
    pv: 110,
    vitesse: 65,
    degats: 10,
    portee: 16,
    cadenceAttaque: 1.2,
    capaciteTransport: 15,
    capacite: 'Combat et récolte à la fois ; tisse de la soie pour renforcer les structures alliées (effet à venir)',
    faiblesse: 'PV modestes pour son coût, mal adaptée au combat prolongé',
    batimentRequis: 'chambreSpecialistes',
    couleur: '#3a6a4a'
  },
  fourmiLegionnaire: {
    label: 'Fourmi légionnaire',
    cout: { nourriture: 50, materiaux: 20 },
    tempsProduction: 16,
    pv: 120,
    vitesse: 60,
    degats: 16,
    portee: 20,
    cadenceAttaque: 0.9,
    capaciteTransport: 0,
    capacite: 'Discipline de formation : efficace en groupe, coordonnée au combat',
    faiblesse: 'Perd son efficacité si isolée du reste de sa colonne',
    batimentRequis: 'caserne',
    couleur: '#6a3a2a'
  },
  fourmiChimiste: {
    label: 'Fourmi chimiste',
    cout: { nourriture: 45, materiaux: 35 },
    tempsProduction: 15,
    pv: 100,
    vitesse: 55,
    degats: 24,
    portee: 24,
    cadenceAttaque: 1.4,
    capaciteTransport: 0,
    capacite: 'Projection chimique à distance, ignore une partie de la résistance adverse',
    faiblesse: 'Peu de PV et cadence de tir lente : vulnérable au corps-à-corps rapide',
    batimentRequis: 'chambreSpecialistes',
    couleur: '#8a7a2a'
  },
  fourmiVolante: {
    label: 'Fourmi volante',
    cout: { nourriture: 40 },
    tempsProduction: 10,
    pv: 90,
    vitesse: 130,
    degats: 14,
    portee: 18,
    cadenceAttaque: 1.0,
    capaciteTransport: 5,
    capacite: 'Vole directement vers sa cible, la plus rapide de toutes les unités',
    faiblesse: 'Peu de PV, cible facile pour les défenses à longue portée',
    batimentRequis: 'ecoleEclaireuses',
    couleur: '#c9c9e0',
    tailleMultiplicateur: 0.9
  },

  // --- Niveau 4 ---
  fourmiBouledogue: {
    label: 'Fourmi bouledogue',
    cout: { nourriture: 70, materiaux: 40 },
    tempsProduction: 20,
    pv: 200,
    vitesse: 50,
    degats: 28,
    portee: 16,
    cadenceAttaque: 1.0,
    capaciteTransport: 0,
    capacite: 'Morsure écrasante, parmi les plus robustes au corps-à-corps',
    faiblesse: 'Très lente, facile à contourner ou à harceler à distance',
    batimentRequis: 'caserne',
    couleur: '#4a1a1a',
    tailleMultiplicateur: 1.3
  },
  fourmiPiege: {
    label: 'Fourmi piège',
    cout: { materiaux: 60 },
    tempsProduction: 14,
    pv: 70,
    vitesse: 20,
    degats: 35,
    portee: 18,
    cadenceAttaque: 2.2,
    capaciteTransport: 0,
    capacite: 'Embuscade : dégâts d\'ouverture très élevés au premier contact',
    faiblesse: 'Très peu de PV, ne survit pas à un combat prolongé une fois repérée',
    batimentRequis: 'chambreSpecialistes',
    couleur: '#2a2418'
  },
  fourmiBalleDeFusil: {
    label: 'Fourmi balle de fusil',
    cout: { nourriture: 90, materiaux: 20 },
    tempsProduction: 22,
    pv: 170,
    vitesse: 75,
    degats: 32,
    portee: 16,
    cadenceAttaque: 1.1,
    capaciteTransport: 0,
    capacite: 'Piqûre parmi les plus douloureuses de la nature, dégâts élevés et fiables',
    faiblesse: 'Coût élevé en nourriture, longue à produire',
    batimentRequis: 'caserne',
    couleur: '#8a1a1a'
  },
  soldatGeant: {
    label: 'Soldat géant',
    cout: { nourriture: 100, materiaux: 60 },
    tempsProduction: 26,
    pv: 280,
    vitesse: 40,
    degats: 26,
    portee: 22,
    cadenceAttaque: 1.3,
    capaciteTransport: 0,
    capacite: 'Gabarit imposant, la plus grande réserve de PV de toutes les unités classiques',
    faiblesse: 'Très lent et coûteux, cible prioritaire évidente pour l\'adversaire',
    batimentRequis: 'caserne',
    couleur: '#3a2818',
    tailleMultiplicateur: 1.6
  },

  // --- Niveau 5 ---
  fourmiExplosive: {
    label: 'Fourmi explosive',
    cout: { nourriture: 60, materiaux: 80 },
    tempsProduction: 18,
    pv: 50,
    vitesse: 70,
    degats: 80,
    portee: 14,
    cadenceAttaque: 5,
    capaciteTransport: 0,
    capacite: 'Dégâts d\'un seul coup les plus élevés du jeu — l\'auto-destruction au contact n\'est pas encore codée : elle combat pour l\'instant comme une unité normale, très fragile',
    faiblesse: 'PV extrêmement faibles, meurt en un ou deux coups adverses',
    batimentRequis: 'chambreSpecialistes',
    couleur: '#c04020',
    tailleMultiplicateur: 0.85
  },
  reineGuerriere: {
    label: 'Reine guerrière',
    cout: { nourriture: 200, materiaux: 150 },
    tempsProduction: 60,
    pv: 400,
    vitesse: 35,
    degats: 35,
    portee: 24,
    cadenceAttaque: 1.0,
    capaciteTransport: 0,
    capacite: 'Unité d\'élite ultime : PV et dégâts les plus élevés du jeu',
    faiblesse: 'Coût et temps de production prohibitifs ; perte lourde de conséquence si elle tombe',
    batimentRequis: 'chambreSpecialistes',
    couleur: '#4a1a3a',
    tailleMultiplicateur: 1.9
  },

  // --- Fondation de colonie (voir colonies.js) ---
  jeuneReine: {
    label: 'Jeune reine',
    cout: { nourriture: 150, materiaux: 80 },
    tempsProduction: 40,
    pv: 120,
    vitesse: 30,
    degats: 0,
    portee: 0,
    cadenceAttaque: 1,
    capaciteTransport: 0,
    capacite: 'Peut voyager jusqu\'à un site choisi et s\'y déployer pour fonder un second nid (façon "MCV")',
    faiblesse: 'Ne combat pas du tout ; entièrement dépendante d\'une escorte pendant son trajet',
    batimentRequis: 'nurserie',
    couleur: '#7a3a6a',
    tailleMultiplicateur: 1.2
  },

  // --- Infiltration / guerre spéciale (voir infiltration.js et le
  // mécanisme de camouflage dans combat.js) ---
  ouvriereInfiltratrice: {
    label: 'Ouvrière infiltratrice',
    cout: { nourriture: 120, materiaux: 60 },
    tempsProduction: 22,
    pv: 70,
    vitesse: 55,
    degats: 0,
    portee: 0,
    cadenceAttaque: 1,
    capaciteTransport: 0,
    capacite: 'Capture instantanément la colonie rivale en l\'atteignant (façon "ingénieur")',
    faiblesse: 'Ne combat jamais ; ne survit à aucune attaque ennemie pendant le trajet',
    batimentRequis: 'chambreSpecialistes',
    couleur: '#2a6a5a',
    tailleMultiplicateur: 0.95
  },
  fourmiCamouflee: {
    label: 'Fourmi camouflée',
    cout: { nourriture: 90, materiaux: 140 },
    tempsProduction: 26,
    pv: 60,
    vitesse: 50,
    degats: 16,
    portee: 90,
    cadenceAttaque: 1.3,
    capaciteTransport: 0,
    camouflage: true,
    capacite: 'Invisible aux fourmis ennemies ordinaires tant qu\'elle n\'a pas attaqué depuis quelques secondes ; les araignées/scarabées et tout futur détecteur la voient toujours',
    faiblesse: 'Redevient visible et vulnérable pendant quelques secondes après chaque attaque',
    batimentRequis: 'chambreSpecialistes',
    couleur: '#4a4a6a',
    tailleMultiplicateur: 0.9
  },

  // Menaces sauvages — ne sont produites par aucun bâtiment, seulement
  // posées sur la carte au démarrage (voir combat.js). Ne recherchent
  // pas activement à s'entretuer avec la colonie rivale : elles n'en
  // veulent qu'à vos unités et à votre fourmilière. `detecteur: true`
  // signifie qu'elles perçoivent une unité camouflée (fourmiCamouflee)
  // comme n'importe quelle autre — leurs sens de prédateur ignorent le
  // camouflage qui trompe les fourmis ennemies ordinaires.
  araignee: {
    label: 'Araignée',
    cout: {},
    tempsProduction: 0,
    pv: 150,
    vitesse: 35,
    degats: 20,
    portee: 20,
    cadenceAttaque: 1.3,
    capaciteTransport: 0,
    detecteur: true,
    capacite: 'Morsure venimeuse redoutable, attaque quiconque approche',
    couleur: '#3a1f4a',
    tailleMultiplicateur: 1.8
  },
  scarabee: {
    label: 'Scarabée',
    cout: {},
    tempsProduction: 0,
    pv: 80,
    vitesse: 45,
    degats: 10,
    portee: 16,
    cadenceAttaque: 1.0,
    capaciteTransport: 0,
    detecteur: true,
    capacite: 'Carapace résistante, fonce droit sur ses cibles',
    couleur: '#2a3a1a',
    tailleMultiplicateur: 1.4
  }
};

let prochainIdUnite = 1;

// Crée une instance d'unité à la sortie d'un bâtiment de production.
// Appelée par buildings.js quand une production arrive à son terme.
function creerUnite(typeUnite, batiment) {
  const def = TYPES_UNITE[typeUnite];
  const defBatiment = TYPES_BATIMENT_PRODUCTION[batiment.type];
  const angle = Math.random() * Math.PI * 2;
  const rayonSortie = defBatiment.rayon + 18;
  const x = batiment.x + Math.cos(angle) * rayonSortie;
  const y = batiment.y + Math.sin(angle) * rayonSortie;

  const unite = creerInstanceUnite(typeUnite, x, y, 'joueur');

  // Point de ralliement (voir buildings.js → definirPointRalliement) —
  // l'unité fraîchement produite s'y rend automatiquement toute seule,
  // sans que le joueur ait à la sélectionner et à lui donner l'ordre
  // manuellement à chaque sortie de bâtiment. Exclu pour la jeune
  // reine et l'infiltratrice : leurs propres systèmes de déplacement
  // spécialisés (colonies.js, infiltration.js) ne doivent jamais
  // tourner en même temps que le déplacement libre sur la même unité.
  if (batiment.pointRalliement && typeUnite !== 'jeuneReine' && typeUnite !== 'ouvriereInfiltratrice') {
    ordonnerDeplacementLibre(unite, batiment.pointRalliement.x, batiment.pointRalliement.y);
  }

  etat.unites.push(unite);
  jouerProduction();
  etat.statistiques.unitesProduites++;

  if (etat.progressionMission) etat.progressionMission.unitesProduites++;
}

// Fabrique brute d'une instance d'unité — utilisée à la fois par la
// production (ci-dessus) et par combat.js pour poser la colonie
// ennemie de départ.
function creerInstanceUnite(typeUnite, x, y, faction) {
  const def = TYPES_UNITE[typeUnite];
  return {
    id: prochainIdUnite++,
    type: typeUnite,
    x, y,
    pv: def.pv,
    pvMax: def.pv,
    vitesse: def.vitesse,
    faction,
    selectionnee: false,
    ordre: null,        // null | 'attaquer'  (combat.js)
    cibleId: null,       // id de l'unité ciblée par un ordre d'attaque
    cooldownAttaque: 0,
    // Récolte (voir resources.js)
    fileOrdres: [],       // [{ type: 'recolter', noeudId }]
    etatRecolte: 'idle',  // idle | versRessource | recolte | versNid | depose
    noeudCibleId: null,
    cargo: 0,
    typeCargo: null,
    minuteurRecolte: 0,
    tacheActuelle: 'Inactive',
    phaseIdle: Math.random() * Math.PI * 2,
    // Animation de déplacement (voir mettreAJourAnimationUnites, plus
    // bas) : orientation courante, phase de balancement des pattes
    // (avance avec la distance parcourue, pas avec le temps, pour que
    // le rythme des pattes suive vraiment la vitesse de l'unité), et
    // dernière position connue pour détecter le mouvement frame à frame.
    angleDeplacement: 0,
    enMouvement: false,
    phaseMarche: Math.random() * Math.PI * 2,
    derniereX: x,
    derniereY: y,
    // Fondation de nid (voir colonies.js) — uniquement pertinent pour
    // le type 'jeuneReine', mais posé sur toute unité pour rester
    // cohérent avec le reste de la structure (comme fileOrdres/cargo,
    // toujours présents même sur des unités qui ne récoltent jamais).
    fondationCible: null,
    etatFondation: 'idle', // idle | enRoute | construction
    minuteurFondation: 0,
    // Déplacement libre (voir combat.js → ordonnerDeplacementLibre,
    // deplacerUnitesLibres) — un simple point à atteindre, utilisé par
    // le tap sur terrain vide (input.js) et par le point de
    // ralliement d'un bâtiment (buildings.js). Toujours cédé le pas
    // par tout ordre plus spécifique (récolte, attaque, fondation,
    // infiltration) — voir la garde en tête de deplacerUnitesLibres.
    destinationLibre: null,
    // Vétérance (voir combat.js → RANGS_VETERANCE, ajouterExperience) —
    // rang gagné au combat, PV et dégâts bonus qui vont avec.
    rang: 0,
    experience: 0,
    dernierAttaquantId: null,
    // Camouflage (voir combat.js → estIndetectablePar) — grand au
    // départ pour qu'une unité fraîchement créée soit bien "invisible
    // depuis longtemps" plutôt que considérée comme venant d'attaquer.
    tempsDepuisAttaque: 999
  };
}

// ---------------------------------------------------------
// ANIMATION DE DÉPLACEMENT — détecte, pour chaque unité vivante, si
// elle a bougé depuis la dernière frame (combat.js et resources.js
// modifient u.x/u.y directement, sans jamais poser d'orientation ni
// de notion de "en mouvement" : c'est ce que cette fonction déduit).
// Appelée une fois par frame depuis main.js, indépendamment du rendu
// (donc même pour les unités actuellement hors-écran), pour que
// l'animation ne saute jamais quand la caméra revient sur une unité.
// ---------------------------------------------------------
function mettreAJourAnimationUnites(delta) {
  for (const u of etat.unites) {
    if (u.pv <= 0) continue;
    const dx = u.x - u.derniereX;
    const dy = u.y - u.derniereY;
    const distanceParcourue = Math.hypot(dx, dy);

    if (distanceParcourue > 0.02) {
      u.angleDeplacement = Math.atan2(dy, dx);
      u.enMouvement = true;
      // Le rythme de balancement suit la distance réellement
      // parcourue : une unité rapide agite ses pattes plus vite
      // qu'une unité lente, sans dépendre du taux de rafraîchissement.
      u.phaseMarche += distanceParcourue * 0.5;
    } else {
      u.enMouvement = false;
    }

    u.derniereX = u.x;
    u.derniereY = u.y;
  }
}

const RAYON_TOUCHE_UNITE = 20;

// Trouve l'unité vivante la plus proche d'un point du monde, avec un
// filtre de faction optionnel. Utilisée par input.js pour la
// sélection et le ciblage.
function trouverUniteSous(mondeX, mondeY, faction) {
  let plusProche = null, meilleureDist = RAYON_TOUCHE_UNITE;
  for (const u of etat.unites) {
    if (u.pv <= 0) continue;
    if (faction && u.faction !== faction) continue;
    const d = distance(u.x, u.y, mondeX, mondeY);
    if (d < meilleureDist) { meilleureDist = d; plusProche = u; }
  }
  return plusProche;
}

// ---------------------------------------------------------
// RENDU — simple mais distinct par type (couleur propre à chaque
// unité), avec une teinte rougeâtre pour la faction ennemie afin de
// distinguer immédiatement alliés et adversaires au combat.
// ---------------------------------------------------------
function dessinerUnite(ctx, u, temps, simplifie) {
  const def = TYPES_UNITE[u.type];
  if (!def) return;

  // Anneau de sélection, au sol, ne suit pas l'animation de repos —
  // légère pulsation (rayon + opacité) pour rester bien visible sans
  // être statique, cohérent avec le reste des retouches d'ambiance.
  if (u.selectionnee) {
    const pulsation = Math.sin(temps.total * 3.2) * 0.5 + 0.5;
    ctx.strokeStyle = '#3ae03a';
    ctx.globalAlpha = 0.7 + pulsation * 0.3;
    ctx.lineWidth = (1.5 + pulsation * 0.6) / etat.camera.zoom;
    ctx.beginPath();
    ctx.ellipse(u.x, u.y, 12 + pulsation, 8 + pulsation * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Tâche actuelle — affichée seulement pour l'unité sélectionnée,
    // pour ne pas encombrer l'écran quand plusieurs unités sont visibles.
    if (u.tacheActuelle) {
      ctx.fillStyle = '#f0e0c0';
      ctx.font = `${10.5 / etat.camera.zoom}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(u.tacheActuelle, u.x, u.y - 20 / etat.camera.zoom);
    }
  }

  // Cargaison transportée, visible sur toutes les unités (pas
  // seulement la sélectionnée) pour repérer d'un coup d'œil qui
  // ramène des ressources.
  if (u.cargo > 0 && u.typeCargo && TYPES_RESSOURCE[u.typeCargo]) {
    ctx.fillStyle = TYPES_RESSOURCE[u.typeCargo].couleurPrincipale;
    ctx.beginPath();
    ctx.ellipse(u.x, u.y - 12 / etat.camera.zoom, 3.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Anneau rouge sur toute unité actuellement désignée comme cible
  // par un ordre d'attaque d'une unité alliée — rend la "sélection
  // d'une cible" visible, pas seulement effective en interne. Même
  // traitement de pulsation, en rouge, pour signaler l'urgence.
  const estCiblee = etat.unites.some((a) => a.faction === 'joueur' && a.ordre === 'attaquer' && a.cibleId === u.id);
  if (estCiblee) {
    const pulsation = Math.sin(temps.total * 5) * 0.5 + 0.5;
    ctx.strokeStyle = '#e0503c';
    ctx.globalAlpha = 0.75 + pulsation * 0.25;
    ctx.lineWidth = (1.5 + pulsation * 0.7) / etat.camera.zoom;
    ctx.beginPath();
    ctx.ellipse(u.x, u.y, 13 + pulsation, 9 + pulsation * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  const respiration = Math.sin(temps.total * 2 + u.phaseIdle) * 1.4;
  const couleurCorps = u.faction === 'ennemi' && !def.tailleMultiplicateur ? ajusterCouleur('#8a2418', 0) : def.couleur;
  const echelle = def.tailleMultiplicateur || 1;

  ctx.save();
  ctx.translate(u.x, u.y + respiration);
  // Le corps entier s'oriente vers la direction de déplacement — les
  // pattes et antennes ci-dessous sont donc dessinées dans le repère
  // local "vers l'avant = +x", quelle que soit la direction réelle.
  ctx.rotate(u.angleDeplacement || 0);

  // Camouflage (combat.js) : semi-transparente tant qu'elle n'a pas
  // attaqué récemment — redevient pleinement opaque le temps qu'elle
  // est "révélée" après une attaque, pour que le joueur voie
  // clairement la fenêtre de vulnérabilité.
  if (def.camouflage && u.tempsDepuisAttaque >= DUREE_REVELATION_CAMOUFLAGE) {
    ctx.globalAlpha = 0.5;
  }

  // Ombre (dessinée hors rotation le temps de son propre calcul pour
  // rester au sol, donc on la remet en coordonnées non tournées) —
  // omise en rendu simplifié (voir SEUIL_RENDU_SIMPLIFIE plus haut).
  if (!simplifie) {
    ctx.save();
    ctx.rotate(-(u.angleDeplacement || 0));
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(-1 * echelle, 2, 8 * echelle, 3 * echelle, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Amplitude du balancement des pattes et des antennes : bien plus
  // marquée en mouvement, mais jamais totalement figée à l'arrêt (les
  // antennes continuent de tâtonner doucement, comme une vraie fourmi).
  const amplitudePattes = u.enMouvement ? 0.85 : 0.12;
  const amplitudeAntennes = u.enMouvement ? 0.3 : 0.14;
  const vitesseAntennesIdle = temps.total * (u.enMouvement ? 5 : 2) + u.phaseIdle;

  // Pattes — 3 paires, toutes rattachées près du thorax (comme une
  // vraie fourmi : les 6 pattes partent du segment médian, jamais de
  // l'abdomen ni de la tête), en démarche "tripode" (avant-gauche/
  // milieu-droite/arrière-gauche ensemble, en opposition avec les
  // trois autres) — le schéma de marche le plus reconnaissable.
  // Omises en rendu simplifié : c'est la partie la plus coûteuse
  // (6 courbes par fourmi) pour le moins visible à l'échelle d'un
  // combat de masse vu de loin.
  if (!simplifie) {
    ctx.strokeStyle = ajusterCouleur(couleurCorps, -45);
    ctx.lineWidth = Math.max(0.7, 1) / etat.camera.zoom;
    const positionsAttache = [-1.1, 0.5, 2.1];
    for (let i = 0; i < positionsAttache.length; i++) {
      const attacheX = positionsAttache[i] * echelle;
      for (const cote of [-1, 1]) {
        const groupe = (i + (cote === -1 ? 0 : 1)) % 2;
        const balancement = Math.sin(u.phaseMarche + groupe * Math.PI) * amplitudePattes;
        const attacheY = cote * 2.3 * echelle;
        const genouX = attacheX + balancement * 1.5 * echelle;
        const genouY = cote * 4.6 * echelle;
        const piedX = attacheX + balancement * 3 * echelle;
        const piedY = cote * 6.6 * echelle;

        ctx.beginPath();
        ctx.moveTo(attacheX, attacheY);
        ctx.quadraticCurveTo(genouX, genouY, piedX, piedY);
        ctx.stroke();
      }
    }
  }

  // Corps en 3 segments distincts reliés par un pétiole fin — LA
  // différence visuelle entre une fourmi et un termite : un termite a
  // un corps uniforme sans taille marquée, une fourmi a un "nœud"
  // étroit entre le thorax et le gastre (l'abdomen). Sans ce
  // rétrécissement, même avec des pattes et des antennes, la
  // silhouette lit comme un termite — c'est le défaut corrigé ici.
  const xGastre = -6.3 * echelle;
  const xPetiole = -1.9 * echelle;
  const xThorax = 0.5 * echelle;
  const xTete = 4.5 * echelle;

  // Gastre (abdomen) — le plus gros segment, à l'arrière
  ctx.fillStyle = couleurCorps;
  ctx.beginPath();
  ctx.ellipse(xGastre, 0, 5.2 * echelle, 4 * echelle, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pétiole — le "nœud" fin qui rattache le gastre au thorax
  ctx.fillStyle = ajusterCouleur(couleurCorps, -20);
  ctx.beginPath();
  ctx.ellipse(xPetiole, 0, 1.1 * echelle, 1.3 * echelle, 0, 0, Math.PI * 2);
  ctx.fill();

  // Thorax (mésosome) — segment médian, c'est lui qui porte les pattes
  ctx.fillStyle = ajusterCouleur(couleurCorps, -10);
  ctx.beginPath();
  ctx.ellipse(xThorax, 0, 2.7 * echelle, 2.2 * echelle, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tête — plus petite et plus anguleuse que le termite générique,
  // avec de courtes mandibules qui pointent vers l'avant.
  ctx.fillStyle = ajusterCouleur(couleurCorps, -30);
  ctx.beginPath();
  ctx.ellipse(xTete, 0, 2.5 * echelle, 2.3 * echelle, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = ajusterCouleur(couleurCorps, -60);
  ctx.lineWidth = Math.max(0.6, 0.8) / etat.camera.zoom;
  const pointeTeteX = xTete + 2.3 * echelle;
  if (!simplifie) {
    for (const cote of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(pointeTeteX - 0.4 * echelle, cote * 0.9 * echelle);
      ctx.lineTo(pointeTeteX + 1.5 * echelle, cote * 1.7 * echelle);
      ctx.stroke();
    }
  }

  // Antennes "coudées" (deux segments avec un angle net, jamais une
  // courbe lisse) — l'autre grand indice visuel qui distingue une
  // fourmi d'un termite, dont les antennes sont perlées et droites.
  // Le premier segment (scape) reste presque fixe, seul le second
  // (flagelle) tâtonne, comme le ferait une vraie antenne. Omises en
  // rendu simplifié comme les pattes.
  if (!simplifie) {
    ctx.strokeStyle = ajusterCouleur(couleurCorps, -55);
    ctx.lineWidth = Math.max(0.6, 0.9) / etat.camera.zoom;
    for (const cote of [-1, 1]) {
      const tatonnement = Math.sin(vitesseAntennesIdle + cote * 0.6) * amplitudeAntennes;
      const angleScape = cote * 0.5;
      const angleFlagelle = cote * 1.2 + tatonnement;

      const baseX = xTete;
      const baseY = cote * 1.2 * echelle;
      const coudeX = baseX + Math.cos(angleScape) * 3 * echelle;
      const coudeY = baseY + Math.sin(angleScape) * 3 * echelle - cote * 0.3 * echelle;
      const pointeX = coudeX + Math.cos(angleFlagelle) * 3.4 * echelle;
      const pointeY = coudeY + Math.sin(angleFlagelle) * 3.4 * echelle;

      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(coudeX, coudeY);
      ctx.lineTo(pointeX, pointeY);
      ctx.stroke();
    }
  }

  ctx.restore();

  // Chevrons de vétérance — visibles en permanence (pas seulement à la
  // sélection) pour repérer d'un coup d'œil les unités expérimentées
  // en plein combat, comme dans Command & Conquer.
  if (u.rang > 0) {
    ctx.fillStyle = '#ffd27a';
    ctx.font = `bold ${8 / etat.camera.zoom}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('▲'.repeat(u.rang), u.x, u.y - 18 / etat.camera.zoom);
  }

  // Barre de vie, seulement si l'unité a déjà été blessée
  if (u.pv < u.pvMax) {
    const largeur = 16;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(u.x - largeur / 2, u.y - 14, largeur, 3);
    ctx.fillStyle = u.pv / u.pvMax > 0.3 ? '#3ae03a' : '#e0503c';
    ctx.fillRect(u.x - largeur / 2, u.y - 14, largeur * (u.pv / u.pvMax), 3);
  }
}

// Seuil au-delà duquel on simplifie le rendu (pattes/antennes/
// mandibules omises, ombre au sol omise) — trouvé lors d'un audit de
// performance : le coût logique du jeu est négligeable même à 100+
// unités (mesuré), mais chaque fourmi dessinée en détail complet
// représente une bonne dizaine d'appels de tracé canevas (6 pattes +
// 2 antennes + mandibules + ombre) ; sur un appareil bas de gamme,
// c'est le VRAI goulot d'étranglement probable en combat de masse, pas
// la logique de jeu. Le corps (3 segments), la barre de vie, l'anneau
// de sélection et les chevrons de rang restent toujours dessinés :
// seule la finition animée disparaît, jamais la lisibilité du combat.
const SEUIL_RENDU_SIMPLIFIE = 45;

function dessinerUnites(ctx, temps) {
  const zone = zoneVisibleMonde(40);
  const visibles = etat.unites.filter((u) =>
    u.x >= zone.x1 && u.x <= zone.x2 && u.y >= zone.y1 && u.y <= zone.y2
  );
  const simplifie = visibles.length > SEUIL_RENDU_SIMPLIFIE;
  for (const u of visibles) {
    dessinerUnite(ctx, u, temps, simplifie);
  }
}

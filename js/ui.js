// ===========================================================
// UI — interface tactile compacte (VAGUE 13 : optimisation Android).
//
// Ce module ne définit AUCUNE règle de jeu : il construit uniquement
// des éléments d'interface (HTML généré en JavaScript) qui appellent
// les fonctions déjà existantes des modules précédents — exactement
// les mêmes que celles déclenchées jusqu'ici au clavier par main.js
// (RACCOURCIS_PRODUCTION, RACCOURCIS_DEFENSE, RACCOURCIS_LABORATOIRE,
// S/L/Suppr, C). Les raccourcis clavier restent fonctionnels tels
// quels pour ne rien casser sur desktop.
//
// Chargé en tout dernier (voir index.html) : tous les modules dont
// il dépend (state.js, buildings.js, defenses.js, research.js,
// missions.js, storage.js, combat.js, resources.js, renderer.js,
// main.js) sont donc déjà chargés et leurs fonctions/constantes déjà
// définies au moment où ce fichier s'exécute.
// ===========================================================

// -----------------------------------------------------------
// RÉFÉRENCES DOM — les conteneurs vides posés dans index.html.
// -----------------------------------------------------------
const elBarreRessources = document.getElementById('barre-ressources');
const elPanneauMenu = document.getElementById('panneau-menu');
const elBarreOutils = document.getElementById('barre-outils');
const elBoutonPleinEcran = document.getElementById('bouton-plein-ecran');
const elBoiteDialogue = document.getElementById('boite-dialogue');
const elBoiteDialogueTexte = document.getElementById('boite-dialogue-texte');
const elBoiteDialogueAnnuler = document.getElementById('boite-dialogue-annuler');
const elBoiteDialogueConfirmer = document.getElementById('boite-dialogue-confirmer');

// Bannière de mode de placement (défense/laboratoire armé), créée ici
// plutôt que dans index.html car purement liée à cette interface.
const elBanniere = document.createElement('div');
elBanniere.id = 'banniere-placement';
elBanniere.className = 'masque';
elBanniere.innerHTML = '<span id="banniere-placement-texte"></span><button id="banniere-placement-annuler">Annuler</button>';
document.body.appendChild(elBanniere);
const elBanniereTexte = document.getElementById('banniere-placement-texte');
document.getElementById('banniere-placement-annuler').addEventListener('click', () => {
  modePlacementDefense = null;
  modePlacementLaboratoire = null;
});

// -----------------------------------------------------------
// FORMATAGE — icônes de ressources partagées par tous les panneaux.
// -----------------------------------------------------------
const ICONES_RESSOURCE = { nourriture: '🌾', eau: '💧', materiaux: '🪵', pheromones: '🧪' };

function formaterCout(cout) {
  return Object.entries(cout).map(([r, v]) => `${ICONES_RESSOURCE[r] || ''}${v}`).join(' ') || 'Gratuit';
}

// -----------------------------------------------------------
// BOUCLE LÉGÈRE D'AFFICHAGE — un intervalle (pas requestAnimationFrame)
// pour ne pas re-générer du HTML 60 à 120 fois par seconde : les
// ressources et l'état de placement n'ont pas besoin d'un
// rafraîchissement plus fréquent que 3 fois par seconde, ce qui
// économise sensiblement la batterie sur mobile.
// -----------------------------------------------------------
function rafraichirBarreRessources() {
  const r = etat.ressources;
  elBarreRessources.innerHTML = `
    <span class="jeton">🌾${formaterNombre(r.nourriture)}</span>
    <span class="jeton">💧${formaterNombre(r.eau)}</span>
    <span class="jeton">🪵${formaterNombre(r.materiaux)}</span>
    <span class="jeton">🧪${formaterNombre(r.pheromones)}</span>
    <span class="jeton">👥${r.population}/${r.populationMax}</span>
  `;
}

function rafraichirBanniereModePlacement() {
  const type = modePlacementDefense || modePlacementLaboratoire;
  if (!type) {
    elBanniere.classList.add('masque');
    return;
  }
  const label = modePlacementDefense ? TYPES_DEFENSE[type].label : TYPES_LABORATOIRE[type].label;
  elBanniereTexte.textContent = `Touchez la carte pour construire : ${label}`;
  elBanniere.classList.remove('masque');
}

// -----------------------------------------------------------
// BARRE D'OUTILS — un seul panneau ouvert à la fois (menu compact).
// -----------------------------------------------------------
const OUTILS = [
  { id: 'production', icone: '🐜', etiquette: 'Produire', construire: construirePanneauProduction },
  { id: 'construction', icone: '🧱', etiquette: 'Bâtir', construire: construirePanneauConstruction },
  { id: 'recherche', icone: '🧪', etiquette: 'Recherche', construire: construirePanneauRecherche },
  { id: 'missions', icone: '🎯', etiquette: 'Missions', construire: construirePanneauMissions },
  { id: 'partie', icone: '💾', etiquette: 'Partie', construire: construirePanneauPartie }
];

let panneauOuvert = null;

function construireBarreOutils() {
  elBarreOutils.innerHTML = '';
  for (const outil of OUTILS) {
    const bouton = document.createElement('button');
    bouton.dataset.id = outil.id;
    bouton.innerHTML = `<span class="icone">${outil.icone}</span><span class="etiquette">${outil.etiquette}</span>`;
    bouton.addEventListener('click', () => basculerPanneau(outil.id));
    elBarreOutils.appendChild(bouton);
  }
}

function basculerPanneau(id) {
  if (panneauOuvert === id) {
    fermerPanneau();
  } else {
    ouvrirPanneau(id);
  }
}

function ouvrirPanneau(id) {
  const outil = OUTILS.find((o) => o.id === id);
  if (!outil) return;
  panneauOuvert = id;
  for (const bouton of elBarreOutils.children) {
    bouton.classList.toggle('actif', bouton.dataset.id === id);
  }
  elPanneauMenu.classList.remove('masque');
  outil.construire();
}

function fermerPanneau() {
  if (!panneauOuvert) return;
  panneauOuvert = null;
  elPanneauMenu.classList.add('masque');
  for (const bouton of elBarreOutils.children) bouton.classList.remove('actif');
}

// -----------------------------------------------------------
// PANNEAU — PRODUCTION (appelle mettreEnFileProduction, buildings.js,
// inchangée : mêmes coûts et mêmes files d'attente qu'au clavier).
// -----------------------------------------------------------
function construirePanneauProduction() {
  let html = '<h2>Production</h2>';
  for (const [typeBatiment, def] of Object.entries(TYPES_BATIMENT_PRODUCTION)) {
    const batiment = trouverBatiment(typeBatiment);
    const enFile = batiment && batiment.fileProduction.length;
    html += `<div class="sous-titre">${def.label}${enFile ? ` — ${batiment.fileProduction.length} en file` : ''}</div><div class="grille">`;
    for (const typeUnite of def.unitesProduisibles) {
      const defUnite = TYPES_UNITE[typeUnite];
      const desactive = !batiment || etat.ressources.population >= etat.ressources.populationMax || !peutPayer(defUnite.cout);
      html += `<button class="carte ${desactive ? 'desactive' : ''}" data-batiment="${typeBatiment}" data-unite="${typeUnite}">
        <span class="titre">${defUnite.label}</span>
        <span class="detail">${formaterCout(defUnite.cout)}</span>
      </button>`;
    }
    html += '</div>';
  }
  elPanneauMenu.innerHTML = html;
  elPanneauMenu.querySelectorAll('button[data-unite]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      const batiment = trouverBatiment(bouton.dataset.batiment);
      if (batiment) mettreEnFileProduction(batiment, bouton.dataset.unite);
      construirePanneauProduction();
    });
  });
}

// -----------------------------------------------------------
// PANNEAU — CONSTRUCTION (défenses). Arme activerPlacementDefense
// (defenses.js, inchangée) puis referme le panneau pour laisser le
// terrain entièrement visible et tapable — la pose elle-même se
// fait par un tap sur la carte, exactement comme au clavier.
// -----------------------------------------------------------
function construirePanneauConstruction() {
  let html = '<h2>Construction</h2><p class="texte-info">Choisissez une défense puis touchez la carte pour la construire.</p><div class="grille">';
  for (const [type, def] of Object.entries(TYPES_DEFENSE)) {
    const desactive = !peutPayer(def.cout);
    html += `<button class="carte ${desactive ? 'desactive' : ''}" data-defense="${type}">
      <span class="titre">${def.label}</span>
      <span class="detail">${formaterCout(def.cout)}</span>
    </button>`;
  }
  html += '</div>';
  elPanneauMenu.innerHTML = html;
  elPanneauMenu.querySelectorAll('button[data-defense]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      activerPlacementDefense(bouton.dataset.defense);
      fermerPanneau();
    });
  });
}

// -----------------------------------------------------------
// PANNEAU — RECHERCHE (laboratoires + arbre de technologies).
// Construction d'un labo : activerPlacementLaboratoire (research.js).
// Lancement d'une recherche : mettreEnFileRecherche (research.js).
// -----------------------------------------------------------
function construirePanneauRecherche() {
  let html = '<h2>Recherche</h2>';
  for (const [type, def] of Object.entries(TYPES_LABORATOIRE)) {
    const labo = trouverLaboratoire(type);
    html += `<div class="sous-titre">${def.label}</div>`;

    if (!labo) {
      const desactive = !peutPayer(def.cout);
      html += `<div class="grille"><button class="carte ${desactive ? 'desactive' : ''}" data-construire-labo="${type}">
        <span class="titre">Construire</span>
        <span class="detail">${formaterCout(def.cout)}</span>
      </button></div>`;
      continue;
    }
    if (labo.enConstruction) {
      html += '<p class="texte-info">En construction…</p>';
      continue;
    }

    html += '<div class="grille">';
    for (const [techId, tech] of Object.entries(ARBRE_RECHERCHE)) {
      if (tech.categorie !== type) continue;
      const acquise = technologieDejaAcquise(techId);
      const enFile = labo.fileRecherche.some((o) => o.techId === techId);
      const verrouillee = !prerequisRempli(techId);
      const desactive = acquise || enFile || verrouillee || !peutPayer(tech.cout);
      let detail = formaterCout(tech.cout);
      if (acquise) detail = 'Acquise';
      else if (enFile) detail = 'En cours…';
      else if (verrouillee) detail = 'Prérequis manquant';
      html += `<button class="carte ${desactive ? 'desactive' : ''}" data-labo="${type}" data-tech="${techId}">
        <span class="titre">${tech.label}</span>
        <span class="detail">${detail}</span>
      </button>`;
    }
    html += '</div>';
  }
  elPanneauMenu.innerHTML = html;
  elPanneauMenu.querySelectorAll('button[data-construire-labo]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      activerPlacementLaboratoire(bouton.dataset.construireLabo);
      fermerPanneau();
    });
  });
  elPanneauMenu.querySelectorAll('button[data-tech]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      const labo = trouverLaboratoire(bouton.dataset.labo);
      if (labo) mettreEnFileRecherche(labo, bouton.dataset.tech);
      construirePanneauRecherche();
    });
  });
}

// -----------------------------------------------------------
// PANNEAU — MISSIONS. demarrerMission (missions.js, inchangée)
// réinitialise la partie en cours : une confirmation est donc
// demandée avant tout déclenchement (aucune confirmation n'existait
// au clavier, mais un tap accidentel est bien plus probable qu'un
// appui clavier accidentel sur un écran tactile).
// -----------------------------------------------------------
function construirePanneauMissions() {
  let html = '<h2>Missions</h2><p class="texte-info">Démarrer une mission remplace la partie en cours.</p>';
  const ids = Object.keys(MISSIONS).map(Number).sort((a, b) => a - b);
  for (const id of ids) {
    const mission = MISSIONS[id];
    const debloquee = missionDebloquee(id);
    const terminee = etat.missionsCompletees.includes(id);
    const active = etat.missionActuelle === id;
    let prefixe = '';
    if (terminee) prefixe = '✅ ';
    else if (!debloquee) prefixe = '🔒 ';
    html += `<div class="ligne-liste ${!debloquee ? 'desactive' : ''}" data-mission="${id}">
      <span class="titre">${prefixe}${id}. ${mission.titre}${active ? ' — en cours' : ''}</span>
      <span class="detail">${debloquee ? 'Jouer' : 'Verrouillée'}</span>
    </div>`;
  }
  elPanneauMenu.innerHTML = html;
  elPanneauMenu.querySelectorAll('.ligne-liste[data-mission]').forEach((ligne) => {
    ligne.addEventListener('click', () => {
      const id = Number(ligne.dataset.mission);
      if (!missionDebloquee(id)) return;
      demanderConfirmation(
        `Démarrer la mission « ${MISSIONS[id].titre} » ? La partie en cours sera remplacée.`,
        () => { demarrerMission(id); fermerPanneau(); }
      );
    });
  });
}

// -----------------------------------------------------------
// PANNEAU — PARTIE (ordres, sauvegarde/chargement, nouvelle partie
// libre). Reprend exactement les raccourcis clavier C / S / L, et
// pour "Nouvelle partie" la même séquence que le mode escarmouche
// de demarrerPartie() (storage.js, inchangée) quand aucune
// sauvegarde n'est trouvée.
// -----------------------------------------------------------
function construirePanneauPartie() {
  elPanneauMenu.innerHTML = `
    <h2>Partie</h2>
    <div class="grille">
      <button class="carte" id="action-annuler-ordres">
        <span class="titre">Annuler les ordres</span>
        <span class="detail">Unités sélectionnées</span>
      </button>
      <button class="carte" id="action-sauvegarder">
        <span class="titre">Sauvegarder</span>
        <span class="detail">Emplacement manuel</span>
      </button>
      <button class="carte" id="action-charger">
        <span class="titre">Charger</span>
        <span class="detail">Emplacement manuel</span>
      </button>
      <button class="carte" id="action-nouvelle-partie">
        <span class="titre">Nouvelle partie</span>
        <span class="detail">Escarmouche libre</span>
      </button>
    </div>
  `;
  document.getElementById('action-annuler-ordres').addEventListener('click', () => {
    const selectionnees = etat.unites.filter((u) => u.faction === 'joueur' && u.selectionnee);
    for (const u of selectionnees) annulerOrdres(u);
  });
  document.getElementById('action-sauvegarder').addEventListener('click', () => {
    sauvegarderPartie('manuel')
      .then(() => console.log('Sauvegarde manuelle effectuée (emplacement "manuel").'))
      .catch((erreur) => console.error('Échec de la sauvegarde manuelle :', erreur));
  });
  document.getElementById('action-charger').addEventListener('click', () => {
    demanderConfirmation('Charger la dernière sauvegarde manuelle ? La partie en cours sera remplacée.', () => {
      chargerPartie('manuel')
        .then((sauvegarde) => {
          if (sauvegarde) {
            appliquerInstantane(sauvegarde);
          } else {
            console.warn('Aucune sauvegarde manuelle trouvée (emplacement "manuel").');
          }
        })
        .catch((erreur) => console.error('Échec du chargement de la sauvegarde manuelle :', erreur));
      fermerPanneau();
    });
  });
  document.getElementById('action-nouvelle-partie').addEventListener('click', () => {
    demanderConfirmation('Démarrer une nouvelle partie libre ? La progression non sauvegardée sera perdue.', () => {
      demarrerPartieLibre();
      fermerPanneau();
    });
  });
}

// Même séquence que la branche "aucune sauvegarde" de demarrerPartie()
// (storage.js) — réutilisée ici pour un vrai bouton "Nouvelle partie",
// jusqu'ici uniquement accessible en rechargeant la page.
function demarrerPartieLibre() {
  nouvellePartie();
  genererTerrain();
  genererRessources();
  genererBatimentsProduction();
  genererColonieEnnemie();
  genererMenacesSauvages();
}

// -----------------------------------------------------------
// BOÎTE DE DIALOGUE GÉNÉRIQUE — un seul gabarit réutilisé pour
// toute confirmation (mission, chargement, nouvelle partie, quitter).
// -----------------------------------------------------------
let rappelConfirmation = null;

function demanderConfirmation(texte, surConfirmation) {
  elBoiteDialogueTexte.textContent = texte;
  elBoiteDialogueAnnuler.textContent = 'Annuler';
  elBoiteDialogueConfirmer.textContent = 'Confirmer';
  rappelConfirmation = surConfirmation;
  elBoiteDialogue.classList.remove('masque');
  temps.enPause = true;
}

function fermerBoiteDialogue() {
  elBoiteDialogue.classList.add('masque');
  rappelConfirmation = null;
  temps.enPause = false;
}

elBoiteDialogueAnnuler.addEventListener('click', fermerBoiteDialogue);
elBoiteDialogueConfirmer.addEventListener('click', () => {
  const rappel = rappelConfirmation;
  fermerBoiteDialogue();
  if (rappel) rappel();
});

// -----------------------------------------------------------
// PLEIN ÉCRAN — Fullscreen API. Un bouton dédié permet de
// l'activer/désactiver à tout moment ; en complément, la toute
// première pression tactile de la session tente aussi de l'activer
// discrètement (un geste utilisateur est requis par les navigateurs
// pour autoriser le plein écran — impossible de le faire seul au
// chargement de la page).
// -----------------------------------------------------------
function elementPleinEcran() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function demanderPleinEcran() {
  const cible = document.documentElement;
  const demande = cible.requestFullscreen || cible.webkitRequestFullscreen;
  if (!demande) return;
  const resultat = demande.call(cible);
  if (resultat && resultat.catch) resultat.catch(() => {}); // refus silencieux du navigateur
}

function basculerPleinEcran() {
  if (elementPleinEcran()) {
    const sortie = document.exitFullscreen || document.webkitExitFullscreen;
    if (sortie) sortie.call(document);
  } else {
    demanderPleinEcran();
  }
}

elBoutonPleinEcran.addEventListener('click', basculerPleinEcran);
document.addEventListener('fullscreenchange', () => {
  elBoutonPleinEcran.classList.toggle('actif', !!elementPleinEcran());
});
document.addEventListener('webkitfullscreenchange', () => {
  elBoutonPleinEcran.classList.toggle('actif', !!elementPleinEcran());
});

let pleinEcranDejaTente = false;
canvas.addEventListener('pointerdown', () => {
  if (pleinEcranDejaTente || elementPleinEcran()) return;
  pleinEcranDejaTente = true;
  demanderPleinEcran();
}, { once: true });

// -----------------------------------------------------------
// RETOUR ARRIÈRE ANDROID — sans contrôle, le bouton matériel (ou le
// geste système) quitterait l'application instantanément, sans
// distinction entre "fermer un panneau" et "quitter le jeu". On
// empile un état d'historique factice à chaque étape ; un retour
// ferme d'abord la boîte de dialogue ou le panneau ouvert, et ne
// propose de quitter qu'une fois l'écran de jeu "nu".
//
// Dans le navigateur/PWA (aucun wrapper natif), la confirmation
// utilise history.go() pour reculer au-delà de tous les états empilés
// — cela fonctionne mais dépend un peu du navigateur (voir le README
// de la vague 13). Dans l'APK Android (vague 14, voir
// android/MainActivity.java), window.AndroidNatif est fourni par la
// WebView : on l'utilise alors pour fermer l'application directement
// et instantanément, sans dépendre de l'historique. Les deux chemins
// cohabitent sans rien changer d'autre au mécanisme.
// -----------------------------------------------------------
let profondeurHistorique = 0;
let sortieAutorisee = false;

function empilerEtatRetour() {
  profondeurHistorique++;
  history.pushState({ antCommander: true }, '');
}
empilerEtatRetour();

function quitterApplication() {
  sortieAutorisee = true;
  if (window.AndroidNatif && window.AndroidNatif.quitterApplication) {
    // APK Android (vague 14) : fermeture native immédiate et fiable.
    window.AndroidNatif.quitterApplication();
  } else {
    // Navigateur / PWA (vague 13) : seul mécanisme disponible.
    history.go(-Math.max(profondeurHistorique, 1));
  }
}

window.addEventListener('popstate', () => {
  if (sortieAutorisee) return; // sortie confirmée : on laisse le navigateur/WebView faire son travail
  profondeurHistorique = Math.max(0, profondeurHistorique - 1);

  if (!elBoiteDialogue.classList.contains('masque')) {
    fermerBoiteDialogue();
    empilerEtatRetour();
    return;
  }
  if (panneauOuvert) {
    fermerPanneau();
    empilerEtatRetour();
    return;
  }
  demanderConfirmation('Quitter Ant Commander ?', quitterApplication);
  empilerEtatRetour();
});


// -----------------------------------------------------------
// RACCOURCI CLAVIER (desktop uniquement) — bascule la surcouche de
// diagnostic canvas (position caméra, zoom, horloge) définie dans
// renderer.js. Sans effet sur le tactile, purement pratique en dev.
// -----------------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'd') afficherSurcoucheDebug = !afficherSurcoucheDebug;
});

// -----------------------------------------------------------
// DÉMARRAGE
// -----------------------------------------------------------
construireBarreOutils();
rafraichirBarreRessources();

// Rafraîchissement périodique léger (voir commentaire plus haut sur
// rafraichirBarreRessources) — placé ici, après toutes les
// déclarations dont il dépend, pour rester facile à suivre.
setInterval(() => {
  rafraichirBarreRessources();
  rafraichirBanniereModePlacement();
  if (panneauOuvert) OUTILS.find((o) => o.id === panneauOuvert).construire();
}, 350);

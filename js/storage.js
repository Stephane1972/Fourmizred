// ===========================================================
// STORAGE — persistance de la partie via IndexedDB.
//
// - IndexedDB : toutes les données de partie (ressources, nœuds de
//   ressources, bâtiments, unités, mission, technologies)
// - LocalStorage : réservé aux petites préférences simples (aucune
//   n'existe encore à cette vague, mais la convention est posée pour
//   quand ui.js aura besoin d'enregistrer par ex. le volume sonore)
//
// Plusieurs emplacements de sauvegarde sont supportés nativement
// (n'importe quelle chaîne comme nom d'emplacement). L'emplacement
// "auto" est utilisé par la sauvegarde automatique et le chargement
// au démarrage ; les autres seront exposés à l'utilisateur par
// ui.js à une prochaine vague (bouton "Sauvegarder", liste des
// emplacements...).
// ===========================================================

const NOM_BASE = 'ant-commander-db';
const VERSION_BASE = 1;
const NOM_MAGASIN = 'sauvegardes';
const EMPLACEMENT_AUTO = 'auto';
const INTERVALLE_AUTO_SAVE = 30; // secondes

let baseDeDonnees = null;

function ouvrirBaseDeDonnees() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB non supporté par ce navigateur.'));
      return;
    }
    const requete = indexedDB.open(NOM_BASE, VERSION_BASE);

    requete.onupgradeneeded = (evenement) => {
      const db = evenement.target.result;
      if (!db.objectStoreNames.contains(NOM_MAGASIN)) {
        db.createObjectStore(NOM_MAGASIN, { keyPath: 'emplacement' });
      }
    };
    requete.onsuccess = (evenement) => {
      baseDeDonnees = evenement.target.result;
      resolve(baseDeDonnees);
    };
    requete.onerror = (evenement) => reject(evenement.target.error);
  });
}

function obtenirBase() {
  if (baseDeDonnees) return Promise.resolve(baseDeDonnees);
  return ouvrirBaseDeDonnees();
}

// ---------------------------------------------------------
// Construit un instantané sérialisable de l'état actuel du jeu
// ---------------------------------------------------------
function construireInstantane() {
  return {
    version: VERSION_JEU,
    horodatage: Date.now(),
    camera: {
      x: etat.camera.x,
      y: etat.camera.y,
      zoom: etat.camera.zoom
    },
    ressources: { ...etat.ressources },
    noeudsRessource: noeudsRessource.map((n) => ({
      type: n.type,
      x: n.x,
      y: n.y,
      quantite: n.quantite,
      quantiteInitiale: n.quantiteInitiale,
      variationTaille: n.variationTaille,
      angleVariation: n.angleVariation
    })),
    batiments: etat.batiments,
    unites: etat.unites,
    missionActuelle: etat.missionActuelle,
    technologies: etat.technologies
  };
}

// Réapplique un instantané chargé sur l'état actuel du jeu
function appliquerInstantane(instantane) {
  etat.camera.x = instantane.camera.x;
  etat.camera.y = instantane.camera.y;
  etat.camera.zoom = instantane.camera.zoom;

  Object.assign(etat.ressources, instantane.ressources);

  noeudsRessource.length = 0;
  for (const n of instantane.noeudsRessource) noeudsRessource.push(n);

  etat.batiments.length = 0;
  etat.batiments.push(...instantane.batiments);
  etat.unites.length = 0;
  etat.unites.push(...instantane.unites);
  etat.missionActuelle = instantane.missionActuelle;
  etat.technologies.length = 0;
  etat.technologies.push(...instantane.technologies);
}

// ---------------------------------------------------------
// API de sauvegarde — sauvegarde manuelle, plusieurs emplacements
// ---------------------------------------------------------
async function sauvegarderPartie(emplacement) {
  const db = await obtenirBase();
  const instantane = construireInstantane();
  instantane.emplacement = emplacement;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOM_MAGASIN, 'readwrite');
    transaction.objectStore(NOM_MAGASIN).put(instantane);
    transaction.oncomplete = () => resolve(instantane);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function chargerPartie(emplacement) {
  const db = await obtenirBase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOM_MAGASIN, 'readonly');
    const requete = transaction.objectStore(NOM_MAGASIN).get(emplacement);
    requete.onsuccess = () => resolve(requete.result || null);
    requete.onerror = () => reject(requete.error);
  });
}

async function supprimerSauvegarde(emplacement) {
  const db = await obtenirBase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOM_MAGASIN, 'readwrite');
    transaction.objectStore(NOM_MAGASIN).delete(emplacement);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Liste tous les emplacements existants (noms + date de sauvegarde),
// pour un futur écran de sélection dans ui.js
async function listerSauvegardes() {
  const db = await obtenirBase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOM_MAGASIN, 'readonly');
    const requete = transaction.objectStore(NOM_MAGASIN).getAll();
    requete.onsuccess = () => resolve(
      requete.result.map((s) => ({ emplacement: s.emplacement, horodatage: s.horodatage }))
    );
    requete.onerror = () => reject(requete.error);
  });
}

// ---------------------------------------------------------
// SAUVEGARDE AUTOMATIQUE — appelée depuis la boucle de jeu (main.js)
// ---------------------------------------------------------
let minuteurAutoSave = 0;

function mettreAJourAutoSave(delta) {
  // Garde défensive : si delta n'est pas un nombre fini valide (ne
  // devrait jamais arriver en usage normal, mais une comparaison avec
  // NaN est toujours fausse et contournerait silencieusement la garde
  // ci-dessous), on ignore cette frame plutôt que de risquer de
  // déclencher une sauvegarde à chaque frame.
  if (!Number.isFinite(delta)) return;

  minuteurAutoSave += delta;
  if (minuteurAutoSave < INTERVALLE_AUTO_SAVE) return;
  minuteurAutoSave = 0;
  sauvegarderPartie(EMPLACEMENT_AUTO)
    .then(() => console.log('Sauvegarde automatique effectuée.'))
    .catch((erreur) => console.error('Échec de la sauvegarde automatique :', erreur));
}

// ---------------------------------------------------------
// DÉMARRAGE — charge la sauvegarde automatique si elle existe,
// sinon démarre une nouvelle partie. Appelé une fois par main.js.
// ---------------------------------------------------------
async function demarrerPartie() {
  genererTerrain(); // purement décoratif, régénéré à chaque lancement

  let sauvegarde = null;
  try {
    sauvegarde = await chargerPartie(EMPLACEMENT_AUTO);
  } catch (erreur) {
    console.warn('Sauvegarde indisponible (IndexedDB non supporté ou bloqué) :', erreur.message);
  }

  if (sauvegarde) {
    appliquerInstantane(sauvegarde);
    console.log('Partie chargée depuis la sauvegarde automatique (', new Date(sauvegarde.horodatage).toLocaleString('fr-FR'), ')');
  } else {
    nouvellePartie();
    genererRessources();
    genererBatimentsProduction();
    console.log('Nouvelle partie démarrée (aucune sauvegarde trouvée).');
  }
}

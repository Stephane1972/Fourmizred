// ===========================================================
// SERVICE WORKER — met le jeu en cache pour un fonctionnement
// complètement hors ligne après la première visite.
// ===========================================================
//
// IMPORTANT — chemin de base GitHub Pages :
// La constante BASE_PATH ci-dessous DOIT correspondre exactement à
// celle définie dans js/config.js. Comme ce fichier est un service
// worker, il tourne dans son propre contexte et ne peut pas importer
// js/config.js facilement pour un simple fichier de config — la
// valeur est donc dupliquée ici volontairement. Si vous changez
// BASE_PATH dans js/config.js, changez-le aussi ici.
//
// - Racine d'un domaine ou compte GitHub (username.github.io) : "/"
// - "Project site" GitHub Pages (username.github.io/nom-du-depot/) :
//   "/nom-du-depot/" — avec le / au début ET à la fin.
const BASE_PATH = "/Fourmizred/";

// Nom de cache versionné : changez ce numéro à chaque mise à jour
// des fichiers précachés pour que les anciens visiteurs récupèrent
// la nouvelle version au lieu de rester bloqués sur un cache périmé.
const CACHE_NAME = "ant-commander-cache-v8";

// Liste de tout ce qui doit être disponible hors ligne. Les chemins
// sont exprimés relativement à BASE_PATH, jamais en absolu codé en
// dur, pour que le projet fonctionne quel que soit le nom du dépôt.
const FICHIERS_A_PRECACHER = [
  "",                     // l'URL de la racine du scope elle-même
  "index.html",
  "offline.html",
  "manifest.webmanifest",
  "css/reset.css",
  "css/style.css",
  "css/mobile.css",
  "js/config.js",
  "js/utils.js",
  "js/state.js",
  "js/camera.js",
  "js/input.js",
  "js/resources.js",
  "js/units.js",
  "js/buildings.js",
  "js/combat.js",
  "js/storage.js",
  "js/renderer.js",
  "js/main.js",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png"
].map(chemin => BASE_PATH + chemin);

// ---------------------------------------------------------
// INSTALL — précache tous les fichiers listés ci-dessus.
// ---------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FICHIERS_A_PRECACHER))
      .then(() => self.skipWaiting())
  );
});

// ---------------------------------------------------------
// ACTIVATE — supprime les anciens caches (versions précédentes)
// ---------------------------------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((noms) =>
      Promise.all(
        noms
          .filter((nom) => nom.startsWith("ant-commander-cache-") && nom !== CACHE_NAME)
          .map((nom) => caches.delete(nom))
      )
    ).then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------
// FETCH — stratégie "cache d'abord, réseau en secours", avec
// repli sur offline.html pour les navigations qui échouent.
// ---------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const requete = event.request;

  // Requêtes de navigation (l'utilisateur ouvre/recharge une page) :
  // on tente le réseau, on retombe sur le cache, puis sur offline.html
  // si vraiment rien n'est disponible.
  if (requete.mode === "navigate") {
    event.respondWith(
      fetch(requete)
        .then((reponse) => {
          // On met aussi à jour le cache avec la version fraîche du réseau
          const copie = reponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(requete, copie));
          return reponse;
        })
        .catch(() =>
          caches.match(requete).then(
            (reponseCache) => reponseCache || caches.match(BASE_PATH + "offline.html")
          )
        )
    );
    return;
  }

  // Toutes les autres requêtes (CSS, JS, images...) : cache d'abord,
  // réseau en secours si jamais le fichier n'était pas précaché.
  event.respondWith(
    caches.match(requete).then((reponseCache) => {
      if (reponseCache) return reponseCache;
      return fetch(requete).then((reponse) => {
        // On ne met en cache que les réponses valides et de même origine
        if (reponse && reponse.status === 200 && reponse.type === "basic") {
          const copie = reponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(requete, copie));
        }
        return reponse;
      }).catch(() => {
        // Hors ligne et pas en cache : on ne peut rien faire de mieux
        // que renvoyer une réponse vide pour ce type de requête.
        return new Response("", { status: 408, statusText: "Hors ligne" });
      });
    })
  );
});

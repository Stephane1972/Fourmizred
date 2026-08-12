# Ant Commander – La Guerre des Colonies

Jeu de stratégie en temps réel (dans l'esprit général du genre popularisé
par des jeux comme Command & Conquer, sans en reprendre aucun nom,
personnage, image, musique ou code) où vous commandez une colonie de
fourmis : récolte, construction, production, recherche, défense de la
reine, combat contre des colonies rivales.

Conçu **offline-first** : après un premier chargement, le jeu fonctionne
entièrement sans connexion, installable comme PWA sur ordinateur et sur
Android, ou packageable en APK.

---

## État du projet — VAGUE 2 terminée

La vague 1 posait le socle hors-ligne/PWA. Cette vague 2 ajoute le
**cœur du moteur** : une caméra pilotable (glisser pour déplacer,
molette ou pincement à deux doigts pour zoomer), sur une carte de
4000×3000 avec grille de repérage. Toujours aucun bâtiment/unité —
c'est la vague suivante.

### Ce qui a été ajouté

- `js/state.js` — état centralisé du jeu (`etat`), avec les structures
  de données déjà prévues pour ressources/bâtiments/unités/technologies
  (vides pour l'instant, remplies aux prochaines vagues)
- `js/camera.js` — déplacement, zoom borné (0.4× à 2.5×), conversions
  écran↔monde, clampage aux limites de la carte
- `js/input.js` — Pointer Events unifiés souris/tactile : glisser à un
  doigt pour déplacer, pincer à deux doigts ou molette pour zoomer
- `js/renderer.js` — dessine le sol, une grille de repérage, les
  bordures de la carte, et un petit panneau de diagnostic (position/zoom
  caméra) en bas à gauche — utile pendant les tests, sera caché ou
  retiré une fois `ui.js` en place
- `js/main.js` s'est allégé : ne garde que l'enregistrement du Service
  Worker, l'écran de chargement, le statut réseau, et le démarrage de
  la boucle

### Vérifications effectuées

Testé avec un vrai DOM simulé et des événements Pointer/Wheel réels
(pas juste une vérification de syntaxe) :
- glissement caméra → déplacement cohérent dans la bonne direction
- molette → zoom fonctionnel
- tentative de sortie des limites de la carte → correctement clampée

`storage.js` (sauvegarde/chargement) arrivera à la vague 3, une fois
qu'il y aura une progression réelle à sauvegarder.

---



## ⚠️ Configuration obligatoire avant publication : `BASE_PATH`

Deux fichiers contiennent une constante `BASE_PATH` qui **doivent avoir
exactement la même valeur** :

- `js/config.js` (ligne ~20)
- `sw.js` (ligne ~17, dupliquée volontairement car un Service Worker ne
  peut pas importer facilement un fichier de config externe)

Valeur actuelle : `"/ant-commander/"` — cela suppose que le dépôt GitHub
s'appelle **exactement** `ant-commander` et que le site est publié en
tant que "project site" à une adresse du type :
`https://votre-compte.github.io/ant-commander/`

**Si votre dépôt porte un autre nom**, remplacez `/ant-commander/` par
`/nom-exact-de-votre-depot/` dans les DEUX fichiers.

**Si vous publiez à la racine d'un domaine ou d'un compte GitHub**
(`https://votre-compte.github.io/` directement, sans sous-dossier),
mettez `BASE_PATH = "/"` dans les deux fichiers.

---

## Tester en local (avant de publier)

Les Service Workers ne fonctionnent **pas** en ouvrant `index.html`
directement depuis l'explorateur de fichiers (protocole `file://`) —
c'est une restriction de sécurité des navigateurs, pas un bug du projet.
Le jeu s'affiche quand même, mais le mode hors ligne ne peut pas être
testé de cette façon.

Pour tester correctement en local :

1. Ouvrez un terminal dans le dossier du projet
2. Lancez un petit serveur local, par exemple :
   ```bash
   python3 -m http.server 8080
   ```
3. **Temporairement**, mettez `BASE_PATH = "/"` dans `js/config.js` ET
   `sw.js` (puisqu'en local le jeu est servi à la racine, pas dans un
   sous-dossier)
4. Ouvrez `http://localhost:8080/index.html`
5. Ouvrez les DevTools → onglet **Application** (Chrome) ou
   **Réseau/Storage** (Firefox) → vérifiez que le Service Worker est
   "activated and running"
6. Coupez le réseau (mode avion, ou DevTools → Network → Offline) et
   rechargez la page : elle doit continuer à s'afficher
7. **Remettez `BASE_PATH` à sa valeur GitHub Pages** avant de commiter

## Tester sur GitHub Pages

1. Poussez le projet sur un dépôt GitHub nommé exactement comme votre
   `BASE_PATH` (ex: dépôt `ant-commander` → `BASE_PATH = "/ant-commander/"`)
2. Repo → Settings → Pages → Source : branche `main`, dossier `/ (root)`
3. Attendez quelques minutes, puis ouvrez
   `https://votre-compte.github.io/ant-commander/`
4. Vérifiez l'installation PWA (icône "Installer l'application" dans la
   barre d'adresse sur desktop, ou "Ajouter à l'écran d'accueil" sur
   Android)
5. Une fois la page visitée au moins une fois, coupez le réseau et
   rouvrez l'app : elle doit se lancer normalement

---

## Prochaine étape

En attente de validation avant de démarrer la **VAGUE 3** (prévue :
`resources.js` + `buildings.js` + `storage.js` — les premières
ressources récoltables, le premier bâtiment posable, et la sauvegarde).

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

## État du projet — VAGUE 1 terminée

Cette première vague pose uniquement le **socle technique** : aucune
mécanique de jeu (bâtiments, unités, combat...) n'est encore implémentée.
L'objectif était de garantir que l'architecture de base — structure
multi-fichiers, installation PWA, fonctionnement hors ligne — est saine
avant de construire le jeu par-dessus.

### Ce qui a été fait

- Arborescence complète du projet (`css/`, `js/`, `assets/`, `android/`)
- `index.html` — squelette HTML, aucune logique de jeu inline
- `offline.html` — page de repli propre si une navigation échoue hors ligne
- `manifest.webmanifest` — PWA installable, icônes incluses (192px et 512px)
- `sw.js` — Service Worker : précache tous les fichiers du socle,
  cache versionné, nettoyage automatique des anciens caches, stratégie
  cache-d'abord avec repli réseau, repli sur `offline.html` en cas
  d'échec de navigation
- `css/reset.css`, `css/style.css`, `css/mobile.css` — identité visuelle
  de base, écran de chargement, indicateur en ligne/hors ligne
- `js/config.js` — constantes globales, dont **`BASE_PATH`**
- `js/utils.js` — fonctions utilitaires génériques
- `js/main.js` — enregistrement du Service Worker, écran de chargement,
  indicateur réseau, et un rendu canvas minimal (juste pour valider que
  toute la chaîne HTML→CSS→JS→Canvas fonctionne)

### Ce qui n'existe pas encore (prochaines vagues)

`state.js`, `storage.js`, `renderer.js`, `input.js`, `camera.js`,
`resources.js`, `buildings.js`, `units.js`, `combat.js`, `ai.js`,
`missions.js`, `research.js`, `ui.js`, `css/menu.css`,
`android/README-APK.md` — tout le vrai jeu, en somme. Le canvas
n'affiche pour l'instant qu'un écran de validation (titre + numéro de
version), pas encore la colonie.

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

En attente de validation avant de démarrer la **VAGUE 2**.

# Ant Commander — APK Android hors ligne (VAGUE 14)

Ce dossier `android/` contient un projet Android Studio minimal dont le
seul rôle est d'**embarquer le jeu web existant** (`index.html`,
`css/`, `js/`) **tel quel**, dans une application installable qui ne
dépend d'aucune connexion Internet, au chargement comme en cours de
partie. Aucune règle de jeu n'est modifiée : ce dossier n'ajoute qu'une
coquille native (une seule classe, `MainActivity.java`) autour du jeu
déjà écrit par les vagues 1 à 13.

Si vous découvrez ce fichier en premier : les vagues précédentes ont
déjà rendu le jeu jouable au tactile (vague 13, `js/ui.js` +
`css/menu.css`) et fonctionnel hors ligne dans un navigateur (vague 1,
`sw.js` + IndexedDB). La vague 14 ne fait "que" transporter tout ça
dans un `.apk` installable — rien de ce qui existe déjà n'est réécrit.

---

## 1. Vue d'ensemble de l'intégration WebView

```
android/
├── app/
│   ├── build.gradle              configuration du module + copie auto des assets web
│   └── src/main/
│       ├── AndroidManifest.xml   déclarations système (aucune permission Internet)
│       ├── java/.../MainActivity.java   la seule classe native du projet
│       ├── assets/www/           copie du jeu web (générée, non versionnée — voir §3)
│       └── res/                  icônes, thèmes, écran de lancement, config réseau
├── build.gradle                  fichier Gradle racine (déclare le plugin Android)
├── settings.gradle
└── gradle.properties
```

`MainActivity` héberge une unique `WebView` plein écran et lui fait
charger `index.html` — le jeu s'exécute ensuite exactement comme dans
un navigateur, avec les mêmes fichiers `js/*.js`, sans aucune
adaptation de leur code (à une exception près, documentée au §7 :
le bouton retour).

**Chargement local via `WebViewAssetLoader`, pas `file://`.** Deux
façons existent de faire lire des fichiers locaux à une WebView :

- `webView.loadUrl("file:///android_asset/www/index.html")` — le plus
  simple, mais IndexedDB (utilisé par `js/storage.js` pour les
  sauvegardes) est **peu fiable en `file://`** sur de nombreuses
  versions d'Android (restrictions de sécurité propres à ce schéma
  d'URL) ;
- **`androidx.webkit.WebViewAssetLoader`** (utilisé ici) : sert les
  mêmes fichiers via un domaine **local virtuel**,
  `https://appassets.androidplatform.net/assets/www/...`. Ce domaine
  n'existe sur aucun serveur réel et n'est **jamais résolu par une
  vraie requête réseau** — `WebViewAssetLoader` intercepte la requête
  à l'intérieur même du processus de l'application et répond
  directement avec le fichier local correspondant. Le résultat est un
  jeu qui se comporte comme sur un vrai site HTTPS (stockage fiable,
  pas de restrictions `file://`) sans jamais toucher au réseau.

Voir `MainActivity.configurerWebView()` pour l'implémentation exacte.

---

## 2. Fichiers à copier dans les ressources Android

Le jeu web est copié dans `android/app/src/main/assets/www/` — c'est
le seul endroit où l'APK va chercher le contenu à afficher. Cette
copie est **automatique**, pas un geste à refaire à la main à chaque
fois :

- **Via Android Studio / Gradle (recommandé)** : la tâche
  `copierAssetsWeb` (déclarée dans `app/build.gradle`) s'exécute
  automatiquement avant chaque build (`preBuild`). Il suffit d'ouvrir
  `android/` dans Android Studio et de lancer un build normal.
- **À la main / hors Android Studio** : lancer
  `./scripts/copier-assets-android.sh` depuis la racine du dépôt.

Liste exacte de ce qui est copié (et rien d'autre) :

| Source (racine du dépôt) | Copié dans `assets/www/` | Pourquoi |
|---|---|---|
| `index.html` | `index.html` | point d'entrée du jeu |
| `css/` (tout le dossier) | `css/` | `reset.css`, `style.css`, `mobile.css`, `menu.css` |
| `js/` (tout le dossier) | `js/` | les 16 modules du jeu, `ui.js` inclus |
| `manifest.webmanifest` | `manifest.webmanifest` | inoffensif dans l'APK (métadonnées PWA ignorées par la WebView), gardé par cohérence |
| `assets/icons/` | `assets/icons/` | utilisées par `index.html` (favicon/apple-touch-icon) |

**Volontairement NON copiés** :

- `sw.js` (Service Worker) — inutile dans l'APK : le jeu y est déjà
  intégralement embarqué, il n'a besoin d'aucun cache réseau à gérer.
  `js/main.js` détecte d'ailleurs désormais ce contexte
  (`appassets.androidplatform.net`) et n'essaie même plus de
  l'enregistrer (voir §4) — il reste actif et utile pour le
  déploiement navigateur (GitHub Pages), seul cas où ce chemin est
  emprunté.
- `offline.html` — page de repli du Service Worker, sans objet ici
  pour la même raison.

Le dossier `assets/www/` lui-même n'est **pas versionné** dans Git
(voir `android/.gitignore`) : seule la source de vérité (les fichiers
à la racine du dépôt) l'est, ce qui évite qu'une copie oubliée dans
l'APK diverge silencieusement du vrai code du jeu.

---

## 3. Dépendances Internet désactivées

Trois verrous indépendants, à trois niveaux différents, garantissent
que l'application ne peut pas accéder à Internet :

1. **`AndroidManifest.xml`** ne déclare **aucune**
   `<uses-permission android:name="android.permission.INTERNET">`. Sans
   cette permission, le système d'exploitation Android **empêche
   physiquement** l'application d'ouvrir la moindre connexion réseau —
   quel que soit le code JavaScript ou natif exécuté. C'est la garantie
   la plus forte possible.
2. **`android:usesCleartextTraffic="false"`** + **`res/xml/network_security_config.xml`**
   (`cleartextTrafficPermitted="false"`) interdisent en plus tout
   trafic HTTP non chiffré, en profondeur, même si la permission
   ci-dessus venait à être ajoutée par erreur plus tard.
3. **`js/main.js`** ne tente plus d'enregistrer le Service Worker
   quand le jeu tourne sous `appassets.androidplatform.net` (voir §2)
   — un enregistrement aurait de toute façon échoué (chemin
   introuvable à cette adresse) sans rien apporter, puisque l'APK
   embarque déjà tous les fichiers nécessaires.

Le domaine `appassets.androidplatform.net` utilisé par
`WebViewAssetLoader` (voir §1) n'est **pas** une exception à ces
règles : il n'est jamais résolu par une vraie requête réseau sortante,
donc il n'a besoin d'aucune autorisation particulière.

---

## 4. Activation de JavaScript

```java
webView.getSettings().setJavaScriptEnabled(true);
```

Indispensable : l'intégralité du jeu (caméra, combat, production,
sauvegarde, interface tactile...) est écrite en JavaScript pur
(`js/*.js`), sans JavaScript la WebView n'afficherait qu'une page vide.
Voir `MainActivity.configurerWebView()`.

---

## 5. Support du stockage local

```java
webView.getSettings().setDomStorageEnabled(true);
webView.getSettings().setDatabaseEnabled(true);
```

`js/storage.js` utilise **IndexedDB** pour les sauvegardes de partie
(sauvegarde automatique + emplacements manuels, voir la VAGUE 3 dans
le `README.md` principal). Ce stockage fonctionne de façon fiable
grâce au chargement via `WebViewAssetLoader` (domaine `https://`
virtuel, voir §1) plutôt qu'en `file://` direct, schéma sous lequel
IndexedDB est restreint ou désactivé sur de nombreuses versions
d'Android. Aucune donnée de sauvegarde ne quitte l'appareil : tout
reste dans le stockage local de l'application (effacé uniquement si
l'utilisateur désinstalle l'app ou vide son cache).

---

## 6. Support du mode plein écran

Deux mécanismes de plein écran cohabitent, à deux niveaux :

- **Système (natif)** : `MainActivity.activerPleinEcran()` masque la
  barre d'état et la barre de navigation Android (mode immersif,
  réapparaissables par un glissement depuis le bord — comportement
  standard, moins déroutant qu'un verrouillage total). Ré-appliqué à
  chaque retour au premier plan (`onWindowFocusChanged`).
- **Dans la page elle-même (vague 13)** : le bouton ⛶ de `js/ui.js`
  utilise la Fullscreen API du navigateur (`requestFullscreen()`).
  Dans l'APK, l'écran est déjà en plein écran système en permanence —
  ce bouton reste sans effet visible mais inoffensif (il ne fait rien
  de plus qu'il ne l'est déjà). Aucune modification n'était nécessaire
  côté `js/ui.js` pour cette cohabitation.

---

## 7. Gestion du bouton retour Android

La vague 13 avait déjà doté `js/ui.js` d'un mécanisme de retour
arrière **contrôlé**, construit sur l'API History du navigateur : un
premier retour ferme un panneau ou une boîte de dialogue ouverte, et
ce n'est qu'une fois l'écran de jeu "nu" qu'une confirmation est
proposée avant de quitter. Ce mécanisme reste **intégralement en
place et inchangé**.

Ce qui est ajouté par cette vague, pour le rendre parfaitement fiable
dans une vraie application native (le README de la vague 13 notait que
son comportement exact dépendait du navigateur/contexte, faute de
pouvoir le vérifier sur un appareil réel) :

- **`MainActivity.onBackPressed()`** transmet chaque pression du
  bouton retour matériel à la page via `webView.goBack()`. Comme
  `js/ui.js` ne crée que des entrées d'historique du **même document**
  (`history.pushState`), ce `goBack()` ne recharge jamais la page : il
  déclenche simplement l'événement `popstate` déjà géré côté
  JavaScript.
- **Pont JavaScript → natif** (`window.AndroidNatif`, exposé par
  `webView.addJavascriptInterface`) : quand l'utilisateur confirme
  "Quitter" dans la boîte de dialogue, `js/ui.js` appelle
  `window.AndroidNatif.quitterApplication()` s'il est disponible, qui
  ferme l'Activity immédiatement et de façon fiable — au lieu de
  dépendre du comportement de `history.go()` en fin de pile
  d'historique (repli utilisé automatiquement dans le navigateur/PWA,
  où ce pont n'existe pas). Voir la fonction `quitterApplication()`
  dans `js/ui.js` : les deux chemins cohabitent, aucune régression pour
  le déploiement navigateur.

Aucune donnée de jeu ne transite par ce pont : une seule méthode,
sans paramètre, qui ne fait que fermer l'application.

---

## 8. Icônes et écran de lancement

**Icônes de l'application** — générées à partir de
`assets/icons/icon-512.png` (déjà utilisée par le manifeste PWA), aux
5 densités standard Android :

| Dossier | Taille |
|---|---|
| `res/mipmap-mdpi/ic_launcher.png` | 48×48 |
| `res/mipmap-hdpi/ic_launcher.png` | 72×72 |
| `res/mipmap-xhdpi/ic_launcher.png` | 96×96 |
| `res/mipmap-xxhdpi/ic_launcher.png` | 144×144 |
| `res/mipmap-xxxhdpi/ic_launcher.png` | 192×192 |

Chaque dossier contient aussi `ic_launcher_round.png` (image
identique — Android applique lui-même le masque circulaire sur les
lanceurs qui l'utilisent). Ce sont des icônes **classiques**
("legacy"), pas des icônes adaptatives (fond + premier plan séparés,
Android 8+) : voir "Ce qui reste ouvert" ci-dessous.

**Écran de lancement** — `res/drawable/ecran_lancement.xml` (fond uni
`#16110A`, identique à `--couleur-fond` du jeu, + icône centrée),
affiché par la fenêtre elle-même via `LaunchTheme`
(`res/values/themes.xml`) dès le lancement de l'Activity, **avant**
même que la WebView n'ait quoi que ce soit à afficher. Bascule vers le
thème normal (`AppTheme`) dans `onPageFinished()`, une fois
`index.html` chargé — moment où l'écran de chargement **HTML**
existant (`#ecran-chargement`, même palette, géré par `main.js` depuis
la vague 1) prend le relais avec son propre fondu. Les deux écrans de
chargement (natif puis HTML) donnent l'impression d'un seul et même
écran continu, sans flash de couleur.

---

## 9. Construire l'APK

**Avec Android Studio (recommandé) :**

1. `Fichier → Ouvrir...` et sélectionner le dossier `android/` (pas la
   racine du dépôt).
2. Android Studio propose de générer le wrapper Gradle manquant
   (`gradlew`) — accepter. Il télécharge Gradle une seule fois (accès
   Internet nécessaire **sur votre machine de développement**
   uniquement, jamais dans l'APK généré — voir l'encadré ci-dessous).
3. Laisser la synchronisation Gradle se terminer (télécharge les deux
   dépendances déclarées dans `app/build.gradle` :
   `androidx.appcompat` et `androidx.webkit`, uniquement à la
   compilation).
4. `Build → Build Bundle(s) / APK(s) → Build APK(s)`.
5. L'APK signé en debug se trouve dans
   `android/app/build/outputs/apk/debug/app-debug.apk`, installable
   directement sur un téléphone Android (après avoir autorisé
   "sources inconnues"/"installer des apps inconnues").

**En ligne de commande**, une fois le wrapper Gradle généré :

```sh
cd android
./gradlew assembleDebug
```

> **Sur la distinction "outils de build" / "application hors ligne"** :
> télécharger Gradle et les deux bibliothèques Android ci-dessus se
> produit une fois, sur votre ordinateur, pendant que vous développez
> — exactement comme n'importe quel projet Android, Java ou npm.
> Cela n'a **aucun rapport** avec le comportement de l'APK une fois
> installé sur un téléphone : celui-ci ne demande la permission
> INTERNET nulle part (§3) et ne peut donc, par construction, faire
> aucun appel réseau, qu'il soit connecté au Wi-Fi/4G ou non.

---

## 10. Ce qui reste ouvert

- **Build release signé** : l'APK généré ci-dessus est un build
  *debug* (signature de développement automatique), suffisant pour
  tester/installer manuellement mais pas pour publier (Play Store ou
  distribution large), comme déjà noté pour le workflow GitHub Actions
  du `README.md` principal. Nécessite de créer un keystore
  (`keytool -genkey ...`) et de configurer `signingConfigs` dans
  `app/build.gradle` — volontairement absent ici, une clé de
  signature ne doit jamais être générée ni stockée sans votre
  validation explicite.
- **Icônes adaptatives** (Android 8+, fond et premier plan séparés,
  avec animations système) : non incluses — nécessiteraient un
  premier plan détouré sur fond transparent, absent des assets
  actuels (`icon-512.png` a un fond opaque). Les icônes "classiques"
  fournies (§8) s'affichent correctement sur toutes les versions
  d'Android, seulement sans les effets visuels propres aux icônes
  adaptatives.
- **`gradle-wrapper.jar`** (le binaire du wrapper Gradle) n'est
  volontairement pas versionné ici — seul
  `gradle/wrapper/gradle-wrapper.properties` l'est. Android Studio le
  régénère automatiquement à la première ouverture du projet (voir
  §9) ; en ligne de commande, `gradle wrapper` (avec une installation
  Gradle locale) fait la même chose.
- **Retour arrière** : le pont `window.AndroidNatif` (§7) n'a pu être
  vérifié que par relecture du code, pas encore testé sur un appareil
  Android réel — à confirmer lors d'un premier build.
- Pas de retour haptique (vibration) sur les actions tactiles, comme
  déjà noté pour l'interface de la vague 13.

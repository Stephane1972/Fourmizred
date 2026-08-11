# Fourmizred

Jeu de stratégie temps réel (RTS) façon Command & Conquer, avec une
colonie de fourmis. Développé en HTML5/Canvas/JavaScript pur pour
rester jouable aussi bien sur navigateur desktop que sur mobile,
et empaqueté en application Android via Capacitor.

## Architecture du code

Le jeu est découpé en modules pour rester maintenable et pour que le
navigateur (ou la WebView Android) puisse mettre en cache chaque
fichier indépendamment :

```
index.html          squelette HTML, charge les modules dans l'ordre
css/style.css        toute la mise en forme
js/utils.js          fonctions utilitaires partagées
js/etat.js            état global, caméra, deltaTime, grille d'exploration
js/terrain.js         génération et rendu du sol, nids, ressources
js/fourmi.js          classe Fourmi (ouvrière/soldat, récolte, combat)
js/insectes.js        faune d'ambiance décorative (pucerons, coccinelles, scarabées)
js/combat.js          IA ennemie et résolution des accrochages
js/batiments.js       construction, production, boutons
js/minicarte.js       rendu et interaction de la mini-carte
js/input.js           souris/tactile/clavier, aide, bouton retour Android
js/main.js            peuplement initial et boucle de jeu
```

## État actuel

`index.html` est le prototype jouable (aucune dépendance, aucune
installation nécessaire — ouvrez-le simplement dans un navigateur) :

- Carte scrollable (flèches/ZQSD au clavier, glisser à deux doigts
  au tactile)
- Sélection de fourmis (clic/tap simple, ou glisser pour une
  sélection rectangulaire multiple)
- Déplacement (clic droit à la souris, tap au tactile)
- Récolte de nourriture en boucle automatique façon Harvester C&C
- Construction : bâtiment "Chambre" (150 🌿) qui produit
  automatiquement de nouvelles ouvrières
- **Combat** : une colonie ennemie (nid au sud-est de la carte)
  envoie régulièrement des fourmis qui repèrent et attaquent vos
  unités les plus proches ; vos fourmis se défendent
  automatiquement au contact. Barres de vie visibles dès qu'une
  fourmi est blessée.
- **Deux unités distinctes** : l'Ouvrière (récolte) et le Soldat
  (mandibules en crochet, plus de PV/dégâts, ne récolte pas)
- **Habillage visuel** : terrain en plusieurs couches (taches de sol,
  cailloux, brins d'herbe, chemin de terre battue autour du nid),
  ressources en amas de champignons, nids et bâtiments avec un léger
  dégradé pour le relief, ombres portées sous les fourmis, variation
  de teinte individuelle pour éviter l'effet "copier-coller"
- **Faune d'ambiance** (purement décorative, sans effet de
  gameplay) : colonies de pucerons près de certaines ressources,
  coccinelles et scarabées qui errent lentement sur la carte

`reference/modele-fourmi-castes.html` est une démo séparée montrant
les différentes castes de fourmis dessinées (ouvrière, soldat,
soldat majeur, reine, nourrice, éclaireuse, mâle ailé) — sert de
base visuelle pour de futures unités dédiées (actuellement toutes
les unités du prototype sont visuellement identiques).

## Application Android

Le dépôt est configuré avec **Capacitor** pour empaqueter le jeu en
véritable application Android, et un **workflow GitHub Actions**
(`.github/workflows/build-android.yml`) qui compile automatiquement
l'APK à chaque push sur `main` et le publie dans les **Releases**
du dépôt GitHub.

**Pour récupérer l'APK** : onglet "Releases" du dépôt GitHub → la
dernière release contient le fichier `.apk` à télécharger et
installer directement sur votre téléphone Android (il faudra
autoriser "sources inconnues"/"installer des apps inconnues" dans
les réglages Android lors de la première installation, puisque
l'app n'est pas distribuée par le Play Store).

L'APK généré est un build **debug** (signé automatiquement avec une
clé de développement) — suffisant pour tester et installer
directement, mais pas pour publier sur le Play Store en l'état.

## Corrections techniques appliquées

- **Viewport mobile** : balise `<meta name="viewport">` ajoutée (manquait, pouvait fausser l'échelle/le tactile en WebView Android)
- **deltaTime** : tous les déplacements et minuteries sont désormais normalisés par `dt` — le jeu tourne à la même vitesse réelle sur un écran 60Hz, 90Hz ou 120Hz (avant, tout était plus rapide sur un écran à taux de rafraîchissement élevé)
- **Pause en arrière-plan** : la boucle de jeu s'interrompt quand l'app est masquée (économie de batterie, évite un bond de temps au retour)
- **Bouton retour Android** : géré via `@capacitor/app` — demande confirmation avant de quitter au lieu de fermer l'app instantanément

## Ce qui reste ouvert (nécessite votre confirmation ou vos assets)

- Confirmer que le workflow GitHub Actions compile bien un APK fonctionnel
- Icône et splash screen personnalisés (utilise les valeurs par défaut de Capacitor pour l'instant)
- Build **release** signé avec votre propre clé, nécessaire pour toute publication (Play Store ou distribution large) — l'APK actuel est un build debug, adapté aux tests uniquement
- Différenciation visuelle des unités (les castes existent déjà dans `reference/`, pas encore utilisées dans le jeu)
- Condition de victoire/défaite

## Prochaines étapes envisagées

- Différencier visuellement les unités (soldat vs ouvrière au combat)
- Brouillard de guerre
- Interface tactile pour choisir un type d'unité à produire
- Son et musique
- Build Android **release** signé, en vue d'une éventuelle
  publication (Play Store "Limited Distribution" ou sideload direct)

## Lancer le prototype en local

Aucune installation : ouvrez `index.html` dans n'importe quel
navigateur récent (desktop ou mobile).


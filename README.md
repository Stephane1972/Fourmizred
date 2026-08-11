# Fourmizred

Jeu de stratégie temps réel (RTS) façon Command & Conquer, avec une
colonie de fourmis. Développé en HTML5/Canvas/JavaScript pur pour
rester jouable aussi bien sur navigateur desktop que sur mobile,
et empaqueté en application Android via Capacitor.

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


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


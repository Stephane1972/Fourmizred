# Fourmizred

Jeu de stratégie temps réel (RTS) façon Command & Conquer, avec une
colonie de fourmis. Développé en HTML5/Canvas/JavaScript pur pour
rester jouable aussi bien sur navigateur desktop que sur mobile
(Android via Capacitor, à venir).

## État actuel

`index.html` est un prototype jouable autonome (aucune dépendance,
aucune installation nécessaire — ouvrez-le simplement dans un
navigateur) :

- Carte scrollable (flèches/ZQSD au clavier, glisser à deux doigts
  au tactile)
- Sélection de fourmis (clic/tap simple, ou glisser pour une
  sélection rectangulaire multiple)
- Déplacement (clic droit à la souris, tap au tactile)
- Récolte de nourriture en boucle automatique façon Harvester C&C :
  une fourmi sélectionnée envoyée sur une ressource s'y rend, récolte,
  rapporte au nid, décharge, puis y retourne automatiquement
- Contrôles unifiés souris/tactile via les Pointer Events, testés
  pour fonctionner sans clic droit sur mobile

`reference/modele-fourmi-castes.html` est une démo séparée montrant
les différentes castes de fourmis dessinées (ouvrière, soldat,
soldat majeur, reine, nourrice, éclaireuse, mâle ailé) — sert de
base visuelle pour les futures unités du jeu.

## Prochaines étapes envisagées

- Construction de bâtiments (dépenser la nourriture accumulée)
- Première unité/faction ennemie
- Brouillard de guerre
- Portage Android via Capacitor + build automatique par GitHub Actions
  (même méthode que le projet Lumidra)

## Lancer le prototype

Aucune installation : ouvrez `index.html` dans n'importe quel
navigateur récent (desktop ou mobile).

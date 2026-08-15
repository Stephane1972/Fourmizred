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

## État du projet — VAGUE 3 terminée

Ajout de la carte réelle vue du dessus : terrain texturé, fourmilière
visible, et un moteur de rendu qui ne dessine que ce qui est
réellement à l'écran.

### Ce qui a été ajouté

- `js/renderer.js` — génération du terrain (taches de sol, cailloux,
  brins d'herbe, adapté à la taille de la carte), la fourmilière au
  centre (avec une légère animation de "respiration"), les retours
  tactiles (anneau qui s'estompe à l'endroit touché), et un rendu qui
  ignore tout ce qui est hors champ (culling via `zoneVisibleMonde()`)
- `js/camera.js` — nouvelle fonction `zoneVisibleMonde()`, utilisée
  par le renderer pour le culling
- `js/input.js` — distingue un tap d'un glissement, déclenche le
  retour tactile, bascule le curseur souris en "main" pendant le
  glissement
- `js/main.js` — véritable système de temps (`temps.total`,
  `temps.delta`, indépendant du taux de rafraîchissement de l'écran),
  boucle de jeu formalisée autour de ce système
- `css/style.css` — curseur grab/grabbing sur le canevas
- `css/mobile.css` — désactivation du tiré-vers-le-bas et du rebond
  de défilement mobile, qui gênaient le glissement de la caméra

### Vérifications effectuées

Testé avec un vrai DOM simulé (pas juste une vérification de
syntaxe) : génération du terrain, position de la fourmilière au
centre exact de la carte, progression réelle de `temps.total` entre
deux frames, cohérence de la zone visible calculée pour le culling,
apparition d'un retour tactile après un tap, et bascule correcte de
la classe CSS `saisie` pendant un glissement.

---

## État du projet — VAGUE 4 terminée

Les ressources récoltables sont désormais visibles sur la carte.

### Ce qui a été ajouté

- `js/resources.js` — génère des nœuds de **nourriture** (amas de
  graines), **eau** (points d'eau) et **matériaux** (brindilles),
  répartis sur la carte en évitant la zone immédiate de la
  fourmilière ; chaque type a son propre rendu
- `js/renderer.js` — dessine les nœuds (avec culling comme le reste
  du terrain), et affiche le stock actuel de `etat.ressources` dans
  le panneau de diagnostic temporaire (🌾💧🪵👥)

Pas encore de récolte réelle : les nœuds sont posés et affichés, mais
rien ne vient encore y prélever — ça arrivera avec `units.js`.

### Vérifications effectuées

Testé avec un vrai DOM simulé : nœuds générés pour les 3 types (leur
nombre s'adapte correctement à la taille réelle de la carte), aucun
nœud à l'intérieur de la zone protégée autour de la fourmilière, aucun
nœud en dehors des limites de la carte, et le rendu de chaque type
(nourriture/eau/matériaux) ne produit aucune erreur.

---

## État du projet — VAGUE 4 (collecte + sauvegarde) terminée

Deux ajouts majeurs : une première forme de collecte (toucher un nœud
de ressource) et une vraie persistance de partie via IndexedDB.

### Ce qui a été ajouté

- `js/resources.js` — `collecterRessource()` : toucher un nœud
  prélève 20 unités dans le stock et les retire du nœud, avec un
  retour visuel "+20" flottant
- `js/renderer.js` — système de textes flottants réutilisable
- `js/input.js` — un tap distingue maintenant "sur un nœud" (collecte)
  de "sur le sol" (simple retour tactile)
- `js/storage.js` (nouveau) — API complète IndexedDB :
  `sauvegarderPartie`, `chargerPartie`, `supprimerSauvegarde`,
  `listerSauvegardes` (plusieurs emplacements nommés), sauvegarde
  automatique toutes les 30s, et `demarrerPartie()` qui charge la
  sauvegarde "auto" si elle existe ou démarre une partie neuve sinon
- `js/main.js` — démarrage désormais asynchrone (attend
  `demarrerPartie()` avant de lancer la boucle), raccourcis clavier
  temporaires **S** (sauvegarder), **L** (charger), **Suppr**
  (supprimer) sur l'emplacement "manuel" — en attendant de vrais
  boutons dans `ui.js`

### Vérifications effectuées

Au-delà des tests unitaires habituels (syntaxe, collecte, API de
sauvegarde), un test bout-en-bout a simulé **deux sessions
successives séparées** (l'équivalent de fermer et rouvrir le jeu) :
collecte de ressources en session 1, sauvegarde automatique forcée,
puis nouvelle session repartant de zéro — la partie a été
correctement restaurée avec le même stock de ressources et les mêmes
nœuds sur la carte. Un bug de robustesse a aussi été détecté et
corrigé au passage : un `delta` de temps invalide contournait
silencieusement la vérification d'intervalle de la sauvegarde
automatique (comparaison avec `NaN` toujours fausse) ; une garde
défensive a été ajoutée des deux côtés (système de temps et
sauvegarde automatique).

---

## État du projet — VAGUE 5 (production d'unités) terminée

Trois bâtiments producteurs et cinq unités jouables, avec de vraies
files de production.

### Ce qui a été ajouté

- `js/units.js` (nouveau) — 5 unités définies avec coût, temps de
  production, PV, vitesse et capacité particulière (Ouvrière,
  Nourrice, Éclaireuse, Fourmi rouge, Fourmi charpentière), rendu
  simple mais distinct par type, avec légère animation de repos
- `js/buildings.js` (nouveau) — Nurserie (Ouvrière, Nourrice),
  Caserne (Fourmi rouge, Fourmi charpentière), École des éclaireuses
  (Éclaireuse) ; chaque bâtiment a sa propre file de production,
  affichée avec une barre de progression
- Vérifications intégrées : coût prélevé uniquement si payable,
  population réservée dès la mise en file (pas seulement à la
  sortie, pour ne jamais dépasser la limite), refus propre si
  ressources insuffisantes ou population au maximum
- `js/storage.js` — les bâtiments et leurs files en cours vivent dans
  `etat.batiments` (déjà prévu depuis la vague 1), donc automatiquement
  inclus dans les sauvegardes sans changement de structure

### Ce qui n'existe pas encore

Les unités produites restent immobiles près de leur bâtiment — ni
déplacement, ni sélection, ni ordres, ni combat. Ce sera pour une
prochaine vague (probablement en étendant `input.js`).

Pas encore de vrai menu de production cliquable : des raccourcis
clavier temporaires (1 à 5) permettent de tester dès maintenant,
en attendant `ui.js`.

### Vérifications effectuées

Testé de bout en bout avec un vrai DOM simulé : placement des 3
bâtiments, mise en production avec prélèvement exact du coût,
apparition réelle d'une unité une fois le temps écoulé, présence de
toutes les statistiques requises sur les 5 types d'unités, refus
correct en cas de ressources insuffisantes ou de population au
maximum, et conservation des bâtiments/unités à travers une
sauvegarde/rechargement complet.

---

## État du projet — VAGUE 6 (combat) terminée

Premier système de combat jouable, avec un adversaire réel sur la carte.

### Ce qui a été ajouté

- `js/combat.js` (nouveau) — `ordonnerAttaque()`, déplacement vers la
  cible jusqu'à portée, `resoudreCombats()` qui calcule les dégâts
  pour chaque paire joueur/ennemi mutuellement à portée (jamais entre
  unités d'une même faction — c'est la garantie contre les blessures
  alliées), destruction à 0 PV avec libération de la population,
  et la colonie rivale (nid + 3 fourmis rouges + 2 ouvrières)
- `js/units.js` — chaque unité a désormais `degats`, `portee` et
  `cadenceAttaque` en plus de ses statistiques existantes ; anneau de
  sélection vert au sol ; teinte rougeâtre pour distinguer les
  unités ennemies au premier coup d'œil
- `js/input.js` — un tap sur une unité alliée la sélectionne ; un tap
  sur une unité ennemie donne l'ordre d'attaque à tout ce qui est
  actuellement sélectionné

### Vérifications effectuées

Testé de bout en bout avec un vrai DOM simulé : présence de la
colonie rivale, sélection d'une unité, déplacement réel vers la
cible après un ordre d'attaque, aucun dégât hors de portée puis
dégât dès le contact, destruction effective d'une unité tombée à 0
PV, et — le point le plus important — deux unités alliées au contact
direct l'une de l'autre conservent chacune tous leurs PV intacts.

### Ce qui n'existe pas encore

Pas d'intelligence artificielle : la colonie rivale ne bouge pas et
n'attaque pas de son propre chef, elle se défend seulement si on
vient l'attaquer (ce sera le rôle de `ai.js`). Pas encore de
sélection multiple par glisser (un tap sélectionne une seule unité à
la fois), pas de menu de combat ni d'unités rares.

---

## État du projet — VAGUE 7 (ordres de récolte) terminée

Les ouvrières (et nourrices) peuvent désormais recevoir de vrais
ordres de récolte, avec un cycle complet et automatique.

### Ce qui a été ajouté

- `js/resources.js` — `donnerOrdreRecolte()`, cycle d'état complet
  (`versRessource` → `recolte` → `versNid` → `depose`), retour
  automatique sur le même nœud tant qu'il n'est pas épuisé, file
  d'ordres (`fileOrdres`) permettant d'empiler plusieurs nœuds à la
  suite, et `annulerOrdres()`
- `js/units.js` — `capaciteTransport` par type (20 pour l'Ouvrière, 8
  pour la Nourrice, 0 pour les unités de combat, qui ne peuvent donc
  pas recevoir d'ordre de récolte), affichage de la tâche actuelle
  au-dessus de l'unité sélectionnée, petit indicateur de cargaison
  coloré selon la ressource transportée
- `js/input.js` — taper un nœud avec des unités capables de
  transporter sélectionnées leur donne l'ordre d'y aller ; **sans
  sélection ou avec des unités de combat, l'ancienne collecte
  instantanée reste disponible telle quelle**
- `js/main.js` — raccourci **C** pour annuler les ordres des unités
  sélectionnées (récolte et combat), en attendant un vrai bouton
  dans `ui.js`
- `js/storage.js` — les nœuds de ressource ont désormais un
  identifiant stable, inclus dans la sauvegarde (nécessaire pour
  qu'un ordre de récolte en cours retrouve son nœud après un
  rechargement)

### Vérifications effectuées

Testé de bout en bout : l'ancienne collecte au tap fonctionne
toujours à l'identique sans sélection, un ordre de récolte complet
aboutit à un dépôt exact de la capacité de transport, l'unité
reprend automatiquement un second cycle sans nouvel ordre, plusieurs
nœuds peuvent être empilés dans la file, l'annulation vide bien la
file et repasse l'unité en inactif, et une unité de combat sans
capacité de transport se voit refuser tout ordre de récolte.

---

## État du projet — VAGUE 8 (menaces sauvages + fin de partie) terminée

Les mécaniques de combat de base (sélection, ordre d'attaque,
dégâts, PV, portée, mort) existaient déjà depuis la vague 6 et ont
été confirmées fonctionnelles avec les nouvelles créatures. Cette
vague ajoute la vraie nouveauté : des menaces autonomes et un
objectif de victoire/défaite.

### Ce qui a été ajouté

- `js/units.js` — **Araignée** (150 PV, 20 dégâts, lente, redoutable)
  et **Scarabée** (80 PV, 10 dégâts, carapace résistante), rendues
  plus grandes que les fourmis ; anneau rouge sur toute cible
  actuellement visée par un ordre d'attaque
- `js/combat.js` — `genererMenacesSauvages()` (3 araignées + 3
  scarabées, à l'écart des deux nids), `deplacerMenacesSauvages()` :
  contrairement à la colonie rivale (toujours statique, en attendant
  `ai.js`), elles rôdent activement — foncent sur la première unité
  alliée détectée à proximité, ou vers la fourmilière sinon ;
  `resoudreAttaquesFourmiliere()` la rend réellement destructible ;
  `verifierFinDePartie()` déclenche la victoire (plus aucune unité
  ennemie vivante) ou la défaite (fourmilière à 0 PV)
- `js/renderer.js` — barre de vie sur la fourmilière une fois
  blessée, écran de fin de partie (voile sombre + message centré)
- `js/main.js` — la simulation se fige à la fin de partie (plus de
  production/récolte/combat), mais le rendu continue pour garder le
  champ de bataille visible sous le message
- `js/storage.js` — PV de la fourmilière et résultat de partie inclus
  dans la sauvegarde, avec compatibilité pour les sauvegardes plus
  anciennes qui n'ont pas ces champs

### Vérifications effectuées

Testé de bout en bout : présence exacte des 3 araignées, 3
scarabées et des 5 unités de la colonie rivale au démarrage,
fourmilière à 500/500 PV, une araignée qui se déplace réellement
vers une unité alliée détectée à proximité, des PV de fourmilière
qui baissent effectivement au contact d'une menace, déclenchement
correct de la défaite à 0 PV de fourmilière, et déclenchement
correct de la victoire (avec nettoyage du tableau d'unités) quand
plus aucun ennemi n'est vivant.

Aucun serveur ni connexion Internet requis — tout tourne en local,
comme le reste du projet depuis la vague 1.

---

## Prochaine étape

En attente de validation avant de démarrer la **VAGUE 3** (prévue :
`resources.js` + `buildings.js` + `storage.js` — les premières
ressources récoltables, le premier bâtiment posable, et la sauvegarde).

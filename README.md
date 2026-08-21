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

## État du projet — VAGUE 9 (bâtiments défensifs) terminée

Cinq structures défensives constructibles où vous voulez sur la
carte, avec un vrai combat automatique.

### Ce qui a été ajouté

- `js/defenses.js` (nouveau) — Mur de résine et Porte blindée
  (passives, PV élevés) ; Lance-venin, Piège à mandibules et
  Tourelle à acide (attaque automatique : chacune cible l'ennemi le
  plus proche à sa portée, respecte son propre temps de rechargement,
  et cesse de tirer une fois épuisée) ; réparation avec les
  matériaux (5 PV restaurés par matériau dépensé, jamais plus que
  nécessaire ni plus que le stock disponible)
- `js/input.js` — touches 6 à 0 pour armer le placement d'une
  défense (provisoire, en attendant un menu dans `ui.js`), tap
  suivant sur la carte pour la construire ; taper une défense
  alliée endommagée la répare directement
- `js/renderer.js` — rendu des défenses (murs/portes en rectangles,
  tourelles en cercles avec un petit canon si elles attaquent),
  barre de progression pendant la construction, barre de vie une
  fois endommagées

### Bug détecté et corrigé en cours de route

`dessinerBatimentsProduction()` (vague 5) parcourait tout
`etat.batiments` sans distinguer les bâtiments de production des
nouvelles défenses qui partagent désormais le même tableau — ça
plantait au premier placement d'une défense. Corrigé en filtrant
explicitement sur `TYPES_BATIMENT_PRODUCTION[b.type]`.

### Sauvegarde IndexedDB des défenses

Comme les défenses vivent dans `etat.batiments` — déjà couvert
intégralement par `storage.js` depuis la vague 5 — leur sauvegarde
n'a nécessité **aucune modification de `storage.js`**. Vérifié
explicitement par un test dédié plutôt que supposé : sauvegarde,
rechargement, et comparaison exacte du type, des PV et de la
position de chaque défense.

### Vérifications effectuées

Testé de bout en bout : coût prélevé au placement, structure
inerte pendant sa construction, fonctionnelle une fois terminée,
tourelle qui touche une cible à portée mais pas hors de portée,
réparation qui restaure les PV en consommant les matériaux au bon
tarif et sans dépasser le plafond, destruction propre à 0 PV, et
sauvegarde/rechargement fidèle via IndexedDB.

---

## État du projet — VAGUE 10 (unités avancées) terminée

Dix nouvelles unités, niveaux 3 à 5, chacune avec coût, statistiques
complètes, capacité, **faiblesse** (nouveau champ) et **bâtiment
requis** (nouveau champ).

### Niveau 3
Fourmi tisserande, Fourmi légionnaire, Fourmi chimiste, Fourmi volante

### Niveau 4
Fourmi bouledogue, Fourmi piège, Fourmi balle de fusil, Soldat géant

### Niveau 5
Fourmi explosive, Reine guerrière

### Ce qui a été ajouté

- `js/units.js` — les 10 unités, avec une progression de puissance
  vérifiée par palier (score PV + dégâts×3 moyen : 153 en niveau 3,
  271 en niveau 4, 398 en niveau 5), la Reine guerrière culminant
  avec les PV les plus élevés du jeu
- `js/buildings.js` — Fourmi légionnaire, Fourmi bouledogue, Fourmi
  balle de fusil et Soldat géant ajoutées à la Caserne ; Fourmi
  volante ajoutée à l'École des éclaireuses — ces 5 unités sont donc
  **réellement productibles dès maintenant**, testé en conditions
  réelles jusqu'à l'apparition effective d'une unité

### Limite assumée : 5 unités non encore productibles

Fourmi tisserande, Fourmi chimiste, Fourmi piège, Fourmi explosive
et Reine guerrière référencent un `batimentRequis: 'chambreSpecialistes'`
— un bâtiment prévu au plan d'origine mais jamais encore construit.
Elles sont donc entièrement définies (stats, capacité, faiblesse)
mais aucun bâtiment actuel ne permet de les produire. Une prochaine
vague pourra construire cette Chambre des spécialistes pour les
débloquer.

### Vérifications effectuées

Testé de bout en bout : présence et complétude des champs pour les
10 unités, progression de puissance respectée par palier, mise en
production réussie des 5 unités rattachées à des bâtiments
existants, apparition réelle d'une unité avec ses statistiques
exactes, et confirmation explicite que les 5 autres restent non
productibles pour l'instant (comportement attendu, pas un bug).

---

## État du projet — VAGUE 11 (recherche) terminée

Cinq bâtiments de recherche et un arbre de dix technologies (deux
paliers par bâtiment, le second nécessitant le premier).

### Ce qui a été ajouté

- `js/research.js` (nouveau) — Laboratoire biologique, Laboratoire
  chimique, Centre de génétique, Observatoire, Centre de stratégie ;
  `mettreEnFileRecherche()` vérifie construction terminée,
  prérequis, technologie pas déjà acquise, et ressources
  suffisantes avant de prélever le coût ; les technologies du Centre
  de stratégie (+5 puis +10 population maximale) sont **réellement
  appliquées** à l'acquisition, pour prouver que le système
  fonctionne de bout en bout sans toucher au combat déjà testé des
  vagues précédentes — les 8 autres décrivent un effet "à venir"
  (même principe que les capacités d'unités depuis la vague 10)
- `js/input.js` — touches B/H/G/O/T pour armer le placement d'un
  laboratoire (provisoire), mutuellement exclusif avec le placement
  de défenses de la vague 9
- `js/renderer.js` — rendu des laboratoires, barre de progression de
  construction puis de recherche en cours

### Bug détecté et corrigé en cours de route

`mettreEnFileRecherche()` ne vérifiait pas si le laboratoire était
encore en construction — une recherche pouvait être lancée sur un
bâtiment pas encore terminé. Corrigé par un test qui a immédiatement
révélé le problème.

### Sauvegarde des technologies

`etat.technologies` existe depuis la toute première vague, prévu
justement pour cet usage, et les laboratoires vivent dans
`etat.batiments` comme les défenses de la vague 9 : **aucune
modification de `storage.js`** n'a donc été nécessaire. Vérifié
explicitement par un test dédié plutôt que supposé.

### Vérifications effectuées

Testé de bout en bout : existence des 5 laboratoires et 10
technologies avec coût et temps de recherche, coût prélevé au
placement, recherche refusée pendant la construction, acceptée une
fois terminée, palier II refusé sans le palier I puis accepté une
fois celui-ci acquis, refus d'une recherche en double, effet
réellement appliqué (+5 population maximale), et conservation
fidèle des technologies et des laboratoires à travers une
sauvegarde/rechargement complet.

Toutes les données restent conservées hors ligne, comme le reste du
projet depuis la vague 1.

---

## État du projet — VAGUE 12 (missions) terminée

Dix missions jouables avec un moteur d'objectifs générique
supportant 7 types différents (récolter, éliminer, produire,
survivre, rechercher une technologie, atteindre une population,
construire un bâtiment).

### Les dix missions
1. Première galerie · 2. Récolte urgente · 3. La colonie rivale ·
4. Le territoire rouge · 5. L'invasion des araignées · 6. Le pont
de feuilles · 7. La guerre des pucerons · 8. Le laboratoire secret ·
9. La grande migration · 10. La guerre des reines

### Ce qui a été ajouté

- `js/missions.js` (nouveau) — les 10 définitions complètes
  (objectifs, ennemis, ressources de départ, récompense) ; moteur
  `evaluerObjectif()` générique ; `demarrerMission()` réinitialise
  la partie avec les paramètres propres à la mission ; défaite
  toujours possible par destruction de la fourmilière, et en plus
  par dépassement du temps imparti si la mission en a un ;
  déblocage séquentiel (`missionDebloquee()`) — la mission N+1
  n'est accessible qu'une fois la N terminée
- `js/state.js` — `missionsCompletees` (persiste entre les
  sessions, jamais réinitialisé par une simple nouvelle partie) et
  `progressionMission` (suivi de la progression en cours)
- `js/units.js` — compteur d'unités produites, nécessaire à
  l'objectif "produire des unités" de la mission 6
- `js/combat.js` — la fin de partie générique (mode escarmouche
  libre) cède la main à `missions.js` dès qu'une mission est active,
  pour ne pas déclencher une victoire automatique sur des missions
  sans ennemis
- `js/renderer.js` — panneau d'objectifs affiché en haut à gauche
  pendant une mission, avec coche dès qu'un objectif est rempli

### Interface provisoire

Il n'y a pas encore de menu de sélection de mission tactile —
`demarrerMission(1)` à `demarrerMission(10)` se déclenchent pour
l'instant depuis la console développeur, en attendant `ui.js`.

### Vérifications effectuées

Testé de bout en bout : les 10 missions ont bien tous les champs
requis, déblocage séquentiel respecté, ressources de départ
appliquées, objectif de récolte qui progresse et déclenche
victoire + récompense appliquée + mission ajoutée à
`missionsCompletees`, défaite par dépassement du temps imparti,
défaite par destruction de la fourmilière, objectif d'élimination
qui fonctionne avec les araignées de la mission 5, et conservation
fidèle de toute la progression de campagne (missions terminées et
mission en cours) à travers une sauvegarde/rechargement complet.

---

## État du projet — VAGUE 13 (interface tactile + optimisation Android) terminée

Jusqu'ici, tout ce qui dépassait la caméra (production, construction,
recherche, missions, sauvegarde) ne se déclenchait qu'au clavier
(`RACCOURCIS_PRODUCTION`, `RACCOURCIS_DEFENSE`, `RACCOURCIS_LABORATOIRE`,
S/L/Suppr/C dans `main.js`) — injouable sur un téléphone sans clavier
physique. Cette vague ajoute une interface tactile complète qui
déclenche exactement les mêmes fonctions, sans toucher à un seul
coût, une seule durée, ni au comportement d'aucun module de jeu.

### Ce qui a été ajouté

- **`js/ui.js`** (nouveau) — construit toute l'interface en HTML
  généré dynamiquement : barre de ressources compacte, barre
  d'outils du bas (5 boutons : Produire, Bâtir, Recherche, Missions,
  Partie), panneau extensible au-dessus (un seul ouvert à la fois),
  bannière de mode de placement (défense/laboratoire armé, avec
  bouton Annuler), boîte de dialogue de confirmation générique.
  Chaque bouton appelle une fonction déjà existante :
  `mettreEnFileProduction`, `activerPlacementDefense`,
  `activerPlacementLaboratoire`, `mettreEnFileRecherche`,
  `demarrerMission`, `annulerOrdres`, `sauvegarderPartie`,
  `chargerPartie`. Les raccourcis clavier restent fonctionnels tels
  quels (rien retiré de `main.js`) — clavier et tactile cohabitent.
- **`js/ui.js`** — gestion du **retour arrière Android** par la
  History API : un état factice est empilé au chargement : le
  premier retour ferme la boîte de dialogue ouverte, sinon le
  panneau ouvert, et ce n'est qu'une fois l'écran de jeu « nu » qu'un
  retour arrière propose une confirmation avant de laisser
  l'application se fermer réellement.
- **`js/ui.js`** — **plein écran** (Fullscreen API) via un bouton
  dédié (coin haut-gauche) plus une tentative discrète à la toute
  première pression tactile de la session (un geste utilisateur est
  requis par les navigateurs ; échoue silencieusement si refusé).
- **`js/ui.js`** — `demarrerPartieLibre()` : bouton « Nouvelle
  partie » dans le panneau Partie, reprend la même séquence que la
  branche « aucune sauvegarde » de `demarrerPartie()`
  (`storage.js`, inchangée) — jusqu'ici accessible uniquement en
  rechargeant la page.
- **`css/menu.css`** (nouveau) — présentation de toute l'interface
  ci-dessus : cibles tactiles ≥ 48px (souvent 56px+), marges
  `env(safe-area-inset-*)` pour encoches et barre de gestes Android,
  tailles de police en `clamp()`, grille de boutons qui se reforme
  automatiquement (`auto-fill`) du petit téléphone à la tablette,
  ajustement dédié au paysage bas (barre d'outils et panneau
  compactés, étiquettes de texte masquées, icônes seules).
- **`js/renderer.js`** — la surcouche de diagnostic canvas (position
  caméra, zoom, horloge) est désormais masquée par défaut derrière
  un booléen `afficherSurcoucheDebug` (bascule : touche **D**,
  desktop uniquement) — remplacée pour le joueur par la vraie barre
  de ressources HTML de `ui.js`, lisible sur petit écran. Aucun
  changement de ce qui est calculé, uniquement de ce qui est dessiné.
- **`index.html`** — conteneurs vides pour l'interface (remplis par
  `js/ui.js`), lien vers `css/menu.css`, `viewport` déjà correct
  depuis la vague 1 (`user-scalable=no` + zoom à deux doigts géré
  en interne par `camera.js`/`input.js`, pas de conflit).
- **`sw.js`** — `css/menu.css` et `js/ui.js` ajoutés au précache,
  `CACHE_NAME` incrémenté (`v13` → `v14`) pour forcer la mise à jour
  chez les visiteurs déjà installés.
- **`js/config.js`** — `VERSION_JEU` : `0.1.0` → `0.2.0`.

### Récapitulatif de la checklist Android demandée

| Point demandé | État | Détail |
|---|---|---|
| Commandes tactiles | ✅ déjà en place (vague 1) + ✅ complété | Caméra/sélection/ordres tactiles existaient déjà (`input.js`, événements Pointer unifiés souris/tactile) ; production/construction/recherche/missions/sauvegarde étaient clavier-only, désormais tactiles (`ui.js`) |
| Boutons de grande taille | ✅ nouveau | Barre d'outils ≥ 56px de haut, cartes de panneau ≥ 52px, dialogue ≥ 48px (`menu.css`) |
| Orientation portrait et paysage | ✅ déjà en place + ✅ affiné | `manifest.webmanifest` avait déjà `orientation: any` ; ajustement dédié au paysage bas ajouté dans `menu.css` |
| Zoom à deux doigts | ✅ déjà en place (vague 1) | Pincement géré dans `input.js`/`camera.js` depuis la toute première vague, non modifié |
| Déplacement tactile | ✅ déjà en place (vague 1) | Glisser à un doigt, non modifié |
| Menu compact | ✅ nouveau | Un seul panneau ouvert à la fois, ancré au-dessus d'une barre d'outils à 5 icônes, jamais plein écran |
| Retour arrière contrôlé | ✅ nouveau | History API : ferme panneau/dialogue puis confirme avant de quitter (voir plus haut) |
| Plein écran | ✅ nouveau | Bouton dédié + tentative au premier tap |
| Écran de chargement | ✅ déjà en place (vague 1) | `#ecran-chargement`, non modifié |
| Absence de dépendance réseau | ✅ déjà en place + ✅ mis à jour | Service Worker + IndexedDB hors ligne depuis la vague 1 ; précache mis à jour avec les 2 nouveaux fichiers |
| Affichage adapté aux petits écrans | ✅ nouveau | `clamp()` partout, grilles `auto-fill`, débordement horizontal en scroll invisible pour la barre de ressources |

### Vérifications effectuées

Chargement complet des 16 fichiers JS dans un DOM simulé (jsdom) :
aucune exception. Les 5 panneaux s'ouvrent et se ferment sans
erreur. Bouton de production correctement relié à
`mettreEnFileProduction` (file d'attente de la nurserie incrémentée).
Armement d'une défense : bannière affichée avec le bon libellé,
bouton Annuler qui remet bien `modePlacementDefense` à `null`.
Panneau Missions : mission 2 correctement grisée/désactivée tant que
la mission 1 n'est pas terminée ; clic sur une mission débloquée →
boîte de dialogue de confirmation → partie mise en pause
(`temps.enPause`) → confirmation → `demarrerMission` appelée, mission
active et ressources de départ appliquées. Panneau Recherche :
bouton « Construire » affiché tant qu'aucun laboratoire du type
correspondant n'existe. Retour arrière : premier appui ferme le
panneau ouvert, second appui (écran nu) affiche la confirmation de
sortie avec le bon texte ; annulation referme proprement la boîte de
dialogue. Clic sur le bouton plein écran : aucune exception même
dans un environnement sans support Fullscreen API (échec silencieux
attendu). Aucun fichier de logique de jeu (`buildings.js`,
`units.js`, `defenses.js`, `research.js`, `missions.js`,
`combat.js`, `resources.js`, `storage.js`) n'a été modifié — seule
la ligne d'affichage de la surcouche de debug a changé dans
`renderer.js`.

### Ce qui reste ouvert

- Icônes/emoji utilisés comme substituts d'illustrations dédiées
  (aucun asset graphique fourni pour les unités/bâtiments/défenses
  à ce stade)
- Pas de retour haptique (vibration) sur les actions tactiles
- Le comportement exact du « retour arrière contrôlé » dépend en
  partie du navigateur/contexte d'exécution (onglet Chrome, PWA
  installée, TWA) : le mécanisme est standard (History API) mais
  n'a pu être vérifié que par simulation, pas sur un appareil
  Android réel — à confirmer lors d'un test physique
- Pas de sélection multiple de production en attente dans le
  panneau (un tap = une unité ajoutée à la file, comme au clavier)

---

## État du projet — VAGUE 14 (préparation d'un APK Android hors ligne) terminée

Le jeu était déjà jouable au tactile (vague 13) et fonctionnel hors
ligne dans un navigateur (vague 1, Service Worker + IndexedDB). Cette
vague ajoute une coquille native minimale (`android/`) qui embarque ce
même jeu — sans aucune modification de ses règles — dans une
application Android installable (`.apk`) qui ne dépend d'aucune
connexion Internet.

### Ce qui a été ajouté

- **`android/`** (nouveau dossier) — projet Android Studio complet :
  Gradle (`build.gradle`, `settings.gradle`, `gradle.properties`),
  manifeste, une seule classe native (`MainActivity.java`, ~150
  lignes), thèmes/écran de lancement, icônes générées depuis
  `assets/icons/icon-512.png`, configuration réseau. Voir
  **`android/README-APK.md`** pour le détail complet de chaque choix
  (intégration WebView, fichiers copiés, plein écran, bouton retour,
  icônes...) — ce fichier répond point par point au cahier des charges
  de cette vague.
- **`scripts/copier-assets-android.sh`** (nouveau) — copie
  `index.html`, `css/`, `js/`, `manifest.webmanifest` et
  `assets/icons/` dans `android/app/src/main/assets/www/` ; s'exécute
  aussi automatiquement à chaque build Gradle (tâche
  `copierAssetsWeb`). `sw.js` et `offline.html` ne sont volontairement
  pas copiés (inutiles : l'APK embarque déjà tout, voir
  `android/README-APK.md` §2).
- **`js/main.js`** — `enregistrerServiceWorker()` détecte désormais le
  contexte APK (`appassets.androidplatform.net`, le domaine local
  utilisé par `WebViewAssetLoader`) et n'essaie plus de s'y enregistrer
  (un enregistrement aurait échoué de toute façon, sans rien apporter).
  Reste actif et inchangé pour le déploiement navigateur.
- **`js/ui.js`** — la fonction appelée en confirmant "Quitter"
  (bouton retour, vague 13) utilise désormais
  `window.AndroidNatif.quitterApplication()` quand ce pont natif
  existe (fourni par `MainActivity.java` dans l'APK), pour une
  fermeture immédiate et fiable ; conserve intégralement l'ancien
  mécanisme (`history.go()`) comme repli dans le navigateur/PWA, où ce
  pont n'existe pas. Aucune autre ligne de `ui.js` n'a changé.

### Vérifications effectuées

Les 6 fichiers XML du projet Android (manifeste, thèmes, écran de
lancement, config réseau, couleurs, chaînes) validés comme XML
bien formé. Les 5 densités d'icônes de lancement (48/72/96/144/192 px)
générées et vérifiées présentes sur disque. `js/main.js` et `js/ui.js`
revérifiés syntaxiquement valides après modification
(`node --check`). Script `scripts/copier-assets-android.sh` exécuté :
copie bien exactement `index.html` + `css/` + `js/` +
`manifest.webmanifest` + `assets/icons/`, sans `sw.js` ni
`offline.html`. Absence de toute permission Internet dans le
manifeste confirmée par relecture. Aucun fichier de logique de jeu
(`buildings.js`, `units.js`, `defenses.js`, `research.js`,
`missions.js`, `combat.js`, `resources.js`, `storage.js`) n'a été
modifié — seuls `main.js` et `ui.js` ont reçu chacun un ajout ciblé et
rétrocompatible, documentés ci-dessus.

### Ce qui reste ouvert

Voir la section dédiée dans `android/README-APK.md` (build release
signé, icônes adaptatives, wrapper Gradle à générer à la première
ouverture du projet, pont retour arrière à confirmer sur un appareil
réel).

---

## État du projet — VAGUE 15 (audit final) terminée

Relecture complète des 15 vagues précédentes, sans ajout de
fonctionnalité : uniquement des corrections de bugs et de
documentation obsolète, plus une liste de tests manuels à effectuer
sur de vrais appareils (ce qu'aucun audit de code ne peut remplacer).

### Bugs corrigés

- **`js/ui.js`** — les boutons « Sauvegarder » et « Charger » du
  panneau Partie appelaient `sauvegarderPartie()` / `chargerPartie()`
  sans `.catch()`. En cas d'échec IndexedDB (navigation privée, quota
  dépassé, stockage bloqué...), c'était un **rejet de promesse non
  géré**, sans aucun retour à l'utilisateur ni dans la console. Corrigé
  avec les mêmes conventions `.then()/.catch()` déjà utilisées ailleurs
  dans le projet (`mettreAJourAutoSave`, `demarrerPartie`) ; le
  chargement avertit aussi désormais explicitement (`console.warn`)
  quand aucune sauvegarde manuelle n'existe, au lieu d'échouer en
  silence.
- **`.nojekyll`** ajouté à la racine — absent jusqu'ici, ce qui
  laissait GitHub Pages traiter le site avec Jekyll par défaut.
  Sans effet visible aujourd'hui (aucun fichier ne commence par `_`),
  mais c'est la pratique standard pour un site 100 % statique, et
  cela évite une surprise silencieuse si un tel dossier apparaît un
  jour.

### Documentation corrigée (aucun changement de comportement)

Une dizaine de commentaires devenus obsolètes au fil des vagues ont
été mis à jour pour refléter l'état réel du code (`js/config.js`,
`js/main.js`, `js/input.js`, `js/renderer.js`, `js/resources.js`,
`js/state.js`, `js/storage.js`, `css/mobile.css`, `css/style.css`) —
pour l'essentiel des mentions « sera ajouté/remplacé à une prochaine
vague » pour des fonctionnalités en réalité déjà livrées depuis
plusieurs vagues (menu tactile, sauvegarde manuelle, récolte,
persistance...). Les mentions encore exactes aujourd'hui
(`buildings.js` sur le placement manuel de bâtiments de production,
`units.js`/`defenses.js` sur l'auto-destruction et les structures non
endommageables) ont été laissées telles quelles.

### Vérifié sans problème trouvé

Chemins de fichiers (`index.html`, `sw.js`, casse exacte comprise,
vérifiée programmatiquement) ; liste de précache du Service Worker
(exacte dans les deux sens : rien de manquant, rien d'oublié) ;
logique `install`/`activate`/`fetch` du Service Worker ;
`manifest.webmanifest` (icônes aux bonnes tailles réelles, chemins
relatifs robustes au sous-dossier GitHub Pages) ; IndexedDB
(`storage.js`) ; absence totale de `localStorage`, de ressources
externes (police, CDN...) et d'appels réseau applicatifs (`fetch`,
`XMLHttpRequest`) en dehors du Service Worker lui-même ; cohérence de
`BASE_PATH` entre `config.js` et `sw.js` ; orientation (aucun
verrouillage, media queries portrait/paysage cohérentes) ; gestion du
delta-temps (déjà bornée contre un saut après mise en arrière-plan) ;
z-index de l'écran de chargement et des panneaux tactiles (pas de
recouvrement) ; toutes les références de ressources Android
(`@style`, `@mipmap`, `@xml`, `@color`, `R.style.*`) pointent vers des
fichiers réellement présents ; calcul du chemin Gradle
(`copierAssetsWeb`) vérifié pointer exactement vers la racine du
dépôt ; script `copier-assets-android.sh` réexécuté avec succès.

Un scénario de test de bout en bout (production, construction,
recherche, mission avec confirmation, sauvegarde/chargement, retour
arrière x2, plein écran, boucle de jeu) rejoué dans un DOM simulé
avant et après corrections : **zéro erreur JavaScript non
attrapée** dans les deux cas.

### Liste des tests à effectuer (sur de vrais appareils/navigateurs)

Un audit de code ne peut pas remplacer un test réel. À vérifier
manuellement avant toute publication :

1. **Chemins de fichiers / GitHub Pages** — déployer sur
   `https://<compte>.github.io/Fourmizred/` et vérifier qu'aucune
   ressource ne renvoie 404 (onglet Réseau des outils de
   développement), y compris après un rechargement forcé.
2. **Service Worker** — dans les outils de développement (onglet
   Application/Service Workers), vérifier qu'il s'enregistre sans
   erreur, que le cache `ant-commander-cache-v14` contient bien les
   25 fichiers attendus, et qu'une mise à jour du numéro de version
   remplace proprement l'ancien cache.
3. **Fonctionnement hors ligne** — charger le jeu une première fois
   en ligne, couper complètement le réseau (mode avion), recharger la
   page : le jeu doit démarrer normalement.
4. **Manifest / installation PWA** — vérifier que le navigateur
   propose « Ajouter à l'écran d'accueil »/« Installer », que l'icône
   et le nom affichés sont corrects, et que l'app installée s'ouvre
   en plein écran (`display: standalone`).
5. **IndexedDB** — sauvegarder, fermer complètement l'onglet/le
   navigateur, rouvrir : la sauvegarde automatique doit reprendre la
   partie exactement où elle en était. Tester aussi en navigation
   privée (IndexedDB peut y être restreint).
6. **LocalStorage** — confirmer qu'aucune donnée n'y est écrite
   (onglet Application des outils de développement) : le projet ne
   l'utilise pas à ce jour.
7. **Tactile Android** — sur un vrai téléphone : glisser à un doigt
   (caméra), pincer à deux doigts (zoom), taper un bâtiment/une unité
   ennemie/un nœud de ressource, ouvrir chacun des 5 panneaux du menu
   du bas et vérifier qu'aucun bouton n'est coupé ou trop petit pour
   le pouce.
8. **Orientation écran** — faire pivoter l'appareil en cours de
   partie (portrait ↔ paysage) : la mise en page doit s'adapter sans
   perte de la partie en cours, y compris avec le clavier virtuel
   ouvert (Android).
9. **Sauvegarde** — tester les 4 boutons du panneau Partie (Annuler
   les ordres, Sauvegarder, Charger, Nouvelle partie) individuellement
   et vérifier les messages dans la console en cas d'échec simulé
   (ex. quota IndexedDB dépassé).
10. **Chargement** — mesurer le temps entre l'ouverture de la page et
    la disparition de l'écran de chargement sur une connexion lente
    (limitation réseau des outils de développement) et en 3G simulée.
11. **Performances** — laisser une partie tourner longtemps avec
    beaucoup d'unités et de combats simultanés ; surveiller le taux
    d'images (onglet Performances) et la mémoire (fuite éventuelle).
12. **Erreurs JavaScript** — garder la console ouverte pendant une
    session de jeu complète (production, construction, recherche,
    mission, victoire, défaite) et vérifier qu'aucune erreur
    n'apparaît.
13. **Fichiers manquants** — vérifier le build APK Android
    (`android/README-APK.md`, §9) génère bien un `.apk` sans erreur
    de ressource manquante à la compilation.
14. **Ressources externes** — confirmer dans l'onglet Réseau qu'aucune
    requête ne part vers un domaine autre que celui du jeu lui-même,
    ni en jeu ni au chargement.
15. **Compatibilité WebView** — installer l'APK sur au moins deux
    versions différentes d'Android (une ancienne, une récente) et
    vérifier : plein écran, bouton retour (fermeture de panneau puis
    confirmation de sortie), sauvegarde IndexedDB, rotation d'écran
    sans perte de partie.

---

## État du projet — VAGUE 16 (build APK automatique + téléchargement) terminée

La vague 14 avait préparé le projet Android (`android/`) mais sa
compilation nécessitait Android Studio en local — pas pratique pour
simplement récupérer un fichier `.apk` à installer. Cette vague ajoute
un pipeline **GitHub Actions** qui compile l'APK sur les serveurs de
GitHub à chaque mise à jour du jeu et le publie avec un lien de
téléchargement stable, sans aucune installation nécessaire.

### Ce qui a été ajouté

- **`.github/workflows/build-apk.yml`** (nouveau) — se déclenche à
  chaque `push` sur `main` touchant `android/`, `js/`, `css/`,
  `index.html`, `manifest.webmanifest` ou `assets/icons/`, ou
  manuellement depuis l'onglet Actions. Installe JDK 17 + SDK Android,
  copie le jeu web dans les assets Android (même script que le §2 du
  guide Android, `scripts/copier-assets-android.sh` — le workflow ne
  fait rien que vous ne puissiez faire vous-même en local), compile
  l'APK debug (`gradle assembleDebug`), puis le publie en **Release
  GitHub** nommée avec la version lue directement dans
  `js/config.js` (`VERSION_JEU`).
- **`android/README-APK.md`** — nouvelle section 11 documentant ce
  pipeline ; section 9 réorganisée pour mettre en avant cette méthode
  automatique (aucune installation) au-dessus de la méthode manuelle
  via Android Studio (toujours documentée, utile pour modifier le
  code natif) ; correction d'une phrase de la section 10 qui faisait
  référence à un « workflow GitHub Actions du README principal »
  inexistant à l'époque — désormais exact.

### Où télécharger l'APK

Onglet **Releases** du dépôt
(`https://github.com/Stephane1972/Fourmizred/releases`) → dernière
Release → `app-debug.apk` dans la section « Assets ». Toujours un
build *debug* (voir `android/README-APK.md` §10 pour le build release
signé, non encore mis en place).

### Vérifications effectuées

Fichier YAML du workflow validé avec un analyseur YAML (structure,
9 étapes, déclencheurs `push`/`workflow_dispatch` corrects). Extraction
de `VERSION_JEU` depuis `js/config.js` testée en ligne de commande
(résultat exact : `0.2.0`). `scripts/copier-assets-android.sh`
réexécuté avec succès depuis la racine du dépôt (25 fichiers copiés,
syntaxe JS revérifiée après copie). Aucun fichier de logique de jeu
ni du projet Android existant n'a été modifié — seule la
documentation (`android/README-APK.md`) a reçu des ajouts/corrections
ciblés.

Le premier déclenchement réel a échoué à la compilation Gradle
(logs Actions non consultables à distance, redirigés vers un
stockage bloqué par le pare-feu réseau de l'environnement de
développement) : diagnostic par republication temporaire du journal
de compilation comme fichier du dépôt. Cause identifiée : conflit
classique de dépendances Kotlin transitives entre `androidx.appcompat`
et `androidx.webkit` (`Duplicate class kotlin.collections.jdk8...`) —
corrigé par exclusion des artefacts obsolètes `kotlin-stdlib-jdk7`/
`-jdk8` dans `android/app/build.gradle` (déjà inclus dans
`kotlin-stdlib` 1.8+, aucune perte fonctionnelle). Une étape
d'installation redondante du SDK Android a aussi été retirée
(le SDK est déjà présent sur les runners GitHub `ubuntu-latest`).
Étape de diagnostic temporaire retirée une fois la cause confirmée.
**Le pipeline compile et publie désormais un APK avec succès** —
première Release fonctionnelle : `apk-v0.2.0-4`.

### Correctif d'équilibrage (hors vague, signalé par test de jeu réel)

Après ce premier APK jouable, un test réel a révélé que la partie
était quasiment injouable : les 6 menaces sauvages (araignées/
scarabées) générées en partie libre fonçaient sur la fourmilière dès
la première seconde de jeu, faute de cible joueur à détecter — la
fourmilière (500 PV) pouvait être détruite en 10 à 15 secondes,
avant même la production de la première unité (8 secondes minimum).
Corrigé dans `js/combat.js`
(`deplacerMenacesSauvages`) : une menace sans cible à proximité reste
désormais immobile au lieu de charger le nid par défaut ; elle
continue de chasser normalement dès qu'une unité du joueur
s'approche (comportement de poursuite inchangé). Testé : 6 menaces
immobiles pendant 15 s sans unité à proximité (fourmilière toujours à
500/500 PV), poursuite confirmée dès provocation. Nouvel APK publié
automatiquement avec le correctif : `apk-v0.2.0-5`.

### Ce qui reste ouvert

- Build release signé (Play Store) toujours non mis en place, comme
  déjà noté dans `android/README-APK.md` §10.
- L'équilibrage n'a été vérifié que pour le mode escarmouche libre ;
  les missions incluant des ennemis sauvages (`ennemis.sauvages`
  dans `js/missions.js`) utilisent la même fonction corrigée mais
  n'ont pas toutes été rejouées manuellement une à une.

---

## Prochaine étape

En attente de validation avant de démarrer la **VAGUE 17**.

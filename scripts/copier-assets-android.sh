#!/bin/sh
# ===========================================================
# Copie le jeu web (index.html, css/, js/, manifest.webmanifest,
# assets/icons/) dans android/app/src/main/assets/www/, pour que le
# projet Android embarque la dernière version du jeu.
#
# Fait automatiquement par Gradle à chaque build (voir la tâche
# "copierAssetsWeb" dans android/app/build.gradle) — ce script n'est
# utile que pour vérifier le contenu à la main, ou en dehors
# d'Android Studio/Gradle.
#
# Usage : depuis la racine du dépôt, ./scripts/copier-assets-android.sh
# ===========================================================
set -e

RACINE="$(cd "$(dirname "$0")/.." && pwd)"
CIBLE="$RACINE/android/app/src/main/assets/www"

mkdir -p "$CIBLE"

# Ménage : on repart d'un dossier vide pour ne jamais laisser un
# ancien fichier supprimé côté web traîner côté Android.
rm -rf "${CIBLE:?}"/*

cp "$RACINE/index.html" "$CIBLE/"
cp "$RACINE/manifest.webmanifest" "$CIBLE/"
cp -R "$RACINE/css" "$CIBLE/css"
cp -R "$RACINE/js" "$CIBLE/js"
mkdir -p "$CIBLE/assets/icons"
cp -R "$RACINE/assets/icons/." "$CIBLE/assets/icons/"

# sw.js et offline.html sont volontairement EXCLUS : ce sont des
# fichiers propres au déploiement navigateur/PWA (GitHub Pages). Dans
# l'APK, le jeu est déjà entièrement embarqué — voir
# android/README-APK.md, section "Fichiers à copier".

echo "Copié dans $CIBLE"

package com.stephane1972.antcommander;

import android.annotation.SuppressLint;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;

/**
 * MainActivity — enveloppe native minimale autour du jeu web existant.
 *
 * Aucune règle de jeu ni aucun fichier js/*.js de la logique du jeu
 * n'est modifié par cette classe : elle se contente d'héberger une
 * WebView, de lui donner les réglages nécessaires (JavaScript,
 * stockage local, plein écran) et de relier le bouton retour Android
 * au mécanisme déjà écrit en JavaScript dans js/ui.js (vague 13).
 *
 * Voir android/README-APK.md pour le détail de chaque choix.
 */
public class MainActivity extends AppCompatActivity {

    /**
     * Domaine LOCAL virtuel utilisé par WebViewAssetLoader pour servir
     * les fichiers d'assets/www/ (index.html, css/, js/...). Il n'existe
     * sur aucun serveur réel et n'est jamais résolu par une vraie requête
     * réseau : WebViewAssetLoader l'intercepte entièrement à l'intérieur
     * du processus de l'application. Voir README-APK.md pour le détail.
     */
    private static final String HOTE_LOCAL = "appassets.androidplatform.net";
    private static final String URL_DEPART = "https://" + HOTE_LOCAL + "/assets/www/index.html";

    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Thème "écran de lancement" (fond + icône) tant que la page n'a
        // pas fini de charger — voir res/values/themes.xml et
        // onPageFinished() plus bas, qui bascule vers AppTheme.
        setTheme(R.style.LaunchTheme);
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        activerPleinEcran();
        configurerWebView();
        webView.loadUrl(URL_DEPART);
    }

    // -----------------------------------------------------------
    // RÉGLAGES WEBVIEW
    // -----------------------------------------------------------
    private void configurerWebView() {
        WebSettings reglages = webView.getSettings();

        // JavaScript : indispensable, tout le jeu (js/*.js) en dépend.
        reglages.setJavaScriptEnabled(true);

        // Stockage local : IndexedDB (sauvegardes, voir js/storage.js) et
        // localStorage. Servir le jeu via WebViewAssetLoader (domaine
        // https:// virtuel) plutôt qu'en file:// direct est précisément
        // ce qui rend ce stockage fiable sur toutes les versions
        // d'Android — voir README-APK.md.
        reglages.setDomStorageEnabled(true);
        reglages.setDatabaseEnabled(true);

        // Aucun accès au système de fichiers de l'appareil : le jeu n'en
        // a pas besoin, et cela réduit la surface d'attaque de la WebView.
        reglages.setAllowFileAccess(false);
        reglages.setAllowContentAccess(false);

        // Zoom : désactive les contrôles de zoom NATIFS de la WebView.
        // Le pincement à deux doigts reste pleinement fonctionnel — il
        // est géré par le jeu lui-même (js/input.js + js/camera.js,
        // vague 1) et ne doit pas entrer en conflit avec un zoom navigateur.
        reglages.setSupportZoom(false);
        reglages.setBuiltInZoomControls(false);
        reglages.setDisplayZoomControls(false);

        // Pas d'effet de "rebond lumineux" Android en bord d'écran, qui
        // entrerait en conflit visuel avec le glissement de la caméra.
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

        // --- Chargement hors ligne (WebViewAssetLoader) ---
        WebViewAssetLoader chargeurAssets = new WebViewAssetLoader.Builder()
                .setDomain(HOTE_LOCAL)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, @NonNull WebResourceRequest requete) {
                return chargeurAssets.shouldInterceptRequest(requete.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, @NonNull WebResourceRequest requete) {
                // Le jeu ne contient aucun lien externe : par précaution,
                // toute tentative de naviguer hors du domaine local est
                // bloquée ici (déjà interdite de toute façon par
                // network_security_config.xml et l'absence de permission
                // INTERNET — sécurité en profondeur).
                String hote = requete.getUrl().getHost();
                return hote == null || !hote.equals(HOTE_LOCAL);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Bascule vers le thème normal une fois le jeu chargé ;
                // l'écran de chargement HTML (#ecran-chargement, main.js)
                // prend le relais visuellement avec son propre fondu.
                setTheme(R.style.AppTheme);
            }
        });

        // WebChromeClient par défaut : suffisant pour que les
        // console.log/warn/error du jeu remontent dans Logcat, utile en
        // développement. Aucune fonctionnalité en ligne n'est activée.
        webView.setWebChromeClient(new WebChromeClient());

        // Pont JavaScript -> natif, utilisé uniquement pour que le bouton
        // "Quitter" de la boîte de dialogue de js/ui.js (vague 13) puisse
        // fermer proprement l'application (voir PontAndroid ci-dessous et
        // la modification correspondante dans js/ui.js).
        webView.addJavascriptInterface(new PontAndroid(), "AndroidNatif");
    }

    /**
     * Pont exposé au JavaScript du jeu sous window.AndroidNatif. Volontairement
     * réduit à la seule action nécessaire : fermer l'application quand
     * l'utilisateur confirme "Quitter" dans la boîte de dialogue de
     * js/ui.js. Aucune donnée de jeu ne transite par ce pont.
     */
    private class PontAndroid {
        @JavascriptInterface
        public void quitterApplication() {
            runOnUiThread(MainActivity.this::finish);
        }
    }

    // -----------------------------------------------------------
    // PLEIN ÉCRAN — masque barre d'état et barre de navigation système,
    // réapparaissables par un glissement depuis le bord (comportement
    // standard Android, moins déroutant qu'un plein écran totalement
    // verrouillé).
    // -----------------------------------------------------------
    private void activerPleinEcran() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController controleur = getWindow().getInsetsController();
            if (controleur != null) {
                controleur.hide(WindowInsets.Type.systemBars());
                controleur.setSystemBarsBehavior(
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            //noinspection deprecation
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // Ré-applique le plein écran après un retour au premier plan
        // (changement d'app, notification déroulée, etc.) — Android
        // annule sinon le mode immersif à chaque perte de focus.
        if (hasFocus) activerPleinEcran();
    }

    // -----------------------------------------------------------
    // ROTATION — voir android:configChanges dans AndroidManifest.xml :
    // l'Activity n'est jamais recréée, donc la WebView (et la partie en
    // cours) non plus. Rien à faire ici de plus que l'appel obligatoire
    // à super ; la mise en page s'adapte côté CSS (css/mobile.css,
    // css/menu.css).
    // -----------------------------------------------------------
    @Override
    public void onConfigurationChanged(@NonNull Configuration nouvelleConfiguration) {
        super.onConfigurationChanged(nouvelleConfiguration);
    }

    // -----------------------------------------------------------
    // RETOUR ARRIÈRE — délégué en priorité au mécanisme déjà écrit en
    // JavaScript par js/ui.js (vague 13, History API : ferme d'abord un
    // panneau ou une boîte de dialogue ouverte, puis demande confirmation
    // avant de quitter). webView.goBack() ne recharge JAMAIS la page ici
    // : js/ui.js n'utilise que des entrées d'historique du MÊME document
    // (history.pushState), donc "reculer" dedans ne fait que déclencher
    // l'événement 'popstate' côté JS, sans navigation réelle.
    //
    // La fermeture RÉELLE de l'application se fait via PontAndroid
    // .quitterApplication(), appelé par js/ui.js quand l'utilisateur
    // confirme "Quitter" — pas ici. Le repli ci-dessous (onBackPressed)
    // ne sert qu'à transmettre chaque pression du bouton retour à la
    // page, et à fermer l'application dans le cas limite où la WebView
    // n'aurait effectivement plus rien à "reculer" (ce qui ne devrait
    // normalement jamais arriver tant que js/ui.js tourne normalement).
    // -----------------------------------------------------------
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}

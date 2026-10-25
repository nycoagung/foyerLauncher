package io.github.nycoagung.foyerlauncher;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.KeyEvent;
import android.view.ViewGroup;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/** Full-screen WebView running FoyerLauncher's own UI from the APK's assets. */
public final class MainActivity extends Activity {
    // A fixed https origin keeps localStorage stable; every request is answered locally.
    static final String HOST = "appassets.androidplatform.net";
    private static final Map<String, String> TYPES = new HashMap<>();
    static {
        TYPES.put("html", "text/html"); TYPES.put("js", "application/javascript"); TYPES.put("css", "text/css");
        TYPES.put("json", "application/json"); TYPES.put("svg", "image/svg+xml"); TYPES.put("png", "image/png");
        TYPES.put("jpg", "image/jpeg"); TYPES.put("jpeg", "image/jpeg"); TYPES.put("woff2", "font/woff2");
        TYPES.put("ttf", "font/ttf"); TYPES.put("txt", "text/plain");
    }

    private WebView web;
    private Bridge bridge;
    private boolean resumed;
    private static long lastRendererCrash = -60000;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setBackgroundDrawable(new ColorDrawable(Color.BLACK));
        // DEBUG=1 builds can be inspected from Chrome's chrome://inspect.
        WebView.setWebContentsDebuggingEnabled((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0);
        bridge = new Bridge(this);
        try {
            web = new WebView(this);
        } catch (RuntimeException e) {
            // WebView can be missing while Play updates it: hand over to the TV's own home rather than crash.
            leaveForSystemHome();
            return;
        }
        web.setBackgroundColor(Color.BLACK);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setTextZoom(100);
        web.setWebViewClient(new Client());
        web.addJavascriptInterface(bridge, "FoyerAndroid");
        web.setFocusable(true);
        setContentView(web);
        web.loadUrl("https://" + HOST + "/app/index.html");
        web.requestFocus();
    }

    /** Back goes to FoyerLauncher as Escape, its Back key. A home screen never finishes itself. */
    @Override public boolean dispatchKeyEvent(KeyEvent e) {
        if (e.getKeyCode() == KeyEvent.KEYCODE_BACK) {
            if (web != null) web.dispatchKeyEvent(new KeyEvent(e.getDownTime(), e.getEventTime(), e.getAction(),
                KeyEvent.KEYCODE_ESCAPE, e.getRepeatCount(), e.getMetaState()));
            return true;
        }
        return super.dispatchKeyEvent(e);
    }

    /** Home while FoyerLauncher is already showing returns to its main screen. */
    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (resumed && web != null) web.evaluateJavascript("window.FoyerQA && FoyerQA.scene && FoyerQA.scene('home')", null);
    }

    @Override protected void onResume() {
        super.onResume();
        resumed = true;
        HomeKeyService.foyerShown();
        if (web != null) { web.onResume(); web.requestFocus(); }
    }

    @Override protected void onPause() {
        resumed = false;
        if (web != null) web.onPause();
        super.onPause();
    }

    @Override protected void onDestroy() {
        if (bridge != null) bridge.close();
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }

    private void leaveForSystemHome() {
        HomeKeyService.allowSystemHome();
        try {
            startActivity(HomeKeyService.systemHomeIntent(this).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        } catch (RuntimeException ignored) {
            // Nothing else to open.
        }
        finish();
    }

    /** Replies from the bridge's background work, on the UI thread. Dropped if the page is gone. */
    void evaluate(String script) {
        if (web != null) web.evaluateJavascript(script, null);
    }

    private WebResourceResponse respond(String type, int status, byte[] body) {
        return new WebResourceResponse(type, type.startsWith("image/") || type.startsWith("font/") ? null : "utf-8",
            status, status == 200 ? "OK" : "Not Found", Collections.<String, String>emptyMap(), new ByteArrayInputStream(body));
    }

    private WebResourceResponse asset(String path) {
        if (path.contains("..")) return respond("text/plain", 404, new byte[0]);
        String ext = path.substring(path.lastIndexOf('.') + 1).toLowerCase();
        String type = TYPES.containsKey(ext) ? TYPES.get(ext) : "application/octet-stream";
        try {
            return new WebResourceResponse(type, type.startsWith("text/") || type.equals("application/javascript") ? "utf-8" : null, getAssets().open(path));
        } catch (IOException e) {
            return respond("text/plain", 404, new byte[0]);
        }
    }

    private final class Client extends WebViewClient {
        @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            String path = uri.getPath();
            // FoyerLauncher is fully local. Nothing reaches the network.
            if (!HOST.equals(uri.getHost()) || path == null) return respond("text/plain", 404, new byte[0]);
            if (path.startsWith("/appicon/") && path.endsWith(".png")) {
                byte[] png = bridge.icon(path.substring(9, path.length() - 4));
                return png == null ? respond("image/png", 404, new byte[0]) : respond("image/png", 200, png);
            }
            if (path.startsWith("/ambient/")) {
                java.io.File f = bridge.ambientFile(path.substring(9));
                try {
                    return f == null ? respond("image/jpeg", 404, new byte[0]) : new WebResourceResponse("image/jpeg", null, new java.io.FileInputStream(f));
                } catch (IOException e) {
                    return respond("image/jpeg", 404, new byte[0]);
                }
            }
            if (path.startsWith("/app/")) return asset(path.substring(1));
            return respond("text/plain", 404, new byte[0]);
        }

        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return true;
        }

        /** If the page's renderer dies, start again rather than leave a blank Home; twice in a minute, give up. */
        @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            if (view == web) {
                ((ViewGroup) view.getParent()).removeView(view);
                view.destroy();
                web = null;
                long now = SystemClock.elapsedRealtime();
                boolean looping = now - lastRendererCrash < 60000;
                lastRendererCrash = now;
                if (looping) leaveForSystemHome(); else recreate();
            }
            return true;
        }
    }
}

package io.github.nycoagung.foyerlauncher;

import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.media.tv.TvContract;
import android.media.tv.TvInputInfo;
import android.media.tv.TvInputManager;
import android.os.SystemClock;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * window.FoyerAndroid for app/device-android.js. Every method answers
 * {"ok":true,"value":...} or {"ok":false,"error":"..."}; weather answers later, see weather().
 */
final class Bridge {
    private static final int ICON_PX = 144;
    // Weather and Google ambient photos (AmbientPhotos) are the only network uses. The location comes from
    // the TV's internet address once a day; Open-Meteo gets coordinates rounded to about a kilometre. The
    // page itself stays offline.
    private static final String LOCATE = "https://ipwho.is/?fields=success,city,latitude,longitude";
    // When the address lookup is unreachable (some DNS filters block them), the TV's time zone city.
    private static final String GEOCODE = "https://geocoding-api.open-meteo.com/v1/search?count=20&language=en&format=json&name=";
    private static final String FORECAST = "https://api.open-meteo.com/v1/forecast?latitude=%.2f&longitude=%.2f"
        + "&current=temperature_2m,weather_code,is_day&timezone=auto";
    private static final long LOCATION_MS = 24 * 3600000L, WEATHER_MS = 10 * 60000L;
    private final MainActivity activity;
    private final PackageManager pm;
    private final Map<String, byte[]> icons = new ConcurrentHashMap<>();
    private final ExecutorService network = Executors.newSingleThreadExecutor();
    // Preparing photos takes seconds each, so it never queues ahead of the weather.
    private final ExecutorService photos = Executors.newSingleThreadExecutor(work -> new Thread(() -> {
        android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_BACKGROUND);
        work.run();
    }, "ambient-photos"));
    private final AmbientPhotos ambient;
    private volatile String lastWeather;
    private volatile long weatherAt;

    Bridge(MainActivity activity) {
        this.activity = activity;
        this.pm = activity.getPackageManager();
        this.ambient = new AmbientPhotos(activity);
    }

    void close() { network.shutdownNow(); photos.shutdownNow(); }

    /** Answers later through window.FoyerAndroidReply(id, json), so the page never waits on the network. */
    @JavascriptInterface public void weather(final int id) {
        later(network, id, this::weatherReply);
    }

    /** Google ambient photos prepared on this TV, at once: the page needs them before it reads its saved wallpaper. */
    @JavascriptInterface public String ambientList() {
        return ok(ambient.list());
    }

    /**
     * A random ambient photo to follow `current`, answered later as {photo, ready}. The one after it is
     * then prepared on the same queue, so the next change is immediate.
     */
    @JavascriptInterface public void ambient(final int id, final String current) {
        later(photos, id, () -> {
            try {
                JSONObject photo = ambient.next(current);
                photos.execute(() -> {
                    // Throwable too: an Error here would take the whole process, and the Home button service, down.
                    try { ambient.prepareAhead(photo.optString("id"), current); } catch (Throwable ignored) { /* Prepared on demand next time. */ }
                });
                return ok(new JSONObject().put("photo", photo).put("ready", ambient.list()));
            } catch (Exception | OutOfMemoryError e) {
                return error("Google's photos aren't available right now.");
            }
        });
    }

    /** A prepared ambient photo file for the page, or null. */
    java.io.File ambientFile(String name) { return ambient.file(name); }

    private void later(ExecutorService queue, int id, java.util.concurrent.Callable<String> work) {
        try {
            queue.execute(() -> {
                String json;
                // Throwable: nothing in background work may crash the process the Home button service shares.
                try { json = work.call(); } catch (Throwable e) { json = error("Unexpected error."); }
                String reply = json;
                activity.runOnUiThread(() -> activity.evaluate("window.FoyerAndroidReply && FoyerAndroidReply(" + id + "," + JSONObject.quote(reply) + ")"));
            });
        } catch (RejectedExecutionException ignored) {
            // The activity is closing; the page goes with it.
        }
    }

    private String weatherReply() {
        if (lastWeather != null && SystemClock.elapsedRealtime() - weatherAt < WEATHER_MS) return lastWeather;
        try {
            SharedPreferences prefs = activity.getSharedPreferences("weather", Context.MODE_PRIVATE);
            long now = System.currentTimeMillis();
            if (!prefs.contains("lat") || now - prefs.getLong("located", 0) > LOCATION_MS) {
                JSONObject here = locate();
                if (here == null) return error("Couldn't find where this TV is.");
                prefs.edit().putFloat("lat", (float) here.getDouble("latitude")).putFloat("lon", (float) here.getDouble("longitude"))
                    .putString("place", here.optString("place")).putString("source", here.optString("source")).putLong("located", now).apply();
            }
            JSONObject current = getJson(String.format(Locale.US, FORECAST, prefs.getFloat("lat", 0), prefs.getFloat("lon", 0))).getJSONObject("current");
            lastWeather = ok(new JSONObject().put("temp", current.getDouble("temperature_2m")).put("code", current.getInt("weather_code"))
                .put("day", current.optInt("is_day", 1) == 1).put("place", prefs.getString("place", "")).put("source", prefs.getString("source", "")));
            weatherAt = SystemClock.elapsedRealtime();
            return lastWeather;
        } catch (IOException | JSONException | RuntimeException e) {
            return error("Weather isn't available right now.");
        }
    }

    /** {latitude, longitude, place, source}: the internet address first, then the time zone's city. */
    private static JSONObject locate() throws JSONException {
        try {
            JSONObject here = getJson(LOCATE);
            if (here.optBoolean("success")) return here.put("place", here.optString("city")).put("source", "address");
        } catch (IOException | JSONException ignored) {
            // Fall through to the time zone.
        }
        String zone = TimeZone.getDefault().getID(), city = zone.substring(zone.lastIndexOf('/') + 1).replace('_', ' ');
        if (!zone.contains("/") || zone.startsWith("Etc/")) return null;
        try {
            JSONArray results = getJson(GEOCODE + URLEncoder.encode(city, "UTF-8")).optJSONArray("results");
            for (int i = 0; results != null && i < results.length(); i++) {
                JSONObject r = results.getJSONObject(i);
                // Sydney, Nova Scotia is not in Australia/Sydney.
                if (zone.equals(r.optString("timezone"))) return new JSONObject().put("latitude", r.getDouble("latitude"))
                    .put("longitude", r.getDouble("longitude")).put("place", r.optString("name", city)).put("source", "timezone");
            }
        } catch (IOException ignored) {
            // No location at all.
        }
        return null;
    }

    private static JSONObject getJson(String address) throws IOException, JSONException {
        HttpURLConnection c = (HttpURLConnection) new URL(address).openConnection();
        c.setConnectTimeout(8000);
        c.setReadTimeout(8000);
        c.setRequestProperty("User-Agent", "FoyerLauncher for Android TV");
        try (InputStream in = c.getInputStream()) {
            if (c.getResponseCode() != 200) throw new IOException("HTTP " + c.getResponseCode());
            ByteArrayOutputStream body = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            for (int n; (n = in.read(buffer)) > 0 && body.size() < 65536; ) body.write(buffer, 0, n);
            return new JSONObject(body.toString("UTF-8"));
        } finally {
            c.disconnect();
        }
    }

    /**
     * What this TV has, at once, before the page draws Home: {platform, tvApp, installed}. The platform
     * names the TV's own home screen, tvApp is the app that shows TV channels ("" if none), and installed
     * keeps the ones of `packages` (a JSON array) that can be opened.
     */
    @JavascriptInterface public String device(String packages) {
        try {
            ComponentName home = HomeKeyService.systemHome(activity);
            ResolveInfo tv = pm.resolveActivity(new Intent(Intent.ACTION_VIEW).setType(TvContract.Channels.CONTENT_ITEM_TYPE),
                PackageManager.MATCH_DEFAULT_ONLY);
            String tvApp = tv == null || tv.activityInfo == null || "android".equals(tv.activityInfo.packageName) ? "" : tv.activityInfo.packageName;
            JSONArray wanted = new JSONArray(packages), installed = new JSONArray();
            for (int i = 0; i < wanted.length(); i++) {
                String pkg = wanted.optString(i);
                if (!pkg.isEmpty() && launchIntent(pkg) != null) installed.put(pkg);
            }
            return ok(new JSONObject()
                .put("platform", home != null && HomeKeyService.GOOGLE_TV_HOME.equals(home.getPackageName()) ? "Google TV" : "Android TV")
                .put("tvApp", !tvApp.isEmpty() && launchIntent(tvApp) != null ? tvApp : "").put("installed", installed));
        } catch (JSONException | RuntimeException e) {
            return error("Could not read this TV's apps.");
        }
    }

    private Intent launchIntent(String pkg) {
        Intent intent = pm.getLeanbackLaunchIntentForPackage(pkg);
        return intent != null ? intent : pm.getLaunchIntentForPackage(pkg);
    }

    /** TV apps first, then phone-style apps that aren't part of the system. */
    @JavascriptInterface public String apps() {
        try {
            JSONArray out = new JSONArray();
            List<String> seen = new ArrayList<>();
            for (String category : new String[] { Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER }) {
                Intent query = new Intent(Intent.ACTION_MAIN).addCategory(category);
                for (ResolveInfo r : pm.queryIntentActivities(query, 0)) {
                    String pkg = r.activityInfo.packageName;
                    if (pkg.equals(activity.getPackageName()) || seen.contains(pkg)) continue;
                    if (category.equals(Intent.CATEGORY_LAUNCHER) && (r.activityInfo.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0) continue;
                    seen.add(pkg);
                    out.put(new JSONObject().put("appId", pkg).put("name", r.loadLabel(pm).toString())
                        .put("icon", "/appicon/" + pkg + ".png"));
                }
            }
            return ok(out);
        } catch (JSONException | RuntimeException e) {
            return error("Could not read the installed apps.");
        }
    }

    @JavascriptInterface public String launch(String pkg) {
        Intent intent = launchIntent(pkg);
        if (intent == null) return error("This app isn't installed.");
        return start(intent.addFlags(Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED));
    }

    /** Physical inputs the TV shows (HDMI, composite and so on), by name. The tuner is the TV app. */
    @JavascriptInterface public String inputs() {
        TvInputManager manager = (TvInputManager) activity.getSystemService(Context.TV_INPUT_SERVICE);
        if (manager == null) return error("This TV has no inputs.");
        try {
            List<JSONObject> list = new ArrayList<>();
            for (TvInputInfo info : manager.getTvInputList()) {
                if (!isPhysical(info) || info.getParentId() != null || info.isHidden(activity)) continue;
                CharSequence name = info.loadCustomLabel(activity);
                if (name == null || name.length() == 0) name = info.loadLabel(activity);
                list.add(new JSONObject().put("id", info.getId()).put("name", name.toString()));
            }
            Collections.sort(list, (a, b) -> a.optString("name").compareToIgnoreCase(b.optString("name")));
            return ok(new JSONArray(list));
        } catch (JSONException | RuntimeException e) {
            return error("Could not read the TV's inputs.");
        }
    }

    @JavascriptInterface public String openInput(String id) {
        TvInputManager manager = (TvInputManager) activity.getSystemService(Context.TV_INPUT_SERVICE);
        if (manager == null || manager.getTvInputInfo(id) == null) return error("That input isn't available.");
        return start(new Intent(Intent.ACTION_VIEW, TvContract.buildChannelUriForPassthroughInput(id)));
    }

    @JavascriptInterface public String systemHome() {
        HomeKeyService.allowSystemHome();
        return start(HomeKeyService.systemHomeIntent(activity));
    }

    @JavascriptInterface public String settings() {
        return start(new Intent(Settings.ACTION_SETTINGS));
    }

    /** The launcher icon as a PNG, cached. Null when the app is gone. */
    byte[] icon(String pkg) {
        byte[] cached = icons.get(pkg);
        if (cached != null) return cached;
        try {
            Intent intent = pm.getLeanbackLaunchIntentForPackage(pkg);
            if (intent == null) intent = pm.getLaunchIntentForPackage(pkg);
            Drawable d = intent != null ? pm.getActivityIcon(intent) : pm.getApplicationIcon(pkg);
            Bitmap bitmap = Bitmap.createBitmap(ICON_PX, ICON_PX, Bitmap.Config.ARGB_8888);
            d.setBounds(0, 0, ICON_PX, ICON_PX);
            d.draw(new Canvas(bitmap));
            ByteArrayOutputStream png = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, png);
            bitmap.recycle();
            icons.put(pkg, png.toByteArray());
            return png.toByteArray();
        } catch (PackageManager.NameNotFoundException | RuntimeException e) {
            return null;
        }
    }

    private static boolean isPhysical(TvInputInfo info) {
        switch (info.getType()) {
            case TvInputInfo.TYPE_HDMI: case TvInputInfo.TYPE_COMPOSITE: case TvInputInfo.TYPE_COMPONENT:
            case TvInputInfo.TYPE_SVIDEO: case TvInputInfo.TYPE_SCART: case TvInputInfo.TYPE_VGA:
            case TvInputInfo.TYPE_DVI: case TvInputInfo.TYPE_DISPLAY_PORT:
                return true;
            default:
                return false;
        }
    }

    private String start(Intent intent) {
        try {
            activity.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            return ok(JSONObject.NULL);
        } catch (ActivityNotFoundException | SecurityException e) {
            return error("The TV could not open this screen.");
        }
    }

    private static String ok(Object value) {
        try {
            return new JSONObject().put("ok", true).put("value", value).toString();
        } catch (JSONException e) {
            return error("Unexpected reply.");
        }
    }

    private static String error(String message) {
        return "{\"ok\":false,\"error\":" + JSONObject.quote(message) + "}";
    }
}

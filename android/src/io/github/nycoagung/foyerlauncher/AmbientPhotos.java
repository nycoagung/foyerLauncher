package io.github.nycoagung.foyerlauncher;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Shader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Google's ambient-mode "Featured photos", streamed at random from the Chromecast backdrop feed as
 * FoyerLauncher wallpapers. Nothing is collected: the TV holds only the photo on screen, the one
 * before it and the next one, prepared ahead so a change is immediate. Each photo's glass
 * materials are rendered here, off the page, with the recipe of scripts/build-materials.mjs.
 * The feed is unofficial and may change. Photos remain their photographers'.
 */
final class AmbientPhotos {
    private static final String FEED = "https://clients3.google.com/cast/chromecast/home";
    private static final String PHOTO_HOST = "ccp-lh.googleusercontent.com";
    private static final int W = 1920, H = 1080, P = 96, TRIES = 4;
    private static final long FEED_MS = 3600000L;
    private static final Pattern FILE = Pattern.compile("g-[0-9a-f]{16}(\\.jpg|-thumb\\.jpg|-panel\\.jpg|-field-(blur|frost|clear)\\.jpg|-study-soft\\.jpg)");
    private static final String[] SUFFIXES = { ".jpg", "-thumb.jpg", "-panel.jpg", "-field-blur.jpg", "-field-frost.jpg", "-field-clear.jpg", "-study-soft.jpg" };
    // One lock for the cache directory, also across a recreated activity's second instance.
    private static final Object LOCK = new Object();
    private final File dir;
    private final Random random = new Random();
    private JSONArray feed;
    private long feedAt;

    AmbientPhotos(Context context) {
        deleteTree(new File(context.getFilesDir(), "ambient")); // The earlier kept library.
        dir = new File(context.getCacheDir(), "ambient");
        dir.mkdirs();
    }

    /** A prepared file the page may load, or null. */
    File file(String name) {
        File f = new File(dir, name);
        return FILE.matcher(name).matches() && f.isFile() ? f : null;
    }

    /** Photos prepared on the TV right now (at most three): [{id, name, tone, tr, br}]. Never waits for a render. */
    JSONArray list() {
        JSONArray ready = new JSONArray(), photos = index().optJSONArray("photos");
        for (int i = 0; photos != null && i < photos.length(); i++) {
            JSONObject p = photos.optJSONObject(i);
            // The system may clear the cache; a photo counts only while its files are there.
            if (p != null && new File(dir, p.optString("id") + "-study-soft.jpg").isFile()) ready.put(p);
        }
        return ready;
    }

    /** A random photo to show after `current`: the newest one prepared ahead, or a new one now. */
    JSONObject next(String current) throws IOException, JSONException {
        synchronized (LOCK) {
            JSONArray ready = list();
            JSONObject pick = null;
            for (int i = ready.length() - 1; i >= 0 && pick == null; i--) if (!ready.getJSONObject(i).optString("id").equals(current)) pick = ready.getJSONObject(i);
            if (pick == null) pick = prepareRandom(ready, current);
            keep(current, pick.optString("id"), null);
            return pick;
        }
    }

    /**
     * Prepares the photo after `showing`, so the next change needs no wait. `previous` stays until then:
     * the page may still be loading `showing`, or fall back to `previous` if that fails.
     */
    void prepareAhead(String showing, String previous) throws IOException, JSONException {
        synchronized (LOCK) {
            keep(showing, previous, null);
            prepareRandom(list(), showing);
        }
    }

    private JSONObject prepareRandom(JSONArray ready, String current) throws IOException, JSONException {
        if (feed == null || feed.length() == 0 || System.currentTimeMillis() - feedAt > FEED_MS) { feed = feed(); feedAt = System.currentTimeMillis(); }
        IOException last = new IOException("No photos in the feed");
        for (int attempt = 0; attempt < TRIES; attempt++) {
            JSONArray item = feed.optJSONArray(random.nextInt(feed.length()));
            String url = item == null ? null : item.optString(0, null), author = item == null || item.isNull(1) ? null : item.optString(1, null);
            if (url == null || author == null || !url.startsWith("https://" + PHOTO_HOST + "/")) continue;
            String id = "g-" + sha1(url.replaceAll("=[^/]*$", "")).substring(0, 16);
            if (id.equals(current) || contains(ready, id)) continue;
            try {
                JSONObject photo = prepare(download(url), id).put("name", author);
                JSONArray photos = list();
                photos.put(photo);
                save(photos);
                return photo;
            } catch (IOException e) {
                delete(id);
                last = e;
            }
        }
        throw last;
    }

    /** Keeps only these photos' files. */
    private void keep(String a, String b, String c) throws JSONException {  // null matches nothing
        JSONArray photos = list(), kept = new JSONArray();
        for (int i = 0; i < photos.length(); i++) {
            String id = photos.getJSONObject(i).optString("id");
            if (id.equals(a) || id.equals(b) || id.equals(c)) kept.put(photos.get(i)); else delete(id);
        }
        save(kept);
    }

    private void save(JSONArray photos) throws JSONException {
        try {
            write(new File(dir, "index.json"), new JSONObject().put("photos", photos).toString().getBytes(StandardCharsets.UTF_8));
        } catch (IOException ignored) {
            // The files are there; the page finds them again next time.
        }
    }

    private JSONObject index() {
        try {
            File f = new File(dir, "index.json");
            if (f.isFile()) return new JSONObject(new String(readAll(new java.io.FileInputStream(f), 1 << 20), StandardCharsets.UTF_8));
        } catch (IOException | JSONException ignored) {
            // A damaged index starts again.
        }
        return new JSONObject();
    }

    private static void deleteTree(File f) {
        File[] kids = f.listFiles();
        if (kids != null) for (File k : kids) deleteTree(k);
        f.delete();
    }

    /** The feed page carries its list as JSON.parse('...') with JavaScript string escapes. */
    private static JSONArray feed() throws IOException, JSONException {
        String page = new String(get(FEED, 2 << 20), StandardCharsets.UTF_8);
        Matcher m = Pattern.compile("JSON\\.parse\\('((?:[^'\\\\]++|\\\\.)*+)'\\)").matcher(page);
        if (!m.find()) throw new IOException("Unexpected feed");
        return new JSONArray(unescape(m.group(1))).getJSONArray(0);
    }

    private static String unescape(String s) {
        StringBuilder out = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c != '\\' || i + 1 >= s.length()) { out.append(c); continue; }
            char n = s.charAt(++i);
            if (n == 'x' && i + 2 < s.length()) { out.append((char) Integer.parseInt(s.substring(i + 1, i + 3), 16)); i += 2; }
            else if (n == 'u' && i + 4 < s.length()) { out.append((char) Integer.parseInt(s.substring(i + 1, i + 5), 16)); i += 4; }
            else if (n == 'n') out.append('\n');
            else if (n == 't') out.append('\t');
            else out.append(n);
        }
        return out.toString();
    }

    /** Decoded no larger than about twice the stage, whatever size the feed sends. */
    private static Bitmap download(String url) throws IOException {
        byte[] bytes = get(url, 8 << 20);
        BitmapFactory.Options o = new BitmapFactory.Options();
        o.inJustDecodeBounds = true;
        BitmapFactory.decodeByteArray(bytes, 0, bytes.length, o);
        if (o.outWidth <= 0 || o.outHeight <= 0) throw new IOException("Not an image");
        o.inJustDecodeBounds = false;
        o.inSampleSize = 1;
        while (o.outWidth / (o.inSampleSize * 2) >= W && o.outHeight / (o.inSampleSize * 2) >= H) o.inSampleSize *= 2;
        Bitmap b = BitmapFactory.decodeByteArray(bytes, 0, bytes.length, o);
        if (b == null) throw new IOException("Not an image");
        return b;
    }

    // ---------- FoyerLauncher's material recipe ----------

    private JSONObject prepare(Bitmap source, String id) throws IOException {
        Bitmap photo = cover(source, W, H);
        if (photo != source) source.recycle();
        save(photo, id + ".jpg", 90);
        Bitmap thumb = cover(photo, 512, 341); save(thumb, id + "-thumb.jpg", 85); thumb.recycle();
        Bitmap padded = mirrorPad(photo);
        Bitmap blur = field(padded, 28, .92f, true); save(blur, id + "-field-blur.jpg", 82); blur.recycle();
        Bitmap frost = field(padded, 42, .92f, true); save(frost, id + "-field-frost.jpg", 82);
        Bitmap panel = Bitmap.createScaledBitmap(frost, 320, 180, true); save(panel, id + "-panel.jpg", 85); panel.recycle(); frost.recycle();
        Bitmap clear = field(padded, 2, 1.06f, false); save(clear, id + "-field-clear.jpg", 86); clear.recycle();
        padded.recycle();
        Bitmap soft = soft(photo); save(soft, id + "-study-soft.jpg", 94); soft.recycle();
        JSONObject meta = ink(photo, id);
        photo.recycle();
        return meta;
    }

    /** Text polarity where the clock and the two control corners sit, as the catalogue records it. */
    private static JSONObject ink(Bitmap photo, String id) {
        Bitmap s = Bitmap.createScaledBitmap(photo, W / 4, H / 4, true);
        int[] px = new int[s.getWidth() * s.getHeight()];
        s.getPixels(px, 0, s.getWidth(), 0, 0, s.getWidth(), s.getHeight());
        double[] clock = luma(px, s.getWidth(), 25, 10, 175, 65), tr = luma(px, s.getWidth(), 300, 10, 460, 65), br = luma(px, s.getWidth(), 350, 190, 460, 250);
        s.recycle();
        try {
            return new JSONObject().put("id", id).put("tone", clock[0] > .22 ? "light" : "dark").put("tr", polarity(tr)).put("br", polarity(br));
        } catch (JSONException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String polarity(double[] m) { return m[0] > .78 && m[1] < .12 ? "dark" : m[0] > .38 ? "mist" : "light"; }

    /** Mean and spread of sRGB luma in a rectangle, 0 to 1. */
    private static double[] luma(int[] px, int w, int x0, int y0, int x1, int y1) {
        double sum = 0, sq = 0; int n = 0;
        for (int y = y0; y < y1; y++) for (int x = x0; x < x1; x++) {
            int c = px[y * w + x];
            double l = (.2126 * ((c >> 16) & 255) + .7152 * ((c >> 8) & 255) + .0722 * (c & 255)) / 255;
            sum += l; sq += l * l; n++;
        }
        double mean = sum / n;
        return new double[] { mean, Math.sqrt(Math.max(0, sq / n - mean * mean)) };
    }

    /** Scale to cover w x h and crop the centre, as the builder's centred crop does. */
    private static Bitmap cover(Bitmap b, int w, int h) {
        if (b.getWidth() == w && b.getHeight() == h) return b;
        float scale = Math.max((float) w / b.getWidth(), (float) h / b.getHeight());
        Bitmap out = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Matrix m = new Matrix();
        m.setScale(scale, scale);
        m.postTranslate((w - b.getWidth() * scale) / 2, (h - b.getHeight() * scale) / 2);
        new Canvas(out).drawBitmap(b, m, new Paint(Paint.FILTER_BITMAP_FLAG));
        return out;
    }

    /** Mirrored edges, so blur near the border samples the photo rather than black. */
    private static Bitmap mirrorPad(Bitmap photo) {
        Bitmap out = Bitmap.createBitmap(W + 2 * P, H + 2 * P, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(out);
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
            Matrix m = new Matrix();
            m.setScale(x == 0 ? 1 : -1, y == 0 ? 1 : -1);
            m.postTranslate(P + (x == 1 ? 2 * W : 0), P + (y == 1 ? 2 * H : 0));
            c.drawBitmap(photo, m, null);
        }
        return out;
    }

    /**
     * Blur, saturation and soft highlight clipping, cropped back to the stage. Wide blurs run at a
     * quarter of the size; a Gaussian that wide hides the scaling.
     */
    private static Bitmap field(Bitmap padded, float sigma, float saturation, boolean clip) {
        int k = sigma >= 8 ? 4 : 1, w = padded.getWidth() / k, h = padded.getHeight() / k;
        Bitmap small = k == 1 ? padded.copy(Bitmap.Config.ARGB_8888, true) : Bitmap.createScaledBitmap(padded, w, h, true);
        int[] px = new int[w * h];
        small.getPixels(px, 0, w, 0, 0, w, h);
        gaussian(px, w, h, sigma / k);
        tone(px, saturation, clip);
        small.setPixels(px, 0, w, 0, 0, w, h);
        Bitmap stage = Bitmap.createBitmap(small, P / k, P / k, W / k, H / k);
        Bitmap out = k == 1 ? stage.copy(Bitmap.Config.ARGB_8888, false) : Bitmap.createScaledBitmap(stage, W, H, true);
        if (stage != small) stage.recycle();
        small.recycle();
        return out;
    }

    /** The Dock Soft material: lower scrim, 14px blur, compressed local variation and a bounded tint. */
    private static Bitmap soft(Bitmap photo) {
        Bitmap base = photo.copy(Bitmap.Config.ARGB_8888, true);
        Paint scrim = new Paint();
        scrim.setShader(new LinearGradient(0, 560, 0, H, new int[] { 0x00040a0c, 0x6b040a0c, 0x85040a0c }, new float[] { 0, .7f, 1 }, Shader.TileMode.CLAMP));
        new Canvas(base).drawRect(0, 560, W, H, scrim);
        Bitmap padded = mirrorPad(base);
        base.recycle();
        Bitmap blurred = field(padded, 14, 1.12f, false);
        padded.recycle();
        int k = 4, w = W / k, h = H / k;
        Bitmap small = Bitmap.createScaledBitmap(blurred, w, h, true);
        blurred.recycle();
        int[] px = new int[w * h];
        small.getPixels(px, 0, w, 0, 0, w, h);
        double[] mean = new double[3]; int n = 0;
        for (int y = 676 / k; y < 908 / k; y++) for (int x = 96 / k; x < 1824 / k; x++) {
            int c = px[y * w + x]; mean[0] += (c >> 16) & 255; mean[1] += (c >> 8) & 255; mean[2] += c & 255; n++;
        }
        for (int i = 0; i < 3; i++) mean[i] /= n;
        for (int i = 0; i < px.length; i++) {
            int c = px[i];
            px[i] = rgb(((c >> 16) & 255) * .65 + mean[0] * .35, ((c >> 8) & 255) * .65 + mean[1] * .35, (c & 255) * .65 + mean[2] * .35);
        }
        double[] lumas = new double[(908 / k - 720 / k) * (1808 / k - 112 / k)]; n = 0;
        for (int y = 720 / k; y < 908 / k; y++) for (int x = 112 / k; x < 1808 / k; x++) {
            int c = px[y * w + x]; lumas[n++] = .2126 * ((c >> 16) & 255) + .7152 * ((c >> 8) & 255) + .0722 * (c & 255);
        }
        Arrays.sort(lumas, 0, n);
        double high = lumas[(int) (n * .95)], tint = Math.max(.28, Math.min(.6, (high - 94) / (high - 8.87)));
        for (int i = 0; i < px.length; i++) {
            int c = px[i];
            px[i] = rgb(((c >> 16) & 255) * (1 - tint) + 4 * tint, ((c >> 8) & 255) * (1 - tint) + 10 * tint, (c & 255) * (1 - tint) + 12 * tint);
        }
        small.setPixels(px, 0, w, 0, 0, w, h);
        Bitmap out = Bitmap.createScaledBitmap(small, W, H, true);
        small.recycle();
        return out;
    }

    private static final double[] LINEAR = new double[256];
    static {
        for (int v = 0; v < 256; v++) { double c = v / 255.0; LINEAR[v] = c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); }
    }
    private static double encode(double v) { return 255 * (v <= .0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - .055); }

    /** CSS saturate() (the same coefficients as feColorMatrix), then the builder's highlight clip. */
    private static void tone(int[] px, float s, boolean clip) {
        double a = .213 + .787 * s, b = .715 - .715 * s, c = .072 - .072 * s, d = .213 - .213 * s, e = .715 + .285 * s, f = .072 + .928 * s;
        for (int i = 0; i < px.length; i++) {
            int p = px[i], r0 = (p >> 16) & 255, g0 = (p >> 8) & 255, b0 = p & 255;
            int r = clamp(a * r0 + b * g0 + c * b0), g = clamp(d * r0 + e * g0 + c * b0), bl = clamp(d * r0 + b * g0 + f * b0);
            if (clip) {
                double lr = LINEAR[r], lg = LINEAR[g], lb = LINEAR[bl], l = .2126 * lr + .7152 * lg + .0722 * lb;
                if (l > .82) { double ratio = (.82 + .4 * (l - .82)) / l; r = clamp(encode(lr * ratio)); g = clamp(encode(lg * ratio)); bl = clamp(encode(lb * ratio)); }
            }
            px[i] = 0xff000000 | r << 16 | g << 8 | bl;
        }
    }

    /** Three box blurs approximating a Gaussian of this sigma. */
    private static void gaussian(int[] px, int w, int h, float sigma) {
        double ideal = Math.sqrt(12 * sigma * sigma / 3 + 1);
        int lower = (int) Math.floor(ideal); if (lower % 2 == 0) lower--;
        int m = (int) Math.round((12 * sigma * sigma - 3 * lower * lower - 12 * lower - 9) / (-4.0 * lower - 4));
        int[] tmp = new int[px.length];
        for (int pass = 0; pass < 3; pass++) {
            int r = ((pass < m ? lower : lower + 2) - 1) / 2;
            if (r < 1) continue;
            box(px, tmp, w, h, r, true);
            box(tmp, px, w, h, r, false);
        }
    }

    private static void box(int[] src, int[] dst, int w, int h, int r, boolean horizontal) {
        int lines = horizontal ? h : w, len = horizontal ? w : h, step = horizontal ? 1 : w;
        double norm = 1.0 / (2 * r + 1);
        for (int line = 0; line < lines; line++) {
            int start = horizontal ? line * w : line;
            long sr = 0, sg = 0, sb = 0;
            for (int i = -r; i <= r; i++) {
                int p = src[start + Math.max(0, Math.min(len - 1, i)) * step];
                sr += (p >> 16) & 255; sg += (p >> 8) & 255; sb += p & 255;
            }
            for (int i = 0; i < len; i++) {
                dst[start + i * step] = 0xff000000 | (int) (sr * norm) << 16 | (int) (sg * norm) << 8 | (int) (sb * norm);
                int out = src[start + Math.max(0, i - r) * step], in = src[start + Math.min(len - 1, i + r + 1) * step];
                sr += ((in >> 16) & 255) - ((out >> 16) & 255); sg += ((in >> 8) & 255) - ((out >> 8) & 255); sb += (in & 255) - (out & 255);
            }
        }
    }

    private static int clamp(double v) { return v < 0 ? 0 : v > 255 ? 255 : (int) Math.round(v); }
    private static int rgb(double r, double g, double b) { return 0xff000000 | clamp(r) << 16 | clamp(g) << 8 | clamp(b); }

    // ---------- Files and network ----------

    private void save(Bitmap b, String name, int quality) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        b.compress(Bitmap.CompressFormat.JPEG, quality, out);
        write(new File(dir, name), out.toByteArray());
    }

    /** Write beside, then rename, so the page never reads half a file. */
    private static void write(File f, byte[] bytes) throws IOException {
        File tmp = new File(f.getPath() + ".tmp");
        try (FileOutputStream out = new FileOutputStream(tmp)) { out.write(bytes); }
        if (!tmp.renameTo(f)) throw new IOException("Could not save " + f.getName());
    }

    private void delete(String id) {
        for (String suffix : SUFFIXES) new File(dir, id + suffix).delete();
    }

    private static boolean contains(JSONArray photos, String id) {
        for (int i = 0; i < photos.length(); i++) if (id.equals(photos.optJSONObject(i).optString("id"))) return true;
        return false;
    }

    private static byte[] get(String address, int limit) throws IOException {
        HttpURLConnection c = (HttpURLConnection) new URL(address).openConnection();
        c.setConnectTimeout(10000);
        c.setReadTimeout(15000);
        c.setRequestProperty("User-Agent", "FoyerLauncher for Android TV");
        try (InputStream in = c.getInputStream()) {
            if (c.getResponseCode() != 200) throw new IOException("HTTP " + c.getResponseCode());
            return readAll(in, limit);
        } finally {
            c.disconnect();
        }
    }

    private static byte[] readAll(InputStream in, int limit) throws IOException {
        try (InputStream source = in) {
            ByteArrayOutputStream body = new ByteArrayOutputStream();
            byte[] buffer = new byte[16384];
            for (int n; (n = source.read(buffer)) > 0; ) {
                if (body.size() + n > limit) throw new IOException("Too large");
                body.write(buffer, 0, n);
            }
            return body.toByteArray();
        }
    }

    private static String sha1(String s) {
        try {
            StringBuilder hex = new StringBuilder();
            for (byte b : MessageDigest.getInstance("SHA-1").digest(s.getBytes(StandardCharsets.UTF_8))) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}

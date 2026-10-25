package io.github.nycoagung.foyerlauncher;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.KeyEvent;
import android.view.accessibility.AccessibilityEvent;
import java.util.ArrayDeque;

/**
 * Sends the Home button to FoyerLauncher without disabling anything. The TV's own home screen (Google
 * TV, Android TV or the manufacturer's) keeps the Home role; if this service stops, Home simply opens it again.
 *
 * Short press: FoyerLauncher. Hold: the TV's own home screen. When that home screen appears by itself
 * (power-on, an app going "home"), FoyerLauncher is brought forward, at most 3 times in 30 seconds.
 */
public final class HomeKeyService extends AccessibilityService {
    static final String GOOGLE_TV_HOME = "com.google.android.apps.tv.launcherx";
    private static final long HOLD_MS = 600, REDIRECT_WINDOW_MS = 30000;
    private static final int REDIRECT_LIMIT = 3;

    // Set when the person chose the TV's own home; cleared when FoyerLauncher shows or the screen turns off.
    private static volatile boolean systemHomeAllowed;
    private final ArrayDeque<Long> redirects = new ArrayDeque<>();
    // A timer, not key repeats: this filter sees keys before Android synthesises repeats.
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable hold = () -> { held = true; openSystemHome(); };
    private boolean down, held;

    private final BroadcastReceiver screenOff = new BroadcastReceiver() {
        @Override public void onReceive(Context context, Intent intent) {
            systemHomeAllowed = false;
            redirects.clear();
        }
    };

    static void allowSystemHome() { systemHomeAllowed = true; }
    static void foyerShown() { systemHomeAllowed = false; }

    /** The TV's default home activity, or null when there is none or Android would ask which one to use. */
    private static ActivityInfo systemHomeInfo(Context context) {
        ResolveInfo r = context.getPackageManager().resolveActivity(
            new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), PackageManager.MATCH_DEFAULT_ONLY);
        ActivityInfo a = r == null ? null : r.activityInfo;
        return a == null || "android".equals(a.packageName) || context.getPackageName().equals(a.packageName) ? null : a;
    }

    /** The TV's default home screen, as declared (possibly an alias), for starting it. */
    static ComponentName systemHome(Context context) {
        ActivityInfo a = systemHomeInfo(context);
        return a == null ? null : new ComponentName(a.packageName, a.name);
    }

    static Intent systemHomeIntent(Context context) {
        Intent intent = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME);
        ComponentName home = systemHome(context);
        return home == null ? intent : intent.setComponent(home);
    }

    // The default home can change when apps are installed, updated or removed.
    private final BroadcastReceiver packages = new BroadcastReceiver() {
        @Override public void onReceive(Context context, Intent intent) { listenToHome(); }
    };

    @Override protected void onServiceConnected() {
        registerReceiver(screenOff, new IntentFilter(Intent.ACTION_SCREEN_OFF));
        IntentFilter changes = new IntentFilter(Intent.ACTION_PACKAGE_ADDED);
        changes.addAction(Intent.ACTION_PACKAGE_REMOVED);
        changes.addAction(Intent.ACTION_PACKAGE_CHANGED);
        changes.addDataScheme("package");
        registerReceiver(packages, changes);
        listenToHome();
    }

    /** Window changes from the home screen only (or from nothing else, when there is no home). No screen content is read. */
    private void listenToHome() {
        ComponentName home = systemHome(this);
        AccessibilityServiceInfo info = getServiceInfo();
        if (info == null) return;
        info.packageNames = new String[] { home != null ? home.getPackageName() : getPackageName() };
        setServiceInfo(info);
    }

    @Override public void onDestroy() {
        try { unregisterReceiver(screenOff); } catch (IllegalArgumentException ignored) { }
        try { unregisterReceiver(packages); } catch (IllegalArgumentException ignored) { }
        super.onDestroy();
    }

    @Override protected boolean onKeyEvent(KeyEvent e) {
        if (e.getKeyCode() != KeyEvent.KEYCODE_HOME) return false;
        if (e.getAction() == KeyEvent.ACTION_DOWN && !down) {
            down = true; held = false;
            handler.postDelayed(hold, HOLD_MS);
        } else if (e.getAction() == KeyEvent.ACTION_UP) {
            down = false;
            handler.removeCallbacks(hold);
            if (!held && !e.isCanceled()) openFoyer();
        }
        return true;
    }

    @Override public void onAccessibilityEvent(AccessibilityEvent e) {
        if (e.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;
        CharSequence pkg = e.getPackageName(), cls = e.getClassName();
        ActivityInfo home = pkg == null || cls == null ? null : systemHomeInfo(this);
        // A home declared as an activity-alias shows its target's class name in window events.
        String shown = home == null ? null : home.targetActivity != null ? home.targetActivity : home.name;
        if (home == null || !home.packageName.contentEquals(pkg) || !shown.contentEquals(cls)) return;
        if (!systemHomeAllowed && mayRedirect()) openFoyer();
    }

    @Override public void onInterrupt() { }

    /** Never fight the TV's own home screen: give up after a few redirects until the screen turns off. */
    private boolean mayRedirect() {
        long now = SystemClock.elapsedRealtime();
        while (!redirects.isEmpty() && now - redirects.peekFirst() > REDIRECT_WINDOW_MS) redirects.pollFirst();
        if (redirects.size() >= REDIRECT_LIMIT) return false;
        redirects.addLast(now);
        return true;
    }

    private void openFoyer() {
        try {
            startActivity(new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        } catch (RuntimeException e) {
            openSystemHome();
        }
    }

    private void openSystemHome() {
        systemHomeAllowed = true;
        try {
            startActivity(systemHomeIntent(this).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        } catch (RuntimeException ignored) {
            // Nothing else to open; the system keeps whatever is showing.
        }
    }
}

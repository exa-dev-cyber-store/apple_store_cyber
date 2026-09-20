import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported, Messaging } from "firebase/messaging";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Initializes and returns the Firebase App on client side
 */
export function getFirebaseClientApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    return null;
  }

  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return app;
}

/**
 * Initializes and returns the Firebase Messaging instance if supported
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;

  const supported = await isSupported();
  if (!supported) {
    console.info("FCM is not supported in this browser environment.");
    return null;
  }

  const clientApp = getFirebaseClientApp();
  if (!clientApp) return null;

  if (!messaging) {
    messaging = getMessaging(clientApp);
  }
  return messaging;
}

/**
 * Request notification permission and retrieve the FCM registration token (Pure FCM)
 */
export async function requestFcmToken(): Promise<string | null> {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("[FCM] Notification API is not supported in this browser window.");
      return null;
    }

    console.log("[FCM] Checking/requesting browser notification permission... Current status:", Notification.permission);
    const permission = await Notification.requestPermission();
    console.log("[FCM] Browser permission result:", permission);

    if (permission !== "granted") {
      console.warn("[FCM] Notification permission was not granted by user:", permission);
      return null;
    }

    const msg = await getFirebaseMessaging();
    if (!msg) {
      console.warn("[FCM] Firebase Messaging instance could not be initialized.");
      return null;
    }

    // Ensure service worker is registered and ready
    let registration: ServiceWorkerRegistration | undefined;
    if ("serviceWorker" in navigator) {
      try {
        console.log("[FCM] Registering service worker (/firebase-messaging-sw.js)...");
        registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
          scope: "/",
        });
        if (registration.installing || registration.waiting) {
          await new Promise<void>((resolve) => {
            const sw = registration!.installing || registration!.waiting;
            if (!sw) return resolve();
            sw.addEventListener("statechange", () => {
              if (sw.state === "activated") resolve();
            });
            setTimeout(resolve, 1000);
          });
        }
        await navigator.serviceWorker.ready;
        console.log("[FCM] Service worker is ready and active.");
      } catch (swErr: any) {
        console.warn("[FCM] Service worker registration notice:", swErr?.message || swErr);
      }
    }

    const vapidKey =
      process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
      "BBWGVz5Jy9GUzjB2mBRCeh7KEfENduyBag0ToMHcAakFTfXTTlZlDQ_xxtrtK_8aK1y3LRBYVncxq-lPUlV3DWc";

    console.log("[FCM] Requesting FCM token from Google Push Service with VAPID key...");
    let token: string | null = null;
    try {
      token = await getToken(msg, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });
      console.log("[FCM] Successfully received FCM token:", token ? `${token.slice(0, 20)}...` : null);
    } catch (err: any) {
      console.warn("[FCM] getToken with serviceWorkerRegistration failed:", err?.message || err);
      // Fallback: try default registration without explicit serviceWorkerRegistration option
      try {
        token = await getToken(msg, { vapidKey });
        console.log("[FCM] getToken fallback received token:", token ? `${token.slice(0, 20)}...` : null);
      } catch (fallbackErr: any) {
        console.error("❌ [FCM] Both getToken attempts failed. Root cause:", fallbackErr?.message || fallbackErr);
      }
    }

    if (token) {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("fcm_device_token", token);
          console.log("💾 [FCM] Token saved to localStorage ('fcm_device_token')");
        } catch {}
      }
      await syncTokenToBackend(token);
      return token;
    }

    console.warn(
      "⚠️ [FCM] Could not retrieve FCM token. If using Brave, enable 'Use Google services for push messaging' in brave://settings/privacy. Real-time updates remain active via SSE."
    );
    return null;
  } catch (err: any) {
    console.error("[FCM] requestFcmToken unexpected error:", err?.message || err);
    return null;
  }
}

/**
 * Sends and upserts the FCM device token to the backend API
 */
export async function syncTokenToBackend(token: string): Promise<boolean> {
  if (!token || typeof window === "undefined") return false;

  try {
    const res = await fetch("/api/notifications/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "web",
        fcmToken: token,
      }),
    });

    if (res.status === 401) {
      console.info("ℹ️ [FCM] Device registration skipped: User is not authenticated.");
      return false;
    }

    if (!res.ok) {
      console.warn("[FCM] Device registration status:", res.status);
      return false;
    }

    console.log("✅ [FCM] Device token synced & upserted with backend successfully!");
    return true;
  } catch (postErr) {
    console.warn("⚠️ [FCM] Failed to sync FCM token with backend:", postErr);
    return false;
  }
}

/**
 * Register a listener for foreground push notifications
 */
export async function onForegroundMessage(callback: (payload: any) => void): Promise<(() => void) | null> {
  const msg = await getFirebaseMessaging();
  if (!msg) return null;

  return onMessage(msg, (payload) => {
    callback(payload);
  });
}

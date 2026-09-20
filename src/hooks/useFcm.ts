"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { requestFcmToken, onForegroundMessage, syncTokenToBackend } from "../lib/firebase";

export interface FcmNotificationPayload {
  title?: string;
  body?: string;
  icon?: string;
  data?: Record<string, any>;
}

export function useFcm(
  onMessageReceived?: (payload: FcmNotificationPayload) => void,
  enabled: boolean = true
) {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onMessageRef = useRef(onMessageReceived);
  onMessageRef.current = onMessageReceived;

  useEffect(() => {
    // Only proceed if enabled (user is authenticated)
    if (!enabled || typeof window === "undefined" || !("Notification" in window)) {
      if (typeof window !== "undefined" && !("Notification" in window)) {
        setPermission("unsupported");
      }
      setFcmToken(null);
      return;
    }

    setPermission(Notification.permission);

    // 1. Immediately push & upsert cached FCM token to backend on every page load/refresh
    const cachedToken = typeof window !== "undefined" ? localStorage.getItem("fcm_device_token") : null;
    console.log("🔔 [FCM Hook] Status checked. Permission:", Notification.permission, "| Cached Token:", cachedToken ? "found" : "none");

    if (cachedToken) {
      setFcmToken(cachedToken);
      syncTokenToBackend(cachedToken);
    }

    // 2. If notification permission is granted, retrieve / refresh token and upsert to backend
    if (Notification.permission === "granted") {
      console.log("🔔 [FCM Hook] Permission is granted. Requesting fresh token from Firebase...");
      requestFcmToken().then((token) => {
        if (token) {
          setFcmToken(token);
          try {
            localStorage.setItem("fcm_device_token", token);
          } catch {}
          syncTokenToBackend(token);
        } else {
          console.warn("🔔 [FCM Hook] requestFcmToken returned null.");
        }
      });
    } else {
      console.log(
        `🔔 [FCM Hook] Notification permission is currently '${Notification.permission}'. Open the bell icon and click 'Enable' to activate push notifications.`
      );
    }

    // Subscribe to foreground FCM messages
    let unsubscribe: (() => void) | null = null;
    onForegroundMessage((payload) => {
      const formatted: FcmNotificationPayload = {
        title: payload.notification?.title || payload.data?.title,
        body: payload.notification?.body || payload.data?.body,
        icon: payload.notification?.icon || "/icon-192.png",
        data: payload.data,
      };

      if (onMessageRef.current) {
        onMessageRef.current(formatted);
      }

      // If browser permission is granted, display desktop notification
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(formatted.title || "Cyber Store", {
            body: formatted.body || "",
            icon: formatted.icon || "/icon-192.png",
          });
        } catch {
          // Fallback if Notification constructor fails in service worker context
        }
      }
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [enabled]);

  const enableNotifications = useCallback(async () => {
    if (!enabled) {
      console.warn("[FCM] Notification request ignored: User is not authenticated.");
      return null;
    }
    try {
      setIsLoading(true);
      setError(null);

      const token = await requestFcmToken();
      if (token) {
        setFcmToken(token);
        setPermission(Notification.permission);
        return token;
      } else {
        if (typeof window !== "undefined" && "Notification" in window) {
          setPermission(Notification.permission);
        }
        return null;
      }
    } catch (err: any) {
      setError(err?.message || "Failed to enable notifications");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  return {
    fcmToken,
    permission,
    isLoading,
    error,
    enableNotifications,
  };
}

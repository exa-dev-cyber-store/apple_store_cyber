"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  HiOutlineBell,
  HiOutlineTruck,
  HiOutlineTicket,
  HiOutlineSparkles,
  HiCheck,
  HiOutlineClipboardCopy,
  HiOutlineInformationCircle,
} from "react-icons/hi";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useFcm } from "../hooks/useFcm";

export interface Notification {
  _id: string;
  title: string;
  id?: string;
  body: string;
  type: "delivery" | "voucher" | "promo" | "announcement" | "general";
  isRead: boolean;
  createdAt: string;
  data?: {
    orderId?: string;
    status_delivery?: string;
    voucherCode?: string;
    discount?: number;
    link?: string;
  };
}

const normalizeNotification = (item: any, fallbackIndex?: number): Notification => {
  const resolvedId =
    item?._id ||
    item?.id ||
    `notif-${Date.now()}-${fallbackIndex ?? Math.random().toString(36).substring(2, 9)}`;

  return {
    _id: String(resolvedId),
    id: String(resolvedId),
    title: item?.title || "",
    body: item?.body || "",
    type: item?.type || "promo",
    isRead: Boolean(item?.isRead),
    createdAt: item?.createdAt || new Date().toISOString(),
    data: item?.data,
  };
};

export default function NotificationDropdown() {
  const { status, user } = useAuth();
  const isAuthenticated = status === "authenticated";

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef<number>(0);

  // Hook for Firebase Cloud Messaging (FCM) - strictly active ONLY when authenticated
  const { permission, isLoading: isFcmLoading, enableNotifications } = useFcm((fcmPayload) => {
    if (fcmPayload?.title) {
      const newNotif = normalizeNotification({
        _id: fcmPayload.data?._id || fcmPayload.data?.id,
        title: fcmPayload.title,
        body: fcmPayload.body || "",
        type: (fcmPayload.data?.type as any) || "promo",
        isRead: false,
        createdAt: new Date().toISOString(),
        data: fcmPayload.data,
      });
      setNotifications((prev) => {
        if (prev.some((n) => n._id === newNotif._id || (n.id && n.id === newNotif.id))) {
          return prev;
        }
        return [newNotif, ...prev];
      });
      setUnreadCount((c) => c + 1);
    }
  }, isAuthenticated);

  const fetchNotifications = async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      lastFetchRef.current = Date.now();
      const res = await axios.get("/api/notifications");
      const list = res.data?.data?.notifications || res.data?.notifications || [];
      const normalizedList = Array.isArray(list)
        ? list.map((item: any, idx: number) => normalizeNotification(item, idx))
        : [];

      // Deduplicate by _id to prevent duplicate key warning
      const uniqueList: Notification[] = [];
      const seenIds = new Set<string>();
      for (const item of normalizedList) {
        if (!seenIds.has(item._id)) {
          seenIds.add(item._id);
          uniqueList.push(item);
        }
      }

      const unread = res.data?.data?.unreadCount ?? uniqueList.filter((n) => !n.isRead).length;
      setNotifications(uniqueList);
      setUnreadCount(unread);
    } catch {
      // Ignore if unauthenticated or network failure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    // Listen for real-time Server-Sent Events via authenticated Next.js BFF proxy
    const sseUrl = "/api/notifications/stream";

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let retryAttempt = 0;
    let isUnmounted = false;

    const cleanupSSE = () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      if (eventSource) {
        eventSource.onopen = null;
        eventSource.onmessage = null;
        eventSource.onerror = null;
        eventSource.close();
        eventSource = null;
      }
    };

    const reconnect = (delayMs?: number) => {
      cleanupSSE();
      if (isUnmounted || !isAuthenticated) return;

      // Exponential backoff with jitter (2s, 3s, 4.5s... capped at 30s)
      // Ease off to 60s if persistently disconnected
      let delay = delayMs;
      if (delay === undefined) {
        if (retryAttempt >= 10) {
          delay = 60000;
        } else {
          delay = Math.min(30000, 2000 * Math.pow(1.5, retryAttempt)) + Math.random() * 1000;
        }
      }
      retryAttempt++;

      reconnectTimeout = setTimeout(() => {
        if (!isUnmounted && isAuthenticated) {
          connect();
        }
      }, delay);
    };

    const connect = () => {
      cleanupSSE();
      if (isUnmounted || !isAuthenticated) return;

      try {
        eventSource = new EventSource(sseUrl);

        eventSource.onopen = () => {
          retryAttempt = 0; // Connected successfully, reset backoff
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data?.type === "connected" || data?.type === "ping") {
              return;
            }

            if (data && data.title) {
              const notifItem = normalizeNotification(data);
              // Prepend new notification and increment unread badge, avoiding duplicates
              setNotifications((prev) => {
                if (prev.some((n) => n._id === notifItem._id || (n.id && n.id === notifItem.id))) {
                  return prev;
                }
                return [notifItem, ...prev];
              });
              setUnreadCount((c) => c + 1);

              // Browser Notification API if supported and granted
              if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                new Notification(notifItem.title, {
                  body: notifItem.body,
                  icon: "/icon.png",
                });
              }
            }
          } catch {}
        };

        eventSource.onerror = () => {
          // Connection interrupted or closed. Clean up and reconnect with exponential backoff.
          // Note: Next.js BFF proxy (/api/notifications/stream) transparently handles token validation & refresh.
          reconnect();
        };
      } catch {
        reconnect();
      }
    };

    connect();

    // Reconnect only if disconnected when browser tab is focused; throttle notification refetch
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
          retryAttempt = 0;
          connect();
        }
        const now = Date.now();
        if (now - lastFetchRef.current > 30000) {
          fetchNotifications();
        }
      }
    };

    // Reconnect immediately when device comes back online
    const handleOnline = () => {
      retryAttempt = 0;
      connect();
      const now = Date.now();
      if (now - lastFetchRef.current > 30000) {
        fetchNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    // Close on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      isUnmounted = true;
      cleanupSSE();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAuthenticated, user?._id]);

  const handleMarkAllRead = async () => {
    try {
      await axios.patch("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "delivery":
        return <HiOutlineTruck className="w-4 h-4 text-cyan-600" />;
      case "voucher":
        return <HiOutlineTicket className="w-4 h-4 text-amber-600" />;
      case "promo":
        return <HiOutlineSparkles className="w-4 h-4 text-rose-500" />;
      default:
        return <HiOutlineInformationCircle className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        aria-label="Notifications"
        className="relative p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-700 hover:text-black flex items-center justify-center focus:outline-none"
      >
        <HiOutlineBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white/95 backdrop-blur-xl border border-neutral-200/80 shadow-2xl z-50 overflow-hidden animate-fadeIn text-neutral-900">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-blue-600 hover:underline font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* FCM Push Notification Permission Banner (Authenticated only) */}
          {isAuthenticated && permission === "default" && (
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-sky-50 to-indigo-50 border-b border-sky-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sky-900 min-w-0">
                <span className="text-base">🔔</span>
                <p className="text-[11px] font-medium leading-tight truncate">
                  Enable push notifications for orders & exclusive deals
                </p>
              </div>
              <button
                type="button"
                onClick={enableNotifications}
                disabled={isFcmLoading}
                className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex-shrink-0 transition-colors shadow-sm disabled:opacity-50"
              >
                {isFcmLoading ? "Enabling..." : "Enable"}
              </button>
            </div>
          )}
          {isAuthenticated && permission === "granted" && (
            <div className="px-3.5 py-1.5 bg-emerald-50/70 border-b border-emerald-100/60 flex items-center gap-1.5 text-[10px] text-emerald-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Push notifications active</span>
            </div>
          )}

          {/* Body Content */}
          {!isAuthenticated ? (
            <div className="py-10 px-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                <HiOutlineBell className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-neutral-900">Sign in to view notifications</p>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  Sign in to your Cyber Store account to track your orders, receive delivery alerts, and get exclusive promo vouchers.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-sm"
                >
                  Sign In
                </Link>
              </div>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
              {loading && notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center space-y-1">
                  <HiOutlineBell className="w-8 h-8 text-neutral-300 mx-auto" />
                  <p className="text-xs font-medium text-neutral-600">No notifications yet</p>
                  <p className="text-[11px] text-neutral-400">
                    You will receive delivery updates and special promo vouchers here.
                  </p>
                </div>
              ) : (
                notifications.map((item, idx) => {
                  const targetLink = item.data?.link || (item.type === "delivery" ? "/account/order" : "/shop");
                  const itemKey = item._id || item.id || `notif-item-${idx}`;
                  return (
                    <div
                      key={itemKey}
                      onClick={() => {
                        if (!item.isRead) handleMarkOneRead(item._id || item.id || "");
                      }}
                      className={`p-3.5 hover:bg-neutral-50/80 transition-colors flex items-start gap-3 cursor-pointer ${
                        !item.isRead ? "bg-cyan-50/30" : ""
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {getIcon(item.type)}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-neutral-900 truncate">
                            {item.title}
                          </p>
                          <span className="text-[10px] text-neutral-400 flex-shrink-0">
                            {new Date(item.createdAt).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-600 leading-snug line-clamp-2">
                          {item.body}
                        </p>

                        {/* Voucher Action Card */}
                        {item.data?.voucherCode && (
                          <div className="flex items-center justify-between gap-2 mt-2 p-2 rounded-xl bg-amber-50/80 border border-amber-200/60">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-amber-800">
                                {item.data.voucherCode}
                              </span>
                              {item.data.discount && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 font-bold">
                                  -{item.data.discount}%
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleCopyCode(e, item.data!.voucherCode!)}
                              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 transition-colors"
                            >
                              {copiedCode === item.data.voucherCode ? (
                                <>
                                  <HiCheck className="w-3 h-3 text-emerald-700" /> Copied!
                                </>
                              ) : (
                                <>
                                  <HiOutlineClipboardCopy className="w-3 h-3" /> Copy
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Quick link button */}
                        <div className="pt-1">
                          <Link
                            href={targetLink}
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center text-[10px] font-semibold text-blue-600 hover:underline"
                          >
                            View Details →
                          </Link>
                        </div>
                      </div>

                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0 mt-2" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Footer */}
          <div className="p-2.5 border-t border-neutral-100 bg-neutral-50/70 text-center">
            <Link
              href={isAuthenticated ? "/account/order" : "/login"}
              onClick={() => setOpen(false)}
              className="text-[11px] text-neutral-600 hover:text-black font-medium transition-colors"
            >
              {isAuthenticated ? "Check My Order Tracking →" : "Sign In to Your Account →"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

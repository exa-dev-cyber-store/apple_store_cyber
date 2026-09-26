"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiAlertTriangle,
  FiX,
} from "react-icons/fi";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface ModalAlertItem {
  isOpen: boolean;
  title: string;
  message: string;
  type?: ToastType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

type Listener = (toasts: ToastItem[]) => void;
type ModalListener = (modal: ModalAlertItem | null) => void;

let toastsState: ToastItem[] = [];
const listeners: Listener[] = [];

let modalState: ModalAlertItem | null = null;
const modalListeners: ModalListener[] = [];

export const toast = {
  show: (type: ToastType, title: string, message?: string, duration = 4000) => {
    // Prevent duplicate toasts from stacking simultaneously
    const isDuplicate = toastsState.some(
      (t) => t.type === type && t.title === title && (t.message || "") === (message || "")
    );
    if (isDuplicate) return;

    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { id, type, title, message, duration };
    toastsState = [...toastsState, item];
    listeners.forEach((fn) => fn(toastsState));

    if (duration > 0) {
      setTimeout(() => {
        toastsState = toastsState.filter((t) => t.id !== id);
        listeners.forEach((fn) => fn(toastsState));
      }, duration);
    }
  },
  success: (title: string, message?: string) => {
    toast.show("success", title, message);
  },
  error: (title: string, message?: string) => {
    toast.show("error", title, message, 5000);
  },
  warning: (title: string, message?: string) => {
    toast.show("warning", title, message, 5000);
  },
  info: (title: string, message?: string) => {
    toast.show("info", title, message);
  },
  // Replaces browser native alert() with an Apple-style modal dialog
  alert: (options: {
    title: string;
    message: string;
    type?: ToastType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }) => {
    modalState = {
      isOpen: true,
      title: options.title,
      message: options.message,
      type: options.type || "info",
      confirmText: options.confirmText || "OK",
      cancelText: options.cancelText,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    };
    modalListeners.forEach((fn) => fn(modalState));
  },
  closeModal: () => {
    modalState = null;
    modalListeners.forEach((fn) => fn(null));
  },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modal, setModal] = useState<ModalAlertItem | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal alert is open
  useEffect(() => {
    if (modal?.isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [modal?.isOpen]);

  useEffect(() => {
    const handleToastsChange = (newToasts: ToastItem[]) => {
      setToasts([...newToasts]);
    };
    const handleModalChange = (newModal: ModalAlertItem | null) => {
      setModal(newModal);
    };

    listeners.push(handleToastsChange);
    modalListeners.push(handleModalChange);

    return () => {
      const idx = listeners.indexOf(handleToastsChange);
      if (idx !== -1) listeners.splice(idx, 1);
      const mIdx = modalListeners.indexOf(handleModalChange);
      if (mIdx !== -1) modalListeners.splice(mIdx, 1);
    };
  }, []);

  const removeToast = (id: string) => {
    toastsState = toastsState.filter((t) => t.id !== id);
    setToasts([...toastsState]);
  };

  return (
    <>
      {/* Floating Dynamic Island Style Toasts */}
      <div
        className="fixed top-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 pointer-events-none w-full max-w-sm px-4"
        style={{ zIndex: 999999 }}
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto flex items-start gap-3 w-full p-4 rounded-2xl bg-neutral-900/95 text-white backdrop-blur-xl border border-white/15 shadow-2xl transition-all animate-bounce-short"
            style={{ animation: "fadeInDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <div className="shrink-0 mt-0.5">
              {item.type === "success" && (
                <FiCheckCircle className="text-emerald-400 text-lg" />
              )}
              {item.type === "error" && (
                <FiAlertCircle className="text-rose-400 text-lg" />
              )}
              {item.type === "warning" && (
                <FiAlertTriangle className="text-amber-400 text-lg" />
              )}
              {item.type === "info" && (
                <FiInfo className="text-sky-400 text-lg" />
              )}
            </div>
            <div className="flex-1 text-left space-y-0.5">
              <p className="text-xs font-bold tracking-tight text-white">
                {item.title}
              </p>
              {item.message && (
                <p className="text-[11px] text-neutral-300 leading-snug">
                  {item.message}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className="text-neutral-400 hover:text-white transition-colors p-0.5 -mr-1"
            >
              <FiX className="text-xs" />
            </button>
          </div>
        ))}
      </div>

      {/* Apple-grade Alert Dialog Modal (Alternative to native alert) */}
      {modal && modal.isOpen && mounted &&
        createPortal(
          <div
            className="fixed inset-0 top-0 left-0 w-full h-full min-h-screen z-[99999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md overflow-y-auto animate-modal-fade"
            style={{ margin: 0, zIndex: 99999 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                modal.onCancel?.();
                toast.closeModal();
              }
            }}
          >
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-neutral-200/80 shadow-2xl text-center space-y-4 animate-modal-scale relative z-10">
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center shadow-sm">
                {modal.type === "success" && (
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl border border-emerald-100">
                    <FiCheckCircle />
                  </div>
                )}
                {modal.type === "error" && (
                  <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-2xl border border-rose-100">
                    <FiAlertCircle />
                  </div>
                )}
                {modal.type === "warning" && (
                  <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-2xl border border-amber-100">
                    <FiAlertTriangle />
                  </div>
                )}
                {(modal.type === "info" || !modal.type) && (
                  <div className="w-14 h-14 rounded-full bg-neutral-100 text-neutral-800 flex items-center justify-center text-2xl border border-neutral-200">
                    <FiInfo />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-neutral-900 tracking-tight">
                  {modal.title}
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {modal.message}
                </p>
              </div>

              <div className="pt-3 flex items-center justify-center gap-2.5">
                {modal.cancelText && (
                  <button
                    type="button"
                    onClick={() => {
                      modal.onCancel?.();
                      toast.closeModal();
                    }}
                    className="flex-1 py-2.5 px-5 rounded-full border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition-all active:scale-[0.98]"
                  >
                    {modal.cancelText}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    modal.onConfirm?.();
                    toast.closeModal();
                  }}
                  className={`py-2.5 px-6 rounded-full text-white text-xs font-semibold shadow-md transition-all active:scale-[0.98] ${
                    modal.cancelText ? "flex-1" : "w-full"
                  } ${
                    modal.type === "error" || modal.type === "warning"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-neutral-900 hover:bg-black"
                  }`}
                >
                  {modal.confirmText || "OK"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

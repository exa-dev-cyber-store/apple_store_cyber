"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SiApple } from "react-icons/si";
import { FcGoogle } from "react-icons/fc";
import { FiCheckCircle, FiX } from "react-icons/fi";

interface DisconnectAppleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  submitting?: boolean;
  appleEmail?: string;
  googleEmail?: string;
}

export default function DisconnectAppleModal({
  isOpen,
  onClose,
  onConfirm,
  submitting = false,
  appleEmail,
  googleEmail,
}: DisconnectAppleModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open to prevent page leaking beneath
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 top-0 left-0 w-full h-full min-h-screen z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-md overflow-y-auto animate-modal-fade"
      style={{ margin: 0, zIndex: 99999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-neutral-200/80 shadow-2xl p-6 sm:p-8 space-y-6 animate-modal-scale z-10">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors disabled:opacity-50"
        >
          <FiX className="text-sm" />
        </button>

        {/* Header with Apple Icon */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-lg ring-4 ring-neutral-100">
            <SiApple className="text-3xl" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">
              Disconnect Apple Account?
            </h2>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Are you sure you want to unlink your Apple ID from this Cyber Store profile?
            </p>
          </div>
        </div>

        {/* Security & Access Info Card */}
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
              <FiCheckCircle className="text-sm" />
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-neutral-800">Account Access Remains Secure</p>
              <p className="text-neutral-500 leading-relaxed">
                Your orders, invoices, and delivery addresses will remain fully intact and accessible through your connected Google account.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400 font-medium">Primary Login:</span>
            <span className="font-semibold text-neutral-800 truncate max-w-[200px] flex items-center gap-1.5">
              <FcGoogle className="text-sm flex-shrink-0" />
              <span className="truncate">{googleEmail || "Connected Google Account"}</span>
            </span>
          </div>

          {appleEmail && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-400 font-medium">Apple ID to Unlink:</span>
              <span className="font-mono text-neutral-600 truncate max-w-[200px]">
                {appleEmail}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-3 px-5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
          >
            Keep Apple Account
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 py-3 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Disconnecting...</span>
              </>
            ) : (
              <span>Disconnect Apple ID</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

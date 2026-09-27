"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle, FiX } from "react-icons/fi";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  submitting?: boolean;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  submitting = false,
}: DeleteAccountModalProps) {
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
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-neutral-200/90 shadow-2xl p-6 sm:p-8 space-y-6 animate-modal-scale z-10">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors disabled:opacity-50"
        >
          <FiX className="text-sm" />
        </button>

        {/* Warning Icon & Header */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-sm border border-red-200/70 ring-4 ring-red-50">
            <FiAlertTriangle className="text-3xl" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">
              Delete Account?
            </h2>
            <p className="text-xs font-medium text-neutral-500 max-w-xs mx-auto">
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        {/* Warning Details & Info Box */}
        <p className="text-xs text-neutral-700 leading-relaxed text-center">
          Are you sure you want to permanently delete your account? All personal profile details, saved addresses, and active login sessions will be purged immediately.
        </p>

        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2.5 text-xs text-neutral-700">
          <div className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 flex-shrink-0" />
            <span className="font-medium text-neutral-800">
              All active login sessions will be terminated immediately.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 flex-shrink-0" />
            <span className="font-medium text-neutral-800">
              Personal identity details and delivery addresses will be purged.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
            <span className="font-medium text-neutral-800">
              Order history and invoices remain archived for legal audit compliance.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-3 px-5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 py-3 px-5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting Account...</span>
              </>
            ) : (
              <span>Delete Account</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

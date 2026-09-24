"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { FiMail, FiCheckCircle, FiX, FiAlertCircle, FiRefreshCw, FiShield } from "react-icons/fi";
import axios from "axios";

interface VerifyEmailModalProps {
  isOpen: boolean;
  onClose?: () => void;
  email: string;
  onSuccess?: () => void;
  token?: string;
  isMandatory?: boolean;
}

export default function VerifyEmailModal({
  isOpen,
  onClose,
  email,
  onSuccess,
  token,
  isMandatory = true,
}: VerifyEmailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0 && isOpen) {
      const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setDigits(["", "", "", "", "", ""]);
      setError(null);
      setResendNotice(null);
      setSuccess(false);
      setCooldown(60);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    // Handle pasting multiple digits into a single box
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || "";
      }
      setDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = value;
    setDigits(newDigits);

    // Auto advance focus
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || "";
    }
    setDigits(newDigits);
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = digits.join("");

    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);
    setResendNotice(null);

    try {
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : { withCredentials: true };

      await axios.post(
        "/api/auth/verify-email",
        { code, email },
        config
      );

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 1500);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Invalid or expired verification code. Please check and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setError(null);
    setResendNotice(null);

    try {
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : { withCredentials: true };

      await axios.post(
        "/api/auth/resend-verification",
        { email },
        config
      );

      setCooldown(60);
      setDigits(["", "", "", "", "", ""]);
      setResendNotice("A new 6-digit verification code has been sent to your email.");
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to resend code. Please try again later.";
      setError(message);
    } finally {
      setResending(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 top-0 left-0 w-full h-full min-h-screen z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-modal-fade"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-[#0b0f19] border border-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-neutral-100 animate-modal-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Optional Close Button if not strictly mandatory */}
        {!isMandatory && onClose && (
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <FiX className="text-lg" />
          </button>
        )}

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <FiMail className="text-2xl" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-semibold uppercase tracking-wider mb-2">
            <FiShield className="text-xs" />
            <span>Mandatory Email Verification</span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            Verify Your Email Address
          </h2>
          <p className="text-neutral-400 text-xs mt-1.5 leading-relaxed">
            Please enter the 6-digit verification code sent to:
          </p>
          <div className="inline-block mt-1 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-cyan-400 text-xs font-semibold">
            {email}
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
            <FiAlertCircle className="text-base shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {resendNotice && !error && (
          <div className="mb-5 p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-start gap-2.5">
            <FiCheckCircle className="text-base shrink-0 mt-0.5" />
            <span>{resendNotice}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2.5">
            <FiCheckCircle className="text-base shrink-0" />
            <span>Email verified successfully! Activating account...</span>
          </div>
        )}

        {/* 6-Digit OTP Code Inputs */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex items-center justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={loading || success}
                className="w-11 sm:w-13 h-14 text-center text-xl font-bold font-mono bg-neutral-900/90 border border-neutral-700/80 rounded-2xl text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50"
              />
            ))}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || success || digits.join("").length !== 6}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Verifying..." : "Verify Code & Activate Account"}
            </button>
          </div>
        </form>

        {/* Resend Code & Cooldown */}
        <div className="mt-6 text-center border-t border-neutral-800/80 pt-4 flex items-center justify-between text-xs text-neutral-400">
          <span>Didn&apos;t receive the code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending || loading || success}
            className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors"
          >
            <FiRefreshCw className={`text-xs ${resending ? "animate-spin" : ""}`} />
            <span>{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}</span>
          </button>
        </div>

        {/* Navigation fallback if user entered wrong email */}
        {onClose && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || success}
              className="text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Entered the wrong email? Click here to change
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

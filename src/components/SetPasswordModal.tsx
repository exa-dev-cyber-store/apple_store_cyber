"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiLock, FiCheckCircle, FiX, FiAlertCircle, FiEye, FiEyeOff } from "react-icons/fi";
import axios from "axios";

interface SetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  token?: string;
  isFirstTimeOnboarding?: boolean;
}

export default function SetPasswordModal({
  isOpen,
  onClose,
  onSuccess,
  token,
  isFirstTimeOnboarding = false,
}: SetPasswordModalProps) {
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setConfirmPassword("");
      setError(null);
      setSuccess(false);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_API_BACKEND_URL ||
        "https://be-apple-store.eka-dev.cloud";
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : { withCredentials: true };

      await axios.post(
        `${apiUrl}/auth/set-password`,
        { password, confirmPassword },
        config
      );

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to set password. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 top-0 left-0 w-full h-full min-h-screen z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto animate-modal-fade"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-[#0b0f19] border border-neutral-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-neutral-100 animate-modal-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors disabled:opacity-50"
          aria-label="Close modal"
        >
          <FiX className="text-lg" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <FiLock className="text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isFirstTimeOnboarding ? "Create Your Account Password" : "Set Account Password"}
          </h2>
          <p className="text-neutral-400 text-xs mt-1.5 leading-relaxed">
            {isFirstTimeOnboarding
              ? "You signed up via Social Login. Set a secure password to also enable direct email login anytime."
              : "Define a secure password for your Cyber Store account."}
          </p>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
            <FiAlertCircle className="text-base shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2.5">
            <FiCheckCircle className="text-base shrink-0" />
            <span>Password created successfully!</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || success}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2.5 pr-10 bg-neutral-900/90 border border-neutral-700/80 rounded-xl text-white text-xs sm:text-sm placeholder-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                {showPassword ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading || success}
              placeholder="Re-enter your password"
              className="w-full px-4 py-2.5 bg-neutral-900/90 border border-neutral-700/80 rounded-xl text-white text-xs sm:text-sm placeholder-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Setting Password..." : "Save Password & Continue"}
            </button>
          </div>

          {isFirstTimeOnboarding && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || success}
                className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                Skip for now (I will use Social Login)
              </button>
            </div>
          )}
        </form>
      </div>
    </div>,
    document.body
  );
}

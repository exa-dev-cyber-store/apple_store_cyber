"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import Image from "next/image";
import { FiArrowLeft, FiMail, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { SiApple } from "react-icons/si";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: null, message: "" });

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL || "http://localhost:5000";
      const res = await fetch(`${backendUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus({
          type: "success",
          message:
            data.message ||
            "Password reset instructions have been sent to your email. Please check your inbox (or iCloud email for Apple Private Relay users).",
        });
      } else {
        setStatus({
          type: "error",
          message: data.message || "Failed to process password reset request.",
        });
      }
    } catch (err: any) {
      console.error("Forgot password error:", err);
      setStatus({
        type: "error",
        message: "Connection error. Please try again in a moment.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#fbfbfd]">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-xl space-y-6">
        {/* Back Link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-black transition-colors"
        >
          <FiArrowLeft /> Back to Sign In
        </Link>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl p-[1.5px] bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 mx-auto shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center">
            <div className="w-full h-full bg-[#080b11] rounded-[14px] flex items-center justify-center p-2">
              <Image
                src="/logo.png"
                alt="Cyber Apple Logo"
                width={34}
                height={34}
                className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.85)]"
                priority
              />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900">
            Forgot Password
          </h1>
          <p className="text-xs text-neutral-500">
            Enter the email address registered with your Cyber Apple account to receive a password reset link.
          </p>
        </div>

        {/* Apple Relay Notice Card */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 flex items-start gap-3">
          <SiApple className="text-neutral-900 text-lg flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-neutral-600 leading-relaxed">
            <span className="font-bold text-neutral-900">Sign in with Apple Support</span>:
            If you signed up via Apple, you can enter your standard email or your Apple Private Relay address (e.g. <em>...privaterelay.appleid.com</em>). Apple will automatically forward it to your iCloud inbox.
          </div>
        </div>

        {status.type === "success" && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <FiCheckCircle className="text-base" /> Link Sent
            </div>
            <p className="leading-relaxed">{status.message}</p>
          </div>
        )}

        {status.type === "error" && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <FiAlertCircle className="text-base flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">{status.message}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Account Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com or @privaterelay.appleid.com"
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-neutral-300 outline-none focus:border-neutral-900 transition-colors"
              />
              <FiMail className="absolute left-3.5 top-3.5 text-neutral-400 text-sm" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !email.trim()}
            className="w-full py-3.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-all duration-200 shadow-md hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? "Processing..." : "Send Reset Link"}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-neutral-500">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:underline"
            >
              Sign in now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import Image from "next/image";
import { FiArrowLeft, FiLock, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") || "";

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError("Password reset token not found or empty.");
      return;
    }

    if (password.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    setSubmitting(true);

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_API_BACKEND_URL ||
        "https://be-apple-store.eka-dev.cloud";
      const res = await fetch(`${backendUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(data.message || "Failed to reset password.");
      }
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError("Failed to connect to server. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-xl space-y-6">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-black transition-colors"
      >
        <FiArrowLeft /> Back to Sign In
      </Link>

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
          Reset Password
        </h1>
        <p className="text-xs text-neutral-500">
          Create a secure new password for your Cyber Apple account
        </p>
      </div>

      {success ? (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
          <FiCheckCircle className="text-4xl text-emerald-600 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-emerald-900">
              Password Updated Successfully!
            </h2>
            <p className="text-xs text-emerald-700">
              You will be automatically redirected to the sign-in page in 3 seconds...
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block py-2.5 px-6 rounded-full bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors"
          >
            Sign In Now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <FiAlertCircle className="text-base flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {initialToken ? (
            <input type="hidden" value={token} />
          ) : (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Reset Verification Token
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter token from your email"
                className="w-full text-xs px-4 py-3 rounded-xl border border-neutral-300 font-mono outline-none focus:border-neutral-900 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-neutral-300 outline-none focus:border-neutral-900 transition-colors"
              />
              <FiLock className="absolute left-3.5 top-3.5 text-neutral-400 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-neutral-300 outline-none focus:border-neutral-900 transition-colors"
              />
              <FiLock className="absolute left-3.5 top-3.5 text-neutral-400 text-sm" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-all duration-200 shadow-md hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save New Password"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#fbfbfd]">
      <Suspense fallback={<div className="text-xs text-neutral-400">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

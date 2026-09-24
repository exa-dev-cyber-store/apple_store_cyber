"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import Image from "next/image";
import { FcGoogle } from "react-icons/fc";
import { SiApple } from "react-icons/si";
import { FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import VerifyEmailModal from "@/components/VerifyEmailModal";

export default function Login() {
  const router = useRouter();
  const { loginWithCredentials, loginWithGoogle, loginWithApple, refreshSession } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
  const [verifiedSuccessNotice, setVerifiedSuccessNotice] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("session_expired") === "true") {
        setSessionExpiredNotice(true);
      }
      if (params.get("verified") === "true") {
        setVerifiedSuccessNotice(true);
      }
      const verifyEmailParam = params.get("verify_email");
      if (verifyEmailParam) {
        setUnverifiedEmail(verifyEmailParam);
        setShowVerifyModal(true);
      }
    }
  }, []);

  const handleCredentialsSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setVerifiedSuccessNotice(false);

    const form = new FormData(e.currentTarget);
    const email = (form.get("email") as string)?.trim();
    const password = form.get("password") as string;

    const res = await loginWithCredentials({ email, password });

    if (!res.success) {
      setSubmitting(false);
      if (res.requiresEmailVerification) {
        setUnverifiedEmail(res.email || email);
        setShowVerifyModal(true);
        return;
      }
      setError(res.error || "Invalid email address or password");
      return;
    }

    router.push("/shop");
    router.refresh();
  };

  const handleGoogleSignIn = () => {
    setError(null);
    if (typeof window === "undefined" || !(window as any).google?.accounts?.oauth2) {
      setError("Google services are loading. Please click again in a moment.");
      return;
    }

    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "897905079551-0bm5skv53tbcpqobtlkaatmfheftthc4.apps.googleusercontent.com";

    setSubmitting(true);
    const client = (window as any).google.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: "openid email profile",
      ux_mode: "popup",
      callback: async (response: any) => {
        if (response.code) {
          try {
            const res = await loginWithGoogle({ code: response.code });
            if (res.success) {
              router.push("/shop");
              router.refresh();
            } else {
              setSubmitting(false);
              setError(res.error || "Google sign in failed");
            }
          } catch (err: any) {
            setSubmitting(false);
            console.error("Google OAuth failed:", err);
            setError(err?.message || "Google OAuth failed");
          }
        } else {
          setSubmitting(false);
        }
      },
      error_callback: () => {
        setSubmitting(false);
      },
    });

    client?.requestCode();
  };

  const handleAppleSignIn = async () => {
    setError(null);
    if (typeof window === "undefined" || !(window as any).AppleID?.auth) {
      setError("Apple services are loading. Please click again in a moment.");
      return;
    }

    setSubmitting(true);
    try {
      const appleClientId =
        process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || "cloud.eka-dev.apple-store.service";
      const redirectURI =
        process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI ||
        "https://semilyrically-uniterative-zackary.ngrok-free.dev/api/auth/callback/apple";

      (window as any).AppleID.auth.init({
        clientId: appleClientId,
        scope: "name email",
        redirectURI,
        usePopup: true,
      });

      const response = await (window as any).AppleID.auth.signIn();
      if (response?.authorization?.id_token) {
        let fullName: string | undefined;
        if (response.user?.name) {
          fullName = [response.user.name.firstName, response.user.name.lastName]
            .filter(Boolean)
            .join(" ");
        }

        const res = await loginWithApple({
          identityToken: response.authorization.id_token,
          email: response.user?.email,
          name: fullName,
        });

        if (res.success) {
          router.push("/shop");
          router.refresh();
        } else {
          setSubmitting(false);
          setError(res.error || "Apple sign in failed");
        }
      } else {
        setSubmitting(false);
      }
    } catch (err: any) {
      setSubmitting(false);
      if (err?.error !== "popup_closed_by_user") {
        setError(err?.error || err?.message || "Sign in with Apple was cancelled.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#fbfbfd]">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-xl space-y-6">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-black transition-colors"
        >
          <FiArrowLeft /> Back to Store
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
            Sign In to Cyber Apple
          </h1>
          <p className="text-xs text-neutral-500">
            Access your shopping bag, order history, and saved wishlist
          </p>
        </div>

        {/* Social Sign In Buttons: Apple & Google */}
        <div className="space-y-2.5">
          <button
            onClick={handleAppleSignIn}
            type="button"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-full bg-black hover:bg-neutral-900 text-white text-xs font-semibold transition-all duration-200 shadow-sm hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <SiApple className="text-base mb-0.5" />
            <span>Sign in with Apple</span>
          </button>

          <button
            onClick={handleGoogleSignIn}
            type="button"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-neutral-300 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-all duration-200 shadow-sm hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <FcGoogle className="text-lg" />
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-neutral-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-neutral-400 uppercase tracking-wider absolute">
            Or with email
          </span>
        </div>

        {sessionExpiredNotice && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 text-center font-medium">
            Your session has expired or was revoked. Please sign in again.
          </div>
        )}

        {verifiedSuccessNotice && (
          <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700 text-center font-medium flex items-center justify-center gap-2">
            <FiCheckCircle className="text-base text-green-600" />
            <span>Email verified successfully! You can now sign in.</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 text-center font-medium">
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleCredentialsSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="name@example.com"
              className="w-full text-xs px-4 py-3 rounded-xl border border-neutral-300 outline-none focus:border-neutral-900 transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-neutral-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full text-xs px-4 py-3 rounded-xl border border-neutral-300 outline-none focus:border-neutral-900 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-all duration-200 shadow-md hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-neutral-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-blue-600 hover:underline"
            >
              Create yours now
            </Link>
          </p>
        </div>
      </div>

      <VerifyEmailModal
        isOpen={showVerifyModal}
        email={unverifiedEmail}
        isMandatory={true}
        onClose={() => setShowVerifyModal(false)}
        onSuccess={() => {
          refreshSession();
          router.push("/shop");
          router.refresh();
        }}
      />
    </div>
  );
}
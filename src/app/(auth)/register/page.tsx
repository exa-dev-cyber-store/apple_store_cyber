"use client";

import { isValidEmail } from "@/helper";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { FcGoogle } from "react-icons/fc";
import { SiApple } from "react-icons/si";
import { FiArrowLeft } from "react-icons/fi";
import VerifyEmailModal from "@/components/VerifyEmailModal";

export default function Register() {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");
  const router = useRouter();
  const { loginWithGoogle, loginWithApple, refreshSession } = useAuth();

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    const form = new FormData(e.currentTarget);
    const name = (form.get("name") as string)?.trim();
    const email = (form.get("email") as string)?.trim();
    const password = form.get("password") as string;
    const confirmPassword = form.get("confirmPassword") as string;

    if (!name || name.length < 2) {
      setErrorMessage("Please enter a valid full name.");
      return;
    }

    if (!email || !isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post("/api/auth/register", {
        name,
        email,
        password,
      });

      if (res.status === 200 || res.status === 201) {
        setRegisteredEmail(email);
        setShowVerifyModal(true);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || "Registration failed. Email may already be in use."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignUp = () => {
    setErrorMessage("");
    if (typeof window === "undefined" || !(window as any).google?.accounts?.oauth2) {
      setErrorMessage("Google services are loading. Please click again in a moment.");
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
              setErrorMessage(res.error || "Google sign up failed");
            }
          } catch (err: any) {
            setSubmitting(false);
            console.error("Google OAuth failed:", err);
            setErrorMessage(err?.message || "Google OAuth failed");
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

  const handleAppleSignUp = async () => {
    setErrorMessage("");
    if (typeof window === "undefined" || !(window as any).AppleID?.auth) {
      setErrorMessage("Apple services are loading. Please click again in a moment.");
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
          setErrorMessage(res.error || "Apple sign up failed");
        }
      } else {
        setSubmitting(false);
      }
    } catch (err: any) {
      setSubmitting(false);
      if (err?.error !== "popup_closed_by_user") {
        setErrorMessage(err?.error || err?.message || "Sign up with Apple was cancelled.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#fbfbfd]">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-xl space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-black transition-colors"
        >
          <FiArrowLeft /> Back to Store
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
            Create Your Cyber Apple ID
          </h1>
          <p className="text-xs text-neutral-500">
            One Cyber ID is all you need to access all Cyber Store services
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 text-center font-medium">
            {errorMessage}
          </div>
        )}

        {/* Social Sign Up Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleAppleSignUp}
            type="button"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-full bg-black hover:bg-neutral-900 text-white text-xs font-semibold transition-all duration-200 shadow-sm hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <SiApple className="text-base mb-0.5" />
            <span>Sign up with Apple</span>
          </button>

          <button
            onClick={handleGoogleSignUp}
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
            Or create with email
          </span>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Steve Jobs"
              className="w-full text-xs px-4 py-3 rounded-xl border border-neutral-300 outline-none focus:border-neutral-900 transition-colors"
            />
          </div>

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
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full text-xs px-4 py-3 rounded-xl border border-neutral-300 outline-none focus:border-neutral-900 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
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
            {submitting ? "Creating Account..." : "Create Cyber ID"}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-neutral-500">
            Already have a Cyber ID?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <VerifyEmailModal
        isOpen={showVerifyModal}
        email={registeredEmail}
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
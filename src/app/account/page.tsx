"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiUser,
  FiMail,
  FiShield,
  FiLock,
  FiCheckCircle,
  FiAlertTriangle,
  FiExternalLink,
  FiKey,
  FiEdit2,
  FiCheck,
  FiX,
  FiCamera,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { SiApple } from "react-icons/si";
import AvatarCropModal from "@/components/AvatarCropModal";
import DisconnectAppleModal from "@/components/DisconnectAppleModal";
import { getImageUrl } from "@/helper";
import { toast } from "@/components/ui/Toast";

interface LinkedAccountsData {
  signupProvider: "apple" | "google" | "local";
  isAppleSignup: boolean;
  currentEmail: string;
  google: {
    linked: boolean;
    email?: string;
    canUnbind: boolean;
  };
  apple: {
    linked: boolean;
    email?: string;
    canUnbind: boolean;
    requiresGoogleBeforeUnbind: boolean;
    canLink?: boolean;
  };
  canLinkGoogle: boolean;
  canUnbindApple: boolean;
  canLinkApple?: boolean;
}

export default function Profile() {
  const { session, updateUser, refreshSession, logout } = useAuth();
  const updateSession = async (data?: any) => {
    if (data) updateUser(data);
    else await refreshSession();
  };
  const [accountData, setAccountData] = useState<LinkedAccountsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isDisconnectAppleModalOpen, setIsDisconnectAppleModalOpen] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Full Name Editing states
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameUpdating, setNameUpdating] = useState(false);
  const [currentName, setCurrentName] = useState<string>("");

  // Avatar states
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google & Apple SDK states
  const [googleSdkReady, setGoogleSdkReady] = useState(false);
  const [appleSdkReady, setAppleSdkReady] = useState(false);
  const isLinkingAppleRef = useRef(false);

  // Auto-dismiss in-page status notice after 5 seconds
  useEffect(() => {
    if (!statusNotice) return;
    const timer = setTimeout(() => {
      setStatusNotice(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [statusNotice]);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/auth/linked-accounts");
      if (res.status === 401) {
        logout("/login?session_expired=true");
        return;
      }
      const data = await res.json();
      if (res.ok && data.success) {
        setAccountData(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch linked accounts status:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/profile");
      if (res.status === 401) {
        logout("/login?session_expired=true");
        return;
      }
      const data = await res.json();
      if (res.ok && data.success && data.data?.user) {
        if (data.data.user.name) {
          setCurrentName(data.data.user.name);
          setNameInput(data.data.user.name);
        }
        if (data.data.user.avatar) {
          setCurrentAvatar(data.data.user.avatar);
          setAvatarImgError(false);
        }
      } else if (session?.user) {
        if (session.user.name) {
          setCurrentName(session.user.name);
          setNameInput(session.user.name);
        }
        if (session.user.image) setCurrentAvatar(session.user.image);
      }
    } catch (err) {
      console.error("Failed to fetch profile details:", err);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchProfile();

    if (session?.user?.name && !currentName) {
      setCurrentName(session.user.name);
      setNameInput(session.user.name);
    }
    if (session?.user?.image && !currentAvatar) {
      setCurrentAvatar(session.user.image);
    }

    const handleAvatarUpdated = (e: CustomEvent) => {
      if (e.detail) {
        setCurrentAvatar(e.detail);
        setAvatarImgError(false);
      }
    };
    const handleProfileUpdated = (e: CustomEvent) => {
      if (e.detail?.name) {
        setCurrentName(e.detail.name);
        setNameInput(e.detail.name);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("avatar-updated", handleAvatarUpdated as EventListener);
      window.addEventListener("profile-updated", handleProfileUpdated as EventListener);

      if ((window as any).google?.accounts) {
        setGoogleSdkReady(true);
      } else {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => setGoogleSdkReady(true);
        document.body.appendChild(script);
      }

      // Apple JS SDK loader matching Google flow
      if ((window as any).AppleID?.auth) {
        setAppleSdkReady(true);
      } else {
        const appleScript = document.createElement("script");
        appleScript.src =
          "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
        appleScript.async = true;
        appleScript.defer = true;
        appleScript.onload = () => setAppleSdkReady(true);
        document.body.appendChild(appleScript);
      }

      // Detect if user just returned from Apple linking OAuth flow
      const params = new URLSearchParams(window.location.search);
      if (params.get("linked") === "apple") {
        toast.success(
          "Apple Account Linked",
          "Your Apple ID has been successfully connected to your profile."
        );
        window.history.replaceState({}, "", "/account");
        fetchStatus();
        fetchProfile();
      }

      return () => {
        if (typeof window !== "undefined") {
          window.removeEventListener("avatar-updated", handleAvatarUpdated as EventListener);
          window.removeEventListener("profile-updated", handleProfileUpdated as EventListener);
        }
      };
    }
  }, [session]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      const msg = "Unsupported file format. Please select an image file (JPG, PNG, WebP).";
      setStatusNotice({
        type: "error",
        message: msg,
      });
      toast.error("Unsupported Format", msg);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAvatarCropComplete = async (croppedBlob: Blob) => {
    setAvatarUploading(true);
    setStatusNotice(null);
    try {
      const formData = new FormData();
      formData.append("avatar", croppedBlob, "avatar.webp");

      const res = await fetch("/api/auth/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const newAvatarUrl = data.data?.avatar || data.avatar;
        setCurrentAvatar(newAvatarUrl);
        setAvatarImgError(false);
        setIsCropModalOpen(false);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("avatar-updated", { detail: newAvatarUrl }));
        }
        if (updateSession) {
          await updateSession({ image: newAvatarUrl });
        }
        setStatusNotice({
          type: "success",
          message: "Profile picture updated successfully!",
        });
        toast.success("Avatar Updated", "Profile picture updated successfully!");
      } else {
        const errorMsg = data.message || "Failed to upload profile picture.";
        setStatusNotice({
          type: "error",
          message: errorMsg,
        });
        toast.error("Upload Failed", errorMsg);
      }
    } catch (err) {
      const errorMsg = "Network error while uploading profile picture.";
      setStatusNotice({
        type: "error",
        message: errorMsg,
      });
      toast.error("Network Error", errorMsg);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleUpdateFullName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setNameUpdating(true);
    setStatusNotice(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const updated = data.data?.user?.name || nameInput.trim();
        setCurrentName(updated);
        setIsEditingName(false);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("profile-updated", { detail: { name: updated } }));
        }
        if (updateSession) {
          await updateSession({ name: updated });
        }
        setStatusNotice({
          type: "success",
          message: "Full name updated successfully!",
        });
        toast.success("Profile Updated", "Full name updated successfully!");
      } else {
        const errorMsg = data.message || "Failed to update full name.";
        setStatusNotice({
          type: "error",
          message: errorMsg,
        });
        toast.error("Update Failed", errorMsg);
      }
    } catch (err: any) {
      const errorMsg = "An error occurred while updating full name.";
      setStatusNotice({
        type: "error",
        message: errorMsg,
      });
      toast.error("Error", errorMsg);
    } finally {
      setNameUpdating(false);
    }
  };

  const handleLinkGoogleWithToken = async (idToken: string) => {
    setActionLoading(true);
    setStatusNotice(null);
    try {
      const res = await fetch("/api/auth/link/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: idToken }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const successMsg = `Google account linked successfully! Your primary account email has been updated to ${data.data.email}.`;
        setStatusNotice({
          type: "success",
          message: successMsg,
        });
        toast.success("Google Account Linked", successMsg);
        await fetchStatus();
        await fetchProfile();
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("profile-updated", {
              detail: { email: data.data.email, name: data.data.name },
            })
          );
        }
        if (updateSession) {
          await updateSession({ email: data.data.email, name: data.data.name });
        }
      } else {
        const errorMsg = data.message || "Failed to link Google account.";
        setStatusNotice({
          type: "error",
          message: errorMsg,
        });
        toast.error("Failed to Link Google Account", errorMsg);
      }
    } catch (err: any) {
      const errorMsg = "Network error while linking Google account.";
      setStatusNotice({
        type: "error",
        message: errorMsg,
      });
      toast.error("Network Error", errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDisconnectAppleModal = () => {
    if (!accountData?.canUnbindApple) return;
    setIsDisconnectAppleModalOpen(true);
  };

  const executeUnbindApple = async () => {
    if (!accountData?.canUnbindApple) return;

    setActionLoading(true);
    setStatusNotice(null);
    try {
      const res = await fetch("/api/auth/unbind/apple", {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const successMsg =
          data.message || "Apple account disconnected successfully.";
        setStatusNotice({
          type: "success",
          message: successMsg,
        });
        toast.success("Apple Disconnected", successMsg);
        setIsDisconnectAppleModalOpen(false);
        await fetchStatus();
        await fetchProfile();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("profile-updated", { detail: {} }));
        }
      } else {
        const errorMsg = data.message || "Failed to disconnect Apple account.";
        setStatusNotice({
          type: "error",
          message: errorMsg,
        });
        toast.error("Failed to Disconnect", errorMsg);
      }
    } catch (err: any) {
      const errorMsg = "Network error while disconnecting Apple account.";
      setStatusNotice({
        type: "error",
        message: errorMsg,
      });
      toast.error("Network Error", errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Link Apple Account with Token (with single-execution guard)
  const handleLinkAppleWithToken = async (identityToken: string) => {
    if (isLinkingAppleRef.current) return;
    isLinkingAppleRef.current = true;
    setActionLoading(true);
    setStatusNotice(null);
    try {
      const res = await fetch("/api/auth/link/apple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identityToken }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const successMsg =
          data.message || "Your Apple ID has been linked successfully.";
        setStatusNotice({
          type: "success",
          message: successMsg,
        });
        toast.success("Apple Account Linked", successMsg);
        await fetchStatus();
        await fetchProfile();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("profile-updated", { detail: {} }));
        }
      } else {
        const errorMsg = data.message || "Failed to link Apple account.";
        setStatusNotice({
          type: "error",
          message: errorMsg,
        });
        toast.error("Failed to Link Apple", errorMsg);
      }
    } catch (err: any) {
      const errorMsg = "Network error while linking Apple account.";
      setStatusNotice({
        type: "error",
        message: errorMsg,
      });
      toast.error("Network Error", errorMsg);
    } finally {
      setActionLoading(false);
      setTimeout(() => {
        isLinkingAppleRef.current = false;
      }, 1500);
    }
  };

  // Trigger Apple Sign In via official Apple JS SDK popup (script-based, identical to Google popup flow)
  const triggerAppleSignInPrompt = async () => {
    const appleClientId =
      process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || "cloud.eka-dev.apple-store.service";
    const redirectURI =
      process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI ||
      "https://semilyrically-uniterative-zackary.ngrok-free.dev/api/auth/callback/apple";

    if (typeof window === "undefined" || !(window as any).AppleID?.auth) {
      const infoMsg = "Connecting to Apple services... Please click again in a few seconds.";
      setStatusNotice({
        type: "info",
        message: infoMsg,
      });
      toast.info("Connecting to Apple", infoMsg);
      return;
    }

    if (isLinkingAppleRef.current) return;

    setActionLoading(true);
    setStatusNotice(null);

    try {
      (window as any).AppleID.auth.init({
        clientId: appleClientId,
        scope: "name email",
        redirectURI: redirectURI,
        usePopup: true,
      });

      const response = await (window as any).AppleID.auth.signIn();
      if (response?.authorization?.id_token) {
        await handleLinkAppleWithToken(response.authorization.id_token);
      } else {
        setActionLoading(false);
      }
    } catch (err: any) {
      setActionLoading(false);
      console.error("Apple popup error:", err);
      if (err?.error === "popup_closed_by_user") {
        toast.warning("Apple Authorization", "The Apple Sign-In popup was closed or cancelled.");
      } else {
        const errorMsg =
          err?.error || err?.message || "Apple authorization failed. Please try again.";
        setStatusNotice({
          type: "error",
          message: errorMsg,
        });
        toast.error("Authorization Failed", errorMsg);
      }
    }
  };

  // Trigger real Google OAuth popup login flow
  const triggerGoogleSignInPrompt = () => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      const errorMsg = "Google Client ID is missing in configuration.";
      setStatusNotice({
        type: "error",
        message: errorMsg,
      });
      toast.error("Configuration Error", errorMsg);
      return;
    }

    if (typeof window === "undefined" || !(window as any).google?.accounts) {
      const infoMsg = "Connecting to Google services... Please click again in a few seconds.";
      setStatusNotice({
        type: "info",
        message: infoMsg,
      });
      toast.info("Connecting to Google", infoMsg);
      return;
    }

    setActionLoading(true);
    setStatusNotice(null);

    try {
      // 1. Preferred: Google OAuth2 popup client (triggers native Google account picker / login popup immediately)
      if ((window as any).google?.accounts?.oauth2?.initTokenClient) {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: "openid email profile",
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              await handleLinkGoogleWithToken(tokenResponse.access_token);
            } else if (tokenResponse?.error) {
              setActionLoading(false);
              if (tokenResponse.error === "access_denied") {
                toast.warning("Google Authorization", "The Google Sign-In popup was closed or cancelled.");
              } else {
                const errorMsg = `Google authorization failed: ${tokenResponse.error}`;
                setStatusNotice({
                  type: "error",
                  message: errorMsg,
                });
                toast.error("Authorization Failed", errorMsg);
              }
            } else {
              setActionLoading(false);
            }
          },
          error_callback: (err: any) => {
            setActionLoading(false);
            console.error("Google popup error:", err);
            const errorMsg = "Google login popup was closed or blocked. Please allow popups for this site.";
            setStatusNotice({
              type: "error",
              message: errorMsg,
            });
            toast.error("Popup Blocked", errorMsg);
          },
        });

        tokenClient.requestAccessToken({ prompt: "select_account" });
        return;
      }

      // 2. Fallback: Google Identity Services ID token
      (window as any).google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: any) => {
          if (response?.credential) {
            await handleLinkGoogleWithToken(response.credential);
          } else {
            setActionLoading(false);
          }
        },
      });

      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setActionLoading(false);
          const errorMsg = "Google Sign-In prompt could not be displayed. Please check popup blockers.";
          setStatusNotice({
            type: "error",
            message: errorMsg,
          });
          toast.warning("Google Prompt", errorMsg);
        }
      });
    } catch (err: any) {
      setActionLoading(false);
      const errorMsg = err?.message || "Failed to launch Google Sign-In popup.";
      setStatusNotice({
        type: "error",
        message: errorMsg,
      });
      toast.error("Sign-In Error", errorMsg);
    }
  };

  const activeEmail = accountData?.currentEmail || session?.user?.email || "Not provided";

  return (
    <div className="space-y-6">
      {/* Personal Information Header Card */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Personal Information
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage your personal identity, Google & Apple account integrations, and security
          </p>
        </div>

        {statusNotice && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-3 border ${statusNotice.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : statusNotice.type === "error"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-blue-50 border-blue-200 text-blue-700"
              }`}
          >
            <div className="flex items-center gap-3">
              {statusNotice.type === "success" ? (
                <FiCheckCircle className="text-base flex-shrink-0 text-emerald-600" />
              ) : (
                <FiAlertTriangle className="text-base flex-shrink-0" />
              )}
              <p className="leading-relaxed font-medium">{statusNotice.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="p-1 rounded-lg hover:bg-black/5 text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              <FiX className="text-sm" />
            </button>
          </div>
        )}

        {/* Profile Avatar Header with Camera Upload */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl bg-neutral-50/80 border border-neutral-200/60">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md bg-neutral-900 flex items-center justify-center flex-shrink-0">
              {currentAvatar && !avatarImgError ? (
                <img
                  src={getImageUrl(currentAvatar)}
                  alt="Profile Avatar"
                  onError={() => setAvatarImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white uppercase">
                  {(currentName || session?.user?.name || "U")[0]}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Change Profile Picture"
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-black hover:bg-neutral-800 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95"
            >
              <FiCamera className="text-sm" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-lg font-bold text-neutral-900">
              {currentName || session?.user?.name || "Cyber Customer"}
            </h2>
            <p className="text-xs text-neutral-500">
              Your photo is automatically formatted for seamless display across web and mobile
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline pt-0.5"
            >
              <FiCamera className="text-xs" /> Change Profile Picture
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-neutral-100">
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                <FiUser /> Full Name
              </div>
              {!isEditingName && (
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(currentName || session?.user?.name || "");
                    setIsEditingName(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  <FiEdit2 className="text-xs" /> Edit
                </button>
              )}
            </div>

            {isEditingName ? (
              <form onSubmit={handleUpdateFullName} className="space-y-2 pt-1">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter new full name"
                  required
                  disabled={nameUpdating}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 bg-white outline-none focus:border-neutral-900 transition-colors"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={nameUpdating || !nameInput.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-[11px] font-semibold hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                  >
                    <FiCheck className="text-xs" />
                    {nameUpdating ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    disabled={nameUpdating}
                    onClick={() => setIsEditingName(false)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-neutral-600 text-[11px] font-semibold hover:bg-neutral-50 transition-colors"
                  >
                    <FiX className="text-xs" /> Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-base font-bold text-neutral-900">
                {currentName || session?.user?.name || "Cyber Customer"}
              </p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-1">
            <div className="flex items-center gap-2 text-xs text-neutral-400 font-semibold uppercase tracking-wider">
              <FiMail /> Primary Account Email
            </div>
            <p className="text-base font-bold text-neutral-900 truncate">
              {activeEmail}
            </p>
          </div>
        </div>
      </div>

      {/* Linked Accounts (Google & Apple) Card */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">
              Linked Accounts (Google & Apple)
            </h2>
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Access Security
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Manage your Google and Apple account integrations according to Cyber Store authentication policies
          </p>
        </div>



        <div className="space-y-4">
          {/* Apple ID Card */}
          <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <SiApple className="text-xl" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-neutral-900">Apple ID</h3>
                  {accountData?.apple.linked ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-200 text-neutral-600">
                      Not Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500">
                  {accountData?.apple.linked
                    ? accountData.apple.email || "Registered via Sign in with Apple"
                    : "Apple account is not linked or has been disconnected"}
                </p>
                {accountData?.apple.linked && !accountData.canUnbindApple && (
                  <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1 mt-1">
                    <FiAlertTriangle className="text-xs flex-shrink-0" />
                    Link a Google account or set a password to disconnect this Apple account
                  </p>
                )}
              </div>
            </div>

            <div className="flex-shrink-0">
              {accountData?.apple.linked ? (
                <button
                  type="button"
                  onClick={handleOpenDisconnectAppleModal}
                  disabled={!accountData?.canUnbindApple || actionLoading}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${accountData?.canUnbindApple
                      ? "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm active:scale-95"
                      : "bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed"
                    }`}
                >
                  {actionLoading ? "Processing..." : "Disconnect Apple Account"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={triggerAppleSignInPrompt}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all bg-black hover:bg-neutral-800 text-white shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <SiApple className="text-sm mb-0.5" />
                  <span>{actionLoading ? "Connecting..." : "Link Apple Account"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Google Account Card */}
          <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white border border-neutral-200 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <FcGoogle className="text-2xl" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-neutral-900">Google Account</h3>
                  {accountData?.google.linked ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-200 text-neutral-600">
                      Not Linked
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500">
                  {accountData?.google.linked
                    ? accountData.google.email || "Primary email updated from Google"
                    : "Link your Google account (account email will be automatically updated)"}
                </p>
                {accountData?.google.linked && (
                  <p className="text-[11px] text-neutral-500 flex items-center gap-1 mt-1 font-medium">
                    <FiLock className="text-xs text-neutral-400" />
                    Permanent (Primary account anchor - cannot be unlinked)
                  </p>
                )}
              </div>
            </div>

            <div className="flex-shrink-0">
              {!accountData?.google.linked && accountData?.canLinkGoogle && (
                <button
                  type="button"
                  onClick={triggerGoogleSignInPrompt}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-black text-white shadow-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  <FcGoogle className="text-base" />
                  <span>{actionLoading ? "Connecting to Google..." : "Connect Google Account"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Security / Password Reset Banner */}
        <div className="p-4 rounded-2xl bg-neutral-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-cyan-400">
              <FiKey className="text-lg" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Forgot or Want to Change Password?</h4>
              <p className="text-[11px] text-neutral-400">
                Send a password recovery link to your primary account email
              </p>
            </div>
          </div>
          <Link
            href="/forgot-password"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-neutral-100 transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Reset Password</span>
            <FiExternalLink className="text-xs" />
          </Link>
        </div>
      </div>

      {/* Avatar 1:1 Cropper Modal */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        imageSrc={rawImageSrc || ""}
        onClose={() => setIsCropModalOpen(false)}
        onCropComplete={handleAvatarCropComplete}
        submitting={avatarUploading}
      />

      {/* Dedicated Apple Disconnect Confirmation Dialog */}
      <DisconnectAppleModal
        isOpen={isDisconnectAppleModalOpen}
        onClose={() => setIsDisconnectAppleModalOpen(false)}
        onConfirm={executeUnbindApple}
        submitting={actionLoading}
        appleEmail={accountData?.apple.email}
        googleEmail={accountData?.google.email || accountData?.currentEmail}
      />
    </div>
  );
}
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface UserProfile {
  _id?: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  image?: string | null;
  signupProvider?: string;
  authProviders?: string[];
  googleId?: string;
  appleId?: string;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextType {
  user: UserProfile | null;
  status: AuthStatus;
  // Session compatibility alias for next-auth migration
  data: { user: UserProfile } | null;
  session: { user: UserProfile } | null;
  loginWithCredentials: (credentials: { email: string; password: string }) => Promise<{ success: boolean; requiresEmailVerification?: boolean; email?: string; error?: string }>;
  loginWithGoogle: (params: string | { code?: string; credential?: string }) => Promise<{ success: boolean; error?: string }>;
  loginWithApple: (params: { identityToken: string; email?: string; name?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: (redirectUrl?: string) => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => void;
  refreshSession: () => Promise<UserProfile | null>;
  // Drop-in NextAuth function signatures
  signIn: (provider?: string, options?: any) => Promise<any>;
  signOut: (options?: { callbackUrl?: string; redirect?: boolean }) => Promise<void>;
  update: (data?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const router = useRouter();

  const refreshSession = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          const profile: UserProfile = {
            ...data.user,
            image: data.user.avatar || data.user.image || null,
          };
          setUser(profile);
          setStatus("authenticated");
          return profile;
        }
      }
      setUser(null);
      setStatus("unauthenticated");
      return null;
    } catch {
      setUser(null);
      setStatus("unauthenticated");
      return null;
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const loginWithCredentials = async (credentials: { email: string; password: string }) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          requiresEmailVerification: Boolean(data?.requiresEmailVerification),
          email: data?.email || credentials.email,
          error: data.message || "Invalid email or password",
        };
      }

      const profile: UserProfile = {
        ...data.user,
        image: data.user.avatar || data.user.image || null,
      };
      setUser(profile);
      setStatus("authenticated");
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || "Login failed" };
    }
  };

  const loginWithGoogle = async (params: string | { code?: string; credential?: string }) => {
    try {
      const body =
        typeof params === "string"
          ? params.length > 200
            ? { credential: params }
            : { code: params }
          : params;

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.message || "Google sign in failed" };
      }

      const userProfile = data.data || data.user;
      const profile: UserProfile = {
        ...userProfile,
        image: userProfile.avatar || userProfile.image || null,
      };
      setUser(profile);
      setStatus("authenticated");
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || "Google sign in failed" };
    }
  };

  const loginWithApple = async (params: { identityToken: string; email?: string; name?: string }) => {
    try {
      const res = await fetch("/api/auth/apple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.message || "Apple sign in failed" };
      }

      const profile: UserProfile = {
        ...data.user,
        image: data.user.avatar || data.user.image || null,
      };
      setUser(profile);
      setStatus("authenticated");
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || "Apple sign in failed" };
    }
  };

  const logout = async (redirectUrl = "/login") => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}

    setUser(null);
    setStatus("unauthenticated");
    if (redirectUrl) {
      router.push(redirectUrl);
      router.refresh();
    }
  };

  const updateUser = (data: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...data,
        image: data.avatar || data.image || prev.avatar || prev.image || null,
      };
    });
  };

  // NextAuth compatibility helpers
  const signIn = async (provider?: string, options?: any) => {
    if (provider === "credentials") {
      const res = await loginWithCredentials({
        email: options?.email,
        password: options?.password,
      });
      if (!res.success) {
        return { error: res.error, ok: false };
      }
      if (options?.callbackUrl) {
        router.push(options.callbackUrl);
      }
      return { ok: true, error: null };
    }

    if (provider === "google") {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.oauth2) {
        const clientId =
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
          "897905079551-0bm5skv53tbcpqobtlkaatmfheftthc4.apps.googleusercontent.com";
        const client = (window as any).google.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: "openid email profile",
          ux_mode: "popup",
          callback: async (response: any) => {
            if (response.code) {
              const res = await loginWithGoogle({ code: response.code });
              if (res.success && options?.callbackUrl) {
                router.push(options.callbackUrl);
                router.refresh();
              }
            }
          },
        });
        client?.requestCode();
        return { ok: true };
      }
      return { ok: false, error: "Google OAuth not ready" };
    }

    if (provider === "apple") {
      // Trigger Apple Sign In SDK
      if (typeof window !== "undefined" && (window as any).AppleID?.auth) {
        try {
          const res = await (window as any).AppleID.auth.signIn();
          if (res?.authorization?.id_token) {
            let fullName: string | undefined;
            if (res.user?.name) {
              fullName = [res.user.name.firstName, res.user.name.lastName]
                .filter(Boolean)
                .join(" ");
            }
            const authRes = await loginWithApple({
              identityToken: res.authorization.id_token,
              email: res.user?.email,
              name: fullName,
            });
            if (authRes.success && options?.callbackUrl) {
              router.push(options.callbackUrl);
            }
            return { ok: authRes.success, error: authRes.error };
          }
        } catch (err: any) {
          return { ok: false, error: err?.error || "Apple sign-in cancelled" };
        }
      }
      return { ok: false, error: "Apple SDK not ready" };
    }

    return { ok: false, error: "Unsupported provider" };
  };

  const signOut = async (options?: { callbackUrl?: string; redirect?: boolean }) => {
    const targetUrl = options?.callbackUrl || "/login";
    await logout(options?.redirect === false ? "" : targetUrl);
  };

  const update = async (newData?: any) => {
    if (newData) {
      updateUser(newData);
    } else {
      await refreshSession();
    }
  };

  const sessionObj = user ? { user } : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        data: sessionObj,
        session: sessionObj,
        loginWithCredentials,
        loginWithGoogle,
        loginWithApple,
        logout,
        updateUser,
        refreshSession,
        signIn,
        signOut,
        update,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// NextAuth useSession compatibility hook
export function useSession() {
  const auth = useAuth();
  return {
    data: auth.session,
    status: auth.status,
    update: auth.update,
  };
}

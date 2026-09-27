"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { CartProvider, DiscountProvider } from "@/context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ToastContainer, toast } from "@/components/ui/Toast";
import axios from "axios";

interface CartItems {
  product: {
    _id: string;
    name: string;
    price: number;
    image_thumbnail: string;
  };
  quantity: number;
}

function AuthSessionGuard() {
  const pathname = usePathname();
  const { logout, status, refreshSession } = useAuth();

  useEffect(() => {
    let isLoggingOut = false;
    let isRefreshing = false;
    let failedQueue: Array<{
      resolve: (value?: any) => void;
      reject: (reason?: any) => void;
    }> = [];

    const processQueue = (error: any = null) => {
      failedQueue.forEach((prom) => {
        if (error) {
          prom.reject(error);
        } else {
          prom.resolve();
        }
      });
      failedQueue = [];
    };

    // Only guard protected routes when user is authenticated
    const isProtectedRoute =
      pathname.startsWith("/account") ||
      pathname.startsWith("/cart") ||
      pathname.startsWith("/checkout") ||
      pathname.startsWith("/likes");

    const triggerAutoLogout = async () => {
      if (isLoggingOut || status !== "authenticated" || !isProtectedRoute) return;
      isLoggingOut = true;

      toast.warning(
        "Session Expired",
        "Your session has expired. Redirecting to sign in..."
      );

      await logout("/login?session_expired=true");
    };

    // Axios 401 response interceptor with automatic refresh
    const axiosInterceptor = axios.interceptors.response.use(
      (res) => res,
      async (error) => {
        const originalRequest = error?.config;
        const status401 = error?.response?.status === 401;

        if (status401 && originalRequest && !originalRequest._retry) {
          const url = originalRequest.url || "";
          const isAuthEndpoint =
            url.includes("/api/auth/refresh") ||
            url.includes("/api/auth/login") ||
            url.includes("/api/auth/logout") ||
            url.includes("/login");

          if (!isAuthEndpoint) {
            if (isRefreshing) {
              return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
              })
                .then(() => axios(originalRequest))
                .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
              const refreshRes = await fetch("/api/auth/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              });

              if (refreshRes.ok) {
                processQueue(null);
                isRefreshing = false;
                await refreshSession();
                return axios(originalRequest);
              }
            } catch (refreshErr) {
              processQueue(refreshErr);
            } finally {
              isRefreshing = false;
            }

            // Only trigger auto logout if refresh truly failed on a protected route
            if (status === "authenticated" && isProtectedRoute) {
              triggerAutoLogout();
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(axiosInterceptor);
    };
  }, [pathname, status, logout, refreshSession]);

  return null;
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItems[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <DiscountProvider.Provider value={{ discount, setDiscount }}>
      <CartProvider.Provider value={{ cart, setCart }}>
        <AuthProvider>
          <AuthSessionGuard />
          <AntdRegistry>
            <main className="flex flex-col min-h-screen">
              {!isAuthPage && (
                <header className="sticky top-0 z-20 w-full print:hidden">
                  <Navbar />
                </header>
              )}
              <div className="flex-1 w-full">{children}</div>
              {!isAuthPage && (
                <footer className="mt-auto print:hidden">
                  <Footer />
                </footer>
              )}
            </main>
            <div className="print:hidden">
              <ToastContainer />
            </div>
          </AntdRegistry>
        </AuthProvider>
      </CartProvider.Provider>
    </DiscountProvider.Provider>
  );
}

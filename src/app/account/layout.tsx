"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FiUser, FiMapPin, FiPackage } from "react-icons/fi";

import { useState, useEffect } from "react";
import { getImageUrl } from "@/helper";

export default function LayoutProfile({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { session, logout } = useAuth();

  const [userAvatar, setUserAvatar] = useState<string | null>(session?.user?.image || null);
  const [userName, setUserName] = useState<string | null>(session?.user?.name || null);
  const [userEmail, setUserEmail] = useState<string | null>(session?.user?.email || null);
  const [imgError, setImgError] = useState<boolean>(false);

  useEffect(() => {
    if (session?.user?.image) {
      setUserAvatar(session.user.image);
      setImgError(false);
    }
    if (session?.user?.name) {
      setUserName(session.user.name);
    }
    if (session?.user?.email) {
      setUserEmail(session.user.email);
    }
  }, [session?.user?.image, session?.user?.name, session?.user?.email]);

  useEffect(() => {
    fetch("/api/auth/profile")
      .then((res) => {
        if (res.status === 401) {
          logout("/login?session_expired=true");
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        const u = data?.data?.user;
        if (u) {
          if (u.avatar) {
            setUserAvatar(u.avatar);
            setImgError(false);
          }
          if (u.name) setUserName(u.name);
          if (u.email) setUserEmail(u.email);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleAvatarUpdated = (e: any) => {
      if (e.detail) {
        setUserAvatar(e.detail);
        setImgError(false);
      }
    };
    const handleProfileUpdated = (e: any) => {
      if (e.detail?.name) setUserName(e.detail.name);
      if (e.detail?.email) setUserEmail(e.detail.email);
      if (e.detail?.avatar) {
        setUserAvatar(e.detail.avatar);
        setImgError(false);
      }
    };

    window.addEventListener("avatar-updated", handleAvatarUpdated);
    window.addEventListener("profile-updated", handleProfileUpdated);
    return () => {
      window.removeEventListener("avatar-updated", handleAvatarUpdated);
      window.removeEventListener("profile-updated", handleProfileUpdated);
    };
  }, []);

  const isDetailPage =
    pathname.startsWith("/account/order/") ||
    pathname.startsWith("/account/address/edit-alamat") ||
    pathname.startsWith("/account/address/create-alamat");

  const navLinks = [
    { name: "My Profile", href: "/account", icon: FiUser },
    { name: "Delivery Addresses", href: "/account/address", icon: FiMapPin },
    { name: "Order History", href: "/account/order", icon: FiPackage },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {!isDetailPage && (
          <aside className="w-full md:w-64 flex-shrink-0 rounded-3xl bg-white p-6 border border-neutral-200/80 shadow-sm space-y-6">
            {/* User Profile Card */}
            <div className="flex items-center gap-3 pb-6 border-b border-neutral-100">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-900 text-white flex items-center justify-center font-bold text-base uppercase shadow-sm flex-shrink-0 ring-1 ring-neutral-200">
                {userAvatar && !imgError ? (
                  <img
                    src={getImageUrl(userAvatar)}
                    alt="User Avatar"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (userName || session?.user?.name || "U")[0]
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm text-neutral-900 truncate">
                  {userName || session?.user?.name || "Cyber Customer"}
                </h3>
                <p className="text-[11px] text-neutral-400 truncate">
                  {userEmail || session?.user?.email}
                </p>
              </div>
            </div>

            {/* Nav links */}
            <nav className="space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-neutral-900 text-white shadow-sm"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                    }`}
                  >
                    <Icon className="text-base" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}

        <div className="flex-1 w-full min-w-0">{children}</div>
      </div>
    </div>
  );
}
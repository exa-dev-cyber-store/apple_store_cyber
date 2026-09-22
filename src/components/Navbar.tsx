"use client";

import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HiMagnifyingGlass, HiOutlineShoppingBag, HiXMark, HiBars3 } from "react-icons/hi2";
import { IoHeartOutline } from "react-icons/io5";
import axios from "axios";
import { FormEvent, useContext, useEffect, useState, useRef } from "react";
import { CartProvider, CartType } from "@/context";
import { formatRupiah, getImageUrl } from "@/helper";
import NotificationDropdown from "./NotificationDropdown";

export default function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const cartContext = useContext(CartProvider);
  const cart = cartContext?.cart || [];
  const setCart = cartContext?.setCart;

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cartDropdownOpen, setCartDropdownOpen] = useState<boolean>(false);
  const { user, status, logout } = useAuth();
  const session = user ? { user } : null;

  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [imgError, setImgError] = useState<boolean>(false);

  const hasFetchedProfileRef = useRef(false);
  const hasFetchedCartRef = useRef(false);

  useEffect(() => {
    if (session?.user) {
      if (session.user.image) {
        setUserAvatar(session.user.image);
        setImgError(false);
      }
      if (session.user.name) {
        setUserName(session.user.name);
      }
      if (session.user.email) {
        setUserEmail(session.user.email);
      }
    }
  }, [session?.user?.image, session?.user?.name, session?.user?.email]);

  useEffect(() => {
    if (status === "authenticated" && !hasFetchedProfileRef.current) {
      hasFetchedProfileRef.current = true;
      fetch("/api/auth/profile")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const u = data?.data?.user;
          if (u) {
            if (u.avatar) {
              setUserAvatar(u.avatar);
              setImgError(false);
            }
            if (u.name) {
              setUserName(u.name);
            }
            if (u.email) {
              setUserEmail(u.email);
            }
          }
        })
        .catch(() => {});
    } else if (status === "unauthenticated") {
      hasFetchedProfileRef.current = false;
      setUserAvatar(null);
      setUserName(null);
      setUserEmail(null);
    }
  }, [status]);

  useEffect(() => {
    const handleAvatarUpdated = (e: any) => {
      const url = e.detail;
      if (url) {
        setUserAvatar(url);
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

  useEffect(() => {
    if (status === "authenticated" && setCart && !hasFetchedCartRef.current) {
      hasFetchedCartRef.current = true;
      axios.get("/api/cart").then((res) => {
        if (res.data?.products) {
          setCart(res.data.products);
        }
      }).catch(() => {});
    } else if (status === "unauthenticated") {
      hasFetchedCartRef.current = false;
    }
  }, [status, setCart]);

  const handleLogout = async () => {
    await logout("/");
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const category = searchParams.get("category");
    if (pathname !== "/shop") {
      router.push(`/shop?q=${encodeURIComponent(searchQuery)}`);
    } else if (category) {
      router.push(`/shop?category=${category}&q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/shop?q=${encodeURIComponent(searchQuery)}`);
    }
    setMobileMenuOpen(false);
  };

  const totalQuantity = cart.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const totalPrice = cart.reduce(
    (acc, item) => acc + (item.product?.price || 0) * (item.quantity || 0),
    0
  );

  const navCategories = [
    { name: "Store", href: "/shop" },
    { name: "Mac", href: "/shop?category=MacBook" },
    { name: "iPad", href: "/shop?category=iPad" },
    { name: "iPhone", href: "/shop?category=iPhone" },
    { name: "Watch", href: "/shop?category=Apple%20Watch" },
    { name: "AirPods", href: "/shop?category=AirPods" },
  ];

  return (
    <header className="glass-nav sticky top-0 z-50 w-full transition-all duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-1.5 sm:gap-4">
          {/* Brand / Logo */}
          <Link
            href="/"
            className="flex items-center gap-1.5 sm:gap-2.5 group transition-transform duration-200 hover:scale-[1.02] shrink-0"
          >
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl p-[1px] bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 shadow-[0_0_12px_rgba(6,182,212,0.4)] group-hover:shadow-[0_0_18px_rgba(6,182,212,0.7)] transition-all overflow-hidden flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#080b11] rounded-[10px] sm:rounded-[11px] flex items-center justify-center p-1">
                <Image
                  src="/logo.png"
                  alt="Cyber Apple Logo"
                  width={26}
                  height={26}
                  className="w-full h-full object-contain drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]"
                  priority
                />
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-extrabold tracking-tight text-sm sm:text-base md:text-lg text-neutral-900 group-hover:text-black transition-colors whitespace-nowrap">
                Cyber<span className="text-cyan-600">Apple</span>
              </span>
              <span className="hidden min-[380px]:inline-block text-[8px] sm:text-[9px] uppercase font-black tracking-widest px-1 sm:px-1.5 py-0.5 bg-neutral-950 text-cyan-300 rounded-md border border-cyan-500/20 shadow-xs">
                STORE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-7 text-xs xl:text-[13px] font-medium text-neutral-600 whitespace-nowrap">
            <Link
              href="/"
              className={`transition hover:text-black ${
                pathname === "/" ? "text-black font-semibold" : ""
              }`}
            >
              Home
            </Link>
            {navCategories.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="transition hover:text-black hover:opacity-100"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Action Icons & Search */}
          <div className="flex items-center gap-0.5 sm:gap-2 md:gap-3 shrink-0">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="relative hidden xl:block">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-36 xl:w-48 focus:w-60 bg-neutral-100/90 hover:bg-neutral-100 focus:bg-white text-xs pl-8 pr-3 py-1.5 rounded-full border border-neutral-200/80 focus:border-neutral-400 focus:outline-none transition-all duration-300 placeholder:text-neutral-400"
              />
              <HiMagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none" />
            </form>

            {/* Wishlist Link */}
            <Link
              href="/likes"
              aria-label="Wishlist"
              className="relative p-1.5 sm:p-2 text-neutral-600 hover:text-black transition-colors rounded-full hover:bg-neutral-100/80"
            >
              <IoHeartOutline className="text-lg sm:text-xl" />
            </Link>

            {/* Notification Center Dropdown */}
            <NotificationDropdown />

            {/* Cart Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setCartDropdownOpen(!cartDropdownOpen)}
                aria-label="Shopping Cart"
                className="relative p-1.5 sm:p-2 text-neutral-600 hover:text-black transition-colors rounded-full hover:bg-neutral-100/80 flex items-center"
              >
                <HiOutlineShoppingBag className="text-lg sm:text-xl" />
                {totalQuantity > 0 && (
                  <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-black text-[8px] sm:text-[9px] font-bold text-white shadow-sm">
                    {totalQuantity}
                  </span>
                )}
              </button>

              {/* Cart Quick Preview Dropdown */}
              {cartDropdownOpen && (
                <div
                  onMouseLeave={() => setCartDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-[320px] sm:w-80 md:w-96 rounded-2xl bg-white/95 backdrop-blur-xl border border-neutral-200 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <h4 className="font-semibold text-sm text-neutral-900">
                      Bag ({totalQuantity})
                    </h4>
                    <Link
                      href="/cart"
                      onClick={() => setCartDropdownOpen(false)}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      View All
                    </Link>
                  </div>

                  {cart.length === 0 ? (
                    <div className="py-8 text-center text-neutral-400">
                      <HiOutlineShoppingBag className="mx-auto text-3xl mb-2 opacity-50" />
                      <p className="text-xs">Your bag is empty.</p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto divide-y divide-neutral-100 my-2">
                      {cart.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 py-2.5">
                          <div className="relative w-12 h-12 aspect-square flex-shrink-0 bg-neutral-50 rounded-xl p-1 border border-neutral-100 flex items-center justify-center overflow-hidden">
                            <Image
                              src={getImageUrl(item.product?.image_thumbnail)}
                              alt={item.product?.name || "Product"}
                              fill
                              sizes="48px"
                              className="object-contain p-0.5"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-neutral-900 truncate">
                              {item.product?.name}
                            </p>
                            <p className="text-[11px] text-neutral-500">
                              Qty: {item.quantity} × {formatRupiah(item.product?.price || 0)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {cart.length > 0 && (
                    <div className="pt-3 border-t border-neutral-100">
                      <div className="flex justify-between items-center mb-3 text-xs">
                        <span className="text-neutral-500">Total:</span>
                        <span className="font-bold text-neutral-900">
                          {formatRupiah(totalPrice)}
                        </span>
                      </div>
                      <Link
                        href="/cart"
                        onClick={() => setCartDropdownOpen(false)}
                        className="block w-full py-2 bg-neutral-900 hover:bg-black text-white text-center text-xs font-medium rounded-full transition-transform active:scale-95"
                      >
                        Review Bag & Checkout
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Auth / Account Profile */}
            {status === "authenticated" ? (
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  aria-label="User account menu"
                  className="flex items-center gap-1.5 p-0.5 rounded-full hover:bg-neutral-100 transition-colors"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[11px] sm:text-xs font-semibold uppercase overflow-hidden flex-shrink-0 shadow-xs ring-1 ring-neutral-200">
                    {userAvatar && !imgError ? (
                      <img
                        src={getImageUrl(userAvatar)}
                        alt={userName || "User Avatar"}
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (userName || session?.user?.name || "U")[0]
                    )}
                  </div>
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu p-2 shadow-2xl bg-white/95 backdrop-blur-xl rounded-2xl w-52 sm:w-56 max-w-[calc(100vw-24px)] mt-2 border border-neutral-200 z-50 text-xs"
                >
                  <li className="px-3 py-2 border-b border-neutral-100 mb-1 pointer-events-none">
                    <div className="flex items-center gap-2.5 p-0">
                      <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold uppercase overflow-hidden flex-shrink-0">
                        {userAvatar && !imgError ? (
                          <img
                            src={getImageUrl(userAvatar)}
                            alt={userName || "User"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (userName || session?.user?.name || "U")[0]
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-900 truncate text-xs">
                          {userName || session?.user?.name || "Cyber Customer"}
                        </p>
                        <p className="text-[10px] text-neutral-400 truncate">
                          {userEmail || session?.user?.email}
                        </p>
                      </div>
                    </div>
                  </li>
                  <li>
                    <Link href="/account" className="py-2 hover:bg-neutral-100 rounded-lg">
                      My Profile
                    </Link>
                  </li>
                  <li>
                    <Link href="/account/order" className="py-2 hover:bg-neutral-100 rounded-lg">
                      Order History
                    </Link>
                  </li>
                  <li>
                    <Link href="/account/address" className="py-2 hover:bg-neutral-100 rounded-lg">
                      Saved Addresses
                    </Link>
                  </li>
                  <li className="border-t border-neutral-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="text-red-600 hover:bg-red-50 rounded-lg py-2"
                    >
                      Sign Out
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center text-xs font-medium px-3.5 py-1.5 rounded-full bg-neutral-900 hover:bg-black text-white transition-transform active:scale-95"
              >
                Sign In
              </Link>
            )}

            {/* Mobile / Tablet Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 text-neutral-600 hover:text-black rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <HiXMark className="text-xl sm:text-2xl" /> : <HiBars3 className="text-xl sm:text-2xl" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Responsive Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-3">
          <form onSubmit={handleSearch} className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-neutral-100 text-xs pl-8 pr-3 py-2 rounded-xl border border-neutral-200 focus:outline-none"
            />
            <HiMagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
          </form>

          <div className="flex flex-col space-y-2 text-sm font-medium">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-neutral-700 hover:text-black"
            >
              Home
            </Link>
            {navCategories.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 text-neutral-700 hover:text-black"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
            {status === "authenticated" ? (
              <div className="flex items-center justify-between w-full">
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 text-xs font-semibold text-neutral-800"
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold uppercase overflow-hidden flex-shrink-0 shadow-xs ring-1 ring-neutral-200">
                    {userAvatar && !imgError ? (
                      <img
                        src={getImageUrl(userAvatar)}
                        alt={userName || "User"}
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (userName || session?.user?.name || "U")[0]
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="font-semibold text-neutral-900 truncate">{userName || session?.user?.name}</p>
                    <p className="text-[10px] text-neutral-400 truncate">Manage Profile</p>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs text-red-600 font-medium px-2.5 py-1.5 hover:bg-red-50 rounded-xl transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 bg-neutral-900 text-white rounded-xl text-center text-xs font-medium"
              >
                Sign In to Cyber Store
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
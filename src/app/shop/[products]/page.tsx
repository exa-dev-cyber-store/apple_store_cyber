"use client";

import { CardProps } from "@/components/type";
import Image from "next/image";
import { useContext, useEffect, useState } from "react";
import { formatRupiah, getImageUrl } from "@/helper";
import AnotherProducts from "@/components/shop/AnotherProducts";
import Loading from "./loading";
import Link from "next/link";
import ReviewSec from "@/components/shop/ReviewSec";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import { CartProvider } from "@/context";
import { IoHeartOutline, IoHeart } from "react-icons/io5";
import { HiOutlineShoppingBag, HiCheck, HiShieldCheck } from "react-icons/hi2";
import { FiTruck, FiRotateCcw, FiChevronRight } from "react-icons/fi";

export default function Detail({ params: { products } }: { params: { products: string } }) {
  const [product, setProduct] = useState({} as CardProps);
  const [images, setImages] = useState<string[]>([]);
  const [thisFavorite, setThisFavorite] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [favorite, setFavorite] = useState<{ _id: string }[]>([]);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isActiveImage, setIsActiveImage] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const cartContext = useContext(CartProvider);
  const router = useRouter();
  const { status } = useAuth();
  const cart = cartContext?.cart || [];
  const setCart = cartContext?.setCart;

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/like")
      .then((res) => (res.status === 200 ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setFavorite(data);
          const isFav = data.some((item) => item._id === products);
          setThisFavorite(isFav);
        }
      })
      .catch(() => {});
  }, [status, products]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${products}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data || data?._id) {
          const raw = data?.data || data;
          const p = (raw?.data && raw?.success !== undefined && !raw._id) ? raw.data : (raw?._doc || raw);
          if (p && (p._id || p.name)) {
            setProduct(p);
            const allImgs = [
              p.image_thumbnail,
              ...(Array.isArray(p.image_details) ? p.image_details : []),
            ].filter(Boolean);
            // Deduplicate
            const uniqueImgs = Array.from(new Set(allImgs));
            setImages(uniqueImgs);
            setIsActiveImage(p.image_thumbnail || uniqueImgs[0] || "");
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [products]);

  const handleLike = async () => {
    if (status !== "authenticated") {
      return router.push("/login");
    }
    try {
      const res = await axios.post("/api/like", {
        productId: product._id,
      });
      if (res.status === 200) {
        setThisFavorite(!thisFavorite);
        if (thisFavorite) {
          setFavorite(favorite.filter((item) => item._id !== product._id));
        } else {
          setFavorite([...favorite, { _id: product._id }]);
        }
      }
    } catch {}
  };

  const handleAddToCart = async () => {
    if (status !== "authenticated") {
      return router.push("/login");
    }

    try {
      const res = await axios.post("/api/cart/add", {
        productId: product._id,
      });

      if (res.status === 200) {
        setShowToast(true);
        if (setCart) {
          const existing = cart.find((item) => item.product?._id === product._id);
          if (existing) {
            setCart(
              cart.map((item) =>
                item.product?._id === product._id
                  ? { ...item, quantity: (item.quantity || 1) + quantity }
                  : item
              )
            );
          } else {
            setCart([
              ...cart,
              {
                product: {
                  _id: product._id,
                  name: product.name,
                  price: product.price,
                  image_thumbnail: product.image_thumbnail,
                },
                quantity: quantity,
              },
            ]);
          }
        }
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="w-full py-16">
        <Loading />
      </div>
    );
  }

  if (!product._id) {
    return (
      <div className="text-center py-24">
        <h2 className="text-xl font-bold text-neutral-800">Product Not Found</h2>
        <Link href="/shop" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const originalPrice = Math.round(product.price * 1.15);
  const categoryName =
    typeof product.category === "object" ? product.category?.name : product.category;

  return (
    <div className="w-full pb-20">
      {/* Toast Notification */}
      <div
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-neutral-900/95 text-white px-5 py-3.5 shadow-2xl backdrop-blur-md border border-neutral-700 transition-all duration-300 ${
          showToast ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
        }`}
      >
        <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <HiCheck className="text-base" />
        </div>
        <div>
          <p className="text-xs font-semibold">Added to Bag</p>
          <p className="text-[11px] text-neutral-400">{product.name} is now in your shopping bag.</p>
        </div>
      </div>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-neutral-400 mb-8">
        <Link href="/shop" className="hover:text-black transition-colors">
          Shop
        </Link>
        <FiChevronRight className="text-[10px]" />
        {categoryName && (
          <>
            <Link
              href={`/shop?category=${encodeURIComponent(categoryName)}`}
              className="hover:text-black transition-colors"
            >
              {categoryName}
            </Link>
            <FiChevronRight className="text-[10px]" />
          </>
        )}
        <span className="text-neutral-900 font-medium truncate max-w-xs sm:max-w-md">
          {product.name}
        </span>
      </nav>

      {/* Main Flagship Product Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-sm">
        {/* Left: Gallery (Thumbnails + Main Stage) */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-6 items-center sm:items-start">
          {/* Thumbnails list */}
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-x-hidden sm:overflow-y-auto max-h-[480px] p-2 no-scrollbar flex-shrink-0">
              {images.map((img, idx) => {
                const isSelected = isActiveImage === img;
                return (
                  <button
                    key={idx}
                    onClick={() => setIsActiveImage(img)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 aspect-square flex-shrink-0 rounded-2xl p-2 bg-neutral-50 border transition-all duration-200 ${
                      isSelected
                        ? "border-neutral-900 ring-2 ring-neutral-900/10 scale-105"
                        : "border-neutral-200/80 hover:border-neutral-400 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={getImageUrl(img)}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Large Active Preview Stage */}
          <div className="relative flex-1 w-full aspect-square max-h-[480px] rounded-3xl bg-neutral-50 flex items-center justify-center p-8 border border-neutral-100">
            <Image
              src={getImageUrl(isActiveImage)}
              alt={product.name}
              width={460}
              height={460}
              priority
              className="max-h-full w-auto object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>

        {/* Right: Specs, Pricing, Buy Actions */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Category badge */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-neutral-100 text-neutral-600">
                {categoryName || "Apple Original"}
              </span>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
                <HiShieldCheck className="text-sm" /> Official Warranty
              </div>
            </div>

            {/* Product Title */}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 leading-tight">
              {product.name}
            </h1>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
                  {formatRupiah(product.price)}
                </span>
                <span className="text-sm text-neutral-400 line-through">
                  {formatRupiah(originalPrice)}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Or 0% installment starting from {formatRupiah(Math.round(product.price / 12))}/month with credit card.
              </p>
            </div>

            {/* Description */}
            <div className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-h-48 overflow-y-auto pr-2 no-scrollbar">
              <p className="whitespace-pre-line">{product.description}</p>
            </div>

            {/* Quantity Selector */}
            <div className="pt-2 flex items-center gap-3">
              <span className="text-xs font-semibold text-neutral-700">Quantity:</span>
              <div className="inline-flex items-center rounded-full border border-neutral-300 bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:text-black font-bold"
                >
                  -
                </button>
                <span className="px-3 py-1.5 text-xs font-semibold min-w-[32px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:text-black font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-full bg-neutral-900 hover:bg-black text-white text-sm font-semibold transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <HiOutlineShoppingBag className="text-lg" /> Add to Bag
              </button>
              <button
                onClick={handleLike}
                aria-label="Wishlist"
                className={`p-4 rounded-full border transition-all duration-200 ${
                  thisFavorite
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-neutral-200 hover:border-neutral-400 text-neutral-700 bg-white"
                }`}
              >
                {thisFavorite ? (
                  <IoHeart className="text-xl" />
                ) : (
                  <IoHeartOutline className="text-xl" />
                )}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-neutral-50 text-[11px] text-neutral-600">
                <FiTruck className="text-base text-neutral-800 flex-shrink-0" />
                <span>Free delivery in 2-3 business days</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-neutral-50 text-[11px] text-neutral-600">
                <FiRotateCcw className="text-base text-neutral-800 flex-shrink-0" />
                <span>14-day hassle-free return policy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="mt-16">
        <ReviewSec />
      </div>

      {/* Related Products Recommendation */}
      <div className="mt-16">
        <AnotherProducts
          id={product._id}
          category={categoryName || ""}
          favorite={favorite}
          setFavorite={setFavorite}
        />
      </div>
    </div>
  );
}
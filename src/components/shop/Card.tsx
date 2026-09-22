"use client";

import Image from "next/image";
import { CardProps } from "../type";
import { formatRupiah, getImageUrl } from "@/helper";
import { IoHeartOutline, IoHeart } from "react-icons/io5";
import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { CartProvider } from "@/context";
import { HiOutlineShoppingBag, HiCheck } from "react-icons/hi2";

interface CardShopProps {
  product: CardProps;
  setShow?: (show: boolean) => void;
  favorite?: { _id: string }[];
  setFavorite?: (favorite: { _id: string }[]) => void;
}

export default function CardShop({
  product,
  setShow,
  favorite = [],
  setFavorite,
}: CardShopProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);
  const { status } = useAuth();
  const router = useRouter();
  const cartContext = useContext(CartProvider);
  const cart = cartContext?.cart || [];
  const setCart = cartContext?.setCart;

  useEffect(() => {
    if (favorite && favorite.length > 0) {
      const isFav = favorite.some((item) => item._id === product._id);
      setIsFavorite(isFav);
    }
  }, [favorite, product._id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    try {
      const res = await axios.post("/api/like", {
        productId: product._id,
      });
      if (res.status === 200) {
        setIsFavorite(!isFavorite);
        if (setFavorite) {
          const exists = favorite.some((item) => item._id === product._id);
          if (exists) {
            setFavorite(favorite.filter((item) => item._id !== product._id));
          } else {
            setFavorite([...favorite, { _id: product._id }]);
          }
        }
      }
    } catch {}
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }

    try {
      const res = await axios.post("/api/cart/add", {
        productId: product._id,
      });

      if (res.status === 200) {
        setAddedAnim(true);
        setTimeout(() => setAddedAnim(false), 1800);
        if (setShow) {
          setShow(true);
        }

        if (setCart) {
          const existing = cart.find((item) => item.product?._id === product._id);
          if (existing) {
            setCart(
              cart.map((item) =>
                item.product?._id === product._id
                  ? { ...item, quantity: (item.quantity || 1) + 1 }
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
                quantity: 1,
              },
            ]);
          }
        }
      }
    } catch {}
  };

  // Mock strikethrough price for Apple retail presentation
  const originalPrice = Math.round(product.price * 1.15);
  const categoryName =
    typeof product.category === "object" ? product.category?.name : product.category;

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl bg-white p-5 border border-neutral-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {/* Top action pills */}
      <div className="flex items-center justify-between z-10">
        {categoryName ? (
          <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600">
            {categoryName}
          </span>
        ) : (
          <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600">
            Apple
          </span>
        )}

        <button
          onClick={handleLike}
          aria-label="Wishlist"
          className="p-2 rounded-full bg-neutral-100/80 hover:bg-neutral-200/90 text-neutral-600 transition-colors"
        >
          {isFavorite ? (
            <IoHeart className="text-red-500 text-lg transition-transform scale-110" />
          ) : (
            <IoHeartOutline className="text-lg hover:text-red-500 transition-colors" />
          )}
        </button>
      </div>

      {/* Product Image */}
      <Link
        href={`/shop/${product._id}`}
        className="relative my-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-neutral-50/60 p-4"
      >
        <Image
          src={getImageUrl(product.image_thumbnail)}
          alt={product.name}
          width={400}
          height={400}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      {/* Product Information */}
      <div className="flex flex-col">
        <Link href={`/shop/${product._id}`}>
          <h3 className="font-semibold text-neutral-900 text-base line-clamp-1 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-neutral-500 text-xs mt-1 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Pricing */}
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
          <span className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
            {formatRupiah(product.price)}
          </span>
          <span className="text-xs text-neutral-400 line-through whitespace-nowrap">
            {formatRupiah(originalPrice)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-2">
          <Link
            href={`/shop/${product._id}`}
            className="flex-1 py-2.5 px-3 text-center text-xs font-semibold rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-colors"
          >
            Explore
          </Link>
          <button
            onClick={handleAddToCart}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold rounded-full transition-all duration-200 active:scale-95 ${
              addedAnim
                ? "bg-green-600 text-white"
                : "bg-neutral-900 hover:bg-black text-white"
            }`}
          >
            {addedAnim ? (
              <>
                <HiCheck className="text-sm" /> Added
              </>
            ) : (
              <>
                <HiOutlineShoppingBag className="text-sm" /> Bag
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
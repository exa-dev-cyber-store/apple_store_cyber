"use client";

import { CardProps } from "@/components/type";
import { useEffect, useState } from "react";
import Loading from "./loading";
import CardShop from "@/components/shop/Card";
import axios from "axios";
import { IoHeartOutline } from "react-icons/io5";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";

export default function Likes() {
  const [data, setData] = useState<CardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const { status } = useAuth();

  useEffect(() => {
    setLoading(true);
    fetch("/api/like")
      .then((res) => (res.status === 200 ? res.json() : []))
      .then((resData) => {
        const list = Array.isArray(resData) ? resData : (resData?.data || resData?.likes || []);
        setData(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const removeFavorite = async (id: string) => {
    try {
      const res = await axios.post("/api/like", {
        productId: id,
      });
      if (res.status === 200) {
        setData((prev) => prev.filter((item) => item._id !== id));
      }
    } catch {}
  };

  if (loading) {
    return <Loading />;
  }

  if (status !== "authenticated") {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-neutral-400">
          <IoHeartOutline className="text-3xl" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900">Sign In to View Wishlist</h2>
        <p className="text-xs text-neutral-500 mt-2">
          Save your favorite Apple devices and sync them across all your sessions.
        </p>
        <div className="pt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold"
          >
            Sign In Now <FiArrowRight />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[70vh]">
      {/* Header */}
      <div className="pb-6 border-b border-neutral-200 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
          Wishlist & Saved Items
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          {data.length} saved {data.length === 1 ? "device" : "devices"} in your personal collection
        </p>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-20 px-4 max-w-md mx-auto rounded-3xl bg-neutral-50 border border-neutral-200/60">
          <div className="w-16 h-16 rounded-full bg-neutral-200/60 flex items-center justify-center mx-auto mb-4 text-neutral-400">
            <IoHeartOutline className="text-3xl" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900">Your Wishlist is Empty</h3>
          <p className="text-xs text-neutral-500 mt-1">
            Tap the heart icon on any device to save it here for quick access later.
          </p>
          <div className="pt-5">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-semibold"
            >
              Browse Catalog <FiArrowRight />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.map((item) => (
            <CardShop
              key={item._id}
              product={item}
              favorite={data.map((d) => ({ _id: d._id }))}
              setFavorite={(newFavs) => {
                const still = newFavs.some((f) => f._id === item._id);
                if (!still) removeFavorite(item._id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
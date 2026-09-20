"use client";

import { CardProps } from "@/components/type";
import { useEffect, useState } from "react";
import CardShop from "@/components/shop/Card";
import CardSkeleton from "@/components/shop/CardSkeleton";
import PaginationShop from "@/components/shop/Pagination";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { HiCheck, HiOutlineShoppingBag } from "react-icons/hi2";
import { FiSearch } from "react-icons/fi";

export default function Shop() {
  const [showToast, setShowToast] = useState(false);
  const { status } = useAuth();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const q = searchParams.get("q");

  const [details, setDetails] = useState<{
    count: number;
    products: CardProps[];
    totalPage: number;
  }>({
    count: 0,
    products: [],
    totalPage: 1,
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [favorite, setFavorite] = useState<{ _id: string }[]>([]);
  const [sortBy, setSortBy] = useState<string>("default");

  useEffect(() => {
    setCurrentPage(1);
  }, [category, q]);

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
        const list = Array.isArray(data) ? data : (data?.data || data?.likes || []);
        if (Array.isArray(list)) setFavorite(list);
      })
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    setLoading(true);
    const limit = 12;
    const skip = limit * (currentPage - 1);
    const url = `/api/products?category=${encodeURIComponent(
      category || ""
    )}&limit=${limit}&skip=${skip}&q=${encodeURIComponent(
      q || ""
    )}&sort=${encodeURIComponent(sortBy)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const payload = (data && data.products) ? data : (data?.data && data?.data?.products) ? data.data : data;
        if (payload && payload.products) {
          setDetails({
            count: payload.count || 0,
            products: payload.products || [],
            totalPage: payload.page || 1,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, currentPage, q, sortBy]);

  return (
    <div className="w-full">
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
          <p className="text-[11px] text-neutral-400">View your shopping bag anytime</p>
        </div>
      </div>

      {/* Header bar: Filter summary & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200/80 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            {category ? category : "All Products"}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {q ? (
              <span>
                Search results for &quot;<strong className="text-neutral-800">{q}</strong>&quot; &bull;{" "}
              </span>
            ) : null}
            Showing <span className="font-semibold text-neutral-900">{details.count}</span> authentic Apple products
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white text-xs font-medium text-neutral-800 border border-neutral-200/80 rounded-xl px-3 py-2 outline-none focus:border-neutral-400 transition-colors cursor-pointer"
          >
            <option value="default">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Alphabetical (A-Z)</option>
            <option value="name-desc">Alphabetical (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Main Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : details.products.length === 0 ? (
        <div className="text-center py-24 px-4 rounded-3xl bg-neutral-50 border border-neutral-200/60 my-6">
          <div className="w-16 h-16 rounded-full bg-neutral-200/80 flex items-center justify-center mx-auto mb-4 text-neutral-400">
            <FiSearch className="text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900">No Products Found</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            We couldn&apos;t find any Apple products matching your criteria. Try adjusting your search or category filter.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {details.products.map((product: CardProps) => (
              <CardShop
                key={product._id}
                setShow={setShowToast}
                product={product}
                favorite={favorite}
                setFavorite={setFavorite}
              />
            ))}
          </div>

          {/* Pagination */}
          <PaginationShop
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            totalPages={details.totalPage}
          />
        </>
      )}
    </div>
  );
}
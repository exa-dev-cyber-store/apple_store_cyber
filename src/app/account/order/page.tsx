"use client";

import { OrderListSkeleton } from "@/components/ui/Skeleton";
import { formatRupiah } from "@/helper";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  FiPackage,
  FiFileText,
  FiArrowRight,
  FiCreditCard,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

interface Order {
  _id: string;
  status_payment: string;
  status_delivery: string;
  payment_method: string;
  total: number;
  createdAt?: string;
  order_items: {
    _id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
}

type StatusFilter = "all" | "pending" | "completed" | "cancelled";

export default function Order() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchOrders = async (page: number, limitNum: number, status: StatusFilter) => {
    setIsFetching(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limitNum.toString());
      if (status !== "all") {
        params.set("status", status);
      }

      const response = await fetch(`/api/order?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        const list: Order[] = Array.isArray(result)
          ? result
          : result?.data || result?.orders || [];
        setOrders(list);
        const total = result?.total ?? result?.count ?? list.length;
        setTotalOrders(total);
        setTotalPages(
          result?.totalPages ?? Math.max(1, Math.ceil(total / limitNum))
        );
      }
    } catch (err) {
      console.error("Failed to fetch order history:", err);
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage, limit, statusFilter);
  }, [currentPage, limit, statusFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStatusChange = (newStatus: StatusFilter) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
  };

  if (loading) {
    return <OrderListSkeleton />;
  }

  const startItem = totalOrders === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalOrders);

  // Generate visible page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="rounded-3xl bg-white p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-100">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Order History
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Track order status, review invoices, and manage your Apple product deliveries
          </p>
        </div>

        {/* Total Summary Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold">
            <FiPackage className="text-neutral-500" />
            {totalOrders} Total {totalOrders === 1 ? "Order" : "Orders"}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Limit Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All", icon: FiFilter },
            { id: "pending", label: "Pending", icon: FiClock },
            { id: "completed", label: "Completed", icon: FiCheckCircle },
            { id: "cancelled", label: "Cancelled", icon: FiXCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleStatusChange(tab.id as StatusFilter)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  active
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "bg-neutral-100 hover:bg-neutral-200/70 text-neutral-600"
                }`}
              >
                <Icon className={active ? "text-white" : "text-neutral-400"} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Per-Page Selector */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs text-neutral-400 font-medium">Show:</span>
          <select
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer hover:bg-neutral-100 transition-colors"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      {orders.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-3">
          <div className="w-14 h-14 rounded-full bg-neutral-200/60 flex items-center justify-center mx-auto text-neutral-400">
            <FiPackage className="text-2xl" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900">
            {statusFilter === "all"
              ? "No Orders Yet"
              : `No Orders with Status "${statusFilter}"`}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {statusFilter === "all"
              ? "You haven't placed any orders yet. Explore our genuine Apple product lineup now."
              : "Try changing the status filter above to view your other order history."}
          </p>
          <div className="pt-2">
            {statusFilter === "all" ? (
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-xs"
              >
                Start Shopping <FiArrowRight />
              </Link>
            ) : (
              <button
                onClick={() => handleStatusChange("all")}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-neutral-200/80 hover:bg-neutral-300 text-neutral-800 text-xs font-semibold transition-colors"
              >
                View All Orders
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Subtle loading indicator overlay */}
          {isFetching && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-xs font-medium shadow-md">
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading data...
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="pb-3 pr-4">Order Ref</th>
                  <th className="pb-3 px-4">Items</th>
                  <th className="pb-3 px-4">Payment</th>
                  <th className="pb-3 px-4">Delivery</th>
                  <th className="pb-3 px-4 text-right">Total</th>
                  <th className="pb-3 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((item) => {
                  const paymentStatusLower = (item.status_payment || "").toLowerCase();
                  const isPaid =
                    paymentStatusLower === "paid" ||
                    paymentStatusLower === "settlement" ||
                    paymentStatusLower === "completed";
                  const isCancelled =
                    paymentStatusLower === "cancelled" ||
                    paymentStatusLower === "cancel" ||
                    paymentStatusLower === "expire" ||
                    paymentStatusLower === "expired" ||
                    paymentStatusLower === "deny" ||
                    paymentStatusLower === "failure";
                  const isPending = !isPaid && !isCancelled;

                  const formattedDate = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : null;

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-neutral-50/70 transition-colors"
                    >
                      <td className="py-4 pr-4">
                        <div className="font-mono font-medium text-neutral-900 truncate max-w-[130px]">
                          {item._id}
                        </div>
                        {formattedDate && (
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            {formattedDate}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-neutral-600">
                        <div className="font-medium text-neutral-800">
                          {item.order_items?.length || 1}{" "}
                          {(item.order_items?.length || 1) === 1 ? "item" : "items"}
                        </div>
                        {item.order_items?.[0]?.name && (
                          <div className="text-[10px] text-neutral-400 truncate max-w-[160px]">
                            {item.order_items[0].name}
                            {item.order_items.length > 1 &&
                              ` +${item.order_items.length - 1} more`}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                              : isCancelled
                              ? "bg-red-50 text-red-600 border border-red-200/50"
                              : "bg-amber-50 text-amber-700 border border-amber-200/50"
                          }`}
                        >
                          {item.status_payment || "pending"}
                        </span>
                        {item.payment_method && (
                          <div className="text-[10px] text-neutral-400 uppercase mt-0.5">
                            {item.payment_method}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-700">
                          {item.status_delivery || "Processing"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-neutral-900 whitespace-nowrap">
                        {formatRupiah(item.total)}
                      </td>
                      <td className="py-4 pl-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <Link
                              href={`/checkout/payment/${item._id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-[11px] font-semibold transition-colors shadow-xs shrink-0"
                            >
                              <FiCreditCard className="text-xs" /> Pay Now
                            </Link>
                          )}
                          <Link
                            href={`/account/order/${item._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-medium transition-colors shrink-0"
                          >
                            <FiFileText /> Invoice
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Bar */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-neutral-100">
              {/* Pagination Info */}
              <div className="text-xs text-neutral-500 text-center sm:text-left font-medium">
                Showing <span className="font-semibold text-neutral-900">{startItem}</span> -{" "}
                <span className="font-semibold text-neutral-900">{endItem}</span> of{" "}
                <span className="font-semibold text-neutral-900">{totalOrders}</span> orders
              </div>

              {/* Page Number Buttons */}
              <div className="flex items-center justify-center gap-1.5">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isFetching}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-neutral-200 text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
                  aria-label="Previous Page"
                >
                  <FiChevronLeft className="text-sm" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                {/* Numbered Pills */}
                {getPageNumbers().map((num, idx) => {
                  if (num === "...") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-8 h-8 flex items-center justify-center text-xs text-neutral-400 font-bold"
                      >
                        ...
                      </span>
                    );
                  }
                  const pageNum = Number(num);
                  const isActive = currentPage === pageNum;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isFetching}
                      className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-neutral-900 text-white shadow-xs scale-105"
                          : "text-neutral-600 hover:bg-neutral-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isFetching}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-neutral-200 text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
                  aria-label="Next Page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <FiChevronRight className="text-sm" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
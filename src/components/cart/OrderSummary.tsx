"use client";

import { DiscountProvider } from "@/context";
import { formatRupiah } from "@/helper";
import Link from "next/link";
import { FormEvent, useContext, useEffect, useState } from "react";
import { FiTag, FiShield, FiCheckCircle, FiAlertCircle, FiX, FiGift } from "react-icons/fi";
import { HiCheck, HiSparkles } from "react-icons/hi2";

interface OrderSummaryProps {
  subTotal: number;
}

interface PublicVoucher {
  _id: string;
  code: string;
  title: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  validUntil: string;
}

export default function OrderSummary({ subTotal }: OrderSummaryProps) {
  const [promoInput, setPromoInput] = useState<string>("");
  const [appliedVoucher, setAppliedVoucher] = useState<PublicVoucher | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [publicVouchers, setPublicVouchers] = useState<PublicVoucher[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState<boolean>(true);

  const discountProvider = useContext(DiscountProvider);
  const setDiscount = discountProvider?.setDiscount;

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Fetch available public vouchers
  useEffect(() => {
    async function fetchVouchers() {
      try {
        const res = await fetch(`${backendUrl}/api/vouchers/public`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPublicVouchers(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch public vouchers:", err);
      } finally {
        setLoadingVouchers(false);
      }
    }
    fetchVouchers();
  }, [backendUrl]);

  // Validate voucher code against API
  const applyVoucher = async (codeToApply: string) => {
    const code = codeToApply.trim().toUpperCase();
    if (!code) {
      setErrorMsg("Masukkan kode voucher terlebih dahulu");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${backendUrl}/api/vouchers/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: subTotal }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setAppliedVoucher(result.data.voucher);
        setDiscountAmount(result.data.discount);
        setSuccessMsg(result.message || `Voucher ${code} berhasil dipasang!`);
        if (setDiscount) {
          setDiscount(result.data.discount);
        }
      } else {
        setErrorMsg(result.message || "Kode voucher tidak valid atau tidak memenuhi syarat");
        setAppliedVoucher(null);
        setDiscountAmount(0);
        if (setDiscount) {
          setDiscount(0);
        }
      }
    } catch (err: any) {
      setErrorMsg("Gagal memverifikasi voucher. Periksa koneksi backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    applyVoucher(promoInput);
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setDiscountAmount(0);
    setPromoInput("");
    setErrorMsg("");
    setSuccessMsg("");
    if (setDiscount) {
      setDiscount(0);
    }
  };

  const tax = Math.round(subTotal * 0.05);
  const shipping = subTotal > 5000000 ? 0 : 25000;
  const total = subTotal + tax + shipping;
  const finalTotal = Math.max(0, total - discountAmount);

  return (
    <div className="rounded-3xl bg-neutral-50 p-6 sm:p-8 border border-neutral-200/80 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900">
          Order Summary
        </h2>
        {appliedVoucher && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <HiCheck className="w-3.5 h-3.5" /> Voucher Aktif
          </span>
        )}
      </div>

      {/* Promo Code Box */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-neutral-700">
          Kode Promo atau Voucher
        </label>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => {
                setPromoInput(e.target.value.toUpperCase());
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="Contoh: CYBER20 / IGSECRET50"
              disabled={loading || !!appliedVoucher}
              className="w-full uppercase text-xs pl-8 pr-3 py-2.5 rounded-xl bg-white border border-neutral-300 outline-none focus:border-neutral-500 font-medium disabled:bg-neutral-100 disabled:text-neutral-500"
            />
            <FiTag className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs" />
          </div>
          {appliedVoucher ? (
            <button
              type="button"
              onClick={removeVoucher}
              className="px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors flex items-center gap-1 border border-red-200"
              title="Hapus Voucher"
            >
              <FiX className="w-3.5 h-3.5" /> Hapus
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || !promoInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Memeriksa..." : "Gunakan"}
            </button>
          )}
        </form>

        {successMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-700 font-medium flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <FiCheckCircle className="text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={removeVoucher} className="text-emerald-600 hover:text-emerald-900">
              <FiX className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-50/80 border border-red-200 text-xs text-red-600 font-medium flex items-center gap-1.5">
            <FiAlertCircle className="text-red-500 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Private sosmed hint */}
        <p className="text-[11px] text-neutral-400 flex items-center gap-1">
          <HiSparkles className="text-amber-500 w-3 h-3 flex-shrink-0" />
          Punya voucher dari Instagram/TikTok? Masukkan kode rahasianya di atas.
        </p>
      </div>

      {/* Available Public Vouchers Section */}
      {publicVouchers.length > 0 && (
        <div className="pt-3 border-t border-neutral-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <FiGift className="text-neutral-600" /> Voucher Toko Tersedia
            </span>
            <span className="text-[10px] text-neutral-400">
              {publicVouchers.length} promo publik
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {publicVouchers.map((v) => {
              const isCurrent = appliedVoucher?.code === v.code;
              const meetsMin = subTotal >= v.minPurchase;

              return (
                <div
                  key={v._id}
                  className={`p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between gap-2 ${
                    isCurrent
                      ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300"
                      : "bg-white border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold tracking-wider font-mono text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded text-[11px] border border-neutral-200">
                        {v.code}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600">
                        {v.discountType === "percentage"
                          ? `Diskon ${v.discountValue}%`
                          : `Potongan ${formatRupiah(v.discountValue)}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 line-clamp-1">{v.title}</p>
                    {v.minPurchase > 0 && (
                      <p className="text-[10px] text-neutral-400">
                        Min. belanja: {formatRupiah(v.minPurchase)}
                      </p>
                    )}
                  </div>

                  <div>
                    {isCurrent ? (
                      <span className="text-[11px] font-semibold text-emerald-600 px-2 py-1 bg-emerald-100 rounded-lg">
                        Dipakai
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setPromoInput(v.code);
                          applyVoucher(v.code);
                        }}
                        disabled={loading}
                        className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                          meetsMin
                            ? "bg-neutral-900 hover:bg-black text-white"
                            : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                        }`}
                        title={!meetsMin ? `Min. pembelian ${formatRupiah(v.minPurchase)}` : "Gunakan voucher"}
                      >
                        Pakai
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      <div className="space-y-3 pt-4 border-t border-neutral-200/80 text-xs text-neutral-600">
        <div className="flex justify-between items-center">
          <span>Bag Subtotal</span>
          <span className="font-semibold text-neutral-900">{formatRupiah(subTotal)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span>Estimated Tax (5%)</span>
          <span className="font-semibold text-neutral-900">{formatRupiah(tax)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span>Shipping & Courier</span>
          <span className="font-semibold text-neutral-900">
            {shipping === 0 ? (
              <span className="text-emerald-600 uppercase font-bold text-[11px]">Free</span>
            ) : (
              formatRupiah(shipping)
            )}
          </span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between items-center text-emerald-600 font-semibold bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
            <span className="flex items-center gap-1">
              <HiSparkles className="w-3.5 h-3.5 text-emerald-500" />
              Diskon Voucher {appliedVoucher ? `(${appliedVoucher.code})` : ""}
            </span>
            <span>-{formatRupiah(discountAmount)}</span>
          </div>
        )}

        <div className="flex flex-wrap justify-between items-baseline gap-2 pt-4 border-t border-neutral-200 text-sm font-bold text-neutral-900">
          <span className="text-xs text-neutral-600 font-medium">Total</span>
          <span className="text-xl font-extrabold text-neutral-900 tracking-tight font-mono">
            {formatRupiah(finalTotal)}
          </span>
        </div>
      </div>

      {/* Checkout CTA */}
      <Link
        href="/checkout/address"
        onClick={() => {
          if (setDiscount) setDiscount(discountAmount);
        }}
        className="block w-full py-4 rounded-full bg-neutral-900 hover:bg-black text-white text-center text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
      >
        Proceed to Checkout
      </Link>

      <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400 pt-2">
        <FiShield className="text-sm text-neutral-500" />
        <span>Secured with Midtrans 256-bit encryption</span>
      </div>
    </div>
  );
}
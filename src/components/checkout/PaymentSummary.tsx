"use client";

import { DiscountProvider } from "@/context";
import { formatRupiah } from "@/helper";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import {
  FiShield,
  FiLock,
  FiCopy,
  FiCheck,
  FiClock,
  FiRefreshCw,
  FiExternalLink,
} from "react-icons/fi";
import { BsQrCodeScan, BsBank2, BsShop } from "react-icons/bs";
import { SiApple } from "react-icons/si";
import { toast } from "@/components/ui/Toast";

interface PaymentSummaryProps {
  addressId: string;
  subTotal: number;
  setCart?: (cart: any) => void;
  setAddress: (id: string) => void;
  targetOrderId?: string;
  onActivePaymentChange?: (activePayment: any) => void;
}

type PaymentChannel =
  | "bca_va"
  | "bni_va"
  | "bri_va"
  | "mandiri_bill"
  | "permata_va"
  | "qris"
  | "gopay"
  | "indomaret"
  | "alfamart";

export default function PaymentSummary({
  setCart,
  subTotal,
  addressId,
  setAddress,
  targetOrderId,
  onActivePaymentChange,
}: PaymentSummaryProps) {
  const discountProvider = useContext(DiscountProvider);
  const discount = discountProvider?.discount || 0;
  const setDiscount = discountProvider?.setDiscount;

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedChannel, setSelectedChannel] =
    useState<PaymentChannel>("bca_va");

  // Core API Charge Result State
  const [activePayment, setActivePayment] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [dismissedOrderId, setDismissedOrderId] = useState<string | null>(null);

  // Notify parent component of active payment state changes
  useEffect(() => {
    onActivePaymentChange?.(activePayment);
  }, [activePayment, onActivePaymentChange]);

  const tax = Math.round(subTotal * 0.05);
  const shipping = subTotal > 5000000 ? 0 : 25000;
  const total = subTotal + tax + shipping;
  const finalTotal = Math.max(0, total - discount);
  const router = useRouter();

  // Auto-fetch delivery address if not present
  useEffect(() => {
    if (!addressId) {
      fetch("/api/delivery-address")
        .then((res) => res.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : (data?.data || data?.deliveryAddresses || []);
          if (list.length > 0) {
            setAddress(list[0]._id);
          }
        })
        .catch(() => {});
    }
  }, [addressId, setAddress]);

  // Restore active payment directly from backend API if user refreshes page or continues payment
  useEffect(() => {
    let isMounted = true;

    const checkActiveOrderFromApi = async () => {
      try {
        const res = await axios.get("/api/order");
        const orderList = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.orders || []);
        if (!isMounted || orderList.length === 0) return;

        // If targetOrderId is specified, find that exact order; otherwise pick latest order
        const targetOrder = targetOrderId
          ? orderList.find((o: any) => o._id === targetOrderId)
          : orderList[0];

        if (!targetOrder) return;

        const isDismissed = !targetOrderId && targetOrder._id === dismissedOrderId;

        if (
          targetOrder.status_payment === "pending" &&
          (targetOrder.payment_details || targetOrder.token || targetOrderId) &&
          !isDismissed
        ) {
          const orderAgeMs =
            Date.now() - new Date(targetOrder.createdAt).getTime();
          const isEligible = targetOrderId ? true : orderAgeMs < 24 * 60 * 60 * 1000;

          if (isEligible) {
            try {
              const statusRes = await axios.get(
                `/api/order/${targetOrder._id}/status`
              );
              if (!isMounted) return;

              if (statusRes.data?.status === "completed") {
                setPaymentCompleted(true);
              } else if (statusRes.data?.status === "pending") {
                setActivePayment({
                  status: "success",
                  order: statusRes.data.order || targetOrder,
                  charge:
                    statusRes.data.charge ||
                    statusRes.data.order?.payment_details ||
                    targetOrder.payment_details || {
                      token: targetOrder.token,
                      url_redirect: targetOrder.url_redirect,
                      transaction_id: targetOrder.token,
                    },
                });
              }
            } catch {
              if (isMounted) {
                setActivePayment({
                  status: "success",
                  order: targetOrder,
                  charge: targetOrder.payment_details || {
                    token: targetOrder.token,
                    url_redirect: targetOrder.url_redirect,
                    transaction_id: targetOrder.token,
                  },
                });
              }
            }
          }
        }
      } catch (err) {
        // Silently fail if not logged in or network error
      }
    };

    checkActiveOrderFromApi();

    return () => {
      isMounted = false;
    };
  }, [dismissedOrderId, targetOrderId]);

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Poll for payment status if active payment exists
  useEffect(() => {
    if (!activePayment?.order?._id || paymentCompleted) return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(
          `/api/order/${activePayment.order._id}/status`
        );
        const statusVal = String(
          res.data?.midtransStatus || res.data?.status || ""
        ).toLowerCase();

        if (statusVal === "completed" || statusVal === "settlement" || statusVal === "paid") {
          setPaymentCompleted(true);
          clearInterval(interval);
          setTimeout(() => {
            router.push("/account/order");
          }, 2500);
        } else if (
          ["expire", "expired", "cancel", "cancelled", "deny", "failure"].includes(statusVal)
        ) {
          clearInterval(interval);
          toast.error(
            "Pembayaran Kadaluarsa",
            "Waktu pembayaran untuk pesanan ini telah habis (EXPIRED)."
          );
        }
      } catch (err) {
        // Silently retry
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activePayment, paymentCompleted, router]);

  const handleManualCheckStatus = async () => {
    if (!activePayment?.order?._id) return;
    setCheckingStatus(true);
    try {
      const res = await axios.get(
        `/api/order/${activePayment.order._id}/status`
      );
      const statusVal = String(
        res.data?.midtransStatus || res.data?.status || ""
      ).toLowerCase();

      if (statusVal === "completed" || statusVal === "settlement" || statusVal === "paid") {
        setPaymentCompleted(true);
        toast.success(
          "Pembayaran Berhasil",
          "Pembayaran Anda telah terverifikasi!"
        );
        setTimeout(() => {
          router.push("/account/order");
        }, 2000);
      } else if (
        ["expire", "expired", "cancel", "cancelled", "deny", "failure"].includes(statusVal)
      ) {
        toast.error(
          "Pembayaran Kadaluarsa",
          "Batas waktu pembayaran pesanan ini telah berakhir (EXPIRED). Transaksi tidak dapat dilanjutkan."
        );
        setTimeout(() => {
          router.push("/account/order");
        }, 2000);
      } else {
        toast.warning(
          "Menunggu Pembayaran",
          `Status pembayaran saat ini: ${statusVal.toUpperCase()}. Silakan selesaikan pembayaran sesuai instruksi.`
        );
      }
    } catch (err) {
      toast.error(
        "Gagal Memeriksa Status",
        "Tidak dapat memverifikasi status pembayaran saat ini. Silakan coba sesaat lagi."
      );
    } finally {
      setCheckingStatus(false);
    }
  };

  const handlePay = async () => {
    if (subTotal === 0) {
      router.push("/shop");
      return;
    }
    if (!addressId) {
      setErrorMessage("Please select a valid delivery address first.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      // Direct Midtrans Core API Charge
      let payment_type = "bank_transfer";
      let bank: string | undefined = undefined;
      let store: string | undefined = undefined;

      switch (selectedChannel) {
        case "bca_va":
          payment_type = "bank_transfer";
          bank = "bca";
          break;
        case "bni_va":
          payment_type = "bank_transfer";
          bank = "bni";
          break;
        case "bri_va":
          payment_type = "bank_transfer";
          bank = "bri";
          break;
        case "mandiri_bill":
          payment_type = "echannel";
          break;
        case "permata_va":
          payment_type = "bank_transfer";
          bank = "permata";
          break;
        case "qris":
          payment_type = "qris";
          break;
        case "gopay":
          payment_type = "gopay";
          break;
        case "indomaret":
          payment_type = "cstore";
          store = "indomaret";
          break;
        case "alfamart":
          payment_type = "cstore";
          store = "alfamart";
          break;
      }

      const response = await axios.post("/api/order/charge", {
        deliveryAddress: addressId,
        payment_type,
        paymentType: payment_type,
        bank,
        store,
        discount: discount || 0,
      });

      const resPayload = response.data?.data || response.data;
      const chargeData = resPayload?.charge || response.data?.charge;
      const orderData = resPayload?.order || response.data?.order;

      if (
        (resPayload?.status === "success" || response.data?.success) &&
        chargeData &&
        orderData
      ) {
        setActivePayment({
          ...response.data,
          ...resPayload,
          charge: chargeData,
          order: orderData,
        });
        if (setDiscount) setDiscount(0);
        setAddress("");
        setCart?.([]);
        router.push(`/checkout/payment/${orderData._id}`);
        return;
      } else {
        throw new Error(
          resPayload?.message ||
            response.data?.message ||
            "Unexpected response from payment server"
        );
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Failed to process order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract payment instructions details
  const getChargeDetails = () => {
    if (!activePayment?.charge) return null;
    const charge = activePayment.charge;

    // Bank Transfer VA
    if (charge.va_numbers && charge.va_numbers.length > 0) {
      return {
        type: "va",
        bank: charge.va_numbers[0].bank?.toUpperCase(),
        vaNumber: charge.va_numbers[0].va_number,
        expiry: charge.expiry_time || "24 Hours",
      };
    }

    if (charge.permata_va_number) {
      return {
        type: "va",
        bank: "PERMATA",
        vaNumber: charge.permata_va_number,
        expiry: charge.expiry_time || "24 Hours",
      };
    }

    // Mandiri Bill
    if (charge.biller_code && charge.bill_key) {
      return {
        type: "mandiri",
        billerCode: charge.biller_code,
        billKey: charge.bill_key,
        expiry: charge.expiry_time || "24 Hours",
      };
    }

    // QRIS
    const qrAction = charge.actions?.find(
      (a: any) => a.name === "generate-qr-code"
    );
    if (charge.payment_type === "qris" || qrAction) {
      return {
        type: "qris",
        qrUrl: qrAction?.url,
        expiry: charge.expiry_time || "15 Minutes",
      };
    }

    // GoPay
    if (charge.payment_type === "gopay") {
      const deepLink = charge.actions?.find(
        (a: any) => a.name === "deeplink-redirect"
      );
      return {
        type: "gopay",
        qrUrl: qrAction?.url,
        deepLink: deepLink?.url,
        expiry: charge.expiry_time || "15 Minutes",
      };
    }

    // Convenience Store
    if (charge.payment_code) {
      return {
        type: "cstore",
        store: charge.store || "Indomaret / Alfamart",
        paymentCode: charge.payment_code,
        expiry: charge.expiry_time || "24 Hours",
      };
    }

    return {
      type: "generic",
      id: charge.transaction_id || charge.order_id || activePayment.order?._id,
      status: charge.transaction_status || activePayment.order?.status_payment,
    };
  };

  const chargeDetails = getChargeDetails();

  return (
    <div className="rounded-3xl bg-neutral-50 p-6 sm:p-8 border border-neutral-200/80 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900">
          Payment Overview
        </h2>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-neutral-900 text-white flex items-center gap-1">
          <SiApple className="text-xs" /> Core API
        </span>
      </div>

      {errorMessage && (
        <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-200 rounded-xl">
          {errorMessage}
        </div>
      )}

      {/* If Active Payment is in Progress, show the Core API Instruction Card */}
      {activePayment ? (
        <div className="space-y-6 animate-fadeIn">
          {paymentCompleted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-xl shadow-md">
                <FiCheck />
              </div>
              <h3 className="text-base font-bold text-emerald-900">
                Payment Successfully Verified!
              </h3>
              <p className="text-xs text-emerald-700">
                Your order has been recorded. Redirecting to order history...
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-5 sm:p-6 border border-neutral-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                    Waiting for Payment
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-neutral-500">
                  <FiClock className="text-neutral-400" />
                  <span>Order #{String(activePayment.order?._id).slice(-6)}</span>
                </div>
              </div>

              {/* Specific Payment Instruction Render */}
              {chargeDetails?.type === "va" && (
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2 text-center">
                  <p className="text-xs text-neutral-500 font-medium">
                    {chargeDetails.bank} Virtual Account Number
                  </p>
                  <p className="text-2xl sm:text-3xl font-mono font-extrabold tracking-wider text-neutral-900">
                    {chargeDetails.vaNumber}
                  </p>
                  <button
                    onClick={() => copyToClipboard(chargeDetails.vaNumber)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-colors mt-2"
                  >
                    {copied ? <FiCheck /> : <FiCopy />}
                    <span>{copied ? "Copied to Clipboard!" : "Copy VA Number"}</span>
                  </button>
                </div>
              )}

              {chargeDetails?.type === "mandiri" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-neutral-500 block">Biller Code</span>
                      <span className="font-mono font-bold text-neutral-900 text-base">
                        {chargeDetails.billerCode}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(chargeDetails.billerCode)}
                      className="px-3 py-1 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-xs font-medium"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-neutral-500 block">Bill Key</span>
                      <span className="font-mono font-bold text-neutral-900 text-base">
                        {chargeDetails.billKey}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(chargeDetails.billKey)}
                      className="px-3 py-1 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-xs font-medium"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {chargeDetails?.type === "qris" && (
                <div className="text-center space-y-3">
                  <p className="text-xs text-neutral-600 font-medium">
                    Scan QR Code using BCA Mobile, GoPay, OVO, Dana, ShopeePay,
                    or any Indonesian banking app:
                  </p>
                  {chargeDetails.qrUrl && (
                    <div className="p-3 bg-white border border-neutral-300 rounded-2xl inline-block shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={chargeDetails.qrUrl}
                        alt="QRIS Payment Code"
                        className="w-56 h-56 mx-auto object-contain"
                      />
                    </div>
                  )}
                </div>
              )}

              {chargeDetails?.type === "gopay" && (
                <div className="text-center space-y-3">
                  {chargeDetails.qrUrl && (
                    <div className="p-3 bg-white border border-neutral-300 rounded-2xl inline-block shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={chargeDetails.qrUrl}
                        alt="GoPay QR Code"
                        className="w-56 h-56 mx-auto object-contain"
                      />
                    </div>
                  )}
                  {chargeDetails.deepLink && (
                    <a
                      href={chargeDetails.deepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors"
                    >
                      <span>Pay with GoPay App</span>
                      <FiExternalLink />
                    </a>
                  )}
                </div>
              )}

              {chargeDetails?.type === "cstore" && (
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2 text-center">
                  <p className="text-xs text-neutral-500 font-medium">
                    Show this Payment Code to the Cashier
                  </p>
                  <p className="text-2xl sm:text-3xl font-mono font-extrabold tracking-wider text-neutral-900">
                    {chargeDetails.paymentCode}
                  </p>
                  <button
                    onClick={() => copyToClipboard(chargeDetails.paymentCode)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-colors mt-2"
                  >
                    {copied ? <FiCheck /> : <FiCopy />}
                    <span>{copied ? "Copied!" : "Copy Code"}</span>
                  </button>
                </div>
              )}



              {chargeDetails?.type === "generic" && (
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2 text-center">
                  <p className="text-xs text-neutral-500 font-medium">
                    Order Reference
                  </p>
                  <p className="text-base font-mono font-bold text-neutral-900">
                    {chargeDetails.id || activePayment.order?._id}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Status: {chargeDetails.status || activePayment.order?.status_payment}
                  </p>
                </div>
              )}

              {/* Amount to Pay */}
              <div className="flex justify-between items-baseline pt-3 border-t border-neutral-200 text-xs">
                <span className="text-neutral-500">Total Amount</span>
                <span className="text-lg font-extrabold text-neutral-900">
                  {formatRupiah(activePayment.order?.total || finalTotal)}
                </span>
              </div>

              {/* Status and Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleManualCheckStatus}
                  disabled={checkingStatus}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-md"
                >
                  <FiRefreshCw
                    className={checkingStatus ? "animate-spin" : ""}
                  />
                  <span>
                    {checkingStatus ? "Checking Status..." : "Check Payment Status"}
                  </span>
                </button>
                <button
                  onClick={() => router.push("/account/order")}
                  className="w-full py-2.5 text-center text-xs text-neutral-600 hover:text-black font-medium transition-colors"
                >
                  View in Order History
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Channel Selection and Initial Summary */
        <>
          {/* Payment Method Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-neutral-700">
              Select Midtrans Core API Channel
            </label>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* BCA VA */}
              <button
                type="button"
                onClick={() => setSelectedChannel("bca_va")}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                  selectedChannel === "bca_va"
                    ? "border-neutral-900 bg-white shadow-sm ring-1 ring-neutral-900"
                    : "border-neutral-200 bg-white hover:bg-neutral-100/60"
                }`}
              >
                <BsBank2 className="text-base text-blue-600 shrink-0" />
                <div>
                  <div className="font-semibold text-neutral-900 leading-tight">
                    BCA VA
                  </div>
                  <div className="text-[10px] text-neutral-500">Virtual Account</div>
                </div>
              </button>

              {/* BNI VA */}
              <button
                type="button"
                onClick={() => setSelectedChannel("bni_va")}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                  selectedChannel === "bni_va"
                    ? "border-neutral-900 bg-white shadow-sm ring-1 ring-neutral-900"
                    : "border-neutral-200 bg-white hover:bg-neutral-100/60"
                }`}
              >
                <BsBank2 className="text-base text-teal-600 shrink-0" />
                <div>
                  <div className="font-semibold text-neutral-900 leading-tight">
                    BNI VA
                  </div>
                  <div className="text-[10px] text-neutral-500">Virtual Account</div>
                </div>
              </button>

              {/* BRI VA */}
              <button
                type="button"
                onClick={() => setSelectedChannel("bri_va")}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                  selectedChannel === "bri_va"
                    ? "border-neutral-900 bg-white shadow-sm ring-1 ring-neutral-900"
                    : "border-neutral-200 bg-white hover:bg-neutral-100/60"
                }`}
              >
                <BsBank2 className="text-base text-sky-600 shrink-0" />
                <div>
                  <div className="font-semibold text-neutral-900 leading-tight">
                    BRI VA
                  </div>
                  <div className="text-[10px] text-neutral-500">Virtual Account</div>
                </div>
              </button>

              {/* Mandiri Bill */}
              <button
                type="button"
                onClick={() => setSelectedChannel("mandiri_bill")}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                  selectedChannel === "mandiri_bill"
                    ? "border-neutral-900 bg-white shadow-sm ring-1 ring-neutral-900"
                    : "border-neutral-200 bg-white hover:bg-neutral-100/60"
                }`}
              >
                <BsBank2 className="text-base text-amber-600 shrink-0" />
                <div>
                  <div className="font-semibold text-neutral-900 leading-tight">
                    Mandiri
                  </div>
                  <div className="text-[10px] text-neutral-500">Bill Payment</div>
                </div>
              </button>

              {/* Permata VA */}
              <button
                type="button"
                onClick={() => setSelectedChannel("permata_va")}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                  selectedChannel === "permata_va"
                    ? "border-neutral-900 bg-white shadow-sm ring-1 ring-neutral-900"
                    : "border-neutral-200 bg-white hover:bg-neutral-100/60"
                }`}
              >
                <BsBank2 className="text-base text-emerald-600 shrink-0" />
                <div>
                  <div className="font-semibold text-neutral-900 leading-tight">
                    Permata
                  </div>
                  <div className="text-[10px] text-neutral-500">Virtual Account</div>
                </div>
              </button>

              {/* QRIS */}
              <button
                type="button"
                onClick={() => setSelectedChannel("qris")}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                  selectedChannel === "qris"
                    ? "border-neutral-900 bg-white shadow-sm ring-1 ring-neutral-900"
                    : "border-neutral-200 bg-white hover:bg-neutral-100/60"
                }`}
              >
                <BsQrCodeScan className="text-base text-indigo-600 shrink-0" />
                <div>
                  <div className="font-semibold text-neutral-900 leading-tight">
                    QRIS
                  </div>
                  <div className="text-[10px] text-neutral-500">All E-Wallets</div>
                </div>
              </button>

              {/* GoPay */}
              <button
                type="button"
                onClick={() => setSelectedChannel("gopay")}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                  selectedChannel === "gopay"
                    ? "border-neutral-900 bg-white shadow-sm ring-1 ring-neutral-900"
                    : "border-neutral-200 bg-white hover:bg-neutral-100/60"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                  G
                </div>
                <div>
                  <div className="font-semibold text-neutral-900 leading-tight">
                    GoPay
                  </div>
                  <div className="text-[10px] text-neutral-500">QR / DeepLink</div>
                </div>
              </button>

              {/* Convenience Store Indomaret */}
              <button
                type="button"
                onClick={() => setSelectedChannel("indomaret")}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                  selectedChannel === "indomaret"
                    ? "border-neutral-900 bg-white shadow-sm ring-1 ring-neutral-900"
                    : "border-neutral-200 bg-white hover:bg-neutral-100/60"
                }`}
              >
                <BsShop className="text-base text-red-600 shrink-0" />
                <div>
                  <div className="font-semibold text-neutral-900 leading-tight">
                    Indomaret
                  </div>
                  <div className="text-[10px] text-neutral-500">Over the Counter</div>
                </div>
              </button>

              {/* Convenience Store Alfamart */}
              <button
                type="button"
                onClick={() => setSelectedChannel("alfamart")}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                  selectedChannel === "alfamart"
                    ? "border-neutral-900 bg-white shadow-sm ring-1 ring-neutral-900"
                    : "border-neutral-200 bg-white hover:bg-neutral-100/60"
                }`}
              >
                <BsShop className="text-base text-blue-600 shrink-0" />
                <div>
                  <div className="font-semibold text-neutral-900 leading-tight">
                    Alfamart
                  </div>
                  <div className="text-[10px] text-neutral-500">Over the Counter</div>
                </div>
              </button>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-3 text-xs text-neutral-600 pt-2 border-t border-neutral-200/80">
            <div className="flex justify-between items-center">
              <span>Subtotal</span>
              <span className="font-semibold text-neutral-900">
                {formatRupiah(subTotal)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span>Estimated Tax (5%)</span>
              <span className="font-semibold text-neutral-900">
                {formatRupiah(tax)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span>Shipping & Courier</span>
              <span className="font-semibold text-neutral-900">
                {shipping === 0 ? "FREE" : formatRupiah(shipping)}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between items-center text-emerald-600 font-semibold">
                <span>Promotion Discount</span>
                <span>-{formatRupiah(discount)}</span>
              </div>
            )}

            <div className="flex flex-wrap justify-between items-baseline gap-2 pt-4 border-t border-neutral-200 text-sm font-bold text-neutral-900">
              <span className="text-xs text-neutral-600 font-medium">Total Payment</span>
              <span className="text-xl font-extrabold text-neutral-900 tracking-tight font-mono">
                {formatRupiah(finalTotal)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Link
              href="/checkout/address"
              className="flex-1 py-3.5 px-4 text-center rounded-full bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-semibold transition-colors"
            >
              Back
            </Link>
            <button
              onClick={handlePay}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <FiLock />{" "}
              {loading ? "Connecting..." : "Generate Payment"}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400">
            <FiShield className="text-sm" />
            <span>Secured with Midtrans Core API & 256-bit Encryption</span>
          </div>
        </>
      )}
    </div>
  );
}
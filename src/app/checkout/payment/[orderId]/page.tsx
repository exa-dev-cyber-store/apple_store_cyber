"use client";

import { PaymentPageSkeleton } from "@/components/ui/Skeleton";
import { formatRupiah } from "@/helper";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiCreditCard,
  FiExternalLink,
  FiPackage,
  FiRefreshCw,
  FiShield,
  FiXCircle,
} from "react-icons/fi";
import { BsQrCodeScan } from "react-icons/bs";
import { SiApple } from "react-icons/si";
import { toast } from "@/components/ui/Toast";

declare global {
  interface Window {
    snap: any;
  }
}

export default function OrderPaymentPage({
  params: { orderId },
}: {
  params: { orderId: string };
}) {
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [charge, setCharge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Copy helper
  const copyToClipboard = (text: string, field: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  // Initial Fetch & Poll
  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const res = await axios.get(`/api/order/${orderId}/status`);
        if (!isMounted) return;

        if (res.data) {
          const ord = res.data.order;
          const chg = res.data.charge || ord?.payment_details;
          setOrder(ord);
          setCharge(chg);

          const statusVal = String(
            res.data?.midtransStatus || res.data?.status || ord?.status_payment || ""
          ).toLowerCase();

          if (
            statusVal === "completed" ||
            statusVal === "settlement" ||
            statusVal === "paid" ||
            ord?.status_payment === "completed" ||
            ord?.status_payment === "settlement"
          ) {
            setPaymentCompleted(true);
            setPaymentExpired(false);
          } else if (
            [
              "expire",
              "expired",
              "cancel",
              "cancelled",
              "deny",
              "failure",
            ].includes(statusVal)
          ) {
            setPaymentExpired(true);
          }
        }
      } catch (err) {
        // Fallback: fetch directly from single order route
        try {
          const fallbackRes = await axios.get(`/api/order/${orderId}`);
          if (isMounted && fallbackRes.data) {
            setOrder(fallbackRes.data);
            setCharge(fallbackRes.data.payment_details);
            const fallbackStatus = String(fallbackRes.data.status_payment || "").toLowerCase();
            if (fallbackStatus === "completed" || fallbackStatus === "settlement" || fallbackStatus === "paid") {
              setPaymentCompleted(true);
              setPaymentExpired(false);
            } else if (
              ["expire", "expired", "cancel", "cancelled", "deny", "failure"].includes(fallbackStatus)
            ) {
              setPaymentExpired(true);
            }
          }
        } catch {
          // Ignore
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStatus();

    // Auto-poll status every 4 seconds if pending
    const interval = setInterval(() => {
      if (!paymentCompleted && !paymentExpired) {
        fetchStatus();
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId, paymentCompleted, paymentExpired]);

  // Manual Status Check
  const handleManualCheck = async () => {
    setCheckingStatus(true);
    setErrorMsg("");
    try {
      const res = await axios.get(`/api/order/${orderId}/status`);
      const statusVal = String(
        res.data?.midtransStatus || res.data?.status || res.data?.order?.status_payment || ""
      ).toLowerCase();

      if (
        statusVal === "completed" ||
        statusVal === "settlement" ||
        statusVal === "paid" ||
        res.data?.order?.status_payment === "completed"
      ) {
        setPaymentCompleted(true);
        setPaymentExpired(false);
        toast.success(
          "Payment Verified",
          "Your payment has been successfully verified! Redirecting to invoice..."
        );
        setTimeout(() => {
          router.push(`/account/order/${orderId}`);
        }, 2500);
      } else if (
        [
          "expire",
          "expired",
          "cancel",
          "cancelled",
          "deny",
          "failure",
        ].includes(statusVal)
      ) {
        setPaymentExpired(true);
        toast.error(
          "Payment Expired",
          "The payment time limit for this order has expired. Transaction cannot be continued."
        );
      } else {
        toast.warning(
          "Awaiting Payment",
          `Current payment status: ${statusVal.toUpperCase()}. Please complete your payment.`
        );
      }
    } catch {
      toast.error(
        "Verification Failed",
        "Unable to verify payment status right now. Please try again shortly."
      );
    } finally {
      setCheckingStatus(false);
    }
  };

  // Extract structured instruction details
  const getPaymentDetails = () => {
    const chg = charge || order?.payment_details || {};
    const actions = chg.actions || [];
    const qrAction = actions.find((a: any) => a.name === "generate-qr-code");
    const deepLinkAction = actions.find((a: any) => a.name === "deeplink-redirect");

    // 1. QRIS
    const isQris =
      chg.payment_type === "qris" ||
      order?.payment_method === "qris" ||
      Boolean(qrAction) ||
      Boolean(chg.qr_string);

    if (isQris) {
      let qrUrl = qrAction?.url;
      if (!qrUrl && order?.url_redirect && (order.url_redirect.includes("qris") || order.url_redirect.includes("midtrans"))) {
        qrUrl = order.url_redirect;
      }
      if (!qrUrl && chg.qr_string) {
        qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
          chg.qr_string
        )}`;
      }

      return {
        type: "qris",
        qrUrl,
        qrString: chg.qr_string,
        expiry: chg.expiry_time || "15 Minutes",
      };
    }

    // 2. Bank Transfer VA (BCA, BNI, BRI)
    if (chg.va_numbers && chg.va_numbers.length > 0) {
      return {
        type: "va",
        bank: chg.va_numbers[0].bank?.toUpperCase(),
        vaNumber: chg.va_numbers[0].va_number,
        expiry: chg.expiry_time || "24 Hours",
      };
    }

    // Permata VA
    if (chg.permata_va_number) {
      return {
        type: "va",
        bank: "PERMATA",
        vaNumber: chg.permata_va_number,
        expiry: chg.expiry_time || "24 Hours",
      };
    }

    // 3. Mandiri Bill (echannel)
    if (chg.biller_code && chg.bill_key) {
      return {
        type: "mandiri",
        billerCode: chg.biller_code,
        billKey: chg.bill_key,
        expiry: chg.expiry_time || "24 Hours",
      };
    }

    // 4. GoPay
    if (chg.payment_type === "gopay" || order?.payment_method === "gopay") {
      return {
        type: "gopay",
        qrUrl: qrAction?.url,
        deepLink: deepLinkAction?.url || order?.url_redirect,
        expiry: chg.expiry_time || "15 Minutes",
      };
    }

    // 5. Convenience Store
    if (chg.payment_code) {
      return {
        type: "cstore",
        store: chg.store || "Indomaret / Alfamart",
        paymentCode: chg.payment_code,
        expiry: chg.expiry_time || "24 Hours",
      };
    }

    // 6. Snap Modal / Redirect
    if (order?.token || chg.token || order?.url_redirect) {
      return {
        type: "snap",
        token: order?.token || chg.token,
        url: order?.url_redirect || chg.redirect_url,
      };
    }

    return {
      type: "generic",
      id: chg.transaction_id || order?.token || orderId,
      status: chg.transaction_status || order?.status_payment,
    };
  };

  if (loading) {
    return <PaymentPageSkeleton />;
  }

  if (!order) {
    return (
      <div className="py-24 text-center rounded-3xl bg-neutral-50 p-8 space-y-4 max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-full bg-neutral-200/60 flex items-center justify-center mx-auto text-neutral-400">
          <FiPackage className="text-2xl" />
        </div>
        <h2 className="text-lg font-bold text-neutral-800">Order Not Found</h2>
        <p className="text-xs text-neutral-500">
          We could not locate this order ({orderId}).
        </p>
        <Link
          href="/account/order"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-semibold"
        >
          <FiArrowLeft /> Return to Orders
        </Link>
      </div>
    );
  }

  const items = order.order_items || [];
  const details = getPaymentDetails();
  const totalAmount = order.total || 0;

  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />

      <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/account/order"
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
          >
            <FiArrowLeft /> Back to Order History
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-neutral-400">
              Ref: #{orderId.slice(-8).toUpperCase()}
            </span>
            <Link
              href={`/account/order/${orderId}`}
              className="text-[11px] font-semibold text-neutral-600 hover:text-black underline transition-colors"
            >
              Invoice
            </Link>
          </div>
        </div>

        {/* Payment Completed Success Screen */}
        {paymentCompleted ? (
          <div className="rounded-3xl bg-white p-8 sm:p-12 border border-emerald-200/80 shadow-md text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg">
              <FiCheck />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 mb-2">
                <FiCheckCircle /> Payment Completed
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
                Thank You! Your Payment is Verified
              </h1>
              <p className="text-xs text-neutral-500 mt-2 max-w-md mx-auto">
                We have received your payment for order #{orderId.slice(-6)}. Your order is now being processed for delivery.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href={`/account/order/${orderId}`}
                className="px-6 py-2.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all"
              >
                View Official Invoice
              </Link>
              <Link
                href="/shop"
                className="px-6 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium transition-all"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : paymentExpired ? (
          <div className="rounded-3xl bg-white p-8 sm:p-12 border border-red-200/80 shadow-md text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg">
              <FiXCircle />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-600 mb-2">
                <FiClock /> Payment Expired
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
                This Order Cannot Be Processed
              </h1>
              <p className="text-xs text-neutral-500 mt-2 max-w-md mx-auto leading-relaxed">
                The payment time limit for order #{orderId.slice(-6)} has expired. The transaction was automatically cancelled and payment instructions are no longer valid.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Link
                href="/shop"
                className="px-6 py-2.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all"
              >
                Start New Order
              </Link>
              <Link
                href="/account/order"
                className="px-6 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium transition-all"
              >
                View Order History
              </Link>
            </div>
          </div>
        ) : (
          /* Active Payment Waiting Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Interactive Payment Instruction */}
            <div className="lg:col-span-7 rounded-3xl bg-white p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6">
              {/* Header Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                  <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                    Waiting for Payment
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 flex items-center gap-1">
                    <SiApple className="text-xs" /> Midtrans Secure
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded-2xl">
                  {errorMsg}
                </div>
              )}

              {/* QRIS Channel Card */}
              {details.type === "qris" && (
                <div className="space-y-6 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <span className="px-3 py-1 rounded-lg bg-neutral-900 text-white font-extrabold text-sm tracking-wider">
                      QRIS
                    </span>
                    <span className="text-xs text-neutral-500 font-medium">
                      National Payment Standard
                    </span>
                  </div>

                  {details.qrUrl ? (
                    <div className="space-y-4">
                      <div className="p-4 sm:p-6 bg-white border-2 border-neutral-200 rounded-3xl inline-block shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={details.qrUrl}
                          alt="QRIS Code Cyber Store"
                          className="w-64 h-64 sm:w-72 sm:h-72 mx-auto object-contain"
                        />
                      </div>
                      <p className="text-xs text-neutral-600 max-w-sm mx-auto">
                        Scan the QR code above using your mobile banking or digital wallet app (GoPay, OVO, Dana, ShopeePay, LinkAja, BCA, Mandiri, BRI, BNI).
                      </p>
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
                      <p className="text-xs font-semibold text-amber-900">
                        QRIS code is being prepared or please check your payment status.
                      </p>
                      <button
                        onClick={handleManualCheck}
                        disabled={checkingStatus}
                        className="px-5 py-2 rounded-full bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors"
                      >
                        {checkingStatus ? "Checking..." : "Check Payment Status"}
                      </button>
                    </div>
                  )}

                  {/* QRIS Step Guide */}
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-left text-xs text-neutral-600 space-y-2">
                    <p className="font-bold text-neutral-900 uppercase text-[11px] tracking-wider">
                      How to Pay with QRIS:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-neutral-600">
                      <li>Open your Mobile Banking or Digital Wallet application</li>
                      <li>Select the <strong>Pay</strong> or <strong>QRIS</strong> menu</li>
                      <li>Point your camera at the QR code above</li>
                      <li>Verify merchant name: <strong>Cyber Store / Midtrans</strong></li>
                      <li>Confirm amount and enter your security PIN</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Virtual Account Card (BCA, BNI, BRI, Permata) */}
              {details.type === "va" && (
                <div className="space-y-6">
                  <div className="p-6 rounded-3xl bg-neutral-50 border border-neutral-200/80 text-center space-y-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider">
                      {details.bank} Virtual Account
                    </span>
                    <p className="text-xs text-neutral-500">
                      Virtual Account Number:
                    </p>
                    <p className="text-2xl sm:text-3xl font-mono font-extrabold tracking-wider text-neutral-900 select-all">
                      {details.vaNumber}
                    </p>
                    <button
                      onClick={() => copyToClipboard(details.vaNumber, "va")}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-sm mt-1"
                    >
                      {copiedField === "va" ? <FiCheck /> : <FiCopy />}
                      <span>{copiedField === "va" ? "VA Number Copied!" : "Copy VA Number"}</span>
                    </button>
                  </div>

                  {/* Step instructions */}
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-xs text-neutral-600 space-y-2">
                    <p className="font-bold text-neutral-900 uppercase text-[11px] tracking-wider">
                      {details.bank} VA Transfer Instructions:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-neutral-600">
                      <li>Open your {details.bank} Mobile Banking or ATM</li>
                      <li>Select <strong>Transfer &rarr; Virtual Account</strong></li>
                      <li>Enter VA Number: <strong>{details.vaNumber}</strong></li>
                      <li>Ensure transfer amount matches: <strong>{formatRupiah(totalAmount)}</strong></li>
                      <li>Complete payment and save transfer receipt</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Mandiri Bill Card */}
              {details.type === "mandiri" && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-neutral-500 block">Company Code (Biller Code)</span>
                        <span className="font-mono font-bold text-neutral-900 text-lg">
                          {details.billerCode}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(details.billerCode, "biller")}
                        className="px-4 py-1.5 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-semibold transition-colors"
                      >
                        {copiedField === "biller" ? "Copied!" : "Copy"}
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-neutral-500 block">Payment Code (Bill Key)</span>
                        <span className="font-mono font-bold text-neutral-900 text-lg">
                          {details.billKey}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(details.billKey, "billkey")}
                        className="px-4 py-1.5 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-semibold transition-colors"
                      >
                        {copiedField === "billkey" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-xs text-neutral-600 space-y-2">
                    <p className="font-bold text-neutral-900 uppercase text-[11px] tracking-wider">
                      Mandiri Bill Payment Instructions:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-neutral-600">
                      <li>Open Livin&apos; by Mandiri app or Mandiri ATM</li>
                      <li>Select <strong>Pay &rarr; New Payment &rarr; Multi Payment</strong></li>
                      <li>Select service provider: <strong>Midtrans (70012)</strong></li>
                      <li>Enter Bill Key / Customer Number: <strong>{details.billKey}</strong></li>
                      <li>Confirm payment details and finalize</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* GoPay Channel Card */}
              {details.type === "gopay" && (
                <div className="space-y-6 text-center">
                  {details.qrUrl && (
                    <div className="p-4 bg-white border-2 border-neutral-200 rounded-3xl inline-block shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={details.qrUrl}
                        alt="GoPay QR Code"
                        className="w-64 h-64 mx-auto object-contain"
                      />
                    </div>
                  )}
                  {details.deepLink && (
                    <div>
                      <a
                        href={details.deepLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md"
                      >
                        <span>Open GoPay App to Pay</span>
                        <FiExternalLink />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Convenience Store Card */}
              {details.type === "cstore" && (
                <div className="space-y-6 text-center">
                  <div className="p-6 rounded-3xl bg-neutral-50 border border-neutral-200/80 space-y-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider">
                      {details.store} Retail Outlet
                    </span>
                    <p className="text-xs text-neutral-500">
                      Show this payment code to the cashier:
                    </p>
                    <p className="text-3xl font-mono font-extrabold tracking-wider text-neutral-900 select-all">
                      {details.paymentCode}
                    </p>
                    <button
                      onClick={() => copyToClipboard(details.paymentCode, "cstore")}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-sm"
                    >
                      {copiedField === "cstore" ? <FiCheck /> : <FiCopy />}
                      <span>{copiedField === "cstore" ? "Code Copied!" : "Copy Code"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Snap Modal Card */}
              {details.type === "snap" && (
                <div className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200/80 text-center space-y-4">
                  <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                    Midtrans Payment Gateway
                  </p>
                  <p className="text-xs text-neutral-600 max-w-sm mx-auto">
                    Click the button below to open the official Midtrans payment window.
                  </p>
                  <button
                    onClick={() => {
                      if (window.snap && details.token) {
                        window.snap.pay(details.token, {
                          onSuccess: () => {
                            setPaymentCompleted(true);
                            setTimeout(() => router.push(`/account/order/${orderId}`), 2000);
                          },
                          onPending: () => handleManualCheck(),
                          onError: () => setErrorMsg("Payment failed or cancelled."),
                        });
                      } else if (details.url) {
                        window.open(details.url, "_blank");
                      }
                    }}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-md"
                  >
                    <FiCreditCard /> Open Midtrans Payment Window <FiExternalLink />
                  </button>
                </div>
              )}

              {/* Generic fallback */}
              {details.type === "generic" && (
                <div className="p-6 rounded-3xl bg-neutral-50 border border-neutral-200/80 text-center space-y-2">
                  <p className="text-xs text-neutral-500 font-medium">
                    Payment Reference
                  </p>
                  <p className="text-sm font-mono font-bold text-neutral-900">
                    {details.id}
                  </p>
                  <p className="text-xs text-amber-700">
                    Status: {String(details.status || "Pending").toUpperCase()}
                  </p>
                </div>
              )}

              {/* Total Amount Due */}
              <div className="flex justify-between items-baseline pt-4 border-t border-neutral-200 text-xs">
                <span className="text-neutral-500">Total Payment Due:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-extrabold text-neutral-900">
                    {formatRupiah(totalAmount)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(String(totalAmount), "total")}
                    title="Copy total amount"
                    className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
                  >
                    {copiedField === "total" ? <FiCheck className="text-emerald-600" /> : <FiCopy />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleManualCheck}
                  disabled={checkingStatus}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-md"
                >
                  <FiRefreshCw className={checkingStatus ? "animate-spin" : ""} />
                  <span>
                    {checkingStatus ? "Checking Payment Status..." : "Check Payment Status"}
                  </span>
                </button>

                <div>
                  <Link
                    href={`/account/order/${orderId}`}
                    className="w-full block py-2.5 px-4 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold text-center transition-colors"
                  >
                    View Invoice
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Order Items & Delivery Review */}
            <div className="lg:col-span-5 space-y-6">
              {/* Order Items */}
              <div className="rounded-3xl bg-white p-6 border border-neutral-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <h3 className="text-sm font-bold text-neutral-900">
                    Order Summary ({items.length} {items.length === 1 ? "Item" : "Items"})
                  </h3>
                  <span className="text-[11px] font-mono text-neutral-400">
                    #{orderId.slice(-6)}
                  </span>
                </div>

                <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto pr-1">
                  {items.map((item: any, idx: number) => {
                    const productObj = item._id && typeof item._id === "object" ? item._id : null;
                    const imageSrc =
                      productObj?.image_thumbnail ||
                      item.image_thumbnail ||
                      productObj?.image ||
                      item.image ||
                      (productObj?.images && productObj.images[0]) ||
                      (item.images && item.images[0]) ||
                      "/images/placeholder.png";

                    const finalImg = imageSrc.startsWith("http")
                      ? imageSrc
                      : `${process.env.NEXT_PUBLIC_IMAGE_URL || "http://localhost:5000/images"}/${imageSrc.replace(
                          /^\/+/,
                          ""
                        )}`;

                    return (
                      <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 aspect-square rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={finalImg}
                              alt={item.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&auto=format&fit=crop";
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900 line-clamp-1">{item.name}</p>
                            <p className="text-neutral-500 text-[11px]">
                              {item.quantity} &times; {formatRupiah(item.price)}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-neutral-900 shrink-0">
                          {formatRupiah(item.price * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotals breakdown */}
                <div className="pt-3 border-t border-neutral-100 space-y-1.5 text-xs text-neutral-600">
                  <div className="flex justify-between">
                    <span>Shipping Fee</span>
                    <span>{order.shipping === 0 ? "FREE" : formatRupiah(order.shipping || 0)}</span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Tax (5%)</span>
                      <span>{formatRupiah(order.tax)}</span>
                    </div>
                  )}
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount</span>
                      <span>-{formatRupiah(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-2 border-t border-neutral-200 font-bold text-neutral-900 text-sm">
                    <span>Total Payment</span>
                    <span className="text-base font-extrabold text-neutral-900">
                      {formatRupiah(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              {order.delivery_address && (
                <div className="rounded-3xl bg-white p-6 border border-neutral-200/80 shadow-sm space-y-2 text-xs">
                  <h4 className="font-bold text-neutral-900 uppercase text-[11px] tracking-wider">
                    Delivery Address
                  </h4>
                  <p className="font-semibold text-neutral-800">
                    {order.delivery_address.name}
                  </p>
                  <p className="text-neutral-500 leading-relaxed">
                    {order.delivery_address.detail}, {order.delivery_address.kelurahan},{" "}
                    {order.delivery_address.kecamatan}, {order.delivery_address.kabupaten},{" "}
                    {order.delivery_address.provinsi}
                  </p>
                </div>
              )}

              {/* Security Banner */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 flex items-center gap-3 text-[11px] text-neutral-500">
                <FiShield className="text-neutral-400 text-lg shrink-0" />
                <span>
                  Your transaction is protected by 256-bit SSL encryption and processed securely by Midtrans Payment Gateway.
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

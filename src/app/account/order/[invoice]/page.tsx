"use client";

import { InvoiceSkeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import { formatRupiah } from "@/helper";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiCreditCard,
  FiPrinter,
  FiShield,
  FiXCircle,
} from "react-icons/fi";
import { SiApple } from "react-icons/si";

interface Address {
  name: string;
  kelurahan: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  detail: string;
  _id: string;
  phone?: string;
}

interface OrderItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  product?: {
    name: string;
    image_thumbnail?: string;
    images?: string[];
  };
}

interface InvoiceData {
  _id: string;
  user?: {
    name: string;
    email: string;
  };
  delivery_address?: Address;
  quantity?: number;
  total: number;
  createdAt: string;
  tax?: number;
  shipping?: number;
  discount?: number;
  subTotal?: number;
  order?: {
    _id: string;
    total?: number;
    subTotal?: number;
    tax?: number;
    shipping?: number;
    discount?: number;
    token?: string;
    delivery_address?: Address;
    order_items?: OrderItem[];
    createdAt?: string;
    status_payment?: string;
  };
  payment_method?: string;
  status_payment: string;
  status_delivery?: string;
  payment_details?: any;
  [key: string]: any;
}

export default function OrderInvoicePage({
  params: { invoice },
}: {
  params: { invoice: string };
}) {
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoice/${invoice}`);
        if (res.ok) {
          const resData = await res.json();
          const target = (resData?.data && resData?.success !== undefined) ? resData.data : resData;
          if (target && (target.order || target._id || target.sub_total !== undefined || target.total !== undefined)) {
            setData(target);
            return;
          }
        }
        // Fallback to order endpoint
        const orderRes = await fetch(`/api/order/${invoice}`);
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          const target = (orderData?.data && orderData?.success !== undefined) ? orderData.data : orderData;
          if (target && (target.order || target._id || target.total !== undefined)) {
            setData(target);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [invoice]);

  const copyInvoiceNumber = (invNum: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(invNum);
      setCopied(true);
      toast.success(
        "Invoice Number Copied",
        `Invoice number ${invNum} copied to clipboard.`
      );
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <InvoiceSkeleton />;
  }

  if (!data) {
    return (
      <div className="text-center py-24 rounded-3xl bg-neutral-50 p-8 max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-neutral-200/60 flex items-center justify-center mx-auto text-neutral-400 text-2xl">
          <FiAlertTriangle />
        </div>
        <h2 className="text-xl font-bold text-neutral-800">
          Invoice Not Found
        </h2>
        <p className="text-xs text-neutral-500">
          Unable to find invoice data for reference number: {invoice}
        </p>
        <div className="pt-2">
          <Link
            href="/account/order"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors"
          >
            <FiArrowLeft /> Back to Order History
          </Link>
        </div>
      </div>
    );
  }

  const items = data?.order?.order_items || [];
  const totalQty = items.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const paymentStatusLower = (data.status_payment || "").toLowerCase();
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

  const invoiceNumber = `INV-${(data._id || invoice).slice(-8).toUpperCase()}`;
  const orderRefNumber = `ORD-${(data.order?._id || invoice).slice(-8).toUpperCase()}`;

  const createdDate = new Date(data.createdAt || Date.now());
  const formattedDate = createdDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = createdDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const subTotalAmount =
    data.subTotal ||
    data.order?.subTotal ||
    data.total - (data.tax || 0) - (data.shipping || 0) + (data.discount || 0);

  const deliveryAddr = data.delivery_address || data.order?.delivery_address;
  const billedUser = data.user;

  // Format payment method text
  let paymentMethodDisplay = "Midtrans Online Payment";
  if (data.payment_method) {
    const pm = data.payment_method.toLowerCase();
    if (pm.includes("qris")) paymentMethodDisplay = "QRIS (GoPay / OVO / ShopeePay / BCA)";
    else if (pm.includes("bca")) paymentMethodDisplay = "BCA Virtual Account";
    else if (pm.includes("bni")) paymentMethodDisplay = "BNI Virtual Account";
    else if (pm.includes("bri")) paymentMethodDisplay = "BRI Virtual Account";
    else if (pm.includes("mandiri")) paymentMethodDisplay = "Mandiri Bill Payment";
    else if (pm.includes("permata")) paymentMethodDisplay = "Permata Virtual Account";
    else if (pm.includes("gopay")) paymentMethodDisplay = "GoPay Direct Charge";
    else if (pm.includes("cstore") || pm.includes("indomaret")) paymentMethodDisplay = "Retail Store (Indomaret / Alfamart)";
    else paymentMethodDisplay = data.payment_method.toUpperCase();
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Action Controls (Hidden during Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 print:hidden">
        <Link
          href="/account/order"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
        >
          <FiArrowLeft /> Back to Order History
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => copyInvoiceNumber(invoiceNumber)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors shadow-sm"
          >
            {copied ? (
              <FiCheck className="text-emerald-600" />
            ) : (
              <FiCopy className="text-neutral-500" />
            )}
            <span>{copied ? "Copied!" : "Copy Invoice No."}</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-md active:scale-95"
          >
            <FiPrinter className="text-sm" />
            <span>Print / Download PDF</span>
          </button>
        </div>
      </div>

      {/* Pending Payment Alert Banner (Hidden during Print) */}
      {isPending && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3 text-amber-900">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
            <div>
              <p className="text-xs font-bold">
                Awaiting Payment for This Order
              </p>
              <p className="text-[11px] text-amber-700">
                Complete your payment before the deadline using QRIS or Virtual Account.
              </p>
            </div>
          </div>
          <Link
            href={`/checkout/payment/${data.order?._id || invoice}`}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-sm shrink-0"
          >
            <FiCreditCard /> Proceed to Payment &rarr;
          </Link>
        </div>
      )}

      {/* Cancelled / Expired Alert Banner (Hidden during Print) */}
      {isCancelled && (
        <div className="p-4 sm:p-5 rounded-2xl bg-red-50 border border-red-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3 text-red-900">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
            <div>
              <p className="text-xs font-bold">
                Payment Expired / Cancelled
              </p>
              <p className="text-[11px] text-red-700">
                The payment deadline for this order has expired. The transaction was automatically cancelled.
              </p>
            </div>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-sm shrink-0"
          >
            Start New Order &rarr;
          </Link>
        </div>
      )}

      {/* Printable Invoice Document Container */}
      <div className="printable-invoice-container rounded-3xl bg-white p-6 sm:p-12 border border-neutral-200/80 shadow-md space-y-8 print:p-0 print:border-none print:shadow-none">
        {/* 1. Header: Apple Branding & Company Legal Info */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-6 pb-8 border-b-2 border-neutral-900">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <SiApple className="text-3xl text-black" />
              <div>
                <span className="font-extrabold text-xl tracking-tight text-neutral-900 block leading-tight">
                  CYBER STORE
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">
                  Authorized Premium Apple Reseller
                </span>
              </div>
            </div>
            <div className="text-[11px] text-neutral-500 leading-relaxed pt-1 space-y-0.5">
              <p className="font-semibold text-neutral-700">
                PT Cyber Store Indonesia
              </p>
              <p>
                Menara Cyber Lt. 18, Jl. HR Rasuna Said Blok X-5 Kav. 1-2
              </p>
              <p>South Jakarta 12950, DKI Jakarta, Indonesia</p>
              <p className="text-[10px] font-mono text-neutral-400">
                Tax ID (NPWP): 01.345.678.9-012.000 &bull; KBLI: 47411 (Consumer Electronics)
              </p>
              <p className="text-[10px] text-neutral-400">
                Customer Support: cs@cyberstore.id | (021) 5088-8888
              </p>
            </div>
          </div>

          {/* Right Header: Document Title & Metadata */}
          <div className="text-left sm:text-right space-y-2 shrink-0">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-neutral-400 block">
                OFFICIAL PROOF OF PURCHASE
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 tracking-tight">
                TAX INVOICE & RECEIPT
              </h2>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex sm:justify-end items-center gap-2">
                <span className="text-neutral-400 text-[11px]">Invoice No.:</span>
                <span className="font-mono font-bold text-neutral-900 text-sm">
                  {invoiceNumber}
                </span>
              </div>
              <div className="flex sm:justify-end items-center gap-2">
                <span className="text-neutral-400 text-[11px]">Order Ref:</span>
                <span className="font-mono text-neutral-700">
                  {orderRefNumber}
                </span>
              </div>
              <div className="flex sm:justify-end items-center gap-2">
                <span className="text-neutral-400 text-[11px]">Date:</span>
                <span className="text-neutral-700">
                  {formattedDate}, {formattedTime} WIB
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="pt-2 sm:flex sm:justify-end">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  isPaid
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : isCancelled
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {isPaid ? (
                  <>
                    <FiCheckCircle className="text-emerald-600" />
                    <span>PAID</span>
                  </>
                ) : isCancelled ? (
                  <>
                    <FiXCircle className="text-red-600" />
                    <span>CANCELLED / EXPIRED</span>
                  </>
                ) : (
                  <>
                    <FiClock className="text-amber-600" />
                    <span>AWAITING PAYMENT</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Customer & Shipping Details (Clean 2-Column Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs print-avoid-break">
          {/* Billed To */}
          <div className="p-5 rounded-2xl bg-neutral-50/80 border border-neutral-200/60 space-y-2">
            <h4 className="font-bold uppercase text-[10px] tracking-wider text-neutral-400 flex items-center gap-1.5">
              <span>Billed To</span>
            </h4>
            <div className="space-y-1">
              <p className="font-bold text-neutral-900 text-sm">
                {billedUser?.name || deliveryAddr?.name || "Cyber Store Customer"}
              </p>
              <p className="text-neutral-600 font-mono text-[11px]">
                {billedUser?.email || "customer@apple.com"}
              </p>
              <div className="pt-2 text-[11px] text-neutral-500">
                <span className="font-medium text-neutral-400 block text-[10px] uppercase">
                  Payment Method:
                </span>
                <span className="font-semibold text-neutral-800">
                  {paymentMethodDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* Ship To */}
          <div className="p-5 rounded-2xl bg-neutral-50/80 border border-neutral-200/60 space-y-2">
            <h4 className="font-bold uppercase text-[10px] tracking-wider text-neutral-400 flex items-center gap-1.5">
              <span>Ship To</span>
            </h4>
            <div className="space-y-1">
              <p className="font-bold text-neutral-900 text-sm">
                {deliveryAddr?.name || "Order Recipient"}
              </p>
              <p className="text-neutral-600 leading-relaxed text-[11px]">
                {deliveryAddr?.detail ? `${deliveryAddr.detail}, ` : ""}
                {deliveryAddr?.kelurahan ? `Village/Ward: ${deliveryAddr.kelurahan}, ` : ""}
                {deliveryAddr?.kecamatan ? `District: ${deliveryAddr.kecamatan}, ` : ""}
                {deliveryAddr?.kabupaten ? `${deliveryAddr.kabupaten}, ` : ""}
                {deliveryAddr?.provinsi ? `Province: ${deliveryAddr.provinsi}` : "Registered Shipping Address"}
              </p>
              <div className="pt-2 text-[11px] text-neutral-500">
                <span className="font-medium text-neutral-400 block text-[10px] uppercase">
                  Shipping Carrier:
                </span>
                <span className="font-semibold text-neutral-800">
                  Cyber Express Insured (Official insurance covered by Cyber Store)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Itemized Table */}
        <div className="overflow-x-auto print-avoid-break">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-200 text-neutral-500 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3 pr-2 w-8">No.</th>
                <th className="py-3 px-3">Product & Specifications</th>
                <th className="py-3 px-3 text-center w-20">Quantity</th>
                <th className="py-3 px-3 text-right w-32">Unit Price</th>
                <th className="py-3 pl-3 text-right w-36">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((item, idx) => {
                const productObj =
                  item.product ||
                  (item._id && typeof item._id === "object" ? (item._id as any) : null);
                const imageSrc =
                  productObj?.image_thumbnail ||
                  (productObj?.images && productObj.images[0]) ||
                  null;

                return (
                  <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-4 pr-2 font-mono text-neutral-400 align-top">
                      {idx + 1}.
                    </td>
                    <td className="py-4 px-3 align-top">
                      <div className="flex items-start gap-3">
                        {imageSrc && (
                          <div className="w-10 h-10 aspect-square rounded-xl bg-neutral-100 p-1 border border-neutral-200/80 shrink-0 hidden sm:flex items-center justify-center print:hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imageSrc}
                              alt={item.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <div className="space-y-0.5">
                          <p className="font-bold text-neutral-900 text-xs leading-snug">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-neutral-500">
                            Official Apple 1-Year Warranty (AASP Certified)
                          </p>
                          <span className="inline-block text-[9px] font-mono text-neutral-400 uppercase">
                            SKU: {String(item._id).slice(-8).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-center font-semibold text-neutral-800 align-top">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-3 text-right font-mono text-neutral-700 align-top">
                      {formatRupiah(item.price)}
                    </td>
                    <td className="py-4 pl-3 text-right font-mono font-bold text-neutral-900 align-top">
                      {formatRupiah(item.price * item.quantity)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4. Totals Summary & Stamp */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 pt-4 border-t-2 border-neutral-200 print-avoid-break">
          {/* Left: Stamp & Legal Notice */}
          <div className="sm:col-span-6 space-y-4 text-xs text-neutral-500">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-2">
              <div className="flex items-center gap-2 text-neutral-800 font-bold text-[11px]">
                <FiShield className="text-neutral-700 text-sm" />
                <span>Authenticity Guarantee & Official Apple Warranty</span>
              </div>
              <p className="text-[10px] text-neutral-500 leading-relaxed">
                This invoice is an official proof of purchase recognized by all Apple Authorized Service Providers (iBox, Digimap, Story-i, MitraCare) across Indonesia.
              </p>
              <p className="text-[10px] font-mono text-neutral-400 pt-1 border-t border-neutral-200">
                This document is electronically issued by Cyber Store Indonesia ERP and is legally binding without a physical stamp.
              </p>
            </div>
          </div>

          {/* Right: Calculations */}
          <div className="sm:col-span-6 space-y-2 text-xs">
            <div className="space-y-2 pb-3 border-b border-neutral-200 text-neutral-600">
              <div className="flex justify-between">
                <span>Product Subtotal ({totalQty} {totalQty === 1 ? "Item" : "Items"})</span>
                <span className="font-mono font-semibold text-neutral-800">
                  {formatRupiah(subTotalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>VAT 11% (Included)</span>
                <span className="font-mono text-neutral-700">
                  {data.tax && data.tax > 0 ? formatRupiah(data.tax) : "Included"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping & Insurance</span>
                <span className="font-mono text-neutral-700">
                  {data.shipping === 0 ? "FREE" : formatRupiah(data.shipping || 0)}
                </span>
              </div>
              {Boolean(data.discount && data.discount > 0) && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Cyber Store Promo Discount</span>
                  <span className="font-mono">-{formatRupiah(data.discount || 0)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-baseline pt-2">
              <div>
                <span className="text-sm font-extrabold text-neutral-900 block">
                  Total Amount Paid
                </span>
                <span className="text-[10px] text-neutral-400">
                  (VAT Included)
                </span>
              </div>
              <span className="text-xl font-extrabold font-mono text-neutral-900 tracking-tight">
                {formatRupiah(data.total)}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Document Footer */}
        <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-neutral-400 print-avoid-break">
          <div className="flex items-center gap-1.5">
            <SiApple className="text-neutral-500" />
            <span>Cyber Store Indonesia &bull; PT Cyber Store Indonesia</span>
          </div>
          <p className="font-mono">
            Printed on: {new Date().toLocaleDateString("en-US")} {new Date().toLocaleTimeString("en-US")}
          </p>
        </div>
      </div>
    </div>
  );
}
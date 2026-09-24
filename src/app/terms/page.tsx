import { Metadata } from "next";
import Link from "next/link";
import { FiFileText, FiCheckCircle, FiRefreshCw, FiTruck, FiAlertCircle } from "react-icons/fi";

export const metadata: Metadata = {
  title: "Terms of Service & Sales Policy",
  description:
    "Official terms and conditions for purchasing Apple products and tech accessories at Cyber Store and via the Cyber Mobile application.",
};

export default function TermsPage() {
  const lastUpdated = "September 24, 2026";

  return (
    <main className="min-h-screen bg-[#080b11] text-neutral-100 pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 border-b border-neutral-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-4">
            <FiFileText className="text-sm" />
            <span>Store Policy & Terms</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Terms of Service & Sales Policy
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm">
            Last Updated: {lastUpdated} &bull; Governs all web and mobile store purchases
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-neutral-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <FiCheckCircle className="text-lg" />
              </div>
              <h2 className="text-lg font-semibold text-white">1. Product Authenticity & Pricing</h2>
            </div>
            <p className="mb-3 text-neutral-400 text-xs sm:text-sm">
              All products listed on Cyber Store and Cyber Mobile are 100% genuine, brand new, factory sealed, and backed by an official 1-year Apple authorized warranty.
            </p>
            <p className="text-neutral-400 text-xs sm:text-sm">
              All prices are listed in Indonesian Rupiah (IDR) and include applicable taxes (PPN). We reserve the right to correct typographical errors in pricing before shipment confirmation.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <FiTruck className="text-lg" />
              </div>
              <h2 className="text-lg font-semibold text-white">2. Shipping, Delivery & Real-Time Tracking</h2>
            </div>
            <p className="mb-3 text-neutral-400 text-xs sm:text-sm">
              Orders are dispatched via trusted courier partners across Indonesia. Once your package is fulfilled by our warehouse, you will receive a tracking code accessible both on the web portal and Cyber Mobile app.
            </p>
            <p className="text-neutral-400 text-xs sm:text-sm">
              Standard express delivery takes 1-3 business days for Jabodetabek and 2-5 business days for other regional areas.
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                <FiRefreshCw className="text-lg" />
              </div>
              <h2 className="text-lg font-semibold text-white">3. Returns, Warranty & Exchanges</h2>
            </div>
            <p className="mb-3 text-neutral-400 text-xs sm:text-sm">
              If an item arrives damaged or exhibits a manufacturer defect upon unboxing, you may request an exchange within <strong>7 calendar days</strong> of receiving your package, provided an unboxing video is submitted.
            </p>
            <p className="text-neutral-400 text-xs sm:text-sm">
              After 7 days, all warranty claims are serviced directly through authorized Apple Service Centers (AASP) in Indonesia under the standard Apple 1-Year Limited Warranty.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <FiAlertCircle className="text-lg" />
              </div>
              <h2 className="text-lg font-semibold text-white">4. Order Cancellations & Invoices</h2>
            </div>
            <p className="mb-3 text-neutral-400 text-xs sm:text-sm">
              Orders may be cancelled prior to warehouse dispatch. Once the shipment status transitions to &ldquo;Shipped&rdquo;, orders cannot be intercepted in transit.
            </p>
            <p className="text-neutral-400 text-xs sm:text-sm">
              Official digital PDF tax invoices are generated upon payment verification and can be downloaded indefinitely through your account dashboard.
            </p>
          </section>
        </div>

        {/* Footer navigation */}
        <div className="mt-12 flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800 pt-6">
          <Link href="/privacy-policy" className="hover:text-cyan-400 transition-colors">
            &larr; View Privacy Policy
          </Link>
          <Link href="/support" className="hover:text-cyan-400 transition-colors">
            Customer Support &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}

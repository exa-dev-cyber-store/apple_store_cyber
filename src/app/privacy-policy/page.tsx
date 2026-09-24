import { Metadata } from "next";
import Link from "next/link";
import { FiShield, FiLock, FiEye, FiServer, FiTrash2, FiMail } from "react-icons/fi";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Cyber Store & Cyber Mobile App Privacy Policy. Learn how we collect, protect, and manage your personal information across our web and mobile applications.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "September 24, 2026";

  return (
    <main className="min-h-screen bg-[#080b11] text-neutral-100 pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 border-b border-neutral-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-4">
            <FiShield className="text-sm" />
            <span>Official Privacy Standard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Privacy Policy
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm">
            Last Updated: {lastUpdated} &bull; Applies to Cyber Web Store & Cyber Mobile (iOS & Android)
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-neutral-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <FiEye className="text-lg" />
              </div>
              <h2 className="text-lg font-semibold text-white">1. Introduction & Overview</h2>
            </div>
            <p className="mb-3">
              Cyber Store (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting your privacy and ensuring transparency in how your personal data is collected, stored, and utilized when you interact with our web storefront and the <strong>Cyber Mobile Application</strong> (available on Apple App Store, Apple TestFlight, and Google Play Store).
            </p>
            <p>
              By accessing our services or downloading our mobile client, you acknowledge the terms outlined in this Privacy Policy.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <FiServer className="text-lg" />
              </div>
              <h2 className="text-lg font-semibold text-white">2. Information We Collect</h2>
            </div>
            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <h3 className="font-semibold text-white mb-1">A. Account & Contact Information</h3>
                <p className="text-neutral-400">
                  When you register, place orders, or sign in via Google / Apple Sign-In, we collect your name, email address, phone number, and encrypted authentication tokens.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">B. Shipping & Delivery Data</h3>
                <p className="text-neutral-400">
                  Recipient name, physical delivery address, postal code, city, province, and optional GPS delivery coordinates to ensure timely courier fulfillment across Indonesia.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">C. Camera & Photo Library Access (Mobile App)</h3>
                <p className="text-neutral-400">
                  When you choose to upload a custom profile picture, the app requests permission (<code>NSCameraUsageDescription</code> and <code>NSPhotoLibraryUsageDescription</code>). We only access the specific photo you crop and select; we never scan or index your photo library in the background.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">D. Push Notification Tokens & Diagnostics</h3>
                <p className="text-neutral-400">
                  With your permission, we collect Firebase Cloud Messaging (FCM) device tokens to send real-time order status alerts and shipping updates. Diagnostic telemetry is gathered strictly to monitor app performance and crash reports.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                <FiLock className="text-lg" />
              </div>
              <h2 className="text-lg font-semibold text-white">3. Payment Security & Financial Data</h2>
            </div>
            <p className="mb-3">
              We do <strong>not</strong> store sensitive credit card numbers, CVVs, or bank account PINs on Cyber Store servers.
            </p>
            <p className="text-neutral-400 text-xs sm:text-sm">
              All payment transactions are handled through <strong>Midtrans</strong> (PT Midtrans Indonesia), a PCI-DSS compliant payment gateway. Transactions are encrypted using end-to-end 256-bit TLS encryption protocols.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <FiShield className="text-lg" />
              </div>
              <h2 className="text-lg font-semibold text-white">4. Third-Party Integrations & SDKs</h2>
            </div>
            <p className="mb-3 text-neutral-400 text-xs sm:text-sm">
              Our mobile and web applications use selected third-party services that adhere to stringent international data protection standards:
            </p>
            <ul className="list-disc list-inside space-y-2 text-neutral-400 text-xs sm:text-sm pl-2">
              <li><strong>Google Sign-In & Apple Sign-In</strong>: For secure OAuth2 single sign-on authentication.</li>
              <li><strong>Firebase Cloud Messaging (FCM)</strong>: For delivering immediate order status push alerts.</li>
              <li><strong>Midtrans Payment Gateway</strong>: For secure online payment processing.</li>
              <li><strong>Loki Telemetry</strong>: For anonymous crash analytics and application reliability monitoring.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                <FiTrash2 className="text-lg" />
              </div>
              <h2 className="text-lg font-semibold text-white">5. Account Deletion & User Data Rights</h2>
            </div>
            <p className="mb-3 text-neutral-300 text-xs sm:text-sm">
              In full compliance with <strong>Apple App Store Connect Guideline 5.1.1</strong> and <strong>Google Play Data Safety Requirements</strong>, you have the right to request deletion of your account and all associated personal data at any time.
            </p>
            <div className="bg-neutral-950/80 rounded-xl p-4 border border-neutral-800 text-xs text-neutral-400 space-y-2">
              <p className="font-semibold text-white">How to submit a deletion request:</p>
              <p>
                1. Send an email to <a href="mailto:privacy@cyberstore.id" className="text-cyan-400 underline">privacy@cyberstore.id</a> from the registered email address with the subject <em>&ldquo;Account Deletion Request&rdquo;</em>.
              </p>
              <p>
                2. Our data protection team will verify your request and permanently purge your account, profile photos, addresses, and marketing subscriptions within 7 business days.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <FiMail className="text-lg" />
              </div>
              <h2 className="text-lg font-semibold text-white">6. Contact Our Data Protection Officer</h2>
            </div>
            <p className="text-neutral-400 text-xs sm:text-sm mb-4">
              If you have any questions, concerns, or inquiries regarding our privacy practices, please contact us:
            </p>
            <div className="text-xs text-neutral-300 space-y-1">
              <p><strong>Cyber Store Indonesia</strong></p>
              <p>Email: <a href="mailto:privacy@cyberstore.id" className="text-cyan-400">privacy@cyberstore.id</a> / <a href="mailto:support@cyberstore.id" className="text-cyan-400">support@cyberstore.id</a></p>
              <p>Headquarters: Jakarta, Indonesia</p>
            </div>
          </section>
        </div>

        {/* Back navigation */}
        <div className="mt-12 text-center">
          <Link
            href="/support"
            className="text-xs text-neutral-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-2"
          >
            &larr; Back to Help Center
          </Link>
        </div>
      </div>
    </main>
  );
}

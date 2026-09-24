import { Metadata } from "next";
import Link from "next/link";
import {
  FiHelpCircle,
  FiMail,
  FiPhone,
  FiMessageSquare,
  FiTruck,
  FiShield,
  FiCreditCard,
  FiSmartphone,
  FiFileText,
  FiTrash2,
} from "react-icons/fi";

export const metadata: Metadata = {
  title: "Customer Support & Help Center",
  description:
    "Official support center for Cyber Store and Cyber Mobile App. Get help with orders, delivery tracking, Apple warranty, payments, and account management.",
};

export default function SupportPage() {
  const supportCategories = [
    {
      icon: FiTruck,
      title: "Orders & Delivery",
      description: "Track shipment status, courier options, and delivery timelines across Indonesia.",
      link: "/account/order",
      linkText: "Track Orders",
    },
    {
      icon: FiShield,
      title: "Apple Warranty & Service",
      description: "1-year official authorized warranty, claims process, and repair centers.",
      link: "/shop",
      linkText: "Warranty Info",
    },
    {
      icon: FiCreditCard,
      title: "Payments & Invoices",
      description: "Midtrans payment gateways, 0% installments, tax invoices, and PDF downloads.",
      link: "/cart",
      linkText: "Payment Help",
    },
    {
      icon: FiSmartphone,
      title: "Cyber Mobile App",
      description: "iOS (TestFlight / App Store) and Android (Google Play) features, push alerts, and troubleshooting.",
      link: "#mobile-faq",
      linkText: "App FAQs",
    },
  ];

  const faqs = [
    {
      question: "How do I track my order status?",
      answer:
        "You can track your order in real time either through the Cyber Mobile app (Order History tab) or on our web platform under Account > Orders. You will see real-time updates as your package moves from Pending, Processing, Shipped (with courier tracking number), to Delivered.",
    },
    {
      question: "Are all products 100% authentic with official Apple warranty?",
      answer:
        "Yes. Cyber Store is an authorized reseller. Every Apple device (iPhone, MacBook, iPad, Apple Watch, AirPods) comes brand new in factory sealed packaging with a 1-year official Apple warranty claimable at any authorized service provider.",
    },
    {
      question: "What payment methods are supported?",
      answer:
        "We support secure instant checkout via Midtrans, including Credit/Debit cards (Visa, Mastercard, JCB, Amex), Virtual Account bank transfers (BCA, Mandiri, BNI, BRI), GoPay, QRIS, and major 0% credit card installment plans up to 24 months.",
    },
    {
      question: "How do digital invoices and PDF receipts work?",
      answer:
        "Once payment is verified, an official tax invoice is automatically generated. You can view, download, or print your PDF invoice anytime from the Cyber Mobile app or your web order history.",
    },
    {
      question: "How do I update or delete my account and personal data?",
      answer:
        "You have full control over your data. To update your profile, visit your Account settings. To permanently delete your account and all associated order history per Apple & Google privacy standards, email us at privacy@cyberstore.id with the subject 'Account Deletion Request' or submit the support form below.",
    },
    {
      question: "What should I do if I experience an issue with the Cyber Mobile app?",
      answer:
        "Ensure your app is updated to the latest version on the Apple App Store or Google Play Store. If you encounter any bugs, crashes, or notification issues, reach out to our mobile engineering team at support@cyberstore.id with your device model and OS version.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#080b11] text-neutral-100 pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-4">
            <FiHelpCircle className="text-sm" />
            <span>Cyber Help & Customer Support</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            How can we help you today?
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
            Get instant support for your Cyber Store purchases, mobile app features, delivery inquiries, and official Apple product warranty.
          </p>
        </div>

        {/* Support Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {supportCategories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-cyan-500/40 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
                    <Icon className="text-2xl" />
                  </div>
                  <h3 className="font-semibold text-white text-base mb-2">{cat.title}</h3>
                  <p className="text-neutral-400 text-xs leading-relaxed mb-4">{cat.description}</p>
                </div>
                <Link
                  href={cat.link}
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5 transition-colors"
                >
                  {cat.linkText} &rarr;
                </Link>
              </div>
            );
          })}
        </div>

        {/* Contact Channels Grid */}
        <div className="bg-gradient-to-r from-neutral-900/90 via-neutral-900/60 to-neutral-900/90 border border-neutral-800 rounded-2xl p-8 mb-16">
          <h2 className="text-xl font-bold text-white mb-2">Direct Contact Channels</h2>
          <p className="text-neutral-400 text-xs mb-6">
            Our support team is available Monday through Sunday, 08:00 - 22:00 WIB.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400">
                <FiMail className="text-xl" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Email Support</h4>
                <p className="text-neutral-400 text-xs mt-0.5">support@cyberstore.id</p>
                <span className="text-[11px] text-cyan-400 mt-1 inline-block">Response within 2 hours</span>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <div className="p-3 rounded-lg bg-green-500/10 text-green-400">
                <FiPhone className="text-xl" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Customer Hotline</h4>
                <p className="text-neutral-400 text-xs mt-0.5">+62 21 555 0199</p>
                <span className="text-[11px] text-green-400 mt-1 inline-block">Toll-free in Indonesia</span>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
                <FiMessageSquare className="text-xl" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Live Consultation</h4>
                <p className="text-neutral-400 text-xs mt-0.5">WhatsApp Specialist</p>
                <span className="text-[11px] text-blue-400 mt-1 inline-block">Chat with Apple Advisor</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div id="mobile-faq" className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">Frequently Asked Questions</h2>
            <p className="text-neutral-400 text-xs">
              Quick answers to common questions regarding store policies, mobile app features, and orders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-6 hover:border-neutral-700 transition-colors"
              >
                <h3 className="text-sm font-semibold text-white mb-2.5 flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">Q:</span>
                  {faq.question}
                </h3>
                <p className="text-neutral-400 text-xs leading-relaxed pl-5">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* App Store & Data Safety Section */}
        <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <FiTrash2 className="text-sm" />
              <span>Data Protection & Account Deletion</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Need to remove your account or request data deletion?
            </h3>
            <p className="text-neutral-400 text-xs leading-relaxed">
              In full compliance with Apple App Store Connect and Google Play Store Developer Guidelines, users can request complete removal of their personal profile, shipping addresses, and transaction history at any time.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/privacy-policy"
              className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-medium transition-colors text-center"
            >
              Privacy Policy
            </Link>
            <a
              href="mailto:privacy@cyberstore.id?subject=Account%20Deletion%20Request"
              className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium transition-colors text-center"
            >
              Request Account Deletion
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

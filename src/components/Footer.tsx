import Link from "next/link";
import Image from "next/image";
import { FiShield, FiTruck, FiCreditCard, FiHeadphones } from "react-icons/fi";

export default function Footer() {
  const perks = [
    {
      icon: FiTruck,
      title: "Free Express Shipping",
      desc: "Complimentary courier delivery nationwide in Indonesia",
    },
    {
      icon: FiShield,
      title: "Official Apple Warranty",
      desc: "100% authentic products with 1-year authorized warranty",
    },
    {
      icon: FiCreditCard,
      title: "Flexible Payment Options",
      desc: "Midtrans secure checkout with 0% installment plans",
    },
    {
      icon: FiHeadphones,
      title: "24/7 Expert Support",
      desc: "Consult directly with certified Apple product specialists",
    },
  ];

  return (
    <footer className="bg-neutral-950 text-neutral-400 text-xs border-t border-neutral-900 mt-24">
      {/* Perks Banner */}
      <div className="border-b border-neutral-800/60 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {perks.map((perk, i) => {
            const Icon = perk.icon;
            return (
              <div key={i} className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white">
                  <Icon className="text-xl" />
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-200 text-sm">{perk.title}</h4>
                  <p className="text-neutral-400 text-xs mt-0.5 leading-relaxed">{perk.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Directory Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          <div>
            <h5 className="font-semibold text-neutral-200 mb-3">Shop Apple</h5>
            <ul className="space-y-2">
              <li>
                <Link href="/shop?category=iPhone" className="hover:text-white transition-colors">
                  iPhone
                </Link>
              </li>
              <li>
                <Link href="/shop?category=MacBook" className="hover:text-white transition-colors">
                  MacBook & iMac
                </Link>
              </li>
              <li>
                <Link href="/shop?category=iPad" className="hover:text-white transition-colors">
                  iPad
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Apple%20Watch" className="hover:text-white transition-colors">
                  Apple Watch
                </Link>
              </li>
              <li>
                <Link href="/shop?category=AirPods" className="hover:text-white transition-colors">
                  AirPods & Audio
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-neutral-200 mb-3">Cyber Services</h5>
            <ul className="space-y-2">
              <li>
                <Link href="/support" className="hover:text-white transition-colors">
                  Customer Support
                </Link>
              </li>
              <li>
                <Link href="/account/order" className="hover:text-white transition-colors">
                  Order Status & Tracking
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white transition-colors">
                  AppleCare+ & Warranty
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white transition-colors">
                  Delivery Information
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-neutral-200 mb-3">Account & Settings</h5>
            <ul className="space-y-2">
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  Manage Profile
                </Link>
              </li>
              <li>
                <Link href="/account/order" className="hover:text-white transition-colors">
                  Order History & Invoices
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">
                  Shopping Bag
                </Link>
              </li>
              <li>
                <Link href="/likes" className="hover:text-white transition-colors">
                  Wishlist & Favorites
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-neutral-200 mb-3">About Cyber</h5>
            <ul className="space-y-2">
              <li>
                <span className="text-neutral-400">Authorized Premium Reseller</span>
              </li>
              <li>
                <span className="text-neutral-400">Jakarta, Indonesia</span>
              </li>
              <li>
                <Link href="/support" className="text-cyan-400 hover:underline">
                  support@cyberstore.id
                </Link>
              </li>
              <li>
                <span className="text-neutral-400">+62 21 555 0199</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md p-[1px] bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center">
              <div className="w-full h-full bg-[#080b11] rounded-[5px] flex items-center justify-center p-0.5">
                <Image
                  src="/logo.png"
                  alt="Cyber Apple Logo"
                  width={14}
                  height={14}
                  className="w-full h-full object-contain drop-shadow-[0_0_4px_rgba(6,182,212,0.8)]"
                />
              </div>
            </div>
            <span>Copyright &copy; {new Date().getFullYear()} Cyber Apple Store. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-neutral-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-neutral-300 transition-colors">Terms of Use</Link>
            <Link href="/terms" className="hover:text-neutral-300 transition-colors">Sales Policy</Link>
            <Link href="/support" className="hover:text-neutral-300 transition-colors">Help Center</Link>
            <span className="text-neutral-600">Indonesia (IDR)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
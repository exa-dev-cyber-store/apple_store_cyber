"use client";

import { useEffect, useState } from "react";
import SideBar from "@/components/shop/SideBar";
import { usePathname } from "next/navigation";

interface CategoryType {
  name: string;
  _id?: string;
  id?: string;
}

const DEFAULT_CATEGORIES: CategoryType[] = [
  { name: "iPhone" },
  { name: "iPad" },
  { name: "MacBook" },
  { name: "Apple Watch" },
  { name: "AirPods" },
];

export default function ShopLayoutClient({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<CategoryType[]>(DEFAULT_CATEGORIES);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const catList = Array.isArray(data) ? data : (data?.data || data?.categories || []);
        if (Array.isArray(catList) && catList.length > 0) {
          setCategories(catList);
        }
      })
      .catch(() => {});
  }, []);

  const isCatalogRoot = pathname === "/shop" || pathname === "/shop/";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10 min-h-screen">
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {isCatalogRoot && <SideBar categories={categories} />}
        <div className="flex-1 w-full min-w-0">{children}</div>
      </div>
    </div>
  );
}

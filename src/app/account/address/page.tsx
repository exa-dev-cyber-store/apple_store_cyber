"use client";

import { AddressListSkeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiEdit2, FiMapPin, FiPlus, FiTrash2, FiUser } from "react-icons/fi";

interface Address {
  name: string;
  kelurahan: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  detail: string;
  _id: string;
}

export default function AddressPage() {
  const [address, setAddress] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const res = await fetch("/api/delivery-address");
        if (!res.ok) {
          throw new Error("Failed to fetch address");
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.data || data?.deliveryAddresses || []);
        setAddress(list);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAddress();
  }, []);

  function confirmDelete(id: string, name: string) {
    toast.alert({
      title: "Delete Shipping Address?",
      message: `Are you sure you want to delete the shipping address "${name}"? This action cannot be undone.`,
      confirmText: "Delete Address",
      type: "warning",
      onConfirm: () => executeDelete(id),
    });
  }

  async function executeDelete(id: string) {
    setDeletingId(id);
    try {
      await axios.delete(`/api/delivery-address/${id}`);
      setAddress((prev) => prev.filter((item) => item._id !== id));
      toast.success(
        "Address Deleted",
        "Shipping address has been successfully deleted from your account."
      );
    } catch {
      toast.error(
        "Failed to Delete",
        "An error occurred while deleting the address. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <AddressListSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Shipping Addresses
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage your delivery addresses for seamless checkout
          </p>
        </div>
        <Link
          href="/account/address/create-alamat"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-95 shrink-0"
        >
          <FiPlus className="text-sm" />
          <span>Add New Address</span>
        </Link>
      </div>

      {/* Empty State */}
      {address.length === 0 ? (
        <div className="rounded-3xl bg-neutral-50/80 border border-neutral-200/80 p-10 sm:p-14 text-center space-y-4 max-w-lg mx-auto my-8">
          <div className="w-14 h-14 rounded-full bg-neutral-200/60 flex items-center justify-center mx-auto text-neutral-500 text-2xl">
            <FiMapPin />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              No Saved Addresses Yet
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Add your first shipping address to speed up your checkout experience at Cyber Store.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/account/address/create-alamat"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all"
            >
              <FiPlus /> Add Address Now
            </Link>
          </div>
        </div>
      ) : (
        /* Address Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {address.map((data, idx) => (
            <div
              key={data._id}
              className="rounded-3xl bg-white p-6 border border-neutral-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 text-xs font-bold">
                      <FiUser />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 leading-tight">
                        {data.name}
                      </h3>
                      <span className="text-[10px] font-mono text-neutral-400">
                        Address #{idx + 1}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-600">
                    <FiMapPin className="text-[10px]" /> Saved
                  </span>
                </div>

                {/* Address Body */}
                <div className="space-y-1.5 pt-1 text-xs text-neutral-600 leading-relaxed">
                  <p className="font-semibold text-neutral-800">
                    {data.kelurahan}, {data.kecamatan}
                  </p>
                  <p className="text-neutral-500">
                    {data.kabupaten}, {data.provinsi}
                  </p>
                  <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 text-neutral-700 text-[11px] font-medium mt-2">
                    <span className="text-neutral-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                      Landmark / Details:
                    </span>
                    {data.detail}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
                <Link
                  href={`/account/address/edit-alamat/${data._id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-full border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition-colors shadow-sm"
                >
                  <FiEdit2 className="text-xs" />
                  <span>Edit Address</span>
                </Link>
                <button
                  onClick={() => confirmDelete(data._id, data.name)}
                  disabled={deletingId === data._id}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <FiTrash2 className="text-xs" />
                  <span>{deletingId === data._id ? "Deleting..." : "Delete"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
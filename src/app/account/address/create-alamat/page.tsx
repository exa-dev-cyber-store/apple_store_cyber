"use client";

import Select from "@/components/account/Select";
import TextArea from "@/components/account/TextArea";
import { toast } from "@/components/ui/Toast";
import {
  getKecamatan,
  getKelurahan,
  getKota,
  getProvinsi,
} from "@/services/wilayah";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiMapPin,
  FiUser,
} from "react-icons/fi";

interface EventSubmit extends FormEvent<HTMLFormElement> {
  target: HTMLFormElement & {
    name: {
      value: string;
    };
    detail: {
      value: string;
    };
  };
}

export default function CreateAlamat() {
  const router = useRouter();

  const [submit, setSubmit] = useState(false);

  const [error, setError] = useState({
    name: false,
    detail: false,
  });

  const [data, setData] = useState({
    provinsi: [],
    kabupaten: [],
    kecamatan: [],
    kelurahan: [],
  });
  const [id, setId] = useState({
    provinsi: "",
    kabupaten: "",
    kecamatan: "",
    kelurahan: "",
  });
  const [address, setAddress] = useState({
    provinsi: "",
    kabupaten: "",
    kecamatan: "",
    kelurahan: "",
  });

  useEffect(() => {
    getProvinsi().then((res) => {
      setData((prevData) => ({
        ...prevData,
        provinsi: res || [],
      }));
    });
  }, []);

  useEffect(() => {
    if (id.provinsi) {
      getKota(id.provinsi).then((res) => {
        setData((prevData) => ({
          ...prevData,
          kabupaten: res || [],
        }));
      });
    }
  }, [id.provinsi]);

  useEffect(() => {
    if (id.kabupaten) {
      getKecamatan(id.kabupaten).then((res) => {
        setData((prevData) => ({
          ...prevData,
          kecamatan: res || [],
        }));
      });
    }
  }, [id.kabupaten]);

  useEffect(() => {
    if (id.kecamatan) {
      getKelurahan(id.kecamatan).then((res) => {
        setData((prevData) => ({
          ...prevData,
          kelurahan: res || [],
        }));
      });
    }
  }, [id.kecamatan]);

  function handleName(label: string, name: string) {
    if (label === "provinsi" && address.kabupaten !== "") {
      setAddress({
        ...address,
        kabupaten: "",
        kecamatan: "",
        kelurahan: "",
      });
      setId({
        ...id,
        kabupaten: "",
        kecamatan: "",
        kelurahan: "",
      });
      setData({
        ...data,
        kabupaten: [],
        kecamatan: [],
        kelurahan: [],
      });
    }
    setAddress((prev) => ({
      ...prev,
      [label]: name,
    }));
  }

  function handleSelect(label: string, value: string) {
    setId((prev) => ({
      ...prev,
      [label]: value,
    }));
  }

  const handleSubmit = (e: EventSubmit) => {
    e.preventDefault();
    setSubmit(true);
    const detail = e.target.detail.value;
    const name = e.target.name.value;
    const errObj = {
      name: false,
      detail: false,
    };

    if (name.trim().length < 3) {
      errObj.name = true;
    }

    if (detail.trim().length < 3) {
      errObj.detail = true;
    }

    if (errObj.name || errObj.detail) {
      setError(errObj);
      setSubmit(false);
      return;
    }

    const payload = { ...address, detail, name };
    fetch("/api/delivery-address", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.ok) {
          toast.success(
            "Address Saved",
            "New shipping address has been successfully added."
          );
          router.push("/account/address");
        } else {
          toast.error(
            "Failed to Save",
            "An error occurred while adding the new address."
          );
        }
      })
      .catch((err) => {
        toast.error(
          "Failed to Save",
          "Unable to connect to the server. Please try again."
        );
        console.error(err);
      })
      .finally(() => {
        setSubmit(false);
      });
  };

  const isFormIncomplete =
    !id.provinsi || !id.kabupaten || !id.kecamatan || !id.kelurahan;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Back Link */}
      <div>
        <Link
          href="/account/address"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
        >
          <FiArrowLeft /> Back to Addresses
        </Link>
      </div>

      {/* Main Form Card */}
      <div className="rounded-3xl bg-white p-6 sm:p-10 border border-neutral-200/80 shadow-sm space-y-8">
        {/* Card Header */}
        <div className="pb-6 border-b border-neutral-100">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 mb-2">
            <FiMapPin /> Shipping Address
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Add New Address
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Fill out the address details below for your Apple orders
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Penerima */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Recipient Information
            </h3>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                Recipient Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. John Appleseed"
                  name="name"
                  className={`w-full rounded-2xl border px-4 py-3 text-xs font-medium outline-none transition-all pl-10 ${
                    error.name
                      ? "bg-red-50/40 border-red-300 text-neutral-900 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "bg-white border-neutral-200 hover:border-neutral-300 text-neutral-900 focus:border-black focus:ring-2 focus:ring-black/5 shadow-sm"
                  }`}
                  required
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
                  <FiUser className="text-sm" />
                </div>
              </div>
              {error.name && (
                <div className="flex items-center gap-1 text-[11px] text-red-500 font-medium pt-0.5">
                  <FiAlertCircle className="shrink-0" />
                  <span>Name must be at least 3 characters</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Wilayah Administratif */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Delivery Region (Indonesia)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                name="provinsi"
                label="Province"
                handleName={handleName}
                handleSelect={handleSelect}
                options={data.provinsi}
              />
              <Select
                name="kabupaten"
                label="City / Regency"
                handleName={handleName}
                handleSelect={handleSelect}
                options={data.kabupaten}
              />
              <Select
                name="kecamatan"
                label="District"
                handleName={handleName}
                handleSelect={handleSelect}
                options={data.kecamatan}
              />
              <Select
                name="kelurahan"
                label="Sub-district / Village"
                handleName={handleName}
                handleSelect={handleSelect}
                options={data.kelurahan}
              />
            </div>
          </div>

          {/* Section 3: Detail Alamat */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Street Address & Landmarks
            </h3>
            <TextArea
              label="Street Address (Street name, house number, landmarks)"
              name="detail"
              placeholder="e.g. 45 Sudirman St, House No. 12, near security post"
              error={error.detail ? "Address details must be at least 3 characters" : undefined}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-100">
            <Link
              href="/account/address"
              className="py-3 px-6 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm"
            >
              Cancel
            </Link>
            <button
              disabled={submit || isFormIncomplete}
              type="submit"
              className={`inline-flex items-center gap-2 py-3 px-8 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-md active:scale-95 ${
                submit || isFormIncomplete
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-[1.02]"
              }`}
            >
              <FiCheck className="text-sm" />
              <span>{submit ? "Saving Address..." : "Save Address"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
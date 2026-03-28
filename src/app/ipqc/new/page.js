"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import IPQCForm from "@/components/IPQCForm";
import { ipqc } from "@/lib/api";
import { getSession } from "@/lib/auth";

export default function NewIPQCPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getSession()) router.push("/");
  }, [router]);

  async function handleSubmit(data) {
    setLoading(true);
    try {
      const user = getSession();
      const res = await ipqc.create({ ...data, checked_by: user?.displayName });
      alert(`IPQC created: ${res.ipqc_no}`);
      router.push("/dashboard");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <h1 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">New IPQC Record</h1>
        <IPQCForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}

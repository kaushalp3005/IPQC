"use client";
import { printRecord } from "@/lib/printRecord";

export default function IPQCPrint({ record }) {
  return (
    <button
      onClick={() => printRecord(record)}
      className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-slate-800 hover:to-slate-900 shadow-md shadow-slate-500/20 transition-all active:scale-[0.98]"
    >
      Print
    </button>
  );
}

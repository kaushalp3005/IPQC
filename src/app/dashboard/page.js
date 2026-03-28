"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ipqc, dropdown as dropdownApi } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { printRecord } from "@/lib/printRecord";

export default function DashboardPage() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [factoryCode, setFactoryCode] = useState("");
  const [floor, setFloor] = useState("");
  const [factoriesData, setFactoriesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSessionState] = useState(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.push("/");
      return;
    }
    setSessionState(s);
    dropdownApi.getFactoriesFloors().then(setFactoriesData).catch(() => {});
  }, [router]);

  const selectedFactory = factoriesData.factories?.find(
    (f) => f.factory_code === factoryCode
  );
  const availableFloors = selectedFactory?.floors || [];

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ipqc.list({
        page,
        per_page: 20,
        search: search || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        factory_code: factoryCode || undefined,
        floor: floor || undefined,
      });
      setRecords(res.records);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, fromDate, toDate, factoryCode, floor]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  async function handleDelete(ipqcNo) {
    if (!confirm(`Delete ${ipqcNo}?`)) return;
    try {
      await ipqc.delete(ipqcNo);
      fetchRecords();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handlePrint(ipqcNo) {
    try {
      const fullRecord = await ipqc.get(ipqcNo);
      printRecord(fullRecord);
    } catch (err) {
      alert("Failed to load record for printing: " + err.message);
    }
  }

  const isAdmin = session?.isAdmin;

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">IPQC Records</h1>
          <button
            onClick={() => router.push("/ipqc/new")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 sm:py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] w-full sm:w-auto"
          >
            + New IPQC
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-4 sm:mb-6">
          {/* Row 1: Search + Date Range */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search records..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <span className="text-xs text-gray-500 whitespace-nowrap">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          {/* Row 2: Factory > Floor + Record count */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <select
              value={factoryCode}
              onChange={(e) => {
                setFactoryCode(e.target.value);
                setFloor("");
                setPage(1);
              }}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">All Factories</option>
              {factoriesData.factories?.map((f) => (
                <option key={f.factory_code} value={f.factory_code}>
                  {f.factory_code}
                </option>
              ))}
            </select>
            {factoryCode && availableFloors.length > 0 && (
              <select
                value={floor}
                onChange={(e) => {
                  setFloor(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">All Floors</option>
                {availableFloors.map((fl) => (
                  <option key={fl.id} value={fl.floor_name}>
                    {fl.floor_name}
                  </option>
                ))}
              </select>
            )}
            {(search || fromDate || toDate || factoryCode) && (
              <button
                onClick={() => {
                  setSearch("");
                  setFromDate("");
                  setToDate("");
                  setFactoryCode("");
                  setFloor("");
                  setPage(1);
                }}
                className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
              >
                Clear filters
              </button>
            )}
            <span className="text-sm text-gray-400 sm:ml-auto">
              {total} record{total !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">IPQC No.</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Articles</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Factory</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Approved By</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <svg className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No records found
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const arts = r.articles?.length
                    ? r.articles
                    : [{ item_description: r.item_description, customer: r.customer, batch_number: r.batch_number, verdict: r.verdict }];
                  return (
                    <tr key={r.ipqc_no} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-blue-600 font-medium">
                        {r.ipqc_no}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{r.check_date}</td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-1.5">
                          {arts.map((a, i) => (
                            <div key={i} className="flex items-center gap-2 flex-wrap">
                              <span className="text-gray-800 font-medium">{a.item_description || "-"}</span>
                              <span className="text-gray-300">|</span>
                              <span className="text-gray-500 text-xs">{a.customer || "-"}</span>
                              <span className="text-gray-300">|</span>
                              <span className="text-gray-500 text-xs">{a.batch_number || "-"}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  (a.verdict || r.verdict) === "accept"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {a.verdict || r.verdict}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {r.factory_code}
                        {r.floor ? ` / ${r.floor}` : ""}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {r.approved_by || "-"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1">
                          <button
                            onClick={() => router.push(`/ipqc/view?id=${r.ipqc_no}`)}
                            className="text-blue-600 hover:bg-blue-50 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handlePrint(r.ipqc_no)}
                            className="text-gray-600 hover:bg-gray-100 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                          >
                            Print
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => router.push(`/ipqc/view?id=${r.ipqc_no}`)}
                              className="text-amber-600 hover:bg-amber-50 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                            >
                              Edit
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(r.ipqc_no)}
                              className="text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading...
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No records found</div>
          ) : (
            records.map((r) => {
              const arts = r.articles?.length
                ? r.articles
                : [{ item_description: r.item_description, customer: r.customer, batch_number: r.batch_number, verdict: r.verdict }];
              return (
                <div key={r.ipqc_no} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-mono text-blue-600 font-semibold text-sm">{r.ipqc_no}</span>
                      <div className="text-xs text-gray-400 mt-0.5">{r.check_date}</div>
                    </div>
                    <span className="text-xs text-gray-500">{r.factory_code}{r.floor ? ` / ${r.floor}` : ""}</span>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {arts.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-800 font-medium">{a.item_description || "-"}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            (a.verdict || r.verdict) === "accept"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {a.verdict || r.verdict}
                        </span>
                      </div>
                    ))}
                  </div>
                  {r.approved_by && (
                    <div className="text-xs text-gray-400 mb-3">Approved: {r.approved_by}</div>
                  )}
                  <div className="flex gap-2 border-t border-gray-100 pt-3">
                    <button
                      onClick={() => router.push(`/ipqc/view?id=${r.ipqc_no}`)}
                      className="flex-1 text-center text-blue-600 bg-blue-50 py-2 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handlePrint(r.ipqc_no)}
                      className="flex-1 text-center text-gray-600 bg-gray-100 py-2 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Print
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(r.ipqc_no)}
                        className="text-red-600 bg-red-50 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50 bg-white transition-colors"
            >
              Prev
            </button>
            <span className="text-sm text-gray-500 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50 bg-white transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

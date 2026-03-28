"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getSession } from "@/lib/auth";
import { users } from "@/lib/api";

export default function MembersPage() {
  const router = useRouter();
  const [memberList, setMemberList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    display_name: "",
    is_admin: false,
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  const [viewMember, setViewMember] = useState(null);

  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session) { router.push("/"); return; }
    if (!session.isAdmin) { router.push("/dashboard"); return; }
  }, [router]);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await users.list();
      setMemberList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const session = getSession();
    if (session?.isAdmin) fetchMembers();
  }, [fetchMembers]);

  async function handleAddUser(e) {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");
    setAddLoading(true);
    try {
      await users.register(newUser);
      setAddSuccess("Member added successfully");
      setNewUser({ username: "", password: "", display_name: "", is_admin: false });
      setShowAddForm(false);
      fetchMembers();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");
    setResetLoading(true);
    try {
      await users.resetPassword(resetTarget, newPassword);
      setResetSuccess(`Password reset for ${resetTarget}`);
      setResetTarget(null);
      setNewPassword("");
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">Member Management</h1>
          <button
            onClick={() => { setShowAddForm(!showAddForm); setAddError(""); setAddSuccess(""); }}
            className={`px-4 py-2 sm:py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-[0.98] w-full sm:w-auto ${
              showAddForm
                ? "bg-gray-200 text-gray-700 shadow-none hover:bg-gray-300"
                : "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-500/20 hover:from-blue-700 hover:to-blue-800"
            }`}
          >
            {showAddForm ? "Cancel" : "Add Member"}
          </button>
        </div>

        {/* Success banners */}
        {addSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-4 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {addSuccess}
          </div>
        )}
        {resetSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-4 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {resetSuccess}
          </div>
        )}

        {/* Add Member Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Add New Member</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="user@candorfoods.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Display Name</label>
                  <input
                    type="text"
                    value={newUser.display_name}
                    onChange={(e) => setNewUser({ ...newUser, display_name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="John Smith"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter password"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-gray-600 pb-2.5">
                    <input
                      type="checkbox"
                      checked={newUser.is_admin}
                      onChange={(e) => setNewUser({ ...newUser, is_admin: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Admin privileges
                  </label>
                </div>
              </div>
              {addError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {addError}
                </div>
              )}
              <button
                type="submit"
                disabled={addLoading}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
              >
                {addLoading ? "Adding..." : "Add Member"}
              </button>
            </form>
          </div>
        )}

        {/* Reset Password Modal */}
        {resetTarget && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Reset Password</h3>
              <p className="text-sm text-gray-500 mb-5">{resetTarget}</p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                {resetError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    {resetError}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all"
                  >
                    {resetLoading ? "Resetting..." : "Reset"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setResetTarget(null); setNewPassword(""); setResetError(""); }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Member Modal */}
        {viewMember && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-800">Member Details</h3>
                <button
                  onClick={() => setViewMember(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {viewMember.display_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{viewMember.display_name}</div>
                    <div className="text-sm text-gray-400">{viewMember.username}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">ID</div>
                    <div className="text-sm text-gray-800 font-mono">{viewMember.id}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Role</div>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                      viewMember.is_admin ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {viewMember.is_admin ? "Admin" : "Member"}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Status</div>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                      viewMember.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}>
                      {viewMember.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Email</div>
                    <div className="text-sm text-gray-800 break-all">{viewMember.username}</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setResetTarget(viewMember.username); setResetError(""); setResetSuccess(""); setViewMember(null); }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all active:scale-[0.98]"
                >
                  Reset Password
                </button>
                <button
                  onClick={() => setViewMember(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Members List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading members...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Name</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Email</th>
                    <th className="text-center px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Role</th>
                    <th className="text-center px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {memberList.map((m) => (
                    <tr key={m.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-800">{m.display_name}</td>
                      <td className="px-5 py-3.5 text-gray-500">{m.username}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          m.is_admin ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {m.is_admin ? "Admin" : "Member"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          m.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}>
                          {m.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setViewMember(m)}
                          className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => { setResetTarget(m.username); setResetError(""); setResetSuccess(""); }}
                          className="text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  ))}
                  {memberList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-gray-400">No members found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {memberList.map((m) => (
                <div key={m.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-gray-800">{m.display_name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{m.username}</div>
                    </div>
                    <div className="flex gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        m.is_admin ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {m.is_admin ? "Admin" : "Member"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        m.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}>
                        {m.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 border-t border-gray-100 pt-3">
                    <button
                      onClick={() => setViewMember(m)}
                      className="flex-1 text-center text-blue-600 bg-blue-50 py-2 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => { setResetTarget(m.username); setResetError(""); setResetSuccess(""); }}
                      className="flex-1 text-center text-amber-600 bg-amber-50 py-2 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors"
                    >
                      Reset Password
                    </button>
                  </div>
                </div>
              ))}
              {memberList.length === 0 && (
                <div className="text-center py-8 text-gray-400">No members found</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

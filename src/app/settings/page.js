"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  dropdown as dropdownApi,
  factories as factoriesApi,
  floors as floorsApi,
} from "@/lib/api";
import { getSession } from "@/lib/auth";

export default function SettingsPage() {
  const router = useRouter();
  const [data, setData] = useState({ factories: [] });
  const [loading, setLoading] = useState(true);

  const [newFactoryCode, setNewFactoryCode] = useState("");
  const [newFactoryName, setNewFactoryName] = useState("");
  const [floorForm, setFloorForm] = useState({});
  const [editingFactory, setEditingFactory] = useState(null);
  const [editFactoryCode, setEditFactoryCode] = useState("");
  const [editFactoryName, setEditFactoryName] = useState("");
  const [editingFloor, setEditingFloor] = useState(null);
  const [editFloorName, setEditFloorName] = useState("");
  const [editFloorOrder, setEditFloorOrder] = useState(0);

  useEffect(() => {
    if (!getSession()) router.push("/");
  }, [router]);

  const fetchData = useCallback(async () => {
    try {
      const res = await dropdownApi.getFactoriesFloors();
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddFactory(e) {
    e.preventDefault();
    if (!newFactoryCode.trim()) return;
    try {
      await factoriesApi.create({
        factory_code: newFactoryCode.trim(),
        factory_name: newFactoryName.trim() || newFactoryCode.trim(),
      });
      setNewFactoryCode("");
      setNewFactoryName("");
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleUpdateFactory(factoryId) {
    try {
      const updates = {};
      if (editFactoryCode.trim()) updates.factory_code = editFactoryCode.trim();
      if (editFactoryName.trim()) updates.factory_name = editFactoryName.trim();
      await factoriesApi.update(factoryId, updates);
      setEditingFactory(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteFactory(factoryId, code) {
    if (!confirm(`Delete factory "${code}" and ALL its floors?`)) return;
    try {
      await factoriesApi.delete(factoryId);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAddFloor(factoryCode) {
    const form = floorForm[factoryCode];
    if (!form?.name?.trim()) return;
    try {
      await floorsApi.create({
        factory_code: factoryCode,
        floor_name: form.name.trim(),
        sort_order: parseInt(form.order) || 0,
      });
      setFloorForm((f) => ({ ...f, [factoryCode]: { name: "", order: "" } }));
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleUpdateFloor(floorId) {
    try {
      const updates = {};
      if (editFloorName.trim()) updates.floor_name = editFloorName.trim();
      if (editFloorOrder !== undefined) updates.sort_order = parseInt(editFloorOrder);
      await floorsApi.update(floorId, updates);
      setEditingFloor(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteFloor(floorId, name) {
    if (!confirm(`Delete floor "${name}"?`)) return;
    try {
      await floorsApi.delete(floorId);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-slate-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="text-center py-12 text-gray-400">
            <svg className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <h1 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Factory & Floor Management</h1>

        {/* Add Factory */}
        <form
          onSubmit={handleAddFactory}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1 sm:flex-initial">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Factory Code</label>
              <input
                type="text"
                value={newFactoryCode}
                onChange={(e) => setNewFactoryCode(e.target.value)}
                placeholder="e.g. B300"
                className="w-full sm:w-32 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div className="flex-1 sm:flex-initial">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Factory Name</label>
              <input
                type="text"
                value={newFactoryName}
                onChange={(e) => setNewFactoryName(e.target.value)}
                placeholder="Optional display name"
                className="w-full sm:w-48 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              + Add Factory
            </button>
          </div>
        </form>

        {/* Factory Cards */}
        <div className="space-y-4">
          {data.factories.map((factory) => (
            <div key={factory.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Factory Header */}
              <div className="bg-slate-50 border-b border-gray-200 px-4 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                {editingFactory === factory.id ? (
                  <div className="flex flex-col sm:flex-row gap-2 flex-1">
                    <input
                      type="text"
                      value={editFactoryCode}
                      onChange={(e) => setEditFactoryCode(e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full sm:w-28 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Code"
                    />
                    <input
                      type="text"
                      value={editFactoryName}
                      onChange={(e) => setEditFactoryName(e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full sm:w-44 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Name"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateFactory(factory.id)}
                        className="text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingFactory(null)}
                        className="text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold text-gray-800">{factory.factory_code}</span>
                    {factory.factory_name && factory.factory_name !== factory.factory_code && (
                      <span className="text-gray-400 text-sm ml-2">({factory.factory_name})</span>
                    )}
                  </div>
                )}
                {editingFactory !== factory.id && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingFactory(factory.id);
                        setEditFactoryCode(factory.factory_code);
                        setEditFactoryName(factory.factory_name || "");
                      }}
                      className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteFactory(factory.id, factory.factory_code)}
                      className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Floors */}
              <div className="p-4 sm:p-5">
                {/* Desktop floors table */}
                <div className="hidden sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                        <th className="pb-2 font-semibold">Floor Name</th>
                        <th className="pb-2 font-semibold w-20">Order</th>
                        <th className="pb-2 font-semibold w-36">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {factory.floors.map((fl) => (
                        <tr key={fl.id} className="border-t border-gray-100">
                          {editingFloor === fl.id ? (
                            <>
                              <td className="py-2.5">
                                <input
                                  type="text"
                                  value={editFloorName}
                                  onChange={(e) => setEditFloorName(e.target.value)}
                                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </td>
                              <td className="py-2.5">
                                <input
                                  type="number"
                                  value={editFloorOrder}
                                  onChange={(e) => setEditFloorOrder(e.target.value)}
                                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-16 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </td>
                              <td className="py-2.5">
                                <button
                                  onClick={() => handleUpdateFloor(fl.id)}
                                  className="text-emerald-600 hover:bg-emerald-50 px-2.5 py-1 rounded-lg text-xs font-semibold mr-1 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingFloor(null)}
                                  className="text-gray-500 hover:bg-gray-100 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                                >
                                  Cancel
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2.5 text-gray-800">{fl.floor_name}</td>
                              <td className="py-2.5 text-gray-400">{fl.sort_order}</td>
                              <td className="py-2.5">
                                <button
                                  onClick={() => {
                                    setEditingFloor(fl.id);
                                    setEditFloorName(fl.floor_name);
                                    setEditFloorOrder(fl.sort_order);
                                  }}
                                  className="text-blue-600 hover:bg-blue-50 px-2.5 py-1 rounded-lg text-xs font-semibold mr-1 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteFloor(fl.id, fl.floor_name)}
                                  className="text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                                >
                                  Delete
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile floors */}
                <div className="sm:hidden space-y-2">
                  {factory.floors.map((fl) => (
                    <div key={fl.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      {editingFloor === fl.id ? (
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={editFloorName}
                            onChange={(e) => setEditFloorName(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={editFloorOrder}
                              onChange={(e) => setEditFloorOrder(e.target.value)}
                              className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Order"
                            />
                            <button onClick={() => handleUpdateFloor(fl.id)} className="text-emerald-600 text-xs font-semibold px-3 py-2">Save</button>
                            <button onClick={() => setEditingFloor(null)} className="text-gray-500 text-xs px-3 py-2">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <span className="text-sm text-gray-800">{fl.floor_name}</span>
                            <span className="text-xs text-gray-400 ml-2">#{fl.sort_order}</span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => { setEditingFloor(fl.id); setEditFloorName(fl.floor_name); setEditFloorOrder(fl.sort_order); }}
                              className="text-blue-600 text-xs font-semibold px-2 py-1"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteFloor(fl.id, fl.floor_name)}
                              className="text-red-600 text-xs font-semibold px-2 py-1"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Floor */}
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center mt-4 pt-4 border-t border-gray-100">
                  <input
                    type="text"
                    placeholder="Floor name"
                    value={floorForm[factory.factory_code]?.name || ""}
                    onChange={(e) =>
                      setFloorForm((f) => ({
                        ...f,
                        [factory.factory_code]: { ...f[factory.factory_code], name: e.target.value },
                      }))
                    }
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Order"
                    value={floorForm[factory.factory_code]?.order || ""}
                    onChange={(e) =>
                      setFloorForm((f) => ({
                        ...f,
                        [factory.factory_code]: { ...f[factory.factory_code], order: e.target.value },
                      }))
                    }
                    className="w-full sm:w-20 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    onClick={() => handleAddFloor(factory.factory_code)}
                    className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all"
                  >
                    + Add Floor
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {data.factories.length === 0 && (
          <p className="text-gray-400 text-center py-12">No factories yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}

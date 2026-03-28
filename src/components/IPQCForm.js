"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { dropdown as dropdownApi, sku as skuApi } from "@/lib/api";
import {
  SENSORY_PARAMS,
  LABEL_CHECK_PARAMS,
  getPhysicalParams,
} from "@/lib/constants";

function buildChecklistState(params, existing, hasValue) {
  const knownKeys = params.map((p) => p.key);
  return params.map((p) => {
    const found = existing?.find((e) => e.parameter === p.key);
    if (p.key === "other" && !found) {
      const custom = existing?.find((e) => !knownKeys.includes(e.parameter));
      if (custom) {
        return {
          parameter: p.key,
          label: p.label,
          checked: custom.checked,
          remark: custom.remark || "",
          ...(hasValue ? { value: custom.value || "" } : {}),
          other_name: custom.parameter,
        };
      }
    }
    let remark = found?.remark || "";
    let otherName = "";
    if (p.key === "other" && found && !hasValue && remark.includes(": ")) {
      const idx = remark.indexOf(": ");
      otherName = remark.slice(0, idx);
      remark = remark.slice(idx + 2);
    } else if (p.key === "other" && found && !hasValue && remark && !remark.includes(": ")) {
      otherName = remark;
      remark = "";
    }
    return {
      parameter: p.key,
      label: p.label,
      checked: found ? found.checked : p.key !== "other",
      remark,
      ...(hasValue ? { value: found?.value || "" } : {}),
      ...(p.key === "other" ? { other_name: otherName } : {}),
    };
  });
}

function createArticle(data) {
  const cat = data?.physical_category || "dates";
  return {
    id: Date.now() + Math.random(),
    item_description: data?.item_description || "",
    customer: data?.customer || "",
    batch_number: data?.batch_number || "",
    physical_category: cat,
    sensory: buildChecklistState(SENSORY_PARAMS, data?.sensory_evaluation, false),
    physical: buildChecklistState(getPhysicalParams(cat), data?.physical_parameters, true),
    labels: buildChecklistState(LABEL_CHECK_PARAMS, data?.label_check, false),
    seal_check: data?.seal_check || false,
    verdict: data?.verdict || "accept",
    overall_remark: data?.overall_remark || "",
    selectedSku: null,
    expanded: true,
  };
}

function cleanList(list) {
  return list
    .filter((item) => item.parameter !== "other" || item.checked)
    .map(({ label, other_name, ...rest }) => ({
      ...rest,
      remark: rest.checked
        ? rest.parameter === "other" && other_name
          ? other_name + (rest.remark ? ": " + rest.remark : "")
          : rest.remark || "OK"
        : rest.remark,
    }));
}

function cleanPhysical(list) {
  return list
    .filter((item) => item.parameter !== "other" || item.checked)
    .map(({ label, other_name, ...rest }) => ({
      ...rest,
      parameter: rest.parameter === "other" && other_name ? other_name : rest.parameter,
      remark: rest.checked && !rest.remark ? "OK" : rest.remark,
    }));
}

export default function IPQCForm({ initialData, onSubmit, loading, readOnly, isAdmin }) {
  const isEdit = !!initialData;
  const [factoriesData, setFactoriesData] = useState([]);

  const [commonData, setCommonData] = useState({
    check_date: initialData?.check_date || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
    company: initialData?.company || "CFPL",
    factory_code: initialData?.factory_code || "",
    floor: initialData?.floor || "",
  });

  const [articles, setArticles] = useState(() => {
    if (initialData?.articles?.length) {
      return initialData.articles.map((a) => createArticle(a));
    }
    return [createArticle(initialData)];
  });

  const [activeSkuIdx, setActiveSkuIdx] = useState(null);
  const [skuResults, setSkuResults] = useState([]);
  const [skuLoading, setSkuLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);

  const doSkuSearch = useCallback(async (desc) => {
    if (!desc.trim()) { setSkuResults([]); setShowDropdown(false); return; }
    setSkuLoading(true);
    try {
      const res = await skuApi.search(desc.trim());
      setSkuResults(res.items || []);
      setShowDropdown(true);
    } catch {
      setSkuResults([]);
      setShowDropdown(true);
    } finally {
      setSkuLoading(false);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    dropdownApi.getFactoriesFloors().then(setFactoriesData).catch(() => {});
  }, []);

  const selectedFactory = factoriesData.factories?.find(
    (f) => f.factory_code === commonData.factory_code
  );
  const availableFloors = selectedFactory?.floors || [];

  function updateArticle(idx, field, value) {
    setArticles((prev) => prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));
  }

  function updateArticleChecklist(articleIdx, listKey, itemIdx, field, value) {
    setArticles((prev) =>
      prev.map((a, i) => {
        if (i !== articleIdx) return a;
        return {
          ...a,
          [listKey]: a[listKey].map((item, j) =>
            j === itemIdx ? { ...item, [field]: value } : item
          ),
        };
      })
    );
  }

  function handleCategoryChange(articleIdx, cat) {
    setArticles((prev) =>
      prev.map((a, i) => {
        if (i !== articleIdx) return a;
        return {
          ...a,
          physical_category: cat,
          physical: buildChecklistState(getPhysicalParams(cat), [], true),
        };
      })
    );
  }

  function handleItemDescriptionChange(articleIdx, value) {
    updateArticle(articleIdx, "item_description", value);
    updateArticle(articleIdx, "selectedSku", null);
    setActiveSkuIdx(articleIdx);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSkuSearch(value), 400);
  }

  function handleSelectSku(articleIdx, sku) {
    const cat = sku.item_category?.toLowerCase() || "";
    const mapped = cat.includes("date") ? "dates" : cat.includes("seed") ? "seeds" : "other";
    setArticles((prev) =>
      prev.map((a, i) => {
        if (i !== articleIdx) return a;
        return {
          ...a,
          item_description: sku.item_description,
          selectedSku: sku,
          ...(mapped !== a.physical_category
            ? {
                physical_category: mapped,
                physical: buildChecklistState(getPhysicalParams(mapped), [], true),
              }
            : {}),
        };
      })
    );
    setShowDropdown(false);
  }

  function toggleArticle(idx) {
    updateArticle(idx, "expanded", !articles[idx].expanded);
  }

  function addArticle() {
    setArticles((prev) => [...prev, createArticle()]);
  }

  function removeArticle(idx) {
    setArticles((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const { company, ...common } = commonData;
    const articleData = articles.map((a) => ({
      item_description: a.item_description,
      customer: a.customer,
      batch_number: a.batch_number,
      physical_category: a.physical_category,
      sensory_evaluation: cleanList(a.sensory),
      physical_parameters: cleanPhysical(a.physical),
      label_check: cleanList(a.labels),
      seal_check: a.seal_check,
      verdict: a.verdict,
      overall_remark: a.overall_remark,
    }));
    onSubmit({ ...common, articles: articleData });
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
  const selectCls = "w-full border border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1.5";
  const remarkCls = "flex-1 border border-gray-200 rounded-lg px-3 py-1.5 sm:py-2 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

  return (
    <fieldset disabled={readOnly}>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Common Header */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
          <h2 className="font-semibold text-gray-800 mb-3 sm:mb-4">Header</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {isEdit && initialData?.ipqc_no && (
              <div>
                <label className={labelCls}>IPQC No.</label>
                <input value={initialData.ipqc_no} disabled className={`${inputCls} bg-gray-100`} />
              </div>
            )}
            <div>
              <label className={labelCls}>Date</label>
              <input
                type="date"
                value={commonData.check_date}
                disabled={isEdit && !isAdmin}
                onChange={
                  (!isEdit || isAdmin)
                    ? (e) => setCommonData((d) => ({ ...d, check_date: e.target.value }))
                    : undefined
                }
                className={`${inputCls} ${isEdit && !isAdmin ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
            </div>
            <div>
              <label className={labelCls}>Factory</label>
              <select
                value={commonData.factory_code}
                onChange={(e) => setCommonData((d) => ({ ...d, factory_code: e.target.value, floor: "" }))}
                className={selectCls}
              >
                <option value="">Select factory</option>
                {factoriesData.factories?.map((f) => (
                  <option key={f.factory_code} value={f.factory_code}>{f.factory_code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Floor</label>
              <select
                value={commonData.floor}
                onChange={(e) => setCommonData((d) => ({ ...d, floor: e.target.value }))}
                className={selectCls}
                disabled={!commonData.factory_code}
              >
                <option value="">Select floor</option>
                {availableFloors.map((fl) => (
                  <option key={fl.id} value={fl.floor_name}>{fl.floor_name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Articles */}
        {articles.map((article, ai) => (
          <div key={article.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Article header bar */}
            <div
              className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 bg-slate-50 border-b border-gray-200 cursor-pointer select-none"
              onClick={() => toggleArticle(ai)}
            >
              <h3 className="font-semibold text-gray-800 text-sm">
                Article {ai + 1}
                {article.item_description ? `: ${article.item_description}` : ""}
              </h3>
              <div className="flex items-center gap-2">
                {!readOnly && articles.length > 1 && (!isEdit || isAdmin) && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeArticle(ai); }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                  >
                    Remove
                  </button>
                )}
                <span className="text-gray-400 text-xs">{article.expanded ? "\u25B2" : "\u25BC"}</span>
              </div>
            </div>

            {/* Collapsible content */}
            {article.expanded && (
              <div className="p-4 sm:p-5 space-y-5 sm:space-y-6">
                {/* Article info fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div
                    className="sm:col-span-2 relative"
                    ref={activeSkuIdx === ai ? dropdownRef : null}
                  >
                    <label className={labelCls}>Item Description</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={article.item_description}
                        onChange={(e) => handleItemDescriptionChange(ai, e.target.value)}
                        onFocus={() => {
                          setActiveSkuIdx(ai);
                          if (skuResults.length > 0 && !article.selectedSku) setShowDropdown(true);
                        }}
                        className={inputCls}
                        placeholder="Start typing to search SKU..."
                        autoComplete="off"
                      />
                      {skuLoading && activeSkuIdx === ai && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          Searching...
                        </span>
                      )}
                      {activeSkuIdx === ai && showDropdown && (
                        <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                          {skuResults.length > 0 ? (
                            skuResults.map((item) => (
                              <button
                                key={item.sku_id}
                                type="button"
                                onClick={() => handleSelectSku(ai, item)}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                              >
                                <div className="text-sm font-medium text-gray-800">{item.item_description}</div>
                                <div className="flex gap-3 mt-1 text-xs flex-wrap">
                                  <span className="text-emerald-700">{item.item_category}</span>
                                  <span className="text-blue-700">{item.sub_category}</span>
                                  <span className="text-gray-400">{item.source_company}</span>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-400">No matching SKU found</div>
                          )}
                        </div>
                      )}
                    </div>
                    {article.selectedSku && (
                      <div className="mt-2 flex gap-2 sm:gap-3 text-xs flex-wrap">
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">{article.selectedSku.item_category}</span>
                        <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg">{article.selectedSku.sub_category}</span>
                        <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg">{article.selectedSku.source_company}</span>
                        <span className="text-gray-500">{article.selectedSku.material_type}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Customer</label>
                    <input
                      type="text"
                      value={article.customer}
                      onChange={(e) => updateArticle(ai, "customer", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Batch Number</label>
                    <input
                      type="text"
                      value={article.batch_number}
                      onChange={(e) => updateArticle(ai, "batch_number", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Sensory Evaluation */}
                <div>
                  <h4 className="font-semibold text-gray-700 text-sm mb-3">Sensory Evaluation</h4>
                  <div className="space-y-2">
                    {article.sensory.map((item, si) => (
                      <div key={item.parameter}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <label className="flex items-center gap-2 sm:w-48 flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={(e) => updateArticleChecklist(ai, "sensory", si, "checked", e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{item.label}</span>
                          </label>
                          {item.parameter !== "other" && (
                            <input type="text" placeholder="Remark" value={item.remark}
                              onChange={(e) => updateArticleChecklist(ai, "sensory", si, "remark", e.target.value)}
                              className={remarkCls} />
                          )}
                        </div>
                        {item.parameter === "other" && item.checked && (
                          <div className="ml-6 sm:ml-10 mt-2 flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <input type="text" placeholder="Parameter Name" value={item.other_name}
                              onChange={(e) => updateArticleChecklist(ai, "sensory", si, "other_name", e.target.value)}
                              className={`${remarkCls} sm:w-48 sm:flex-none`} />
                            <input type="text" placeholder="Remark" value={item.remark}
                              onChange={(e) => updateArticleChecklist(ai, "sensory", si, "remark", e.target.value)}
                              className={remarkCls} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Physical Parameters */}
                <div>
                  <h4 className="font-semibold text-gray-700 text-sm mb-3">Physical Parameters</h4>
                  <div className="flex flex-wrap gap-3 sm:gap-4 mb-3">
                    {["dates", "seeds", "other"].map((cat) => (
                      <label key={cat} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name={`physical_category_${ai}`}
                          checked={article.physical_category === cat}
                          onChange={() => handleCategoryChange(ai, cat)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </label>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {article.physical.map((item, pi) => (
                      <div key={item.parameter}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <label className="flex items-center gap-2 sm:w-48 flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={(e) => updateArticleChecklist(ai, "physical", pi, "checked", e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{item.label}</span>
                          </label>
                          {item.parameter !== "other" && (
                            <div className="flex flex-1 gap-2">
                              <input
                                type="number" placeholder="Value" value={item.value} min="0" step="any"
                                onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }}
                                onWheel={(e) => e.target.blur()}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v === "" || Number(v) >= 0) updateArticleChecklist(ai, "physical", pi, "value", v);
                                }}
                                className={`w-24 sm:w-28 border border-gray-200 rounded-lg px-3 py-1.5 sm:py-2 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                              />
                              <input type="text" placeholder="Remark" value={item.remark}
                                onChange={(e) => updateArticleChecklist(ai, "physical", pi, "remark", e.target.value)}
                                className={remarkCls} />
                            </div>
                          )}
                        </div>
                        {item.parameter === "other" && item.checked && (
                          <div className="ml-6 sm:ml-10 mt-2 flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <input type="text" placeholder="Parameter Name" value={item.other_name}
                              onChange={(e) => updateArticleChecklist(ai, "physical", pi, "other_name", e.target.value)}
                              className={`${remarkCls} sm:w-48 sm:flex-none`} />
                            <input
                              type="number" placeholder="Value" value={item.value} min="0" step="any"
                              onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }}
                              onWheel={(e) => e.target.blur()}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "" || Number(v) >= 0) updateArticleChecklist(ai, "physical", pi, "value", v);
                              }}
                              className={`w-24 sm:w-28 border border-gray-200 rounded-lg px-3 py-1.5 sm:py-2 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                            />
                            <input type="text" placeholder="Remark" value={item.remark}
                              onChange={(e) => updateArticleChecklist(ai, "physical", pi, "remark", e.target.value)}
                              className={remarkCls} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Label Check */}
                <div>
                  <h4 className="font-semibold text-gray-700 text-sm mb-3">Label Check</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {article.labels.map((item, li) => (
                      <div key={item.parameter} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <label className="flex items-center gap-2 sm:w-48 flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => updateArticleChecklist(ai, "labels", li, "checked", e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{item.label}</span>
                        </label>
                        <input type="text" placeholder="Remark" value={item.remark}
                          onChange={(e) => updateArticleChecklist(ai, "labels", li, "remark", e.target.value)}
                          className={remarkCls} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Final */}
                <div>
                  <h4 className="font-semibold text-gray-700 text-sm mb-3">Final</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={article.seal_check}
                        onChange={(e) => updateArticle(ai, "seal_check", e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Seal Check OK
                    </label>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">Verdict:</span>
                      {["accept", "reject"].map((v) => (
                        <label key={v} className="flex items-center gap-1.5 text-sm text-gray-700">
                          <input
                            type="radio"
                            name={`verdict_${ai}`}
                            checked={article.verdict === v}
                            onChange={() => updateArticle(ai, "verdict", v)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className={labelCls}>Overall Remark</label>
                    <textarea
                      value={article.overall_remark}
                      onChange={(e) => updateArticle(ai, "overall_remark", e.target.value)}
                      className={`${inputCls} resize-none`}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Article */}
        {!readOnly && (
          <button
            type="button"
            onClick={addArticle}
            className="w-full border-2 border-dashed border-gray-300 rounded-2xl py-4 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all font-medium"
          >
            + Add Article
          </button>
        )}

        {/* Submit */}
        {!readOnly && (
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] w-full sm:w-auto"
          >
            {loading ? "Saving..." : isEdit ? "Update Record" : `Save ${articles.length > 1 ? articles.length + " Records" : "Record"}`}
          </button>
        )}
      </form>
    </fieldset>
  );
}

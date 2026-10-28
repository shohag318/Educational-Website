"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingDown,
  Calculator,
  Search,
  Filter,
  DollarSign,
  Printer,
  FileSpreadsheet,
  Building2,
  Calendar,
  Layers,
} from "lucide-react";
import * as XLSX from "xlsx";
import { AssetNavHeader } from "../AssetNavHeader";
import {
  InstitutionAsset,
  ASSET_CATEGORIES,
  getStoredAssets,
} from "../assetStore";
import { TENANT_SWITCH_EVENT } from "@/lib/clientTenant";

export default function AssetDepreciationPage() {
  const [assets, setAssets] = useState<InstitutionAsset[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const loadData = () => {
    setAssets(getStoredAssets());
  };

  useEffect(() => {
    loadData();
    window.addEventListener(TENANT_SWITCH_EVENT, loadData);
    return () => window.removeEventListener(TENANT_SWITCH_EVENT, loadData);
  }, []);

  // Compute Depreciation Matrix per Asset
  const assetDepreciationList = useMemo(() => {
    return assets
      .filter((a) => {
        if (categoryFilter !== "ALL" && a.category !== categoryFilter) return false;
        return true;
      })
      .map((asset) => {
        const purchaseYear = new Date(asset.purchaseDate).getFullYear() || 2023;
        const yearsActive = Math.max(0, selectedYear - purchaseYear);
        const annualDeprRate = (asset.depreciationRate || 15) / 100;

        // Straight-Line Depreciation with 10% salvage residual value floor
        const salvageValue = Math.round(asset.purchasePrice * 0.1);
        const depreciableBase = Math.max(0, asset.purchasePrice - salvageValue);
        const annualDepreciationAmount = Math.round(depreciableBase * annualDeprRate);
        const accumulatedDepreciation = Math.min(
          depreciableBase,
          annualDepreciationAmount * yearsActive
        );
        const netBookValue = Math.max(salvageValue, asset.purchasePrice - accumulatedDepreciation);

        return {
          ...asset,
          purchaseYear,
          yearsActive,
          annualDepreciationAmount,
          accumulatedDepreciation,
          netBookValue,
          salvageValue,
        };
      });
  }, [assets, selectedYear, categoryFilter]);

  // Overall Financial Totals
  const totals = useMemo(() => {
    const totalOriginalCost = assetDepreciationList.reduce((s, a) => s + a.purchasePrice, 0);
    const totalAccumulatedDepr = assetDepreciationList.reduce((s, a) => s + a.accumulatedDepreciation, 0);
    const totalNetBookValue = assetDepreciationList.reduce((s, a) => s + a.netBookValue, 0);
    const totalAnnualExpense = assetDepreciationList.reduce((s, a) => s + a.annualDepreciationAmount, 0);

    return {
      totalOriginalCost,
      totalAccumulatedDepr,
      totalNetBookValue,
      totalAnnualExpense,
    };
  }, [assetDepreciationList]);

  // Category Summaries
  const categorySummaries = useMemo(() => {
    return ASSET_CATEGORIES.map((cat) => {
      const catAssets = assetDepreciationList.filter((a) => a.category === cat.key);
      const originalCost = catAssets.reduce((s, a) => s + a.purchasePrice, 0);
      const accumulatedDepr = catAssets.reduce((s, a) => s + a.accumulatedDepreciation, 0);
      const bookValue = catAssets.reduce((s, a) => s + a.netBookValue, 0);

      return {
        ...cat,
        itemCount: catAssets.length,
        originalCost,
        accumulatedDepr,
        bookValue,
      };
    }).filter((c) => c.itemCount > 0);
  }, [assetDepreciationList]);

  // Export to Excel
  const handleExportExcel = () => {
    const data = assetDepreciationList.map((a, i) => ({
      "SL": i + 1,
      "Asset Code": a.assetCode,
      "Asset Title": a.name,
      "Category": a.category,
      "Location": a.location,
      "Acquisition Year": a.purchaseYear,
      "Years in Service": a.yearsActive,
      "Historical Cost (৳)": a.purchasePrice,
      "Depr. Rate (%)": `${a.depreciationRate}%`,
      "Annual Depr. (৳)": a.annualDepreciationAmount,
      "Accumulated Depr. (৳)": a.accumulatedDepreciation,
      "Net Book Value (৳)": a.netBookValue,
      "Salvage Floor (৳)": a.salvageValue,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Asset_Valuation_Ledger");
    XLSX.writeFile(wb, `Asset_Depreciation_Ledger_${selectedYear}.xlsx`);
  };

  return (
    <div className="space-y-5 p-4 sm:p-6 max-w-7xl mx-auto min-h-screen">
      {/* Top Menu Bar */}
      <AssetNavHeader />

      {/* Summary Valuation KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Net Book Value ({selectedYear})</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-mono font-extrabold text-xl text-blue-900 mt-1">
            ৳{totals.totalNetBookValue.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Asset balance sheet carrying value</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Historical Acquisition Cost</span>
            <Building2 className="w-4 h-4 text-slate-600" />
          </div>
          <div className="font-mono font-extrabold text-xl text-slate-800 mt-1">
            ৳{totals.totalOriginalCost.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Total capital expenditure incurred</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Accumulated Depreciation</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="font-mono font-extrabold text-xl text-rose-700 mt-1">
            -৳{totals.totalAccumulatedDepr.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Cumulative wear &amp; tear written-off</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Annual Depr. Charge</span>
            <Calculator className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-mono font-extrabold text-xl text-amber-700 mt-1">
            ৳{totals.totalAnnualExpense.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Year {selectedYear} income-statement expense</p>
        </div>
      </div>

      {/* Category Wise Valuation Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Asset Category Valuation Summary ({selectedYear})</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-semibold">Straight-Line Method (SLM)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100/70 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Asset Category</th>
                <th className="py-2 px-2 text-center">Entries</th>
                <th className="py-2 px-2 text-center">Depr. Rate</th>
                <th className="py-2 px-3 text-right">Historical Cost (৳)</th>
                <th className="py-2 px-3 text-right">Accumulated Depr. (৳)</th>
                <th className="py-2 px-3 text-right">Net Book Value (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categorySummaries.map((cat) => (
                <tr key={cat.key} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-semibold text-slate-900">{cat.label}</td>
                  <td className="py-2 px-2 text-center font-mono">{cat.itemCount}</td>
                  <td className="py-2 px-2 text-center font-mono text-slate-600">{cat.defaultDepreciation}%</td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-slate-700">
                    ৳{cat.originalCost.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-rose-700">
                    -৳{cat.accumulatedDepr.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-extrabold text-blue-900">
                    ৳{cat.bookValue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Controls & Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs no-print">
        <div className="flex flex-wrap items-center gap-2">
          {/* Year */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium text-[11px]">Audit Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 text-xs"
            >
              {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                <option key={yr} value={yr}>
                  {yr} Fiscal Year
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium text-[11px]">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs"
            >
              <option value="ALL">All Categories</option>
              {ASSET_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-bold text-xs transition shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-bold text-xs transition shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* Main Asset-by-Asset Depreciation Schedule Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
            Detailed Asset Depreciation &amp; Net Book Value Schedule ({selectedYear})
          </h3>
          <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
            {assetDepreciationList.length} Assets
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100/80 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Asset Code</th>
                <th className="py-2.5 px-3">Asset Name</th>
                <th className="py-2.5 px-2 text-center">Acquired</th>
                <th className="py-2.5 px-2 text-center">Active (Yrs)</th>
                <th className="py-2.5 px-2 text-center">Rate</th>
                <th className="py-2.5 px-3 text-right">Cost Price (৳)</th>
                <th className="py-2.5 px-3 text-right">Annual Depr. (৳)</th>
                <th className="py-2.5 px-3 text-right">Accumulated Depr. (৳)</th>
                <th className="py-2.5 px-3 text-right">Net Book Value (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assetDepreciationList.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                    {asset.assetCode}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {asset.name}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                    {asset.purchaseYear}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700">
                    {asset.yearsActive}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-500 text-[11px]">
                    {asset.depreciationRate}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700">
                    ৳{asset.purchasePrice.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-700 font-semibold">
                    ৳{asset.annualDepreciationAmount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-700 font-semibold">
                    -৳{asset.accumulatedDepreciation.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-extrabold text-blue-900 text-sm">
                    ৳{asset.netBookValue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t border-slate-200 text-slate-800">
              <tr>
                <td colSpan={5} className="py-2.5 px-3">Total Balance:</td>
                <td className="py-2.5 px-3 text-right font-mono">
                  ৳{totals.totalOriginalCost.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-amber-800">
                  ৳{totals.totalAnnualExpense.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-rose-800">
                  -৳{totals.totalAccumulatedDepr.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-extrabold text-blue-950 text-sm">
                  ৳{totals.totalNetBookValue.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

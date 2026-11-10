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
} from "@/components/iconify/lucide";
import * as XLSX from "xlsx";
import { AssetNavHeader } from "@/sections/assets/component/asset-nav-header";
import {
  InstitutionAsset,
  ASSET_CATEGORIES,
  getStoredAssets,
} from "@/sections/assets/schema/asset-store";
import { TENANT_SWITCH_EVENT } from "@/lib/clientTenant";
import { AppButton } from "@/components/button/app-button";
import { AppTable, AppCard, TableFilterBar } from "@/components";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

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

      <AppCard>
        <TableFilterBar showSearch={false}>
          <AppTable<(typeof categorySummaries)[number]>
        embedded
        rows={categorySummaries}
        rowKey={(row) => row.key}
        defaultOrderBy="label"
        minWidth={800}
        rowsPerPageOptions={[5, 10, 25]}
        columns={[
          { id: "label", label: "Asset Category", render: (cat) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{cat.label}</Typography> },
          { id: "itemCount", label: "Entries", align: "center", render: (cat) => <Typography variant="body2" sx={{ fontFamily: "monospace" }}>{cat.itemCount}</Typography> },
          { id: "defaultDepreciation", label: "Depr. Rate", align: "center", render: (cat) => <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary" }}>{cat.defaultDepreciation}%</Typography> },
          { id: "originalCost", label: "Historical Cost (৳)", align: "right", render: (cat) => <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600 }}>৳{cat.originalCost.toLocaleString()}</Typography> },
          { id: "accumulatedDepr", label: "Accumulated Depr. (৳)", align: "right", render: (cat) => <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600, color: "error.dark" }}>-৳{cat.accumulatedDepr.toLocaleString()}</Typography> },
          { id: "bookValue", label: "Net Book Value (৳)", align: "right", render: (cat) => <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 800, color: "primary.dark" }}>৳{cat.bookValue.toLocaleString()}</Typography> },
        ]}
      />
        </TableFilterBar>
      </AppCard>

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
          <AppButton
            type="button"
            onClick={handleExportExcel}
            variant="outline"
            startIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
          >
            Export Excel
          </AppButton>

          <AppButton
            type="button"
            onClick={() => window.print()}
            variant="outline"
            startIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Ledger
          </AppButton>
        </div>
      </div>

      <AppCard>
        <TableFilterBar showSearch={false}>
          <AppTable<(typeof assetDepreciationList)[number]>
        embedded
        rows={assetDepreciationList}
        rowKey={(row) => row.id}
        defaultOrderBy="assetCode"
        minWidth={1100}
        columns={[
          { id: "assetCode", label: "Asset Code", render: (asset) => <Typography variant="caption" sx={{ fontWeight: 700 }}>{asset.assetCode}</Typography> },
          { id: "name", label: "Asset Name", render: (asset) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{asset.name}</Typography> },
          { id: "purchaseYear", label: "Acquired", align: "center", render: (asset) => <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary" }}>{asset.purchaseYear}</Typography> },
          { id: "yearsActive", label: "Active (Yrs)", align: "center", render: (asset) => <Typography variant="caption" sx={{ fontWeight: 700 }}>{asset.yearsActive}</Typography> },
          { id: "depreciationRate", label: "Rate", align: "center", render: (asset) => <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>{asset.depreciationRate}%</Typography> },
          { id: "purchasePrice", label: "Cost Price (৳)", align: "right", render: (asset) => <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600 }}>৳{asset.purchasePrice.toLocaleString()}</Typography> },
          { id: "annualDepreciationAmount", label: "Annual Depr. (৳)", align: "right", render: (asset) => <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600, color: "warning.dark" }}>৳{asset.annualDepreciationAmount.toLocaleString()}</Typography> },
          { id: "accumulatedDepreciation", label: "Accumulated Depr. (৳)", align: "right", render: (asset) => <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600, color: "error.dark" }}>-৳{asset.accumulatedDepreciation.toLocaleString()}</Typography> },
          { id: "netBookValue", label: "Net Book Value (৳)", align: "right", render: (asset) => <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 800, color: "primary.dark" }}>৳{asset.netBookValue.toLocaleString()}</Typography> },
        ]}
      />
        </TableFilterBar>
      </AppCard>
    </div>
  );
}

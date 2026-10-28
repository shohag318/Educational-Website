"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Boxes,
  Search,
  Filter,
  DollarSign,
  ShieldCheck,
  MapPin,
  Users,
  Printer,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import { AssetNavHeader } from "../AssetNavHeader";
import {
  InstitutionAsset,
  ASSET_CATEGORIES,
  CAMPUS_LOCATIONS,
  getStoredAssets,
} from "../assetStore";
import { TENANT_SWITCH_EVENT } from "@/lib/clientTenant";

export default function AssetLocationsPage() {
  const [assets, setAssets] = useState<InstitutionAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = () => {
    setAssets(getStoredAssets());
  };

  useEffect(() => {
    loadData();
    window.addEventListener(TENANT_SWITCH_EVENT, loadData);
    return () => window.removeEventListener(TENANT_SWITCH_EVENT, loadData);
  }, []);

  // Compute room statistics
  const locationStats = useMemo(() => {
    return CAMPUS_LOCATIONS.map((loc) => {
      const roomAssets = assets.filter((a) => a.location === loc);
      const itemCount = roomAssets.reduce((s, a) => s + (a.quantity || 1), 0);
      const totalCost = roomAssets.reduce((s, a) => s + a.purchasePrice, 0);
      const totalBookVal = roomAssets.reduce((s, a) => s + a.currentValue, 0);
      const custodians = Array.from(new Set(roomAssets.map((a) => a.custodian))).filter(Boolean);

      return {
        location: loc,
        assets: roomAssets,
        itemCount,
        totalCost,
        totalBookVal,
        custodians,
      };
    }).filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.location.toLowerCase().includes(q) ||
        item.custodians.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [assets, searchQuery]);

  // Export to Excel
  const handleExportExcel = () => {
    const data = locationStats.map((item, i) => ({
      "SL": i + 1,
      "Campus Room / Location": item.location,
      "Physical Items Count": item.itemCount,
      "Asset Entries": item.assets.length,
      "Original Capital Cost (৳)": item.totalCost,
      "Current Book Value (৳)": item.totalBookVal,
      "Assigned Custodians": item.custodians.join(", ") || "General",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Room_Asset_Distribution");
    XLSX.writeFile(wb, `Campus_Asset_Locations_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="space-y-5 p-4 sm:p-6 max-w-7xl mx-auto min-h-screen">
      {/* Top Menu Bar */}
      <AssetNavHeader />

      {/* Header Info */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs no-print">
        <div className="flex items-center space-x-2.5">
          <Building2 className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="font-extrabold text-sm text-slate-900">
              Campus Rooms &amp; Facility Deployment Matrix
            </h2>
            <p className="text-slate-500 text-[11px]">
              Asset allocation, laboratory equipment clusters, and physical custodian custody across buildings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search room or custodian..."
              className="w-full py-1.5 pl-2 pr-6 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>

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
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Grid of Campus Rooms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locationStats.map((item) => (
          <div
            key={item.location}
            className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-blue-300 transition"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 leading-tight">
                      {item.location}
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      {item.assets.length} registered asset lines
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  {item.itemCount} Units
                </span>
              </div>

              {/* Value metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Book Value</span>
                  <span className="font-mono font-bold text-blue-900 text-xs">
                    ৳{item.totalBookVal.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Purchase Cost</span>
                  <span className="font-mono font-semibold text-slate-700 text-xs">
                    ৳{item.totalCost.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Sample Assets List */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                  Deployed Hardware &amp; Assets:
                </span>
                {item.assets.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic py-1">
                    No active assets tagged to this location yet.
                  </div>
                ) : (
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {item.assets.map((a) => (
                      <div
                        key={a.id}
                        className="text-[11px] p-1.5 bg-white rounded border border-slate-200 flex items-center justify-between"
                      >
                        <span className="truncate pr-2 font-medium text-slate-800" title={a.name}>
                          {a.name}
                        </span>
                        <span className="font-mono font-bold text-[10px] text-slate-500 shrink-0">
                          Qty: {a.quantity || 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Custodian footer */}
            <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1 truncate max-w-[200px]" title={item.custodians.join(", ")}>
                <Users className="w-3 h-3 text-slate-400" />
                <span className="truncate">{item.custodians[0] || "General Administration"}</span>
              </span>
              <span className="font-bold text-emerald-700">Verified</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

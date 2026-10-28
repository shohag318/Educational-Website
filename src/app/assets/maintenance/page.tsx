"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  Printer,
  FileSpreadsheet,
  X,
  Check,
} from "lucide-react";
import * as XLSX from "xlsx";
import { AssetNavHeader } from "../AssetNavHeader";
import {
  MaintenanceRecord,
  InstitutionAsset,
  getStoredMaintenanceLogs,
  saveMaintenanceLogs,
  addMaintenanceRecord,
  getStoredAssets,
  updateAsset,
} from "../assetStore";
import { TENANT_SWITCH_EVENT } from "@/lib/clientTenant";

export default function AssetMaintenancePage() {
  const [logs, setLogs] = useState<MaintenanceRecord[]>([]);
  const [assets, setAssets] = useState<InstitutionAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Work Order Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formIssue, setFormIssue] = useState("");
  const [formVendor, setFormVendor] = useState("");
  const [formCost, setFormCost] = useState<number>(0);

  const loadData = () => {
    setLogs(getStoredMaintenanceLogs());
    setAssets(getStoredAssets());
  };

  useEffect(() => {
    loadData();
    window.addEventListener(TENANT_SWITCH_EVENT, loadData);
    return () => window.removeEventListener(TENANT_SWITCH_EVENT, loadData);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Create new maintenance log
  const handleCreateWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find((a) => a.id === selectedAssetId);
    if (!asset || !formIssue.trim()) {
      alert("Please select an asset and describe the defect / servicing required.");
      return;
    }

    const newRecord: MaintenanceRecord = {
      id: `maint_${Date.now()}`,
      assetId: asset.id,
      assetCode: asset.assetCode,
      assetName: asset.name,
      serviceDate: formDate,
      issueDescription: formIssue.trim(),
      vendorName: formVendor.trim() || "Campus Engineering Dept",
      cost: Number(formCost) || 0,
      status: "IN_PROGRESS",
    };

    const nextList = addMaintenanceRecord(newRecord);
    setLogs(nextList);

    // Update asset condition to NEEDS_REPAIR and status to MAINTENANCE
    const updatedAsset: InstitutionAsset = {
      ...asset,
      condition: "NEEDS_REPAIR",
      status: "MAINTENANCE",
    };
    updateAsset(updatedAsset);
    setAssets(getStoredAssets());

    setIsModalOpen(false);
    setSelectedAssetId("");
    setFormIssue("");
    setFormVendor("");
    setFormCost(0);
    showToast(`Work order logged for ${asset.assetCode}.`);
  };

  // Mark Completed
  const handleMarkCompleted = (record: MaintenanceRecord) => {
    const updatedLogs = logs.map((item) => {
      if (item.id === record.id) {
        return {
          ...item,
          status: "COMPLETED" as const,
          completedDate: new Date().toISOString().split("T")[0],
        };
      }
      return item;
    });
    saveMaintenanceLogs(updatedLogs);
    setLogs(updatedLogs);

    // Update asset condition back to GOOD and status back to IN_USE
    const asset = assets.find((a) => a.id === record.assetId);
    if (asset) {
      updateAsset({
        ...asset,
        condition: "GOOD",
        status: "IN_USE",
      });
      setAssets(getStoredAssets());
    }

    showToast(`Maintenance work order for ${record.assetCode} marked completed!`);
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = log.assetCode?.toLowerCase().includes(q);
        const matchName = log.assetName?.toLowerCase().includes(q);
        const matchVendor = log.vendorName?.toLowerCase().includes(q);
        const matchIssue = log.issueDescription?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchVendor && !matchIssue) return false;
      }
      if (statusFilter !== "ALL" && log.status !== statusFilter) return false;
      return true;
    });
  }, [logs, searchQuery, statusFilter]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalJobs = logs.length;
    const pendingJobs = logs.filter((l) => l.status !== "COMPLETED").length;
    const completedJobs = logs.filter((l) => l.status === "COMPLETED").length;
    const totalMaintenanceExpenditure = logs.reduce((s, l) => s + (l.cost || 0), 0);

    return {
      totalJobs,
      pendingJobs,
      completedJobs,
      totalMaintenanceExpenditure,
    };
  }, [logs]);

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredLogs.map((l, i) => ({
      "SL": i + 1,
      "Asset Code": l.assetCode,
      "Asset Title": l.assetName,
      "Service Date": l.serviceDate,
      "Defect / Issue": l.issueDescription,
      "Service Vendor": l.vendorName,
      "Repair Cost (৳)": l.cost,
      "Status": l.status,
      "Completed Date": l.completedDate || "Ongoing",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Maintenance_Logs");
    XLSX.writeFile(wb, `Asset_Maintenance_Ledger_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="space-y-5 p-4 sm:p-6 max-w-7xl mx-auto min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[120] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 border border-blue-500 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Menu Bar */}
      <AssetNavHeader />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Service Jobs</span>
            <Wrench className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-mono font-extrabold text-xl text-slate-900 mt-1">
            {stats.totalJobs} Orders
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Recorded institutional repairs</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Active / In Progress</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-mono font-extrabold text-xl text-amber-700 mt-1">
            {stats.pendingJobs} Pending
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Under servicing at vendor</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Restored &amp; Repaired</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono font-extrabold text-xl text-emerald-700 mt-1">
            {stats.completedJobs} Completed
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Successfully redeployed to campus</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Maintenance Expense</span>
            <DollarSign className="w-4 h-4 text-rose-600" />
          </div>
          <div className="font-mono font-extrabold text-xl text-rose-700 mt-1">
            ৳{stats.totalMaintenanceExpenditure.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Total repair bills settled</p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs no-print">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs"
            >
              <option value="ALL">All Maintenance Records</option>
              <option value="IN_PROGRESS">Active / In Progress</option>
              <option value="COMPLETED">Completed &amp; Restored</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, equipment, vendor..."
              className="w-full py-1.5 pl-2 pr-6 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
            />
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
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Service Work Order</span>
          </button>
        </div>
      </div>

      {/* Maintenance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wrench className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              Equipment Repairs &amp; Maintenance Log
            </h3>
            <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              {filteredLogs.length} Records
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100/80 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Asset Code</th>
                <th className="py-2.5 px-3">Equipment / Hardware</th>
                <th className="py-2.5 px-2">Service Date</th>
                <th className="py-2.5 px-3">Defect / Issue Reported</th>
                <th className="py-2.5 px-3">Service Vendor</th>
                <th className="py-2.5 px-3 text-right">Cost (৳)</th>
                <th className="py-2.5 px-2 text-center">Status</th>
                <th className="py-2.5 px-3 text-center no-print">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400 italic">
                    No maintenance logs matching current search filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {log.assetCode}
                    </td>

                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {log.assetName}
                    </td>

                    <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">
                      {log.serviceDate}
                    </td>

                    <td className="py-2.5 px-3 text-slate-700 max-w-xs">
                      {log.issueDescription}
                    </td>

                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                      {log.vendorName}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      ৳{log.cost.toLocaleString()}
                    </td>

                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      {log.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Check className="w-3 h-3" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3 h-3" /> In Progress
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center no-print">
                      {log.status !== "COMPLETED" && (
                        <button
                          type="button"
                          onClick={() => handleMarkCompleted(log)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] shadow-2xs transition cursor-pointer"
                        >
                          Mark Completed
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Work Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[130] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Create Equipment Service Work Order</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkOrder} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Select Equipment to Service *
                </label>
                <select
                  required
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-xs"
                >
                  <option value="">-- Choose asset from inventory --</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.assetCode} — {a.name} ({a.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Issue / Defect Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formIssue}
                  onChange={(e) => setFormIssue(e.target.value)}
                  placeholder="Describe breakdown symptoms, broken components, or servicing work..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Service Vendor / Contractor
                  </label>
                  <input
                    type="text"
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                    placeholder="e.g. Authorized Care Ltd"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Estimated Cost (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formCost}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Dispatch Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

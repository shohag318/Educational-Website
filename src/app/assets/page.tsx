"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  Barcode,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Wrench,
  Pencil,
  Trash2,
  Building2,
  Calendar,
  DollarSign,
  Tag,
  ShieldCheck,
  X,
  QrCode,
  Layers,
  ChevronDown,
  Info,
  Check,
} from "lucide-react";
import * as XLSX from "xlsx";
import { AssetNavHeader } from "./AssetNavHeader";
import {
  InstitutionAsset,
  AssetCategory,
  AssetCondition,
  AssetStatus,
  ASSET_CATEGORIES,
  CAMPUS_LOCATIONS,
  getStoredAssets,
  saveAssets,
  addAsset,
  updateAsset,
  deleteAsset,
  generateNextAssetCode,
  addMaintenanceRecord,
} from "./assetStore";
import { TENANT_SWITCH_EVENT } from "@/lib/clientTenant";

export default function InstitutionAssetsPage() {
  const [assets, setAssets] = useState<InstitutionAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterLocation, setFilterLocation] = useState<string>("ALL");
  const [filterCondition, setFilterCondition] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<InstitutionAsset | null>(null);

  // Barcode Tag Preview Modal
  const [tagPreviewAsset, setTagPreviewAsset] = useState<InstitutionAsset | null>(null);

  // Quick Maintenance Modal
  const [maintenanceAsset, setMaintenanceAsset] = useState<InstitutionAsset | null>(null);
  const [maintIssue, setMaintIssue] = useState("");
  const [maintVendor, setMaintVendor] = useState("");
  const [maintCost, setMaintCost] = useState<number>(0);

  // Form State
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formCategory, setFormCategory] = useState<AssetCategory>("COMPUTER_IT");
  const [formLocation, setFormLocation] = useState(CAMPUS_LOCATIONS[0]);
  const [formBuilding, setFormBuilding] = useState("Academic Block A");
  const [formPurchaseDate, setFormPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [formPrice, setFormPrice] = useState<number>(50000);
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formDepreciationRate, setFormDepreciationRate] = useState<number>(15);
  const [formCondition, setFormCondition] = useState<AssetCondition>("EXCELLENT");
  const [formStatus, setFormStatus] = useState<AssetStatus>("IN_USE");
  const [formSupplier, setFormSupplier] = useState("");
  const [formInvoice, setFormInvoice] = useState("");
  const [formWarranty, setFormWarranty] = useState("");
  const [formCustodian, setFormCustodian] = useState("");
  const [formSerial, setFormSerial] = useState("");
  const [formRemarks, setFormRemarks] = useState("");

  const loadData = () => {
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

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingAsset(null);
    const nextCode = generateNextAssetCode("COMPUTER_IT", assets);
    setFormCode(nextCode);
    setFormName("");
    setFormCategory("COMPUTER_IT");
    setFormLocation(CAMPUS_LOCATIONS[0]);
    setFormBuilding("Academic Block A");
    setFormPurchaseDate(new Date().toISOString().split("T")[0]);
    setFormPrice(45000);
    setFormQuantity(1);
    setFormDepreciationRate(20);
    setFormCondition("EXCELLENT");
    setFormStatus("IN_USE");
    setFormSupplier("");
    setFormInvoice("");
    setFormWarranty("");
    setFormCustodian("");
    setFormSerial("");
    setFormRemarks("");
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (asset: InstitutionAsset) => {
    setEditingAsset(asset);
    setFormCode(asset.assetCode);
    setFormName(asset.name);
    setFormCategory(asset.category);
    setFormLocation(asset.location);
    setFormBuilding(asset.building || "Academic Block A");
    setFormPurchaseDate(asset.purchaseDate);
    setFormPrice(asset.purchasePrice);
    setFormQuantity(asset.quantity || 1);
    setFormDepreciationRate(asset.depreciationRate || 15);
    setFormCondition(asset.condition);
    setFormStatus(asset.status);
    setFormSupplier(asset.supplierName || "");
    setFormInvoice(asset.invoiceNo || "");
    setFormWarranty(asset.warrantyExpiry || "");
    setFormCustodian(asset.custodian);
    setFormSerial(asset.serialNumber || "");
    setFormRemarks(asset.remarks || "");
    setIsAddEditModalOpen(true);
  };

  // Save Asset (Create or Update)
  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      alert("Please provide asset name and asset tag code.");
      return;
    }

    // Calculate current book value based on age and depreciation
    const purchaseYear = new Date(formPurchaseDate).getFullYear() || 2024;
    const currentYear = new Date().getFullYear();
    const yearsElapsed = Math.max(0, currentYear - purchaseYear);
    const depFraction = Math.min(0.9, (yearsElapsed * (formDepreciationRate || 15)) / 100);
    const calculatedCurrentValue = Math.round(formPrice * (1 - depFraction));

    if (editingAsset) {
      const updated: InstitutionAsset = {
        ...editingAsset,
        assetCode: formCode.trim().toUpperCase(),
        name: formName.trim(),
        category: formCategory,
        location: formLocation,
        building: formBuilding,
        purchaseDate: formPurchaseDate,
        purchasePrice: Number(formPrice),
        quantity: Number(formQuantity),
        currentValue: calculatedCurrentValue,
        depreciationRate: Number(formDepreciationRate),
        condition: formCondition,
        status: formStatus,
        supplierName: formSupplier.trim() || undefined,
        invoiceNo: formInvoice.trim() || undefined,
        warrantyExpiry: formWarranty || undefined,
        custodian: formCustodian.trim() || "Campus Administration",
        serialNumber: formSerial.trim() || undefined,
        remarks: formRemarks.trim() || undefined,
      };
      const nextList = updateAsset(updated);
      setAssets(nextList);
      showToast(`Asset "${updated.name}" updated successfully.`);
    } else {
      const newAsset: InstitutionAsset = {
        id: `ast_${Date.now()}`,
        assetCode: formCode.trim().toUpperCase(),
        name: formName.trim(),
        category: formCategory,
        location: formLocation,
        building: formBuilding,
        purchaseDate: formPurchaseDate,
        purchasePrice: Number(formPrice),
        quantity: Number(formQuantity),
        currentValue: calculatedCurrentValue,
        depreciationRate: Number(formDepreciationRate),
        condition: formCondition,
        status: formStatus,
        supplierName: formSupplier.trim() || undefined,
        invoiceNo: formInvoice.trim() || undefined,
        warrantyExpiry: formWarranty || undefined,
        custodian: formCustodian.trim() || "Campus Administration",
        serialNumber: formSerial.trim() || undefined,
        remarks: formRemarks.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      const nextList = addAsset(newAsset);
      setAssets(nextList);
      showToast(`Asset "${newAsset.name}" registered with tag ${newAsset.assetCode}.`);
    }
    setIsAddEditModalOpen(false);
  };

  // Delete Asset
  const handleDeleteAsset = (asset: InstitutionAsset) => {
    if (confirm(`Are you sure you want to retire / remove "${asset.name}" (${asset.assetCode})?`)) {
      const nextList = deleteAsset(asset.id);
      setAssets(nextList);
      showToast(`Asset ${asset.assetCode} removed from register.`);
    }
  };

  // Submit Quick Maintenance Record
  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceAsset || !maintIssue.trim()) return;

    addMaintenanceRecord({
      id: `maint_${Date.now()}`,
      assetId: maintenanceAsset.id,
      assetCode: maintenanceAsset.assetCode,
      assetName: maintenanceAsset.name,
      serviceDate: new Date().toISOString().split("T")[0],
      issueDescription: maintIssue.trim(),
      vendorName: maintVendor.trim() || "Authorized Service Center",
      cost: Number(maintCost) || 0,
      status: "IN_PROGRESS",
    });

    // Update asset condition to NEEDS_REPAIR and status to MAINTENANCE
    const updatedAsset: InstitutionAsset = {
      ...maintenanceAsset,
      condition: "NEEDS_REPAIR",
      status: "MAINTENANCE",
    };
    const nextList = updateAsset(updatedAsset);
    setAssets(nextList);

    setMaintenanceAsset(null);
    setMaintIssue("");
    setMaintVendor("");
    setMaintCost(0);
    showToast(`Maintenance job logged for ${updatedAsset.assetCode}.`);
  };

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = asset.assetCode?.toLowerCase().includes(q);
        const matchName = asset.name?.toLowerCase().includes(q);
        const matchSerial = asset.serialNumber?.toLowerCase().includes(q);
        const matchLocation = asset.location?.toLowerCase().includes(q);
        const matchCustodian = asset.custodian?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchSerial && !matchLocation && !matchCustodian) return false;
      }

      // Category
      if (filterCategory !== "ALL" && asset.category !== filterCategory) return false;

      // Location
      if (filterLocation !== "ALL" && asset.location !== filterLocation) return false;

      // Condition
      if (filterCondition !== "ALL" && asset.condition !== filterCondition) return false;

      // Status
      if (filterStatus !== "ALL" && asset.status !== filterStatus) return false;

      return true;
    });
  }, [assets, searchQuery, filterCategory, filterLocation, filterCondition, filterStatus]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalAssetsCount = assets.length;
    const totalItemsQuantity = assets.reduce((s, a) => s + (a.quantity || 1), 0);
    const totalCapitalCost = assets.reduce((s, a) => s + a.purchasePrice, 0);
    const totalCurrentVal = assets.reduce((s, a) => s + a.currentValue, 0);
    const inUseCount = assets.filter((a) => a.status === "IN_USE").length;
    const attentionCount = assets.filter(
      (a) => a.condition === "NEEDS_REPAIR" || a.condition === "DAMAGED" || a.status === "MAINTENANCE"
    ).length;

    return {
      totalAssetsCount,
      totalItemsQuantity,
      totalCapitalCost,
      totalCurrentVal,
      inUseRate: totalAssetsCount > 0 ? Math.round((inUseCount / totalAssetsCount) * 100) : 0,
      attentionCount,
    };
  }, [assets]);

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredAssets.map((a, i) => ({
      "SL": i + 1,
      "Asset Code": a.assetCode,
      "Asset Name": a.name,
      "Category": a.category,
      "Location / Room": a.location,
      "Building": a.building || "Main Campus",
      "Purchase Date": a.purchaseDate,
      "Original Price (৳)": a.purchasePrice,
      "Quantity": a.quantity || 1,
      "Current Book Value (৳)": a.currentValue,
      "Depreciation Rate (%)": `${a.depreciationRate}%`,
      "Condition": a.condition,
      "Status": a.status,
      "Supplier": a.supplierName || "N/A",
      "Invoice #": a.invoiceNo || "N/A",
      "Warranty Till": a.warrantyExpiry || "N/A",
      "Custodian / In-charge": a.custodian,
      "Serial Number": a.serialNumber || "N/A",
      "Remarks": a.remarks || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets_Register");
    XLSX.writeFile(wb, `Institution_Assets_Register_${new Date().toISOString().split("T")[0]}.xlsx`);
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

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Capital Book Value</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-mono font-extrabold text-xl text-slate-900 mt-1">
            ৳{stats.totalCurrentVal.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Original Cost: ৳{stats.totalCapitalCost.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Physical Units</span>
            <Boxes className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="font-mono font-extrabold text-xl text-indigo-700 mt-1">
            {stats.totalItemsQuantity} Units
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">{stats.totalAssetsCount} distinct asset entries</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Operational In-Use</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono font-extrabold text-xl text-emerald-700 mt-1">
            {stats.inUseRate}% Active
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Deployed in labs &amp; classrooms</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Service &amp; Repair Needed</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-mono font-extrabold text-xl text-amber-700 mt-1">
            {stats.attentionCount} Assets
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Needs servicing or in maintenance</p>
        </div>
      </div>

      {/* Action & Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs no-print">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium text-[11px]">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
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

          {/* Location */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium text-[11px]">Location:</span>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs max-w-[180px] truncate"
            >
              <option value="ALL">All Campus Locations</option>
              {CAMPUS_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium text-[11px]">Condition:</span>
            <select
              value={filterCondition}
              onChange={(e) => setFilterCondition(e.target.value)}
              className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs"
            >
              <option value="ALL">All Conditions</option>
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="NEEDS_REPAIR">Needs Repair</option>
              <option value="DAMAGED">Damaged</option>
              <option value="SCRAPPED">Scrapped</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, name, serial, room..."
              className="w-full py-1.5 pl-2 pr-6 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
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
            <span>Print Register</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register New Asset</span>
          </button>
        </div>
      </div>

      {/* Main Asset Registry Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Boxes className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              Official Institutional Asset Register &amp; Inventory
            </h3>
            <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              {filteredAssets.length} Assets
            </span>
          </div>

          <div className="text-xs font-mono font-bold text-slate-700">
            Book Value: <span className="text-blue-700 font-extrabold">৳{filteredAssets.reduce((s, a) => s + a.currentValue, 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100/80 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Asset Code</th>
                <th className="py-2.5 px-3">Asset Name &amp; Spec</th>
                <th className="py-2.5 px-2">Category</th>
                <th className="py-2.5 px-3">Location / Room</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Purchase (৳)</th>
                <th className="py-2.5 px-3 text-right">Book Value (৳)</th>
                <th className="py-2.5 px-2 text-center">Condition</th>
                <th className="py-2.5 px-2 text-center">Status</th>
                <th className="py-2.5 px-3">Custodian</th>
                <th className="py-2.5 px-3 text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-xs text-slate-400 italic">
                    No institutional assets found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const catInfo = ASSET_CATEGORIES.find((c) => c.key === asset.category);

                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/80 transition">
                      {/* Code with tag icon */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setTagPreviewAsset(asset)}
                          title="Click to preview barcode sticker tag"
                          className="hover:text-blue-600 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Barcode className="w-3.5 h-3.5 text-slate-400 hover:text-blue-600" />
                          <span>{asset.assetCode}</span>
                        </button>
                      </td>

                      {/* Name & Serial */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{asset.name}</div>
                        {asset.serialNumber && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            SN: {asset.serialNumber}
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catInfo?.badgeBg || "bg-slate-100 text-slate-700"}`}>
                          {catInfo?.label.split(" ")[0]}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-2.5 px-3 text-slate-700">
                        <div>{asset.location}</div>
                        {asset.building && (
                          <div className="text-[10px] text-slate-400">{asset.building}</div>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800">
                        {asset.quantity || 1}
                      </td>

                      {/* Purchase Price */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700">
                        ৳{asset.purchasePrice.toLocaleString()}
                      </td>

                      {/* Current Book Value */}
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-blue-900">
                        ৳{asset.currentValue.toLocaleString()}
                      </td>

                      {/* Condition */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            asset.condition === "EXCELLENT"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : asset.condition === "GOOD"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : asset.condition === "NEEDS_REPAIR"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : asset.condition === "DAMAGED"
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {asset.condition.replace("_", " ")}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            asset.status === "IN_USE"
                              ? "bg-emerald-50 text-emerald-700"
                              : asset.status === "MAINTENANCE"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {asset.status.replace("_", " ")}
                        </span>
                      </td>

                      {/* Custodian */}
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] truncate max-w-[140px]" title={asset.custodian}>
                        {asset.custodian}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center no-print">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setTagPreviewAsset(asset)}
                            title="Print Barcode Tag Sticker"
                            className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-700 rounded transition cursor-pointer"
                          >
                            <Barcode className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMaintenanceAsset(asset);
                              setMaintIssue("");
                              setMaintVendor(asset.supplierName || "");
                              setMaintCost(0);
                            }}
                            title="Log Repair / Maintenance"
                            className="p-1 hover:bg-amber-50 text-slate-500 hover:text-amber-700 rounded transition cursor-pointer"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(asset)}
                            title="Edit Asset Details"
                            className="p-1 hover:bg-blue-50 text-slate-500 hover:text-blue-700 rounded transition cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAsset(asset)}
                            title="Delete Asset"
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredAssets.length > 0 && (
              <tfoot className="bg-slate-100 font-bold border-t border-slate-200 text-slate-800">
                <tr>
                  <td colSpan={4} className="py-2.5 px-3">
                    Total Filtered Register:
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono">
                    {filteredAssets.reduce((s, a) => s + (a.quantity || 1), 0)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    ৳{filteredAssets.reduce((s, a) => s + a.purchasePrice, 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-extrabold text-blue-900 text-sm">
                    ৳{filteredAssets.reduce((s, a) => s + a.currentValue, 0).toLocaleString()}
                  </td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ========================================================
          ADD / EDIT ASSET MODAL
         ======================================================== */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-[130] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden my-6">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm text-white">
                  {editingAsset ? `Edit Asset: ${editingAsset.assetCode}` : "Register New Institutional Asset"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Asset Code */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Asset Tag Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. AST-IT-101"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs focus:ring-1 focus:ring-blue-500 uppercase"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const newCat = e.target.value as AssetCategory;
                      setFormCategory(newCat);
                      if (!editingAsset) {
                        setFormCode(generateNextAssetCode(newCat, assets));
                      }
                    }}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                  >
                    {ASSET_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Serial Number */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Serial # / Model
                  </label>
                  <input
                    type="text"
                    value={formSerial}
                    onChange={(e) => setFormSerial(e.target.value)}
                    placeholder="e.g. SN-8849-DELL"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-800 text-xs"
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Asset Title &amp; Detailed Specification *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Dell OptiPlex 7090 Desktop Core i7 (16GB RAM, 512GB SSD, 21.5-inch IPS)"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Location */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Deployment Location / Room *
                  </label>
                  <select
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 text-xs"
                  >
                    {CAMPUS_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Building Block */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Building Block / Wing
                  </label>
                  <input
                    type="text"
                    value={formBuilding}
                    onChange={(e) => setFormBuilding(e.target.value)}
                    placeholder="e.g. Academic Block A"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs"
                  />
                </div>

                {/* Custodian */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Assigned Custodian / In-Charge *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCustodian}
                    onChange={(e) => setFormCustodian(e.target.value)}
                    placeholder="e.g. Engr. Tanvir Ahmed (Lab In-charge)"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Purchase Date */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formPurchaseDate}
                    onChange={(e) => setFormPurchaseDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-semibold"
                  />
                </div>

                {/* Purchase Price */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Total Cost (৳) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Units / Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs"
                  />
                </div>

                {/* Depreciation Rate */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Annual Depr. (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formDepreciationRate}
                    onChange={(e) => setFormDepreciationRate(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Condition */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Physical Condition
                  </label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as AssetCondition)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs"
                  >
                    <option value="EXCELLENT">Excellent (Brand New)</option>
                    <option value="GOOD">Good (Operational)</option>
                    <option value="FAIR">Fair (Normal Wear)</option>
                    <option value="NEEDS_REPAIR">Needs Repair</option>
                    <option value="DAMAGED">Damaged / Non-functional</option>
                    <option value="SCRAPPED">Scrapped / Salvage</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Operational Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as AssetStatus)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs"
                  >
                    <option value="IN_USE">Active / In Use</option>
                    <option value="IN_STORAGE">In Storage / Buffer</option>
                    <option value="MAINTENANCE">Under Maintenance</option>
                    <option value="DISPOSED">Disposed / Written-off</option>
                  </select>
                </div>

                {/* Supplier Name */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Supplier / Vendor
                  </label>
                  <input
                    type="text"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    placeholder="e.g. Flora Ltd"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs"
                  />
                </div>

                {/* Warranty Expiry */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Warranty Valid Until
                  </label>
                  <input
                    type="date"
                    value={formWarranty}
                    onChange={(e) => setFormWarranty(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Audit Notes / Remarks
                </label>
                <input
                  type="text"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="e.g. Acquired under government ICT development grant, tag placed on chassis rear"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs"
                >
                  {editingAsset ? "Save Asset Changes" : "Register Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          BARCODE STICKER LABEL PREVIEW MODAL
         ======================================================== */}
      {tagPreviewAsset && (
        <div className="fixed inset-0 z-[130] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Barcode className="w-5 h-5 text-blue-600" />
                <span>Asset QR &amp; Barcode Label Sticker</span>
              </h3>
              <button
                type="button"
                onClick={() => setTagPreviewAsset(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sticker Preview Box */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 text-center space-y-2 select-none">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                DHAKA IDEAL HIGH SCHOOL &amp; COLLEGE
              </div>
              <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                PROPERTY OF INSTITUTION • DO NOT REMOVE
              </div>

              {/* Barcode graphic simulation */}
              <div className="py-2 flex flex-col items-center">
                <div className="flex items-center justify-center space-x-1 h-12 w-48 bg-slate-900 rounded p-1">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-full bg-white"
                      style={{ width: `${(i % 3 === 0 ? 3 : i % 2 === 0 ? 1 : 2)}px` }}
                    />
                  ))}
                </div>
                <span className="font-mono font-extrabold text-sm tracking-widest text-slate-900 mt-1">
                  *{tagPreviewAsset.assetCode}*
                </span>
              </div>

              <div className="text-xs font-bold text-slate-900 truncate">
                {tagPreviewAsset.name}
              </div>

              <div className="text-[10px] text-slate-600 flex items-center justify-center space-x-2">
                <span>Room: <strong>{tagPreviewAsset.location.split("(")[0]}</strong></span>
                <span>•</span>
                <span>Purchased: <strong>{tagPreviewAsset.purchaseDate}</strong></span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setTagPreviewAsset(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Sticker Tag</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          LOG REPAIR & MAINTENANCE MODAL
         ======================================================== */}
      {maintenanceAsset && (
        <div className="fixed inset-0 z-[130] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">
                  Log Repair / Service Work Order
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceAsset(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMaintenance} className="p-5 space-y-3.5 text-xs">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <span className="text-[10px] uppercase font-bold block text-amber-800">Target Asset</span>
                <strong className="font-bold">{maintenanceAsset.name}</strong>
                <span className="block font-mono text-[11px] text-amber-700">{maintenanceAsset.assetCode}</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Issue / Malfunction Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={maintIssue}
                  onChange={(e) => setMaintIssue(e.target.value)}
                  placeholder="Describe the defect, breakdown symptoms, or required service..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Repair Vendor / Technician
                  </label>
                  <input
                    type="text"
                    value={maintVendor}
                    onChange={(e) => setMaintVendor(e.target.value)}
                    placeholder="e.g. Authorized Care"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Estimated / Actual Cost (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={maintCost}
                    onChange={(e) => setMaintCost(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setMaintenanceAsset(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Submit Maintenance Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

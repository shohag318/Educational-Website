"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Download,
  Calendar,
  CheckCircle2,
  Trash2,
  X,
  CreditCard,
  Building,
  DollarSign,
  ArrowLeft,
  FileSpreadsheet,
} from "lucide-react";
import { AccountantNavHeader } from "../AccountantNavHeader";
import {
  IncomeEntry,
  getStoredIncomes,
  saveStoredIncomes,
} from "../accountantStore";
import { SessionSelect } from "@/components/SessionSelect";

export default function InstitutionalIncomePage() {
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<IncomeEntry["category"]>("STUDENT_TUITION");
  const [newAmount, setNewAmount] = useState<number>(25000);
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newMethod, setNewMethod] = useState<IncomeEntry["paymentMethod"]>("Sonali Bank");
  const [newRef, setNewRef] = useState("");
  const [newReceivedBy, setNewReceivedBy] = useState("Accounts Officer");
  const [newRemarks, setNewRemarks] = useState("");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    setIncomes(getStoredIncomes());

    const handleSync = () => {
      setIncomes(getStoredIncomes());
    };
    window.addEventListener("nctb_accountant_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("nctb_accountant_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Filtered List
  const filteredIncomes = useMemo(() => {
    return incomes.filter((item) => {
      if (selectedSession !== "ALL") {
        const yearPrefix = selectedSession.slice(0, 4);
        if (!item.date.includes(yearPrefix)) return false;
      }
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
      if (methodFilter !== "ALL" && item.paymentMethod !== methodFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesVoucher = item.voucherNo.toLowerCase().includes(q);
        const matchesRef = item.referenceNo?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesVoucher && !matchesRef) return false;
      }
      return true;
    });
  }, [incomes, selectedSession, categoryFilter, methodFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const totalRevenue = incomes.reduce((sum, item) => sum + item.amount, 0);
    const studentFeeRev = incomes
      .filter((item) => item.category === "STUDENT_TUITION" || item.category === "SESSION_DEVELOPMENT" || item.category === "EXAM_ASSESSMENT")
      .reduce((sum, item) => sum + item.amount, 0);
    const bankDepositRev = incomes
      .filter((item) => item.paymentMethod === "Sonali Bank" || item.paymentMethod === "Agrani Bank")
      .reduce((sum, item) => sum + item.amount, 0);
    const mfsRev = incomes
      .filter((item) => item.paymentMethod === "bKash MFS" || item.paymentMethod === "Nagad")
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      totalRevenue,
      studentFeeRev,
      bankDepositRev,
      mfsRev,
    };
  }, [incomes]);

  const handleCreateIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newAmount <= 0) return;

    const voucherNum = `RV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newItem: IncomeEntry = {
      id: `inc_${Date.now()}`,
      voucherNo: voucherNum,
      title: newTitle.trim(),
      category: newCategory,
      amount: Number(newAmount),
      date: newDate,
      paymentMethod: newMethod,
      referenceNo: newRef.trim() || undefined,
      receivedBy: newReceivedBy.trim() || undefined,
      remarks: newRemarks.trim() || undefined,
    };

    const updated = [newItem, ...incomes];
    saveStoredIncomes(updated);
    setIncomes(updated);
    setIsAddModalOpen(false);
    showToast(`Income Voucher ${voucherNum} recorded successfully!`);

    // Reset Form
    setNewTitle("");
    setNewAmount(25000);
    setNewRef("");
    setNewRemarks("");
  };

  const handleDeleteIncome = (id: string, voucher: string) => {
    if (!confirm(`Are you sure you want to delete income voucher ${voucher}?`)) return;
    const updated = incomes.filter((item) => item.id !== id);
    saveStoredIncomes(updated);
    setIncomes(updated);
    showToast(`Voucher ${voucher} deleted.`);
  };

  const getCategoryBadge = (cat: IncomeEntry["category"]) => {
    switch (cat) {
      case "STUDENT_TUITION":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "SESSION_DEVELOPMENT":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "EXAM_ASSESSMENT":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "LAB_PRACTICAL":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "DONATION_GRANT":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "BANK_INTEREST":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "CANTEEN_RENT":
        return "bg-sky-50 text-sky-700 border-sky-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Shared Module Nav Tabs */}
      <AccountantNavHeader />

      {/* Page Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <Link href="/accountant" className="hover:underline">Accounts & Finance</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">Institutional Income</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              Institutional Income & Revenue Section
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              General revenue ledger tracking student tuition collection, session funds, examination charges, government/SMC grants, and bank interest.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Income Voucher</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Recorded Income</span>
            <span className="text-xs font-bold text-emerald-700">৳</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            ৳ {stats.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            {incomes.length} Total verified credit vouchers
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Student Academic Fees</span>
            <Building className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            ৳ {stats.studentFeeRev.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            Tuition, Exam & Session revenue
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-800">Bank Account Credits</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            ৳ {stats.bankDepositRev.toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
            Sonali & Agrani Bank deposits
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">MFS / Digital Inflow</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            ৳ {stats.mfsRev.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">
            bKash & Nagad merchant gateway
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Filter Income Records:
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedSession("ALL");
              setCategoryFilter("ALL");
              setMethodFilter("ALL");
              setSearchQuery("");
            }}
            className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1 underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <SessionSelect
              value={selectedSession}
              onChange={(val) => setSelectedSession(val)}
              label="Session"
              labelClassName="block text-[11px] font-semibold text-slate-600 mb-1"
              selectClassName="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Revenue Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
            >
              <option value="ALL">All Categories</option>
              <option value="STUDENT_TUITION">Student Monthly Tuition</option>
              <option value="SESSION_DEVELOPMENT">Annual Session & Development</option>
              <option value="EXAM_ASSESSMENT">Term Assessment & Exam Fees</option>
              <option value="LAB_PRACTICAL">Science & ICT Lab Fees</option>
              <option value="DONATION_GRANT">SMC / Education Grants</option>
              <option value="BANK_INTEREST">Bank Account Interest</option>
              <option value="CANTEEN_RENT">Canteen & Store Lease Rent</option>
              <option value="OTHER">Other Institutional Receipts</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Receipt Channel / Method</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
            >
              <option value="ALL">All Channels</option>
              <option value="Sonali Bank">Sonali Bank</option>
              <option value="Agrani Bank">Agrani Bank</option>
              <option value="bKash MFS">bKash MFS</option>
              <option value="Nagad">Nagad</option>
              <option value="Cash in Hand">Cash in Hand</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Search Voucher / Ref</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Voucher #, Particulars, Ref..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Income Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Official Income Vouchers Ledger
            </h3>
            <span className="text-[11px] font-semibold text-slate-500">
              ({filteredIncomes.length} records)
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Total Filtered: <strong className="font-mono text-emerald-700">৳ {filteredIncomes.reduce((s, i) => s + i.amount, 0).toLocaleString()}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Voucher #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4">Particulars / Source</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Payment Channel</th>
                <th className="py-3 px-3">Reference No</th>
                <th className="py-3 px-3 text-right">Amount (৳)</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncomes.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">
                    {item.voucherNo}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500">
                    {item.date}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{item.title}</div>
                    {item.remarks && (
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.remarks}</div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadge(item.category)}`}>
                      {item.category.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-700">
                    {item.paymentMethod}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                    {item.referenceNo || "—"}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                    ৳ {item.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleDeleteIncome(item.id, item.voucherNo)}
                      className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                      title="Delete Voucher"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Income Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Record Institutional Income Voucher</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIncome} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Income Particulars / Description *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Model Test Exam Fee Collection, Special SMC Donation"
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Revenue Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  >
                    <option value="STUDENT_TUITION">Student Monthly Tuition</option>
                    <option value="SESSION_DEVELOPMENT">Session & Development</option>
                    <option value="EXAM_ASSESSMENT">Exam Assessment Fee</option>
                    <option value="LAB_PRACTICAL">Lab & Practical Fee</option>
                    <option value="DONATION_GRANT">Donation / SMC Grant</option>
                    <option value="BANK_INTEREST">Bank Account Interest</option>
                    <option value="CANTEEN_RENT">Canteen / Shop Rent</option>
                    <option value="OTHER">Other Institutional Receipt</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Amount (৳) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Receipt Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Receipt Channel / Method</label>
                  <select
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  >
                    <option value="Sonali Bank">Sonali Bank</option>
                    <option value="Agrani Bank">Agrani Bank</option>
                    <option value="bKash MFS">bKash MFS</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Cash in Hand">Cash in Hand</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Deposit Slip / Ref #</label>
                  <input
                    type="text"
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    placeholder="e.g. SB-DEP-1029"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Received By</label>
                  <input
                    type="text"
                    value={newReceivedBy}
                    onChange={(e) => setNewReceivedBy(e.target.value)}
                    placeholder="e.g. Cashier / Bursar"
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={newRemarks}
                  onChange={(e) => setNewRemarks(e.target.value)}
                  placeholder="Official institutional memo note..."
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-100 font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer transition"
                >
                  Save Income Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl border border-slate-700 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

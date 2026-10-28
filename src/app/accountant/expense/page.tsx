"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Calendar,
  CheckCircle2,
  Trash2,
  X,
  CreditCard,
  Building,
  DollarSign,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { AccountantNavHeader } from "../AccountantNavHeader";
import {
  ExpenseEntry,
  getStoredExpenses,
  saveStoredExpenses,
} from "../accountantStore";
import { SessionSelect } from "@/components/SessionSelect";

export default function OperatingExpensePage() {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<ExpenseEntry["category"]>("EXAM_PRINTING");
  const [newAmount, setNewAmount] = useState<number>(15000);
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newMethod, setNewMethod] = useState<ExpenseEntry["paymentMethod"]>("Sonali Bank Cheque");
  const [newPayee, setNewPayee] = useState("");
  const [newApprovedBy, setNewApprovedBy] = useState("Headmaster & SMC");
  const [newRef, setNewRef] = useState("");
  const [newRemarks, setNewRemarks] = useState("");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    setExpenses(getStoredExpenses());

    const handleSync = () => {
      setExpenses(getStoredExpenses());
    };
    window.addEventListener("nctb_accountant_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("nctb_accountant_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
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
        const matchesPayee = item.payee.toLowerCase().includes(q);
        if (!matchesTitle && !matchesVoucher && !matchesPayee) return false;
      }
      return true;
    });
  }, [expenses, selectedSession, categoryFilter, methodFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const payrollExpenses = expenses
      .filter((item) => item.category === "SALARY_PAYROLL")
      .reduce((sum, item) => sum + item.amount, 0);
    const academicSupplies = expenses
      .filter((item) => item.category === "EXAM_PRINTING" || item.category === "LAB_CONSUMABLES")
      .reduce((sum, item) => sum + item.amount, 0);
    const campusUtilities = expenses
      .filter((item) => item.category === "UTILITIES_ELECTRICITY" || item.category === "CAMPUS_MAINTENANCE" || item.category === "ICT_INFRASTRUCTURE")
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      totalExpenses,
      payrollExpenses,
      academicSupplies,
      campusUtilities,
    };
  }, [expenses]);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newAmount <= 0 || !newPayee.trim()) return;

    const voucherNum = `PV-2026-${Math.floor(200 + Math.random() * 800)}`;
    const newItem: ExpenseEntry = {
      id: `exp_${Date.now()}`,
      voucherNo: voucherNum,
      title: newTitle.trim(),
      category: newCategory,
      amount: Number(newAmount),
      date: newDate,
      paymentMethod: newMethod,
      payee: newPayee.trim(),
      approvedBy: newApprovedBy.trim(),
      referenceNo: newRef.trim() || undefined,
      remarks: newRemarks.trim() || undefined,
    };

    const updated = [newItem, ...expenses];
    saveStoredExpenses(updated);
    setExpenses(updated);
    setIsAddModalOpen(false);
    showToast(`Payment Voucher ${voucherNum} recorded successfully!`);

    // Reset Form
    setNewTitle("");
    setNewAmount(15000);
    setNewPayee("");
    setNewRef("");
    setNewRemarks("");
  };

  const handleDeleteExpense = (id: string, voucher: string) => {
    if (!confirm(`Are you sure you want to delete payment voucher ${voucher}?`)) return;
    const updated = expenses.filter((item) => item.id !== id);
    saveStoredExpenses(updated);
    setExpenses(updated);
    showToast(`Payment voucher ${voucher} deleted.`);
  };

  const getCategoryBadge = (cat: ExpenseEntry["category"]) => {
    switch (cat) {
      case "SALARY_PAYROLL":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "EXAM_PRINTING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "UTILITIES_ELECTRICITY":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "LAB_CONSUMABLES":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "ICT_INFRASTRUCTURE":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "CAMPUS_MAINTENANCE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "SPORTS_CULTURAL":
        return "bg-purple-50 text-purple-700 border-purple-200";
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
          <span className="text-slate-800 font-medium">Operating Expense</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-rose-600" />
              Institutional Operating Expense Section
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              General payment ledger tracking faculty salaries, examination printing, power utilities, laboratory consumables, ICT infrastructure, and physical campus maintenance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense Voucher</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Operating Expenses</span>
            <span className="text-xs font-bold text-rose-600">৳</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            ৳ {stats.totalExpenses.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-0.5">
            {expenses.length} Authorized debit payment vouchers
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-800">Faculty & Staff Payroll</span>
            <Building className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            ৳ {stats.payrollExpenses.toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
            Teacher salaries & allowances
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Exam Printing & Labs</span>
            <Printer className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            ৳ {stats.academicSupplies.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">
            Confidential papers & chemicals
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-cyan-200 bg-cyan-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-800">Utilities & Campus Upkeep</span>
            <TrendingDown className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-bold text-cyan-600 mt-1">
            ৳ {stats.campusUtilities.toLocaleString()}
          </div>
          <div className="text-[11px] text-cyan-700 font-medium mt-0.5">
            Power, fiber net & repairs
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Filter Expense Records:
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedSession("ALL");
              setCategoryFilter("ALL");
              setMethodFilter("ALL");
              setSearchQuery("");
            }}
            className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center space-x-1 underline cursor-pointer"
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
              selectClassName="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Expense Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 font-medium text-slate-800"
            >
              <option value="ALL">All Categories</option>
              <option value="SALARY_PAYROLL">Faculty & Staff Payroll</option>
              <option value="EXAM_PRINTING">Exam Papers & Stationery</option>
              <option value="UTILITIES_ELECTRICITY">Electricity & Utilities</option>
              <option value="LAB_CONSUMABLES">Science Practical Labs</option>
              <option value="ICT_INFRASTRUCTURE">ICT & Computer Labs</option>
              <option value="CAMPUS_MAINTENANCE">Campus Upkeep & Sanitation</option>
              <option value="SPORTS_CULTURAL">Sports & Cultural Events</option>
              <option value="MISC_OFFICE">General Administrative Expenses</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Disbursement Channel</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 font-medium text-slate-800"
            >
              <option value="ALL">All Channels</option>
              <option value="Sonali Bank Cheque">Sonali Bank Cheque</option>
              <option value="Agrani Bank EFT">Agrani Bank EFT</option>
              <option value="Petty Cash">Petty Cash Imprest</option>
              <option value="bKash Commercial">bKash Commercial</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Search Voucher / Payee</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Voucher #, Payee, Particulars..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 font-medium text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expense Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Official Payment Voucher Debit Ledger
            </h3>
            <span className="text-[11px] font-semibold text-slate-500">
              ({filteredExpenses.length} records)
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Total Filtered: <strong className="font-mono text-rose-700">৳ {filteredExpenses.reduce((s, i) => s + i.amount, 0).toLocaleString()}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Voucher #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4">Expense Particulars</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Payee / Vendor</th>
                <th className="py-3 px-3">Payment Channel</th>
                <th className="py-3 px-3">Approved By</th>
                <th className="py-3 px-3 text-right">Amount (৳)</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">
                    {item.voucherNo}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500">
                    {item.date}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{item.title}</div>
                    {item.referenceNo && (
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">Ref: {item.referenceNo}</div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadge(item.category)}`}>
                      {item.category.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    {item.payee}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {item.paymentMethod}
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-500">
                    {item.approvedBy}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                    ৳ {item.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleDeleteExpense(item.id, item.voucherNo)}
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

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">Record Institutional Payment Voucher</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Expense Particulars / Description *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Science Laboratory Chemicals Refill, DESCO Electricity Bill"
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Expense Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-slate-800 bg-white"
                  >
                    <option value="SALARY_PAYROLL">Faculty & Staff Payroll</option>
                    <option value="EXAM_PRINTING">Exam Papers & Printing</option>
                    <option value="UTILITIES_ELECTRICITY">Electricity & Power</option>
                    <option value="LAB_CONSUMABLES">Lab Consumables & Chemicals</option>
                    <option value="ICT_INFRASTRUCTURE">ICT Lab & Broadband</option>
                    <option value="CAMPUS_MAINTENANCE">Campus Upkeep & Sanitation</option>
                    <option value="SPORTS_CULTURAL">Sports & Cultural Events</option>
                    <option value="MISC_OFFICE">General Administrative Costs</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Disbursement Amount (৳) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payee / Vendor Name *</label>
                  <input
                    type="text"
                    required
                    value={newPayee}
                    onChange={(e) => setNewPayee(e.target.value)}
                    placeholder="e.g. Al-Noor Press, DESCO, Faculty Fund"
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Channel / Mode</label>
                  <select
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-slate-800 bg-white"
                  >
                    <option value="Sonali Bank Cheque">Sonali Bank Cheque</option>
                    <option value="Agrani Bank EFT">Agrani Bank EFT</option>
                    <option value="Petty Cash">Petty Cash Imprest</option>
                    <option value="bKash Commercial">bKash Commercial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Disbursement Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Approved Authority</label>
                  <input
                    type="text"
                    value={newApprovedBy}
                    onChange={(e) => setNewApprovedBy(e.target.value)}
                    placeholder="e.g. Principal / SMC Finance Chair"
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Invoice / Cheque #</label>
                  <input
                    type="text"
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    placeholder="e.g. CHQ-9982 or INV-441"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Accounting Remarks</label>
                  <input
                    type="text"
                    value={newRemarks}
                    onChange={(e) => setNewRemarks(e.target.value)}
                    placeholder="Budget head / memo notes..."
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
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
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs cursor-pointer transition"
                >
                  Save Payment Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl border border-slate-700 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-rose-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Printer,
  Calendar,
  CreditCard,
  CheckCircle2,
  X,
  FileSpreadsheet,
  DollarSign,
  Banknote,
  RotateCcw,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ManualFeeNavHeader } from "../ManualFeeNavHeader";
import {
  FeeCollectionVoucher,
  getStoredCollectionVouchers,
  removeCollectionVoucher,
} from "../collectionStore";
import { MoneyReceiptModal } from "../MoneyReceiptModal";
import { getScopedStorageKey, TENANT_SWITCH_EVENT } from "@/lib/clientTenant";

export default function DailyCollectionHistoryPage() {
  const [vouchers, setVouchers] = useState<FeeCollectionVoucher[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterMode, setFilterMode] = useState<string>("ALL");
  const [filterClass, setFilterClass] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<"TODAY" | "THIS_WEEK" | "THIS_MONTH" | "ALL">("TODAY");

  // Receipt Modal State
  const [activeReceiptVoucher, setActiveReceiptVoucher] = useState<FeeCollectionVoucher | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadVouchers = () => {
    setVouchers(getStoredCollectionVouchers());
  };

  useEffect(() => {
    loadVouchers();
    window.addEventListener(TENANT_SWITCH_EVENT, loadVouchers);
    return () => window.removeEventListener(TENANT_SWITCH_EVENT, loadVouchers);
  }, []);

  // Filter vouchers based on date range, mode, class, and search query
  const filteredVouchers = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const curDate = new Date();

    return vouchers.filter((v) => {
      // Date filter
      if (dateRange === "TODAY") {
        if (v.collectionDate !== todayStr) return false;
      } else if (dateRange === "THIS_WEEK") {
        const vDate = new Date(v.collectionDate);
        const diffDays = (curDate.getTime() - vDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7 || diffDays < 0) return false;
      } else if (dateRange === "THIS_MONTH") {
        const curYearMonth = todayStr.slice(0, 7);
        if (!v.collectionDate?.startsWith(curYearMonth)) return false;
      }

      // Payment Mode filter
      if (filterMode !== "ALL" && v.paymentMethod !== filterMode) return false;

      // Class filter
      if (filterClass !== "ALL" && v.className !== filterClass) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = v.studentName?.toLowerCase().includes(q);
        const matchVoucher = v.voucherNo?.toLowerCase().includes(q);
        const matchRoll = String(v.studentRoll).includes(q);
        const matchRef = v.transactionRef?.toLowerCase().includes(q);
        if (!matchName && !matchVoucher && !matchRoll && !matchRef) return false;
      }

      return true;
    });
  }, [vouchers, dateRange, filterMode, filterClass, searchQuery]);

  // Aggregate stats
  const totalAmount = useMemo(() => {
    return filteredVouchers.reduce((s, v) => s + v.netPaidAmount, 0);
  }, [filteredVouchers]);

  const cashAmount = useMemo(() => {
    return filteredVouchers.filter((v) => v.paymentMethod === "CASH").reduce((s, v) => s + v.netPaidAmount, 0);
  }, [filteredVouchers]);

  const digitalAmount = useMemo(() => {
    return filteredVouchers.filter((v) => v.paymentMethod !== "CASH").reduce((s, v) => s + v.netPaidAmount, 0);
  }, [filteredVouchers]);

  // Classes list from vouchers
  const availableClasses = useMemo(() => {
    return Array.from(new Set(vouchers.map((v) => v.className).filter(Boolean)));
  }, [vouchers]);

  // Void/Delete Voucher
  const handleVoidVoucher = (v: FeeCollectionVoucher) => {
    if (confirm(`Void voucher #${v.voucherNo} for ${v.studentName}? This will reverse the payment entry.`)) {
      removeCollectionVoucher(v.id);
      setVouchers((prev) => prev.filter((item) => item.id !== v.id));

      // Revert paid amount in feeRecords
      try {
        const recKey = getScopedStorageKey("nctb_student_fee_records");
        const raw = localStorage.getItem(recKey);
        if (raw) {
          const recs = JSON.parse(raw);
          const existing = recs[v.studentId];
          if (existing) {
            existing.paidAmount = Math.max(0, (existing.paidAmount || 0) - v.netPaidAmount);
            localStorage.setItem(recKey, JSON.stringify(recs));
          }
        }
      } catch (e) {
        console.error(e);
      }

      setToastMessage(`Voucher #${v.voucherNo} voided successfully.`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredVouchers.length === 0) {
      alert("No voucher records to export.");
      return;
    }

    const data = filteredVouchers.map((v, i) => ({
      SL: i + 1,
      "Voucher No": v.voucherNo,
      "Date": v.collectionDate,
      "Student Name": v.studentName,
      "Roll": v.studentRoll,
      "Class": v.className,
      "Section": v.sectionName || "A",
      "Group": v.groupType || "ALL",
      "Session": v.session,
      "Month": v.monthKey,
      "Payment Mode": v.paymentMethod,
      "Reference / Trx": v.transactionRef || "",
      "Gross Total (Tk)": v.grossAmount,
      "Waiver Discount (Tk)": v.waiverDiscount,
      "Fine (Tk)": v.fineAmount,
      "Net Paid (Tk)": v.netPaidAmount,
      "Cashier": v.cashierName || "Counter",
      "Remarks": v.remarks || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Collection Ledger");
    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `Fee_Collection_Ledger_${dateStr}.xlsx`);
  };

  // Print Daily Settlement Sheet
  const handlePrintDailySettlement = () => {
    window.print();
  };

  return (
    <div className="space-y-5 p-4 sm:p-6 max-w-7xl mx-auto min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[110] bg-emerald-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 border border-emerald-500 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Menu Bar */}
      <ManualFeeNavHeader />

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Filtered Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono font-extrabold text-xl text-slate-900 mt-1">
            ৳{totalAmount.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">{filteredVouchers.length} vouchers in selection</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Cash Counter Total</span>
            <Banknote className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-mono font-extrabold text-xl text-amber-700 mt-1">
            ৳{cashAmount.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Direct physical cash received</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Digital &amp; Bank Slip</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="font-mono font-extrabold text-xl text-indigo-700 mt-1">
            ৳{digitalAmount.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">bKash, Nagad &amp; Bank transfers</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Date Scope</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-bold text-sm text-slate-800 mt-1 uppercase">
            {dateRange.replace("_", " ")}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Audit timeframe active</p>
        </div>
      </div>

      {/* Filter Toolbar (Hidden in Print) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs no-print">
        {/* Date Scope Pills */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
          {(["TODAY", "THIS_WEEK", "THIS_MONTH", "ALL"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-md font-bold transition text-xs cursor-pointer ${
                dateRange === r
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {r === "TODAY" ? "Today" : r === "THIS_WEEK" ? "7 Days" : r === "THIS_MONTH" ? "This Month" : "All Time"}
            </button>
          ))}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Class Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium text-[11px]">Class:</span>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs"
            >
              <option value="ALL">All Classes</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium text-[11px]">Mode:</span>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs"
            >
              <option value="ALL">All Modes</option>
              <option value="CASH">Cash Only</option>
              <option value="BKASH">bKash</option>
              <option value="NAGAD">Nagad</option>
              <option value="ROCKET">Rocket</option>
              <option value="BANK_DEPOSIT">Bank Deposit</option>
              <option value="POS_CARD">POS Card</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search voucher #, student, roll..."
              className="w-full py-1.5 pl-2 pr-6 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-emerald-500"
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
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              Official Collection Vouchers Registry
            </h3>
            <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              {filteredVouchers.length} Records
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-mono font-bold text-slate-700">
              Subtotal: <span className="text-emerald-700 font-extrabold">৳{totalAmount.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-2 no-print">
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export to Excel</span>
              </button>

              <button
                type="button"
                onClick={handlePrintDailySettlement}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Ledger (Ctrl+P)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100/80 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-2.5 px-3">SL</th>
                <th className="py-2.5 px-3">Voucher #</th>
                <th className="py-2.5 px-2">Date</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-2">Roll</th>
                <th className="py-2.5 px-2">Class</th>
                <th className="py-2.5 px-2">Cycle</th>
                <th className="py-2.5 px-2">Payment Mode</th>
                <th className="py-2.5 px-2">Ref / Trx ID</th>
                <th className="py-2.5 px-3 text-right">Net Paid (৳)</th>
                <th className="py-2.5 px-2">Cashier</th>
                <th className="py-2.5 px-3 text-center no-print">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-xs text-slate-400 italic">
                    No collection vouchers match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v, idx) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {v.voucherNo}
                    </td>
                    <td className="py-2.5 px-2 text-slate-600 font-medium whitespace-nowrap">
                      {v.collectionDate}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {v.studentName}
                    </td>
                    <td className="py-2.5 px-2 font-mono font-bold text-slate-800">
                      {v.studentRoll}
                    </td>
                    <td className="py-2.5 px-2 text-slate-700">
                      {v.className} ({v.sectionName || "A"})
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-slate-700">
                      {v.monthKey} {v.session}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                        {v.paymentMethod.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-[11px] text-slate-500">
                      {v.transactionRef || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-950">
                      ৳{v.netPaidAmount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-slate-500 text-[11px] truncate max-w-[100px]">
                      {v.cashierName || "Counter"}
                    </td>
                    <td className="py-2.5 px-3 text-center no-print">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReceiptVoucher(v);
                            setIsReceiptModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-bold transition cursor-pointer"
                          title="Print Money Receipt"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Print</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVoidVoucher(v)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Void / Cancel Voucher"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredVouchers.length > 0 && (
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-xs">
                <tr>
                  <td colSpan={9} className="py-2.5 px-3 text-right uppercase tracking-wider text-slate-700">
                    Grand Total Collections:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm text-emerald-950 font-extrabold">
                    ৳{totalAmount.toLocaleString()}
                  </td>
                  <td colSpan={2} className="no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Money Receipt Print Modal */}
      <MoneyReceiptModal
        voucher={activeReceiptVoucher}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </div>
  );
}

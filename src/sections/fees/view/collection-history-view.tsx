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
} from "@/components/iconify/lucide";
import * as XLSX from "xlsx";
import { AppButton } from "@/components/button/app-button";
import { AppTable, Label, AppCard, TableFilterBar } from "@/components";
import { ManualFeeNavHeader } from "@/sections/fees/component/manual-fee-nav-header";
import {
  FeeCollectionVoucher,
  getStoredCollectionVouchers,
  removeCollectionVoucher,
} from "@/sections/fees/schema/collection-store";
import { MoneyReceiptModal } from "@/sections/fees/component/money-receipt-modal";
import { getScopedStorageKey, TENANT_SWITCH_EVENT } from "@/lib/clientTenant";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

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
            <AppButton
              key={r}
              type="button"
              size="small"
              variant="soft"
              color={dateRange === r ? "primary" : "inherit"}
              onClick={() => setDateRange(r)}
            >
              {r === "TODAY" ? "Today" : r === "THIS_WEEK" ? "7 Days" : r === "THIS_MONTH" ? "This Month" : "All Time"}
            </AppButton>
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

      <AppCard>
        <TableFilterBar showSearch={false}>
          <AppTable<FeeCollectionVoucher>
        embedded
        rows={filteredVouchers}
        rowKey={(row) => row.id}
        defaultOrderBy="collectionDate"
        minWidth={1100}
        columns={[
          {
            id: "sl",
            label: "SL",
            sortable: false,
            width: 56,
            render: (_v, index) => (
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                {index + 1}
              </Typography>
            ),
          },
          {
            id: "voucherNo",
            label: "Voucher #",
            render: (v) => (
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {v.voucherNo}
              </Typography>
            ),
          },
          {
            id: "collectionDate",
            label: "Date",
            render: (v) => (
              <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                {v.collectionDate}
              </Typography>
            ),
          },
          {
            id: "studentName",
            label: "Student Name",
            render: (v) => (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {v.studentName}
              </Typography>
            ),
          },
          {
            id: "studentRoll",
            label: "Roll",
            render: (v) => (
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {v.studentRoll}
              </Typography>
            ),
          },
          {
            id: "className",
            label: "Class",
            render: (v) => `${v.className} (${v.sectionName || "A"})`,
          },
          {
            id: "monthKey",
            label: "Cycle",
            render: (v) => `${v.monthKey} ${v.session}`,
          },
          {
            id: "paymentMethod",
            label: "Payment Mode",
            render: (v) => (
              <Label color="success" variant="soft">
                {v.paymentMethod.replace("_", " ")}
              </Label>
            ),
          },
          {
            id: "transactionRef",
            label: "Ref / Trx ID",
            sortable: false,
            render: (v) => (
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                {v.transactionRef || "-"}
              </Typography>
            ),
          },
          {
            id: "netPaidAmount",
            label: "Net Paid (৳)",
            align: "right",
            render: (v) => (
              <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 800 }}>
                ৳{v.netPaidAmount.toLocaleString()}
              </Typography>
            ),
          },
          {
            id: "cashierName",
            label: "Cashier",
            sortable: false,
            render: (v) => (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 100 }}>
                {v.cashierName || "Counter"}
              </Typography>
            ),
          },
          {
            id: "actions",
            label: "Action",
            align: "center",
            sortable: false,
            render: (v) => (
              <Stack direction="row" spacing={0.75} sx={{ justifyContent: "center" }} className="no-print">
                <AppButton
                  type="button"
                  size="small"
                  variant="soft"
                  color="success"
                  startIcon={<Printer size={12} />}
                  onClick={() => {
                    setActiveReceiptVoucher(v);
                    setIsReceiptModalOpen(true);
                  }}
                  title="Print Money Receipt"
                >
                  Print
                </AppButton>
                <IconButton size="small" color="error" onClick={() => handleVoidVoucher(v)} title="Void / Cancel Voucher">
                  <X className="w-3.5 h-3.5" />
                </IconButton>
              </Stack>
            ),
          },
        ]}
      />
        </TableFilterBar>
      </AppCard>

      {/* Money Receipt Print Modal */}
      <MoneyReceiptModal
        voucher={activeReceiptVoucher}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </div>
  );
}

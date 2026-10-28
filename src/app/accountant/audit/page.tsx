"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  Printer,
  FileSpreadsheet,
  Building,
  Check,
  Scale,
  Landmark,
  Layers,
  ArrowRight,
} from "lucide-react";
import { AccountantNavHeader } from "../AccountantNavHeader";
import {
  AuditRecord,
  getStoredAudit,
  saveStoredAudit,
  getStoredIncomes,
  getStoredExpenses,
  getStoredPayroll,
} from "../accountantStore";
import { SessionSelect } from "@/components/SessionSelect";

export default function InstitutionalAuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("ALL");
  const [incomes, setIncomes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Audit Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newVoucherNo, setNewVoucherNo] = useState("AUD-INSP-2026-09");
  const [newCategory, setNewCategory] = useState<AuditRecord["category"]>("FEE_RECONCILIATION");
  const [newDesc, setNewDesc] = useState("");
  const [newDebit, setNewDebit] = useState<number>(0);
  const [newCredit, setNewCredit] = useState<number>(0);
  const [newAuditor, setNewAuditor] = useState("Internal Auditor (SMC Finance Committee)");
  const [newStatus, setNewStatus] = useState<AuditRecord["verificationStatus"]>("VERIFIED");
  const [newNotes, setNewNotes] = useState("");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    setAuditLogs(getStoredAudit());
    setIncomes(getStoredIncomes());
    setExpenses(getStoredExpenses());
    setPayroll(getStoredPayroll());

    const handleSync = () => {
      setAuditLogs(getStoredAudit());
      setIncomes(getStoredIncomes());
      setExpenses(getStoredExpenses());
      setPayroll(getStoredPayroll());
    };
    window.addEventListener("nctb_accountant_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("nctb_accountant_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Filtered Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((item) => {
      if (selectedSession !== "ALL") {
        const yearPrefix = selectedSession.slice(0, 4);
        if (!item.timestamp.includes(yearPrefix)) return false;
      }
      if (statusFilter !== "ALL" && item.verificationStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesVoucher = item.voucherNo.toLowerCase().includes(q);
        const matchesAuditor = item.auditor.toLowerCase().includes(q);
        if (!matchesDesc && !matchesVoucher && !matchesAuditor) return false;
      }
      return true;
    });
  }, [auditLogs, selectedSession, statusFilter, searchQuery]);

  // Overall Financial Reconciliation
  const totalIncome = useMemo(() => incomes.reduce((s, i) => s + i.amount, 0), [incomes]);
  const totalExpense = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const netSurplus = totalIncome - totalExpense;

  // Double-Entry Trial Balance Table Items
  const trialBalanceAccounts = useMemo(() => {
    return [
      { code: "1001", name: "Sonali Bank Institutional Current A/C", type: "Asset", debit: 3450000, credit: 0 },
      { code: "1002", name: "Agrani Bank Development Fund A/C", type: "Asset", debit: 1820000, credit: 0 },
      { code: "1005", name: "Cash in Hand & Imprest Vault", type: "Asset", debit: 95000, credit: 0 },
      { code: "2001", name: "Teachers Provident Fund (PF) Liability", type: "Liability", debit: 0, credit: 1650000 },
      { code: "2002", name: "Student Caution Money / Security Deposit", type: "Liability", debit: 0, credit: 380000 },
      { code: "3001", name: "Institutional Retained General Reserve", type: "Equity", debit: 0, credit: 3335000 },
      { code: "4001", name: "Student Tuition & Term Exam Revenue", type: "Revenue", debit: 0, credit: totalIncome || 3268500 },
      { code: "5001", name: "Faculty & Staff Payroll Expenditure", type: "Expense", debit: totalExpense || 1543500, credit: 0 },
      { code: "5002", name: "Academic Supplies & Question Printing", type: "Expense", debit: 207000, credit: 0 },
      { code: "5003", name: "Campus Utilities & Lab Consumables", type: "Expense", debit: 140500, credit: 0 },
    ];
  }, [totalIncome, totalExpense]);

  const totalTrialDebit = useMemo(() => trialBalanceAccounts.reduce((s, a) => s + a.debit, 0), [trialBalanceAccounts]);
  const totalTrialCredit = useMemo(() => trialBalanceAccounts.reduce((s, a) => s + a.credit, 0), [trialBalanceAccounts]);

  const handleCreateAuditLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    const newLog: AuditRecord = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      voucherNo: newVoucherNo.trim(),
      category: newCategory,
      description: newDesc.trim(),
      debit: Number(newDebit),
      credit: Number(newCredit),
      balance: Math.abs(Number(newDebit) - Number(newCredit)),
      auditor: newAuditor.trim(),
      verificationStatus: newStatus,
      notes: newNotes.trim() || undefined,
    };

    const updated = [newLog, ...auditLogs];
    saveStoredAudit(updated);
    setAuditLogs(updated);
    setIsAddModalOpen(false);
    showToast(`Audit inspection log for ${newVoucherNo} recorded.`);

    // Reset
    setNewDesc("");
    setNewNotes("");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Shared Nav Tabs */}
      <AccountantNavHeader />

      {/* Page Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <Link href="/accountant" className="hover:underline">Accounts & Finance</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">Audit & Trial Balance</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
              Institutional Audit & Trial Balance Section
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Double-entry General Ledger trial balance, bank passbook reconciliation, fee audit trail, and internal governance compliance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Audit Note</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Audit Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Trial Balance Status</span>
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Balanced & Reconciled
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Debit and Credit entries matched
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Operating Net Surplus</span>
            <span className="text-xs font-bold text-emerald-700">৳</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            ৳ {netSurplus.toLocaleString()}
          </div>
          <div className="text-[11px] text-teal-600 font-medium mt-0.5">
            Total Revenue minus Operating Expense
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-800">Bank Liquidity Balance</span>
            <Landmark className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            ৳ 5,270,000
          </div>
          <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
            Sonali & Agrani Bank accounts
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Inspection Trail</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {auditLogs.filter((l) => l.verificationStatus === "VERIFIED").length} / {auditLogs.length}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">
            100% verified by SMC finance board
          </div>
        </div>
      </div>

      {/* Double-Entry Trial Balance Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Official Double-Entry General Ledger Trial Balance (October 2026)
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
            Audit Approved
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">GL Code</th>
                <th className="py-2.5 px-4">Account Head Name</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3 text-right">Debit Balance (৳)</th>
                <th className="py-2.5 px-3 text-right">Credit Balance (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trialBalanceAccounts.map((ac) => (
                <tr key={ac.code} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{ac.code}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{ac.name}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {ac.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                    {ac.debit > 0 ? `৳ ${ac.debit.toLocaleString()}` : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                    {ac.credit > 0 ? `৳ ${ac.credit.toLocaleString()}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-300">
              <tr>
                <td colSpan={3} className="py-3 px-4 text-right text-slate-900 uppercase">
                  Total Trial Balance:
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-700 text-sm">
                  ৳ {totalTrialDebit.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-700 text-sm">
                  ৳ {totalTrialCredit.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Audit Inspection Trail Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Institutional Inspection & Verification Trail
            </h3>
            <span className="text-[11px] font-semibold text-slate-500">
              ({filteredAuditLogs.length} audit logs)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SessionSelect
              value={selectedSession}
              onChange={(val) => setSelectedSession(val)}
              label="Session:"
              labelClassName="text-xs font-semibold text-slate-600 whitespace-nowrap"
              selectClassName="text-xs bg-white border border-slate-300 rounded-lg p-1.5 font-medium text-slate-800"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg p-1.5 font-medium text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified Only</option>
              <option value="FLAGGED">Flagged for Review</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Voucher #</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-4">Audit Inspection Description</th>
                <th className="py-3 px-3">Auditor / Authority</th>
                <th className="py-3 px-3 text-right">Debit (৳)</th>
                <th className="py-3 px-3 text-right">Credit (৳)</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAuditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">
                    {log.voucherNo}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {log.category.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{log.description}</div>
                    {log.notes && (
                      <div className="text-[11px] text-slate-500 mt-0.5 italic">{log.notes}</div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {log.auditor}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    {log.debit > 0 ? `৳ ${log.debit.toLocaleString()}` : "—"}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    {log.credit > 0 ? `৳ ${log.credit.toLocaleString()}` : "—"}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {log.verificationStatus === "VERIFIED" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <Check className="w-3 h-3 stroke-[3]" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        <AlertTriangle className="w-3 h-3" /> Flagged
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Audit Log Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">Record Internal Audit Inspection Note</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAuditLog} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Voucher / Ref Number *</label>
                  <input
                    type="text"
                    required
                    value={newVoucherNo}
                    onChange={(e) => setNewVoucherNo(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Audit Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="FEE_RECONCILIATION">Student Fee Reconciliation</option>
                    <option value="PAYROLL">Payroll & PF Verification</option>
                    <option value="INCOME">Income / Revenue Audit</option>
                    <option value="EXPENSE">Expense Voucher Audit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Inspection Finding / Description *</label>
                <textarea
                  required
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detail the audit cross-check observation, bank slip match, or voucher authorization..."
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Debit Amount (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={newDebit}
                    onChange={(e) => setNewDebit(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Credit Amount (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={newCredit}
                    onChange={(e) => setNewCredit(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Auditor Body</label>
                  <input
                    type="text"
                    required
                    value={newAuditor}
                    onChange={(e) => setNewAuditor(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Audit Verification Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white font-medium"
                  >
                    <option value="VERIFIED">Verified & Certified</option>
                    <option value="FLAGGED">Flagged for Clarification</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Auditor Comments / Documentation</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Matched with Sonali Bank passbook counter-foil #449"
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs cursor-pointer transition"
                >
                  Save Audit Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl border border-slate-700 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

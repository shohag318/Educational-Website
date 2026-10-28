"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  Users,
  ShieldCheck,
  ArrowRight,
  Download,
  Calendar,
  Building,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  Receipt,
  Scale,
} from "lucide-react";
import { AccountantNavHeader } from "./AccountantNavHeader";
import {
  getStoredIncomes,
  getStoredExpenses,
  getStoredPayroll,
  getStoredAudit,
} from "./accountantStore";

export default function AccountantPage() {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    setIncomes(getStoredIncomes());
    setExpenses(getStoredExpenses());
    setPayroll(getStoredPayroll());
    setAuditLogs(getStoredAudit());

    const handleSync = () => {
      setIncomes(getStoredIncomes());
      setExpenses(getStoredExpenses());
      setPayroll(getStoredPayroll());
      setAuditLogs(getStoredAudit());
    };
    window.addEventListener("nctb_accountant_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("nctb_accountant_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Aggregated totals
  const totalIncome = useMemo(() => incomes.reduce((s, i) => s + i.amount, 0), [incomes]);
  const totalExpense = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const netSurplus = totalIncome - totalExpense;
  const totalPayroll = useMemo(() => payroll.reduce((s, p) => s + p.netPayable, 0), [payroll]);
  const paidPayrollCount = useMemo(() => payroll.filter((p) => p.status === "PAID").length, [payroll]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Shared Module Nav Tabs */}
      <AccountantNavHeader />

      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">Accounts & Finance</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Landmark className="w-6 h-6 text-emerald-600" />
              Accounts & Finance
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Financial ledger, income receipts, expenditures, payroll, and trial balance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/fees"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
            >
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Student Fee Ledger</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Income</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2 font-mono">
            ৳ {totalIncome.toLocaleString()}
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-emerald-700 font-medium mt-1">
            <span>{incomes.length} Verified revenue receipts</span>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Operating Expense</span>
            <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-2 font-mono">
            ৳ {totalExpense.toLocaleString()}
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-rose-700 font-medium mt-1">
            <span>{expenses.length} Approved payment vouchers</span>
          </div>
        </div>

        {/* Operating Net Surplus */}
        <div className="bg-white p-5 rounded-xl border border-teal-200 bg-teal-50/20 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Net Operating Surplus</span>
            <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-teal-700 mt-2 font-mono">
            ৳ {netSurplus.toLocaleString()}
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-teal-700 font-medium mt-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500"></span>
            <span>Audited & Reconciled positive balance</span>
          </div>
        </div>

        {/* Bank Liquidity */}
        <div className="bg-white p-5 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Bank Balance</span>
            <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-indigo-700 mt-2 font-mono">
            ৳ 5,270,000
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-indigo-700 font-medium mt-1">
            <span>Sonali Bank & Agrani Bank main A/C</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          4 CORE ACCOUNTING MODULES CARDS (DIRECT ACCESS)
         ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-emerald-600" />
            Accountant Core Functional Sections
          </h2>
          <span className="text-[11px] text-slate-400">
            Click any section to manage vouchers, rosters, and audit trails
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Income Card */}
          <Link
            href="/accountant/income"
            className="p-5 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition">
                Institutional Income
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Manage student tuition fees, session collections, exam fees, donations, and bank interest vouchers.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-semibold text-emerald-700">
              <span>৳ {totalIncome.toLocaleString()}</span>
              <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition">
                <span>View Income</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* Expense Card */}
          <Link
            href="/accountant/expense"
            className="p-5 rounded-xl border border-slate-200 bg-white hover:border-rose-400 hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <TrendingDown className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-rose-700 transition">
                Operating Expense
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Exam paper printing, power & utilities, laboratory supplies, ICT broadband, and campus upkeep.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-semibold text-rose-700">
              <span>৳ {totalExpense.toLocaleString()}</span>
              <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition">
                <span>View Expense</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* Payroll Card */}
          <Link
            href="/accountant/payroll"
            className="p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-700 transition">
                Teacher & Staff Payroll
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Faculty scale grades, allowances, Provident Fund (PF) deductions, automated bank disbursement, and pay slips.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-semibold text-indigo-700">
              <span>{paidPayrollCount}/{payroll.length} Disbursed</span>
              <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition">
                <span>View Payroll</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* Audit Card */}
          <Link
            href="/accountant/audit"
            className="p-5 rounded-xl border border-slate-200 bg-white hover:border-amber-400 hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition">
                Audit & Trial Balance
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Double-entry General Ledger trial balance, bank passbook reconciliation, and certified compliance notes.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-semibold text-amber-700">
              <span>Balanced (Trial)</span>
              <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition">
                <span>View Audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Ledger Vouchers Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Recent Institutional Vouchers (Income & Expense)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Live verified entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Voucher #</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-4">Particulars</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Payment Channel</th>
                <th className="py-2.5 px-3 text-right">Amount (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incomes.slice(0, 3).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{item.voucherNo}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{item.date}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{item.title}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Income / Credit
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{item.paymentMethod}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                    +৳ {item.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {expenses.slice(0, 3).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{item.voucherNo}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{item.date}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{item.title}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      Expense / Debit
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{item.paymentMethod}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                    -৳ {item.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

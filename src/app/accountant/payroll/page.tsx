"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  Trash2,
  X,
  CreditCard,
  Building,
  Printer,
  DollarSign,
  Clock,
  ShieldCheck,
  Check,
  Download,
  AlertCircle,
} from "lucide-react";
import { AccountantNavHeader } from "../AccountantNavHeader";
import {
  PayrollRecord,
  getStoredPayroll,
  saveStoredPayroll,
} from "../accountantStore";
import { SessionSelect } from "@/components/SessionSelect";

export default function TeacherStaffPayrollPage() {
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Pay Slip Modal State
  const [selectedPaySlipRecord, setSelectedPaySlipRecord] = useState<PayrollRecord | null>(null);

  // Add Employee Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesignation, setNewDesignation] = useState("");
  const [newDepartment, setNewDepartment] = useState<PayrollRecord["department"]>("ACADEMIC");
  const [newGrade, setNewGrade] = useState("Grade 9 (Senior Teacher)");
  const [newBasic, setNewBasic] = useState<number>(42000);
  const [newBankAc, setNewBankAc] = useState("");
  const [newMethod, setNewMethod] = useState("Sonali Bank EFT");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    setPayroll(getStoredPayroll());

    const handleSync = () => {
      setPayroll(getStoredPayroll());
    };
    window.addEventListener("nctb_accountant_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("nctb_accountant_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Filtered Payroll
  const filteredPayroll = useMemo(() => {
    return payroll.filter((item) => {
      if (selectedSession !== "ALL") {
        const yearPrefix = selectedSession.slice(0, 4);
        if (!item.month.includes(yearPrefix) && !(item.paymentDate && item.paymentDate.includes(yearPrefix))) return false;
      }
      if (deptFilter !== "ALL" && item.department !== deptFilter) return false;
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesId = item.empId.toLowerCase().includes(q);
        const matchesDesig = item.designation.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesDesig) return false;
      }
      return true;
    });
  }, [payroll, selectedSession, deptFilter, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const totalStaff = payroll.length;
    const totalGrossPayroll = payroll.reduce((sum, item) => sum + item.netPayable, 0);
    const paidStaffCount = payroll.filter((item) => item.status === "PAID").length;
    const pendingStaffCount = payroll.filter((item) => item.status === "PENDING").length;
    const totalPF = payroll.reduce((sum, item) => sum + item.providentFundDeduction, 0);

    return {
      totalStaff,
      totalGrossPayroll,
      paidStaffCount,
      pendingStaffCount,
      totalPF,
    };
  }, [payroll]);

  // Disburse Single
  const handleToggleDisbursement = (id: string) => {
    const today = new Date().toISOString().split("T")[0];
    const updated = payroll.map((item) => {
      if (item.id === id) {
        const newStatus = item.status === "PAID" ? "PENDING" : "PAID";
        return {
          ...item,
          status: newStatus as any,
          paymentDate: newStatus === "PAID" ? today : undefined,
        };
      }
      return item;
    });
    saveStoredPayroll(updated);
    setPayroll(updated);
    showToast("Payroll disbursement status updated.");
  };

  // Disburse All Pending
  const handleDisburseAll = () => {
    const today = new Date().toISOString().split("T")[0];
    const updated = payroll.map((item) => ({
      ...item,
      status: "PAID" as const,
      paymentDate: item.paymentDate || today,
    }));
    saveStoredPayroll(updated);
    setPayroll(updated);
    showToast("All faculty and staff salaries disbursed for October 2026!");
  };

  // Create Employee
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDesignation.trim() || newBasic <= 0) return;

    const empId = `EMP-${100 + payroll.length + 1}`;
    const houseRent = Math.round(newBasic * 0.4);
    const medicalAllowance = 1500;
    const conveyance = 1500;
    const pf = Math.round(newBasic * 0.1);
    const welfare = 500;
    const net = newBasic + houseRent + medicalAllowance + conveyance - (pf + welfare);

    const newEmp: PayrollRecord = {
      id: `pay_${Date.now()}`,
      empId,
      name: newName.trim(),
      designation: newDesignation.trim(),
      department: newDepartment,
      scaleGrade: newGrade,
      basicSalary: newBasic,
      houseRent,
      medicalAllowance,
      conveyance,
      providentFundDeduction: pf,
      welfareFundDeduction: welfare,
      netPayable: net,
      month: "October 2026",
      status: "PENDING",
      paymentMethod: newMethod,
      bankAccountNo: newBankAc.trim() || "N/A",
    };

    const updated = [...payroll, newEmp];
    saveStoredPayroll(updated);
    setPayroll(updated);
    setIsAddModalOpen(false);
    showToast(`Faculty member ${newName} added to payroll roster!`);

    // Reset
    setNewName("");
    setNewDesignation("");
    setNewBankAc("");
  };

  // Delete
  const handleDeleteEmployee = (id: string, name: string) => {
    if (!confirm(`Remove ${name} from payroll roster?`)) return;
    const updated = payroll.filter((item) => item.id !== id);
    saveStoredPayroll(updated);
    setPayroll(updated);
    showToast(`Removed from payroll.`);
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
          <span className="text-slate-800 font-medium">Teacher & Staff Payroll</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" />
              Teacher & Staff Payroll Section
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Monthly faculty salary structure, government scale grades, allowances, Provident Fund (PF) deductions, automated electronic disbursement, and official pay slip issuance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff to Payroll</span>
            </button>
            <button
              onClick={handleDisburseAll}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg shadow-sm transition cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-700" />
              <span>Disburse All Salaries</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Staff Headcount</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalStaff}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Faculty, admin & lab personnel</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-800">Monthly Net Payroll</span>
            <span className="text-xs font-bold text-indigo-600">৳</span>
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            ৳ {stats.totalGrossPayroll.toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
            Total monthly net salary budget
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Salaries Disbursed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {stats.paidStaffCount} / {stats.totalStaff}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            {stats.pendingStaffCount > 0 ? `${stats.pendingStaffCount} pending transfer` : "100% October Salaries Paid"}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Provident Fund (PF)</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            ৳ {stats.totalPF.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">
            10% statutory employee savings
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Filter Faculty & Staff Roster:
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedSession("ALL");
              setDeptFilter("ALL");
              setStatusFilter("ALL");
              setSearchQuery("");
            }}
            className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold flex items-center space-x-1 underline cursor-pointer"
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
              selectClassName="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            >
              <option value="ALL">All Departments</option>
              <option value="ACADEMIC">Academic Teaching Faculty</option>
              <option value="ADMINISTRATION">Administrative Staff</option>
              <option value="SUPPORT_STAFF">Laboratory & Support Staff</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Salary Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Disbursed (Paid)</option>
              <option value="PENDING">Pending Payment</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Search Staff / Designation</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, EMP ID, Subject..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Monthly Salary & Payroll Roster (October 2026)
            </h3>
            <span className="text-[11px] font-semibold text-slate-500">
              ({filteredPayroll.length} employees)
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Net Outflow: <strong className="font-mono text-indigo-700">৳ {filteredPayroll.reduce((s, i) => s + i.netPayable, 0).toLocaleString()}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Emp ID</th>
                <th className="py-3 px-4">Employee Name & Designation</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Grade Scale</th>
                <th className="py-3 px-3 text-right">Basic (৳)</th>
                <th className="py-3 px-3 text-right">Allowances</th>
                <th className="py-3 px-3 text-right">PF & Deduct.</th>
                <th className="py-3 px-3 text-right">Net Payable</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayroll.map((item) => {
                const totalAllowances = item.houseRent + item.medicalAllowance + item.conveyance;
                const totalDeductions = item.providentFundDeduction + item.welfareFundDeduction;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {item.empId}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500">{item.designation}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {item.department}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-[11px] text-slate-600 font-medium">
                      {item.scaleGrade}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-700 font-medium">
                      ৳ {item.basicSalary.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-emerald-600 font-medium" title={`House: ৳${item.houseRent}, Med: ৳${item.medicalAllowance}, Conv: ৳${item.conveyance}`}>
                      +৳ {totalAllowances.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-rose-500 font-medium" title={`PF: ৳${item.providentFundDeduction}, Welfare: ৳${item.welfareFundDeduction}`}>
                      -৳ {totalDeductions.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ৳ {item.netPayable.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {item.status === "PAID" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 stroke-[3]" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleDisbursement(item.id)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                            item.status === "PAID"
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                          }`}
                        >
                          {item.status === "PAID" ? "Revert" : "Pay Now"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPaySlipRecord(item)}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
                          title="Generate Official Pay Slip"
                        >
                          <Printer className="w-3 h-3" />
                          Pay Slip
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteEmployee(item.id, item.name)}
                          className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Remove Staff"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Pay Slip Modal */}
      {selectedPaySlipRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Official Institutional Pay Slip</h3>
              </div>
              <button onClick={() => setSelectedPaySlipRecord(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pay Slip Printed Canvas */}
            <div className="border border-slate-200 p-5 rounded-xl bg-white space-y-4 text-xs font-sans">
              <div className="text-center border-b border-slate-200 pb-3">
                <span className="text-[10px] font-bold text-emerald-700 tracking-widest uppercase block">
                  GOVERNMENT APPROVED NCTB CURRICULUM SCHOOL
                </span>
                <h2 className="text-base font-extrabold text-slate-900">
                  NCTB SMART HIGH SCHOOL & COLLEGE
                </h2>
                <p className="text-[11px] text-slate-500">
                  Institutional Salary Disbursement Voucher • {selectedPaySlipRecord.month}
                </p>
              </div>

              {/* Employee Bio */}
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-500">Employee ID: </span>
                  <strong className="font-mono text-slate-900">{selectedPaySlipRecord.empId}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Department: </span>
                  <strong className="text-slate-900">{selectedPaySlipRecord.department}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Name: </span>
                  <strong className="text-slate-900">{selectedPaySlipRecord.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Scale Grade: </span>
                  <strong className="text-slate-900">{selectedPaySlipRecord.scaleGrade}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Designation: </span>
                  <strong className="text-slate-900">{selectedPaySlipRecord.designation}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Disbursement Channel: </span>
                  <span className="font-mono text-slate-700">{selectedPaySlipRecord.paymentMethod} (A/C: {selectedPaySlipRecord.bankAccountNo})</span>
                </div>
              </div>

              {/* Earnings vs Deductions Table */}
              <div className="grid grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-emerald-50 px-3 py-1.5 font-bold text-emerald-900 text-[11px] border-b border-emerald-100">
                    Gross Earnings (৳)
                  </div>
                  <div className="p-2 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Basic Salary:</span>
                      <span className="font-mono font-medium">৳ {selectedPaySlipRecord.basicSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">House Rent (40%):</span>
                      <span className="font-mono font-medium">৳ {selectedPaySlipRecord.houseRent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Medical Allowance:</span>
                      <span className="font-mono font-medium">৳ {selectedPaySlipRecord.medicalAllowance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Conveyance:</span>
                      <span className="font-mono font-medium">৳ {selectedPaySlipRecord.conveyance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 border-t border-slate-200 text-emerald-800">
                      <span>Total Earnings:</span>
                      <span className="font-mono">
                        ৳ {(selectedPaySlipRecord.basicSalary + selectedPaySlipRecord.houseRent + selectedPaySlipRecord.medicalAllowance + selectedPaySlipRecord.conveyance).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-rose-50 px-3 py-1.5 font-bold text-rose-900 text-[11px] border-b border-rose-100">
                    Statutory Deductions (৳)
                  </div>
                  <div className="p-2 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Provident Fund (10%):</span>
                      <span className="font-mono font-medium">৳ {selectedPaySlipRecord.providentFundDeduction.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Welfare Fund:</span>
                      <span className="font-mono font-medium">৳ {selectedPaySlipRecord.welfareFundDeduction.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Income Tax:</span>
                      <span className="font-mono">৳ 0</span>
                    </div>
                    <div className="flex justify-between font-bold pt-4 border-t border-slate-200 text-rose-700">
                      <span>Total Deductions:</span>
                      <span className="font-mono">
                        ৳ {(selectedPaySlipRecord.providentFundDeduction + selectedPaySlipRecord.welfareFundDeduction).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Take Home */}
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-indigo-900 block">Net Monthly Take-Home Pay</span>
                  <span className="text-[10px] text-indigo-700">Disbursed into Sonali Bank Faculty Payroll Account</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-indigo-700">
                    ৳ {selectedPaySlipRecord.netPayable.toLocaleString()}
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                    {selectedPaySlipRecord.status === "PAID" ? "DISBURSED & CREDITED" : "AUTHORIZATION PENDING"}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-2 pt-6 text-center text-[10px] text-slate-400">
                <div className="border-t border-slate-300 pt-1">Prepared by (Accounts)</div>
                <div className="border-t border-slate-300 pt-1">Bursar / Cashier</div>
                <div className="border-t border-slate-300 pt-1">Principal / Headmaster</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedPaySlipRecord(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-100 font-semibold text-slate-600 cursor-pointer text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs cursor-pointer text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Pay Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Add Faculty / Staff to Payroll Roster</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Employee Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Mohammad Jahangir Alam"
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                    placeholder="e.g. Senior Teacher (Math), Lab Assistant"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white"
                  >
                    <option value="ACADEMIC">Academic Faculty</option>
                    <option value="ADMINISTRATION">Administration</option>
                    <option value="SUPPORT_STAFF">Laboratory & Support Staff</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Scale Grade</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white"
                  >
                    <option value="Grade 6 (Principal)">Grade 6 (Principal / Headmaster)</option>
                    <option value="Grade 7 (Assistant Headmaster)">Grade 7 (Assistant Headmaster)</option>
                    <option value="Grade 9 (Senior Teacher)">Grade 9 (Senior Teacher)</option>
                    <option value="Grade 10 (Teacher)">Grade 10 (Assistant Teacher)</option>
                    <option value="Grade 14 (Clerk)">Grade 14 (Office Clerk)</option>
                    <option value="Grade 16 (Lab Staff)">Grade 16 (Lab Assistant)</option>
                    <option value="Grade 18 (Security)">Grade 18 (Security Staff)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Basic Salary (৳) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newBasic}
                    onChange={(e) => setNewBasic(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={newBankAc}
                    onChange={(e) => setNewBankAc(e.target.value)}
                    placeholder="e.g. SB-0021-99821"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white"
                  >
                    <option value="Sonali Bank EFT">Sonali Bank EFT</option>
                    <option value="Sonali Bank Cheque">Sonali Bank Cheque</option>
                    <option value="Agrani Bank EFT">Agrani Bank EFT</option>
                    <option value="Cash in Hand">Cash in Hand</option>
                  </select>
                </div>
              </div>

              {/* Breakdown preview */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs space-y-1">
                <span className="font-bold text-indigo-900 block">Automatic Package Calculation:</span>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>House Rent (40%):</span>
                  <span className="font-mono">৳ {Math.round(newBasic * 0.4).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Medical & Conveyance:</span>
                  <span className="font-mono">৳ 3,000</span>
                </div>
                <div className="flex justify-between text-rose-600 text-[11px]">
                  <span>PF (10%) & Welfare:</span>
                  <span className="font-mono">-৳ {Math.round(newBasic * 0.1 + 500).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-indigo-200 pt-1 text-indigo-900">
                  <span>Net Estimated Monthly Salary:</span>
                  <span className="font-mono font-bold">
                    ৳ {Math.max(0, newBasic + Math.round(newBasic * 0.4) + 3000 - Math.round(newBasic * 0.1 + 500)).toLocaleString()}
                  </span>
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs cursor-pointer transition"
                >
                  Save & Add to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl border border-slate-700 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

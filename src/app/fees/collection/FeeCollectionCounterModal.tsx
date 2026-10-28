"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  HandCoins,
  Banknote,
  Search,
  CheckCircle2,
  Printer,
  Calendar,
  CreditCard,
  User,
  Check,
  X,
  DollarSign,
  Maximize2,
  Minimize2,
  ExternalLink,
} from "lucide-react";
import {
  FeeCollectionVoucher,
  getStoredCollectionVouchers,
  addCollectionVoucher,
  generateNextVoucherNo,
} from "./collectionStore";
import { MoneyReceiptModal } from "./MoneyReceiptModal";
import {
  FeeCategory,
  MONTHS,
  DEFAULT_FEE_CATEGORIES,
  DEFAULT_MONTHLY_SCHEDULE,
} from "../MonthlyFeeTemplate";
import { getStoredWaivers, calculateStudentWaiver } from "../waiverStore";
import { SessionSelect } from "@/components/SessionSelect";
import { getScopedStorageKey, TENANT_SWITCH_EVENT } from "@/lib/clientTenant";

interface StudentEnrollment {
  id: string;
  studentId?: string;
  classRoll: number;
  groupType?: string;
  class?: { id: string; name: string };
  section?: { id: string; name: string };
  student?: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    fatherName?: string;
    guardianMobile?: string;
  };
}

interface FeeCollectionCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCollectionSuccess?: () => void;
}

export function FeeCollectionCounterModal({
  isOpen,
  onClose,
  onCollectionSuccess,
}: FeeCollectionCounterModalProps) {
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // Filters & Selected states
  const [selectedSession, setSelectedSession] = useState<string>("2026");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>("OCT");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Data states
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [feeCategories, setFeeCategories] = useState<FeeCategory[]>(DEFAULT_FEE_CATEGORIES);
  const [monthlySchedule, setMonthlySchedule] = useState<Record<string, string[]>>(DEFAULT_MONTHLY_SCHEDULE);
  const [feeRecords, setFeeRecords] = useState<Record<string, any>>({});
  const [waivers, setWaivers] = useState<Record<string, any>>({});
  const [vouchers, setVouchers] = useState<FeeCollectionVoucher[]>([]);

  // Selected Student
  const [selectedStudent, setSelectedStudent] = useState<StudentEnrollment | null>(null);

  // Collection Form State
  const [voucherNo, setVoucherNo] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<FeeCollectionVoucher["paymentMethod"]>("CASH");
  const [collectionDate, setCollectionDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [collectedAmount, setCollectedAmount] = useState<number>(0);
  const [fineAmount, setFineAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [cashierName, setCashierName] = useState<string>("Counter Cashier #1");
  const [remarks, setRemarks] = useState<string>("");

  // Receipt Modal State
  const [activeReceiptVoucher, setActiveReceiptVoucher] = useState<FeeCollectionVoucher | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load Data
  const loadData = () => {
    const storedVouchers = getStoredCollectionVouchers();
    setVouchers(storedVouchers);
    setWaivers(getStoredWaivers());

    try {
      const catKey = getScopedStorageKey("nctb_fee_categories_v2");
      const savedCats = localStorage.getItem(catKey);
      if (savedCats) {
        const parsed = JSON.parse(savedCats);
        if (Array.isArray(parsed) && parsed.length >= 25) {
          setFeeCategories(parsed);
        }
      }
    } catch {
      setFeeCategories(DEFAULT_FEE_CATEGORIES);
    }

    try {
      const schedKey = getScopedStorageKey("nctb_fee_template_schedule_v2");
      const savedSched = localStorage.getItem(schedKey);
      if (savedSched) {
        const parsedSched = JSON.parse(savedSched);
        if (parsedSched && typeof parsedSched === "object") {
          setMonthlySchedule(parsedSched);
        }
      }
    } catch {
      setMonthlySchedule(DEFAULT_MONTHLY_SCHEDULE);
    }

    try {
      const recKey = getScopedStorageKey("nctb_student_fee_records");
      const savedRecs = localStorage.getItem(recKey);
      if (savedRecs) {
        setFeeRecords(JSON.parse(savedRecs));
      }
    } catch {
      setFeeRecords({});
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isReceiptModalOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isReceiptModalOpen, onClose]);

  // Fetch classes
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.length > 0) {
          setClasses(data.data);
          if (!selectedClassId) {
            setSelectedClassId(data.data[0].id);
          }
        }
      })
      .catch((err) => console.error(err));
  }, [isOpen]);

  // Fetch students
  useEffect(() => {
    if (!isOpen) return;
    async function fetchStudents() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedSession) params.set("session", selectedSession);
        if (selectedClassId) params.set("classId", selectedClassId);
        if (selectedSectionId) params.set("sectionId", selectedSectionId);
        if (searchQuery.trim()) params.set("search", searchQuery.trim());

        const res = await fetch(`/api/students?${params.toString()}`);
        const data = await res.json();
        if (data.success && data.data) {
          setStudents(data.data);
          if (!selectedStudent && data.data.length > 0) {
            handleSelectStudent(data.data[0]);
          }
        } else {
          setStudents([]);
        }
      } catch (err) {
        console.error("Failed to fetch students:", err);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, [isOpen, selectedSession, selectedClassId, selectedSectionId, searchQuery]);

  // Generate next voucher no on mount or vouchers change
  useEffect(() => {
    setVoucherNo(generateNextVoucherNo(vouchers));
  }, [vouchers]);

  // Calculate Fee for a Student in current month
  const getStudentFeeCalculation = (enr: StudentEnrollment) => {
    const studentKey = enr.student?.id || enr.id;
    const roll = enr.classRoll || 1;
    const existing = feeRecords[studentKey] || feeRecords[enr.id];

    const activeCatIds = monthlySchedule[selectedMonthKey] || [];
    const applicableCategories = feeCategories.filter((cat) => {
      if (!activeCatIds.includes(cat.id)) return false;
      if (cat.groupType && cat.groupType !== "ALL" && cat.groupType !== enr.groupType) return false;
      return true;
    });

    const tuition = applicableCategories.filter((c) => c.type === "TUITION").reduce((s, c) => s + c.amount, 0);
    const exam = applicableCategories.filter((c) => c.type === "EXAM").reduce((s, c) => s + c.amount, 0);
    const labAndOthers = applicableCategories
      .filter((c) => c.type !== "TUITION" && c.type !== "EXAM")
      .reduce((s, c) => s + c.amount, 0);

    const baseGross = tuition + exam + labAndOthers;

    const rollKey = `roll_${roll}`;
    const assignedWaiver = waivers[studentKey] || waivers[enr.id] || waivers[rollKey];
    const waiverResult = calculateStudentWaiver(assignedWaiver, tuition, exam + labAndOthers, roll);
    const waiverAmount = waiverResult.waiverAmount;

    const netPayable = Math.max(0, baseGross - waiverAmount);
    const paidAmount = existing?.paidAmount !== undefined ? existing.paidAmount : (roll % 4 === 0 ? 0 : netPayable);
    const dueAmount = Math.max(0, netPayable - paidAmount);

    return {
      applicableCategories,
      tuition,
      exam,
      labAndOthers,
      baseGross,
      waiverAmount,
      netPayable,
      paidAmount,
      dueAmount,
      isCleared: dueAmount === 0,
    };
  };

  // Select student handler
  const handleSelectStudent = (enr: StudentEnrollment) => {
    setSelectedStudent(enr);
    const fee = getStudentFeeCalculation(enr);
    const studentKey = enr.student?.id || enr.id;
    const existing = feeRecords[studentKey] || feeRecords[enr.id];
    setCollectedAmount(fee.dueAmount > 0 ? fee.dueAmount : fee.netPayable);
    setFineAmount(existing?.absentFineAmount || existing?.fineAmount || 0);
    setDiscountAmount(0);
    setTransactionRef(
      paymentMethod === "CASH"
        ? `CASH-REC-${Math.floor(1000 + Math.random() * 9000)}`
        : `TRX${Date.now().toString().slice(-8)}`
    );
    setRemarks(
      `Fee collection for ${MONTHS.find((m) => m.key === selectedMonthKey)?.name || selectedMonthKey} ${selectedSession}`
    );
  };

  // Process Collection
  const handleProcessCollection = (shouldPrint: boolean) => {
    if (!selectedStudent) {
      alert("Please select a student first.");
      return;
    }

    const fee = getStudentFeeCalculation(selectedStudent);
    const studentKey = selectedStudent.student?.id || selectedStudent.id;
    const finalNet = Number(collectedAmount) + Number(fineAmount) - Number(discountAmount);

    if (finalNet <= 0) {
      alert("Please enter a valid collection amount greater than 0.");
      return;
    }

    const studentFullName = selectedStudent.student
      ? `${selectedStudent.student.firstName} ${selectedStudent.student.lastName || ""}`.trim()
      : `Student Roll ${selectedStudent.classRoll}`;

    const newVoucher: FeeCollectionVoucher = {
      id: `vouch_${Date.now()}`,
      voucherNo: voucherNo || generateNextVoucherNo(vouchers),
      studentId: studentKey,
      studentName: studentFullName,
      studentRoll: selectedStudent.classRoll,
      className: selectedStudent.class?.name || "Class 11",
      sectionName: selectedStudent.section?.name || "Section A",
      groupType: selectedStudent.groupType || "SCIENCE",
      session: selectedSession,
      monthKey: selectedMonthKey,
      collectionDate: collectionDate,
      paymentMethod: paymentMethod,
      transactionRef: transactionRef || undefined,
      feeItems: fee.applicableCategories.map((c) => ({
        categoryId: c.id,
        categoryName: c.name,
        amount: c.amount,
      })),
      grossAmount: fee.baseGross,
      waiverDiscount: fee.waiverAmount,
      fineAmount: Number(fineAmount) || 0,
      netPaidAmount: finalNet,
      previousPaid: fee.paidAmount,
      currentDueRemaining: Math.max(0, fee.dueAmount - finalNet),
      cashierName: cashierName || "Counter #1",
      remarks: remarks || undefined,
      createdAt: new Date().toISOString(),
    };

    // 1. Save voucher to collection store
    addCollectionVoucher(newVoucher);
    const updatedVouchers = [newVoucher, ...vouchers];
    setVouchers(updatedVouchers);

    // 2. Synchronize student fee record into localStorage
    const currentPaid = fee.paidAmount;
    const newTotalPaid = currentPaid + finalNet;
    const isCleared = newTotalPaid >= fee.netPayable;

    const updatedRecord = {
      tuitionFee: fee.tuition,
      examFee: fee.exam,
      labSessionFee: fee.labAndOthers,
      waiverAmount: fee.waiverAmount,
      paidAmount: newTotalPaid,
      lastPaymentMethod: paymentMethod,
      lastTransactionId: newVoucher.voucherNo,
      lastPaymentDate: collectionDate,
      isExamCleared: isCleared,
    };

    const nextRecords = {
      ...feeRecords,
      [studentKey]: updatedRecord,
      [selectedStudent.id]: updatedRecord,
    };
    setFeeRecords(nextRecords);

    try {
      const recKey = getScopedStorageKey("nctb_student_fee_records");
      localStorage.setItem(recKey, JSON.stringify(nextRecords));
    } catch (e) {
      console.error("Failed to sync student fee record", e);
    }

    // 3. Notify app components (e.g. Ledger)
    window.dispatchEvent(new Event(TENANT_SWITCH_EVENT));
    if (onCollectionSuccess) {
      onCollectionSuccess();
    }

    // 4. Success Toast
    setToastMessage(
      `Successfully collected ৳${finalNet.toLocaleString()} for ${studentFullName} (Voucher #${newVoucher.voucherNo})!`
    );
    setTimeout(() => setToastMessage(null), 4000);

    // 5. Open Print Receipt Modal if requested
    if (shouldPrint) {
      setActiveReceiptVoucher(newVoucher);
      setIsReceiptModalOpen(true);
    }

    setVoucherNo(generateNextVoucherNo(updatedVouchers));
  };

  // Open standalone browser window
  const handleOpenStandaloneWindow = () => {
    window.open(
      "/fees/collection",
      "FeeCollectionCounterWindow",
      "width=1280,height=820,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes"
    );
  };

  // Today's stats
  const todayStr = new Date().toISOString().split("T")[0];
  const todayVouchers = useMemo(() => {
    return vouchers.filter((v) => v.collectionDate === todayStr);
  }, [vouchers, todayStr]);

  const totalCollectedToday = useMemo(() => {
    return todayVouchers.reduce((s, v) => s + v.netPaidAmount, 0);
  }, [todayVouchers]);

  const cashToday = useMemo(() => {
    return todayVouchers.filter((v) => v.paymentMethod === "CASH").reduce((s, v) => s + v.netPaidAmount, 0);
  }, [todayVouchers]);

  const digitalToday = useMemo(() => {
    return todayVouchers.filter((v) => v.paymentMethod !== "CASH").reduce((s, v) => s + v.netPaidAmount, 0);
  }, [todayVouchers]);

  const selectedStudentFee = selectedStudent ? getStudentFeeCalculation(selectedStudent) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[130] bg-emerald-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 border border-emerald-500 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Window Container */}
      <div
        className={`bg-slate-50 flex flex-col shadow-2xl border border-slate-300 transition-all duration-200 overflow-hidden ${
          isMaximized
            ? "fixed inset-0 w-full h-full rounded-none"
            : "w-full max-w-6xl max-h-[92vh] rounded-2xl"
        }`}
      >
        {/* ========================================================
            WINDOW TITLE BAR (Desktop Window Style)
           ======================================================== */}
        <div className="bg-gradient-to-r from-emerald-850 via-teal-900 to-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-emerald-700/50 select-none shrink-0">
          {/* Left: Window identity */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
              <HandCoins className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                  Fee Collection Counter Desk
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Counter
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block">
                Direct student fee cash &amp; digital collection with live receipt voucher issuance
              </p>
            </div>
          </div>

          {/* Right: Window Controls */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Open in Standalone OS Window */}
            <button
              type="button"
              onClick={handleOpenStandaloneWindow}
              title="Open in Standalone Browser Window"
              className="flex items-center gap-1 px-2.5 py-1 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Separate Window</span>
            </button>

            {/* Maximize / Restore Toggle */}
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? "Restore Window" : "Maximize Window"}
              className="p-1.5 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              title="Close Counter Window (Esc)"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-rose-600 rounded-lg transition cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================
            SUB-HEADER: QUICK COUNTER METRICS RIBBON
           ======================================================== */}
        <div className="bg-white border-b border-slate-200 px-4 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0">
          <div className="flex items-center space-x-2 border-r border-slate-100 pr-2">
            <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Today's Total</span>
              <span className="font-mono font-bold text-slate-900 text-sm">৳{totalCollectedToday.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 border-r border-slate-100 pr-2">
            <Banknote className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Cash Drawer</span>
              <span className="font-mono font-bold text-amber-700 text-sm">৳{cashToday.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 border-r border-slate-100 pr-2">
            <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">MFS &amp; Bank</span>
              <span className="font-mono font-bold text-indigo-700 text-sm">৳{digitalToday.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Cycle Month</span>
              <span className="font-bold text-slate-800 text-xs truncate block">
                {MONTHS.find((m) => m.key === selectedMonthKey)?.name} {selectedSession}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================
            WINDOW BODY (SCROLLABLE 2-COLUMN COLLECTION DESK)
           ======================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT COLUMN (5 COLS): STUDENT FINDER & SELECTOR */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                      1. Find &amp; Select Student
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {students.length} Students
                  </span>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Session</label>
                    <SessionSelect
                      value={selectedSession}
                      onChange={setSelectedSession}
                      className="w-full text-xs font-semibold py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Billing Month</label>
                    <select
                      value={selectedMonthKey}
                      onChange={(e) => setSelectedMonthKey(e.target.value)}
                      className="w-full text-xs font-bold py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                    >
                      {MONTHS.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Class</label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full text-xs font-medium py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Fast Search (Roll/Name)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Roll, Name..."
                        className="w-full text-xs py-1.5 pl-2 pr-6 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-emerald-500"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-1.5 top-2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scrollable Students List */}
                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                  {loading ? (
                    <div className="py-12 text-center text-xs text-slate-400 italic">
                      Loading students registry...
                    </div>
                  ) : students.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 italic">
                      No students found matching current filters.
                    </div>
                  ) : (
                    students.map((enr) => {
                      const isSelected = selectedStudent?.id === enr.id;
                      const fee = getStudentFeeCalculation(enr);
                      const studentName = enr.student
                        ? `${enr.student.firstName} ${enr.student.lastName || ""}`.trim()
                        : `Student ${enr.classRoll}`;

                      return (
                        <div
                          key={enr.id}
                          onClick={() => handleSelectStudent(enr)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-400 shadow-xs ring-1 ring-emerald-400"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                                isSelected
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {enr.classRoll}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs text-slate-900 truncate">
                                {studentName}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center space-x-1.5">
                                <span>Roll: {enr.classRoll}</span>
                                <span>•</span>
                                <span>{enr.class?.name || "Class 11"}</span>
                                {enr.groupType && enr.groupType !== "ALL" && (
                                  <>
                                    <span>•</span>
                                    <span className="font-semibold text-amber-700">{enr.groupType}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono font-bold text-xs">
                              {fee.dueAmount > 0 ? (
                                <span className="text-rose-600">Due: ৳{fee.dueAmount.toLocaleString()}</span>
                              ) : (
                                <span className="text-emerald-700 font-semibold flex items-center gap-0.5 justify-end">
                                  <Check className="w-3 h-3" /> Cleared
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Tot: ৳{fee.netPayable.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (7 COLS): COLLECTION DESK & RECEIPT FORM */}
            <div className="lg:col-span-7 space-y-4">
              {selectedStudent ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                  {/* Card Header: Student Identity */}
                  <div className="p-3.5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center font-mono font-extrabold text-emerald-300 text-sm shrink-0">
                        {selectedStudent.classRoll}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white flex items-center gap-2">
                          {selectedStudent.student
                            ? `${selectedStudent.student.firstName} ${selectedStudent.student.lastName || ""}`.trim()
                            : `Student Roll ${selectedStudent.classRoll}`}
                          <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.2 rounded border border-emerald-400/30">
                            {selectedStudent.class?.name || "Class 11"} • {selectedStudent.section?.name || "Sec A"}
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          ID: {selectedStudent.student?.studentId || `STU-${selectedStudent.classRoll}`} • Group: {selectedStudent.groupType || "SCIENCE"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Cycle Month</span>
                      <span className="font-bold text-emerald-400 text-xs">
                        {MONTHS.find((m) => m.key === selectedMonthKey)?.name} {selectedSession}
                      </span>
                    </div>
                  </div>

                  {/* Fee Breakdown Checklist */}
                  <div className="p-4 space-y-3.5 text-xs">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1.5 flex items-center justify-between">
                        <span>Applicable Fee Schedule Breakdown</span>
                        <span className="text-slate-500 text-[11px] font-normal">
                          {selectedStudentFee?.applicableCategories.length || 0} active heads
                        </span>
                      </h4>

                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                            <tr>
                              <th className="py-1.5 px-3">Fee Category</th>
                              <th className="py-1.5 px-2">Type</th>
                              <th className="py-1.5 px-3 text-right">Standard Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {selectedStudentFee?.applicableCategories.map((cat) => (
                              <tr key={cat.id} className="hover:bg-white">
                                <td className="py-1.5 px-3 text-slate-900 font-semibold">{cat.name}</td>
                                <td className="py-1.5 px-2 text-[10px] text-slate-500 uppercase">{cat.type}</td>
                                <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-800">
                                  ৳{cat.amount.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-100 font-bold border-t border-slate-200">
                            <tr>
                              <td colSpan={2} className="py-1.5 px-3 text-slate-600">Gross Monthly Total:</td>
                              <td className="py-1.5 px-3 text-right font-mono text-slate-900">
                                ৳{selectedStudentFee?.baseGross.toLocaleString()}
                              </td>
                            </tr>
                            {selectedStudentFee && selectedStudentFee.waiverAmount > 0 && (
                              <tr className="text-amber-800">
                                <td colSpan={2} className="py-1 px-3 text-amber-700">Waiver / Scholarship Deduction:</td>
                                <td className="py-1 px-3 text-right font-mono text-amber-700">
                                  - ৳{selectedStudentFee.waiverAmount.toLocaleString()}
                                </td>
                              </tr>
                            )}
                            <tr className="bg-emerald-50/70 text-emerald-950 font-extrabold">
                              <td colSpan={2} className="py-1.5 px-3 text-emerald-900">Net Due Payable:</td>
                              <td className="py-1.5 px-3 text-right font-mono text-sm text-emerald-900">
                                ৳{selectedStudentFee?.dueAmount.toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Payment Entry Form */}
                    <div className="pt-2 border-t border-slate-200 space-y-2.5">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span>2. Receive Payment Details</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            Receipt / Voucher No. *
                          </label>
                          <input
                            type="text"
                            required
                            value={voucherNo}
                            onChange={(e) => setVoucherNo(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            Payment Mode *
                          </label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="CASH">Cash (Counter)</option>
                            <option value="BKASH">bKash (MFS)</option>
                            <option value="NAGAD">Nagad (MFS)</option>
                            <option value="ROCKET">Rocket (MFS)</option>
                            <option value="BANK_DEPOSIT">Bank Deposit / Slip</option>
                            <option value="POS_CARD">POS / Debit Card</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            Collection Date *
                          </label>
                          <input
                            type="date"
                            value={collectionDate}
                            onChange={(e) => setCollectionDate(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            Collected Amount (৳) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-slate-400 font-bold">৳</span>
                            <input
                              type="number"
                              min={1}
                              required
                              value={collectedAmount}
                              onChange={(e) => setCollectedAmount(Number(e.target.value))}
                              className="w-full pl-6 pr-2 py-2 bg-white border border-slate-300 rounded-lg font-mono font-extrabold text-sm text-slate-950 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            Fine / Late Fee (৳)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={fineAmount}
                            onChange={(e) => setFineAmount(Number(e.target.value))}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-rose-700 text-xs focus:ring-2 focus:ring-emerald-500"
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            Special Discount (৳)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={discountAmount}
                            onChange={(e) => setDiscountAmount(Number(e.target.value))}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-amber-700 text-xs focus:ring-2 focus:ring-emerald-500"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            Transaction / Counter Ref
                          </label>
                          <input
                            type="text"
                            value={transactionRef}
                            onChange={(e) => setTransactionRef(e.target.value)}
                            placeholder="e.g. CASH-COUNTER-01 or TrxID"
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            Cashier / Receiver Name
                          </label>
                          <input
                            type="text"
                            value={cashierName}
                            onChange={(e) => setCashierName(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs"
                          />
                        </div>
                      </div>

                      {/* Summary Bar & Action Buttons */}
                      <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                        <div>
                          <span className="text-[11px] text-slate-600 block">Net Collected Amount:</span>
                          <strong className="font-mono text-xl font-black text-emerald-900">
                            ৳{(Number(collectedAmount) + Number(fineAmount) - Number(discountAmount)).toLocaleString()}
                          </strong>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleProcessCollection(false)}
                            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer"
                          >
                            Quick Save (No Print)
                          </button>

                          <button
                            type="button"
                            onClick={() => handleProcessCollection(true)}
                            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition shadow-xs cursor-pointer active:scale-95"
                          >
                            <Printer className="w-4 h-4" />
                            <span>Collect &amp; Print Receipt</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
                  <User className="w-10 h-10 mx-auto text-slate-300" />
                  <h3 className="font-bold text-slate-700 text-sm">No Student Selected</h3>
                  <p className="text-xs">
                    Please select a student from the left panel to open the fee collection desk.
                  </p>
                </div>
              )}
            </div>
          </div>
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

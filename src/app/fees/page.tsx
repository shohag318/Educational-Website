"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Receipt,
  DollarSign,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Download,
  Plus,
  Filter,
  RotateCcw,
  Search,
  Printer,
  X,
  FileSpreadsheet,
  Check,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  Wallet,
  Phone,
  Layers,
  Settings2,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  MonthlyFeeTemplate,
  FeeCategory,
  MONTHS,
  DEFAULT_FEE_CATEGORIES,
  DEFAULT_MONTHLY_SCHEDULE,
} from "./MonthlyFeeTemplate";
import { FeeNavHeader } from "./FeeNavHeader";
import {
  StudentWaiver,
  getStoredWaivers,
  calculateStudentWaiver,
} from "./waiverStore";
import { SessionSelect } from "@/components/SessionSelect";
import { getScopedStorageKey, getActiveTenantCode, TENANT_SWITCH_EVENT } from "@/lib/clientTenant";

interface FeeRecord {
  tuitionFee: number;
  examFee: number;
  labSessionFee: number;
  waiverAmount: number;
  waiverTitle?: string;
  waiverPercentage?: number;
  isSpecialScholarship?: boolean;
  hasManualWaiver?: boolean;
  paidAmount: number;
  lastPaymentMethod?: string;
  lastTransactionId?: string;
  lastPaymentDate?: string;
  isExamCleared?: boolean;
}

export default function StudentFeeModulePage() {
  // Filter States (matching exact specification)
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Students & Loading
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fee Data Store (persisted locally)
  const [feeRecords, setFeeRecords] = useState<Record<string, FeeRecord>>({});

  // Payment Modal State
  const [paymentModalStudent, setPaymentModalStudent] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("bKash");
  const [paymentTrxId, setPaymentTrxId] = useState<string>("");
  const [paymentNote, setPaymentNote] = useState<string>("");

  // Receipt Modal State
  const [receiptModalStudent, setReceiptModalStudent] = useState<any | null>(null);

  // Success Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Monthly Fee Category Template State
  const [feeCategories, setFeeCategories] = useState<FeeCategory[]>(DEFAULT_FEE_CATEGORIES);
  const [monthlySchedule, setMonthlySchedule] = useState<Record<string, string[]>>(DEFAULT_MONTHLY_SCHEDULE);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>("OCT");
  const [isFeeSetupModalOpen, setIsFeeSetupModalOpen] = useState(false);

  // Scholarship & Waiver Store
  const [waivers, setWaivers] = useState<Record<string, StudentWaiver>>({});

  // Helper to load tenant-scoped fee records, templates & schedule
  const loadTenantFeeData = (instCode?: string) => {
    const code = instCode || getActiveTenantCode();
    try {
      const recKey = getScopedStorageKey("nctb_fee_records_v1", code);
      const catKey = getScopedStorageKey("nctb_fee_categories_v2", code);
      const schedKey = getScopedStorageKey("nctb_fee_template_schedule_v2", code);
      const monthKey = getScopedStorageKey("nctb_fee_selected_month_v2", code);

      const stored = localStorage.getItem(recKey) || (code === "108254" ? localStorage.getItem("nctb_fee_records_v1") : null);
      if (stored) {
        setFeeRecords(JSON.parse(stored));
      } else {
        setFeeRecords({});
      }

      const savedCats = localStorage.getItem(catKey) || (code === "108254" ? localStorage.getItem("nctb_fee_categories_v2") : null);
      if (savedCats) {
        try {
          const parsed = JSON.parse(savedCats);
          if (Array.isArray(parsed) && parsed.length >= 25) {
            setFeeCategories(parsed);
          } else {
            // Seed full 31 standard categories
            setFeeCategories(DEFAULT_FEE_CATEGORIES);
            localStorage.setItem(catKey, JSON.stringify(DEFAULT_FEE_CATEGORIES));
          }
        } catch {
          setFeeCategories(DEFAULT_FEE_CATEGORIES);
          localStorage.setItem(catKey, JSON.stringify(DEFAULT_FEE_CATEGORIES));
        }
      } else {
        setFeeCategories(DEFAULT_FEE_CATEGORIES);
        localStorage.setItem(catKey, JSON.stringify(DEFAULT_FEE_CATEGORIES));
      }

      const savedSched = localStorage.getItem(schedKey) || (code === "108254" ? localStorage.getItem("nctb_fee_template_schedule_v2") : null);
      if (savedSched) {
        try {
          const parsedSched = JSON.parse(savedSched);
          if (parsedSched && typeof parsedSched === "object" && Object.keys(parsedSched).length >= 12) {
            setMonthlySchedule(parsedSched);
          } else {
            setMonthlySchedule(DEFAULT_MONTHLY_SCHEDULE);
            localStorage.setItem(schedKey, JSON.stringify(DEFAULT_MONTHLY_SCHEDULE));
          }
        } catch {
          setMonthlySchedule(DEFAULT_MONTHLY_SCHEDULE);
          localStorage.setItem(schedKey, JSON.stringify(DEFAULT_MONTHLY_SCHEDULE));
        }
      } else {
        setMonthlySchedule(DEFAULT_MONTHLY_SCHEDULE);
        localStorage.setItem(schedKey, JSON.stringify(DEFAULT_MONTHLY_SCHEDULE));
      }

      const savedMonth = localStorage.getItem(monthKey) || (code === "108254" ? localStorage.getItem("nctb_fee_selected_month_v2") : null);
      if (savedMonth) {
        setSelectedMonthKey(savedMonth);
      } else {
        setSelectedMonthKey("OCT");
      }

      setWaivers(getStoredWaivers(code));
    } catch (e) {
      console.error("Failed to load fee records from scoped storage", e);
    }
  };

  // Initialize fee store, template, and scholarship waivers from localStorage
  useEffect(() => {
    loadTenantFeeData();

    const handleWaiverSync = () => {
      setWaivers(getStoredWaivers());
    };

    const handleTenantSwitch = (e: any) => {
      const newCode = e?.detail?.code;
      loadTenantFeeData(newCode);
      fetchClasses();
    };

    window.addEventListener("nctb_waiver_store_updated", handleWaiverSync);
    window.addEventListener(TENANT_SWITCH_EVENT, handleTenantSwitch);
    window.addEventListener("storage", handleWaiverSync);
    return () => {
      window.removeEventListener("nctb_waiver_store_updated", handleWaiverSync);
      window.removeEventListener(TENANT_SWITCH_EVENT, handleTenantSwitch);
      window.removeEventListener("storage", handleWaiverSync);
    };
  }, []);

  // Save fee store to scoped localStorage on change
  const saveFeeRecords = (newRecords: Record<string, FeeRecord>) => {
    setFeeRecords(newRecords);
    try {
      const key = getScopedStorageKey("nctb_fee_records_v1");
      localStorage.setItem(key, JSON.stringify(newRecords));
    } catch (e) {
      console.error("Failed to persist fee records", e);
    }
  };

  const saveFeeCategories = (cats: FeeCategory[]) => {
    setFeeCategories(cats);
    try {
      const key = getScopedStorageKey("nctb_fee_categories_v2");
      localStorage.setItem(key, JSON.stringify(cats));
    } catch (e) {
      console.error(e);
    }
  };

  const saveMonthlySchedule = (sched: Record<string, string[]>) => {
    setMonthlySchedule(sched);
    try {
      const key = getScopedStorageKey("nctb_fee_template_schedule_v2");
      localStorage.setItem(key, JSON.stringify(sched));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectMonth = (monthKey: string) => {
    setSelectedMonthKey(monthKey);
    try {
      const key = getScopedStorageKey("nctb_fee_selected_month_v2");
      localStorage.setItem(key, monthKey);
    } catch (e) {
      console.error(e);
    }
  };

  // Template Handlers: Checkbox toggle for a month
  const handleToggleCategoryForMonth = (monthKey: string, categoryId: string) => {
    const currentList = monthlySchedule[monthKey] || [];
    const isPresent = currentList.includes(categoryId);
    const updatedList = isPresent
      ? currentList.filter((id) => id !== categoryId)
      : [...currentList, categoryId];

    const updatedSched = {
      ...monthlySchedule,
      [monthKey]: updatedList,
    };
    saveMonthlySchedule(updatedSched);

    const catObj = feeCategories.find((c) => c.id === categoryId);
    const monthObj = MONTHS.find((m) => m.key === monthKey);
    setToastMessage(
      `${catObj?.name || "Category"} ${!isPresent ? "added to" : "removed from"} ${monthObj?.name || monthKey}!`
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBatchToggleMonth = (monthKey: string, enableAll: boolean) => {
    const updatedList = enableAll ? feeCategories.map((c) => c.id) : [];
    const updatedSched = {
      ...monthlySchedule,
      [monthKey]: updatedList,
    };
    saveMonthlySchedule(updatedSched);

    const monthObj = MONTHS.find((m) => m.key === monthKey);
    setToastMessage(
      enableAll
        ? `All fee categories checked for ${monthObj?.name || monthKey}!`
        : `All categories unchecked for ${monthObj?.name || monthKey}!`
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBatchToggleCategoryAcrossYear = (categoryId: string, enableAll: boolean) => {
    const newSched: Record<string, string[]> = {};
    MONTHS.forEach((m) => {
      const current = monthlySchedule[m.key] || [];
      if (enableAll) {
        newSched[m.key] = current.includes(categoryId) ? current : [...current, categoryId];
      } else {
        newSched[m.key] = current.filter((id) => id !== categoryId);
      }
    });
    saveMonthlySchedule(newSched);

    const catObj = feeCategories.find((c) => c.id === categoryId);
    setToastMessage(
      `"${catObj?.name || "Category"}" ${enableAll ? "checked" : "unchecked"} across all 12 months!`
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddCategory = (newCat: FeeCategory, targetMonths: string[]) => {
    const updatedCats = [...feeCategories, newCat];
    saveFeeCategories(updatedCats);

    const updatedSched = { ...monthlySchedule };
    targetMonths.forEach((mKey) => {
      const current = updatedSched[mKey] || [];
      if (!current.includes(newCat.id)) {
        updatedSched[mKey] = [...current, newCat.id];
      }
    });
    saveMonthlySchedule(updatedSched);

    setToastMessage(`Fee category "${newCat.name}" added to template (${targetMonths.length} months checked)!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateCategory = (updatedCat: FeeCategory) => {
    const currentList = feeCategories && feeCategories.length > 0 ? feeCategories : DEFAULT_FEE_CATEGORIES;
    const updatedCats = currentList.map((c) => (c.id === updatedCat.id ? updatedCat : c));
    saveFeeCategories(updatedCats);
    setToastMessage(`Updated fee category "${updatedCat.name}" (৳${updatedCat.amount.toLocaleString()})!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const updatedCats = feeCategories.filter((c) => c.id !== categoryId);
    saveFeeCategories(updatedCats);

    const updatedSched: Record<string, string[]> = {};
    Object.keys(monthlySchedule).forEach((mKey) => {
      updatedSched[mKey] = (monthlySchedule[mKey] || []).filter((id) => id !== categoryId);
    });
    saveMonthlySchedule(updatedSched);

    setToastMessage("Fee category deleted from template.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyMonthToOthers = (fromMonth: string, toMonths: string[]) => {
    const sourceCategories = monthlySchedule[fromMonth] || [];
    const updatedSched = { ...monthlySchedule };
    toMonths.forEach((mKey) => {
      updatedSched[mKey] = [...sourceCategories];
    });
    saveMonthlySchedule(updatedSched);

    const fromObj = MONTHS.find((m) => m.key === fromMonth);
    setToastMessage(
      `Copied ${fromObj?.name || fromMonth} fee structure to ${toMonths.length} selected month(s)!`
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleResetToDefaults = () => {
    saveFeeCategories(DEFAULT_FEE_CATEGORIES);
    saveMonthlySchedule(DEFAULT_MONTHLY_SCHEDULE);
    setToastMessage("Fee template reset to default NCTB standard schedule.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch classes on mount
  const fetchClasses = () => {
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.length > 0) {
          setClasses(data.data);
          // Default to first class (e.g. Class 11)
          setSelectedClassId(data.data[0].id);
        } else {
          setClasses([]);
          setSelectedClassId("");
        }
      })
      .catch((err) => console.error("Error fetching classes:", err));
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch students matching server-side filters
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSession && selectedSession !== "ALL") params.set("session", selectedSession);
      if (selectedClassId) params.set("classId", selectedClassId);
      if (selectedSectionId) params.set("sectionId", selectedSectionId);
      if (selectedShift && selectedShift !== "ALL") params.set("shift", selectedShift);
      if (selectedGroup && selectedGroup !== "ALL") params.set("groupType", selectedGroup);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedStatus === "ACTIVE") params.set("status", "ACTIVE");
      else if (selectedStatus === "INACTIVE") params.set("status", "INACTIVE");

      const res = await fetch(`/api/students?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setStudents(data.data);
      } else {
        setStudents([]);
      }
    } catch (e) {
      console.error("Error fetching students:", e);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedSession, selectedClassId, selectedSectionId, selectedShift, selectedGroup, searchQuery, selectedStatus]);

  // Derived sections & shifts
  const currentClass = classes.find((c) => c.id === selectedClassId);
  const classNum = currentClass?.numericValue ?? parseInt(currentClass?.name?.replace(/\D/g, "") || "0", 10);
  const isClass11Or12 = Boolean(
    currentClass && (
      classNum === 11 ||
      classNum === 12 ||
      /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(currentClass.name || "")
    )
  );

  const rawSections = currentClass
    ? currentClass.sections || []
    : classes.flatMap((c) => c.sections || []);

  const availableSections = rawSections.filter((s: any) => {
    if (selectedGroup !== "ALL" && s.groupType !== selectedGroup) return false;
    if (selectedShift && selectedShift !== "ALL" && s.shift?.toUpperCase() !== selectedShift.toUpperCase()) return false;
    return true;
  });

  const availableShifts = Array.from(
    new Set(
      rawSections
        .map((s: any) => s.shift?.toUpperCase())
        .filter((sh: any) => Boolean(sh) && sh !== "MORNING" && sh !== "DAY")
    )
  ) as string[];

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSectionId("");
    const chosenClass = classes.find((c) => c.id === classId);
    const chosenNum = chosenClass?.numericValue ?? parseInt(chosenClass?.name?.replace(/\D/g, "") || "0", 10);
    if (chosenClass && (chosenNum === 11 || chosenNum === 12 || /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(chosenClass.name || ""))) {
      if (selectedGroup === "GENERAL") setSelectedGroup("ALL");
    }
  };

  const handleShiftChange = (newShift: string) => {
    setSelectedShift(newShift);
    const matching = rawSections.filter((s: any) => {
      if (selectedGroup !== "ALL" && s.groupType !== selectedGroup) return false;
      if (newShift && newShift !== "ALL" && s.shift?.toUpperCase() !== newShift.toUpperCase()) return false;
      return true;
    });
    if (selectedSectionId) {
      const stillValid = matching.some((s: any) => s.id === selectedSectionId);
      if (!stillValid) {
        setSelectedSectionId(matching.length > 0 ? matching[0].id : "");
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedSession("ALL");
    setSelectedShift("");
    setSelectedGroup("ALL");
    setSelectedSectionId("");
    setSearchQuery("");
    setSelectedStatus("ALL");
    if (classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  };

  const hasActiveFilters = Boolean(
    (selectedSession && selectedSession !== "ALL") ||
    selectedShift ||
    (selectedGroup && selectedGroup !== "ALL") ||
    selectedSectionId ||
    searchQuery ||
    selectedStatus !== "ALL"
  );

  // Helper to get fee numbers for a student
  const getStudentFee = (enr: any): FeeRecord & { totalPayable: number; dueAmount: number; status: "PAID" | "PARTIAL" | "DUE"; applicableCategories: FeeCategory[] } => {
    const studentId = enr.student?.id || enr.id;
    const existing = feeRecords[studentId];

    const roll = enr.classRoll || 1;
    const isHigherClass = (enr.class?.numericValue || 11) >= 11;

    // Categories enabled for active month that match student's group
    const activeCatIds = monthlySchedule[selectedMonthKey] || [];
    const applicableCategories = feeCategories.filter((cat) => {
      if (!activeCatIds.includes(cat.id)) return false;
      if (cat.groupType && cat.groupType !== "ALL" && cat.groupType !== enr.groupType) return false;
      return true;
    });

    const templateTuition = applicableCategories
      .filter((c) => c.type === "TUITION")
      .reduce((s, c) => s + c.amount, 0);

    const templateExam = applicableCategories
      .filter((c) => c.type === "EXAM")
      .reduce((s, c) => s + c.amount, 0);

    const templateLabSession = applicableCategories
      .filter((c) => c.type !== "TUITION" && c.type !== "EXAM")
      .reduce((s, c) => s + c.amount, 0);

    const baseTuition = templateTuition > 0 ? templateTuition : (isHigherClass ? 2500 : 1800);
    const baseExam = templateExam;
    const baseLab = templateLabSession;

    // Check Auto Scholarship / Waiver from waiverStore
    const studentKey = enr.student?.id || enr.id;
    const rollKey = `roll_${roll}`;
    const assignedWaiver = waivers[studentKey] || waivers[enr.id] || waivers[rollKey];
    const waiverResult = calculateStudentWaiver(assignedWaiver, baseTuition, baseExam + baseLab, roll);

    const tuitionFee = existing?.tuitionFee ?? baseTuition;
    const examFee = existing?.examFee ?? baseExam;
    const labSessionFee = existing?.labSessionFee ?? baseLab;
    const waiverAmount = existing?.waiverAmount !== undefined && (existing as any)?.hasManualWaiver
      ? existing.waiverAmount
      : waiverResult.waiverAmount;

    // Deterministic initial paid calculation if not customized
    let defaultPaid = baseTuition + baseExam + baseLab - waiverAmount;
    if (roll % 4 === 0) {
      defaultPaid = 0; // Due
    } else if (roll % 3 === 0) {
      defaultPaid = Math.floor(defaultPaid * 0.5); // Partial
    }

    const paidAmount = existing?.paidAmount ?? defaultPaid;
    const isExamCleared = existing?.isExamCleared ?? (paidAmount >= (tuitionFee + examFee + labSessionFee - waiverAmount) * 0.5);

    const totalPayable = Math.max(0, tuitionFee + examFee + labSessionFee - waiverAmount);
    const dueAmount = Math.max(0, totalPayable - paidAmount);

    let status: "PAID" | "PARTIAL" | "DUE" = "DUE";
    if (dueAmount === 0 && totalPayable > 0) {
      status = "PAID";
    } else if (paidAmount > 0 && dueAmount > 0) {
      status = "PARTIAL";
    }

    return {
      tuitionFee,
      examFee,
      labSessionFee,
      waiverAmount,
      waiverTitle: waiverResult.waiverTitle,
      waiverPercentage: waiverResult.waiverPercentage,
      isSpecialScholarship: waiverResult.isSpecialScholarship,
      paidAmount,
      lastPaymentMethod: existing?.lastPaymentMethod || "bKash",
      lastTransactionId: existing?.lastTransactionId || `TRX-${10000 + roll * 7}`,
      lastPaymentDate: existing?.lastPaymentDate || "2026-10-02",
      isExamCleared,
      totalPayable,
      dueAmount,
      status,
      applicableCategories,
    };
  };

  // Additional filter for Payment status if selected
  const displayedStudents = useMemo(() => {
    return students.filter((s) => {
      const fee = getStudentFee(s);
      if (selectedStatus === "PAID") return fee.status === "PAID";
      if (selectedStatus === "DUE") return fee.status === "DUE" || fee.status === "PARTIAL";
      return true;
    });
  }, [students, selectedStatus, feeRecords, feeCategories, monthlySchedule, selectedMonthKey, waivers]);

  // Status counts
  const totalCount = students.length;
  const activeCount = useMemo(() => students.filter((s) => s.student?.isActive).length, [students]);
  const inactiveCount = useMemo(() => students.filter((s) => !s.student?.isActive).length, [students]);
  const paidCount = useMemo(
    () => students.filter((s) => getStudentFee(s).status === "PAID").length,
    [students, feeRecords, feeCategories, monthlySchedule, selectedMonthKey, waivers]
  );
  const dueCount = useMemo(
    () => students.filter((s) => getStudentFee(s).status !== "PAID").length,
    [students, feeRecords, feeCategories, monthlySchedule, selectedMonthKey, waivers]
  );

  // Overall Financial Totals for displayed batch
  const totals = useMemo(() => {
    let billed = 0;
    let collected = 0;
    let due = 0;
    let clearedCount = 0;

    displayedStudents.forEach((s) => {
      const f = getStudentFee(s);
      billed += f.totalPayable;
      collected += f.paidAmount;
      due += f.dueAmount;
      if (f.isExamCleared) clearedCount++;
    });

    const rate = billed > 0 ? ((collected / billed) * 100).toFixed(1) : "0.0";
    return { billed, collected, due, rate, clearedCount };
  }, [displayedStudents, feeRecords, feeCategories, monthlySchedule, selectedMonthKey]);

  // Open Collect Payment Modal
  const handleOpenPayment = (enr: any) => {
    const fee = getStudentFee(enr);
    setPaymentModalStudent(enr);
    setPaymentAmount(fee.dueAmount > 0 ? fee.dueAmount : 0);
    setPaymentMethod("bKash");
    setPaymentTrxId(`TXN${Math.floor(100000 + Math.random() * 900000)}`);
    setPaymentNote("Tuition & Exam fee collection");
  };

  // Save Payment
  const handleSavePayment = () => {
    if (!paymentModalStudent) return;
    const studentId = paymentModalStudent.student?.id || paymentModalStudent.id;
    const currentFee = getStudentFee(paymentModalStudent);
    const newPaid = currentFee.paidAmount + Number(paymentAmount || 0);

    const updatedRecord: FeeRecord = {
      tuitionFee: currentFee.tuitionFee,
      examFee: currentFee.examFee,
      labSessionFee: currentFee.labSessionFee,
      waiverAmount: currentFee.waiverAmount,
      paidAmount: newPaid,
      lastPaymentMethod: paymentMethod,
      lastTransactionId: paymentTrxId,
      lastPaymentDate: new Date().toISOString().split("T")[0],
      isExamCleared: newPaid >= currentFee.totalPayable * 0.5,
    };

    saveFeeRecords({
      ...feeRecords,
      [studentId]: updatedRecord,
    });

    setToastMessage(`Payment of ৳ ${paymentAmount} received for ${paymentModalStudent.student?.firstName || "Student"}!`);
    setTimeout(() => setToastMessage(null), 3500);
    setPaymentModalStudent(null);
  };

  // Toggle Exam Clearance
  const handleToggleClearance = (enr: any) => {
    const studentId = enr.student?.id || enr.id;
    const current = getStudentFee(enr);
    const updated: FeeRecord = {
      ...current,
      isExamCleared: !current.isExamCleared,
    };

    saveFeeRecords({
      ...feeRecords,
      [studentId]: updated,
    });

    setToastMessage(
      `Exam Clearance ${!current.isExamCleared ? "Granted" : "Withheld"} for ${enr.student?.firstName || "Student"}`
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Export Fee Ledger to Excel
  const handleExportExcel = () => {
    if (displayedStudents.length === 0) {
      alert("No student fee data available to export.");
      return;
    }

    const headers = [
      "Roll",
      "Student ID",
      "Student Name",
      "Guardian Name",
      "Guardian Phone",
      "Class",
      "Section",
      "Group",
      "Tuition Fee (৳)",
      "Exam Fee (৳)",
      "Lab/Session Fee (৳)",
      "Waiver (৳)",
      "Total Payable (৳)",
      "Paid Amount (৳)",
      "Due Balance (৳)",
      "Payment Status",
      "Exam Clearance",
      "Last Payment Method",
      "Transaction ID",
      "Payment Date",
    ];

    const rows = displayedStudents.map((enr) => {
      const f = getStudentFee(enr);
      const s = enr.student || {};
      return [
        enr.classRoll,
        s.studentIdNo || "",
        `${s.firstName || ""} ${s.lastName || ""}`.trim(),
        s.guardianName || "",
        s.guardianPhone || "",
        enr.class?.name || "",
        enr.section?.name || "",
        enr.groupType || "",
        f.tuitionFee,
        f.examFee,
        f.labSessionFee,
        f.waiverAmount,
        f.totalPayable,
        f.paidAmount,
        f.dueAmount,
        f.status,
        f.isExamCleared ? "CLEARED" : "HOLD",
        f.lastPaymentMethod || "",
        f.lastTransactionId || "",
        f.lastPaymentDate || "",
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 15) }));

    const activeMonthName = MONTHS.find((m) => m.key === selectedMonthKey)?.name || "October";
    const wb = XLSX.utils.book_new();
    const sheetTitle = currentClass ? currentClass.name.replace(/[^a-zA-Z0-9]/g, "_") : "Fees";
    XLSX.utils.book_append_sheet(wb, ws, "Fee_Ledger");
    XLSX.writeFile(wb, `${sheetTitle}_${activeMonthName}_2026_Student_Fee_Ledger.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white text-xs px-4 py-3 rounded-lg shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-2 no-print">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Module Sub-Navigation Tab Header */}
      <FeeNavHeader />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Fees</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            Fee Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage tuition fee billing, collection receipts, waivers, and payment status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Fees Setup Button */}
          <button
            type="button"
            onClick={() => setIsFeeSetupModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm cursor-pointer transition hover:shadow active:scale-95"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Fees Setup</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 shadow-sm cursor-pointer transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export Excel Ledger
          </button>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Overview
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Monthly Billed Amount</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">৳ {totals.billed.toLocaleString()}</p>
          <span className="text-xs text-slate-500">{displayedStudents.length} Students in batch</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Collected to Date</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">৳ {totals.collected.toLocaleString()}</p>
          <span className="text-xs text-emerald-600 font-medium">{totals.rate}% Collection rate</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Outstanding Dues</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">৳ {totals.due.toLocaleString()}</p>
          <span className="text-xs text-amber-600 font-medium">{dueCount} Students with pending dues</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Exam Clearance</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {totals.clearedCount} / {displayedStudents.length}
          </p>
          <span className="text-xs text-indigo-600 font-medium">
            {displayedStudents.length > 0
              ? `${((totals.clearedCount / displayedStudents.length) * 100).toFixed(0)}% Cleared for Admit Card`
              : "0%"}
          </span>
        </div>
      </div>

      {/* ========================================================
          FEES SETUP MODAL WINDOW (OPENS ON CLICKING "FEES SETUP")
         ======================================================== */}
      <MonthlyFeeTemplate
        isModal={true}
        isOpen={isFeeSetupModalOpen}
        onClose={() => setIsFeeSetupModalOpen(false)}
        categories={feeCategories}
        monthlySchedule={monthlySchedule}
        selectedMonthKey={selectedMonthKey}
        onSelectMonth={handleSelectMonth}
        onToggleCategoryForMonth={handleToggleCategoryForMonth}
        onBatchToggleMonth={handleBatchToggleMonth}
        onBatchToggleCategoryAcrossYear={handleBatchToggleCategoryAcrossYear}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onCopyMonthToOthers={handleCopyMonthToOthers}
        onResetToDefaults={handleResetToDefaults}
        onSave={(cats, sched) => {
          saveFeeCategories(cats);
          saveMonthlySchedule(sched);
          setToastMessage("Fee Setup saved successfully!");
        }}
        classes={classes}
        selectedClassId={selectedClassId}
        onSelectClass={handleClassChange}
        selectedSession={selectedSession}
        onSelectSession={setSelectedSession}
        selectedGroup={selectedGroup}
        onSelectGroup={setSelectedGroup}
      />

      {/* ========================================================
          FILTER BAR (Exact format matching user specification image)
         ======================================================== */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Filter:
            </span>
            {hasActiveFilters && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full">
                Active Filter
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1 underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 text-xs">
          {/* 1. Session Filter */}
          <div>
            <SessionSelect
              value={selectedSession}
              onChange={(val) => setSelectedSession(val)}
              label="Session:"
              labelClassName="font-semibold text-slate-600 block mb-1"
              selectClassName="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
            />
          </div>

          {/* 2. Class Filter */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Class:</label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Shift Filter */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Shift:</label>
            <select
              value={selectedShift}
              onChange={(e) => handleShiftChange(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
            >
              <option value="">All Shifts</option>
              <option value="MORNING">Morning</option>
              <option value="DAY">Day</option>
              {availableShifts.map((sh: any) => (
                <option key={sh} value={sh}>
                  {sh.charAt(0) + sh.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Group Filter */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Group:</label>
            <select
              value={isClass11Or12 && selectedGroup === "GENERAL" ? "ALL" : selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
            >
              <option value="ALL">All Groups</option>
              {!isClass11Or12 && <option value="GENERAL">General</option>}
              <option value="SCIENCE">Science</option>
              <option value="HUMANITIES">Humanities</option>
              <option value="BUSINESS_STUDIES">Business Studies</option>
            </select>
          </div>

          {/* 4. Section Filter */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Section:</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
            >
              <option value="">All Sections</option>
              {availableSections.map((sec: any) => {
                const shiftLabel = sec.shift === "MORNING" ? "Morning" : sec.shift === "DAY" ? "Day" : sec.shift;
                return (
                  <option key={sec.id} value={sec.id}>
                    {sec.name} {sec.groupType ? `(${sec.groupType})` : ""}{(!selectedShift && shiftLabel) ? ` • ${shiftLabel}` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 5. Status Filter */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
            >
              <option value="ALL">All Statuses ({totalCount})</option>
              <option value="PAID">Paid Only ({paidCount})</option>
              <option value="DUE">Pending / Due ({dueCount})</option>
              <option value="ACTIVE">Active Students ({activeCount})</option>
              <option value="INACTIVE">Inactive Students ({inactiveCount})</option>
            </select>
          </div>

          {/* 6. Live Search Student */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Search Student:</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, Roll, ID..."
                className="w-full p-2 pr-8 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white text-slate-800"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Student Fee Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden no-print">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              Student Tuition & Fee Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {displayedStudents.length} of {totalCount} enrolled students
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Batch Cycle:</span>
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-1 rounded flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {MONTHS.find((m) => m.key === selectedMonthKey)?.name || "October"} 2026 Cycle
              <span className="text-[10px] text-emerald-600 font-normal">
                ({(monthlySchedule[selectedMonthKey] || []).length} heads active)
              </span>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent mb-2"></div>
            <p>Loading student fee records...</p>
          </div>
        ) : displayedStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No student records found</p>
            <p className="text-slate-400 mt-1">Try resetting the filter criteria or searching with a different term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-14 text-center">Roll</th>
                  <th className="py-3 px-4">Student Info</th>
                  <th className="py-3 px-3">Class & Section</th>
                  <th className="py-3 px-3 text-right">Tuition</th>
                  <th className="py-3 px-3 text-right">Exam/Lab</th>
                  <th className="py-3 px-3 text-right">Waiver</th>
                  <th className="py-3 px-3 text-right font-bold text-slate-800">Total</th>
                  <th className="py-3 px-3 text-right text-emerald-600 font-bold">Paid</th>
                  <th className="py-3 px-3 text-right text-amber-600 font-bold">Due</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedStudents.map((enr) => {
                  const fee = getStudentFee(enr);
                  const student = enr.student || {};
                  return (
                    <tr key={enr.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono">
                        {enr.classRoll}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          ID: {student.studentIdNo}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800">{enr.class?.name}</span>
                        <div className="text-[11px] text-slate-500">
                          {enr.section?.name} • {enr.groupType}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        ৳ {fee.tuitionFee.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        ৳ {(fee.examFee + fee.labSessionFee).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {fee.waiverAmount > 0 ? (
                          <div>
                            <span className="font-bold text-rose-600">-৳ {fee.waiverAmount.toLocaleString()}</span>
                            {fee.isSpecialScholarship && (
                              <div className="mt-0.5">
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
                                  title={fee.waiverTitle}
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                                  <span className="truncate max-w-[120px]">{fee.waiverTitle}</span>
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">৳ 0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ৳ {fee.totalPayable.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                        ৳ {fee.paidAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-600">
                        ৳ {fee.dueAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {fee.status === "PAID" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3" /> Paid
                          </span>
                        ) : fee.status === "PARTIAL" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" /> Partial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                            <AlertCircle className="w-3 h-3" /> Due
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          PAYMENT MODAL
         ======================================================== */}
      {paymentModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Collect Student Fee</h3>
              </div>
              <button
                onClick={() => setPaymentModalStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student summary */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between font-bold text-slate-900">
                <span>{paymentModalStudent.student?.firstName} {paymentModalStudent.student?.lastName}</span>
                <span>Roll: {paymentModalStudent.classRoll}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>ID: {paymentModalStudent.student?.studentIdNo}</span>
                <span>{paymentModalStudent.class?.name} • {paymentModalStudent.section?.name}</span>
              </div>
            </div>

            {/* Balances */}
            {(() => {
              const f = getStudentFee(paymentModalStudent);
              return (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Total Payable</span>
                    <strong className="text-slate-900 font-mono">৳ {f.totalPayable}</strong>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-emerald-600 block">Paid So Far</span>
                    <strong className="text-emerald-700 font-mono">৳ {f.paidAmount}</strong>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                    <span className="text-[10px] text-amber-600 block">Remaining Due</span>
                    <strong className="text-amber-700 font-mono">৳ {f.dueAmount}</strong>
                  </div>
                </div>
              );
            })()}

            {/* Form */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Collection Amount (৳):
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  min={1}
                  className="w-full p-2 border border-slate-200 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Method:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800"
                >
                  <option value="bKash">bKash (MFS Gateway)</option>
                  <option value="Nagad">Nagad (MFS)</option>
                  <option value="Rocket">Rocket / Upay</option>
                  <option value="Cash">Cash at Counter</option>
                  <option value="Bank">Bank Deposit / Sonali Bank</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Transaction / Voucher ID:
                </label>
                <input
                  type="text"
                  value={paymentTrxId}
                  onChange={(e) => setPaymentTrxId(e.target.value)}
                  placeholder="e.g. TRX-982312"
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Remarks / Note:</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g. October monthly tuition installment"
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setPaymentModalStudent(null)}
                className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePayment}
                disabled={paymentAmount <= 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Confirm Payment & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MONEY RECEIPT / PRINT MODAL
         ======================================================== */}
      {receiptModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Official Money Receipt</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setReceiptModalStudent(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper */}
            {(() => {
              const fee = getStudentFee(receiptModalStudent);
              const s = receiptModalStudent.student || {};
              return (
                <div className="border border-slate-300 p-6 rounded-lg bg-white space-y-4 font-sans text-xs">
                  {/* Receipt Header */}
                  <div className="text-center border-b border-slate-200 pb-3">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block">
                      NCTB Bangladesh Standard System
                    </span>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      COLLEGE / SCHOOL MONEY RECEIPT
                    </h2>
                    <p className="text-[11px] text-slate-500">Student Fee Management & Accounts Clearance</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2 font-mono">
                      <span>Receipt No: MR-2026-{receiptModalStudent.classRoll * 143}</span>
                      <span>Date: {fee.lastPaymentDate || "2026-10-06"}</span>
                    </div>
                  </div>

                  {/* Student Info Grid */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded border border-slate-200 text-[11px]">
                    <div>
                      <span className="text-slate-500">Student Name:</span>{" "}
                      <strong className="text-slate-900">{s.firstName} {s.lastName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Student ID:</span>{" "}
                      <strong className="text-slate-900 font-mono">{s.studentIdNo}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Class & Section:</span>{" "}
                      <strong className="text-slate-900">
                        {receiptModalStudent.class?.name} • {receiptModalStudent.section?.name}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Class Roll:</span>{" "}
                      <strong className="text-slate-900 font-mono">{receiptModalStudent.classRoll}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Group / Shift:</span>{" "}
                      <span className="text-slate-800">{receiptModalStudent.groupType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Guardian Phone:</span>{" "}
                      <span className="text-slate-800 font-mono">{s.guardianPhone}</span>
                    </div>
                  </div>

                  {/* Fee Itemization Table */}
                  <table className="w-full text-left text-[11px] border-collapse border border-slate-200">
                    <thead className="bg-slate-100 font-semibold text-slate-700">
                      <tr>
                        <th className="p-2 border border-slate-200">SL</th>
                        <th className="p-2 border border-slate-200">Fee Particulars</th>
                        <th className="p-2 border border-slate-200 text-right">Amount (৳)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fee.applicableCategories && fee.applicableCategories.length > 0 ? (
                        fee.applicableCategories.map((cat, idx) => (
                          <tr key={cat.id}>
                            <td className="p-2 border border-slate-200 text-center">{idx + 1}</td>
                            <td className="p-2 border border-slate-200">
                              {cat.name} ({MONTHS.find((m) => m.key === selectedMonthKey)?.name || "October"} 2026)
                            </td>
                            <td className="p-2 border border-slate-200 text-right font-mono">
                              ৳ {cat.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <>
                          <tr>
                            <td className="p-2 border border-slate-200 text-center">1</td>
                            <td className="p-2 border border-slate-200">
                              Monthly Tuition Fee ({MONTHS.find((m) => m.key === selectedMonthKey)?.name || "October"} 2026)
                            </td>
                            <td className="p-2 border border-slate-200 text-right font-mono">
                              ৳ {fee.tuitionFee.toLocaleString()}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 border border-slate-200 text-center">2</td>
                            <td className="p-2 border border-slate-200">Exam Assessment Fee</td>
                            <td className="p-2 border border-slate-200 text-right font-mono">
                              ৳ {fee.examFee.toLocaleString()}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 border border-slate-200 text-center">3</td>
                            <td className="p-2 border border-slate-200">Lab & Session Charges</td>
                            <td className="p-2 border border-slate-200 text-right font-mono">
                              ৳ {fee.labSessionFee.toLocaleString()}
                            </td>
                          </tr>
                        </>
                      )}
                      {fee.waiverAmount > 0 && (
                        <tr className="text-rose-600">
                          <td className="p-2 border border-slate-200 text-center">
                            {(fee.applicableCategories?.length || 3) + 1}
                          </td>
                          <td className="p-2 border border-slate-200">
                            {fee.waiverTitle && fee.waiverTitle !== "No Waiver"
                              ? `Less: ${fee.waiverTitle}`
                              : "Less: Merit Waiver / Scholarship Deduction"}
                          </td>
                          <td className="p-2 border border-slate-200 text-right font-mono">
                            -৳ {fee.waiverAmount.toLocaleString()}
                          </td>
                        </tr>
                      )}
                      <tr className="font-bold bg-slate-50 text-slate-900">
                        <td colSpan={2} className="p-2 border border-slate-200 text-right">Net Payable Amount:</td>
                        <td className="p-2 border border-slate-200 text-right font-mono">৳ {fee.totalPayable.toLocaleString()}</td>
                      </tr>
                      <tr className="font-bold bg-emerald-50 text-emerald-800">
                        <td colSpan={2} className="p-2 border border-slate-200 text-right">Total Amount Received:</td>
                        <td className="p-2 border border-slate-200 text-right font-mono">৳ {fee.paidAmount.toLocaleString()}</td>
                      </tr>
                      <tr className="font-bold text-amber-800">
                        <td colSpan={2} className="p-2 border border-slate-200 text-right">Outstanding Balance / Due:</td>
                        <td className="p-2 border border-slate-200 text-right font-mono">৳ {fee.dueAmount.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Payment Info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                    <div>
                      <span>Method: </span>
                      <strong className="text-slate-800">{fee.lastPaymentMethod || "bKash"}</strong>
                    </div>
                    <div>
                      <span>TxID: </span>
                      <strong className="text-slate-800 font-mono">{fee.lastTransactionId || "N/A"}</strong>
                    </div>
                    <div>
                      <span>Admit Card Status: </span>
                      <strong className={fee.isExamCleared ? "text-emerald-700" : "text-amber-700"}>
                        {fee.isExamCleared ? "ELIGIBLE" : "PENDING CLEARANCE"}
                      </strong>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-600">
                    <div>
                      <div className="border-t border-slate-400 w-32 mx-auto mb-1"></div>
                      <span>Student / Guardian Signature</span>
                    </div>
                    <div>
                      <div className="border-t border-slate-400 w-32 mx-auto mb-1"></div>
                      <span>Authorized Accounts Officer</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

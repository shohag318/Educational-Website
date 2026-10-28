"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  CalendarDays,
  CheckSquare,
  Square,
  Plus,
  Pencil,
  Trash2,
  Copy,
  RotateCcw,
  SlidersHorizontal,
  TableProperties,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X,
  Layers,
  Tag,
  DollarSign,
  AlertCircle,
  Calendar,
  Check,
  Receipt,
  Save,
} from "lucide-react";
import { getScopedStorageKey, TENANT_SWITCH_EVENT } from "@/lib/clientTenant";

export interface FeeCategory {
  id: string;
  name: string;
  amount: number;
  type: "TUITION" | "EXAM" | "LAB" | "SESSION" | "ACTIVITY" | "OTHER";
  description?: string;
  groupType?: "ALL" | "SCIENCE" | "HUMANITIES" | "BUSINESS_STUDIES";
  isCustom?: boolean;
}

export interface MonthInfo {
  key: string;
  name: string;
  short: string;
  quarter: string;
}

export const MONTHS: MonthInfo[] = [
  { key: "JAN", name: "January", short: "Jan", quarter: "Q1" },
  { key: "FEB", name: "February", short: "Feb", quarter: "Q1" },
  { key: "MAR", name: "March", short: "Mar", quarter: "Q1" },
  { key: "APR", name: "April", short: "Apr", quarter: "Q2" },
  { key: "MAY", name: "May", short: "May", quarter: "Q2" },
  { key: "JUN", name: "June", short: "Jun", quarter: "Q2" },
  { key: "JUL", name: "July", short: "Jul", quarter: "Q3" },
  { key: "AUG", name: "August", short: "Aug", quarter: "Q3" },
  { key: "SEP", name: "September", short: "Sep", quarter: "Q3" },
  { key: "OCT", name: "October", short: "Oct", quarter: "Q4" },
  { key: "NOV", name: "November", short: "Nov", quarter: "Q4" },
  { key: "DEC", name: "December", short: "Dec", quarter: "Q4" },
];

export const DEFAULT_FEE_CATEGORIES: FeeCategory[] = [
  {
    id: "cat_admission",
    name: "Admission Fee/Re-admission Fee/Late Admission Fee",
    amount: 1500,
    type: "SESSION",
    description: "New admission, re-admission or late admission processing charge",
    groupType: "ALL",
  },
  {
    id: "cat_arrear_tuition",
    name: "Arrear Tuition Fee",
    amount: 2500,
    type: "TUITION",
    description: "Pending tuition dues carried over from previous billing months",
    groupType: "ALL",
  },
  {
    id: "cat_current_tuition",
    name: "Monthly Current Tuition Fee",
    amount: 2500,
    type: "TUITION",
    description: "Compulsory monthly academic classroom tuition fee",
    groupType: "ALL",
  },
  {
    id: "cat_advance_tuition",
    name: "Advance Tuition Fee",
    amount: 2500,
    type: "TUITION",
    description: "Pre-paid tuition for upcoming academic cycles",
    groupType: "ALL",
  },
  {
    id: "cat_board_reg",
    name: "Board/University Registration Fee",
    amount: 600,
    type: "OTHER",
    description: "Official registration with Education Board or National University",
    groupType: "ALL",
  },
  {
    id: "cat_late_reg",
    name: "Late Registration Fee",
    amount: 200,
    type: "OTHER",
    description: "Fine/surcharge for delayed registration submission",
    groupType: "ALL",
  },
  {
    id: "cat_4th_subject",
    name: "Fourth (4th) Subject Fee",
    amount: 300,
    type: "OTHER",
    description: "Additional elective / optional subject curriculum charge",
    groupType: "ALL",
  },
  {
    id: "cat_annual_test_exam",
    name: "Annual/Test Examination Fee",
    amount: 800,
    type: "EXAM",
    description: "Annual progression exam & pre-board test assessment",
    groupType: "ALL",
  },
  {
    id: "cat_session_fee",
    name: "Session Fee",
    amount: 3500,
    type: "SESSION",
    description: "Institutional infrastructure development & session charge",
    groupType: "ALL",
  },
  {
    id: "cat_degree_incourse",
    name: "Degree 1st/2nd In-course/Half Paper/Full Paper Fee",
    amount: 500,
    type: "EXAM",
    description: "Degree in-course tutorial exams, half-paper and full-paper tests",
    groupType: "ALL",
  },
  {
    id: "cat_non_collegiate",
    name: "Non-Collegiate/Electricity Bill Fee",
    amount: 400,
    type: "OTHER",
    description: "Non-collegiate attendance clearance & campus power utility share",
    groupType: "ALL",
  },
  {
    id: "cat_hsc_degree_exam",
    name: "H.S.C/Degree Examination Fee",
    amount: 1200,
    type: "EXAM",
    description: "Public examination entry fee for H.S.C or Degree finals",
    groupType: "ALL",
  },
  {
    id: "cat_exam_center",
    name: "Examination Center Fee",
    amount: 450,
    type: "EXAM",
    description: "Center maintenance, logistics, and invigilation honorarium",
    groupType: "ALL",
  },
  {
    id: "cat_college_library",
    name: "College Library Fee",
    amount: 150,
    type: "OTHER",
    description: "College central library maintenance, card & reading room access",
    groupType: "ALL",
  },
  {
    id: "cat_sports_fee",
    name: "Sports Fee",
    amount: 250,
    type: "ACTIVITY",
    description: "Inter-college sports, sports week & athletic supplies",
    groupType: "ALL",
  },
  {
    id: "cat_national_day",
    name: "National/International Day Celebration Fee",
    amount: 150,
    type: "ACTIVITY",
    description: "Observance of 21st Feb, Independence Day, Victory Day & Intl. events",
    groupType: "ALL",
  },
  {
    id: "cat_religious_festival",
    name: "Religious Festival Fee",
    amount: 200,
    type: "ACTIVITY",
    description: "Eid-e-Miladunnabi, Saraswati Puja and institutional spiritual festivals",
    groupType: "ALL",
  },
  {
    id: "cat_magazine_pub",
    name: "College Annual Magazine Publication Fee",
    amount: 200,
    type: "ACTIVITY",
    description: "Annual commemorative institutional magazine & creative literary publishing",
    groupType: "ALL",
  },
  {
    id: "cat_science_lab",
    name: "Science Laboratory Fee",
    amount: 500,
    type: "LAB",
    description: "Physics, Chemistry & Biology lab consumables & apparatus maintenance",
    groupType: "SCIENCE",
  },
  {
    id: "cat_red_crescent",
    name: "Red Crescent Fee",
    amount: 50,
    type: "ACTIVITY",
    description: "Bangladesh Red Crescent Society youth unit membership & first-aid fund",
    groupType: "ALL",
  },
  {
    id: "cat_development_fund",
    name: "College Development Fund Fee",
    amount: 1000,
    type: "SESSION",
    description: "Campus building, smart classroom & physical development fund",
    groupType: "ALL",
  },
  {
    id: "cat_welfare_fund",
    name: "Students' Welfare Fund Fee",
    amount: 100,
    type: "OTHER",
    description: "Underprivileged student stipend & emergency student medical welfare",
    groupType: "ALL",
  },
  {
    id: "cat_tc_fee",
    name: "Transfer Certificate (T.C.) Fee",
    amount: 200,
    type: "OTHER",
    description: "Official institutional transfer certificate & clearance dossier issuance",
    groupType: "ALL",
  },
  {
    id: "cat_testimonial_fee",
    name: "Testimonial Fee",
    amount: 150,
    type: "OTHER",
    description: "Character certificate & academic performance testimonial issuance",
    groupType: "ALL",
  },
  {
    id: "cat_id_card",
    name: "Identity Card Fee",
    amount: 150,
    type: "OTHER",
    description: "Smart digital RFID/Barcoded institutional student photo ID card",
    groupType: "ALL",
  },
  {
    id: "cat_bncc_rovers",
    name: "B.N.C.C./Rovers/Rangers Fee",
    amount: 50,
    type: "ACTIVITY",
    description: "Bangladesh National Cadet Corps, Rover Scouts & Girl Guides training fund",
    groupType: "ALL",
  },
  {
    id: "cat_computer_lab",
    name: "Computer Lab Fee",
    amount: 300,
    type: "ACTIVITY",
    description: "High-speed internet, ICT computer hardware & programming lab access",
    groupType: "ALL",
  },
  {
    id: "cat_blind_mosque",
    name: "Blind Welfare Fund Fee/Masjid Chada (Mosque Subscription)",
    amount: 50,
    type: "OTHER",
    description: "Braille society welfare assistance & college campus mosque upkeep",
    groupType: "ALL",
  },
  {
    id: "cat_board_migration",
    name: "Board/Migration Fee",
    amount: 500,
    type: "OTHER",
    description: "Inter-board or inter-college student migration endorsement fee",
    groupType: "ALL",
  },
  {
    id: "cat_other_board",
    name: "Other Fees charged by Board/University (if any)",
    amount: 300,
    type: "OTHER",
    description: "Statutory curriculum levies or special directives from Board/University",
    groupType: "ALL",
  },
  {
    id: "cat_misc",
    name: "Miscellaneous",
    amount: 100,
    type: "OTHER",
    description: "Contingency, clerical services & administrative incidental charges",
    groupType: "ALL",
  },
];

export const DEFAULT_MONTHLY_SCHEDULE: Record<string, string[]> = {
  JAN: ["cat_admission", "cat_session_fee", "cat_current_tuition", "cat_science_lab", "cat_id_card", "cat_computer_lab"],
  FEB: ["cat_current_tuition", "cat_science_lab", "cat_national_day"],
  MAR: ["cat_current_tuition", "cat_annual_test_exam", "cat_science_lab", "cat_sports_fee"],
  APR: ["cat_current_tuition", "cat_science_lab", "cat_college_library"],
  MAY: ["cat_current_tuition", "cat_science_lab"],
  JUN: ["cat_current_tuition", "cat_annual_test_exam", "cat_science_lab", "cat_computer_lab"],
  JUL: ["cat_current_tuition", "cat_science_lab", "cat_development_fund"],
  AUG: ["cat_current_tuition", "cat_science_lab", "cat_religious_festival"],
  SEP: ["cat_current_tuition", "cat_science_lab", "cat_college_library"],
  OCT: ["cat_current_tuition", "cat_annual_test_exam", "cat_science_lab", "cat_computer_lab"],
  NOV: ["cat_current_tuition", "cat_science_lab", "cat_red_crescent"],
  DEC: ["cat_current_tuition", "cat_annual_test_exam", "cat_science_lab", "cat_magazine_pub"],
};

const DEFAULT_CLASSES = [
  { id: "cls_6", name: "Class 6" },
  { id: "cls_7", name: "Class 7" },
  { id: "cls_8", name: "Class 8" },
  { id: "cls_9", name: "Class 9" },
  { id: "cls_10", name: "Class 10" },
  { id: "cls_11", name: "Class 11" },
  { id: "cls_12", name: "Class 12" },
];

interface MonthlyFeeTemplateProps {
  categories: FeeCategory[];
  monthlySchedule: Record<string, string[]>;
  selectedMonthKey: string;
  onSelectMonth: (monthKey: string) => void;
  onToggleCategoryForMonth: (monthKey: string, categoryId: string) => void;
  onBatchToggleMonth: (monthKey: string, enableAll: boolean) => void;
  onBatchToggleCategoryAcrossYear: (categoryId: string, enableAll: boolean) => void;
  onAddCategory: (category: FeeCategory, targetMonths: string[]) => void;
  onUpdateCategory?: (category: FeeCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  onCopyMonthToOthers: (fromMonth: string, toMonths: string[]) => void;
  onResetToDefaults: () => void;
  onSave?: (categories: FeeCategory[], monthlySchedule: Record<string, string[]>) => void;
  classes?: any[];
  selectedClassId?: string;
  onSelectClass?: (classId: string) => void;
  selectedSession?: string;
  onSelectSession?: (session: string) => void;
  selectedGroup?: string;
  onSelectGroup?: (group: string) => void;
  isModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function MonthlyFeeTemplate({
  categories,
  monthlySchedule,
  selectedMonthKey,
  onSelectMonth,
  onToggleCategoryForMonth,
  onBatchToggleMonth,
  onBatchToggleCategoryAcrossYear,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onCopyMonthToOthers,
  onResetToDefaults,
  onSave,
  classes,
  selectedClassId,
  onSelectClass,
  selectedSession,
  onSelectSession,
  selectedGroup,
  onSelectGroup,
  isModal = false,
  isOpen = false,
  onClose,
}: MonthlyFeeTemplateProps) {
  // UI View state
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"SETUP_TABLE" | "CATEGORY_SETUP" | "MATRIX_GRID">("SETUP_TABLE");

  // Group selection state for Fee Setup table
  const [internalGroup, setInternalGroup] = useState<string>("ALL");
  const currentGroup = selectedGroup !== undefined ? selectedGroup : internalGroup;

  const handleGroupChange = (group: string) => {
    setInternalGroup(group);
    if (onSelectGroup) {
      onSelectGroup(group);
    }
  };

  // Class selection state for Fee Setup table
  const classList = classes && classes.length > 0 ? classes : DEFAULT_CLASSES;
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(classList.map((c) => c.id));

  // Sync selectedClassIds when classList updates to only keep valid IDs
  useEffect(() => {
    if (classList.length > 0) {
      setSelectedClassIds((prev) => {
        const validIds = prev.filter((id) => classList.some((c) => c.id === id));
        return validIds.length > 0 ? validIds : classList.map((c) => c.id);
      });
    }
  }, [classList]);

  const validCheckedCount = selectedClassIds.filter((id) =>
    classList.some((c) => c.id === id)
  ).length;

  const isAllChecked = validCheckedCount === classList.length && classList.length > 0;

  const toggleClass = (classId: string) => {
    if (selectedClassIds.includes(classId)) {
      const next = selectedClassIds.filter((id) => id !== classId);
      setSelectedClassIds(next);
      if (onSelectClass && next.length > 0) {
        onSelectClass(next[0]);
      }
    } else {
      const next = [...selectedClassIds, classId];
      setSelectedClassIds(next);
      if (onSelectClass) {
        onSelectClass(classId);
      }
    }
  };

  const toggleAllClasses = () => {
    if (isAllChecked) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(classList.map((c) => c.id));
      if (onSelectClass && classList.length > 0) {
        onSelectClass(classList[0].id);
      }
    }
  };

  const currentSession = selectedSession || "2026";

  // Add Category Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatAmount, setNewCatAmount] = useState<number>(300);
  const [newCatType, setNewCatType] = useState<FeeCategory["type"]>("ACTIVITY");
  const [newCatGroup, setNewCatGroup] = useState<FeeCategory["groupType"]>("ALL");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatMonths, setNewCatMonths] = useState<string[]>([selectedMonthKey]);

  // Copy Setup Modal State
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [targetCopyMonths, setTargetCopyMonths] = useState<string[]>([]);

  // Edit Category Modal State (Name & Fee editing)
  const [editingCategory, setEditingCategory] = useState<FeeCategory | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatAmount, setEditCatAmount] = useState<number>(0);
  const [editCatType, setEditCatType] = useState<FeeCategory["type"]>("OTHER");
  const [editCatGroup, setEditCatGroup] = useState<FeeCategory["groupType"]>("ALL");
  const [editCatDesc, setEditCatDesc] = useState("");

  const openEditModal = (cat: FeeCategory) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatAmount(cat.amount);
    setEditCatType(cat.type);
    setEditCatGroup(cat.groupType || "ALL");
    setEditCatDesc(cat.description || "");
  };

  const handleUpdateCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCatName.trim() || editCatAmount < 0) return;

    const updatedCategory: FeeCategory = {
      ...editingCategory,
      name: editCatName.trim(),
      amount: Number(editCatAmount),
      type: editCatType,
      groupType: editCatGroup,
      description: editCatDesc.trim() || undefined,
    };

    if (onUpdateCategory) {
      onUpdateCategory(updatedCategory);
    }
    setEditingCategory(null);
  };

  // Ensure master categories is never empty; fallback to DEFAULT_FEE_CATEGORIES if empty or undefined
  const categoriesList = categories && categories.length > 0 ? categories : DEFAULT_FEE_CATEGORIES;

  // Active month info
  const activeMonthInfo = MONTHS.find((m) => m.key === selectedMonthKey) || MONTHS[9];
  const activeMonthCatIds = monthlySchedule[selectedMonthKey] || [];

  // Calculate total monthly fee for a month
  const getMonthTotal = (monthKey: string, groupOverride?: string) => {
    const ids = monthlySchedule[monthKey] || [];
    const grp = groupOverride !== undefined ? groupOverride : currentGroup;
    return categoriesList
      .filter((cat) => ids.includes(cat.id))
      .filter((cat) => {
        if (!grp || grp === "ALL") return true;
        return !cat.groupType || cat.groupType === "ALL" || cat.groupType === grp;
      })
      .reduce((sum, cat) => sum + cat.amount, 0);
  };

  // Handle Add Category submission
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || newCatAmount <= 0) return;

    const newCategory: FeeCategory = {
      id: `cat_custom_${Date.now()}`,
      name: newCatName.trim(),
      amount: Number(newCatAmount),
      type: newCatType,
      description: newCatDesc.trim() || undefined,
      groupType: newCatGroup,
      isCustom: true,
    };

    onAddCategory(newCategory, newCatMonths);
    setIsAddModalOpen(false);
    // Reset form
    setNewCatName("");
    setNewCatAmount(300);
    setNewCatDesc("");
    setNewCatMonths([selectedMonthKey]);
  };

  // Toggle month selection inside Add Modal
  const toggleModalMonth = (mKey: string) => {
    if (newCatMonths.includes(mKey)) {
      setNewCatMonths(newCatMonths.filter((k) => k !== mKey));
    } else {
      setNewCatMonths([...newCatMonths, mKey]);
    }
  };

  // Open copy modal
  const handleOpenCopyModal = () => {
    // Default to all other months
    setTargetCopyMonths(MONTHS.filter((m) => m.key !== selectedMonthKey).map((m) => m.key));
    setIsCopyModalOpen(true);
  };

  const handleExecuteCopy = () => {
    onCopyMonthToOthers(selectedMonthKey, targetCopyMonths);
    setIsCopyModalOpen(false);
  };

  const toggleCopyMonth = (mKey: string) => {
    if (targetCopyMonths.includes(mKey)) {
      setTargetCopyMonths(targetCopyMonths.filter((k) => k !== mKey));
    } else {
      setTargetCopyMonths([...targetCopyMonths, mKey]);
    }
  };

  // Save State and Handler
  const [isSavedJustNow, setIsSavedJustNow] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const handleSaveSetup = () => {
    try {
      const catKey = getScopedStorageKey("nctb_fee_categories_v2");
      const schedKey = getScopedStorageKey("nctb_fee_template_schedule_v2");
      localStorage.setItem(catKey, JSON.stringify(categoriesList));
      localStorage.setItem(schedKey, JSON.stringify(monthlySchedule));
      window.dispatchEvent(new Event(TENANT_SWITCH_EVENT));
    } catch (e) {
      console.error("Failed to persist fee setup", e);
    }

    if (onSave) {
      onSave(categoriesList, monthlySchedule);
    }

    setIsSavedJustNow(true);
    setSaveToast(`Fee Setup for ${activeMonthInfo.name} (${currentSession}) saved successfully!`);
    setTimeout(() => {
      setIsSavedJustNow(false);
      setSaveToast(null);
    }, 2500);
  };


  // Escape key handler when rendered in modal mode
  useEffect(() => {
    if (!isModal || !isOpen || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isAddModalOpen || isCopyModalOpen) return;
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModal, isOpen, onClose, isAddModalOpen, isCopyModalOpen]);

  // Views Content renderer (SETUP_TABLE, MONTH_CARDS, MATRIX_GRID)
  const renderViewsContent = () => (
    <div className="space-y-4">
      {/* ========================================================
          FEE SETUP TABLE (EXACT WIREFRAME MATCH FOR USER IMAGE)
         ======================================================== */}
          {viewMode === "SETUP_TABLE" && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Fee Setup:
                  </h3>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {currentSession} Session
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Fee Head</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCopyModal}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold cursor-pointer transition shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy to Months...</span>
                  </button>
                  <button
                    type="button"
                    onClick={onResetToDefaults}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer transition"
                    title="Reset to defaults"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Exact 6-Column Wireframe Table with Rigid Fixed Dimensions (No layout shifts on month/category changes) */}
              <div className="border-2 border-slate-800 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-xs border-collapse table-fixed">
                    <colgroup>
                      <col className="w-[14%]" />
                      <col className="w-[16%]" />
                      <col className="w-[16%]" />
                      <col className="w-[21%]" />
                      <col className="w-[22%]" />
                      <col className="w-[11%]" />
                    </colgroup>
                    <thead>
                      <tr className="border-b-2 border-slate-800 bg-slate-100/90 text-slate-900 divide-x-2 divide-slate-800">
                        <th className="py-2.5 px-3 text-center font-bold text-xs uppercase tracking-wide">
                          Session
                        </th>
                        <th className="py-2.5 px-3 text-center font-bold text-xs uppercase tracking-wide">
                          Class
                        </th>
                        <th className="py-2.5 px-3 text-center font-bold text-xs uppercase tracking-wide">
                          Month
                        </th>
                        <th className="py-2.5 px-3 text-center font-bold text-xs uppercase tracking-wide">
                          Fees Catagory
                        </th>
                        <th className="py-2.5 px-3 text-center font-bold text-xs uppercase tracking-wide">
                          Selected Catagories
                        </th>
                        <th className="py-2.5 px-3 text-center font-bold text-xs uppercase tracking-wide">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-x-2 divide-slate-800">
                      <tr className="divide-x-2 divide-slate-800 align-top">
                        {/* 1. Session */}
                        <td className="p-3 bg-white align-top">
                          <div className="h-[340px] flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="font-bold text-slate-900 text-xs">Session List</div>
                              <select
                                value={currentSession}
                                onChange={(e) => onSelectSession?.(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer truncate"
                              >
                                <option value="2026">2026 (Current)</option>
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                                <option value="2027">2027</option>
                              </select>
                            </div>

                            <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900 leading-snug">
                              <span className="block text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
                                Active Cycle
                              </span>
                              <strong className="font-bold text-emerald-950 text-xs">
                                {currentSession} Academic Cycle
                              </strong>
                            </div>
                          </div>
                        </td>

                        {/* 2. Class */}
                        <td className="p-3 bg-white align-top">
                          <div className="h-[340px] flex flex-col justify-between">
                            <div>
                              <div className="font-bold text-slate-900 text-xs mb-1.5 shrink-0">
                                Class List
                              </div>

                              <div className="h-[130px] overflow-y-auto space-y-1 border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                                {/* Select All */}
                                <label className="flex items-center space-x-2 p-1 rounded hover:bg-slate-100 cursor-pointer font-bold text-slate-900 border-b border-slate-200 pb-1.5 mb-1 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={isAllChecked}
                                    onChange={toggleAllClasses}
                                    className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 accent-emerald-600 cursor-pointer"
                                  />
                                  <span>Select All</span>
                                </label>

                                {classList.map((cls) => {
                                  const isChecked = selectedClassIds.includes(cls.id);
                                  return (
                                    <label
                                      key={cls.id}
                                      className={`flex items-center space-x-2 px-1.5 py-1 rounded cursor-pointer transition text-xs select-none ${
                                        isChecked
                                          ? "bg-emerald-50 text-emerald-900 font-semibold"
                                          : "hover:bg-slate-100 text-slate-700"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleClass(cls.id)}
                                        className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 accent-emerald-600 cursor-pointer"
                                      />
                                      <span className="truncate">{cls.name}</span>
                                    </label>
                                  );
                                })}
                              </div>

                              <div className="text-[10px] text-slate-500 flex justify-between items-center pt-1 shrink-0">
                                <span>{validCheckedCount} of {classList.length} checked</span>
                                {validCheckedCount > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedClassIds([])}
                                    className="text-slate-400 hover:text-slate-600 underline cursor-pointer"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Group Selection Dropdown (Identified by User Red Marking) */}
                            <div className="pt-2 border-t border-slate-200 space-y-1.5 shrink-0">
                              <div className="flex items-center justify-between">
                                <div className="font-bold text-slate-900 text-xs">Group List</div>
                                {currentGroup !== "ALL" && (
                                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 uppercase">
                                    {currentGroup.replace("_", " ")}
                                  </span>
                                )}
                              </div>

                              <select
                                value={currentGroup}
                                onChange={(e) => handleGroupChange(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer truncate"
                              >
                                <option value="ALL">All Groups</option>
                                <option value="SCIENCE">Science</option>
                                <option value="HUMANITIES">Humanities</option>
                                <option value="BUSINESS_STUDIES">Business Studies</option>
                              </select>

                              <div className="text-[10px] text-slate-400">
                                {currentGroup === "ALL"
                                  ? "Universal & all streams"
                                  : `${currentGroup.replace("_", " ")} stream`}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. Month */}
                        <td className="p-3 bg-white align-top">
                          <div className="h-[340px] flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="font-bold text-slate-900 text-xs">Month List</div>
                              <select
                                value={selectedMonthKey}
                                onChange={(e) => onSelectMonth(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer truncate"
                              >
                                {MONTHS.map((m) => {
                                  const count = (monthlySchedule[m.key] || []).length;
                                  return (
                                    <option key={m.key} value={m.key}>
                                      {m.name} ({count} heads)
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                              <div className="flex items-center justify-between font-bold text-slate-900">
                                <span className="truncate">{activeMonthInfo.name} {currentSession}</span>
                                <span className="font-mono text-emerald-700 shrink-0">
                                  ৳{getMonthTotal(selectedMonthKey).toLocaleString()}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {activeMonthCatIds.length} Fee categories active
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 4. Fees Catagory */}
                        <td className="p-3 bg-white align-top">
                          <div className="h-[340px] flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="font-bold text-slate-900 text-xs">Catagories List</div>
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    onToggleCategoryForMonth(selectedMonthKey, e.target.value);
                                  }
                                }}
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-semibold cursor-pointer shadow-2xs focus:ring-2 focus:ring-emerald-500 truncate"
                              >
                                <option value="">-- Categories List dropdown --</option>
                                {categoriesList
                                  .filter((cat) => {
                                    if (currentGroup === "ALL") return true;
                                    return !cat.groupType || cat.groupType === "ALL" || cat.groupType === currentGroup;
                                  })
                                  .map((cat) => {
                                    const isChecked = activeMonthCatIds.includes(cat.id);
                                    return (
                                      <option key={cat.id} value={cat.id}>
                                        {isChecked ? "✓ " : "+ "} {cat.name} (৳{cat.amount.toLocaleString()})
                                        {cat.groupType && cat.groupType !== "ALL" ? ` [${cat.groupType}]` : ""}
                                      </option>
                                    );
                                  })}
                              </select>
                            </div>

                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Selected Heads:</span>
                                <span className="font-bold text-emerald-700 font-mono">
                                  {activeMonthCatIds.length} of {categoriesList.length}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Pick category above to toggle for {activeMonthInfo.name}.
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 5. Selected Catagories */}
                        <td className="p-3 bg-white align-top">
                          <div className="h-[340px] flex flex-col">
                            <div className="flex items-center justify-between mb-1.5 shrink-0">
                              <span className="font-bold text-slate-900 text-xs">Show list</span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                {activeMonthCatIds.length} Selected
                              </span>
                            </div>

                            {/* Rigid Fixed-height scrollable list (Never changes card size when categories are added or removed) */}
                            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                              {activeMonthCatIds.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-400 italic">
                                  <span>No categories selected yet.</span>
                                  <span className="text-[10px] text-slate-500 mt-1">
                                    Pick from dropdown to add.
                                  </span>
                                </div>
                              ) : (
                                categoriesList
                                  .filter((cat) => activeMonthCatIds.includes(cat.id))
                                  .map((cat) => (
                                    <div
                                      key={cat.id}
                                      className="flex items-center justify-between p-1.5 rounded-md bg-white border border-slate-200 hover:border-emerald-300 text-xs shadow-2xs"
                                    >
                                      <div className="min-w-0 pr-1 truncate">
                                        <div className="font-semibold text-slate-800 truncate" title={cat.name}>
                                          {cat.name}
                                        </div>
                                        {cat.groupType && cat.groupType !== "ALL" && (
                                          <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1 rounded">
                                            {cat.groupType}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-1.5 shrink-0">
                                        <span className="font-mono font-bold text-slate-900 text-[11px]">
                                          ৳{cat.amount.toLocaleString()}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => onToggleCategoryForMonth(selectedMonthKey, cat.id)}
                                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50 transition cursor-pointer"
                                          title={`Remove ${cat.name}`}
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 6. Total */}
                        <td className="p-3 bg-white align-top text-center">
                          <div className="h-[340px] flex flex-col items-center justify-center space-y-2">
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                              Total
                            </div>
                            <div className="text-2xl font-black font-mono text-emerald-700 tracking-tight">
                              ৳{getMonthTotal(selectedMonthKey).toLocaleString()}
                            </div>
                            <div className="text-[11px] text-slate-600 font-semibold">
                              ({categoriesList.filter((cat) => activeMonthCatIds.includes(cat.id) && (currentGroup === "ALL" || !cat.groupType || cat.groupType === "ALL" || cat.groupType === currentGroup)).length} Fee Heads)
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Monthly Fee per Student {currentGroup !== "ALL" ? `(${currentGroup.replace("_", " ")})` : ""}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW MODE A: CATAGORY SETUP (TWO COLUMNS: ALL VS ACTIVE)
             ======================================================== */}
          {viewMode === "CATEGORY_SETUP" && (
            <div className="space-y-4">
              {/* Category Setup Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                    Catagory Setup
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Master Catalog &amp; Active Heads
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Manage all institutional fee heads and assign active billing categories for <strong>{activeMonthInfo.name} {currentSession}</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Active Cycle Month Selector */}
                  <div className="flex items-center space-x-1.5 text-xs bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 font-medium">Cycle Month:</span>
                    <select
                      value={selectedMonthKey}
                      onChange={(e) => onSelectMonth(e.target.value)}
                      className="font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer text-xs"
                    >
                      {MONTHS.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.name} ({(monthlySchedule[m.key] || []).length} heads)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Button to Add Category */}
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Catagory</span>
                  </button>
                </div>
              </div>

              {/* Two Column Layout: "All Catagory list" and "Active Catagory list" */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* COLUMN 1: All Catagory list */}
                <div className="border border-slate-200 rounded-xl bg-white shadow-2xs flex flex-col overflow-hidden">
                  <div className="p-3 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-slate-700" />
                      <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                        All Catagory list
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {categoriesList.length} Categories
                    </span>
                  </div>

                  {/* Scrollable List of All Categories */}
                  <div className="p-3 space-y-2 overflow-y-auto max-h-[380px] flex-1 bg-slate-50/30">
                    {categoriesList.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400 italic">
                        No categories found. Click &ldquo;+ Add Catagory&rdquo; above.
                      </div>
                    ) : (
                      categoriesList.map((cat) => {
                        const isActive = activeMonthCatIds.includes(cat.id);
                        return (
                          <div
                            key={cat.id}
                            className={`p-2.5 rounded-lg border transition flex items-center justify-between gap-2 shadow-2xs ${
                              isActive
                                ? "bg-emerald-50/50 border-emerald-200"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div
                              className="min-w-0 flex-1 cursor-pointer group"
                              onClick={() => openEditModal(cat)}
                              title={`Click to edit name & fee for "${cat.name}"`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-xs text-slate-900 truncate group-hover:text-emerald-700 transition" title={cat.name}>
                                  {cat.name}
                                </span>
                                {cat.groupType && cat.groupType !== "ALL" && (
                                  <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                    {cat.groupType}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                                <span className="font-mono font-bold text-slate-800 group-hover:text-emerald-700 transition">
                                  ৳{cat.amount.toLocaleString()}
                                </span>
                                <span>•</span>
                                <span className="uppercase text-[9px] font-semibold text-slate-400">
                                  {cat.type}
                                </span>
                                <span className="text-[10px] text-emerald-600 opacity-0 group-hover:opacity-100 transition font-sans font-medium flex items-center gap-0.5 ml-1">
                                  <Pencil className="w-2.5 h-2.5 inline" /> Edit
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0">
                              {isActive ? (
                                <button
                                  type="button"
                                  onClick={() => onToggleCategoryForMonth(selectedMonthKey, cat.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-md transition cursor-pointer"
                                  title={`Active for ${activeMonthInfo.name}. Click to remove.`}
                                >
                                  <Check className="w-3 h-3 text-emerald-700" />
                                  <span>Active</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onToggleCategoryForMonth(selectedMonthKey, cat.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-xs font-medium rounded-md transition cursor-pointer"
                                  title={`Add to ${activeMonthInfo.name} active list`}
                                >
                                  <Plus className="w-3 h-3 text-slate-500" />
                                  <span>Activate</span>
                                </button>
                              )}

                              {/* Edit Category Name & Fee */}
                              <button
                                type="button"
                                onClick={() => openEditModal(cat)}
                                className="flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-800 text-xs font-medium rounded-md transition cursor-pointer"
                                title={`Edit name & fee for "${cat.name}"`}
                              >
                                <Pencil className="w-3 h-3 text-slate-500" />
                                <span className="text-[11px]">Edit</span>
                              </button>

                              {/* Delete Category action */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Delete fee category "${cat.name}" from template?`)) {
                                    onDeleteCategory(cat.id);
                                  }
                                }}
                                className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition cursor-pointer"
                                title={`Delete ${cat.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Column Footer */}
                  <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-2">
                      <span>{categoriesList.length} Total Master Heads</span>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Reset fee categories to the 31 standard Bangladeshi Board / College categories?")) {
                            onResetToDefaults();
                          }
                        }}
                        className="text-slate-600 hover:text-emerald-700 font-semibold cursor-pointer flex items-center gap-1 transition"
                        title="Reset to 31 standard Bangladeshi categories"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-500" />
                        Reset (31)
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="text-emerald-700 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add New Head
                    </button>
                  </div>
                </div>

                {/* COLUMN 2: Active Catagory list */}
                <div className="border border-slate-200 rounded-xl bg-white shadow-2xs flex flex-col overflow-hidden">
                  <div className="p-3 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-2">
                      <CheckSquare className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-emerald-950 text-xs uppercase tracking-wide">
                        Active Catagory list
                      </span>
                      <span className="text-[10px] text-emerald-800 font-semibold">
                        ({activeMonthInfo.name})
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-900 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                      {activeMonthCatIds.length} Active
                    </span>
                  </div>

                  {/* Scrollable List of Active Categories */}
                  <div className="p-3 space-y-2 overflow-y-auto max-h-[380px] flex-1 bg-slate-50/30">
                    {activeMonthCatIds.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400 italic">
                        No active categories for {activeMonthInfo.name}.
                        <div className="text-[10px] text-slate-500 mt-1">
                          Click &ldquo;Activate&rdquo; from the All Category list on the left to add.
                        </div>
                      </div>
                    ) : (
                      categoriesList
                        .filter((cat) => activeMonthCatIds.includes(cat.id))
                        .map((cat) => (
                          <div
                            key={cat.id}
                            className="p-2.5 rounded-lg border border-emerald-200 bg-white hover:border-emerald-300 shadow-2xs flex items-center justify-between gap-2"
                          >
                            <div
                              className="min-w-0 flex-1 cursor-pointer group"
                              onClick={() => openEditModal(cat)}
                              title={`Click to edit name & fee for "${cat.name}"`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-xs text-slate-900 truncate group-hover:text-emerald-700 transition" title={cat.name}>
                                  {cat.name}
                                </span>
                                {cat.groupType && cat.groupType !== "ALL" && (
                                  <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                    {cat.groupType}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-[11px] font-mono font-bold text-emerald-700 mt-0.5">
                                <span>৳{cat.amount.toLocaleString()}</span>
                                <span className="text-[10px] text-emerald-600 opacity-0 group-hover:opacity-100 transition font-sans font-medium flex items-center gap-0.5 ml-1">
                                  <Pencil className="w-2.5 h-2.5 inline" /> Edit
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              {/* Edit Category Name & Fee */}
                              <button
                                type="button"
                                onClick={() => openEditModal(cat)}
                                className="flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-800 text-xs font-medium rounded-md transition cursor-pointer"
                                title={`Edit name & fee for "${cat.name}"`}
                              >
                                <Pencil className="w-3 h-3 text-slate-500" />
                                <span className="text-[11px]">Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onToggleCategoryForMonth(selectedMonthKey, cat.id)}
                                className="flex items-center gap-1 px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-md text-xs font-semibold cursor-pointer transition"
                                title={`Remove ${cat.name} from active list`}
                              >
                                <X className="w-3 h-3" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>

                  {/* Column Footer */}
                  <div className="p-2.5 bg-emerald-50/60 border-t border-emerald-100 flex items-center justify-between shrink-0 text-xs">
                    <div>
                      <span className="text-slate-500 text-[11px]">Monthly Total: </span>
                      <strong className="font-mono font-bold text-emerald-800 text-sm">
                        ৳{getMonthTotal(selectedMonthKey).toLocaleString()}
                      </strong>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => onBatchToggleMonth(selectedMonthKey, true)}
                        className="text-[11px] text-emerald-700 font-semibold hover:underline cursor-pointer"
                      >
                        Check All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => onBatchToggleMonth(selectedMonthKey, false)}
                        className="text-[11px] text-slate-500 hover:text-rose-600 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW MODE B: 12-MONTH FULL CHECKBOX MATRIX GRID
             ======================================================== */}
          {viewMode === "MATRIX_GRID" && (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Full 12-Month Academic Fee Checkbox Matrix
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Click any checkbox to easily add/remove a fee category for that specific month.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {categoriesList.length} Total Fee Heads
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 min-w-[200px]">Fee Category</th>
                      <th className="py-2.5 px-2 text-right">Amount (৳)</th>
                      {MONTHS.map((m) => {
                        const isCurMonth = m.key === selectedMonthKey;
                        const allChecked = categoriesList.every((cat) =>
                          (monthlySchedule[m.key] || []).includes(cat.id)
                        );

                        return (
                          <th
                            key={m.key}
                            className={`py-2.5 px-2 text-center min-w-[50px] ${
                              isCurMonth ? "bg-emerald-50/80 text-emerald-800" : ""
                            }`}
                          >
                            <div className="font-bold">{m.short}</div>
                            {/* Header toggle all checkbox */}
                            <button
                              type="button"
                              onClick={() => onBatchToggleMonth(m.key, !allChecked)}
                              className="text-[9px] text-slate-400 hover:text-emerald-700 font-normal underline block mx-auto cursor-pointer"
                              title={`Toggle all categories for ${m.name}`}
                            >
                              {allChecked ? "None" : "All"}
                            </button>
                          </th>
                        );
                      })}
                      <th className="py-2.5 px-2 text-center">Toggle Year</th>
                      <th className="py-2.5 px-2 text-center">Edit</th>
                      <th className="py-2.5 px-2 text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categoriesList.map((cat) => {
                      const enabledMonthsCount = MONTHS.filter((m) =>
                        (monthlySchedule[m.key] || []).includes(cat.id)
                      ).length;
                      const allYearChecked = enabledMonthsCount === 12;

                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">{cat.name}</div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-800">
                            ৳ {cat.amount.toLocaleString()}
                          </td>

                          {/* 12 Month Checkbox Cells */}
                          {MONTHS.map((m) => {
                            const isChecked = (monthlySchedule[m.key] || []).includes(cat.id);
                            const isCurMonth = m.key === selectedMonthKey;

                            return (
                              <td
                                key={m.key}
                                className={`py-2 px-2 text-center ${
                                  isCurMonth ? "bg-emerald-50/30" : ""
                                }`}
                              >
                                <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => onToggleCategoryForMonth(m.key, cat.id)}
                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer accent-emerald-600"
                                  />
                                </label>
                              </td>
                            );
                          })}

                          {/* Full Year Toggle Action */}
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                onBatchToggleCategoryAcrossYear(cat.id, !allYearChecked)
                              }
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer transition ${
                                allYearChecked
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                              title="Toggle this category for all 12 months"
                            >
                              {allYearChecked ? "All 12m" : `${enabledMonthsCount}/12`}
                            </button>
                          </td>

                          {/* Edit Category Action */}
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => openEditModal(cat)}
                              className="text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 p-1 rounded-md transition cursor-pointer"
                              title={`Edit name and fee for ${cat.name}`}
                            >
                              <Pencil className="w-3.5 h-3.5 mx-auto" />
                            </button>
                          </td>

                          {/* Delete Category Action */}
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete fee category "${cat.name}" from template?`)) {
                                  onDeleteCategory(cat.id);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition cursor-pointer"
                              title={`Delete ${cat.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td className="py-2.5 px-3 text-slate-700">Monthly Total (৳)</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-500">-</td>
                      {MONTHS.map((m) => {
                        const total = getMonthTotal(m.key);
                        const isCurMonth = m.key === selectedMonthKey;

                        return (
                          <td
                            key={m.key}
                            className={`py-2.5 px-2 text-center font-mono text-[11px] ${
                              isCurMonth ? "bg-emerald-100 text-emerald-900" : "text-slate-800"
                            }`}
                          >
                            ৳{total.toLocaleString()}
                          </td>
                        );
                      })}
                      <td></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
    </div>
  );

  // Child Modals renderer (Add Category Modal & Copy Modal)
  const renderChildModals = () => (
    <>
      {/* ========================================================
          ADD FEE CATEGORY MODAL (WITH CHECKBOXES FOR EVERY MONTH)
         ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Add New Fee Category</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Model Test Exam Fee, Scout & Red Crescent, Picnic Fee"
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Standard Amount (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newCatAmount}
                    onChange={(e) => setNewCatAmount(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Fee Head Type
                  </label>
                  <select
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  >
                    <option value="TUITION">Tuition (Academic)</option>
                    <option value="EXAM">Exam / Assessment</option>
                    <option value="LAB">Lab / Practical</option>
                    <option value="SESSION">Session / Annual</option>
                    <option value="ACTIVITY">Activity / Extra-curricular</option>
                    <option value="OTHER">Other Institutional Charge</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Applicable Group
                  </label>
                  <select
                    value={newCatGroup}
                    onChange={(e) => setNewCatGroup(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  >
                    <option value="ALL">All Enrolled Students</option>
                    <option value="SCIENCE">Science Group Only</option>
                    <option value="HUMANITIES">Humanities Only</option>
                    <option value="BUSINESS_STUDIES">Business Studies Only</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="Short description..."
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Checkboxes for Every Month */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 block">
                    Select Months to Add This Category (Checkbox Selection):
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setNewCatMonths(MONTHS.map((m) => m.key))}
                      className="text-emerald-700 font-semibold hover:underline"
                    >
                      All 12 Months
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setNewCatMonths(["MAR", "JUN", "OCT", "DEC"])}
                      className="text-indigo-700 font-semibold hover:underline"
                    >
                      Quarterly
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setNewCatMonths([])}
                      className="text-slate-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {MONTHS.map((m) => {
                    const isChecked = newCatMonths.includes(m.key);
                    return (
                      <label
                        key={m.key}
                        className={`flex items-center space-x-1.5 p-2 rounded border cursor-pointer select-none transition ${
                          isChecked
                            ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleModalMonth(m.key)}
                          className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 accent-emerald-600"
                        />
                        <span className="text-xs">{m.short}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400">
                  {newCatMonths.length} month(s) selected. This fee will be automatically scheduled for checked months.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCatName.trim() || newCatAmount <= 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Add Category to Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          COPY SETUP MODAL (CHECKBOX LIST FOR MONTHS)
         ======================================================== */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Copy {activeMonthInfo.name} Fee Structure
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <p className="text-slate-600">
                Replicate the {activeMonthCatIds.length} categories currently checked for{" "}
                <strong>{activeMonthInfo.name}</strong> to the following target months:
              </p>

              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                {MONTHS.map((m) => {
                  const isSource = m.key === selectedMonthKey;
                  const isChecked = targetCopyMonths.includes(m.key);

                  return (
                    <label
                      key={m.key}
                      className={`flex items-center space-x-1.5 p-2 rounded border transition ${
                        isSource
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          : isChecked
                          ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold cursor-pointer"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={isSource}
                        checked={isSource || isChecked}
                        onChange={() => toggleCopyMonth(m.key)}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 accent-indigo-600 cursor-pointer"
                      />
                      <span className="truncate">
                        {m.name} {isSource ? "(Source)" : ""}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{targetCopyMonths.length} target month(s) selected</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setTargetCopyMonths(
                        MONTHS.filter((m) => m.key !== selectedMonthKey).map((m) => m.key)
                      )
                    }
                    className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setTargetCopyMonths([])}
                    className="text-slate-500 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteCopy}
                disabled={targetCopyMonths.length === 0}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Apply to Selected Months
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT CATEGORY MODAL (CHANGE NAME, FEE, TYPE, GROUP)
         ======================================================== */}
      {editingCategory && (
        <div className="fixed inset-0 z-[75] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Edit Fee Category
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Change category name and standard fee amount
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategorySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  placeholder="e.g. Monthly Current Tuition Fee"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 font-semibold"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Standard Fee (৳) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold">৳</span>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editCatAmount}
                      onChange={(e) => setEditCatAmount(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Fee Head Type
                  </label>
                  <select
                    value={editCatType}
                    onChange={(e) => setEditCatType(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  >
                    <option value="TUITION">Tuition (Academic)</option>
                    <option value="EXAM">Exam / Assessment</option>
                    <option value="LAB">Lab / Practical</option>
                    <option value="SESSION">Session / Annual</option>
                    <option value="ACTIVITY">Activity / Extra-curricular</option>
                    <option value="OTHER">Other Institutional Charge</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Applicable Group
                  </label>
                  <select
                    value={editCatGroup}
                    onChange={(e) => setEditCatGroup(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  >
                    <option value="ALL">All Enrolled Students</option>
                    <option value="SCIENCE">Science Group Only</option>
                    <option value="HUMANITIES">Humanities Only</option>
                    <option value="BUSINESS_STUDIES">Business Studies Only</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={editCatDesc}
                    onChange={(e) => setEditCatDesc(e.target.value)}
                    placeholder="Short description..."
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editCatName.trim() || editCatAmount < 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  // If used as Modal Window
  if (isModal) {
    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150 no-print"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
      >
        {/* Save Toast Notification */}
        {saveToast && (
          <div className="fixed top-6 right-6 z-[140] bg-emerald-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 border border-emerald-500 animate-in fade-in slide-in-from-top-4 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveToast}</span>
          </div>
        )}

        <div
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl min-h-[620px] max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
        >
          {/* Modal Top Header Bar */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  Fees Setup
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {currentSession} Session
                  </span>
                </h2>
                <p className="text-[11px] text-slate-300">
                  Configure student tuition fees, category heads, and monthly distribution matrices
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Switcher inside Modal */}
              <div className="hidden sm:flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("SETUP_TABLE")}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    viewMode === "SETUP_TABLE"
                      ? "bg-emerald-600 text-white font-semibold shadow-xs"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Fee Setup Table
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("CATEGORY_SETUP")}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    viewMode === "CATEGORY_SETUP"
                      ? "bg-emerald-600 text-white font-semibold shadow-xs"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Catagory Setup
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("MATRIX_GRID")}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    viewMode === "MATRIX_GRID"
                      ? "bg-emerald-600 text-white font-semibold shadow-xs"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  12-Month Matrix
                </button>
              </div>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition cursor-pointer ml-1"
                  title="Close Window (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Modal Body: Exact Wireframe Table matching user image */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-50/50 space-y-4">
            {renderViewsContent()}
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span>Active Cycle: <strong className="font-bold text-slate-800">{activeMonthInfo.name}</strong></span>
              <span>•</span>
              <span>Standard Monthly Fee: <strong className="font-bold text-emerald-700">৳{getMonthTotal(selectedMonthKey).toLocaleString()}</strong></span>
              <span className="text-[11px] text-slate-400">({activeMonthCatIds.length} fee heads active)</span>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {/* Save Button (Before Done & Close) */}
              <button
                type="button"
                onClick={handleSaveSetup}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition active:scale-95"
                title="Save Fee Setup"
              >
                {isSavedJustNow ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </>
                )}
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition active:scale-95"
                >
                  Done &amp; Close
                </button>
              )}
            </div>
          </div>

          {/* Child Modals */}
          {renderChildModals()}
        </div>
      </div>
    );
  }

  // Standard inline rendering (when not used as modal)
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm no-print">
      {/* CARD HEADER & COMPACT ACCORDION TOGGLE */}
      <div className="p-4 bg-gradient-to-r from-slate-50 via-white to-emerald-50/30 border-b border-slate-200 rounded-t-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                Fee Setup
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Setup Matrix
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Set up student fees across academic sessions, classes, and months with customizable category rates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Active Month Indicator */}
          <div className="hidden sm:flex items-center space-x-1.5 text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-slate-500 font-medium">Active Cycle:</span>
            <span className="font-bold text-emerald-700">{activeMonthInfo.name}</span>
            <span className="text-[11px] text-slate-400">({activeMonthCatIds.length} heads • ৳{getMonthTotal(selectedMonthKey).toLocaleString()})</span>
          </div>

          {/* Add Category Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Fee Category</span>
          </button>

          {/* Toggle View Mode */}
          {isExpanded && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("SETUP_TABLE")}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  viewMode === "SETUP_TABLE"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Fee Setup Table View"
              >
                Fee Setup Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("CATEGORY_SETUP")}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  viewMode === "CATEGORY_SETUP"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Category Setup View"
              >
                Catagory Setup
              </button>
              <button
                type="button"
                onClick={() => setViewMode("MATRIX_GRID")}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  viewMode === "MATRIX_GRID"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="View full 12-month checkbox matrix"
              >
                12-Month Matrix
              </button>
            </div>
          )}

          {/* Collapse/Expand button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            title={isExpanded ? "Collapse Template" : "Expand Template"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {renderViewsContent()}
        </div>
      )}

      {renderChildModals()}
    </div>
  );
}

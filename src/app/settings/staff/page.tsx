"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserPlus,
  Search,
  Filter,
  Download,
  Printer,
  Edit2,
  Trash2,
  Eye,
  Phone,
  Mail,
  GraduationCap,
  Building2,
  Award,
  BookOpen,
  Calendar,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  X,
  RotateCcw,
  Plus,
  Briefcase,
  IdCard,
  SlidersHorizontal,
  ChevronRight,
  School,
  ExternalLink,
} from "lucide-react";
import { SettingNavHeader } from "../SettingNavHeader";
import { SessionSelect } from "@/components/SessionSelect";
import {
  TeacherStaffMember,
  StaffCategory,
  MpoStatus,
  StaffStatus,
  getStoredStaffList,
  saveStoredStaffList,
  resetStaffListToDefault,
} from "@/lib/staffStore";
import { getStoredSchoolInfo } from "@/lib/settingsStore";

export default function TeacherStaffInfoPage() {
  const [staffList, setStaffList] = useState<TeacherStaffMember[]>([]);
  const [schoolInfo, setSchoolInfo] = useState({
    name: "Dhaka Ideal Model High School & College",
    eiin: "108254",
    board: "Dhaka",
    academicYear: "2026",
    headTitle: "Principal",
    headName: "Prof. A. K. M. Shamsuddin",
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | StaffCategory>("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [selectedMpoStatus, setSelectedMpoStatus] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Modals & Dossier states
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<TeacherStaffMember | null>(null);
  const [selectedDossier, setSelectedDossier] = useState<TeacherStaffMember | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form tab
  const [formTab, setFormTab] = useState<"identity" | "employment" | "academics" | "contact">("identity");

  // Form State
  const initialFormState: TeacherStaffMember = {
    id: "",
    staffId: "",
    mpoIndex: "",
    name: "",
    nameBn: "",
    gender: "MALE",
    bloodGroup: "B+",
    nid: "",
    dateOfBirth: "",
    joiningDate: new Date().toISOString().split("T")[0],
    category: "TEACHING",
    designation: "",
    department: "Mathematics & Science",
    mpoStatus: "MPO_ENLISTED",
    salaryGrade: "Grade 9 (NPS)",
    education: "",
    assignedSubjects: [],
    assignedClasses: [],
    isClassTeacher: false,
    classTeacherOf: "",
    phone: "",
    email: "",
    emergencyContact: "",
    address: "",
    status: "ACTIVE",
  };
  const [formData, setFormData] = useState<TeacherStaffMember>(initialFormState);
  const [subjectInput, setSubjectInput] = useState("");
  const [classInput, setClassInput] = useState("");

  useEffect(() => {
    setStaffList(getStoredStaffList());
    const inst = getStoredSchoolInfo();
    if (inst) {
      setSchoolInfo({
        name: inst.name || "Dhaka Ideal Model High School & College",
        eiin: inst.eiin || "108254",
        board: inst.board || "Dhaka",
        academicYear: inst.academicYear || "2026",
        headTitle: inst.headTitle || "Principal",
        headName: inst.headName || "Prof. A. K. M. Shamsuddin",
      });
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Departments List
  const departments = useMemo(() => {
    const set = new Set<string>();
    staffList.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set).sort();
  }, [staffList]);

  // Filtered List
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      // Session filter
      if (selectedSession !== "ALL") {
        const yearPrefix = parseInt(selectedSession.slice(0, 4), 10);
        const joiningYear = parseInt(staff.joiningDate?.slice(0, 4) || "0", 10);
        if (joiningYear > yearPrefix) return false;
      }
      // Category filter
      if (selectedCategory !== "ALL" && staff.category !== selectedCategory) {
        return false;
      }
      // Department filter
      if (selectedDepartment !== "ALL" && staff.department !== selectedDepartment) {
        return false;
      }
      // MPO Status filter
      if (selectedMpoStatus !== "ALL" && staff.mpoStatus !== selectedMpoStatus) {
        return false;
      }
      // Service Status filter
      if (selectedStatus !== "ALL" && staff.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = staff.name.toLowerCase().includes(q);
        const matchNameBn = staff.nameBn.toLowerCase().includes(q);
        const matchStaffId = staff.staffId.toLowerCase().includes(q);
        const matchMpo = staff.mpoIndex.toLowerCase().includes(q);
        const matchDesignation = staff.designation.toLowerCase().includes(q);
        const matchPhone = staff.phone.toLowerCase().includes(q);
        const matchSubjects = staff.assignedSubjects.some((sub) =>
          sub.toLowerCase().includes(q)
        );
        return (
          matchName ||
          matchNameBn ||
          matchStaffId ||
          matchMpo ||
          matchDesignation ||
          matchPhone ||
          matchSubjects
        );
      }
      return true;
    });
  }, [staffList, selectedSession, selectedCategory, selectedDepartment, selectedMpoStatus, selectedStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = staffList.length;
    const teaching = staffList.filter((s) => s.category === "TEACHING").length;
    const nonTeaching = staffList.filter((s) => s.category === "NON_TEACHING").length;
    const mpo = staffList.filter((s) => s.mpoStatus === "MPO_ENLISTED").length;
    const nonMpo = staffList.filter((s) => s.mpoStatus !== "MPO_ENLISTED").length;
    const male = staffList.filter((s) => s.gender === "MALE").length;
    const female = staffList.filter((s) => s.gender === "FEMALE").length;
    return { total, teaching, nonTeaching, mpo, nonMpo, male, female };
  }, [staffList]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingStaff(null);
    const nextNum = staffList.length + 1;
    setFormData({
      ...initialFormState,
      id: `staff-${Date.now()}`,
      staffId: `TCH-${String(nextNum).padStart(3, "0")}`,
      mpoIndex: "MPO-" + Math.floor(100000 + Math.random() * 900000),
    });
    setSubjectInput("");
    setClassInput("");
    setFormTab("identity");
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (staff: TeacherStaffMember) => {
    setEditingStaff(staff);
    setFormData({ ...staff });
    setSubjectInput(staff.assignedSubjects.join(", "));
    setClassInput(staff.assignedClasses.join(", "));
    setFormTab("identity");
    setIsAddEditModalOpen(true);
  };

  // Save Staff (Add or Edit)
  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Please provide the staff member's full name.");
      setFormTab("identity");
      return;
    }
    if (!formData.designation.trim()) {
      showToast("Please specify an official designation.");
      setFormTab("employment");
      return;
    }
    if (!formData.phone.trim()) {
      showToast("Please enter a valid primary mobile contact.");
      setFormTab("contact");
      return;
    }

    // Parse subjects & classes
    const subjects = subjectInput
      ? subjectInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : formData.assignedSubjects;

    const classes = classInput
      ? classInput
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : formData.assignedClasses;

    const updatedRecord: TeacherStaffMember = {
      ...formData,
      assignedSubjects: subjects,
      assignedClasses: classes,
    };

    let updatedList: TeacherStaffMember[];
    if (editingStaff) {
      updatedList = staffList.map((s) => (s.id === editingStaff.id ? updatedRecord : s));
      showToast(`Updated record for ${updatedRecord.name}`);
    } else {
      updatedList = [updatedRecord, ...staffList];
      showToast(`Added new staff member: ${updatedRecord.name}`);
    }

    setStaffList(updatedList);
    saveStoredStaffList(updatedList);
    setIsAddEditModalOpen(false);
  };

  // Delete Staff
  const handleDeleteStaff = (staff: TeacherStaffMember) => {
    if (confirm(`Are you sure you want to delete ${staff.name} (${staff.designation}) from the official roster?`)) {
      const updatedList = staffList.filter((s) => s.id !== staff.id);
      setStaffList(updatedList);
      saveStoredStaffList(updatedList);
      showToast(`Deleted ${staff.name} from records.`);
      if (selectedDossier?.id === staff.id) {
        setSelectedDossier(null);
      }
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (confirm("Reset teacher & staff roster to Bangladeshi NCTB default master list?")) {
      const reset = resetStaffListToDefault();
      setStaffList(reset);
      showToast("Roster reset to standard default faculty list.");
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      "Sl No",
      "Staff ID",
      "MPO Index",
      "Name (English)",
      "Name (Bangla)",
      "Gender",
      "Blood Group",
      "NID",
      "Category",
      "Designation",
      "Department",
      "MPO Status",
      "Salary Grade",
      "Education",
      "Assigned Subjects",
      "Assigned Classes",
      "Is Class Teacher",
      "Class Teacher Of",
      "Mobile Phone",
      "Email",
      "Joining Date",
      "Address",
      "Status",
    ];

    const rows = filteredStaff.map((s, idx) => [
      idx + 1,
      `"${s.staffId}"`,
      `"${s.mpoIndex}"`,
      `"${s.name}"`,
      `"${s.nameBn}"`,
      `"${s.gender}"`,
      `"${s.bloodGroup}"`,
      `"${s.nid}"`,
      `"${s.category}"`,
      `"${s.designation}"`,
      `"${s.department}"`,
      `"${s.mpoStatus}"`,
      `"${s.salaryGrade}"`,
      `"${s.education}"`,
      `"${s.assignedSubjects.join("; ")}"`,
      `"${s.assignedClasses.join("; ")}"`,
      s.isClassTeacher ? "YES" : "NO",
      `"${s.classTeacherOf || ""}"`,
      `"${s.phone}"`,
      `"${s.email}"`,
      `"${s.joiningDate}"`,
      `"${s.address}"`,
      `"${s.status}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Teacher_and_Staff_Roster_${schoolInfo.eiin}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Master Staff CSV downloaded successfully!");
  };

  // Print Roster
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Setting Module Segmented Navigation */}
      <SettingNavHeader />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-500/40 flex items-center space-x-3 transition-all animate-bounce no-print">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Institutional Context & Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-widest font-semibold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-md border border-cyan-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              EIIN: {schoolInfo.eiin} • {schoolInfo.board} Board
            </span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold px-2 py-0.5 rounded">
              Academic Session {schoolInfo.academicYear}
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-2.5 flex items-center space-x-2.5">
            <UserCheck className="w-6 h-6 text-cyan-400" />
            <span>Teacher and Staff Information</span>
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Official institutional faculty & staff directory • BANBEIS & MPO index registry • Academic subject teaching load, class teachers & contact records.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center space-x-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="Reset roster to default Bangladeshi teachers & staff dataset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Default</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="Download CSV workbook for BANBEIS or spreadsheet processing"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="Print official master staff roster with institutional signature blocks"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Print Roster</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-600/30 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add New Personnel</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 no-print">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Personnel
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {stats.total} <span className="text-xs font-normal text-slate-500">Active</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Teaching Faculty
            </div>
            <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
              {stats.teaching} <span className="text-xs font-normal text-slate-500">Teachers</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Non-Teaching Staff
            </div>
            <div className="text-xl font-extrabold text-indigo-700 mt-0.5">
              {stats.nonTeaching} <span className="text-xs font-normal text-slate-500">Office/MLSS</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              MPO Enlisted
            </div>
            <div className="text-xl font-extrabold text-amber-700 mt-0.5">
              {stats.mpo} <span className="text-xs font-normal text-slate-500">Govt Index</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Gender Distribution
            </div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">
              <span className="text-sky-600">{stats.male} Male</span> •{" "}
              <span className="text-rose-600">{stats.female} Female</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search, Filter Toolbar & View Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by teacher name, index no, staff ID, mobile, designation, or subject..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-white text-cyan-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({staffList.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("TEACHING")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedCategory === "TEACHING"
                  ? "bg-white text-emerald-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Teaching Staff ({stats.teaching})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("NON_TEACHING")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedCategory === "NON_TEACHING"
                  ? "bg-white text-indigo-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Support Staff ({stats.nonTeaching})
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "cards"
                  ? "bg-white text-cyan-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Directory Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-cyan-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Official Table Roster
            </button>
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Session Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">Session:</span>
            <SessionSelect
              value={selectedSession}
              onChange={(val) => setSelectedSession(val)}
              selectClassName="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 text-xs font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 text-xs font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Departments ({departments.length})</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* MPO Status Filter */}
          <select
            value={selectedMpoStatus}
            onChange={(e) => setSelectedMpoStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 text-xs font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All MPO Categories</option>
            <option value="MPO_ENLISTED">MPO Enlisted (Govt Subsidized)</option>
            <option value="NON_MPO">Non-MPO (School Payroll)</option>
            <option value="CONTRACTUAL">Contractual</option>
            <option value="PART_TIME">Part-Time / Guest</option>
          </select>

          {/* Service Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 text-xs font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Service Status</option>
            <option value="ACTIVE">Active in Service</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="RETIRED">Retired</option>
          </select>

          {/* Clear Filters */}
          {(selectedSession !== "ALL" ||
            selectedCategory !== "ALL" ||
            selectedDepartment !== "ALL" ||
            selectedMpoStatus !== "ALL" ||
            selectedStatus !== "ALL" ||
            searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedSession("ALL");
                setSelectedCategory("ALL");
                setSelectedDepartment("ALL");
                setSelectedMpoStatus("ALL");
                setSelectedStatus("ALL");
                setSearchQuery("");
              }}
              className="text-cyan-700 hover:text-cyan-900 font-bold ml-auto flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}

          <div className="text-slate-500 font-mono text-[11px] ml-auto">
            Showing <span className="font-bold text-slate-900">{filteredStaff.length}</span> of{" "}
            {staffList.length} staff records
          </div>
        </div>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block mb-6 border-b pb-4 text-center">
        <h1 className="text-xl font-bold uppercase">{schoolInfo.name}</h1>
        <p className="text-xs text-slate-600">
          EIIN: {schoolInfo.eiin} • Board: {schoolInfo.board} • Academic Year: {schoolInfo.academicYear}
        </p>
        <h2 className="text-sm font-bold uppercase tracking-wider mt-2 border-y py-1 inline-block">
          Official Teacher & Staff Master Directory (BANBEIS Compliant)
        </h2>
        <div className="text-[10px] text-slate-500 mt-1">
          Printed on: {new Date().toLocaleDateString("en-GB")} | Total Personnel: {filteredStaff.length}
        </div>
      </div>

      {/* DIRECTORY CARDS VIEW */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
          {filteredStaff.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No personnel match your query</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing search terms or resetting filters to view all institutional staff members.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSelectedDepartment("ALL");
                  setSelectedMpoStatus("ALL");
                  setSelectedStatus("ALL");
                  setSearchQuery("");
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            filteredStaff.map((staff) => {
              const isTeaching = staff.category === "TEACHING";
              const isMpo = staff.mpoStatus === "MPO_ENLISTED";

              return (
                <div
                  key={staff.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
                >
                  <div className="space-y-3.5">
                    {/* Card Top: Badges & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {staff.staffId}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isMpo
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {staff.mpoIndex}
                        </span>
                        {staff.isClassTeacher && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Class Teacher
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          staff.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {staff.status}
                      </span>
                    </div>

                    {/* Staff Profile Header */}
                    <div className="flex items-start space-x-3">
                      {/* Avatar initials */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shrink-0 shadow-xs ${
                          isTeaching
                            ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                            : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
                        }`}
                      >
                        {staff.name
                          .split(" ")
                          .filter((w) => !w.includes("."))
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("") || "T"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-cyan-700 transition-colors truncate">
                          {staff.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-bengali truncate mt-0.5">
                          {staff.nameBn}
                        </p>
                        <div className="text-xs font-semibold text-cyan-800 mt-1 truncate">
                          {staff.designation}
                        </div>
                        <div className="text-[11px] text-slate-500">{staff.department}</div>
                      </div>
                    </div>

                    {/* Qualifications & Class teacher badge */}
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center space-x-1.5 text-slate-600">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{staff.education || "Bachelor Degree"}</span>
                      </div>
                      {staff.classTeacherOf && (
                        <div className="flex items-center space-x-1.5 text-emerald-800 font-semibold">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{staff.classTeacherOf}</span>
                        </div>
                      )}
                      {staff.assignedSubjects.length > 0 && (
                        <div className="pt-1 flex flex-wrap gap-1">
                          {staff.assignedSubjects.map((sub, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Contact Quick Links */}
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a
                          href={`tel:${staff.phone}`}
                          className="hover:text-cyan-700 font-mono transition-colors"
                        >
                          {staff.phone}
                        </a>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a
                          href={`mailto:${staff.email}`}
                          className="hover:text-cyan-700 truncate transition-colors text-[11px]"
                        >
                          {staff.email}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Actions */}
                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedDossier(staff)}
                      className="flex items-center space-x-1 text-cyan-700 hover:text-cyan-900 font-bold cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>360° Profile</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(staff)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                        title="Edit staff details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(staff)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                        title="Delete staff member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* OFFICIAL TABLE ROSTER VIEW (Also rendered in print) */}
      {(viewMode === "table" || typeof window !== "undefined") && (
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${viewMode !== "table" ? "hidden print:block" : ""}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <th className="p-3 font-semibold text-center w-10">Sl</th>
                  <th className="p-3 font-semibold">Staff ID & MPO</th>
                  <th className="p-3 font-semibold">Name & Contact</th>
                  <th className="p-3 font-semibold">Designation & Dept</th>
                  <th className="p-3 font-semibold">Qualifications</th>
                  <th className="p-3 font-semibold">Assigned Subjects / Class</th>
                  <th className="p-3 font-semibold">Joining & Scale</th>
                  <th className="p-3 font-semibold text-center">Status</th>
                  <th className="p-3 font-semibold text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      No personnel records match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff, idx) => {
                    const isMpo = staff.mpoStatus === "MPO_ENLISTED";
                    return (
                      <tr
                        key={staff.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-default"
                      >
                        <td className="p-3 text-center font-mono font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-900">{staff.staffId}</div>
                          <div
                            className={`text-[10px] font-mono mt-0.5 font-bold ${
                              isMpo ? "text-amber-700" : "text-slate-500"
                            }`}
                          >
                            {staff.mpoIndex}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                            {staff.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-bengali">{staff.nameBn}</div>
                          <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                            {staff.phone}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-cyan-900">{staff.designation}</div>
                          <div className="text-[11px] text-slate-500">{staff.department}</div>
                        </td>
                        <td className="p-3 max-w-xs truncate text-slate-700">
                          {staff.education}
                        </td>
                        <td className="p-3 max-w-xs">
                          {staff.assignedSubjects.length > 0 ? (
                            <div className="text-slate-700 truncate">
                              {staff.assignedSubjects.join(", ")}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Office Duties</span>
                          )}
                          {staff.classTeacherOf && (
                            <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
                              CT: {staff.classTeacherOf}
                            </div>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="text-slate-700">{staff.joiningDate}</div>
                          <div className="text-[10px] font-mono text-slate-500">{staff.salaryGrade}</div>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              staff.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {staff.status}
                          </span>
                        </td>
                        <td className="p-3 text-right no-print whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              type="button"
                              onClick={() => setSelectedDossier(staff)}
                              className="p-1.5 text-cyan-700 hover:bg-cyan-50 rounded-lg cursor-pointer"
                              title="View full dossier"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(staff)}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="Edit record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(staff)}
                              className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* OFFICIAL PRINT SIGNATURE FOOTER */}
          <div className="hidden print:grid grid-cols-3 gap-6 p-8 mt-12 pt-12 border-t border-slate-300 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 w-44 mx-auto mb-1"></div>
              <p className="font-bold">Prepared By</p>
              <p className="text-[10px] text-slate-500">Computer Operator / IT Specialist</p>
            </div>
            <div>
              <div className="border-b border-slate-400 w-44 mx-auto mb-1"></div>
              <p className="font-bold">Verified By</p>
              <p className="text-[10px] text-slate-500">Head Clerk / Administrative Officer</p>
            </div>
            <div>
              <div className="border-b border-slate-400 w-44 mx-auto mb-1"></div>
              <p className="font-bold">{schoolInfo.headName}</p>
              <p className="text-[10px] text-slate-500">{schoolInfo.headTitle} & Institutional Seal</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD / EDIT PERSONNEL
         ======================================================== */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-cyan-400" />
                  <span>{editingStaff ? "Edit Staff Information" : "Register New Teacher / Staff"}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Institutional Master Faculty & Administrative Roster Registration
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFormTab("identity")}
                className={`py-3 px-3 border-b-2 transition cursor-pointer ${
                  formTab === "identity"
                    ? "border-cyan-600 text-cyan-800 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                1. Identity & Records
              </button>
              <button
                type="button"
                onClick={() => setFormTab("employment")}
                className={`py-3 px-3 border-b-2 transition cursor-pointer ${
                  formTab === "employment"
                    ? "border-cyan-600 text-cyan-800 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                2. Role & Employment
              </button>
              <button
                type="button"
                onClick={() => setFormTab("academics")}
                className={`py-3 px-3 border-b-2 transition cursor-pointer ${
                  formTab === "academics"
                    ? "border-cyan-600 text-cyan-800 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                3. Academics & Allocation
              </button>
              <button
                type="button"
                onClick={() => setFormTab("contact")}
                className={`py-3 px-3 border-b-2 transition cursor-pointer ${
                  formTab === "contact"
                    ? "border-cyan-600 text-cyan-800 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                4. Contact & Address
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveStaff} className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* TAB 1: IDENTITY */}
              {formTab === "identity" && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Staff ID No. *
                      </label>
                      <input
                        type="text"
                        value={formData.staffId}
                        onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                        placeholder="e.g. TCH-010"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        MPO Index Number
                      </label>
                      <input
                        type="text"
                        value={formData.mpoIndex}
                        onChange={(e) => setFormData({ ...formData, mpoIndex: e.target.value })}
                        placeholder="e.g. MPO-829104 or Non-MPO"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Full Name (English) *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Mohammad Rafiqul Islam"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Full Name (Bangla)
                      </label>
                      <input
                        type="text"
                        value={formData.nameBn}
                        onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                        placeholder="e.g. মোহাম্মদ রফিকুল ইসলাম"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-bengali"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Blood Group</label>
                      <select
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-mono"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">National ID (NID)</label>
                    <input
                      type="text"
                      value={formData.nid}
                      onChange={(e) => setFormData({ ...formData, nid: e.target.value })}
                      placeholder="10 or 17 digit NID number"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: EMPLOYMENT */}
              {formTab === "employment" && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Staff Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                      >
                        <option value="TEACHING">Teaching Faculty (Teacher/Instructor)</option>
                        <option value="NON_TEACHING">Non-Teaching (Office / Support / MLSS)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Official Designation *
                      </label>
                      <input
                        type="text"
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        placeholder="e.g. Senior Teacher (Mathematics)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Department</label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="e.g. Mathematics & Science, Languages, Administration"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">MPO Status</label>
                      <select
                        value={formData.mpoStatus}
                        onChange={(e) => setFormData({ ...formData, mpoStatus: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                      >
                        <option value="MPO_ENLISTED">MPO Enlisted (Govt Subsidized)</option>
                        <option value="NON_MPO">Non-MPO (School Payroll)</option>
                        <option value="CONTRACTUAL">Contractual</option>
                        <option value="PART_TIME">Part-Time / Visiting</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Salary Grade</label>
                      <input
                        type="text"
                        value={formData.salaryGrade}
                        onChange={(e) => setFormData({ ...formData, salaryGrade: e.target.value })}
                        placeholder="e.g. Grade 9 (NPS)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Joining Date</label>
                      <input
                        type="date"
                        value={formData.joiningDate}
                        onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Service Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                      >
                        <option value="ACTIVE">Active in Service</option>
                        <option value="ON_LEAVE">On Leave</option>
                        <option value="RETIRED">Retired</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ACADEMICS & ALLOCATION */}
              {formTab === "academics" && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Highest Educational Qualifications
                    </label>
                    <input
                      type="text"
                      value={formData.education}
                      onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                      placeholder="e.g. M.Sc in Mathematics (DU), B.Ed (1st Class)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Assigned Subjects (Separate with commas)
                    </label>
                    <input
                      type="text"
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      placeholder="e.g. General Mathematics, Higher Mathematics"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Enter subjects taught by this teacher for routine and result tabulations.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Assigned Classes / Sections (Separate with commas)
                    </label>
                    <input
                      type="text"
                      value={classInput}
                      onChange={(e) => setClassInput(e.target.value)}
                      placeholder="e.g. Class 9 (Science), Class 10 (Day)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                    <label className="flex items-center space-x-2 font-bold text-emerald-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isClassTeacher || false}
                        onChange={(e) => setFormData({ ...formData, isClassTeacher: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Designated as Class Teacher</span>
                    </label>

                    {formData.isClassTeacher && (
                      <div className="pt-1">
                        <label className="block font-semibold text-emerald-900 mb-1 text-[11px]">
                          Class Teacher Of (Class & Section):
                        </label>
                        <input
                          type="text"
                          value={formData.classTeacherOf || ""}
                          onChange={(e) => setFormData({ ...formData, classTeacherOf: e.target.value })}
                          placeholder="e.g. Class 10 - Padma (Day Shift)"
                          className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: CONTACT & ADDRESS */}
              {formTab === "contact" && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Primary Mobile Phone *
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+880 1712-345678"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="teacher@school.edu.bd"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContact || ""}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      placeholder="+880 1819-223344"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Permanent / Residential Address
                    </label>
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Holding, Road, Area, Thana, District"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer text-xs"
                >
                  Cancel
                </button>

                <div className="flex items-center space-x-2">
                  {formTab !== "identity" && (
                    <button
                      type="button"
                      onClick={() => {
                        if (formTab === "employment") setFormTab("identity");
                        if (formTab === "academics") setFormTab("employment");
                        if (formTab === "contact") setFormTab("academics");
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                    >
                      Back
                    </button>
                  )}

                  {formTab !== "contact" ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (formTab === "identity") setFormTab("employment");
                        if (formTab === "employment") setFormTab("academics");
                        if (formTab === "academics") setFormTab("contact");
                      }}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 cursor-pointer"
                    >
                      Save Personnel Record
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: 360° STAFF PROFILE DOSSIER
         ======================================================== */}
      {selectedDossier && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full my-8 overflow-hidden animate-in fade-in duration-200">
            {/* Dossier Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-cyan-950 text-white p-6 relative">
              <button
                type="button"
                onClick={() => setSelectedDossier(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400/40 text-cyan-300 flex items-center justify-center font-bold text-2xl shrink-0">
                  {selectedDossier.name
                    .split(" ")
                    .filter((w) => !w.includes("."))
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("") || "T"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-cyan-300 border border-white/20">
                      {selectedDossier.staffId}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                      {selectedDossier.mpoIndex}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1 truncate">
                    {selectedDossier.name}
                  </h2>
                  <p className="text-xs text-slate-300 font-bengali">{selectedDossier.nameBn}</p>
                  <p className="text-xs font-semibold text-cyan-300 mt-0.5">
                    {selectedDossier.designation} • {selectedDossier.department}
                  </p>
                </div>
              </div>
            </div>

            {/* Dossier Body */}
            <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto text-xs">
              {/* Service & MPO Strip */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Category</div>
                  <div className="font-extrabold text-slate-800 mt-0.5">{selectedDossier.category}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">MPO Category</div>
                  <div className="font-extrabold text-slate-800 mt-0.5">{selectedDossier.mpoStatus}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Pay Scale</div>
                  <div className="font-extrabold text-slate-800 mt-0.5">{selectedDossier.salaryGrade}</div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[11px] border-b pb-1">
                  Civil & Institutional Records
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500">National ID (NID):</span>
                    <div className="font-mono font-semibold text-slate-800">{selectedDossier.nid || "—"}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Blood Group:</span>
                    <div className="font-bold text-rose-600">{selectedDossier.bloodGroup}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Date of Birth:</span>
                    <div className="font-semibold text-slate-800">{selectedDossier.dateOfBirth || "—"}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Date of Joining:</span>
                    <div className="font-semibold text-slate-800">{selectedDossier.joiningDate}</div>
                  </div>
                </div>
              </div>

              {/* Academic Qualifications & Subjects */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[11px] border-b pb-1">
                  Academic Credentials & Teaching Load
                </h4>
                <div>
                  <span className="text-slate-500">Educational Degree:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedDossier.education}</div>
                </div>

                {selectedDossier.classTeacherOf && (
                  <div className="bg-emerald-50 text-emerald-900 p-2.5 rounded-lg border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-700">
                      Class Teacher Responsibility
                    </span>
                    <span className="font-bold text-xs">{selectedDossier.classTeacherOf}</span>
                  </div>
                )}

                {selectedDossier.assignedSubjects.length > 0 && (
                  <div>
                    <span className="text-slate-500">Curriculum Subjects:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedDossier.assignedSubjects.map((sub, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-200 text-cyan-800 font-semibold"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[11px] border-b pb-1">
                  Contact & Communication
                </h4>
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500">Mobile:</span>
                    <a
                      href={`tel:${selectedDossier.phone}`}
                      className="font-mono font-bold text-cyan-700 hover:underline"
                    >
                      {selectedDossier.phone}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500">Email:</span>
                    <a
                      href={`mailto:${selectedDossier.email}`}
                      className="font-mono text-cyan-700 hover:underline"
                    >
                      {selectedDossier.email}
                    </a>
                  </div>
                  {selectedDossier.emergencyContact && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-slate-500">Emergency:</span>
                      <span className="font-mono">{selectedDossier.emergencyContact}</span>
                    </div>
                  )}
                  {selectedDossier.address && (
                    <div className="flex items-start space-x-2 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-slate-700">{selectedDossier.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dossier Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setSelectedDossier(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-white font-semibold cursor-pointer"
              >
                Close Dossier
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = selectedDossier;
                    setSelectedDossier(null);
                    handleOpenEdit(toEdit);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Records</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

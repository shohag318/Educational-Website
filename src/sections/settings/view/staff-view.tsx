"use client";

import { NoDataFound } from "@/components/table/no-data-found";
import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {
  Users,
  UserCheck,
  UserPlus,
  Search,
  Download,
  Printer,
  Edit2,
  Trash2,
  Eye,
  Phone,
  Mail,
  GraduationCap,
  Award,
  BookOpen,
  MapPin,
  X,
  RotateCcw,
  Briefcase,
} from "@/components/iconify/lucide";
import { SessionSelect } from "@/components/SessionSelect";
import { DatePicker } from "@/components/date-picker/date-picker";
import { AppButton } from "@/components/button/app-button";
import { AppTextField } from "@/components/text-field/app-text-field";
import { AppSelect } from "@/components/select/app-select";
import {
  SettingsPageShell,
  SettingsPageHeader,
  SettingsSection,
  SettingsFilterGrid,
  SettingsNotice,
} from "@/sections/settings/component/settings-page-ui";
import {
  TeacherStaffMember,
  StaffCategory,
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

  const hasActiveFilters =
    selectedSession !== "ALL" ||
    selectedCategory !== "ALL" ||
    selectedDepartment !== "ALL" ||
    selectedMpoStatus !== "ALL" ||
    selectedStatus !== "ALL" ||
    Boolean(searchQuery);

  return (
    <SettingsPageShell>
      <SettingsPageHeader
        heading="Teacher and Staff Information"
        current="Teacher & Staff"
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap className="no-print">
            <AppButton
              type="button"
              onClick={handleResetToDefault}
              variant="outline"
              color="secondary"
              size="small"
              startIcon={<RotateCcw className="w-3.5 h-3.5" />}
              title="Reset roster to default Bangladeshi teachers & staff dataset"
            >
              Reset
            </AppButton>
            <AppButton
              type="button"
              onClick={handleExportCsv}
              variant="outline"
              color="secondary"
              size="small"
              startIcon={<Download className="w-3.5 h-3.5" />}
              title="Download CSV workbook for BANBEIS or spreadsheet processing"
            >
              Export
            </AppButton>
            <AppButton
              type="button"
              onClick={handlePrint}
              variant="outline"
              color="secondary"
              size="small"
              startIcon={<Printer className="w-3.5 h-3.5" />}
              title="Print official master staff roster with institutional signature blocks"
            >
              Print
            </AppButton>
            <AppButton
              type="button"
              onClick={handleOpenAdd}
              variant="contained"
              color="primary"
              size="small"
              startIcon={<UserPlus className="w-4 h-4" />}
            >
              Add
            </AppButton>
          </Stack>
        }
      />

      {toastMessage && <SettingsNotice severity="success">{toastMessage}</SettingsNotice>}

      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        className="no-print"
        sx={{ alignItems: "center" }}
      >
        <Chip size="small" icon={<Users className="w-3.5 h-3.5" />} label={`${stats.total} Total`} />
        <Chip
          size="small"
          color="success"
          variant="outlined"
          icon={<GraduationCap className="w-3.5 h-3.5" />}
          label={`${stats.teaching} Teaching`}
        />
        <Chip
          size="small"
          color="info"
          variant="outlined"
          icon={<Briefcase className="w-3.5 h-3.5" />}
          label={`${stats.nonTeaching} Support`}
        />
        <Chip
          size="small"
          color="warning"
          variant="outlined"
          icon={<Award className="w-3.5 h-3.5" />}
          label={`${stats.mpo} MPO`}
        />
        <Chip
          size="small"
          variant="outlined"
          icon={<UserCheck className="w-3.5 h-3.5" />}
          label={`${stats.male}M · ${stats.female}F`}
        />
        <Chip
          size="small"
          variant="outlined"
          label={`EIIN ${schoolInfo.eiin} · ${schoolInfo.board} · ${schoolInfo.academicYear}`}
        />
      </Stack>

      <SettingsSection
        title="Search & filters"
        subtitle="Filter the institutional faculty and staff directory by category, department, MPO status, and session."
        action={
          hasActiveFilters ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Chip
                size="small"
                label="Filters applied"
                sx={{
                  height: 22,
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  bgcolor: "primary.lighter",
                  color: "primary.dark",
                }}
              />
              <AppButton
                type="button"
                variant="link"
                color="primary"
                size="small"
                startIcon={<RotateCcw className="w-3 h-3" />}
                onClick={() => {
                  setSelectedSession("ALL");
                  setSelectedCategory("ALL");
                  setSelectedDepartment("ALL");
                  setSelectedMpoStatus("ALL");
                  setSelectedStatus("ALL");
                  setSearchQuery("");
                }}
              >
                Reset
              </AppButton>
            </Stack>
          ) : undefined
        }
        toolbar={
          <SettingsFilterGrid columns={4}>
            <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 2" } }}>
              <AppTextField
                label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, index, staff ID, mobile, designation, or subject..."
                startIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
                endIcon={
                  searchQuery ? (
                    <IconButton size="small" onClick={() => setSearchQuery("")} edge="end" aria-label="Clear search">
                      <X className="w-3.5 h-3.5" />
                    </IconButton>
                  ) : undefined
                }
              />
            </Box>

            <SessionSelect
              value={selectedSession}
              onChange={(val) => setSelectedSession(val)}
              label="Session"
              includeAll
              allLabel="All Sessions"
              fullWidth
            />

            <AppSelect
              label="Department"
              value={selectedDepartment}
              onChange={setSelectedDepartment}
              options={[
                { value: "ALL", label: `All Departments (${departments.length})` },
                ...departments.map((dept) => ({ value: dept, label: dept })),
              ]}
            />

            <AppSelect
              label="MPO Status"
              value={selectedMpoStatus}
              onChange={setSelectedMpoStatus}
              options={[
                { value: "ALL", label: "All MPO Categories" },
                { value: "MPO_ENLISTED", label: "MPO Enlisted (Govt Subsidized)" },
                { value: "NON_MPO", label: "Non-MPO (School Payroll)" },
                { value: "CONTRACTUAL", label: "Contractual" },
                { value: "PART_TIME", label: "Part-Time / Guest" },
              ]}
            />

            <AppSelect
              label="Service Status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[
                { value: "ALL", label: "All Service Status" },
                { value: "ACTIVE", label: "Active in Service" },
                { value: "ON_LEAVE", label: "On Leave" },
                { value: "RETIRED", label: "Retired" },
              ]}
            />
          </SettingsFilterGrid>
        }
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{
            px: { xs: 2.25, sm: 2.75 },
            pb: 2.25,
            pt: 0.5,
            alignItems: { md: "center" },
            justifyContent: "space-between",
          }}
          className="no-print"
        >
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <AppButton
              type="button"
              size="small"
              variant="soft"
              color={selectedCategory === "ALL" ? "primary" : "inherit"}
              onClick={() => setSelectedCategory("ALL")}
            >
              All ({staffList.length})
            </AppButton>
            <AppButton
              type="button"
              size="small"
              variant="soft"
              color={selectedCategory === "TEACHING" ? "primary" : "inherit"}
              onClick={() => setSelectedCategory("TEACHING")}
            >
              Teaching ({stats.teaching})
            </AppButton>
            <AppButton
              type="button"
              size="small"
              variant="soft"
              color={selectedCategory === "NON_TEACHING" ? "primary" : "inherit"}
              onClick={() => setSelectedCategory("NON_TEACHING")}
            >
              Support ({stats.nonTeaching})
            </AppButton>
          </Stack>

          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            <AppButton
              type="button"
              size="small"
              variant="soft"
              color={viewMode === "cards" ? "primary" : "inherit"}
              onClick={() => setViewMode("cards")}
            >
              Cards
            </AppButton>
            <AppButton
              type="button"
              size="small"
              variant="soft"
              color={viewMode === "table" ? "primary" : "inherit"}
              onClick={() => setViewMode("table")}
            >
              Table
            </AppButton>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontFamily: "monospace" }}>
              Showing <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>{filteredStaff.length}</Box> of{" "}
              {staffList.length}
            </Typography>
          </Stack>
        </Stack>
      </SettingsSection>

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

      <SettingsSection
        title="Staff directory"
        subtitle="Official institutional faculty & staff roster with BANBEIS and MPO index records."
      >
      {/* DIRECTORY CARDS VIEW */}
      {viewMode === "cards" && (
        <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 no-print" sx={{ p: { xs: 2, sm: 2.5 } }}>
          {filteredStaff.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No personnel match your query</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing search terms or resetting filters to view all institutional staff members.
              </p>
              <AppButton
                type="button"
                variant="soft"
                color="inherit"
                size="small"
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSelectedDepartment("ALL");
                  setSelectedMpoStatus("ALL");
                  setSelectedStatus("ALL");
                  setSearchQuery("");
                }}
              >
                Clear All Filters
              </AppButton>
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
                    <AppButton
                      type="button"
                      variant="link"
                      color="primary"
                      size="small"
                      startIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setSelectedDossier(staff)}
                    >
                      360° Profile
                    </AppButton>

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
        </Box>
      )}

      {/* OFFICIAL TABLE ROSTER VIEW (Also rendered in print) */}
      {(viewMode === "table" || typeof window !== "undefined") && (
        <Box className={`${viewMode !== "table" ? "hidden print:block" : ""}`} sx={{ overflow: "hidden" }}>
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
                    <td colSpan={9} className="p-0">
                      <NoDataFound />
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
        </Box>
      )}
      </SettingsSection>

      {/* ========================================================
          MODAL: ADD / EDIT PERSONNEL
         ======================================================== */}
      <Dialog
        open={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        maxWidth="md"
        fullWidth
        className="no-print"
      >
        <Box component="form" onSubmit={handleSaveStaff} sx={{ display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
          <DialogTitle sx={{ pr: 6, position: "relative" }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <UserPlus className="w-5 h-5" />
              <Box>
                <Typography variant="h6" component="span">
                  {editingStaff ? "Edit Staff Information" : "Register New Teacher / Staff"}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Institutional Master Faculty & Administrative Roster Registration
                </Typography>
              </Box>
            </Stack>
            <IconButton
              aria-label="Close"
              onClick={() => setIsAddEditModalOpen(false)}
              sx={{ position: "absolute", right: 8, top: 8 }}
            >
              <X className="w-5 h-5" />
            </IconButton>
          </DialogTitle>

          <Stack
            direction="row"
            spacing={0.75}
            flexWrap="wrap"
            useFlexGap
            sx={{ px: 3, pb: 1.5, borderBottom: 1, borderColor: "divider" }}
          >
            <AppButton
              type="button"
              size="small"
              variant="soft"
              color={formTab === "identity" ? "primary" : "inherit"}
              onClick={() => setFormTab("identity")}
            >
              1. Identity & Records
            </AppButton>
            <AppButton
              type="button"
              size="small"
              variant="soft"
              color={formTab === "employment" ? "primary" : "inherit"}
              onClick={() => setFormTab("employment")}
            >
              2. Role & Employment
            </AppButton>
            <AppButton
              type="button"
              size="small"
              variant="soft"
              color={formTab === "academics" ? "primary" : "inherit"}
              onClick={() => setFormTab("academics")}
            >
              3. Academics & Allocation
            </AppButton>
            <AppButton
              type="button"
              size="small"
              variant="soft"
              color={formTab === "contact" ? "primary" : "inherit"}
              onClick={() => setFormTab("contact")}
            >
              4. Contact & Address
            </AppButton>
          </Stack>

          <DialogContent dividers sx={{ overflowY: "auto" }}>
            {formTab === "identity" && (
              <Stack spacing={2}>
                <SettingsFilterGrid columns={2}>
                  <AppTextField
                    label="Staff ID No. *"
                    value={formData.staffId}
                    onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                    placeholder="e.g. TCH-010"
                    required
                    slotProps={{ input: { sx: { fontFamily: "monospace" } } }}
                  />
                  <AppTextField
                    label="MPO Index Number"
                    value={formData.mpoIndex}
                    onChange={(e) => setFormData({ ...formData, mpoIndex: e.target.value })}
                    placeholder="e.g. MPO-829104 or Non-MPO"
                    slotProps={{ input: { sx: { fontFamily: "monospace" } } }}
                  />
                  <AppTextField
                    label="Full Name (English) *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Mohammad Rafiqul Islam"
                    required
                  />
                  <AppTextField
                    label="Full Name (Bangla)"
                    value={formData.nameBn}
                    onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                    placeholder="e.g. মোহাম্মদ রফিকুল ইসলাম"
                  />
                </SettingsFilterGrid>

                <SettingsFilterGrid columns={3}>
                  <AppSelect
                    label="Gender"
                    value={formData.gender}
                    onChange={(value) => setFormData({ ...formData, gender: value as TeacherStaffMember["gender"] })}
                    options={[
                      { value: "MALE", label: "Male" },
                      { value: "FEMALE", label: "Female" },
                      { value: "OTHER", label: "Other" },
                    ]}
                  />
                  <AppSelect
                    label="Blood Group"
                    value={formData.bloodGroup}
                    onChange={(value) => setFormData({ ...formData, bloodGroup: value })}
                    options={[
                      { value: "A+", label: "A+" },
                      { value: "A-", label: "A-" },
                      { value: "B+", label: "B+" },
                      { value: "B-", label: "B-" },
                      { value: "O+", label: "O+" },
                      { value: "O-", label: "O-" },
                      { value: "AB+", label: "AB+" },
                      { value: "AB-", label: "AB-" },
                    ]}
                  />
                  <DatePicker
                    label="Date of Birth"
                    value={formData.dateOfBirth}
                    onChange={(val) => setFormData({ ...formData, dateOfBirth: val })}
                  />
                </SettingsFilterGrid>

                <AppTextField
                  label="National ID (NID)"
                  value={formData.nid}
                  onChange={(e) => setFormData({ ...formData, nid: e.target.value })}
                  placeholder="10 or 17 digit NID number"
                  slotProps={{ input: { sx: { fontFamily: "monospace" } } }}
                />
              </Stack>
            )}

            {formTab === "employment" && (
              <Stack spacing={2}>
                <SettingsFilterGrid columns={2}>
                  <AppSelect
                    label="Staff Category *"
                    value={formData.category}
                    onChange={(value) =>
                      setFormData({ ...formData, category: value as TeacherStaffMember["category"] })
                    }
                    options={[
                      { value: "TEACHING", label: "Teaching Faculty (Teacher/Instructor)" },
                      { value: "NON_TEACHING", label: "Non-Teaching (Office / Support / MLSS)" },
                    ]}
                  />
                  <AppTextField
                    label="Official Designation *"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Senior Teacher (Mathematics)"
                    required
                  />
                  <AppTextField
                    label="Department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Mathematics & Science, Languages, Administration"
                  />
                  <AppSelect
                    label="MPO Status"
                    value={formData.mpoStatus}
                    onChange={(value) =>
                      setFormData({ ...formData, mpoStatus: value as TeacherStaffMember["mpoStatus"] })
                    }
                    options={[
                      { value: "MPO_ENLISTED", label: "MPO Enlisted (Govt Subsidized)" },
                      { value: "NON_MPO", label: "Non-MPO (School Payroll)" },
                      { value: "CONTRACTUAL", label: "Contractual" },
                      { value: "PART_TIME", label: "Part-Time / Visiting" },
                    ]}
                  />
                </SettingsFilterGrid>

                <SettingsFilterGrid columns={3}>
                  <AppTextField
                    label="Salary Grade"
                    value={formData.salaryGrade}
                    onChange={(e) => setFormData({ ...formData, salaryGrade: e.target.value })}
                    placeholder="e.g. Grade 9 (NPS)"
                  />
                  <DatePicker
                    label="Joining Date"
                    value={formData.joiningDate}
                    onChange={(val) => setFormData({ ...formData, joiningDate: val })}
                  />
                  <AppSelect
                    label="Service Status"
                    value={formData.status}
                    onChange={(value) =>
                      setFormData({ ...formData, status: value as TeacherStaffMember["status"] })
                    }
                    options={[
                      { value: "ACTIVE", label: "Active in Service" },
                      { value: "ON_LEAVE", label: "On Leave" },
                      { value: "RETIRED", label: "Retired" },
                    ]}
                  />
                </SettingsFilterGrid>
              </Stack>
            )}

            {formTab === "academics" && (
              <Stack spacing={2}>
                <AppTextField
                  label="Highest Educational Qualifications"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  placeholder="e.g. M.Sc in Mathematics (DU), B.Ed (1st Class)"
                />
                <Box>
                  <AppTextField
                    label="Assigned Subjects (Separate with commas)"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    placeholder="e.g. General Mathematics, Higher Mathematics"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    Enter subjects taught by this teacher for routine and result tabulations.
                  </Typography>
                </Box>
                <AppTextField
                  label="Assigned Classes / Sections (Separate with commas)"
                  value={classInput}
                  onChange={(e) => setClassInput(e.target.value)}
                  placeholder="e.g. Class 9 (Science), Class 10 (Day)"
                />
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "success.lighter",
                    border: 1,
                    borderColor: "success.light",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.isClassTeacher || false}
                        onChange={(e) => setFormData({ ...formData, isClassTeacher: e.target.checked })}
                        color="success"
                      />
                    }
                    label="Designated as Class Teacher"
                  />
                  {formData.isClassTeacher && (
                    <Box sx={{ mt: 1 }}>
                      <AppTextField
                        label="Class Teacher Of (Class & Section)"
                        value={formData.classTeacherOf || ""}
                        onChange={(e) => setFormData({ ...formData, classTeacherOf: e.target.value })}
                        placeholder="e.g. Class 10 - Padma (Day Shift)"
                      />
                    </Box>
                  )}
                </Box>
              </Stack>
            )}

            {formTab === "contact" && (
              <Stack spacing={2}>
                <SettingsFilterGrid columns={2}>
                  <AppTextField
                    label="Primary Mobile Phone *"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+880 1712-345678"
                    required
                    slotProps={{ input: { sx: { fontFamily: "monospace" } } }}
                  />
                  <AppTextField
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="teacher@school.edu.bd"
                  />
                </SettingsFilterGrid>
                <AppTextField
                  label="Emergency Contact Phone"
                  value={formData.emergencyContact || ""}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="+880 1819-223344"
                  slotProps={{ input: { sx: { fontFamily: "monospace" } } }}
                />
                <AppTextField
                  label="Permanent / Residential Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Holding, Road, Area, Thana, District"
                  multiline
                  minRows={2}
                />
              </Stack>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
            <AppButton
              type="button"
              variant="ghost"
              color="inherit"
              size="small"
              onClick={() => setIsAddEditModalOpen(false)}
            >
              Cancel
            </AppButton>

            <Stack direction="row" spacing={1}>
              {formTab !== "identity" && (
                <AppButton
                  type="button"
                  variant="outline"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    if (formTab === "employment") setFormTab("identity");
                    if (formTab === "academics") setFormTab("employment");
                    if (formTab === "contact") setFormTab("academics");
                  }}
                >
                  Back
                </AppButton>
              )}

              {formTab !== "contact" ? (
                <AppButton
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => {
                    if (formTab === "identity") setFormTab("employment");
                    if (formTab === "employment") setFormTab("academics");
                    if (formTab === "academics") setFormTab("contact");
                  }}
                >
                  Next Step
                </AppButton>
              ) : (
                <AppButton type="submit" variant="contained" color="primary" size="small">
                  Save Personnel Record
                </AppButton>
              )}
            </Stack>
          </DialogActions>
        </Box>
      </Dialog>

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
              <AppButton
                type="button"
                variant="ghost"
                color="inherit"
                size="small"
                onClick={() => setSelectedDossier(null)}
              >
                Close Dossier
              </AppButton>

              <div className="flex items-center space-x-2">
                <AppButton
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<Edit2 className="w-3.5 h-3.5" />}
                  onClick={() => {
                    const toEdit = selectedDossier;
                    setSelectedDossier(null);
                    handleOpenEdit(toEdit);
                  }}
                >
                  Edit Records
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </SettingsPageShell>
  );
}

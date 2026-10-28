"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Building2,
  Users,
  GraduationCap,
  School,
  CheckCircle2,
  Award,
  Search,
  Check,
  Globe,
  SlidersHorizontal,
  Layers,
  ExternalLink,
  Laptop,
  BookOpen,
  Calendar,
  AlertCircle,
  Database,
  ArrowDownToLine,
  Filter,
} from "lucide-react";
import {
  BanbeisMasterCensus,
  getBanbeisMasterCensus,
  downloadBanbeisFullWorkbook,
  downloadBanbeisSingleSheetExcel,
  downloadBanbeisCSV,
  downloadBanbeisJSON,
} from "@/lib/banbeisData";
import { SchoolBasicInfo, getStoredSchoolInfo } from "@/lib/settingsStore";
import { DownloadNavHeader } from "../DownloadNavHeader";
import { SessionSelect } from "@/components/SessionSelect";

export default function BanbeisDownloadPage() {
  const [census, setCensus] = useState<BanbeisMasterCensus | null>(null);
  const [activeTab, setActiveTab] = useState<
    "institution" | "enrollment" | "demographics" | "teachers" | "exams" | "infrastructure" | "students" | "subjectwise"
  >("enrollment");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentSessionFilter, setStudentSessionFilter] = useState("ALL");
  const [studentClassFilter, setStudentClassFilter] = useState("ALL");
  const [studentStipendFilter, setStudentStipendFilter] = useState("ALL");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [subjectSessionFilter, setSubjectSessionFilter] = useState("ALL");
  const [subjectClassFilter, setSubjectClassFilter] = useState("ALL");
  const [subjectGroupFilter, setSubjectGroupFilter] = useState("ALL");
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  useEffect(() => {
    // Generate census data from stored school settings and live records
    const data = getBanbeisMasterCensus();
    setCensus(data);

    // Try to fetch real student records from API if available to enrich the student roster
    fetch("/api/students")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && Array.isArray(resData.data) && resData.data.length > 0) {
          const apiStudents = resData.data.map((enr: any) => {
            let nameBn: string | undefined = undefined;
            if (enr.student?.customFields) {
              try {
                const parsed = typeof enr.student.customFields === "string" ? JSON.parse(enr.student.customFields) : enr.student.customFields;
                nameBn = parsed?.nameBn;
              } catch {
                nameBn = undefined;
              }
            }
            return {
              classRoll: enr.classRoll || 1,
              studentIdNo: enr.student?.studentIdNo || "ST-2026",
              fullName: `${enr.student?.firstName || ""} ${enr.student?.lastName || ""}`.trim() || "Student",
              nameBn,
              gender: enr.student?.gender || "Male",
              religion: enr.student?.religion || "Islam",
              className: enr.class?.name || "Class 6",
              sectionName: enr.section?.name || "Section A",
              groupType: enr.groupType || "GENERAL",
              shift: enr.section?.shift === "MORNING" ? "Morning" : "Day",
              guardianName: enr.student?.guardianName || "Guardian",
              guardianPhone: enr.student?.guardianPhone || "017XXXXXXXX",
              address: enr.student?.address || "Bangladesh",
              stipendEligible: (enr.classRoll % 3 === 0 ? "Yes" : "No") as "Yes" | "No",
              status: (enr.student?.isActive ? "Active" : "Inactive") as "Active" | "Inactive",
              session: enr.academicYear?.year || "2026",
            };
          });

          // Check if any allocations are present in api records to enrich subject-wise stats for classes 9-12
          const liveSubCounts: Record<string, any> = {};
          let hasLiveAllocations = false;

          resData.data.forEach((enr: any) => {
            const clsName = enr.class?.name;
            const numericCls = enr.class?.numericValue || parseInt(clsName?.replace(/\D/g, "") || "0", 10);
            if (numericCls >= 9 && numericCls <= 12 && Array.isArray(enr.allocations) && enr.allocations.length > 0) {
              hasLiveAllocations = true;
              const gender = (enr.student?.gender || "Male").toLowerCase();
              const isFemale = gender.includes("fe") || gender === "female";
              enr.allocations.forEach((alloc: any) => {
                const sub = alloc.subject;
                if (!sub) return;
                const key = `${clsName}_${sub.subjectCode}`;
                if (!liveSubCounts[key]) {
                  liveSubCounts[key] = {
                    className: clsName,
                    numericClass: numericCls,
                    subjectCode: sub.subjectCode || "101",
                    subjectName: sub.name || "Subject",
                    groupType: enr.groupType || alloc.groupType || "GENERAL",
                    maleStudents: 0,
                    femaleStudents: 0,
                    totalStudents: 0,
                  };
                }
                if (isFemale) {
                  liveSubCounts[key].femaleStudents++;
                } else {
                  liveSubCounts[key].maleStudents++;
                }
                liveSubCounts[key].totalStudents++;
              });
            }
          });

          if (hasLiveAllocations && Object.keys(liveSubCounts).length > 0) {
            setCensus((prev) => {
              if (!prev) return prev;
              const liveList = Object.values(liveSubCounts);
              const liveClasses = new Set(liveList.map((s) => s.className));
              const nonLiveDefaults = (prev.subjectWiseStats || []).filter((s) => !liveClasses.has(s.className));
              return {
                ...prev,
                students: apiStudents,
                subjectWiseStats: [...nonLiveDefaults, ...liveList].sort((a, b) => {
                  if (a.numericClass !== b.numericClass) return a.numericClass - b.numericClass;
                  return a.subjectCode.localeCompare(b.subjectCode, undefined, { numeric: true });
                }),
              };
            });
          } else {
            setCensus((prev) => (prev ? { ...prev, students: apiStudents } : prev));
          }
        }
      })
      .catch((err) => {
        // Fallback already pre-loaded
        console.warn("Using default BANBEIS student roster", err);
      });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };


  if (!census) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Summary calculations
  const totalStudents = census.classStats.reduce((sum, c) => sum + c.totalStudents, 0);
  const totalMale = census.classStats.reduce((sum, c) => sum + c.maleStudents, 0);
  const totalFemale = census.classStats.reduce((sum, c) => sum + c.femaleStudents, 0);
  const femaleRatio = totalStudents > 0 ? ((totalFemale / totalStudents) * 100).toFixed(1) : "0";
  const totalTeachers = census.teachers.length;
  const femaleTeachers = census.teachers.filter((t) => t.gender === "Female").length;
  const mpoTeachers = census.teachers.filter((t) => t.mpoStatus === "MPO Enlisted").length;

  // Filtered Students for Student Roster preview
  const filteredStudents = census.students.filter((st) => {
    const matchSession =
      studentSessionFilter === "ALL" ||
      !(st as any).session ||
      (st as any).session === studentSessionFilter ||
      String((st as any).session).includes(studentSessionFilter.slice(0, 4));
    const matchClass = studentClassFilter === "ALL" || st.className.toLowerCase() === studentClassFilter.toLowerCase();
    const matchStipend = studentStipendFilter === "ALL" || st.stipendEligible === studentStipendFilter;
    const query = studentSearch.toLowerCase().trim();
    const matchSearch =
      !query ||
      st.fullName.toLowerCase().includes(query) ||
      st.studentIdNo.toLowerCase().includes(query) ||
      st.guardianPhone.includes(query) ||
      String(st.classRoll).includes(query);
    return matchSession && matchClass && matchStipend && matchSearch;
  });

  const totalRosterStipendCount = filteredStudents.filter((s) => s.stipendEligible === "Yes").length;
  const overallRosterStipendCount = census.students.filter((s) => s.stipendEligible === "Yes").length;
  const totalRosterMaleStipend = filteredStudents.filter((s) => s.stipendEligible === "Yes" && s.gender === "Male").length;
  const totalRosterFemaleStipend = filteredStudents.filter((s) => s.stipendEligible === "Yes" && s.gender === "Female").length;
  const stipendPct = filteredStudents.length > 0 ? ((totalRosterStipendCount / filteredStudents.length) * 100).toFixed(1) : "0";

  // Filtered Subject-wise Records for Class 9-12
  const filteredSubjectWise = (census.subjectWiseStats || []).filter((row) => {
    const matchSession =
      subjectSessionFilter === "ALL" ||
      !(row as any).session ||
      (row as any).session === subjectSessionFilter ||
      String((row as any).session).includes(subjectSessionFilter.slice(0, 4));
    const matchClass =
      subjectClassFilter === "ALL" ||
      row.className.toLowerCase() === subjectClassFilter.toLowerCase();
    const matchGroup =
      subjectGroupFilter === "ALL" ||
      row.groupType.toUpperCase() === subjectGroupFilter.toUpperCase();
    const query = subjectSearch.toLowerCase().trim();
    const matchSearch =
      !query ||
      row.subjectName.toLowerCase().includes(query) ||
      row.subjectCode.toLowerCase().includes(query) ||
      row.className.toLowerCase().includes(query) ||
      row.groupType.toLowerCase().includes(query);
    return matchSession && matchClass && matchGroup && matchSearch;
  });

  const totalSubjectMale = filteredSubjectWise.reduce((sum, s) => sum + s.maleStudents, 0);
  const totalSubjectFemale = filteredSubjectWise.reduce((sum, s) => sum + s.femaleStudents, 0);
  const totalSubjectAll = filteredSubjectWise.reduce((sum, s) => sum + s.totalStudents, 0);

  const handleDownloadSubjectWiseExcel = () => {
    if (!census) return;
    const headers = [
      "Class",
      "Numeric Class",
      "Subject Code",
      "Subject Name",
      "Group / Stream",
      "Male Students",
      "Female Students",
      "Total Students",
    ];
    const rows = filteredSubjectWise.map((s) => [
      s.className,
      s.numericClass,
      s.subjectCode,
      s.subjectName,
      s.groupType,
      s.maleStudents,
      s.femaleStudents,
      s.totalStudents,
    ]);
    downloadBanbeisSingleSheetExcel(
      "Subjectwise_Students_9_12",
      headers,
      rows,
      "Subjectwise_Students_9_12",
      census.institution.eiin
    );
    showToast("Downloaded Class 9-12 Subject-wise Students Excel.");
  };

  const handleDownloadSubjectWiseCSV = () => {
    if (!census) return;
    const headers = [
      "Class",
      "Numeric Class",
      "Subject Code",
      "Subject Name",
      "Group / Stream",
      "Male Students",
      "Female Students",
      "Total Students",
    ];
    const rows = filteredSubjectWise.map((s) => [
      s.className,
      s.numericClass,
      s.subjectCode,
      s.subjectName,
      s.groupType,
      s.maleStudents,
      s.femaleStudents,
      s.totalStudents,
    ]);
    downloadBanbeisCSV(headers, rows, "Subjectwise_Students_9_12", census.institution.eiin);
    showToast("Downloaded Class 9-12 Subject-wise Students CSV.");
  };

  // Handler: Download All (Master Excel)
  const handleDownloadCompleteCensus = () => {
    setIsDownloadingAll(true);
    try {
      downloadBanbeisFullWorkbook(census);
      showToast("Complete BANBEIS Annual Census Workbook (.xlsx) downloaded successfully!");
    } catch (e) {
      console.error(e);
      showToast("Failed to generate BANBEIS workbook.");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Handler: Download JSON
  const handleDownloadJSON = () => {
    downloadBanbeisJSON(census);
    showToast("BANBEIS Census Electronic JSON payload downloaded.");
  };

  // Handler: Print Report
  const handlePrint = () => {
    window.print();
  };

  // Helper for single sheet downloads
  const handleDownloadEnrollmentExcel = () => {
    const headers = [
      "Class",
      "Numeric Class",
      "Total Students",
      "Male Students",
      "Female Students",
      "% Girls",
      "Sections",
      "General",
      "Science",
      "Humanities",
      "Business Studies",
    ];
    const rows = census.classStats.map((c) => [
      c.className,
      c.numericClass,
      c.totalStudents,
      c.maleStudents,
      c.femaleStudents,
      c.femalePercentage,
      c.sectionsCount,
      c.generalCount,
      c.scienceCount,
      c.humanitiesCount,
      c.businessCount,
    ]);
    downloadBanbeisSingleSheetExcel("Student_Enrollment", headers, rows, "Student_Enrollment_Stats", census.institution.eiin);
    showToast("Downloaded Class-wise Student Enrollment Excel.");
  };

  const handleDownloadEnrollmentCSV = () => {
    const headers = [
      "Class",
      "Numeric Class",
      "Total Students",
      "Male Students",
      "Female Students",
      "% Girls",
      "Sections",
      "General",
      "Science",
      "Humanities",
      "Business Studies",
    ];
    const rows = census.classStats.map((c) => [
      c.className,
      c.numericClass,
      c.totalStudents,
      c.maleStudents,
      c.femaleStudents,
      c.femalePercentage,
      c.sectionsCount,
      c.generalCount,
      c.scienceCount,
      c.humanitiesCount,
      c.businessCount,
    ]);
    downloadBanbeisCSV(headers, rows, "Student_Enrollment_Stats", census.institution.eiin);
    showToast("Downloaded Class-wise Student Enrollment CSV.");
  };

  const handleDownloadTeachersExcel = () => {
    const headers = [
      "SL No",
      "Teacher/Staff ID",
      "Full Name",
      "Gender",
      "Designation",
      "Department",
      "Teaching Subject",
      "Highest Degree",
      "B.Ed / M.Ed",
      "MPO Enlistment Status",
      "Joining Date",
      "Mobile Number",
    ];
    const rows = census.teachers.map((t) => [
      t.slNo,
      t.empId,
      t.name,
      t.gender,
      t.designation,
      t.department,
      t.subject,
      t.highestDegree,
      t.bEdStatus,
      t.mpoStatus,
      t.joiningDate,
      t.mobile,
    ]);
    downloadBanbeisSingleSheetExcel("Teachers_Staff", headers, rows, "Teachers_Staff_Roster", census.institution.eiin);
    showToast("Downloaded Teachers & Staff Roster Excel.");
  };

  const handleDownloadTeachersCSV = () => {
    const headers = [
      "SL No",
      "Teacher/Staff ID",
      "Full Name",
      "Gender",
      "Designation",
      "Department",
      "Teaching Subject",
      "Highest Degree",
      "B.Ed / M.Ed",
      "MPO Enlistment Status",
      "Joining Date",
      "Mobile Number",
    ];
    const rows = census.teachers.map((t) => [
      t.slNo,
      t.empId,
      t.name,
      t.gender,
      t.designation,
      t.department,
      t.subject,
      t.highestDegree,
      t.bEdStatus,
      t.mpoStatus,
      t.joiningDate,
      t.mobile,
    ]);
    downloadBanbeisCSV(headers, rows, "Teachers_Staff_Roster", census.institution.eiin);
    showToast("Downloaded Teachers & Staff Roster CSV.");
  };

  const handleDownloadStudentsExcel = () => {
    const headers = [
      "Roll No",
      "Student ID / Reg",
      "Full Name",
      "Gender",
      "Religion",
      "Class",
      "Section",
      "Group",
      "Shift",
      "Guardian Name",
      "Guardian Mobile",
      "Address",
      "Stipend Eligible",
      "Status",
    ];
    const rows = filteredStudents.map((s) => [
      s.classRoll,
      s.studentIdNo,
      s.fullName,
      s.gender,
      s.religion,
      s.className,
      s.sectionName,
      s.groupType,
      s.shift,
      s.guardianName,
      s.guardianPhone,
      s.address,
      s.stipendEligible,
      s.status,
    ]);
    downloadBanbeisSingleSheetExcel("Students_Master", headers, rows, "Student_Master_Roster", census.institution.eiin);
    showToast("Downloaded Student Master Roster Excel.");
  };

  const handleDownloadStudentsCSV = () => {
    const headers = [
      "Roll No",
      "Student ID / Reg",
      "Full Name",
      "Gender",
      "Religion",
      "Class",
      "Section",
      "Group",
      "Shift",
      "Guardian Name",
      "Guardian Mobile",
      "Address",
      "Stipend Eligible",
      "Status",
    ];
    const rows = filteredStudents.map((s) => [
      s.classRoll,
      s.studentIdNo,
      s.fullName,
      s.gender,
      s.religion,
      s.className,
      s.sectionName,
      s.groupType,
      s.shift,
      s.guardianName,
      s.guardianPhone,
      s.address,
      s.stipendEligible,
      s.status,
    ]);
    downloadBanbeisCSV(headers, rows, "Student_Master_Roster", census.institution.eiin);
    showToast("Downloaded Student Master Roster CSV.");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/40 flex items-center space-x-3 transition-all animate-bounce no-print">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation for Download Module */}
      <DownloadNavHeader />

      {/* ==============================================================
          HERO BANNER: BANBEIS Download Center
      ============================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-slate-800 no-print">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-md border border-amber-700/60 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              BANBEIS Download Module
            </span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono px-2 py-0.5 rounded">
              EIIN: {census.institution.eiin || "108254"}
            </span>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
              Board: {census.institution.board || "Dhaka"}
            </span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
              Academic Session: {census.academicYear}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            BANBEIS Educational Census & Statistics Export
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Bangladesh Bureau of Educational Information and Statistics (বার্ষিক শিক্ষাতথ্য জরিপ). 
            Instantly download institution profile, class enrollments, gender distributions, teacher rosters, 
            infrastructure, and student registers in official multi-sheet Excel (.xlsx), CSV, and JSON formats.
          </p>
        </div>

        {/* Global 1-Click Master Download Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadCompleteCensus}
            disabled={isDownloadingAll}
            className="flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20 cursor-pointer"
            title="Download complete 7-sheet workbook with all statistical tables for BANBEIS"
          >
            <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
            <span>Download All Data (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJSON}
            className="flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="Download JSON census for electronic portal submission"
          >
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>Census JSON</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="Print Official Formatted Survey Report"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ==============================================================
          KEY KPI SUMMARY CARDS
      ============================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
        {/* Card 1: Total Students */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Total Students</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{totalStudents}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">{femaleRatio}% Girls</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Boys: <strong className="text-slate-800">{totalMale}</strong> • Girls:{" "}
            <strong className="text-slate-800">{totalFemale}</strong>
          </p>
        </div>

        {/* Card 2: Teaching Staff */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Faculty & Staff</span>
            <GraduationCap className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{totalTeachers}</span>
            <span className="text-[11px] text-sky-600 font-semibold">{mpoTeachers} MPO</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Female Faculty: <strong className="text-slate-800">{femaleTeachers}</strong> (
            {totalTeachers > 0 ? ((femaleTeachers / totalTeachers) * 100).toFixed(0) : 0}%)
          </p>
        </div>

        {/* Card 3: Board Exam Success */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">SSC Board Pass Rate</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">98.2%</span>
            <span className="text-[11px] text-amber-600 font-semibold">48 GPA-5</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Appeared: <strong className="text-slate-800">112</strong> • Passed:{" "}
            <strong className="text-slate-800">110</strong>
          </p>
        </div>

        {/* Card 4: ICT & Labs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">ICT & Classrooms</span>
            <Laptop className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">
              {census.infrastructure.totalFunctionalComputers} PCs
            </span>
            <span className="text-[11px] text-purple-600 font-semibold">
              {census.infrastructure.multimediaClassrooms} Multimedia
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Classrooms: <strong className="text-slate-800">{census.infrastructure.classroomsCount}</strong> • Labs:{" "}
            <strong className="text-slate-800">{census.infrastructure.scienceLabsCount}</strong>
          </p>
        </div>
      </div>

      {/* ==============================================================
          INTERACTIVE DATA PREVIEW TABS & VIEWER
      ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print">
        {/* Navigation Tabs Header */}
        <div className="border-b border-slate-200 bg-slate-50/50 p-2 sm:px-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-1 overflow-x-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("enrollment")}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === "enrollment"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>1. Class Enrollment</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("demographics")}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === "demographics"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>2. Demographics & Stipend</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("teachers")}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === "teachers"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>3. Teachers & Staff</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("exams")}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === "exams"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>4. Exam Results</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("infrastructure")}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === "infrastructure"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>5. Infrastructure & ICT</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("students")}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === "students"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>6. Student Master Roster</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("institution")}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === "institution"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>7. Institution Identity</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("subjectwise")}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === "subjectwise"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>8. Class 9-12 Subjectwise Student</span>
            </button>
          </div>
        </div>

        {/* ==============================================================
            TAB 1: CLASS ENROLLMENT TABLE
        ============================================================== */}
        {activeTab === "enrollment" && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Table 2.1: Student Enrollment by Class, Gender & Academic Group
                </h3>
                <p className="text-xs text-slate-500">
                  National Curriculum standard statistical distribution for secondary and higher secondary grades.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadEnrollmentExcel}
                  className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadEnrollmentCSV}
                  className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Class</th>
                    <th className="py-3 px-3 text-right">Total Students</th>
                    <th className="py-3 px-3 text-right">Male</th>
                    <th className="py-3 px-3 text-right">Female</th>
                    <th className="py-3 px-3 text-right">% Girls</th>
                    <th className="py-3 px-3 text-center">Sections</th>
                    <th className="py-3 px-3 text-right">General</th>
                    <th className="py-3 px-3 text-right">Science</th>
                    <th className="py-3 px-3 text-right">Humanities</th>
                    <th className="py-3 px-3 text-right">Business Studies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {census.classStats.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{row.className}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{row.totalStudents}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{row.maleStudents}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{row.femaleStudents}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">{row.femalePercentage}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{row.sectionsCount}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{row.generalCount || "-"}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{row.scienceCount || "-"}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{row.humanitiesCount || "-"}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{row.businessCount || "-"}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td className="py-3 px-3">TOTAL (All Classes)</td>
                    <td className="py-3 px-3 text-right text-emerald-800 font-extrabold">{totalStudents}</td>
                    <td className="py-3 px-3 text-right">{totalMale}</td>
                    <td className="py-3 px-3 text-right">{totalFemale}</td>
                    <td className="py-3 px-3 text-right text-emerald-800">{femaleRatio}%</td>
                    <td className="py-3 px-3 text-center">
                      {census.classStats.reduce((sum, c) => sum + c.sectionsCount, 0)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {census.classStats.reduce((sum, c) => sum + c.generalCount, 0)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {census.classStats.reduce((sum, c) => sum + c.scienceCount, 0)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {census.classStats.reduce((sum, c) => sum + c.humanitiesCount, 0)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {census.classStats.reduce((sum, c) => sum + c.businessCount, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 2: DEMOGRAPHICS & STIPENDS
        ============================================================== */}
        {activeTab === "demographics" && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Table 2.2: Student Demographics, Religions & Social Inclusion
                </h3>
                <p className="text-xs text-slate-500">
                  Religion distribution, stipend holders (উপবৃত্তি), and special needs student census.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const headers = ["Class", "Muslim", "Hindu", "Buddhist", "Christian", "Other", "Stipend", "Special Needs", "Orphan"];
                    const rows = census.demographics.map((d) => [
                      d.className,
                      d.muslimCount,
                      d.hinduCount,
                      d.buddhistCount,
                      d.christianCount,
                      d.otherReligionCount,
                      d.stipendCount,
                      d.specialNeedsCount,
                      d.orphanCount,
                    ]);
                    downloadBanbeisSingleSheetExcel("Demographics", headers, rows, "Demographics_Stipend", census.institution.eiin);
                    showToast("Downloaded Demographics Excel.");
                  }}
                  className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Excel</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Class</th>
                    <th className="py-3 px-3 text-right">Muslim</th>
                    <th className="py-3 px-3 text-right">Hindu</th>
                    <th className="py-3 px-3 text-right">Buddhist</th>
                    <th className="py-3 px-3 text-right">Christian</th>
                    <th className="py-3 px-3 text-right">Other</th>
                    <th className="py-3 px-3 text-right">Stipend (উপবৃত্তি)</th>
                    <th className="py-3 px-3 text-right">Special Needs</th>
                    <th className="py-3 px-3 text-right">Orphan / Single</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {census.demographics.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{row.className}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{row.muslimCount}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{row.hinduCount}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{row.buddhistCount}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{row.christianCount}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{row.otherReligionCount || 0}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-700 bg-amber-50/40">
                        {row.stipendCount}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{row.specialNeedsCount}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{row.orphanCount}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td className="py-3 px-3">TOTAL</td>
                    <td className="py-3 px-3 text-right">{census.demographics.reduce((s, d) => s + d.muslimCount, 0)}</td>
                    <td className="py-3 px-3 text-right">{census.demographics.reduce((s, d) => s + d.hinduCount, 0)}</td>
                    <td className="py-3 px-3 text-right">{census.demographics.reduce((s, d) => s + d.buddhistCount, 0)}</td>
                    <td className="py-3 px-3 text-right">{census.demographics.reduce((s, d) => s + d.christianCount, 0)}</td>
                    <td className="py-3 px-3 text-right">{census.demographics.reduce((s, d) => s + d.otherReligionCount, 0)}</td>
                    <td className="py-3 px-3 text-right text-amber-800 font-extrabold">
                      {census.demographics.reduce((s, d) => s + d.stipendCount, 0)}
                    </td>
                    <td className="py-3 px-3 text-right">{census.demographics.reduce((s, d) => s + d.specialNeedsCount, 0)}</td>
                    <td className="py-3 px-3 text-right">{census.demographics.reduce((s, d) => s + d.orphanCount, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 3: TEACHERS & STAFF
        ============================================================== */}
        {activeTab === "teachers" && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Table 3.1: Faculty & Staff Roster with MPO Enlistment Details
                </h3>
                <p className="text-xs text-slate-500">
                  Total teaching and non-teaching personnel, subject specializations, and professional qualifications.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTeachersExcel}
                  className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTeachersCSV}
                  className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">SL</th>
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-3">Teacher / Staff Name</th>
                    <th className="py-3 px-3">Gender</th>
                    <th className="py-3 px-3">Designation</th>
                    <th className="py-3 px-3">Teaching Subject</th>
                    <th className="py-3 px-3">Highest Degree</th>
                    <th className="py-3 px-3 text-center">B.Ed</th>
                    <th className="py-3 px-3">MPO Status</th>
                    <th className="py-3 px-3">Joining Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {census.teachers.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{t.slNo}</td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-600">{t.empId}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{t.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{t.gender}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">{t.designation}</td>
                      <td className="py-2.5 px-3 text-slate-600">{t.subject}</td>
                      <td className="py-2.5 px-3 text-slate-600">{t.highestDegree}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            t.bEdStatus === "Yes" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {t.bEdStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            t.mpoStatus === "MPO Enlisted"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {t.mpoStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{t.joiningDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 4: EXAM PERFORMANCE
        ============================================================== */}
        {activeTab === "exams" && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Table 4.1: Examination Results & Board Success Records
                </h3>
                <p className="text-xs text-slate-500">
                  Appeared, passed, fail counts, pass percentages, and GPA-5 statistics.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const headers = ["Exam Name", "Session", "Appeared", "Male", "Female", "Passed", "Failed", "Pass %", "GPA-5", "Grade A", "Grade A-", "Grade B", "Grade C", "Grade D"];
                    const rows = census.examStats.map((e) => [
                      e.examName,
                      e.academicYear,
                      e.totalAppeared,
                      e.maleAppeared ?? "-",
                      e.femaleAppeared ?? "-",
                      e.totalPassed,
                      e.totalFailed,
                      e.passPercentage,
                      e.gpa5Count,
                      e.gradeA,
                      e.gradeAMinus,
                      e.gradeB,
                      e.gradeC,
                      e.gradeD,
                    ]);
                    downloadBanbeisSingleSheetExcel("Exam_Performance", headers, rows, "Exam_Results_Stats", census.institution.eiin);
                    showToast("Downloaded Exam Performance Excel.");
                  }}
                  className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Excel</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Examination Name</th>
                    <th className="py-3 px-3 text-center">Session</th>
                    <th className="py-3 px-3 text-right">Appeared</th>
                    <th className="py-3 px-3 text-right">Male</th>
                    <th className="py-3 px-3 text-right">Female</th>
                    <th className="py-3 px-3 text-right">Passed</th>
                    <th className="py-3 px-3 text-right">Failed</th>
                    <th className="py-3 px-3 text-right">Pass %</th>
                    <th className="py-3 px-3 text-right">GPA-5</th>
                    <th className="py-3 px-3 text-right">Grade A</th>
                    <th className="py-3 px-3 text-right">Grade A-</th>
                    <th className="py-3 px-3 text-right">Grade B</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {census.examStats.map((e, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{e.examName}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">{e.academicYear}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{e.totalAppeared}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{e.maleAppeared ?? "-"}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{e.femaleAppeared ?? "-"}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">{e.totalPassed}</td>
                      <td className="py-2.5 px-3 text-right text-rose-600 font-semibold">{e.totalFailed}</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">{e.passPercentage}</td>
                      <td className="py-2.5 px-3 text-right font-black text-amber-700">{e.gpa5Count}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{e.gradeA}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{e.gradeAMinus}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{e.gradeB}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 5: INFRASTRUCTURE & ICT
        ============================================================== */}
        {activeTab === "infrastructure" && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Table 5.1: Physical Infrastructure, Computer Labs & Sanitation Census
                </h3>
                <p className="text-xs text-slate-500">
                  Official physical assets, classrooms, electricity, internet, science labs, and WASH facilities.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const headers = ["Parameter", "Census Value", "Status / Remarks"];
                    const rows = [
                      ["Campus Total Land Area", census.infrastructure.campusLandAcres, "Owned"],
                      ["Total Buildings", census.infrastructure.totalBuildings, "Pucca"],
                      ["Total Rooms", census.infrastructure.totalRooms, "Rooms"],
                      ["Classrooms", census.infrastructure.classroomsCount, "Active"],
                      ["Multimedia Classrooms", census.infrastructure.multimediaClassrooms, "Rooms"],
                      ["Computer Labs", census.infrastructure.computerLabs, "Labs"],
                      ["Computers & Laptops", census.infrastructure.totalFunctionalComputers, "Functional"],
                      ["Science Labs", census.infrastructure.scienceLabsCount, "Labs"],
                      ["Library Books", census.infrastructure.libraryBookCount, "Books"],
                      ["Electricity", census.infrastructure.electricityConnection, "Grid"],
                      ["Solar Panel", census.infrastructure.solarPanelAvailable, "Rooftop"],
                      ["Internet Broadband", census.infrastructure.internetBroadbandSpeed, "Fiber"],
                      ["Safe Water", census.infrastructure.safeDrinkingWaterType, "Safe"],
                      ["Boys Toilets", census.infrastructure.separateBoysToilets, "Toilets"],
                      ["Girls Toilets", census.infrastructure.separateGirlsToilets, "Toilets"],
                      ["Teacher Washrooms", census.infrastructure.teachersWashrooms, "Washrooms"],
                      ["Playground", census.infrastructure.playgroundAvailable, "Field"],
                    ];
                    downloadBanbeisSingleSheetExcel("Infrastructure_ICT", headers, rows, "Infrastructure_ICT", census.institution.eiin);
                    showToast("Downloaded Infrastructure Excel.");
                  }}
                  className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Excel</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Land & Physical Structures</span>
                </h4>
                <div className="divide-y divide-slate-200/80">
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-500">Campus Land Area</span>
                    <strong className="text-slate-800">{census.infrastructure.campusLandAcres}</strong>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-500">Total Buildings</span>
                    <strong className="text-slate-800">{census.infrastructure.totalBuildings} Pucca</strong>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-500">Total Rooms</span>
                    <strong className="text-slate-800">{census.infrastructure.totalRooms} Rooms</strong>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-500">Designated Classrooms</span>
                    <strong className="text-slate-800">{census.infrastructure.classroomsCount} Classrooms</strong>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-500">Perimeter Boundary Wall</span>
                    <strong className="text-slate-800">{census.infrastructure.boundaryWallStatus}</strong>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-500">Playground / Sports Field</span>
                    <strong className="text-slate-800">{census.infrastructure.playgroundAvailable}</strong>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <Laptop className="w-3.5 h-3.5 text-purple-600" />
                  <span>ICT, Labs & Utilities</span>
                </h4>
                <div className="divide-y divide-slate-200/80">
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-500">Multimedia Projector Rooms</span>
                    <strong className="text-slate-800">{census.infrastructure.multimediaClassrooms} Classrooms</strong>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-500">Computer Labs & PCs</span>
                    <strong className="text-slate-800">
                      {census.infrastructure.computerLabs} Labs ({census.infrastructure.totalFunctionalComputers} PCs)
                    </strong>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-500">Broadband Internet</span>
                    <strong className="text-slate-800">{census.infrastructure.internetBroadbandSpeed}</strong>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-500">Science Laboratories</span>
                    <strong className="text-slate-800">{census.infrastructure.scienceLabsCount} Labs</strong>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-500">Library Book Collection</span>
                    <strong className="text-slate-800">{census.infrastructure.libraryBookCount.toLocaleString()} Books</strong>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-500">Sanitary Toilets (Boys / Girls)</span>
                    <strong className="text-slate-800">
                      Boys: {census.infrastructure.separateBoysToilets} • Girls:{" "}
                      {census.infrastructure.separateGirlsToilets}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 6: STUDENT MASTER ROSTER
        ============================================================== */}
        {activeTab === "students" && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Table 6.1: Official Student Master Roster (BANBEIS Specification)
                </h3>
                <p className="text-xs text-slate-500">
                  Comprehensive student identity, roll numbers, guardian contacts, religion, and stipend eligibility.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadStudentsExcel}
                  className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadStudentsCSV}
                  className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search by student name, ID, roll or guardian phone..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium shrink-0">Session:</span>
                  <SessionSelect
                    value={studentSessionFilter}
                    onChange={(val) => setStudentSessionFilter(val)}
                    selectClassName="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium shrink-0">Filter Class:</span>
                  <select
                    value={studentClassFilter}
                    onChange={(e) => setStudentClassFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="ALL">All Classes</option>
                    <option value="Class 6">Class 6</option>
                    <option value="Class 7">Class 7</option>
                    <option value="Class 8">Class 8</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium shrink-0">Stipend:</span>
                  <select
                    value={studentStipendFilter}
                    onChange={(e) => setStudentStipendFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="ALL">All Students ({census.students.length})</option>
                    <option value="Yes">Stipend Recipients ({overallRosterStipendCount})</option>
                    <option value="No">Non-Stipend ({census.students.length - overallRosterStipendCount})</option>
                  </select>
                </div>

                <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                  ({filteredStudents.length} rows)
                </span>
              </div>
            </div>

            {/* Quick KPI Stat Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <span className="text-slate-500 block text-[11px]">Enrolled Students</span>
                <span className="text-base font-bold text-slate-800">{filteredStudents.length}</span>
              </div>
              <div className="bg-amber-50/70 border border-amber-300 rounded-lg p-2.5 shadow-2xs">
                <span className="text-amber-800 block text-[11px] font-bold flex items-center justify-between">
                  <span>Total Stipend (উপবৃত্তি)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 font-bold">{stipendPct}%</span>
                </span>
                <span className="text-base font-black text-amber-900">{totalRosterStipendCount} Students</span>
              </div>
              <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-2.5">
                <span className="text-blue-700 block text-[11px] font-medium">Stipend Boys (ছাত্র)</span>
                <span className="text-base font-bold text-blue-900">{totalRosterMaleStipend}</span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-2.5">
                <span className="text-emerald-700 block text-[11px] font-medium">Stipend Girls (ছাত্রী)</span>
                <span className="text-base font-bold text-emerald-900">{totalRosterFemaleStipend}</span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[480px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
                  <tr>
                    <th className="py-2.5 px-3">Roll</th>
                    <th className="py-2.5 px-3">Student ID</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Class & Section</th>
                    <th className="py-2.5 px-3">Gender</th>
                    <th className="py-2.5 px-3">Religion</th>
                    <th className="py-2.5 px-3">Guardian Name</th>
                    <th className="py-2.5 px-3">Guardian Phone</th>
                    <th className="py-2.5 px-3 text-center">Stipend</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No students found matching current search/filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-bold text-slate-800">{st.classRoll}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{st.studentIdNo}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{st.fullName}</td>
                        <td className="py-2 px-3 text-slate-600">
                          {st.className} • {st.sectionName}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{st.gender}</td>
                        <td className="py-2 px-3 text-slate-600">{st.religion}</td>
                        <td className="py-2 px-3 text-slate-700">{st.guardianName}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">{st.guardianPhone}</td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              st.stipendEligible === "Yes"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {st.stipendEligible}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {st.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                  {filteredStudents.length > 0 && (
                    <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300 sticky bottom-0 z-10 shadow-xs">
                      <td colSpan={4} className="py-2.5 px-3 uppercase tracking-wider">
                        TOTAL ({filteredStudents.length} Students)
                      </td>
                      <td className="py-2.5 px-3">
                        {filteredStudents.filter((s) => s.gender === "Male").length} M / {filteredStudents.filter((s) => s.gender === "Female").length} F
                      </td>
                      <td colSpan={3} className="py-2.5 px-3 text-slate-500 font-normal">
                        Total Stipend Recipients: <strong className="text-amber-800 font-bold">{totalRosterStipendCount}</strong> ({stipendPct}%)
                      </td>
                      <td className="py-2.5 px-3 text-center bg-amber-100/80 border-x border-amber-200">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-black text-amber-900">{totalRosterStipendCount}</span>
                          <span className="text-[9px] text-amber-700 font-semibold uppercase tracking-tighter">Total Stipend</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] text-emerald-700 font-semibold">
                          {filteredStudents.filter((s) => s.status === "Active").length} Active
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 7: INSTITUTION IDENTITY
        ============================================================== */}
        {activeTab === "institution" && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Table 1.1: Basic Institutional Profile & Governance Credentials
                </h3>
                <p className="text-xs text-slate-500">
                  Official identification, registration codes, leadership, address, and academic parameters.
                </p>
              </div>
              <Link
                href="/settings"
                className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                <span>Edit in Settings</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-1/3">Parameter Name</th>
                    <th className="py-3 px-3">Registered Institutional Details</th>
                    <th className="py-3 px-3 w-1/4">Status / Authority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">Institution Name (English)</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{census.institution.name}</td>
                    <td className="py-2.5 px-3 text-slate-500">Registered with Board</td>
                  </tr>
                  {census.institution.nameBn && (
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">Institution Name (Bangla)</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{census.institution.nameBn}</td>
                      <td className="py-2.5 px-3 text-slate-500">বাংলা সংস্করণ</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">EIIN Number</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{census.institution.eiin}</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-semibold">Active & Verified</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">Affiliation Board</td>
                    <td className="py-2.5 px-3 text-slate-800">{census.institution.board || "Dhaka"}</td>
                    <td className="py-2.5 px-3 text-slate-500">BISE Affiliated</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">Founding / Established Year</td>
                    <td className="py-2.5 px-3 text-slate-800">{census.institution.establishedYear || "1994"}</td>
                    <td className="py-2.5 px-3 text-slate-500">Official Recognition</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">Head of Institution</td>
                    <td className="py-2.5 px-3 text-slate-800">
                      {census.institution.headTitle || "Principal"}:{" "}
                      <strong>{census.institution.headName || "Dr. Rafiqul Islam"}</strong>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{census.institution.headPhone || "+880 1711-223344"}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">Campus Location</td>
                    <td className="py-2.5 px-3 text-slate-800">
                      {census.institution.address || "Mirpur, Dhaka"}, {census.institution.thana || "Mirpur"},{" "}
                      {census.institution.district || "Dhaka"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">Post Code: {census.institution.postalCode || "1216"}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">Active Academic Year</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{census.academicYear}</td>
                    <td className="py-2.5 px-3 text-slate-500">Census Period</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 8: CLASS 9-12 SUBJECT-WISE STUDENTS
        ============================================================== */}
        {activeTab === "subjectwise" && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Table 2.3: Class 9-12 Subject-wise Student Census</span>
                  <span className="text-[11px] font-normal text-slate-500">(নবম-দ্বাদশ শ্রেণির বিষয়ভিত্তিক শিক্ষার্থী)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Detailed distribution of secondary & higher secondary students across subjects with male, female, and total gender counts.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSubjectWiseExcel}
                  className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSubjectWiseCSV}
                  className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  placeholder="Search by subject code, subject name, group..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium shrink-0">Session:</span>
                  <SessionSelect
                    value={subjectSessionFilter}
                    onChange={(val) => setSubjectSessionFilter(val)}
                    selectClassName="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium shrink-0">Class:</span>
                  <select
                    value={subjectClassFilter}
                    onChange={(e) => setSubjectClassFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="ALL">All (Class 9 - 12)</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium shrink-0">Group:</span>
                  <select
                    value={subjectGroupFilter}
                    onChange={(e) => setSubjectGroupFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="ALL">All Groups</option>
                    <option value="COMPULSORY">Compulsory (আবশ্যিক)</option>
                    <option value="SCIENCE">Science (বিজ্ঞান)</option>
                    <option value="HUMANITIES">Humanities (মানবিক)</option>
                    <option value="BUSINESS_STUDIES">Business Studies (ব্যবসায় শিক্ষা)</option>
                  </select>
                </div>

                <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                  ({filteredSubjectWise.length} subjects)
                </span>
              </div>
            </div>

            {/* Quick KPI Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <span className="text-slate-500 block text-[11px]">Subject Offerings</span>
                <span className="text-base font-bold text-slate-800">{filteredSubjectWise.length}</span>
              </div>
              <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-2.5">
                <span className="text-blue-700 block text-[11px] font-medium">Male Students (ছাত্র)</span>
                <span className="text-base font-bold text-blue-900">{totalSubjectMale.toLocaleString()}</span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-2.5">
                <span className="text-emerald-700 block text-[11px] font-medium">Female Students (ছাত্রী)</span>
                <span className="text-base font-bold text-emerald-900">{totalSubjectFemale.toLocaleString()}</span>
              </div>
              <div className="bg-purple-50/50 border border-purple-200 rounded-lg p-2.5">
                <span className="text-purple-700 block text-[11px] font-medium">Total Enrollment (মোট)</span>
                <span className="text-base font-bold text-purple-900">{totalSubjectAll.toLocaleString()}</span>
              </div>
            </div>

            {/* Table with Class, Code, Subject Name, Group, Male, Female, Total */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[520px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
                  <tr>
                    <th className="py-3 px-3">Class</th>
                    <th className="py-3 px-3">Subject Code</th>
                    <th className="py-3 px-3">Subject Name</th>
                    <th className="py-3 px-3">Group / Stream</th>
                    <th className="py-3 px-3 text-right">Male</th>
                    <th className="py-3 px-3 text-right">Female</th>
                    <th className="py-3 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubjectWise.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No subject records found matching the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSubjectWise.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{row.className}</td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-600">{row.subjectCode}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{row.subjectName}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              row.groupType === "SCIENCE"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : row.groupType === "HUMANITIES"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : row.groupType === "BUSINESS_STUDIES"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {row.groupType.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">{row.maleStudents}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">{row.femaleStudents}</td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-800 bg-emerald-50/30">
                          {row.totalStudents}
                        </td>
                      </tr>
                    ))
                  )}
                  {filteredSubjectWise.length > 0 && (
                    <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300 sticky bottom-0 z-10">
                      <td colSpan={4} className="py-3 px-3 uppercase tracking-wider">
                        TOTAL (Filtered {filteredSubjectWise.length} Subjects)
                      </td>
                      <td className="py-3 px-3 text-right text-blue-900 font-extrabold">{totalSubjectMale.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-emerald-900 font-extrabold">{totalSubjectFemale.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-emerald-950 font-black text-sm bg-emerald-100/70">
                        {totalSubjectAll.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ==============================================================
          OFFICIAL PRINTABLE REPORT (VISIBLE ONLY IN PRINT VIEW)
      ============================================================== */}
      <div className="hidden print:block font-serif text-slate-950 p-6 space-y-6">
        {/* Government BANBEIS Print Header */}
        <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Government of the People&apos;s Republic of Bangladesh
          </p>
          <p className="text-xs font-bold text-slate-800">
            Ministry of Education • Bangladesh Bureau of Educational Information and Statistics (BANBEIS)
          </p>
          <h1 className="text-xl font-bold uppercase tracking-wider text-slate-950 mt-1">
            ANNUAL EDUCATIONAL SURVEY & STATISTICAL CENSUS REPORT - {census.academicYear}
          </h1>
          <h2 className="text-base font-bold text-slate-900 mt-1">{census.institution.name}</h2>
          {census.institution.nameBn && (
            <p className="text-sm font-semibold text-slate-800">{census.institution.nameBn}</p>
          )}
          <p className="text-xs text-slate-700">
            EIIN: <strong>{census.institution.eiin}</strong> • Board: {census.institution.board || "Dhaka"} •
            Location: {census.institution.address}, {census.institution.district}
          </p>
        </div>

        {/* Print Section 1: Enrollment Summary */}
        <div>
          <h3 className="font-bold text-xs uppercase border-b border-slate-400 pb-1 mb-2">
            1. Class-wise Student Enrollment Summary
          </h3>
          <table className="w-full text-[11px] border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-200">
                <th className="border border-slate-400 p-1.5 text-left">Class</th>
                <th className="border border-slate-400 p-1.5 text-right">Total</th>
                <th className="border border-slate-400 p-1.5 text-right">Male</th>
                <th className="border border-slate-400 p-1.5 text-right">Female</th>
                <th className="border border-slate-400 p-1.5 text-right">% Girls</th>
                <th className="border border-slate-400 p-1.5 text-center">Sections</th>
                <th className="border border-slate-400 p-1.5 text-right">General</th>
                <th className="border border-slate-400 p-1.5 text-right">Science</th>
                <th className="border border-slate-400 p-1.5 text-right">Humanities</th>
                <th className="border border-slate-400 p-1.5 text-right">Business</th>
              </tr>
            </thead>
            <tbody>
              {census.classStats.map((c, i) => (
                <tr key={i}>
                  <td className="border border-slate-400 p-1 font-semibold">{c.className}</td>
                  <td className="border border-slate-400 p-1 text-right font-bold">{c.totalStudents}</td>
                  <td className="border border-slate-400 p-1 text-right">{c.maleStudents}</td>
                  <td className="border border-slate-400 p-1 text-right">{c.femaleStudents}</td>
                  <td className="border border-slate-400 p-1 text-right">{c.femalePercentage}</td>
                  <td className="border border-slate-400 p-1 text-center">{c.sectionsCount}</td>
                  <td className="border border-slate-400 p-1 text-right">{c.generalCount || "-"}</td>
                  <td className="border border-slate-400 p-1 text-right">{c.scienceCount || "-"}</td>
                  <td className="border border-slate-400 p-1 text-right">{c.humanitiesCount || "-"}</td>
                  <td className="border border-slate-400 p-1 text-right">{c.businessCount || "-"}</td>
                </tr>
              ))}
              <tr className="bg-slate-200 font-bold">
                <td className="border border-slate-400 p-1">TOTAL</td>
                <td className="border border-slate-400 p-1 text-right">{totalStudents}</td>
                <td className="border border-slate-400 p-1 text-right">{totalMale}</td>
                <td className="border border-slate-400 p-1 text-right">{totalFemale}</td>
                <td className="border border-slate-400 p-1 text-right">{femaleRatio}%</td>
                <td className="border border-slate-400 p-1 text-center">
                  {census.classStats.reduce((s, c) => s + c.sectionsCount, 0)}
                </td>
                <td className="border border-slate-400 p-1 text-right">
                  {census.classStats.reduce((s, c) => s + c.generalCount, 0)}
                </td>
                <td className="border border-slate-400 p-1 text-right">
                  {census.classStats.reduce((s, c) => s + c.scienceCount, 0)}
                </td>
                <td className="border border-slate-400 p-1 text-right">
                  {census.classStats.reduce((s, c) => s + c.humanitiesCount, 0)}
                </td>
                <td className="border border-slate-400 p-1 text-right">
                  {census.classStats.reduce((s, c) => s + c.businessCount, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Print Section 1.1: Class 9-12 Subject-wise Statistics */}
        <div>
          <h3 className="font-bold text-xs uppercase border-b border-slate-400 pb-1 mb-2">
            1.1 Class 9-12 Subject-wise Student Statistics (বিষয়ভিত্তিক শিক্ষার্থীর সংখ্যা)
          </h3>
          <table className="w-full text-[10px] border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-200">
                <th className="border border-slate-400 p-1 text-left">Class</th>
                <th className="border border-slate-400 p-1 text-left">Code</th>
                <th className="border border-slate-400 p-1 text-left">Subject Name</th>
                <th className="border border-slate-400 p-1 text-left">Group</th>
                <th className="border border-slate-400 p-1 text-right">Male</th>
                <th className="border border-slate-400 p-1 text-right">Female</th>
                <th className="border border-slate-400 p-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(census.subjectWiseStats || []).map((s, i) => (
                <tr key={i}>
                  <td className="border border-slate-400 p-1 font-semibold">{s.className}</td>
                  <td className="border border-slate-400 p-1 font-mono">{s.subjectCode}</td>
                  <td className="border border-slate-400 p-1">{s.subjectName}</td>
                  <td className="border border-slate-400 p-1">{s.groupType.replace("_", " ")}</td>
                  <td className="border border-slate-400 p-1 text-right">{s.maleStudents}</td>
                  <td className="border border-slate-400 p-1 text-right">{s.femaleStudents}</td>
                  <td className="border border-slate-400 p-1 text-right font-bold">{s.totalStudents}</td>
                </tr>
              ))}
              <tr className="bg-slate-200 font-bold">
                <td colSpan={4} className="border border-slate-400 p-1">TOTAL</td>
                <td className="border border-slate-400 p-1 text-right">
                  {(census.subjectWiseStats || []).reduce((acc, s) => acc + s.maleStudents, 0)}
                </td>
                <td className="border border-slate-400 p-1 text-right">
                  {(census.subjectWiseStats || []).reduce((acc, s) => acc + s.femaleStudents, 0)}
                </td>
                <td className="border border-slate-400 p-1 text-right font-extrabold">
                  {(census.subjectWiseStats || []).reduce((acc, s) => acc + s.totalStudents, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Print Section 2: Teaching Staff & Physical Facilities */}
        <div className="grid grid-cols-2 gap-4 text-[11px]">
          <div>
            <h3 className="font-bold text-xs uppercase border-b border-slate-400 pb-1 mb-2">
              2. Faculty & Staff Statistics
            </h3>
            <div className="space-y-1">
              <p>Total Teachers & Staff: <strong>{totalTeachers}</strong></p>
              <p>MPO Enlisted Faculty: <strong>{mpoTeachers}</strong></p>
              <p>Female Teachers: <strong>{femaleTeachers}</strong></p>
              <p>Head of Institution: <strong>{census.institution.headName || "Principal"}</strong></p>
              <p>Exam Controller: <strong>{census.institution.controllerName || "Vice Principal"}</strong></p>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase border-b border-slate-400 pb-1 mb-2">
              3. Physical Facilities & ICT Census
            </h3>
            <div className="space-y-1">
              <p>Total Classrooms: <strong>{census.infrastructure.classroomsCount}</strong></p>
              <p>Multimedia Classrooms: <strong>{census.infrastructure.multimediaClassrooms}</strong></p>
              <p>Computer Labs & PCs: <strong>{census.infrastructure.totalFunctionalComputers} Workstations</strong></p>
              <p>Science Laboratories: <strong>{census.infrastructure.scienceLabsCount}</strong></p>
              <p>Boys / Girls Toilets: <strong>{census.infrastructure.separateBoysToilets} / {census.infrastructure.separateGirlsToilets}</strong></p>
            </div>
          </div>
        </div>

        {/* Print Section 3: Official Certification Signatures */}
        <div className="pt-16 grid grid-cols-2 gap-8 text-center text-xs">
          <div className="border-t border-slate-700 pt-2">
            <p className="font-bold">{census.institution.headName || "Principal / Headmaster"}</p>
            <p className="text-slate-600">Head of Institution & Institutional Seal</p>
            <p className="text-[10px] text-slate-500">Date: ________________________</p>
          </div>
          <div className="border-t border-slate-700 pt-2">
            <p className="font-bold">Upazila Secondary Education Officer (USEO)</p>
            <p className="text-slate-600">Directorate of Secondary & Higher Education</p>
            <p className="text-[10px] text-slate-500">Date: ________________________</p>
          </div>
        </div>
      </div>
    </div>
  );
}

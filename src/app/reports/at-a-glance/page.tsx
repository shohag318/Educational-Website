"use client";

import { useEffect, useState } from "react";
import {
  FileBarChart,
  Printer,
  Sparkles,
  Filter,
  Check,
  RefreshCw,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  Award,
  AlertOctagon,
  RotateCcw,
} from "lucide-react";
import { SessionSelect } from "@/components/SessionSelect";
import { ResultNavHeader } from "@/app/results/ResultNavHeader";

export default function AtAGlancePage() {
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [classTeacher, setClassTeacher] = useState("Md Shohag Mia");
  const [shiftName, setShiftName] = useState("Day");

  const [activeTab, setActiveTab] = useState<"ALL" | "P1" | "P2" | "P3" | "P4" | "P5">("ALL");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const [reportData, setReportData] = useState<any>(null);

  // Fetch initial exams and classes
  useEffect(() => {
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setClasses(data.data);
        }
      })
      .catch((err) => console.error("Error fetching classes:", err));

    fetch("/api/exams")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setExams(data.data);
          // Prefer Dalta exam if exists
          const daltaExam = data.data.find((e: any) =>
            e.name.toLowerCase().includes("final") || e.institution?.name?.includes("Dalta")
          );
          const chosen = daltaExam || data.data[0];
          setSelectedExamId(chosen.id);
          if (chosen.classId) {
            setSelectedClassId(chosen.classId);
          }
        }
      })
      .catch((err) => console.error("Error fetching exams:", err));
  }, []);

  // Fetch report data whenever filters change
  const fetchReport = async () => {
    if (!selectedExamId) return;
    setLoading(true);
    try {
      let url = `/api/reports/at-a-glance?examId=${selectedExamId}`;
      if (selectedClassId) url += `&classId=${selectedClassId}`;
      if (selectedSectionId) url += `&sectionId=${selectedSectionId}`;
      if (selectedGroup && selectedGroup !== "ALL") url += `&groupType=${selectedGroup}`;
      if (selectedShift && selectedShift !== "ALL") url += `&shift=${selectedShift}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setReportData(data);
      } else {
        setReportData(null);
      }
    } catch (e) {
      console.error(e);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedExamId, selectedClassId, selectedSectionId, selectedGroup, selectedShift]);

  // Handle Seeding Dalta PDF Sample Data
  const handleSeedDalta = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/setup/seed-dalta", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSeedSuccess(true);
        setTimeout(() => setSeedSuccess(false), 3000);
        // Refresh exams
        const exRes = await fetch("/api/exams");
        const exData = await exRes.json();
        if (exData.success && exData.data.length > 0) {
          setExams(exData.data);
          const daltaExam = exData.data.find((e: any) =>
            e.name.includes("Year Final Examination-2026")
          );
          if (daltaExam) {
            setSelectedExamId(daltaExam.id);
            if (daltaExam.classId) setSelectedClassId(daltaExam.classId);
          }
        }
      } else {
        alert("Seed error: " + data.error);
      }
    } catch (e: any) {
      alert("Failed to seed: " + e.message);
    } finally {
      setSeeding(false);
    }
  };

  // Exams filtered by selected session and class
  const filteredExams = exams.filter((ex) => {
    if (selectedSession !== "ALL" && ex.academicYear?.yearName && ex.academicYear.yearName !== selectedSession) {
      return false;
    }
    if (selectedClassId && ex.classId !== selectedClassId) {
      return false;
    }
    return true;
  });

  // Sections filtered by selected class, shift, and group
  const currentClass = classes.find((c) => c.id === selectedClassId);
  const activeExam = exams.find((e) => e.id === selectedExamId);
  const effectiveClass = currentClass || classes.find((c) => c.id === activeExam?.classId);
  const classNum = effectiveClass?.numericValue ?? parseInt(effectiveClass?.name?.replace(/\D/g, "") || "0", 10);
  const isClass11Or12 = Boolean(
    effectiveClass && (
      classNum === 11 ||
      classNum === 12 ||
      /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(effectiveClass.name || "")
    )
  );
  const rawSections = currentClass
    ? currentClass.sections || []
    : (reportData?.sections || classes.flatMap((c) => c.sections || []));

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
    const matchingExams = classId ? exams.filter((e) => e.classId === classId) : exams;
    if (matchingExams.length > 0) {
      const stillValid = matchingExams.some((e) => e.id === selectedExamId);
      if (!stillValid) {
        setSelectedExamId(matchingExams[0].id);
      }
    } else {
      setSelectedExamId("");
    }
    const chosenClass = classes.find((c) => c.id === classId);
    const chosenNum = chosenClass?.numericValue ?? parseInt(chosenClass?.name?.replace(/\D/g, "") || "0", 10);
    if (chosenClass && (chosenNum === 11 || chosenNum === 12 || /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(chosenClass.name || ""))) {
      if (selectedGroup === "GENERAL") setSelectedGroup("ALL");
    }
  };

  const handleShiftChange = (newShift: string) => {
    setSelectedShift(newShift);
    if (newShift === "MORNING") setShiftName("Morning");
    else if (newShift === "DAY") setShiftName("Day");
    else if (newShift) setShiftName(newShift.charAt(0) + newShift.slice(1).toLowerCase());
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

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    const chosenExam = exams.find((e) => e.id === examId);
    if (chosenExam?.classId && (!selectedClassId || selectedClassId !== chosenExam.classId)) {
      setSelectedClassId(chosenExam.classId);
      setSelectedSectionId("");
      const chosenClass = classes.find((c) => c.id === chosenExam.classId);
      const chosenNum = chosenClass?.numericValue ?? parseInt(chosenClass?.name?.replace(/\D/g, "") || "0", 10);
      if (chosenClass && (chosenNum === 11 || chosenNum === 12 || /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(chosenClass.name || ""))) {
        if (selectedGroup === "GENERAL") setSelectedGroup("ALL");
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedSession("ALL");
    setSelectedGroup("ALL");
    setSelectedShift("");
    setSelectedSectionId("");
    setShiftName("Day");
  };

  const hasActiveFilters = Boolean(
    (selectedSession && selectedSession !== "ALL") ||
    (selectedGroup && selectedGroup !== "ALL") ||
    selectedShift ||
    selectedSectionId
  );

  // Group label
  const selectedSectionObj = availableSections.find((s: any) => s.id === selectedSectionId);
  const displaySection = selectedSectionObj ? selectedSectionObj.name : "A";
  const displayGroup = selectedGroup !== "ALL"
    ? selectedGroup
    : (selectedSectionObj?.groupType || "Science");

  const displayShift = selectedShift === "MORNING"
    ? "Morning"
    : selectedShift === "DAY"
    ? "Day"
    : selectedShift
    ? (selectedShift.charAt(0) + selectedShift.slice(1).toLowerCase())
    : selectedSectionObj?.shift === "MORNING"
    ? "Morning"
    : selectedSectionObj?.shift === "DAY"
    ? "Day"
    : (selectedSectionObj?.shift || shiftName || "Day");

  const institutionName = reportData?.exam?.institution?.name || "Dalta Degree College";
  const institutionAddress = reportData?.exam?.institution?.address || "Ramgonj, Lakshmipur";
  const className = reportData?.exam?.class || "XI";
  const examName = reportData?.exam?.name || "Year Final Examination-2026";
  const academicYear = reportData?.exam?.academicYear || "2025-2026";

  // Reusable Page Header for Print and Screen
  const ReportHeader = ({ title }: { title: string }) => (
    <div className="text-center font-serif text-slate-900 mb-5 leading-snug">
      <h1 className="text-xl font-bold tracking-tight uppercase">{institutionName}</h1>
      <p className="text-sm font-medium">{institutionAddress}</p>
      <p className="text-sm font-semibold tracking-wide mt-0.5">
        {className}- {displayShift} - {displaySection} - {displayGroup}
      </p>
      <p className="text-sm font-semibold">
        {examName} - {academicYear}
      </p>
      <p className="text-sm font-semibold mt-0.5">
        Class Teacher: <span className="font-bold">{classTeacher}</span>
      </p>
      <div className="mt-2.5">
        <h2 className="text-base font-bold tracking-wide inline-block border-b-2 border-slate-900 pb-0.5 uppercase">
          {title}
        </h2>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      <ResultNavHeader />
      {/* Controls Bar (No Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <FileBarChart className="w-5 h-5 text-emerald-700" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              Result At a Glance
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical summary, grade distribution, pass rates, and failure analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSeedDalta}
            disabled={seeding}
            className={`flex items-center space-x-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
              seedSuccess
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm"
            }`}
            title="Load the exact 26-student Dalta Degree College demo dataset from the reference PDF"
          >
            {seeding ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : seedSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-500" />
            )}
            <span>{seeding ? "Seeding..." : seedSuccess ? "PDF Demo Loaded!" : "Load PDF Demo Data"}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center space-x-2 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Class, Exam Name, Shift, Group, Section */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              At a Glance Report Filters
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* Session Filter */}
          <div>
            <SessionSelect
              value={selectedSession}
              onChange={(val) => setSelectedSession(val)}
              label="Session:"
              labelClassName="font-semibold text-slate-600 block mb-1"
              selectClassName="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
            />
          </div>

          {/* Class Filter */}
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

          {/* Exam Name Filter */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Exam Name:</label>
            <select
              value={selectedExamId}
              onChange={(e) => handleExamChange(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
            >
              {filteredExams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} {ex.class?.name ? `(${ex.class.name})` : ex.institution?.name ? `(${ex.institution.name})` : ""}
                </option>
              ))}
              {filteredExams.length === 0 && (
                <option value="" disabled>
                  No exams for selected class
                </option>
              )}
            </select>
          </div>

          {/* Shift Filter */}
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

          {/* Group Filter */}
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

          {/* Section Filter */}
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
        </div>

        {/* Ledger Metadata Configuration (Class Teacher) */}
        <div className="pt-2 border-t border-slate-100 text-xs">
          <div className="max-w-md">
            <label className="font-semibold text-slate-600 block mb-1">Class Teacher (For Print Header):</label>
            <input
              type="text"
              value={classTeacher}
              onChange={(e) => setClassTeacher(e.target.value)}
              placeholder="e.g. Md Shohag Mia"
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
            />
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 mr-2 uppercase tracking-wide">
            View / Print Target:
          </span>
          {[
            { id: "ALL", label: "Full Report (All 5 Pages)", icon: Layers },
            { id: "P1", label: "Page 1: Result at a Glance", icon: FileBarChart },
            { id: "P2", label: "Page 2: Result Sheet", icon: FileSpreadsheet },
            { id: "P3", label: "Page 3: Grade Statistics By Course", icon: Award },
            { id: "P4", label: "Page 4: Failed Statistics By Course", icon: AlertTriangle },
            { id: "P5", label: "Page 5: Failed Statistics By Course without 4th Subject", icon: AlertOctagon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  isSel
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm font-semibold">Compiling comprehensive At a Glance report...</p>
        </div>
      )}

      {/* Report Canvas Container */}
      {!loading && reportData && (
        <div className="space-y-10 print:space-y-0">
          {/* ========================================================================= */}
          {/* PAGE 1: RESULT AT A GLANCE                                                */}
          {/* ========================================================================= */}
          {(activeTab === "ALL" || activeTab === "P1") && (
            <div className="sheet-page bg-white p-8 sm:p-10 rounded-xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 break-after-page">
              <ReportHeader title="Result at a Glance" />

              {/* Table 1: Core Metrics Grid */}
              <div className="mb-6 overflow-x-auto">
                <table className="w-full text-xs font-serif border-collapse border border-black text-black">
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-1.5 font-bold w-1/4">Total Student</td>
                      <td className="border-r border-black p-1.5 text-center font-bold w-1/4">
                        {reportData.summary.totalStudents}
                      </td>
                      <td className="border-r border-black p-1.5 font-bold w-1/4">Highest Mark In Class</td>
                      <td className="p-1.5 text-center font-bold w-1/4">
                        {reportData.summary.highestMarkInClass}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-1.5 font-bold">Passed</td>
                      <td className="border-r border-black p-1.5 text-center font-bold">
                        {reportData.summary.passedCount}
                      </td>
                      <td className="border-r border-black p-1.5 font-bold">Highest Mark In Section</td>
                      <td className="p-1.5 text-center font-bold">
                        {reportData.summary.highestMarkInSection}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-1.5 font-bold">Failed</td>
                      <td className="border-r border-black p-1.5 text-center font-bold">
                        {reportData.summary.failedCount}
                      </td>
                      <td className="border-r border-black p-1.5 font-bold">Lowest Mark In Class</td>
                      <td className="p-1.5 text-center font-bold">
                        {reportData.summary.lowestMarkInClass}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-1.5 font-bold">Pass Percentage</td>
                      <td className="border-r border-black p-1.5 text-center font-bold">
                        {reportData.summary.passPercentage}
                      </td>
                      <td className="border-r border-black p-1.5 font-bold">Lowest Mark In Section</td>
                      <td className="p-1.5 text-center font-bold">
                        {reportData.summary.lowestMarkInSection}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-1.5 font-bold">Failed Percentage</td>
                      <td className="border-r border-black p-1.5 text-center font-bold">
                        {reportData.summary.failedPercentage}
                      </td>
                      <td className="border-r border-black p-1.5 font-bold">Highest GPA In Class</td>
                      <td className="p-1.5 text-center font-bold">
                        {reportData.summary.highestGpaInClass}
                      </td>
                    </tr>
                    <tr>
                      <td className="border-r border-black p-1.5 font-bold">Highest GPA In Section</td>
                      <td className="border-r border-black p-1.5 text-center font-bold">
                        {reportData.summary.highestGpaInSection}
                      </td>
                      <td className="border-r border-black p-1.5"></td>
                      <td className="p-1.5"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Table 2: List of student on the basis of GPA */}
              <div className="mb-6">
                <div className="text-center font-serif font-bold text-xs mb-1.5 uppercase tracking-wide">
                  List of student on the basis of GPA
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-serif border-collapse border border-black text-black">
                    <thead>
                      <tr className="border-b border-black font-bold">
                        <th className="border-r border-black p-1.5 text-center w-1/4">GPA</th>
                        <th className="p-1.5 text-left pl-3">Student ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.gpaBrackets.map((row: any, idx: number) => (
                        <tr key={idx} className="border-b border-black last:border-b-0">
                          <td className="border-r border-black p-1 text-center font-medium">
                            {row.bracket}
                          </td>
                          <td className="p-1 pl-3 font-medium">
                            {row.display}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 3: Failed according to number of subjects */}
              <div className="mb-6">
                <div className="text-center font-serif font-bold text-xs mb-1.5 uppercase tracking-wide">
                  Failed according to number of subjects
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-serif border-collapse border border-black text-black">
                    <thead>
                      <tr className="border-b border-black font-bold">
                        <th className="border-r border-black p-1.5 text-center w-1/4">Number Of Subject</th>
                        <th className="p-1.5 text-left pl-3">Student ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.failedBrackets.map((row: any, idx: number) => (
                        <tr key={idx} className="border-b border-black last:border-b-0">
                          <td className="border-r border-black p-1 text-center font-medium">
                            {row.bracket}
                          </td>
                          <td className="p-1 pl-3 font-medium">
                            {row.display}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 4: Subjectwise Result Analysis */}
              <div>
                <div className="font-serif font-bold text-xs mb-1.5">
                  Subjectwise Result Analysis:
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-serif border-collapse border border-black text-black text-center">
                    <thead>
                      <tr className="border-b border-black font-bold">
                        <th className="border-r border-black p-1 w-10">Sl.</th>
                        <th className="border-r border-black p-1 text-center">Subject</th>
                        <th className="border-r border-black p-1 w-32">Number of student passed</th>
                        <th className="border-r border-black p-1 w-28">Pass percentage</th>
                        <th className="border-r border-black p-1 w-32">Number of student failed</th>
                        <th className="p-1 w-28">Failed percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.subjectwiseAnalysis.map((sub: any) => (
                        <tr key={sub.sl} className="border-b border-black last:border-b-0">
                          <td className="border-r border-black p-1">{sub.sl}</td>
                          <td className="border-r border-black p-1 text-center font-medium">
                            {sub.subjectName}
                          </td>
                          <td className="border-r border-black p-1">{sub.passedCount}</td>
                          <td className="border-r border-black p-1">{sub.passPercentage}</td>
                          <td className="border-r border-black p-1">{sub.failedCount}</td>
                          <td className="p-1">{sub.failedPercentage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PAGE 2: RESULT SHEET                                                      */}
          {/* ========================================================================= */}
          {(activeTab === "ALL" || activeTab === "P2") && (
            <div className="sheet-page bg-white p-8 sm:p-10 rounded-xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 break-after-page">
              <ReportHeader title="Result Sheet" />

              <div className="overflow-x-auto">
                <table className="w-full text-[11px] font-serif border-collapse border border-black text-black">
                  <thead>
                    <tr className="border-b border-black font-bold text-center">
                      <th className="border-r border-black p-1 w-8" rowSpan={2}>
                        Sl.
                      </th>
                      <th className="border-r border-black p-1 text-left pl-2" rowSpan={2}>
                        Student Name
                      </th>
                      <th className="border-r border-black p-1 w-12" rowSpan={2}>
                        Roll No
                      </th>
                      <th className="border-r border-black p-1 w-20" rowSpan={2}>
                        Student ID
                      </th>
                      <th className="border-r border-black p-1 w-16" rowSpan={2}>
                        Total Mark
                      </th>
                      <th className="border-r border-black p-1 w-12" rowSpan={2}>
                        GPA
                      </th>
                      <th className="border-r border-black p-1 w-12" rowSpan={2}>
                        Grade
                      </th>
                      <th className="border-r border-black p-0.5" colSpan={2}>
                        Position
                      </th>
                      <th className="p-0.5" colSpan={7}>
                        No. Of Grade
                      </th>
                    </tr>
                    <tr className="border-b border-black font-bold text-center text-[10px]">
                      <th className="border-r border-black p-1 w-14">In Section</th>
                      <th className="border-r border-black p-1 w-14">In Class</th>
                      <th className="border-r border-black p-1 w-7">A+</th>
                      <th className="border-r border-black p-1 w-7">A</th>
                      <th className="border-r border-black p-1 w-7">A-</th>
                      <th className="border-r border-black p-1 w-7">B</th>
                      <th className="border-r border-black p-1 w-7">C</th>
                      <th className="border-r border-black p-1 w-7">D</th>
                      <th className="p-1 w-7">F</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.resultSheet.map((row: any) => (
                      <tr key={row.sl} className="border-b border-black last:border-b-0 text-center">
                        <td className="border-r border-black p-1">{row.sl}</td>
                        <td className="border-r border-black p-1 text-left pl-2 whitespace-nowrap font-medium">
                          {row.studentName}
                        </td>
                        <td className="border-r border-black p-1">{row.roll}</td>
                        <td className="border-r border-black p-1">{row.studentId}</td>
                        <td className="border-r border-black p-1">{row.totalMark}</td>
                        <td className="border-r border-black p-1 font-semibold">{row.gpa}</td>
                        <td className="border-r border-black p-1 font-semibold">{row.grade}</td>
                        <td className="border-r border-black p-1">{row.positionSection}</td>
                        <td className="border-r border-black p-1">{row.positionClass}</td>
                        <td className="border-r border-black p-1">{row.gradeCounts["A+"]}</td>
                        <td className="border-r border-black p-1">{row.gradeCounts["A"]}</td>
                        <td className="border-r border-black p-1">{row.gradeCounts["A-"]}</td>
                        <td className="border-r border-black p-1">{row.gradeCounts["B"]}</td>
                        <td className="border-r border-black p-1">{row.gradeCounts["C"]}</td>
                        <td className="border-r border-black p-1">{row.gradeCounts["D"]}</td>
                        <td className="p-1">{row.gradeCounts["F"]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PAGE 3: GRADE STATISTICS BY COURSE                                        */}
          {/* ========================================================================= */}
          {(activeTab === "ALL" || activeTab === "P3") && (
            <div className="sheet-page bg-white p-8 sm:p-10 rounded-xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 break-after-page">
              <ReportHeader title="Grade Statistics By Course" />

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-serif border-collapse border border-black text-black">
                  <thead>
                    <tr className="border-b border-black font-bold text-center">
                      <th className="border-r border-black p-2 text-center w-2/5">
                        Subject Name
                      </th>
                      <th className="border-r border-black p-2 w-12">A+</th>
                      <th className="border-r border-black p-2 w-12">A</th>
                      <th className="border-r border-black p-2 w-12">A-</th>
                      <th className="border-r border-black p-2 w-12">B</th>
                      <th className="border-r border-black p-2 w-12">C</th>
                      <th className="border-r border-black p-2 w-12">D</th>
                      <th className="p-2 w-12">F</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.gradeStatisticsByCourse.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-black last:border-b-0 text-center">
                        <td className="border-r border-black p-1.5 text-left pl-3 font-medium">
                          {row.subjectName}
                        </td>
                        <td className="border-r border-black p-1.5">{row.counts["A+"]}</td>
                        <td className="border-r border-black p-1.5">{row.counts["A"]}</td>
                        <td className="border-r border-black p-1.5">{row.counts["A-"]}</td>
                        <td className="border-r border-black p-1.5">{row.counts["B"]}</td>
                        <td className="border-r border-black p-1.5">{row.counts["C"]}</td>
                        <td className="border-r border-black p-1.5">{row.counts["D"]}</td>
                        <td className="p-1.5">{row.counts["F"]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PAGE 4: FAILED STATISTICS BY COURSE                                       */}
          {/* ========================================================================= */}
          {(activeTab === "ALL" || activeTab === "P4") && (
            <div className={`sheet-page bg-white p-8 sm:p-10 rounded-xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 ${activeTab === "ALL" ? "break-after-page" : ""}`}>
              <ReportHeader title="Failed Statistics By Course" />

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-serif border-collapse border border-black text-black">
                  <thead>
                    <tr className="border-b border-black font-bold text-center">
                      <th className="border-r border-black p-2 w-24">Student ID</th>
                      <th className="border-r border-black p-2 text-left pl-3">Name</th>
                      <th className="border-r border-black p-2 w-14">Roll</th>
                      <th className="border-r border-black p-2 w-20">Fail Sub Qty</th>
                      <th className="p-2 text-left pl-3">Fail Sub Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.failedStatisticsByCourse.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-black last:border-b-0">
                        <td className="border-r border-black p-1.5 text-center font-medium">
                          {row.studentId}
                        </td>
                        <td className="border-r border-black p-1.5 pl-3 font-medium whitespace-nowrap">
                          {row.studentName}
                        </td>
                        <td className="border-r border-black p-1.5 text-center font-medium">
                          {row.roll}
                        </td>
                        <td className="border-r border-black p-1.5 text-center font-medium">
                          {row.failQty}
                        </td>
                        <td className="p-1.5 pl-3 font-medium leading-relaxed">
                          {row.failSubNames}
                        </td>
                      </tr>
                    ))}
                    {reportData.failedStatisticsByCourse.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center italic text-slate-500">
                          Outstanding! No students failed in this examination session.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PAGE 5: FAILED STATISTICS BY COURSE WITHOUT 4TH SUBJECT                   */}
          {/* ========================================================================= */}
          {(activeTab === "ALL" || activeTab === "P5") && (
            <div className="sheet-page bg-white p-8 sm:p-10 rounded-xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0">
              <ReportHeader title="Failed Statistics By Course without 4th Subject" />

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-serif border-collapse border border-black text-black">
                  <thead>
                    <tr className="border-b border-black font-bold text-center">
                      <th className="border-r border-black p-2 w-24">Student ID</th>
                      <th className="border-r border-black p-2 text-left pl-3">Name</th>
                      <th className="border-r border-black p-2 w-14">Roll</th>
                      <th className="border-r border-black p-2 w-20">Fail Sub Qty</th>
                      <th className="p-2 text-left pl-3">Fail Sub Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.failedStatisticsByCourseWithoutFourth || []).map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-black last:border-b-0">
                        <td className="border-r border-black p-1.5 text-center font-medium">
                          {row.studentId}
                        </td>
                        <td className="border-r border-black p-1.5 pl-3 font-medium whitespace-nowrap">
                          {row.studentName}
                        </td>
                        <td className="border-r border-black p-1.5 text-center font-medium">
                          {row.roll}
                        </td>
                        <td className="border-r border-black p-1.5 text-center font-medium">
                          {row.failQty}
                        </td>
                        <td className="p-1.5 pl-3 font-medium leading-relaxed">
                          {row.failSubNames}
                        </td>
                      </tr>
                    ))}
                    {(!reportData.failedStatisticsByCourseWithoutFourth || reportData.failedStatisticsByCourseWithoutFourth.length === 0) && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center italic text-slate-500">
                          Outstanding! No students failed in any mandatory or elective course (excluding 4th subject).
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Data State */}
      {!loading && !reportData && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <FileBarChart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Exam Results Available</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Please select an exam that has processed results, or click &quot;Load PDF Demo Data&quot; to test with the 26-student Dalta Degree College dataset.
          </p>
        </div>
      )}
    </div>
  );
}

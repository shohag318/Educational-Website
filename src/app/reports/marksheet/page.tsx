"use client";

import { useEffect, useState } from "react";
import { Award, Printer, ChevronLeft, ChevronRight, User, Filter, RotateCcw, Layers } from "lucide-react";
import { SessionSelect } from "@/components/SessionSelect";
import { ResultNavHeader } from "@/app/results/ResultNavHeader";

// Reusable official NCTB Report Card Sheet Component
function ReportCardSheet({ reportData }: { reportData: any }) {
  if (!reportData) return null;

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-300 p-8 shadow-sm print:border-none print:shadow-none print:p-0 space-y-6 text-slate-900 page-break mb-8 print:mb-0">
      {/* Header & Grading Table */}
      <div className="grid grid-cols-3 items-start border-b-2 border-slate-900 pb-4">
        <div className="col-span-2 space-y-1">
          <h1 className="text-xl font-extrabold uppercase tracking-wide">
            {reportData.institution?.name || "Dhaka Ideal Model High School & College"}
          </h1>
          <p className="text-xs text-slate-600">
            {reportData.institution?.address || "Mirpur, Dhaka, Bangladesh"} • EIIN: {reportData.institution?.code || "108254"}
          </p>
          <div className="pt-2">
            <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded">
              ACADEMIC TRANSCRIPT
            </span>
          </div>
          <div className="text-xs font-bold text-slate-800 pt-1">
            {reportData.exam?.name} - {reportData.exam?.year}
          </div>
        </div>

        {/* NCTB Grade Legend Matrix */}
        <div className="border border-slate-400 text-[9px] rounded overflow-hidden">
          <div className="bg-slate-100 font-bold text-center p-1 border-b border-slate-400">
            NCTB GRADING SYSTEM
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-300 p-0.5 text-center font-mono">
            <div className="font-semibold">Range</div>
            <div className="font-semibold">Grade</div>
            <div className="font-semibold">GP</div>
          </div>
          <div className="divide-y divide-slate-200 font-mono text-[8px] text-center">
            <div className="grid grid-cols-3 divide-x divide-slate-200">
              <div>80 - 100</div>
              <div className="font-bold">A+</div>
              <div>5.00</div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-200">
              <div>70 - 79</div>
              <div className="font-bold">A</div>
              <div>4.00</div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-200">
              <div>60 - 69</div>
              <div className="font-bold">A-</div>
              <div>3.50</div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-200">
              <div>50 - 59</div>
              <div className="font-bold">B</div>
              <div>3.00</div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-200">
              <div>40 - 49</div>
              <div className="font-bold">C</div>
              <div>2.00</div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-200">
              <div>33 - 39</div>
              <div className="font-bold">D</div>
              <div>1.00</div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-200">
              <div>00 - 32</div>
              <div className="font-bold text-red-600">F</div>
              <div>0.00</div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Profile Info */}
      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 font-sans">
        <div>
          <span className="text-slate-500">Student Name:</span>{" "}
          <strong className="text-slate-900">{reportData.student?.name}</strong>
        </div>
        <div>
          <span className="text-slate-500">Class Roll:</span>{" "}
          <strong className="text-slate-900 font-mono">#{reportData.student?.roll}</strong>
        </div>
        <div>
          <span className="text-slate-500">Class & Section:</span>{" "}
          <strong className="text-slate-900">
            {reportData.student?.className} ({reportData.student?.sectionName})
            {reportData.student?.shift ? ` • Shift: ${reportData.student.shift}` : ""}
          </strong>
        </div>
        <div>
          <span className="text-slate-500">Academic Group:</span>{" "}
          <strong className="text-slate-900">{reportData.student?.group || "General"}</strong>
        </div>
        <div>
          <span className="text-slate-500">Student ID / Reg:</span>{" "}
          <strong className="text-slate-900 font-mono">{reportData.student?.idNo}</strong>
        </div>
        <div>
          <span className="text-slate-500">Guardian Name:</span>{" "}
          <strong className="text-slate-900">{reportData.student?.guardianName || "N/A"}</strong>
        </div>
      </div>

      {/* Subject-Wise Marks Breakdown Table */}
      <div className="border border-slate-300 rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
            <tr>
              <th className="p-2 border-r border-slate-300">Code</th>
              <th className="p-2 border-r border-slate-300">Subject Name</th>
              <th className="p-2 border-r border-slate-300 text-center">Type</th>
              <th className="p-2 border-r border-slate-300 text-center">Marks (CQ+MCQ+Prac)</th>
              <th className="p-2 border-r border-slate-300 text-center">Total</th>
              <th className="p-2 border-r border-slate-300 text-center">Grade</th>
              <th className="p-2 text-center">GP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
            {reportData.subjects?.map((sub: any) => {
              const is4th = sub.subjectType === "OPTIONAL_4TH";
              return (
                <tr key={sub.id} className={is4th ? "bg-amber-50/50" : ""}>
                  <td className="p-2 border-r border-slate-200 text-slate-600">
                    {sub.subject?.subjectCode}
                  </td>
                  <td className="p-2 border-r border-slate-200 font-sans font-medium text-slate-900">
                    {sub.subject?.name}
                    {is4th && (
                      <span className="text-[10px] text-amber-800 font-bold ml-1.5 font-mono">
                        [4th Subject]
                      </span>
                    )}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-center font-sans text-[10px]">
                    {sub.subjectType}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-center text-slate-600">
                    {sub.components?.map((c: any) => `${c.name}:${c.obtained}`).join(" | ") || "-"}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-900">
                    {sub.totalObtainedMarks}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-center font-bold">
                    <span
                      className={
                        sub.letterGrade === "F"
                          ? "text-red-600 font-bold"
                          : sub.letterGrade === "A+"
                          ? "text-emerald-700"
                          : "text-slate-800"
                      }
                    >
                      {sub.letterGrade}
                    </span>
                  </td>
                  <td className="p-2 text-center font-bold text-slate-900">
                    {sub.gradePoint?.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* NCTB GPA Summary Grid */}
      <div className="border-2 border-slate-300 rounded-xl p-4 bg-slate-50/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-500">Total Marks</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
            {reportData.summary?.totalObtainedMarks}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-500">GPA (Without 4th)</div>
          <div className="text-xl font-bold font-mono text-slate-800 mt-0.5">
            {reportData.summary?.gpaWithoutFourth?.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-amber-700">4th Sub Bonus GP</div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-0.5">
            +{reportData.summary?.fourthBonus?.toFixed(2)}
          </div>
        </div>
        <div className="bg-emerald-100 rounded-lg p-2 border border-emerald-300">
          <div className="text-[10px] uppercase font-extrabold text-emerald-900">
            FINAL GPA (Capped 5.0)
          </div>
          <div className="text-2xl font-black font-mono text-emerald-950">
            {reportData.summary?.finalGpa?.toFixed(2)} ({reportData.summary?.finalGrade})
          </div>
        </div>
      </div>

      {/* Merit Rank & Status */}
      <div className="flex items-center justify-between text-xs px-2">
        <div className="space-x-4">
          <span>
            Class Merit Rank:{" "}
            <strong className="font-mono text-slate-900">
              {reportData.summary?.isPassed ? `#${reportData.summary?.classRank}` : "N/A"}
            </strong>
          </span>
          <span>
            Section Rank:{" "}
            <strong className="font-mono text-slate-900">
              {reportData.summary?.isPassed ? `#${reportData.summary?.sectionRank}` : "N/A"}
            </strong>
          </span>
        </div>
        <div>
          Final Result:{" "}
          <span
            className={`font-bold px-2 py-0.5 rounded text-xs ${
              reportData.summary?.isPassed
                ? "bg-emerald-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {reportData.summary?.isPassed ? "PASSED" : "FAILED"}
          </span>
        </div>
      </div>

      {/* Signatures */}
      <div className="pt-16 grid grid-cols-3 gap-6 text-center text-xs font-semibold text-slate-700">
        <div className="border-t border-slate-400 pt-2">Class Teacher</div>
        <div className="border-t border-slate-400 pt-2">Exam Controller</div>
        <div className="border-t border-slate-400 pt-2">Headmaster / Principal</div>
      </div>
    </div>
  );
}

export default function MarksheetPage() {
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [students, setStudents] = useState<any[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("");
  const [rollInput, setRollInput] = useState("");

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // All at a time print states
  const [viewMode, setViewMode] = useState<"SINGLE" | "ALL">("SINGLE");
  const [allReportCards, setAllReportCards] = useState<any[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);

  // Fetch classes and exams on mount
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
          const firstExam = data.data[0];
          setSelectedExamId(firstExam.id);
          if (firstExam.classId) {
            setSelectedClassId(firstExam.classId);
          }
        }
      })
      .catch((err) => console.error("Error fetching exams:", err));
  }, []);

  // Fetch students matching selected class, section, shift, and group
  useEffect(() => {
    if (!selectedExamId) return;
    const exam = exams.find((e) => e.id === selectedExamId);
    const classId = selectedClassId || exam?.classId;
    if (!classId) return;

    const params = new URLSearchParams();
    params.set("classId", classId);
    if (selectedSectionId) params.set("sectionId", selectedSectionId);
    if (selectedShift && selectedShift !== "ALL") params.set("shift", selectedShift);
    if (selectedGroup && selectedGroup !== "ALL") params.set("groupType", selectedGroup);

    fetch(`/api/students?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setStudents(data.data);
          if (data.data.length > 0) {
            const stillValid = data.data.some((s: any) => s.id === selectedEnrollmentId);
            if (!stillValid) {
              setSelectedEnrollmentId(data.data[0].id);
            }
          } else {
            setSelectedEnrollmentId("");
          }
        } else {
          setStudents([]);
          setSelectedEnrollmentId("");
        }
      })
      .catch((err) => {
        console.error("Error fetching students:", err);
        setStudents([]);
        setSelectedEnrollmentId("");
      });
  }, [selectedExamId, selectedClassId, selectedSectionId, selectedShift, selectedGroup]);

  // Sync rollInput when selected enrollment changes
  useEffect(() => {
    const curr = students.find((s) => s.id === selectedEnrollmentId);
    if (curr) {
      setRollInput(String(curr.classRoll));
    } else {
      setRollInput("");
    }
  }, [selectedEnrollmentId, students]);

  // Fetch report card data for selected student
  const fetchReportCard = async () => {
    if (!selectedExamId || !selectedEnrollmentId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports/marksheet/${selectedEnrollmentId}?examId=${selectedExamId}`
      );
      const data = await res.json();
      if (data.success) {
        setReportData(data.reportCard);
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
    fetchReportCard();
  }, [selectedExamId, selectedEnrollmentId]);

  // Fetch all report cards for bulk printing
  const fetchAllReportCards = async () => {
    if (!selectedExamId) return [];
    setLoadingAll(true);
    try {
      const exam = exams.find((e) => e.id === selectedExamId);
      const classId = selectedClassId || exam?.classId;
      const params = new URLSearchParams();
      params.set("examId", selectedExamId);
      if (classId) params.set("classId", classId);
      if (selectedSectionId) params.set("sectionId", selectedSectionId);
      if (selectedShift && selectedShift !== "ALL") params.set("shift", selectedShift);
      if (selectedGroup && selectedGroup !== "ALL") params.set("groupType", selectedGroup);

      const res = await fetch(`/api/reports/marksheet/bulk?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.reportCards) {
        setAllReportCards(data.reportCards);
        return data.reportCards;
      }
      return [];
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoadingAll(false);
    }
  };

  useEffect(() => {
    if (viewMode === "ALL") {
      fetchAllReportCards();
    }
  }, [viewMode, selectedExamId, selectedClassId, selectedSectionId, selectedShift, selectedGroup]);

  // Filtered exams by selected session and class
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
  };

  const hasActiveFilters = Boolean(
    (selectedSession && selectedSession !== "ALL") ||
    (selectedGroup && selectedGroup !== "ALL") ||
    selectedShift ||
    selectedSectionId
  );

  const currentIndex = students.findIndex((s) => s.id === selectedEnrollmentId);

  const handlePrevStudent = () => {
    if (currentIndex > 0) {
      setSelectedEnrollmentId(students[currentIndex - 1].id);
    }
  };

  const handleNextStudent = () => {
    if (currentIndex < students.length - 1) {
      setSelectedEnrollmentId(students[currentIndex + 1].id);
    }
  };

  // Direct roll number search / jump
  const handleRollSearch = (val: string) => {
    setRollInput(val);
    if (val.trim()) {
      const rollNum = parseInt(val.trim(), 10);
      const found = students.find((s) => s.classRoll === rollNum);
      if (found) {
        setSelectedEnrollmentId(found.id);
      }
    }
  };

  // Print all report cards at a time
  const handlePrintAll = async () => {
    setViewMode("ALL");
    let cards = allReportCards;
    if (cards.length === 0 || cards.length !== students.length) {
      cards = await fetchAllReportCards();
    }
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // Print current student's report card
  const handlePrintCurrent = () => {
    setViewMode("SINGLE");
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ResultNavHeader />
      {/* Print Page Break Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Title */}
      <div className="no-print">
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Award className="w-5 h-5 text-emerald-600" />
          <span>Student Report Cards</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Print official individual or batch student academic transcripts and report cards.
        </p>
      </div>

      {/* Standardized Filter Bar: Class, Exam Name, Shift, Group, Section */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Report Card Selection Filters
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
                  {ex.name} {ex.class?.name ? `(${ex.class.name})` : ""} [{ex.status}]
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
      </div>

      {/* Student Selector, Roll Option & Print Controls (No Print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs space-y-3 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* View Mode Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setViewMode("SINGLE")}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center space-x-1.5 ${
                viewMode === "SINGLE"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Single Student</span>
            </button>
            <button
              onClick={() => {
                setViewMode("ALL");
                if (allReportCards.length === 0) fetchAllReportCards();
              }}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center space-x-1.5 ${
                viewMode === "ALL"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All at a time ({students.length})</span>
            </button>
          </div>

          {/* Action Print Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrintCurrent}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Single (Roll #{rollInput || "-"})</span>
            </button>

            <button
              onClick={handlePrintAll}
              disabled={loadingAll || students.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{loadingAll ? "Preparing All..." : `Print All at a time (${students.length})`}</span>
            </button>
          </div>
        </div>

        {/* Student Picker, Roll Input & Stepper */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-2 border-t border-slate-100">
          {/* Quick Roll Input */}
          <div className="w-28 flex-shrink-0">
            <label className="font-semibold text-slate-700 block mb-1">Roll No:</label>
            <input
              type="number"
              min="1"
              value={rollInput}
              onChange={(e) => handleRollSearch(e.target.value)}
              placeholder="Roll #"
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-800 text-center bg-white"
            />
          </div>

          {/* Student Dropdown */}
          <div className="flex-1 min-w-[240px]">
            <label className="font-semibold text-slate-700 block mb-1">
              Select Student ({students.length} found):
            </label>
            <select
              value={selectedEnrollmentId}
              onChange={(e) => setSelectedEnrollmentId(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  Roll #{st.classRoll} - {st.student.firstName} {st.student.lastName}
                  {st.section?.name ? ` [Sec: ${st.section.name}]` : ""}
                  {st.section?.shift ? ` [${st.section.shift === "MORNING" ? "Morning" : "Day"}]` : ""}
                </option>
              ))}
              {students.length === 0 && (
                <option value="" disabled>
                  No students in selected filter
                </option>
              )}
            </select>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center space-x-1 pb-0.5">
            <button
              onClick={handlePrevStudent}
              disabled={currentIndex <= 0}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Previous Student"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            </button>
            <span className="text-[11px] text-slate-500 px-2 font-mono whitespace-nowrap">
              {students.length > 0 ? `${currentIndex + 1} / ${students.length}` : "0 / 0"}
            </span>
            <button
              onClick={handleNextStudent}
              disabled={currentIndex >= students.length - 1}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Next Student"
            >
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Report Cards Rendering Canvas */}
      {viewMode === "ALL" ? (
        <div className="space-y-8 print:space-y-0">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center justify-between no-print">
            <span>
              Showing Batch View: All {allReportCards.length} student report cards ready for batch printing.
            </span>
            <button
              onClick={() => window.print()}
              className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center space-x-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print All Cards</span>
            </button>
          </div>

          {loadingAll ? (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400 italic text-xs">
              Loading all {students.length} report cards...
            </div>
          ) : allReportCards.length > 0 ? (
            allReportCards.map((card) => (
              <ReportCardSheet key={card.id || card.enrollmentId} reportData={card} />
            ))
          ) : (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400 italic text-xs">
              No report cards found for the selected filter.
            </div>
          )}
        </div>
      ) : reportData ? (
        <ReportCardSheet reportData={reportData} />
      ) : (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400 italic text-xs">
          {loading
            ? "Generating printable report card..."
            : "No report card available. Process results first."}
        </div>
      )}
    </div>
  );
}

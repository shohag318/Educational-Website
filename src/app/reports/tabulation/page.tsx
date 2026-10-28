"use client";

import { useEffect, useState } from "react";
import { FileSpreadsheet, Printer, Filter, RotateCcw } from "lucide-react";
import { SessionSelect } from "@/components/SessionSelect";
import { ResultNavHeader } from "@/app/results/ResultNavHeader";

export default function TabulationPage() {
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [tabulation, setTabulation] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [combinedRules, setCombinedRules] = useState<any[]>([]);
  const [examMeta, setExamMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

  const fetchTabulation = async () => {
    if (!selectedExamId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("examId", selectedExamId);
      if (selectedSectionId) params.set("sectionId", selectedSectionId);
      if (selectedShift && selectedShift !== "ALL") params.set("shift", selectedShift);
      if (selectedGroup && selectedGroup !== "ALL") params.set("groupType", selectedGroup);

      const res = await fetch(`/api/reports/tabulation?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTabulation(data.tabulation);
        setSubjects(data.subjects);
        setCombinedRules(data.combinedRules || []);
        setExamMeta(data.exam);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabulation();
  }, [selectedExamId, selectedClassId, selectedSectionId, selectedShift, selectedGroup]);

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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ResultNavHeader />
      {/* Controls Bar (No Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Tabulation Sheet</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full academic broadsheet with subject marks, GPA, and merit positions.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center space-x-2 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Tabulation</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Class, Exam Name, Shift, Group, Section */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Tabulation Sheet Filters
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

      {/* Tabulation Sheet Document Canvas */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        {/* Institutional Header */}
        <div className="text-center border-b pb-4 mb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-wide">
            {examMeta?.institution?.name || "Dhaka Ideal Model High School & College"}
          </h2>
          <p className="text-xs text-slate-500">
            {examMeta?.institution?.address || "Mirpur, Dhaka, Bangladesh"} • EIIN: {examMeta?.institution?.code || "108254"}
          </p>
          <div className="mt-2 inline-block bg-slate-100 text-slate-800 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
            {examMeta?.name} - TABULATION SHEET
          </div>
          <div className="text-xs text-slate-600 mt-1 font-medium">
            Class: {examMeta?.class?.name || (classes.find((c) => c.id === selectedClassId)?.name || "All")}
            {selectedShift ? ` • Shift: ${selectedShift === "MORNING" ? "Morning" : selectedShift === "DAY" ? "Day" : selectedShift}` : ""}
            {selectedSectionId ? ` • Section: ${availableSections.find((s: any) => s.id === selectedSectionId)?.name}` : ""}
            {selectedGroup && selectedGroup !== "ALL" ? ` • Group: ${selectedGroup}` : ""}
            {" • Year: "}{examMeta?.academicYear?.yearName || "2026"}
          </div>

          {combinedRules.length > 0 && (
            <div className="mt-2.5 inline-flex flex-wrap items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs text-emerald-800 font-medium">
              <span className="font-bold">🔗 Combined Subject Pass Rules:</span>
              {combinedRules.map((cr) => (
                <span key={cr.id} className="bg-white border border-emerald-300 px-2 py-0.5 rounded-md text-[11px] shadow-xs">
                  {cr.name || `${cr.primarySubject?.name || '1st'} + ${cr.secondarySubject?.name || '2nd'}`} (Pass ≥ {cr.combinedPassMark})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* The Matrix */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-800 text-center font-bold text-[11px]">
                <th className="border border-slate-300 p-2 w-12" rowSpan={2}>
                  Class Rank
                </th>
                <th className="border border-slate-300 p-2 w-12" rowSpan={2}>
                  Roll
                </th>
                <th className="border border-slate-300 p-2 text-left" rowSpan={2}>
                  Student Name
                </th>
                <th className="border border-slate-300 p-2 w-16" rowSpan={2}>
                  Section
                </th>

                {/* Subject Headers */}
                {subjects.map((sub) => {
                  const rule = combinedRules.find(
                    (r) => r.primarySubjectId === sub.id || r.secondarySubjectId === sub.id
                  );
                  const isPrimary = rule?.primarySubjectId === sub.id;
                  const partner = isPrimary ? rule?.secondarySubject : rule?.primarySubject;
                  return (
                    <th key={sub.id} className="border border-slate-300 p-2 text-center" colSpan={3}>
                      <div className="font-bold">{sub.name} ({sub.subjectCode})</div>
                      {rule && (
                        <div className="text-[9px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-1 py-0.5 mt-0.5 inline-block">
                          🔗 Combined w/ {partner?.subjectCode || "Paper"} (Pass: {rule.combinedPassMark})
                        </div>
                      )}
                    </th>
                  );
                })}

                <th className="border border-slate-300 p-2 w-16" rowSpan={2}>
                  Total Marks
                </th>
                <th className="border border-slate-300 p-2 w-16" rowSpan={2}>
                  GPA w/o 4th
                </th>
                <th className="border border-slate-300 p-2 w-14" rowSpan={2}>
                  4th Bonus
                </th>
                <th className="border border-slate-300 p-2 w-16 bg-emerald-50 text-emerald-900" rowSpan={2}>
                  Final GPA
                </th>
                <th className="border border-slate-300 p-2 w-12" rowSpan={2}>
                  Grade
                </th>
                <th className="border border-slate-300 p-2 w-16" rowSpan={2}>
                  Result
                </th>
              </tr>

              {/* Sub headers for Marks, Grade, Point */}
              <tr className="bg-slate-50 text-slate-600 text-[10px]">
                {subjects.map((sub) => (
                  <th key={`hdr-${sub.id}-dummy`} className="p-0 border-0 m-0" style={{ display: "contents" }}>
                    <span className="border border-slate-300 p-1 text-center font-mono">Mark</span>
                    <span className="border border-slate-300 p-1 text-center font-mono">LG</span>
                    <span className="border border-slate-300 p-1 text-center font-mono">GP</span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {tabulation.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-slate-50 ${!row.isPassed ? "bg-red-50/30" : ""}`}
                >
                  <td className="border border-slate-300 p-2 text-center font-bold text-slate-900">
                    {row.isPassed ? `#${row.classRank}` : "-"}
                  </td>
                  <td className="border border-slate-300 p-2 text-center font-semibold text-slate-700">
                    #{row.roll}
                  </td>
                  <td className="border border-slate-300 p-2 font-sans font-medium text-slate-900 whitespace-nowrap">
                    {row.studentName}
                  </td>
                  <td className="border border-slate-300 p-2 text-center font-sans text-slate-600">
                    {row.sectionName}
                  </td>

                  {/* Subject Values */}
                  {subjects.map((sub) => {
                    const subResult = row.subjects.find((s: any) => s.subjectCode === sub.subjectCode);
                    if (!subResult) {
                      return (
                        <td key={`sub-${sub.id}-none`} className="p-0 border-0 m-0" style={{ display: "contents" }}>
                          <span className="border border-slate-300 p-1 text-center text-slate-300">-</span>
                          <span className="border border-slate-300 p-1 text-center text-slate-300">-</span>
                          <span className="border border-slate-300 p-1 text-center text-slate-300">-</span>
                        </td>
                      );
                    }

                    const rule = combinedRules.find(
                      (r) => r.primarySubjectId === sub.id || r.secondarySubjectId === sub.id
                    );
                    const isCombinedPassed = subResult.isCombined && subResult.isPassed;

                    return (
                      <td key={`sub-${sub.id}-${row.id}`} className="p-0 border-0 m-0" style={{ display: "contents" }}>
                        <span
                          title={subResult.isCombined ? `Combined Marks: ${subResult.combinedMarks} (Pass: ${rule?.combinedPassMark || 66})` : undefined}
                          className={`border border-slate-300 p-1 text-center font-semibold ${
                            !subResult.isPassed
                              ? "text-red-600 font-bold"
                              : isCombinedPassed
                              ? "text-emerald-700"
                              : "text-slate-800"
                          }`}
                        >
                          {subResult.marks}
                        </span>
                        <span
                          title={subResult.failureReason || (subResult.isCombined ? `Combined Total: ${subResult.combinedMarks} (Grade: ${subResult.grade})` : undefined)}
                          className={`border border-slate-300 p-1 text-center font-bold ${
                            subResult.grade === "F"
                              ? "text-red-600"
                              : isCombinedPassed
                              ? "text-emerald-700"
                              : "text-slate-800"
                          }`}
                        >
                          {subResult.grade}
                        </span>
                        <span
                          title={subResult.isCombined ? `Combined GP: ${subResult.point}` : undefined}
                          className="border border-slate-300 p-1 text-center text-slate-600"
                        >
                          {subResult.point.toFixed(1)}
                        </span>
                      </td>
                    );
                  })}

                  <td className="border border-slate-300 p-2 text-center font-bold text-slate-900">
                    {row.totalObtainedMarks}
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-slate-600">
                    {row.gpaWithoutFourth.toFixed(2)}
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-amber-700">
                    +{row.fourthBonus.toFixed(2)}
                  </td>
                  <td className="border border-slate-300 p-2 text-center font-bold text-slate-900 bg-emerald-50/50">
                    {row.finalGpa.toFixed(2)}
                  </td>
                  <td className="border border-slate-300 p-2 text-center font-bold">
                    {row.finalGrade}
                  </td>
                  <td className="border border-slate-300 p-2 text-center font-sans">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        row.isPassed ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {row.isPassed ? "PASSED" : "FAILED"}
                    </span>
                  </td>
                </tr>
              ))}

              {tabulation.length === 0 && (
                <tr>
                  <td
                    colSpan={subjects.length * 3 + 10}
                    className="p-8 text-center text-slate-400 italic font-sans"
                  >
                    {loading ? "Loading master tabulation sheet..." : "No results available."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Signature Blocks for Print */}
        <div className="mt-12 pt-8 grid grid-cols-3 gap-6 text-center text-xs font-semibold text-slate-700 print-only">
          <div className="border-t border-slate-400 pt-2">Class Teacher&apos;s Signature</div>
          <div className="border-t border-slate-400 pt-2">Exam Controller</div>
          <div className="border-t border-slate-400 pt-2">Headmaster / Principal</div>
        </div>
      </div>
    </div>
  );
}

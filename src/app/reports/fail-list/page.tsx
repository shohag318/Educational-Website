"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Filter, Phone, Printer, RotateCcw } from "lucide-react";
import { SessionSelect } from "@/components/SessionSelect";
import { ResultNavHeader } from "@/app/results/ResultNavHeader";

export default function FailListPage() {
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [failedList, setFailedList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch initial classes, exams, subjects
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
          const first = data.data[0];
          setSelectedExamId(first.id);
          if (first.classId) {
            setSelectedClassId(first.classId);
          }
        }
      })
      .catch((err) => console.error("Error fetching exams:", err));

    fetch("/api/subjects")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSubjects(data.data);
      })
      .catch((err) => console.error("Error fetching subjects:", err));
  }, []);

  // Determine if the selected class is within Class (1 to 12)
  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const classNum = selectedClass?.numericValue ?? parseInt(selectedClass?.name?.replace(/\D/g, "") || "0", 10);

  // Group only works for Class (1 to 12)
  const isClass1To12 = Boolean(
    selectedClassId &&
    ((classNum >= 1 && classNum <= 12) ||
     (selectedClass && /\b([1-9]|1[0-2])\b|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|ssc|hsc/i.test(selectedClass.name)))
  );

  const isClass11Or12 = Boolean(
    selectedClass && (
      classNum === 11 ||
      classNum === 12 ||
      /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(selectedClass.name || "")
    )
  );

  // Filter exams by selected session and class
  const filteredExams = exams.filter((ex) => {
    if (selectedSession !== "ALL" && ex.academicYear?.yearName && ex.academicYear.yearName !== selectedSession) {
      return false;
    }
    if (selectedClassId && ex.classId !== selectedClassId) {
      return false;
    }
    return true;
  });

  // Filter sections by selected class, shift, and group (if group active)
  const rawSections = selectedClass
    ? selectedClass.sections || []
    : classes.flatMap((c) => c.sections || []);

  const availableSections = rawSections.filter((s: any) => {
    if (isClass1To12 && selectedGroup !== "ALL" && s.groupType !== selectedGroup) return false;
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
    setSelectedGroup("ALL");
    const matchingExams = classId ? exams.filter((e) => e.classId === classId) : exams;
    if (matchingExams.length > 0) {
      const stillValid = matchingExams.some((e) => e.id === selectedExamId);
      if (!stillValid) {
        setSelectedExamId(matchingExams[0].id);
      }
    } else {
      setSelectedExamId("");
    }
  };

  const handleShiftChange = (newShift: string) => {
    setSelectedShift(newShift);
    const matching = rawSections.filter((s: any) => {
      if (isClass1To12 && selectedGroup !== "ALL" && s.groupType !== selectedGroup) return false;
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
      setSelectedGroup("ALL");
    }
  };

  const handleResetFilters = () => {
    setSelectedSession("ALL");
    setSelectedClassId("");
    setSelectedShift("");
    setSelectedGroup("ALL");
    setSelectedSectionId("");
    setSelectedSubjectId("");
    if (exams.length > 0) {
      setSelectedExamId(exams[0].id);
    }
  };

  const fetchFailed = async () => {
    if (!selectedExamId) {
      setFailedList([]);
      return;
    }
    setLoading(true);
    try {
      let url = `/api/reports/fail-list?examId=${selectedExamId}`;
      if (selectedSubjectId) url += `&subjectId=${selectedSubjectId}`;
      if (selectedClassId) url += `&classId=${selectedClassId}`;
      if (selectedSectionId) url += `&sectionId=${selectedSectionId}`;
      if (selectedShift && selectedShift !== "ALL") url += `&shift=${selectedShift}`;
      if (isClass1To12 && selectedGroup && selectedGroup !== "ALL") url += `&groupType=${selectedGroup}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setFailedList(data.data);
      } else {
        setFailedList([]);
      }
    } catch (e) {
      console.error(e);
      setFailedList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailed();
  }, [selectedExamId, selectedSubjectId, selectedClassId, selectedSectionId, selectedShift, selectedGroup]);

  // Client-side filtering
  const filteredList = failedList.filter((row) => {
    if (selectedClassId && row.classId && row.classId !== selectedClassId) {
      return false;
    }
    if (selectedShift && selectedShift !== "ALL" && row.sectionShift && row.sectionShift.toUpperCase() !== selectedShift.toUpperCase()) {
      return false;
    }
    if (isClass1To12 && selectedGroup !== "ALL" && row.groupType && row.groupType !== selectedGroup) {
      return false;
    }
    if (selectedSectionId && row.sectionId && row.sectionId !== selectedSectionId) {
      return false;
    }
    if (selectedSubjectId && row.subjectId && row.subjectId !== selectedSubjectId) {
      return false;
    }
    return true;
  });

  const hasActiveFilters = Boolean(
    (selectedSession && selectedSession !== "ALL") ||
    selectedClassId ||
    selectedShift ||
    (isClass1To12 && selectedGroup !== "ALL") ||
    selectedSectionId ||
    selectedSubjectId
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ResultNavHeader />
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span>Failed Students by Subject</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify and review students who failed specific subjects or components.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center space-x-2 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Fail List</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Class, Exam Name, Group, Section, Subject */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-red-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Remedial Roster Filters
            </span>
            {hasActiveFilters && (
              <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 font-semibold px-2 py-0.5 rounded-full">
                Active Filter
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center space-x-1 underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {/* Session Filter */}
          <div>
            <SessionSelect
              value={selectedSession}
              onChange={(val) => setSelectedSession(val)}
              label="Session:"
              labelClassName="font-semibold text-slate-600 block mb-1"
              selectClassName="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 bg-white font-medium text-slate-800"
            />
          </div>

          {/* Class Filter */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Class:</label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 bg-white font-medium text-slate-800"
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
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 bg-white font-medium text-slate-800"
            >
              {filteredExams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} {ex.class?.name ? `(${ex.class.name})` : ""}
                </option>
              ))}
              {filteredExams.length === 0 && (
                <option value="" disabled>
                  No exams found
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
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 bg-white font-medium text-slate-800"
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

          {/* Group Filter (Only works for Class 1 to 12) */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1 flex items-center justify-between">
              <span>Group:</span>
              <span className={`text-[10px] font-normal ${isClass1To12 ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                {isClass1To12 ? "Class 1-12" : "Only Class 1-12"}
              </span>
            </label>
            <select
              value={selectedGroup}
              disabled={!isClass1To12}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className={`w-full p-2 border border-slate-200 rounded-lg font-medium ${
                isClass1To12
                  ? "bg-white text-slate-800 focus:ring-2 focus:ring-red-500 cursor-pointer"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border-dashed"
              }`}
            >
              {isClass1To12 ? (
                <>
                  <option value="ALL">All Groups</option>
                  {!isClass11Or12 && <option value="GENERAL">General</option>}
                  <option value="SCIENCE">Science</option>
                  <option value="HUMANITIES">Humanities</option>
                  <option value="BUSINESS_STUDIES">Business Studies</option>
                </>
              ) : (
                <option value="ALL">Select Class (1-12) first</option>
              )}
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Section:</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 bg-white font-medium text-slate-800"
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

          {/* Subject Filter */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Subject:</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 bg-white font-medium text-slate-800"
            >
              <option value="">All Failed Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.subjectCode})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Fail Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-slate-800">
              Failed Subject Records ({filteredList.length})
            </h2>
            {hasActiveFilters && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                Filtered view
              </span>
            )}
          </div>
          <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
            Requires Remedial Action
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 w-16">Roll</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Class & Section</th>
                <th className="p-3">Group</th>
                <th className="p-3">Failed Subject</th>
                <th className="p-3 text-center">Marks Obtained</th>
                <th className="p-3">Exact Failure Reason</th>
                <th className="p-3">Guardian Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((row, idx) => (
                <tr key={idx} className="hover:bg-red-50/30 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-900">#{row.roll}</td>
                  <td className="p-3 font-medium text-slate-900">{row.studentName}</td>
                  <td className="p-3 text-slate-600">
                    {row.className} - {row.sectionName}
                  </td>
                  <td className="p-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {row.groupType || "GENERAL"}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-800">
                    {row.subjectName} ({row.subjectCode})
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-red-600">
                    {row.marks}
                  </td>
                  <td className="p-3">
                    <span className="inline-block bg-red-100 text-red-800 px-2 py-0.5 rounded font-mono text-[11px]">
                      {row.failureReason}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-slate-600 flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{row.phone || "N/A"}</span>
                    </span>
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    {loading
                      ? "Loading..."
                      : failedList.length > 0
                      ? "No records match the selected filter criteria."
                      : "No failing records found! Either all students passed or results need processing."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

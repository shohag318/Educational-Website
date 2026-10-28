"use client";

import { useEffect, useState } from "react";
import { Send, MessageSquare, Check, PhoneCall, History, Filter, RotateCcw } from "lucide-react";
import { DEFAULT_SMS_TEMPLATE } from "@/lib/sms/sms-service";
import { SmsNavHeader } from "@/app/sms/SmsNavHeader";
import { SessionSelect } from "@/components/SessionSelect";

export default function SMSNotificationPage() {
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [template, setTemplate] = useState(DEFAULT_SMS_TEMPLATE);
  const [sending, setSending] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

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

  const fetchLogs = async () => {
    if (!selectedExamId) return;
    setLoadingLogs(true);
    try {
      const params = new URLSearchParams();
      params.set("examId", selectedExamId);
      if (selectedClassId) params.set("classId", selectedClassId);
      if (selectedSectionId) params.set("sectionId", selectedSectionId);
      if (selectedShift && selectedShift !== "ALL") params.set("shift", selectedShift);
      if (selectedGroup && selectedGroup !== "ALL") params.set("groupType", selectedGroup);

      const res = await fetch(`/api/sms/dispatch?${params.toString()}`);
      const data = await res.json();
      if (data.success) setLogs(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
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

  const handleDispatch = async () => {
    if (!selectedExamId) return;
    setSending(true);
    try {
      const res = await fetch("/api/sms/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExamId,
          customTemplate: template,
          classId: selectedClassId || undefined,
          sectionId: selectedSectionId || undefined,
          shift: selectedShift && selectedShift !== "ALL" ? selectedShift : undefined,
          groupType: selectedGroup && selectedGroup !== "ALL" ? selectedGroup : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDispatchResult(data);
        fetchLogs();
      } else {
        alert("SMS Dispatch Failed: " + data.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <SmsNavHeader />

      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Send className="w-5 h-5 text-violet-600" />
          <span>Result SMS</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Send examination results and GPA directly to guardians via SMS.
        </p>
      </div>

      {/* Filter Bar: Class, Exam Name, Shift, Group, Section */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Target Filters
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template & Dispatch Config */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>SMS Template Customizer</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Active Target Exam:</label>
              <div className="p-2 border rounded-lg bg-slate-50 font-medium text-slate-800">
                {exams.find((e) => e.id === selectedExamId)?.name || "Select Exam Above"}
                {selectedSectionId && (
                  <span className="ml-2 text-emerald-600 font-semibold">
                    • Section: {availableSections.find((s: any) => s.id === selectedSectionId)?.name}
                  </span>
                )}
                {selectedShift && (
                  <span className="ml-2 text-blue-600 font-semibold">
                    • Shift: {selectedShift === "MORNING" ? "Morning" : selectedShift === "DAY" ? "Day" : selectedShift}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">SMS Template Body:</label>
              <textarea
                rows={3}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
              />
              <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-500">
                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">{"{student_name}"}</span>
                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">{"{roll}"}</span>
                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">{"{gpa}"}</span>
                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">{"{grade}"}</span>
                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">{"{status}"}</span>
                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">{"{institution}"}</span>
              </div>
            </div>

            {/* Simulated Live Preview */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Live Sample Render:
              </span>
              <p className="text-xs text-slate-800 font-mono italic">
                &ldquo;Dear Guardian, Tanvir Ahmed (Roll: 1) obtained GPA: 5.00, Grade: A+ in Half-Yearly Examination 2026. Status: PASSED. - Dhaka Ideal Model High School&rdquo;
              </p>
            </div>

            <button
              onClick={handleDispatch}
              disabled={sending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? "Sending SMS Campaign..." : "Dispatch SMS to Filtered Guardians"}</span>
            </button>

            {dispatchResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Dispatched: {dispatchResult.sentCount} sent, {dispatchResult.failedCount} failed out of {dispatchResult.totalTargeted} targeted recipients.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Live Delivery Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <History className="w-4 h-4 text-emerald-600" />
              <span>Dispatched SMS Audit Logs ({logs.length})</span>
            </h2>
            <button
              onClick={fetchLogs}
              className="text-[11px] text-emerald-600 hover:underline font-semibold"
            >
              Refresh Logs
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto text-xs">
            {logs.map((log) => (
              <div key={log.id} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 font-mono">
                    {log.recipientPhone}
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                    {log.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">{log.messageBody}</p>
                <div className="text-[10px] text-slate-400">
                  {new Date(log.sentAt).toLocaleTimeString()} • {log.gatewayResponse}
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="py-8 text-center text-slate-400 italic">
                No SMS dispatched yet. Click &quot;Dispatch SMS&quot; to test notifications.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

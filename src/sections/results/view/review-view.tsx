"use client";

import { NoDataFound } from "@/components/table/no-data-found";
import { useEffect, useState } from "react";
import {
  Play,
  AlertTriangle,
  Users,
  Award,
  ShieldAlert,
  ArrowRight,
  Filter,
  RotateCcw,
  Sliders,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Minus,
  Plus,
} from "@/components/iconify/lucide";
import Link from "next/link";
import { AppButton } from "@/components/button/app-button";
import { AppSelect } from "@/components";
import { SessionSelect } from "@/components/SessionSelect";
import {
  ResultsPageShell,
  ResultsPageHeader,
  ResultsFilterCard,
  ResultsPanel,
} from "@/sections/results/component/result-page-ui";

export default function ResultReviewPage() {
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [processing, setProcessing] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [tabulation, setTabulation] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [combinedRules, setCombinedRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Class Test (CT) & Percentage Weighting State
  const [isCtActive, setIsCtActive] = useState(false);
  const [selectedCtExamId, setSelectedCtExamId] = useState("");
  const [ctPercentage, setCtPercentage] = useState(20);
  const [mainExamPercentage, setMainExamPercentage] = useState(80);
  const [ctExamLoading, setCtExamLoading] = useState(false);
  const [ctSyncSuccess, setCtSyncSuccess] = useState(false);

  // Fetch classes on mount
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

  const fetchDraftResults = async () => {
    if (!selectedExamId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("examId", selectedExamId);
      if (selectedSectionId) params.set("sectionId", selectedSectionId);
      if (selectedGroup && selectedGroup !== "ALL") params.set("groupType", selectedGroup);
      if (selectedShift && selectedShift !== "ALL") params.set("shift", selectedShift);

      const res = await fetch(`/api/reports/tabulation?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTabulation(data.tabulation);
        setSubjects(data.subjects);
        setCombinedRules(data.combinedRules || []);

        // Derive quick summary
        const total = data.tabulation.length;
        const passed = data.tabulation.filter((t: any) => t.isPassed).length;
        const gpa5 = data.tabulation.filter((t: any) => t.finalGpa === 5.0).length;
        setSummary({
          totalStudents: total,
          passedCount: passed,
          failedCount: total - passed,
          gpa5Count: gpa5,
          passRate: total > 0 ? ((passed / total) * 100).toFixed(1) : "0",
        });
      } else {
        setTabulation([]);
        setSummary(null);
      }
    } catch (e) {
      console.error(e);
      setTabulation([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      fetchDraftResults();
    } else {
      setTabulation([]);
      setSummary(null);
    }
  }, [selectedExamId, selectedSectionId, selectedGroup, selectedShift]);

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

  const isExamMatchingType = (ex: any, type: string) => {
    if (!type || type === "ALL") return true;
    const tc = (ex.termCode || "").trim().toLowerCase();
    const name = (ex.name || "").trim().toLowerCase();
    if (type === "Class Test") {
      return (
        tc === "class test" ||
        tc === "ct" ||
        name.includes("class test") ||
        name.startsWith("ct-") ||
        name.startsWith("ct ")
      );
    }
    return tc === type.toLowerCase();
  };

  const availableCtExams = exams
    .filter((e) => e.id !== selectedExamId)
    .sort((a, b) => {
      const aIsCt = isExamMatchingType(a, "Class Test");
      const bIsCt = isExamMatchingType(b, "Class Test");
      if (aIsCt && !bIsCt) return -1;
      if (bIsCt && !aIsCt) return 1;
      return 0;
    });

  const handleApplyPreset = (main: number, ct: number) => {
    setMainExamPercentage(main);
    setCtPercentage(ct);
  };

  const handleUpdateMainPercentage = (newMain: number) => {
    const clampedMain = Math.max(0, Math.min(100, Math.round(newMain)));
    setMainExamPercentage(clampedMain);
    setCtPercentage(100 - clampedMain);
  };

  const handleUpdateCtPercentage = (newCt: number) => {
    const clampedCt = Math.max(0, Math.min(100, Math.round(newCt)));
    setCtPercentage(clampedCt);
    setMainExamPercentage(100 - clampedCt);
  };

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

  const handleRunProcessing = async () => {
    if (!selectedExamId) {
      alert("Please select an exam to run processing.");
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch("/api/process-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExamId,
          isCtActive,
          selectedCtExamId,
          ctPercentage: isCtActive ? ctPercentage : 0,
          mainExamPercentage: isCtActive ? mainExamPercentage : 100,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        fetchDraftResults();
      } else {
        alert("Processing error: " + data.error);
      }
    } catch (err: any) {
      alert("Execution failed: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSyncCtMarks = async () => {
    if (!selectedExamId) return;
    setCtExamLoading(true);
    setCtSyncSuccess(false);
    try {
      await handleRunProcessing();
      setCtSyncSuccess(true);
      setTimeout(() => setCtSyncSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setCtExamLoading(false);
    }
  };

  // Client-side filtering of tabulation
  const filteredTabulation = tabulation.filter((row) => {
    if (selectedGroup !== "ALL" && row.groupType && row.groupType !== selectedGroup) {
      return false;
    }
    if (selectedSectionId && row.sectionId && row.sectionId !== selectedSectionId) {
      return false;
    }
    if (selectedShift && selectedShift !== "ALL" && row.sectionShift && row.sectionShift.toUpperCase() !== selectedShift.toUpperCase()) {
      return false;
    }
    return true;
  });

  // Dynamic KPI Stats derived from filtered tabulation
  const displayTotal = filteredTabulation.length;
  const displayPassed = filteredTabulation.filter((t) => t.isPassed).length;
  const displayPassRate = displayTotal > 0 ? ((displayPassed / displayTotal) * 100).toFixed(1) : "0";

  const anomalies: string[] = [];
  if (displayTotal > 0) {
    if (parseFloat(displayPassRate) < 50) {
      anomalies.push(`Warning: Low pass rate (${displayPassRate}%) in filtered results. Inspect component pass thresholds.`);
    }
    const failedWithHighTotal = filteredTabulation.filter(
      (t) => !t.isPassed && t.totalObtainedMarks > 400
    );
    if (failedWithHighTotal.length > 0) {
      anomalies.push(
        `${failedWithHighTotal.length} student(s) achieved high total marks (>400) but failed due to specific component pass thresholds (e.g. CQ or MCQ).`
      );
    }
  }

  const hasActiveFilters = Boolean(
    selectedSession !== "ALL" ||
      selectedClassId ||
      selectedGroup !== "ALL" ||
      (selectedShift && selectedShift !== "ALL") ||
      selectedSectionId
  );

  return (
    <ResultsPageShell>
      <ResultsPageHeader
        heading="Process & Review Results"
        current="Process & Review"
        action={
          <AppButton
            variant="contained"
            color="success"
            size="small"
            startIcon={<Play size={14} />}
            loading={processing}
            disabled={processing || !selectedExamId}
            onClick={handleRunProcessing}
          >
            {processing ? "Processing..." : "Process Results"}
          </AppButton>
        }
      />

      <ResultsFilterCard
        title="Choose class & exam to process"
        active={hasActiveFilters}
        onReset={handleResetFilters}
        columns={4}
      >
        {/* Session Filter */}
        <SessionSelect
          value={selectedSession}
          onChange={(val) => setSelectedSession(val)}
          label="Session"
          fullWidth
        />

        {/* Class Filter */}
        <AppSelect
          label="Class"
          value={selectedClassId}
          onChange={handleClassChange}
          options={[
            { value: "", label: "All Classes" },
            ...classes.map((cls) => ({ value: cls.id, label: cls.name })),
          ]}
        />

        {/* Exam Name Filter */}
        <AppSelect
          label="Exam Name"
          value={selectedExamId}
          onChange={handleExamChange}
          options={
            filteredExams.length === 0
              ? [{ value: "", label: "No exams for selected class" }]
              : filteredExams.map((ex) => ({
                  value: ex.id,
                  label: `${ex.name} ${ex.class?.name ? `(${ex.class.name})` : ""} [${ex.status}]`,
                }))
          }
        />

        {/* Shift Filter */}
        <AppSelect
          label="Shift"
          value={selectedShift}
          onChange={handleShiftChange}
          options={[
            { value: "", label: "All Shifts" },
            { value: "MORNING", label: "Morning" },
            { value: "DAY", label: "Day" },
            ...availableShifts
              .filter((sh: any) => sh !== "MORNING" && sh !== "DAY")
              .map((sh: any) => ({
                value: sh,
                label: sh.charAt(0) + sh.slice(1).toLowerCase(),
              })),
          ]}
        />

        {/* Group Filter */}
        <AppSelect
          label="Group"
          value={isClass11Or12 && selectedGroup === "GENERAL" ? "ALL" : selectedGroup}
          onChange={setSelectedGroup}
          options={[
            { value: "ALL", label: "All Groups" },
            ...(!isClass11Or12 ? [{ value: "GENERAL", label: "General" }] : []),
            { value: "SCIENCE", label: "Science" },
            { value: "HUMANITIES", label: "Humanities" },
            { value: "BUSINESS_STUDIES", label: "Business Studies" },
          ]}
        />

        {/* Section Filter */}
        <AppSelect
          label="Section"
          value={selectedSectionId}
          onChange={setSelectedSectionId}
          options={[
            { value: "", label: "All Sections" },
            ...availableSections.map((sec: any) => {
              const shiftLabel = sec.shift === "MORNING" ? "Morning" : sec.shift === "DAY" ? "Day" : sec.shift;
              return {
                value: sec.id,
                label: `${sec.name} ${sec.groupType ? `(${sec.groupType})` : ""}${!selectedShift && shiftLabel ? ` • ${shiftLabel}` : ""}`.trim(),
              };
            }),
          ]}
        />      </ResultsFilterCard>

      {/* Class Test (CT) Marks Auto-Sync & Term Weighting Panel */}
      <ResultsPanel
        sx={{
          bgcolor: isCtActive ? "primary.lighter" : "grey.50",
          borderColor: isCtActive ? "primary.light" : "divider",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
          <div className="flex items-center space-x-2">
            <span className={`p-1.5 text-white rounded-md ${isCtActive ? "bg-purple-600" : "bg-slate-500"}`}>
              <Sliders className="w-3.5 h-3.5" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Class Test (CT) Marks Auto-Sync &amp; Term Weighting
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isCtActive
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-slate-200 text-slate-600 border-slate-300"
                  }`}
                >
                  {isCtActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isCtActive
                  ? "CT exam marks are active and converted with institutional percentage terms."
                  : "CT is inactive. CT column is hidden, and marks are recorded directly as raw scores (no percentage scaling)."}
              </p>
            </div>
          </div>

          {/* Active / Inactive Toggle Buttons */}
          <div className="flex items-center p-1 bg-white rounded-xl space-x-1 border border-slate-300/80 shrink-0 shadow-2xs">
            <AppButton
              type="button"
              size="small"
              variant="soft"
              color={isCtActive ? "primary" : "inherit"}
              startIcon={<CheckCircle2 size={14} />}
              onClick={() => setIsCtActive(true)}
            >
              Active
            </AppButton>
            <AppButton
              type="button"
              size="small"
              variant="soft"
              color={!isCtActive ? "primary" : "inherit"}
              startIcon={<XCircle size={14} />}
              onClick={() => setIsCtActive(false)}
            >
              Inactive
            </AppButton>
          </div>
        </div>

        {/* When Active: Display full sync controls and weight terms */}
        {isCtActive && (
          <div className="pt-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* CT Auto-Sync Section */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-600 mb-2 font-medium">
                Select an existing Class Test exam to auto-populate CT marks, or enter them directly:
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-64 sm:w-72">
                  <AppSelect
                    label="CT Exam"
                    value={selectedCtExamId}
                    onChange={setSelectedCtExamId}
                    disabled={ctExamLoading}
                    options={[
                      { value: "", label: "-- Select CT Exam to Auto-Sync --" },
                      ...availableCtExams.map((ex: any) => ({
                        value: ex.id,
                        label: `${ex.name} (${ex.termCode || ex.status})`,
                      })),
                    ]}
                  />
                </div>

                {selectedCtExamId && (
                  <AppButton
                    type="button"
                    variant="contained"
                    color="info"
                    size="small"
                    startIcon={<RefreshCw size={14} />}
                    loading={ctExamLoading || processing}
                    disabled={ctExamLoading || processing}
                    onClick={handleSyncCtMarks}
                    title="Re-fetch and scale CT marks from the selected exam"
                  >
                    {ctExamLoading || processing ? "Syncing..." : "Sync CT Marks"}
                  </AppButton>
                )}

                {selectedCtExamId && (
                  <AppButton
                    type="button"
                    variant="outline"
                    size="small"
                    onClick={() => setSelectedCtExamId("")}
                    title="Disconnect CT exam (preserves current values)"
                  >
                    Disconnect CT
                  </AppButton>
                )}

                {ctSyncSuccess && (
                  <div className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-100/90 border border-emerald-300 text-xs font-semibold px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>CT Marks Synced Successfully!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Percentage Weighting Stepper & Presets */}
            <div className="bg-white/90 border border-purple-200 rounded-xl p-3 shadow-2xs flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Evaluation Weight Terms:
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-medium">Presets:</span>
                  <AppButton
                    type="button"
                    size="small"
                    variant="soft"
                    color={mainExamPercentage === 80 && ctPercentage === 20 ? "primary" : "inherit"}
                    onClick={() => handleApplyPreset(80, 20)}
                  >
                    80 / 20
                  </AppButton>
                  <AppButton
                    type="button"
                    size="small"
                    variant="soft"
                    color={mainExamPercentage === 70 && ctPercentage === 30 ? "primary" : "inherit"}
                    onClick={() => handleApplyPreset(70, 30)}
                  >
                    70 / 30
                  </AppButton>
                  <AppButton
                    type="button"
                    size="small"
                    variant="soft"
                    color={mainExamPercentage === 85 && ctPercentage === 15 ? "primary" : "inherit"}
                    onClick={() => handleApplyPreset(85, 15)}
                  >
                    85 / 15
                  </AppButton>
                  <AppButton
                    type="button"
                    size="small"
                    variant="soft"
                    color={mainExamPercentage === 100 && ctPercentage === 0 ? "primary" : "inherit"}
                    onClick={() => handleApplyPreset(100, 0)}
                  >
                    100% Only
                  </AppButton>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Main Exam % */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-semibold text-slate-700">Main:</span>
                  <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                    <button
                      type="button"
                      onClick={() => handleUpdateMainPercentage(mainExamPercentage - 5)}
                      className="p-1 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                      title="Decrease Main Exam %"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={mainExamPercentage}
                      onChange={(e) => handleUpdateMainPercentage(parseFloat(e.target.value) || 0)}
                      className="w-12 text-center text-xs font-bold bg-white p-1 border-x border-slate-300 font-mono text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateMainPercentage(mainExamPercentage + 5)}
                      className="p-1 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                      title="Increase Main Exam %"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-xs font-bold text-slate-600">%</span>
                </div>

                <span className="text-slate-400 font-bold">+</span>

                {/* CT Exam % */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-semibold text-slate-700">CT:</span>
                  <div className="flex items-center border border-purple-300 rounded-lg overflow-hidden bg-purple-50/50">
                    <button
                      type="button"
                      onClick={() => handleUpdateCtPercentage(ctPercentage - 5)}
                      className="p-1 hover:bg-purple-100 text-purple-700 transition cursor-pointer"
                      title="Decrease CT Exam %"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={ctPercentage}
                      onChange={(e) => handleUpdateCtPercentage(parseFloat(e.target.value) || 0)}
                      className="w-12 text-center text-xs font-bold bg-white p-1 border-x border-purple-300 font-mono text-purple-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateCtPercentage(ctPercentage + 5)}
                      className="p-1 hover:bg-purple-100 text-purple-700 transition cursor-pointer"
                      title="Increase CT Exam %"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-xs font-bold text-purple-600">%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </ResultsPanel>

      {/* Anomaly Detection Banner */}
      {anomalies.length > 0 && (
        <ResultsPanel sx={{ bgcolor: "warning.lighter", borderColor: "warning.light" }}>
          <div className="font-bold text-amber-900 flex items-center space-x-1.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Automated Anomaly Detection Insights</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-amber-800 text-xs mt-1.5">
            {anomalies.map((a, idx) => (
              <li key={idx}>{a}</li>
            ))}
          </ul>
        </ResultsPanel>
      )}

      {/* Draft Result Preview Table */}
      <ResultsPanel padded={false}>
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-slate-800">Final Results &amp; Ranks Preview</h2>
            {selectedShift && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  selectedShift === "MORNING"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {selectedShift === "MORNING" ? "Morning Shift" : "Day Shift"}
              </span>
            )}
            <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-semibold">
              FINAL RESULT
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
              UNPUBLISHED DRAFT
            </span>
            {isCtActive && (
              <span className="text-[10px] bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-semibold">
                CT Weighted ({mainExamPercentage}% + {ctPercentage}%)
              </span>
            )}
            {combinedRules.length > 0 && (
              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                🔗 {combinedRules.length} Combined Rule{combinedRules.length > 1 ? "s" : ""} Active
              </span>
            )}
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
              Showing {filteredTabulation.length} students
            </span>
          </div>
          <Link
            href="/marks/audit"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
          >
            <span>Need corrections? Go to Mark Overrides</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="table-scroll-container relative">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider shadow-2xs">
              <tr>
                <th className="p-3">Rank (Class)</th>
                <th className="p-3">Roll</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Section / Group</th>
                {isCtActive && (
                  <>
                    <th className="p-3 text-center bg-purple-50/50 text-purple-900 border-x border-purple-100">
                      Term ({mainExamPercentage}%)
                    </th>
                    <th className="p-3 text-center bg-purple-50/50 text-purple-900 border-r border-purple-100">
                      CT ({ctPercentage}%)
                    </th>
                  </>
                )}
                <th className="p-3 text-center">Total Marks</th>
                <th className="p-3 text-center">GPA (w/o 4th)</th>
                <th className="p-3 text-center">4th Bonus</th>
                <th className="p-3 text-center">Final GPA</th>
                <th className="p-3 text-center">Grade</th>
                <th className="p-3 text-center">Final Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredTabulation.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-bold text-slate-900">
                    {row.isPassed ? `#${row.classRank}` : "-"}
                  </td>
                  <td className="p-3 font-semibold text-slate-700">#{row.roll}</td>
                  <td className="p-3 font-sans font-medium text-slate-900">{row.studentName}</td>
                  <td className="p-3 font-sans text-xs">
                    <span className="font-medium text-slate-800">{row.sectionName || "-"}</span>
                    {row.sectionShift && (
                      <span className="ml-1 text-[10px] text-slate-500 font-mono">
                        ({row.sectionShift === "MORNING" ? "Morning" : "Day"})
                      </span>
                    )}
                    {row.groupType && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        {row.groupType}
                      </span>
                    )}
                  </td>
                  {isCtActive && (
                    <>
                      <td className="p-3 text-center font-mono text-purple-900 bg-purple-50/20 border-x border-purple-100">
                        {((row.totalObtainedMarks * mainExamPercentage) / 100).toFixed(1)}
                      </td>
                      <td className="p-3 text-center font-mono text-purple-900 bg-purple-50/20 border-r border-purple-100">
                        {((row.totalObtainedMarks * ctPercentage) / 100).toFixed(1)}
                      </td>
                    </>
                  )}
                  <td className="p-3 text-center font-bold text-slate-800">{row.totalObtainedMarks}</td>
                  <td className="p-3 text-center text-slate-600">{row.gpaWithoutFourth?.toFixed(2) ?? "0.00"}</td>
                  <td className="p-3 text-center text-amber-700">
                    +{row.fourthBonus?.toFixed(2) ?? "0.00"}
                  </td>
                  <td className="p-3 text-center font-bold text-slate-900 text-sm">
                    {row.finalGpa?.toFixed(2) ?? "0.00"}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-xs ${
                        row.finalGrade === "A+"
                          ? "bg-emerald-100 text-emerald-800"
                          : row.finalGrade === "F"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {row.finalGrade}
                    </span>
                  </td>
                  <td className="p-3 text-center font-sans">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.isPassed
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {row.isPassed ? "PASSED" : "FAILED"}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredTabulation.length === 0 && (
                <tr>
                  <td
                    colSpan={isCtActive ? 12 : 10}
                    className={loading ? "p-8 text-center text-slate-400 italic font-sans" : "p-0"}
                  >
                    {loading ? "Loading results..." : <NoDataFound />}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredTabulation.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 font-medium no-print">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>Showing 15 rows at a time • Scroll down to view all students</span>
            </div>
            <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
              Total: {filteredTabulation.length} students
            </span>
          </div>
        )}
      </ResultsPanel>
    </ResultsPageShell>
  );
}

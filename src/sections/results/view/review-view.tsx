"use client";

import { NoDataFound } from "@/components/table/no-data-found";
import { useEffect, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import {
  Play,
  ArrowRight,
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
  ResultsNotice,
} from "@/sections/results/component/result-page-ui";
import {
  RulesAtmosphere,
  RulesFilterGrid,
  RulesSection,
} from "@/sections/academic/component/rules-section-ui";
import { examOptionLabel, sectionOptionLabel, shiftLabel } from "@/sections/results/utils/select-options";

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
      <RulesAtmosphere>
        <ResultsPageHeader
          heading="Process & Review Results"
          current="Process & Review"
          action={
            <AppButton
              variant="contained"
              color="primary"
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

        {ctSyncSuccess && (
          <ResultsNotice severity="success">CT marks synced successfully.</ResultsNotice>
        )}

        <RulesSection
          title="Choose class & exam"
          subtitle="Filter by session, class, exam, shift, group, and section before processing."
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
                  onClick={handleResetFilters}
                  startIcon={<RotateCcw size={14} />}
                >
                  Reset
                </AppButton>
              </Stack>
            ) : undefined
          }
          toolbar={
            <RulesFilterGrid columns={4}>
              <SessionSelect
                value={selectedSession}
                onChange={(val) => setSelectedSession(val)}
                label="Session"
                fullWidth
              />
              <AppSelect
                label="Class"
                value={selectedClassId}
                onChange={handleClassChange}
                options={[
                  { value: "", label: "All Classes" },
                  ...classes.map((cls) => ({ value: cls.id, label: cls.name })),
                ]}
              />
              <AppSelect
                label="Exam Name"
                value={selectedExamId}
                onChange={handleExamChange}
                options={
                  filteredExams.length === 0
                    ? [{ value: "", label: "No exams for selected class" }]
                    : filteredExams.map((ex) => ({
                        value: ex.id,
                        label: examOptionLabel(ex),
                      }))
                }
              />
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
                      label: shiftLabel(sh),
                    })),
                ]}
              />
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
              <AppSelect
                label="Section"
                value={selectedSectionId}
                onChange={setSelectedSectionId}
                options={[
                  { value: "", label: "All Sections" },
                  ...availableSections.map((sec: any) => ({
                    value: sec.id,
                    label: sectionOptionLabel(sec, { includeShiftWhen: !selectedShift }),
                  })),
                ]}
              />
            </RulesFilterGrid>
          }
        >
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap", alignItems: "center" }}>
            <Chip
              size="small"
              label={activeExam?.name || "No exam selected"}
              sx={{ height: 24, fontWeight: 700, fontSize: "0.75rem" }}
            />
            {effectiveClass && (
              <Chip
                size="small"
                variant="outlined"
                label={effectiveClass.name}
                sx={{ height: 24, fontWeight: 600, fontSize: "0.75rem" }}
              />
            )}
            <Chip
              size="small"
              label={`Students: ${displayTotal}`}
              sx={{
                height: 24,
                fontWeight: 600,
                fontSize: "0.75rem",
                bgcolor: "info.lighter",
                color: "info.dark",
              }}
            />
            {displayTotal > 0 && (
              <Chip
                size="small"
                label={`Pass rate: ${displayPassRate}%`}
                sx={{
                  height: 24,
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  bgcolor: "success.lighter",
                  color: "success.dark",
                }}
              />
            )}
          </Stack>
        </RulesSection>

        <RulesSection
          title="CT sync & weighting"
          subtitle={
            isCtActive
              ? "Sync Class Test marks and apply institutional percentage weighting."
              : "CT is inactive — the CT column is hidden and scores stay as raw totals."
          }
          action={
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
              <Chip
                size="small"
                label={isCtActive ? "Active" : "Inactive"}
                color={isCtActive ? "primary" : "default"}
                sx={{ height: 24, fontWeight: 700 }}
              />
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
            </Stack>
          }
        >
          {!isCtActive ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8125rem" }}>
              Turn CT on to sync Class Test marks and configure weight terms.
            </Typography>
          ) : (
            <Stack spacing={2.5}>
              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1.25, fontSize: "0.8125rem", fontWeight: 500, color: "text.secondary" }}
                >
                  Select a Class Test exam to auto-populate CT marks, or enter them directly.
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: { xs: "100%", sm: 280 } }}>
                    <AppSelect
                      label="CT exam to sync"
                      value={selectedCtExamId}
                      onChange={setSelectedCtExamId}
                      disabled={ctExamLoading}
                      options={[
                        { value: "", label: "Select CT exam to sync" },
                        ...availableCtExams.map((ex: any) => ({
                          value: ex.id,
                          label: examOptionLabel(ex),
                        })),
                      ]}
                    />
                  </Box>

                  {selectedCtExamId && (
                    <AppButton
                      type="button"
                      variant="contained"
                      color="primary"
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
                </Stack>
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "grey.50",
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.5}
                  sx={{ alignItems: { md: "center" }, justifyContent: "space-between", mb: 1.5 }}
                >
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                    <Sliders size={14} />
                    <Typography variant="body2" sx={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                      Evaluation weight terms
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", alignItems: "center", gap: 0.75 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Presets
                    </Typography>
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
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                    <Typography variant="body2" sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                      Main
                    </Typography>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1.5,
                        overflow: "hidden",
                        bgcolor: "background.paper",
                      }}
                    >
                      <Box
                        component="button"
                        type="button"
                        onClick={() => handleUpdateMainPercentage(mainExamPercentage - 5)}
                        title="Decrease Main Exam %"
                        sx={{
                          p: 0.5,
                          border: 0,
                          bgcolor: "transparent",
                          cursor: "pointer",
                          display: "inline-flex",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <Minus size={12} />
                      </Box>
                      <Box
                        component="input"
                        type="number"
                        min={0}
                        max={100}
                        value={mainExamPercentage}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleUpdateMainPercentage(parseFloat(e.target.value) || 0)
                        }
                        sx={{
                          width: 48,
                          textAlign: "center",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          fontFamily: "monospace",
                          border: 0,
                          borderLeft: 1,
                          borderRight: 1,
                          borderColor: "divider",
                          py: 0.5,
                          outline: "none",
                        }}
                      />
                      <Box
                        component="button"
                        type="button"
                        onClick={() => handleUpdateMainPercentage(mainExamPercentage + 5)}
                        title="Increase Main Exam %"
                        sx={{
                          p: 0.5,
                          border: 0,
                          bgcolor: "transparent",
                          cursor: "pointer",
                          display: "inline-flex",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <Plus size={12} />
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      %
                    </Typography>
                  </Stack>

                  <Typography color="text.disabled" sx={{ fontWeight: 700 }}>
                    +
                  </Typography>

                  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                    <Typography variant="body2" sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                      CT
                    </Typography>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1.5,
                        overflow: "hidden",
                        bgcolor: "background.paper",
                      }}
                    >
                      <Box
                        component="button"
                        type="button"
                        onClick={() => handleUpdateCtPercentage(ctPercentage - 5)}
                        title="Decrease CT %"
                        sx={{
                          p: 0.5,
                          border: 0,
                          bgcolor: "transparent",
                          cursor: "pointer",
                          display: "inline-flex",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <Minus size={12} />
                      </Box>
                      <Box
                        component="input"
                        type="number"
                        min={0}
                        max={100}
                        value={ctPercentage}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleUpdateCtPercentage(parseFloat(e.target.value) || 0)
                        }
                        sx={{
                          width: 48,
                          textAlign: "center",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          fontFamily: "monospace",
                          border: 0,
                          borderLeft: 1,
                          borderRight: 1,
                          borderColor: "divider",
                          py: 0.5,
                          outline: "none",
                        }}
                      />
                      <Box
                        component="button"
                        type="button"
                        onClick={() => handleUpdateCtPercentage(ctPercentage + 5)}
                        title="Increase CT %"
                        sx={{
                          p: 0.5,
                          border: 0,
                          bgcolor: "transparent",
                          cursor: "pointer",
                          display: "inline-flex",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <Plus size={12} />
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      %
                    </Typography>
                  </Stack>

                  <Chip
                    size="small"
                    label={`Total: ${mainExamPercentage + ctPercentage}%`}
                    color={mainExamPercentage + ctPercentage === 100 ? "primary" : "warning"}
                    sx={{ height: 24, fontWeight: 700, fontFamily: "monospace", ml: { md: "auto" } }}
                  />
                </Stack>
              </Box>
            </Stack>
          )}
        </RulesSection>

        {anomalies.length > 0 && (
          <ResultsNotice severity="warning">
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8125rem", mb: 0.75 }}>
              Anomaly detection
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
              {anomalies.map((a, idx) => (
                <Typography key={idx} component="li" variant="body2" sx={{ fontSize: "0.8125rem" }}>
                  {a}
                </Typography>
              ))}
            </Box>
          </ResultsNotice>
        )}

        <RulesSection
          title={`Results preview (${filteredTabulation.length})`}
          subtitle="Draft ranks and GPA before publishing. Scroll the grid to review all students."
          action={
            <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", alignItems: "center", gap: 0.75 }}>
              {selectedShift && (
                <Chip
                  size="small"
                  label={selectedShift === "MORNING" ? "Morning Shift" : "Day Shift"}
                  sx={{
                    height: 24,
                    fontWeight: 600,
                    bgcolor: selectedShift === "MORNING" ? "warning.lighter" : "info.lighter",
                    color: selectedShift === "MORNING" ? "warning.dark" : "info.dark",
                  }}
                />
              )}
              <Chip size="small" label="Final result" sx={{ height: 24, fontWeight: 700 }} />
              <Chip
                size="small"
                label="Unpublished draft"
                sx={{ height: 24, fontWeight: 700, bgcolor: "warning.lighter", color: "warning.dark" }}
              />
              {isCtActive && (
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={`CT weighted (${mainExamPercentage}% + ${ctPercentage}%)`}
                  sx={{ height: 24, fontWeight: 600 }}
                />
              )}
              {combinedRules.length > 0 && (
                <Chip
                  size="small"
                  label={`${combinedRules.length} combined rule${combinedRules.length > 1 ? "s" : ""}`}
                  sx={{ height: 24, fontWeight: 600, bgcolor: "success.lighter", color: "success.dark" }}
                />
              )}
              <Typography
                component={Link}
                href="/marks/audit"
                variant="body2"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  color: "primary.main",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Mark overrides
                <ArrowRight size={14} />
              </Typography>
            </Stack>
          }
        >
          <Box className="table-scroll-container" sx={{ position: "relative", mx: { xs: -0.5, sm: -1 } }}>
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
          </Box>

          {filteredTabulation.length > 0 && (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              className="no-print"
              sx={{
                mt: 2,
                pt: 1.5,
                borderTop: 1,
                borderColor: "divider",
                alignItems: { sm: "center" },
                justifyContent: "space-between",
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Showing 15 rows at a time · Scroll to view all students
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                label={`Total: ${filteredTabulation.length} students`}
                sx={{ height: 24, fontWeight: 600, fontFamily: "monospace", fontSize: "0.7rem" }}
              />
            </Stack>
          )}
        </RulesSection>
      </RulesAtmosphere>
    </ResultsPageShell>
  );
}

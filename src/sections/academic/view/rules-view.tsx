"use client";

import { useEffect, useState, useMemo } from "react";
import { Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import {
  ResultsPageShell,
  ResultsPageHeader,
  ResultsNotice,
} from "@/sections/results/component/result-page-ui";
import {
  RulesAtmosphere,
  RulesFilterGrid,
  RulesFormBlock,
  RulesListItem,
  RulesSection,
} from "@/sections/academic/component/rules-section-ui";
import {
  Save,
  Award,
  Layers,
  Trash2,
  Pencil,
  Sparkles,
} from "@/components/iconify/lucide";
import { AppButton } from "@/components/button/app-button";
import { AppSelect, AppTextField, NoDataFound } from "@/components";
import { SessionSelect } from "@/components/SessionSelect";
import { TemplateManagementSection } from "@/sections/academic/component/template-management-section";
import { AppTabs } from "@/components/ui/tabs-component";
import { examOptionLabel, subjectOptionLabel } from "@/sections/results/utils/select-options";

export default function DynamicRulesPage() {
  const [gradingSystems, setGradingSystems] = useState<any[]>([]);
  const [selectedGrading, setSelectedGrading] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Step Tabs: Step 1 (Template Management), Step 2 (Combined Papers), Step 3 (Grading Scale), All
  const [activeStepTab, setActiveStepTab] = useState<
    "STEP_1_TEMPLATES" | "STEP_3_COMBINED" | "STEP_4_GRADING" | "ALL"
  >("STEP_1_TEMPLATES");
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);

  // Grading System State (Step 4 / 3: Grading Scale & 4th-Subject Rules)
  const [maxGpa, setMaxGpa] = useState("5.00");
  const [fourthThreshold, setFourthThreshold] = useState("2.00");
  const [passGpa, setPassGpa] = useState("1.00");

  // Combined Subject Rules State (Step 3 / 2: 1st & 2nd Paper Pairing)
  const [combinedSessionFilter, setCombinedSessionFilter] = useState("ALL");
  const [combinedClassFilter, setCombinedClassFilter] = useState("");
  const [combinedClassSubjects, setCombinedClassSubjects] = useState<any[]>([]);
  const [fetchingCombinedSubjects, setFetchingCombinedSubjects] = useState(false);

  const [combinedRules, setCombinedRules] = useState<any[]>([]);
  const [combinedLoading, setCombinedLoading] = useState(false);
  const [primarySubjectId, setPrimarySubjectId] = useState("");
  const [secondarySubjectId, setSecondarySubjectId] = useState("");
  const [combinedPassMark, setCombinedPassMark] = useState("66");
  const [combinedFullMarks, setCombinedFullMarks] = useState("200");
  const [combinedPassMode, setCombinedPassMode] = useState<"AGGREGATE_ONLY" | "BOTH">("AGGREGATE_ONLY");
  const [combinedGradeMode, setCombinedGradeMode] = useState<"AVERAGE" | "INDIVIDUAL">("AVERAGE");
  const [combinedRuleName, setCombinedRuleName] = useState("");
  const [editingCombinedRuleId, setEditingCombinedRuleId] = useState<string | null>(null);

  const fetchDbTemplates = async () => {
    try {
      const res = await fetch("/api/rules/templates");
      const data = await res.json();
      if (data.success && data.data) {
        setDbTemplates(data.data);
      }
    } catch (e) {
      console.error("Failed to load db templates", e);
    }
  };

  const fetchCombinedRules = async (examId?: string) => {
    const activeExam = examId !== undefined ? examId : selectedExamId;
    if (!activeExam) {
      setCombinedRules([]);
      return;
    }
    setCombinedLoading(true);
    try {
      const res = await fetch(`/api/rules/combined?examId=${activeExam}`);
      const data = await res.json();
      if (data.success) {
        setCombinedRules(data.data || []);
      }
    } catch (e) {
      console.error("Failed to load combined rules", e);
    } finally {
      setCombinedLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/rules/grading")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setGradingSystems(data.data);
          const first = data.data[0];
          setSelectedGrading(first);
          setMaxGpa(String(first.maxGpa));
          setFourthThreshold(String(first.fourthSubjectThreshold));
          setPassGpa(String(first.passGpa));
        }
      });

    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.length > 0) {
          setClasses(data.data);
          setCombinedClassFilter(data.data[0].id);
        }
      });

    fetch("/api/exams")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setExams(data.data);
          const firstExam = data.data[0];
          setSelectedExamId(firstExam.id);
          fetchCombinedRules(firstExam.id);
        }
      });

    fetch("/api/subjects")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setSubjects(data.data);
        }
      });

    fetchDbTemplates();
  }, []);

  // When class changes in Combined Rules, fetch strictly that class's mapped subjects
  useEffect(() => {
    if (!combinedClassFilter || combinedClassFilter === "ALL") {
      setCombinedClassSubjects(subjects);
      return;
    }
    setFetchingCombinedSubjects(true);
    fetch(`/api/subjects?classId=${combinedClassFilter}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) {
          setCombinedClassSubjects(d.data);
        } else {
          setCombinedClassSubjects([]);
        }
      })
      .catch(() => setCombinedClassSubjects([]))
      .finally(() => setFetchingCombinedSubjects(false));
  }, [combinedClassFilter, subjects]);

  // Filter exams in Combined Rules by Session and Class
  const filteredCombinedExams = useMemo(() => {
    return exams.filter((e) => {
      const matchSession =
        combinedSessionFilter === "ALL" || e.academicYear?.yearName === combinedSessionFilter;
      const matchClass =
        !combinedClassFilter || combinedClassFilter === "ALL" || e.classId === combinedClassFilter;
      return matchSession && matchClass;
    });
  }, [exams, combinedSessionFilter, combinedClassFilter]);

  // Keep selected exam aligned with the filtered exams
  useEffect(() => {
    if (filteredCombinedExams.length > 0) {
      if (!selectedExamId || !filteredCombinedExams.some((e) => e.id === selectedExamId)) {
        const nextId = filteredCombinedExams[0].id;
        setSelectedExamId(nextId);
        fetchCombinedRules(nextId);
      }
    }
  }, [filteredCombinedExams, selectedExamId]);

  const handleExamChange = (newExamId: string) => {
    setSelectedExamId(newExamId);
    fetchCombinedRules(newExamId);
  };

  const handleTemplateAppliedToExam = (appliedExamId: string) => {
    if (appliedExamId) {
      setSelectedExamId(appliedExamId);
      fetchCombinedRules(appliedExamId);
      fetchDbTemplates();
      setStatusMessage("Template applied to exam successfully!");
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Save Grading System Slabs & Surplus Rules
  const handleSaveGrading = async () => {
    if (!selectedGrading) return;
    try {
      const res = await fetch("/api/rules/grading", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gradingSystemId: selectedGrading.id,
          maxGpa,
          fourthSubjectThreshold: fourthThreshold,
          passGpa,
          slabs: selectedGrading.slabs,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setStatusMessage("Grading scale & surplus rules updated successfully!");
        setTimeout(() => setSaveSuccess(false), 3000);
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        alert("Error: " + data.error);
      }
    } catch (e: any) {
      alert("Failed: " + e.message);
    }
  };

  // Save or Update Combined Subject Rule
  const handleSaveCombinedRule = async () => {
    if (!selectedExamId) {
      alert("Please select a target exam first.");
      return;
    }
    if (!primarySubjectId || !secondarySubjectId) {
      alert("Please select both 1st Paper (Primary) and 2nd Paper (Secondary) subjects.");
      return;
    }
    if (primarySubjectId === secondarySubjectId) {
      alert("Primary and Secondary subjects cannot be the same subject.");
      return;
    }

    setCombinedLoading(true);
    try {
      const res = await fetch("/api/rules/combined", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCombinedRuleId || undefined,
          examId: selectedExamId,
          primarySubjectId,
          secondarySubjectId,
          name: combinedRuleName,
          combinedPassMark,
          combinedFullMarks,
          passMode: combinedPassMode,
          gradeMode: combinedGradeMode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(
          editingCombinedRuleId
            ? "Combined subject rule updated successfully!"
            : "Combined subject rule created! Pass/Fail will now evaluate combined marks."
        );
        setTimeout(() => setStatusMessage(null), 5000);
        // Clear form
        setEditingCombinedRuleId(null);
        setPrimarySubjectId("");
        setSecondarySubjectId("");
        setCombinedRuleName("");
        setCombinedPassMark("66");
        setCombinedFullMarks("200");
        await fetchCombinedRules(selectedExamId);
      } else {
        alert("Error: " + data.error);
      }
    } catch (e: any) {
      alert("Failed to save combined rule: " + e.message);
    } finally {
      setCombinedLoading(false);
    }
  };

  const handleEditCombinedRule = (rule: any) => {
    setEditingCombinedRuleId(rule.id);
    setPrimarySubjectId(rule.primarySubjectId);
    setSecondarySubjectId(rule.secondarySubjectId);
    setCombinedRuleName(rule.name || "");
    setCombinedPassMark(String(rule.combinedPassMark));
    setCombinedFullMarks(String(rule.combinedFullMarks));
    setCombinedPassMode(rule.passMode);
    setCombinedGradeMode(rule.gradeMode);
    setStatusMessage(`Loaded combined rule "${rule.name || "Rule"}" into the editor.`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleCancelEditCombinedRule = () => {
    setEditingCombinedRuleId(null);
    setPrimarySubjectId("");
    setSecondarySubjectId("");
    setCombinedRuleName("");
    setCombinedPassMark("66");
    setCombinedFullMarks("200");
  };

  const handleDeleteCombinedRule = async (ruleId: string, ruleName: string) => {
    if (!window.confirm(`Are you sure you want to delete the combined rule "${ruleName}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/rules/combined?id=${ruleId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Deleted combined rule "${ruleName}".`);
        setTimeout(() => setStatusMessage(null), 4000);
        if (editingCombinedRuleId === ruleId) {
          handleCancelEditCombinedRule();
        }
        await fetchCombinedRules(selectedExamId);
      } else {
        alert("Failed to delete: " + data.error);
      }
    } catch (e: any) {
      alert("Failed to delete rule: " + e.message);
    }
  };

  // Auto-pair 1st and 2nd papers strictly for the selected class subjects
  const handleAutoPairPresets = async () => {
    if (!selectedExamId) {
      alert("Please select a target exam first.");
      return;
    }
    if (combinedClassSubjects.length === 0) {
      alert("No subjects found for the selected class to pair.");
      return;
    }

    const detectedPairs: { name: string; primary: any; secondary: any }[] = [];

    for (const sub1 of combinedClassSubjects) {
      const name1 = sub1.name.toLowerCase();
      if (name1.includes("1st")) {
        const rootName = name1.replace("1st", "").replace("paper", "").trim();
        const sub2 = combinedClassSubjects.find((s) => {
          if (s.id === sub1.id) return false;
          const name2 = s.name.toLowerCase();
          return name2.includes("2nd") && name2.replace("2nd", "").replace("paper", "").trim() === rootName;
        });

        if (sub2) {
          const already = detectedPairs.some(
            (p) =>
              (p.primary.id === sub1.id && p.secondary.id === sub2.id) ||
              (p.primary.id === sub2.id && p.secondary.id === sub1.id)
          );
          if (!already) {
            const cleanName = sub1.name.replace(/1st\s*paper/i, "").trim() + " (1st & 2nd Combined)";
            detectedPairs.push({
              name: cleanName,
              primary: sub1,
              secondary: sub2,
            });
          }
        }
      }
    }

    if (detectedPairs.length === 0) {
      alert("No matching 1st & 2nd paper subject pairs were automatically detected for this class.");
      return;
    }

    const confirmMsg =
      `Detected ${detectedPairs.length} paired paper(s) for this class:\n` +
      detectedPairs.map((p) => `• ${p.name}: ${p.primary.name} + ${p.secondary.name}`).join("\n") +
      `\n\nWould you like to automatically configure combined pass rules (Pass Mark: 66/200) for these?`;

    if (!window.confirm(confirmMsg)) return;

    setCombinedLoading(true);
    let createdCount = 0;
    try {
      for (const pair of detectedPairs) {
        const res = await fetch("/api/rules/combined", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examId: selectedExamId,
            primarySubjectId: pair.primary.id,
            secondarySubjectId: pair.secondary.id,
            name: pair.name,
            combinedPassMark: "66",
            combinedFullMarks: "200",
            passMode: "AGGREGATE_ONLY",
            gradeMode: "AVERAGE",
          }),
        });
        const data = await res.json();
        if (data.success) {
          createdCount++;
        }
      }
      setStatusMessage(`Auto-paired ${createdCount} subject(s) successfully!`);
      setTimeout(() => setStatusMessage(null), 5000);
      await fetchCombinedRules(selectedExamId);
    } catch (e: any) {
      alert("Auto-pair failed: " + e.message);
    } finally {
      setCombinedLoading(false);
    }
  };

  const selectedClassObj = classes.find((c) => c.id === combinedClassFilter);

  return (
    <ResultsPageShell>
      <RulesAtmosphere>
        <ResultsPageHeader heading="Grading & Assessment Rules" current="Grading Rules" />

        <AppTabs
          value={activeStepTab}
          onValueChange={(value) =>
            setActiveStepTab(value as "STEP_1_TEMPLATES" | "STEP_3_COMBINED" | "STEP_4_GRADING" | "ALL")
          }
          items={[
            { value: "STEP_1_TEMPLATES", label: `Templates (${dbTemplates.length})` },
            { value: "STEP_3_COMBINED", label: `Combined Papers (${combinedRules.length})` },
            { value: "STEP_4_GRADING", label: "Grading Scale" },
            { value: "ALL", label: "All steps" },
          ]}
        />

        {saveSuccess && (
          <ResultsNotice severity="success">Rules updated successfully.</ResultsNotice>
        )}

        {statusMessage && (
          <ResultsNotice severity="success">{statusMessage}</ResultsNotice>
        )}

        {(activeStepTab === "STEP_1_TEMPLATES" || activeStepTab === "ALL") && (
          <TemplateManagementSection
            classes={classes}
            allSubjects={subjects}
            exams={exams}
            onTemplateAppliedToExam={handleTemplateAppliedToExam}
          />
        )}

        {(activeStepTab === "STEP_3_COMBINED" || activeStepTab === "ALL") && (
          <RulesSection
            title="Combined Papers"
            subtitle="Pair 1st and 2nd papers so students pass both when combined marks meet the threshold — used across tabulation and result stages."
            action={
              <AppButton
                type="button"
                variant="contained"
                color="primary"
                size="small"
                startIcon={<Sparkles size={14} />}
                disabled={combinedLoading || combinedClassSubjects.length === 0}
                onClick={handleAutoPairPresets}
              >
                Auto-detect pairs
              </AppButton>
            }
            toolbar={
              <RulesFilterGrid columns={3}>
                <SessionSelect
                  value={combinedSessionFilter}
                  onChange={setCombinedSessionFilter}
                  label="Session"
                  includeAll
                  allLabel="All Sessions"
                  activeOnly={false}
                  fullWidth
                />
                <AppSelect
                  label="Class"
                  value={combinedClassFilter}
                  onChange={setCombinedClassFilter}
                  options={[
                    { value: "ALL", label: "All Classes" },
                    ...classes.map((cls) => ({ value: cls.id, label: cls.name })),
                  ]}
                />
                <AppSelect
                  label="Target Exam"
                  value={selectedExamId}
                  onChange={handleExamChange}
                  options={[
                    { value: "", label: "Select exam" },
                    ...filteredCombinedExams.map((ex) => ({
                      value: ex.id,
                      label: examOptionLabel(ex),
                    })),
                  ]}
                />
              </RulesFilterGrid>
            }
          >
            <Stack spacing={2.5}>
              <RulesFormBlock
                title={
                  editingCombinedRuleId
                    ? "Edit subject pairing"
                    : `New pairing for ${selectedClassObj?.name || "selected class"}`
                }
                action={
                  editingCombinedRuleId ? (
                    <AppButton
                      type="button"
                      variant="link"
                      color="inherit"
                      size="small"
                      onClick={handleCancelEditCombinedRule}
                    >
                      Cancel
                    </AppButton>
                  ) : null
                }
              >
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    }}
                  >
                    <AppSelect
                      label="1st Paper"
                      value={primarySubjectId}
                      onChange={(newPrimary) => {
                        setPrimarySubjectId(newPrimary);
                        const p = combinedClassSubjects.find((s) => s.id === newPrimary);
                        const s = combinedClassSubjects.find((s) => s.id === secondarySubjectId);
                        if (p && s) {
                          setCombinedRuleName(
                            `${p.name.replace(/1st\s*paper/i, "").trim()} (1st & 2nd Combined)`
                          );
                        } else if (p) {
                          setCombinedRuleName(`${p.name} Combined`);
                        }
                      }}
                      options={[
                        {
                          value: "",
                          label: fetchingCombinedSubjects
                            ? "Loading subjects"
                            : combinedClassSubjects.length === 0
                              ? "No subjects for this class"
                              : "Select 1st paper",
                        },
                        ...combinedClassSubjects.map((sub) => ({
                          value: sub.id,
                          label: subjectOptionLabel(sub),
                        })),
                      ]}
                    />
                    <AppSelect
                      label="2nd Paper"
                      value={secondarySubjectId}
                      onChange={(newSecondary) => {
                        setSecondarySubjectId(newSecondary);
                        const p = combinedClassSubjects.find((s) => s.id === primarySubjectId);
                        const s = combinedClassSubjects.find((s) => s.id === newSecondary);
                        if (p && s) {
                          setCombinedRuleName(
                            `${p.name.replace(/1st\s*paper/i, "").trim()} (1st & 2nd Combined)`
                          );
                        }
                      }}
                      options={[
                        {
                          value: "",
                          label: fetchingCombinedSubjects
                            ? "Loading subjects"
                            : combinedClassSubjects.length === 0
                              ? "No subjects for this class"
                              : "Select 2nd paper",
                        },
                        ...combinedClassSubjects
                          .filter((sub) => sub.id !== primarySubjectId)
                          .map((sub) => ({
                            value: sub.id,
                            label: subjectOptionLabel(sub),
                          })),
                      ]}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                        md: "repeat(4, minmax(0, 1fr))",
                      },
                    }}
                  >
                    <AppTextField
                      label="Pass mark"
                      type="number"
                      value={combinedPassMark}
                      onChange={(e) => setCombinedPassMark(e.target.value)}
                      placeholder="66"
                      helperText="Minimum sum of both papers"
                      slotProps={{ htmlInput: { step: 0.5 } }}
                    />
                    <AppTextField
                      label="Full marks"
                      type="number"
                      value={combinedFullMarks}
                      onChange={(e) => setCombinedFullMarks(e.target.value)}
                      placeholder="200"
                      helperText="Usually 100 + 100"
                    />
                    <AppSelect
                      label="Pass mode"
                      value={combinedPassMode}
                      onChange={(val) => setCombinedPassMode(val as "AGGREGATE_ONLY" | "BOTH")}
                      options={[
                        { value: "AGGREGATE_ONLY", label: "Combined aggregate" },
                        { value: "BOTH", label: "Aggregate and individual" },
                      ]}
                    />
                    <AppSelect
                      label="Grade mode"
                      value={combinedGradeMode}
                      onChange={(val) => setCombinedGradeMode(val as "AVERAGE" | "INDIVIDUAL")}
                      options={[
                        { value: "AVERAGE", label: "Combined average" },
                        { value: "INDIVIDUAL", label: "Individual grades" },
                      ]}
                    />
                  </Box>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    sx={{ alignItems: { sm: "flex-end" } }}
                  >
                    <Box sx={{ flex: 1, width: "100%" }}>
                      <AppTextField
                        label="Rule name"
                        placeholder="Bangla 1st & 2nd Combined"
                        value={combinedRuleName}
                        onChange={(e) => setCombinedRuleName(e.target.value)}
                      />
                    </Box>
                    <AppButton
                      type="button"
                      variant="contained"
                      color="primary"
                      size="medium"
                      startIcon={<Save size={15} />}
                      loading={combinedLoading}
                      disabled={!primarySubjectId || !secondarySubjectId || combinedLoading}
                      onClick={handleSaveCombinedRule}
                    >
                      {editingCombinedRuleId ? "Update rule" : "Save rule"}
                    </AppButton>
                  </Stack>
                </Stack>
              </RulesFormBlock>

              <Box>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Layers size={15} color="#059669" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
                      Active rules
                    </Typography>
                    <Chip
                      size="small"
                      label={combinedRules.length}
                      sx={{ height: 22, fontWeight: 700, bgcolor: "primary.lighter", color: "primary.dark" }}
                    />
                  </Stack>
                  {combinedRules.length > 0 ? (
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Applied during result calculation
                    </Typography>
                  ) : null}
                </Stack>

                {combinedRules.length === 0 ? (
                  <NoDataFound />
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gap: 1.5,
                      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    }}
                  >
                    {combinedRules.map((rule) => (
                      <RulesListItem
                        key={rule.id}
                        title={rule.name || "Combined Rule"}
                        meta={
                          <>
                            {rule.primarySubject?.name} ({rule.primarySubject?.subjectCode})
                            {" + "}
                            {rule.secondarySubject?.name} ({rule.secondarySubject?.subjectCode})
                          </>
                        }
                        badges={
                          <>
                            <Chip
                              size="small"
                              label={`Pass ≥ ${rule.combinedPassMark} / ${rule.combinedFullMarks}`}
                              sx={{
                                height: 24,
                                fontWeight: 600,
                                fontSize: "0.7rem",
                                bgcolor: "primary.lighter",
                                color: "primary.darker",
                              }}
                            />
                            <Chip
                              size="small"
                              variant="outlined"
                              label={rule.passMode === "BOTH" ? "Aggregate + individual" : "Aggregate only"}
                              sx={{ height: 24, fontWeight: 500, fontSize: "0.7rem" }}
                            />
                            <Chip
                              size="small"
                              variant="outlined"
                              label={rule.gradeMode === "AVERAGE" ? "Average grade" : "Individual grades"}
                              sx={{ height: 24, fontWeight: 500, fontSize: "0.7rem" }}
                            />
                          </>
                        }
                        actions={
                          <>
                            <IconButton
                              size="small"
                              onClick={() => handleEditCombinedRule(rule)}
                              aria-label="Edit rule"
                              sx={{ color: "text.secondary", "&:hover": { color: "primary.main", bgcolor: "primary.lighter" } }}
                            >
                              <Pencil size={15} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteCombinedRule(rule.id, rule.name || "Rule")}
                              aria-label="Delete rule"
                              sx={{ color: "text.secondary", "&:hover": { color: "error.main", bgcolor: "error.lighter" } }}
                            >
                              <Trash2 size={15} />
                            </IconButton>
                          </>
                        }
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Stack>
          </RulesSection>
        )}

        {(activeStepTab === "STEP_4_GRADING" || activeStepTab === "ALL") && (
          <RulesSection
            title="Grading scale"
            subtitle="Set GPA caps, fourth-subject surplus threshold, and letter-grade conversion slabs used across all exams."
          >
            <Stack spacing={2.5} sx={{ maxWidth: 880 }}>
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                }}
              >
                <AppTextField
                  label="Max GPA"
                  type="number"
                  value={maxGpa}
                  onChange={(e) => setMaxGpa(e.target.value)}
                  helperText="Usually 5.00"
                  slotProps={{ htmlInput: { step: 0.01 } }}
                />
                <AppTextField
                  label="4th subject threshold"
                  type="number"
                  value={fourthThreshold}
                  onChange={(e) => setFourthThreshold(e.target.value)}
                  helperText="GP above this adds to GPA"
                  slotProps={{ htmlInput: { step: 0.01 } }}
                />
                <AppTextField
                  label="Min pass GPA"
                  type="number"
                  value={passGpa}
                  onChange={(e) => setPassGpa(e.target.value)}
                  helperText="Usually 1.00"
                  slotProps={{ htmlInput: { step: 0.01 } }}
                />
              </Box>

              <Box
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2.5,
                  overflow: "hidden",
                }}
              >
                <Box
                  component="table"
                  sx={{
                    width: 1,
                    borderCollapse: "collapse",
                    "& th": {
                      px: 2,
                      py: 1.5,
                      textAlign: "left",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "text.secondary",
                      bgcolor: "grey.50",
                      borderBottom: 1,
                      borderColor: "divider",
                    },
                    "& td": {
                      px: 2,
                      py: 1.5,
                      fontSize: "0.875rem",
                      borderBottom: 1,
                      borderColor: "divider",
                    },
                    "& tbody tr:last-of-type td": { borderBottom: 0 },
                    "& tbody tr:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <thead>
                    <tr>
                      <th>Grade</th>
                      <th>Grade point</th>
                      <th>Mark range</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGrading?.slabs?.map((slab: any) => (
                      <tr key={slab.id}>
                        <td>
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <Box
                              sx={{
                                width: 36,
                                height: 28,
                                borderRadius: 1,
                                display: "grid",
                                placeItems: "center",
                                fontWeight: 800,
                                fontSize: "0.8125rem",
                                letterSpacing: "-0.02em",
                                bgcolor: slab.isFail ? "error.lighter" : "primary.lighter",
                                color: slab.isFail ? "error.dark" : "primary.darker",
                              }}
                            >
                              {slab.letterGrade}
                            </Box>
                            <Award size={14} color={slab.isFail ? "#BE123C" : "#047857"} />
                          </Stack>
                        </td>
                        <td>
                          <Typography
                            component="span"
                            sx={{
                              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                              fontWeight: 700,
                              color: "primary.dark",
                              fontSize: "0.875rem",
                            }}
                          >
                            {slab.gradePoint.toFixed(2)}
                          </Typography>
                        </td>
                        <td>
                          <Typography
                            component="span"
                            sx={{
                              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                              color: "text.secondary",
                              fontSize: "0.8125rem",
                              fontWeight: 500,
                            }}
                          >
                            {slab.markMin} – {slab.markMax}
                          </Typography>
                        </td>
                        <td>
                          <Chip
                            size="small"
                            label={slab.isFail ? "Fail" : "Pass"}
                            sx={{
                              height: 24,
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              bgcolor: slab.isFail ? "error.lighter" : "primary.lighter",
                              color: slab.isFail ? "error.dark" : "primary.darker",
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </Box>

              <AppButton
                variant="contained"
                color="primary"
                startIcon={<Save size={16} />}
                onClick={handleSaveGrading}
                sx={{ alignSelf: { xs: "stretch", sm: "flex-start" }, px: 3 }}
              >
                Save grading rules
              </AppButton>
            </Stack>
          </RulesSection>
        )}
      </RulesAtmosphere>
    </ResultsPageShell>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ResultsPageShell,
  ResultsPageHeader,
  ResultsNotice,
} from "@/sections/results/component/result-page-ui";
import {
  Save,
  Check,
  Award,
  Layers,
  Search,
  Trash2,
  Pencil,
  RefreshCw,
  CheckCircle2,
  X,
  GitMerge,
  Sparkles,
  Link2,
  AlertTriangle,
} from "@/components/iconify/lucide";
import { AppButton } from "@/components/button/app-button";
import { AppSelect, AppTextField, NoDataFound } from "@/components";
import { SessionSelect } from "@/components/SessionSelect";
import { TemplateManagementSection } from "@/sections/academic/component/template-management-section";
import { AppTabs } from "@/components/ui/tabs-component";

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

      {/* STEP 1: TEMPLATE MANAGEMENT */}
      {(activeStepTab === "STEP_1_TEMPLATES" || activeStepTab === "ALL") && (
        <TemplateManagementSection
          classes={classes}
          allSubjects={subjects}
          exams={exams}
          onTemplateAppliedToExam={handleTemplateAppliedToExam}
        />
      )}

      {/* STEP 2 (previously STEP 3): COMBINED 1ST & 2ND PAPER RULES */}
      {(activeStepTab === "STEP_3_COMBINED" || activeStepTab === "ALL") && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
          <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-emerald-50/70 via-slate-50 to-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs">
                  <GitMerge className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-bold text-slate-900">
                  Combined Subject Pass/Fail Logic (1st & 2nd Paper Pairing Engine)
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {combinedRules.length} Active {combinedRules.length === 1 ? "Pair" : "Pairs"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Dynamically pair two subjects evaluated together (e.g. Bangla 1st & 2nd Paper, English 1st & 2nd Paper).
                When combined marks meet the threshold (e.g. 66/200), students automatically pass both papers across all tabulation sheets and result stages.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <AppButton
                type="button"
                variant="contained"
                color="success"
                size="small"
                startIcon={<Sparkles size={14} />}
                disabled={combinedLoading || combinedClassSubjects.length === 0}
                onClick={handleAutoPairPresets}
                title="Automatically scan and pair 1st and 2nd paper subjects for this class"
              >
                Auto-Detect 1st & 2nd Papers
              </AppButton>
            </div>
          </div>

          {/* Session, Class & Target Exam Filter Toolbar */}
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SessionSelect
              value={combinedSessionFilter}
              onChange={(val) => {
                setCombinedSessionFilter(val);
              }}
              label="Session"
              includeAll={true}
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
                { value: "", label: "-- Select Exam --" },
                ...filteredCombinedExams.map((ex) => ({
                  value: ex.id,
                  label: `${ex.name} ${ex.class?.name ? `(${ex.class.name})` : ""}`.trim(),
                })),
              ]}
            />
          </div>

          <div className="p-5 space-y-5">
            {/* Form to create/edit combined rule */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {editingCombinedRuleId
                      ? "Edit Combined Subject Pairing"
                      : `Create Combined Subject Pairing for ${selectedClassObj?.name || "Class"}`}
                  </span>
                </span>
                {editingCombinedRuleId && (
                  <AppButton
                    type="button"
                    variant="link"
                    color="inherit"
                    size="small"
                    onClick={handleCancelEditCombinedRule}
                  >
                    Cancel Edit
                  </AppButton>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Subject (1st Paper) - Strictly Class-Wise */}
                <AppSelect
                  label="1st Paper (Primary Subject)"
                  value={primarySubjectId}
                  onChange={(newPrimary) => {
                    setPrimarySubjectId(newPrimary);
                    const p = combinedClassSubjects.find((s) => s.id === newPrimary);
                    const s = combinedClassSubjects.find((s) => s.id === secondarySubjectId);
                    if (p && s) {
                      setCombinedRuleName(`${p.name.replace(/1st\s*paper/i, "").trim()} (1st & 2nd Combined)`);
                    } else if (p) {
                      setCombinedRuleName(`${p.name} Combined`);
                    }
                  }}
                  options={[
                    {
                      value: "",
                      label: fetchingCombinedSubjects
                        ? "-- Loading Class Subjects... --"
                        : combinedClassSubjects.length === 0
                        ? "-- No subjects mapped to this class --"
                        : "-- Select 1st Paper --",
                    },
                    ...combinedClassSubjects.map((sub) => ({
                      value: sub.id,
                      label: `${sub.name} (${sub.subjectCode})`,
                    })),
                  ]}
                />

                {/* Secondary Subject (2nd Paper) - Strictly Class-Wise */}
                <AppSelect
                  label="2nd Paper (Secondary Subject)"
                  value={secondarySubjectId}
                  onChange={(newSecondary) => {
                    setSecondarySubjectId(newSecondary);
                    const p = combinedClassSubjects.find((s) => s.id === primarySubjectId);
                    const s = combinedClassSubjects.find((s) => s.id === newSecondary);
                    if (p && s) {
                      setCombinedRuleName(`${p.name.replace(/1st\s*paper/i, "").trim()} (1st & 2nd Combined)`);
                    }
                  }}
                  options={[
                    {
                      value: "",
                      label: fetchingCombinedSubjects
                        ? "-- Loading Class Subjects... --"
                        : combinedClassSubjects.length === 0
                        ? "-- No subjects mapped to this class --"
                        : "-- Select 2nd Paper --",
                    },
                    ...combinedClassSubjects
                      .filter((sub) => sub.id !== primarySubjectId)
                      .map((sub) => ({
                        value: sub.id,
                        label: `${sub.name} (${sub.subjectCode})`,
                      })),
                  ]}
                />
              </div>

              {/* Thresholds and Modes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <AppTextField
                  label="Combined Pass Mark"
                  type="number"
                  value={combinedPassMark}
                  onChange={(e) => setCombinedPassMark(e.target.value)}
                  placeholder="e.g. 66"
                  helperText="Min sum of 1st+2nd paper to pass"
                  slotProps={{ htmlInput: { step: 0.5 } }}
                />

                <AppTextField
                  label="Combined Full Marks"
                  type="number"
                  value={combinedFullMarks}
                  onChange={(e) => setCombinedFullMarks(e.target.value)}
                  placeholder="e.g. 200"
                  helperText="e.g. 100 + 100 = 200"
                />

                <AppSelect
                  label="Pass Evaluation Mode"
                  value={combinedPassMode}
                  onChange={(val) => setCombinedPassMode(val as "AGGREGATE_ONLY" | "BOTH")}
                  options={[
                    { value: "AGGREGATE_ONLY", label: "Combined Aggregate (Board Standard)" },
                    { value: "BOTH", label: "Aggregate + Individual Papers Pass" },
                  ]}
                />

                <AppSelect
                  label="Grade Distribution"
                  value={combinedGradeMode}
                  onChange={(val) => setCombinedGradeMode(val as "AVERAGE" | "INDIVIDUAL")}
                  options={[
                    { value: "AVERAGE", label: "Combined Average Grade (NCTB Standard)" },
                    { value: "INDIVIDUAL", label: "Keep Individual Subject Grades" },
                  ]}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="w-full sm:w-auto flex-1">
                  <AppTextField
                    label="Rule Name"
                    placeholder="e.g. Bangla 1st & 2nd Combined"
                    value={combinedRuleName}
                    onChange={(e) => setCombinedRuleName(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <AppButton
                    type="button"
                    variant="contained"
                    color="secondary"
                    size="small"
                    startIcon={<Save size={14} />}
                    loading={combinedLoading}
                    disabled={!primarySubjectId || !secondarySubjectId || combinedLoading}
                    onClick={handleSaveCombinedRule}
                  >
                    {editingCombinedRuleId ? "Update Combined Rule" : "Save Combined Rule"}
                  </AppButton>
                </div>
              </div>
            </div>

            {/* Active Paired Rules List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Configured Combined Rules for Selected Exam ({combinedRules.length}):</span>
                </span>
                {combinedRules.length > 0 && (
                  <span className="text-[11px] text-emerald-700 font-medium">
                    ✓ Automatically applied during result calculation and to all tabulation sheets
                  </span>
                )}
              </div>

              {combinedRules.length === 0 ? (
                <NoDataFound />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {combinedRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="border border-slate-200 bg-white hover:border-emerald-300 p-3.5 rounded-xl shadow-2xs transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>{rule.name || "Combined Rule"}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1 font-medium">
                            <span className="text-slate-900 font-semibold">{rule.primarySubject?.name}</span> ({rule.primarySubject?.subjectCode})
                            <span className="mx-1.5 text-slate-400 font-bold">+</span>
                            <span className="text-slate-900 font-semibold">{rule.secondarySubject?.name}</span> ({rule.secondarySubject?.subjectCode})
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditCombinedRule(rule)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Edit this combined rule"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCombinedRule(rule.id, rule.name || "Rule")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete this combined rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                          Pass Mark: ≥ {rule.combinedPassMark} / {rule.combinedFullMarks}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-medium border border-blue-200">
                          {rule.passMode === "BOTH" ? "Aggregate + Indiv Pass" : "Aggregate Only"}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
                          {rule.gradeMode === "AVERAGE" ? "Combined Avg Grade" : "Individual Grades"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 (previously STEP 4): GRADING SCALE & 4TH-SUBJECT SURPLUS RULES ONLY */}
      {(activeStepTab === "STEP_4_GRADING" || activeStepTab === "ALL") && (
        <div className="max-w-4xl mx-auto">
          {/* Panel: Grading System & 4th-Subject Surplus Rules */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <span>Grading System & 4th-Subject Surplus Rules</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set GPA caps, 4th subject threshold, and letter grade conversion slabs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <AppTextField
                label="Max GPA Cap"
                type="number"
                value={maxGpa}
                onChange={(e) => setMaxGpa(e.target.value)}
                helperText="Usually 5.00 for NCTB standard"
                slotProps={{ htmlInput: { step: 0.01 } }}
              />
              <AppTextField
                label="4th Sub Threshold"
                type="number"
                value={fourthThreshold}
                onChange={(e) => setFourthThreshold(e.target.value)}
                helperText="GP above this value is added to total GPA"
                slotProps={{ htmlInput: { step: 0.01 } }}
              />
              <AppTextField
                label="Min Pass GPA"
                type="number"
                value={passGpa}
                onChange={(e) => setPassGpa(e.target.value)}
                helperText="Usually 1.00 minimum pass threshold"
                slotProps={{ htmlInput: { step: 0.01 } }}
              />
            </div>

            {/* Slabs Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Grade</th>
                    <th className="p-3">GP (Grade Point)</th>
                    <th className="p-3">Mark Range</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedGrading?.slabs?.map((slab: any) => (
                    <tr key={slab.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{slab.letterGrade}</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">{slab.gradePoint.toFixed(2)}</td>
                      <td className="p-3 font-mono text-slate-600">
                        {slab.markMin} - {slab.markMax}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            slab.isFail ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {slab.isFail ? "Fail" : "Pass"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AppButton
              variant="contained"
              color="success"
              fullWidth
              startIcon={<Save size={16} />}
              onClick={handleSaveGrading}
            >
              Update Grading & Surplus Rules
            </AppButton>
          </div>
        </div>
      )}

      {/* Status / Alert Banner */}
      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </ResultsPageShell>
  );
}

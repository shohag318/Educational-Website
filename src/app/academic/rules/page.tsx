"use client";

import { useEffect, useState, useMemo } from "react";
import { ResultNavHeader } from "@/app/results/ResultNavHeader";
import {
  Sliders,
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
  Bookmark,
} from "lucide-react";
import { SessionSelect } from "@/components/SessionSelect";
import { TemplateManagementSection } from "@/components/TemplateManagementSection";

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
    <div className="max-w-7xl mx-auto space-y-6">
      <ResultNavHeader />

      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-emerald-600" />
          <span>Grading & Assessment Rules</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure component pass marks, combined papers, 4th-subject surplus rules, and GPA grade slabs.
        </p>
      </div>

      {/* Step Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-xs flex flex-wrap items-center gap-1.5 text-xs">
        <button
          type="button"
          onClick={() => setActiveStepTab("STEP_1_TEMPLATES")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeStepTab === "STEP_1_TEMPLATES"
              ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Step 1: Template Management</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] ${
              activeStepTab === "STEP_1_TEMPLATES"
                ? "bg-emerald-800 text-white"
                : "bg-emerald-100 text-emerald-800 font-bold"
            }`}
          >
            {dbTemplates.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStepTab("STEP_3_COMBINED")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeStepTab === "STEP_3_COMBINED"
              ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <GitMerge className="w-4 h-4" />
          <span>Step 2: Combined 1st & 2nd Paper Rules</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] ${
              activeStepTab === "STEP_3_COMBINED"
                ? "bg-emerald-800 text-white"
                : "bg-slate-100 text-slate-700 font-bold"
            }`}
          >
            {combinedRules.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStepTab("STEP_4_GRADING")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeStepTab === "STEP_4_GRADING"
              ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Step 3: Grading Scale & 4th-Subject Rules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStepTab("ALL")}
          className={`flex items-center space-x-2 px-3 py-2 rounded-xl font-semibold transition-all cursor-pointer sm:ml-auto ${
            activeStepTab === "ALL"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>All Steps Overview</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Rules updated successfully.</span>
        </div>
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
              <button
                type="button"
                onClick={handleAutoPairPresets}
                disabled={combinedLoading || combinedClassSubjects.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
                title="Automatically scan and pair 1st and 2nd paper subjects for this class"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Detect 1st & 2nd Papers</span>
              </button>
            </div>
          </div>

          {/* Session, Class & Target Exam Filter Toolbar */}
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Session:</label>
              <SessionSelect
                value={combinedSessionFilter}
                onChange={(val) => {
                  setCombinedSessionFilter(val);
                }}
                label=""
                includeAll={true}
                allLabel="All Sessions"
                activeOnly={false}
                selectClassName="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium text-xs focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Class:</label>
              <select
                value={combinedClassFilter}
                onChange={(e) => setCombinedClassFilter(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium text-xs focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Target Exam:</label>
              <select
                value={selectedExamId}
                onChange={(e) => handleExamChange(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium text-xs focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">-- Select Exam --</option>
                {filteredCombinedExams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} {ex.class?.name ? `(${ex.class.name})` : ""}
                  </option>
                ))}
              </select>
            </div>
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
                  <button
                    type="button"
                    onClick={handleCancelEditCombinedRule}
                    className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Primary Subject (1st Paper) - Strictly Class-Wise */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    1st Paper (Primary Subject):
                  </label>
                  <select
                    value={primarySubjectId}
                    onChange={(e) => {
                      const newPrimary = e.target.value;
                      setPrimarySubjectId(newPrimary);
                      const p = combinedClassSubjects.find((s) => s.id === newPrimary);
                      const s = combinedClassSubjects.find((s) => s.id === secondarySubjectId);
                      if (p && s) {
                        setCombinedRuleName(`${p.name.replace(/1st\s*paper/i, "").trim()} (1st & 2nd Combined)`);
                      } else if (p) {
                        setCombinedRuleName(`${p.name} Combined`);
                      }
                    }}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
                  >
                    <option value="">
                      {fetchingCombinedSubjects
                        ? "-- Loading Class Subjects... --"
                        : combinedClassSubjects.length === 0
                        ? "-- No subjects mapped to this class --"
                        : "-- Select 1st Paper --"}
                    </option>
                    {combinedClassSubjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.subjectCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Secondary Subject (2nd Paper) - Strictly Class-Wise */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    2nd Paper (Secondary Subject):
                  </label>
                  <select
                    value={secondarySubjectId}
                    onChange={(e) => {
                      const newSecondary = e.target.value;
                      setSecondarySubjectId(newSecondary);
                      const p = combinedClassSubjects.find((s) => s.id === primarySubjectId);
                      const s = combinedClassSubjects.find((s) => s.id === newSecondary);
                      if (p && s) {
                        setCombinedRuleName(`${p.name.replace(/1st\s*paper/i, "").trim()} (1st & 2nd Combined)`);
                      }
                    }}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
                  >
                    <option value="">
                      {fetchingCombinedSubjects
                        ? "-- Loading Class Subjects... --"
                        : combinedClassSubjects.length === 0
                        ? "-- No subjects mapped to this class --"
                        : "-- Select 2nd Paper --"}
                    </option>
                    {combinedClassSubjects
                      .filter((sub) => sub.id !== primarySubjectId)
                      .map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.subjectCode})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Thresholds and Modes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Combined Pass Mark:
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={combinedPassMark}
                    onChange={(e) => setCombinedPassMark(e.target.value)}
                    placeholder="e.g. 66"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500">Min sum of 1st+2nd paper to pass</span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Combined Full Marks:
                  </label>
                  <input
                    type="number"
                    value={combinedFullMarks}
                    onChange={(e) => setCombinedFullMarks(e.target.value)}
                    placeholder="e.g. 200"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500">e.g. 100 + 100 = 200</span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Pass Evaluation Mode:
                  </label>
                  <select
                    value={combinedPassMode}
                    onChange={(e) => setCombinedPassMode(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
                  >
                    <option value="AGGREGATE_ONLY">Combined Aggregate (Board Standard)</option>
                    <option value="BOTH">Aggregate + Individual Papers Pass</option>
                  </select>
                  <span className="text-[10px] text-slate-500">Paper 1 + Paper 2 ≥ Pass Mark</span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Grade Distribution:
                  </label>
                  <select
                    value={combinedGradeMode}
                    onChange={(e) => setCombinedGradeMode(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
                  >
                    <option value="AVERAGE">Combined Average Grade (NCTB Standard)</option>
                    <option value="INDIVIDUAL">Keep Individual Subject Grades</option>
                  </select>
                  <span className="text-[10px] text-slate-500">Scale total marks to 100 for GP</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="w-full sm:w-auto flex-1">
                  <input
                    type="text"
                    placeholder="Rule Name (e.g. Bangla 1st & 2nd Combined)"
                    value={combinedRuleName}
                    onChange={(e) => setCombinedRuleName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                  />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleSaveCombinedRule}
                    disabled={!primarySubjectId || !secondarySubjectId || combinedLoading}
                    className={`w-full sm:w-auto font-semibold px-5 py-2 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors ${
                      !primarySubjectId || !secondarySubjectId || combinedLoading
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                        : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingCombinedRuleId ? "Update Combined Rule" : "Save Combined Rule"}</span>
                  </button>
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
                <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center text-xs text-slate-500 space-y-1 bg-slate-50/50">
                  <p className="font-semibold text-slate-600">No combined subject rules configured yet for this exam.</p>
                  <p className="text-[11px] text-slate-400">
                    Select 1st Paper and 2nd Paper above and click &quot;Save Combined Rule&quot;, or click &quot;Auto-Detect 1st &amp; 2nd Papers&quot; to auto-pair.
                  </p>
                </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Max GPA Cap:</label>
                <input
                  type="number"
                  step="0.01"
                  value={maxGpa}
                  onChange={(e) => setMaxGpa(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Usually 5.00 for NCTB standard</span>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">4th Sub Threshold:</label>
                <input
                  type="number"
                  step="0.01"
                  value={fourthThreshold}
                  onChange={(e) => setFourthThreshold(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">GP above this value is added to total GPA</span>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Min Pass GPA:</label>
                <input
                  type="number"
                  step="0.01"
                  value={passGpa}
                  onChange={(e) => setPassGpa(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Usually 1.00 minimum pass threshold</span>
              </div>
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

            <button
              onClick={handleSaveGrading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-sm hover:shadow"
            >
              <Save className="w-4 h-4" />
              <span>Update Grading & Surplus Rules</span>
            </button>
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
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ResultNavHeader } from "@/app/results/ResultNavHeader";
import {
  TableProperties,
  Save,
  Check,
  AlertCircle,
  Lock,
  Download,
  FileSpreadsheet,
  ArrowRight,
  Sliders,
  Sparkles,
  RefreshCw,
  Calculator,
  Percent,
  Layers,
  CheckCircle2,
  Plus,
  Minus,
  X,
  XCircle,
  Printer,
} from "lucide-react";
import * as XLSX from "xlsx";
import { MarkInputPdfModal } from "@/components/MarkInputPdfModal";
import { SessionSelect } from "@/components/SessionSelect";

export default function MarkEntryPage() {
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamType, setSelectedExamType] = useState("ALL");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const [rows, setRows] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [showMarkInputModal, setShowMarkInputModal] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const modalTableRef = useRef<HTMLDivElement>(null);

  const scrollToRow = (rowIndex: number) => {
    if (modalTableRef.current) {
      const targetElem = modalTableRef.current.querySelector(`[data-row-idx="${rowIndex}"]`);
      if (targetElem) {
        targetElem.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        modalTableRef.current.scrollTo({ top: rowIndex * 36, behavior: "smooth" });
      }
    }
  };

  // Class Test (CT) & Percentage Weighting State
  const [isCtActive, setIsCtActive] = useState<boolean>(false);
  const [selectedCtExamId, setSelectedCtExamId] = useState("");
  const [mainExamPercentage, setMainExamPercentage] = useState<number>(80);
  const [ctPercentage, setCtPercentage] = useState<number>(20);
  const [ctExamLoading, setCtExamLoading] = useState(false);
  const [ctSyncSuccess, setCtSyncSuccess] = useState(false);

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
    if (type === "Semister" || type === "Semester") {
      const isCt =
        tc === "class test" ||
        tc === "ct" ||
        name.includes("class test") ||
        name.startsWith("ct-") ||
        name.startsWith("ct ");
      return !isCt;
    }
    return tc === type.toLowerCase();
  };

  const filteredExams = exams.filter((ex) => {
    if (selectedSession !== "ALL" && ex.academicYear?.yearName && ex.academicYear.yearName !== selectedSession) {
      return false;
    }
    return isExamMatchingType(ex, selectedExamType);
  });
  const activeExam = exams.find((e) => e.id === selectedExamId);
  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);
  const isClassTest =
    selectedExamType === "Class Test" ||
    (activeExam ? isExamMatchingType(activeExam, "Class Test") : false);

  const distinctExamTypes = Array.from(
    new Set([
      "Class Test",
      "Semester",
      ...exams.map((e) => e.termCode).filter(Boolean),
    ])
  );

  const [customCtMaxMark, setCustomCtMaxMark] = useState<number | null>(null);

  const ctCompDef = config?.components?.find((c: any) =>
    c.componentName?.toUpperCase() === "CT" ||
    c.componentName?.toLowerCase().includes("class test")
  ) || (config?.components?.length === 1 ? config?.components[0] : null);

  const ctMaxMark =
    customCtMaxMark !== null && customCtMaxMark > 0
      ? customCtMaxMark
      : (ctCompDef?.fullMarks || (config?.totalFullMarks && config.totalFullMarks <= 50 ? config.totalFullMarks : 20));

  const handleUpdateCtMaxMark = (newMax: number) => {
    const val = Math.max(1, Math.round(newMax));
    setCustomCtMaxMark(val);
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const classNum = selectedClass?.numericValue ?? parseInt(selectedClass?.name?.replace(/\D/g, "") || "0", 10);
  const isClass11Or12 = Boolean(
    selectedClass && (
      classNum === 11 ||
      classNum === 12 ||
      /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(selectedClass.name || "")
    )
  );
  const availableSections = (selectedClass?.sections || []).filter((s: any) => {
    if (selectedGroup && selectedGroup !== "ALL" && s.groupType !== selectedGroup) return false;
    if (!selectedShift || selectedShift === "ALL") return true;
    return s.shift?.toUpperCase() === selectedShift.toUpperCase();
  });

  const availableShifts = Array.from(
    new Set(
      selectedClass?.sections
        ?.map((s: any) => s.shift?.toUpperCase())
        .filter((sh: any) => Boolean(sh) && sh !== "MORNING" && sh !== "DAY") || []
    )
  ) as string[];

  const availableCtExams = exams
    .filter((e) => e.id !== selectedExamId)
    .sort((a, b) => {
      const aIsCt = isExamMatchingType(a, "Class Test");
      const bIsCt = isExamMatchingType(b, "Class Test");
      if (aIsCt && !bIsCt) return -1;
      if (bIsCt && !aIsCt) return 1;
      return 0;
    });

  const [subjectsLoading, setSubjectsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/exams")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setExams(data.data);
          setSelectedExamId(data.data[0].id);
        }
      });

    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setClasses(data.data);
          setSelectedClassId(data.data[0].id);
          if (data.data[0].sections?.length > 0) {
            setSelectedSectionId(data.data[0].sections[0].id);
          }
        }
      });
  }, []);

  const fetchSubjects = async (classId: string, group: string, examId?: string, sectionId?: string) => {
    if (!classId) return;
    setSubjectsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("classId", classId);
      if (examId) {
        params.set("examId", examId);
        params.set("examOnly", "true"); // Strictly only show subjects assigned to Target Exam
      }

      // If group is ALL, check if the selected section has an explicit group
      let effectiveGroup = group;
      if ((!effectiveGroup || effectiveGroup === "ALL") && sectionId) {
        const sec = availableSections.find((s: any) => s.id === sectionId);
        if (sec?.groupType && sec.groupType !== "ALL") {
          effectiveGroup = sec.groupType;
        }
      }

      if (effectiveGroup && effectiveGroup !== "ALL") {
        params.set("groupType", effectiveGroup);
      }
      const res = await fetch(`/api/subjects?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        const fetchedSubjects = data.data || [];
        setSubjects(fetchedSubjects);
        setSelectedSubjectId((prev) => {
          const exists = fetchedSubjects.some((s: any) => s.id === prev);
          if (exists) return prev;
          return fetchedSubjects.length > 0 ? fetchedSubjects[0].id : "";
        });
      } else {
        setSubjects([]);
        setSelectedSubjectId("");
      }
    } catch (e) {
      console.error("Failed to fetch subjects:", e);
      setSubjects([]);
      setSelectedSubjectId("");
    } finally {
      setSubjectsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      fetchSubjects(selectedClassId, selectedGroup, selectedExamId, selectedSectionId);
    }
  }, [selectedClassId, selectedGroup, selectedExamId, selectedSectionId]);

  const handleExamTypeChange = (newType: string) => {
    setSelectedExamType(newType);
    const matchingExams = exams.filter((ex) => isExamMatchingType(ex, newType));
    if (matchingExams.length > 0) {
      const isCurrentStillMatching = matchingExams.some((e) => e.id === selectedExamId);
      if (!isCurrentStillMatching) {
        handleExamChange(matchingExams[0].id);
      }
    } else {
      setSelectedExamId("");
    }
  };

  const handleExamChange = (newExamId: string) => {
    setSelectedExamId(newExamId);
    const ex = exams.find((e) => e.id === newExamId);
    if (ex?.classId && ex.classId !== selectedClassId) {
      handleClassChange(ex.classId);
    }
  };

  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    const c = classes.find((cl) => cl.id === newClassId);
    const chosenNum = c?.numericValue ?? parseInt(c?.name?.replace(/\D/g, "") || "0", 10);
    if (c && (chosenNum === 11 || chosenNum === 12 || /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(c.name || ""))) {
      if (selectedGroup === "GENERAL") setSelectedGroup("ALL");
    }
    const matching = (c?.sections || []).filter((s: any) => {
      if (selectedGroup && selectedGroup !== "ALL" && s.groupType !== selectedGroup) return false;
      if (!selectedShift || selectedShift === "ALL") return true;
      return s.shift?.toUpperCase() === selectedShift.toUpperCase();
    });
    if (matching.length > 0) {
      setSelectedSectionId(matching[0].id);
    } else if (c?.sections?.length > 0) {
      setSelectedSectionId(c.sections[0].id);
    } else {
      setSelectedSectionId("");
    }
  };

  const handleShiftChange = (newShift: string) => {
    setSelectedShift(newShift);
    const c = classes.find((cl) => cl.id === selectedClassId);
    const matching = (c?.sections || []).filter((s: any) => {
      if (selectedGroup && selectedGroup !== "ALL" && s.groupType !== selectedGroup) return false;
      if (!newShift || newShift === "ALL") return true;
      return s.shift?.toUpperCase() === newShift.toUpperCase();
    });
    if (selectedSectionId) {
      const stillValid = matching.some((s: any) => s.id === selectedSectionId);
      if (!stillValid) {
        setSelectedSectionId(matching.length > 0 ? matching[0].id : "");
      }
    }
  };

  const handleGroupChange = (newGroup: string) => {
    setSelectedGroup(newGroup);
    const c = classes.find((cl) => cl.id === selectedClassId);
    const matching = (c?.sections || []).filter((s: any) => {
      if (newGroup && newGroup !== "ALL" && s.groupType !== newGroup) return false;
      if (!selectedShift || selectedShift === "ALL") return true;
      return s.shift?.toUpperCase() === selectedShift.toUpperCase();
    });
    if (selectedSectionId) {
      const stillValid = matching.some((s: any) => s.id === selectedSectionId);
      if (!stillValid) {
        setSelectedSectionId(matching.length > 0 ? matching[0].id : "");
      }
    }
  };

  const fetchSpreadsheet = async () => {
    if (!selectedExamId || !selectedSubjectId) {
      setRows([]);
      setConfig(null);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("examId", selectedExamId);
      params.set("subjectId", selectedSubjectId);
      if (selectedClassId) params.set("classId", selectedClassId);
      if (selectedSectionId) params.set("sectionId", selectedSectionId);
      if (selectedShift && selectedShift !== "ALL") params.set("shift", selectedShift);
      
      let effectiveGroup = selectedGroup;
      if ((!effectiveGroup || effectiveGroup === "ALL") && selectedSectionId) {
        const sec = availableSections.find((s: any) => s.id === selectedSectionId);
        if (sec?.groupType && sec.groupType !== "ALL") {
          effectiveGroup = sec.groupType;
        }
      }
      if (effectiveGroup && effectiveGroup !== "ALL") {
        params.set("groupType", effectiveGroup);
      }

      const url = `/api/marks?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        if (data.config) {
          const ctDef = data.config.components?.find(
            (c: any) => c.componentName?.toUpperCase() === "CT" || c.componentName?.toLowerCase().includes("class test")
          );
          if (ctDef && ctDef.fullMarks) {
            setCustomCtMaxMark(ctDef.fullMarks);
          } else if (data.config.totalFullMarks && data.config.totalFullMarks <= 50) {
            setCustomCtMaxMark(data.config.totalFullMarks);
          }
        }
        const mappedRows = (data.rows || []).map((r: any) => {
          let val = r.components?.CT !== undefined ? r.components.CT : (r.ctMark ?? "");
          if ((val === "" || val === undefined) && data.config?.components) {
            const def = data.config.components.find((c: any) =>
              c.componentName?.toUpperCase() === "CT" ||
              c.componentName?.toLowerCase().includes("class test")
            ) || (data.config.components.length === 1 ? data.config.components[0] : null);
            if (def && r.components?.[def.componentName] !== undefined) {
              val = r.components[def.componentName];
            }
          }
          return {
            ...r,
            ctMark: val,
          };
        });
        setRows(mappedRows);
        if (data.rows?.some((r: any) => r.components?.CT !== undefined && r.components?.CT !== null && r.components?.CT !== "")) {
          setIsCtActive(true);
        }
        if (selectedCtExamId && isCtActive) {
          syncCtMarks(selectedCtExamId, mappedRows, ctPercentage);
        }
      } else {
        setConfig(null);
        setRows([]);
      }
    } catch (e) {
      console.error(e);
      setConfig(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpreadsheet();
  }, [selectedExamId, selectedSubjectId, selectedClassId, selectedSectionId, selectedShift, selectedGroup]);

  // Sync marks from selected Class Test (CT) exam
  const syncCtMarks = async (ctExamId: string, currentRows: any[], targetCtPercent: number) => {
    if (!ctExamId || !selectedSubjectId) return;
    setCtExamLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("examId", ctExamId);
      params.set("subjectId", selectedSubjectId);
      if (selectedClassId) params.set("classId", selectedClassId);
      if (selectedSectionId) params.set("sectionId", selectedSectionId);
      if (selectedShift && selectedShift !== "ALL") params.set("shift", selectedShift);
      if (selectedGroup && selectedGroup !== "ALL") params.set("groupType", selectedGroup);

      const res = await fetch(`/api/marks?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.rows) {
        const ctRows = data.rows;
        const ctConfigFull = data.config?.totalFullMarks || 20;

        setRows((prev) => {
          return prev.map((row) => {
            const ctRow = ctRows.find(
              (cr: any) =>
                cr.enrollmentId === row.enrollmentId ||
                (cr.studentIdNo && cr.studentIdNo === row.studentIdNo) ||
                cr.roll === row.roll
            );

            if (ctRow && ctRow.components) {
              let ctTotal = 0;
              if (ctRow.components.CT !== undefined && ctRow.components.CT !== null && ctRow.components.CT !== "") {
                ctTotal = parseFloat(String(ctRow.components.CT)) || 0;
              } else {
                for (const [k, v] of Object.entries(ctRow.components)) {
                  if (k !== "CT") {
                    ctTotal += parseFloat(String(v)) || 0;
                  }
                }
              }
              const scaled =
                ctConfigFull > 0
                  ? Math.round(((ctTotal / ctConfigFull) * targetCtPercent) * 10) / 10
                  : ctTotal;

              return {
                ...row,
                rawCtScore: ctTotal,
                ctFullMarks: ctConfigFull,
                ctMark: scaled,
                ctSynced: true,
                components: {
                  ...row.components,
                  CT: scaled,
                },
              };
            }
            return row;
          });
        });
        setCtSyncSuccess(true);
        setTimeout(() => setCtSyncSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to sync CT marks:", err);
    } finally {
      setCtExamLoading(false);
    }
  };

  const handleSelectCtExam = async (ctExamId: string) => {
    setSelectedCtExamId(ctExamId);
    if (!ctExamId) {
      // Clear auto-synced flag but keep values so teacher doesn't lose manual inputs
      setRows((prev) => prev.map((r) => ({ ...r, ctSynced: false })));
      return;
    }
    setIsCtActive(true);
    await syncCtMarks(ctExamId, rows, ctPercentage);
  };

  const rescaleCtSyncedRows = (newCtPercent: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.ctSynced && r.rawCtScore !== undefined && r.ctFullMarks) {
          const scaled =
            r.ctFullMarks > 0
              ? Math.round(((r.rawCtScore / r.ctFullMarks) * newCtPercent) * 10) / 10
              : r.rawCtScore;
          return {
            ...r,
            ctMark: scaled,
            components: {
              ...r.components,
              CT: scaled,
            },
          };
        }
        return r;
      })
    );
  };

  const handleUpdateMainPercentage = (newPercent: number) => {
    const clampedMain = Math.max(0, Math.min(100, Math.round(newPercent)));
    const autoCt = 100 - clampedMain;
    setMainExamPercentage(clampedMain);
    setCtPercentage(autoCt);
    rescaleCtSyncedRows(autoCt);
  };

  const handleUpdateCtPercentage = (newPercent: number) => {
    const clampedCt = Math.max(0, Math.min(100, Math.round(newPercent)));
    const autoMain = 100 - clampedCt;
    setCtPercentage(clampedCt);
    setMainExamPercentage(autoMain);
    rescaleCtSyncedRows(clampedCt);
  };

  const handleApplyPreset = (mainP: number, ctP: number) => {
    handleUpdateMainPercentage(mainP);
  };

  const handleCellChange = (rowIndex: number, compName: string, value: string) => {
    const updated = [...rows];
    if (!updated[rowIndex].components) updated[rowIndex].components = {};
    updated[rowIndex].components[compName] = value === "" ? "" : parseFloat(value) || 0;
    setRows(updated);
  };

  const handleCtCellChange = (rowIndex: number, value: string) => {
    const updated = [...rows];
    const num = value === "" ? "" : parseFloat(value) || 0;
    updated[rowIndex].ctMark = num;
    updated[rowIndex].ctSynced = false; // Manually edited
    if (!updated[rowIndex].components) updated[rowIndex].components = {};
    updated[rowIndex].components.CT = num;
    if (ctCompDef && ctCompDef.componentName !== "CT") {
      updated[rowIndex].components[ctCompDef.componentName] = num;
    }
    setRows(updated);
  };

  const handleAbsentToggle = (rowIndex: number, checked: boolean) => {
    const updated = [...rows];
    updated[rowIndex].isAbsent = checked;
    setRows(updated);
  };

  const handleSaveMarks = async () => {
    if (!selectedExamId || !selectedSubjectId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExamId,
          subjectId: selectedSubjectId,
          ctMaxMark: isClassTest ? ctMaxMark : undefined,
          entries: rows.map((r) => {
            if (isClassTest) {
              const ctVal = r.ctMark !== undefined && r.ctMark !== "" ? parseFloat(String(r.ctMark)) || 0 : "";
              const comps: Record<string, any> = { CT: ctVal };
              if (ctCompDef && ctCompDef.componentName !== "CT") {
                comps[ctCompDef.componentName] = ctVal;
              }
              return {
                enrollmentId: r.enrollmentId,
                isAbsent: r.isAbsent,
                components: comps,
              };
            }

            const comps: Record<string, any> = { ...r.components };
            if (isCtActive && r.ctMark !== undefined && r.ctMark !== "") {
              comps.CT = parseFloat(String(r.ctMark)) || 0;
            } else if (!isCtActive) {
              delete comps.CT;
            }
            return {
              enrollmentId: r.enrollmentId,
              isAbsent: r.isAbsent,
              components: comps,
            };
          }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("Error saving: " + data.error);
      }
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut: ESC to close Mark Input Window Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showMarkInputModal) {
        setShowMarkInputModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showMarkInputModal]);

  const handleSubmitMarks = async () => {
    if (!selectedExamId || !selectedSubjectId) return;
    const currentSub = subjects.find((s) => s.id === selectedSubjectId);
    const subName = currentSub ? currentSub.name : "this subject";
    const confirmed = window.confirm(
      `Are you sure you want to submit and finalize marks for "${subName}" (${rows.length} students)?`
    );
    if (!confirmed) return;

    await handleSaveMarks();
    setSubmittedSuccess(true);
    setTimeout(() => setSubmittedSuccess(false), 5000);
  };

  const handleDownloadExcelForm = () => {
    if (rows.length === 0 || !config) {
      alert("No student rows or subject configuration available to export.");
      return;
    }

    if (isClassTest) {
      const headers = [
        "Roll",
        "Student ID",
        "Student Name",
        "Subject Role",
        "Is Absent (Y/N)",
        `CT Mark (Max: ${ctMaxMark})`,
      ];

      const dataRows = rows.map((r: any) => {
        const ctVal = typeof r.ctMark === "number" ? r.ctMark : parseFloat(String(r.ctMark)) || 0;
        return [
          r.roll,
          r.studentIdNo || r.studentId,
          r.name || r.studentName,
          r.subjectType || "MANDATORY",
          r.isAbsent ? "Y" : "N",
          r.isAbsent ? "ABS" : (r.ctMark !== undefined && r.ctMark !== "" ? ctVal : ""),
        ];
      });

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const colWidths = [
        { wch: 8 },  // Roll
        { wch: 18 }, // Student ID
        { wch: 28 }, // Student Name
        { wch: 16 }, // Subject Role
        { wch: 16 }, // Is Absent
        { wch: 20 }, // CT Mark
      ];
      worksheet["!cols"] = colWidths;
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "CT Marks");
      const subCode = config?.subject?.subjectCode || "Subject";
      const exName = activeExam?.name?.replace(/[^a-zA-Z0-9_-]/g, "_") || "CT_Exam";
      XLSX.writeFile(workbook, `${exName}_${subCode}_CT_Marks.xlsx`);
      return;
    }

    const cqDef = config?.components?.find((c: any) =>
      c.componentName?.toUpperCase() === "CQ" ||
      c.componentName?.toLowerCase().includes("cq") ||
      c.componentName?.toLowerCase().includes("creative") ||
      c.componentName?.toLowerCase().includes("written") ||
      c.componentName?.toLowerCase().includes("theory")
    );
    const mcqDef = config?.components?.find((c: any) =>
      c.componentName?.toUpperCase() === "MCQ" ||
      c.componentName?.toLowerCase().includes("mcq") ||
      c.componentName?.toLowerCase().includes("objective")
    );
    const practicalDef = config?.components?.find(
      (c: any) =>
        c.componentName?.toUpperCase() === "PRACTICAL" ||
        c.componentName?.toUpperCase() === "PRAC" ||
        c.componentName?.toLowerCase().includes("practical") ||
        c.componentName?.toLowerCase().includes("pactical") ||
        c.componentName?.toLowerCase().includes("lab")
    );

    const hasPractical = Boolean(practicalDef);
    const cqKey = cqDef?.componentName || "CQ";
    const mcqKey = mcqDef?.componentName || "MCQ";
    const practicalKey = practicalDef?.componentName || "PRACTICAL";

    const headers = [
      "Roll",
      "Student ID",
      "Student Name",
      "Subject Role",
      "Is Absent (Y/N)",
      `CQ (Max: ${cqDef?.fullMarks || 70})`,
      `MCQ (Max: ${mcqDef?.fullMarks || 30})`,
    ];

    if (hasPractical && practicalDef) {
      headers.push(`${practicalDef.componentName || "PRACTICAL"} (Max: ${practicalDef.fullMarks})`);
    }

    if (isCtActive) {
      headers.push(`Class Test (CT) (${ctPercentage}%)`);
    }

    headers.push("TOTAL MARK");

    const totalMainFull =
      (cqDef?.fullMarks || 0) +
      (mcqDef?.fullMarks || 0) +
      (hasPractical && practicalDef ? practicalDef.fullMarks : 0) ||
      config.totalFullMarks ||
      100;

    const dataRows = rows.map((r: any) => {
      const cq = parseFloat(String(r.components?.[cqKey] ?? "")) || 0;
      const mcq = parseFloat(String(r.components?.[mcqKey] ?? "")) || 0;
      const prac = hasPractical ? parseFloat(String(r.components?.[practicalKey] ?? "")) || 0 : 0;
      const rawTotal = cq + mcq + prac;

      const ctVal = typeof r.ctMark === "number" ? r.ctMark : parseFloat(String(r.ctMark)) || 0;
      const totalMark = isCtActive
        ? (totalMainFull > 0 ? (rawTotal / totalMainFull) * mainExamPercentage : rawTotal) + ctVal
        : rawTotal;

      const rowArr: any[] = [
        r.roll,
        r.studentIdNo || r.studentId,
        r.name || r.studentName,
        r.subjectType || "MANDATORY",
        r.isAbsent ? "Y" : "N",
        r.isAbsent ? "ABS" : (r.components?.[cqKey] ?? ""),
        r.isAbsent ? "ABS" : (r.components?.[mcqKey] ?? ""),
      ];

      if (hasPractical) {
        rowArr.push(r.isAbsent ? "ABS" : (r.components?.[practicalKey] ?? ""));
      }

      if (isCtActive) {
        rowArr.push(r.isAbsent ? "ABS" : ctVal.toFixed(1));
      }

      rowArr.push(r.isAbsent ? "ABS" : totalMark.toFixed(1));
      return rowArr;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

    const colWidths = [
      { wch: 8 },  // Roll
      { wch: 18 }, // Student ID
      { wch: 28 }, // Student Name
      { wch: 16 }, // Subject Role
      { wch: 16 }, // Is Absent
      { wch: 16 }, // CQ
      { wch: 16 }, // MCQ
    ];
    if (hasPractical) colWidths.push({ wch: 18 });
    if (isCtActive) colWidths.push({ wch: 20 });
    colWidths.push({ wch: 16 }); // Total Mark

    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mark_Entry_Form");

    const classObj = classes.find((c) => c.id === selectedClassId);
    const secObj = availableSections.find((s: any) => s.id === selectedSectionId);
    const subObj = subjects.find((s) => s.id === selectedSubjectId);
    const examObj = exams.find((e) => e.id === selectedExamId);

    const fileName = `Mark_Form_${examObj?.name || "Exam"}_${classObj?.name || "Class"}_${secObj?.name || "Section"}_${subObj?.name || "Subject"}.xlsx`
      .replace(/[^\w.-]/g, "_");

    XLSX.writeFile(workbook, fileName);
  };

  const handleUploadExcelSheet = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          alert("The uploaded file does not contain any data rows.");
          return;
        }

        const headerRow = jsonData[0].map((h: any) => String(h || "").trim().toLowerCase());
        const rollIdx = headerRow.findIndex((h) => h.includes("roll"));
        const idIdx = headerRow.findIndex((h) => h.includes("student id") || h.includes("id"));
        const absentIdx = headerRow.findIndex((h) => h.includes("absent"));
        const ctIdx = headerRow.findIndex(
          (h) => h.includes("class test") || h.includes("(ct)") || h === "ct" || h.includes("ct mark")
        );

        // Match components
        const compIndices: { [name: string]: number } = {};
        (config?.components || []).forEach((c: any) => {
          const compLower = c.componentName.toLowerCase();
          const idx = headerRow.findIndex((h) => h.startsWith(compLower) || h.includes(compLower));
          if (idx !== -1) {
            compIndices[c.componentName] = idx;
          }
        });

        let updatedCount = 0;
        const updatedRows = [...rows];

        for (let i = 1; i < jsonData.length; i++) {
          const rowData = jsonData[i];
          if (!rowData || rowData.length === 0) continue;

          const rowRoll = rollIdx !== -1 ? parseInt(String(rowData[rollIdx]), 10) : NaN;
          const rowId = idIdx !== -1 ? String(rowData[idIdx] || "").trim() : "";

          const targetRowIndex = updatedRows.findIndex(
            (r) => (!isNaN(rowRoll) && r.roll === rowRoll) || (rowId && r.studentId === rowId)
          );

          if (targetRowIndex !== -1) {
            const target = { ...updatedRows[targetRowIndex] };
            target.components = { ...(target.components || {}) };

            if (absentIdx !== -1) {
              const absVal = String(rowData[absentIdx] || "").trim().toLowerCase();
              target.isAbsent = absVal === "y" || absVal === "yes" || absVal === "true" || absVal === "1";
            }

            for (const [compName, colIdx] of Object.entries(compIndices)) {
              const rawVal = rowData[colIdx];
              if (rawVal !== undefined && rawVal !== null && rawVal !== "") {
                const numVal = parseFloat(String(rawVal));
                if (!isNaN(numVal)) {
                  target.components[compName] = numVal;
                }
              }
            }

            if (ctIdx !== -1) {
              const rawCt = rowData[ctIdx];
              if (rawCt !== undefined && rawCt !== null && rawCt !== "" && String(rawCt).toUpperCase() !== "ABS") {
                const numCt = parseFloat(String(rawCt));
                if (!isNaN(numCt)) {
                  target.ctMark = numCt;
                  target.components["CT"] = numCt;
                  target.ctSynced = false;
                }
              }
            }

            updatedRows[targetRowIndex] = target;
            updatedCount++;
          }
        }

        setRows(updatedRows);
        alert(`Successfully imported marks for ${updatedCount} student(s) from Excel! Please review and click "Save Marks (Batch)" to save.`);
      } catch (err: any) {
        alert("Error parsing Excel file: " + err.message);
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const isLocked = activeExam?.status === "PUBLISHED";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ResultNavHeader />
      <div className="no-print space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <TableProperties className="w-5 h-5 text-emerald-600" />
            <span>Mark Entry</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter or import student marks by exam, class, and subject.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Download Excel Form Button */}
          <button
            onClick={handleDownloadExcelForm}
            disabled={rows.length === 0}
            className="bg-white hover:bg-emerald-50/40 text-slate-700 border border-slate-200 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 shadow-xs disabled:opacity-50 cursor-pointer"
            title="Download formatted Excel spreadsheet template with pre-filled student roll and names"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download Excel Form</span>
          </button>

          {/* Download PDF Form Button */}
          <button
            onClick={() => setIsPdfModalOpen(true)}
            disabled={rows.length === 0}
            className="bg-white hover:bg-rose-50/50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 shadow-xs disabled:opacity-50 cursor-pointer"
            title="Download / Print Mark Input Sheet in PDF format with College Name, Exam, Section, Group, and Software Company info"
          >
            <Printer className="w-3.5 h-3.5 text-rose-600" />
            <span>Download PDF Form</span>
          </button>

          {/* Upload Excel Sheet Button */}
          <label
            className={`bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 shadow-xs cursor-pointer ${
              isLocked ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
            }`}
            title="Upload completed Excel spreadsheet to populate marks into the table"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Upload Excel Sheet</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleUploadExcelSheet}
              disabled={isLocked}
              className="hidden"
            />
          </label>

          {/* Save Marks Button */}
          <button
            onClick={handleSaveMarks}
            disabled={saving || isLocked}
            className={`flex items-center space-x-2 font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm ${
              isLocked
                ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                : saveSuccess
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 hover:bg-slate-800 text-white"
            }`}
          >
            {isLocked ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Published (Locked)</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved Successfully</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Save Marks (Batch)"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 text-xs shadow-sm">
        <div>
          <SessionSelect
            value={selectedSession}
            onChange={(val) => {
              setSelectedSession(val);
              const matching = exams.filter((ex) => {
                if (val !== "ALL" && ex.academicYear?.yearName && ex.academicYear.yearName !== val) {
                  return false;
                }
                return isExamMatchingType(ex, selectedExamType);
              });
              if (matching.length > 0 && !matching.some((e) => e.id === selectedExamId)) {
                handleExamChange(matching[0].id);
              }
            }}
            label="Session:"
            labelClassName="font-semibold text-slate-700 block mb-1"
            selectClassName="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Exam Type:</label>
          <select
            value={selectedExamType}
            onChange={(e) => handleExamTypeChange(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
          >
            <option value="ALL">All Exam Types</option>
            <option value="Class Test">Class Test</option>
            <option value="Semester">Semester</option>
            {distinctExamTypes
              .filter(
                (t) =>
                  t !== "Class Test" &&
                  t !== "Semister" &&
                  t !== "Semester" &&
                  t !== "ALL"
              )
              .map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ").trim()}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Target Exam:</label>
          <select
            value={selectedExamId}
            onChange={(e) => handleExamChange(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            {filteredExams.length === 0 ? (
              <option value="">No exams match filter</option>
            ) : (
              filteredExams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.termCode || ex.status})
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Class:</label>
          <select
            value={selectedClassId}
            onChange={(e) => handleClassChange(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Shift:</label>
          <select
            value={selectedShift}
            onChange={(e) => handleShiftChange(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
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

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Group:</label>
          <select
            value={isClass11Or12 && selectedGroup === "GENERAL" ? "ALL" : selectedGroup}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">All Groups</option>
            {!isClass11Or12 && <option value="GENERAL">General</option>}
            <option value="SCIENCE">Science</option>
            <option value="HUMANITIES">Humanities</option>
            <option value="BUSINESS_STUDIES">Business Studies</option>
          </select>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Section:</label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="">All Sections</option>
            {availableSections.map((s: any) => {
              const shiftLabel = s.shift === "MORNING" ? "Morning" : s.shift === "DAY" ? "Day" : s.shift;
              return (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.groupType}){(!selectedShift && shiftLabel) ? ` • ${shiftLabel}` : ""}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">
            Subject: {subjects.length > 0 && <span className="text-[11px] font-normal text-slate-400">({subjects.length} Assigned)</span>}
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={subjectsLoading || subjects.length === 0}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium text-emerald-800 disabled:bg-slate-100 disabled:text-slate-400"
          >
            {subjectsLoading ? (
              <option value="">Loading assigned subjects...</option>
            ) : subjects.length === 0 ? (
              <option value="">No subjects assigned to this exam</option>
            ) : (
              subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.subjectCode})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Below of Filter: OK Button & Selection Summary */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-800">
            {activeExam?.name || "Target Exam"}
          </span>
          {selectedClass && (
            <>
              <span>•</span>
              <span className="font-medium text-slate-700">{selectedClass.name}</span>
            </>
          )}
          {selectedSectionId && (
            <>
              <span>•</span>
              <span className="text-slate-600">{availableSections.find((s: any) => s.id === selectedSectionId)?.name}</span>
            </>
          )}
          {selectedSubjectId && (
            <>
              <span>•</span>
              <span className="font-bold text-emerald-700">
                {subjects.find((s: any) => s.id === selectedSubjectId)?.name}
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            if (!selectedExamId) {
              alert("Please select a Target Exam first.");
              return;
            }
            setShowMarkInputModal(true);
          }}
          className="h-9 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center space-x-1.5 text-xs cursor-pointer"
          title="Open Mark Input Spreadsheet Window"
        >
          <Check className="w-4 h-4 mr-0.5" />
          <span>Ok</span>
        </button>
      </div>

      {/* Notice if no subjects are assigned to this exam */}
      {subjects.length === 0 && !subjectsLoading && selectedExamId && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              No subjects are assigned to this exam. Assign subjects under Exam Management to enter marks.
            </span>
          </div>
          <Link
            href="/setup/exams"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors text-center shrink-0"
          >
            Manage Exam Subjects
          </Link>
        </div>
      )}

      {/* Class Test Direct Entry Banner OR CT Marks Auto-Sync & Percentage Terms Panel */}
      {isClassTest ? (
        <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-purple-600 text-white rounded-lg shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-purple-950 text-sm">
                  Class Test (CT) Direct Mark Entry
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                  CLASS TEST MODE
                </span>
              </div>
              <p className="text-[11px] text-purple-700 mt-0.5">
                Entering marks for Class Test. Component columns (CQ, MCQ, Total) are hidden — enter student CT marks directly below.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-purple-950">Max CT Mark:</span>
            <div className="flex items-center border border-purple-300 rounded-lg overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => handleUpdateCtMaxMark(Math.max(1, ctMaxMark - 5))}
                className="p-1.5 hover:bg-purple-100 text-purple-800 transition cursor-pointer"
                title="Decrease Max Mark (-5)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min={1}
                max={500}
                value={ctMaxMark}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0) {
                    handleUpdateCtMaxMark(val);
                  } else if (e.target.value === "") {
                    setCustomCtMaxMark(0);
                  }
                }}
                className="w-14 text-center text-xs font-bold bg-white p-1 border-x border-purple-200 font-mono text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => handleUpdateCtMaxMark(ctMaxMark + 5)}
                className="p-1.5 hover:bg-purple-100 text-purple-800 transition cursor-pointer"
                title="Increase Max Mark (+5)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-1">
              {[10, 15, 20, 25, 50, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleUpdateCtMaxMark(preset)}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                    ctMaxMark === preset
                      ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                      : "bg-white text-purple-900 border-purple-200 hover:bg-purple-100/70"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`border rounded-xl p-4 shadow-xs transition-colors ${
            isCtActive
              ? "bg-linear-to-r from-purple-50 via-indigo-50 to-emerald-50 border-purple-200/80"
              : "bg-slate-50 border-slate-200"
          }`}
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
              <button
                type="button"
                onClick={() => setIsCtActive(true)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isCtActive
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCtActive(false)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isCtActive
                    ? "bg-slate-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Inactive</span>
              </button>
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
                    <select
                      value={selectedCtExamId}
                      onChange={(e) => handleSelectCtExam(e.target.value)}
                      disabled={ctExamLoading}
                      className="w-full text-xs p-2 bg-white border border-purple-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-purple-500 shadow-2xs"
                    >
                      <option value="">-- Select CT Exam to Auto-Sync --</option>
                      {availableCtExams.map((ex: any) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name} ({ex.termCode || ex.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCtExamId && (
                    <button
                      type="button"
                      onClick={() => syncCtMarks(selectedCtExamId, rows, ctPercentage)}
                      disabled={ctExamLoading}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                      title="Re-fetch and scale CT marks from the selected exam"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${ctExamLoading ? "animate-spin" : ""}`} />
                      <span>{ctExamLoading ? "Syncing..." : "Sync CT Marks"}</span>
                    </button>
                  )}

                  {selectedCtExamId && (
                    <button
                      type="button"
                      onClick={() => handleSelectCtExam("")}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      title="Disconnect CT exam (preserves current values)"
                    >
                      Disconnect CT
                    </button>
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
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(80, 20)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                        mainExamPercentage === 80 && ctPercentage === 20
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      80 / 20
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(70, 30)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                        mainExamPercentage === 70 && ctPercentage === 30
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      70 / 30
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(85, 15)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                        mainExamPercentage === 85 && ctPercentage === 15
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      85 / 15
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(100, 0)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                        mainExamPercentage === 100 && ctPercentage === 0
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      100% Only
                    </button>
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
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>

                  <span className="text-slate-400 font-bold">+</span>

                  {/* CT Exam % */}
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-purple-900">CT:</span>
                    <div className="flex items-center border border-purple-300 rounded-lg overflow-hidden bg-purple-50/50">
                      <button
                        type="button"
                        onClick={() => handleUpdateCtPercentage(ctPercentage - 5)}
                        className="p-1 hover:bg-purple-100 text-purple-800 transition cursor-pointer"
                        title="Decrease CT %"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={ctPercentage}
                        onChange={(e) => handleUpdateCtPercentage(parseFloat(e.target.value) || 0)}
                        className="w-12 text-center text-xs font-bold bg-white p-1 border-x border-purple-300 font-mono text-purple-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateCtPercentage(ctPercentage + 5)}
                        className="p-1 hover:bg-purple-100 text-purple-800 transition cursor-pointer"
                        title="Increase CT %"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-xs font-bold text-purple-700">%</span>
                  </div>

                  <div className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded font-mono ml-auto">
                    Total:{" "}
                    <span
                      className={
                        mainExamPercentage + ctPercentage === 100
                          ? "text-emerald-700 font-bold"
                          : "text-amber-700 font-bold"
                      }
                    >
                      {mainExamPercentage + ctPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spreadsheet Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm text-slate-800">
              Students Roster ({rows.length} Taken this Subject)
            </span>
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
            {config && (
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                Full Marks: {config.totalFullMarks} | Mode: {config.passMode}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500">
            Navigation tip: Press <kbd className="px-1 py-0.5 bg-slate-100 border rounded">Tab</kbd> to jump between cells.
          </div>
        </div>

        {(() => {
          const cqDef = config?.components?.find((c: any) =>
            c.componentName?.toUpperCase() === "CQ" ||
            c.componentName?.toLowerCase().includes("cq") ||
            c.componentName?.toLowerCase().includes("creative") ||
            c.componentName?.toLowerCase().includes("written") ||
            c.componentName?.toLowerCase().includes("theory")
          );
          const mcqDef = config?.components?.find((c: any) =>
            c.componentName?.toUpperCase() === "MCQ" ||
            c.componentName?.toLowerCase().includes("mcq") ||
            c.componentName?.toLowerCase().includes("objective")
          );
          const practicalDef = config?.components?.find(
            (c: any) =>
              c.componentName?.toUpperCase() === "PRACTICAL" ||
              c.componentName?.toUpperCase() === "PRAC" ||
              c.componentName?.toLowerCase().includes("practical") ||
              c.componentName?.toLowerCase().includes("pactical") ||
              c.componentName?.toLowerCase().includes("lab")
          );

          const hasCq = Boolean(cqDef && (cqDef.fullMarks === undefined || cqDef.fullMarks > 0));
          const hasMcq = Boolean(mcqDef && (mcqDef.fullMarks === undefined || mcqDef.fullMarks > 0));
          const hasPractical = Boolean(practicalDef && (practicalDef.fullMarks === undefined || practicalDef.fullMarks > 0));
          const cqKey = cqDef?.componentName || "CQ";
          const mcqKey = mcqDef?.componentName || "MCQ";
          const practicalKey = practicalDef?.componentName || "PRACTICAL";

          const otherDefs = (config?.components || []).filter((c: any) =>
            c.id !== cqDef?.id &&
            c.id !== mcqDef?.id &&
            c.id !== practicalDef?.id &&
            c.componentName?.toUpperCase() !== "CT"
          );

          const mainComponentsTotal =
            (hasCq && cqDef?.fullMarks ? cqDef.fullMarks : 0) +
            (hasMcq && mcqDef?.fullMarks ? mcqDef.fullMarks : 0) +
            (hasPractical && practicalDef ? practicalDef.fullMarks : 0) +
            otherDefs.reduce((acc: number, c: any) => acc + (c.fullMarks || 0), 0);

          const totalMainFull =
            mainComponentsTotal > 0
              ? mainComponentsTotal
              : config?.totalFullMarks && config.totalFullMarks > 0
              ? config.totalFullMarks
              : 100;

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 w-16 text-center border-r">Roll</th>
                    <th className="p-3 border-r min-w-44">Student Name</th>
                    <th className="p-3 border-r w-28 text-center">Subject Role</th>
                    <th className="p-3 border-r w-20 text-center">Absent</th>

                    {isClassTest ? (
                      <th className="p-3 text-center w-36 bg-purple-50/90 text-purple-950 font-bold border-r">
                        <div className="flex items-center justify-center space-x-1">
                          <span>CT Mark</span>
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        </div>
                        <div className="text-[9px] text-purple-700 font-semibold font-mono">
                          (Max: {ctMaxMark})
                        </div>
                      </th>
                    ) : (
                      <>
                        {/* CQ - ONLY rendered if subject has CQ */}
                        {hasCq && (
                          <th className="p-3 border-r text-center w-28 bg-slate-100/60">
                            <div className="font-bold text-slate-900">{cqDef?.componentName || "CQ"}</div>
                            <div className="text-[9px] text-slate-500 font-normal">
                              {cqDef ? `Max: ${cqDef.fullMarks} | Pass: ${cqDef.passMarks}` : "Max: 70"}
                            </div>
                          </th>
                        )}

                        {/* MCQ - ONLY rendered if subject has MCQ */}
                        {hasMcq && (
                          <th className="p-3 border-r text-center w-28 bg-slate-100/60">
                            <div className="font-bold text-slate-900">{mcqDef?.componentName || "MCQ"}</div>
                            <div className="text-[9px] text-slate-500 font-normal">
                              {mcqDef ? `Max: ${mcqDef.fullMarks} | Pass: ${mcqDef.passMarks}` : "Max: 30"}
                            </div>
                          </th>
                        )}

                        {/* PRACTICAL - ONLY rendered if this subject has practical marks */}
                        {hasPractical && practicalDef && (
                          <th className="p-3 border-r text-center w-28 bg-slate-100/60">
                            <div className="font-bold text-slate-900">{practicalDef.componentName}</div>
                            <div className="text-[9px] text-slate-500 font-normal">
                              Max: {practicalDef.fullMarks} | Pass: {practicalDef.passMarks}
                            </div>
                          </th>
                        )}

                        {/* Any Other Assessment Components (e.g. CA) */}
                        {otherDefs.map((c: any) => (
                          <th key={c.id} className="p-3 border-r text-center w-28 bg-slate-100/60">
                            <div className="font-bold text-slate-900">{c.componentName}</div>
                            <div className="text-[9px] text-slate-500 font-normal">
                              Max: {c.fullMarks} | Pass: {c.passMarks}
                            </div>
                          </th>
                        ))}

                        {/* Class Test (CT) - ONLY rendered if isCtActive is true */}
                        {isCtActive && (
                          <th className="p-3 border-r text-center w-36 bg-purple-50/90 text-purple-950 font-bold">
                            <div className="flex items-center justify-center space-x-1">
                              <span>Class Test (CT)</span>
                              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            </div>
                            <div className="text-[9px] text-purple-700 font-semibold font-mono">({ctPercentage}%)</div>
                          </th>
                        )}

                        {/* Total Mark */}
                        <th className="p-3 text-center w-28 bg-emerald-50 text-emerald-900 font-bold">
                          <div>Total Mark</div>
                          <div className="text-[9px] text-emerald-700 font-normal">
                            {isCtActive ? `Converted (${mainExamPercentage + ctPercentage}%)` : `Raw Total (${totalMainFull})`}
                          </div>
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {rows.map((row, rIdx) => {
                    const cqVal = row.components?.[cqKey] ?? "";
                    const mcqVal = row.components?.[mcqKey] ?? "";
                    const pracVal = hasPractical ? (row.components?.[practicalKey] ?? "") : "";

                    const cqNum = typeof cqVal === "number" ? cqVal : parseFloat(String(cqVal)) || 0;
                    const mcqNum = typeof mcqVal === "number" ? mcqVal : parseFloat(String(mcqVal)) || 0;
                    const pracNum = hasPractical ? (typeof pracVal === "number" ? pracVal : parseFloat(String(pracVal)) || 0) : 0;

                    let otherSum = 0;
                    otherDefs.forEach((c: any) => {
                      const ov = row.components?.[c.componentName] ?? "";
                      otherSum += typeof ov === "number" ? ov : parseFloat(String(ov)) || 0;
                    });

                    const rawTotal = cqNum + mcqNum + pracNum + otherSum;

                    const ctNum =
                      typeof row.ctMark === "number"
                        ? row.ctMark
                        : parseFloat(String(row.ctMark ?? "")) || 0;

                    // When CT is inactive, no percentage is applied: direct raw total
                    const finalTotal = isCtActive
                      ? (totalMainFull > 0 ? (rawTotal / totalMainFull) * mainExamPercentage : rawTotal) + ctNum
                      : rawTotal;

                    const cqExceeded = cqDef && cqNum > cqDef.fullMarks;
                    const mcqExceeded = mcqDef && mcqNum > mcqDef.fullMarks;
                    const pracExceeded = hasPractical && practicalDef && pracNum > practicalDef.fullMarks;
                    const ctExceeded = isClassTest
                      ? ctNum > ctMaxMark
                      : isCtActive && ctNum > ctPercentage;

                    return (
                      <tr
                        key={row.enrollmentId}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          row.isAbsent ? "bg-red-50/40 text-slate-400" : ""
                        }`}
                      >
                        <td className="p-3 text-center font-bold text-slate-900 border-r">
                          #{row.roll}
                        </td>
                        <td className="p-3 font-medium text-slate-900 font-sans border-r whitespace-nowrap">
                          <span>{row.name}</span>
                          {!selectedSectionId && row.sectionName && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-medium">
                              {row.sectionName}
                              {row.sectionShift ? ` (${row.sectionShift === "MORNING" ? "Morning" : "Day"})` : ""}
                            </span>
                          )}
                        </td>
                        <td className="p-3 border-r font-sans text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              row.subjectType === "OPTIONAL_4TH"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {row.subjectType === "OPTIONAL_4TH" ? "★ 4th Subject" : "Mandatory"}
                          </span>
                        </td>
                        <td className="p-3 text-center border-r">
                          <input
                            type="checkbox"
                            checked={row.isAbsent}
                            disabled={isLocked}
                            onChange={(e) => handleAbsentToggle(rIdx, e.target.checked)}
                            className="rounded cursor-pointer"
                          />
                        </td>

                        {isClassTest ? (
                          /* Class Test Mode: Only Show CT Mark */
                          <td className="p-2 border-r text-center bg-purple-50/20">
                            <div className="flex items-center justify-center">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max={ctMaxMark}
                                value={row.ctMark ?? ""}
                                disabled={row.isAbsent || isLocked}
                                onChange={(e) => handleCtCellChange(rIdx, e.target.value)}
                                placeholder="0"
                                className={`w-24 text-center p-1.5 rounded border text-xs font-bold transition-all focus:outline-none focus:ring-2 ${
                                  ctExceeded
                                    ? "bg-red-100 text-red-700 border-red-400 focus:ring-red-500 animate-pulse"
                                    : row.isAbsent
                                    ? "bg-slate-100 text-slate-400 border-slate-200"
                                    : "bg-white text-slate-900 border-slate-300 focus:ring-purple-500 focus:border-purple-500"
                                }`}
                              />
                            </div>
                            {ctExceeded && (
                              <div className="text-[9px] text-red-600 font-sans font-semibold mt-0.5">
                                &gt; {ctMaxMark}
                              </div>
                            )}
                          </td>
                        ) : (
                          <>
                            {/* CQ Input Cell */}
                            {hasCq && (
                              <td className="p-2 border-r text-center">
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max={cqDef?.fullMarks || 100}
                                  value={cqVal}
                                  disabled={row.isAbsent || isLocked}
                                  onChange={(e) => handleCellChange(rIdx, cqKey, e.target.value)}
                                  placeholder="0"
                                  className={`w-20 text-center p-1.5 rounded border text-xs font-bold transition-all focus:outline-none focus:ring-2 ${
                                    cqExceeded
                                      ? "bg-red-100 text-red-700 border-red-400 focus:ring-red-500 animate-pulse"
                                      : row.isAbsent
                                      ? "bg-slate-100 text-slate-400 border-slate-200"
                                      : "bg-white text-slate-900 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                                  }`}
                                />
                                {cqExceeded && (
                                  <div className="text-[9px] text-red-600 font-sans font-semibold mt-0.5">
                                    &gt; {cqDef.fullMarks}
                                  </div>
                                )}
                              </td>
                            )}

                            {/* MCQ Input Cell */}
                            {hasMcq && (
                              <td className="p-2 border-r text-center">
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max={mcqDef?.fullMarks || 100}
                                  value={mcqVal}
                                  disabled={row.isAbsent || isLocked}
                                  onChange={(e) => handleCellChange(rIdx, mcqKey, e.target.value)}
                                  placeholder="0"
                                  className={`w-20 text-center p-1.5 rounded border text-xs font-bold transition-all focus:outline-none focus:ring-2 ${
                                    mcqExceeded
                                      ? "bg-red-100 text-red-700 border-red-400 focus:ring-red-500 animate-pulse"
                                      : row.isAbsent
                                      ? "bg-slate-100 text-slate-400 border-slate-200"
                                      : "bg-white text-slate-900 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                                  }`}
                                />
                                {mcqExceeded && (
                                  <div className="text-[9px] text-red-600 font-sans font-semibold mt-0.5">
                                    &gt; {mcqDef.fullMarks}
                                  </div>
                                )}
                              </td>
                            )}

                            {/* PRACTICAL Input Cell - ONLY rendered if hasPractical is true */}
                            {hasPractical && practicalDef && (
                              <td className="p-2 border-r text-center">
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max={practicalDef.fullMarks}
                                  value={pracVal}
                                  disabled={row.isAbsent || isLocked}
                                  onChange={(e) => handleCellChange(rIdx, practicalKey, e.target.value)}
                                  placeholder="0"
                                  className={`w-20 text-center p-1.5 rounded border text-xs font-bold transition-all focus:outline-none focus:ring-2 ${
                                    pracExceeded
                                      ? "bg-red-100 text-red-700 border-red-400 focus:ring-red-500 animate-pulse"
                                      : row.isAbsent
                                      ? "bg-slate-100 text-slate-400 border-slate-200"
                                      : "bg-white text-slate-900 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                                  }`}
                                />
                                {pracExceeded && (
                                  <div className="text-[9px] text-red-600 font-sans font-semibold mt-0.5">
                                    &gt; {practicalDef.fullMarks}
                                  </div>
                                )}
                              </td>
                            )}

                            {/* Other configured assessment components */}
                            {otherDefs.map((c: any) => {
                              const val = row.components?.[c.componentName] ?? "";
                              const isOver = typeof val === "number" && val > c.fullMarks;
                              return (
                                <td key={c.id} className="p-2 border-r text-center">
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max={c.fullMarks}
                                    value={val}
                                    disabled={row.isAbsent || isLocked}
                                    onChange={(e) => handleCellChange(rIdx, c.componentName, e.target.value)}
                                    placeholder="0"
                                    className={`w-20 text-center p-1.5 rounded border text-xs font-bold transition-all focus:outline-none focus:ring-2 ${
                                      isOver
                                        ? "bg-red-100 text-red-700 border-red-400 focus:ring-red-500 animate-pulse"
                                        : row.isAbsent
                                        ? "bg-slate-100 text-slate-400 border-slate-200"
                                        : "bg-white text-slate-900 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                                    }`}
                                  />
                                  {isOver && (
                                    <div className="text-[9px] text-red-600 font-sans font-semibold mt-0.5">
                                      &gt; {c.fullMarks}
                                    </div>
                                  )}
                                </td>
                              );
                            })}

                            {/* Class Test (CT) - ONLY rendered if isCtActive is true */}
                            {isCtActive && (
                              <td className="p-2 border-r text-center bg-purple-50/30">
                                <div className="flex items-center justify-center space-x-1">
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max={ctPercentage}
                                    value={row.ctMark ?? ""}
                                    disabled={row.isAbsent || isLocked}
                                    onChange={(e) => handleCtCellChange(rIdx, e.target.value)}
                                    placeholder="0"
                                    className={`w-20 text-center p-1.5 rounded border text-xs font-bold transition-all focus:outline-none focus:ring-2 ${
                                      ctExceeded
                                        ? "bg-red-100 text-red-700 border-red-400 focus:ring-red-500"
                                        : row.ctSynced
                                        ? "bg-purple-50 text-purple-900 border-purple-300 focus:ring-purple-500"
                                        : row.isAbsent
                                        ? "bg-slate-100 text-slate-400 border-slate-200"
                                        : "bg-white text-slate-900 border-slate-300 focus:ring-purple-500"
                                    }`}
                                  />
                                  {row.ctSynced && (
                                    <span
                                      className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded font-sans font-semibold shrink-0"
                                      title="Auto-synced from CT Exam"
                                    >
                                      Auto
                                    </span>
                                  )}
                                </div>
                                {ctExceeded && (
                                  <div className="text-[9px] text-red-600 font-sans font-semibold mt-0.5">
                                    &gt; {ctPercentage}
                                  </div>
                                )}
                              </td>
                            )}

                            {/* Total Mark */}
                            <td className="p-3 text-center font-bold text-emerald-900 bg-emerald-50/60 font-mono text-sm">
                              {row.isAbsent ? (
                                <span className="text-red-600 font-bold text-xs bg-red-100 px-2 py-0.5 rounded">
                                  ABS
                                </span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-md font-bold shadow-2xs">
                                  {finalTotal.toFixed(1)}
                                </span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}

                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={isClassTest ? 5 : (7 + (hasPractical ? 1 : 0) + (isCtActive ? 1 : 0) + otherDefs.length)}
                        className="p-8 text-center text-slate-500 font-sans"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center space-x-2 text-slate-400 italic">
                            <span>Loading spreadsheet roster...</span>
                          </div>
                        ) : !selectedSubjectId ? (
                          <span className="italic text-slate-400">Please select a valid subject to load spreadsheet roster.</span>
                        ) : (
                          <div className="max-w-md mx-auto space-y-3">
                            <div className="w-10 h-10 mx-auto bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                              <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-xs">
                                No students found who have taken this subject in the selected criteria.
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1">
                                {selectedSectionId
                                  ? "The selected section may belong to a different group (e.g. viewing a Science subject while a Business Studies section is selected), or students in this section have not yet been allocated this subject."
                                  : "No students in this class have been allocated this subject in their curriculum yet."}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                              {selectedSectionId && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedSectionId("")}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold transition-colors cursor-pointer"
                                >
                                  Clear Section Filter (View All Sections)
                                </button>
                              )}
                              <Link
                                href="/academic/subject-mapping"
                                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium transition-colors inline-flex items-center space-x-1"
                              >
                                <span>Allocate Subjects in Matrix</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
      </div>

      {/* Mark Input Spreadsheet Window Modal (Matching user wireframe in Image) */}
      {showMarkInputModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-slate-800 w-full max-w-7xl max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Top Toolbar: Window Title & Wireframe Action Buttons */}
            <div className="px-5 py-3 border-b-2 border-slate-800 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-2">
                <TableProperties className="w-5 h-5 text-emerald-600" />
                <h2 className="font-extrabold text-sm text-slate-900 tracking-wide uppercase">
                  Mark Input Spreadsheet Window
                </h2>
                {activeExam && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    {activeExam.name}
                  </span>
                )}
                {selectedClass && (
                  <span className="text-[11px] font-semibold text-slate-600">
                    • {selectedClass.name}
                  </span>
                )}
              </div>

              {/* Action Buttons matching wireframe top-right */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Download Excel Form Button */}
                <button
                  type="button"
                  onClick={handleDownloadExcelForm}
                  disabled={rows.length === 0}
                  className="bg-white hover:bg-emerald-50 text-slate-700 border border-slate-300 font-semibold text-xs px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                  title="Download formatted Excel spreadsheet template with pre-filled student roll and names"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download Excel Form</span>
                </button>

                {/* Download PDF Form Button */}
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(true)}
                  disabled={rows.length === 0}
                  className="bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 font-semibold text-xs px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                  title="Download / Print Mark Input Sheet in PDF format"
                >
                  <Printer className="w-3.5 h-3.5 text-rose-600" />
                  <span>Download PDF Form</span>
                </button>

                {/* Upload Excel Sheet Button */}
                <label
                  className={`bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-emerald-500 font-semibold text-xs px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer ${
                    isLocked ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                  }`}
                  title="Upload completed Excel spreadsheet to populate marks into the table"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Upload Excel Sheet</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleUploadExcelSheet}
                    disabled={isLocked}
                    className="hidden"
                  />
                </label>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setShowMarkInputModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer ml-1"
                  title="Close Window (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Window Content: Left Subject List Dropdown + Right Mark Input Table */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col md:flex-row items-start gap-4 bg-slate-50/50">
              {/* Left Column: Subject List & Class Test Max CT Mark Controls */}
              <div className="w-full md:w-64 shrink-0 space-y-3">
                {/* Subject List Box */}
                <div className="bg-white border-2 border-black rounded shadow-xs">
                  <div className="bg-slate-100 p-2.5 border-b-2 border-black font-extrabold text-xs text-center text-slate-900 tracking-wide uppercase">
                    Subject List
                  </div>
                  <div className="p-3 space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Dropdown menu
                      </label>
                      <select
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        className="w-full p-2 border-2 border-slate-700 rounded text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="">Dropdown menu</option>
                        {subjects.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} ({sub.subjectCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quick Select Buttons */}
                    {subjects.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block px-0.5">
                          Assigned ({subjects.length})
                        </span>
                        <div className="max-h-[300px] overflow-y-auto space-y-1">
                          {subjects.map((sub) => (
                            <button
                              key={`modal-sub-${sub.id}`}
                              type="button"
                              onClick={() => setSelectedSubjectId(sub.id)}
                              className={`w-full text-left p-1.5 rounded text-xs transition cursor-pointer flex items-center justify-between ${
                                selectedSubjectId === sub.id
                                  ? "bg-emerald-600 text-white font-bold shadow-2xs"
                                  : "hover:bg-slate-100 text-slate-700"
                              }`}
                            >
                              <span className="truncate mr-1">{sub.name}</span>
                              <span
                                className={`text-[10px] font-mono px-1 rounded ${
                                  selectedSubjectId === sub.id
                                    ? "bg-emerald-700 text-white"
                                    : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {sub.subjectCode}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Second Image Part: Max CT Mark Controls (Only for Exam Type: Class Test) */}
                {isClassTest && (
                  <div className="bg-purple-50/80 border-2 border-black rounded shadow-xs p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-purple-950">Max CT Mark:</span>
                      <div className="flex items-center border border-purple-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateCtMaxMark(Math.max(1, ctMaxMark - 5))}
                          className="p-1 hover:bg-purple-100 text-purple-800 transition cursor-pointer"
                          title="Decrease Max Mark (-5)"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={ctMaxMark}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val > 0) {
                              handleUpdateCtMaxMark(val);
                            } else if (e.target.value === "") {
                              setCustomCtMaxMark(0);
                            }
                          }}
                          className="w-12 text-center text-xs font-bold bg-white p-1 border-x border-purple-200 font-mono text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateCtMaxMark(ctMaxMark + 5)}
                          className="p-1 hover:bg-purple-100 text-purple-800 transition cursor-pointer"
                          title="Increase Max Mark (+5)"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Presets matching Image 2 */}
                    <div className="pt-1">
                      <div className="grid grid-cols-6 gap-1">
                        {[10, 15, 20, 25, 50, 100].map((preset) => (
                          <button
                            key={`modal-ct-preset-${preset}`}
                            type="button"
                            onClick={() => handleUpdateCtMaxMark(preset)}
                            className={`py-1 rounded text-center text-[10px] font-bold border transition cursor-pointer ${
                              ctMaxMark === preset
                                ? "bg-purple-600 text-white border-purple-700 shadow-2xs"
                                : "bg-white text-purple-900 border-purple-200 hover:bg-purple-100/70"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: Main Table & Actions */}
              <div className="flex-1 min-w-0 w-full space-y-3">
                {/* Subject Name header spanning across */}
                <div className="bg-white border-2 border-black p-2.5 text-center font-bold text-sm text-slate-900 shadow-2xs flex flex-wrap items-center justify-center gap-2">
                  <span>Subject Name: </span>
                  <span className="text-emerald-800 font-extrabold">
                    {activeSubject
                      ? `${activeSubject.name} (${activeSubject.subjectCode})`
                      : "Please select a subject from the Subject List"}
                  </span>
                  {isClassTest && (
                    <span className="text-xs bg-purple-100 text-purple-900 border border-purple-300 px-2.5 py-0.5 rounded-full font-bold">
                      Class Test Mode (Max: {ctMaxMark})
                    </span>
                  )}
                </div>

                {/* Table or Placeholder */}
                {!selectedSubjectId ? (
                  <div className="bg-white border-2 border-black p-12 text-center text-slate-500 text-xs">
                    Please select a subject from the Subject List dropdown on the left.
                  </div>
                ) : loading ? (
                  <div className="bg-white border-2 border-black p-12 text-center text-slate-600 text-xs flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Loading student records...</span>
                  </div>
                ) : (
                  (() => {
                    const modalCqDef = config?.components?.find((c: any) =>
                      c.componentName?.toUpperCase() === "CQ" ||
                      c.componentName?.toLowerCase().includes("cq") ||
                      c.componentName?.toLowerCase().includes("creative") ||
                      c.componentName?.toLowerCase().includes("written") ||
                      c.componentName?.toLowerCase().includes("theory")
                    );
                    const modalMcqDef = config?.components?.find((c: any) =>
                      c.componentName?.toUpperCase() === "MCQ" ||
                      c.componentName?.toLowerCase().includes("mcq") ||
                      c.componentName?.toLowerCase().includes("objective")
                    );
                    const modalPracticalDef = config?.components?.find(
                      (c: any) =>
                        c.componentName?.toUpperCase() === "PRACTICAL" ||
                        c.componentName?.toUpperCase() === "PRAC" ||
                        c.componentName?.toLowerCase().includes("practical") ||
                        c.componentName?.toLowerCase().includes("pactical") ||
                        c.componentName?.toLowerCase().includes("lab")
                    );

                    const modalHasCq = Boolean(modalCqDef && (modalCqDef.fullMarks === undefined || modalCqDef.fullMarks > 0));
                    const modalHasMcq = Boolean(modalMcqDef && (modalMcqDef.fullMarks === undefined || modalMcqDef.fullMarks > 0));
                    const modalHasPractical = Boolean(modalPracticalDef && (modalPracticalDef.fullMarks === undefined || modalPracticalDef.fullMarks > 0));

                    const modalCqKey = modalCqDef?.componentName || "CQ";
                    const modalMcqKey = modalMcqDef?.componentName || "MCQ";
                    const modalPracticalKey = modalPracticalDef?.componentName || "PRACTICAL";

                    const modalOtherDefs = (config?.components || []).filter((c: any) =>
                      c.id !== modalCqDef?.id &&
                      c.id !== modalMcqDef?.id &&
                      c.id !== modalPracticalDef?.id &&
                      c.componentName?.toUpperCase() !== "CT"
                    );

                    return (
                      <div className="space-y-0">
                        {/* 20-Row Scrolling Info & Quick Navigation Bar */}
                        <div className="flex flex-wrap items-center justify-between text-xs font-semibold px-3 py-1.5 bg-slate-100 border-2 border-black border-b-0 text-slate-800">
                          <div className="flex items-center space-x-2">
                            <span>
                              Total Students:{" "}
                              <strong className="text-slate-900 font-mono text-sm">{rows.length}</strong>
                            </span>
                            {rows.length > 20 && (
                              <span className="text-[10px] text-purple-900 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-full font-bold">
                                ↕ Showing 20 rows at a time (Scroll to view all)
                              </span>
                            )}
                          </div>
                          {rows.length > 20 && (
                            <div className="flex items-center space-x-1.5 text-[11px]">
                              <span className="text-slate-500 text-[10px] font-bold uppercase mr-0.5">Quick Jump:</span>
                              <button
                                type="button"
                                onClick={() => scrollToRow(0)}
                                className="px-2.5 py-0.5 bg-white hover:bg-slate-200 active:bg-slate-300 border border-black rounded text-[10px] font-bold transition shadow-2xs cursor-pointer"
                                title="Scroll to Rows 1-20"
                              >
                                Rows 1–20
                              </button>
                              <button
                                type="button"
                                onClick={() => scrollToRow(20)}
                                className="px-2.5 py-0.5 bg-white hover:bg-slate-200 active:bg-slate-300 border border-black rounded text-[10px] font-bold transition shadow-2xs cursor-pointer"
                                title="Scroll to Rows 21-40"
                              >
                                Rows 21–{Math.min(40, rows.length)}
                              </button>
                              {rows.length > 40 && (
                                <button
                                  type="button"
                                  onClick={() => scrollToRow(40)}
                                  className="px-2.5 py-0.5 bg-white hover:bg-slate-200 active:bg-slate-300 border border-black rounded text-[10px] font-bold transition shadow-2xs cursor-pointer"
                                  title="Scroll to Rows 41+"
                                >
                                  Rows 41–{rows.length}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Scrollable Table Viewport - Constrained to 20 Rows on Screen (40px header + 20*36px rows = 760px) */}
                        <div
                          ref={modalTableRef}
                          className="bg-white border-2 border-black overflow-x-auto overflow-y-auto shadow-2xs scroll-smooth"
                          style={{ maxHeight: "760px" }}
                        >
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[11px] tracking-wide sticky top-0 z-20 shadow-xs border-b-2 border-black">
                              <tr className="h-[40px]">
                                <th className="p-2 w-16 text-center border-r-2 border-black bg-slate-100">ROLL</th>
                                <th className="p-2 border-r-2 border-black min-w-44 bg-slate-100">STUDENT NAME</th>
                                <th className="p-2 border-r-2 border-black w-28 text-center bg-slate-100">SUBJECT ROLE</th>
                                <th className="p-2 border-r-2 border-black w-20 text-center bg-slate-100">ABSENT</th>

                                {isClassTest ? (
                                  <th className="p-2 text-center w-36 bg-purple-100 text-purple-950 font-extrabold border-b-2 border-black">
                                    <div>CT MARK</div>
                                    <div className="text-[9px] text-purple-700 font-normal">
                                      (Max: {ctMaxMark})
                                    </div>
                                  </th>
                                ) : (
                                  <>
                                    {/* CQ Column - ONLY rendered if subject has CQ */}
                                    {modalHasCq && (
                                      <th className="p-2 border-r-2 border-black text-center w-24 bg-slate-50">
                                        <div>{modalCqDef?.componentName || "CQ"}</div>
                                        <div className="text-[9px] text-slate-500 font-normal">
                                          {modalCqDef ? `(Max: ${modalCqDef.fullMarks})` : "(Max: 70)"}
                                        </div>
                                      </th>
                                    )}

                                    {/* MCQ Column - ONLY rendered if subject has MCQ */}
                                    {modalHasMcq && (
                                      <th className="p-2 border-r-2 border-black text-center w-24 bg-slate-50">
                                        <div>{modalMcqDef?.componentName || "MCQ"}</div>
                                        <div className="text-[9px] text-slate-500 font-normal">
                                          {modalMcqDef ? `(Max: ${modalMcqDef.fullMarks})` : "(Max: 30)"}
                                        </div>
                                      </th>
                                    )}

                                    {/* PRACTICAL Column - ONLY rendered if subject has PRACTICAL */}
                                    {modalHasPractical && (
                                      <th className="p-2 border-r-2 border-black text-center w-24 bg-slate-50">
                                        <div>{modalPracticalDef?.componentName || "PRACTICAL"}</div>
                                        <div className="text-[9px] text-slate-500 font-normal">
                                          {modalPracticalDef ? `(Max: ${modalPracticalDef.fullMarks})` : "(Max: 25)"}
                                        </div>
                                      </th>
                                    )}

                                    {modalOtherDefs.map((c: any) => (
                                      <th key={`modal-other-th-${c.id}`} className="p-2 border-r-2 border-black text-center w-24 bg-slate-50">
                                        <div>{c.componentName}</div>
                                        <div className="text-[9px] text-slate-500 font-normal">(Max: {c.fullMarks})</div>
                                      </th>
                                    ))}

                                    <th className="p-2 text-center w-24 bg-slate-100 font-extrabold">
                                      TOTAL
                                    </th>
                                  </>
                                )}
                              </tr>
                            </thead>

                            <tbody className="divide-y-2 divide-black font-mono">
                              {rows.map((row, rIdx) => {
                                const cqVal = row.components?.[modalCqKey] ?? "";
                                const mcqVal = row.components?.[modalMcqKey] ?? "";
                                const pracVal = modalHasPractical ? (row.components?.[modalPracticalKey] ?? "") : "";

                                const cqNum = typeof cqVal === "number" ? cqVal : parseFloat(String(cqVal)) || 0;
                                const mcqNum = typeof mcqVal === "number" ? mcqVal : parseFloat(String(mcqVal)) || 0;
                                const pracNum = modalHasPractical ? (typeof pracVal === "number" ? pracVal : parseFloat(String(pracVal)) || 0) : 0;

                                let otherSum = 0;
                                modalOtherDefs.forEach((c: any) => {
                                  const ov = row.components?.[c.componentName] ?? "";
                                  otherSum += typeof ov === "number" ? ov : parseFloat(String(ov)) || 0;
                                });

                                const studentTotal = (modalHasCq ? cqNum : 0) + (modalHasMcq ? mcqNum : 0) + (modalHasPractical ? pracNum : 0) + otherSum;

                                const cqExceeded = modalCqDef && cqNum > modalCqDef.fullMarks;
                                const mcqExceeded = modalMcqDef && mcqNum > modalMcqDef.fullMarks;
                                const pracExceeded = modalHasPractical && modalPracticalDef && pracNum > modalPracticalDef.fullMarks;

                                const ctNum =
                                  typeof row.ctMark === "number"
                                    ? row.ctMark
                                    : parseFloat(String(row.ctMark ?? "")) || 0;
                                const ctExceeded = isClassTest ? ctNum > ctMaxMark : false;

                                return (
                                  <tr
                                    key={`modal-row-${row.enrollmentId}`}
                                    data-row-idx={rIdx}
                                    className={`border-b-2 border-black hover:bg-slate-50 h-[36px] transition-colors ${
                                      row.isAbsent ? "bg-red-50/30" : ""
                                    }`}
                                  >
                                    <td className="p-1 px-2 text-center font-bold text-slate-900 border-r-2 border-black">
                                      #{row.roll}
                                    </td>
                                    <td className="p-1 px-2 font-sans font-medium text-slate-900 border-r-2 border-black truncate max-w-56">
                                      <span>{row.name}</span>
                                      {!selectedSectionId && row.sectionName && (
                                        <span className="ml-1 text-[10px] text-slate-500 font-mono">
                                          ({row.sectionName})
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-1 border-r-2 border-black font-sans text-center">
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          row.subjectType === "OPTIONAL_4TH"
                                            ? "bg-amber-100 text-amber-900"
                                            : "bg-blue-50 text-blue-700"
                                        }`}
                                      >
                                        {row.subjectType === "OPTIONAL_4TH" ? "★ 4th" : "Mandatory"}
                                      </span>
                                    </td>
                                    <td className="p-1 text-center border-r-2 border-black">
                                      <input
                                        type="checkbox"
                                        checked={row.isAbsent}
                                        disabled={isLocked}
                                        onChange={(e) => handleAbsentToggle(rIdx, e.target.checked)}
                                        className="rounded cursor-pointer w-4 h-4 align-middle"
                                      />
                                    </td>

                                    {isClassTest ? (
                                      <td className="p-1 text-center bg-purple-50/20">
                                        <div className="flex items-center justify-center">
                                          <input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            max={ctMaxMark}
                                            value={row.ctMark ?? ""}
                                            disabled={row.isAbsent || isLocked}
                                            onChange={(e) => handleCtCellChange(rIdx, e.target.value)}
                                            placeholder="0"
                                            className={`w-24 text-center py-0.5 px-1.5 rounded border-2 text-xs font-bold transition-all focus:outline-none focus:ring-2 h-7 ${
                                              ctExceeded
                                                ? "bg-red-100 text-red-700 border-red-500 animate-pulse focus:ring-red-500"
                                                : row.isAbsent
                                                ? "bg-slate-100 text-slate-400 border-slate-200"
                                                : "bg-white text-slate-900 border-slate-400 focus:ring-purple-500 focus:border-purple-500"
                                            }`}
                                          />
                                        </div>
                                        {ctExceeded && (
                                          <div className="text-[9px] text-red-600 font-sans font-semibold mt-0.5">
                                            &gt; {ctMaxMark}
                                          </div>
                                        )}
                                      </td>
                                    ) : (
                                      <>
                                        {/* CQ Cell */}
                                        {modalHasCq && (
                                          <td className="p-1 border-r-2 border-black text-center">
                                            <input
                                              type="number"
                                              step="0.5"
                                              min="0"
                                              max={modalCqDef?.fullMarks || 100}
                                              value={cqVal}
                                              disabled={row.isAbsent || isLocked}
                                              onChange={(e) => handleCellChange(rIdx, modalCqKey, e.target.value)}
                                              placeholder="0"
                                              className={`w-20 text-center py-0.5 px-1 border rounded text-xs font-bold h-7 ${
                                                cqExceeded ? "bg-red-100 text-red-700 border-red-500 animate-pulse" : "bg-white border-slate-300"
                                              }`}
                                            />
                                            {cqExceeded && (
                                              <div className="text-[9px] text-red-600 font-sans font-semibold mt-0.5">
                                                &gt; {modalCqDef?.fullMarks}
                                              </div>
                                            )}
                                          </td>
                                        )}

                                        {/* MCQ Cell */}
                                        {modalHasMcq && (
                                          <td className="p-1 border-r-2 border-black text-center">
                                            <input
                                              type="number"
                                              step="0.5"
                                              min="0"
                                              max={modalMcqDef?.fullMarks || 100}
                                              value={mcqVal}
                                              disabled={row.isAbsent || isLocked}
                                              onChange={(e) => handleCellChange(rIdx, modalMcqKey, e.target.value)}
                                              placeholder="0"
                                              className={`w-20 text-center py-0.5 px-1 border rounded text-xs font-bold h-7 ${
                                                mcqExceeded ? "bg-red-100 text-red-700 border-red-500 animate-pulse" : "bg-white border-slate-300"
                                              }`}
                                            />
                                            {mcqExceeded && (
                                              <div className="text-[9px] text-red-600 font-sans font-semibold mt-0.5">
                                                &gt; {modalMcqDef?.fullMarks}
                                              </div>
                                            )}
                                          </td>
                                        )}

                                        {/* PRACTICAL Cell */}
                                        {modalHasPractical && (
                                          <td className="p-1 border-r-2 border-black text-center">
                                            <input
                                              type="number"
                                              step="0.5"
                                              min="0"
                                              max={modalPracticalDef?.fullMarks || 100}
                                              value={pracVal}
                                              disabled={row.isAbsent || isLocked}
                                              onChange={(e) => handleCellChange(rIdx, modalPracticalKey, e.target.value)}
                                              placeholder="0"
                                              className={`w-20 text-center py-0.5 px-1 border rounded text-xs font-bold h-7 ${
                                                pracExceeded ? "bg-red-100 text-red-700 border-red-500 animate-pulse" : "bg-white border-slate-300"
                                              }`}
                                            />
                                            {pracExceeded && (
                                              <div className="text-[9px] text-red-600 font-sans font-semibold mt-0.5">
                                                &gt; {modalPracticalDef?.fullMarks}
                                              </div>
                                            )}
                                          </td>
                                        )}

                                        {modalOtherDefs.map((c: any) => (
                                          <td key={`modal-other-cell-${c.id}`} className="p-1 border-r-2 border-black text-center">
                                            <input
                                              type="number"
                                              step="0.5"
                                              min="0"
                                              max={c.fullMarks}
                                              value={row.components?.[c.componentName] ?? ""}
                                              disabled={row.isAbsent || isLocked}
                                              onChange={(e) => handleCellChange(rIdx, c.componentName, e.target.value)}
                                              placeholder="0"
                                              className="w-20 text-center py-0.5 px-1 border rounded text-xs font-bold bg-white border-slate-300 h-7"
                                            />
                                          </td>
                                        ))}

                                        <td className="p-1 text-center font-bold text-slate-900 bg-slate-50 font-mono text-xs">
                                          {row.isAbsent ? (
                                            <span className="text-red-600 font-bold bg-red-100 px-1.5 py-0.5 rounded">ABS</span>
                                          ) : (
                                            studentTotal.toFixed(1)
                                          )}
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                );
                              })}
                              {rows.length === 0 && (
                                <tr>
                                  <td colSpan={isClassTest ? 5 : 10} className="p-8 text-center text-slate-500 font-sans">
                                    No students found allocated to this subject in the selected class/section.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Bottom Right Action Buttons matching wireframe */}
                        <div className="flex items-center justify-between pt-2">
                          <div>
                            {saveSuccess && (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-md">
                                ✓ Saved Successfully
                              </span>
                            )}
                            {submittedSuccess && (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-400 px-3 py-1 rounded-md">
                                ✓ Marks Submitted Successfully!
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={handleSaveMarks}
                              disabled={saving || isLocked || rows.length === 0}
                              className="px-6 py-2 border-2 border-black bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-bold rounded text-xs transition shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              {saving ? "Saving..." : "Save"}
                            </button>

                            <button
                              type="button"
                              onClick={handleSubmitMarks}
                              disabled={saving || isLocked || rows.length === 0}
                              className="px-6 py-2 border-2 border-black bg-slate-900 hover:bg-black active:bg-slate-950 text-white font-bold rounded text-xs transition shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark Input Sheet PDF Preview & Download Modal */}
      <MarkInputPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        exam={activeExam}
        selectedClass={selectedClass}
        selectedSection={availableSections.find((s: any) => s.id === selectedSectionId)}
        selectedGroup={selectedGroup}
        selectedShift={selectedShift}
        subject={subjects.find((s: any) => s.id === selectedSubjectId)}
        config={config}
        rows={rows}
        isCtActive={isCtActive}
        ctPercentage={ctPercentage}
        ctMaxMark={ctMaxMark}
        mainExamPercentage={mainExamPercentage}
        isClassTest={isClassTest}
      />
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Plus,
  Play,
  CheckCircle2,
  Lock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  Pencil,
  Sliders,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Layers,
  Search,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { SessionSelect } from "@/components/SessionSelect";
import { ResultNavHeader } from "@/app/results/ResultNavHeader";

interface AssessmentComponent {
  id?: string;
  componentName: string;
  fullMarks: number | string;
  passMarks: number | string;
  isMandatoryPass: boolean;
}

interface ExamSubjectConfig {
  id: string;
  examId: string;
  subjectId: string;
  groupType: string;
  totalFullMarks: number;
  passMode: string;
  aggregatePassMark: number;
  creditWeight: number;
  subject: {
    id: string;
    subjectCode: string;
    name: string;
  };
  components: AssessmentComponent[];
}

interface Exam {
  id: string;
  name: string;
  termCode?: string;
  status: string;
  classId: string;
  class?: {
    id: string;
    name: string;
  };
  academicYear?: {
    id: string;
    yearName: string;
  };
  gradingSystem?: {
    id: string;
    name: string;
  };
  subjectConfigs?: ExamSubjectConfig[];
  _count?: {
    marks: number;
    processedResults: number;
  };
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [allCatalogSubjects, setAllCatalogSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Catalog Filter States (Session first)
  const [filterSession, setFilterSession] = useState("ALL");
  const [filterClassId, setFilterClassId] = useState("ALL");
  const [filterSearch, setFilterSearch] = useState("");

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      if (filterSession !== "ALL") {
        if (!exam.academicYear?.yearName || exam.academicYear.yearName !== filterSession) {
          return false;
        }
      }
      if (filterClassId !== "ALL" && exam.classId !== filterClassId) {
        return false;
      }
      if (filterSearch.trim()) {
        const q = filterSearch.toLowerCase().trim();
        const matchesName = exam.name.toLowerCase().includes(q);
        const matchesClass = (exam.class?.name || "").toLowerCase().includes(q);
        if (!matchesName && !matchesClass) return false;
      }
      return true;
    });
  }, [exams, filterSession, filterClassId, filterSearch]);

  // Form State for New Exam
  const [session, setSession] = useState("");
  const [name, setName] = useState("");
  const [termCode, setTermCode] = useState("Semester");
  const [customTermCode, setCustomTermCode] = useState("");
  const [classId, setClassId] = useState("");
  const [autoAssignSubjects, setAutoAssignSubjects] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // Edit Exam Instance Modal State
  const [showEditExamModal, setShowEditExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editSession, setEditSession] = useState("");
  const [editExamName, setEditExamName] = useState("");
  const [editExamType, setEditExamType] = useState("Semester");
  const [editCustomExamType, setEditCustomExamType] = useState("");
  const [editExamClassId, setEditExamClassId] = useState("");
  const [editExamSaving, setEditExamSaving] = useState(false);

  // Delete Exam Confirmation Modal State
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [deleteExamLoading, setDeleteExamLoading] = useState(false);

  // Expanded Exam for Managing Subjects
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [syncLoadingExamId, setSyncLoadingExamId] = useState<string | null>(null);
  const [selectedConfigIds, setSelectedConfigIds] = useState<string[]>([]);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);

  // Redesigned Multi-Subject Assign Modal State (Filter Group first -> Checkboxes)
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignModalExam, setAssignModalExam] = useState<Exam | null>(null);
  const [assignFilterGroup, setAssignFilterGroup] = useState("ALL");
  const [assignSearchSubject, setAssignSearchSubject] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [assignTotalFullMarks, setAssignTotalFullMarks] = useState("100");
  const [assignClassMappings, setAssignClassMappings] = useState<any[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSaving, setAssignSaving] = useState(false);

  // Single-Subject Edit Modal State (Triggered exclusively by table pencil icon)
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalExam, setModalExam] = useState<Exam | null>(null);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [modalSubjectId, setModalSubjectId] = useState("");
  const [modalGroupType, setModalGroupType] = useState("GENERAL");
  const [modalTotalFullMarks, setModalTotalFullMarks] = useState("100");
  const [modalPassMode, setModalPassMode] = useState("COMPONENT_WISE");
  const [modalAggregatePassMark, setModalAggregatePassMark] = useState("33");
  const [modalCreditWeight, setModalCreditWeight] = useState("1.0");
  const [modalComponents, setModalComponents] = useState<AssessmentComponent[]>([
    { componentName: "CQ", fullMarks: "70", passMarks: "23", isMandatoryPass: true },
    { componentName: "MCQ", fullMarks: "30", passMarks: "10", isMandatoryPass: true },
  ]);
  const [modalSaving, setModalSaving] = useState(false);

  // Notification State
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchExams = async () => {
    try {
      const res = await fetch("/api/exams");
      const data = await res.json();
      if (data.success) {
        setExams(data.data);
        // If there's an expanded exam or active modal, keep reference updated
        if (expandedExamId) {
          const updatedCurrent = data.data.find((e: Exam) => e.id === expandedExamId);
          if (updatedCurrent) {
            setModalExam(updatedCurrent);
            setAssignModalExam(updatedCurrent);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalogSubjects = async () => {
    try {
      const res = await fetch("/api/subjects");
      const data = await res.json();
      if (data.success) {
        setAllCatalogSubjects(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/rules/templates");
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data || []);
      }
    } catch (e) {
      console.error("Error loading assessment templates:", e);
    }
  };

  useEffect(() => {
    fetchExams();
    fetchCatalogSubjects();
    fetchTemplates();
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setClasses(data.data);
          if (data.data.length > 0) setClassId(data.data[0].id);
        }
      });
    fetch("/api/academic-years")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setAcademicYears(data.data);
          const active = data.data.find((y: any) => y.isCurrent) || data.data[0];
          if (active) {
            setSession(active.yearName);
          }
        }
      })
      .catch((err) => console.error("Error loading academic years:", err));
  }, []);

  const filteredTemplatesForClass = useMemo(() => {
    if (!classId) return templates;
    return templates.filter((t) => t.classId === classId);
  }, [templates, classId]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !classId) return;

    const finalTermCode =
      termCode === "Other" ? customTermCode.trim() || "Other" : termCode || "Semester";

    const selectedYear = academicYears.find((y) => y.yearName === session);

    setCreateLoading(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          termCode: finalTermCode,
          classId,
          academicYearId: selectedYear?.id,
          session,
          autoAssignSubjects: selectedTemplateId ? false : autoAssignSubjects,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const newExamId = data.data?.id;
        let appliedTemplateMsg = "";

        if (selectedTemplateId && newExamId) {
          try {
            const applyRes = await fetch("/api/rules/templates/apply", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                templateId: selectedTemplateId,
                examId: newExamId,
              }),
            });
            const applyData = await applyRes.json();
            if (applyData.success) {
              appliedTemplateMsg = ` Template applied with ${applyData.count || 0} subjects configured.`;
            }
          } catch (tErr) {
            console.error("Error applying template:", tErr);
          }
        }

        setName("");
        setTermCode("Semester");
        setCustomTermCode("");
        setSelectedTemplateId("");
        if (filterSession !== "ALL" && filterSession !== session) {
          setFilterSession(session);
        }
        showToast(
          `Exam "${name}" created successfully!${
            appliedTemplateMsg
              ? appliedTemplateMsg
              : autoAssignSubjects
              ? ` Auto-assigned ${data.data.subjectConfigs?.length || 0} subjects.`
              : ""
          }`
        );
        await fetchExams();
        // Expand the newly created exam to let the user review assigned subjects immediately
        if (newExamId) {
          setExpandedExamId(newExamId);
        }
      } else {
        showToast(data.error || "Failed to create exam", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setEditExamName(exam.name);
    const existingType = exam.termCode || "Semester";
    if (existingType === "Semester" || existingType === "Class Test") {
      setEditExamType(existingType);
      setEditCustomExamType("");
    } else if (existingType === "Semister") {
      setEditExamType("Semester");
      setEditCustomExamType("");
    } else {
      setEditExamType("Other");
      setEditCustomExamType(existingType);
    }
    setEditExamClassId(exam.classId);
    setEditSession(exam.academicYear?.yearName || "");
    setShowEditExamModal(true);
  };

  const handleSaveEditExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam || !editExamName || !editExamClassId) return;

    const finalEditType =
      editExamType === "Other"
        ? editCustomExamType.trim() || "Other"
        : editExamType || "Semester";

    const selectedEditYear = academicYears.find((y) => y.yearName === editSession);

    setEditExamSaving(true);
    try {
      const res = await fetch("/api/exams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingExam.id,
          name: editExamName,
          termCode: finalEditType,
          classId: editExamClassId,
          academicYearId: selectedEditYear?.id,
          session: editSession,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Examination "${editExamName}" updated successfully!`);
        setShowEditExamModal(false);
        setEditingExam(null);
        await fetchExams();
      } else {
        showToast(data.error || "Failed to update examination", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update examination", "error");
    } finally {
      setEditExamSaving(false);
    }
  };

  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    setDeleteExamLoading(true);
    try {
      const res = await fetch(`/api/exams?id=${examToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Examination "${examToDelete.name}" deleted successfully!`);
        const deletedId = examToDelete.id;
        setExamToDelete(null);
        if (expandedExamId === deletedId) {
          setExpandedExamId(null);
        }
        await fetchExams();
      } else {
        showToast(data.error || "Failed to delete examination", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to delete examination", "error");
    } finally {
      setDeleteExamLoading(false);
    }
  };

  const handleUpdateStatus = async (examId: string, status: string) => {
    try {
      const res = await fetch("/api/exams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId, status }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Exam lifecycle updated to ${status}.`);
        fetchExams();
      } else {
        showToast(data.error || "Failed to update status", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Sync subjects from Class Mapping
  const handleSyncClassSubjects = async (exam: Exam) => {
    setSyncLoadingExamId(exam.id);
    try {
      const res = await fetch("/api/exams/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync_class_mappings",
          examId: exam.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Subjects synchronized successfully!");
        await fetchExams();
      } else {
        showToast(data.error || "Sync failed", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSyncLoadingExamId(null);
    }
  };

  // Open modal to Assign Subjects (Redesigned multi-subject selection)
  const handleOpenAssignModal = async (exam: Exam) => {
    setAssignModalExam(exam);
    setAssignFilterGroup("ALL");
    setAssignSearchSubject("");
    setSelectedSubjectIds([]);
    setAssignTotalFullMarks("100");
    setShowAssignModal(true);
    setAssignLoading(true);

    try {
      const res = await fetch(`/api/exams/subjects?examId=${exam.id}`);
      const data = await res.json();
      if (data.success) {
        setAssignClassMappings(data.data.classMappings || []);
        if (data.data.allCatalogSubjects && data.data.allCatalogSubjects.length > 0) {
          setAllCatalogSubjects(data.data.allCatalogSubjects);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAssignLoading(false);
    }
  };

  // Open modal to Edit existing assigned subject config (Single Subject)
  const handleOpenEditModal = (exam: Exam, config: ExamSubjectConfig) => {
    setModalExam(exam);
    setEditingConfigId(config.id);
    setModalSubjectId(config.subjectId);
    setModalGroupType(config.groupType || "GENERAL");
    setModalTotalFullMarks(String(config.totalFullMarks || 100));
    setModalPassMode(config.passMode || "COMPONENT_WISE");
    setModalAggregatePassMark(String(config.aggregatePassMark || 33));
    setModalCreditWeight(String(config.creditWeight || 1.0));

    if (config.components && config.components.length > 0) {
      setModalComponents(
        config.components.map((c) => ({
          componentName: c.componentName,
          fullMarks: String(c.fullMarks),
          passMarks: String(c.passMarks),
          isMandatoryPass: c.isMandatoryPass,
        }))
      );
    } else {
      setModalComponents([
        { componentName: "CQ", fullMarks: "70", passMarks: "23", isMandatoryPass: true },
        { componentName: "MCQ", fullMarks: "30", passMarks: "10", isMandatoryPass: true },
      ]);
    }
    setShowEditModal(true);
  };

  // Delete / Unassign subject from exam
  const handleRemoveSubjectConfig = async (configId: string, subjectName: string) => {
    if (!confirm(`Are you sure you want to unassign "${subjectName}" from this examination?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/exams/subjects?configId=${configId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Subject "${subjectName}" unassigned from examination.`);
        await fetchExams();
      } else {
        showToast(data.error || "Failed to remove subject", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Selection and batch deletion handlers for assigned subjects in expanded view
  const handleToggleSelectAll = (configs: ExamSubjectConfig[]) => {
    const configIds = configs.map((c) => c.id);
    const allSelected = configIds.length > 0 && configIds.every((id) => selectedConfigIds.includes(id));
    if (allSelected) {
      setSelectedConfigIds((prev) => prev.filter((id) => !configIds.includes(id)));
    } else {
      setSelectedConfigIds((prev) => Array.from(new Set([...prev, ...configIds])));
    }
  };

  const handleToggleSelectConfig = (configId: string) => {
    setSelectedConfigIds((prev) =>
      prev.includes(configId) ? prev.filter((id) => id !== configId) : [...prev, configId]
    );
  };

  const handleDeleteSelectedConfigs = async (examName: string, configIdsToDelete: string[]) => {
    if (configIdsToDelete.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to unassign ${configIdsToDelete.length} selected subject(s) from "${examName}"?`
      )
    ) {
      return;
    }

    setBatchDeleteLoading(true);
    try {
      const res = await fetch("/api/exams/subjects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configIds: configIdsToDelete }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Successfully removed ${configIdsToDelete.length} subject(s).`);
        setSelectedConfigIds((prev) => prev.filter((id) => !configIdsToDelete.includes(id)));
        await fetchExams();
      } else {
        showToast(data.error || "Failed to remove selected subjects", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setBatchDeleteLoading(false);
    }
  };

  // Helper to determine if a subject is mandatory / compulsory
  const isSubjectMandatory = (subject: any, mappings: any[]): boolean => {
    const mapping = mappings.find((m: any) => m.subjectId === subject.id);
    if (mapping) {
      if (mapping.subjectType === "MANDATORY" || mapping.groupType === "MANDATORY" || mapping.groupType === "ALL") return true;
    }
    const code = subject.subjectCode || "";
    const nameLower = (subject.name || "").toLowerCase();
    if (
      ["101", "102", "107", "108", "109", "154", "111", "112", "113", "114", "150", "127"].includes(code) ||
      nameLower.includes("bangla") ||
      nameLower.includes("bengali") ||
      nameLower.includes("english") ||
      (nameLower.includes("math") && !nameLower.includes("higher")) ||
      nameLower.includes("ict") ||
      nameLower.includes("information and communication") ||
      nameLower.includes("islam") ||
      nameLower.includes("hindu") ||
      nameLower.includes("buddhist") ||
      nameLower.includes("christian") ||
      nameLower.includes("religion") ||
      nameLower.includes("bangladesh and global") ||
      nameLower.includes("bgs")
    ) {
      return true;
    }
    return false;
  };

  // Determine subject group from class mappings or standard conventions
  const getSubjectGroup = (subject: any, mappings: any[]): string => {
    const mapping = mappings.find((m: any) => m.subjectId === subject.id);
    if (mapping && mapping.groupType && mapping.groupType !== "ALL") {
      if (mapping.groupType === "MANDATORY") return "MANDATORY";
      return mapping.groupType;
    }
    const nameLower = (subject.name || "").toLowerCase();
    const code = subject.subjectCode || "";
    if (
      ["136", "137", "138", "126"].includes(code) ||
      nameLower.includes("physics") ||
      nameLower.includes("chemistry") ||
      nameLower.includes("biology") ||
      nameLower.includes("higher math")
    ) {
      return "SCIENCE";
    }
    if (
      nameLower.includes("accounting") ||
      nameLower.includes("finance") ||
      nameLower.includes("business")
    ) {
      return "BUSINESS_STUDIES";
    }
    if (
      nameLower.includes("history") ||
      nameLower.includes("geography") ||
      nameLower.includes("civics") ||
      nameLower.includes("economics") ||
      nameLower.includes("islamic history")
    ) {
      return "HUMANITIES";
    }
    return "GENERAL";
  };

  // Memoized filtered subjects for the Assign modal
  const filteredModalSubjects = useMemo(() => {
    if (!assignModalExam) return [];

    return allCatalogSubjects.filter((sub) => {
      const isMandatory = isSubjectMandatory(sub, assignClassMappings);
      const group = getSubjectGroup(sub, assignClassMappings);

      // Filter 1: Group filter
      if (assignFilterGroup === "MANDATORY") {
        if (!isMandatory) return false;
      } else if (assignFilterGroup !== "ALL") {
        if (group !== assignFilterGroup) return false;
      }

      // Filter 2: Search query
      if (assignSearchSubject.trim()) {
        const q = assignSearchSubject.toLowerCase().trim();
        const matchCode = (sub.subjectCode || "").toLowerCase().includes(q);
        const matchName = (sub.name || "").toLowerCase().includes(q);
        if (!matchCode && !matchName) return false;
      }

      return true;
    });
  }, [allCatalogSubjects, assignClassMappings, assignFilterGroup, assignSearchSubject, assignModalExam]);

  // IDs of visible unassigned subjects
  const visibleUnassignedIds = useMemo(() => {
    if (!assignModalExam) return [];
    const assignedIds = new Set(assignModalExam.subjectConfigs?.map((c) => c.subjectId) || []);
    return filteredModalSubjects.filter((s) => !assignedIds.has(s.id)).map((s) => s.id);
  }, [filteredModalSubjects, assignModalExam]);

  const handleToggleSelectSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    setSelectedSubjectIds((prev) => {
      const set = new Set([...prev, ...visibleUnassignedIds]);
      return Array.from(set);
    });
  };

  const handleDeselectAll = () => {
    setSelectedSubjectIds([]);
  };

  // Save Multi-Subject Assignment
  const handleSaveAssignModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalExam) return;

    if (selectedSubjectIds.length === 0) {
      showToast("Please select at least one subject to assign.", "error");
      return;
    }

    setAssignSaving(true);
    try {
      const res = await fetch("/api/exams/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          examId: assignModalExam.id,
          subjectIds: selectedSubjectIds,
          groupType: assignFilterGroup,
          totalFullMarks: 100,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Successfully assigned ${selectedSubjectIds.length} subject(s)!`);
        setShowAssignModal(false);
        setSelectedSubjectIds([]);
        await fetchExams();
      } else {
        showToast(data.error || "Failed to assign subjects", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setAssignSaving(false);
    }
  };

  // Save Single-Subject Edit Modal
  const handleSaveEditModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalExam || !editingConfigId) return;

    setModalSaving(true);
    try {
      const res = await fetch("/api/exams/subjects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configId: editingConfigId,
          groupType: modalGroupType,
          totalFullMarks: parseFloat(modalTotalFullMarks) || 100,
          passMode: modalPassMode,
          aggregatePassMark: parseFloat(modalAggregatePassMark) || 33,
          creditWeight: parseFloat(modalCreditWeight) || 1.0,
          components: modalComponents.map((c) => ({
            componentName: c.componentName.toUpperCase().trim(),
            fullMarks: parseFloat(String(c.fullMarks)) || 0,
            passMarks: parseFloat(String(c.passMarks)) || 0,
            isMandatoryPass: c.isMandatoryPass,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Subject configuration updated successfully!");
        setShowEditModal(false);
        await fetchExams();
      } else {
        showToast(data.error || "Update failed", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setModalSaving(false);
    }
  };

  // Component row helpers
  const handleAddComponentRow = () => {
    setModalComponents([
      ...modalComponents,
      { componentName: "PRACTICAL", fullMarks: "25", passMarks: "8", isMandatoryPass: true },
    ]);
  };

  const handleRemoveComponentRow = (index: number) => {
    setModalComponents(modalComponents.filter((_, i) => i !== index));
  };

  // Preset templates
  const applyPreset = (preset: "THEORY_ONLY" | "THEORY_MCQ" | "SCIENCE_PRACTICAL") => {
    if (preset === "THEORY_ONLY") {
      setModalTotalFullMarks("100");
      setModalAggregatePassMark("33");
      setModalComponents([
        { componentName: "THEORY", fullMarks: "100", passMarks: "33", isMandatoryPass: true },
      ]);
    } else if (preset === "THEORY_MCQ") {
      setModalTotalFullMarks("100");
      setModalAggregatePassMark("33");
      setModalComponents([
        { componentName: "CQ", fullMarks: "70", passMarks: "23", isMandatoryPass: true },
        { componentName: "MCQ", fullMarks: "30", passMarks: "10", isMandatoryPass: true },
      ]);
    } else if (preset === "SCIENCE_PRACTICAL") {
      setModalTotalFullMarks("100");
      setModalAggregatePassMark("33");
      setModalComponents([
        { componentName: "CQ", fullMarks: "50", passMarks: "17", isMandatoryPass: true },
        { componentName: "MCQ", fullMarks: "25", passMarks: "8", isMandatoryPass: true },
        { componentName: "PRACTICAL", fullMarks: "25", passMarks: "8", isMandatoryPass: true },
      ]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">DRAFT</span>;
      case "MARK_ENTRY":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">MARK ENTRY OPEN</span>;
      case "DRAFT_PREVIEW":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">DRAFT PREVIEW</span>;
      case "PUBLISHED":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
            <Lock className="w-3 h-3 inline" /> <span>PUBLISHED</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      <ResultNavHeader />
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
            notification.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <span>Exam Configuration</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure exam terms, assessment components, and subject mark distributions.
        </p>
      </div>

      {/* Create Exam Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
          <Plus className="w-4 h-4 text-emerald-600" />
          <span>Create New Exam Instance</span>
        </h2>
        <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-2">
              <label className="font-medium text-slate-600 block">Session *</label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-xs text-slate-800"
                required
              >
                <option value="">-- Select Session --</option>
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.yearName}>
                    {ay.yearName}{ay.isCurrent ? " (Current)" : ""}
                  </option>
                ))}
                {academicYears.length === 0 && (
                  <option value="2026">2026 (Current)</option>
                )}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="font-medium text-slate-600 block">Target Class *</label>
              <select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setSelectedTemplateId("");
                }}
                className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-xs text-slate-800"
                required
              >
                <option value="">-- Select Class --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-3">
              <label className="font-medium text-slate-600 block">Exam Title *</label>
              <input
                type="text"
                placeholder="e.g. Annual Examination 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-xs text-slate-800"
                required
              />
            </div>
            <div className="lg:col-span-2">
              <label className="font-medium text-slate-600 block">Exam Type *</label>
              <select
                value={termCode}
                onChange={(e) => {
                  setTermCode(e.target.value);
                  if (e.target.value !== "Other") {
                    setCustomTermCode("");
                  }
                }}
                className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-xs text-slate-800"
                required
              >
                <option value="Semester">Semester</option>
                <option value="Class Test">Class Test</option>
                <option value="Other">Other</option>
              </select>
              {termCode === "Other" && (
                <input
                  type="text"
                  placeholder="Type custom exam type (e.g. Model Test, Pre-Test)"
                  value={customTermCode}
                  onChange={(e) => setCustomTermCode(e.target.value)}
                  className="w-full mt-1.5 p-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30 text-slate-800 text-xs font-medium"
                  required
                />
              )}
            </div>
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-600 block">Exam Template</label>
                <Link
                  href="/academic/rules"
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 hover:underline font-semibold"
                  target="_blank"
                >
                  Manage Templates
                </Link>
              </div>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className={`w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-xs text-slate-800 transition-colors ${
                  selectedTemplateId ? "border-emerald-500 bg-emerald-50/40" : "border-slate-200"
                }`}
              >
                <option value="">
                  {filteredTemplatesForClass.length === 0
                    ? "-- No Templates for Class --"
                    : "-- None (Manual / Default) --"}
                </option>
                {filteredTemplatesForClass.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} ({tpl.items?.length || 0} subjects)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Auto Assign Subjects Checkbox or Active Template Notice */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {selectedTemplateId ? (
              <div className="flex items-center space-x-2 text-xs text-emerald-800 font-medium bg-emerald-50/80 px-3 py-1.5 rounded-lg border border-emerald-200">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Template Active: Subjects & CQ/MCQ/Practical rules from{" "}
                  <strong>
                    {templates.find((t) => t.id === selectedTemplateId)?.name || "selected template"}
                  </strong>{" "}
                  will be automatically applied.
                </span>
              </div>
            ) : (
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoAssignSubjects}
                  onChange={(e) => setAutoAssignSubjects(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span className="font-medium text-slate-700 flex items-center space-x-1">
                  <span>Automatically assign mapped subjects from selected Class</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                    Recommended
                  </span>
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={createLoading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-xs transition-colors flex items-center justify-center space-x-1.5 self-end sm:self-auto"
            >
              {createLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating & Assigning Subjects...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Exam</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Exam Catalog Header & Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Exam Catalog ({filteredExams.length}{filteredExams.length !== exams.length ? ` of ${exams.length}` : ""})</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Click &quot;Manage Assigned Subjects&quot; on any examination to view, assign, or adjust its subject roster.
            </p>
          </div>
          <Link
            href="/setup/subject-mapping"
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center space-x-1"
          >
            <span>Review Class Subject Mappings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Exam Catalog Filter Bar (Session first) */}
        <div className="p-3 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Session:</label>
              <select
                value={filterSession}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilterSession(val);
                  if (val !== "ALL") {
                    setSession(val);
                  }
                }}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              >
                <option value="ALL">All Sessions</option>
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.yearName}>
                    {ay.yearName}{ay.isCurrent ? " (Current)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Class:</label>
              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              >
                <option value="ALL">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Search Exam:</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter by exam name..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredExams.map((exam) => {
            const isExpanded = expandedExamId === exam.id;
            const subjectCount = exam.subjectConfigs?.length || 0;

            // Filter subjects in expanded view
            const filteredConfigs = (exam.subjectConfigs || []).filter((cfg) => {
              const matchesGroup = groupFilter === "ALL" || cfg.groupType === groupFilter;
              return matchesGroup;
            });

            const selectedInThisExam = filteredConfigs.filter((cfg) =>
              selectedConfigIds.includes(cfg.id)
            );
            const isAllSelected =
              filteredConfigs.length > 0 &&
              filteredConfigs.every((cfg) => selectedConfigIds.includes(cfg.id));

            return (
              <div key={exam.id} className="transition-colors hover:bg-slate-50/40">
                {/* Main Exam Card Row */}
                <div className="p-4.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{exam.name}</span>
                      {getStatusBadge(exam.status)}

                      {/* Subject Count Pill */}
                      <button
                        onClick={() => {
                          setExpandedExamId(isExpanded ? null : exam.id);
                          setSelectedConfigIds([]);
                        }}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center space-x-1.5 transition-all border ${
                          subjectCount > 0
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        }`}
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>
                          {subjectCount > 0
                            ? `${subjectCount} Subject${subjectCount > 1 ? "s" : ""} Assigned`
                            : "No Subjects Assigned"}
                        </span>
                      </button>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        Class: <strong className="text-slate-700">{exam.class?.name || "N/A"}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Academic Year:{" "}
                        <strong className="text-slate-700">{exam.academicYear?.yearName || "N/A"}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Grading Scale:{" "}
                        <strong className="text-slate-700">{exam.gradingSystem?.name || "Standard"}</strong>
                      </span>
                      {exam.termCode && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium">
                            Exam Type: <strong className="text-slate-800">{exam.termCode}</strong>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions & Lifecycle Row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Expand/Collapse Subjects Toggle Button */}
                    <button
                      onClick={() => {
                        setExpandedExamId(isExpanded ? null : exam.id);
                        setSelectedConfigIds([]);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-medium border flex items-center space-x-1.5 transition-colors ${
                        isExpanded
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isExpanded ? "Hide Subjects" : "Manage Subjects"}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Quick Sync Button if zero subjects */}
                    {subjectCount === 0 && (
                      <button
                        onClick={() => handleSyncClassSubjects(exam)}
                        disabled={syncLoadingExamId === exam.id}
                        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center space-x-1"
                        title="Auto-assign subjects mapped to this class"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${syncLoadingExamId === exam.id ? "animate-spin" : ""}`}
                        />
                        <span>Sync Class Subjects</span>
                      </button>
                    )}

                    {/* Status Action Buttons */}
                    {exam.status === "DRAFT" && (
                      <button
                        onClick={() => handleUpdateStatus(exam.id, "MARK_ENTRY")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center space-x-1"
                      >
                        <Play className="w-3 h-3" />
                        <span>Open Mark Entry</span>
                      </button>
                    )}
                    {exam.status === "MARK_ENTRY" && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-blue-700 font-medium bg-blue-50 px-2 py-1 rounded border border-blue-200">
                          Ready for Marks
                        </span>
                        <button
                          onClick={() => handleUpdateStatus(exam.id, "DRAFT_PREVIEW")}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                        >
                          Lock Mark Entry
                        </button>
                      </div>
                    )}
                    {exam.status === "DRAFT_PREVIEW" && (
                      <button
                        onClick={() => handleUpdateStatus(exam.id, "PUBLISHED")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Publish Results</span>
                      </button>
                    )}
                    {exam.status === "PUBLISHED" && (
                      <button
                        onClick={() => handleUpdateStatus(exam.id, "DRAFT_PREVIEW")}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        Unlock to Draft
                      </button>
                    )}

                    {/* Edit Exam Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditExam(exam)}
                      className="px-2.5 py-1.5 rounded-lg font-medium border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center space-x-1 transition-colors cursor-pointer shadow-2xs"
                      title="Edit Exam Title, Type, or Target Class"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-500" />
                      <span>Edit</span>
                    </button>

                    {/* Delete Exam Button */}
                    <button
                      type="button"
                      onClick={() => setExamToDelete(exam)}
                      className="px-2.5 py-1.5 rounded-lg font-medium border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 flex items-center space-x-1 transition-colors cursor-pointer shadow-2xs"
                      title="Delete Examination and all assigned subjects"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Section: Examination Subject Roster & Controls */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-b border-slate-200 p-4 sm:p-5 space-y-4">
                    {/* Toolbar Header for Subjects */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-2 uppercase tracking-wider">
                          <BookOpen className="w-4 h-4 text-emerald-600" />
                          <span>Assigned Subjects for {exam.name}</span>
                          <span className="text-slate-400 font-normal">({subjectCount} Total)</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Control curriculum subjects, total full marks, and component breakdown (CQ, MCQ, Practical) for this exam.
                        </p>
                      </div>

                      {/* Control Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleSyncClassSubjects(exam)}
                          disabled={syncLoadingExamId === exam.id}
                          className="bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 shadow-sm"
                          title="Import missing subjects mapped to this class"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 text-emerald-600 ${
                              syncLoadingExamId === exam.id ? "animate-spin" : ""
                            }`}
                          />
                          <span>Sync from Class ({exam.class?.name})</span>
                        </button>

                        <button
                          onClick={() => handleOpenAssignModal(exam)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Assign Subjects</span>
                        </button>
                      </div>
                    </div>

                    {/* Batch Actions & Group Filter Bar */}
                    {subjectCount > 0 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1 text-xs">
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                          {/* Select All Checkbox */}
                          <label className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer hover:bg-slate-50 transition-colors shadow-2xs select-none">
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={() => handleToggleSelectAll(filteredConfigs)}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span>
                              {isAllSelected ? "Deselect All" : "Select All"} ({filteredConfigs.length})
                            </span>
                          </label>

                          {/* Delete Selected Button */}
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteSelectedConfigs(
                                exam.name,
                                selectedInThisExam.map((c) => c.id)
                              )
                            }
                            disabled={selectedInThisExam.length === 0 || batchDeleteLoading}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-2xs ${
                              selectedInThisExam.length > 0
                                ? "bg-red-600 hover:bg-red-700 text-white cursor-pointer active:scale-95"
                                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                            }`}
                            title={
                              selectedInThisExam.length > 0
                                ? `Delete ${selectedInThisExam.length} selected subject(s)`
                                : "Select subjects using checkboxes to delete"
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>
                              {batchDeleteLoading
                                ? "Deleting..."
                                : `Delete Selected (${selectedInThisExam.length})`}
                            </span>
                          </button>

                          {selectedInThisExam.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedConfigIds((prev) =>
                                  prev.filter((id) => !filteredConfigs.some((c) => c.id === id))
                                )
                              }
                              className="text-[11px] text-slate-500 hover:text-red-600 underline font-medium cursor-pointer ml-1"
                            >
                              Clear selection
                            </button>
                          )}
                        </div>

                        {/* Filter by Group */}
                        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                          <span className="text-slate-500 text-[11px] whitespace-nowrap">Group:</span>
                          <select
                            value={groupFilter}
                            onChange={(e) => setGroupFilter(e.target.value)}
                            className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 shadow-2xs focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="ALL">All Groups</option>
                            <option value="GENERAL">General / Common</option>
                            <option value="SCIENCE">Science</option>
                            <option value="HUMANITIES">Humanities</option>
                            <option value="BUSINESS_STUDIES">Business Studies</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Subjects Table */}
                    {subjectCount > 0 ? (
                      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto shadow-sm">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                            <tr>
                              <th className="py-2.5 px-3 w-10 text-center">
                                <input
                                  type="checkbox"
                                  checked={isAllSelected}
                                  onChange={() => handleToggleSelectAll(filteredConfigs)}
                                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                  title="Select/Deselect all visible subjects"
                                />
                              </th>
                              <th className="py-2.5 px-3">Code</th>
                              <th className="py-2.5 px-3">Subject Name</th>
                              <th className="py-2.5 px-3">Group</th>
                              <th className="py-2.5 px-3">Full Marks</th>
                              <th className="py-2.5 px-3">Pass Rule</th>
                              <th className="py-2.5 px-3">Assessment Components</th>
                              <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {filteredConfigs.map((cfg) => {
                              const isChecked = selectedConfigIds.includes(cfg.id);
                              return (
                                <tr
                                  key={cfg.id}
                                  className={`transition-colors ${
                                    isChecked
                                      ? "bg-red-50/50 hover:bg-red-50/80"
                                      : "hover:bg-slate-50/75"
                                  }`}
                                >
                                  <td className="py-2.5 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleSelectConfig(cfg.id)}
                                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                                    {cfg.subject.subjectCode}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                                    {cfg.subject.name}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        cfg.groupType === "SCIENCE"
                                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                                          : cfg.groupType === "HUMANITIES"
                                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                                          : cfg.groupType === "BUSINESS_STUDIES"
                                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                                          : "bg-slate-100 text-slate-700 border border-slate-200"
                                      }`}
                                    >
                                      {cfg.groupType}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                                    {cfg.totalFullMarks}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="text-[11px]">
                                      <span className="font-medium text-slate-700">
                                        {cfg.passMode === "COMPONENT_WISE"
                                          ? "Component-wise"
                                          : cfg.passMode === "AGGREGATE_ONLY"
                                          ? "Aggregate"
                                          : "Both"}
                                      </span>
                                      <span className="text-slate-400 ml-1">
                                        (Min: {cfg.aggregatePassMark})
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="flex flex-wrap gap-1">
                                      {cfg.components && cfg.components.length > 0 ? (
                                        cfg.components.map((comp, idx) => (
                                          <span
                                            key={idx}
                                            className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-mono"
                                          >
                                            <strong>{comp.componentName}</strong>: {comp.fullMarks}
                                            <span className="text-slate-400">/{comp.passMarks}</span>
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-[10px] text-slate-400 italic">
                                          No components configured
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <div className="flex items-center justify-end space-x-1">
                                      <button
                                        onClick={() => handleOpenEditModal(exam, cfg)}
                                        className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-blue-700 transition-colors"
                                        title="Edit Marks & Components"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleRemoveSubjectConfig(cfg.id, cfg.subject.name)
                                        }
                                        className="p-1 hover:bg-rose-100 rounded text-slate-400 hover:text-rose-600 transition-colors"
                                        title="Unassign from Exam"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredConfigs.length === 0 && (
                              <tr>
                                <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                                  No subjects match your filter criteria.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* Empty State for Exam with 0 subjects */
                      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 text-center space-y-3">
                        <div className="w-9 h-9 mx-auto bg-amber-100 text-amber-700 rounded-full flex items-center justify-center">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-amber-900">
                            No Subjects Assigned to this Examination
                          </h4>
                          <p className="text-[11px] text-amber-700 mt-1 max-w-lg mx-auto">
                            To enter marks and process results, subjects must be assigned to this examination. You can sync mapped subjects from Class {exam.class?.name} or assign subjects individually.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                          <button
                            onClick={() => handleSyncClassSubjects(exam)}
                            disabled={syncLoadingExamId === exam.id}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${
                                syncLoadingExamId === exam.id ? "animate-spin" : ""
                              }`}
                            />
                            <span>Auto-Assign from Class {exam.class?.name}</span>
                          </button>
                          <button
                            onClick={() => handleOpenAssignModal(exam)}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Assign Subjects</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {exams.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 italic text-xs">
              No exams found. Create one above to get started.
            </div>
          )}

          {loading && (
            <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Loading examinations...</span>
            </div>
          )}
        </div>
      </div>

      {/* Redesigned Multi-Subject Assign Modal */}
      {showAssignModal && assignModalExam && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Assign Subjects to Examination</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Exam: <strong className="text-slate-800">{assignModalExam.name}</strong> • Class:{" "}
                  <strong className="text-slate-800">{assignModalExam.class?.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignModal} className="p-5 space-y-4 text-xs">
              {/* 1. Academic Group Filter (FIRST) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
                      1
                    </span>
                    <span>Filter by Academic Group</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Switch group to view matching subjects
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[
                    { id: "ALL", label: "All Groups" },
                    { id: "MANDATORY", label: "Mandatory" },
                    { id: "GENERAL", label: "General" },
                    { id: "SCIENCE", label: "Science" },
                    { id: "HUMANITIES", label: "Humanities" },
                    { id: "BUSINESS_STUDIES", label: "Business" },
                  ].map((g) => {
                    const active = assignFilterGroup === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setAssignFilterGroup(g.id)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                          active
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Subjects Checkboxes (Multiple Subject Select at a time) */}
              <div className="space-y-2 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
                      2
                    </span>
                    <span>Select Subjects ({filteredModalSubjects.length} available)</span>
                  </label>
                  <div className="flex items-center space-x-2 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectAllVisible}
                      disabled={visibleUnassignedIds.length === 0}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold disabled:opacity-40"
                    >
                      Select All Unassigned
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      disabled={selectedSubjectIds.length === 0}
                      className="text-slate-500 hover:text-slate-700 font-medium disabled:opacity-40"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search subjects by code or name..."
                    value={assignSearchSubject}
                    onChange={(e) => setAssignSearchSubject(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                {/* Scrollable Checkbox List */}
                <div className="border border-slate-200 rounded-lg max-h-72 overflow-y-auto divide-y divide-slate-100 bg-white shadow-inner">
                  {assignLoading ? (
                    <div className="p-8 text-center text-slate-400 flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Loading subjects...</span>
                    </div>
                  ) : filteredModalSubjects.length > 0 ? (
                    filteredModalSubjects.map((sub) => {
                      const isAssigned = assignModalExam.subjectConfigs?.some(
                        (cfg) => cfg.subjectId === sub.id
                      );
                      const isSelected = selectedSubjectIds.includes(sub.id);
                      const isMandatory = isSubjectMandatory(sub, assignClassMappings);
                      const subGroup = getSubjectGroup(sub, assignClassMappings);
                      const isClassMapped = assignClassMappings.some((m) => m.subjectId === sub.id);

                      return (
                        <div
                          key={sub.id}
                          onClick={() => {
                            if (!isAssigned) handleToggleSelectSubject(sub.id);
                          }}
                          className={`p-2.5 flex items-center justify-between text-xs transition-colors ${
                            isAssigned
                              ? "bg-slate-50/75 opacity-70 cursor-not-allowed"
                              : isSelected
                              ? "bg-emerald-50/80 cursor-pointer"
                              : "hover:bg-slate-50 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isAssigned || isSelected}
                              disabled={isAssigned}
                              onChange={() => {
                                if (!isAssigned) handleToggleSelectSubject(sub.id);
                              }}
                              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed w-4 h-4"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-slate-800 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  {sub.subjectCode}
                                </span>
                                <span
                                  className={`font-semibold truncate ${
                                    isSelected ? "text-emerald-950 font-bold" : "text-slate-800"
                                  }`}
                                >
                                  {sub.name}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                            {isMandatory && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                                Mandatory
                              </span>
                            )}
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                subGroup === "SCIENCE"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : subGroup === "HUMANITIES"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : subGroup === "BUSINESS_STUDIES"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              {subGroup}
                            </span>
                            {isClassMapped && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                                Class Mapped
                              </span>
                            )}
                            {isAssigned && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold flex items-center space-x-1">
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span>Already Assigned</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-400 italic text-xs">
                      No subjects found matching the selected group and search query.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <div className="text-xs text-slate-600 font-medium">
                  Selected:{" "}
                  <strong className="text-emerald-700 font-bold">
                    {selectedSubjectIds.length}
                  </strong>{" "}
                  subject(s)
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-slate-100 text-slate-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assignSaving || selectedSubjectIds.length === 0}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center space-x-1.5 shadow-sm transition-colors"
                  >
                    {assignSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Assigning...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {selectedSubjectIds.length > 0
                            ? `Assign ${selectedSubjectIds.length} Subject(s)`
                            : "Select Subjects to Assign"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single-Subject Edit Modal (Triggered by Pencil Icon on Assigned Subject Row) */}
      {showEditModal && modalExam && editingConfigId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Pencil className="w-4 h-4 text-emerald-600" />
                  <span>Edit Assigned Subject Configuration</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Exam: <strong>{modalExam.name}</strong> ({modalExam.class?.name})
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditModal} className="p-5 space-y-4 text-xs">
              {/* Subject Readonly Badge */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Subject</label>
                <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200 font-semibold text-slate-800 flex items-center space-x-2">
                  <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 font-bold">
                    {allCatalogSubjects.find((s) => s.id === modalSubjectId)?.subjectCode}
                  </span>
                  <span>{allCatalogSubjects.find((s) => s.id === modalSubjectId)?.name}</span>
                </div>
              </div>

              {/* Group Type & Total Full Marks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Group Type</label>
                  <select
                    value={modalGroupType}
                    onChange={(e) => setModalGroupType(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="GENERAL">General / Common</option>
                    <option value="SCIENCE">Science</option>
                    <option value="HUMANITIES">Humanities</option>
                    <option value="BUSINESS_STUDIES">Business Studies</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Full Marks</label>
                  <input
                    type="number"
                    value={modalTotalFullMarks}
                    onChange={(e) => setModalTotalFullMarks(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Pass Mode & Aggregate Pass Mark */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Pass Rule Mode</label>
                  <select
                    value={modalPassMode}
                    onChange={(e) => setModalPassMode(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="COMPONENT_WISE">Component-Wise (NCTB CQ & MCQ)</option>
                    <option value="AGGREGATE_ONLY">Aggregate Only (Sum of Marks)</option>
                    <option value="BOTH">Both (Components & Aggregate)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Aggregate Pass Mark</label>
                  <input
                    type="number"
                    value={modalAggregatePassMark}
                    onChange={(e) => setModalAggregatePassMark(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Assessment Component Breakdown */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Assessment Components</span>
                  </label>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => applyPreset("THEORY_MCQ")}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                    >
                      70 CQ / 30 MCQ
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("SCIENCE_PRACTICAL")}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                    >
                      50/25/25 Practical
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("THEORY_ONLY")}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                    >
                      100 Theory
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {modalComponents.map((comp, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-xs"
                    >
                      <div className="w-24">
                        <label className="text-[10px] text-slate-500 font-medium">Type</label>
                        <input
                          type="text"
                          value={comp.componentName}
                          onChange={(e) => {
                            const next = [...modalComponents];
                            next[idx].componentName = e.target.value.toUpperCase();
                            setModalComponents(next);
                          }}
                          placeholder="CQ / MCQ"
                          className="w-full p-1 border rounded font-bold uppercase text-xs"
                          required
                        />
                      </div>
                      <div className="w-20">
                        <label className="text-[10px] text-slate-500 font-medium">Full</label>
                        <input
                          type="number"
                          value={comp.fullMarks}
                          onChange={(e) => {
                            const next = [...modalComponents];
                            next[idx].fullMarks = e.target.value;
                            setModalComponents(next);
                          }}
                          className="w-full p-1 border rounded text-xs"
                          required
                        />
                      </div>
                      <div className="w-20">
                        <label className="text-[10px] text-slate-500 font-medium">Pass</label>
                        <input
                          type="number"
                          value={comp.passMarks}
                          onChange={(e) => {
                            const next = [...modalComponents];
                            next[idx].passMarks = e.target.value;
                            setModalComponents(next);
                          }}
                          className="w-full p-1 border rounded text-xs"
                          required
                        />
                      </div>
                      <div className="flex-1 flex items-center pt-3 pl-1">
                        <label className="flex items-center space-x-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={comp.isMandatoryPass}
                            onChange={(e) => {
                              const next = [...modalComponents];
                              next[idx].isMandatoryPass = e.target.checked;
                              setModalComponents(next);
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-[11px] text-slate-600">Must Pass</span>
                        </label>
                      </div>
                      {modalComponents.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveComponentRow(idx)}
                          className="p-1 hover:bg-rose-100 rounded text-slate-400 hover:text-rose-600 mt-3 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddComponentRow}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center space-x-1 pt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Component (e.g. PRACTICAL, CA)</span>
                </button>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-100 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center space-x-1.5 shadow-sm transition-colors"
                >
                  {modalSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Update Configuration</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Exam Instance Modal */}
      {showEditExamModal && editingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Edit Examination Instance
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Modify title, exam type, or target class for this examination.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditExamModal(false);
                  setEditingExam(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditExam} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Exam Title *
                </label>
                <input
                  type="text"
                  value={editExamName}
                  onChange={(e) => setEditExamName(e.target.value)}
                  placeholder="e.g. 1st Semester Exam 2026"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Session *
                  </label>
                  <select
                    value={editSession}
                    onChange={(e) => setEditSession(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-900"
                    required
                  >
                    <option value="">-- Select Session --</option>
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.yearName}>
                        {ay.yearName}{ay.isCurrent ? " (Current)" : ""}
                      </option>
                    ))}
                    {academicYears.length === 0 && (
                      <option value="2026">2026 (Current)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Target Class *
                  </label>
                  <select
                    value={editExamClassId}
                    onChange={(e) => setEditExamClassId(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-900"
                    required
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Exam Type *
                </label>
                <select
                  value={editExamType}
                  onChange={(e) => {
                    setEditExamType(e.target.value);
                    if (e.target.value !== "Other") {
                      setEditCustomExamType("");
                    }
                  }}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-900"
                  required
                >
                  <option value="Semester">Semester</option>
                  <option value="Class Test">Class Test</option>
                  <option value="Other">Other</option>
                </select>
                {editExamType === "Other" && (
                  <input
                    type="text"
                    placeholder="Type custom exam type (e.g. Model Test, Pre-Test)"
                    value={editCustomExamType}
                    onChange={(e) => setEditCustomExamType(e.target.value)}
                    className="w-full mt-2 p-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30 text-slate-800 text-xs font-medium"
                    required
                  />
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditExamModal(false);
                    setEditingExam(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-300 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editExamSaving || !editExamName}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  {editExamSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Exam Confirmation Modal */}
      {examToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-red-200 w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-5 text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Delete Examination?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-900">&ldquo;{examToDelete.name}&rdquo;</strong>?
                This will permanently remove this exam instance, its subject configurations, and any student marks associated with it.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setExamToDelete(null)}
                disabled={deleteExamLoading}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/70 border border-slate-300 font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteExam}
                disabled={deleteExamLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                {deleteExamLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

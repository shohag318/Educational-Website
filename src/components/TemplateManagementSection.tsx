"use client";

import React, { useState, useEffect, useMemo } from "react";
import { SessionSelect } from "@/components/SessionSelect";
import {
  Layers,
  Plus,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  Search,
  Check,
  X,
  Pencil,
  Trash2,
  Copy,
  ArrowRight,
  Sparkles,
  Sliders,
  BookOpen,
  Calendar,
  Send,
  HelpCircle,
  AlertCircle,
  FileSpreadsheet,
  ExternalLink,
} from "lucide-react";

export interface TemplateItemInput {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  groupType?: string;
  totalMarks: number;
  passMarks: number;
  cqMarks: number;
  mcqMarks: number;
  practicalMarks: number;
}

export interface DbAssessmentTemplate {
  id: string;
  institutionId: string;
  name: string;
  classId: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  class?: {
    id: string;
    name: string;
    numericValue: number;
  };
  items: {
    id: string;
    templateId: string;
    subjectId: string;
    totalMarks: number;
    passMarks: number;
    cqMarks: number;
    mcqMarks: number;
    practicalMarks: number;
    subject: {
      id: string;
      name: string;
      subjectCode: string;
    };
  }[];
}

interface TemplateManagementSectionProps {
  classes: any[];
  allSubjects: any[];
  exams: any[];
  onTemplateAppliedToExam?: (examId: string) => void;
}

export function TemplateManagementSection({
  classes,
  allSubjects,
  exams,
  onTemplateAppliedToExam,
}: TemplateManagementSectionProps) {
  // Database templates state
  const [templates, setTemplates] = useState<DbAssessmentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal / Builder State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Form State: 1. Basic Info
  const [templateName, setTemplateName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");

  // Form State: 2. Subject Selection
  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  const [fetchingClassSubjects, setFetchingClassSubjects] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");

  // Form State: 3. Marks Distribution (Total | Pass | CQ | MCQ | Practical)
  const [distributionMap, setDistributionMap] = useState<Record<string, TemplateItemInput>>({});
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Apply to Exam Modal
  const [applyModalTemplate, setApplyModalTemplate] = useState<DbAssessmentTemplate | null>(null);
  const [targetExamId, setTargetExamId] = useState("");
  const [applyingTemplate, setApplyingTemplate] = useState(false);

  // Quick Preset Helper
  const [quickPresetType, setQuickPresetType] = useState<"standard100" | "science100" | "half50" | "ict50">("standard100");

  // Fetch all templates from API
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rules/templates");
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data || []);
      }
    } catch (e) {
      console.error("Failed to load templates", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // When class changes in the builder, fetch the subjects of that class
  useEffect(() => {
    if (!selectedClassId) {
      setClassSubjects([]);
      return;
    }

    setFetchingClassSubjects(true);
    fetch(`/api/subjects?classId=${selectedClassId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) {
          setClassSubjects(d.data);
        } else {
          setClassSubjects([]);
        }
      })
      .catch(() => {
        setClassSubjects([]);
      })
      .finally(() => {
        setFetchingClassSubjects(false);
      });
  }, [selectedClassId]);

  // Open Builder for creating a new template
  const handleOpenCreateModal = () => {
    setEditingTemplateId(null);
    setTemplateName("");
    const defaultClassId = classes.length > 0 ? classes[0].id : "";
    setSelectedClassId(defaultClassId);
    setTemplateDesc("");
    setSelectedSubjectIds([]);
    setDistributionMap({});
    setIsModalOpen(true);
  };

  // Open Builder for editing an existing template
  const handleOpenEditModal = (tpl: DbAssessmentTemplate) => {
    setEditingTemplateId(tpl.id);
    setTemplateName(tpl.name);
    setSelectedClassId(tpl.classId);
    setTemplateDesc(tpl.description || "");

    const subjectIds: string[] = [];
    const dist: Record<string, TemplateItemInput> = {};

    for (const item of tpl.items) {
      subjectIds.push(item.subjectId);
      dist[item.subjectId] = {
        subjectId: item.subjectId,
        subjectName: item.subject.name,
        subjectCode: item.subject.subjectCode,
        totalMarks: item.totalMarks,
        passMarks: item.passMarks,
        cqMarks: item.cqMarks,
        mcqMarks: item.mcqMarks,
        practicalMarks: item.practicalMarks,
      };
    }

    setSelectedSubjectIds(subjectIds);
    setDistributionMap(dist);
    setIsModalOpen(true);
  };

  // Toggle subject selection
  const handleToggleSubject = (subject: any) => {
    const isSelected = selectedSubjectIds.includes(subject.id);
    if (isSelected) {
      // Remove
      setSelectedSubjectIds((prev) => prev.filter((id) => id !== subject.id));
      setDistributionMap((prev) => {
        const next = { ...prev };
        delete next[subject.id];
        return next;
      });
    } else {
      // Add with default distribution
      setSelectedSubjectIds((prev) => [...prev, subject.id]);
      setDistributionMap((prev) => {
        // Smart defaults based on subject name
        const isScience = /physics|chemistry|biology|science|higher math/i.test(subject.name || "");
        const is50 = /ict|information|religion|islam|hindu|buddhist|christian|agriculture/i.test(subject.name || "");

        let total = 100;
        let pass = 33;
        let cq = 70;
        let mcq = 30;
        let practical = 0;

        if (isScience) {
          total = 100;
          pass = 33;
          cq = 50;
          mcq = 25;
          practical = 25;
        } else if (is50) {
          total = 50;
          pass = 17;
          cq = 25;
          mcq = 15;
          practical = 10;
        }

        return {
          ...prev,
          [subject.id]: {
            subjectId: subject.id,
            subjectName: subject.name,
            subjectCode: subject.subjectCode,
            groupType: subject.groupType,
            totalMarks: total,
            passMarks: pass,
            cqMarks: cq,
            mcqMarks: mcq,
            practicalMarks: practical,
          },
        };
      });
    }
  };

  // Select all filtered subjects
  const handleSelectAllFiltered = (filteredList: any[]) => {
    const allFilteredIds = filteredList.map((s) => s.id);
    const areAllSelected = allFilteredIds.every((id) => selectedSubjectIds.includes(id));

    if (areAllSelected) {
      // Deselect filtered
      setSelectedSubjectIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
      setDistributionMap((prev) => {
        const next = { ...prev };
        for (const id of allFilteredIds) {
          delete next[id];
        }
        return next;
      });
    } else {
      // Select all filtered
      const newSubjectIds = Array.from(new Set([...selectedSubjectIds, ...allFilteredIds]));
      setSelectedSubjectIds(newSubjectIds);

      setDistributionMap((prev) => {
        const next = { ...prev };
        for (const sub of filteredList) {
          if (!next[sub.id]) {
            const isScience = /physics|chemistry|biology|science|higher math/i.test(sub.name || "");
            const is50 = /ict|information|religion|agriculture/i.test(sub.name || "");
            let total = 100;
            let pass = 33;
            let cq = 70;
            let mcq = 30;
            let practical = 0;

            if (isScience) {
              total = 100;
              pass = 33;
              cq = 50;
              mcq = 25;
              practical = 25;
            } else if (is50) {
              total = 50;
              pass = 17;
              cq = 25;
              mcq = 15;
              practical = 10;
            }

            next[sub.id] = {
              subjectId: sub.id,
              subjectName: sub.name,
              subjectCode: sub.subjectCode,
              groupType: sub.groupType,
              totalMarks: total,
              passMarks: pass,
              cqMarks: cq,
              mcqMarks: mcq,
              practicalMarks: practical,
            };
          }
        }
        return next;
      });
    }
  };

  // Update a single mark value for a subject
  const handleUpdateMarkField = (
    subjectId: string,
    field: "totalMarks" | "passMarks" | "cqMarks" | "mcqMarks" | "practicalMarks",
    rawVal: string
  ) => {
    const val = rawVal === "" ? 0 : parseFloat(rawVal) || 0;
    setDistributionMap((prev) => {
      const current = prev[subjectId];
      if (!current) return prev;
      return {
        ...prev,
        [subjectId]: {
          ...current,
          [field]: val,
        },
      };
    });
  };

  // Apply Quick Preset to all selected subjects
  const handleApplyPresetToAll = (type: "standard100" | "science100" | "half50" | "ict50") => {
    setDistributionMap((prev) => {
      const next = { ...prev };
      for (const subId of selectedSubjectIds) {
        if (!next[subId]) continue;
        if (type === "standard100") {
          next[subId] = { ...next[subId], totalMarks: 100, passMarks: 33, cqMarks: 70, mcqMarks: 30, practicalMarks: 0 };
        } else if (type === "science100") {
          next[subId] = { ...next[subId], totalMarks: 100, passMarks: 33, cqMarks: 50, mcqMarks: 25, practicalMarks: 25 };
        } else if (type === "half50") {
          next[subId] = { ...next[subId], totalMarks: 50, passMarks: 17, cqMarks: 35, mcqMarks: 15, practicalMarks: 0 };
        } else if (type === "ict50") {
          next[subId] = { ...next[subId], totalMarks: 50, passMarks: 17, cqMarks: 25, mcqMarks: 15, practicalMarks: 10 };
        }
      }
      return next;
    });
  };

  // Filter subjects in selection box
  const filteredClassSubjects = useMemo(() => {
    if (!subjectSearchQuery.trim()) return classSubjects;
    const q = subjectSearchQuery.toLowerCase();
    return classSubjects.filter(
      (s) => (s.name || "").toLowerCase().includes(q) || (s.subjectCode || "").toLowerCase().includes(q)
    );
  }, [classSubjects, subjectSearchQuery]);

  // Overall check: Is every selected subject balanced (CQ + MCQ + Practical === Total)?
  const rowValidationStatuses = useMemo(() => {
    const statuses: Record<
      string,
      { isBalanced: boolean; sum: number; total: number; diff: number; isPassValid: boolean }
    > = {};

    for (const subId of selectedSubjectIds) {
      const row = distributionMap[subId];
      if (!row) continue;
      const sum = Number(row.cqMarks || 0) + Number(row.mcqMarks || 0) + Number(row.practicalMarks || 0);
      const total = Number(row.totalMarks || 0);
      const isBalanced = Math.abs(sum - total) < 0.01;
      const diff = sum - total;
      const isPassValid = Number(row.passMarks || 0) <= total && Number(row.passMarks || 0) >= 0;

      statuses[subId] = { isBalanced, sum, total, diff, isPassValid };
    }

    return statuses;
  }, [selectedSubjectIds, distributionMap]);

  const allRowsBalanced = useMemo(() => {
    if (selectedSubjectIds.length === 0) return false;
    return selectedSubjectIds.every((id) => rowValidationStatuses[id]?.isBalanced);
  }, [selectedSubjectIds, rowValidationStatuses]);

  const unbalancedCount = useMemo(() => {
    return selectedSubjectIds.filter((id) => !rowValidationStatuses[id]?.isBalanced).length;
  }, [selectedSubjectIds, rowValidationStatuses]);

  // Save Template (POST or PUT to database)
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateName.trim()) {
      alert("Please provide a Template Name.");
      return;
    }

    if (!selectedClassId) {
      alert("Please select a Class.");
      return;
    }

    if (selectedSubjectIds.length === 0) {
      alert("Please select at least one subject.");
      return;
    }

    if (!allRowsBalanced) {
      alert(
        `Validation Warning: For ${unbalancedCount} subject(s), CQ + MCQ + Practical does not equal Total Marks!\nPlease balance all marks before saving.`
      );
      return;
    }

    const itemsPayload = selectedSubjectIds.map((subId) => {
      const row = distributionMap[subId];
      return {
        subjectId: subId,
        subjectName: row.subjectName,
        totalMarks: row.totalMarks,
        passMarks: row.passMarks,
        cqMarks: row.cqMarks,
        mcqMarks: row.mcqMarks,
        practicalMarks: row.practicalMarks,
      };
    });

    setSavingTemplate(true);
    try {
      const endpoint = "/api/rules/templates";
      const method = editingTemplateId ? "PUT" : "POST";
      const bodyPayload: any = {
        name: templateName.trim(),
        classId: selectedClassId,
        description: templateDesc.trim() || undefined,
        items: itemsPayload,
      };

      if (editingTemplateId) {
        bodyPayload.id = editingTemplateId;
      }

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg({
          type: "success",
          text: editingTemplateId
            ? `Template "${templateName}" updated successfully in database!`
            : `Assessment template "${templateName}" saved successfully in database!`,
        });
        setIsModalOpen(false);
        fetchTemplates();
      } else {
        alert(`Error: ${data.error || "Failed to save template."}`);
      }
    } catch (err: any) {
      console.error("Save template error:", err);
      alert("Server error: Failed to save template.");
    } finally {
      setSavingTemplate(false);
    }
  };

  // Delete Template from database
  const handleDeleteTemplate = async (tpl: DbAssessmentTemplate) => {
    if (
      !window.confirm(
        `Are you sure you want to delete template "${tpl.name}" from database? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/rules/templates?id=${tpl.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({
          type: "success",
          text: `Template "${tpl.name}" deleted from database.`,
        });
        fetchTemplates();
      } else {
        alert(data.error || "Failed to delete template");
      }
    } catch (e) {
      console.error(e);
      alert("Server communication error");
    }
  };

  // Duplicate / Clone Template
  const handleDuplicateTemplate = (tpl: DbAssessmentTemplate) => {
    setEditingTemplateId(null);
    setTemplateName(`${tpl.name} (Copy)`);
    setSelectedClassId(tpl.classId);
    setTemplateDesc(tpl.description || "");

    const subjectIds: string[] = [];
    const dist: Record<string, TemplateItemInput> = {};

    for (const item of tpl.items) {
      subjectIds.push(item.subjectId);
      dist[item.subjectId] = {
        subjectId: item.subjectId,
        subjectName: item.subject.name,
        subjectCode: item.subject.subjectCode,
        totalMarks: item.totalMarks,
        passMarks: item.passMarks,
        cqMarks: item.cqMarks,
        mcqMarks: item.mcqMarks,
        practicalMarks: item.practicalMarks,
      };
    }

    setSelectedSubjectIds(subjectIds);
    setDistributionMap(dist);
    setIsModalOpen(true);
  };

  // Open "Apply Template to Exam" Modal
  const handleOpenApplyModal = (tpl: DbAssessmentTemplate) => {
    setApplyModalTemplate(tpl);
    // Auto-select first exam that matches this template's class
    const match = exams.find((e) => e.classId === tpl.classId);
    setTargetExamId(match ? match.id : exams[0]?.id || "");
  };

  // Execute Apply Template to Exam
  const handleExecuteApplyToExam = async () => {
    if (!applyModalTemplate || !targetExamId) return;

    setApplyingTemplate(true);
    try {
      const res = await fetch("/api/rules/templates/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: applyModalTemplate.id,
          examId: targetExamId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg({
          type: "success",
          text: data.message || "Template marks distribution applied successfully to exam!",
        });
        setApplyModalTemplate(null);
        if (onTemplateAppliedToExam) {
          onTemplateAppliedToExam(targetExamId);
        }
      } else {
        alert(data.error || "Failed to apply template");
      }
    } catch (e) {
      console.error(e);
      alert("Server error while applying template");
    } finally {
      setApplyingTemplate(false);
    }
  };

  // Filter saved templates for the grid list
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchClass = classFilter === "ALL" || tpl.classId === classFilter;
      const matchSession =
        sessionFilter === "ALL" ||
        exams.some(
          (e) =>
            e.classId === tpl.classId &&
            (e.academicYear?.yearName === sessionFilter || (e.name && e.name.includes(sessionFilter)))
        ) ||
        tpl.name.includes(sessionFilter);

      const q = templateSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        tpl.name.toLowerCase().includes(q) ||
        (tpl.class?.name || "").toLowerCase().includes(q) ||
        tpl.items.some(
          (i) =>
            i.subject.name.toLowerCase().includes(q) ||
            i.subject.subjectCode.toLowerCase().includes(q)
        );
      return matchClass && matchSession && matchSearch;
    });
  }, [templates, classFilter, sessionFilter, templateSearch, exams]);

  const selectedClassObj = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      {/* Step 1 Header Banner */}
      <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs">
              <Bookmark className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white tracking-wide uppercase">
                  Step 1
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Template Management &amp; Design Engine
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Select class and subjects to configure marks distribution (Total, Pass, CQ, MCQ, Practical) and save reusable assessment templates.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: 1. Add New Template */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-2 shadow-md hover:shadow-lg transition-all cursor-pointer ring-2 ring-emerald-400/30"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Template</span>
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMsg && (
        <div
          className={`p-3.5 border-b flex items-center justify-between text-xs font-semibold ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Template Filter & Search Toolbar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl">
          {/* Session Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-600">Session:</span>
            <SessionSelect
              value={sessionFilter}
              onChange={setSessionFilter}
              label=""
              includeAll={true}
              allLabel="All Sessions"
              activeOnly={false}
              selectClassName="p-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-600">Class:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="p-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Classes ({templates.length})</option>
              {classes.map((cls) => {
                const count = templates.filter((t) => t.classId === cls.id).length;
                return (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              placeholder="Search templates by name, class, or subject..."
              className="w-full p-1.5 pl-7 pr-6 border border-slate-200 rounded-lg bg-white text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
            {templateSearch && (
              <button
                type="button"
                onClick={() => setTemplateSearch("")}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center space-x-2">
          <span className="font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200">
            {filteredTemplates.length} Saved Template{filteredTemplates.length === 1 ? "" : "s"} in DB
          </span>
        </div>
      </div>

      {/* Saved Database Templates Grid */}
      <div className="p-5">
        {loading ? (
          <div className="py-12 text-center text-slate-400 italic text-xs">
            Loading database assessment templates...
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3 bg-slate-50/50">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Bookmark className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-sm">No Assessment Templates Saved in Database</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click <strong>&quot;Create Template&quot;</strong> above to select a class, pick subjects, and configure CQ, MCQ, and Practical marks distribution.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl inline-flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Template</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="border border-slate-200 hover:border-emerald-300 bg-white rounded-xl shadow-2xs hover:shadow-sm transition-all p-4 flex flex-col justify-between space-y-3"
              >
                {/* Template Title & Class Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                        <Bookmark className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="line-clamp-1">{tpl.name}</span>
                      </h4>
                      <div className="flex items-center space-x-1.5 mt-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {tpl.class?.name || "All Classes"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {tpl.items.length} Subject{tpl.items.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(tpl)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Template"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateTemplate(tpl)}
                        className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Duplicate Template"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl)}
                        className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {tpl.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                      {tpl.description}
                    </p>
                  )}

                  {/* Subject Breakdown Preview Chips */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Subjects &amp; Marks Distribution:
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                      {tpl.items.slice(0, 6).map((item) => (
                        <div
                          key={item.id}
                          className="px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] font-medium text-slate-700 flex items-center space-x-1"
                        >
                          <span className="font-semibold">{item.subject.name}:</span>
                          <span className="font-mono text-slate-900 font-bold">{item.totalMarks}M</span>
                          <span className="text-slate-400 text-[9px]">
                            ({item.cqMarks} CQ + {item.mcqMarks} MCQ{item.practicalMarks > 0 ? ` + ${item.practicalMarks} Prac` : ""})
                          </span>
                        </div>
                      ))}
                      {tpl.items.length > 6 && (
                        <span className="text-[10px] text-slate-400 font-medium py-1 px-1">
                          +{tpl.items.length - 6} more subjects
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">
                    Saved in DB
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenApplyModal(tpl)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-emerald-200"
                  >
                    <Send className="w-3 h-3" />
                    <span>Apply to Exam</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT ASSESSMENT TEMPLATE WIZARD */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <span className="p-1.5 bg-white/20 rounded-lg">
                  <Bookmark className="w-5 h-5 text-white" />
                </span>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">
                    {editingTemplateId ? "Edit Assessment Template" : "Create Assessment Template"}
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Step 1: Set Template Name &amp; Class &rarr; Select Subjects &rarr; Distribute CQ + MCQ + Practical &rarr; Save to Database.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <form onSubmit={handleSaveTemplate} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
              {/* ================================================================== */}
              {/* 1. Basic Info: Template Name & Class Dropdown */}
              {/* ================================================================== */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px]">
                    1
                  </span>
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                    Basic Information
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Template Name */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Template Name <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g. Class 10 SSC Model Exam, Class 9 Annual Exam 2026..."
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900 bg-white text-xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Give a meaningful template name to easily identify and reuse across examinations.
                    </span>
                  </div>

                  {/* Class Dropdown */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Class <span className="text-red-500">*</span>:
                    </label>
                    <select
                      required
                      value={selectedClassId}
                      onChange={(e) => {
                        const newClassId = e.target.value;
                        setSelectedClassId(newClassId);
                        // Reset subject selections for safety
                        setSelectedSubjectIds([]);
                        setDistributionMap({});
                      }}
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 bg-white text-xs cursor-pointer"
                    >
                      <option value="">-- Select Class from Dropdown --</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} (Class {cls.numericValue || cls.name})
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Selecting a class automatically loads only the subjects mapped to that class.
                    </span>
                  </div>
                </div>
              </div>

              {/* ================================================================== */}
              {/* 2. Subject Selection: Checklist of subjects for that class */}
              {/* ================================================================== */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px]">
                      2
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                        Subject Selection
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Choose one or more subjects from the checklist of {selectedClassObj ? selectedClassObj.name : "the selected class"}.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {selectedSubjectIds.length} Subject{selectedSubjectIds.length === 1 ? "" : "s"} Selected
                    </span>

                    <button
                      type="button"
                      onClick={() => handleSelectAllFiltered(filteredClassSubjects)}
                      disabled={filteredClassSubjects.length === 0}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 hover:border-emerald-500 bg-white font-semibold text-slate-700 hover:text-emerald-700 cursor-pointer shadow-2xs"
                    >
                      {filteredClassSubjects.length > 0 &&
                      filteredClassSubjects.every((s) => selectedSubjectIds.includes(s.id))
                        ? "Deselect All"
                        : `Select All (${filteredClassSubjects.length})`}
                    </button>
                  </div>
                </div>

                {/* Quick Subject Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={subjectSearchQuery}
                    onChange={(e) => setSubjectSearchQuery(e.target.value)}
                    placeholder="Search subject by name or code (e.g. Bangla, 101, Math, Physics)..."
                    className="w-full p-2 pl-8 pr-6 border border-slate-300 rounded-lg bg-white text-xs"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  {subjectSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setSubjectSearchQuery("")}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Subject Checklist Grid */}
                <div className="border border-slate-200 rounded-lg p-2.5 bg-white max-h-52 overflow-y-auto">
                  {fetchingClassSubjects ? (
                    <div className="py-6 text-center text-slate-400 italic">
                      Loading subjects for {selectedClassObj?.name || "class"}...
                    </div>
                  ) : filteredClassSubjects.length === 0 ? (
                    <div className="py-6 px-4 text-center space-y-2 bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
                      <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-700">
                          No subjects are mapped to {selectedClassObj?.name || "this class"}.
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                          Only subjects assigned to {selectedClassObj?.name || "this class"} are shown here. Please map subjects for this class under Setup.
                        </p>
                      </div>
                      {selectedClassId && (
                        <div className="pt-1">
                          <a
                            href={`/setup/subject-mapping?classId=${selectedClassId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs cursor-pointer"
                          >
                            <span>Map Subjects for {selectedClassObj?.name || "this Class"}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {filteredClassSubjects.map((sub) => {
                        const isChecked = selectedSubjectIds.includes(sub.id);
                        return (
                          <label
                            key={sub.id}
                            className={`flex items-start space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition-all select-none ${
                              isChecked
                                ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-medium shadow-2xs ring-1 ring-emerald-300"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSubject(sub)}
                              className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate font-semibold">{sub.name}</span>
                                <span className="font-mono text-slate-400 text-[10px] shrink-0">
                                  ({sub.subjectCode})
                                </span>
                              </div>
                              {sub.groupType && sub.groupType !== "ALL" && sub.groupType !== "GENERAL" && (
                                <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-100 text-blue-800">
                                  {sub.groupType}
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ================================================================== */}
              {/* 3. Marks Distribution: Total | Pass | CQ | MCQ | Practical */}
              {/* (Validates CQ + MCQ + Practical == Total) */}
              {/* ================================================================== */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px]">
                      3
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                        Marks Distribution
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Configure marks distribution for each selected subject:{" "}
                        <strong className="text-slate-800 font-mono">Total | Pass | CQ | MCQ | Practical</strong>
                      </p>
                    </div>
                  </div>

                  {/* Fast 1-Click Presets for All Selected */}
                  {selectedSubjectIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[11px] font-semibold text-slate-600 hidden sm:inline">
                        Quick Preset:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetToAll("standard100")}
                        className="px-2 py-1 rounded bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 font-medium text-[11px] shadow-2xs cursor-pointer"
                        title="Set 100M: 70 CQ + 30 MCQ, Pass 33"
                      >
                        100M Standard (70+30)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetToAll("science100")}
                        className="px-2 py-1 rounded bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 font-medium text-[11px] shadow-2xs cursor-pointer"
                        title="Set 100M: 50 CQ + 25 MCQ + 25 Practical, Pass 33"
                      >
                        100M Science (50+25+25)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetToAll("half50")}
                        className="px-2 py-1 rounded bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 font-medium text-[11px] shadow-2xs cursor-pointer"
                        title="Set 50M: 35 CQ + 15 MCQ, Pass 17"
                      >
                        50M (35+15)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetToAll("ict50")}
                        className="px-2 py-1 rounded bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 font-medium text-[11px] shadow-2xs cursor-pointer"
                        title="Set 50M ICT: 25 CQ + 15 MCQ + 10 Practical, Pass 17"
                      >
                        50M ICT (25+15+10)
                      </button>
                    </div>
                  )}
                </div>

                {selectedSubjectIds.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 italic bg-white rounded-lg border border-slate-200">
                    Select one or more subjects from Step 2 above. Marks distribution fields will automatically appear here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Live Validation Overall Bar */}
                    <div
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                        allRowsBalanced
                          ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                          : "bg-amber-50 border-amber-300 text-amber-950"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {allRowsBalanced ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        )}
                        <div>
                          <p className="font-bold text-xs">
                            {allRowsBalanced
                              ? `Automatic Validation Passed: All (${selectedSubjectIds.length}) subjects have balanced marks (CQ + MCQ + Practical = Total)!`
                              : `Automatic Validation Warning: ${unbalancedCount} subject(s) have marks mismatch (CQ + MCQ + Practical does not equal Total)!`}
                          </p>
                          <p className="text-[11px] opacity-80 mt-0.5">
                            Rule: Total Marks = CQ + MCQ + Practical. The system validates sums in real-time.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Marks Distribution Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                            <tr>
                              <th className="p-3 w-1/4">Subject</th>
                              <th className="p-3 text-center w-24">Total</th>
                              <th className="p-3 text-center w-24">Pass</th>
                              <th className="p-3 text-center w-24">CQ</th>
                              <th className="p-3 text-center w-24">MCQ</th>
                              <th className="p-3 text-center w-24">Practical</th>
                              <th className="p-3 text-left">Automatic Check (CQ+MCQ+Prac)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedSubjectIds.map((subId) => {
                              const row = distributionMap[subId];
                              if (!row) return null;
                              const status = rowValidationStatuses[subId] || {
                                isBalanced: false,
                                sum: 0,
                                total: 0,
                                diff: 0,
                                isPassValid: true,
                              };

                              return (
                                <tr
                                  key={subId}
                                  className={`transition-colors ${
                                    status.isBalanced
                                      ? "hover:bg-slate-50/80"
                                      : "bg-red-50/40 hover:bg-red-50/70"
                                  }`}
                                >
                                  {/* Subject Name */}
                                  <td className="p-3">
                                    <div className="font-bold text-slate-900">{row.subjectName}</div>
                                    <div className="text-[10px] font-mono text-slate-400">
                                      Code: <span className="font-semibold text-slate-600">{row.subjectCode}</span>
                                    </div>
                                  </td>

                                  {/* Total Marks */}
                                  <td className="p-3 text-center">
                                    <input
                                      type="number"
                                      min={0}
                                      max={500}
                                      value={row.totalMarks}
                                      onChange={(e) =>
                                        handleUpdateMarkField(subId, "totalMarks", e.target.value)
                                      }
                                      className={`w-20 p-1.5 text-center font-bold font-mono text-slate-900 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white ${
                                        !status.isBalanced ? "border-amber-400 bg-amber-50/30" : "border-slate-300"
                                      }`}
                                    />
                                  </td>

                                  {/* Pass Marks */}
                                  <td className="p-3 text-center">
                                    <input
                                      type="number"
                                      min={0}
                                      max={row.totalMarks}
                                      value={row.passMarks}
                                      onChange={(e) =>
                                        handleUpdateMarkField(subId, "passMarks", e.target.value)
                                      }
                                      className="w-20 p-1.5 text-center font-bold font-mono text-emerald-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                                    />
                                  </td>

                                  {/* CQ Marks */}
                                  <td className="p-3 text-center">
                                    <input
                                      type="number"
                                      min={0}
                                      max={row.totalMarks}
                                      value={row.cqMarks}
                                      onChange={(e) =>
                                        handleUpdateMarkField(subId, "cqMarks", e.target.value)
                                      }
                                      className="w-20 p-1.5 text-center font-bold font-mono text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                                    />
                                  </td>

                                  {/* MCQ Marks */}
                                  <td className="p-3 text-center">
                                    <input
                                      type="number"
                                      min={0}
                                      max={row.totalMarks}
                                      value={row.mcqMarks}
                                      onChange={(e) =>
                                        handleUpdateMarkField(subId, "mcqMarks", e.target.value)
                                      }
                                      className="w-20 p-1.5 text-center font-bold font-mono text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                                    />
                                  </td>

                                  {/* Practical Marks */}
                                  <td className="p-3 text-center">
                                    <input
                                      type="number"
                                      min={0}
                                      max={row.totalMarks}
                                      value={row.practicalMarks}
                                      onChange={(e) =>
                                        handleUpdateMarkField(subId, "practicalMarks", e.target.value)
                                      }
                                      className="w-20 p-1.5 text-center font-bold font-mono text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                                    />
                                  </td>

                                  {/* Real-time Sum Check */}
                                  <td className="p-3">
                                    {status.isBalanced ? (
                                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-[11px]">
                                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                        <span>
                                          Balanced ({row.cqMarks} + {row.mcqMarks} + {row.practicalMarks} = {row.totalMarks})
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 font-bold text-[11px]">
                                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                        <span>
                                          Mismatch: {status.sum} &ne; {status.total} (
                                          {status.diff > 0 ? `+${status.diff} Excess` : `${status.diff} Short`})
                                        </span>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ================================================================== */}
              {/* 5. Save Button (Saves to Database) */}
              {/* ================================================================== */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="text-[11px] text-slate-500">
                  {selectedSubjectIds.length > 0 && (
                    <span>
                      {selectedSubjectIds.length} subjects configured &bull;{" "}
                      {allRowsBalanced ? (
                        <strong className="text-emerald-700">All marks validated and balanced</strong>
                      ) : (
                        <strong className="text-red-600">Please balance all subject marks</strong>
                      )}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingTemplate || selectedSubjectIds.length === 0 || !allRowsBalanced}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md ${
                      savingTemplate || selectedSubjectIds.length === 0 || !allRowsBalanced
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 hover:shadow-lg"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {savingTemplate
                        ? "Saving to Database..."
                        : editingTemplateId
                        ? "Update Template in Database"
                        : "Save Template to Database"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APPLY TEMPLATE TO AN EXAM */}
      {/* ========================================================================= */}
      {applyModalTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-white" />
                <h3 className="font-bold text-sm">Apply Template to Exam</h3>
              </div>
              <button
                type="button"
                onClick={() => setApplyModalTemplate(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Selected Template:</span>
                <p className="font-bold text-slate-900 text-sm">{applyModalTemplate.name}</p>
                <p className="text-[11px] text-slate-500">
                  Class: <strong>{applyModalTemplate.class?.name}</strong> &bull; {applyModalTemplate.items.length} Subjects included
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Exam:
                </label>
                <select
                  value={targetExamId}
                  onChange={(e) => setTargetExamId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900 bg-white"
                >
                  <option value="">-- Select Exam --</option>
                  {exams
                    .filter(
                      (ex) =>
                        sessionFilter === "ALL" ||
                        !ex.academicYear?.yearName ||
                        ex.academicYear?.yearName === sessionFilter
                    )
                    .map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} {ex.class?.name ? `(${ex.class.name})` : ""}
                      </option>
                    ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  This will configure CQ, MCQ, and Practical marks directly into the selected exam's subject logic in the database.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyModalTemplate(null)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteApplyToExam}
                  disabled={applyingTemplate || !targetExamId}
                  className={`px-4 py-2 rounded-lg font-bold text-white flex items-center space-x-1.5 shadow-sm ${
                    applyingTemplate || !targetExamId
                      ? "bg-slate-300 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{applyingTemplate ? "Applying..." : "Confirm & Apply to Exam"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

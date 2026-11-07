"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import { AppButton } from "@/components/button/app-button";
import { AppSelect, AppTextField, NoDataFound } from "@/components";
import { SessionSelect } from "@/components/SessionSelect";
import { ResultsNotice } from "@/sections/results/component/result-page-ui";
import {
  RulesFilterGrid,
  RulesSection,
} from "@/sections/academic/component/rules-section-ui";
import { examOptionLabel, joinOptionParts } from "@/sections/results/utils/select-options";
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
  Send,
  ExternalLink,
} from "@/components/iconify/lucide";

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
    <>
      {statusMsg ? (
        <Box sx={{ mb: 2 }}>
          <ResultsNotice severity={statusMsg.type === "success" ? "success" : "error"}>
            {statusMsg.text}
          </ResultsNotice>
        </Box>
      ) : null}

      <RulesSection
        title="Assessment templates"
        subtitle="Configure marks distribution for a class once, then reuse the template across exams."
        action={
          <AppButton
            type="button"
            variant="contained"
            color="primary"
            size="small"
            startIcon={<Plus size={16} />}
            onClick={handleOpenCreateModal}
          >
            Create template
          </AppButton>
        }
        toolbar={
          <RulesFilterGrid columns={3}>
            <SessionSelect
              value={sessionFilter}
              onChange={setSessionFilter}
              label="Session"
              includeAll
              allLabel="All Sessions"
              activeOnly={false}
              fullWidth
            />
            <AppSelect
              label="Class"
              value={classFilter}
              onChange={setClassFilter}
              options={[
                { value: "ALL", label: "All Classes" },
                ...classes.map((cls) => {
                  const count = templates.filter((t) => t.classId === cls.id).length;
                  return {
                    value: cls.id,
                    label: joinOptionParts(
                      cls.name,
                      `${count} ${count === 1 ? "template" : "templates"}`
                    ),
                  };
                }),
              ]}
            />
            <AppTextField
              label="Search"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              placeholder="Name, class, or subject"
              startIcon={<Search size={15} />}
            />
          </RulesFilterGrid>
        }
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
              Saved templates
            </Typography>
            <Chip
              size="small"
              label={filteredTemplates.length}
              sx={{ height: 22, fontWeight: 700, bgcolor: "primary.lighter", color: "primary.dark" }}
            />
          </Stack>

          {loading ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ py: 6, textAlign: "center", fontStyle: "italic" }}
            >
              Loading templates…
            </Typography>
          ) : filteredTemplates.length === 0 ? (
            <Stack spacing={2} sx={{ alignItems: "center", py: 2 }}>
              <NoDataFound />
              <AppButton
                type="button"
                variant="contained"
                color="primary"
                size="small"
                startIcon={<Plus size={16} />}
                onClick={handleOpenCreateModal}
              >
                Create your first template
              </AppButton>
            </Stack>
          ) : (
            <Box
              sx={{
                display: "grid",
                gap: 1.75,
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "repeat(3, minmax(0, 1fr))" },
              }}
            >
              {filteredTemplates.map((tpl) => (
                <Box
                  key={tpl.id}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    p: 2.25,
                    borderRadius: 2.5,
                    border: 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    transition: "border-color 160ms ease, box-shadow 160ms ease",
                    "&:hover": {
                      borderColor: "primary.light",
                      boxShadow: "0 6px 18px rgba(15, 23, 42, 0.05)",
                    },
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                        <Bookmark size={15} color="#059669" />
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            letterSpacing: "-0.01em",
                            lineHeight: 1.35,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {tpl.name}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap", mt: 1 }}>
                        <Chip
                          size="small"
                          label={tpl.class?.name || "All Classes"}
                          sx={{ height: 22, fontWeight: 600, fontSize: "0.7rem" }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, alignSelf: "center" }}>
                          {tpl.items.length} subject{tpl.items.length === 1 ? "" : "s"}
                        </Typography>
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={0.15} sx={{ flexShrink: 0 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEditModal(tpl)}
                        aria-label="Edit template"
                        sx={{ color: "text.secondary", "&:hover": { color: "primary.main", bgcolor: "primary.lighter" } }}
                      >
                        <Pencil size={14} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDuplicateTemplate(tpl)}
                        aria-label="Duplicate template"
                        sx={{ color: "text.secondary", "&:hover": { color: "info.main", bgcolor: "info.lighter" } }}
                      >
                        <Copy size={14} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteTemplate(tpl)}
                        aria-label="Delete template"
                        sx={{ color: "text.secondary", "&:hover": { color: "error.main", bgcolor: "error.lighter" } }}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </Stack>
                  </Stack>

                  {tpl.description ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 1.25,
                        fontSize: "0.78rem",
                        lineHeight: 1.45,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {tpl.description}
                    </Typography>
                  ) : null}

                  <Box sx={{ mt: 1.75, pt: 1.5, borderTop: 1, borderColor: "divider", flex: 1 }}>
                    <Typography
                      variant="overline"
                      sx={{ display: "block", mb: 1, color: "text.disabled", letterSpacing: "0.08em" }}
                    >
                      Marks preview
                    </Typography>
                    <Stack spacing={0.75}>
                      {tpl.items.slice(0, 4).map((item) => (
                        <Stack
                          key={item.id}
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: "baseline", justifyContent: "space-between" }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              color: "text.primary",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              minWidth: 0,
                            }}
                          >
                            {item.subject.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              flexShrink: 0,
                              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                              fontWeight: 600,
                              color: "text.secondary",
                            }}
                          >
                            {item.totalMarks} · {item.cqMarks}/{item.mcqMarks}
                            {item.practicalMarks > 0 ? `/${item.practicalMarks}` : ""}
                          </Typography>
                        </Stack>
                      ))}
                      {tpl.items.length > 4 ? (
                        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 500 }}>
                          +{tpl.items.length - 4} more
                        </Typography>
                      ) : null}
                    </Stack>
                  </Box>

                  <Box sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: "divider" }}>
                    <AppButton
                      type="button"
                      variant="soft"
                      color="primary"
                      size="small"
                      fullWidth
                      startIcon={<Send size={13} />}
                      onClick={() => handleOpenApplyModal(tpl)}
                    >
                      Apply to exam
                    </AppButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Stack>
      </RulesSection>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-[1.05rem] tracking-tight text-slate-900">
                  {editingTemplateId ? "Edit assessment template" : "Create assessment template"}
                </h3>
                <p className="text-[0.8rem] text-slate-500 mt-0.5 font-normal">
                  Name and class → subjects → CQ / MCQ / Practical → save
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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
                      <option value="">Select class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
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

                    <AppButton
                      type="button"
                      variant="outline"
                      size="small"
                      disabled={filteredClassSubjects.length === 0}
                      onClick={() => handleSelectAllFiltered(filteredClassSubjects)}
                    >
                      {filteredClassSubjects.length > 0 &&
                      filteredClassSubjects.every((s) => selectedSubjectIds.includes(s.id))
                        ? "Deselect All"
                        : `Select All (${filteredClassSubjects.length})`}
                    </AppButton>
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
                      <AppButton
                        type="button"
                        size="small"
                        variant="outline"
                        onClick={() => handleApplyPresetToAll("standard100")}
                        title="Set 100M: 70 CQ + 30 MCQ, Pass 33"
                      >
                        100M Standard (70+30)
                      </AppButton>
                      <AppButton
                        type="button"
                        size="small"
                        variant="outline"
                        onClick={() => handleApplyPresetToAll("science100")}
                        title="Set 100M: 50 CQ + 25 MCQ + 25 Practical, Pass 33"
                      >
                        100M Science (50+25+25)
                      </AppButton>
                      <AppButton
                        type="button"
                        size="small"
                        variant="outline"
                        onClick={() => handleApplyPresetToAll("half50")}
                        title="Set 50M: 35 CQ + 15 MCQ, Pass 17"
                      >
                        50M (35+15)
                      </AppButton>
                      <AppButton
                        type="button"
                        size="small"
                        variant="outline"
                        onClick={() => handleApplyPresetToAll("ict50")}
                        title="Set 50M ICT: 25 CQ + 15 MCQ + 10 Practical, Pass 17"
                      >
                        50M ICT (25+15+10)
                      </AppButton>
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
                  <AppButton
                    type="button"
                    variant="outline"
                    size="small"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </AppButton>
                  <AppButton
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<CheckCircle2 size={16} />}
                    loading={savingTemplate}
                    disabled={savingTemplate || selectedSubjectIds.length === 0 || !allRowsBalanced}
                  >
                    {savingTemplate
                      ? "Saving…"
                      : editingTemplateId
                      ? "Update template"
                      : "Save template"}
                  </AppButton>
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
        <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[1rem] tracking-tight text-slate-900">Apply template to exam</h3>
                <p className="text-[0.78rem] text-slate-500 mt-0.5">Push CQ, MCQ, and Practical marks into the exam.</p>
              </div>
              <button
                type="button"
                onClick={() => setApplyModalTemplate(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                <span className="text-[0.68rem] text-slate-400 font-semibold uppercase tracking-wider">Template</span>
                <p className="font-bold text-slate-900 text-[0.95rem] tracking-tight">{applyModalTemplate.name}</p>
                <p className="text-[0.78rem] text-slate-500">
                  {applyModalTemplate.class?.name} · {applyModalTemplate.items.length} subjects
                </p>
              </div>

              <AppSelect
                label="Target exam"
                value={targetExamId}
                onChange={setTargetExamId}
                options={[
                  { value: "", label: "Select exam" },
                  ...exams
                    .filter(
                      (ex) =>
                        sessionFilter === "ALL" ||
                        !ex.academicYear?.yearName ||
                        ex.academicYear?.yearName === sessionFilter
                    )
                    .map((ex) => ({
                      value: ex.id,
                      label: examOptionLabel(ex),
                    })),
                ]}
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <AppButton
                  type="button"
                  variant="outline"
                  size="small"
                  onClick={() => setApplyModalTemplate(null)}
                >
                  Cancel
                </AppButton>
                <AppButton
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<Check size={14} />}
                  loading={applyingTemplate}
                  disabled={applyingTemplate || !targetExamId}
                  onClick={handleExecuteApplyToExam}
                >
                  {applyingTemplate ? "Applying…" : "Apply to exam"}
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

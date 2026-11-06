"use client";

import { useEffect, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { AppButton } from "@/components/button/app-button";
import { AppSelect, AppTextField } from "@/components";
import { History, Save, Check } from "@/components/iconify/lucide";
import {
  ResultsPageShell,
  ResultsPageHeader,
  ResultsPanel,
  ResultsFilterCard,
  ResultsNotice,
} from "@/sections/results/component/result-page-ui";

export default function MarkAuditPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const [cqMark, setCqMark] = useState("");
  const [mcqMark, setMcqMark] = useState("");
  const [practicalMark, setPracticalMark] = useState("");
  const [auditReason, setAuditReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/exams")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setExams(data.data);
          setSelectedExamId(data.data[0].id);
        }
      });

    fetch("/api/subjects")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setSubjects(data.data);
          setSelectedSubjectId(data.data[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    const exam = exams.find((e) => e.id === selectedExamId);
    if (exam) {
      fetch(`/api/students?classId=${exam.classId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data.length > 0) {
            setStudents(data.data);
            setSelectedEnrollmentId(data.data[0].id);
          }
        });
    }
  }, [selectedExamId, exams]);

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !selectedSubjectId || !selectedEnrollmentId || !auditReason) {
      alert("Please fill all fields and provide an audit reason");
      return;
    }

    setSaving(true);
    try {
      const components: Record<string, number> = {};
      if (cqMark !== "") components["CQ"] = parseFloat(cqMark);
      if (mcqMark !== "") components["MCQ"] = parseFloat(mcqMark);
      if (practicalMark !== "") components["PRACTICAL"] = parseFloat(practicalMark);

      const res = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExamId,
          subjectId: selectedSubjectId,
          isOverride: true,
          auditReason,
          modifiedBy: "ADMIN_PRINCIPAL",
          entries: [
            {
              enrollmentId: selectedEnrollmentId,
              isAbsent: false,
              components,
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Override recorded in immutable audit log. Re-calculate results to update ranks.");
        setAuditReason("");
        setCqMark("");
        setMcqMark("");
        setPracticalMark("");
      } else {
        alert("Error: " + data.error);
      }
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResultsPageShell>
      <ResultsPageHeader heading="Mark Override & Audit" current="Mark Audit" />

      {successMsg ? (
        <ResultsNotice severity="success">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", width: 1 }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Check size={16} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {successMsg}
              </Typography>
            </Stack>
            <AppButton size="small" variant="contained" color="success" href="/results/review">
              Re-calculate Now
            </AppButton>
          </Stack>
        </ResultsNotice>
      ) : null}

      <ResultsFilterCard title="Who & which exam" columns={3}>
        <AppSelect
          label="Exam"
          value={selectedExamId}
          onChange={setSelectedExamId}
          options={exams.map((ex) => ({ value: ex.id, label: `${ex.name} (${ex.status})` }))}
        />

        <AppSelect
          label="Student"
          value={selectedEnrollmentId}
          onChange={setSelectedEnrollmentId}
          options={students.map((st) => ({
            value: st.id,
            label: `Roll #${st.classRoll} - ${st.student.firstName} ${st.student.lastName} (${st.student.studentIdNo})`,
          }))}
        />

        <AppSelect
          label="Subject"
          value={selectedSubjectId}
          onChange={setSelectedSubjectId}
          options={subjects.map((sub) => ({ value: sub.id, label: `${sub.name} (${sub.subjectCode})` }))}
        />
      </ResultsFilterCard>

      <ResultsPanel>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
          <History size={16} className="text-emerald-600" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Record Mark Override
          </Typography>
        </Stack>

        <form onSubmit={handleApplyOverride}>
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
              mb: 2,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: "grey.50",
              border: 1,
              borderColor: "divider",
            }}
          >
            <AppTextField
              label="New CQ Mark"
              type="number"
              placeholder="e.g. 55"
              value={cqMark}
              onChange={(e) => setCqMark(e.target.value)}
              slotProps={{ htmlInput: { step: 0.5 } }}
            />
            <AppTextField
              label="New MCQ Mark"
              type="number"
              placeholder="e.g. 24"
              value={mcqMark}
              onChange={(e) => setMcqMark(e.target.value)}
              slotProps={{ htmlInput: { step: 0.5 } }}
            />
            <AppTextField
              label="New Practical Mark"
              type="number"
              placeholder="e.g. 22"
              value={practicalMark}
              onChange={(e) => setPracticalMark(e.target.value)}
              slotProps={{ htmlInput: { step: 0.5 } }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <AppTextField
              label="Audit Reason & Justification (Required)"
              multiline
              rows={2}
              placeholder="e.g. Script re-evaluation requested by Head of Department. 5 marks added to CQ."
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              required
            />
          </Box>

          <AppButton
            type="submit"
            variant="contained"
            color="secondary"
            fullWidth
            startIcon={<Save size={16} />}
            loading={saving}
          >
            {saving ? "Recording Override..." : "Save Override with Audit Trail"}
          </AppButton>
        </form>
      </ResultsPanel>
    </ResultsPageShell>
  );
}

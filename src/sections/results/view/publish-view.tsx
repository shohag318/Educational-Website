"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { ShieldCheck, Lock, Unlock } from "@/components/iconify/lucide";
import { AppButton } from "@/components/button/app-button";
import {
  ResultsPageShell,
  ResultsPageHeader,
  ResultsPanel,
  ResultsEmpty,
  ResultsNotice,
  ResultsStat,
} from "@/sections/results/component/result-page-ui";

export default function PublishPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    try {
      const res = await fetch("/api/exams");
      const data = await res.json();
      if (data.success) setExams(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleTogglePublish = async (examId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "PUBLISHED" ? "DRAFT_PREVIEW" : "PUBLISHED";
    const confirmMsg =
      currentStatus === "PUBLISHED"
        ? "Unlock exam? This will return it to Draft Preview and allow mark modifications."
        : "Publish exam? This locks marks from further edits and enables public report cards and SMS notifications.";

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/exams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchExams();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err: any) {
      alert("Failed: " + err.message);
    }
  };

  const publishedCount = exams.filter((e) => e.status === "PUBLISHED").length;
  const draftCount = exams.length - publishedCount;

  return (
    <ResultsPageShell>
      <ResultsPageHeader
        stepHint="Results workflow • Final step"
        icon={<ShieldCheck />}
        title="Publish Results"
        subtitle="Lock completed exams so report cards and guardian SMS become available."
      />

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
        }}
        className="no-print"
      >
        <ResultsStat label="Total Exams" value={exams.length} hint="Configured in this school" />
        <ResultsStat label="Published" value={publishedCount} hint="Locked for report cards" color="success" />
        <ResultsStat label="Draft / Preview" value={draftCount} hint="Still editable" color="warning" />
      </Box>

      <ResultsNotice severity="info">
        Publishing locks mark entry. You can unlock later if corrections are needed.
      </ResultsNotice>

      <ResultsPanel padded={false}>
        {loading ? (
          <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
            <CircularProgress size={28} />
          </Box>
        ) : exams.length === 0 ? (
          <ResultsEmpty
            title="No exams found"
            description="Create an exam first from Exam Configuration."
          />
        ) : (
          exams.map((exam, index) => {
            const isPublished = exam.status === "PUBLISHED";
            return (
              <Box key={exam.id}>
                {index > 0 ? <Divider /> : null}
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    alignItems: { md: "center" },
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.75 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {exam.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={exam.status}
                        color={isPublished ? "success" : "warning"}
                        variant="outlined"
                        sx={{ fontWeight: 700, height: 22 }}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Class <strong>{exam.class?.name || "—"}</strong>
                      {" · "}
                      Term <strong>{exam.termCode || "—"}</strong>
                      {" · "}
                      Processed <strong>{exam._count?.processedResults || 0}</strong>
                    </Typography>
                  </Box>

                  <AppButton
                    size="small"
                    variant={isPublished ? "outlined" : "contained"}
                    color={isPublished ? "warning" : "success"}
                    startIcon={isPublished ? <Unlock size={14} /> : <Lock size={14} />}
                    onClick={() => handleTogglePublish(exam.id, exam.status)}
                  >
                    {isPublished ? "Unlock to Draft" : "Lock & Publish"}
                  </AppButton>
                </Stack>
              </Box>
            );
          })
        )}
      </ResultsPanel>
    </ResultsPageShell>
  );
}

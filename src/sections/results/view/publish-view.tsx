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
import { Lock, Unlock } from "@/components/iconify/lucide";
import { AppButton } from "@/components/button/app-button";
import { NoDataFound } from "@/components/table/no-data-found";
import {
  ResultsPageShell,
  ResultsPageHeader,
  ResultsNotice,
} from "@/sections/results/component/result-page-ui";
import {
  RulesAtmosphere,
  RulesSection,
} from "@/sections/academic/component/rules-section-ui";

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
      <RulesAtmosphere>
        <ResultsPageHeader heading="Publish Results" />

        <ResultsNotice severity="info">
          Publishing locks mark entry. You can unlock later if corrections are needed.
        </ResultsNotice>

        <RulesSection
          title="Exam publish status"
          subtitle="Lock exams to release report cards, or unlock drafts when marks still need changes."
          action={
            !loading && exams.length > 0 ? (
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                <Chip
                  size="small"
                  label={`${exams.length} total`}
                  sx={{ height: 22, fontWeight: 700, bgcolor: "primary.lighter", color: "primary.dark" }}
                />
                <Chip
                  size="small"
                  label={`${publishedCount} published`}
                  color="success"
                  variant="outlined"
                  sx={{ height: 22, fontWeight: 700 }}
                />
                <Chip
                  size="small"
                  label={`${draftCount} draft`}
                  color="warning"
                  variant="outlined"
                  sx={{ height: 22, fontWeight: 700 }}
                />
              </Stack>
            ) : null
          }
        >
          {loading ? (
            <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : exams.length === 0 ? (
            <NoDataFound />
          ) : (
            <Box
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "background.paper",
              }}
            >
              {exams.map((exam, index) => {
                const isPublished = exam.status === "PUBLISHED";
                return (
                  <Box key={exam.id}>
                    {index > 0 ? <Divider /> : null}
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={2}
                      sx={{
                        p: { xs: 2, sm: 2.25 },
                        alignItems: { md: "center" },
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.75 }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.0625rem" } }}
                          >
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
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "0.8125rem" }}
                        >
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
                        color={isPublished ? "warning" : "primary"}
                        startIcon={isPublished ? <Unlock size={14} /> : <Lock size={14} />}
                        onClick={() => handleTogglePublish(exam.id, exam.status)}
                      >
                        {isPublished ? "Unlock to Draft" : "Lock & Publish"}
                      </AppButton>
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          )}
        </RulesSection>
      </RulesAtmosphere>
    </ResultsPageShell>
  );
}

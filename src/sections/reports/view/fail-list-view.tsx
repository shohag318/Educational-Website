"use client";

import { useEffect, useState } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import { PhoneIcon, PrintIcon } from "@/components/iconify/mui-icons";
import { AppButton } from "@/components/button/app-button";
import { AppSelect, AppTable, Label } from "@/components";
import { SessionSelect } from "@/components/SessionSelect";
import {
  ResultsPageShell,
  ResultsPageHeader,
  ResultsFilterCard,
  ResultsTableCard,
} from "@/sections/results/component/result-page-ui";
import {
  examOptionLabel,
  sectionOptionLabel,
  shiftLabel,
  subjectOptionLabel,
} from "@/sections/results/utils/select-options";

type FailRow = {
  roll: string | number;
  studentName: string;
  className?: string;
  sectionName?: string;
  groupType?: string;
  subjectName?: string;
  subjectCode?: string;
  marks?: string | number;
  failureReason?: string;
  phone?: string;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  sectionShift?: string;
};

export default function FailListPage() {
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [failedList, setFailedList] = useState<FailRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) setClasses(data.data);
      })
      .catch((err) => console.error("Error fetching classes:", err));

    fetch("/api/exams")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setExams(data.data);
          const first = data.data[0];
          setSelectedExamId(first.id);
          if (first.classId) setSelectedClassId(first.classId);
        }
      })
      .catch((err) => console.error("Error fetching exams:", err));

    fetch("/api/subjects")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSubjects(data.data);
      })
      .catch((err) => console.error("Error fetching subjects:", err));
  }, []);

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const classNum = selectedClass?.numericValue ?? parseInt(selectedClass?.name?.replace(/\D/g, "") || "0", 10);

  const isClass1To12 = Boolean(
    selectedClassId &&
      ((classNum >= 1 && classNum <= 12) ||
        (selectedClass &&
          /\b([1-9]|1[0-2])\b|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|ssc|hsc/i.test(
            selectedClass.name
          )))
  );

  const isClass11Or12 = Boolean(
    selectedClass &&
      (classNum === 11 ||
        classNum === 12 ||
        /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(selectedClass.name || ""))
  );

  const filteredExams = exams.filter((ex) => {
    if (selectedSession !== "ALL" && ex.academicYear?.yearName && ex.academicYear.yearName !== selectedSession) {
      return false;
    }
    if (selectedClassId && ex.classId !== selectedClassId) return false;
    return true;
  });

  const rawSections = selectedClass ? selectedClass.sections || [] : classes.flatMap((c) => c.sections || []);

  const availableSections = rawSections.filter((s: any) => {
    if (isClass1To12 && selectedGroup !== "ALL" && s.groupType !== selectedGroup) return false;
    if (selectedShift && selectedShift !== "ALL" && s.shift?.toUpperCase() !== selectedShift.toUpperCase()) return false;
    return true;
  });

  const availableShifts = Array.from(
    new Set(
      rawSections
        .map((s: any) => s.shift?.toUpperCase())
        .filter((sh: any) => Boolean(sh) && sh !== "MORNING" && sh !== "DAY")
    )
  ) as string[];

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSectionId("");
    setSelectedGroup("ALL");
    const matchingExams = classId ? exams.filter((e) => e.classId === classId) : exams;
    if (matchingExams.length > 0) {
      if (!matchingExams.some((e) => e.id === selectedExamId)) {
        setSelectedExamId(matchingExams[0].id);
      }
    } else {
      setSelectedExamId("");
    }
  };

  const handleShiftChange = (newShift: string) => {
    setSelectedShift(newShift);
    const matching = rawSections.filter((s: any) => {
      if (isClass1To12 && selectedGroup !== "ALL" && s.groupType !== selectedGroup) return false;
      if (newShift && newShift !== "ALL" && s.shift?.toUpperCase() !== newShift.toUpperCase()) return false;
      return true;
    });
    if (selectedSectionId && !matching.some((s: any) => s.id === selectedSectionId)) {
      setSelectedSectionId(matching.length > 0 ? matching[0].id : "");
    }
  };

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    const chosenExam = exams.find((e) => e.id === examId);
    if (chosenExam?.classId && (!selectedClassId || selectedClassId !== chosenExam.classId)) {
      setSelectedClassId(chosenExam.classId);
      setSelectedSectionId("");
      setSelectedGroup("ALL");
    }
  };

  const handleResetFilters = () => {
    setSelectedSession("ALL");
    setSelectedClassId("");
    setSelectedShift("");
    setSelectedGroup("ALL");
    setSelectedSectionId("");
    setSelectedSubjectId("");
    if (exams.length > 0) setSelectedExamId(exams[0].id);
  };

  const fetchFailed = async () => {
    if (!selectedExamId) {
      setFailedList([]);
      return;
    }
    setLoading(true);
    try {
      let url = `/api/reports/fail-list?examId=${selectedExamId}`;
      if (selectedSubjectId) url += `&subjectId=${selectedSubjectId}`;
      if (selectedClassId) url += `&classId=${selectedClassId}`;
      if (selectedSectionId) url += `&sectionId=${selectedSectionId}`;
      if (selectedShift && selectedShift !== "ALL") url += `&shift=${selectedShift}`;
      if (isClass1To12 && selectedGroup && selectedGroup !== "ALL") url += `&groupType=${selectedGroup}`;

      const res = await fetch(url);
      const data = await res.json();
      setFailedList(data.success ? data.data : []);
    } catch (e) {
      console.error(e);
      setFailedList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExamId, selectedSubjectId, selectedClassId, selectedSectionId, selectedShift, selectedGroup]);

  const filteredList = failedList.filter((row) => {
    if (selectedClassId && row.classId && row.classId !== selectedClassId) return false;
    if (
      selectedShift &&
      selectedShift !== "ALL" &&
      row.sectionShift &&
      row.sectionShift.toUpperCase() !== selectedShift.toUpperCase()
    ) {
      return false;
    }
    if (isClass1To12 && selectedGroup !== "ALL" && row.groupType && row.groupType !== selectedGroup) return false;
    if (selectedSectionId && row.sectionId && row.sectionId !== selectedSectionId) return false;
    if (selectedSubjectId && row.subjectId && row.subjectId !== selectedSubjectId) return false;
    return true;
  });

  const hasActiveFilters = Boolean(
    (selectedSession && selectedSession !== "ALL") ||
      selectedClassId ||
      selectedShift ||
      (isClass1To12 && selectedGroup !== "ALL") ||
      selectedSectionId ||
      selectedSubjectId
  );

  return (
    <ResultsPageShell>
      <ResultsPageHeader
        heading="Failed Students by Subject"
        current="Failed Students"
        action={
          <AppButton
            variant="contained"
            color="error"
            startIcon={<PrintIcon sx={{ fontSize: 16 }} />}
            onClick={() => window.print()}
          >
            Print Fail List
          </AppButton>
        }
      />

      <ResultsFilterCard
        title="Filters"
        active={hasActiveFilters}
        onReset={handleResetFilters}
        columns={4}
      >
        <SessionSelect
          value={selectedSession}
          onChange={(val) => setSelectedSession(val)}
          label="Session"
          fullWidth
        />

        <AppSelect
          label="Class"
          value={selectedClassId}
          onChange={handleClassChange}
          options={[
            { value: "", label: "All Classes" },
            ...classes.map((cls) => ({ value: cls.id, label: cls.name })),
          ]}
        />

        <AppSelect
          label="Exam"
          value={selectedExamId}
          onChange={handleExamChange}
          options={
            filteredExams.length === 0
              ? [{ value: "", label: "No exams found" }]
              : filteredExams.map((ex) => ({
                  value: ex.id,
                  label: examOptionLabel(ex),
                }))
          }
        />

        <AppSelect
          label="Shift"
          value={selectedShift}
          onChange={handleShiftChange}
          options={[
            { value: "", label: "All Shifts" },
            { value: "MORNING", label: "Morning" },
            { value: "DAY", label: "Day" },
            ...availableShifts.map((sh) => ({
              value: sh,
              label: shiftLabel(sh),
            })),
          ]}
        />

        <AppSelect
          label="Group"
          value={isClass1To12 ? selectedGroup : "ALL"}
          disabled={!isClass1To12}
          onChange={setSelectedGroup}
          options={
            isClass1To12
              ? [
                  { value: "ALL", label: "All Groups" },
                  ...(!isClass11Or12 ? [{ value: "GENERAL", label: "General" }] : []),
                  { value: "SCIENCE", label: "Science" },
                  { value: "HUMANITIES", label: "Humanities" },
                  { value: "BUSINESS_STUDIES", label: "Business Studies" },
                ]
              : [{ value: "ALL", label: "Select class 1 to 12 first" }]
          }
        />

        <AppSelect
          label="Section"
          value={selectedSectionId}
          onChange={setSelectedSectionId}
          options={[
            { value: "", label: "All Sections" },
            ...availableSections.map((sec: any) => ({
              value: sec.id,
              label: sectionOptionLabel(sec, { includeShiftWhen: !selectedShift }),
            })),
          ]}
        />

        <AppSelect
          label="Subject"
          value={selectedSubjectId}
          onChange={setSelectedSubjectId}
          options={[
            { value: "", label: "All Failed Subjects" },
            ...subjects.map((sub) => ({
              value: sub.id,
              label: subjectOptionLabel(sub),
            })),
          ]}
        />
      </ResultsFilterCard>

      <ResultsTableCard
        title="Failed subject records"
        count={loading ? "…" : filteredList.length}
        badge={
          <Chip
            size="small"
            color="error"
            variant="outlined"
            label="Remedial action needed"
            sx={{ height: 24, fontWeight: 700 }}
          />
        }
      >
        <AppTable<FailRow>
          rows={loading ? [] : filteredList}
          rowKey={(row, index) => `${row.roll}-${row.subjectCode}-${index}`}
          columns={[
            {
              id: "roll",
              label: "Roll",
              width: 72,
              render: (row) => (
                <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                  #{row.roll}
                </Typography>
              ),
            },
            {
              id: "studentName",
              label: "Student",
              render: (row) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {row.studentName}
                </Typography>
              ),
            },
            {
              id: "class",
              label: "Class & Section",
              render: (row) => (
                <Typography variant="body2" color="text.secondary">
                  {row.className} · {row.sectionName}
                </Typography>
              ),
            },
            {
              id: "group",
              label: "Group",
              render: (row) => (
                <Label color="default" variant="soft">
                  {row.groupType || "GENERAL"}
                </Label>
              ),
            },
            {
              id: "subject",
              label: "Failed Subject",
              render: (row) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {row.subjectName}{" "}
                  <Typography component="span" variant="caption" color="text.secondary">
                    ({row.subjectCode})
                  </Typography>
                </Typography>
              ),
            },
            {
              id: "marks",
              label: "Marks",
              align: "center",
              width: 88,
              render: (row) => (
                <Typography variant="body2" color="error.main" sx={{ fontFamily: "monospace", fontWeight: 800 }}>
                  {row.marks}
                </Typography>
              ),
            },
            {
              id: "reason",
              label: "Failure Reason",
              render: (row) => (
                <Label color="error" variant="soft">
                  {row.failureReason || "—"}
                </Label>
              ),
            },
            {
              id: "phone",
              label: "Guardian",
              render: (row) => (
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                  <PhoneIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                    {row.phone || "N/A"}
                  </Typography>
                </Stack>
              ),
            },
          ]}
        />
      </ResultsTableCard>
    </ResultsPageShell>
  );
}

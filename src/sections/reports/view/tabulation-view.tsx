"use client";

import { Fragment, useEffect, useState } from "react";
import { NoDataFound } from "@/components/table/no-data-found";
import { Box, Chip, Stack } from "@mui/material";
import { Printer, RotateCcw } from "@/components/iconify/lucide";
import { AppButton } from "@/components/button/app-button";
import { AppSelect } from "@/components";
import { SessionSelect } from "@/components/SessionSelect";
import {
  ResultsPageShell,
  ResultsPageHeader,
  ResultsPanel,
} from "@/sections/results/component/result-page-ui";
import {
  RulesAtmosphere,
  RulesFilterGrid,
  RulesSection,
} from "@/sections/academic/component/rules-section-ui";
import { examOptionLabel, sectionOptionLabel, shiftLabel } from "@/sections/results/utils/select-options";

export default function TabulationPage() {
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [tabulation, setTabulation] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [combinedRules, setCombinedRules] = useState<any[]>([]);
  const [examMeta, setExamMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch classes and exams on mount
  useEffect(() => {
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setClasses(data.data);
        }
      })
      .catch((err) => console.error("Error fetching classes:", err));

    fetch("/api/exams")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setExams(data.data);
          const firstExam = data.data[0];
          setSelectedExamId(firstExam.id);
          if (firstExam.classId) {
            setSelectedClassId(firstExam.classId);
          }
        }
      })
      .catch((err) => console.error("Error fetching exams:", err));
  }, []);

  const fetchTabulation = async () => {
    if (!selectedExamId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("examId", selectedExamId);
      if (selectedSectionId) params.set("sectionId", selectedSectionId);
      if (selectedShift && selectedShift !== "ALL") params.set("shift", selectedShift);
      if (selectedGroup && selectedGroup !== "ALL") params.set("groupType", selectedGroup);

      const res = await fetch(`/api/reports/tabulation?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTabulation(data.tabulation);
        setSubjects(data.subjects);
        setCombinedRules(data.combinedRules || []);
        setExamMeta(data.exam);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabulation();
  }, [selectedExamId, selectedClassId, selectedSectionId, selectedShift, selectedGroup]);

  // Exams filtered by selected session and class
  const filteredExams = exams.filter((ex) => {
    if (selectedSession !== "ALL" && ex.academicYear?.yearName && ex.academicYear.yearName !== selectedSession) {
      return false;
    }
    if (selectedClassId && ex.classId !== selectedClassId) {
      return false;
    }
    return true;
  });

  // Sections filtered by selected class, shift, and group
  const currentClass = classes.find((c) => c.id === selectedClassId);
  const activeExam = exams.find((e) => e.id === selectedExamId);
  const effectiveClass = currentClass || classes.find((c) => c.id === activeExam?.classId);
  const classNum = effectiveClass?.numericValue ?? parseInt(effectiveClass?.name?.replace(/\D/g, "") || "0", 10);
  const isClass11Or12 = Boolean(
    effectiveClass && (
      classNum === 11 ||
      classNum === 12 ||
      /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(effectiveClass.name || "")
    )
  );

  const rawSections = currentClass
    ? currentClass.sections || []
    : classes.flatMap((c) => c.sections || []);

  const availableSections = rawSections.filter((s: any) => {
    if (selectedGroup !== "ALL" && s.groupType !== selectedGroup) return false;
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
    const matchingExams = classId ? exams.filter((e) => e.classId === classId) : exams;
    if (matchingExams.length > 0) {
      const stillValid = matchingExams.some((e) => e.id === selectedExamId);
      if (!stillValid) {
        setSelectedExamId(matchingExams[0].id);
      }
    } else {
      setSelectedExamId("");
    }
    const chosenClass = classes.find((c) => c.id === classId);
    const chosenNum = chosenClass?.numericValue ?? parseInt(chosenClass?.name?.replace(/\D/g, "") || "0", 10);
    if (chosenClass && (chosenNum === 11 || chosenNum === 12 || /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(chosenClass.name || ""))) {
      if (selectedGroup === "GENERAL") setSelectedGroup("ALL");
    }
  };

  const handleShiftChange = (newShift: string) => {
    setSelectedShift(newShift);
    const matching = rawSections.filter((s: any) => {
      if (selectedGroup !== "ALL" && s.groupType !== selectedGroup) return false;
      if (newShift && newShift !== "ALL" && s.shift?.toUpperCase() !== newShift.toUpperCase()) return false;
      return true;
    });
    if (selectedSectionId) {
      const stillValid = matching.some((s: any) => s.id === selectedSectionId);
      if (!stillValid) {
        setSelectedSectionId(matching.length > 0 ? matching[0].id : "");
      }
    }
  };

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    const chosenExam = exams.find((e) => e.id === examId);
    if (chosenExam?.classId && (!selectedClassId || selectedClassId !== chosenExam.classId)) {
      setSelectedClassId(chosenExam.classId);
      setSelectedSectionId("");
      const chosenClass = classes.find((c) => c.id === chosenExam.classId);
      const chosenNum = chosenClass?.numericValue ?? parseInt(chosenClass?.name?.replace(/\D/g, "") || "0", 10);
      if (chosenClass && (chosenNum === 11 || chosenNum === 12 || /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(chosenClass.name || ""))) {
        if (selectedGroup === "GENERAL") setSelectedGroup("ALL");
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedSession("ALL");
    setSelectedGroup("ALL");
    setSelectedShift("");
    setSelectedSectionId("");
  };

  const hasActiveFilters = Boolean(
    (selectedSession && selectedSession !== "ALL") ||
    (selectedGroup && selectedGroup !== "ALL") ||
    selectedShift ||
    selectedSectionId
  );

  const selectedClassName =
    examMeta?.class?.name || classes.find((c) => c.id === selectedClassId)?.name || "All";
  const selectedExamName = examMeta?.name || filteredExams.find((e) => e.id === selectedExamId)?.name || "Exam";
  const selectedSectionName = availableSections.find((s: any) => s.id === selectedSectionId)?.name;

  return (
    <ResultsPageShell>
      <RulesAtmosphere>
        <ResultsPageHeader
          heading="Tabulation Sheet"
          action={
            <AppButton
              variant="contained"
              color="primary"
              size="small"
              startIcon={<Printer size={16} />}
              onClick={() => window.print()}
            >
              Print Tabulation
            </AppButton>
          }
        />

        <Box className="no-print">
          <RulesSection
            title="Choose class & exam"
            subtitle="Filter by session, class, exam, shift, group and section."
            action={
              hasActiveFilters ? (
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Chip
                    size="small"
                    label="Filters applied"
                    sx={{
                      height: 22,
                      fontWeight: 700,
                      fontSize: "0.65rem",
                      bgcolor: "primary.lighter",
                      color: "primary.dark",
                    }}
                  />
                  <AppButton
                    type="button"
                    variant="link"
                    onClick={handleResetFilters}
                    startIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Reset
                  </AppButton>
                </Stack>
              ) : undefined
            }
            toolbar={
              <RulesFilterGrid columns={4}>
                <SessionSelect
                  value={selectedSession}
                  onChange={(val) => setSelectedSession(val)}
                  label="Session"
                  includeAll
                  allLabel="All Sessions"
                  activeOnly={false}
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
                  label="Exam Name"
                  value={selectedExamId}
                  onChange={handleExamChange}
                  options={
                    filteredExams.length === 0
                      ? [{ value: "", label: "No exams for selected class" }]
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
                    ...availableShifts
                      .filter((sh: any) => sh !== "MORNING" && sh !== "DAY")
                      .map((sh: any) => ({
                        value: sh,
                        label: shiftLabel(sh),
                      })),
                  ]}
                />

                <AppSelect
                  label="Group"
                  value={isClass11Or12 && selectedGroup === "GENERAL" ? "ALL" : selectedGroup}
                  onChange={setSelectedGroup}
                  options={[
                    { value: "ALL", label: "All Groups" },
                    ...(!isClass11Or12 ? [{ value: "GENERAL", label: "General" }] : []),
                    { value: "SCIENCE", label: "Science" },
                    { value: "HUMANITIES", label: "Humanities" },
                    { value: "BUSINESS_STUDIES", label: "Business Studies" },
                  ]}
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
              </RulesFilterGrid>
            }
          >
            <Stack
              direction="row"
              spacing={0.75}
              useFlexGap
              sx={{ flexWrap: "wrap", alignItems: "center" }}
            >
              <Chip
                size="small"
                label={`Class: ${selectedClassName}`}
                sx={{ height: 24, fontWeight: 600, fontSize: "0.75rem" }}
              />
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={`Exam: ${selectedExamName}`}
                sx={{ height: 24, fontWeight: 600, fontSize: "0.75rem" }}
              />
              <Chip
                size="small"
                label={`Students: ${tabulation.length}`}
                sx={{
                  height: 24,
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  bgcolor: "info.lighter",
                  color: "info.dark",
                }}
              />
              {selectedShift ? (
                <Chip
                  size="small"
                  label={`Shift: ${selectedShift === "MORNING" ? "Morning" : selectedShift === "DAY" ? "Day" : selectedShift}`}
                  sx={{ height: 24, fontWeight: 600, fontSize: "0.75rem" }}
                />
              ) : null}
              {selectedSectionName ? (
                <Chip
                  size="small"
                  label={`Section: ${selectedSectionName}`}
                  sx={{ height: 24, fontWeight: 600, fontSize: "0.75rem" }}
                />
              ) : null}
            </Stack>
          </RulesSection>
        </Box>

        {/* Tabulation Sheet Document Canvas */}
        <ResultsPanel sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Institutional Header */}
          <div className="text-center border-b pb-4 mb-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-wide">
              {examMeta?.institution?.name || "Dhaka Ideal Model High School & College"}
            </h2>
            <p className="text-xs text-slate-500">
              {examMeta?.institution?.address || "Mirpur, Dhaka, Bangladesh"} • EIIN: {examMeta?.institution?.code || "108254"}
            </p>
            <div className="mt-2 inline-block bg-slate-100 text-slate-800 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
              {examMeta?.name} - TABULATION SHEET
            </div>
            <div className="text-xs text-slate-600 mt-1 font-medium">
              Class: {selectedClassName}
              {selectedShift ? ` • Shift: ${selectedShift === "MORNING" ? "Morning" : selectedShift === "DAY" ? "Day" : selectedShift}` : ""}
              {selectedSectionId ? ` • Section: ${selectedSectionName}` : ""}
              {selectedGroup && selectedGroup !== "ALL" ? ` • Group: ${selectedGroup}` : ""}
              {" • Year: "}{examMeta?.academicYear?.yearName || "2026"}
            </div>

            {combinedRules.length > 0 && (
              <div className="mt-2.5 inline-flex flex-wrap items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs text-emerald-800 font-medium">
                <span className="font-bold">🔗 Combined Subject Pass Rules:</span>
                {combinedRules.map((cr) => (
                  <span key={cr.id} className="bg-white border border-emerald-300 px-2 py-0.5 rounded-md text-[11px] shadow-xs">
                    {cr.name || `${cr.primarySubject?.name || '1st'} + ${cr.secondarySubject?.name || '2nd'}`} (Pass ≥ {cr.combinedPassMark})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* The Matrix — proper nested headers: subject colspan + Mark / LG / GP cells */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full border-collapse text-[11px] leading-tight">
              <thead>
                <tr className="bg-slate-100 text-slate-800">
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-[2] border border-slate-300 bg-slate-100 px-2 py-2 text-center font-bold whitespace-nowrap min-w-[52px]"
                  >
                    Rank
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky left-[52px] z-[2] border border-slate-300 bg-slate-100 px-2 py-2 text-center font-bold whitespace-nowrap min-w-[48px]"
                  >
                    Roll
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky left-[100px] z-[2] border border-slate-300 bg-slate-100 px-2.5 py-2 text-left font-bold whitespace-nowrap min-w-[140px]"
                  >
                    Student Name
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-slate-300 px-2 py-2 text-center font-bold whitespace-nowrap min-w-[56px]"
                  >
                    Sec
                  </th>

                  {subjects.map((sub) => {
                    const rule = combinedRules.find(
                      (r) => r.primarySubjectId === sub.id || r.secondarySubjectId === sub.id
                    );
                    const isPrimary = rule?.primarySubjectId === sub.id;
                    const partner = isPrimary ? rule?.secondarySubject : rule?.primarySubject;
                    return (
                      <th
                        key={sub.id}
                        colSpan={3}
                        className="border border-slate-300 px-1.5 py-1.5 text-center font-bold align-bottom min-w-[108px]"
                      >
                        <div className="font-bold text-[11px] leading-snug">
                          {sub.name}
                        </div>
                        <div className="text-[9px] font-semibold text-slate-500 mt-0.5">
                          {sub.subjectCode}
                        </div>
                        {rule ? (
                          <div className="mt-1 text-[8px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-1 py-0.5 inline-block max-w-full">
                            Combined w/ {partner?.subjectCode || "Paper"} · Pass {rule.combinedPassMark}
                          </div>
                        ) : null}
                      </th>
                    );
                  })}

                  <th
                    rowSpan={2}
                    className="border border-slate-300 px-2 py-2 text-center font-bold whitespace-nowrap min-w-[64px]"
                  >
                    Total
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-slate-300 px-2 py-2 text-center font-bold whitespace-nowrap min-w-[64px]"
                  >
                    GPA
                    <span className="block text-[9px] font-semibold text-slate-500 normal-case">w/o 4th</span>
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-slate-300 px-2 py-2 text-center font-bold whitespace-nowrap min-w-[56px]"
                  >
                    4th
                    <span className="block text-[9px] font-semibold text-slate-500 normal-case">Bonus</span>
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-slate-300 bg-emerald-50 px-2 py-2 text-center font-bold text-emerald-900 whitespace-nowrap min-w-[64px]"
                  >
                    Final
                    <span className="block text-[9px] font-semibold text-emerald-700/80 normal-case">GPA</span>
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-slate-300 px-2 py-2 text-center font-bold whitespace-nowrap min-w-[48px]"
                  >
                    LG
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-slate-300 px-2 py-2 text-center font-bold whitespace-nowrap min-w-[64px]"
                  >
                    Result
                  </th>
                </tr>

                <tr className="bg-slate-50 text-slate-600">
                  {subjects.map((sub) => (
                    <Fragment key={`sub-hdr-${sub.id}`}>
                      <th className="border border-slate-300 px-1 py-1 text-center font-bold font-mono text-[10px] min-w-[36px]">
                        Mark
                      </th>
                      <th className="border border-slate-300 px-1 py-1 text-center font-bold font-mono text-[10px] min-w-[32px]">
                        LG
                      </th>
                      <th className="border border-slate-300 px-1 py-1 text-center font-bold font-mono text-[10px] min-w-[32px]">
                        GP
                      </th>
                    </Fragment>
                  ))}
                </tr>
              </thead>

              <tbody>
                {tabulation.map((row) => (
                  <tr
                    key={row.id}
                    className={`font-mono text-[11px] ${
                      !row.isPassed ? "bg-red-50/40" : "bg-white"
                    } hover:bg-slate-50/80`}
                  >
                    <td className="sticky left-0 z-[1] border border-slate-300 bg-inherit px-2 py-1.5 text-center font-bold text-slate-900">
                      {row.isPassed ? row.classRank : "—"}
                    </td>
                    <td className="sticky left-[52px] z-[1] border border-slate-300 bg-inherit px-2 py-1.5 text-center font-semibold text-slate-700">
                      {row.roll}
                    </td>
                    <td className="sticky left-[100px] z-[1] border border-slate-300 bg-inherit px-2.5 py-1.5 text-left font-sans font-medium text-slate-900 whitespace-nowrap">
                      {row.studentName}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-center font-sans text-slate-600">
                      {row.sectionName || "—"}
                    </td>

                    {subjects.map((sub) => {
                      const subResult = row.subjects?.find((s: any) => s.subjectCode === sub.subjectCode);
                      if (!subResult) {
                        return (
                          <Fragment key={`empty-${sub.id}-${row.id}`}>
                            <td className="border border-slate-300 px-1 py-1.5 text-center text-slate-300">—</td>
                            <td className="border border-slate-300 px-1 py-1.5 text-center text-slate-300">—</td>
                            <td className="border border-slate-300 px-1 py-1.5 text-center text-slate-300">—</td>
                          </Fragment>
                        );
                      }

                      const rule = combinedRules.find(
                        (r) => r.primarySubjectId === sub.id || r.secondarySubjectId === sub.id
                      );
                      const isCombinedPassed = subResult.isCombined && subResult.isPassed;
                      const fail = !subResult.isPassed || subResult.grade === "F";

                      return (
                        <Fragment key={`vals-${sub.id}-${row.id}`}>
                          <td
                            title={
                              subResult.isCombined
                                ? `Combined marks: ${subResult.combinedMarks} (Pass: ${rule?.combinedPassMark || 66})`
                                : undefined
                            }
                            className={`border border-slate-300 px-1 py-1.5 text-center font-semibold ${
                              fail
                                ? "text-red-600"
                                : isCombinedPassed
                                  ? "text-emerald-700"
                                  : "text-slate-800"
                            }`}
                          >
                            {subResult.marks ?? "—"}
                          </td>
                          <td
                            title={
                              subResult.failureReason ||
                              (subResult.isCombined
                                ? `Combined total: ${subResult.combinedMarks} (Grade: ${subResult.grade})`
                                : undefined)
                            }
                            className={`border border-slate-300 px-1 py-1.5 text-center font-bold ${
                              fail
                                ? "text-red-600"
                                : isCombinedPassed
                                  ? "text-emerald-700"
                                  : "text-slate-800"
                            }`}
                          >
                            {subResult.grade ?? "—"}
                          </td>
                          <td
                            title={subResult.isCombined ? `Combined GP: ${subResult.point}` : undefined}
                            className="border border-slate-300 px-1 py-1.5 text-center text-slate-600"
                          >
                            {typeof subResult.point === "number" ? subResult.point.toFixed(1) : "—"}
                          </td>
                        </Fragment>
                      );
                    })}

                    <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-slate-900">
                      {row.totalObtainedMarks}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-center text-slate-600">
                      {Number(row.gpaWithoutFourth ?? 0).toFixed(2)}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-center text-amber-700">
                      +{Number(row.fourthBonus ?? 0).toFixed(2)}
                    </td>
                    <td className="border border-slate-300 bg-emerald-50/60 px-2 py-1.5 text-center font-bold text-slate-900">
                      {Number(row.finalGpa ?? 0).toFixed(2)}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-slate-900">
                      {row.finalGrade}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-center font-sans">
                      <span
                        className={`inline-block min-w-[52px] rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          row.isPassed
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {row.isPassed ? "PASSED" : "FAILED"}
                      </span>
                    </td>
                  </tr>
                ))}

                {tabulation.length === 0 && (
                  <tr>
                    <td
                      colSpan={Math.max(subjects.length * 3 + 10, 10)}
                      className={loading ? "border border-slate-300 p-8 text-center text-slate-400 italic font-sans" : "border border-slate-300 p-0"}
                    >
                      {loading ? "Loading tabulation sheet…" : <NoDataFound />}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Signature Blocks for Print */}
          <div className="mt-12 pt-8 grid grid-cols-3 gap-6 text-center text-xs font-semibold text-slate-700 print-only">
            <div className="border-t border-slate-400 pt-2">Class Teacher&apos;s Signature</div>
            <div className="border-t border-slate-400 pt-2">Exam Controller</div>
            <div className="border-t border-slate-400 pt-2">Headmaster / Principal</div>
          </div>
        </ResultsPanel>
      </RulesAtmosphere>
    </ResultsPageShell>
  );
}

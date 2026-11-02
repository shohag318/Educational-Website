"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SvgIconComponent } from "@mui/icons-material";
import SchoolIcon from "@mui/icons-material/School";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import { AdminPageShell } from "@/sections/session/component/admin-page-shell";
import { SessionPageHeader } from "@/sections/session/component/session-page-header";
import {
  AppButton,
  AppChip,
  AppTextField,
  DateRangePicker,
  EmptyContent,
  Label,
  LoadingScreen,
  useSnackbar,
  fDate,
} from "@/components";
import { Autocomplete, Avatar, Box, Checkbox, Stack, TextField, Typography } from "@/components/mui";
import { setupService, academicService } from "@/api/services";
import { PATHS } from "@/config-global";
import { validateSessionForm } from "@/sections/session/schema/session-schema";

interface SessionClassItem {
  id: string;
  name: string;
  numericValue: number;
  shift?: string;
  sections?: Array<{ id: string; name: string }>;
}

const FORM_NAV: Array<{
  id: "session-details" | "validity-period" | "session-classes";
  label: string;
  title: string;
  description: string;
  icon: SvgIconComponent;
}> = [
  {
    id: "session-details",
    label: "Session details",
    title: "Session details",
    description: "Set the academic year label that teachers and reports will use.",
    icon: CalendarMonthIcon,
  },
  {
    id: "validity-period",
    label: "Validity period",
    title: "Validity period",
    description: "Official opening and closing dates for this academic term.",
    icon: EventAvailableOutlinedIcon,
  },
  {
    id: "session-classes",
    label: "Classes",
    title: "Classes",
    description: "Search and select the classes to include in this session.",
    icon: SchoolIcon,
  },
];

export default function CreateSessionPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const [yearName, setYearName] = useState(String(nextYear));
  const [startDate, setStartDate] = useState(`${nextYear}-01-01`);
  const [endDate, setEndDate] = useState(`${nextYear}-12-31`);
  const [availableClasses, setAvailableClasses] = useState<SessionClassItem[]>([]);
  const [selectedClassNames, setSelectedClassNames] = useState<string[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeNav, setActiveNav] = useState<(typeof FORM_NAV)[number]["id"]>("session-details");
  const activeIndex = FORM_NAV.findIndex((item) => item.id === activeNav);
  const currentStep = FORM_NAV[activeIndex] ?? FORM_NAV[0];
  const isLastStep = activeIndex === FORM_NAV.length - 1;
  const StepIcon = currentStep.icon;

  const quickPills = [
    String(nextYear),
    `${currentYear}-${nextYear}`,
    `${nextYear}-${nextYear + 1}`,
    String(nextYear + 1),
  ];

  const handleSelectPill = (val: string) => {
    setYearName(val);
    const startY = val.split("-")[0] || String(nextYear);
    const endY = val.includes("-") ? val.split("-")[1] : startY;
    setStartDate(`${startY}-01-01`);
    setEndDate(`${endY}-12-31`);
  };

  useEffect(() => {
    const fetchExistingClasses = async () => {
      try {
        setClassesLoading(true);
        const json = await setupService.getClasses();
        if (json.success && Array.isArray(json.data)) {
          const sorted = [...json.data].sort((a: any, b: any) => {
            const numA = Number(a.numericValue) || 0;
            const numB = Number(b.numericValue) || 0;
            if (numA !== numB) return numA - numB;
            return a.name.localeCompare(b.name, undefined, { numeric: true });
          });
          setAvailableClasses(sorted);
          setSelectedClassNames(sorted.map((c: any) => c.name));
        }
      } catch (e) {
        console.error("Failed to load classes from DB:", e);
      } finally {
        setClassesLoading(false);
      }
    };

    fetchExistingClasses();
  }, []);

  const selectedClasses = useMemo(
    () => availableClasses.filter((cls) => selectedClassNames.includes(cls.name)),
    [availableClasses, selectedClassNames]
  );

  const classOptionLabel = (cls: SessionClassItem) => {
    const sectionsCount = cls.sections?.length || 0;
    const grade = cls.numericValue > 0 ? `Grade ${cls.numericValue}` : "Class";
    return `${cls.name} · ${grade}${sectionsCount ? ` · ${sectionsCount} ${sectionsCount === 1 ? "section" : "sections"}` : ""}`;
  };

  const stepError = (stepId: (typeof FORM_NAV)[number]["id"]) => {
    if (stepId === "session-details") {
      return yearName.trim() ? null : "Academic session / year is required";
    }
    if (stepId === "validity-period") {
      return validateSessionForm({ yearName, isCurrent: false, startDate, endDate }) ||
        (!startDate || !endDate ? "Start and end dates are required" : null);
    }
    return null;
  };

  const goToStep = (id: (typeof FORM_NAV)[number]["id"]) => {
    const targetIndex = FORM_NAV.findIndex((item) => item.id === id);
    if (targetIndex > activeIndex) {
      for (let i = 0; i < targetIndex; i += 1) {
        const error = stepError(FORM_NAV[i].id);
        if (error) {
          setActiveNav(FORM_NAV[i].id);
          enqueueSnackbar(error, { variant: "error" });
          return;
        }
      }
    }
    setActiveNav(id);
  };

  const goNext = () => {
    const error = stepError(currentStep.id);
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      return;
    }
    const next = FORM_NAV[activeIndex + 1];
    if (next) setActiveNav(next.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLastStep) {
      goNext();
      return;
    }
    const validation = validateSessionForm({ yearName, isCurrent: false, startDate, endDate });
    if (validation) {
      enqueueSnackbar(validation, { variant: "error" });
      return;
    }
    if (!startDate || !endDate) {
      enqueueSnackbar("Start and end dates are required", { variant: "error" });
      return;
    }

    try {
      setSubmitting(true);
      const selectedClassesPayload = availableClasses
        .filter((c) => selectedClassNames.includes(c.name))
        .map((c) => ({ name: c.name, numericValue: c.numericValue }));

      const json = await academicService.createYear({
        yearName: yearName.trim(),
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        selectedClasses: selectedClassesPayload,
        allowMultiple: true,
      });

      if (json.success) {
        enqueueSnackbar(`Academic session "${yearName}" created`, { variant: "success" });
        setTimeout(() => router.push(PATHS.session.root), 900);
      } else {
        enqueueSnackbar((json as any).error || "Failed to create academic session.", { variant: "error" });
      }
    } catch (err: any) {
      enqueueSnackbar(err.message || "Network request failed.", { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPageShell>
      <SessionPageHeader
        heading="Create New Session"
        current="Create"
        action={
          <AppButton
            component={Link}
            href={PATHS.session.root}
            variant="outlined"
            sx={{ width: { xs: 1, sm: "auto" } }}
          >
            Session Manager
          </AppButton>
        }
      />

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          bgcolor: "background.paper",
          borderRadius: "32px",
          boxShadow: "0 10px 40px rgba(15, 23, 42, 0.06)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: { xs: 1, md: 220 },
            flexShrink: 0,
            px: { xs: 2.5, md: 3.5 },
            py: { xs: 2.5, md: 4.5 },
          }}
        >
          <Stack
            direction={{ xs: "row", md: "column" }}
            spacing={{ xs: 2, md: 0 }}
            sx={{ overflowX: { xs: "auto", md: "visible" }, pb: { xs: 0.5, md: 0 } }}
          >
            {FORM_NAV.map((item, index) => {
              const active = activeNav === item.id;
              const completed = index < activeIndex;
              const last = index === FORM_NAV.length - 1;
              return (
                <Box
                  key={item.id}
                  component="button"
                  type="button"
                  onClick={() => goToStep(item.id)}
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    pb: { xs: 0, md: last ? 0 : 3.5 },
                    pr: { xs: last ? 0 : 1, md: 0 },
                    cursor: "pointer",
                    flexShrink: 0,
                    border: "none",
                    background: "transparent",
                    p: 0,
                    font: "inherit",
                    textAlign: "left",
                  }}
                >
                  {!last && (
                    <Box
                      sx={{
                        position: "absolute",
                        display: { xs: "none", md: "block" },
                        left: 13,
                        top: 28,
                        bottom: 0,
                        width: "2px",
                        bgcolor: completed || active ? "primary.light" : "grey.200",
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      typography: "caption",
                      fontWeight: 700,
                      flexShrink: 0,
                      zIndex: 1,
                      bgcolor: active || completed ? "primary.main" : "background.paper",
                      color: active || completed ? "primary.contrastText" : "text.secondary",
                      border: "2px solid",
                      borderColor: active || completed ? "primary.main" : "grey.300",
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: active ? 700 : 500, color: active ? "text.primary" : "text.secondary", whiteSpace: "nowrap" }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, px: { xs: 2.5, md: 5 }, py: { xs: 2.5, md: 4.5 } }}>
          <Stack direction="row" spacing={1.5} sx={{ mb: 3, alignItems: "flex-start" }}>
            <Avatar sx={{ bgcolor: "grey.100", color: "text.secondary", width: 44, height: 44 }}>
              <StepIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1">{currentStep.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {currentStep.description}
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: "24px",
              bgcolor: "grey.50",
              border: "1px solid",
              borderColor: "grey.100",
              minHeight: { md: 220 },
            }}
          >
            {currentStep.id === "session-details" && (
              <Stack spacing={1.5}>
                <AppTextField
                  label="Academic session / year"
                  value={yearName}
                  onChange={(e) => setYearName(e.target.value)}
                  placeholder="e.g. 2027 or 2026-2027"
                  required
                />
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", alignItems: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    Quick pick
                  </Typography>
                  {quickPills.map((pill) => (
                    <AppChip
                      key={pill}
                      label={pill}
                      clickable
                      color={yearName === pill ? "primary" : "default"}
                      variant={yearName === pill ? "filled" : "soft"}
                      onClick={() => handleSelectPill(pill)}
                    />
                  ))}
                </Stack>
              </Stack>
            )}

            {currentStep.id === "validity-period" && (
              <DateRangePicker
                startValue={startDate}
                endValue={endDate}
                onStartChange={setStartDate}
                onEndChange={setEndDate}
                startHelperText={`Opens ${fDate(startDate)}`}
                endHelperText={`Closes ${fDate(endDate)}`}
                required
              />
            )}

            {currentStep.id === "session-classes" && (
              <Stack spacing={1.25}>
                {availableClasses.length > 0 && (
                  <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
                    <Label color="primary" variant="soft">
                      {selectedClassNames.length} of {availableClasses.length} selected
                    </Label>
                  </Stack>
                )}

                {classesLoading ? (
                  <LoadingScreen label="Loading classes..." />
                ) : availableClasses.length === 0 ? (
                  <EmptyContent
                    title="No classes found"
                    description="Create classes first, then assign them to a session."
                    action={
                      <AppButton component={Link} href={PATHS.setup.classes} variant="contained" startIcon={<SchoolIcon />}>
                        Open Classes & Sections
                      </AppButton>
                    }
                  />
                ) : (
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <AppButton
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => setSelectedClassNames(availableClasses.map((c) => c.name))}
                      >
                        Select all
                      </AppButton>
                      <AppButton
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<CloseOutlinedIcon sx={{ fontSize: 16 }} />}
                        onClick={() => setSelectedClassNames([])}
                        sx={{
                          minWidth: 0,
                          px: 1.5,
                          borderRadius: 1.5,
                          fontWeight: 600,
                          borderColor: "rgba(244, 63, 94, 0.32)",
                          color: "#e11d48",
                          bgcolor: "rgba(255, 241, 242, 0.65)",
                          boxShadow: "none",
                          "& .MuiButton-startIcon": { mr: 0.5, ml: 0 },
                          "&:hover": {
                            bgcolor: "#fff1f2",
                            borderColor: "#fb7185",
                            boxShadow: "none",
                          },
                        }}
                      >
                        Clear
                      </AppButton>
                    </Stack>
                    <Autocomplete
                      multiple
                      disableCloseOnSelect
                      options={availableClasses}
                      value={selectedClasses}
                      onChange={(_, value) => setSelectedClassNames(value.map((cls) => cls.name))}
                      getOptionLabel={(option) => option.name}
                      isOptionEqualToValue={(option, value) => option.id === value.id || option.name === value.name}
                      filterOptions={(options, state) => {
                        const q = state.inputValue.trim().toLowerCase();
                        if (!q) return options;
                        return options.filter(
                          (cls) =>
                            cls.name.toLowerCase().includes(q) ||
                            String(cls.numericValue).includes(q) ||
                            (cls.shift || "").toLowerCase().includes(q) ||
                            classOptionLabel(cls).toLowerCase().includes(q)
                        );
                      }}
                      limitTags={4}
                      noOptionsText="No matching class"
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return <AppChip {...tagProps} key={key} label={option.name} color="primary" variant="outlined" />;
                        })
                      }
                      renderOption={(props, option, { selected }) => {
                        const { key, ...optionProps } = props;
                        const sectionsCount = option.sections?.length || 0;
                        return (
                          <Box
                            component="li"
                            key={key}
                            {...optionProps}
                            sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.75 }}
                          >
                            <Checkbox checked={selected} tabIndex={-1} disableRipple size="small" />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                {option.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {sectionsCount} {sectionsCount === 1 ? "section" : "sections"}
                              </Typography>
                            </Box>
                            <Label color={selected ? "primary" : "default"} variant="soft">
                              {option.numericValue > 0 ? `Grade ${option.numericValue}` : "Class"}
                            </Label>
                          </Box>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          label="Search and select classes"
                          placeholder={selectedClasses.length ? "Add another class" : "Type class name or grade"}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") event.preventDefault();
                          }}
                        />
                      )}
                      slotProps={{
                        listbox: { sx: { maxHeight: 320 } },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Type to search, then click a class to add or remove it. Selected classes appear as chips.
                    </Typography>
                  </Stack>
                )}
              </Stack>
            )}
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{
              mt: 3,
              justifyContent: "space-between",
              "& > :not(style)": { width: { xs: 1, sm: "auto" }, minWidth: { sm: 120 }, px: 2.5, borderRadius: "12px" },
            }}
          >
            <AppButton component={Link} href={PATHS.session.root} variant="outlined" color="error">
              Cancel
            </AppButton>
            {isLastStep ? (
              <AppButton type="submit" variant="contained" color="primary" loading={submitting}>
                Create Session
              </AppButton>
            ) : (
              <AppButton type="button" variant="contained" color="primary" onClick={goNext}>
                Next
              </AppButton>
            )}
          </Stack>
        </Box>
      </Box>
    </AdminPageShell>
  );
}

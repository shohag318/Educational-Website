"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Divider,
  Grid,
  IconButton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LayersIcon from "@mui/icons-material/Layers";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import WbTwilightIcon from "@mui/icons-material/WbTwilight";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import ClassOutlinedIcon from "@mui/icons-material/ClassOutlined";
import { AdminPageShell } from "@/sections/session/component/admin-page-shell";
import { SessionPageHeader } from "@/sections/session/component/session-page-header";
import { AppCard } from "@/components/card/app-card";
import { AppButton } from "@/components/button/app-button";
import { AppTextField } from "@/components/text-field/app-text-field";
import { AppSelect } from "@/components/select/app-select";
import { ConfirmDialog } from "@/components/dialog/confirm-dialog";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { EmptyContent } from "@/components/empty-content/empty-content";
import { Label } from "@/components/label/label";
import { setupService } from "@/api/services";
import { PATHS } from "@/config-global";
import { validateClassForm } from "@/sections/setup/schema/setup-schema";

const GROUP_OPTIONS = [
  { value: "GENERAL", label: "General" },
  { value: "SCIENCE", label: "Science" },
  { value: "HUMANITIES", label: "Humanities" },
  { value: "BUSINESS_STUDIES", label: "Business Studies" },
];

function formatGroupLabel(value?: string) {
  if (!value) return "General";
  return GROUP_OPTIONS.find((g) => g.value === value)?.label || value.replaceAll("_", " ");
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState("");
  const [numericValue, setNumericValue] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [sectionShift, setSectionShift] = useState("DAY");
  const [groupType, setGroupType] = useState("SCIENCE");
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassName, setEditClassName] = useState("");
  const [editNumericValue, setEditNumericValue] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [deletingClass, setDeletingClass] = useState<any | null>(null);
  const [deletingSection, setDeletingSection] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchClasses = async () => {
    try {
      const json = await setupService.getClasses();
      if (json.success && Array.isArray(json.data)) {
        setClasses(json.data);
        setSelectedClassId((prev) => (prev && json.data.some((c: any) => c.id === prev) ? prev : json.data[0]?.id || ""));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const notify = (type: "success" | "error", message: string) => setNotice({ type, message });

  const stats = useMemo(() => {
    const sectionCount = classes.reduce((sum, cls) => sum + (cls.sections?.length || 0), 0);
    const enrollmentCount = classes.reduce(
      (sum, cls) => sum + (cls.sections?.reduce((s: number, sec: any) => s + (sec._count?.enrollments || 0), 0) || 0),
      0
    );
    return {
      classes: classes.length,
      sections: sectionCount,
      enrollments: enrollmentCount,
    };
  }, [classes]);

  const filteredClasses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter((cls) => {
      const inClass = cls.name?.toLowerCase().includes(q) || String(cls.numericValue).includes(q);
      const inSection = cls.sections?.some(
        (sec: any) =>
          sec.name?.toLowerCase().includes(q) ||
          sec.groupType?.toLowerCase().includes(q) ||
          sec.shift?.toLowerCase().includes(q)
      );
      return inClass || inSection;
    });
  }, [classes, searchQuery]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateClassForm({ name: className, numericValue: Number(numericValue) });
    if (error) {
      notify("error", error);
      return;
    }
    try {
      const json = await setupService.saveClass({ name: className, numericValue });
      if (json.success) {
        setClassName("");
        setNumericValue("");
        notify("success", "Class created");
        fetchClasses();
      } else {
        notify("error", (json as any).error || "Could not create class");
      }
    } catch (err: any) {
      notify("error", err.message || "Failed to create class");
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !sectionName) {
      notify("error", "Select a class and enter a section name");
      return;
    }
    try {
      const json = await setupService.updateClass({
        classId: selectedClassId,
        sectionName,
        groupType,
        shift: sectionShift,
      });
      if (json.success) {
        setSectionName("");
        setSectionShift("DAY");
        notify("success", "Section added");
        fetchClasses();
      } else {
        notify("error", (json as any).error || "Could not add section");
      }
    } catch (err: any) {
      notify("error", err.message || "Failed to add section");
    }
  };

  const handleStartEdit = (cls: any) => {
    setEditingClassId(cls.id);
    setEditClassName(cls.name);
    setEditNumericValue(String(cls.numericValue));
  };

  const handleCancelEdit = () => {
    setEditingClassId(null);
    setEditClassName("");
    setEditNumericValue("");
  };

  const handleSaveEdit = async (classId: string) => {
    if (!editClassName || !editNumericValue) return;
    setActionLoading(true);
    try {
      const json = await setupService.patchClass({
        id: classId,
        name: editClassName,
        numericValue: editNumericValue,
      });
      if (json.success) {
        handleCancelEdit();
        notify("success", "Class updated");
        fetchClasses();
      } else {
        notify("error", (json as any).error || "Could not update class");
      }
    } catch (err: any) {
      notify("error", err.message || "Failed to update class");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingClass) return;
    setActionLoading(true);
    try {
      const json = await setupService.deleteClass(deletingClass.id);
      if (json.success) {
        setDeletingClass(null);
        notify("success", "Class removed");
        fetchClasses();
      } else {
        notify("error", (json as any).error || "Could not delete class");
      }
    } catch (err: any) {
      notify("error", err.message || "Failed to delete class");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDeleteSection = async () => {
    if (!deletingSection) return;
    setActionLoading(true);
    try {
      const json = await setupService.deleteSection(deletingSection.id);
      if (json.success) {
        setDeletingSection(null);
        notify("success", "Section removed");
        fetchClasses();
      } else {
        notify("error", (json as any).error || "Could not remove section");
      }
    } catch (err: any) {
      notify("error", err.message || "Failed to remove section");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminPageShell>
      <SessionPageHeader
        heading="Classes & Sections"
        current="Classes"
        action={
          <AppButton
            component={Link}
            href={PATHS.setup.subjectMapping}
            variant="outlined"
            color="inherit"
            startIcon={<MenuBookIcon />}
          >
            Subject mapping
          </AppButton>
        }
      />

      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {[
          { label: "Classes", value: stats.classes, icon: <SchoolOutlinedIcon sx={{ fontSize: 20 }} />, color: "success.main", bg: "success.lighter" },
          { label: "Sections", value: stats.sections, icon: <ClassOutlinedIcon sx={{ fontSize: 20 }} />, color: "info.main", bg: "info.lighter" },
          { label: "Enrollments", value: stats.enrollments, icon: <PeopleOutlineIcon sx={{ fontSize: 20 }} />, color: "warning.main", bg: "warning.lighter" },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 4 }}>
            <AppCard sx={{ bgcolor: item.bg }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "background.paper",
                    color: item.color,
                  }}
                >
                  {item.icon}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: item.color, lineHeight: 1.2 }}>
                    {item.value}
                  </Typography>
                </Box>
              </Stack>
            </AppCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <AppCard
            title="Add class"
            action={<Label color="success" variant="soft">Step 1</Label>}
            sx={{ height: 1 }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Create an academic class first, then add sections under it.
            </Typography>
            <Box component="form" onSubmit={handleAddClass}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 7 }}>
                  <AppTextField
                    label="Class name"
                    placeholder="e.g. Class 10"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <AppTextField
                    label="Numeric order"
                    type="number"
                    placeholder="e.g. 10"
                    value={numericValue}
                    onChange={(e) => setNumericValue(e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: -1 }}>
                    Numeric order sorts classes (higher = senior).
                  </Typography>
                </Grid>
                <Grid size={12}>
                  <AppButton type="submit" variant="contained" color="success" startIcon={<AddIcon />} sx={{ minWidth: 160 }}>
                    Create class
                  </AppButton>
                </Grid>
              </Grid>
            </Box>
          </AppCard>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <AppCard
            title="Add section"
            action={<Label color="info" variant="soft">Step 2</Label>}
            sx={{ height: 1 }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              {selectedClass
                ? `Adding under ${selectedClass.name}. Click a class card below to switch.`
                : "Select a class, then set section name, shift, and group."}
            </Typography>
            <Box component="form" onSubmit={handleAddSection}>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <AppSelect
                    label="Assign to class"
                    value={selectedClassId}
                    onChange={setSelectedClassId}
                    options={[
                      { value: "", label: classes.length ? "Select class" : "Create a class first" },
                      ...classes.map((c) => ({
                        value: c.id,
                        label: `${c.name} · Rank ${c.numericValue}`,
                      })),
                    ]}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 5 }}>
                  <AppTextField
                    label="Section name"
                    placeholder="e.g. Padma or A"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 3.5 }}>
                  <AppSelect
                    label="Shift"
                    value={sectionShift}
                    onChange={setSectionShift}
                    options={[
                      { value: "MORNING", label: "Morning" },
                      { value: "DAY", label: "Day" },
                    ]}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 3.5 }}>
                  <AppSelect label="Group" value={groupType} onChange={setGroupType} options={GROUP_OPTIONS} />
                </Grid>

                <Grid size={12}>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", alignItems: "center" }}>
                    <AppButton
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={<LayersIcon />}
                      disabled={!classes.length}
                      sx={{ minWidth: 160 }}
                    >
                      Add section
                    </AppButton>
                    {sectionShift === "MORNING" ? (
                      <Label color="warning" variant="soft" startIcon={<WbTwilightIcon sx={{ fontSize: 14 }} />}>
                        Morning shift
                      </Label>
                    ) : (
                      <Label color="info" variant="soft" startIcon={<WbSunnyIcon sx={{ fontSize: 14 }} />}>
                        Day shift
                      </Label>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </AppCard>
        </Grid>
      </Grid>

      <AppCard
        title="Academic hierarchy"
        action={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Label color="default" variant="soft">
              {filteredClasses.length}/{stats.classes} classes
            </Label>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <AppTextField
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search class, section, group, or shift…"
            startIcon={<SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />}
            sx={{ maxWidth: { sm: 360 } }}
          />

          {loading ? (
            <LoadingScreen label="Loading classes..." />
          ) : classes.length === 0 ? (
            <EmptyContent />
          ) : filteredClasses.length === 0 ? (
            <EmptyContent />
          ) : (
            <Stack spacing={1.5}>
              {filteredClasses.map((cls) => {
                const isEditing = editingClassId === cls.id;
                const isSelected = selectedClassId === cls.id;
                const sectionCount = cls.sections?.length || 0;

                return (
                  <Box
                    key={cls.id}
                    onClick={() => !isEditing && setSelectedClassId(cls.id)}
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: isSelected ? "success.main" : "divider",
                      bgcolor: isSelected ? "success.lighter" : "background.paper",
                      cursor: isEditing ? "default" : "pointer",
                      transition: "border-color 0.15s ease, background-color 0.15s ease",
                      "&:hover": {
                        borderColor: isSelected ? "success.main" : "grey.400",
                      },
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1.5}
                      sx={{ alignItems: { md: "center" }, justifyContent: "space-between", mb: sectionCount ? 1.5 : 0 }}
                    >
                      {isEditing ? (
                        <Stack
                          direction="row"
                          spacing={1}
                          useFlexGap
                          sx={{ alignItems: "center", flexWrap: "wrap" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AppTextField
                            value={editClassName}
                            onChange={(e) => setEditClassName(e.target.value)}
                            sx={{ width: { xs: 1, sm: 180 } }}
                          />
                          <AppTextField
                            type="number"
                            value={editNumericValue}
                            onChange={(e) => setEditNumericValue(e.target.value)}
                            sx={{ width: { xs: 100, sm: 90 } }}
                          />
                          <AppButton
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckIcon />}
                            loading={actionLoading}
                            onClick={() => handleSaveEdit(cls.id)}
                          >
                            Save
                          </AppButton>
                          <AppButton size="small" color="inherit" startIcon={<CloseIcon />} onClick={handleCancelEdit}>
                            Cancel
                          </AppButton>
                        </Stack>
                      ) : (
                        <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {cls.name}
                          </Typography>
                          <Label color="default" variant="soft">
                            Rank {cls.numericValue}
                          </Label>
                          <Label color={sectionCount ? "info" : "warning"} variant="soft">
                            {sectionCount} section{sectionCount === 1 ? "" : "s"}
                          </Label>
                          {isSelected && (
                            <Label color="success" variant="soft">
                              Selected for section
                            </Label>
                          )}
                        </Stack>
                      )}

                      {!isEditing && (
                        <Stack
                          direction="row"
                          spacing={0.75}
                          useFlexGap
                          sx={{ flexWrap: "wrap" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AppButton
                            component={Link}
                            href={`${PATHS.setup.subjectMapping}?classId=${cls.id}`}
                            size="small"
                            variant="soft"
                            color="success"
                            startIcon={<MenuBookIcon sx={{ fontSize: 16 }} />}
                          >
                            Map subjects
                          </AppButton>
                          <AppButton
                            size="small"
                            variant="soft"
                            color="inherit"
                            startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                            onClick={() => handleStartEdit(cls)}
                          >
                            Edit
                          </AppButton>
                          <AppButton
                            size="small"
                            variant="soft"
                            color="error"
                            startIcon={<DeleteOutlineIcon sx={{ fontSize: 16 }} />}
                            onClick={() => setDeletingClass(cls)}
                          >
                            Remove
                          </AppButton>
                        </Stack>
                      )}
                    </Stack>

                    {sectionCount > 0 ? (
                      <>
                        <Divider sx={{ mb: 1.5 }} />
                        <Grid container spacing={1}>
                          {cls.sections.map((sec: any) => {
                            const isMorning = sec.shift === "MORNING";
                            return (
                              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={sec.id}>
                                <Box
                                  sx={{
                                    p: 1.5,
                                    borderRadius: 1.5,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    bgcolor: isSelected ? "background.paper" : "grey.50",
                                    height: 1,
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                                    <Box sx={{ minWidth: 0 }}>
                                      <Stack direction="row" spacing={0.75} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.5 }}>
                                        <Typography variant="subtitle2" noWrap>
                                          {sec.name}
                                        </Typography>
                                        <Label color={isMorning ? "warning" : "info"} variant="soft">
                                          {isMorning ? "Morning" : "Day"}
                                        </Label>
                                      </Stack>
                                      <Typography variant="caption" color="text.secondary">
                                        {formatGroupLabel(sec.groupType)}
                                      </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={0.25} sx={{ alignItems: "center", flexShrink: 0 }}>
                                      <Label
                                        color="default"
                                        variant="outlined"
                                        startIcon={<PeopleOutlineIcon sx={{ fontSize: 14 }} />}
                                      >
                                        {sec._count?.enrollments || 0}
                                      </Label>
                                      <Tooltip title="Remove section">
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => setDeletingSection({ id: sec.id, name: sec.name })}
                                        >
                                          <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Stack>
                                  </Stack>
                                </Box>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </>
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                        No sections yet — use Step 2 to add one.
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}
        </Stack>
      </AppCard>

      <ConfirmDialog
        open={Boolean(deletingClass)}
        title="Remove class and sections"
        content={
          deletingClass
            ? `This will remove "${deletingClass.name}" and ${deletingClass.sections?.length || 0} section(s), including related enrollments and subject mappings.`
            : ""
        }
        confirmLabel="Delete class"
        danger
        loading={actionLoading}
        onClose={() => setDeletingClass(null)}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDialog
        open={Boolean(deletingSection)}
        title="Remove section"
        content={deletingSection ? `Remove section "${deletingSection.name}"? Enrolled students in this section may be affected.` : ""}
        confirmLabel="Delete section"
        danger
        loading={actionLoading}
        onClose={() => setDeletingSection(null)}
        onConfirm={handleConfirmDeleteSection}
      />

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={notice?.type || "success"} onClose={() => setNotice(null)} variant="filled">
          {notice?.message}
        </Alert>
      </Snackbar>
    </AdminPageShell>
  );
}

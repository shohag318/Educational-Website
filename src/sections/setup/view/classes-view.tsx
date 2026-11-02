"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Chip,
  Divider,
  Grid,
  IconButton,
  Snackbar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
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
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlineOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { AdminPageShell } from "@/sections/session/component/admin-page-shell";
import { SessionPageHeader } from "@/sections/session/component/session-page-header";
import { AppCard } from "@/components/card/app-card";
import { AppButton } from "@/components/button/app-button";
import { AppTextField } from "@/components/text-field/app-text-field";
import { AppSelect } from "@/components/select/app-select";
import { ConfirmDialog } from "@/components/dialog/confirm-dialog";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { EmptyContent } from "@/components/empty-content/empty-content";
import { setupService } from "@/api/services";
import { PATHS } from "@/config-global";
import { validateClassForm } from "@/sections/setup/schema/setup-schema";

const GROUP_OPTIONS = [
  { value: "GENERAL", label: "General" },
  { value: "SCIENCE", label: "Science" },
  { value: "HUMANITIES", label: "Humanities" },
  { value: "BUSINESS_STUDIES", label: "Business Studies" },
];

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

  const handleDeleteSection = async (sectionId: string, name: string) => {
    if (!window.confirm(`Remove section "${name}"?`)) return;
    try {
      const json = await setupService.deleteSection(sectionId);
      if (json.success) {
        notify("success", "Section removed");
        fetchClasses();
      } else {
        notify("error", (json as any).error || "Could not remove section");
      }
    } catch (err: any) {
      notify("error", err.message || "Failed to remove section");
    }
  };

  return (
    <AdminPageShell>
      <SessionPageHeader heading="Classes & Sections" current="Classes" />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <AppCard title="Add Academic Class">
            <Box component="form" onSubmit={handleAddClass}>
              <Stack spacing={2}>
                <AppTextField
                  label="Class Name"
                  placeholder="e.g. Class 10"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  required
                />
                <AppTextField
                  label="Numeric Order"
                  type="number"
                  placeholder="e.g. 10"
                  value={numericValue}
                  onChange={(e) => setNumericValue(e.target.value)}
                  required
                />
                <AppButton type="submit" variant="contained" color="secondary" startIcon={<AddIcon />}>
                  Create Class
                </AppButton>
              </Stack>
            </Box>
          </AppCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <AppCard title="Add Section / Group">
            <Box component="form" onSubmit={handleAddSection}>
              <Stack spacing={2}>
                <AppSelect
                  label="Assign To Class"
                  value={selectedClassId}
                  onChange={setSelectedClassId}
                  options={[
                    { value: "", label: "Select class" },
                    ...classes.map((c) => ({
                      value: c.id,
                      label: `${c.name} (Rank ${c.numericValue})`,
                    })),
                  ]}
                />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <AppTextField
                      label="Section Name"
                      placeholder="e.g. Padma or A"
                      value={sectionName}
                      onChange={(e) => setSectionName(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                      Shift
                    </Typography>
                    <ToggleButtonGroup
                      exclusive
                      fullWidth
                      size="small"
                      value={sectionShift}
                      onChange={(_, value) => value && setSectionShift(value)}
                    >
                      <ToggleButton value="MORNING">
                        <WbTwilightIcon sx={{ fontSize: 16, mr: 0.75 }} />
                        Morning
                      </ToggleButton>
                      <ToggleButton value="DAY">
                        <WbSunnyIcon sx={{ fontSize: 16, mr: 0.75 }} />
                        Day
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Grid>
                </Grid>
                <AppSelect label="Academic Group" value={groupType} onChange={setGroupType} options={GROUP_OPTIONS} />
                <AppButton type="submit" variant="contained" startIcon={<LayersIcon />}>
                  Add Section
                </AppButton>
              </Stack>
            </Box>
          </AppCard>
        </Grid>
      </Grid>

      <AppCard
        title="Current Academic Hierarchy"
        action={<Chip size="small" color="primary" label={`${classes.length} classes`} />}
      >
        {loading ? (
          <LoadingScreen label="Loading classes..." />
        ) : classes.length === 0 ? (
          <EmptyContent title="No classes yet" description="Add your first academic class using the form above." />
        ) : (
          <Stack divider={<Divider />} spacing={0}>
            {classes.map((cls) => {
              const isEditing = editingClassId === cls.id;
              return (
                <Box key={cls.id} sx={{ py: 2 }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mb: 1.5 }}
                  >
                    {isEditing ? (
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                        <AppTextField
                          value={editClassName}
                          onChange={(e) => setEditClassName(e.target.value)}
                          sx={{ width: 180 }}
                        />
                        <AppTextField
                          type="number"
                          value={editNumericValue}
                          onChange={(e) => setEditNumericValue(e.target.value)}
                          sx={{ width: 90 }}
                        />
                        <AppButton
                          size="small"
                          variant="contained"
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
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                        <Typography variant="subtitle1">{cls.name}</Typography>
                        <Chip size="small" label={`Rank ${cls.numericValue}`} />
                        <Typography variant="caption" color="text.secondary">
                          {cls.sections?.length || 0} sections
                        </Typography>
                      </Stack>
                    )}

                    {!isEditing && (
                      <Stack direction="row" spacing={1}>
                        <AppButton
                          component={Link}
                          href={`${PATHS.setup.subjectMapping}?classId=${cls.id}`}
                          size="small"
                          variant="outlined"
                          startIcon={<MenuBookIcon />}
                        >
                          Map Subjects
                        </AppButton>
                        <AppButton size="small" color="inherit" startIcon={<EditIcon />} onClick={() => handleStartEdit(cls)}>
                          Edit
                        </AppButton>
                        <AppButton
                          size="small"
                          color="error"
                          variant="outlined"
                          startIcon={<DeleteOutlineIcon />}
                          onClick={() => setDeletingClass(cls)}
                        >
                          Remove
                        </AppButton>
                      </Stack>
                    )}
                  </Stack>

                  <Grid container spacing={1}>
                    {cls.sections?.length ? (
                      cls.sections.map((sec: any) => {
                        const isMorning = sec.shift === "MORNING";
                        return (
                          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={sec.id}>
                            <Box
                              sx={{
                                p: 1.5,
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 2,
                                bgcolor: "grey.50",
                              }}
                            >
                              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                                <Box>
                                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                    <Typography variant="subtitle2">{sec.name}</Typography>
                                    <Chip
                                      size="small"
                                      color={isMorning ? "warning" : "info"}
                                      label={isMorning ? "Morning" : "Day"}
                                    />
                                  </Stack>
                                  <Typography variant="caption" color="primary">
                                    {sec.groupType}
                                  </Typography>
                                </Box>
                                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                                  <Chip
                                    size="small"
                                    icon={<PeopleOutlineIcon />}
                                    label={sec._count?.enrollments || 0}
                                    variant="outlined"
                                  />
                                  <Tooltip title="Remove section">
                                    <IconButton size="small" color="error" onClick={() => handleDeleteSection(sec.id, sec.name)}>
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              </Stack>
                            </Box>
                          </Grid>
                        );
                      })
                    ) : (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary">
                          No sections created yet
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              );
            })}
          </Stack>
        )}
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

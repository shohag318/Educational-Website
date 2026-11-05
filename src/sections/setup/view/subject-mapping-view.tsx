"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AutoAwesomeIcon, ContentCopyIcon, AddIcon, SearchIcon, DeleteOutlineIcon, SyncIcon, PeopleIcon, ArrowForwardIcon } from "@/components/iconify/mui-icons";
import { AdminPageShell } from "@/sections/session/component/admin-page-shell";
import { SessionPageHeader } from "@/sections/session/component/session-page-header";
import {
  Alert,
  Box,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@/components/mui";
import {
  AppButton,
  AppCard,
  AppChip,
  AppSelect,
  AppTextField,
  ConfirmDialog,
  CustomTabs,
  EmptyContent,
  Label,
  LoadingScreen,
  Scrollbar,
} from "@/components";
import { setupService } from "@/api/services";
import { PATHS } from "@/config-global";

interface Subject {
  id: string;
  subjectCode?: string | null;
  name: string;
}

interface ClassSubjectMapping {
  id: string;
  classId: string;
  groupType: string;
  subjectId: string;
  subjectType: "MANDATORY" | "GROUP_ELECTIVE" | "OPTIONAL_4TH";
  creditWeight: number;
  subject: Subject;
}

type SubjectRole = ClassSubjectMapping["subjectType"];

const ROLE_OPTIONS = [
  { value: "MANDATORY", label: "Mandatory" },
  { value: "GROUP_ELECTIVE", label: "Group elective" },
  { value: "OPTIONAL_4TH", label: "4th / optional" },
];

const NCTB_PRESETS = [
  { key: "nctb_science", title: "SSC Science", desc: "Bangla, English, Math, ICT, BGS, Physics, Chemistry, Biology, Higher Math" },
  { key: "nctb_business", title: "SSC Business Studies", desc: "Bangla, English, Math, ICT, Accounting, Entrepreneurship, Finance" },
  { key: "nctb_humanities", title: "SSC Humanities", desc: "Bangla, English, Math, ICT, History, Geography, Civics" },
  { key: "nctb_general_junior", title: "Junior (Class 6-8)", desc: "Bangla, English, Math, Science, BGS, ICT, Religion" },
];

const GROUP_LABELS: Record<string, string> = {
  ALL: "All groups",
  MANDATORY: "Mandatory",
  SCIENCE: "Science",
  HUMANITIES: "Humanities",
  BUSINESS_STUDIES: "Business Studies",
  GENERAL: "General",
};

function roleChipColor(type: string) {
  if (type === "MANDATORY") return "info" as const;
  if (type === "GROUP_ELECTIVE") return "secondary" as const;
  return "warning" as const;
}

export default function ClassSubjectMappingPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("SCIENCE");
  const [mappings, setMappings] = useState<ClassSubjectMapping[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"mapped" | "catalog">("mapped");
  const [selectedMappingIds, setSelectedMappingIds] = useState<string[]>([]);
  const [selectedCatalogSubjectIds, setSelectedCatalogSubjectIds] = useState<string[]>([]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [copySourceClassId, setCopySourceClassId] = useState("");
  const [copySourceGroup, setCopySourceGroup] = useState("SCIENCE");
  const [newSubCode, setNewSubCode] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubType, setNewSubType] = useState<SubjectRole>("MANDATORY");
  const [confirmState, setConfirmState] = useState<{
    title: string;
    content: string;
    confirmLabel: string;
    danger?: boolean;
    run: () => Promise<void>;
  } | null>(null);

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const isClass9To12 = Boolean(
    (selectedClass?.numericValue && selectedClass.numericValue >= 9) ||
      (selectedClass && /9|10|11|12|nine|ten|eleven|twelve|ssc|hsc/i.test(selectedClass.name))
  );
  const groupOptions = useMemo(
    () => (isClass9To12 ? ["SCIENCE", "HUMANITIES", "BUSINESS_STUDIES", "MANDATORY", "ALL"] : ["GENERAL", "MANDATORY", "ALL"]),
    [isClass9To12]
  );

  const showNotify = (type: "success" | "error", message: string) => setNotification({ type, message });

  const fetchMappings = async (silent = false) => {
    if (!selectedClassId) return;
    if (!silent) setLoading(true);
    try {
      const json = await setupService.getClassSubjects(selectedClassId, selectedGroup);
      const payload = json.data as any;
      if (json.success) {
        setMappings(payload?.mappings || []);
        setAllSubjects(payload?.allSubjects || []);
        setEnrolledCount(payload?.enrolledCount || 0);
        setSelectedMappingIds([]);
        setSelectedCatalogSubjectIds([]);
      } else {
        showNotify("error", (json as any).error || "Failed to load subjects");
      }
    } catch (e: any) {
      showNotify("error", e.message || "Network error loading subjects");
    } finally {
      setLoading(false);
    }
  };

  const postAction = async (payload: unknown, successMessage?: string) => {
    const json = await setupService.saveClassSubjects(payload);
      if (json.success) {
      showNotify("success", successMessage || (json as any).message || "Updated");
      await fetchMappings(true);
      return true;
    }
    showNotify("error", (json as any).error || "Request failed");
    return false;
  };

  useEffect(() => {
    setupService
      .getClasses()
      .then((data) => {
        if (data.success && data.data && data.data.length > 0) {
          setClasses(data.data);
          const urlParams = new URLSearchParams(window.location.search);
          const paramClassId = urlParams.get("classId");
          const targetClass =
            (paramClassId && data.data.find((c: any) => c.id === paramClassId)) || data.data[0];
          if (!targetClass) {
            setLoading(false);
            return;
          }
          setSelectedClassId(targetClass.id);
          const isJunior =
            targetClass && (targetClass.numericValue ? targetClass.numericValue < 9 : !/9|10|11|12|ssc|hsc/i.test(targetClass.name));
          setSelectedGroup(isJunior ? "GENERAL" : "SCIENCE");
      } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
        fetchMappings();
  }, [selectedClassId, selectedGroup]);

  useEffect(() => {
    if (groupOptions.length && !groupOptions.includes(selectedGroup)) setSelectedGroup(groupOptions[0]);
  }, [groupOptions, selectedGroup]);

  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    const cls = classes.find((c) => c.id === newClassId);
    const isJunior = cls && (cls.numericValue ? cls.numericValue < 9 : !/9|10|11|12|ssc|hsc/i.test(cls.name));
    setSelectedGroup(isJunior ? "GENERAL" : "SCIENCE");
    setSelectedMappingIds([]);
    setSelectedCatalogSubjectIds([]);
  };

  const handleUpdateType = (subjectId: string, newType: string) =>
    postAction({ action: "upsert", classId: selectedClassId, groupType: selectedGroup, subjectId, subjectType: newType }, "Subject mapping updated");

  const handleRemoveMapping = (subjectId: string, name: string) => {
    setConfirmState({
      title: "Remove subject",
      content: `Remove "${name}" from this class mapping?`,
      confirmLabel: "Remove",
      danger: true,
      run: async () => {
        await postAction({ action: "remove", classId: selectedClassId, groupType: selectedGroup, subjectId }, "Subject removed");
      },
    });
  };

  const handleAddFromCatalog = (subjectId: string, subjectType: SubjectRole) =>
    postAction({ action: "upsert", classId: selectedClassId, groupType: selectedGroup, subjectId, subjectType }, "Subject mapped");

  const handleBatchAssignFromCatalog = (subjectType: SubjectRole) =>
    postAction(
      { action: "batch_assign", classId: selectedClassId, groupType: selectedGroup, subjectIds: selectedCatalogSubjectIds, subjectType },
      `Added ${selectedCatalogSubjectIds.length} subjects`
    );

  const handleBatchUpdateMapped = (subjectType: SubjectRole) =>
    postAction(
      { action: "batch_assign", classId: selectedClassId, groupType: selectedGroup, subjectIds: selectedMappingIds, subjectType },
      `Updated ${selectedMappingIds.length} subjects`
    );

  const handleBatchRemoveMapped = () => {
    if (!selectedMappingIds.length) return;
    setConfirmState({
      title: "Remove selected subjects",
      content: `Remove ${selectedMappingIds.length} subjects from this mapping?`,
      confirmLabel: "Remove",
      danger: true,
      run: async () => {
        await postAction(
          { action: "remove_batch", classId: selectedClassId, groupType: selectedGroup, subjectIds: selectedMappingIds },
          "Subjects removed"
        );
      },
    });
  };

  const handleDeleteFromCatalog = (subject: Subject) => {
    setConfirmState({
      title: "Delete catalog subject",
      content: `Permanently remove "${subject.name}" from the catalog?`,
      confirmLabel: "Delete",
      danger: true,
      run: async () => {
        await postAction({ action: "delete_catalog_subject", subjectId: subject.id }, `Removed ${subject.name}`);
      },
    });
  };

  const handleBatchDeleteFromCatalog = () => {
    if (!selectedCatalogSubjectIds.length) return;
    setConfirmState({
      title: "Delete catalog subjects",
      content: `Permanently remove ${selectedCatalogSubjectIds.length} catalog subject(s)?`,
      confirmLabel: "Delete",
      danger: true,
      run: async () => {
        const ok = await postAction({ action: "delete_catalog_subject", subjectIds: selectedCatalogSubjectIds }, "Catalog subjects removed");
        if (ok) setSelectedCatalogSubjectIds([]);
      },
    });
  };

  const handleApplyPreset = async (presetKey: string) => {
    setActionLoading(true);
    try {
      const ok = await postAction({ action: "apply_preset", classId: selectedClassId, groupType: selectedGroup, presetKey }, "NCTB preset applied");
      if (ok) setShowPresetModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyFrom = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const ok = await postAction(
        {
          action: "copy_from",
          sourceClassId: copySourceClassId,
          sourceGroupType: copySourceGroup,
          targetClassId: selectedClassId,
          targetGroupType: selectedGroup,
        },
        "Mapping copied"
      );
      if (ok) setShowCopyModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const ok = await postAction(
        {
          action: "create_subject_and_map",
          classId: selectedClassId,
          groupType: selectedGroup,
          subjectCode: newSubCode.trim() || null,
          name: newSubName.trim(),
          subjectType: newSubType,
        },
        `Created ${newSubName.trim()}`
      );
      if (ok) {
        setShowAddSubjectModal(false);
        setNewSubCode("");
        setNewSubName("");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncToStudents = () => {
    if (enrolledCount === 0) {
      showNotify("error", "No students are enrolled in this class and group yet.");
      return;
    }
    setConfirmState({
      title: "Sync subjects to students",
      content: `Sync ${mappings.length} subjects to ${enrolledCount} enrolled students? Existing student allocations will be updated.`,
      confirmLabel: "Sync now",
      danger: false,
      run: async () => {
    setActionLoading(true);
    try {
          await postAction({ action: "sync_to_students", classId: selectedClassId, groupType: selectedGroup }, "Synced to students");
    } finally {
      setActionLoading(false);
    }
      },
    });
  };

  const mappedSubjectIds = new Set(mappings.map((m) => m.subjectId));
  const unmappedSubjects = allSubjects.filter((s) => !mappedSubjectIds.has(s.id));
  const filteredMappings = mappings.filter(
    (m) => m.subject.name.toLowerCase().includes(searchQuery.toLowerCase()) || (m.subject.subjectCode || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredUnmapped = unmappedSubjects.filter(
    (s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.subjectCode || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const mandatoryCount = mappings.filter((m) => m.subjectType === "MANDATORY").length;
  const electiveCount = mappings.filter((m) => m.subjectType === "GROUP_ELECTIVE").length;
  const fourthCount = mappings.filter((m) => m.subjectType === "OPTIONAL_4TH").length;

  const stats = [
    { label: "Mapped", value: mappings.length },
    { label: "Mandatory", value: mandatoryCount },
    { label: "Elective", value: electiveCount },
    { label: "4th optional", value: fourthCount },
  ];

  const runConfirm = async () => {
    if (!confirmState) return;
    setActionLoading(true);
    try {
      await confirmState.run();
    } finally {
      setActionLoading(false);
      setConfirmState(null);
    }
  };

  const mappedEmpty = <EmptyContent />;

  const catalogEmpty = <EmptyContent />;

  const mappedCards = (
    <Stack spacing={1.25}>
                  {filteredMappings.map((item) => {
        const selected = selectedMappingIds.includes(item.subjectId);
              return (
          <Box
                        key={item.id}
            sx={{
              p: 1.5,
              border: 1,
              borderColor: selected ? "primary.main" : "divider",
              borderRadius: 2,
              bgcolor: selected ? "action.selected" : "background.paper",
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
              <Checkbox
                checked={selected}
                onChange={(e) =>
                                setSelectedMappingIds(
                    e.target.checked ? [...selectedMappingIds, item.subjectId] : selectedMappingIds.filter((id) => id !== item.subjectId)
                  )
                }
                sx={{ mt: -0.5 }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                      {item.subject.name}
                    </Typography>
                    <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap", mt: 0.75 }}>
                      <Label variant="soft">{item.subject.subjectCode || "No code"}</Label>
                      <Label variant="soft">{GROUP_LABELS[item.groupType] || item.groupType}</Label>
                      <Label color={roleChipColor(item.subjectType)} variant="soft">
                        {item.creditWeight.toFixed(2)} cr
                      </Label>
                    </Stack>
                  </Box>
                  <Tooltip title="Remove">
                    <IconButton color="error" size="small" onClick={() => handleRemoveMapping(item.subjectId, item.subject.name)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{ mt: 1.25 }}>
                  <AppSelect value={item.subjectType} onChange={(value) => handleUpdateType(item.subjectId, value)} options={ROLE_OPTIONS} />
                </Box>
              </Box>
            </Stack>
          </Box>
              );
            })}
    </Stack>
  );

  const mappedTable = (
    <TableContainer>
      <Scrollbar sx={{ overflowX: "auto" }}>
      <Table sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={filteredMappings.length > 0 && selectedMappingIds.length === filteredMappings.length}
                onChange={(e) => setSelectedMappingIds(e.target.checked ? filteredMappings.map((m) => m.subjectId) : [])}
              />
            </TableCell>
            <TableCell>Code</TableCell>
            <TableCell>Subject</TableCell>
            <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Group</TableCell>
            <TableCell sx={{ width: 200 }}>Role</TableCell>
            <TableCell align="center" sx={{ display: { xs: "none", md: "table-cell" } }}>
              Credit
            </TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredMappings.map((item) => (
            <TableRow key={item.id} hover selected={selectedMappingIds.includes(item.subjectId)}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedMappingIds.includes(item.subjectId)}
                  onChange={(e) =>
                                setSelectedMappingIds(
                      e.target.checked ? [...selectedMappingIds, item.subjectId] : selectedMappingIds.filter((id) => id !== item.subjectId)
                    )
                              }
                          />
              </TableCell>
              <TableCell>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {item.subject.subjectCode || "—"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {item.subject.name}
                </Typography>
              </TableCell>
              <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>
                <Label variant="soft">{GROUP_LABELS[item.groupType] || item.groupType}</Label>
              </TableCell>
              <TableCell>
                <AppSelect value={item.subjectType} onChange={(value) => handleUpdateType(item.subjectId, value)} options={ROLE_OPTIONS} />
              </TableCell>
              <TableCell align="center" sx={{ display: { xs: "none", md: "table-cell" } }}>
                <Label color={roleChipColor(item.subjectType)} variant="soft">
                          {item.creditWeight.toFixed(2)}
                </Label>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Remove">
                  <IconButton color="error" size="small" onClick={() => handleRemoveMapping(item.subjectId, item.subject.name)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Scrollbar>
    </TableContainer>
  );

  const catalogCards = (
    <Stack spacing={1.25}>
                  {filteredUnmapped.map((sub) => {
        const selected = selectedCatalogSubjectIds.includes(sub.id);
                    return (
          <Box
                        key={sub.id}
            sx={{
              p: 1.5,
              border: 1,
              borderColor: selected ? "primary.main" : "divider",
              borderRadius: 2,
              bgcolor: selected ? "action.selected" : "background.paper",
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
              <Checkbox
                checked={selected}
                onChange={(e) =>
                                setSelectedCatalogSubjectIds(
                    e.target.checked ? [...selectedCatalogSubjectIds, sub.id] : selectedCatalogSubjectIds.filter((id) => id !== sub.id)
                  )
                }
                sx={{ mt: -0.5 }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                      {sub.name}
                    </Typography>
                    <Label variant="soft" sx={{ mt: 0.75 }}>
                      {sub.subjectCode || "No code"}
                    </Label>
                  </Box>
                  <IconButton size="small" color="error" onClick={() => handleDeleteFromCatalog(sub)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
                <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap", mt: 1.25 }}>
                  <AppButton size="small" variant="soft" onClick={() => handleAddFromCatalog(sub.id, "MANDATORY")}>
                    Mandatory
                  </AppButton>
                  <AppButton size="small" variant="soft" onClick={() => handleAddFromCatalog(sub.id, "GROUP_ELECTIVE")}>
                    Elective
                  </AppButton>
                  <AppButton size="small" variant="soft" onClick={() => handleAddFromCatalog(sub.id, "OPTIONAL_4TH")}>
                    4th
                  </AppButton>
                </Stack>
              </Box>
            </Stack>
          </Box>
                    );
                  })}
    </Stack>
  );

  const catalogTable = (
    <TableContainer>
      <Scrollbar sx={{ overflowX: "auto" }}>
      <Table sx={{ minWidth: 640 }}>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={filteredUnmapped.length > 0 && selectedCatalogSubjectIds.length === filteredUnmapped.length}
                onChange={(e) => setSelectedCatalogSubjectIds(e.target.checked ? filteredUnmapped.map((s) => s.id) : [])}
              />
            </TableCell>
            <TableCell>Code</TableCell>
            <TableCell>Subject</TableCell>
            <TableCell align="right">Quick map</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredUnmapped.map((sub) => (
            <TableRow key={sub.id} hover selected={selectedCatalogSubjectIds.includes(sub.id)}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedCatalogSubjectIds.includes(sub.id)}
                  onChange={(e) =>
                    setSelectedCatalogSubjectIds(
                      e.target.checked ? [...selectedCatalogSubjectIds, sub.id] : selectedCatalogSubjectIds.filter((id) => id !== sub.id)
                    )
                  }
                />
              </TableCell>
              <TableCell>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {sub.subjectCode || "—"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {sub.name}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={0.75} useFlexGap sx={{ justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <AppButton size="small" variant="soft" onClick={() => handleAddFromCatalog(sub.id, "MANDATORY")}>
                    Mandatory
                  </AppButton>
                  <AppButton size="small" variant="soft" onClick={() => handleAddFromCatalog(sub.id, "GROUP_ELECTIVE")}>
                    Elective
                  </AppButton>
                  <AppButton size="small" variant="soft" onClick={() => handleAddFromCatalog(sub.id, "OPTIONAL_4TH")}>
                    4th
                  </AppButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteFromCatalog(sub)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Scrollbar>
    </TableContainer>
  );

  return (
    <AdminPageShell>
      <SessionPageHeader
        heading="Subject Mapping"
        current="Subject Mapping"
        action={
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            <AppButton variant="contained" size="small" startIcon={<AutoAwesomeIcon />} onClick={() => setShowPresetModal(true)}>
              NCTB presets
            </AppButton>
            <AppButton
              variant="outlined"
              size="small"
              startIcon={<ContentCopyIcon />}
                                onClick={() => {
                setCopySourceClassId(classes[0]?.id || "");
                                  setShowCopyModal(true);
                                }}
            >
              Copy from
            </AppButton>
            <AppButton color="secondary" variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setShowAddSubjectModal(true)}>
              New subject
            </AppButton>
          </Stack>
        }
      />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          mb: 2.5,
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr)) minmax(220px, 1.6fr)" },
        }}
      >
        {stats.map((item) => (
          <AppCard key={item.label} sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              {item.label}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5 }}>
              {item.value}
            </Typography>
          </AppCard>
        ))}
        <AppCard sx={{ minWidth: 0, gridColumn: { xs: "1 / -1", md: "auto" }, bgcolor: "primary.lighter", borderColor: "transparent" }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between", height: 1 }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "common.white",
                  color: "primary.main",
                  flexShrink: 0,
                }}
              >
                <PeopleIcon fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  Enrolled
                </Typography>
                <Typography variant="h5">{enrolledCount}</Typography>
              </Box>
            </Stack>
            <AppButton
              size="small"
              variant="contained"
              startIcon={<SyncIcon />}
              loading={actionLoading}
              disabled={!mappings.length}
              onClick={handleSyncToStudents}
              sx={{ flexShrink: 0 }}
            >
              Sync
            </AppButton>
          </Stack>
        </AppCard>
      </Box>

      <AppCard>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" } }}>
            {selectedClassId && (
              <Box sx={{ width: { xs: 1, md: 280 }, flexShrink: 0 }}>
                <AppSelect
                  label="Target class"
                  value={selectedClassId}
                  onChange={handleClassChange}
                  options={classes.map((c) => ({ value: c.id, label: c.name }))}
                />
              </Box>
            )}
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", flex: 1 }}>
              {groupOptions.map((grp) => (
                <AppChip
                  key={grp}
                  clickable
                  color={selectedGroup === grp ? "primary" : "default"}
                  variant={selectedGroup === grp ? "filled" : "soft"}
                  label={GROUP_LABELS[grp] || grp.replace("_", " ")}
                  onClick={() => setSelectedGroup(grp)}
                />
              ))}
            </Stack>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", borderBottom: 1, borderColor: "divider", pb: 0.5 }}
          >
            <CustomTabs
              value={activeTab}
              onChange={(_, value) => value && setActiveTab(value as "mapped" | "catalog")}
              sx={{ minHeight: 40, width: { xs: 1, sm: "auto" } }}
            >
              <Tab value="mapped" label={`Mapped (${mappings.length})`} />
              <Tab value="catalog" label={`Catalog (${unmappedSubjects.length})`} />
            </CustomTabs>
            <AppTextField
              placeholder="Search subject name or code"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startIcon={<SearchIcon fontSize="small" />}
              sx={{ width: { xs: 1, sm: 280 } }}
            />
          </Stack>

          {activeTab === "mapped" && selectedMappingIds.length > 0 && (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              useFlexGap
              sx={{ p: 1.5, bgcolor: "primary.lighter", borderRadius: 2, alignItems: { sm: "center" }, flexWrap: "wrap" }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, mr: { sm: 1 } }}>
                {selectedMappingIds.length} selected
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                <AppButton size="small" onClick={() => handleBatchUpdateMapped("MANDATORY")}>
                  Mandatory
                </AppButton>
                <AppButton size="small" onClick={() => handleBatchUpdateMapped("GROUP_ELECTIVE")}>
                  Elective
                </AppButton>
                <AppButton size="small" onClick={() => handleBatchUpdateMapped("OPTIONAL_4TH")}>
                  4th subject
                </AppButton>
                <AppButton size="small" color="error" onClick={handleBatchRemoveMapped}>
                  Remove
                </AppButton>
              </Stack>
            </Stack>
          )}

          {activeTab === "catalog" && selectedCatalogSubjectIds.length > 0 && (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              useFlexGap
              sx={{ p: 1.5, bgcolor: "primary.lighter", borderRadius: 2, alignItems: { sm: "center" }, flexWrap: "wrap" }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, mr: { sm: 1 } }}>
                {selectedCatalogSubjectIds.length} selected
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                <AppButton size="small" onClick={() => handleBatchAssignFromCatalog("MANDATORY")}>
                  + Mandatory
                </AppButton>
                <AppButton size="small" onClick={() => handleBatchAssignFromCatalog("GROUP_ELECTIVE")}>
                  + Elective
                </AppButton>
                <AppButton size="small" onClick={() => handleBatchAssignFromCatalog("OPTIONAL_4TH")}>
                  + 4th
                </AppButton>
                <AppButton size="small" color="error" onClick={handleBatchDeleteFromCatalog}>
                  Remove from catalog
                </AppButton>
              </Stack>
            </Stack>
          )}

          {loading ? (
            <LoadingScreen label="Loading mappings..." />
          ) : activeTab === "mapped" ? (
            filteredMappings.length === 0 ? (
              mappedEmpty
            ) : (
              <>
                <Box sx={{ display: { xs: "none", md: "block" } }}>{mappedTable}</Box>
                <Box sx={{ display: { xs: "block", md: "none" } }}>{mappedCards}</Box>
              </>
            )
          ) : filteredUnmapped.length === 0 ? (
            catalogEmpty
          ) : (
            <>
              <Box sx={{ display: { xs: "none", md: "block" } }}>{catalogTable}</Box>
              <Box sx={{ display: { xs: "block", md: "none" } }}>{catalogCards}</Box>
            </>
          )}
        </Stack>
      </AppCard>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{
          mt: 2,
          p: 2,
          bgcolor: "grey.50",
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
          alignItems: { sm: "center" },
          justifyContent: "space-between",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Next: enroll students so they inherit these subjects automatically.
        </Typography>
        <AppButton
          component={Link}
          href={PATHS.setup.students}
          endIcon={<ArrowForwardIcon />}
          sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}
        >
          Student enrollment
        </AppButton>
      </Stack>

      <Dialog
        open={showPresetModal}
        onClose={() => setShowPresetModal(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { m: { xs: 2, sm: 4 }, width: { xs: "calc(100% - 32px)", sm: "auto" } } } }}
      >
        <DialogTitle>NCTB subject packages</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Apply a standard package for {selectedClass?.name || "this class"}.
          </Typography>
          <Stack spacing={1.5}>
            {NCTB_PRESETS.map((preset) => (
              <Box
                key={preset.key}
                component="button"
                  type="button"
                onClick={() => !actionLoading && handleApplyPreset(preset.key)}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                  cursor: actionLoading ? "wait" : "pointer",
                  textAlign: "left",
                  width: "100%",
                  bgcolor: "background.paper",
                  font: "inherit",
                  "&:hover": { borderColor: "primary.main", bgcolor: "primary.lighter" },
                }}
              >
                <Typography variant="subtitle2">{preset.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {preset.desc}
                </Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { m: { xs: 2, sm: 4 }, width: { xs: "calc(100% - 32px)", sm: "auto" } } } }}
      >
        <Box component="form" onSubmit={handleCopyFrom}>
          <DialogTitle>Clone subject mapping</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {classes.length > 0 && (
                <AppSelect
                  label="Source class"
                  value={copySourceClassId || classes[0].id}
                  onChange={setCopySourceClassId}
                  options={classes.map((c) => ({ value: c.id, label: c.name }))}
                />
              )}
              <AppSelect
                label="Source group"
                value={copySourceGroup}
                onChange={setCopySourceGroup}
                options={[
                  { value: "MANDATORY", label: "Mandatory" },
                  { value: "SCIENCE", label: "Science" },
                  { value: "HUMANITIES", label: "Humanities" },
                  { value: "BUSINESS_STUDIES", label: "Business Studies" },
                  { value: "GENERAL", label: "General" },
                  { value: "ALL", label: "All" },
                ]}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <AppButton color="inherit" onClick={() => setShowCopyModal(false)}>
              Cancel
            </AppButton>
            <AppButton type="submit" variant="contained" loading={actionLoading}>
              Clone mapping
            </AppButton>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={showAddSubjectModal}
        onClose={() => setShowAddSubjectModal(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { m: { xs: 2, sm: 4 }, width: { xs: "calc(100% - 32px)", sm: "auto" } } } }}
      >
        <Box component="form" onSubmit={handleCreateSubject}>
          <DialogTitle>Add new subject</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <AppTextField label="Subject code (optional)" value={newSubCode} onChange={(e) => setNewSubCode(e.target.value)} />
              <AppTextField label="Subject name" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} required />
              <AppSelect label="Classification" value={newSubType} onChange={(value) => setNewSubType(value as SubjectRole)} options={ROLE_OPTIONS} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <AppButton color="inherit" onClick={() => setShowAddSubjectModal(false)}>
                  Cancel
            </AppButton>
            <AppButton type="submit" variant="contained" loading={actionLoading}>
              Create and map
            </AppButton>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title || ""}
        content={confirmState?.content}
        confirmLabel={confirmState?.confirmLabel}
        danger={confirmState?.danger}
        loading={actionLoading}
        onClose={() => setConfirmState(null)}
        onConfirm={runConfirm}
      />

      <Snackbar open={Boolean(notification)} autoHideDuration={4000} onClose={() => setNotification(null)} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity={notification?.type || "success"} variant="filled" onClose={() => setNotification(null)}>
          {notification?.message}
        </Alert>
      </Snackbar>
    </AdminPageShell>
  );
}

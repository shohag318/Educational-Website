"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import PeopleIcon from "@mui/icons-material/People";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import EditIcon from "@mui/icons-material/Edit";
import ArchiveIcon from "@mui/icons-material/Archive";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";
import { AdminPageShell } from "@/sections/session/component/admin-page-shell";
import { SessionPageHeader } from "@/sections/session/component/session-page-header";
import { AppCard } from "@/components/card/app-card";
import { AppButton } from "@/components/button/app-button";
import { AppTextField } from "@/components/text-field/app-text-field";
import { DatePicker } from "@/components/date-picker/date-picker";
import { AppSelect } from "@/components/select/app-select";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { EmptyContent } from "@/components/empty-content/empty-content";
import { Label } from "@/components/label/label";
import { Scrollbar } from "@/components/scrollbar/scrollbar";
import { academicService } from "@/api/services";
import { getStoredSchoolInfo, saveStoredSchoolInfo } from "@/utils/settings-store";

interface AcademicYearItem {
  id: string;
  institutionId: string;
  yearName: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
  institution?: { id: string; name: string; code: string };
  _count?: { enrollments: number; exams: number };
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function SessionControlContent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const searchParams = useSearchParams();
  const initialAction = searchParams.get("action");
  const [sessions, setSessions] = useState<AcademicYearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "ARCHIVED">("ALL");
  const [allowMultipleActive, setAllowMultipleActive] = useState(true);
  const [activeLimit, setActiveLimit] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [yearName, setYearName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [termStructure, setTermStructure] = useState("NCTB_3_TERMS");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingSession, setEditingSession] = useState<AcademicYearItem | null>(null);
  const [editYearName, setEditYearName] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editIsCurrent, setEditIsCurrent] = useState(false);
  const [permanentDeleteSession, setPermanentDeleteSession] = useState<AcademicYearItem | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const json = await academicService.getYears();
      if (json.success) setSessions((json.data || []) as AcademicYearItem[]);
      else setErrorMessage((json as any).error || "Failed to fetch academic sessions");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    if (initialAction === "create") setShowCreateModal(true);
    try {
      const storedPolicy = localStorage.getItem("nctb_multi_active_sessions_policy_v1");
      if (storedPolicy) {
        const parsed = JSON.parse(storedPolicy);
        if (typeof parsed.allowMultiple === "boolean") setAllowMultipleActive(parsed.allowMultiple);
        if (typeof parsed.limit === "number") setActiveLimit(parsed.limit);
      }
    } catch {
      // keep defaults
    }
  }, [initialAction]);

  const handleUpdatePolicy = (allowMultiple: boolean, limit: number) => {
    setAllowMultipleActive(allowMultiple);
    setActiveLimit(limit);
    localStorage.setItem("nctb_multi_active_sessions_policy_v1", JSON.stringify({ allowMultiple, limit }));
    setSuccessMessage(
      allowMultiple
        ? limit === 0
          ? "Multiple active sessions enabled (unlimited)."
          : `Active sessions limit set to ${limit}.`
        : "Single active session mode selected."
    );
  };

  const currentYearNum = new Date().getFullYear();
  const yearSuggestions = useMemo(
    () => [
      String(currentYearNum + 1),
      `${currentYearNum}-${currentYearNum + 1}`,
      `${currentYearNum + 1}-${currentYearNum + 2}`,
      String(currentYearNum + 2),
    ],
    [currentYearNum]
  );

  const handleSelectSuggestion = (suggested: string) => {
    setYearName(suggested);
    const startYear = suggested.split("-")[0] || String(currentYearNum + 1);
    const endYear = suggested.includes("-") ? suggested.split("-")[1] : startYear;
    setStartDate(`${startYear}-01-01`);
    setEndDate(`${endYear}-12-31`);
  };

  const handleOpenCreateModal = () => {
    const defaultNext = String(currentYearNum + 1);
    setErrorMessage("");
    setYearName(defaultNext);
    setStartDate(`${defaultNext}-01-01`);
    setEndDate(`${defaultNext}-12-31`);
    setIsCurrent(false);
    setTermStructure("NCTB_3_TERMS");
    setNotes("");
    setShowCreateModal(true);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearName.trim()) {
      setErrorMessage("Please enter a valid session name.");
      return;
    }
    try {
      setSubmitting(true);
      const json = await academicService.createYear({
        yearName: yearName.trim(),
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        isCurrent,
        allowMultiple: allowMultipleActive,
        termStructure,
        notes,
      });
      if (json.success) {
        setSuccessMessage(`Session "${yearName.trim()}" created.`);
        setShowCreateModal(false);
        if (isCurrent) {
          const stored = getStoredSchoolInfo();
          saveStoredSchoolInfo({ ...stored, academicYear: yearName.trim() });
        }
        fetchSessions();
      } else {
        setErrorMessage((json as any).error || "Failed to create session.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetActive = async (session: AcademicYearItem) => {
    if (allowMultipleActive && activeLimit > 0 && activeCount >= activeLimit && !session.isCurrent) {
      setErrorMessage(`Active session limit (${activeLimit}) reached.`);
      return;
    }
    try {
      setLoading(true);
      const json = await academicService.updateYear({
        id: session.id,
        isCurrent: true,
        allowMultiple: allowMultipleActive,
      });
      if (json.success) {
        setSuccessMessage(`Session "${session.yearName}" is now active.`);
        const stored = getStoredSchoolInfo();
        saveStoredSchoolInfo({ ...stored, academicYear: session.yearName });
        fetchSessions();
      } else {
        setErrorMessage((json as any).error || "Failed to activate session.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (session: AcademicYearItem) => {
    setEditingSession(session);
    setEditYearName(session.yearName);
    setEditStartDate(session.startDate ? session.startDate.split("T")[0] : "");
    setEditEndDate(session.endDate ? session.endDate.split("T")[0] : "");
    setEditIsCurrent(session.isCurrent);
    setErrorMessage("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    try {
      setSubmitting(true);
      const json = await academicService.updateYear({
        id: editingSession.id,
        yearName: editYearName.trim(),
        startDate: editStartDate ? new Date(editStartDate).toISOString() : undefined,
        endDate: editEndDate ? new Date(editEndDate).toISOString() : undefined,
        isCurrent: editIsCurrent,
        allowMultiple: allowMultipleActive,
      });
      if (json.success) {
        setSuccessMessage(`Session "${editYearName.trim()}" updated.`);
        setEditingSession(null);
        if (editIsCurrent) {
          const stored = getStoredSchoolInfo();
          saveStoredSchoolInfo({ ...stored, academicYear: editYearName.trim() });
        }
        fetchSessions();
      } else {
        setErrorMessage((json as any).error || "Failed to update session.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveSession = async (session: AcademicYearItem) => {
    try {
      setLoading(true);
      const json = await academicService.updateYear({ id: session.id, isCurrent: false });
      if (json.success) {
        setSuccessMessage(`Session "${session.yearName}" archived.`);
        fetchSessions();
      } else {
        setErrorMessage((json as any).error || "Failed to archive session.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!permanentDeleteSession) return;
    try {
      setDeleteLoading(true);
      const json = await academicService.deleteYear(permanentDeleteSession.id, true);
      if (json.success) {
        setSuccessMessage(`Session "${permanentDeleteSession.yearName}" permanently deleted.`);
        setPermanentDeleteSession(null);
        setDeleteConfirmInput("");
        fetchSessions();
      } else {
        setErrorMessage((json as any).error || "Failed to delete session.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error occurred.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const activeSessions = useMemo(() => sessions.filter((s) => s.isCurrent), [sessions]);
  const archivedSessions = useMemo(() => sessions.filter((s) => !s.isCurrent), [sessions]);
  const activeCount = activeSessions.length;
  const archivedCount = archivedSessions.length;
  const activeSession = activeSessions[0];
  const filteredSessions = useMemo(
    () =>
      sessions.filter((s) => {
        const matchSearch =
          s.yearName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.institution?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchSearch) return false;
        if (statusFilter === "ACTIVE") return s.isCurrent;
        if (statusFilter === "ARCHIVED") return !s.isCurrent;
        return true;
      }),
    [sessions, searchTerm, statusFilter]
  );
  const totalEnrollmentsAcrossActive = activeSessions.reduce((sum, s) => sum + (s._count?.enrollments || 0), 0);
  const totalExamsAcrossActive = activeSessions.reduce((sum, s) => sum + (s._count?.exams || 0), 0);
  const policyValue = !allowMultipleActive ? "single" : activeLimit === 2 ? "2" : activeLimit === 3 ? "3" : "unlimited";
  const needsDeleteConfirm =
    (permanentDeleteSession?._count?.enrollments || 0) > 0 || (permanentDeleteSession?._count?.exams || 0) > 0;

  const kpis = [
    {
      label: activeCount > 1 ? `Active (${activeCount})` : "Current session",
      value: activeCount > 1 ? activeSessions.map((s) => s.yearName).join(", ") : activeSession?.yearName || "None",
      hint: activeCount > 1 ? "Running together" : formatDate(activeSession?.startDate),
      icon: <CheckCircleIcon color="success" fontSize="small" />,
    },
    { label: "Total sessions", value: String(sessions.length), hint: "Active and archived", icon: <CalendarMonthIcon color="action" fontSize="small" /> },
    { label: "Enrollments", value: String(totalEnrollmentsAcrossActive), hint: "Students in live sessions", icon: <PeopleIcon color="info" fontSize="small" /> },
    { label: "Exams", value: String(totalExamsAcrossActive), hint: "Linked to live sessions", icon: <EmojiEventsIcon color="warning" fontSize="small" /> },
  ];

  const toggleGroupSx = {
    width: { xs: 1, md: "auto" },
    flexWrap: { xs: "wrap", sm: "nowrap" },
    "& .MuiToggleButton-root": {
      flex: { xs: 1, md: "none" },
      px: { xs: 1, sm: 1.25 },
      whiteSpace: "nowrap",
      fontSize: { xs: 12, sm: 13 },
    },
  } as const;

  const dialogActionSx = {
    px: { xs: 2, sm: 3 },
    py: 2,
    gap: 1,
    flexDirection: { xs: "column", sm: "row" },
    position: { xs: "sticky", sm: "static" },
    bottom: 0,
    bgcolor: "background.paper",
    borderTop: { xs: 1, sm: 0 },
    borderColor: "divider",
    "& > :not(style)": { width: { xs: 1, sm: "auto" }, ml: { xs: "0 !important", sm: 1 } },
  } as const;

  const renderSessionActions = (session: AcademicYearItem, compact = false) => (
    <Stack
      direction="row"
      spacing={0.75}
      useFlexGap
      sx={{ flexWrap: "wrap", justifyContent: compact ? "flex-end" : { xs: "flex-start", md: "flex-end" } }}
    >
      {session.isCurrent ? (
        <AppButton
          size="small"
          color="warning"
          variant="outlined"
          startIcon={compact ? undefined : <ArchiveIcon />}
          onClick={() => handleArchiveSession(session)}
        >
          Archive
        </AppButton>
      ) : (
        <AppButton
          size="small"
          variant="contained"
          startIcon={compact ? undefined : <CheckCircleIcon />}
          onClick={() => handleSetActive(session)}
        >
          Activate
        </AppButton>
      )}
      <Tooltip title="Edit session">
        <IconButton size="small" onClick={() => handleOpenEdit(session)}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {!session.isCurrent && (
        <Tooltip title="Delete permanently">
          <IconButton
            size="small"
            color="error"
            onClick={() => {
              setPermanentDeleteSession(session);
              setDeleteConfirmInput("");
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );

  return (
    <AdminPageShell>
      <SessionPageHeader
        heading="Academic Sessions"
        current="Manager"
        action={
          <AppButton variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={handleOpenCreateModal}>
            Create session
          </AppButton>
        }
      />

      <Grid container spacing={{ xs: 1.5, md: 2 }} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid size={{ xs: 6, lg: 3 }} key={kpi.label}>
            <AppCard
                sx={{
                  height: 1,
                  "& .MuiCardContent-root": { p: { xs: 1.25, sm: 2 }, "&:last-child": { pb: { xs: 1.25, sm: 2 } } },
                }}
              >
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {kpi.label}
                  </Typography>
                  <Typography variant="h6" title={kpi.value} noWrap sx={{ mt: 0.5, fontSize: { xs: 16, sm: 20 } }}>
                    {kpi.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {kpi.hint}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    bgcolor: "background.neutral",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  {kpi.icon}
                </Box>
              </Stack>
            </AppCard>
          </Grid>
        ))}
      </Grid>

      <AppCard>
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}
          >
            <Box sx={{ width: { xs: 1, md: 320 }, minWidth: 0 }}>
              <AppTextField
                placeholder="Search by year or institution"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startIcon={<SearchIcon fontSize="small" />}
              />
            </Box>
            <ToggleButtonGroup
              exclusive
              fullWidth={isMobile}
              size="small"
              value={statusFilter}
              onChange={(_, value) => value && setStatusFilter(value)}
              sx={toggleGroupSx}
            >
              <ToggleButton value="ALL">All ({sessions.length})</ToggleButton>
              <ToggleButton value="ACTIVE">Active ({activeCount})</ToggleButton>
              <ToggleButton value="ARCHIVED">Archived ({archivedCount})</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            sx={{
              alignItems: { md: "center" },
              justifyContent: "space-between",
              p: { xs: 1.25, md: 1.5 },
              bgcolor: "primary.lighter",
              borderRadius: 2,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2">Live session limit</Typography>
              <Typography variant="caption" color="text.secondary">
                {activeCount} currently live · choose how many years can run together
              </Typography>
            </Box>
            <ToggleButtonGroup
              exclusive
              fullWidth={isMobile}
              size="small"
              value={policyValue}
              onChange={(_, value) => {
                if (value === "single") handleUpdatePolicy(false, 1);
                if (value === "2") handleUpdatePolicy(true, 2);
                if (value === "3") handleUpdatePolicy(true, 3);
                if (value === "unlimited") handleUpdatePolicy(true, 0);
              }}
              sx={toggleGroupSx}
            >
              <ToggleButton value="single">Single</ToggleButton>
              <ToggleButton value="2">2</ToggleButton>
              <ToggleButton value="3">3</ToggleButton>
              <ToggleButton value="unlimited">Unlimited</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {!loading && sessions.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              Showing {filteredSessions.length} of {sessions.length} sessions
            </Typography>
          )}
        </Stack>

        {loading ? (
          <LoadingScreen label="Loading sessions..." />
        ) : filteredSessions.length === 0 ? (
          <EmptyContent
            title={searchTerm ? "No matching sessions" : statusFilter === "ARCHIVED" ? "No archived sessions" : "No sessions found"}
            description={
              searchTerm
                ? "Try another year name, or clear the search to see every session."
                : "Create an academic year to start enrollment, exams, and results."
            }
            action={
              searchTerm ? (
                <AppButton variant="outline" onClick={() => setSearchTerm("")}>
                  Clear search
                </AppButton>
              ) : (
                <AppButton variant="contained" onClick={handleOpenCreateModal}>
                  Create session
                </AppButton>
              )
            }
          />
        ) : (
          <>
            <Stack spacing={1.25} sx={{ display: { xs: "flex", md: "none" } }}>
              {filteredSessions.map((session) => (
                <Box
                  key={session.id}
                  sx={{
                    p: 1.5,
                    border: 1,
                    borderColor: session.isCurrent ? "primary.main" : "divider",
                    borderRadius: 2,
                    bgcolor: session.isCurrent ? "action.selected" : "background.paper",
                  }}
                >
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
                    <Avatar
                      sx={{
                        bgcolor: session.isCurrent ? "primary.main" : "grey.200",
                        color: session.isCurrent ? "white" : "text.primary",
                        width: 40,
                        height: 40,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {session.yearName.slice(-2)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                        <Typography variant="subtitle2" noWrap>
                          Session {session.yearName}
                        </Typography>
                        <Label color={session.isCurrent ? "success" : "default"} variant="soft">
                          {session.isCurrent ? "Active" : "Archived"}
                        </Label>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                        {session.institution?.name || "Institution"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                        {formatDate(session.startDate)} → {formatDate(session.endDate)}
                      </Typography>
                      <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap", mt: 1 }}>
                        <Label variant="soft">EIIN {session.institution?.code || "108254"}</Label>
                        <Label variant="soft">{session._count?.enrollments || 0} enrolled</Label>
                        <Label variant="soft">{session._count?.exams || 0} exams</Label>
                      </Stack>
                      <Box sx={{ mt: 1.25 }}>{renderSessionActions(session)}</Box>
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Stack>

            <Box sx={{ display: { xs: "none", md: "block" }, minWidth: 0 }}>
              <Scrollbar sx={{ width: 1, overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 760 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Session</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Period</TableCell>
                      <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>EIIN</TableCell>
                      <TableCell align="center">Enrollments</TableCell>
                      <TableCell align="center" sx={{ display: { xs: "none", lg: "table-cell" } }}>
                        Exams
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap", minWidth: 148 }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSessions.map((session) => (
                      <TableRow key={session.id} hover selected={session.isCurrent}>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                            <Avatar
                              sx={{
                                bgcolor: session.isCurrent ? "primary.main" : "grey.200",
                                color: session.isCurrent ? "white" : "text.primary",
                                width: 36,
                                height: 36,
                                fontSize: 13,
                              }}
                            >
                              {session.yearName.slice(-2)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="subtitle2" noWrap>
                                Session {session.yearName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {session.institution?.name || "Institution"}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Label color={session.isCurrent ? "success" : "default"} variant="soft">
                            {session.isCurrent ? "Active" : "Archived"}
                          </Label>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ whiteSpace: "nowrap" }}>
                            {formatDate(session.startDate)} → {formatDate(session.endDate)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>
                          <Chip size="small" variant="outlined" label={session.institution?.code || "108254"} />
                        </TableCell>
                        <TableCell align="center">{session._count?.enrollments || 0}</TableCell>
                        <TableCell align="center" sx={{ display: { xs: "none", lg: "table-cell" } }}>
                          {session._count?.exams || 0}
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          {renderSessionActions(session, true)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Scrollbar>
            </Box>
          </>
        )}
      </AppCard>

      <Dialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <Box component="form" onSubmit={handleCreateSession} sx={{ display: "flex", flexDirection: "column", height: 1 }}>
          <DialogTitle>Create academic session</DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <AppTextField label="Session name / year" value={yearName} onChange={(e) => setYearName(e.target.value)} required autoFocus />
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                {yearSuggestions.map((sug) => (
                  <Chip key={sug} size="small" label={sug} clickable onClick={() => handleSelectSuggestion(sug)} />
                ))}
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <DatePicker label="Start date" value={startDate} onChange={setStartDate} maxDate={endDate} required />
                <DatePicker label="End date" value={endDate} onChange={setEndDate} minDate={startDate} required />
              </Stack>
              <AppSelect
                label="Term structure"
                value={termStructure}
                onChange={setTermStructure}
                options={[
                  { value: "NCTB_3_TERMS", label: "NCTB 3 terms" },
                  { value: "COLLEGE_SEMESTER", label: "HSC 2 semesters" },
                  { value: "QUARTERLY", label: "4 quarters" },
                  { value: "CUSTOM", label: "Single annual + CA" },
                ]}
              />
              <AppTextField label="Memo / circular (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <FormControlLabel
                control={<Switch checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} />}
                label="Set as currently active session"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={dialogActionSx}>
            <AppButton variant="outlined" color="error" onClick={() => setShowCreateModal(false)}>
              Cancel
            </AppButton>
            <AppButton type="submit" variant="contained" color="primary" loading={submitting}>
              Create session
            </AppButton>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(editingSession)} onClose={() => setEditingSession(null)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <Box component="form" onSubmit={handleSaveEdit} sx={{ display: "flex", flexDirection: "column", height: 1 }}>
          <DialogTitle>Edit session {editingSession?.yearName}</DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <AppTextField label="Session name" value={editYearName} onChange={(e) => setEditYearName(e.target.value)} required />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <DatePicker label="Start date" value={editStartDate} onChange={setEditStartDate} maxDate={editEndDate} />
                <DatePicker label="End date" value={editEndDate} onChange={setEditEndDate} minDate={editStartDate} />
              </Stack>
              <FormControlLabel
                control={<Switch checked={editIsCurrent} onChange={(e) => setEditIsCurrent(e.target.checked)} />}
                label="Set as current active session"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={dialogActionSx}>
            <AppButton variant="outlined" color="error" onClick={() => setEditingSession(null)}>
              Cancel
            </AppButton>
            <AppButton type="submit" variant="contained" color="primary" loading={submitting}>
              Save changes
            </AppButton>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(permanentDeleteSession)} onClose={() => setPermanentDeleteSession(null)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ pr: 2 }}>Permanently delete session {permanentDeleteSession?.yearName}?</DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            This cannot be undone. Enrollments, exams, marks, and results for this year will be removed.
          </Alert>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid size={{ xs: 6 }}>
              <AppCard>
                <Typography variant="caption">Enrollments</Typography>
                <Typography variant="h6">{permanentDeleteSession?._count?.enrollments || 0}</Typography>
              </AppCard>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <AppCard>
                <Typography variant="caption">Exams</Typography>
                <Typography variant="h6">{permanentDeleteSession?._count?.exams || 0}</Typography>
              </AppCard>
            </Grid>
          </Grid>
          {needsDeleteConfirm && (
            <AppTextField
              label={`Type ${permanentDeleteSession?.yearName} to confirm`}
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions sx={dialogActionSx}>
          <AppButton variant="outlined" color="error" onClick={() => setPermanentDeleteSession(null)}>
            Cancel
          </AppButton>
          <AppButton
            color="error"
            variant="contained"
            loading={deleteLoading}
            disabled={needsDeleteConfirm && deleteConfirmInput.trim() !== permanentDeleteSession?.yearName}
            onClick={handleConfirmPermanentDelete}
          >
            Delete permanently
          </AppButton>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage("")}
        anchorOrigin={{ vertical: isMobile ? "bottom" : "top", horizontal: isMobile ? "center" : "right" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSuccessMessage("")} sx={{ width: 1 }}>
          {successMessage}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={5000}
        onClose={() => setErrorMessage("")}
        anchorOrigin={{ vertical: isMobile ? "bottom" : "top", horizontal: isMobile ? "center" : "right" }}
      >
        <Alert severity="error" variant="filled" onClose={() => setErrorMessage("")} sx={{ width: 1 }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </AdminPageShell>
  );
}

export default function SessionControlPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Loading Session Manager..." />}>
      <SessionControlContent />
    </Suspense>
  );
}

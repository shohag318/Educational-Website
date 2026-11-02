"use client";

import Link from "next/link";
import { Box, Card, CardActionArea, Chip, Grid, Stack, Typography } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import PeopleIcon from "@mui/icons-material/People";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import TuneIcon from "@mui/icons-material/Tune";
import TableChartIcon from "@mui/icons-material/TableChart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import SendIcon from "@mui/icons-material/Send";
import AssessmentIcon from "@mui/icons-material/Assessment";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import BadgeIcon from "@mui/icons-material/Badge";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import DescriptionIcon from "@mui/icons-material/Description";
import GridViewIcon from "@mui/icons-material/GridView";
import BarChartIcon from "@mui/icons-material/BarChart";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PaymentsIcon from "@mui/icons-material/Payments";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SettingsIcon from "@mui/icons-material/Settings";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import DateRangeIcon from "@mui/icons-material/DateRange";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { AppButton } from "@/components/button/app-button";
import { CONFIG, PATHS } from "@/config-global";

const sessionControlItems = [
  { name: "Classes & Sections", href: PATHS.setup.classes, icon: SchoolIcon, color: "success" as const },
  { name: "Subject Mapping", href: PATHS.setup.subjectMapping, icon: MenuBookIcon, color: "secondary" as const },
  { name: "Create Session", href: PATHS.session.create, icon: AddCircleOutlineIcon, color: "success" as const, badge: "New" },
  { name: "Session Manager", href: PATHS.session.root, icon: DateRangeIcon, color: "success" as const },
];

const studentInfoItems = [
  { name: "Student Enrollment", href: PATHS.setup.students, icon: PeopleIcon },
  { name: "Subject Mapping", href: PATHS.academic.subjectMapping, icon: MenuBookIcon },
  { name: "Student Profile", href: PATHS.student.profile, icon: HowToRegIcon },
  { name: "Attendance", href: PATHS.student.attendance, icon: EventAvailableIcon },
];

const downloadItems = [
  { name: "BANBEIS Census", href: PATHS.download.banbeis, icon: AssessmentIcon },
  { name: "Admission Form", href: PATHS.download.admissionForm, icon: DescriptionIcon },
  { name: "Student Info Register", href: PATHS.setup.studentInfo, icon: BadgeIcon },
  { name: "Student ID Cards", href: PATHS.student.idCards, icon: CreditCardIcon },
  { name: "Academic Transcript", href: PATHS.student.transcript, icon: DescriptionIcon },
  { name: "Exam Seat Plan", href: PATHS.student.seatPlan, icon: GridViewIcon },
];

const resultPhases = [
  {
    title: "Phase 1: Rules",
    steps: [{ name: "Grading & Assessment Rules", href: PATHS.academic.rules, icon: TuneIcon }],
  },
  {
    title: "Phase 2: Setup",
    steps: [
      { name: "Student Enrollment", href: PATHS.setup.students, icon: PeopleIcon },
      { name: "Exam Configuration", href: PATHS.setup.exams, icon: CalendarMonthIcon },
      { name: "Exam Routine", href: PATHS.setup.examRoutine, icon: DateRangeIcon },
    ],
  },
  {
    title: "Phase 3: Mark Entry & Processing",
    steps: [
      { name: "Mark Entry", href: PATHS.marks.entry, icon: TableChartIcon },
      { name: "Process & Review", href: PATHS.results.review, icon: CheckCircleIcon },
    ],
  },
  {
    title: "Phase 4: Reports & Publishing",
    steps: [
      { name: "Publish Results", href: PATHS.results.publish, icon: VerifiedUserIcon },
      { name: "Tabulation Sheet", href: PATHS.reports.tabulation, icon: AssessmentIcon },
      { name: "At a Glance", href: PATHS.reports.atAGlance, icon: BarChartIcon },
      { name: "Report Cards", href: PATHS.reports.marksheet, icon: WorkspacePremiumIcon },
      { name: "Failed Students", href: PATHS.reports.failList, icon: WarningAmberIcon },
    ],
  },
];

const financeAndAdmin = [
  { name: "SMS & Notices", href: PATHS.sms.notifications, icon: SendIcon, color: "secondary" as const },
  { name: "Student Fees", href: PATHS.fees.root, icon: ReceiptIcon, color: "warning" as const },
  { name: "Fee Collection", href: PATHS.fees.collection, icon: PaymentsIcon, color: "success" as const },
  { name: "Accounts & Finance", href: PATHS.accountant.root, icon: AccountBalanceIcon, color: "success" as const },
  { name: "Institution Settings", href: PATHS.settings.root, icon: SettingsIcon, color: "info" as const },
  { name: "Asset Management", href: PATHS.assets.root, icon: Inventory2Icon, color: "info" as const },
];

export default function DashboardOverviewPage() {
  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Card
        sx={{
          mb: 3,
          p: 3,
          color: "#fff",
          background: "linear-gradient(90deg, #0f172a 0%, #1e293b 55%, #064e3b 100%)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
          <Box>
            <Chip size="small" label={CONFIG.curriculumLabel} color="success" sx={{ mb: 1, fontWeight: 700 }} />
            <Typography variant="h4" color="inherit">
              School Management & Results
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: "grey.300" }}>
              Student records, examination management, result processing, and institutional finance.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <AppButton
              component={Link}
              href={PATHS.session.create}
              variant="contained"
              color="success"
              startIcon={<AddCircleOutlineIcon />}
            >
              New Session
            </AppButton>
            <AppButton
              component={Link}
              href={PATHS.marks.entry}
              variant="contained"
              color="inherit"
              startIcon={<TableChartIcon />}
            >
              Mark Entry
            </AppButton>
          </Stack>
        </Stack>
      </Card>

      <Card sx={{ p: 2.5, mb: 3 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="overline">Academic Sessions</Typography>
          <AppButton component={Link} href={PATHS.session.root} size="small" endIcon={<ArrowForwardIcon />}>
            Session Manager
          </AppButton>
        </Stack>
        <Grid container spacing={1.5}>
          {sessionControlItems.map((item) => {
            const Icon = item.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={item.href + item.name}>
                <Card variant="outlined">
                  <CardActionArea component={Link} href={item.href} sx={{ p: 1.5 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 1.5,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: "success.lighter",
                            color: "success.dark",
                          }}
                        >
                          <Icon fontSize="small" />
                        </Box>
                        <Typography variant="subtitle2">{item.name}</Typography>
                      </Stack>
                      {item.badge && <Chip size="small" color="success" label={item.badge} />}
                    </Stack>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Card>

      <Card sx={{ p: 2.5, mb: 3 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="overline">Student Management</Typography>
          <AppButton component={Link} href={PATHS.setup.students} size="small" endIcon={<ArrowForwardIcon />}>
            View All
          </AppButton>
        </Stack>
        <Grid container spacing={1.5}>
          {studentInfoItems.map((item) => {
            const Icon = item.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={item.href}>
                <Card variant="outlined">
                  <CardActionArea component={Link} href={item.href} sx={{ p: 1.5 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: 1.5, display: "grid", placeItems: "center", bgcolor: "info.lighter", color: "info.dark" }}>
                        <Icon fontSize="small" />
                      </Box>
                      <Typography variant="subtitle2">{item.name}</Typography>
                    </Stack>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Card>

      <Box sx={{ mb: 3 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="overline">Result Workflow</Typography>
          <Typography variant="caption" color="text.secondary">
            Phase 1 to Phase 4
          </Typography>
        </Stack>
        <Grid container spacing={2}>
          {resultPhases.map((phase) => (
            <Grid size={{ xs: 12, md: 6, lg: 3 }} key={phase.title}>
              <Card sx={{ p: 2, height: "100%" }}>
                <Typography variant="subtitle2" sx={{ pb: 1, mb: 1, borderBottom: 1, borderColor: "divider" }}>
                  {phase.title}
                </Typography>
                <Stack spacing={1}>
                  {phase.steps.map((step) => {
                    const Icon = step.icon;
                    return (
                      <Box
                        key={step.href}
                        component={Link}
                        href={step.href}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.25,
                          p: 1,
                          borderRadius: 1.5,
                          textDecoration: "none",
                          color: "text.primary",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <Box sx={{ width: 28, height: 28, borderRadius: 1, display: "grid", placeItems: "center", bgcolor: "success.lighter", color: "success.dark" }}>
                          <Icon sx={{ fontSize: 16 }} />
                        </Box>
                        <Typography variant="caption">{step.name}</Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Card sx={{ p: 2.5, mb: 3 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="overline">Downloads & Forms</Typography>
          <AppButton component={Link} href={PATHS.download.root} size="small" endIcon={<ArrowForwardIcon />}>
            Open Download Center
          </AppButton>
        </Stack>
        <Grid container spacing={1.5}>
          {downloadItems.map((item) => {
            const Icon = item.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={item.href}>
                <Card variant="outlined">
                  <CardActionArea component={Link} href={item.href} sx={{ p: 1.5 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: 1.5, display: "grid", placeItems: "center", bgcolor: "warning.lighter", color: "warning.dark" }}>
                        <Icon fontSize="small" />
                      </Box>
                      <Typography variant="subtitle2">{item.name}</Typography>
                    </Stack>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Card>

      <Box>
        <Typography variant="overline" sx={{ display: "block", mb: 2 }}>
          Finance & Administration
        </Typography>
        <Grid container spacing={1.5}>
          {financeAndAdmin.map((mod) => {
            const Icon = mod.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={mod.href}>
                <Card>
                  <CardActionArea component={Link} href={mod.href} sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: `${mod.color}.lighter`, color: `${mod.color}.dark` }}>
                        <Icon />
                      </Box>
                      <Typography variant="subtitle2">{mod.name}</Typography>
                    </Stack>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
}

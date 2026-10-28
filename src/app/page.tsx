import Link from "next/link";
import {
  School,
  Users,
  Calendar,
  BookOpen,
  Sliders,
  TableProperties,
  CheckCircle,
  ShieldCheck,
  Send,
  FileSpreadsheet,
  Award,
  Contact,
  CreditCard,
  CalendarCheck,
  FileText,
  LayoutGrid,
  FileBarChart,
  AlertTriangle,
  Receipt,
  HandCoins,
  Landmark,
  Settings,
  Download,
  UserCheck,
  CalendarRange,
  PlusCircle,
  Boxes,
  ArrowRight,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const sessionControlItems = [
    {
      name: "Classes & Sections",
      href: "/setup/classes",
      icon: School,
      accent: "teal",
    },
    {
      name: "Subject Mapping",
      href: "/setup/subject-mapping",
      icon: BookOpen,
      accent: "purple",
    },
    {
      name: "Create Session",
      href: "/session/create",
      icon: PlusCircle,
      accent: "emerald",
      badge: "New",
    },
    {
      name: "Session Manager",
      href: "/session",
      icon: CalendarRange,
      accent: "emerald",
    },
  ];

  const studentInfoItems = [
    { name: "Student Enrollment", href: "/setup/students", icon: Users },
    { name: "Subject Mapping", href: "/academic/subject-mapping", icon: BookOpen },
    { name: "Student Profile", href: "/student/profile", icon: UserCheck },
    { name: "Attendance", href: "/student/attendance", icon: CalendarCheck },
  ];

  const downloadItems = [
    { name: "BANBEIS Census", href: "/download/banbeis", icon: FileSpreadsheet },
    { name: "Admission Form", href: "/download/admission-form", icon: FileText },
    { name: "Student Info Register", href: "/setup/student-info", icon: Contact },
    { name: "Student ID Cards", href: "/student/id-cards", icon: CreditCard },
    { name: "Academic Transcript", href: "/student/transcript", icon: FileText },
    { name: "Exam Seat Plan", href: "/student/seat-plan", icon: LayoutGrid },
  ];

  const resultPhases = [
    {
      title: "Phase 1: Rules",
      steps: [
        { name: "Grading & Assessment Rules", href: "/academic/rules", icon: Sliders },
      ],
    },
    {
      title: "Phase 2: Setup",
      steps: [
        { name: "Student Enrollment", href: "/setup/students", icon: Users },
        { name: "Exam Configuration", href: "/setup/exams", icon: Calendar },
        { name: "Exam Routine", href: "/setup/exam-routine", icon: CalendarRange },
      ],
    },
    {
      title: "Phase 3: Mark Entry & Processing",
      steps: [
        { name: "Mark Entry", href: "/marks/entry", icon: TableProperties },
        { name: "Process & Review", href: "/results/review", icon: CheckCircle },
      ],
    },
    {
      title: "Phase 4: Reports & Publishing",
      steps: [
        { name: "Publish Results", href: "/results/publish", icon: ShieldCheck },
        { name: "Tabulation Sheet", href: "/reports/tabulation", icon: FileSpreadsheet },
        { name: "At a Glance", href: "/reports/at-a-glance", icon: FileBarChart },
        { name: "Report Cards", href: "/reports/marksheet", icon: Award },
        { name: "Failed Students", href: "/reports/fail-list", icon: AlertTriangle },
      ],
    },
  ];

  const financeAndAdmin = [
    {
      name: "SMS & Notices",
      href: "/notifications/sms",
      icon: Send,
      color: "violet",
    },
    {
      name: "Student Fees",
      href: "/fees",
      icon: Receipt,
      color: "amber",
    },
    {
      name: "Fee Collection",
      href: "/fees/collection",
      icon: HandCoins,
      color: "emerald",
    },
    {
      name: "Accounts & Finance",
      href: "/accountant",
      icon: Landmark,
      color: "emerald",
    },
    {
      name: "Institution Settings",
      href: "/settings",
      icon: Settings,
      color: "cyan",
    },
    {
      name: "Asset Management",
      href: "/assets",
      icon: Boxes,
      color: "cyan",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800">
            NCTB Standard
          </span>
          <h1 className="text-2xl font-bold mt-2">School Management & Results</h1>
          <p className="text-sm text-slate-300 mt-1">
            Student records, examination management, result processing, and institutional finance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/session/create"
            className="text-xs text-white bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 rounded-xl font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Session</span>
          </Link>
          <Link
            href="/marks/entry"
            className="text-xs text-slate-900 bg-white hover:bg-slate-100 px-3.5 py-2 rounded-xl font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <TableProperties className="w-4 h-4 text-emerald-600" />
            <span>Mark Entry</span>
          </Link>
        </div>
      </div>

      {/* Academic Sessions */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Academic Sessions
            </h2>
          </div>
          <Link
            href="/session"
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center space-x-1 transition-colors"
          >
            <span>Session Manager</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sessionControlItems.map((item, idx) => {
            const Icon = item.icon;
            const isEmerald = item.accent === "emerald";
            const isPurple = item.accent === "purple";
            const isTeal = item.accent === "teal";

            return (
              <Link
                key={idx}
                href={item.href}
                className="group border border-slate-200 hover:border-emerald-500 rounded-xl p-3.5 transition-all hover:shadow-xs bg-slate-50/50 hover:bg-white flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isEmerald
                        ? "bg-emerald-100 text-emerald-800"
                        : isPurple
                        ? "bg-purple-100 text-purple-800"
                        : isTeal
                        ? "bg-teal-100 text-teal-800"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors truncate">
                    {item.name}
                  </h3>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Student Management */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span>Student Management</span>
          </h2>
          <Link
            href="/setup/students"
            className="text-xs text-sky-700 hover:text-sky-800 font-semibold flex items-center space-x-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {studentInfoItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.href}
                className="group border border-slate-200 hover:border-sky-500 rounded-xl p-3.5 transition-all hover:shadow-xs bg-slate-50/50 hover:bg-white flex items-center space-x-3"
              >
                <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-sky-700" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm group-hover:text-sky-700 transition-colors truncate">
                  {item.name}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Examination & Result Workflow */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Result Workflow
          </h2>
          <span className="text-xs text-slate-500 font-medium">Phase 1 to Phase 4</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {resultPhases.map((phase, pIdx) => (
            <div key={pIdx} className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center space-x-1.5 pb-2 border-b border-slate-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  <span className="truncate">{phase.title}</span>
                </h3>

                <div className="space-y-2">
                  {phase.steps.map((step, sIdx) => {
                    const Icon = step.icon;
                    return (
                      <Link
                        key={sIdx}
                        href={step.href}
                        className="group flex items-center space-x-2.5 p-2 rounded-lg hover:bg-emerald-50/60 border border-transparent hover:border-emerald-200 transition-all"
                      >
                        <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-100">
                          <Icon className="w-3.5 h-3.5 text-emerald-700" />
                        </div>
                        <span className="font-medium text-slate-800 text-xs group-hover:text-emerald-700 transition-colors truncate">
                          {step.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Downloads & Official Stationery */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Downloads & Forms
            </h2>
          </div>
          <Link
            href="/download"
            className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center space-x-1 transition-colors"
          >
            <span>Open Download Center</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {downloadItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.href}
                className="group border border-slate-200 hover:border-amber-500 rounded-xl p-3.5 transition-all hover:shadow-xs bg-slate-50/50 hover:bg-white flex items-center space-x-3"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-amber-700" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm group-hover:text-amber-700 transition-colors truncate">
                  {item.name}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Finance, Settings & Administration */}
      <div>
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-500"></span>
          <span>Finance & Administration</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {financeAndAdmin.map((mod, idx) => {
            const Icon = mod.icon;
            const colorClasses = {
              violet: "bg-violet-100 text-violet-700 group-hover:border-violet-500 group-hover:text-violet-700",
              amber: "bg-amber-100 text-amber-700 group-hover:border-amber-500 group-hover:text-amber-700",
              emerald: "bg-emerald-100 text-emerald-700 group-hover:border-emerald-500 group-hover:text-emerald-700",
              cyan: "bg-cyan-100 text-cyan-700 group-hover:border-cyan-500 group-hover:text-cyan-700",
            }[mod.color] || "bg-slate-100 text-slate-700";

            return (
              <Link
                key={idx}
                href={mod.href}
                className="group bg-white rounded-xl border border-slate-200 hover:border-emerald-500 p-4 shadow-xs transition-all hover:shadow-xs flex items-center space-x-3.5"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClasses.split(" ")[0]}`}>
                  <Icon className={`w-5 h-5 ${colorClasses.split(" ")[1]}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors truncate">
                    {mod.name}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

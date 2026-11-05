"use client";

import Link from "next/link";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  ArrowRight,
  Contact,
  CreditCard,
  LayoutGrid,
  CalendarRange,
} from "@/components/iconify/lucide";
import { getStoredSchoolInfo } from "@/lib/settingsStore";
import { useEffect, useState } from "react";
import {
  DownloadPageShell,
  DownloadHero,
  DownloadEyebrow,
  DownloadMetaChip,
  DownloadPanel,
} from "@/sections/download/component/download-page-ui";

export default function DownloadRootPage() {
  const [schoolInfo, setSchoolInfo] = useState<any>(null);

  useEffect(() => {
    setSchoolInfo(getStoredSchoolInfo());
  }, []);

  const downloadCards = [
    {
      title: "Academic Calendar",
      desc: "Annual academic schedule, holidays, exam dates, and official printable planner.",
      href: "/download/academic-calendar",
      actionText: "Open Calendar",
      icon: CalendarRange,
      tone: "amber",
      tag: "A4 Print",
    },
    {
      title: "Admission Form",
      desc: "Printable student admission application form with student and guardian fields.",
      href: "/download/admission-form",
      actionText: "Print Form",
      icon: FileText,
      tone: "emerald",
      tag: "Printable",
    },
    {
      title: "BANBEIS Census",
      desc: "Annual educational census workbook with student and teacher statistics.",
      href: "/download/banbeis",
      actionText: "View Census",
      icon: FileSpreadsheet,
      tone: "slate",
      tag: "Excel Export",
    },
    {
      title: "Student Register",
      desc: "Master student information register with filtering and spreadsheet export.",
      href: "/setup/student-info",
      actionText: "View Register",
      icon: Contact,
      tone: "sky",
      tag: "Excel • Print",
    },
    {
      title: "Student ID Cards",
      desc: "Printable student photo ID cards formatted for batch A4 card sheets.",
      href: "/student/id-cards",
      actionText: "Generate Cards",
      icon: CreditCard,
      tone: "violet",
      tag: "Batch Print",
    },
    {
      title: "Student Transcripts",
      desc: "Official cumulative academic transcripts and student progress reports.",
      href: "/student/transcript",
      actionText: "Open Transcripts",
      icon: FileText,
      tone: "rose",
      tag: "Official PDF",
    },
    {
      title: "Exam Seat Plan",
      desc: "Desk allocation cards, room distribution, and attendance lists for exams.",
      href: "/student/seat-plan",
      actionText: "Generate Seat Plan",
      icon: LayoutGrid,
      tone: "teal",
      tag: "Desk Cards",
    },
  ];

  const toneStyles: Record<string, { icon: string; button: string; border: string }> = {
    amber: {
      icon: "bg-amber-50 text-amber-700",
      button: "bg-amber-600 hover:bg-amber-700 text-white",
      border: "hover:border-amber-300",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-700",
      button: "bg-emerald-600 hover:bg-emerald-700 text-white",
      border: "hover:border-emerald-300",
    },
    sky: {
      icon: "bg-sky-50 text-sky-700",
      button: "bg-sky-600 hover:bg-sky-700 text-white",
      border: "hover:border-sky-300",
    },
    violet: {
      icon: "bg-violet-50 text-violet-700",
      button: "bg-violet-600 hover:bg-violet-700 text-white",
      border: "hover:border-violet-300",
    },
    rose: {
      icon: "bg-rose-50 text-rose-700",
      button: "bg-rose-600 hover:bg-rose-700 text-white",
      border: "hover:border-rose-300",
    },
    teal: {
      icon: "bg-teal-50 text-teal-700",
      button: "bg-teal-600 hover:bg-teal-700 text-white",
      border: "hover:border-teal-300",
    },
    slate: {
      icon: "bg-slate-100 text-slate-700",
      button: "bg-slate-800 hover:bg-slate-900 text-white",
      border: "hover:border-slate-300",
    },
  };

  return (
    <DownloadPageShell>
      <DownloadHero
        eyebrow={
          <DownloadEyebrow icon={<Download className="h-3.5 w-3.5" />}>Download Center</DownloadEyebrow>
        }
        meta={<DownloadMetaChip tone="warn">EIIN: {schoolInfo?.eiin || "108254"}</DownloadMetaChip>}
        title="Downloads & Official Stationery"
        description="Printable forms, academic calendars, census reports, and student documents — all in one place."
        actions={
          <>
            <Link
              href="/download/admission-form"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500"
            >
              <Printer className="h-3.5 w-3.5" />
              Admission Form
            </Link>
            <Link
              href="/download/academic-calendar"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-400"
            >
              <CalendarRange className="h-3.5 w-3.5" />
              Academic Calendar
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {downloadCards.map((card) => {
          const Icon = card.icon;
          const styles = toneStyles[card.tone] || toneStyles.slate;

          return (
            <DownloadPanel
              key={card.href}
              className={`group flex flex-col justify-between transition-all hover:shadow-md ${styles.border}`}
            >
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.icon}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {card.tag}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 transition-colors group-hover:text-amber-800">
                  {card.title}
                </h2>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{card.desc}</p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <Link
                  href={card.href}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${styles.button}`}
                >
                  <span>{card.actionText}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </DownloadPanel>
          );
        })}
      </div>
    </DownloadPageShell>
  );
}

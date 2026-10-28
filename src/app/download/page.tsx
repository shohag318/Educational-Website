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
} from "lucide-react";
import { DownloadNavHeader } from "./DownloadNavHeader";
import { getStoredSchoolInfo } from "@/lib/settingsStore";
import { useEffect, useState } from "react";

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
      accent: "amber",
      tag: "A4 Print",
    },
    {
      title: "Admission Form",
      desc: "Printable student admission application form with student and guardian fields.",
      href: "/download/admission-form",
      actionText: "Print Form",
      icon: FileText,
      accent: "emerald",
      tag: "Printable",
    },
    {
      title: "BANBEIS Census",
      desc: "Annual educational census workbook with student and teacher statistics.",
      href: "/download/banbeis",
      actionText: "View Census",
      icon: FileSpreadsheet,
      accent: "slate",
      tag: "Excel Export",
    },
    {
      title: "Student Register",
      desc: "Master student information register with filtering and spreadsheet export.",
      href: "/setup/student-info",
      actionText: "View Register",
      icon: Contact,
      accent: "blue",
      tag: "Excel • Print",
    },
    {
      title: "Student ID Cards",
      desc: "Printable student photo ID cards formatted for batch A4 card sheets.",
      href: "/student/id-cards",
      actionText: "Generate Cards",
      icon: CreditCard,
      accent: "purple",
      tag: "Batch Print",
    },
    {
      title: "Student Transcripts",
      desc: "Official cumulative academic transcripts and student progress reports.",
      href: "/student/transcript",
      actionText: "Open Transcripts",
      icon: FileText,
      accent: "rose",
      tag: "Official PDF",
    },
    {
      title: "Exam Seat Plan",
      desc: "Desk allocation cards, room distribution, and attendance lists for exams.",
      href: "/student/seat-plan",
      actionText: "Generate Seat Plan",
      icon: LayoutGrid,
      accent: "teal",
      tag: "Desk Cards",
    },
  ];

  const getAccentStyles = (accent: string) => {
    switch (accent) {
      case "amber":
        return {
          iconBg: "bg-amber-100 text-amber-800",
          button: "bg-amber-600 hover:bg-amber-700 text-white",
          border: "hover:border-amber-500",
        };
      case "emerald":
        return {
          iconBg: "bg-emerald-100 text-emerald-800",
          button: "bg-emerald-600 hover:bg-emerald-700 text-white",
          border: "hover:border-emerald-500",
        };
      case "blue":
        return {
          iconBg: "bg-blue-100 text-blue-800",
          button: "bg-blue-600 hover:bg-blue-700 text-white",
          border: "hover:border-blue-500",
        };
      case "purple":
        return {
          iconBg: "bg-purple-100 text-purple-800",
          button: "bg-purple-600 hover:bg-purple-700 text-white",
          border: "hover:border-purple-500",
        };
      case "rose":
        return {
          iconBg: "bg-rose-100 text-rose-800",
          button: "bg-rose-600 hover:bg-rose-700 text-white",
          border: "hover:border-rose-500",
        };
      case "teal":
        return {
          iconBg: "bg-teal-100 text-teal-800",
          button: "bg-teal-600 hover:bg-teal-700 text-white",
          border: "hover:border-teal-500",
        };
      default:
        return {
          iconBg: "bg-slate-100 text-slate-800",
          button: "bg-slate-900 hover:bg-slate-800 text-white",
          border: "hover:border-slate-500",
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans">
      <DownloadNavHeader />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-md border border-amber-800 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Download Center
            </span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
              EIIN: {schoolInfo?.eiin || "108254"}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight mt-2">
            Downloads & Official Stationery
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Printable forms, academic calendars, census reports, and student documents.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/download/admission-form"
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Admission Form</span>
          </Link>
          <Link
            href="/download/academic-calendar"
            className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition shadow-sm"
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Academic Calendar</span>
          </Link>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {downloadCards.map((card, idx) => {
          const Icon = card.icon;
          const styles = getAccentStyles(card.accent);

          return (
            <div
              key={idx}
              className={`bg-white rounded-xl border border-slate-200/90 ${styles.border} p-5 shadow-xs transition-all hover:shadow-xs flex flex-col justify-between group`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${styles.iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {card.tag}
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {card.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={card.href}
                  className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${styles.button}`}
                >
                  <span>{card.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

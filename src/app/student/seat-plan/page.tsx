import Link from "next/link";
import { LayoutGrid, Printer, ArrowLeft, Calendar, School, Users } from "lucide-react";
import { DownloadNavHeader } from "@/app/download/DownloadNavHeader";

export default function StudentExamSeatPlanPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <DownloadNavHeader />
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span>Students</span>
            <span>/</span>
            <span className="text-slate-800 font-medium">Exam Seat Plan</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-emerald-600" />
            Exam Seat Plan
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate room seat plans, bench labels, and room-wise roll charts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/setup/exams"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5" />
            Exam Configurations
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-sm font-bold text-slate-800">Exam Hall Allocation Parameters</h2>
          <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded">
            Next Exam: Pre-Test Examination 2026
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h3 className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-2">
              <School className="w-4 h-4 text-emerald-600" />
              Room 101 (Main Auditorium)
            </h3>
            <p className="text-xs text-slate-500">Capacity: 60 Seats • 2 Students per bench</p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-600 border-t border-slate-200 pt-2">
              <span>Allocated Rolls:</span>
              <strong className="text-slate-900 font-mono">1001 — 1060</strong>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h3 className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-2">
              <School className="w-4 h-4 text-emerald-600" />
              Room 202 (Science Wing)
            </h3>
            <p className="text-xs text-slate-500">Capacity: 40 Seats • Single student per bench</p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-600 border-t border-slate-200 pt-2">
              <span>Allocated Rolls:</span>
              <strong className="text-slate-900 font-mono">1061 — 1100</strong>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h3 className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-2">
              <School className="w-4 h-4 text-emerald-600" />
              Room 203 (Humanities Wing)
            </h3>
            <p className="text-xs text-slate-500">Capacity: 40 Seats • Single student per bench</p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-600 border-t border-slate-200 pt-2">
              <span>Allocated Rolls:</span>
              <strong className="text-slate-900 font-mono">2001 — 2040</strong>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition shadow-sm">
            <Printer className="w-3.5 h-3.5" />
            Print Bench Sticker Labels & Seat Plans
          </button>
        </div>
      </div>
    </div>
  );
}

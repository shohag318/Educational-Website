import Link from "next/link";
import { GraduationCap, Award, Printer, ArrowLeft, Sparkles, FileText } from "lucide-react";
import { DownloadNavHeader } from "@/app/download/DownloadNavHeader";

export default function StudentTranscriptPage() {
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
            <span className="text-slate-800 font-medium">Academic Transcript</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-600" />
            Academic Transcript
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate cumulative transcripts and multi-term academic records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/reports/marksheet"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 shadow-sm"
          >
            <Award className="w-3.5 h-3.5" />
            Single Exam Marksheets
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Transcript Generator & Archive
          </h2>
          <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-md">
            All Academic Sessions
          </span>
        </div>

        <div className="mt-6 text-center py-8">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-800">Cumulative Academic Records Engine</p>
          <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1">
            Combines Half-Yearly, Pre-Test, and Final Exam results with 4th subject conversion and NCTB GPA scales to produce signed institutional transcripts.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="/reports/tabulation"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition shadow-sm"
            >
              Open Tabulation Sheet
            </Link>
            <Link
              href="/setup/student-info"
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition"
            >
              Browse Student Roster
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

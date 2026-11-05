"use client";

import Link from "next/link";
import { GraduationCap, Award, FileText } from "@/components/iconify/lucide";
import {
  DownloadPageShell,
  DownloadHero,
  DownloadEyebrow,
  DownloadMetaChip,
  DownloadPanel,
  DownloadPanelHeader,
  DownloadEmptyState,
} from "@/sections/download/component/download-page-ui";

export default function StudentTranscriptPage() {
  return (
    <DownloadPageShell>
      <DownloadHero
        eyebrow={
          <DownloadEyebrow icon={<GraduationCap className="h-3.5 w-3.5" />}>
            Downloads • Transcripts
          </DownloadEyebrow>
        }
        meta={<DownloadMetaChip tone="success">All Academic Sessions</DownloadMetaChip>}
        title="Academic Transcript"
        description="Generate cumulative transcripts and multi-term academic records with NCTB GPA scales."
        actions={
          <Link
            href="/reports/marksheet"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
          >
            <Award className="h-3.5 w-3.5 text-amber-300" />
            Single Exam Marksheets
          </Link>
        }
      />

      <DownloadPanel>
        <DownloadPanelHeader
          icon={<FileText className="h-4 w-4" />}
          title="Transcript Generator & Archive"
          subtitle="Combine Half-Yearly, Pre-Test, and Final results into signed institutional transcripts."
        />

        <DownloadEmptyState
          icon={<GraduationCap className="h-6 w-6" />}
          title="Cumulative Academic Records Engine"
          description="Combines Half-Yearly, Pre-Test, and Final Exam results with 4th subject conversion and NCTB GPA scales to produce signed institutional transcripts."
          action={
            <>
              <Link
                href="/reports/tabulation"
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
              >
                Open Tabulation Sheet
              </Link>
              <Link
                href="/setup/student-info"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Browse Student Roster
              </Link>
            </>
          }
        />
      </DownloadPanel>
    </DownloadPageShell>
  );
}

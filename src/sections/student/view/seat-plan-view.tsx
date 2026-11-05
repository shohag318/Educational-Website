"use client";

import Link from "next/link";
import { LayoutGrid, Printer, Calendar, School } from "@/components/iconify/lucide";
import { AppButton } from "@/components/button/app-button";
import {
  DownloadPageShell,
  DownloadHero,
  DownloadEyebrow,
  DownloadMetaChip,
  DownloadPanel,
  DownloadPanelHeader,
  DownloadStatCard,
} from "@/sections/download/component/download-page-ui";

const ROOMS = [
  {
    name: "Room 101 (Main Auditorium)",
    detail: "Capacity: 60 Seats • 2 Students per bench",
    rolls: "1001 — 1060",
  },
  {
    name: "Room 202 (Science Wing)",
    detail: "Capacity: 40 Seats • Single student per bench",
    rolls: "1061 — 1100",
  },
  {
    name: "Room 203 (Humanities Wing)",
    detail: "Capacity: 40 Seats • Single student per bench",
    rolls: "2001 — 2040",
  },
];

export default function StudentExamSeatPlanPage() {
  return (
    <DownloadPageShell>
      <DownloadHero
        eyebrow={
          <DownloadEyebrow icon={<LayoutGrid className="h-3.5 w-3.5" />}>
            Downloads • Seat Plan
          </DownloadEyebrow>
        }
        meta={<DownloadMetaChip tone="warn">Next Exam: Pre-Test 2026</DownloadMetaChip>}
        title="Exam Seat Plan"
        description="Generate room seat plans, bench labels, and room-wise roll charts for upcoming examinations."
        actions={
          <Link
            href="/setup/exams"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
          >
            <Calendar className="h-3.5 w-3.5 text-amber-300" />
            Exam Configurations
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 no-print">
        <DownloadStatCard label="Rooms Allocated" value="3" hint="Active exam halls" tone="amber" icon={<School className="h-3.5 w-3.5" />} />
        <DownloadStatCard label="Total Seats" value="140" hint="Across all rooms" tone="sky" icon={<LayoutGrid className="h-3.5 w-3.5" />} />
        <DownloadStatCard label="Next Exam" value="Pre-Test" hint="Session 2026" tone="emerald" icon={<Calendar className="h-3.5 w-3.5" />} />
      </div>

      <DownloadPanel>
        <DownloadPanelHeader
          title="Exam Hall Allocation"
          subtitle="Room capacity and roll ranges for the next examination."
          action={
            <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">
              Ready to print
            </span>
          }
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {ROOMS.map((room) => (
            <div
              key={room.name}
              className="rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4"
            >
              <h3 className="mb-1 flex items-center gap-2 text-xs font-bold text-slate-800">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <School className="h-3.5 w-3.5" />
                </span>
                {room.name}
              </h3>
              <p className="text-xs text-slate-500">{room.detail}</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-xs text-slate-600">
                <span>Allocated Rolls</span>
                <strong className="font-mono text-slate-900">{room.rolls}</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <AppButton variant="contained" color="warning" startIcon={<Printer className="h-3.5 w-3.5" />}>
            Print Bench Labels & Seat Plans
          </AppButton>
        </div>
      </DownloadPanel>
    </DownloadPageShell>
  );
}

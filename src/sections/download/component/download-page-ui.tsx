"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DownloadNavHeader } from "@/sections/download/component/download-nav-header";

/** Shared page frame for every Downloads submenu screen. */
export function DownloadPageShell({
  children,
  className,
  hideNav = false,
}: {
  children: ReactNode;
  className?: string;
  hideNav?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto max-w-7xl space-y-5 pb-16 font-sans print:max-w-none print:space-y-0 print:p-0 print:m-0",
        className
      )}
    >
      {!hideNav && (
        <div className="no-print print:hidden">
          <DownloadNavHeader />
        </div>
      )}
      {children}
    </div>
  );
}

/** Amber-themed hero used across Download module pages. */
export function DownloadHero({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "no-print print:hidden relative overflow-hidden rounded-2xl border border-amber-900/40 bg-[linear-gradient(135deg,#0f172a_0%,#1c1917_42%,#78350f_100%)] p-5 text-white shadow-sm sm:p-6",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-2.5">
          {(eyebrow || meta) && (
            <div className="flex flex-wrap items-center gap-2">
              {eyebrow}
              {meta}
            </div>
          )}
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-xs leading-relaxed text-amber-50/75 sm:text-sm">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-stretch gap-2 sm:items-center">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

export function DownloadEyebrow({
  icon,
  children,
}: {
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/35 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-200">
      {icon}
      {children}
    </span>
  );
}

export function DownloadMetaChip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "info" | "warn";
}) {
  const tones = {
    neutral: "border-white/10 bg-white/10 text-slate-200",
    success: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
    info: "border-sky-400/30 bg-sky-500/15 text-sky-200",
    warn: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

/** White content surface with soft amber-friendly border. */
export function DownloadPanel({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        padded && "p-4 sm:p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DownloadPanelHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon ? (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              {icon}
            </span>
          ) : null}
          <div>
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function DownloadStatCard({
  label,
  value,
  hint,
  icon,
  tone = "amber",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "amber" | "emerald" | "sky" | "rose" | "slate" | "violet";
}) {
  const tones = {
    amber: "text-amber-700 bg-amber-50",
    emerald: "text-emerald-700 bg-emerald-50",
    sky: "text-sky-700 bg-sky-50",
    rose: "text-rose-700 bg-rose-50",
    slate: "text-slate-700 bg-slate-100",
    violet: "text-violet-700 bg-violet-50",
  };

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        {icon ? (
          <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg", tones[tone])}>
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">{value}</div>
      {hint ? <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function DownloadEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
      {icon ? (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-slate-500">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
    </div>
  );
}

export function DownloadToast({
  message,
  tone = "success",
}: {
  message: string;
  tone?: "success" | "error";
}) {
  return (
    <div
      className={cn(
        "no-print fixed right-5 top-20 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-xs font-semibold text-white shadow-xl",
        tone === "success"
          ? "border-emerald-400/40 bg-slate-900"
          : "border-rose-400/40 bg-slate-900"
      )}
    >
      <span
        className={cn(
          "inline-flex h-5 w-5 items-center justify-center rounded-full",
          tone === "success" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
        )}
      >
        •
      </span>
      {message}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";

export interface AcademicSessionOption {
  id: string;
  yearName: string;
  isCurrent: boolean;
}

export function useAcademicSessions(options?: { activeOnly?: boolean }) {
  const activeOnly = options?.activeOnly ?? true;
  const [sessions, setSessions] = useState<AcademicSessionOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const url = activeOnly ? "/api/academic-years?activeOnly=true" : "/api/academic-years";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.data)) {
          let list: AcademicSessionOption[] = data.data;

          if (activeOnly) {
            const activeList = list.filter((s) => s.isCurrent);
            if (activeList.length > 0) {
              list = activeList;
            }
          }

          // Deduplicate by yearName to avoid duplicates from multiple institutions
          const seen = new Set<string>();
          const uniqueList = list.filter((s) => {
            if (seen.has(s.yearName)) return false;
            seen.add(s.yearName);
            return true;
          });

          setSessions(uniqueList);
        }
      })
      .catch((err) => console.error("Error loading sessions:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeOnly]);

  const currentSession = sessions.find((s) => s.isCurrent) || sessions[0];

  return { sessions, currentSession, loading };
}

interface SessionSelectProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  includeAll?: boolean;
  allLabel?: string;
  className?: string;
  selectClassName?: string;
  labelClassName?: string;
  sessions?: AcademicSessionOption[];
  activeOnly?: boolean;
}

export function SessionSelect({
  value,
  onChange,
  label = "Session:",
  includeAll = false,
  allLabel = "All Sessions",
  className,
  selectClassName,
  labelClassName,
  sessions: customSessions,
  activeOnly = true,
}: SessionSelectProps) {
  const { sessions: fetchedSessions } = useAcademicSessions({ activeOnly });
  const rawSessions = customSessions && customSessions.length > 0 ? customSessions : fetchedSessions;

  const filteredSessions = activeOnly
    ? rawSessions.filter((s) => s.isCurrent).length > 0
      ? rawSessions.filter((s) => s.isCurrent)
      : rawSessions
    : rawSessions;

  // Deduplicate by yearName
  const sessions = filteredSessions.filter(
    (s, idx, arr) => arr.findIndex((item) => item.yearName === s.yearName) === idx
  );

  // Sync value if parent state has "ALL", is empty, or is invalid for the active sessions
  useEffect(() => {
    if (sessions.length > 0) {
      const activeSession = sessions.find((s) => s.isCurrent) || sessions[0];
      const isValidValue =
        (includeAll && value === "ALL") || sessions.some((s) => s.yearName === value);

      if (activeSession && (!value || !isValidValue)) {
        onChange(activeSession.yearName);
      }
    }
  }, [sessions, value, includeAll, onChange]);

  return (
    <div className={className}>
      {label && (
        <label className={labelClassName || "font-semibold text-slate-700 block mb-1 text-xs"}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          selectClassName ||
          "w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium bg-white text-xs text-slate-800"
        }
      >
        {includeAll && <option value="ALL">{allLabel}</option>}
        {sessions.map((s) => (
          <option key={s.id} value={s.yearName}>
            {s.yearName}
            {s.isCurrent ? " (Current)" : ""}
          </option>
        ))}
        {sessions.length === 0 && !includeAll && (
          <option value="2026">2026 (Current)</option>
        )}
      </select>
    </div>
  );
}

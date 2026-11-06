"use client";

import React, { useEffect, useState } from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { academicService } from "@/api/services";

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
    academicService
      .getYears(activeOnly)
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.data)) {
          let list: AcademicSessionOption[] = data.data;
          if (activeOnly) {
            const activeList = list.filter((s) => s.isCurrent);
            if (activeList.length > 0) list = activeList;
          }
          const seen = new Set<string>();
          setSessions(list.filter((s) => (seen.has(s.yearName) ? false : (seen.add(s.yearName), true))));
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
  fullWidth?: boolean;
}

export function SessionSelect({
  value,
  onChange,
  label = "Session",
  includeAll = false,
  allLabel = "All Sessions",
  className,
  sessions: customSessions,
  activeOnly = true,
  fullWidth = true,
}: SessionSelectProps) {
  const { sessions: fetchedSessions } = useAcademicSessions({ activeOnly });
  const rawSessions = customSessions && customSessions.length > 0 ? customSessions : fetchedSessions;
  const filteredSessions =
    activeOnly && rawSessions.filter((s) => s.isCurrent).length > 0
      ? rawSessions.filter((s) => s.isCurrent)
      : rawSessions;
  const sessions = filteredSessions.filter(
    (s, idx, arr) => arr.findIndex((item) => item.yearName === s.yearName) === idx
  );

  useEffect(() => {
    if (sessions.length > 0) {
      const activeSession = sessions.find((s) => s.isCurrent) || sessions[0];
      const isValidValue = (includeAll && value === "ALL") || sessions.some((s) => s.yearName === value);
      if (activeSession && (!value || !isValidValue)) {
        onChange(activeSession.yearName);
      }
    }
  }, [sessions, value, includeAll, onChange]);

  return (
    <FormControl
      size="small"
      fullWidth={fullWidth}
      className={className}
      sx={fullWidth ? undefined : { minWidth: 140 }}
    >
      {label && <InputLabel>{label}</InputLabel>}
      <Select
        value={value || sessions[0]?.yearName || "2026"}
        label={label || undefined}
        onChange={(e) => onChange(e.target.value)}
      >
        {includeAll && <MenuItem value="ALL">{allLabel}</MenuItem>}
        {sessions.map((s) => (
          <MenuItem key={s.id} value={s.yearName}>
            {s.yearName}
            {s.isCurrent ? " (Current)" : ""}
          </MenuItem>
        ))}
        {sessions.length === 0 && !includeAll && <MenuItem value="2026">2026 (Current)</MenuItem>}
      </Select>
    </FormControl>
  );
}

// src/app/user-role/audit-logs/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Download,
  Clock,
  User,
  RotateCcw,
  Sparkles,
} from "@/components/iconify/lucide";
import { UserRoleNavHeader } from "@/sections/user-role/component/user-role-nav-header";
import { SessionSelect } from "@/components/SessionSelect";
import { AppButton } from "@/components/button/app-button";
import { AppCard, AppSelect, AppTable, Label, TableFilterBar } from "@/components";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  AuditLogEntry,
  getStoredAuditLogs,
  saveAuditLogs,
  DEFAULT_AUDIT_LOGS,
} from "@/sections/user-role/schema/user-role-store";

export default function SecurityAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = () => {
    setLogs(getStoredAuditLogs());
  };

  useEffect(() => {
    loadData();

    const handleSync = () => loadData();
    window.addEventListener("nctb_user_roles_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("nctb_user_roles_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedSession !== "ALL") {
        const yearPrefix = selectedSession.slice(0, 4);
        if (log.timestamp && !log.timestamp.includes(yearPrefix)) return false;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (log.details || "").toLowerCase().includes(q) ||
        (log.action || "").toLowerCase().includes(q) ||
        (log.userName || "").toLowerCase().includes(q) ||
        (log.ipAddress || "").includes(q);

      const matchSeverity =
        severityFilter === "ALL" || log.severity === severityFilter;
      const matchCategory =
        categoryFilter === "ALL" || log.category === categoryFilter;

      return matchSearch && matchSeverity && matchCategory;
    });
  }, [logs, searchQuery, selectedSession, severityFilter, categoryFilter]);

  // Stats
  const totalEvents = logs.length;
  const criticalCount = logs.filter((l) => l.severity === "CRITICAL").length;
  const warningCount = logs.filter((l) => l.severity === "WARNING").length;
  const permissionCount = logs.filter((l) => l.category === "PERMISSION").length;

  const handleClearLogs = () => {
    if (confirm("Reset audit trail to institutional default events?")) {
      saveAuditLogs(DEFAULT_AUDIT_LOGS);
      setLogs(DEFAULT_AUDIT_LOGS);
      showToast("Audit trail restored to default sample events.");
    }
  };

  const exportCSV = () => {
    const headers = "ID,Timestamp,User,Action,Category,Severity,IP,Details\n";
    const rows = logs
      .map(
        (l) =>
          `"${l.id}","${l.timestamp}","${l.userName}","${l.action}","${l.category}","${l.severity}","${l.ipAddress}","${l.details.replace(/"/g, '""')}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Security_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2.5 text-xs border border-purple-500/50 animate-bounce">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <UserRoleNavHeader />

      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <Link href="/settings" className="hover:underline">Setting Module</Link>
          <span>/</span>
          <Link href="/user-role" className="hover:underline">User Role</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">Security & Audit Trail</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-600" />
              Security Audit Logs
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review log of role changes, marks publishing, account updates, and system activity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AppButton
              onClick={handleClearLogs}
              variant="outline"
              color="inherit"
              size="small"
              startIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset Sample Logs
            </AppButton>
            <AppButton
              onClick={exportCSV}
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<Download className="w-4 h-4" />}
            >
              Export Audit CSV
            </AppButton>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Total Events Logged</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalEvents}</p>
          <p className="text-[11px] text-slate-500 mt-1">Recorded audit incidents</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Critical Actions</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{criticalCount}</p>
          <p className="text-[11px] text-rose-500 mt-1">Marks lockdown & resets</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Warnings & Overrides</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{warningCount}</p>
          <p className="text-[11px] text-amber-500 mt-1">Suspensions & deletions</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Permission Changes</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{permissionCount}</p>
          <p className="text-[11px] text-purple-600 mt-1">RBAC matrix modifications</p>
        </div>
      </div>

      <AppCard>
        <TableFilterBar
          filters={
            <>
              <Box sx={{ width: { xs: 1, sm: 200 } }}>
                <SessionSelect
                  value={selectedSession}
                  onChange={(val) => setSelectedSession(val)}
                  label="Session"
                  includeAll
                  allLabel="All Sessions"
                  activeOnly={false}
                  fullWidth
                />
              </Box>
              <Box sx={{ width: { xs: 1, sm: 180 } }}>
                <AppSelect
                  label="Severity"
                  value={severityFilter}
                  onChange={setSeverityFilter}
                  options={[
                    { value: "ALL", label: "All Severities" },
                    { value: "INFO", label: "Info" },
                    { value: "WARNING", label: "Warning" },
                    { value: "CRITICAL", label: "Critical" },
                  ]}
                />
              </Box>
              <Box sx={{ width: { xs: 1, sm: 200 } }}>
                <AppSelect
                  label="Category"
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={[
                    { value: "ALL", label: "All Categories" },
                    { value: "SECURITY", label: "Security" },
                    { value: "USER_MANAGEMENT", label: "User Management" },
                    { value: "PERMISSION", label: "Permission Matrix" },
                    { value: "DELEGATION", label: "Delegation" },
                  ]}
                />
              </Box>
            </>
          }
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by action, actor, IP address, details..."
        >
          <AppTable<AuditLogEntry>
            embedded
            rows={filteredLogs}
            rowKey={(row) => row.id}
            defaultOrderBy="timestamp"
            minWidth={960}
            columns={[
          {
            id: "timestamp",
            label: "Timestamp",
            render: (log) => (
              <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", whiteSpace: "nowrap" }}>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <Typography variant="caption" sx={{ fontWeight: 700 }} color="text.secondary">
                  {log.timestamp}
                </Typography>
              </Stack>
            ),
          },
          {
            id: "userName",
            label: "Actor / User",
            render: (log) => (
              <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", whiteSpace: "nowrap" }}>
                <User className="w-3.5 h-3.5 text-slate-400" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {log.userName}
                </Typography>
              </Stack>
            ),
          },
          {
            id: "action",
            label: "Action Event",
            render: (log) => (
              <Box
                component="code"
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: "secondary.lighter",
                  color: "secondary.dark",
                  fontFamily: "monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  border: 1,
                  borderColor: "secondary.light",
                }}
              >
                {log.action}
              </Box>
            ),
          },
          {
            id: "category",
            label: "Category",
            render: (log) => (
              <Label variant="soft">{log.category}</Label>
            ),
          },
          {
            id: "severity",
            label: "Severity",
            align: "center",
            render: (log) => (
              <Label
                color={log.severity === "CRITICAL" ? "error" : log.severity === "WARNING" ? "warning" : "info"}
                variant="soft"
              >
                {log.severity}
              </Label>
            ),
          },
          {
            id: "details",
            label: "Details & Context",
            sortable: false,
            render: (log) => (
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }} noWrap title={log.details}>
                {log.details}
              </Typography>
            ),
          },
          {
            id: "ipAddress",
            label: "IP Address",
            render: (log) => (
              <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary", whiteSpace: "nowrap" }}>
                {log.ipAddress}
              </Typography>
            ),
          },
        ]}
      />
        </TableFilterBar>
      </AppCard>
    </div>
  );
}

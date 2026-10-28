// src/app/user-role/audit-logs/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Search,
  Download,
  Filter,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  User,
  Activity,
  Trash2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { UserRoleNavHeader } from "../UserRoleNavHeader";
import { SessionSelect } from "@/components/SessionSelect";
import {
  AuditLogEntry,
  getStoredAuditLogs,
  saveAuditLogs,
  DEFAULT_AUDIT_LOGS,
} from "../userRoleStore";

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
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Sample Logs</span>
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Audit CSV</span>
            </button>
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

      {/* Audit Log Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by action, actor, IP address, details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SessionSelect
              value={selectedSession}
              onChange={(val) => setSelectedSession(val)}
              label="Session:"
              includeAll={true}
              allLabel="All Sessions"
              activeOnly={false}
              labelClassName="text-xs font-semibold text-slate-600 whitespace-nowrap"
              selectClassName="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs text-slate-700 font-medium"
            />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs text-slate-700 font-medium"
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs text-slate-700 font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="SECURITY">Security</option>
              <option value="USER_MANAGEMENT">User Management</option>
              <option value="PERMISSION">Permission Matrix</option>
              <option value="DELEGATION">Delegation</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor / User</th>
                <th className="px-4 py-3">Action Event</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Severity</th>
                <th className="px-4 py-3">Details & Context</th>
                <th className="px-4 py-3 font-mono">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No audit records matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.timestamp}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.userName}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <code className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-mono text-[10px] font-bold border border-purple-200">
                          {log.action}
                        </code>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {log.category}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.severity === "CRITICAL"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : log.severity === "WARNING"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {log.severity}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-700 max-w-md">
                        <p className="line-clamp-2">{log.details}</p>
                      </td>

                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {log.ipAddress}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// src/app/user-role/roles/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Shield,
  Plus,
  Save,
  RotateCcw,
  CheckCircle2,
  Lock,
  Sparkles,
  Users,
  Info,
  Check,
  X,
  Filter,
  ChevronDown,
} from "lucide-react";
import { UserRoleNavHeader } from "../UserRoleNavHeader";
import {
  Role,
  DEFAULT_ROLES,
  MODULE_KEYS,
  getStoredRoles,
  saveRoles,
  getStoredUsers,
  saveUsers,
  addAuditLog,
} from "../userRoleStore";

export default function RolesMatrixPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedRoleForDetail, setSelectedRoleForDetail] = useState<string>("super_admin");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("super_admin");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Role Modal
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [copyFromRoleId, setCopyFromRoleId] = useState("subject_teacher");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = () => {
    const loadedRoles = getStoredRoles();
    setRoles(loadedRoles);

    const users = getStoredUsers();
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      counts[u.roleId] = (counts[u.roleId] || 0) + 1;
    });
    setUserCounts(counts);
    setHasChanges(false);
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

  // Toggle permission
  const handleTogglePermission = (
    roleId: string,
    moduleKey: string,
    permissionKey: "view" | "create" | "edit" | "delete" | "approve"
  ) => {
    if (roleId === "super_admin") {
      alert("Super Admin permissions are locked and cannot be revoked to prevent system lockout.");
      return;
    }

    setRoles((prevRoles) =>
      prevRoles.map((r) => {
        if (r.id !== roleId) return r;
        const currentMod = (r.permissions as any)[moduleKey] || {
          view: false,
          create: false,
          edit: false,
          delete: false,
          approve: false,
        };
        const updatedMod = {
          ...currentMod,
          [permissionKey]: !currentMod[permissionKey],
        };
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [moduleKey]: updatedMod,
          },
        };
      })
    );
    setHasChanges(true);
  };

  // Save all modified permissions
  const handleSaveChanges = () => {
    saveRoles(roles);
    setHasChanges(false);
    addAuditLog(
      "Super Admin",
      "ROLE_MATRIX_SAVED",
      "PERMISSION",
      "Saved updated role-based access matrix permissions across all institutional modules",
      "WARNING"
    );
    showToast("Role permission matrix saved successfully!");
  };

  // Reset to default roles
  const handleResetToDefault = () => {
    if (
      confirm(
        "Are you sure you want to reset all role permissions to NCTB institutional defaults? Any custom modifications will be restored."
      )
    ) {
      // Reassign any users that had custom roles back to subject_teacher to avoid orphaned role IDs
      const defaultRoleIds = new Set(DEFAULT_ROLES.map((r) => r.id));
      const currentUsers = getStoredUsers();
      let usersNeedUpdate = false;
      const updatedUsers = currentUsers.map((u) => {
        if (!defaultRoleIds.has(u.roleId)) {
          usersNeedUpdate = true;
          return { ...u, roleId: "subject_teacher" };
        }
        return u;
      });
      if (usersNeedUpdate) {
        saveUsers(updatedUsers);
      }

      saveRoles(DEFAULT_ROLES);
      setRoles(DEFAULT_ROLES);
      setSelectedRoleForDetail("super_admin");
      setSelectedRoleFilter("super_admin");
      setHasChanges(false);
      addAuditLog(
        "Super Admin",
        "ROLES_RESET_DEFAULT",
        "PERMISSION",
        "Restored all roles and permission levels to NCTB factory defaults",
        "CRITICAL"
      );
      showToast("Reset to institutional defaults complete.");
    }
  };

  // Grant all permissions to a specific role
  const handleGrantAllPermissions = (roleId: string) => {
    if (roleId === "super_admin") return;
    const targetRole = roles.find((r) => r.id === roleId);
    if (!targetRole) return;

    if (confirm(`Grant ALL module permissions to role '${targetRole.name}'?`)) {
      setRoles((prev) =>
        prev.map((r) => {
          if (r.id !== roleId) return r;
          const updatedPermissions: any = {};
          MODULE_KEYS.forEach((mod) => {
            updatedPermissions[mod.key] = {
              view: true,
              create: true,
              edit: true,
              delete: true,
              approve: true,
            };
          });
          return { ...r, permissions: updatedPermissions };
        })
      );
      setHasChanges(true);
      showToast(`All permissions granted to '${targetRole.name}'. Click 'Save Matrix Changes' to persist.`);
    }
  };

  // Revoke all permissions from a specific role
  const handleRevokeAllPermissions = (roleId: string) => {
    if (roleId === "super_admin") {
      alert("Super Admin master permissions cannot be revoked.");
      return;
    }
    const targetRole = roles.find((r) => r.id === roleId);
    if (!targetRole) return;

    if (confirm(`Revoke ALL module permissions from role '${targetRole.name}'?`)) {
      setRoles((prev) =>
        prev.map((r) => {
          if (r.id !== roleId) return r;
          const updatedPermissions: any = {};
          MODULE_KEYS.forEach((mod) => {
            updatedPermissions[mod.key] = {
              view: false,
              create: false,
              edit: false,
              delete: false,
              approve: false,
            };
          });
          return { ...r, permissions: updatedPermissions };
        })
      );
      setHasChanges(true);
      showToast(`All permissions revoked from '${targetRole.name}'. Click 'Save Matrix Changes' to persist.`);
    }
  };

  // Quick grant or clear all 5 operations for a single module row
  const handleToggleModuleRow = (
    roleId: string,
    moduleKey: string,
    grant: boolean
  ) => {
    if (roleId === "super_admin") return;
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== roleId) return r;
        const currentMod = (r.permissions as any)[moduleKey] || {};
        const updatedMod = {
          view: grant,
          create: grant,
          edit: grant,
          delete: grant,
          approve: grant,
        };
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [moduleKey]: updatedMod,
          },
        };
      })
    );
    setHasChanges(true);
  };

  // Create Custom Role
  const handleCreateCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const trimmedName = newRoleName.trim();
    if (roles.some((r) => r.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert(`A role named '${trimmedName}' already exists. Please choose a different title.`);
      return;
    }

    const baseRole = roles.find((r) => r.id === copyFromRoleId) || roles[0];
    const newId = `role_${Date.now()}`;

    const newRole: Role = {
      id: newId,
      name: trimmedName,
      description: newRoleDescription.trim() || `Custom institution role based on ${baseRole.name}`,
      color: "text-indigo-700 border-indigo-200 bg-indigo-50",
      badgeBg: "bg-indigo-100 text-indigo-800",
      isSystem: false,
      permissions: JSON.parse(JSON.stringify(baseRole.permissions)),
    };

    const updatedRoles = [...roles, newRole];
    saveRoles(updatedRoles);
    setRoles(updatedRoles);
    setIsAddRoleModalOpen(false);
    setNewRoleName("");
    setNewRoleDescription("");
    setSelectedRoleForDetail(newId);
    setSelectedRoleFilter(newId);

    addAuditLog(
      "Super Admin",
      "CUSTOM_ROLE_CREATED",
      "PERMISSION",
      `Created custom role '${newRole.name}' inheriting permissions from '${baseRole.name}'`,
      "INFO"
    );
    showToast(`Role '${newRole.name}' created successfully!`);
  };

  // Delete Custom Role
  const handleDeleteCustomRole = (role: Role) => {
    if (role.isSystem) {
      alert("Built-in system roles cannot be deleted.");
      return;
    }
    const currentUsers = getStoredUsers();
    const assignedUsers = currentUsers.filter((u) => u.roleId === role.id).length;
    if (assignedUsers > 0) {
      alert(`Cannot delete role '${role.name}' because ${assignedUsers} user(s) are currently assigned to it.`);
      return;
    }

    if (confirm(`Delete custom role '${role.name}'?`)) {
      const updatedRoles = roles.filter((r) => r.id !== role.id);
      saveRoles(updatedRoles);
      setRoles(updatedRoles);
      if (selectedRoleForDetail === role.id) {
        setSelectedRoleForDetail("super_admin");
      }
      if (selectedRoleFilter === role.id) {
        setSelectedRoleFilter("super_admin");
      }
      addAuditLog(
        "Super Admin",
        "ROLE_DELETED",
        "PERMISSION",
        `Deleted custom role '${role.name}'`,
        "WARNING"
      );
      showToast(`Role '${role.name}' deleted.`);
    }
  };

  const activeRoleObj = roles.find((r) => r.id === selectedRoleForDetail) || roles[0] || null;

  const displayedRoles =
    selectedRoleFilter === "ALL"
      ? roles
      : roles.filter((r) => r.id === selectedRoleFilter);

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
          <Link href="/settings" className="hover:underline">Settings</Link>
          <span>/</span>
          <Link href="/user-role" className="hover:underline">User Roles</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">Role Matrix</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-600" />
              Role & Permission Matrix
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure View, Create, Edit, Delete, and Approve permissions for each role.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefault}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={() => setIsAddRoleModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-purple-600" />
              <span>Add Custom Role</span>
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={!hasChanges}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer ${
                hasChanges
                  ? "bg-purple-700 hover:bg-purple-800 text-white animate-pulse"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Save Matrix Changes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Changes Banner */}
      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              You have unsaved changes to role permissions. Click <strong>Save Matrix Changes</strong> to commit them to the live engine.
            </span>
          </div>
          <button
            onClick={handleSaveChanges}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold transition cursor-pointer"
          >
            Save Now
          </button>
        </div>
      )}

      {/* Role Selector Badges / Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {roles.map((r) => {
          const isSelected = selectedRoleForDetail === r.id;
          const assignedCount = userCounts[r.id] || 0;

          return (
            <div
              key={r.id}
              onClick={() => {
                setSelectedRoleForDetail(r.id);
                setSelectedRoleFilter(r.id);
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative ${
                isSelected
                  ? "bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    r.isSystem ? "bg-slate-100 text-slate-700" : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {r.isSystem ? "SYSTEM" : "CUSTOM"}
                </span>
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {assignedCount}
                </span>
              </div>

              <h4 className="font-bold text-slate-900 text-xs truncate">{r.name}</h4>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 h-7 leading-3.5">
                {r.description}
              </p>

              {!r.isSystem && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCustomRole(r);
                  }}
                  className="mt-2 text-[10px] text-rose-600 hover:text-rose-800 font-bold hover:underline"
                >
                  Delete Role
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Role Quick Highlight */}
      {activeRoleObj && (
        <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-white">{activeRoleObj.name}</h3>
                <span className="bg-purple-800/80 text-purple-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                  {userCounts[activeRoleObj.id] || 0} users assigned
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{activeRoleObj.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mr-2">
              <span>Role ID:</span>
              <code className="text-purple-300 bg-slate-800 px-2 py-1 rounded font-mono text-[11px]">
                {activeRoleObj.id}
              </code>
            </div>
            {activeRoleObj.id !== "super_admin" && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleGrantAllPermissions(activeRoleObj.id)}
                  className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded text-[11px] font-semibold transition cursor-pointer"
                  title="Grant all 35 permissions to this role"
                >
                  Grant All
                </button>
                <button
                  onClick={() => handleRevokeAllPermissions(activeRoleObj.id)}
                  className="px-2.5 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded text-[11px] font-semibold transition cursor-pointer"
                  title="Revoke all permissions from this role"
                >
                  Revoke All
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* The Master RBAC Permission Matrix Table (Redesigned as per sample) */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-300 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Role & Permission Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Operation privileges per module (View, Create, Edit, Delete, Approve / Lock) structured by institutional role.
            </p>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1 font-semibold">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> Granted
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <X className="w-3.5 h-3.5 text-rose-500" /> Revoked
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <Lock className="w-3 h-3 text-slate-400" /> System Locked
            </span>
          </div>
        </div>

        {/* Role Filter & View Switcher Bar */}
        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-300 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <label htmlFor="role-filter-select" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 whitespace-nowrap">
              <Filter className="w-3.5 h-3.5 text-purple-600" />
              <span>Filter by Role:</span>
            </label>
            <div className="relative">
              <select
                id="role-filter-select"
                value={selectedRoleFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedRoleFilter(val);
                  if (val !== "ALL") {
                    setSelectedRoleForDetail(val);
                  }
                }}
                className="appearance-none bg-white border border-slate-300 hover:border-purple-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 text-xs font-semibold text-slate-800 rounded-lg pl-3 pr-8 py-1.5 shadow-2xs transition cursor-pointer min-w-[240px]"
              >
                <option value="ALL">All Roles ({roles.length})</option>
                <optgroup label="System & Custom Roles">
                  {roles.map((r) => {
                    const count = userCounts[r.id] || 0;
                    return (
                      <option key={r.id} value={r.id}>
                        {r.name} {count > 0 ? `(${count})` : ""} {r.isSystem ? "" : "• Custom"}
                      </option>
                    );
                  })}
                </optgroup>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {selectedRoleFilter !== "ALL" && (
              <button
                type="button"
                onClick={() => setSelectedRoleFilter("ALL")}
                className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-md transition cursor-pointer"
                title="Reset to view all roles"
              >
                Show All Roles
              </button>
            )}
          </div>

          {displayedRoles.length === 1 && displayedRoles[0].id !== "super_admin" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleGrantAllPermissions(displayedRoles[0].id)}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded text-xs font-semibold transition cursor-pointer"
              >
                Grant All to {displayedRoles[0].name}
              </button>
              <button
                type="button"
                onClick={() => handleRevokeAllPermissions(displayedRoles[0].id)}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded text-xs font-semibold transition cursor-pointer"
              >
                Revoke All
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto p-4 bg-white">
          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead>
              {/* Header Row 1: List | Module | Operation (spans 5 cols) */}
              <tr className="bg-slate-100 text-slate-900 font-bold text-xs">
                <th className="border border-slate-300 px-4 py-3 text-center w-52 font-bold text-slate-900 text-sm">
                  List
                </th>
                <th className="border border-slate-300 px-4 py-3 text-center min-w-[280px] font-bold text-slate-900 text-sm">
                  Module
                </th>
                <th
                  colSpan={5}
                  className="border border-slate-300 px-4 py-3 text-center font-bold text-slate-900 text-sm"
                >
                  Operation
                </th>
              </tr>

              {/* Header Row 2: Blank | Blank | View (Read) | Create (Add) | Edit (Update) | Delete (Remove) | Approve / Lock */}
              <tr className="bg-slate-50 text-slate-900 font-bold text-xs">
                <th className="border border-slate-300 px-4 py-2 bg-slate-50">&nbsp;</th>
                <th className="border border-slate-300 px-4 py-2 bg-slate-50">&nbsp;</th>
                <th className="border border-slate-300 px-3 py-2.5 text-center min-w-[110px] font-bold text-slate-900 text-xs">
                  View (Read)
                </th>
                <th className="border border-slate-300 px-3 py-2.5 text-center min-w-[110px] font-bold text-slate-900 text-xs">
                  Create (Add)
                </th>
                <th className="border border-slate-300 px-3 py-2.5 text-center min-w-[110px] font-bold text-slate-900 text-xs">
                  Edit (Update)
                </th>
                <th className="border border-slate-300 px-3 py-2.5 text-center min-w-[115px] font-bold text-slate-900 text-xs">
                  Delete (Remove)
                </th>
                <th className="border border-slate-300 px-3 py-2.5 text-center min-w-[115px] font-bold text-slate-900 text-xs">
                  Approve / Lock
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedRoles.map((role, roleIdx) => {
                const isSuperAdmin = role.id === "super_admin";
                const operations = [
                  { key: "view" as const, label: "View (Read)" },
                  { key: "create" as const, label: "Create (Add)" },
                  { key: "edit" as const, label: "Edit (Update)" },
                  { key: "delete" as const, label: "Delete (Remove)" },
                  { key: "approve" as const, label: "Approve / Lock" },
                ];

                return MODULE_KEYS.map((mod, modIdx) => {
                  const isFirstRowOfRole = modIdx === 0;

                  return (
                    <tr
                      key={`${role.id}-${mod.key}`}
                      className={`hover:bg-slate-50/75 transition-colors ${
                        isFirstRowOfRole && roleIdx > 0 ? "border-t-4 border-slate-400" : ""
                      }`}
                    >
                      {/* Column 1: List (Role Name) - RowSpan for all 7 modules of this role */}
                      {isFirstRowOfRole && (
                        <td
                          rowSpan={MODULE_KEYS.length}
                          className="border border-slate-300 px-4 py-6 text-center align-middle bg-white font-bold text-slate-900 w-52"
                        >
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <span className="text-sm font-bold text-slate-900">
                              {role.name}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                role.isSystem
                                  ? "bg-slate-100 text-slate-700 border border-slate-200"
                                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              }`}
                            >
                              {role.isSystem ? "SYSTEM" : "CUSTOM"}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 font-normal">
                              <Users className="w-3 h-3 text-slate-400" />
                              {userCounts[role.id] || 0} users
                            </span>
                            {!isSuperAdmin && (
                              <div className="pt-2 flex flex-col gap-1 w-full max-w-[120px]">
                                <button
                                  type="button"
                                  onClick={() => handleGrantAllPermissions(role.id)}
                                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold transition cursor-pointer"
                                >
                                  Grant All
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRevokeAllPermissions(role.id)}
                                  className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-semibold transition cursor-pointer"
                                >
                                  Revoke All
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Column 2: Module */}
                      <td className="border border-slate-300 px-4 py-3 align-middle bg-white">
                        <div className="font-bold text-xs text-slate-900">{mod.name}</div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5 leading-snug">
                          {mod.desc}
                        </div>
                        {!isSuperAdmin && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleModuleRow(role.id, mod.key, true)}
                              className="text-[9px] text-purple-600 hover:text-purple-800 font-semibold hover:underline"
                              title="Grant all 5 operations for this module"
                            >
                              Select All
                            </button>
                            <span className="text-slate-300 text-[10px]">|</span>
                            <button
                              type="button"
                              onClick={() => handleToggleModuleRow(role.id, mod.key, false)}
                              className="text-[9px] text-slate-400 hover:text-rose-600 font-semibold hover:underline"
                              title="Clear all operations for this module"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Columns 3 to 7: The 5 Operations */}
                      {operations.map((op) => {
                        const perm = (role.permissions as any)?.[mod.key]?.[op.key] ?? false;

                        return (
                          <td
                            key={`${role.id}-${mod.key}-${op.key}`}
                            className="border border-slate-300 px-3 py-2.5 text-center align-middle bg-white"
                          >
                            {isSuperAdmin ? (
                              <div
                                className="flex items-center justify-center gap-1"
                                title="Super Admin master access is permanent (locked)"
                              >
                                <input
                                  type="checkbox"
                                  checked={true}
                                  disabled
                                  className="w-4 h-4 text-purple-600 rounded border-purple-300 bg-purple-50 cursor-not-allowed accent-purple-600"
                                />
                                <Lock className="w-3 h-3 text-slate-400" />
                              </div>
                            ) : (
                              <label className="inline-flex items-center justify-center cursor-pointer p-1 rounded hover:bg-purple-50 transition">
                                <input
                                  type="checkbox"
                                  checked={perm}
                                  onChange={() => handleTogglePermission(role.id, mod.key, op.key)}
                                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer accent-purple-600"
                                />
                              </label>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Custom Role */}
      {isAddRoleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Create Custom Role</h3>
                  <p className="text-slate-500 text-[11px]">Define new institutional role title & baseline permissions</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddRoleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCustomRole} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Role Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Lab Incharge, Hostel Superintendent"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of duties and responsibilities..."
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clone Base Permissions From</label>
                <select
                  value={copyFromRoleId}
                  onChange={(e) => setCopyFromRoleId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  You can fine-tune specific permissions on the matrix after creating this role.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddRoleModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// src/app/user-role/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  UserPlus,
  Search,
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Smartphone,
  Mail,
  Phone,
  Trash2,
  Edit2,
  RefreshCw,
  Sparkles,
  Download,
  Filter,
  Layers,
  ChevronDown,
} from "lucide-react";
import { UserRoleNavHeader } from "./UserRoleNavHeader";
import { SessionSelect } from "@/components/SessionSelect";
import {
  UserAccount,
  Role,
  getStoredUsers,
  saveUsers,
  getStoredRoles,
  getStoredDelegations,
  saveDelegations,
  addAuditLog,
  MODULE_KEYS,
  getDefaultModulesForRole,
  getUserAccessibleModules,
} from "./userRoleStore";

export default function UserRolePage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [delegationCount, setDelegationCount] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<UserAccount | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRoleId, setFormRoleId] = useState("subject_teacher");
  const [formDesignation, setFormDesignation] = useState("");
  const [formDepartment, setFormDepartment] = useState("Science Department");
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "SUSPENDED" | "INVITED">("ACTIVE");
  const [form2FA, setForm2FA] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Module Access Dropdown State
  const [formAccessibleModules, setFormAccessibleModules] = useState<string[]>([]);
  const [isAddModuleDropdownOpen, setIsAddModuleDropdownOpen] = useState(false);
  const [isEditModuleDropdownOpen, setIsEditModuleDropdownOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = () => {
    setUsers(getStoredUsers());
    setRoles(getStoredRoles());
    setDelegationCount(getStoredDelegations().length);
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

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (selectedSession !== "ALL") {
        const yearPrefix = selectedSession.slice(0, 4);
        const createdYear = u.createdAt ? parseInt(u.createdAt.slice(0, 4), 10) : 0;
        const selectedYearNum = parseInt(yearPrefix, 10);
        // Active institutional staff accounts created in or before this academic session remain active
        const matchYear =
          (u.createdAt && u.createdAt.includes(yearPrefix)) ||
          (u.lastLogin && u.lastLogin.includes(yearPrefix)) ||
          (createdYear > 0 && selectedYearNum > 0 && createdYear <= selectedYearNum && u.status === "ACTIVE");
        if (!matchYear) return false;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (u.name || "").toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q) ||
        (u.designation || "").toLowerCase().includes(q) ||
        (u.department || "").toLowerCase().includes(q);

      const matchRole =
        selectedRoleFilter === "ALL" || u.roleId === selectedRoleFilter;
      const matchStatus =
        selectedStatusFilter === "ALL" || u.status === selectedStatusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, selectedSession, selectedRoleFilter, selectedStatusFilter]);

  // Statistics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "ACTIVE").length;
  const twoFactorUsers = users.filter((u) => u.twoFactorEnabled).length;
  const activeRolesCount = roles.length;

  // Create User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim()) {
      alert("Name and Username/Employee ID are required");
      return;
    }

    const trimmedUsername = formUsername.trim().toUpperCase();
    if (users.some((u) => u.username.toUpperCase() === trimmedUsername)) {
      alert(`User ID / Username '${trimmedUsername}' already exists. Please choose a unique ID.`);
      return;
    }

    const avatarColors = [
      "bg-purple-600",
      "bg-blue-600",
      "bg-emerald-600",
      "bg-amber-600",
      "bg-teal-600",
      "bg-indigo-600",
      "bg-rose-600",
      "bg-pink-600",
    ];
    const avatarBg = avatarColors[users.length % avatarColors.length];

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: formName.trim(),
      username: trimmedUsername,
      email: formEmail.trim() || `${trimmedUsername.toLowerCase()}@dhakaschool.edu.bd`,
      phone: formPhone.trim() || "01700-000000",
      roleId: formRoleId,
      designation: formDesignation.trim() || "Staff Member",
      department: formDepartment,
      status: "ACTIVE",
      twoFactorEnabled: form2FA,
      lastLogin: "Never",
      avatarBg,
      createdAt: new Date().toISOString().split("T")[0],
      accessibleModules:
        formAccessibleModules.length > 0
          ? formAccessibleModules
          : getDefaultModulesForRole(formRoleId, roles),
    };

    const updated = [newUser, ...users];
    saveUsers(updated);
    addAuditLog(
      "Super Admin",
      "USER_ACCOUNT_CREATED",
      "USER_MANAGEMENT",
      `Created user '${newUser.name}' (${newUser.username}) with role '${roles.find((r) => r.id === formRoleId)?.name || formRoleId}'`,
      "INFO"
    );

    setIsAddModalOpen(false);
    resetForm();
    showToast(`User ${newUser.name} created successfully!`);
  };

  // Open Edit Modal
  const openEditModal = (u: UserAccount) => {
    setSelectedUserToEdit(u);
    setFormName(u.name);
    setFormUsername(u.username);
    setFormEmail(u.email);
    setFormPhone(u.phone);
    setFormRoleId(u.roleId);
    setFormDesignation(u.designation);
    setFormDepartment(u.department);
    setFormStatus(u.status);
    setForm2FA(u.twoFactorEnabled);
    setFormAccessibleModules(getUserAccessibleModules(u, roles));
    setIsEditModuleDropdownOpen(false);
    setIsEditModalOpen(true);
  };

  // Save Edit User
  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserToEdit) return;

    const trimmedUsername = formUsername.trim().toUpperCase();
    const hasConflict = users.some(
      (u) => u.id !== selectedUserToEdit.id && u.username.toUpperCase() === trimmedUsername
    );
    if (hasConflict) {
      alert(`User ID / Username '${trimmedUsername}' is already taken by another account.`);
      return;
    }

    const updated = users.map((u) => {
      if (u.id === selectedUserToEdit.id) {
        return {
          ...u,
          name: formName.trim(),
          username: selectedUserToEdit.username === "ADMIN-ROOT" ? "ADMIN-ROOT" : trimmedUsername,
          email: formEmail.trim(),
          phone: formPhone.trim(),
          roleId: selectedUserToEdit.username === "ADMIN-ROOT" ? "super_admin" : formRoleId,
          designation: formDesignation.trim(),
          department: formDepartment,
          status: selectedUserToEdit.username === "ADMIN-ROOT" ? "ACTIVE" : formStatus,
          twoFactorEnabled: form2FA,
          accessibleModules:
            selectedUserToEdit.username === "ADMIN-ROOT"
              ? MODULE_KEYS.map((m) => m.key)
              : formAccessibleModules,
        };
      }
      return u;
    });

    saveUsers(updated);

    // Keep Teacher Delegations in sync if name or designation was updated
    const currentDelegations = getStoredDelegations();
    let delegationsUpdated = false;
    const updatedDelegations = currentDelegations.map((d) => {
      if (d.userId === selectedUserToEdit.id) {
        delegationsUpdated = true;
        return {
          ...d,
          userName: formName.trim(),
          designation: formDesignation.trim() || d.designation,
        };
      }
      return d;
    });
    if (delegationsUpdated) {
      saveDelegations(updatedDelegations);
    }

    addAuditLog(
      "Super Admin",
      "USER_ACCOUNT_UPDATED",
      "USER_MANAGEMENT",
      `Updated user profile & permissions for '${selectedUserToEdit.name}' (${selectedUserToEdit.username})`,
      "INFO"
    );

    setIsEditModalOpen(false);
    setSelectedUserToEdit(null);
    resetForm();
    showToast("User updated successfully!");
  };

  // Toggle a single module for a user directly from the table dropdown
  const handleToggleModuleForUser = (user: UserAccount, moduleKey: string) => {
    if (user.username === "ADMIN-ROOT") {
      alert("ADMIN-ROOT has full master access to all modules and cannot be modified.");
      return;
    }
    const currentModules = getUserAccessibleModules(user, roles);
    const updatedModules = currentModules.includes(moduleKey)
      ? currentModules.filter((m) => m !== moduleKey)
      : [...currentModules, moduleKey];

    const updatedUsers = users.map((u) => {
      if (u.id === user.id) {
        return {
          ...u,
          accessibleModules: updatedModules,
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    addAuditLog(
      "Super Admin",
      "USER_MODULE_ACCESS_UPDATED",
      "PERMISSION",
      `Updated module access for ID ${user.username} (${user.name}): ${updatedModules.length} modules granted`,
      "INFO"
    );
    showToast(`Updated module access for ID ${user.username} (${updatedModules.length} modules)`);
  };

  // Select all or deselect all modules for a user from the table dropdown
  const handleToggleAllModulesForUser = (user: UserAccount, selectAll: boolean) => {
    if (user.username === "ADMIN-ROOT") {
      alert("ADMIN-ROOT has full master access to all modules and cannot be modified.");
      return;
    }
    const updatedModules = selectAll ? MODULE_KEYS.map((m) => m.key) : [];
    const updatedUsers = users.map((u) => {
      if (u.id === user.id) {
        return {
          ...u,
          accessibleModules: updatedModules,
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    addAuditLog(
      "Super Admin",
      "USER_MODULE_ACCESS_UPDATED",
      "PERMISSION",
      `${selectAll ? "Granted all modules to" : "Revoked all modules from"} ID ${user.username}`,
      "WARNING"
    );
    showToast(
      selectAll
        ? `Granted all ${MODULE_KEYS.length} modules to ID ${user.username}`
        : `Revoked all modules from ID ${user.username}`
    );
  };

  // Reset a user's modules to match their system role defaults
  const handleResetUserToRoleDefault = (user: UserAccount) => {
    const roleDefaults = getDefaultModulesForRole(user.roleId, roles);
    const updatedUsers = users.map((u) => {
      if (u.id === user.id) {
        return {
          ...u,
          accessibleModules: roleDefaults,
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    addAuditLog(
      "Super Admin",
      "USER_MODULE_ACCESS_UPDATED",
      "PERMISSION",
      `Reset module access for ID ${user.username} to role '${user.roleId}' defaults`,
      "INFO"
    );
    showToast(`Reset ID ${user.username} modules to role defaults (${roleDefaults.length} modules)`);
  };

  // Toggle User Status
  const toggleStatus = (user: UserAccount) => {
    if (user.username === "ADMIN-ROOT") {
      alert("Root System Administrator cannot be suspended.");
      return;
    }
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const updated = users.map((u) =>
      u.id === user.id ? { ...u, status: newStatus as any } : u
    );
    saveUsers(updated);
    addAuditLog(
      "Super Admin",
      "USER_STATUS_CHANGED",
      "SECURITY",
      `Changed status of '${user.name}' from ${user.status} to ${newStatus}`,
      newStatus === "SUSPENDED" ? "WARNING" : "INFO"
    );
    showToast(`Account status changed to ${newStatus}`);
  };

  // Reset Password Prompt
  const handleResetPassword = (user: UserAccount) => {
    if (confirm(`Send temporary password reset credentials for ${user.name} (${user.email})?`)) {
      addAuditLog(
        "Super Admin",
        "PASSWORD_RESET_TRIGGERED",
        "SECURITY",
        `Sent temporary reset token for user ${user.username}`,
        "WARNING"
      );
      showToast(`Password reset link sent to ${user.email}`);
    }
  };

  // Delete User
  const handleDeleteUser = (user: UserAccount) => {
    if (user.username === "ADMIN-ROOT") {
      alert("Cannot delete Root System Administrator account.");
      return;
    }
    if (confirm(`Are you sure you want to delete user account '${user.name}' (${user.username})?`)) {
      const updated = users.filter((u) => u.id !== user.id);
      saveUsers(updated);

      // Clean up orphaned delegations
      const currentDelegations = getStoredDelegations();
      const updatedDelegations = currentDelegations.filter((d) => d.userId !== user.id);
      if (updatedDelegations.length !== currentDelegations.length) {
        saveDelegations(updatedDelegations);
        addAuditLog(
          "Super Admin",
          "TEACHER_SCOPE_REVOKED",
          "DELEGATION",
          `Automatically cleaned up ${currentDelegations.length - updatedDelegations.length} delegation(s) for deleted user '${user.name}'`,
          "WARNING"
        );
      }

      addAuditLog(
        "Super Admin",
        "USER_DELETED",
        "USER_MANAGEMENT",
        `Deleted user account '${user.name}' (${user.username})`,
        "WARNING"
      );
      showToast(`User ${user.name} removed from system.`);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormUsername("");
    setFormEmail("");
    setFormPhone("");
    setFormRoleId("subject_teacher");
    setFormDesignation("");
    setFormDepartment("Science Department");
    setFormStatus("ACTIVE");
    setForm2FA(false);
    setSelectedUserToEdit(null);
    setFormAccessibleModules(getDefaultModulesForRole("subject_teacher", roles));
    setIsAddModuleDropdownOpen(false);
    setIsEditModuleDropdownOpen(false);
  };

  const exportCSV = () => {
    const headers = "ID,Name,Username,Role,Designation,Department,Email,Phone,Status,2FA,LastLogin\n";
    const rows = users
      .map((u) => {
        const role = roles.find((r) => r.id === u.roleId)?.name || u.roleId;
        return `"${u.id}","${u.name}","${u.username}","${role}","${u.designation}","${u.department}","${u.email}","${u.phone}","${u.status}","${u.twoFactorEnabled ? "YES" : "NO"}","${u.lastLogin}"`;
      })
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `User_Role_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
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
          <Link href="/settings" className="hover:underline">Settings</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">User Accounts</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-purple-600" />
              User Accounts & Roles
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage staff user accounts, role permissions, access privileges, and security audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Total System Users</p>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalUsers}</p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{activeUsers} active accounts</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Configured Roles</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{activeRolesCount}</p>
          <div className="flex items-center gap-1 text-[11px] text-blue-600 font-medium mt-1">
            <Link href="/user-role/roles" className="hover:underline flex items-center gap-1">
              <span>View RBAC Matrix</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">2FA Protected</p>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{twoFactorUsers} / {totalUsers}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {Math.round((twoFactorUsers / (totalUsers || 1)) * 100)}% 2-Factor Enforced
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Teacher Scopes</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{delegationCount}</p>
          <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium mt-1">
            <Link href="/user-role/delegation" className="hover:underline flex items-center gap-1">
              <span>Class-Subject Scope</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Role Dropdown Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <label htmlFor="user-role-filter-select" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5 text-purple-600" />
            <span>Filter by Role:</span>
          </label>
          <div className="relative">
            <select
              id="user-role-filter-select"
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-300 hover:border-purple-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 text-xs font-semibold text-slate-800 rounded-lg pl-3 pr-8 py-1.5 shadow-2xs transition cursor-pointer min-w-[240px]"
            >
              <option value="ALL">All Roles ({users.length} accounts)</option>
              <optgroup label="System & Custom Roles">
                {roles.map((r) => {
                  const count = users.filter((u) => u.roleId === r.id).length;
                  return (
                    <option key={r.id} value={r.id}>
                      {r.name} ({count} {count === 1 ? "user" : "users"}) {r.isSystem ? "" : "• Custom"}
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

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{filteredUsers.length}</span> of{" "}
          <span className="font-bold text-slate-900">{users.length}</span> accounts
        </div>
      </div>

      {/* User Directory Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search user by name, ID, phone, email, designation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-2xs"
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
              selectClassName="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs text-slate-700 font-medium"
            />
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs text-slate-700 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="SUSPENDED">Suspended Accounts</option>
              <option value="INVITED">Invited / Pending</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">User & Credential</th>
                <th className="px-4 py-3">System Role</th>
                <th className="px-4 py-3">Designation & Dept</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-center">2FA</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Last Login</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No users matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleObj = roles.find((r) => r.id === user.roleId);
                  const isRoot = user.username === "ADMIN-ROOT";

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/75 transition-colors">
                      {/* User & ID */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full ${user.avatarBg} text-white font-bold flex items-center justify-center text-xs shadow-2xs shrink-0`}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isRoot && (
                                <span className="bg-purple-100 text-purple-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                  ROOT
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              ID: {user.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            roleObj?.badgeBg || "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {roleObj?.name || user.roleId}
                        </span>
                      </td>

                      {/* Designation */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{user.designation}</div>
                        <div className="text-[11px] text-slate-500">{user.department}</div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3">
                        <div className="text-slate-800 font-mono text-[11px] flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{user.phone}</span>
                        </div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{user.email}</span>
                        </div>
                      </td>

                      {/* 2FA */}
                      <td className="px-4 py-3 text-center">
                        {user.twoFactorEnabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Enforced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            Disabled
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            user.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : user.status === "INVITED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="px-4 py-3 text-center text-slate-500 text-[11px]">
                        {user.lastLogin}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Toggle Status */}
                          <button
                            onClick={() => toggleStatus(user)}
                            title={user.status === "ACTIVE" ? "Suspend user" : "Activate user"}
                            disabled={isRoot}
                            className={`p-1 rounded hover:bg-slate-200 transition ${
                              isRoot ? "opacity-30 cursor-not-allowed" : "text-slate-600 cursor-pointer"
                            }`}
                          >
                            {user.status === "ACTIVE" ? (
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => handleResetPassword(user)}
                            title="Reset Password"
                            className="p-1 rounded text-slate-600 hover:text-amber-600 hover:bg-slate-200 transition cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit User */}
                          <button
                            onClick={() => openEditModal(user)}
                            title="Edit User"
                            className="p-1 rounded text-slate-600 hover:text-purple-700 hover:bg-slate-200 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => handleDeleteUser(user)}
                            title="Delete User"
                            disabled={isRoot}
                            className={`p-1 rounded transition ${
                              isRoot
                                ? "opacity-30 cursor-not-allowed text-slate-400"
                                : "text-slate-600 hover:text-rose-600 hover:bg-slate-200 cursor-pointer"
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New User */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Add New Staff / User Account</h3>
                  <p className="text-slate-500 text-[11px]">Create credentials & assign system role</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Md. Shahidul Alam"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee / User ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TCH-205"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Role *</label>
                  <select
                    value={formRoleId}
                    onChange={(e) => {
                      const newRoleId = e.target.value;
                      setFormRoleId(newRoleId);
                      setFormAccessibleModules(getDefaultModulesForRole(newRoleId, roles));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Teacher"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="Administration">Executive Administration</option>
                    <option value="Science Department">Science Department</option>
                    <option value="Commerce Department">Commerce Department</option>
                    <option value="Humanities Department">Humanities Department</option>
                    <option value="Accounts & Finance">Accounts & Finance</option>
                    <option value="Examination Committee">Examination Committee</option>
                    <option value="IT & Student Section">IT & Student Section</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone (SMS)</label>
                  <input
                    type="text"
                    placeholder="017XXXXXXXX"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Institutional Email</label>
                <input
                  type="email"
                  placeholder="name@dhakaschool.edu.bd"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Which Module are Access by this ID */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Which Module are Access by this ID
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAddModuleDropdownOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs cursor-pointer text-slate-800"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="truncate">
                        {formAccessibleModules.length === 0
                          ? "No modules selected (0 / 7)"
                          : formAccessibleModules.length === MODULE_KEYS.length
                          ? "All 7 Modules Accessible"
                          : `${formAccessibleModules.length} of ${MODULE_KEYS.length} Modules Accessible`}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                        isAddModuleDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isAddModuleDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsAddModuleDropdownOpen(false)}
                      />
                      <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-20 p-3 text-left">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[11px]">
                          <span className="font-bold text-slate-700">Check modules to grant for this ID</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setFormAccessibleModules(MODULE_KEYS.map((m) => m.key))}
                              className="font-bold text-purple-700 hover:underline cursor-pointer"
                            >
                              Select All
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => setFormAccessibleModules([])}
                              className="text-rose-600 hover:underline cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {MODULE_KEYS.map((mod) => {
                            const isChecked = formAccessibleModules.includes(mod.key);
                            return (
                              <label
                                key={mod.key}
                                className={`flex items-start gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                                  isChecked
                                    ? "bg-purple-50/70 text-purple-950 font-semibold"
                                    : "hover:bg-slate-50 text-slate-700"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setFormAccessibleModules((prev) =>
                                      prev.includes(mod.key)
                                        ? prev.filter((k) => k !== mod.key)
                                        : [...prev, mod.key]
                                    );
                                  }}
                                  className="mt-0.5 rounded text-purple-600 border-slate-300 focus:ring-purple-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                <div className="min-w-0">
                                  <div className="truncate text-[11px] leading-tight">{mod.name}</div>
                                  <div className="text-[10px] text-slate-400 font-normal leading-tight line-clamp-1">
                                    {mod.desc}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Enforce Two-Factor Auth (2FA)</span>
                  <p className="text-[11px] text-slate-500">Require OTP verification upon signing in</p>
                </div>
                <input
                  type="checkbox"
                  checked={form2FA}
                  onChange={(e) => setForm2FA(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {isEditModalOpen && selectedUserToEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit User Profile</h3>
                  <p className="text-slate-500 text-[11px]">Updating credentials for {selectedUserToEdit.username}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">User ID</label>
                  <input
                    type="text"
                    required
                    disabled={selectedUserToEdit.username === "ADMIN-ROOT"}
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase disabled:bg-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={formRoleId}
                    disabled={selectedUserToEdit.username === "ADMIN-ROOT"}
                    onChange={(e) => {
                      const newRoleId = e.target.value;
                      setFormRoleId(newRoleId);
                      setFormAccessibleModules(getDefaultModulesForRole(newRoleId, roles));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium disabled:bg-slate-100"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="Administration">Executive Administration</option>
                    <option value="Science Department">Science Department</option>
                    <option value="Commerce Department">Commerce Department</option>
                    <option value="Humanities Department">Humanities Department</option>
                    <option value="Accounts & Finance">Accounts & Finance</option>
                    <option value="Examination Committee">Examination Committee</option>
                    <option value="IT & Student Section">IT & Student Section</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Institutional Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={formStatus}
                    disabled={selectedUserToEdit.username === "ADMIN-ROOT"}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-slate-100 font-medium"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="INVITED">INVITED</option>
                  </select>
                </div>
              </div>

              {/* Which Module are Access by this ID */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Which Module are Access by this ID
                </label>
                <div className="relative">
                  <button
                    type="button"
                    disabled={selectedUserToEdit.username === "ADMIN-ROOT"}
                    onClick={() => setIsEditModuleDropdownOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs cursor-pointer text-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="truncate">
                        {selectedUserToEdit.username === "ADMIN-ROOT"
                          ? "All Modules Granted (Master Root Access)"
                          : formAccessibleModules.length === 0
                          ? "No modules selected (0 / 7)"
                          : formAccessibleModules.length === MODULE_KEYS.length
                          ? "All 7 Modules Accessible"
                          : `${formAccessibleModules.length} of ${MODULE_KEYS.length} Modules Accessible`}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                        isEditModuleDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isEditModuleDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsEditModuleDropdownOpen(false)}
                      />
                      <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-20 p-3 text-left">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[11px]">
                          <span className="font-bold text-slate-700">
                            Check modules for ID {selectedUserToEdit.username}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setFormAccessibleModules(MODULE_KEYS.map((m) => m.key))}
                              className="font-bold text-purple-700 hover:underline cursor-pointer"
                            >
                              Select All
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => setFormAccessibleModules([])}
                              className="text-rose-600 hover:underline cursor-pointer"
                            >
                              Clear
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() =>
                                setFormAccessibleModules(
                                  getDefaultModulesForRole(formRoleId, roles)
                                )
                              }
                              className="text-slate-500 hover:underline cursor-pointer"
                            >
                              Role Default
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {MODULE_KEYS.map((mod) => {
                            const isChecked = formAccessibleModules.includes(mod.key);
                            return (
                              <label
                                key={mod.key}
                                className={`flex items-start gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                                  isChecked
                                    ? "bg-purple-50/70 text-purple-950 font-semibold"
                                    : "hover:bg-slate-50 text-slate-700"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setFormAccessibleModules((prev) =>
                                      prev.includes(mod.key)
                                        ? prev.filter((k) => k !== mod.key)
                                        : [...prev, mod.key]
                                    );
                                  }}
                                  className="mt-0.5 rounded text-purple-600 border-slate-300 focus:ring-purple-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                <div className="min-w-0">
                                  <div className="truncate text-[11px] leading-tight">{mod.name}</div>
                                  <div className="text-[10px] text-slate-400 font-normal leading-tight line-clamp-1">
                                    {mod.desc}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Two-Factor Authentication</span>
                  <p className="text-[11px] text-slate-500">Require OTP verification upon signing in</p>
                </div>
                <input
                  type="checkbox"
                  checked={form2FA}
                  onChange={(e) => setForm2FA(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

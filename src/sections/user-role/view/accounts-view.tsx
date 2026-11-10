// src/app/user-role/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import {
  UserPlus,
  KeyRound,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Trash2,
  Edit2,
  Download,
  Layers,
  ChevronDown,
} from "@/components/iconify/lucide";
import { SessionSelect } from "@/components/SessionSelect";
import { AppSelect } from "@/components/select/app-select";
import { AppTextField } from "@/components/text-field/app-text-field";
import { AppButton } from "@/components/button/app-button";
import { AppTable, TableFilterBar } from "@/components";
import {
  SettingsPageShell,
  SettingsPageHeader,
  SettingsSection,
  SettingsFilterGrid,
  SettingsNotice,
} from "@/sections/settings/component/settings-page-ui";
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
} from "@/sections/user-role/schema/user-role-store";

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
    <SettingsPageShell>
      <SettingsPageHeader
        heading="User Accounts"
        current="User Accounts"
        action={
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            <AppButton
              onClick={exportCSV}
              variant="outline"
              color="inherit"
              size="small"
              startIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV
            </AppButton>
            <AppButton
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              variant="contained"
              color="primary"
              size="small"
              startIcon={<UserPlus className="w-4 h-4" />}
            >
              Add New User
            </AppButton>
          </Stack>
        }
      />

      {toastMessage ? (
        <SettingsNotice severity="success">{toastMessage}</SettingsNotice>
      ) : null}

      <SettingsSection
        title="User directory"
        subtitle="Manage staff accounts, role assignments, and access privileges."
        action={
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap", alignItems: "center" }}>
            <Chip
              size="small"
              label={`${totalUsers} users`}
              sx={{ height: 22, fontWeight: 700, bgcolor: "primary.lighter", color: "primary.dark" }}
            />
            <Chip
              size="small"
              label={`${activeUsers} active`}
              color="success"
              variant="outlined"
              sx={{ height: 22, fontWeight: 700 }}
            />
            <Chip
              size="small"
              label={`${twoFactorUsers} with 2FA`}
              color="info"
              variant="outlined"
              sx={{ height: 22, fontWeight: 700 }}
            />
            <Chip
              size="small"
              label={`${activeRolesCount} roles`}
              variant="outlined"
              sx={{ height: 22, fontWeight: 700 }}
            />
            <Chip
              size="small"
              label={`${delegationCount} scopes`}
              variant="outlined"
              sx={{ height: 22, fontWeight: 700 }}
            />
            <Chip
              size="small"
              label={`${filteredUsers.length} shown`}
              sx={{ height: 22, fontWeight: 700, bgcolor: "grey.100", color: "text.secondary" }}
            />
          </Stack>
        }
        toolbar={
          <SettingsFilterGrid columns={4}>
            <AppTextField
              label="Search"
              placeholder="Name, ID, phone, email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <AppSelect
              label="Role"
              value={selectedRoleFilter}
              onChange={setSelectedRoleFilter}
              options={[
                { value: "ALL", label: `All Roles (${users.length})` },
                ...roles.map((r) => {
                  const count = users.filter((u) => u.roleId === r.id).length;
                  return {
                    value: r.id,
                    label: `${r.name} (${count})${r.isSystem ? "" : " · Custom"}`,
                  };
                }),
              ]}
            />
            <SessionSelect
              value={selectedSession}
              onChange={(val) => setSelectedSession(val)}
              label="Session"
              includeAll
              allLabel="All Sessions"
              activeOnly={false}
              fullWidth
            />
            <AppSelect
              label="Status"
              value={selectedStatusFilter}
              onChange={setSelectedStatusFilter}
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "ACTIVE", label: "Active Accounts" },
                { value: "SUSPENDED", label: "Suspended Accounts" },
                { value: "INVITED", label: "Invited / Pending" },
              ]}
            />
          </SettingsFilterGrid>
        }
      >
        <TableFilterBar showSearch={false}>
          <AppTable<UserAccount>
            embedded
            rows={filteredUsers}
          rowKey={(row) => row.id}
          defaultOrderBy="name"
          minWidth={1100}
          columns={[
            {
              id: "name",
              label: "User & Credential",
              render: (user) => {
                const isRoot = user.username === "ADMIN-ROOT";
                return (
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <div
                      className={`w-8 h-8 rounded-full ${user.avatarBg} text-white font-bold flex items-center justify-center text-xs shadow-2xs shrink-0`}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <Typography variant="body2" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 0.75 }}>
                        <span>{user.name}</span>
                        {isRoot && (
                          <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-1.5 py-0.2 rounded">
                            ROOT
                          </span>
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                        ID: {user.username}
                      </Typography>
                    </div>
                  </Stack>
                );
              },
            },
            {
              id: "roleId",
              label: "System Role",
              render: (user) => {
                const roleObj = roles.find((r) => r.id === user.roleId);
                return (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      roleObj?.badgeBg || "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {roleObj?.name || user.roleId}
                  </span>
                );
              },
            },
            {
              id: "designation",
              label: "Designation & Dept",
              render: (user) => (
                <>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {user.designation}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.department}
                  </Typography>
                </>
              ),
            },
            {
              id: "phone",
              label: "Contact",
              sortable: false,
              render: (user) => (
                <>
                  <div className="text-slate-800 font-mono text-[11px] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{user.phone}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{user.email}</span>
                  </div>
                </>
              ),
            },
            {
              id: "twoFactorEnabled",
              label: "2FA",
              align: "center",
              render: (user) =>
                user.twoFactorEnabled ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    <CheckCircle2 className="w-3 h-3" />
                    Enforced
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                    Disabled
                  </span>
                ),
            },
            {
              id: "status",
              label: "Status",
              align: "center",
              render: (user) => (
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
              ),
            },
            {
              id: "lastLogin",
              label: "Last Login",
              align: "center",
              render: (user) => (
                <Typography variant="caption" color="text.secondary">
                  {user.lastLogin}
                </Typography>
              ),
            },
            {
              id: "actions",
              label: "Actions",
              align: "right",
              sortable: false,
              render: (user) => {
                const isRoot = user.username === "ADMIN-ROOT";
                return (
                  <div className="flex items-center justify-end space-x-1">
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
                    <button
                      onClick={() => handleResetPassword(user)}
                      title="Reset Password"
                      className="p-1 rounded text-slate-600 hover:text-amber-600 hover:bg-slate-200 transition cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(user)}
                      title="Edit User"
                      className="p-1 rounded text-slate-600 hover:text-primary hover:bg-slate-200 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
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
                );
              },
            },
          ]}
        />
        </TableFilterBar>
      </SettingsSection>

      {/* Modal: Add New User */}
      <Dialog
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <Box component="form" onSubmit={handleCreateUser} sx={{ display: "flex", flexDirection: "column" }}>
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "primary.lighter",
                  color: "primary.main",
                }}
              >
                <UserPlus className="w-4 h-4" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Add New Staff / User Account
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Create credentials & assign system role
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>

          <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <SettingsFilterGrid columns={2}>
                <AppTextField
                  label="Full Name"
                  required
                  placeholder="e.g. Md. Shahidul Alam"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
                <AppTextField
                  label="Employee / User ID"
                  required
                  placeholder="e.g. TCH-205"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  slotProps={{ input: { sx: { textTransform: "uppercase" } } }}
                />
                <AppSelect
                  label="Assigned Role"
                  value={formRoleId}
                  onChange={(value) => {
                    setFormRoleId(value);
                    setFormAccessibleModules(getDefaultModulesForRole(value, roles));
                  }}
                  options={roles.map((r) => ({ value: r.id, label: r.name }))}
                />
                <AppTextField
                  label="Designation"
                  placeholder="e.g. Senior Teacher"
                  value={formDesignation}
                  onChange={(e) => setFormDesignation(e.target.value)}
                />
                <AppSelect
                  label="Department"
                  value={formDepartment}
                  onChange={setFormDepartment}
                  options={[
                    { value: "Administration", label: "Executive Administration" },
                    { value: "Science Department", label: "Science Department" },
                    { value: "Commerce Department", label: "Commerce Department" },
                    { value: "Humanities Department", label: "Humanities Department" },
                    { value: "Accounts & Finance", label: "Accounts & Finance" },
                    { value: "Examination Committee", label: "Examination Committee" },
                    { value: "IT & Student Section", label: "IT & Student Section" },
                  ]}
                />
                <AppTextField
                  label="Mobile Phone (SMS)"
                  placeholder="017XXXXXXXX"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  slotProps={{ input: { sx: { fontFamily: "monospace" } } }}
                />
              </SettingsFilterGrid>

              <AppTextField
                label="Institutional Email"
                type="email"
                placeholder="name@dhakaschool.edu.bd"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 1 }}>
                  Which Module are Access by this ID
                </Typography>
                <Box sx={{ position: "relative" }}>
                  <AppButton
                    type="button"
                    fullWidth
                    variant="outline"
                    color="inherit"
                    startIcon={<Layers className="w-4 h-4" />}
                    endIcon={
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          isAddModuleDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    }
                    onClick={() => setIsAddModuleDropdownOpen((v) => !v)}
                  >
                    {formAccessibleModules.length === 0
                      ? "No modules selected (0 / 7)"
                      : formAccessibleModules.length === MODULE_KEYS.length
                      ? "All 7 Modules Accessible"
                      : `${formAccessibleModules.length} of ${MODULE_KEYS.length} Modules Accessible`}
                  </AppButton>

                  {isAddModuleDropdownOpen && (
                    <>
                      <Box
                        sx={{ position: "fixed", inset: 0, zIndex: 10 }}
                        onClick={() => setIsAddModuleDropdownOpen(false)}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          mt: 1,
                          bgcolor: "background.paper",
                          borderRadius: 2,
                          border: 1,
                          borderColor: "divider",
                          boxShadow: 6,
                          zIndex: 20,
                          p: 1.5,
                        }}
                      >
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", pb: 1, mb: 1, borderBottom: 1, borderColor: "divider" }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            Check modules to grant for this ID
                          </Typography>
                          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                            <AppButton
                              type="button"
                              variant="link"
                              size="small"
                              onClick={() => setFormAccessibleModules(MODULE_KEYS.map((m) => m.key))}
                            >
                              Select All
                            </AppButton>
                            <AppButton
                              type="button"
                              variant="link"
                              color="error"
                              size="small"
                              onClick={() => setFormAccessibleModules([])}
                            >
                              Clear
                            </AppButton>
                          </Stack>
                        </Stack>

                        <Stack spacing={0.5} sx={{ maxHeight: 192, overflowY: "auto", pr: 0.5 }}>
                          {MODULE_KEYS.map((mod) => {
                            const isChecked = formAccessibleModules.includes(mod.key);
                            return (
                              <FormControlLabel
                                key={mod.key}
                                sx={{
                                  m: 0,
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1.5,
                                  bgcolor: isChecked ? "primary.lighter" : "transparent",
                                  "&:hover": { bgcolor: isChecked ? "primary.lighter" : "action.hover" },
                                  alignItems: "flex-start",
                                }}
                                control={
                                  <Checkbox
                                    size="small"
                                    checked={isChecked}
                                    onChange={() => {
                                      setFormAccessibleModules((prev) =>
                                        prev.includes(mod.key)
                                          ? prev.filter((k) => k !== mod.key)
                                          : [...prev, mod.key]
                                      );
                                    }}
                                  />
                                }
                                label={
                                  <Box sx={{ minWidth: 0, pt: 0.25 }}>
                                    <Typography variant="caption" sx={{ fontWeight: isChecked ? 700 : 500, display: "block", lineHeight: 1.2 }}>
                                      {mod.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                                      {mod.desc}
                                    </Typography>
                                  </Box>
                                }
                              />
                            );
                          })}
                        </Stack>
                      </Box>
                    </>
                  )}
                </Box>
              </Box>

              <FormControlLabel
                sx={{ m: 0, pt: 1, borderTop: 1, borderColor: "divider", alignItems: "flex-start" }}
                control={
                  <Checkbox
                    size="small"
                    checked={form2FA}
                    onChange={(e) => setForm2FA(e.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Enforce Two-Factor Auth (2FA)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Require OTP verification upon signing in
                    </Typography>
                  </Box>
                }
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <AppButton
              type="button"
              variant="ghost"
              color="inherit"
              size="small"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </AppButton>
            <AppButton type="submit" variant="contained" color="primary" size="small">
              Create User
            </AppButton>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Modal: Edit User */}
      <Dialog
        open={isEditModalOpen && Boolean(selectedUserToEdit)}
        onClose={() => setIsEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        {selectedUserToEdit && (
          <Box component="form" onSubmit={handleUpdateUser} sx={{ display: "flex", flexDirection: "column" }}>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "info.lighter",
                    color: "info.main",
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Edit User Profile
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Updating credentials for {selectedUserToEdit.username}
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>

            <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
              <Stack spacing={2} sx={{ pt: 1 }}>
                <SettingsFilterGrid columns={2}>
                  <AppTextField
                    label="Full Name"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                  <AppTextField
                    label="User ID"
                    required
                    disabled={selectedUserToEdit.username === "ADMIN-ROOT"}
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    slotProps={{ input: { sx: { textTransform: "uppercase" } } }}
                  />
                  <AppSelect
                    label="Assigned Role"
                    value={formRoleId}
                    disabled={selectedUserToEdit.username === "ADMIN-ROOT"}
                    onChange={(value) => {
                      setFormRoleId(value);
                      setFormAccessibleModules(getDefaultModulesForRole(value, roles));
                    }}
                    options={roles.map((r) => ({ value: r.id, label: r.name }))}
                  />
                  <AppTextField
                    label="Designation"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                  />
                  <AppSelect
                    label="Department"
                    value={formDepartment}
                    onChange={setFormDepartment}
                    options={[
                      { value: "Administration", label: "Executive Administration" },
                      { value: "Science Department", label: "Science Department" },
                      { value: "Commerce Department", label: "Commerce Department" },
                      { value: "Humanities Department", label: "Humanities Department" },
                      { value: "Accounts & Finance", label: "Accounts & Finance" },
                      { value: "Examination Committee", label: "Examination Committee" },
                      { value: "IT & Student Section", label: "IT & Student Section" },
                    ]}
                  />
                  <AppTextField
                    label="Mobile Phone"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    slotProps={{ input: { sx: { fontFamily: "monospace" } } }}
                  />
                  <AppTextField
                    label="Institutional Email"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                  <AppSelect
                    label="Account Status"
                    value={formStatus}
                    disabled={selectedUserToEdit.username === "ADMIN-ROOT"}
                    onChange={(value) => setFormStatus(value as "ACTIVE" | "SUSPENDED" | "INVITED")}
                    options={[
                      { value: "ACTIVE", label: "ACTIVE" },
                      { value: "SUSPENDED", label: "SUSPENDED" },
                      { value: "INVITED", label: "INVITED" },
                    ]}
                  />
                </SettingsFilterGrid>

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 1 }}>
                    Which Module are Access by this ID
                  </Typography>
                  <Box sx={{ position: "relative" }}>
                    <AppButton
                      type="button"
                      fullWidth
                      variant="outline"
                      color="inherit"
                      disabled={selectedUserToEdit.username === "ADMIN-ROOT"}
                      startIcon={<Layers className="w-4 h-4" />}
                      endIcon={
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            isEditModuleDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      }
                      onClick={() => setIsEditModuleDropdownOpen((v) => !v)}
                    >
                      {selectedUserToEdit.username === "ADMIN-ROOT"
                        ? "All Modules Granted (Master Root Access)"
                        : formAccessibleModules.length === 0
                        ? "No modules selected (0 / 7)"
                        : formAccessibleModules.length === MODULE_KEYS.length
                        ? "All 7 Modules Accessible"
                        : `${formAccessibleModules.length} of ${MODULE_KEYS.length} Modules Accessible`}
                    </AppButton>

                    {isEditModuleDropdownOpen && (
                      <>
                        <Box
                          sx={{ position: "fixed", inset: 0, zIndex: 10 }}
                          onClick={() => setIsEditModuleDropdownOpen(false)}
                        />
                        <Box
                          sx={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            mt: 1,
                            bgcolor: "background.paper",
                            borderRadius: 2,
                            border: 1,
                            borderColor: "divider",
                            boxShadow: 6,
                            zIndex: 20,
                            p: 1.5,
                          }}
                        >
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", pb: 1, mb: 1, borderBottom: 1, borderColor: "divider", flexWrap: "wrap", gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>
                              Check modules for ID {selectedUserToEdit.username}
                            </Typography>
                            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                              <AppButton
                                type="button"
                                variant="link"
                                size="small"
                                onClick={() => setFormAccessibleModules(MODULE_KEYS.map((m) => m.key))}
                              >
                                Select All
                              </AppButton>
                              <AppButton
                                type="button"
                                variant="link"
                                color="error"
                                size="small"
                                onClick={() => setFormAccessibleModules([])}
                              >
                                Clear
                              </AppButton>
                              <AppButton
                                type="button"
                                variant="link"
                                color="inherit"
                                size="small"
                                onClick={() =>
                                  setFormAccessibleModules(getDefaultModulesForRole(formRoleId, roles))
                                }
                              >
                                Role Default
                              </AppButton>
                            </Stack>
                          </Stack>

                          <Stack spacing={0.5} sx={{ maxHeight: 192, overflowY: "auto", pr: 0.5 }}>
                            {MODULE_KEYS.map((mod) => {
                              const isChecked = formAccessibleModules.includes(mod.key);
                              return (
                                <FormControlLabel
                                  key={mod.key}
                                  sx={{
                                    m: 0,
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1.5,
                                    bgcolor: isChecked ? "primary.lighter" : "transparent",
                                    "&:hover": { bgcolor: isChecked ? "primary.lighter" : "action.hover" },
                                    alignItems: "flex-start",
                                  }}
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={isChecked}
                                      onChange={() => {
                                        setFormAccessibleModules((prev) =>
                                          prev.includes(mod.key)
                                            ? prev.filter((k) => k !== mod.key)
                                            : [...prev, mod.key]
                                        );
                                      }}
                                    />
                                  }
                                  label={
                                    <Box sx={{ minWidth: 0, pt: 0.25 }}>
                                      <Typography variant="caption" sx={{ fontWeight: isChecked ? 700 : 500, display: "block", lineHeight: 1.2 }}>
                                        {mod.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                                        {mod.desc}
                                      </Typography>
                                    </Box>
                                  }
                                />
                              );
                            })}
                          </Stack>
                        </Box>
                      </>
                    )}
                  </Box>
                </Box>

                <FormControlLabel
                  sx={{ m: 0, pt: 1, borderTop: 1, borderColor: "divider", alignItems: "flex-start" }}
                  control={
                    <Checkbox
                      size="small"
                      checked={form2FA}
                      onChange={(e) => setForm2FA(e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Two-Factor Authentication
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Require OTP verification upon signing in
                      </Typography>
                    </Box>
                  }
                />
              </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
              <AppButton
                type="button"
                variant="ghost"
                color="inherit"
                size="small"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </AppButton>
              <AppButton type="submit" variant="contained" color="primary" size="small">
                Save Changes
              </AppButton>
            </DialogActions>
          </Box>
        )}
      </Dialog>
    </SettingsPageShell>
  );
}

// src/app/user-role/delegation/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  UserCheck,
  Plus,
  Search,
  BookOpen,
  School,
  Lock,
  Trash2,
  Edit2,
  Sparkles,
  CheckCircle2,
  Filter,
  ShieldCheck,
  FileEdit,
  Eye,
} from "lucide-react";
import { UserRoleNavHeader } from "../UserRoleNavHeader";
import { SessionSelect } from "@/components/SessionSelect";
import {
  TeacherDelegation,
  UserAccount,
  getStoredDelegations,
  saveDelegations,
  getStoredUsers,
  addAuditLog,
} from "../userRoleStore";

const STANDARD_CLASSES = [
  "Class 10",
  "Class 9",
  "Class 8",
  "Class 7",
  "Class 6",
  "Class 5",
  "Class 4",
  "Class 3",
  "Class 2",
  "Class 1",
];

const STANDARD_SECTIONS = [
  "Section A",
  "Section B",
  "Section C",
  "Section D",
  "Padma",
  "Meghna",
  "Jamuna",
  "Morning",
  "Day",
];

const STANDARD_SUBJECTS = [
  "Bangla 1st Paper",
  "Bangla 2nd Paper",
  "English 1st Paper",
  "English 2nd Paper",
  "General Mathematics",
  "Higher Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Accounting",
  "Business Entrepreneurship",
  "Finance & Banking",
  "General Science",
  "Bangladesh & Global Studies",
  "Information & Comm. Technology (ICT)",
  "Islam & Moral Education",
  "Hindu Religion & Moral Education",
  "Agriculture Studies",
  "Home Science",
  "Physical Education & Health",
  "Arts & Crafts",
  "Career Education",
];

export default function TeacherDelegationPage() {
  const [delegations, setDelegations] = useState<TeacherDelegation[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedClass, setSelectedClass] = useState("Class 10");
  const [selectedSection, setSelectedSection] = useState("Section A");
  const [selectedSubject, setSelectedSubject] = useState("Higher Mathematics");
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<"MARK_ENTRY" | "VIEW_ONLY">("MARK_ENTRY");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDelegationToEdit, setSelectedDelegationToEdit] = useState<TeacherDelegation | null>(null);
  const [editClass, setEditClass] = useState("Class 10");
  const [editSection, setEditSection] = useState("Section A");
  const [editSubject, setEditSubject] = useState("Higher Mathematics");
  const [editAccessLevel, setEditAccessLevel] = useState<"MARK_ENTRY" | "VIEW_ONLY">("MARK_ENTRY");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = () => {
    setDelegations(getStoredDelegations());
    const storedUsers = getStoredUsers();
    setUsers(storedUsers);
    if (storedUsers.length > 0 && !selectedUserId) {
      const firstTeacher = storedUsers.find((u) => u.roleId === "subject_teacher") || storedUsers[0];
      setSelectedUserId(firstTeacher.id);
    }
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

  // Dynamic classes for filter & selection
  const availableClasses = useMemo(() => {
    const list = new Set([...STANDARD_CLASSES, ...delegations.map((d) => d.className)]);
    return Array.from(list);
  }, [delegations]);

  // Filtered Delegations
  const filteredDelegations = useMemo(() => {
    return delegations.filter((d) => {
      if (selectedSession !== "ALL") {
        const yearPrefix = selectedSession.slice(0, 4);
        if (d.assignedDate && !d.assignedDate.includes(yearPrefix)) return false;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (d.userName || "").toLowerCase().includes(q) ||
        (d.subjectName || "").toLowerCase().includes(q) ||
        (d.className || "").toLowerCase().includes(q) ||
        (d.sectionName || "").toLowerCase().includes(q) ||
        (d.designation || "").toLowerCase().includes(q);

      const matchClass = classFilter === "ALL" || d.className === classFilter;

      return matchSearch && matchClass;
    });
  }, [delegations, searchQuery, selectedSession, classFilter]);

  // Statistics
  const totalDelegations = delegations.length;
  const uniqueTeachers = new Set(delegations.map((d) => d.userId)).size;
  const markEntryCount = delegations.filter((d) => d.accessLevel === "MARK_ENTRY").length;
  const classesCovered = new Set(delegations.map((d) => d.className)).size;

  // Add Delegation
  const handleAddDelegation = (e: React.FormEvent) => {
    e.preventDefault();
    const teacherUser = users.find((u) => u.id === selectedUserId);
    if (!teacherUser) return;

    // Check duplicate
    const exists = delegations.some(
      (d) =>
        d.userId === selectedUserId &&
        d.className === selectedClass &&
        d.sectionName === selectedSection &&
        d.subjectName === selectedSubject
    );

    if (exists) {
      alert("This teacher is already assigned to this exact Class, Section, and Subject.");
      return;
    }

    const newDel: TeacherDelegation = {
      id: `del-${Date.now()}`,
      userId: teacherUser.id,
      userName: teacherUser.name,
      designation: teacherUser.designation,
      className: selectedClass,
      sectionName: selectedSection,
      subjectName: selectedSubject,
      accessLevel: selectedAccessLevel,
      assignedDate: new Date().toISOString().split("T")[0],
    };

    const updated = [newDel, ...delegations];
    saveDelegations(updated);
    addAuditLog(
      "Super Admin",
      "TEACHER_SCOPE_DELEGATED",
      "DELEGATION",
      `Assigned ${teacherUser.name} to ${selectedClass} (${selectedSection}) for ${selectedSubject} [${selectedAccessLevel}]`,
      "INFO"
    );

    setIsModalOpen(false);
    showToast(`Access scope granted to ${teacherUser.name}`);
  };

  // Open Edit Modal
  const openEditModal = (del: TeacherDelegation) => {
    setSelectedDelegationToEdit(del);
    setEditClass(del.className);
    setEditSection(del.sectionName);
    setEditSubject(del.subjectName);
    setEditAccessLevel(del.accessLevel);
    setIsEditModalOpen(true);
  };

  // Save Edit Delegation
  const handleUpdateDelegation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelegationToEdit) return;

    // Check duplicate (excluding itself)
    const exists = delegations.some(
      (d) =>
        d.id !== selectedDelegationToEdit.id &&
        d.userId === selectedDelegationToEdit.userId &&
        d.className === editClass &&
        d.sectionName === editSection &&
        d.subjectName === editSubject
    );

    if (exists) {
      alert("This teacher already has an active delegation for this exact Class, Section, and Subject.");
      return;
    }

    const updated = delegations.map((d) => {
      if (d.id === selectedDelegationToEdit.id) {
        return {
          ...d,
          className: editClass,
          sectionName: editSection,
          subjectName: editSubject,
          accessLevel: editAccessLevel,
        };
      }
      return d;
    });

    saveDelegations(updated);
    addAuditLog(
      "Super Admin",
      "TEACHER_SCOPE_UPDATED",
      "DELEGATION",
      `Updated scope for ${selectedDelegationToEdit.userName} to ${editClass} (${editSection}) - ${editSubject} [${editAccessLevel}]`,
      "INFO"
    );

    setIsEditModalOpen(false);
    setSelectedDelegationToEdit(null);
    showToast(`Delegation scope updated for ${selectedDelegationToEdit.userName}`);
  };

  // Revoke Delegation
  const handleRevokeDelegation = (del: TeacherDelegation) => {
    if (
      confirm(
        `Revoke access for '${del.userName}' on ${del.className} (${del.sectionName}) - ${del.subjectName}?`
      )
    ) {
      const updated = delegations.filter((d) => d.id !== del.id);
      saveDelegations(updated);
      addAuditLog(
        "Super Admin",
        "TEACHER_SCOPE_REVOKED",
        "DELEGATION",
        `Revoked access for ${del.userName} on ${del.className} - ${del.subjectName}`,
        "WARNING"
      );
      showToast(`Delegation revoked for ${del.userName}`);
    }
  };

  // Toggle Access Level
  const toggleAccessLevel = (del: TeacherDelegation) => {
    const newLevel = del.accessLevel === "MARK_ENTRY" ? "VIEW_ONLY" : "MARK_ENTRY";
    const updated = delegations.map((d) =>
      d.id === del.id ? { ...d, accessLevel: newLevel as any } : d
    );
    saveDelegations(updated);
    addAuditLog(
      "Super Admin",
      "ACCESS_LEVEL_MODIFIED",
      "DELEGATION",
      `Changed access level for ${del.userName} on ${del.subjectName} to ${newLevel}`,
      "INFO"
    );
    showToast(`Access level changed to ${newLevel}`);
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
          <Link href="/user-role" className="hover:underline">User Roles</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">Teacher Delegation</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-amber-600" />
              Teacher Delegation
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Assign teachers to specific classes, sections, and subjects for mark entry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Assign New Delegation</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Active Delegations</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalDelegations}</p>
          <p className="text-[11px] text-slate-500 mt-1">Assigned subject scopes</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Teachers Delegated</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{uniqueTeachers}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Authorized faculty members</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Classes Covered</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{classesCovered}</p>
          <p className="text-[11px] text-blue-600 font-medium mt-1">Grade levels monitored</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Mark Entry Permission</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{markEntryCount}</p>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Input enabled scopes</p>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by teacher name, subject, class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
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
              selectClassName="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs text-slate-700 font-medium"
            />
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs text-slate-700 font-medium"
            >
              <option value="ALL">All Classes</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Delegations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Faculty / Teacher</th>
                <th className="px-4 py-3">Assigned Class & Section</th>
                <th className="px-4 py-3">Subject Scope</th>
                <th className="px-4 py-3 text-center">Access Permission</th>
                <th className="px-4 py-3 text-center">Assigned Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDelegations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No teacher delegations found.
                  </td>
                </tr>
              ) : (
                filteredDelegations.map((del) => {
                  return (
                    <tr key={del.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{del.userName}</div>
                        <div className="text-[11px] text-slate-500">{del.designation}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                            {del.className}
                          </span>
                          <span className="text-slate-500 text-xs">({del.sectionName})</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{del.subjectName}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleAccessLevel(del)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
                            del.accessLevel === "MARK_ENTRY"
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          }`}
                          title="Click to toggle access mode"
                        >
                          {del.accessLevel === "MARK_ENTRY" ? (
                            <>
                              <FileEdit className="w-3 h-3" />
                              <span>Mark Entry Allowed</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>View Only</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="px-4 py-3 text-center text-slate-500 text-[11px]">
                        {del.assignedDate}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => openEditModal(del)}
                            title="Edit Delegation"
                            className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRevokeDelegation(del)}
                            title="Revoke Delegation"
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Modal: Assign New Scope */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Assign Teacher Delegation Scope</h3>
                  <p className="text-slate-500 text-[11px]">Delegate mark entry authorization by class & subject</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddDelegation} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Faculty Member *</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.designation} - {u.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Class *</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {availableClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section *</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {STANDARD_SECTIONS.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Assignment *</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {STANDARD_SUBJECTS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Access Authorization Level</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <label
                    className={`flex items-center space-x-2 p-3 border rounded-xl cursor-pointer ${
                      selectedAccessLevel === "MARK_ENTRY"
                        ? "bg-amber-50 border-amber-500 text-amber-900 font-bold"
                        : "border-slate-200 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="accessMode"
                      checked={selectedAccessLevel === "MARK_ENTRY"}
                      onChange={() => setSelectedAccessLevel("MARK_ENTRY")}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <div className="text-xs">Mark Entry Allowed</div>
                      <div className="text-[10px] text-slate-500 font-normal">Can input and edit marks</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center space-x-2 p-3 border rounded-xl cursor-pointer ${
                      selectedAccessLevel === "VIEW_ONLY"
                        ? "bg-blue-50 border-blue-500 text-blue-900 font-bold"
                        : "border-slate-200 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="accessMode"
                      checked={selectedAccessLevel === "VIEW_ONLY"}
                      onChange={() => setSelectedAccessLevel("VIEW_ONLY")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-xs">View Only</div>
                      <div className="text-[10px] text-slate-500 font-normal">Read grade sheets only</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Grant Delegation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Edit Existing Scope */}
      {isEditModalOpen && selectedDelegationToEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit Teacher Delegation Scope</h3>
                  <p className="text-slate-500 text-[11px]">Updating scope for {selectedDelegationToEdit.userName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateDelegation} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Faculty Member</label>
                <input
                  type="text"
                  disabled
                  value={`${selectedDelegationToEdit.userName} (${selectedDelegationToEdit.designation})`}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-slate-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Class *</label>
                  <select
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {availableClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section *</label>
                  <select
                    value={editSection}
                    onChange={(e) => setEditSection(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {STANDARD_SECTIONS.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Assignment *</label>
                <select
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {STANDARD_SUBJECTS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Access Authorization Level</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <label
                    className={`flex items-center space-x-2 p-3 border rounded-xl cursor-pointer ${
                      editAccessLevel === "MARK_ENTRY"
                        ? "bg-amber-50 border-amber-500 text-amber-900 font-bold"
                        : "border-slate-200 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="editAccessMode"
                      checked={editAccessLevel === "MARK_ENTRY"}
                      onChange={() => setEditAccessLevel("MARK_ENTRY")}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <div className="text-xs">Mark Entry Allowed</div>
                      <div className="text-[10px] text-slate-500 font-normal">Can input and edit marks</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center space-x-2 p-3 border rounded-xl cursor-pointer ${
                      editAccessLevel === "VIEW_ONLY"
                        ? "bg-blue-50 border-blue-500 text-blue-900 font-bold"
                        : "border-slate-200 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="editAccessMode"
                      checked={editAccessLevel === "VIEW_ONLY"}
                      onChange={() => setEditAccessLevel("VIEW_ONLY")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-xs">View Only</div>
                      <div className="text-[10px] text-slate-500 font-normal">Read grade sheets only</div>
                    </div>
                  </label>
                </div>
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

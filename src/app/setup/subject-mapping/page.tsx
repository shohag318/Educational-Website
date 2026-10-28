"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SessionNavHeader } from "@/app/session/SessionNavHeader";
import {
  BookOpen,
  Sparkles,
  Copy,
  Plus,
  RefreshCw,
  Check,
  Trash2,
  CheckCircle2,
  Users,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Layers,
  HelpCircle,
} from "lucide-react";

interface Subject {
  id: string;
  subjectCode?: string | null;
  name: string;
}

interface ClassSubjectMapping {
  id: string;
  classId: string;
  groupType: string;
  subjectId: string;
  subjectType: "MANDATORY" | "GROUP_ELECTIVE" | "OPTIONAL_4TH";
  creditWeight: number;
  subject: Subject;
}

export default function ClassSubjectMappingPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("SCIENCE");
  const [availableGroups, setAvailableGroups] = useState<string[]>(["MANDATORY", "SCIENCE", "HUMANITIES", "BUSINESS_STUDIES", "GENERAL"]);
  const [mappings, setMappings] = useState<ClassSubjectMapping[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"mapped" | "catalog">("mapped");

  // Selection for Batch Actions
  const [selectedMappingIds, setSelectedMappingIds] = useState<string[]>([]);
  const [selectedCatalogSubjectIds, setSelectedCatalogSubjectIds] = useState<string[]>([]);

  // Modals
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);

  // Copy Modal Form
  const [copySourceClassId, setCopySourceClassId] = useState("");
  const [copySourceGroup, setCopySourceGroup] = useState("SCIENCE");

  // New Subject Form
  const [newSubCode, setNewSubCode] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubType, setNewSubType] = useState<"MANDATORY" | "GROUP_ELECTIVE" | "OPTIONAL_4TH">("MANDATORY");

  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    const cls = classes.find((c) => c.id === newClassId);
    const isPrimaryOrJunior = cls && (cls.numericValue ? cls.numericValue < 9 : !/9|10|11|12|ssc|hsc/i.test(cls.name));
    if (isPrimaryOrJunior) {
      setSelectedGroup("GENERAL");
    } else {
      setSelectedGroup("SCIENCE");
    }
    setSelectedMappingIds([]);
    setSelectedCatalogSubjectIds([]);
  };

  // Fetch Classes list
  useEffect(() => {
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setClasses(data.data);
          // Check URL query param if present
          const urlParams = new URLSearchParams(window.location.search);
          const paramClassId = urlParams.get("classId");
          const targetClass = paramClassId && data.data.some((c: any) => c.id === paramClassId)
            ? data.data.find((c: any) => c.id === paramClassId)
            : data.data[0];
          const targetId = targetClass.id;
          setSelectedClassId(targetId);

          const isPrimaryOrJunior = targetClass && (targetClass.numericValue ? targetClass.numericValue < 9 : !/9|10|11|12|ssc|hsc/i.test(targetClass.name));
          if (isPrimaryOrJunior) {
            setSelectedGroup("GENERAL");
          } else {
            setSelectedGroup("SCIENCE");
          }
        }
      })
      .catch((err) => console.error("Error loading classes:", err));
  }, []);

  // Fetch Class-Subject Mappings when Class or Group changes
  const fetchMappings = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/setup/class-subjects?classId=${selectedClassId}&groupType=${selectedGroup}`);
      const json = await res.json();
      if (json.success) {
        setMappings(json.data.mappings || []);
        setAllSubjects(json.data.allSubjects || []);
        setEnrolledCount(json.data.enrolledCount || 0);
        if (json.data.availableGroups && json.data.availableGroups.length > 0) {
          setAvailableGroups(json.data.availableGroups);
        }
        setSelectedMappingIds([]);
        setSelectedCatalogSubjectIds([]);
      } else {
        showNotify("error", json.error || "Failed to load subjects");
      }
    } catch (e: any) {
      showNotify("error", e.message || "Network error loading subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMappings();
  }, [selectedClassId, selectedGroup]);

  const showNotify = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Change a subject's allocation type
  const handleUpdateType = async (subjectId: string, newType: string) => {
    try {
      const res = await fetch("/api/setup/class-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert",
          classId: selectedClassId,
          groupType: selectedGroup,
          subjectId,
          subjectType: newType,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotify("success", "Subject mapping updated successfully");
        fetchMappings();
      } else {
        showNotify("error", json.error);
      }
    } catch (err: any) {
      showNotify("error", err.message);
    }
  };

  // Remove mapping
  const handleRemoveMapping = async (subjectId: string) => {
    try {
      const res = await fetch("/api/setup/class-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          classId: selectedClassId,
          groupType: selectedGroup,
          subjectId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotify("success", "Subject removed from mapping");
        fetchMappings();
      } else {
        showNotify("error", json.error);
      }
    } catch (err: any) {
      showNotify("error", err.message);
    }
  };

  // Quick add from catalog
  const handleAddFromCatalog = async (subjectId: string, subjectType: "MANDATORY" | "GROUP_ELECTIVE" | "OPTIONAL_4TH") => {
    try {
      const res = await fetch("/api/setup/class-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert",
          classId: selectedClassId,
          groupType: selectedGroup,
          subjectId,
          subjectType,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotify("success", "Subject mapped to class and group!");
        fetchMappings();
      } else {
        showNotify("error", json.error);
      }
    } catch (err: any) {
      showNotify("error", err.message);
    }
  };

  // Batch assign from catalog
  const handleBatchAssignFromCatalog = async (subjectType: "MANDATORY" | "GROUP_ELECTIVE" | "OPTIONAL_4TH") => {
    if (selectedCatalogSubjectIds.length === 0) return;
    try {
      const res = await fetch("/api/setup/class-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch_assign",
          classId: selectedClassId,
          groupType: selectedGroup,
          subjectIds: selectedCatalogSubjectIds,
          subjectType,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotify("success", `Added ${selectedCatalogSubjectIds.length} subjects to mapping!`);
        fetchMappings();
      } else {
        showNotify("error", json.error);
      }
    } catch (err: any) {
      showNotify("error", err.message);
    }
  };

  // Batch update mapped subjects
  const handleBatchUpdateMapped = async (subjectType: "MANDATORY" | "GROUP_ELECTIVE" | "OPTIONAL_4TH") => {
    if (selectedMappingIds.length === 0) return;
    try {
      const res = await fetch("/api/setup/class-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch_assign",
          classId: selectedClassId,
          groupType: selectedGroup,
          subjectIds: selectedMappingIds,
          subjectType,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotify("success", `Updated ${selectedMappingIds.length} subjects!`);
        fetchMappings();
      } else {
        showNotify("error", json.error);
      }
    } catch (err: any) {
      showNotify("error", err.message);
    }
  };

  // Batch remove mapped subjects
  const handleBatchRemoveMapped = async () => {
    if (selectedMappingIds.length === 0) return;
    if (!confirm(`Are you sure you want to remove ${selectedMappingIds.length} subjects from this mapping?`)) return;
    try {
      const res = await fetch("/api/setup/class-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove_batch",
          classId: selectedClassId,
          groupType: selectedGroup,
          subjectIds: selectedMappingIds,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotify("success", `Removed ${selectedMappingIds.length} subjects!`);
        fetchMappings();
      } else {
        showNotify("error", json.error);
      }
    } catch (err: any) {
      showNotify("error", err.message);
    }
  };

  // Remove a single subject from catalog pool
  const handleDeleteFromCatalog = async (subject: Subject) => {
    if (
      !confirm(
        `Are you sure you want to permanently remove "${subject.name}${subject.subjectCode ? ` (${subject.subjectCode})` : ""}" from the catalog pool?\n\nThis will delete it from the institution's master subject catalog.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/setup/class-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_catalog_subject",
          subjectId: subject.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotify("success", `Subject "${subject.name}" removed from catalog!`);
        fetchMappings();
      } else {
        showNotify("error", json.error || "Failed to remove subject from catalog");
      }
    } catch (err: any) {
      showNotify("error", err.message);
    }
  };

  // Batch remove multiple subjects from catalog pool
  const handleBatchDeleteFromCatalog = async () => {
    if (selectedCatalogSubjectIds.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to permanently remove ${selectedCatalogSubjectIds.length} subject(s) from the catalog pool?\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/setup/class-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_catalog_subject",
          subjectIds: selectedCatalogSubjectIds,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotify("success", `Removed ${selectedCatalogSubjectIds.length} subject(s) from catalog pool!`);
        setSelectedCatalogSubjectIds([]);
        fetchMappings();
      } else {
        showNotify("error", json.error || "Failed to remove subjects from catalog");
      }
    } catch (err: any) {
      showNotify("error", err.message);
    }
  };

  // Apply NCTB Preset Package
  const handleApplyPreset = async (presetKey: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/setup/class-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply_preset",
          classId: selectedClassId,
          groupType: selectedGroup,
          presetKey,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotify("success", json.message);
        setShowPresetModal(false);
        fetchMappings();
      } else {
        showNotify("error", json.error);
      }
    } catch (err: any) {
      showNotify("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Clone from another Class / Group
  const handleCopyFrom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copySourceClassId || !copySourceGroup) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/setup/class-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "copy_from",
          sourceClassId: copySourceClassId,
          sourceGroupType: copySourceGroup,
          targetClassId: selectedClassId,
          targetGroupType: selectedGroup,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotify("success", json.message);
        setShowCopyModal(false);
        fetchMappings();
      } else {
        showNotify("error", json.error);
      }
    } catch (err: any) {
      showNotify("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Create new subject & map
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/setup/class-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_subject_and_map",
          classId: selectedClassId,
          groupType: selectedGroup,
          subjectCode: newSubCode.trim() || null,
          name: newSubName.trim(),
          subjectType: newSubType,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotify(
          "success",
          `Created and mapped "${newSubName.trim()}"${newSubCode.trim() ? ` (${newSubCode.trim()})` : ""} successfully!`
        );
        setShowAddSubjectModal(false);
        setNewSubCode("");
        setNewSubName("");
        fetchMappings();
      } else {
        showNotify("error", json.error);
      }
    } catch (err: any) {
      showNotify("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Sync mappings to all currently enrolled students
  const handleSyncToStudents = async () => {
    if (enrolledCount === 0) {
      alert("No students are enrolled in this Class & Group yet. When students are enrolled, these mapped subjects will be assigned automatically!");
      return;
    }

    if (!confirm(`Synchronize ${mappings.length} mapped subjects to all ${enrolledCount} enrolled students in ${selectedClass?.name} (${selectedGroup})? Existing 4th subject preferences will be preserved.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/setup/class-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync_to_students",
          classId: selectedClassId,
          groupType: selectedGroup,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotify("success", json.message);
      } else {
        showNotify("error", json.error);
      }
    } catch (err: any) {
      showNotify("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const isClass9To12 = Boolean(
    (selectedClass?.numericValue && selectedClass.numericValue >= 9) ||
    (selectedClass && /9|10|11|12|nine|ten|eleven|twelve|ssc|hsc/i.test(selectedClass.name))
  );

  const groupOptions = isClass9To12
    ? ["MANDATORY", "SCIENCE", "HUMANITIES", "BUSINESS_STUDIES", "ALL"]
    : ["GENERAL", "MANDATORY", "ALL"];

  useEffect(() => {
    if (groupOptions.length > 0 && !groupOptions.includes(selectedGroup)) {
      setSelectedGroup(groupOptions[0]);
    }
  }, [selectedClassId, isClass9To12]);

  // Filtered lists
  const mappedSubjectIds = new Set(mappings.map((m) => m.subjectId));
  const unmappedSubjects = allSubjects.filter((s) => !mappedSubjectIds.has(s.id));

  const filteredMappings = mappings.filter(
    (m) =>
      m.subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.subject.subjectCode || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUnmapped = unmappedSubjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.subjectCode || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics
  const mandatoryCount = mappings.filter((m) => m.subjectType === "MANDATORY").length;
  const electiveCount = mappings.filter((m) => m.subjectType === "GROUP_ELECTIVE").length;
  const fourthCount = mappings.filter((m) => m.subjectType === "OPTIONAL_4TH").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <SessionNavHeader />
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4 ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {notification.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-red-600" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <span>Subject Mapping</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure curriculum subjects for each class and group.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setShowPresetModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>NCTB Presets</span>
          </button>

          <button
            onClick={() => {
              setCopySourceClassId(classes.length > 0 ? classes[0].id : "");
              setShowCopyModal(true);
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 border border-slate-200"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy From...</span>
          </button>

          <button
            onClick={() => setShowAddSubjectModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Subject</span>
          </button>
        </div>
      </div>

      {/* Selectors & Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Class Dropdown */}
          <div className="flex items-center space-x-3">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Target Class:</label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="text-xs font-semibold p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 min-w-[160px]"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Group Type Selector Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-700 mr-2 whitespace-nowrap">Academic Group:</span>
            {groupOptions.map((grp) => {
              const isActive = selectedGroup === grp;
              return (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setSelectedGroup(grp)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? grp === "MANDATORY"
                        ? "bg-emerald-700 text-white shadow-sm"
                        : "bg-slate-900 text-white shadow-sm"
                      : grp === "MANDATORY"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {grp === "ALL" ? "All Groups (Common)" : grp === "MANDATORY" ? "MANDATORY" : grp}
                </button>
              );
            })}
          </div>
        </div>

        {/* Real-time Summary Cards & Student Sync */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Total Mapped</span>
            <span className="text-base font-bold text-slate-900">{mappings.length} Subjects</span>
          </div>

          <div className="bg-blue-50/70 rounded-lg p-2.5 border border-blue-100">
            <span className="text-blue-700 block text-[11px] font-medium">Mandatory</span>
            <span className="text-base font-bold text-blue-900">{mandatoryCount}</span>
          </div>

          <div className="bg-indigo-50/70 rounded-lg p-2.5 border border-indigo-100">
            <span className="text-indigo-700 block text-[11px] font-medium">Group Elective</span>
            <span className="text-base font-bold text-indigo-900">{electiveCount}</span>
          </div>

          <div className="bg-amber-50/70 rounded-lg p-2.5 border border-amber-100">
            <span className="text-amber-800 block text-[11px] font-medium">4th Subject Optional</span>
            <span className="text-base font-bold text-amber-900">{fourthCount}</span>
          </div>

          <div className="bg-emerald-50/70 rounded-lg p-2.5 border border-emerald-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-emerald-700 text-[11px] font-medium">Enrolled Students</span>
              <Users className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-base font-bold text-emerald-950">{enrolledCount}</span>
              <button
                onClick={handleSyncToStudents}
                disabled={actionLoading || mappings.length === 0}
                className="text-[10px] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-2 py-1 rounded transition-colors flex items-center space-x-1"
                title="Sync mappings to existing enrolled students"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${actionLoading ? "animate-spin" : ""}`} />
                <span>Sync</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace: Tab Navigation & Search */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Workspace Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("mapped")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === "mapped"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>Currently Mapped ({mappings.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("catalog")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === "catalog"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>Add From Catalog ({unmappedSubjects.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by subject name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
        </div>

        {/* TAB 1: CURRENTLY MAPPED SUBJECTS */}
        {activeTab === "mapped" && (
          <div>
            {/* Batch actions bar if items are selected */}
            {selectedMappingIds.length > 0 && (
              <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center justify-between text-xs animate-in fade-in">
                <span className="font-semibold text-emerald-900">
                  {selectedMappingIds.length} subject(s) selected
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 text-[11px]">Set as:</span>
                  <button
                    onClick={() => handleBatchUpdateMapped("MANDATORY")}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px]"
                  >
                    Mandatory
                  </button>
                  <button
                    onClick={() => handleBatchUpdateMapped("GROUP_ELECTIVE")}
                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px]"
                  >
                    Elective
                  </button>
                  <button
                    onClick={() => handleBatchUpdateMapped("OPTIONAL_4TH")}
                    className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px]"
                  >
                    4th Subject
                  </button>
                  <button
                    onClick={handleBatchRemoveMapped}
                    className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-[11px] flex items-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredMappings.length > 0 &&
                          selectedMappingIds.length === filteredMappings.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMappingIds(filteredMappings.map((m) => m.subjectId));
                          } else {
                            setSelectedMappingIds([]);
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 w-20">Code</th>
                    <th className="p-3">Subject Name</th>
                    <th className="p-3">Applicable Group</th>
                    <th className="p-3">Subject Role / Classification</th>
                    <th className="p-3 text-center">Credit Weight</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMappings.map((item) => {
                    const isSelected = selectedMappingIds.includes(item.subjectId);
                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isSelected ? "bg-emerald-50/40" : "hover:bg-slate-50/70"
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMappingIds([...selectedMappingIds, item.subjectId]);
                              } else {
                                setSelectedMappingIds(
                                  selectedMappingIds.filter((id) => id !== item.subjectId)
                                );
                              }
                            }}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700">
                          {item.subject.subjectCode || "—"}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-900">{item.subject.name}</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {item.groupType}
                          </span>
                        </td>
                        <td className="p-3">
                          {/* Role Selector Pill */}
                          <select
                            value={item.subjectType}
                            onChange={(e) => handleUpdateType(item.subjectId, e.target.value)}
                            className={`p-1.5 rounded-lg text-xs font-semibold border focus:outline-none focus:ring-2 ${
                              item.subjectType === "MANDATORY"
                                ? "bg-blue-50 text-blue-800 border-blue-200 focus:ring-blue-500"
                                : item.subjectType === "GROUP_ELECTIVE"
                                ? "bg-indigo-50 text-indigo-800 border-indigo-200 focus:ring-indigo-500"
                                : "bg-amber-50 text-amber-900 border-amber-300 focus:ring-amber-500 font-bold"
                            }`}
                          >
                            <option value="MANDATORY">Mandatory / Compulsory</option>
                            <option value="GROUP_ELECTIVE">Group Elective</option>
                            <option value="OPTIONAL_4TH">★ 4th / Optional Subject</option>
                          </select>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-600">
                          {item.creditWeight.toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRemoveMapping(item.subjectId)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                            title="Remove from this class & group"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredMappings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400">
                        {loading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                            <span>Loading mappings...</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Layers className="w-8 h-8 mx-auto text-slate-300" />
                            <p className="text-xs">
                              No subjects are currently mapped to{" "}
                              <strong className="text-slate-700">
                                {selectedClass?.name} ({selectedGroup})
                              </strong>
                              .
                            </p>
                            <div className="flex items-center justify-center space-x-2 pt-2">
                              <button
                                onClick={() => setShowPresetModal(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Apply 1-Click NCTB Preset</span>
                              </button>
                              <button
                                onClick={() => setActiveTab("catalog")}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-1.5 rounded-lg text-xs"
                              >
                                Browse Catalog Pool
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CATALOG POOL (ADD UNMAPPED SUBJECTS) */}
        {activeTab === "catalog" && (
          <div>
            {/* Batch assign from catalog bar */}
            {selectedCatalogSubjectIds.length > 0 && (
              <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center justify-between text-xs animate-in fade-in">
                <span className="font-semibold text-emerald-900">
                  {selectedCatalogSubjectIds.length} catalog subject(s) selected
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 text-[11px]">Add as:</span>
                  <button
                    onClick={() => handleBatchAssignFromCatalog("MANDATORY")}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px]"
                  >
                    + Mandatory
                  </button>
                  <button
                    onClick={() => handleBatchAssignFromCatalog("GROUP_ELECTIVE")}
                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px]"
                  >
                    + Elective
                  </button>
                  <button
                    onClick={() => handleBatchAssignFromCatalog("OPTIONAL_4TH")}
                    className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px]"
                  >
                    + 4th Subject
                  </button>
                  <button
                    onClick={handleBatchDeleteFromCatalog}
                    className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-[11px] flex items-center space-x-1"
                    title="Permanently remove selected subjects from catalog pool"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove from Catalog</span>
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredUnmapped.length > 0 &&
                          selectedCatalogSubjectIds.length === filteredUnmapped.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCatalogSubjectIds(filteredUnmapped.map((s) => s.id));
                          } else {
                            setSelectedCatalogSubjectIds([]);
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 w-20">Code</th>
                    <th className="p-3">Subject Name</th>
                    <th className="p-3 text-right">Actions / Quick Map</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUnmapped.map((sub) => {
                    const isSelected = selectedCatalogSubjectIds.includes(sub.id);
                    return (
                      <tr
                        key={sub.id}
                        className={`transition-colors ${
                          isSelected ? "bg-emerald-50/40" : "hover:bg-slate-50/70"
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCatalogSubjectIds([...selectedCatalogSubjectIds, sub.id]);
                              } else {
                                setSelectedCatalogSubjectIds(
                                  selectedCatalogSubjectIds.filter((id) => id !== sub.id)
                                );
                              }
                            }}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700">{sub.subjectCode || "—"}</td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-900">{sub.name}</span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              onClick={() => handleAddFromCatalog(sub.id, "MANDATORY")}
                              className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold text-[11px]"
                            >
                              + Mandatory
                            </button>
                            <button
                              onClick={() => handleAddFromCatalog(sub.id, "GROUP_ELECTIVE")}
                              className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-semibold text-[11px]"
                            >
                              + Elective
                            </button>
                            <button
                              onClick={() => handleAddFromCatalog(sub.id, "OPTIONAL_4TH")}
                              className="px-2 py-1 rounded bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 font-semibold text-[11px]"
                            >
                              + 4th Sub
                            </button>
                            <button
                              onClick={() => handleDeleteFromCatalog(sub)}
                              className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 transition-colors"
                              title={`Remove "${sub.name}" from catalog pool`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredUnmapped.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-slate-400">
                        {mappings.length === 0 ? (
                          <div className="space-y-3 py-4">
                            <Layers className="w-8 h-8 mx-auto text-slate-300" />
                            <p className="text-xs font-semibold text-slate-600">
                              No catalog subjects found for <strong className="text-slate-800">{selectedClass?.name}</strong>.
                            </p>
                            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                              Only subjects belonging to this class appear here. You can add subjects using &quot;+ New Subject&quot;, copy from another class, or apply an NCTB preset.
                            </p>
                            <div className="flex items-center justify-center space-x-2 pt-2">
                              <button
                                onClick={() => setShowAddSubjectModal(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1 shadow-2xs cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ New Subject</span>
                              </button>
                              <button
                                onClick={() => {
                                  setCopySourceClassId("");
                                  setShowCopyModal(true);
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1 border border-slate-200 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy From...</span>
                              </button>
                              <button
                                onClick={() => setShowPresetModal(true)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1 border border-slate-200 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                <span>NCTB Presets</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span>All catalog subjects for {selectedClass?.name} are already mapped to this Class & Group!</span>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: 1-CLICK NCTB PRESET PACKAGES */}
      {showPresetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  1-Click NCTB Standard Subject Packages
                </h3>
              </div>
              <button
                onClick={() => setShowPresetModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Instantly populate standard subjects according to the Bangladesh National Curriculum &
              Textbook Board (NCTB) for <strong>{selectedClass?.name}</strong>:
            </p>

            <div className="space-y-2.5 text-xs">
              <button
                onClick={() => handleApplyPreset("nctb_science")}
                disabled={actionLoading}
                className="w-full text-left p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-emerald-800">
                    🔬 SSC Science Package (11 Subjects)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Bangla (1st, 2nd), English (1st, 2nd), Math, ICT, BGS, Physics, Chemistry, Biology, Higher Math
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
              </button>

              <button
                onClick={() => handleApplyPreset("nctb_business")}
                disabled={actionLoading}
                className="w-full text-left p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-indigo-800">
                    📊 SSC Business Studies Package (11 Subjects)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Bangla, English, Math, ICT, General Science, Accounting, Entrepreneurship, Finance, Agriculture
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />
              </button>

              <button
                onClick={() => handleApplyPreset("nctb_humanities")}
                disabled={actionLoading}
                className="w-full text-left p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-amber-800">
                    📜 SSC Humanities Package (11 Subjects)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Bangla, English, Math, ICT, General Science, History, Geography, Civics, Agriculture
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-600 shrink-0 ml-2" />
              </button>

              <button
                onClick={() => handleApplyPreset("nctb_general_junior")}
                disabled={actionLoading}
                className="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-slate-800">
                    🎒 Junior Package (Classes 6-8) (9 Subjects)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Bangla, English, Math, Science, BGS, ICT, Religion
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 ml-2" />
              </button>
            </div>

            <div className="text-[11px] text-slate-400 italic pt-2">
              Note: Missing subjects will be automatically created in the master subject catalog.
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CLONE / COPY MAPPING FROM ANOTHER CLASS */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Copy className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Clone Subject Mapping</h3>
              </div>
              <button
                onClick={() => setShowCopyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Quickly clone all subject rules from another Class & Group into{" "}
              <strong>
                {selectedClass?.name} ({selectedGroup})
              </strong>
              .
            </p>

            <form onSubmit={handleCopyFrom} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Source Class:</label>
                <select
                  value={copySourceClassId}
                  onChange={(e) => setCopySourceClassId(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Source Group:</label>
                <select
                  value={copySourceGroup}
                  onChange={(e) => setCopySourceGroup(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="MANDATORY">Mandatory</option>
                  <option value="SCIENCE">Science</option>
                  <option value="HUMANITIES">Humanities</option>
                  <option value="BUSINESS_STUDIES">Business Studies</option>
                  <option value="GENERAL">General</option>
                  <option value="ALL">All (Common)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCopyModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {actionLoading ? "Cloning..." : "Clone Mapping"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE NEW SUBJECT */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Add New Subject</h3>
              </div>
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Create a new subject and instantly add it to{" "}
              <strong>
                {selectedClass?.name} ({selectedGroup})
              </strong>
              .
            </p>

            <form onSubmit={handleCreateSubject} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Subject Code <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 154 or 126 (Optional)"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Subject Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Information & Communication Technology"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Subject Classification:</label>
                <select
                  value={newSubType}
                  onChange={(e: any) => setNewSubType(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="MANDATORY">Mandatory / Compulsory</option>
                  <option value="GROUP_ELECTIVE">Group Elective</option>
                  <option value="OPTIONAL_4TH">★ 4th / Optional Subject</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {actionLoading ? "Creating..." : "Create & Map"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guidance Footer */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Next Step: Go to <strong>Student Enrollment</strong> to register students who will automatically inherit these subjects!
          </span>
        </div>
        <Link
          href="/setup/students"
          className="inline-flex items-center space-x-1.5 font-bold text-emerald-600 hover:text-emerald-700 shrink-0"
        >
          <span>Go to Student Enrollment</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

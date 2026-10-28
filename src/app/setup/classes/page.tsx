"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SessionNavHeader } from "@/app/session/SessionNavHeader";
import {
  Plus,
  School,
  Layers,
  Users,
  BookOpen,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Sun,
  Sunrise,
} from "lucide-react";

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Class Form State
  const [className, setClassName] = useState("");
  const [numericValue, setNumericValue] = useState("");

  // New Section Form State
  const [selectedClassId, setSelectedClassId] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [sectionShift, setSectionShift] = useState("DAY");
  const [groupType, setGroupType] = useState("SCIENCE");

  // Edit Class State
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassName, setEditClassName] = useState("");
  const [editNumericValue, setEditNumericValue] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Delete Class Modal State
  const [deletingClass, setDeletingClass] = useState<any | null>(null);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      const json = await res.json();
      if (json.success) setClasses(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className || !numericValue) return;
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: className, numericValue }),
      });
      const json = await res.json();
      if (json.success) {
        setClassName("");
        setNumericValue("");
        fetchClasses();
      } else {
        alert("Error: " + json.error);
      }
    } catch (err: any) {
      alert("Failed: " + err.message);
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !sectionName) return;
    try {
      const res = await fetch("/api/classes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          sectionName,
          groupType,
          shift: sectionShift,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSectionName("");
        setSectionShift("DAY");
        fetchClasses();
      } else {
        alert("Error: " + json.error);
      }
    } catch (err: any) {
      alert("Failed: " + err.message);
    }
  };

  // Start Editing a Class
  const handleStartEdit = (cls: any) => {
    setEditingClassId(cls.id);
    setEditClassName(cls.name);
    setEditNumericValue(String(cls.numericValue));
  };

  // Cancel Editing
  const handleCancelEdit = () => {
    setEditingClassId(null);
    setEditClassName("");
    setEditNumericValue("");
  };

  // Save Edited Class
  const handleSaveEdit = async (classId: string) => {
    if (!editClassName || !editNumericValue) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/classes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: classId,
          name: editClassName,
          numericValue: editNumericValue,
        }),
      });
      const data = await res.json();
      if (data.success) {
        handleCancelEdit();
        fetchClasses();
      } else {
        alert("Error updating class: " + data.error);
      }
    } catch (err: any) {
      alert("Failed to update class: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm and Execute Class Deletion
  const handleConfirmDelete = async () => {
    if (!deletingClass) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/classes?id=${deletingClass.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setDeletingClass(null);
        fetchClasses();
      } else {
        alert("Error deleting class: " + data.error);
      }
    } catch (err: any) {
      alert("Failed to delete class: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Section
  const handleDeleteSection = async (sectionId: string, sectionName: string) => {
    if (!window.confirm(`Are you sure you want to remove section "${sectionName}"?`)) return;
    try {
      const res = await fetch(`/api/classes?sectionId=${sectionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchClasses();
      } else {
        alert("Error removing section: " + data.error);
      }
    } catch (err: any) {
      alert("Failed to remove section: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <SessionNavHeader />
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <School className="w-5 h-5 text-emerald-600" />
          <span>Classes & Sections</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage classes, shifts (Morning / Day), and sections.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Class Card (Without Shift) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Add New Academic Class</span>
          </h2>
          <form onSubmit={handleAddClass} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Class Name</label>
              <input
                type="text"
                placeholder="e.g. Class 10 or Class 11"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full text-xs mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Numeric Order</label>
              <input
                type="number"
                placeholder="e.g. 10 or 11"
                value={numericValue}
                onChange={(e) => setNumericValue(e.target.value)}
                className="w-full text-xs mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer mt-1"
            >
              Create Class
            </button>
          </form>
        </div>

        {/* Create Section Card (With Shift Option Morning/Day) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Add Section / Group</span>
          </h2>
          <form onSubmit={handleAddSection} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Assign To Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-xs mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                required
              >
                <option value="">-- Select Class --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Rank: {c.numericValue})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Section Name</label>
                <input
                  type="text"
                  placeholder="e.g. Section A or Padma"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  className="w-full text-xs mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Shift</label>
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setSectionShift("MORNING")}
                    className={`flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      sectionShift === "MORNING"
                        ? "bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-400/30"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Sunrise className="w-3.5 h-3.5 text-amber-500" />
                    <span>Morning</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSectionShift("DAY")}
                    className={`flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      sectionShift === "DAY"
                        ? "bg-blue-50 text-blue-800 border-blue-300 ring-2 ring-blue-400/30"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-blue-500" />
                    <span>Day</span>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Academic Group</label>
              <select
                value={groupType}
                onChange={(e) => setGroupType(e.target.value)}
                className="w-full text-xs mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="GENERAL">General</option>
                <option value="SCIENCE">Science</option>
                <option value="HUMANITIES">Humanities</option>
                <option value="BUSINESS_STUDIES">Business Studies</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer"
            >
              Add Section
            </button>
          </form>
        </div>
      </div>

      {/* Existing Classes & Sections List ("Current Academic Hierarchy") */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <School className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">Current Academic Hierarchy</h2>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium">
            {classes.length} Classes Registered
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {classes.map((cls) => {
            const isEditing = editingClassId === cls.id;

            return (
              <div key={cls.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                {/* Class Row Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {isEditing ? (
                    /* Inline Editing Mode */
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      <div>
                        <input
                          type="text"
                          value={editClassName}
                          onChange={(e) => setEditClassName(e.target.value)}
                          placeholder="Class Name"
                          className="text-xs p-1.5 border border-emerald-400 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-bold text-slate-900"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-slate-400">Rank:</span>
                        <input
                          type="number"
                          value={editNumericValue}
                          onChange={(e) => setEditNumericValue(e.target.value)}
                          placeholder="Rank"
                          className="w-16 text-xs p-1.5 border border-emerald-400 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-mono text-slate-900"
                        />
                      </div>
                      <div className="flex items-center space-x-1.5 ml-2">
                        <button
                          onClick={() => handleSaveEdit(cls.id)}
                          disabled={actionLoading}
                          className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1.5 rounded-lg font-semibold shadow-sm transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={actionLoading}
                          className="inline-flex items-center space-x-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal Display Mode */
                    <div className="flex items-center flex-wrap gap-2.5">
                      <span className="font-bold text-sm text-slate-900 tracking-tight">
                        {cls.name}
                      </span>

                      <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200">
                        Rank: {cls.numericValue}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({cls.sections?.length || 0} Sections)
                      </span>
                    </div>
                  )}

                  {/* Actions for this class */}
                  {!isEditing && (
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/setup/subject-mapping?classId=${cls.id}`}
                        className="inline-flex items-center space-x-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg font-semibold transition-colors"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Map Subjects</span>
                      </Link>

                      <button
                        onClick={() => handleStartEdit(cls)}
                        className="inline-flex items-center space-x-1 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer"
                        title="Edit Class Name and Rank"
                      >
                        <Pencil className="w-3 h-3 text-slate-600" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setDeletingClass(cls)}
                        className="inline-flex items-center space-x-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer"
                        title="Remove Class"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                        <span>Remove</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Sections Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                  {cls.sections && cls.sections.length > 0 ? (
                    cls.sections.map((sec: any) => {
                      const secShift = sec.shift === "MORNING" ? "Morning" : "Day";
                      return (
                        <div
                          key={sec.id}
                          className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 hover:bg-white transition-colors flex items-center justify-between text-xs group"
                        >
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                              <span>{sec.name}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                                  secShift === "Morning"
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-blue-50 text-blue-800 border-blue-200"
                                }`}
                              >
                                {secShift}
                              </span>
                            </div>
                            <div className="text-[10px] text-emerald-700 font-semibold tracking-wide">
                              {sec.groupType}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center space-x-1 text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[11px]">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span>{sec._count?.enrollments || 0}</span>
                            </span>
                            <button
                              onClick={() => handleDeleteSection(sec.id, sec.name)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                              title="Remove section"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-400 italic py-1">No sections created yet</div>
                  )}
                </div>
              </div>
            );
          })}

          {classes.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              No classes created yet. Use the form above to add your first academic class.
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Removing Class */}
      {deletingClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-red-100 text-red-600 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Remove Class & Hierarchy</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to remove <strong className="text-slate-800">&quot;{deletingClass.name}&quot;</strong>?
                </p>
              </div>
            </div>

            <div className="bg-red-50/60 border border-red-100 rounded-xl p-3 text-[11px] text-red-800 space-y-1">
              <p className="font-semibold">Notice regarding data dependencies:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-red-700">
                <li>All associated sections ({deletingClass.sections?.length || 0}) will be removed.</li>
                <li>Any student enrollments and subject mappings tied to this class will be cleared.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeletingClass(null)}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                {actionLoading ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

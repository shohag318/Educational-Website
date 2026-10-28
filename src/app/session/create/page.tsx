"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  Calendar,
  Check,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  School,
  Layers,
} from "lucide-react";
import { SessionNavHeader } from "../SessionNavHeader";

interface SessionClassItem {
  id: string;
  name: string;
  numericValue: number;
  shift?: string;
  sections?: Array<{ id: string; name: string }>;
}

export default function CreateSessionPage() {
  const router = useRouter();

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const [yearName, setYearName] = useState(String(nextYear));
  const [startDate, setStartDate] = useState(`${nextYear}-01-01`);
  const [endDate, setEndDate] = useState(`${nextYear}-12-31`);
  const [availableClasses, setAvailableClasses] = useState<SessionClassItem[]>([]);
  const [selectedClassNames, setSelectedClassNames] = useState<string[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const quickPills = [
    String(nextYear),
    `${currentYear}-${nextYear}`,
    `${nextYear}-${nextYear + 1}`,
    String(nextYear + 1),
  ];

  const handleSelectPill = (val: string) => {
    setYearName(val);
    const startY = val.split("-")[0] || String(nextYear);
    const endY = val.includes("-") ? val.split("-")[1] : startY;
    setStartDate(`${startY}-01-01`);
    setEndDate(`${endY}-12-31`);
  };

  useEffect(() => {
    const fetchExistingClasses = async () => {
      try {
        setClassesLoading(true);
        const res = await fetch("/api/classes");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // Sort strictly in ascending order by numericValue, then by name
          const sorted = [...json.data].sort((a: any, b: any) => {
            const numA = typeof a.numericValue === "number" ? a.numericValue : parseInt(a.numericValue, 10) || 0;
            const numB = typeof b.numericValue === "number" ? b.numericValue : parseInt(b.numericValue, 10) || 0;
            if (numA !== numB) {
              return numA - numB;
            }
            return a.name.localeCompare(b.name, undefined, { numeric: true });
          });
          setAvailableClasses(sorted);
          // By default, select all classes that were created in Classes and Sections
          setSelectedClassNames(sorted.map((c: any) => c.name));
        }
      } catch (e) {
        console.error("Failed to load classes from DB:", e);
      } finally {
        setClassesLoading(false);
      }
    };

    fetchExistingClasses();
  }, []);

  const handleToggleClass = (name: string) => {
    setSelectedClassNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleSelectAll = () => {
    setSelectedClassNames(availableClasses.map((c) => c.name));
  };

  const handleDeselectAll = () => {
    setSelectedClassNames([]);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!yearName.trim()) {
      setError("Please specify a session name / academic year.");
      return;
    }

    try {
      setSubmitting(true);
      const selectedClassesPayload = availableClasses
        .filter((c) => selectedClassNames.includes(c.name))
        .map((c) => ({
          name: c.name,
          numericValue: c.numericValue,
        }));

      const res = await fetch("/api/academic-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yearName: yearName.trim(),
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
          selectedClasses: selectedClassesPayload,
          allowMultiple: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/session");
        }, 1200);
      } else {
        setError(json.error || "Failed to create academic session.");
      }
    } catch (err: any) {
      setError(err.message || "Network request failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <SessionNavHeader />

      {/* Back to Manager */}
      <div className="flex items-center justify-between">
        <Link
          href="/session"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Session Manager</span>
        </Link>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center space-x-3 pb-5 border-b border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
            <PlusCircle className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Create New Session
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Set up a new academic year and assign classes.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-2 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-2 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Academic session "{yearName}" created successfully! Redirecting to manager...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Session Identification */}
          <div className="space-y-3">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>1. Session Identification</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Academic Session Name / Year <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={yearName}
                onChange={(e) => setYearName(e.target.value)}
                placeholder="e.g. 2027 or 2026-2027"
                className="w-full px-4 py-2.5 text-base font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                required
              />

              {/* Suggestions */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-[11px] text-slate-400 font-medium">Quick Pick:</span>
                {quickPills.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSelectPill(p)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 font-semibold border border-slate-200 transition-colors cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Date Boundaries */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>2. Validity Period & Calendar Bounds</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Session Start Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Official opening of academic term</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Session End Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Concluding date after annual tabulations</p>
              </div>
            </div>
          </div>



          {/* Section 3: Session-Wise Classes */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>3. Session-Wise Classes</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select classes created in &quot;Classes and Sections&quot; to include in this academic session (sorted in ascending order).
                </p>
              </div>

              {availableClasses.length > 0 && (
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>
                      {selectedClassNames.length} of {availableClasses.length} Classes Selected
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Quick Selection Buttons */}
            {availableClasses.length > 0 && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Classes created in Classes &amp; Sections (Ascending Order):</span>
                </span>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}

            {/* Checkbox Grid or Empty State */}
            {classesLoading ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <span>Loading classes from &quot;Classes and Sections&quot;...</span>
              </div>
            ) : availableClasses.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-300 space-y-2">
                <School className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-800">
                  No classes found in &quot;Classes and Sections&quot;
                </p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Classes must be created in &quot;Classes and Sections&quot; first before they can be assigned to a session.
                </p>
                <div className="pt-1">
                  <Link
                    href="/setup/classes"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                  >
                    <School className="w-3.5 h-3.5" />
                    <span>Create Classes in &quot;Classes and Sections&quot; &rarr;</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {availableClasses.map((cls) => {
                  const isSelected = selectedClassNames.includes(cls.name);
                  const sectionsCount = cls.sections?.length || 0;
                  return (
                    <div
                      key={cls.id || cls.name}
                      onClick={() => handleToggleClass(cls.name)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                        isSelected
                          ? "bg-emerald-50/70 border-emerald-500 shadow-2xs ring-1 ring-emerald-500"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer pointer-events-none"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800">
                            {cls.name}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            {sectionsCount > 0
                              ? `${sectionsCount} ${sectionsCount === 1 ? "Section" : "Sections"}`
                              : "0 Sections"}
                            {cls.shift ? ` • ${cls.shift} Shift` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-md">
                          {cls.numericValue > 0 ? `Grade ${cls.numericValue}` : "Class"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <Link
              href="/session"
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Session...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Create Session</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ResultNavHeader } from "@/app/results/ResultNavHeader";
import { FileEdit, History, Save, Check, RefreshCw } from "lucide-react";

export default function MarkAuditPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const [cqMark, setCqMark] = useState("");
  const [mcqMark, setMcqMark] = useState("");
  const [practicalMark, setPracticalMark] = useState("");
  const [auditReason, setAuditReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/exams")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setExams(data.data);
          setSelectedExamId(data.data[0].id);
        }
      });

    fetch("/api/subjects")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setSubjects(data.data);
          setSelectedSubjectId(data.data[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    const exam = exams.find((e) => e.id === selectedExamId);
    if (exam) {
      fetch(`/api/students?classId=${exam.classId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data.length > 0) {
            setStudents(data.data);
            setSelectedEnrollmentId(data.data[0].id);
          }
        });
    }
  }, [selectedExamId, exams]);

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !selectedSubjectId || !selectedEnrollmentId || !auditReason) {
      alert("Please fill all fields and provide an audit reason");
      return;
    }

    setSaving(true);
    try {
      const components: Record<string, number> = {};
      if (cqMark !== "") components["CQ"] = parseFloat(cqMark);
      if (mcqMark !== "") components["MCQ"] = parseFloat(mcqMark);
      if (practicalMark !== "") components["PRACTICAL"] = parseFloat(practicalMark);

      const res = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExamId,
          subjectId: selectedSubjectId,
          isOverride: true,
          auditReason,
          modifiedBy: "ADMIN_PRINCIPAL",
          entries: [
            {
              enrollmentId: selectedEnrollmentId,
              isAbsent: false,
              components,
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Override recorded in immutable audit log. Re-calculate results to update ranks.");
        setAuditReason("");
        setCqMark("");
        setMcqMark("");
        setPracticalMark("");
      } else {
        alert("Error: " + data.error);
      }
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ResultNavHeader />
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <FileEdit className="w-5 h-5 text-emerald-600" />
          <span>Mark Override & Audit Trail</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Perform administrative mark adjustments in Draft mode. Every change is strictly audited with previous/new values and recorded justification.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <a
            href="/results/review"
            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-emerald-700 transition-colors"
          >
            Re-calculate Now
          </a>
        </div>
      )}

      {/* Override Form */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
          <History className="w-4 h-4 text-emerald-600" />
          <span>Record Mark Override</span>
        </h2>

        <form onSubmit={handleApplyOverride} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-slate-600">Select Exam *</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-slate-600">Select Student *</label>
              <select
                value={selectedEnrollmentId}
                onChange={(e) => setSelectedEnrollmentId(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    Roll #{st.classRoll} - {st.student.firstName} {st.student.lastName} ({st.student.studentIdNo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-slate-600">Select Subject *</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.subjectCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="font-semibold text-slate-700">New CQ Mark:</label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 55"
                value={cqMark}
                onChange={(e) => setCqMark(e.target.value)}
                className="w-full mt-1 p-2 border rounded bg-white"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">New MCQ Mark:</label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 24"
                value={mcqMark}
                onChange={(e) => setMcqMark(e.target.value)}
                className="w-full mt-1 p-2 border rounded bg-white"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">New Practical Mark:</label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 22"
                value={practicalMark}
                onChange={(e) => setPracticalMark(e.target.value)}
                className="w-full mt-1 p-2 border rounded bg-white"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700">
              Audit Reason & Justification (Required) *
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Script re-evaluation requested by Head of Department. 5 marks added to CQ."
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center space-x-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Recording Override..." : "Save Override with Audit Trail"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

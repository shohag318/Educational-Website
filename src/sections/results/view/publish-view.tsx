"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Lock, Unlock, CheckCircle2, AlertCircle } from "lucide-react";
import { AppButton } from "@/components/button/app-button";
import { ResultNavHeader } from "@/sections/results/component/result-nav-header";

export default function PublishPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    try {
      const res = await fetch("/api/exams");
      const data = await res.json();
      if (data.success) setExams(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleTogglePublish = async (examId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "PUBLISHED" ? "DRAFT_PREVIEW" : "PUBLISHED";
    const confirmMsg =
      currentStatus === "PUBLISHED"
        ? "Unlock exam? This will return it to Draft Preview and allow mark modifications."
        : "Publish exam? This locks marks from further edits and enables public report cards and SMS notifications.";

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/exams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchExams();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err: any) {
      alert("Failed: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ResultNavHeader />
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Publish Results</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Publish completed examination terms to enable report cards and guardian SMS notifications.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
        {exams.map((exam) => {
          const isPublished = exam.status === "PUBLISHED";

          return (
            <div key={exam.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-sm">{exam.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isPublished
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    {exam.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 space-x-2">
                  <span>Class: <strong>{exam.class?.name}</strong></span>
                  <span>•</span>
                  <span>Term: <strong>{exam.termCode}</strong></span>
                  <span>•</span>
                  <span>
                    Processed Students: <strong>{exam._count?.processedResults || 0}</strong>
                  </span>
                </div>
              </div>

              <div>
                <AppButton
                  size="small"
                  variant={isPublished ? "soft" : "contained"}
                  color={isPublished ? "warning" : "success"}
                  startIcon={isPublished ? <Unlock size={14} /> : <Lock size={14} />}
                  onClick={() => handleTogglePublish(exam.id, exam.status)}
                >
                  {isPublished ? "Unlock & Revert to Draft" : "Lock & Publish Result"}
                </AppButton>
              </div>
            </div>
          );
        })}

        {exams.length === 0 && (
          <div className="p-8 text-center text-slate-400 italic text-xs">
            No exams found. Seed demo data to preview.
          </div>
        )}
      </div>
    </div>
  );
}

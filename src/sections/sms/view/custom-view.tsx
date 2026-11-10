"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  Filter,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Sparkles,
  Users,
  Copy,
  Check,
  Clock,
  History,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  X,
  Phone,
  ListPlus,
  UserPlus,
} from "@/components/iconify/lucide";
import { SmsNavHeader } from "@/sections/sms/component/sms-nav-header";
import { getStoredSchoolInfo } from "@/lib/settingsStore";
import { SessionSelect } from "@/components/SessionSelect";
import { AppButton } from "@/components/button/app-button";
import { AppTable, TableFilterBar } from "@/components";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getScopedStorageKey, getActiveTenantCode, TENANT_SWITCH_EVENT } from "@/lib/clientTenant";

interface StudentRecord {
  id: string;
  classRoll: number;
  student: {
    id: string;
    studentIdNo: string;
    firstName: string;
    lastName: string;
    guardianName?: string;
    guardianPhone?: string;
  };
  class: {
    id: string;
    name: string;
  };
  section: {
    id: string;
    name: string;
    shift?: string;
    groupType?: string;
  };
}

interface ManualRecipient {
  id: string;
  phone: string;
  label?: string;
}

interface TemplatePreset {
  id: string;
  title: string;
  category: "Notice" | "Meeting" | "Urgent" | "Fees" | "Holiday";
  text: string;
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "closure",
    title: "Emergency School Closure",
    category: "Urgent",
    text: "Dear Guardian, {institution} will remain closed on {date} due to unavoidable circumstances. Regular classes will resume next working day.",
  },
  {
    id: "ptm",
    title: "Parents-Teacher Meeting (PTM)",
    category: "Meeting",
    text: "Dear Guardian of {student_name} (Roll: {roll}, {class}), you are cordially invited to the Parents-Teacher Meeting on {date} at {institution} campus. Your presence is highly valued.",
  },
  {
    id: "fee_due",
    title: "Tuition Fee Reminder",
    category: "Fees",
    text: "Dear Guardian, please be reminded that the monthly school tuition fee for {student_name} (Roll: {roll}, {class}) is due. Please settle by {date}. - {institution}",
  },
  {
    id: "exam_routine",
    title: "Exam Routine & Admit Card",
    category: "Notice",
    text: "Dear Guardian, final examination routine and admit cards for {student_name} (Roll: {roll}, {class}) are now available at the office. Please collect before {date}. - {institution}",
  },
  {
    id: "sports_day",
    title: "Annual Sports & Cultural Day",
    category: "Notice",
    text: "Dear Guardian, Annual Sports and Cultural Meet of {institution} will be held on {date}. You and your family are warmly invited to attend and encourage our students.",
  },
  {
    id: "holiday_greetings",
    title: "Holiday / Festive Greetings",
    category: "Holiday",
    text: "Warm greetings from {institution}! Wishing {student_name} and your respected family a joyous, blessed, and safe holiday.",
  },
];

// Helper to normalize and validate Bangladeshi phone numbers
const cleanBdPhone = (phone: string): string => {
  let cleaned = phone.replace(/[^\d+]/g, "").trim();
  if (cleaned.startsWith("+880")) cleaned = "0" + cleaned.slice(4);
  else if (cleaned.startsWith("880")) cleaned = "0" + cleaned.slice(3);
  return cleaned;
};

const isValidBdPhone = (phone: string): boolean => {
  const cleaned = cleanBdPhone(phone);
  return /^01[3-9]\d{8}$/.test(cleaned);
};

const parseBulkNumbers = (text: string): { valid: string[]; invalid: string[] } => {
  const tokens = text
    .split(/[\n,;\s]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const valid: string[] = [];
  const invalid: string[] = [];

  tokens.forEach((token) => {
    const cleaned = cleanBdPhone(token);
    if (/^01[3-9]\d{8}$/.test(cleaned)) {
      if (!valid.includes(cleaned)) {
        valid.push(cleaned);
      }
    } else {
      if (!invalid.includes(token)) {
        invalid.push(token);
      }
    }
  });

  return { valid, invalid };
};

export default function CustomSMSPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);

  // Filters for Enrolled Students
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Audience Mode: STUDENTS | MANUAL | COMBINED
  const [audienceMode, setAudienceMode] = useState<"STUDENTS" | "MANUAL" | "COMBINED">("STUDENTS");

  // Selected Enrolled Student IDs
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Manually Added Recipients
  const [manualRecipients, setManualRecipients] = useState<ManualRecipient[]>([]);
  const [singlePhone, setSinglePhone] = useState("");
  const [singleLabel, setSingleLabel] = useState("");
  const [singlePhoneError, setSinglePhoneError] = useState("");

  const [bulkPhonesText, setBulkPhonesText] = useState("");
  const [manualEntryTab, setManualEntryTab] = useState<"SINGLE" | "MULTIPLE">("SINGLE");
  const [bulkPhoneFeedback, setBulkPhoneFeedback] = useState<string | null>(null);

  // Composer
  const [messageTemplate, setMessageTemplate] = useState(TEMPLATE_PRESETS[0].text);
  const [senderId, setSenderId] = useState("SMARTACAD");
  const [provider, setProvider] = useState<"MOCK" | "SSL_WIRELESS" | "GREENWEB">("MOCK");

  // Preview Mode: STUDENT vs MANUAL
  const [previewMode, setPreviewMode] = useState<"STUDENT" | "MANUAL">("STUDENT");

  // Dispatch state & logs
  const [sending, setSending] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [customLogs, setCustomLogs] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  // Load school info & classes on mount
  useEffect(() => {
    setSchoolInfo(getStoredSchoolInfo());
    const loadClasses = () => {
      fetch("/api/classes")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setClasses(data.data);
          } else {
            setClasses([]);
          }
        })
        .catch((err) => console.error("Error fetching classes:", err));
    };

    const loadLogs = (targetCode?: string) => {
      const code = targetCode || getActiveTenantCode();
      try {
        const key = getScopedStorageKey("nctb_custom_sms_logs", code);
        const stored = localStorage.getItem(key) || (code === "108254" ? localStorage.getItem("nctb_custom_sms_logs") : null);
        if (stored) setCustomLogs(JSON.parse(stored));
        else setCustomLogs([]);
      } catch {}
    };

    loadClasses();
    loadLogs();

    const handleTenantSwitch = (e: any) => {
      loadClasses();
      loadLogs(e?.detail?.code);
    };

    window.addEventListener(TENANT_SWITCH_EVENT, handleTenantSwitch);
    return () => {
      window.removeEventListener(TENANT_SWITCH_EVENT, handleTenantSwitch);
    };
  }, []);

  // Fetch students based on filters
  useEffect(() => {
    setLoadingStudents(true);
    const params = new URLSearchParams();
    if (selectedSession && selectedSession !== "ALL") params.set("session", selectedSession);
    if (selectedClassId) params.set("classId", selectedClassId);
    if (selectedSectionId) params.set("sectionId", selectedSectionId);
    if (selectedGroup && selectedGroup !== "ALL") params.set("groupType", selectedGroup);
    if (selectedShift && selectedShift !== "ALL") params.set("shift", selectedShift);

    fetch(`/api/students?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setStudents(data.data);
          // By default select all students with valid phone numbers
          const validIds = data.data
            .filter((s: StudentRecord) => s.student?.guardianPhone && s.student.guardianPhone.trim().length >= 8)
            .map((s: StudentRecord) => s.id);
          setSelectedStudentIds(validIds);
        } else {
          setStudents([]);
          setSelectedStudentIds([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setStudents([]);
        setSelectedStudentIds([]);
      })
      .finally(() => setLoadingStudents(false));
  }, [selectedSession, selectedClassId, selectedSectionId, selectedGroup, selectedShift]);

  // Section options derived from selected class
  const currentClass = classes.find((c) => c.id === selectedClassId);
  const rawSections = currentClass
    ? currentClass.sections || []
    : classes.flatMap((c) => c.sections || []);

  const availableSections = rawSections.filter((s: any) => {
    if (selectedGroup !== "ALL" && s.groupType !== selectedGroup) return false;
    if (selectedShift && selectedShift !== "ALL" && s.shift?.toUpperCase() !== selectedShift.toUpperCase()) return false;
    return true;
  });

  const availableShifts = Array.from(
    new Set(
      rawSections
        .map((s: any) => s.shift?.toUpperCase())
        .filter((sh: any) => Boolean(sh) && sh !== "MORNING" && sh !== "DAY")
    )
  ) as string[];

  // Filtered students by search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter((s) => {
      const name = `${s.student.firstName} ${s.student.lastName}`.toLowerCase();
      const roll = String(s.classRoll);
      const phone = s.student.guardianPhone || "";
      return name.includes(q) || roll.includes(q) || phone.includes(q);
    });
  }, [students, searchQuery]);

  // Dynamic template rendering helper for enrolled student
  const renderMessageForStudent = (st: StudentRecord) => {
    const instName = schoolInfo?.name || "Smart Academy";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return messageTemplate
      .replace(/{student_name}/g, `${st.student.firstName} ${st.student.lastName}`.trim())
      .replace(/{roll}/g, String(st.classRoll))
      .replace(/{class}/g, st.class?.name || "Class")
      .replace(/{guardian_name}/g, st.student.guardianName || "Guardian")
      .replace(/{institution}/g, instName)
      .replace(/{date}/g, dateStr);
  };

  // Dynamic template rendering helper for manual phone numbers
  const renderMessageForManual = (phone: string, label?: string) => {
    const instName = schoolInfo?.name || "Smart Academy";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return messageTemplate
      .replace(/{student_name}/g, label || "Recipient")
      .replace(/{roll}/g, "—")
      .replace(/{class}/g, "General")
      .replace(/{guardian_name}/g, label || "Guardian")
      .replace(/{institution}/g, instName)
      .replace(/{date}/g, dateStr);
  };

  // Character calculation
  const charStats = useMemo(() => {
    const text = messageTemplate;
    const isUnicode = /[^\u0000-\u007F]/.test(text); // contains Bangla or special characters
    const maxPerSms = isUnicode ? 70 : 160;
    const length = text.length;
    const parts = length === 0 ? 0 : Math.ceil(length / maxPerSms);

    return { isUnicode, length, parts, maxPerSms };
  }, [messageTemplate]);

  // Sample rendered preview
  const sampleStudent = students.find((s) => selectedStudentIds.includes(s.id)) || students[0];
  const sampleManual = manualRecipients[0];

  const sampleRenderedText = useMemo(() => {
    if (previewMode === "MANUAL" && sampleManual) {
      return renderMessageForManual(sampleManual.phone, sampleManual.label);
    }
    if (sampleStudent) {
      return renderMessageForStudent(sampleStudent);
    }
    if (sampleManual) {
      return renderMessageForManual(sampleManual.phone, sampleManual.label);
    }
    return renderMessageForManual("01700000000");
  }, [previewMode, sampleStudent, sampleManual, messageTemplate, schoolInfo]);

  // Total active target count
  const totalRecipientsCount = useMemo(() => {
    let count = 0;
    if (audienceMode === "STUDENTS" || audienceMode === "COMBINED") {
      count += selectedStudentIds.length;
    }
    if (audienceMode === "MANUAL" || audienceMode === "COMBINED") {
      count += manualRecipients.length;
    }
    return count;
  }, [audienceMode, selectedStudentIds.length, manualRecipients.length]);

  // Student selection helpers
  const handleSelectAll = () => {
    const validFilteredIds = filteredStudents
      .filter((s) => s.student?.guardianPhone && s.student.guardianPhone.trim().length >= 8)
      .map((s) => s.id);
    setSelectedStudentIds(validFilteredIds);
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds([]);
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Manual Number Addition: Single
  const handleAddSingleNumber = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSinglePhoneError("");

    const cleaned = cleanBdPhone(singlePhone);
    if (!cleaned) {
      setSinglePhoneError("Please enter a mobile phone number.");
      return;
    }

    if (!isValidBdPhone(cleaned)) {
      setSinglePhoneError("Invalid BD mobile number. Must be 11 digits starting with 013-019.");
      return;
    }

    if (manualRecipients.some((r) => r.phone === cleaned)) {
      setSinglePhoneError("This number is already in the manual recipient list.");
      return;
    }

    const newRecipient: ManualRecipient = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(6)}`,
      phone: cleaned,
      label: singleLabel.trim() || undefined,
    };

    setManualRecipients((prev) => [newRecipient, ...prev]);
    setSinglePhone("");
    setSingleLabel("");
  };

  // Manual Number Addition: Multiple (Bulk Paste)
  const handleAddMultipleNumbers = () => {
    setBulkPhoneFeedback(null);
    if (!bulkPhonesText.trim()) {
      setBulkPhoneFeedback("Please paste or type phone numbers into the box.");
      return;
    }

    const { valid, invalid } = parseBulkNumbers(bulkPhonesText);
    if (valid.length === 0) {
      setBulkPhoneFeedback("No valid Bangladeshi mobile numbers detected (must be 013-019...).");
      return;
    }

    const existingPhones = new Set(manualRecipients.map((r) => r.phone));
    const newNumbers = valid.filter((p) => !existingPhones.has(p));
    const duplicateCount = valid.length - newNumbers.length;

    if (newNumbers.length === 0) {
      setBulkPhoneFeedback(`All ${valid.length} numbers are already in the manual recipient list.`);
      return;
    }

    const newRecipients: ManualRecipient[] = newNumbers.map((p) => ({
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(5)}-${p}`,
      phone: p,
    }));

    setManualRecipients((prev) => [...prev, ...newRecipients]);
    setBulkPhonesText("");
    setBulkPhoneFeedback(
      `Successfully added ${newNumbers.length} number(s).` +
      (duplicateCount > 0 ? ` (${duplicateCount} duplicate numbers skipped)` : "") +
      (invalid.length > 0 ? ` (${invalid.length} invalid tokens skipped)` : "")
    );
  };

  const handleRemoveManualRecipient = (id: string) => {
    setManualRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAllManual = () => {
    if (window.confirm("Remove all manually added phone numbers?")) {
      setManualRecipients([]);
      setBulkPhoneFeedback(null);
    }
  };

  // Insert placeholder token into template
  const insertToken = (token: string) => {
    setMessageTemplate((prev) => `${prev} ${token}`);
  };

  // Dispatch Batch SMS
  const handleDispatch = async () => {
    const targetStudents =
      audienceMode === "STUDENTS" || audienceMode === "COMBINED"
        ? students.filter((s) => selectedStudentIds.includes(s.id))
        : [];

    const targetManuals =
      audienceMode === "MANUAL" || audienceMode === "COMBINED"
        ? manualRecipients
        : [];

    const totalCount = targetStudents.length + targetManuals.length;

    if (totalCount === 0) {
      alert("Please select at least one student guardian or add at least one manual phone number.");
      return;
    }

    if (!messageTemplate.trim()) {
      alert("Message text cannot be empty.");
      return;
    }

    const confirmSend = window.confirm(
      `Confirm sending Custom SMS to ${totalCount} recipient(s)?` +
      (targetStudents.length > 0 ? `\n• ${targetStudents.length} Enrolled Student Guardians` : "") +
      (targetManuals.length > 0 ? `\n• ${targetManuals.length} Manual Phone Numbers` : "")
    );
    if (!confirmSend) return;

    setSending(true);
    setDispatchResult(null);

    const payloadRecipients = [
      ...targetStudents.map((st) => ({
        enrollmentId: st.id,
        studentName: `${st.student.firstName} ${st.student.lastName}`.trim(),
        classRoll: st.classRoll,
        className: st.class?.name,
        guardianPhone: st.student.guardianPhone,
        messageBody: renderMessageForStudent(st),
      })),
      ...targetManuals.map((m) => ({
        enrollmentId: undefined,
        studentName: m.label || "Manual Recipient",
        guardianPhone: m.phone,
        messageBody: renderMessageForManual(m.phone, m.label),
      })),
    ];

    try {
      const res = await fetch("/api/sms/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: payloadRecipients,
          campaignName: "Custom Guardian Broadcast",
          senderId,
          provider,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDispatchResult(data);

        // Append to logs
        const newLog = {
          id: `custom-sms-${Date.now()}`,
          date: new Date().toISOString(),
          recipientCount: data.sentCount,
          failedCount: data.failedCount,
          sampleMessage: data.sampleMessage,
          provider,
          senderId,
        };

        const updatedLogs = [newLog, ...customLogs].slice(0, 30);
        setCustomLogs(updatedLogs);
        try {
          const code = getActiveTenantCode();
          localStorage.setItem(getScopedStorageKey("nctb_custom_sms_logs", code), JSON.stringify(updatedLogs));
        } catch {}
      } else {
        alert("Failed to send Custom SMS: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleCopySample = () => {
    navigator.clipboard.writeText(sampleRenderedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans">
      {/* Top Module Sub-navigation */}
      <SmsNavHeader />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded-md border border-indigo-700/60 flex items-center gap-1.5 w-max">
            <MessageSquare className="w-3.5 h-3.5" />
            SMS & Notices • Custom Broadcast
          </span>
          <h1 className="text-2xl font-bold mt-2 tracking-tight">
            Custom SMS Broadcast
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Send announcements, reminders, and notices directly to guardians or custom phone numbers.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <AppButton
            onClick={() => setShowLogs(!showLogs)}
            variant="contained"
            color="secondary"
            startIcon={<History className="w-3.5 h-3.5" />}
            endIcon={showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          >
            Audit Logs ({customLogs.length})
          </AppButton>
        </div>
      </div>

      {/* Dispatch Success Alert */}
      {dispatchResult && (
        <div className="bg-emerald-50 border-2 border-emerald-500/40 p-4 rounded-2xl shadow-sm text-emerald-950 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-emerald-900">
                  Custom SMS Dispatch Completed Successfully!
                </h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Successfully dispatched to <strong>{dispatchResult.sentCount}</strong> recipient(s)
                  {dispatchResult.failedCount > 0 && ` (${dispatchResult.failedCount} failed)`}.
                </p>
              </div>
            </div>

            <AppButton onClick={() => setDispatchResult(null)} variant="link">
              Dismiss
            </AppButton>
          </div>

          <div className="mt-3 bg-white/80 p-3 rounded-xl border border-emerald-200 text-xs text-slate-700 font-mono">
            <span className="font-bold text-slate-900">Sample Dispatched SMS: </span>
            {dispatchResult.sampleMessage}
          </div>
        </div>
      )}

      {/* Audit Logs Accordion Panel */}
      {showLogs && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Recent Custom SMS Dispatch History
              </h3>
            </div>
            <span className="text-xs text-slate-400">{customLogs.length} Records</span>
          </div>

          {customLogs.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-3 text-center">
              No recent custom broadcasts sent yet.
            </p>
          ) : (
            <TableFilterBar showSearch={false}>
          <AppTable<(typeof customLogs)[number]>
        embedded
              rows={customLogs}
              rowKey={(row) => row.id}
              defaultOrderBy="date"
              minWidth={800}
              columns={[
                {
                  id: "date",
                  label: "Date / Time",
                  render: (log) => (
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                      {new Date(log.date).toLocaleString()}
                    </Typography>
                  ),
                },
                {
                  id: "recipientCount",
                  label: "Recipients",
                  render: (log) => (
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "success.dark" }}>
                      {log.recipientCount} Sent {log.failedCount > 0 && `(${log.failedCount} failed)`}
                    </Typography>
                  ),
                },
                {
                  id: "senderId",
                  label: "Sender ID",
                  render: (log) => (
                    <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                      {log.senderId}
                    </Typography>
                  ),
                },
                {
                  id: "provider",
                  label: "Gateway",
                  render: (log) => (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700">
                      {log.provider}
                    </span>
                  ),
                },
                {
                  id: "sampleMessage",
                  label: "Message Excerpt",
                  sortable: false,
                  render: (log) => (
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }} noWrap>
                      {log.sampleMessage}
                    </Typography>
                  ),
                },
              ]}
            />
        </TableFilterBar>
          )}
        </div>
      )}

      {/* ========================================================
          AUDIENCE TARGETING: STUDENTS vs MANUAL NUMBERS
         ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        {/* Header with Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Target Audience & Recipient Selection</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose to dispatch to enrolled student guardians, manually entered single/bulk phone numbers, or both combined.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <AppButton
              type="button"
              size="small"
              onClick={() => setAudienceMode("STUDENTS")}
              variant="soft"
              color={audienceMode === "STUDENTS" ? "primary" : "inherit"}
              startIcon={<Users className="w-3.5 h-3.5" />}
            >
              Enrolled Students ({selectedStudentIds.length})
            </AppButton>

            <AppButton
              type="button"
              size="small"
              onClick={() => setAudienceMode("MANUAL")}
              variant="soft"
              color={audienceMode === "MANUAL" ? "primary" : "inherit"}
              startIcon={<Phone className="w-3.5 h-3.5" />}
            >
              Manual Numbers ({manualRecipients.length})
            </AppButton>

            <AppButton
              type="button"
              size="small"
              onClick={() => setAudienceMode("COMBINED")}
              variant="soft"
              color={audienceMode === "COMBINED" ? "primary" : "inherit"}
              startIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Both Combined ({selectedStudentIds.length + manualRecipients.length})
            </AppButton>
          </div>
        </div>

        {/* ========================================================
            MANUAL PHONE NUMBERS ENTRY PANEL
            (Shown when audienceMode is MANUAL or COMBINED)
           ======================================================== */}
        {(audienceMode === "MANUAL" || audienceMode === "COMBINED") && (
          <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-indigo-700" />
                <h4 className="font-bold text-xs sm:text-sm text-indigo-950 uppercase tracking-wide">
                  Manually Add Phone Numbers
                </h4>
              </div>

              {/* Toggle Single vs Multiple Entry */}
              <div className="flex items-center space-x-1 p-0.5 bg-white rounded-lg border border-indigo-200 text-[11px] font-semibold">
                <AppButton
                  type="button"
                  size="small"
                  onClick={() => setManualEntryTab("SINGLE")}
                  variant="soft"
                  color={manualEntryTab === "SINGLE" ? "primary" : "inherit"}
                  startIcon={<UserPlus className="w-3 h-3" />}
                >
                  Single Number
                </AppButton>
                <AppButton
                  type="button"
                  size="small"
                  onClick={() => setManualEntryTab("MULTIPLE")}
                  variant="soft"
                  color={manualEntryTab === "MULTIPLE" ? "primary" : "inherit"}
                  startIcon={<ListPlus className="w-3 h-3" />}
                >
                  Multiple Numbers (Bulk Paste)
                </AppButton>
              </div>
            </div>

            {/* Mode 1: Single Number Entry Form */}
            {manualEntryTab === "SINGLE" && (
              <form onSubmit={handleAddSingleNumber} className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Mobile Number <span className="text-rose-500">*</span>:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={singlePhone}
                        onChange={(e) => {
                          setSinglePhone(e.target.value);
                          setSinglePhoneError("");
                        }}
                        placeholder="e.g. 01712345678"
                        className="w-full p-2 pl-8 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                      />
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Bangladeshi 11-digit mobile (013-019)
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Recipient Name / Label (Optional):
                    </label>
                    <input
                      type="text"
                      value={singleLabel}
                      onChange={(e) => setSingleLabel(e.target.value)}
                      placeholder="e.g. Managing Committee / Staff"
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Used in &#123;student_name&#125; or preview
                    </span>
                  </div>

                  <div className="sm:col-span-1 flex items-end">
                    <AppButton
                      type="submit"
                      fullWidth
                      variant="contained"
                      startIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add Number
                    </AppButton>
                  </div>
                </div>

                {singlePhoneError && (
                  <div className="text-xs text-rose-600 flex items-center space-x-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{singlePhoneError}</span>
                  </div>
                )}
              </form>
            )}

            {/* Mode 2: Multiple Numbers Entry Form (Bulk Paste) */}
            {manualEntryTab === "MULTIPLE" && (
              <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Paste Multiple Phone Numbers:
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Separated by comma (,), spaces, or newlines
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={bulkPhonesText}
                    onChange={(e) => {
                      setBulkPhonesText(e.target.value);
                      setBulkPhoneFeedback(null);
                    }}
                    placeholder={`Paste multiple mobile numbers here, e.g.:
01711000001, 01822000002
01933000003
+8801544000004`}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[11px] text-slate-500">
                    Prefixes like <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">+88</code> or <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">88</code> are automatically cleaned. Duplicates are filtered out.
                  </div>

                  <AppButton
                    type="button"
                    onClick={handleAddMultipleNumbers}
                    variant="contained"
                    startIcon={<ListPlus className="w-3.5 h-3.5" />}
                  >
                    Parse & Add Numbers
                  </AppButton>
                </div>

                {bulkPhoneFeedback && (
                  <div className="text-xs text-indigo-900 bg-indigo-50 p-2 rounded-lg border border-indigo-200 flex items-center space-x-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{bulkPhoneFeedback}</span>
                  </div>
                )}
              </div>
            )}

            {/* Manual Numbers List Queue */}
            <div className="space-y-2 pt-2 border-t border-indigo-200/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Manually Added Numbers ({manualRecipients.length}):
                </span>
                {manualRecipients.length > 0 && (
                  <AppButton
                    type="button"
                    onClick={handleClearAllManual}
                    variant="link"
                    color="error"
                    startIcon={<Trash2 className="w-3 h-3" />}
                  >
                    Clear All Manual Numbers
                  </AppButton>
                )}
              </div>

              {manualRecipients.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2 text-center bg-white/60 rounded-lg border border-dashed border-slate-200">
                  No manual numbers added yet. Add a single number or paste multiple numbers above.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                  {manualRecipients.map((rec) => (
                    <div
                      key={rec.id}
                      className="inline-flex items-center space-x-1.5 bg-white border border-indigo-200 px-2.5 py-1 rounded-lg shadow-2xs text-xs group hover:border-indigo-400 transition"
                    >
                      <Phone className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span className="font-mono font-bold text-slate-800">
                        {rec.phone}
                      </span>
                      {rec.label && (
                        <span className="text-[10px] text-slate-500 font-normal border-l border-slate-200 pl-1.5 truncate max-w-[120px]">
                          {rec.label}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveManualRecipient(rec.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
                        title="Remove number"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            ENROLLED STUDENTS TABLE
            (Shown when audienceMode is STUDENTS or COMBINED)
           ======================================================== */}
        {(audienceMode === "STUDENTS" || audienceMode === "COMBINED") && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Enrolled Students Filter & Roster ({selectedStudentIds.length} of {filteredStudents.length} Selected)
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <AppButton
                  type="button"
                  size="small"
                  onClick={handleSelectAll}
                  variant="outline"
                >
                  Select All Valid
                </AppButton>
                <AppButton
                  type="button"
                  size="small"
                  onClick={handleDeselectAll}
                  variant="outline"
                  color="inherit"
                >
                  Deselect All
                </AppButton>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-200">
              <div>
                <SessionSelect
                  value={selectedSession}
                  onChange={(val) => setSelectedSession(val)}
                  label="Session:"
                  labelClassName="font-semibold text-slate-600 block mb-1"
                  selectClassName="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Class:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    setSelectedSectionId("");
                  }}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-800"
                >
                  <option value="">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Shift:</label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-800"
                >
                  <option value="">All Shifts</option>
                  <option value="MORNING">Morning</option>
                  <option value="DAY">Day</option>
                  {availableShifts.map((sh) => (
                    <option key={sh} value={sh}>
                      {sh}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Group:</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-800"
                >
                  <option value="ALL">All Groups</option>
                  <option value="Science">Science</option>
                  <option value="Humanities">Humanities</option>
                  <option value="Business Studies">Business Studies</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Section:</label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-800"
                >
                  <option value="">All Sections</option>
                  {availableSections.map((sec: any) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name} {sec.groupType ? `(${sec.groupType})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Search Student:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Name, Roll, Phone..."
                    className="w-full p-2 pr-7 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-800"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
                </div>
              </div>
            </div>

            <TableFilterBar showSearch={false}>
          <AppTable<any>
        embedded
              rows={filteredStudents}
              rowKey={(row) => row.id}
              defaultOrderBy="classRoll"
              minWidth={900}
              loading={loadingStudents}
              columns={[
                {
                  id: "select",
                  label: "",
                  sortable: false,
                  width: 48,
                  align: "center",
                  render: (st) => {
                    const hasPhone = Boolean(
                      st.student.guardianPhone && st.student.guardianPhone.trim().length >= 8
                    );
                    const isSelected = selectedStudentIds.includes(st.id);
                    return (
                      <input
                        type="checkbox"
                        disabled={!hasPhone}
                        checked={isSelected}
                        onChange={() => toggleSelectStudent(st.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-40"
                      />
                    );
                  },
                },
                {
                  id: "classRoll",
                  label: "Roll",
                  render: (st) => (
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      #{st.classRoll}
                    </Typography>
                  ),
                },
                {
                  id: "student",
                  label: "Student Name",
                  sortable: false,
                  render: (st) => (
                    <>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {st.student.firstName} {st.student.lastName}
                      </Typography>
                      {st.student.guardianName ? (
                        <Typography variant="caption" color="text.secondary">
                          C/O {st.student.guardianName}
                        </Typography>
                      ) : null}
                    </>
                  ),
                },
                {
                  id: "class",
                  label: "Class & Section",
                  sortable: false,
                  render: (st) => (
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                      {st.class?.name} • {st.section?.name}
                    </Typography>
                  ),
                },
                {
                  id: "phone",
                  label: "Guardian Phone",
                  sortable: false,
                  render: (st) => {
                    const hasPhone = Boolean(
                      st.student.guardianPhone && st.student.guardianPhone.trim().length >= 8
                    );
                    return hasPhone ? (
                      <span className="font-mono text-emerald-700 font-semibold flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>{st.student.guardianPhone}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-rose-600 text-[11px] font-semibold">
                        <AlertCircle className="w-3 h-3" />
                        <span>Missing Phone</span>
                      </span>
                    );
                  },
                },
                {
                  id: "preview",
                  label: "Rendered Message Preview",
                  sortable: false,
                  render: (st) => (
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: "monospace", color: "text.secondary", maxWidth: 360 }}
                      noWrap
                      title={renderMessageForStudent(st)}
                    >
                      {renderMessageForStudent(st)}
                    </Typography>
                  ),
                },
              ]}
            />
        </TableFilterBar>
          </div>
        )}
      </div>

      {/* Main Grid: Composer & Template Presets (Left) + Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Message Composer & Quick Presets */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preset Buttons */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                1-Click Quick Template Presets
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {TEMPLATE_PRESETS.map((tmpl) => (
                <AppButton
                  key={tmpl.id}
                  type="button"
                  onClick={() => setMessageTemplate(tmpl.text)}
                  variant="soft"
                  color="inherit"
                  fullWidth
                  sx={{ justifyContent: "flex-start", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 group-hover:bg-indigo-100 group-hover:text-indigo-800">
                      {tmpl.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                    {tmpl.title}
                  </h4>
                </AppButton>
              ))}
            </div>
          </div>

          {/* Composer Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Compose Custom Message Body
                </h3>
              </div>

              {/* Character and parts counter */}
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                  charStats.parts > 1 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                }`}>
                  {charStats.length} chars • {charStats.parts} SMS {charStats.parts > 1 ? "Parts" : "Part"}
                </span>
                <span className="text-slate-400 text-[10px]">
                  ({charStats.isUnicode ? "Unicode/Bangla: 70/sms" : "GSM: 160/sms"})
                </span>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              rows={5}
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              placeholder="Type your guardian announcement or custom notice here..."
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-sans text-xs sm:text-sm text-slate-800 resize-none leading-relaxed"
            />

            {/* Token Insertion Chips */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Click to Insert Dynamic Student / Guardian Tags:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tag: "{student_name}", desc: "Student Name" },
                  { tag: "{roll}", desc: "Roll Number" },
                  { tag: "{class}", desc: "Class Name" },
                  { tag: "{guardian_name}", desc: "Guardian Name" },
                  { tag: "{institution}", desc: "School Name" },
                  { tag: "{date}", desc: "Date" },
                ].map((item) => (
                  <AppButton
                    key={item.tag}
                    type="button"
                    size="small"
                    onClick={() => insertToken(item.tag)}
                    variant="soft"
                    color="inherit"
                    title={`Insert ${item.desc}`}
                  >
                    + {item.tag}
                  </AppButton>
                ))}
              </div>
            </div>

            {/* Gateway & Sender ID Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Sender Masking / Sender ID:
                </label>
                <input
                  type="text"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  placeholder="e.g. SMARTACAD"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  SMS Gateway Provider:
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="MOCK">Simulation (Mock Gateway / Test Mode)</option>
                  <option value="SSL_WIRELESS">SSL Wireless (Bangladesh)</option>
                  <option value="GREENWEB">Greenweb SMS Gateway</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Live Phone Preview & Dispatch Button */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Guardian SMS Preview
                </h3>
              </div>
              <AppButton
                type="button"
                onClick={handleCopySample}
                variant="link"
                startIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                title="Copy rendered text"
              >
                {copied ? "Copied" : "Copy"}
              </AppButton>
            </div>

            {/* Toggle Preview: Student vs Manual */}
            {manualRecipients.length > 0 && (
              <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-[11px] font-semibold">
                <AppButton
                  type="button"
                  size="small"
                  onClick={() => setPreviewMode("STUDENT")}
                  variant="soft"
                  color={previewMode === "STUDENT" ? "primary" : "inherit"}
                  fullWidth
                >
                  Student SMS View
                </AppButton>
                <AppButton
                  type="button"
                  size="small"
                  onClick={() => setPreviewMode("MANUAL")}
                  variant="soft"
                  color={previewMode === "MANUAL" ? "primary" : "inherit"}
                  fullWidth
                >
                  Manual Number View ({manualRecipients.length})
                </AppButton>
              </div>
            )}

            {/* Realistic Smartphone Screen Mockup */}
            <div className="bg-slate-900 p-3 rounded-2xl border-4 border-slate-700 shadow-lg max-w-sm mx-auto text-white">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2 px-1">
                <span>9:41 AM</span>
                <span className="font-bold text-slate-300">{senderId || "SMARTACAD"}</span>
                <span>LTE 100%</span>
              </div>

              <div className="bg-slate-800 rounded-xl p-3 min-h-[140px] flex flex-col justify-between">
                <div className="text-[11px] leading-relaxed text-slate-100 font-sans break-words">
                  {sampleRenderedText || (
                    <span className="text-slate-400 italic">Message preview will appear here...</span>
                  )}
                </div>
                <div className="text-[9px] text-slate-400 text-right mt-2 font-mono">
                  Delivered • {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 mt-2 truncate">
                Simulated for:{" "}
                <strong className="text-slate-200">
                  {previewMode === "MANUAL" && sampleManual
                    ? `${sampleManual.phone} ${sampleManual.label ? `(${sampleManual.label})` : ""}`
                    : sampleStudent
                    ? `${sampleStudent.student.firstName} (Roll: ${sampleStudent.classRoll})`
                    : sampleManual
                    ? sampleManual.phone
                    : "Sample Recipient"}
                </strong>
              </div>
            </div>

            {/* Dispatch Action Button */}
            <div className="pt-2">
              <AppButton
                type="button"
                onClick={handleDispatch}
                disabled={totalRecipientsCount === 0}
                loading={sending}
                fullWidth
                variant="contained"
                startIcon={<Send className="w-4 h-4" />}
              >
                {sending
                  ? "Dispatching Batch SMS..."
                  : `Dispatch SMS to ${totalRecipientsCount} Recipient(s)`}
              </AppButton>
              <div className="text-[11px] text-slate-500 text-center mt-2 space-y-0.5">
                {audienceMode === "COMBINED" ? (
                  <span>
                    ({selectedStudentIds.length} Student Guardians + {manualRecipients.length} Manual Numbers)
                  </span>
                ) : audienceMode === "STUDENTS" ? (
                  <span>({selectedStudentIds.length} Enrolled Student Guardians)</span>
                ) : (
                  <span>({manualRecipients.length} Direct Manual Phone Numbers)</span>
                )}
                <div className="text-[10px] text-slate-400">
                  Direct SMS gateway integration with delivery audit receipts.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

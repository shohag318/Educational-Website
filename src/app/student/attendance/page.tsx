"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Users,
  Calendar,
  Filter,
  Download,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  Save,
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  RefreshCw,
  Printer,
  Sparkles,
  CalendarDays,
  CalendarRange,
  Layers,
  FileSpreadsheet,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Info,
  Zap,
  Eye,
  Settings2,
  PlusCircle,
  HelpCircle,
  MessageSquare,
  History,
  Radio,
  FileText,
  Trash2,
  Phone,
} from "lucide-react";
import * as XLSX from "xlsx";
import { StudentNavHeader } from "../StudentNavHeader";
import { SessionSelect } from "@/components/SessionSelect";
import { getScopedStorageKey, getActiveTenantCode, TENANT_SWITCH_EVENT } from "@/lib/clientTenant";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
type ViewMode = "daily" | "monthly" | "range";

type SmsCampaignType =
  | "DAILY_ABSENT"
  | "DAILY_LATE"
  | "DAILY_CONFIRM"
  | "MONTHLY_SUMMARY"
  | "MONTHLY_LOW_ALERT"
  | "RANGE_SUMMARY"
  | "CUSTOM_NOTICE";

interface StudentRecord {
  id: string;
  classRoll: number;
  groupType: string;
  student: {
    id: string;
    studentIdNo: string;
    firstName: string;
    lastName: string;
    gender?: string;
    guardianName: string;
    guardianPhone: string;
    customFields?: string;
  };
  class: {
    id: string;
    name: string;
  };
  section: {
    id: string;
    name: string;
    shift: string;
    groupType: string;
  };
}

interface AttendanceEntry {
  status: AttendanceStatus;
  remarks: string;
  updatedAt?: string;
}

interface SmsHistoryItem {
  id: string;
  timestamp: string;
  campaignType: SmsCampaignType;
  className: string;
  sectionName: string;
  recipientCount: number;
  sampleMessage: string;
  provider: string;
  senderId: string;
  status: string;
  recipients: {
    studentName: string;
    roll: number;
    phone: string;
    status: string;
    response: string;
  }[];
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const SMS_DEFAULT_TEMPLATES: Record<SmsCampaignType, string> = {
  DAILY_ABSENT:
    "Dear Guardian, your ward {student_name} (Roll: {roll}) is marked ABSENT on {date} at Dhaka Ideal High School. Please contact school office if unexpected.",
  DAILY_LATE:
    "Dear Guardian, your ward {student_name} (Roll: {roll}) arrived LATE at school on {date}. School reporting time is 8:00 AM. - Dhaka Ideal High School",
  DAILY_CONFIRM:
    "Dear Guardian, your ward {student_name} (Roll: {roll}) is marked PRESENT on {date} at Dhaka Ideal High School.",
  MONTHLY_SUMMARY:
    "Dear Guardian, in {month} {year}, {student_name} (Roll: {roll}) was Present: {present_days} days, Absent: {absent_days} days. Total Attendance: {attendance_rate}%. - Dhaka Ideal High School",
  MONTHLY_LOW_ALERT:
    "URGENT NOTICE: Guardian of {student_name} (Roll: {roll}), your ward's attendance for {month} is critically low at {attendance_rate}% ({absent_days} days absent). Please visit school office immediately.",
  RANGE_SUMMARY:
    "Dear Guardian, attendance report for {student_name} (Roll: {roll}) from {date} to {end_date}: Present: {present_days}d, Absent: {absent_days}d ({attendance_rate}%). - Dhaka Ideal High School",
  CUSTOM_NOTICE:
    "Dear Guardian of {student_name} (Roll: {roll}), this is an important notification regarding your ward from Dhaka Ideal High School.",
};

// Date helper routines
const formatYMD = (year: number, month: number, day: number): string => {
  const y = String(year);
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const toDateStr = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getDayOfWeek = (dateStr: string): number => {
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay();
};

const getDatesInRange = (startStr: string, endStr: string): string[] => {
  const dates: string[] = [];
  if (!startStr || !endStr) return dates;
  const start = new Date(startStr + "T00:00:00");
  const end = new Date(endStr + "T00:00:00");
  if (start > end) return dates;
  const curr = new Date(start);
  while (curr <= end) {
    dates.push(toDateStr(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

// Storage routines
const getStorageKey = (classId: string, sectionId: string, dateStr: string): string => {
  const code = getActiveTenantCode();
  return `attendance_register_${code}_${classId}_${sectionId || "all"}_${dateStr}`;
};

const loadRegisterForDate = (
  classId: string,
  sectionId: string,
  dateStr: string
): Record<string, AttendanceEntry> => {
  if (typeof window === "undefined" || !classId) return {};
  const primaryKey = getStorageKey(classId, sectionId, dateStr);
  const saved = localStorage.getItem(primaryKey);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  if (sectionId) {
    const fallbackKey = getStorageKey(classId, "", dateStr);
    const fallbackSaved = localStorage.getItem(fallbackKey);
    if (fallbackSaved) {
      try {
        return JSON.parse(fallbackSaved);
      } catch (e) {}
    }
  }
  return {};
};

const saveRegisterForDate = (
  classId: string,
  sectionId: string,
  dateStr: string,
  data: Record<string, AttendanceEntry>
) => {
  if (typeof window === "undefined" || !classId) return;
  const key = getStorageKey(classId, sectionId, dateStr);
  localStorage.setItem(key, JSON.stringify(data));
};

export default function StudentAttendancePage() {
  const [selectedSession, setSelectedSession] = useState<string>("ALL");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedShift, setSelectedShift] = useState<string>("ALL");
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Mode: daily | monthly | range
  const [viewMode, setViewMode] = useState<ViewMode>("daily");

  // Daily Mode: Attendance Date
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toDateStr(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Monthly Mode: Month & Year
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);

  // Range Mode: Start Date & End Date
  const [rangeStartDate, setRangeStartDate] = useState<string>(
    formatYMD(today.getFullYear(), today.getMonth() + 1, 1)
  );
  const [rangeEndDate, setRangeEndDate] = useState<string>(todayStr);
  const [rangeStatus, setRangeStatus] = useState<AttendanceStatus>("PRESENT");
  const [rangeExcludeFriday, setRangeExcludeFriday] = useState<boolean>(true);
  const [rangeExcludeSaturday, setRangeExcludeSaturday] = useState<boolean>(false);
  const [rangeExcludeSunday, setRangeExcludeSunday] = useState<boolean>(false);
  const [rangeOverwrite, setRangeOverwrite] = useState<boolean>(false);
  const [rangeRemarks, setRangeRemarks] = useState<string>("Regular session");
  const [rangeScope, setRangeScope] = useState<"ALL" | "SELECTED">("ALL");
  const [selectedStudentIdsForRange, setSelectedStudentIdsForRange] = useState<string[]>([]);
  const [showStudentPickerModal, setShowStudentPickerModal] = useState<boolean>(false);

  // Student Roster
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Daily Attendance map
  const [attendance, setAttendance] = useState<Record<string, AttendanceEntry>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Monthly Attendance data: dateStr -> studentId -> AttendanceEntry
  const [monthlyData, setMonthlyData] = useState<Record<string, Record<string, AttendanceEntry>>>({});
  const [monthlyLoading, setMonthlyLoading] = useState<boolean>(false);

  // Range Attendance Data Cache: dateStr -> studentId -> AttendanceEntry
  const [rangeData, setRangeData] = useState<Record<string, Record<string, AttendanceEntry>>>({});
  const [rangeLoading, setRangeLoading] = useState<boolean>(false);

  // Student Detail Timeline Modal
  const [timelineStudent, setTimelineStudent] = useState<StudentRecord | null>(null);

  // ==========================================
  // SMS SYSTEM STATE
  // ==========================================
  const [smsModalOpen, setSmsModalOpen] = useState<boolean>(false);
  const [smsActiveTab, setSmsActiveTab] = useState<"compose" | "history" | "settings">("compose");
  const [smsCampaignType, setSmsCampaignType] = useState<SmsCampaignType>("DAILY_ABSENT");
  const [smsTemplate, setSmsTemplate] = useState<string>(SMS_DEFAULT_TEMPLATES.DAILY_ABSENT);
  const [smsRecipientScope, setSmsRecipientScope] = useState<
    "ABSENT" | "LATE" | "PRESENT" | "LOW_ATTENDANCE" | "ALL" | "CUSTOM"
  >("ABSENT");
  const [selectedSmsStudentIds, setSelectedSmsStudentIds] = useState<string[]>([]);
  const [smsSearchQuery, setSmsSearchQuery] = useState<string>("");
  const [smsProvider, setSmsProvider] = useState<"MOCK" | "SSL_WIRELESS" | "GREENWEB">("MOCK");
  const [smsSenderId, setSmsSenderId] = useState<string>("DHAKA_IDEAL");
  const [smsApiKey, setSmsApiKey] = useState<string>("");
  const [smsSending, setSmsSending] = useState<boolean>(false);
  const [smsHistory, setSmsHistory] = useState<SmsHistoryItem[]>([]);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load classes
  useEffect(() => {
    const loadTenantClasses = () => {
      fetch("/api/classes")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && data.data.length > 0) {
            setClasses(data.data);
            setSelectedClassId(data.data[0].id);
          } else {
            setClasses([]);
            setSelectedClassId("");
          }
        })
        .catch((err) => console.error("Error fetching classes:", err));
    };

    const loadTenantSmsSettings = (targetCode?: string) => {
      if (typeof window === "undefined") return;
      const code = targetCode || getActiveTenantCode();
      const histKey = getScopedStorageKey("sms_attendance_logs", code);
      const provKey = getScopedStorageKey("sms_attendance_provider", code);
      const sendKey = getScopedStorageKey("sms_attendance_sender_id", code);
      const apiKKey = getScopedStorageKey("sms_attendance_api_key", code);

      const savedHistory = localStorage.getItem(histKey) || (code === "108254" ? localStorage.getItem("sms_attendance_logs") : null);
      if (savedHistory) {
        try {
          setSmsHistory(JSON.parse(savedHistory));
        } catch (e) {
          setSmsHistory([]);
        }
      } else {
        setSmsHistory([]);
      }
      const savedProvider = localStorage.getItem(provKey) || (code === "108254" ? localStorage.getItem("sms_attendance_provider") : null);
      if (savedProvider) setSmsProvider(savedProvider as any);
      else setSmsProvider("MOCK");

      const savedSenderId = localStorage.getItem(sendKey) || (code === "108254" ? localStorage.getItem("sms_attendance_sender_id") : null);
      if (savedSenderId) setSmsSenderId(savedSenderId);
      else setSmsSenderId("8809612000000");

      const savedApiKey = localStorage.getItem(apiKKey) || (code === "108254" ? localStorage.getItem("sms_attendance_api_key") : null);
      if (savedApiKey) setSmsApiKey(savedApiKey);
      else setSmsApiKey("");
    };

    loadTenantClasses();
    loadTenantSmsSettings();

    const handleTenantSwitch = (e: any) => {
      const code = e?.detail?.code;
      loadTenantClasses();
      loadTenantSmsSettings(code);
    };

    window.addEventListener(TENANT_SWITCH_EVENT, handleTenantSwitch);
    return () => {
      window.removeEventListener(TENANT_SWITCH_EVENT, handleTenantSwitch);
    };
  }, []);

  const currentSections = useMemo(() => {
    const cls = classes.find((c: any) => c.id === selectedClassId);
    return cls?.sections || [];
  }, [classes, selectedClassId]);

  useEffect(() => {
    if (currentSections.length > 0) {
      setSelectedSectionId(currentSections[0].id);
    } else {
      setSelectedSectionId("");
    }
  }, [currentSections]);

  // Load students
  useEffect(() => {
    if (!selectedClassId) return;

    setLoading(true);
    const params = new URLSearchParams();
    if (selectedSession && selectedSession !== "ALL") params.set("session", selectedSession);
    params.set("classId", selectedClassId);
    if (selectedSectionId) params.set("sectionId", selectedSectionId);
    if (selectedShift && selectedShift !== "ALL") params.set("shift", selectedShift);
    if (selectedGroup && selectedGroup !== "ALL") params.set("groupType", selectedGroup);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());

    fetch(`/api/students?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setStudents(data.data);
          setSelectedStudentIdsForRange(data.data.map((s: StudentRecord) => s.id));
        } else {
          setStudents([]);
          setSelectedStudentIdsForRange([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching students:", err);
        setStudents([]);
        setSelectedStudentIdsForRange([]);
      })
      .finally(() => setLoading(false));
  }, [selectedSession, selectedClassId, selectedSectionId, selectedShift, selectedGroup, searchQuery]);

  // Load Daily Attendance
  useEffect(() => {
    if (students.length === 0 || !selectedClassId) return;

    const saved = loadRegisterForDate(selectedClassId, selectedSectionId, selectedDate);
    if (Object.keys(saved).length > 0) {
      setAttendance(saved);
      setHasUnsavedChanges(false);
      return;
    }

    const initial: Record<string, AttendanceEntry> = {};
    students.forEach((s) => {
      initial[s.id] = { status: "PRESENT", remarks: "" };
    });
    setAttendance(initial);
    setHasUnsavedChanges(false);
  }, [students, selectedClassId, selectedSectionId, selectedDate]);

  // Load Monthly Attendance
  const loadMonthData = useCallback(() => {
    if (!selectedClassId) return;
    setMonthlyLoading(true);
    const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();
    const map: Record<string, Record<string, AttendanceEntry>> = {};

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = formatYMD(selectedYear, selectedMonth, day);
      const saved = loadRegisterForDate(selectedClassId, selectedSectionId, dateStr);
      if (Object.keys(saved).length > 0) {
        map[dateStr] = saved;
      }
    }

    setMonthlyData(map);
    setMonthlyLoading(false);
  }, [selectedClassId, selectedSectionId, selectedYear, selectedMonth]);

  useEffect(() => {
    if (viewMode === "monthly") {
      loadMonthData();
    }
  }, [viewMode, loadMonthData]);

  // Load Range Attendance
  const loadRangeReportData = useCallback(() => {
    if (!selectedClassId || !rangeStartDate || !rangeEndDate) return;
    setRangeLoading(true);
    const dates = getDatesInRange(rangeStartDate, rangeEndDate);
    const map: Record<string, Record<string, AttendanceEntry>> = {};

    dates.forEach((dateStr) => {
      const saved = loadRegisterForDate(selectedClassId, selectedSectionId, dateStr);
      if (Object.keys(saved).length > 0) {
        map[dateStr] = saved;
      }
    });

    setRangeData(map);
    setRangeLoading(false);
  }, [selectedClassId, selectedSectionId, rangeStartDate, rangeEndDate]);

  useEffect(() => {
    if (viewMode === "range") {
      loadRangeReportData();
    }
  }, [viewMode, loadRangeReportData]);

  // Daily handlers
  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { remarks: "" }),
        status,
        updatedAt: new Date().toISOString(),
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSetRemarks = (studentId: string, remarks: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: "PRESENT" }),
        remarks,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceEntry> = {};
    students.forEach((s) => {
      updated[s.id] = {
        status,
        remarks: attendance[s.id]?.remarks || "",
        updatedAt: new Date().toISOString(),
      };
    });
    setAttendance(updated);
    setHasUnsavedChanges(true);
    showToast(`Marked all ${students.length} students as ${status}`, "info");
  };

  const handleSaveAttendance = () => {
    try {
      saveRegisterForDate(selectedClassId, selectedSectionId, selectedDate, attendance);
      setHasUnsavedChanges(false);
      showToast("Attendance register saved successfully!", "success");
    } catch (e) {
      showToast("Failed to save attendance record", "error");
    }
  };

  const totalCount = students.length;
  const presentCount = useMemo(() => {
    return students.filter((s) => attendance[s.id]?.status === "PRESENT").length;
  }, [students, attendance]);

  const absentCount = useMemo(() => {
    return students.filter((s) => attendance[s.id]?.status === "ABSENT").length;
  }, [students, attendance]);

  const lateCount = useMemo(() => {
    return students.filter((s) => attendance[s.id]?.status === "LATE").length;
  }, [students, attendance]);

  const excusedCount = useMemo(() => {
    return students.filter((s) => attendance[s.id]?.status === "EXCUSED").length;
  }, [students, attendance]);

  const attendanceRate = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : "0.0";

  const absentStudents = useMemo(() => {
    return students.filter((s) => attendance[s.id]?.status === "ABSENT");
  }, [students, attendance]);

  const lateStudents = useMemo(() => {
    return students.filter((s) => attendance[s.id]?.status === "LATE");
  }, [students, attendance]);

  const handleDateShift = (delta: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(toDateStr(d));
  };

  // Monthly Computations
  const daysInCurrentMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const monthDayList = useMemo(() => {
    const list: { day: number; dateStr: string; dayOfWeek: number; dayName: string; isFriday: boolean }[] = [];
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = formatYMD(selectedYear, selectedMonth, d);
      const dow = getDayOfWeek(dateStr);
      list.push({
        day: d,
        dateStr,
        dayOfWeek: dow,
        dayName: DAY_NAMES_SHORT[dow],
        isFriday: dow === 5,
      });
    }
    return list;
  }, [selectedYear, selectedMonth, daysInCurrentMonth]);

  const handleToggleMonthlyCell = (studentId: string, dateStr: string) => {
    setMonthlyData((prev) => {
      const dayRecords = { ...(prev[dateStr] || {}) };
      const current = dayRecords[studentId]?.status;

      let nextStatus: AttendanceStatus | null = "PRESENT";
      if (!current) {
        nextStatus = "PRESENT";
      } else if (current === "PRESENT") {
        nextStatus = "ABSENT";
      } else if (current === "ABSENT") {
        nextStatus = "LATE";
      } else if (current === "LATE") {
        nextStatus = "EXCUSED";
      } else if (current === "EXCUSED") {
        nextStatus = null;
      }

      if (nextStatus) {
        dayRecords[studentId] = {
          status: nextStatus,
          remarks: dayRecords[studentId]?.remarks || "",
          updatedAt: new Date().toISOString(),
        };
      } else {
        delete dayRecords[studentId];
      }

      return {
        ...prev,
        [dateStr]: dayRecords,
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleSaveMonthlyRegister = () => {
    try {
      Object.entries(monthlyData).forEach(([dateStr, records]) => {
        saveRegisterForDate(selectedClassId, selectedSectionId, dateStr, records);
      });
      setHasUnsavedChanges(false);
      showToast(
        `Monthly attendance register for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} saved!`,
        "success"
      );
    } catch (e) {
      showToast("Failed to save monthly records", "error");
    }
  };

  const handleAutoFillMonth = () => {
    const newMonthlyData = { ...monthlyData };
    let filledDays = 0;

    monthDayList.forEach(({ dateStr, isFriday }) => {
      if (isFriday) return;

      const dayRecords = { ...(newMonthlyData[dateStr] || {}) };
      students.forEach((st) => {
        if (!dayRecords[st.id]?.status) {
          dayRecords[st.id] = {
            status: "PRESENT",
            remarks: "Auto-fill",
            updatedAt: new Date().toISOString(),
          };
        }
      });
      newMonthlyData[dateStr] = dayRecords;
      saveRegisterForDate(selectedClassId, selectedSectionId, dateStr, dayRecords);
      filledDays++;
    });

    setMonthlyData(newMonthlyData);
    setHasUnsavedChanges(false);
    showToast(
      `Auto-filled ${filledDays} working days in ${MONTH_NAMES[selectedMonth - 1]} as Present!`,
      "success"
    );
  };

  const monthlyStudentStats = useMemo(() => {
    return students.map((st) => {
      let p = 0,
        a = 0,
        l = 0,
        e = 0;
      monthDayList.forEach(({ dateStr }) => {
        const status = monthlyData[dateStr]?.[st.id]?.status;
        if (status === "PRESENT") p++;
        else if (status === "ABSENT") a++;
        else if (status === "LATE") l++;
        else if (status === "EXCUSED") e++;
      });
      const totalMarked = p + a + l + e;
      const rate = totalMarked > 0 ? ((p / totalMarked) * 100).toFixed(1) : "0.0";
      return {
        student: st,
        present: p,
        absent: a,
        late: l,
        excused: e,
        totalMarked,
        rate: parseFloat(rate),
      };
    });
  }, [students, monthDayList, monthlyData]);

  const monthlyOverallMetrics = useMemo(() => {
    const recordedDays = monthDayList.filter(
      (m) => monthlyData[m.dateStr] && Object.keys(monthlyData[m.dateStr]).length > 0
    ).length;

    let totalPossibleMarks = 0;
    let totalPresents = 0;
    monthlyStudentStats.forEach((s) => {
      totalPossibleMarks += s.totalMarked;
      totalPresents += s.present;
    });

    const classAverageRate =
      totalPossibleMarks > 0 ? ((totalPresents / totalPossibleMarks) * 100).toFixed(1) : "0.0";

    const perfectCount = monthlyStudentStats.filter((s) => s.totalMarked > 0 && s.rate >= 95).length;

    return {
      recordedDays,
      totalWorkingDays: monthDayList.filter((m) => !m.isFriday).length,
      classAverageRate,
      perfectCount,
    };
  }, [monthDayList, monthlyData, monthlyStudentStats]);

  // Range Computations
  const rangeDatesList = useMemo(() => {
    return getDatesInRange(rangeStartDate, rangeEndDate);
  }, [rangeStartDate, rangeEndDate]);

  const rangeValidWorkingDates = useMemo(() => {
    return rangeDatesList.filter((dateStr) => {
      const dow = getDayOfWeek(dateStr);
      if (rangeExcludeFriday && dow === 5) return false;
      if (rangeExcludeSaturday && dow === 6) return false;
      if (rangeExcludeSunday && dow === 0) return false;
      return true;
    });
  }, [rangeDatesList, rangeExcludeFriday, rangeExcludeSaturday, rangeExcludeSunday]);

  const targetStudentsForRange = useMemo(() => {
    if (rangeScope === "ALL") return students;
    return students.filter((s) => selectedStudentIdsForRange.includes(s.id));
  }, [rangeScope, students, selectedStudentIdsForRange]);

  const handleApplyRangeAttendance = () => {
    if (rangeValidWorkingDates.length === 0) {
      showToast("No valid working days selected in this date range.", "error");
      return;
    }
    if (targetStudentsForRange.length === 0) {
      showToast("No students selected for range attendance.", "error");
      return;
    }

    let recordsCreated = 0;
    rangeValidWorkingDates.forEach((dateStr) => {
      const currentDay = loadRegisterForDate(selectedClassId, selectedSectionId, dateStr);
      targetStudentsForRange.forEach((st) => {
        const alreadyExists = !!currentDay[st.id]?.status;
        if (!alreadyExists || rangeOverwrite) {
          currentDay[st.id] = {
            status: rangeStatus,
            remarks: rangeRemarks || `Range generated: ${rangeStatus}`,
            updatedAt: new Date().toISOString(),
          };
          recordsCreated++;
        }
      });
      saveRegisterForDate(selectedClassId, selectedSectionId, dateStr, currentDay);
    });

    loadRangeReportData();
    if (selectedDate >= rangeStartDate && selectedDate <= rangeEndDate) {
      setAttendance(loadRegisterForDate(selectedClassId, selectedSectionId, selectedDate));
    }
    if (viewMode === "monthly") {
      loadMonthData();
    }

    showToast(
      `Successfully generated ${recordsCreated} attendance entries across ${rangeValidWorkingDates.length} working days!`,
      "success"
    );
  };

  const rangeStudentStats = useMemo(() => {
    return students.map((st) => {
      let p = 0,
        a = 0,
        l = 0,
        e = 0;
      rangeDatesList.forEach((dateStr) => {
        const status = rangeData[dateStr]?.[st.id]?.status;
        if (status === "PRESENT") p++;
        else if (status === "ABSENT") a++;
        else if (status === "LATE") l++;
        else if (status === "EXCUSED") e++;
      });
      const totalMarked = p + a + l + e;
      const rate = totalMarked > 0 ? ((p / totalMarked) * 100).toFixed(1) : "0.0";
      const rateNum = parseFloat(rate);

      let category = "Not Marked";
      let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
      if (totalMarked > 0) {
        if (rateNum >= 90) {
          category = "Excellent (≥90%)";
          badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
        } else if (rateNum >= 75) {
          category = "Regular (75-89%)";
          badgeColor = "bg-sky-50 text-sky-700 border-sky-200";
        } else if (rateNum >= 60) {
          category = "Needs Attention (60-74%)";
          badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
        } else {
          category = "Critical (<60%)";
          badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
        }
      }

      return {
        student: st,
        present: p,
        absent: a,
        late: l,
        excused: e,
        totalMarked,
        rate: rateNum,
        category,
        badgeColor,
      };
    });
  }, [students, rangeDatesList, rangeData]);

  const rangeOverallMetrics = useMemo(() => {
    let totalEvaluated = 0;
    let totalPresents = 0;
    rangeStudentStats.forEach((s) => {
      totalEvaluated += s.totalMarked;
      totalPresents += s.present;
    });
    const avgRate = totalEvaluated > 0 ? ((totalPresents / totalEvaluated) * 100).toFixed(1) : "0.0";
    const highAttendanceCount = rangeStudentStats.filter((s) => s.totalMarked > 0 && s.rate >= 90).length;
    const atRiskCount = rangeStudentStats.filter((s) => s.totalMarked > 0 && s.rate < 60).length;

    return {
      avgRate,
      highAttendanceCount,
      atRiskCount,
      totalDates: rangeDatesList.length,
    };
  }, [rangeStudentStats, rangeDatesList]);

  // Excel exports
  const handleExportMonthlyExcel = () => {
    const dayCols: string[] = [];
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      dayCols.push(String(d));
    }

    const header = [
      "Roll",
      "Student ID",
      "Student Name",
      "Section",
      "Group",
      "Guardian Phone",
      ...dayCols,
      "Present (P)",
      "Absent (A)",
      "Late (L)",
      "Excused (E)",
      "Total Marked Days",
      "Attendance Rate (%)",
    ];

    const dataRows = students.map((st) => {
      let p = 0,
        a = 0,
        l = 0,
        e = 0;
      const dailyStatuses: string[] = [];

      for (let day = 1; day <= daysInCurrentMonth; day++) {
        const dateStr = formatYMD(selectedYear, selectedMonth, day);
        const status = monthlyData[dateStr]?.[st.id]?.status;
        if (status === "PRESENT") {
          p++;
          dailyStatuses.push("P");
        } else if (status === "ABSENT") {
          a++;
          dailyStatuses.push("A");
        } else if (status === "LATE") {
          l++;
          dailyStatuses.push("L");
        } else if (status === "EXCUSED") {
          e++;
          dailyStatuses.push("E");
        } else {
          const dow = getDayOfWeek(dateStr);
          dailyStatuses.push(dow === 5 ? "FRI" : "-");
        }
      }

      const totalMarked = p + a + l + e;
      const pct = totalMarked > 0 ? ((p / totalMarked) * 100).toFixed(1) + "%" : "0.0%";

      return [
        st.classRoll,
        st.student.studentIdNo,
        `${st.student.firstName} ${st.student.lastName}`,
        st.section?.name || "",
        st.groupType,
        st.student.guardianPhone || "",
        ...dailyStatuses,
        p,
        a,
        l,
        e,
        totalMarked,
        pct,
      ];
    });

    const clsName = classes.find((c: any) => c.id === selectedClassId)?.name || "Class";
    const secName = currentSections.find((s: any) => s.id === selectedSectionId)?.name || "All Sections";

    const ws = XLSX.utils.aoa_to_sheet([
      ["Dhaka Ideal Model High School & College"],
      [`Monthly Attendance Register: ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`],
      [`Class: ${clsName} | Section: ${secName}`],
      [],
      header,
      ...dataRows,
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Attendance");
    XLSX.writeFile(wb, `Monthly_Attendance_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.xlsx`);
    showToast("Monthly attendance exported to Excel!", "success");
  };

  const handleExportRangeExcel = () => {
    const header = [
      "Roll",
      "Student ID",
      "Student Name",
      "Section",
      "Group",
      "Guardian Contact",
      "Present Days",
      "Absent Days",
      "Late Days",
      "Excused Days",
      "Total Marked Days",
      "Attendance %",
      "Category Status",
    ];

    const dataRows = rangeStudentStats.map((item) => [
      item.student.classRoll,
      item.student.student.studentIdNo,
      `${item.student.student.firstName} ${item.student.student.lastName}`,
      item.student.section?.name || "",
      item.student.groupType,
      item.student.student.guardianPhone || "N/A",
      item.present,
      item.absent,
      item.late,
      item.excused,
      item.totalMarked,
      `${item.rate}%`,
      item.category,
    ]);

    const clsName = classes.find((c: any) => c.id === selectedClassId)?.name || "Class";
    const secName = currentSections.find((s: any) => s.id === selectedSectionId)?.name || "All Sections";

    const ws = XLSX.utils.aoa_to_sheet([
      ["Dhaka Ideal Model High School & College"],
      [`Attendance Range Report: ${rangeStartDate} to ${rangeEndDate}`],
      [`Class: ${clsName} | Section: ${secName}`],
      [],
      header,
      ...dataRows,
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Range Attendance");
    XLSX.writeFile(wb, `Attendance_Range_${rangeStartDate}_to_${rangeEndDate}.xlsx`);
    showToast("Range attendance exported to Excel!", "success");
  };

  // ==========================================
  // SMS SYSTEM HELPER FUNCTIONS & DISPATCH
  // ==========================================
  const handleOpenSmsModal = (
    type: SmsCampaignType = "DAILY_ABSENT",
    directStudentId?: string
  ) => {
    setSmsCampaignType(type);
    setSmsTemplate(SMS_DEFAULT_TEMPLATES[type] || SMS_DEFAULT_TEMPLATES.DAILY_ABSENT);
    setSmsActiveTab("compose");

    if (directStudentId) {
      setSelectedSmsStudentIds([directStudentId]);
      setSmsRecipientScope("CUSTOM");
    } else {
      if (type === "DAILY_ABSENT") {
        setSmsRecipientScope("ABSENT");
        setSelectedSmsStudentIds(absentStudents.map((s) => s.id));
      } else if (type === "DAILY_LATE") {
        setSmsRecipientScope("LATE");
        setSelectedSmsStudentIds(lateStudents.map((s) => s.id));
      } else if (type === "DAILY_CONFIRM") {
        setSmsRecipientScope("PRESENT");
        setSelectedSmsStudentIds(
          students.filter((s) => attendance[s.id]?.status === "PRESENT").map((s) => s.id)
        );
      } else if (type === "MONTHLY_LOW_ALERT") {
        setSmsRecipientScope("LOW_ATTENDANCE");
        setSelectedSmsStudentIds(
          monthlyStudentStats.filter((s) => s.totalMarked > 0 && s.rate < 75).map((s) => s.student.id)
        );
      } else {
        setSmsRecipientScope("ALL");
        setSelectedSmsStudentIds(students.map((s) => s.id));
      }
    }
    setSmsModalOpen(true);
  };

  // Switch campaign type within modal
  const handleCampaignTypeChange = (newType: SmsCampaignType) => {
    setSmsCampaignType(newType);
    setSmsTemplate(SMS_DEFAULT_TEMPLATES[newType] || SMS_DEFAULT_TEMPLATES.DAILY_ABSENT);

    if (newType === "DAILY_ABSENT") {
      setSmsRecipientScope("ABSENT");
      setSelectedSmsStudentIds(absentStudents.map((s) => s.id));
    } else if (newType === "DAILY_LATE") {
      setSmsRecipientScope("LATE");
      setSelectedSmsStudentIds(lateStudents.map((s) => s.id));
    } else if (newType === "DAILY_CONFIRM") {
      setSmsRecipientScope("PRESENT");
      setSelectedSmsStudentIds(
        students.filter((s) => attendance[s.id]?.status === "PRESENT").map((s) => s.id)
      );
    } else if (newType === "MONTHLY_LOW_ALERT") {
      setSmsRecipientScope("LOW_ATTENDANCE");
      setSelectedSmsStudentIds(
        monthlyStudentStats.filter((s) => s.totalMarked > 0 && s.rate < 75).map((s) => s.student.id)
      );
    } else {
      setSmsRecipientScope("ALL");
      setSelectedSmsStudentIds(students.map((s) => s.id));
    }
  };

  // Recipient scope quick pills
  const handleScopeChange = (scope: "ABSENT" | "LATE" | "PRESENT" | "LOW_ATTENDANCE" | "ALL") => {
    setSmsRecipientScope(scope);
    if (scope === "ABSENT") {
      setSelectedSmsStudentIds(absentStudents.map((s) => s.id));
    } else if (scope === "LATE") {
      setSelectedSmsStudentIds(lateStudents.map((s) => s.id));
    } else if (scope === "PRESENT") {
      setSelectedSmsStudentIds(
        students.filter((s) => attendance[s.id]?.status === "PRESENT").map((s) => s.id)
      );
    } else if (scope === "LOW_ATTENDANCE") {
      setSelectedSmsStudentIds(
        monthlyStudentStats.filter((s) => s.totalMarked > 0 && s.rate < 75).map((s) => s.student.id)
      );
    } else if (scope === "ALL") {
      setSelectedSmsStudentIds(students.map((s) => s.id));
    }
  };

  // Filtered student list in modal
  const modalTargetStudents = useMemo(() => {
    return students.filter((st) => {
      if (!smsSearchQuery.trim()) return true;
      const q = smsSearchQuery.toLowerCase();
      return (
        st.student.firstName.toLowerCase().includes(q) ||
        st.student.lastName.toLowerCase().includes(q) ||
        String(st.classRoll).includes(q) ||
        st.student.studentIdNo.toLowerCase().includes(q) ||
        (st.student.guardianPhone && st.student.guardianPhone.includes(q))
      );
    });
  }, [students, smsSearchQuery]);

  // Render SMS message for a specific student
  const renderStudentMessage = (st: StudentRecord, tpl: string): string => {
    const clsName = classes.find((c: any) => c.id === selectedClassId)?.name || "Class";
    const secName = st.section?.name || currentSections.find((s: any) => s.id === selectedSectionId)?.name || "Section";
    const dailyEntry = attendance[st.id] || { status: "PRESENT", remarks: "" };
    const monthStat = monthlyStudentStats.find((m) => m.student.id === st.id) || {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      totalMarked: 0,
      rate: 0,
    };
    const rangeStat = rangeStudentStats.find((r) => r.student.id === st.id) || {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      totalMarked: 0,
      rate: 0,
    };

    let presentDays = viewMode === "range" ? rangeStat.present : monthStat.present;
    let absentDays = viewMode === "range" ? rangeStat.absent : monthStat.absent;
    let rate = viewMode === "range" ? rangeStat.rate : monthStat.rate;

    return tpl
      .replace(/{student_name}/g, `${st.student.firstName} ${st.student.lastName}`)
      .replace(/{roll}/g, String(st.classRoll))
      .replace(/{class}/g, clsName)
      .replace(/{section}/g, secName)
      .replace(/{date}/g, selectedDate)
      .replace(/{end_date}/g, rangeEndDate)
      .replace(/{month}/g, MONTH_NAMES[selectedMonth - 1])
      .replace(/{year}/g, String(selectedYear))
      .replace(/{status}/g, dailyEntry.status)
      .replace(/{present_days}/g, String(presentDays))
      .replace(/{absent_days}/g, String(absentDays))
      .replace(/{attendance_rate}/g, `${rate}%`)
      .replace(/{institution}/g, "Dhaka Ideal High School");
  };

  // Sample rendered preview
  const previewStudent = useMemo(() => {
    const firstSelected = students.find((s) => selectedSmsStudentIds.includes(s.id));
    return firstSelected || students[0] || null;
  }, [students, selectedSmsStudentIds]);

  const previewMessageText = useMemo(() => {
    if (!previewStudent) return "No student selected for preview.";
    return renderStudentMessage(previewStudent, smsTemplate);
  }, [previewStudent, smsTemplate, selectedClassId, selectedSectionId, selectedDate, selectedMonth, selectedYear, attendance, monthlyStudentStats, rangeStudentStats, viewMode]);

  // Dispatch batch SMS
  const handleDispatchSmsBatch = async () => {
    const targetStudents = students.filter((s) => selectedSmsStudentIds.includes(s.id));
    if (targetStudents.length === 0) {
      showToast("Please select at least one student recipient.", "error");
      return;
    }

    setSmsSending(true);
    try {
      const clsName = classes.find((c: any) => c.id === selectedClassId)?.name || "Class";
      const secName = currentSections.find((s: any) => s.id === selectedSectionId)?.name || "All Sections";

      const messagesPayload = targetStudents.map((st) => ({
        studentId: st.id,
        studentName: `${st.student.firstName} ${st.student.lastName}`,
        classRoll: st.classRoll,
        phone: st.student.guardianPhone || "",
        body: renderStudentMessage(st, smsTemplate),
      }));

      const res = await fetch("/api/sms/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: smsProvider,
          apiKey: smsApiKey || undefined,
          senderId: smsSenderId,
          campaignType: smsCampaignType,
          className: clsName,
          sectionName: secName,
          messages: messagesPayload,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to dispatch SMS.");
      }

      // Add to local history
      if (data.log) {
        const code = getActiveTenantCode();
        const updatedHistory = [data.log, ...smsHistory];
        setSmsHistory(updatedHistory);
        localStorage.setItem(getScopedStorageKey("sms_attendance_logs", code), JSON.stringify(updatedHistory));
      }

      setSmsSending(false);
      showToast(
        `Successfully dispatched ${data.count} SMS notification(s) via ${smsProvider} Gateway!`,
        "success"
      );
      setSmsActiveTab("history");
    } catch (err: any) {
      setSmsSending(false);
      showToast(err.message || "Failed to dispatch SMS batch.", "error");
    }
  };

  const handleSaveSmsSettings = () => {
    const code = getActiveTenantCode();
    localStorage.setItem(getScopedStorageKey("sms_attendance_provider", code), smsProvider);
    localStorage.setItem(getScopedStorageKey("sms_attendance_sender_id", code), smsSenderId);
    localStorage.setItem(getScopedStorageKey("sms_attendance_api_key", code), smsApiKey);
    showToast("SMS Gateway configuration saved successfully!", "success");
  };

  const handleClearSmsHistory = () => {
    if (confirm("Are you sure you want to clear all attendance SMS history logs?")) {
      const code = getActiveTenantCode();
      setSmsHistory([]);
      localStorage.removeItem(getScopedStorageKey("sms_attendance_logs", code));
      if (code === "108254") localStorage.removeItem("sms_attendance_logs");
      showToast("SMS history cleared.", "info");
    }
  };

  const insertTagToTemplate = (tag: string) => {
    setSmsTemplate((prev) => `${prev} ${tag}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-white text-xs font-semibold animate-in fade-in slide-in-from-top-4 bg-slate-900 border border-slate-700">
          {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toast.type === "info" && <AlertCircle className="w-4 h-4 text-sky-400" />}
          {toast.type === "error" && <XCircle className="w-4 h-4 text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      <StudentNavHeader />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <span>/</span>
            <span>Students</span>
            <span>/</span>
            <span className="text-slate-800 font-medium">Attendance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-emerald-600" />
            Student Attendance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track daily class attendance, review monthly sheets, make range attendance, and send instant SMS alerts to parents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Unsaved changes
            </span>
          )}

          {/* Prominent SMS System Button */}
          <button
            onClick={() => handleOpenSmsModal("DAILY_ABSENT")}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
            title="Open Full SMS Notification Center"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>SMS System</span>
            {absentCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                {absentCount}
              </span>
            )}
          </button>

          {viewMode === "daily" && (
            <button
              onClick={handleSaveAttendance}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
            >
              <Save className="w-3.5 h-3.5" />
              Save Register
            </button>
          )}

          {viewMode === "monthly" && (
            <button
              onClick={handleSaveMonthlyRegister}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
            >
              <Save className="w-3.5 h-3.5" />
              Save Month
            </button>
          )}

          <Link
            href="/setup/student-info"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Student Info
          </Link>
        </div>
      </div>

      {/* Mode / Tab Switcher Navigation Bar */}
      <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-1">
          {/* Daily Tab */}
          <button
            type="button"
            onClick={() => setViewMode("daily")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              viewMode === "daily"
                ? "bg-white text-emerald-700 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
            <span>Daily Register</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
              Today
            </span>
          </button>

          {/* Monthly Tab */}
          <button
            type="button"
            onClick={() => setViewMode("monthly")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              viewMode === "monthly"
                ? "bg-white text-emerald-700 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <CalendarDays className="w-4 h-4 text-emerald-600" />
            <span>Monthly Attendance Sheet</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
              31 Days
            </span>
          </button>

          {/* Range Attendance & Maker Tab */}
          <button
            type="button"
            onClick={() => setViewMode("range")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              viewMode === "range"
                ? "bg-white text-emerald-700 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <CalendarRange className="w-4 h-4 text-indigo-600" />
            <span>Range Attendance & Bulk Maker</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-bold">
              Make / Report
            </span>
          </button>
        </div>

        {/* Quick helper tag with SMS indicator */}
        <div className="hidden md:flex items-center gap-2 pr-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1 text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
            <Smartphone className="w-3 h-3" />
            SMS Gateway Ready ({smsProvider})
          </span>
          <span>•</span>
          <span>
            {viewMode === "daily" && "Record daily marks & absentee SMS dispatch"}
            {viewMode === "monthly" && "Click any day cell to cycle status (P → A → L → E)"}
            {viewMode === "range" && "Generate attendance for dates or view custom date range reports"}
          </span>
        </div>
      </div>

      {/* Global Filter Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Session */}
          <div>
            <SessionSelect
              value={selectedSession}
              onChange={(val) => setSelectedSession(val)}
              label="Session:"
              labelClassName="block text-[11px] font-semibold text-slate-600 mb-1"
              selectClassName="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Class */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Class:</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedClassId(newId);
                const c = classes.find((cl: any) => cl.id === newId);
                const num = c?.numericValue ?? parseInt(c?.name?.replace(/\D/g, "") || "0", 10);
                if (c && (num === 11 || num === 12 || /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(c.name || ""))) {
                  if (selectedGroup === "GENERAL") setSelectedGroup("ALL");
                }
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            >
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Shift */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Shift:</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Shifts</option>
              <option value="MORNING">Morning</option>
              <option value="DAY">Day</option>
            </select>
          </div>

          {/* Group */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Group:</label>
            {(() => {
              const attendanceClass = classes.find((c: any) => c.id === selectedClassId);
              const attendanceClassNum = attendanceClass?.numericValue ?? parseInt(attendanceClass?.name?.replace(/\D/g, "") || "0", 10);
              const isAttendanceClass11Or12 = Boolean(
                attendanceClass && (
                  attendanceClassNum === 11 ||
                  attendanceClassNum === 12 ||
                  /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(attendanceClass.name || "")
                )
              );
              return (
                <select
                  value={isAttendanceClass11Or12 && selectedGroup === "GENERAL" ? "ALL" : selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="ALL">All Groups</option>
                  {!isAttendanceClass11Or12 && <option value="GENERAL">General</option>}
                  <option value="SCIENCE">Science</option>
                  <option value="HUMANITIES">Humanities</option>
                  <option value="BUSINESS_STUDIES">Business Studies</option>
                </select>
              );
            })()}
          </div>

          {/* Section */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Section:</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            >
              <option value="">All Sections</option>
              {currentSections.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.groupType})
                </option>
              ))}
            </select>
          </div>

          {/* Search Student */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Search Student:</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Name, Roll, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DAILY REGISTER VIEW */}
      {/* ========================================================================= */}
      {viewMode === "daily" && (
        <div className="space-y-6">
          {/* Dynamic Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Total Enrolled
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
              <span className="text-[11px] text-slate-500 font-medium">Active roster list</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Present Today
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{presentCount}</p>
              <span className="text-[11px] text-emerald-600 font-medium">
                {attendanceRate}% Attendance rate
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                Absent Today
              </p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{absentCount}</p>
              <span className="text-[11px] text-rose-500 font-medium">
                {absentCount > 0 ? `${absentCount} SMS Alerts Ready` : "Full attendance recorded"}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Late / Excused
              </p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{lateCount + excusedCount}</p>
              <span className="text-[11px] text-slate-400 font-medium">
                {lateCount} Late • {excusedCount} Excused
              </span>
            </div>
          </div>

          {/* Main Daily Register Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Quick Actions Toolbar (Digital Attendance Register Active banner removed) */}
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAll("PRESENT")}
                  className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll("ABSENT")}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Mark All Absent
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* SMS Action 1: Notify Absentees */}
                <button
                  type="button"
                  onClick={() => handleOpenSmsModal("DAILY_ABSENT")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 ${
                    absentCount > 0
                      ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 cursor-pointer"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                  disabled={absentCount === 0}
                >
                  <Send className="w-3.5 h-3.5" />
                  Notify Absentees via SMS ({absentCount})
                </button>

                {/* SMS Action 2: Notify Late Students */}
                <button
                  type="button"
                  onClick={() => handleOpenSmsModal("DAILY_LATE")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 ${
                    lateCount > 0
                      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200 cursor-pointer"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                  disabled={lateCount === 0}
                >
                  <Clock className="w-3.5 h-3.5" />
                  SMS Late Comers ({lateCount})
                </button>

                {/* Open Full SMS System */}
                <button
                  type="button"
                  onClick={() => handleOpenSmsModal("CUSTOM_NOTICE")}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                  SMS Broadcast
                </button>
              </div>
            </div>

            {/* Daily Date Selector Strip */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Attendance Date:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDateShift(-1)}
                    className="p-1.5 border border-slate-200 bg-white rounded-md text-slate-600 hover:bg-slate-100"
                    title="Previous Day"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleDateShift(1)}
                    className="p-1.5 border border-slate-200 bg-white rounded-md text-slate-600 hover:bg-slate-100"
                    title="Next Day"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="text-xs px-2.5 py-1 bg-white hover:bg-slate-100 text-emerald-700 border border-slate-200 rounded-lg font-medium shadow-2xs"
                >
                  Today
                </button>
              </div>

              <div className="text-xs text-slate-500">
                Selected Day:{" "}
                <strong className="text-slate-800">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </strong>
              </div>
            </div>

            {/* Student Attendance Register Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                  Loading student roster...
                </div>
              ) : students.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No enrolled students found matching the selected filters.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4 w-16 text-center">Roll</th>
                      <th className="py-3 px-4">Student Name & ID</th>
                      <th className="py-3 px-4">Section / Group</th>
                      <th className="py-3 px-4">Guardian Contact</th>
                      <th className="py-3 px-4 text-center w-60">Attendance Status</th>
                      <th className="py-3 px-4 w-48">Remarks / Reason</th>
                      <th className="py-3 px-3 text-center w-14">SMS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {students.map((st) => {
                      const entry = attendance[st.id] || { status: "PRESENT", remarks: "" };
                      const isPresent = entry.status === "PRESENT";
                      const isAbsent = entry.status === "ABSENT";
                      const isLate = entry.status === "LATE";
                      const isExcused = entry.status === "EXCUSED";

                      return (
                        <tr
                          key={st.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isAbsent ? "bg-rose-50/20" : ""
                          }`}
                        >
                          {/* Roll */}
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                            {st.classRoll}
                          </td>

                          {/* Name & ID */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-600">
                                {st.student.firstName[0]}
                                {st.student.lastName[0]}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {st.student.firstName} {st.student.lastName}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  ID: {st.student.studentIdNo}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Section / Group */}
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-700">{st.section?.name}</span>
                            <div className="text-[10px] text-slate-400 capitalize">
                              {st.groupType.toLowerCase().replace("_", " ")}
                            </div>
                          </td>

                          {/* Guardian */}
                          <td className="py-3 px-4">
                            <div className="text-slate-700 font-medium">{st.student.guardianName}</div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                              <Smartphone className="w-2.5 h-2.5 text-slate-400" />
                              {st.student.guardianPhone || "No Phone"}
                            </div>
                          </td>

                          {/* Quick Status Buttons */}
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 gap-0.5 shadow-2xs">
                              {/* Present Button */}
                              <button
                                type="button"
                                onClick={() => handleSetStatus(st.id, "PRESENT")}
                                className={`px-3 py-1.5 rounded-md font-bold text-[11px] transition-all flex items-center gap-1 ${
                                  isPresent
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                                }`}
                                title="Mark Present"
                              >
                                <Check className="w-3 h-3" />
                                P
                              </button>

                              {/* Absent Button */}
                              <button
                                type="button"
                                onClick={() => handleSetStatus(st.id, "ABSENT")}
                                className={`px-3 py-1.5 rounded-md font-bold text-[11px] transition-all flex items-center gap-1 ${
                                  isAbsent
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-rose-700 hover:bg-rose-50"
                                }`}
                                title="Mark Absent"
                              >
                                <XCircle className="w-3 h-3" />
                                A
                              </button>

                              {/* Late Button */}
                              <button
                                type="button"
                                onClick={() => handleSetStatus(st.id, "LATE")}
                                className={`px-3 py-1.5 rounded-md font-bold text-[11px] transition-all flex items-center gap-1 ${
                                  isLate
                                    ? "bg-amber-500 text-white shadow-xs"
                                    : "text-slate-600 hover:text-amber-700 hover:bg-amber-50"
                                }`}
                                title="Mark Late"
                              >
                                <Clock className="w-3 h-3" />
                                L
                              </button>

                              {/* Excused Button */}
                              <button
                                type="button"
                                onClick={() => handleSetStatus(st.id, "EXCUSED")}
                                className={`px-2.5 py-1.5 rounded-md font-bold text-[11px] transition-all flex items-center gap-1 ${
                                  isExcused
                                    ? "bg-sky-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-sky-700 hover:bg-sky-50"
                                }`}
                                title="Mark Excused"
                              >
                                E
                              </button>
                            </div>
                          </td>

                          {/* Remarks */}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder={isAbsent ? "Reason for absence..." : "Optional remark..."}
                              value={entry.remarks || ""}
                              onChange={(e) => handleSetRemarks(st.id, e.target.value)}
                              className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>

                          {/* Direct Individual SMS Trigger */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenSmsModal(
                                  isAbsent ? "DAILY_ABSENT" : isLate ? "DAILY_LATE" : "CUSTOM_NOTICE",
                                  st.id
                                )
                              }
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                              title={`Send direct SMS to ${st.student.guardianName}`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer info bar */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span>
                  Showing <strong>{students.length}</strong> students for date: <strong>{selectedDate}</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {presentCount} Present
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  {absentCount} Absent
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Register
                </button>
                <button
                  onClick={handleSaveAttendance}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MONTHLY ATTENDANCE SHEET VIEW */}
      {/* ========================================================================= */}
      {viewMode === "monthly" && (
        <div className="space-y-6">
          {/* Monthly Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Total Enrolled
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
              <span className="text-[11px] text-slate-500 font-medium">Students in Class</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-emerald-500" />
                Working Days
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {monthlyOverallMetrics.totalWorkingDays} Days
              </p>
              <span className="text-[11px] text-emerald-700 font-medium">
                {monthlyOverallMetrics.recordedDays} days recorded
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
                Monthly Average
              </p>
              <p className="text-2xl font-bold text-sky-600 mt-1">
                {monthlyOverallMetrics.classAverageRate}%
              </p>
              <span className="text-[11px] text-sky-700 font-medium">Class Attendance Rate</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                High Attendance
              </p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {monthlyOverallMetrics.perfectCount}
              </p>
              <span className="text-[11px] text-amber-700 font-medium">Students with ≥95% rate</span>
            </div>
          </div>

          {/* Month Controls & Toolbar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {[2024, 2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={loadMonthData}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reload Month
                </button>
              </div>
            </div>

            {/* Quick Actions for Month */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAutoFillMonth}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs"
                title="Mark all working days of this month as Present"
              >
                <Check className="w-3.5 h-3.5" />
                Auto-fill Working Days
              </button>

              {/* Monthly SMS Summary Trigger */}
              <button
                type="button"
                onClick={() => handleOpenSmsModal("MONTHLY_SUMMARY")}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs"
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                Send Monthly SMS Summary
              </button>

              <button
                type="button"
                onClick={handleExportMonthlyExcel}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Export Excel (.xlsx)
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                Print Monthly Sheet
              </button>

              <button
                type="button"
                onClick={handleSaveMonthlyRegister}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>
          </div>

          {/* Monthly Matrix Table Grid */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </span>
                <span>• {daysInCurrentMonth} Total Days</span>
                <span className="text-slate-300">|</span>
                <span className="text-[11px] text-slate-500">
                  Tip: Click on any day cell to toggle (P → A → L → E → Clear)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span> P = Present
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-500"></span> A = Absent
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500"></span> L = Late
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-sky-500"></span> E = Excused
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-slate-200"></span> Fri = Holiday
                </span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[70vh]">
              {monthlyLoading ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                  Loading monthly registers...
                </div>
              ) : students.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-xs">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No enrolled students found.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-20 bg-slate-100 shadow-2xs">
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-700 uppercase">
                      <th className="py-2 px-2.5 w-12 text-center bg-slate-100 sticky left-0 z-30 border-r border-slate-200">
                        Roll
                      </th>
                      <th className="py-2 px-3 min-w-[140px] bg-slate-100 sticky left-12 z-30 border-r border-slate-200">
                        Student Name
                      </th>

                      {monthDayList.map((m) => (
                        <th
                          key={m.day}
                          className={`py-1 px-1 text-center w-8 min-w-[32px] border-r border-slate-200 ${
                            m.isFriday ? "bg-amber-100/60 text-amber-800" : "bg-slate-50"
                          }`}
                        >
                          <div className="text-[11px] font-bold leading-tight">{m.day}</div>
                          <div className="text-[9px] font-semibold text-slate-400 lowercase">{m.dayName}</div>
                        </th>
                      ))}

                      <th className="py-2 px-1 text-center w-8 bg-emerald-50 text-emerald-800 font-bold border-l border-slate-200">
                        P
                      </th>
                      <th className="py-2 px-1 text-center w-8 bg-rose-50 text-rose-800 font-bold border-r border-slate-200">
                        A
                      </th>
                      <th className="py-2 px-1 text-center w-8 bg-amber-50 text-amber-800 font-bold border-r border-slate-200">
                        L
                      </th>
                      <th className="py-2 px-1 text-center w-8 bg-sky-50 text-sky-800 font-bold border-r border-slate-200">
                        E
                      </th>
                      <th className="py-2 px-2 text-center w-12 bg-slate-100 text-slate-800 font-bold border-r border-slate-200">
                        Days
                      </th>
                      <th className="py-2 px-2 text-center w-14 bg-slate-100 text-slate-800 font-bold border-r border-slate-200">
                        %
                      </th>
                      <th className="py-2 px-1 text-center w-8 bg-slate-100 text-slate-600">SMS</th>
                      <th className="py-2 px-1 text-center w-8 bg-slate-100 text-slate-600">Log</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 font-sans">
                    {monthlyStudentStats.map(({ student: st, present, absent, late, excused, totalMarked, rate }) => (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-900 bg-white sticky left-0 z-10 border-r border-slate-200">
                          {st.classRoll}
                        </td>

                        <td className="py-2 px-3 bg-white sticky left-12 z-10 border-r border-slate-200">
                          <div className="font-semibold text-slate-900 truncate max-w-[150px]">
                            {st.student.firstName} {st.student.lastName}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono">
                            {st.student.studentIdNo}
                          </div>
                        </td>

                        {monthDayList.map((m) => {
                          const entry = monthlyData[m.dateStr]?.[st.id];
                          const status = entry?.status;

                          let cellContent = "-";
                          let cellClass = "text-slate-300 hover:bg-slate-200";

                          if (status === "PRESENT") {
                            cellContent = "P";
                            cellClass = "bg-emerald-600 text-white font-bold shadow-2xs";
                          } else if (status === "ABSENT") {
                            cellContent = "A";
                            cellClass = "bg-rose-600 text-white font-bold shadow-2xs";
                          } else if (status === "LATE") {
                            cellContent = "L";
                            cellClass = "bg-amber-500 text-white font-bold shadow-2xs";
                          } else if (status === "EXCUSED") {
                            cellContent = "E";
                            cellClass = "bg-sky-600 text-white font-bold shadow-2xs";
                          } else if (m.isFriday) {
                            cellContent = "Fri";
                            cellClass = "bg-amber-50/70 text-amber-500 text-[9px] font-semibold";
                          }

                          return (
                            <td
                              key={m.day}
                              className={`p-0.5 text-center border-r border-slate-100 ${
                                m.isFriday ? "bg-amber-50/20" : ""
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleMonthlyCell(st.id, m.dateStr)}
                                className={`w-6 h-6 rounded-md text-[10px] inline-flex items-center justify-center transition-all ${cellClass}`}
                                title={`${m.dateStr} - ${st.student.firstName}: ${
                                  status || (m.isFriday ? "Friday (Weekend)" : "Unmarked")
                                }`}
                              >
                                {cellContent}
                              </button>
                            </td>
                          );
                        })}

                        <td className="py-2 px-1 text-center font-bold text-emerald-700 bg-emerald-50/40 border-l border-slate-200">
                          {present}
                        </td>
                        <td className="py-2 px-1 text-center font-bold text-rose-700 bg-rose-50/40 border-r border-slate-200">
                          {absent}
                        </td>
                        <td className="py-2 px-1 text-center font-bold text-amber-700 bg-amber-50/40 border-r border-slate-200">
                          {late}
                        </td>
                        <td className="py-2 px-1 text-center font-bold text-sky-700 bg-sky-50/40 border-r border-slate-200">
                          {excused}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-slate-700 bg-slate-50 border-r border-slate-200">
                          {totalMarked}
                        </td>
                        <td className="py-2 px-2 text-center font-bold border-r border-slate-200">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              rate >= 85
                                ? "bg-emerald-100 text-emerald-800"
                                : rate >= 70
                                ? "bg-amber-100 text-amber-800"
                                : totalMarked > 0
                                ? "bg-rose-100 text-rose-800"
                                : "text-slate-400"
                            }`}
                          >
                            {rate}%
                          </span>
                        </td>
                        {/* Direct SMS icon */}
                        <td className="py-2 px-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenSmsModal("MONTHLY_SUMMARY", st.id)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            title={`Send monthly summary SMS to ${st.student.guardianName}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        {/* Timeline Eye */}
                        <td className="py-2 px-1 text-center">
                          <button
                            type="button"
                            onClick={() => setTimelineStudent(st)}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded"
                            title="View student timeline"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Monthly Footer Bar */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span>
                  Month: <strong>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</strong>
                </span>
                <span>•</span>
                <span>Total Roster: <strong>{students.length}</strong></span>
                <span>•</span>
                <span>Class Attendance Avg: <strong className="text-emerald-700">{monthlyOverallMetrics.classAverageRate}%</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Sheet
                </button>
                <button
                  onClick={handleSaveMonthlyRegister}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Register
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. RANGE ATTENDANCE & BULK MAKER VIEW */}
      {/* ========================================================================= */}
      {viewMode === "range" && (
        <div className="space-y-6">
          {/* Card 1: Bulk Range Attendance Maker Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-slate-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      Make Range Attendance (Bulk Generator)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Generate and apply attendance records across any custom date range with intelligent weekend skipping.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                    {rangeValidWorkingDates.length} Working Days Selected
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Start Date (From):
                  </label>
                  <input
                    type="date"
                    value={rangeStartDate}
                    onChange={(e) => setRangeStartDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    End Date (To):
                  </label>
                  <input
                    type="date"
                    value={rangeEndDate}
                    onChange={(e) => setRangeEndDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Attendance Status to Apply:
                  </label>
                  <select
                    value={rangeStatus}
                    onChange={(e) => setRangeStatus(e.target.value as AttendanceStatus)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="PRESENT">PRESENT (P) - Standard</option>
                    <option value="ABSENT">ABSENT (A)</option>
                    <option value="LATE">LATE (L)</option>
                    <option value="EXCUSED">EXCUSED (E) / Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Student Scope:
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={rangeScope}
                      onChange={(e) => setRangeScope(e.target.value as "ALL" | "SELECTED")}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="ALL">All Enrolled ({students.length} students)</option>
                      <option value="SELECTED">
                        Custom Selection ({selectedStudentIdsForRange.length})
                      </option>
                    </select>
                    {rangeScope === "SELECTED" && (
                      <button
                        type="button"
                        onClick={() => setShowStudentPickerModal(true)}
                        className="px-2.5 py-2 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg border border-indigo-200"
                        title="Pick specific students"
                      >
                        Select
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Exclusion strip */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800">Exclusion & Overwrite Preferences:</div>
                <div className="flex flex-wrap items-center gap-6 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={rangeExcludeFriday}
                      onChange={(e) => setRangeExcludeFriday(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Skip Fridays (Weekly Holiday)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={rangeExcludeSaturday}
                      onChange={(e) => setRangeExcludeSaturday(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Skip Saturdays</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={rangeExcludeSunday}
                      onChange={(e) => setRangeExcludeSunday(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Skip Sundays</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-amber-800">
                    <input
                      type="checkbox"
                      checked={rangeOverwrite}
                      onChange={(e) => setRangeOverwrite(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span>Overwrite existing records (default: only fill unmarked days)</span>
                  </label>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600 shrink-0">Remarks / Log Reason:</span>
                  <input
                    type="text"
                    value={rangeRemarks}
                    onChange={(e) => setRangeRemarks(e.target.value)}
                    placeholder="e.g., Regular school term attendance, Exam term, etc."
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Preview: </span>
                  Marking <strong>{targetStudentsForRange.length}</strong> students across{" "}
                  <strong>{rangeValidWorkingDates.length}</strong> working days (
                  {rangeDatesList.length - rangeValidWorkingDates.length} holidays skipped) ={" "}
                  <strong className="text-indigo-600">
                    {targetStudentsForRange.length * rangeValidWorkingDates.length} entries
                  </strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadRangeReportData}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                  >
                    Refresh Range View
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyRangeAttendance}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition active:scale-98"
                  >
                    <Zap className="w-4 h-4" />
                    Make & Apply Range Attendance
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Range Attendance Summary Report & Register */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Date Range Attendance Summary & Performance Report
                </h3>
                <p className="text-[11px] text-slate-500">
                  Span: {rangeStartDate} to {rangeEndDate} ({rangeDatesList.length} Calendar Days)
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Range SMS Summary Trigger */}
                <button
                  type="button"
                  onClick={() => handleOpenSmsModal("RANGE_SUMMARY")}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                  Send Range SMS Summary
                </button>

                <button
                  type="button"
                  onClick={handleExportRangeExcel}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  Export Range Excel
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  Print Range Report
                </button>
              </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border-b border-slate-100">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium">Class Attendance Rate</span>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{rangeOverallMetrics.avgRate}%</p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
                <span className="text-[11px] text-emerald-700 font-medium">Regular (≥90%)</span>
                <p className="text-xl font-bold text-emerald-700 mt-0.5">
                  {rangeOverallMetrics.highAttendanceCount} Students
                </p>
              </div>

              <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200">
                <span className="text-[11px] text-rose-700 font-medium">At Risk (&lt;60%)</span>
                <p className="text-xl font-bold text-rose-700 mt-0.5">
                  {rangeOverallMetrics.atRiskCount} Students
                </p>
              </div>

              <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-200">
                <span className="text-[11px] text-indigo-700 font-medium">Date Span</span>
                <p className="text-xl font-bold text-indigo-700 mt-0.5">
                  {rangeOverallMetrics.totalDates} Days
                </p>
              </div>
            </div>

            {/* Range Register Table */}
            <div className="overflow-x-auto">
              {rangeLoading ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  Compiling range attendance statistics...
                </div>
              ) : students.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No enrolled students found.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-3 w-16 text-center">Roll</th>
                      <th className="py-3 px-4">Student Name & ID</th>
                      <th className="py-3 px-3">Section</th>
                      <th className="py-3 px-3 text-center">Present (P)</th>
                      <th className="py-3 px-3 text-center">Absent (A)</th>
                      <th className="py-3 px-3 text-center">Late (L)</th>
                      <th className="py-3 px-3 text-center">Excused (E)</th>
                      <th className="py-3 px-3 text-center">Evaluated Days</th>
                      <th className="py-3 px-3 text-center">Attendance %</th>
                      <th className="py-3 px-3 text-center">Performance Status</th>
                      <th className="py-3 px-2 text-center w-12">SMS</th>
                      <th className="py-3 px-2 text-center w-12">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rangeStudentStats.map(
                      ({
                        student: st,
                        present,
                        absent,
                        late,
                        excused,
                        totalMarked,
                        rate,
                        category,
                        badgeColor,
                      }) => (
                        <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                            {st.classRoll}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">
                              {st.student.firstName} {st.student.lastName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {st.student.studentIdNo} • {st.student.guardianPhone}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-medium text-slate-700">{st.section?.name}</span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-emerald-600 bg-emerald-50/20">
                            {present}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-rose-600 bg-rose-50/20">
                            {absent}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-amber-600 bg-amber-50/20">
                            {late}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-sky-600 bg-sky-50/20">
                            {excused}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-800">{totalMarked}</td>
                          <td className="py-3 px-3 text-center font-bold">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-xs">{rate}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badgeColor}`}
                            >
                              {category}
                            </span>
                          </td>
                          {/* Direct Range SMS Button */}
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenSmsModal("RANGE_SUMMARY", st.id)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                              title={`Send range attendance SMS to ${st.student.guardianName}`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => setTimelineStudent(st)}
                              className="px-2 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition"
                            >
                              Log
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing <strong>{rangeStudentStats.length}</strong> students evaluated across{" "}
                <strong>{rangeDatesList.length}</strong> dates
              </span>
              <button
                type="button"
                onClick={handleExportRangeExcel}
                className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Download Complete Excel Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADVANCED SMS SYSTEM MODAL & GATEWAY CONTROL CENTER */}
      {/* ========================================================================= */}
      {smsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Attendance SMS Notification Center
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      {smsProvider} Gateway
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Instant automated parent mobile notifications for Daily, Monthly & Range attendance records.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSmsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Sub-tabs */}
            <div className="px-5 pt-3 border-b border-slate-200 bg-slate-50 flex items-center gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSmsActiveTab("compose")}
                className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
                  smsActiveTab === "compose"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                Compose & Broadcast
              </button>
              <button
                type="button"
                onClick={() => setSmsActiveTab("history")}
                className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
                  smsActiveTab === "history"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Dispatch History ({smsHistory.length})
              </button>
              <button
                type="button"
                onClick={() => setSmsActiveTab("settings")}
                className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
                  smsActiveTab === "settings"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                Gateway Configuration
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* ---------------- TAB 1: COMPOSE & BROADCAST ---------------- */}
              {smsActiveTab === "compose" && (
                <>
                  {/* Campaign Type Selector Strip */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      1. Choose Notification Campaign Type:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleCampaignTypeChange("DAILY_ABSENT")}
                        className={`p-2.5 rounded-lg border text-left transition ${
                          smsCampaignType === "DAILY_ABSENT"
                            ? "border-rose-500 bg-rose-50 text-rose-900 shadow-xs"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-500" />
                          Daily Absent Alert
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {absentCount} Absent Today
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCampaignTypeChange("DAILY_LATE")}
                        className={`p-2.5 rounded-lg border text-left transition ${
                          smsCampaignType === "DAILY_LATE"
                            ? "border-amber-500 bg-amber-50 text-amber-900 shadow-xs"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          Daily Late Notice
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {lateCount} Late Today
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCampaignTypeChange("MONTHLY_SUMMARY")}
                        className={`p-2.5 rounded-lg border text-left transition ${
                          smsCampaignType === "MONTHLY_SUMMARY"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 text-emerald-500" />
                          Monthly Report
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCampaignTypeChange("RANGE_SUMMARY")}
                        className={`p-2.5 rounded-lg border text-left transition ${
                          smsCampaignType === "RANGE_SUMMARY"
                            ? "border-indigo-500 bg-indigo-50 text-indigo-900 shadow-xs"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center gap-1">
                          <CalendarRange className="w-3 h-3 text-indigo-500" />
                          Range Report
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {rangeDatesList.length} Days Span
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Recipient Target & Quick Filters */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-700">
                        2. Recipients Selection ({selectedSmsStudentIds.length} of {students.length} students selected):
                      </label>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleScopeChange("ALL")}
                          className={`px-2 py-0.5 rounded font-medium border ${
                            smsRecipientScope === "ALL"
                              ? "bg-slate-800 text-white border-slate-800"
                              : "bg-white text-slate-600 border-slate-300"
                          }`}
                        >
                          All ({students.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleScopeChange("ABSENT")}
                          className={`px-2 py-0.5 rounded font-medium border ${
                            smsRecipientScope === "ABSENT"
                              ? "bg-rose-600 text-white border-rose-600"
                              : "bg-white text-slate-600 border-slate-300"
                          }`}
                        >
                          Absentees ({absentCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleScopeChange("LATE")}
                          className={`px-2 py-0.5 rounded font-medium border ${
                            smsRecipientScope === "LATE"
                              ? "bg-amber-600 text-white border-amber-600"
                              : "bg-white text-slate-600 border-slate-300"
                          }`}
                        >
                          Late ({lateCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleScopeChange("LOW_ATTENDANCE")}
                          className={`px-2 py-0.5 rounded font-medium border ${
                            smsRecipientScope === "LOW_ATTENDANCE"
                              ? "bg-purple-600 text-white border-purple-600"
                              : "bg-white text-slate-600 border-slate-300"
                          }`}
                        >
                          Low Attendance (&lt;75%)
                        </button>
                      </div>
                    </div>

                    {/* Recipient Checklist with Search */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Filter recipients by name, roll, phone..."
                            value={smsSearchQuery}
                            onChange={(e) => setSmsSearchQuery(e.target.value)}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setSelectedSmsStudentIds(students.map((s) => s.id))}
                            className="text-indigo-600 hover:underline font-semibold"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setSelectedSmsStudentIds([])}
                            className="text-rose-600 hover:underline font-semibold"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="max-h-36 overflow-y-auto border border-slate-200 bg-white rounded-lg divide-y divide-slate-100 text-xs">
                        {modalTargetStudents.length === 0 ? (
                          <div className="p-3 text-center text-slate-400 text-xs">
                            No students match your search filter.
                          </div>
                        ) : (
                          modalTargetStudents.map((st) => {
                            const isChecked = selectedSmsStudentIds.includes(st.id);
                            const hasPhone = !!st.student.guardianPhone && st.student.guardianPhone.trim().length >= 8;
                            const dailyStatus = attendance[st.id]?.status || "PRESENT";

                            return (
                              <label
                                key={st.id}
                                className={`p-2 flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                                  !hasPhone ? "bg-amber-50/40" : ""
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedSmsStudentIds((prev) => [...prev, st.id]);
                                      } else {
                                        setSelectedSmsStudentIds((prev) => prev.filter((id) => id !== st.id));
                                      }
                                    }}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                  />
                                  <span className="font-mono font-bold text-slate-900">
                                    Roll {st.classRoll}:
                                  </span>
                                  <span className="font-semibold text-slate-800">
                                    {st.student.firstName} {st.student.lastName}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                      dailyStatus === "ABSENT"
                                        ? "bg-rose-100 text-rose-700"
                                        : dailyStatus === "LATE"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-emerald-100 text-emerald-700"
                                    }`}
                                  >
                                    {dailyStatus}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-slate-400">
                                    {st.student.guardianName}
                                  </span>
                                  <span
                                    className={`font-mono text-[11px] px-2 py-0.5 rounded border ${
                                      hasPhone
                                        ? "bg-slate-50 border-slate-200 text-slate-700"
                                        : "bg-rose-50 border-rose-200 text-rose-700 font-semibold"
                                    }`}
                                  >
                                    {hasPhone ? st.student.guardianPhone : "No Phone!"}
                                  </span>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SMS Template Editor & Dynamic Tags */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">
                        3. Message Template & Dynamic Tags:
                      </label>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {smsTemplate.length} characters • {Math.ceil(smsTemplate.length / 160) || 1} SMS part(s)
                      </span>
                    </div>

                    <textarea
                      rows={3}
                      value={smsTemplate}
                      onChange={(e) => setSmsTemplate(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-3 text-slate-800 font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Type your message with dynamic tags..."
                    />

                    {/* Tag Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-medium">Insert tag:</span>
                      {[
                        "{student_name}",
                        "{roll}",
                        "{class}",
                        "{section}",
                        "{date}",
                        "{month}",
                        "{year}",
                        "{status}",
                        "{present_days}",
                        "{absent_days}",
                        "{attendance_rate}",
                        "{institution}",
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => insertTagToTemplate(tag)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-mono border border-slate-200 transition"
                        >
                          +{tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Mobile Message Preview */}
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                        Live Message Preview (Sample for {previewStudent ? `${previewStudent.student.firstName} (Roll ${previewStudent.classRoll})` : "Student"}):
                      </span>
                      <span className="font-mono text-indigo-600">
                        Sender ID: {smsSenderId}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
                      {previewMessageText}
                    </div>
                  </div>
                </>
              )}

              {/* ---------------- TAB 2: DISPATCH HISTORY ---------------- */}
              {smsActiveTab === "history" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Attendance SMS Dispatch History
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Log of recent broadcasts dispatched via the Attendance module.
                      </p>
                    </div>
                    {smsHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearSmsHistory}
                        className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear History
                      </button>
                    )}
                  </div>

                  {smsHistory.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 text-xs">
                      <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No SMS broadcasts dispatched yet. Send your first broadcast from the Compose tab!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {smsHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-2 shadow-2xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">
                                {item.campaignType.replace("_", " ")}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {item.recipientCount} Recipients
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {item.status}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 italic">
                            "{item.sampleMessage}"
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                            <span>
                              Class: {item.className} • Section: {item.sectionName}
                            </span>
                            <span className="font-mono text-indigo-600">
                              Provider: {item.provider} • Sender: {item.senderId}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- TAB 3: GATEWAY CONFIG ---------------- */}
              {smsActiveTab === "settings" && (
                <div className="space-y-4 max-w-lg mx-auto py-2">
                  <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 text-xs text-indigo-900">
                    <p className="font-bold flex items-center gap-1.5">
                      <Settings2 className="w-4 h-4 text-indigo-600" />
                      SMS Notification Gateway Settings
                    </p>
                    <p className="text-[11px] text-indigo-700 mt-1">
                      Configure your preferred telecommunication SMS gateway provider or test using Mock Gateway sandbox.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gateway Provider:
                    </label>
                    <select
                      value={smsProvider}
                      onChange={(e) => setSmsProvider(e.target.value as any)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="MOCK">Mock Gateway (Simulation / Sandbox Testing)</option>
                      <option value="SSL_WIRELESS">SSL Wireless (Bangladesh Telecom API)</option>
                      <option value="GREENWEB">Greenweb SMS Gateway</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Masking Sender ID:
                    </label>
                    <input
                      type="text"
                      value={smsSenderId}
                      onChange={(e) => setSmsSenderId(e.target.value)}
                      placeholder="e.g. DHAKA_IDEAL"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gateway API Key / Token (Optional for Mock):
                    </label>
                    <input
                      type="password"
                      value={smsApiKey}
                      onChange={(e) => setSmsApiKey(e.target.value)}
                      placeholder="Enter provider API Token"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSaveSmsSettings}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                    >
                      Save Gateway Configuration
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {smsActiveTab === "compose" && (
                  <span>
                    Ready to dispatch to <strong>{selectedSmsStudentIds.length}</strong> parent phone numbers.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSmsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  Close
                </button>

                {smsActiveTab === "compose" && (
                  <button
                    type="button"
                    onClick={handleDispatchSmsBatch}
                    disabled={smsSending || selectedSmsStudentIds.length === 0}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    {smsSending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Dispatching SMS...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Dispatch {selectedSmsStudentIds.length} SMS Notifications
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STUDENT SELECTION MODAL FOR RANGE BULK MAKER */}
      {/* ========================================================================= */}
      {showStudentPickerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Select Students for Range Attendance</h3>
                <p className="text-[11px] text-slate-500">
                  {selectedStudentIdsForRange.length} of {students.length} students selected
                </p>
              </div>
              <button
                onClick={() => setShowStudentPickerModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedStudentIdsForRange(students.map((s) => s.id))}
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudentIdsForRange([])}
                  className="text-rose-600 hover:underline font-semibold"
                >
                  Deselect All
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs bg-slate-50/50">
                {students.map((st) => {
                  const isChecked = selectedStudentIdsForRange.includes(st.id);
                  return (
                    <label
                      key={st.id}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-100/70 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentIdsForRange((prev) => [...prev, st.id]);
                            } else {
                              setSelectedStudentIdsForRange((prev) => prev.filter((id) => id !== st.id));
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <div>
                          <span className="font-bold text-slate-900">Roll {st.classRoll}:</span>{" "}
                          <span className="font-semibold text-slate-800">
                            {st.student.firstName} {st.student.lastName}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">
                        {st.student.studentIdNo}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowStudentPickerModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Done ({selectedStudentIdsForRange.length} Selected)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STUDENT TIMELINE BREAKDOWN MODAL */}
      {/* ========================================================================= */}
      {timelineStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                  {timelineStudent.student.firstName[0]}
                  {timelineStudent.student.lastName[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Roll {timelineStudent.classRoll}: {timelineStudent.student.firstName}{" "}
                    {timelineStudent.student.lastName}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ID: {timelineStudent.student.studentIdNo} • Guardian:{" "}
                    {timelineStudent.student.guardianName} ({timelineStudent.student.guardianPhone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTimelineStudent(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>
                  Attendance Records ({viewMode === "monthly" ? `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}` : `${rangeStartDate} to ${rangeEndDate}`})
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenSmsModal("CUSTOM_NOTICE", timelineStudent.id)}
                  className="px-2 py-1 text-[11px] bg-indigo-50 text-indigo-700 rounded font-semibold border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  Send SMS to Guardian
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
                {(viewMode === "monthly" ? monthDayList : rangeDatesList.map(d => ({ dateStr: d, dayName: DAY_NAMES_SHORT[getDayOfWeek(d)] }))).map((item) => {
                  const dateStr = item.dateStr;
                  const rec = (viewMode === "monthly" ? monthlyData : rangeData)[dateStr]?.[timelineStudent.id];
                  const status = rec?.status;
                  const remarks = rec?.remarks;
                  const isFri = getDayOfWeek(dateStr) === 5;

                  return (
                    <div key={dateStr} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span className="font-semibold text-slate-900">{dateStr}</span>
                        <span className="text-[11px] text-slate-400 ml-2 font-mono">
                          ({item.dayName})
                        </span>
                        {remarks && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">
                            Remark: {remarks}
                          </div>
                        )}
                      </div>

                      <div>
                        {status === "PRESENT" && (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            Present
                          </span>
                        )}
                        {status === "ABSENT" && (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800">
                            Absent
                          </span>
                        )}
                        {status === "LATE" && (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">
                            Late
                          </span>
                        )}
                        {status === "EXCUSED" && (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-100 text-sky-800">
                            Excused
                          </span>
                        )}
                        {!status && (
                          <span className="px-2 py-0.5 rounded text-[10px] text-slate-400 bg-slate-100">
                            {isFri ? "Holiday (Fri)" : "Unmarked"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setTimelineStudent(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIRECT BACKGROUND PRINT ELEMENT */}
      {/* ========================================================================= */}
      <div className="hidden print:block font-sans text-black p-6">
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-xl font-bold uppercase tracking-wide">
            Dhaka Ideal Model High School & College
          </h1>
          <p className="text-xs text-gray-600">Mirpur, Dhaka-1216, Bangladesh • Established 1985</p>
          <div className="mt-2 inline-block px-3 py-1 border border-black text-xs font-bold uppercase">
            {viewMode === "daily" && `Daily Attendance Register — Date: ${selectedDate}`}
            {viewMode === "monthly" && `Monthly Attendance Register — ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
            {viewMode === "range" && `Student Attendance Range Report — ${rangeStartDate} to ${rangeEndDate}`}
          </div>
          <p className="text-xs text-gray-700 mt-1">
            Class: {classes.find((c: any) => c.id === selectedClassId)?.name || "N/A"} | Section:{" "}
            {currentSections.find((s: any) => s.id === selectedSectionId)?.name || "All"} | Shift:{" "}
            {selectedShift} | Group: {selectedGroup}
          </p>
        </div>

        {/* Print table for Daily */}
        {viewMode === "daily" && (
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-gray-100 border-b border-black">
                <th className="border border-black p-2 text-center w-12">Roll</th>
                <th className="border border-black p-2 text-left">Student ID</th>
                <th className="border border-black p-2 text-left">Student Name</th>
                <th className="border border-black p-2 text-left">Section</th>
                <th className="border border-black p-2 text-center w-24">Status</th>
                <th className="border border-black p-2 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st) => (
                <tr key={st.id} className="border-b border-black">
                  <td className="border border-black p-1.5 text-center font-bold">{st.classRoll}</td>
                  <td className="border border-black p-1.5 font-mono">{st.student.studentIdNo}</td>
                  <td className="border border-black p-1.5 font-semibold">
                    {st.student.firstName} {st.student.lastName}
                  </td>
                  <td className="border border-black p-1.5">{st.section?.name}</td>
                  <td className="border border-black p-1.5 text-center font-bold">
                    {attendance[st.id]?.status || "PRESENT"}
                  </td>
                  <td className="border border-black p-1.5 text-gray-700">
                    {attendance[st.id]?.remarks || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Print table for Monthly */}
        {viewMode === "monthly" && (
          <table className="w-full border-collapse border border-black text-[10px]">
            <thead>
              <tr className="bg-gray-100 border-b border-black">
                <th className="border border-black p-1 text-center w-8">Roll</th>
                <th className="border border-black p-1 text-left min-w-[120px]">Student Name</th>
                {monthDayList.map((m) => (
                  <th key={m.day} className="border border-black p-0.5 text-center w-5">
                    {m.day}
                  </th>
                ))}
                <th className="border border-black p-1 text-center w-7">P</th>
                <th className="border border-black p-1 text-center w-7">A</th>
                <th className="border border-black p-1 text-center w-7">L</th>
                <th className="border border-black p-1 text-center w-7">E</th>
                <th className="border border-black p-1 text-center w-9">%</th>
              </tr>
            </thead>
            <tbody>
              {monthlyStudentStats.map(({ student: st, present, absent, late, excused, rate }) => (
                <tr key={st.id} className="border-b border-black">
                  <td className="border border-black p-1 text-center font-bold">{st.classRoll}</td>
                  <td className="border border-black p-1 font-semibold truncate max-w-[120px]">
                    {st.student.firstName} {st.student.lastName}
                  </td>
                  {monthDayList.map((m) => {
                    const status = monthlyData[m.dateStr]?.[st.id]?.status;
                    return (
                      <td key={m.day} className="border border-black p-0.5 text-center font-mono">
                        {status ? status[0] : m.isFriday ? "F" : "-"}
                      </td>
                    );
                  })}
                  <td className="border border-black p-1 text-center font-bold">{present}</td>
                  <td className="border border-black p-1 text-center font-bold">{absent}</td>
                  <td className="border border-black p-1 text-center">{late}</td>
                  <td className="border border-black p-1 text-center">{excused}</td>
                  <td className="border border-black p-1 text-center font-bold">{rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Print table for Range */}
        {viewMode === "range" && (
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-gray-100 border-b border-black">
                <th className="border border-black p-2 text-center w-12">Roll</th>
                <th className="border border-black p-2 text-left">Student Name</th>
                <th className="border border-black p-2 text-left">Student ID</th>
                <th className="border border-black p-2 text-center w-16">Present</th>
                <th className="border border-black p-2 text-center w-16">Absent</th>
                <th className="border border-black p-2 text-center w-16">Late</th>
                <th className="border border-black p-2 text-center w-16">Excused</th>
                <th className="border border-black p-2 text-center w-20">Total Days</th>
                <th className="border border-black p-2 text-center w-20">Rate (%)</th>
                <th className="border border-black p-2 text-center w-28">Status</th>
              </tr>
            </thead>
            <tbody>
              {rangeStudentStats.map(({ student: st, present, absent, late, excused, totalMarked, rate, category }) => (
                <tr key={st.id} className="border-b border-black">
                  <td className="border border-black p-1.5 text-center font-bold">{st.classRoll}</td>
                  <td className="border border-black p-1.5 font-semibold">
                    {st.student.firstName} {st.student.lastName}
                  </td>
                  <td className="border border-black p-1.5 font-mono">{st.student.studentIdNo}</td>
                  <td className="border border-black p-1.5 text-center font-bold">{present}</td>
                  <td className="border border-black p-1.5 text-center font-bold">{absent}</td>
                  <td className="border border-black p-1.5 text-center">{late}</td>
                  <td className="border border-black p-1.5 text-center">{excused}</td>
                  <td className="border border-black p-1.5 text-center font-bold">{totalMarked}</td>
                  <td className="border border-black p-1.5 text-center font-bold">{rate}%</td>
                  <td className="border border-black p-1.5 text-center">{category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Print Signatures */}
        <div className="mt-16 pt-8 flex justify-between text-xs font-semibold">
          <div className="border-t border-black pt-1 w-44 text-center">Class Teacher Signature</div>
          <div className="border-t border-black pt-1 w-44 text-center">Section Head Signature</div>
          <div className="border-t border-black pt-1 w-44 text-center">Principal Signature & Seal</div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  UserCheck,
  Award,
  Receipt,
  Bell,
  Search,
  Filter,
  RotateCcw,
  Printer,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building,
  GraduationCap,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Sparkles,
  BookOpen,
  ArrowRight,
  Download,
  Eye,
  CreditCard,
  Heart,
  FileText,
  Check,
  HelpCircle,
  TrendingUp,
  Camera,
  Upload,
  Edit2,
  Trash2,
  Plus,
  X,
  Image as ImageIcon,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "@/components/iconify/lucide";
import { getStoredWaivers, calculateStudentWaiver } from "@/sections/fees/schema/waiver-store";
import { StudentAdminPageShell } from "@/sections/student/component/admin-page-shell";
import { StudentPageHeader } from "@/sections/student/component/student-page-header";
import { DatePicker } from "@/components/date-picker/date-picker";
import { AppButton } from "@/components/button/app-button";
import { SessionSelect } from "@/components/SessionSelect";
import { AppCard } from "@/components/card/app-card";
import { AppSelect } from "@/components/select/app-select";
import { AppTextField } from "@/components/text-field/app-text-field";
import { EmptyContent } from "@/components/empty-content/empty-content";
import { Label } from "@/components/label/label";
import {
  Avatar,
  Box,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { SearchIcon, PrintOutlinedIcon, ChevronLeftIcon, ChevronRightIcon, PhotoCameraOutlinedIcon, NotificationsNoneOutlinedIcon, MenuBookOutlinedIcon, EditOutlinedIcon } from "@/components/iconify/mui-icons";
import { AppTabs } from "@/components/ui/tabs-component";
const formatGroupName = (g?: string) => {
  if (!g) return "General";
  const upper = g.toUpperCase().replace(/\s+/g, "_");
  if (upper === "SCIENCE") return "Science";
  if (upper === "HUMANITIES") return "Humanities";
  if (upper === "BUSINESS_STUDIES") return "Business Studies";
  return g;
};

const isStandardOrInternalKey = (k: string) => {
  const lower = k.toLowerCase().replace(/[^a-z0-9]/g, "");
  return (
    lower.includes("blood") ||
    lower.includes("dob") ||
    lower.includes("birth") ||
    lower.includes("nationality") ||
    lower.includes("father") ||
    lower.includes("mother") ||
    lower.includes("permanent") ||
    lower.includes("present") ||
    lower.includes("address") ||
    lower.includes("gender") ||
    lower.includes("sex") ||
    lower.includes("religion") ||
    lower.includes("guardian") ||
    lower.includes("mobile") ||
    lower.includes("phone") ||
    lower.includes("roll") ||
    lower.includes("reg") ||
    lower.includes("group") ||
    lower.includes("section") ||
    lower.includes("class") ||
    lower.includes("subject") ||
    lower.includes("category") ||
    lower.includes("catagory") ||
    lower.includes("service") ||
    lower.includes("studentstatus") ||
    lower.includes("statusdate")
  );
};

const formatCustomFieldLabel = (key: string) => {
  return key
    .replace(/_\d{10,}$/, "")
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function StudentProfilePage() {
  // Navigation tabs: Profile, Result, Fee status, Notice, Subject List
  const [activeTab, setActiveTab] = useState<"PROFILE" | "RESULT" | "FEE_STATUS" | "NOTICE" | "SUBJECT_LIST">("PROFILE");
  const [subjectFilter, setSubjectFilter] = useState<"ALL" | "MANDATORY" | "GROUP_ELECTIVE" | "OPTIONAL_4TH">("ALL");

  // Filtering & Selection
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedShift, setSelectedShift] = useState("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Students list and active selected student
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Fee & Waiver store data
  const [waivers, setWaivers] = useState<Record<string, any>>({});
  const [feeRecords, setFeeRecords] = useState<Record<string, any>>({});

  // Notice filter
  const [noticeCategory, setNoticeCategory] = useState<string>("ALL");

  // Profile Photo Management State
  const [studentPhotos, setStudentPhotos] = useState<Record<string, string>>({});
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [tempPhotoUrl, setTempPhotoUrl] = useState("");

  // Subject Edit Management State
  const [customSubjectsMap, setCustomSubjectsMap] = useState<Record<string, any[]>>({});
  const [isEditSubjectModalOpen, setIsEditSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    code: "",
    name: "",
    nameBn: "",
    type: "OPTIONAL_4TH" as "MANDATORY" | "GROUP_ELECTIVE" | "OPTIONAL_4TH",
  });

  // Section Edit Modal State
  const [editingSection, setEditingSection] = useState<"academic" | "personal" | "guardian" | "address" | "additional" | null>(null);
  const [sectionFormData, setSectionFormData] = useState<Record<string, any>>({});
  const [savingSection, setSavingSection] = useState(false);
  const [sectionError, setSectionError] = useState("");
  const [sectionSuccess, setSectionSuccess] = useState("");
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);

  // Load classes, waivers, fee records, student photos, and custom subjects
  useEffect(() => {
    setWaivers(getStoredWaivers());

    try {
      const storedFees = localStorage.getItem("nctb_fee_records_v1");
      if (storedFees) setFeeRecords(JSON.parse(storedFees));
    } catch (e) {
      console.error(e);
    }

    try {
      const storedPhotos = localStorage.getItem("nctb_student_photos_v1");
      if (storedPhotos) setStudentPhotos(JSON.parse(storedPhotos));
    } catch (e) {
      console.error(e);
    }

    try {
      const storedSubjects = localStorage.getItem("nctb_student_custom_subjects_v1");
      if (storedSubjects) setCustomSubjectsMap(JSON.parse(storedSubjects));
    } catch (e) {
      console.error(e);
    }

    const handleSync = () => {
      setWaivers(getStoredWaivers());
      try {
        const storedFees = localStorage.getItem("nctb_fee_records_v1");
        if (storedFees) setFeeRecords(JSON.parse(storedFees));
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener("nctb_waiver_store_updated", handleSync);
    window.addEventListener("storage", handleSync);

    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.length > 0) {
          setClasses(data.data);
          setSelectedClassId(data.data[0].id);
        }
      })
      .catch((err) => console.error("Error fetching classes:", err));

    fetch("/api/subjects")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setAvailableSubjects(data.data);
        }
      })
      .catch((err) => console.error("Error fetching subjects:", err));

    return () => {
      window.removeEventListener("nctb_waiver_store_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Fetch students
  const fetchStudents = () => {
    if (!selectedClassId && classes.length === 0) return;
    setLoading(true);

    const params = new URLSearchParams();
    if (selectedSession && selectedSession !== "ALL") params.set("session", selectedSession);
    if (selectedClassId) params.set("classId", selectedClassId);
    if (selectedSectionId) params.set("sectionId", selectedSectionId);
    if (selectedGroup && selectedGroup !== "ALL") params.set("groupType", selectedGroup);
    if (selectedShift && selectedShift !== "ALL") params.set("shift", selectedShift);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());

    fetch(`/api/students?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          let studentList = data.data;
          if (selectedShift && selectedShift !== "ALL") {
            studentList = studentList.filter((s: any) =>
              !s.section?.shift || s.section.shift.toUpperCase() === selectedShift.toUpperCase()
            );
          }
          setStudents(studentList);
          if (studentList.length > 0) {
            // Select first student by default or preserve selection
            const exists = studentList.some((s: any) => s.id === selectedStudentId);
            if (!exists) {
              setSelectedStudentId(studentList[0].id);
            }
          } else {
            setSelectedStudentId("");
          }
        } else {
          setStudents([]);
          setSelectedStudentId("");
        }
      })
      .catch((err) => {
        console.error(err);
        setStudents([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedSession, selectedClassId, selectedSectionId, selectedShift, selectedGroup, searchQuery, classes]);

  // Derived sections
  const currentClass = classes.find((c) => c.id === selectedClassId);
  const rawSections = currentClass
    ? currentClass.sections || []
    : classes.flatMap((c) => c.sections || []);

  const availableSections = rawSections.filter((s: any) => {
    if (selectedShift !== "ALL" && s.shift && s.shift.toUpperCase() !== selectedShift.toUpperCase()) return false;
    if (selectedGroup !== "ALL" && s.groupType && s.groupType !== selectedGroup) return false;
    return true;
  });

  // Currently Active Student Object
  const activeStudent = useMemo(() => {
    if (!selectedStudentId && students.length > 0) return students[0];
    return students.find((s) => s.id === selectedStudentId) || students[0] || null;
  }, [students, selectedStudentId]);

  // Dynamic / Custom Fields parsed from Student record
  const customData: Record<string, any> = useMemo(() => {
    if (!activeStudent?.student?.customFields) return {};
    try {
      return typeof activeStudent.student.customFields === "string"
        ? JSON.parse(activeStudent.student.customFields)
        : activeStudent.student.customFields;
    } catch (e) {
      return {};
    }
  }, [activeStudent]);

  // Handler to open Section Edit modal
  const handleOpenSectionEdit = (section: "academic" | "personal" | "guardian" | "address" | "additional") => {
    if (!activeStudent) return;
    const fourthSub = activeStudent.allocations?.find((a: any) => a.subjectType === "OPTIONAL_4TH");

    let currentCustom: Record<string, any> = {};
    if (activeStudent.student?.customFields) {
      try {
        currentCustom =
          typeof activeStudent.student.customFields === "string"
            ? JSON.parse(activeStudent.student.customFields)
            : activeStudent.student.customFields;
      } catch (e) {}
    }

    setSectionFormData({
      enrollmentId: activeStudent.id,
      studentId: activeStudent.student?.id || activeStudent.studentId,
      // Academic
      classRoll: activeStudent.classRoll ?? "",
      studentIdNo: activeStudent.student?.studentIdNo ?? "",
      sectionId: activeStudent.sectionId ?? "",
      groupType: activeStudent.groupType ? formatGroupName(activeStudent.groupType) : "Science",
      fourthSubjectId: fourthSub ? fourthSub.subjectId : "",

      // Personal
      firstName: activeStudent.student?.firstName ?? "",
      lastName: activeStudent.student?.lastName ?? "",
      gender: activeStudent.student?.gender ?? "",
      religion: activeStudent.student?.religion ?? "",
      bloodGroup: currentCustom.bloodGroup || currentCustom.blood_group || currentCustom["Blood Group"] || "",
      dob: currentCustom.dob || currentCustom.dateOfBirth || currentCustom["Date of Birth"] || "",
      nationality: currentCustom.nationality || currentCustom["Nationality"] || "",

      // Guardian
      guardianName: activeStudent.student?.guardianName ?? "",
      guardianPhone: activeStudent.student?.guardianPhone ?? "",
      fatherName: currentCustom.fatherName || currentCustom.father_name || currentCustom["Father's Name"] || "",
      motherName: currentCustom.motherName || currentCustom.mother_name || currentCustom["Mother's Name"] || "",

      // Address
      address: activeStudent.student?.address ?? "",
      permanentAddress: currentCustom.permanentAddress || currentCustom.permanent_address || currentCustom["Permanent Address"] || "",

      // Additional / Enrolled Info
      studentCategory: currentCustom.studentCategory || currentCustom.studentCatagory || currentCustom.category || "General",
      service: currentCustom.service || currentCustom.services || "None",
      studentStatus: currentCustom.studentStatus || (activeStudent.student?.isActive !== false ? "ACTIVE" : "INACTIVE"),
      statusDate: currentCustom.statusDate || currentCustom.status_date || "2026-10-20",

      // Preserved custom fields
      customFields: { ...currentCustom },
    });
    setSectionError("");
    setSectionSuccess("");
    setEditingSection(section);
  };

  // Handler to save Section Edit modal changes
  const handleSaveSectionEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;
    setSavingSection(true);
    setSectionError("");
    setSectionSuccess("");

    try {
      const payload: Record<string, any> = {
        enrollmentId: activeStudent.id,
        studentId: activeStudent.student?.id || activeStudent.studentId,
      };

      if (editingSection === "academic") {
        if (!sectionFormData.classRoll && sectionFormData.classRoll !== 0) {
          throw new Error("Class Roll is required.");
        }
        if (!sectionFormData.studentIdNo || !String(sectionFormData.studentIdNo).trim()) {
          throw new Error("Student ID is required.");
        }
        payload.classRoll = parseInt(String(sectionFormData.classRoll).replace(/\D/g, "") || "1", 10);
        payload.studentIdNo = String(sectionFormData.studentIdNo).trim();
        payload.sectionId = sectionFormData.sectionId;
        payload.groupType = sectionFormData.groupType;
        payload.fourthSubjectId = sectionFormData.fourthSubjectId || "";
      } else if (editingSection === "personal") {
        if (!sectionFormData.firstName || !String(sectionFormData.firstName).trim()) {
          throw new Error("First Name is required.");
        }
        payload.firstName = sectionFormData.firstName.trim();
        payload.lastName = (sectionFormData.lastName || "").trim();
        payload.gender = sectionFormData.gender;
        payload.religion = sectionFormData.religion;
        payload.customFields = {
          ...sectionFormData.customFields,
          bloodGroup: (sectionFormData.bloodGroup || "").trim(),
          dob: (sectionFormData.dob || "").trim(),
          nationality: (sectionFormData.nationality || "").trim(),
        };
      } else if (editingSection === "guardian") {
        payload.guardianName = (sectionFormData.guardianName || "").trim();
        payload.guardianPhone = (sectionFormData.guardianPhone || "").trim();
        payload.customFields = {
          ...sectionFormData.customFields,
          fatherName: (sectionFormData.fatherName || "").trim(),
          motherName: (sectionFormData.motherName || "").trim(),
        };
      } else if (editingSection === "address") {
        payload.address = (sectionFormData.address || "").trim();
        payload.customFields = {
          ...sectionFormData.customFields,
          permanentAddress: (sectionFormData.permanentAddress || "").trim(),
        };
      } else if (editingSection === "additional") {
        const isActive = sectionFormData.studentStatus === "ACTIVE";
        payload.isActive = isActive;
        payload.customFields = {
          ...sectionFormData.customFields,
          studentCategory: sectionFormData.studentCategory || "General",
          service: sectionFormData.service || "None",
          studentStatus: sectionFormData.studentStatus || "ACTIVE",
          statusDate: sectionFormData.statusDate || new Date().toISOString().slice(0, 10),
        };
      }

      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update student profile.");
      }

      setSectionSuccess("Student profile updated successfully!");
      fetchStudents();
      setTimeout(() => {
        setEditingSection(null);
        setSavingSection(false);
      }, 500);
    } catch (err: any) {
      setSectionError(err.message || "Failed to save changes.");
      setSavingSection(false);
    }
  };

  // Sequential Student Navigation (Previous / Next)
  const currentStudentIndex = useMemo(() => {
    if (!activeStudent || students.length === 0) return -1;
    return students.findIndex((s) => s.id === activeStudent.id);
  }, [students, activeStudent]);

  const hasPrevious = currentStudentIndex > 0;
  const hasNext = currentStudentIndex >= 0 && currentStudentIndex < students.length - 1;

  const handlePreviousStudent = () => {
    if (hasPrevious) {
      setSelectedStudentId(students[currentStudentIndex - 1].id);
    }
  };

  const handleNextStudent = () => {
    if (hasNext) {
      setSelectedStudentId(students[currentStudentIndex + 1].id);
    }
  };

  // Keyboard shortcut navigation (Left/Right arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT");
      if (isInput) return;

      if (e.key === "ArrowLeft") {
        if (hasPrevious) {
          e.preventDefault();
          setSelectedStudentId(students[currentStudentIndex - 1].id);
        }
      } else if (e.key === "ArrowRight") {
        if (hasNext) {
          e.preventDefault();
          setSelectedStudentId(students[currentStudentIndex + 1].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasPrevious, hasNext, currentStudentIndex, students]);

  // Derived Fee & Scholarship Calculation for Active Student
  const studentFeeInfo = useMemo(() => {
    if (!activeStudent) return null;
    const sId = activeStudent.student?.id || activeStudent.id;
    const roll = activeStudent.classRoll || 1;
    const rollKey = `roll_${roll}`;

    const baseTuition = 2500;
    const examFee = 800;
    const labFee = 500;

    const assignedWaiver = waivers[sId] || waivers[activeStudent.id] || waivers[rollKey];
    const waiverCalc = calculateStudentWaiver(assignedWaiver, baseTuition, examFee + labFee, roll);

    const existingRecord = feeRecords[sId] || feeRecords[activeStudent.id];
    const totalPayable = Math.max(0, baseTuition + examFee + labFee - waiverCalc.waiverAmount);

    let defaultPaid = totalPayable;
    if (roll % 4 === 0) defaultPaid = 0;
    else if (roll % 3 === 0) defaultPaid = Math.floor(totalPayable * 0.5);

    const paidAmount = existingRecord?.paidAmount ?? defaultPaid;
    const dueAmount = Math.max(0, totalPayable - paidAmount);
    const isExamCleared = existingRecord?.isExamCleared ?? (dueAmount === 0 || paidAmount >= totalPayable * 0.5);

    return {
      tuitionFee: baseTuition,
      examFee,
      labFee,
      waiverAmount: waiverCalc.waiverAmount,
      waiverTitle: waiverCalc.waiverTitle,
      waiverPercentage: waiverCalc.waiverPercentage,
      isSpecialScholarship: waiverCalc.isSpecialScholarship,
      totalPayable,
      paidAmount,
      dueAmount,
      isExamCleared,
      status: dueAmount === 0 && totalPayable > 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "DUE",
      lastPaymentMethod: existingRecord?.lastPaymentMethod || "bKash MFS",
      lastTransactionId: existingRecord?.lastTransactionId || `TRX-${90000 + roll * 11}`,
      lastPaymentDate: existingRecord?.lastPaymentDate || "2026-10-02",
    };
  }, [activeStudent, waivers, feeRecords]);

  // Realistic NCTB Exam Results for Active Student
  const studentResultInfo = useMemo(() => {
    if (!activeStudent) return null;
    const roll = activeStudent.classRoll || 1;

    // Deterministic realistic marks based on roll
    const marksOffset = Math.max(0, 10 - roll);
    const bangla = Math.min(100, 75 + marksOffset * 2);
    const english = Math.min(100, 72 + marksOffset * 2);
    const math = Math.min(100, 80 + marksOffset * 2);
    const science = Math.min(100, 78 + marksOffset * 2);
    const religion = Math.min(100, 84 + marksOffset);
    const ict = Math.min(50, 42 + Math.min(8, marksOffset));

    const totalMarks = bangla + english + math + science + religion + ict;
    const maxMarks = 550;
    const percentage = ((totalMarks / maxMarks) * 100).toFixed(1);

    const isTopStudent = roll <= 3;
    const gpa = isTopStudent ? 5.00 : roll <= 10 ? 4.75 : 4.25;
    const letterGrade = gpa === 5.00 ? "A+" : gpa >= 4.0 ? "A" : "A-";

    const subjects = [
      { code: "101", name: "Bangla", fullMarks: 100, cq: Math.round(bangla * 0.7), mcq: Math.round(bangla * 0.3), total: bangla, grade: bangla >= 80 ? "A+" : "A", gpa: bangla >= 80 ? 5.0 : 4.0 },
      { code: "107", name: "English", fullMarks: 100, cq: Math.round(english * 0.75), mcq: Math.round(english * 0.25), total: english, grade: english >= 80 ? "A+" : "A", gpa: english >= 80 ? 5.0 : 4.0 },
      { code: "109", name: "Mathematics", fullMarks: 100, cq: Math.round(math * 0.7), mcq: Math.round(math * 0.3), total: math, grade: math >= 80 ? "A+" : "A", gpa: math >= 80 ? 5.0 : 4.0 },
      { code: "127", name: activeStudent.groupType === "SCIENCE" ? "Higher Physics & Chemistry" : "General Science", fullMarks: 100, cq: Math.round(science * 0.5), mcq: Math.round(science * 0.25), practical: Math.round(science * 0.25), total: science, grade: science >= 80 ? "A+" : "A", gpa: science >= 80 ? 5.0 : 4.0 },
      { code: "111", name: "Islam & Moral Education", fullMarks: 100, cq: Math.round(religion * 0.7), mcq: Math.round(religion * 0.3), total: religion, grade: "A+", gpa: 5.0 },
      { code: "154", name: "Information & Communication Tech (ICT)", fullMarks: 50, cq: Math.round(ict * 0.5), mcq: Math.round(ict * 0.5), total: ict, grade: "A+", gpa: 5.0 },
    ];

    return {
      termName: "Second Term Summative Assessment 2026",
      gpa,
      letterGrade,
      totalMarks,
      maxMarks,
      percentage,
      classRank: roll,
      isPassed: true,
      subjects,
    };
  }, [activeStudent]);

  interface SubjectItem {
    id: string;
    code: string;
    name: string;
    nameBn: string;
    type: "MANDATORY" | "GROUP_ELECTIVE" | "OPTIONAL_4TH";
    fullMarks: number;
    cqMarks: number;
    mcqMarks: number;
    practicalMarks: number;
    passMarks: number;
    instructor: string;
    schedule: string;
    boardStatus: string;
  }

  // Subject List helpers
  const getSubjectBangla = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes("bangla 1")) return "বাংলা ১ম পত্র";
    if (n.includes("bangla 2")) return "বাংলা ২য় পত্র";
    if (n.includes("bangla")) return "বাংলা";
    if (n.includes("english 1")) return "ইংরেজি ১ম পত্র";
    if (n.includes("english 2")) return "ইংরেজি ২য় পত্র";
    if (n.includes("english")) return "ইংরেজি";
    if (n.includes("math") && n.includes("higher")) return "উচ্চতর গণিত";
    if (n.includes("math")) return "সাধারণ গণিত";
    if (n.includes("physics")) return "পদার্থবিজ্ঞান";
    if (n.includes("chem")) return "রসায়ন";
    if (n.includes("bio")) return "জীববিজ্ঞান";
    if (n.includes("ict") || n.includes("information")) return "তথ্য ও যোগাযোগ প্রযুক্তি";
    if (n.includes("islam") || n.includes("moral")) return "ইসলাম ও নৈতিক শিক্ষা";
    if (n.includes("account")) return "হিসাববিজ্ঞান";
    if (n.includes("finance")) return "ফিন্যান্স ও ব্যাংকিং";
    if (n.includes("business")) return "ব্যবসায় উদ্যোগ";
    if (n.includes("agri")) return "কৃষিশিক্ষা";
    if (n.includes("history")) return "বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা";
    if (n.includes("geography")) return "ভূগোল ও পরিবেশ";
    if (n.includes("civics")) return "পৌরনীতি ও নাগরিকতা";
    if (n.includes("science")) return "সাধারণ বিজ্ঞান";
    return name;
  };

  const getSubjectTeacher = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes("bangla")) return "Abdur Rahim Sarker (Senior Teacher)";
    if (n.includes("english 1")) return "Fatima Tuz Zohra (Assistant Teacher)";
    if (n.includes("english")) return "Mohammad Jahangir Hossain (Vice Principal)";
    if (n.includes("math") && n.includes("higher")) return "Nasrin Akhter (Senior Teacher)";
    if (n.includes("math")) return "Nasrin Akhter (Senior Teacher)";
    if (n.includes("physics")) return "Prof. A. K. M. Shamsuddin (Principal)";
    if (n.includes("chem") || n.includes("bio")) return "Dr. Shamima Nasrin (Assistant Teacher)";
    if (n.includes("ict") || n.includes("information")) return "Engr. Tanvir Ahmed (Assistant Teacher)";
    if (n.includes("islam") || n.includes("moral")) return "Mawlana Abdul Matin (Senior Teacher)";
    if (n.includes("account") || n.includes("finance")) return "Rezaul Karim (Senior Teacher)";
    return "Course Instructor";
  };

  // Student identification key for photo and subject persistence
  const currentStudentKey = activeStudent
    ? activeStudent.student?.id || activeStudent.id || activeStudent.student?.studentIdNo || `student_${activeStudent.classRoll}`
    : "";
  const currentPhoto = currentStudentKey ? studentPhotos[currentStudentKey] : "";

  // Preset student avatars
  const PRESET_AVATARS = [
    { id: "boy1", label: "Boy Scholar 1", url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80" },
    { id: "girl1", label: "Girl Scholar 1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80" },
    { id: "boy2", label: "Boy Student 2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80" },
    { id: "girl2", label: "Girl Student 2", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80" },
    { id: "boy3", label: "Boy Graduate 3", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80" },
    { id: "girl3", label: "Girl Graduate 3", url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80" },
  ];

  // Standard NCTB subjects available for elective / 4th subject swap
  const standardNctbSubjects = [
    { code: "126", name: "Higher Mathematics", nameBn: "উচ্চতর গণিত", defaultType: "OPTIONAL_4TH" },
    { code: "134", name: "Agriculture Studies", nameBn: "কৃষিশিক্ষা", defaultType: "OPTIONAL_4TH" },
    { code: "138", name: "Biology", nameBn: "জীববিজ্ঞান", defaultType: "GROUP_ELECTIVE" },
    { code: "151", name: "Home Science", nameBn: "গার্হস্থ্য বিজ্ঞান", defaultType: "OPTIONAL_4TH" },
    { code: "154", name: "Information & Communication Tech (ICT)", nameBn: "তথ্য ও যোগাযোগ প্রযুক্তি", defaultType: "MANDATORY" },
    { code: "136", name: "Physics", nameBn: "পদার্থবিজ্ঞান", defaultType: "GROUP_ELECTIVE" },
    { code: "137", name: "Chemistry", nameBn: "রসায়ন", defaultType: "GROUP_ELECTIVE" },
    { code: "146", name: "Accounting", nameBn: "হিসাববিজ্ঞান", defaultType: "GROUP_ELECTIVE" },
    { code: "152", name: "Finance & Banking", nameBn: "ফিন্যান্স ও ব্যাংকিং", defaultType: "GROUP_ELECTIVE" },
    { code: "143", name: "Business Entrepreneurship", nameBn: "ব্যবসায় উদ্যোগ", defaultType: "GROUP_ELECTIVE" },
    { code: "141", name: "Economics", nameBn: "অর্থনীতি", defaultType: "GROUP_ELECTIVE" },
    { code: "153", name: "History of Bangladesh & World Civ.", nameBn: "বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা", defaultType: "GROUP_ELECTIVE" },
    { code: "110", name: "Geography & Environment", nameBn: "ভূগোল ও পরিবেশ", defaultType: "GROUP_ELECTIVE" },
    { code: "140", name: "Civics & Citizenship", nameBn: "পৌরনীতি ও নাগরিকতা", defaultType: "GROUP_ELECTIVE" },
    { code: "127", name: "General Science", nameBn: "সাধারণ বিজ্ঞান", defaultType: "MANDATORY" },
    { code: "129", name: "Statistics", nameBn: "পরিসংখ্যান", defaultType: "OPTIONAL_4TH" },
    { code: "148", name: "Islamic History", nameBn: "ইসলামের ইতিহাস", defaultType: "GROUP_ELECTIVE" },
    { code: "149", name: "Music & Cultural Arts", nameBn: "সংগীত ও সাংস্কৃতিক শিক্ষা", defaultType: "OPTIONAL_4TH" },
  ];

  // Photo action handlers
  const handleSavePhoto = (photoUrl: string) => {
    if (!currentStudentKey) return;
    const updated = { ...studentPhotos, [currentStudentKey]: photoUrl };
    setStudentPhotos(updated);
    try {
      localStorage.setItem("nctb_student_photos_v1", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setIsPhotoModalOpen(false);
    setTempPhotoUrl("");
  };

  const handleRemovePhoto = () => {
    if (!currentStudentKey) return;
    const updated = { ...studentPhotos };
    delete updated[currentStudentKey];
    setStudentPhotos(updated);
    try {
      localStorage.setItem("nctb_student_photos_v1", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setIsPhotoModalOpen(false);
    setTempPhotoUrl("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setTempPhotoUrl(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // NCTB Curriculum Registered Subjects for Active Student
  const studentSubjectList: SubjectItem[] = useMemo(() => {
    if (!activeStudent) return [];

    // Check if customized subjects exist in customSubjectsMap for this student
    const studentKey = activeStudent.student?.id || activeStudent.id || activeStudent.student?.studentIdNo || `student_${activeStudent.classRoll}`;
    if (studentKey && customSubjectsMap[studentKey] && customSubjectsMap[studentKey].length > 0) {
      return customSubjectsMap[studentKey];
    }

    // If database allocations exist
    if (activeStudent.allocations && activeStudent.allocations.length > 0) {
      return activeStudent.allocations.map((alloc: any, idx: number) => {
        const code = alloc.subject?.subjectCode || `10${idx + 1}`;
        const name = alloc.subject?.name || "Subject";
        const type: "MANDATORY" | "GROUP_ELECTIVE" | "OPTIONAL_4TH" =
          alloc.subjectType || "MANDATORY";

        const isICT =
          code === "154" ||
          name.toLowerCase().includes("ict") ||
          name.toLowerCase().includes("information");
        const hasPrac =
          name.toLowerCase().includes("physics") ||
          name.toLowerCase().includes("chemistry") ||
          name.toLowerCase().includes("biology") ||
          name.toLowerCase().includes("science") ||
          name.toLowerCase().includes("agriculture") ||
          name.toLowerCase().includes("geography");

        const fullMarks = isICT ? 50 : 100;
        const cqMarks = isICT ? 25 : hasPrac ? 50 : 70;
        const mcqMarks = isICT ? 25 : hasPrac ? 25 : 30;
        const practicalMarks = hasPrac ? 25 : 0;
        const passMarks = isICT ? 17 : 33;

        return {
          id: alloc.id || `alloc_${idx}`,
          code,
          name,
          nameBn: getSubjectBangla(name),
          type,
          fullMarks,
          cqMarks,
          mcqMarks,
          practicalMarks,
          passMarks,
          instructor: getSubjectTeacher(name),
          schedule: `Period ${(idx % 6) + 1} • ${(idx % 2 === 0 ? "Sun, Tue, Thu" : "Mon, Wed, Thu")}`,
          boardStatus: "APPROVED",
        };
      });
    }

    // Default NCTB Standard Subject Roster by Academic Group
    const group = (activeStudent.groupType || "SCIENCE").toUpperCase();
    const isScience = group === "SCIENCE";
    const isCommerce = group === "BUSINESS_STUDIES" || group === "COMMERCE";

    const compulsory = [
      { id: "s1", code: "101", name: "Bangla 1st Paper", nameBn: "বাংলা ১ম পত্র", type: "MANDATORY" as const, fullMarks: 100, cqMarks: 70, mcqMarks: 30, practicalMarks: 0, passMarks: 33, instructor: "Abdur Rahim Sarker", schedule: "Period 1 • 09:30 AM (Sun-Thu)", boardStatus: "APPROVED" },
      { id: "s2", code: "102", name: "Bangla 2nd Paper", nameBn: "বাংলা ২য় পত্র", type: "MANDATORY" as const, fullMarks: 100, cqMarks: 70, mcqMarks: 30, practicalMarks: 0, passMarks: 33, instructor: "Abdur Rahim Sarker", schedule: "Period 2 • 10:15 AM (Sun-Thu)", boardStatus: "APPROVED" },
      { id: "s3", code: "107", name: "English 1st Paper", nameBn: "ইংরেজি ১ম পত্র", type: "MANDATORY" as const, fullMarks: 100, cqMarks: 75, mcqMarks: 25, practicalMarks: 0, passMarks: 33, instructor: "Fatima Tuz Zohra", schedule: "Period 3 • 11:00 AM (Sun-Thu)", boardStatus: "APPROVED" },
      { id: "s4", code: "108", name: "English 2nd Paper", nameBn: "ইংরেজি ২য় পত্র", type: "MANDATORY" as const, fullMarks: 100, cqMarks: 75, mcqMarks: 25, practicalMarks: 0, passMarks: 33, instructor: "Mohammad Jahangir Hossain", schedule: "Period 4 • 11:45 AM (Sun-Thu)", boardStatus: "APPROVED" },
      { id: "s5", code: "109", name: "General Mathematics", nameBn: "সাধারণ গণিত", type: "MANDATORY" as const, fullMarks: 100, cqMarks: 70, mcqMarks: 30, practicalMarks: 0, passMarks: 33, instructor: "Nasrin Akhter", schedule: "Period 5 • 12:45 PM (Sun-Thu)", boardStatus: "APPROVED" },
      { id: "s6", code: "111", name: "Islam & Moral Education", nameBn: "ইসলাম ও নৈতিক শিক্ষা", type: "MANDATORY" as const, fullMarks: 100, cqMarks: 70, mcqMarks: 30, practicalMarks: 0, passMarks: 33, instructor: "Mawlana Abdul Matin", schedule: "Period 6 • 01:30 PM (Sun-Thu)", boardStatus: "APPROVED" },
      { id: "s7", code: "154", name: "Information & Communication Tech (ICT)", nameBn: "তথ্য ও যোগাযোগ প্রযুক্তি", type: "MANDATORY" as const, fullMarks: 50, cqMarks: 25, mcqMarks: 25, practicalMarks: 0, passMarks: 17, instructor: "Engr. Tanvir Ahmed", schedule: "Period 4 • 11:45 AM (Sun, Tue)", boardStatus: "APPROVED" },
    ];

    let electives: any[] = [];
    let optional4th: any = null;

    if (isScience) {
      electives = [
        { id: "s8", code: "136", name: "Physics", nameBn: "পদার্থবিজ্ঞান", type: "GROUP_ELECTIVE" as const, fullMarks: 100, cqMarks: 50, mcqMarks: 25, practicalMarks: 25, passMarks: 33, instructor: "Prof. A. K. M. Shamsuddin", schedule: "Period 2 • 10:15 AM (Sun, Tue, Thu)", boardStatus: "APPROVED" },
        { id: "s9", code: "137", name: "Chemistry", nameBn: "রসায়ন", type: "GROUP_ELECTIVE" as const, fullMarks: 100, cqMarks: 50, mcqMarks: 25, practicalMarks: 25, passMarks: 33, instructor: "Dr. Shamima Nasrin", schedule: "Period 3 • 11:00 AM (Mon, Wed, Thu)", boardStatus: "APPROVED" },
        { id: "s10", code: "138", name: "Biology", nameBn: "জীববিজ্ঞান", type: "GROUP_ELECTIVE" as const, fullMarks: 100, cqMarks: 50, mcqMarks: 25, practicalMarks: 25, passMarks: 33, instructor: "Dr. Shamima Nasrin", schedule: "Period 5 • 12:45 PM (Sun, Tue, Thu)", boardStatus: "APPROVED" },
      ];
      optional4th = { id: "s11", code: "126", name: "Higher Mathematics", nameBn: "উচ্চতর গণিত", type: "OPTIONAL_4TH" as const, fullMarks: 100, cqMarks: 50, mcqMarks: 25, practicalMarks: 25, passMarks: 33, instructor: "Nasrin Akhter", schedule: "Period 6 • 01:30 PM (Mon, Wed, Thu)", boardStatus: "APPROVED" };
    } else if (isCommerce) {
      electives = [
        { id: "s8", code: "146", name: "Accounting", nameBn: "হিসাববিজ্ঞান", type: "GROUP_ELECTIVE" as const, fullMarks: 100, cqMarks: 70, mcqMarks: 30, practicalMarks: 0, passMarks: 33, instructor: "Rezaul Karim", schedule: "Period 2 • 10:15 AM (Sun, Tue, Thu)", boardStatus: "APPROVED" },
        { id: "s9", code: "152", name: "Finance & Banking", nameBn: "ফিন্যান্স ও ব্যাংকিং", type: "GROUP_ELECTIVE" as const, fullMarks: 100, cqMarks: 70, mcqMarks: 30, practicalMarks: 0, passMarks: 33, instructor: "Rezaul Karim", schedule: "Period 3 • 11:00 AM (Mon, Wed, Thu)", boardStatus: "APPROVED" },
        { id: "s10", code: "143", name: "Business Entrepreneurship", nameBn: "ব্যবসায় উদ্যোগ", type: "GROUP_ELECTIVE" as const, fullMarks: 100, cqMarks: 70, mcqMarks: 30, practicalMarks: 0, passMarks: 33, instructor: "Farhana Yasmin", schedule: "Period 5 • 12:45 PM (Sun, Tue, Thu)", boardStatus: "APPROVED" },
      ];
      optional4th = { id: "s11", code: "134", name: "Agriculture Studies", nameBn: "কৃষিশিক্ষা", type: "OPTIONAL_4TH" as const, fullMarks: 100, cqMarks: 50, mcqMarks: 25, practicalMarks: 25, passMarks: 33, instructor: "Sabbir Hossain", schedule: "Period 6 • 01:30 PM (Mon, Wed, Thu)", boardStatus: "APPROVED" };
    } else {
      electives = [
        { id: "s8", code: "153", name: "History of Bangladesh & World Civ.", nameBn: "বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা", type: "GROUP_ELECTIVE" as const, fullMarks: 100, cqMarks: 70, mcqMarks: 30, practicalMarks: 0, passMarks: 33, instructor: "Rezaul Karim", schedule: "Period 2 • 10:15 AM (Sun, Tue, Thu)", boardStatus: "APPROVED" },
        { id: "s9", code: "110", name: "Geography & Environment", nameBn: "ভূগোল ও পরিবেশ", type: "GROUP_ELECTIVE" as const, fullMarks: 100, cqMarks: 50, mcqMarks: 25, practicalMarks: 25, passMarks: 33, instructor: "Fatima Tuz Zohra", schedule: "Period 3 • 11:00 AM (Mon, Wed, Thu)", boardStatus: "APPROVED" },
        { id: "s10", code: "140", name: "Civics & Citizenship", nameBn: "পৌরনীতি ও নাগরিকতা", type: "GROUP_ELECTIVE" as const, fullMarks: 100, cqMarks: 70, mcqMarks: 30, practicalMarks: 0, passMarks: 33, instructor: "Abdur Rahim Sarker", schedule: "Period 5 • 12:45 PM (Sun, Tue, Thu)", boardStatus: "APPROVED" },
      ];
      optional4th = { id: "s11", code: "134", name: "Agriculture Studies", nameBn: "কৃষিশিক্ষা", type: "OPTIONAL_4TH" as const, fullMarks: 100, cqMarks: 50, mcqMarks: 25, practicalMarks: 25, passMarks: 33, instructor: "Sabbir Hossain", schedule: "Period 6 • 01:30 PM (Mon, Wed, Thu)", boardStatus: "APPROVED" };
    }

    return [...compulsory, ...electives, optional4th];
  }, [activeStudent, customSubjectsMap]);

  // Subject Edit Action Handlers
  const openEditSubjectModal = (sub: SubjectItem) => {
    setEditingSubject(sub);
    setSubjectForm({
      code: sub.code,
      name: sub.name,
      nameBn: sub.nameBn,
      type: sub.type,
    });
    setIsEditSubjectModalOpen(true);
  };

  const handleSaveSubjectChanges = () => {
    if (!currentStudentKey || !editingSubject) return;
    const currentList = [...studentSubjectList];
    const targetIdx = currentList.findIndex((s) => s.id === editingSubject.id || s.code === editingSubject.code);

    const isICT = subjectForm.code === "154" || subjectForm.name.toLowerCase().includes("ict");
    const hasPrac =
      subjectForm.name.toLowerCase().includes("physics") ||
      subjectForm.name.toLowerCase().includes("chem") ||
      subjectForm.name.toLowerCase().includes("bio") ||
      subjectForm.name.toLowerCase().includes("higher math") ||
      subjectForm.name.toLowerCase().includes("agri") ||
      subjectForm.name.toLowerCase().includes("geo");

    const fullMarks = isICT ? 50 : 100;
    const cqMarks = isICT ? 25 : hasPrac ? 50 : 70;
    const mcqMarks = isICT ? 25 : hasPrac ? 25 : 30;
    const practicalMarks = hasPrac ? 25 : 0;
    const passMarks = isICT ? 17 : 33;

    const updatedSubject: SubjectItem = {
      ...editingSubject,
      code: subjectForm.code.trim() || editingSubject.code,
      name: subjectForm.name.trim() || editingSubject.name,
      nameBn: subjectForm.nameBn.trim() || getSubjectBangla(subjectForm.name.trim()),
      type: subjectForm.type,
      fullMarks,
      cqMarks,
      mcqMarks,
      practicalMarks,
      passMarks,
      instructor: getSubjectTeacher(subjectForm.name.trim() || editingSubject.name),
    };

    let updatedList: SubjectItem[];
    if (targetIdx >= 0) {
      updatedList = [...currentList];
      updatedList[targetIdx] = updatedSubject;
    } else {
      updatedList = [...currentList, updatedSubject];
    }

    const newMap = { ...customSubjectsMap, [currentStudentKey]: updatedList };
    setCustomSubjectsMap(newMap);
    try {
      localStorage.setItem("nctb_student_custom_subjects_v1", JSON.stringify(newMap));
    } catch (e) {
      console.error(e);
    }
    setIsEditSubjectModalOpen(false);
    setEditingSubject(null);
  };

  const handleResetSubjects = () => {
    if (!currentStudentKey) return;
    const newMap = { ...customSubjectsMap };
    delete newMap[currentStudentKey];
    setCustomSubjectsMap(newMap);
    try {
      localStorage.setItem("nctb_student_custom_subjects_v1", JSON.stringify(newMap));
    } catch (e) {
      console.error(e);
    }
    setIsEditSubjectModalOpen(false);
    setEditingSubject(null);
  };

  const filteredSubjectList: SubjectItem[] = useMemo(() => {
    if (subjectFilter === "ALL") return studentSubjectList;
    return studentSubjectList.filter((s: SubjectItem) => s.type === subjectFilter);
  }, [studentSubjectList, subjectFilter]);

  const subjectStats = useMemo(() => {
    const total = studentSubjectList.length;
    const compulsory = studentSubjectList.filter((s: SubjectItem) => s.type === "MANDATORY").length;
    const electives = studentSubjectList.filter((s: SubjectItem) => s.type === "GROUP_ELECTIVE").length;
    const optional = studentSubjectList.filter((s: SubjectItem) => s.type === "OPTIONAL_4TH").length;
    const totalFullMarks = studentSubjectList.reduce((acc: number, s: SubjectItem) => acc + s.fullMarks, 0);
    return { total, compulsory, electives, optional, totalFullMarks };
  }, [studentSubjectList]);

  // Notice List
  const notices = useMemo(() => {
    return [
      {
        id: "not_001",
        title: "Second Term Examination Routine & Seat Plan Published",
        category: "EXAM",
        date: "2026-10-06",
        publisher: "Office of the Controller of Examinations",
        important: true,
        summary: "The formal examination routine for Class 10 Model Assessment has been published. Students are instructed to collect their verified admit card by clearing monthly tuition dues.",
      },
      {
        id: "not_002",
        title: "Monthly Tuition Fee & Waiver Reconciliation for October 2026",
        category: "ACCOUNTS",
        date: "2026-10-04",
        publisher: "Accounts & Bursar Office",
        important: false,
        summary: "All enrolled students and guardians are reminded to verify tuition ledgers. Special Merit Scholarship deductions have been auto-credited to the ledger.",
      },
      {
        id: "not_003",
        title: "Institutional Merit Scholarship Allocation Notice",
        category: "SCHOLARSHIP",
        date: "2026-10-02",
        publisher: "Headmaster & School Managing Committee (SMC)",
        important: true,
        summary: "Notice of 100% Full Free & 50% Half Free Merit Scholarships granted to top rank holders following evaluation guidelines.",
      },
      {
        id: "not_004",
        title: "Official Autumn & Durga Puja Institutional Vacation Schedule",
        category: "HOLIDAY",
        date: "2026-09-29",
        publisher: "Academic Council",
        important: false,
        summary: "School academic classes and administration will remain closed from October 18 to October 24 for the annual autumn holidays.",
      },
      {
        id: "not_005",
        title: "National Science Practical Fair & ICT Olympiad Participation",
        category: "CO_CURRICULAR",
        date: "2026-09-25",
        publisher: "Science & Technology Club",
        important: false,
        summary: "Enrollment is open for students of Science and General groups to participate in the upcoming Regional Inter-School Science Fair.",
      },
    ];
  }, []);

  const filteredNotices = useMemo(() => {
    if (noticeCategory === "ALL") return notices;
    return notices.filter((n) => n.category === noticeCategory);
  }, [notices, noticeCategory]);

  const studentInitials = `${activeStudent?.student?.firstName?.[0] || "S"}${activeStudent?.student?.lastName?.[0] || ""}`;
  const studentFullName = `${activeStudent?.student?.firstName || ""} ${activeStudent?.student?.lastName || ""}`.trim();
  const studentGroupLabel = activeStudent?.groupType
    ? formatGroupName(activeStudent.groupType)
    : activeStudent?.section?.groupType
      ? formatGroupName(activeStudent.section.groupType)
      : "General";

  const profileStatTiles = activeStudent
    ? [
        {
          label: "Exam GPA",
          value: `${studentResultInfo?.gpa.toFixed(2) ?? "—"} (${studentResultInfo?.letterGrade ?? "—"})`,
          color: "success.main",
          bg: "success.lighter",
        },
        {
          label: "Class Rank",
          value: `#${activeStudent.classRoll}`,
          color: "info.main",
          bg: "info.lighter",
        },
        {
          label: "Fee Status",
          value: studentFeeInfo?.status || "—",
          color: studentFeeInfo?.status === "PAID" ? "success.main" : "warning.main",
          bg: studentFeeInfo?.status === "PAID" ? "success.lighter" : "warning.lighter",
        },
        {
          label: "Admit Card",
          value: studentFeeInfo?.isExamCleared ? "CLEARED" : "HOLD",
          color: studentFeeInfo?.isExamCleared ? "success.main" : "warning.main",
          bg: studentFeeInfo?.isExamCleared ? "success.lighter" : "warning.lighter",
        },
      ]
    : [];

  return (
    <StudentAdminPageShell>
      <StudentPageHeader
        heading="Student Profile"
        current="Profiles"
        action={
          <AppButton
            variant="outlined"
            color="inherit"
            onClick={() => window.print()}
            startIcon={<PrintOutlinedIcon fontSize="small" />}
            className="no-print"
          >
            Print Dossier
          </AppButton>
        }
      />

      <AppCard sx={{ mb: 2.5 }} className="no-print">
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              Find student
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                <SessionSelect value={selectedSession} onChange={(val) => setSelectedSession(val)} label="Session" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                <AppSelect
                  label="Class"
                  value={selectedClassId}
                  onChange={(val) => {
                    setSelectedClassId(val);
                    setSelectedSectionId("");
                  }}
                  options={classes.map((cls) => ({ value: cls.id, label: cls.name }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                <AppSelect
                  label="Shift"
                  value={selectedShift}
                  onChange={(val) => {
                    setSelectedShift(val);
                    setSelectedSectionId("");
                  }}
                  options={[
                    { value: "ALL", label: "All Shifts" },
                    { value: "MORNING", label: "Morning" },
                    { value: "DAY", label: "Day" },
                  ]}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                <AppSelect
                  label="Group"
                  value={selectedGroup}
                  onChange={(val) => {
                    setSelectedGroup(val);
                    setSelectedSectionId("");
                  }}
                  options={[
                    { value: "ALL", label: "All Groups" },
                    { value: "SCIENCE", label: "Science" },
                    { value: "HUMANITIES", label: "Humanities" },
                    { value: "BUSINESS_STUDIES", label: "Business Studies" },
                    { value: "GENERAL", label: "General" },
                  ]}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                <AppSelect
                  label="Section"
                  value={selectedSectionId}
                  onChange={setSelectedSectionId}
                  options={[
                    { value: "", label: "All Sections" },
                    ...availableSections.map((sec: any) => {
                      const namePrefix = sec.name?.toLowerCase().startsWith("section") ? sec.name : `Section ${sec.name}`;
                      const groupPart = sec.groupType && sec.groupType !== "GENERAL" ? ` (${sec.groupType})` : "";
                      const shiftPart = sec.shift ? ` • ${sec.shift}` : " • Day";
                      return { value: sec.id, label: `${namePrefix}${groupPart}${shiftPart}` };
                    }),
                  ]}
                />
              </Grid>
            </Grid>
          </Box>

          {students.length > 0 && (
            <>
              <Divider />
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                sx={{ alignItems: { xs: "stretch", md: "center" }, justifyContent: "space-between" }}
              >
                <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
                  <AppButton
                    type="button"
                    variant="outlined"
                    color="inherit"
                    size="small"
                    onClick={handlePreviousStudent}
                    disabled={!hasPrevious}
                    startIcon={<ChevronLeftIcon fontSize="small" />}
                  >
                    Previous
                  </AppButton>

                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 1.5,
                      bgcolor: "grey.50",
                      border: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "success.main", fontWeight: 700, fontFamily: "monospace" }}>
                      Roll #{activeStudent?.classRoll ?? "—"}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      •
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {currentStudentIndex >= 0 ? currentStudentIndex + 1 : 1} of {students.length}
                    </Typography>
                  </Box>

                  <AppButton
                    type="button"
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={handleNextStudent}
                    disabled={!hasNext}
                    endIcon={<ChevronRightIcon fontSize="small" />}
                  >
                    Next
                  </AppButton>
                </Stack>

                <AppTextField
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Jump to roll or name…"
                  startIcon={<SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />}
                  sx={{ maxWidth: { xs: "100%", md: 260 } }}
                />
              </Stack>
            </>
          )}
        </Stack>
      </AppCard>

      {!activeStudent ? (
        <AppCard>
          <EmptyContent
            title="No student selected"
            description="Choose a session, class, and section above to open a student profile."
          />
        </AppCard>
      ) : (
        <>
          <AppCard sx={{ mb: 2.5, overflow: "hidden" }}>
            <Stack spacing={2.5}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2.5}
                sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between" }}
              >
                <Stack direction="row" spacing={2} sx={{ minWidth: 0, alignItems: "center" }}>
                  <Box sx={{ position: "relative", flexShrink: 0 }}>
                    <Avatar
                      src={currentPhoto || undefined}
                      alt={studentFullName || "Student"}
                      variant="rounded"
                      sx={{
                        width: 72,
                        height: 72,
                        fontSize: 22,
                        fontWeight: 800,
                        bgcolor: "success.main",
                        border: "2px solid",
                        borderColor: "success.light",
                      }}
                    >
                      {studentInitials}
                    </Avatar>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setTempPhotoUrl(currentPhoto || "");
                        setIsPhotoModalOpen(true);
                      }}
                      aria-label="Change profile photo"
                      sx={{
                        position: "absolute",
                        right: -6,
                        bottom: -6,
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                        boxShadow: 1,
                        "&:hover": { bgcolor: "success.lighter" },
                      }}
                    >
                      <PhotoCameraOutlinedIcon sx={{ fontSize: 16, color: "success.main" }} />
                    </IconButton>
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ mb: 0.75, alignItems: "center", flexWrap: "wrap" }}>
                      <Typography variant="h5" noWrap sx={{ fontWeight: 800 }}>
                        {studentFullName || "Student"}
                      </Typography>
                      <Label color="success" variant="soft">
                        Active
                      </Label>
                      {studentFeeInfo?.isSpecialScholarship && (
                        <Label color="warning" variant="soft" startIcon={<Sparkles className="w-3 h-3" />}>
                          {studentFeeInfo.waiverTitle}
                        </Label>
                      )}
                    </Stack>

                    <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
                      <Typography variant="caption" color="text.primary" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                        ID {activeStudent.student?.studentIdNo || "N/A"}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        •
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Roll <Box component="span" sx={{ fontFamily: "monospace" }}>{activeStudent.classRoll}</Box>
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        •
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activeStudent.class?.name || "—"}
                        {activeStudent.section?.name ? ` · Sec ${activeStudent.section.name}` : ""}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        •
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {studentGroupLabel}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={0.75} className="no-print" sx={{ alignSelf: { xs: "stretch", md: "flex-start" }, alignItems: "center" }}>
                  <IconButton
                    size="small"
                    onClick={handlePreviousStudent}
                    disabled={!hasPrevious}
                    aria-label="Previous student"
                    sx={{ border: "1px solid", borderColor: "divider" }}
                  >
                    <ChevronLeftIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 48, textAlign: "center", fontWeight: 700, fontFamily: "monospace" }}>
                    {currentStudentIndex >= 0 ? currentStudentIndex + 1 : 1}/{students.length}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={handleNextStudent}
                    disabled={!hasNext}
                    aria-label="Next student"
                    sx={{ border: "1px solid", borderColor: "divider", bgcolor: "success.main", color: "common.white", "&:hover": { bgcolor: "success.dark" }, "&.Mui-disabled": { bgcolor: "action.disabledBackground" } }}
                  >
                    <ChevronRightIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>

              <Grid container spacing={1.5}>
                {profileStatTiles.map((tile) => (
                  <Grid key={tile.label} size={{ xs: 6, sm: 3 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: tile.bg,
                        textAlign: "center",
                        height: 1,
                      }}
                    >
                      <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: 0.4, display: "block", mb: 0.5, color: tile.color, fontWeight: 700 }}>
                        {tile.label}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ lineHeight: 1.2, color: tile.color, fontWeight: 800, fontFamily: "monospace" }}>
                        {tile.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <AppTabs
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as "PROFILE" | "RESULT" | "FEE_STATUS" | "NOTICE" | "SUBJECT_LIST")
                }
                className="no-print"
                items={[
                  { value: "PROFILE", label: "Profile" },
                  { value: "RESULT", label: "Results" },
                  { value: "FEE_STATUS", label: "Fees" },
                  { value: "NOTICE", label: `Notices (${notices.length})` },
                  { value: "SUBJECT_LIST", label: `Subjects (${studentSubjectList.length})` },
                ]}
              />
            </Stack>
          </AppCard>

          {activeTab === "PROFILE" && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <AppCard
                  title="Academic registration"
                  action={
                    <AppButton type="button" size="small" variant="soft" color="success" onClick={() => handleOpenSectionEdit("academic")} startIcon={<EditOutlinedIcon sx={{ fontSize: 14 }} />}>
                      Edit
                    </AppButton>
                  }
                  sx={{ height: 1 }}
                >
                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Academic class</Typography>
                      <Typography variant="subtitle2">{activeStudent.class?.name || "—"}</Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Section & shift</Typography>
                      <Typography variant="subtitle2">
                        {activeStudent.section
                          ? `${activeStudent.section.name}${activeStudent.section.shift ? ` · ${activeStudent.section.shift === "MORNING" ? "Morning" : "Day"}` : ""}`
                          : "—"}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Class roll</Typography>
                      <Typography variant="subtitle2" sx={{ color: "success.main", fontFamily: "monospace" }}>
                        {activeStudent.classRoll != null ? `#${activeStudent.classRoll}` : "—"}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Student reg ID</Typography>
                      <Typography variant="subtitle2" sx={{ fontFamily: "monospace" }}>{activeStudent.student?.studentIdNo || "—"}</Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Curriculum group</Typography>
                      <Typography variant="subtitle2">{studentGroupLabel === "General" && !activeStudent.groupType && !activeStudent.section?.groupType ? "—" : studentGroupLabel}</Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Academic session</Typography>
                      <Typography variant="subtitle2">{activeStudent.academicYear?.yearName || "—"}</Typography>
                    </Grid>
                    {activeStudent.allocations?.some((a: any) => a.subjectType === "OPTIONAL_4TH") && (
                      <Grid size={12}>
                        <Divider sx={{ mb: 1.5 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Allocated 4th subject</Typography>
                        <Typography variant="subtitle2" sx={{ color: "success.dark", fontWeight: 700 }}>
                          {activeStudent.allocations.find((a: any) => a.subjectType === "OPTIONAL_4TH")?.subject?.name || "—"}
                          {activeStudent.allocations.find((a: any) => a.subjectType === "OPTIONAL_4TH")?.subject?.subjectCode
                            ? ` (${activeStudent.allocations.find((a: any) => a.subjectType === "OPTIONAL_4TH")?.subject?.subjectCode})`
                            : ""}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </AppCard>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <AppCard
                  title="Personal & bio"
                  action={
                    <AppButton type="button" size="small" variant="soft" color="success" onClick={() => handleOpenSectionEdit("personal")} startIcon={<EditOutlinedIcon sx={{ fontSize: 14 }} />}>
                      Edit
                    </AppButton>
                  }
                  sx={{ height: 1 }}
                >
                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Full name</Typography>
                      <Typography variant="subtitle2">{studentFullName || "—"}</Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Gender</Typography>
                      <Typography variant="subtitle2">{activeStudent.student?.gender || "—"}</Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Religion</Typography>
                      <Typography variant="subtitle2">{activeStudent.student?.religion || "—"}</Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Blood group</Typography>
                      <Typography variant="subtitle2" sx={{ color: "error.main", fontWeight: 700 }}>
                        {customData.bloodGroup || customData.blood_group || customData["Blood Group"] || "—"}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Date of birth</Typography>
                      <Typography variant="subtitle2" sx={{ fontFamily: "monospace" }}>
                        {customData.dob || customData.dateOfBirth || customData["Date of Birth"] || "—"}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Nationality</Typography>
                      <Typography variant="subtitle2">{customData.nationality || customData["Nationality"] || "—"}</Typography>
                    </Grid>
                    <Grid size={12}>
                      <Divider sx={{ mb: 1.5 }} />
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                          <Avatar
                            src={currentPhoto || undefined}
                            variant="rounded"
                            sx={{ width: 40, height: 40, bgcolor: "grey.100", color: "text.disabled" }}
                          >
                            <ImageIcon className="w-4 h-4" />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">Profile picture</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {currentPhoto ? "Custom photo active" : "Default initials avatar"}
                            </Typography>
                          </Box>
                        </Stack>
                        <AppButton
                          type="button"
                          size="small"
                          variant="soft"
                          color="success"
                          onClick={() => {
                            setTempPhotoUrl(currentPhoto || "");
                            setIsPhotoModalOpen(true);
                          }}
                          startIcon={<PhotoCameraOutlinedIcon sx={{ fontSize: 16 }} />}
                        >
                          {currentPhoto ? "Change" : "Add photo"}
                        </AppButton>
                      </Stack>
                    </Grid>
                  </Grid>
                </AppCard>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <AppCard
                  title="Guardian & family"
                  action={
                    <AppButton type="button" size="small" variant="soft" color="success" onClick={() => handleOpenSectionEdit("guardian")} startIcon={<EditOutlinedIcon sx={{ fontSize: 14 }} />}>
                      Edit
                    </AppButton>
                  }
                  sx={{ height: 1 }}
                >
                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Primary guardian</Typography>
                      <Typography variant="subtitle2">{activeStudent.student?.guardianName || "—"}</Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Guardian phone</Typography>
                      <Typography variant="subtitle2" sx={{ color: "info.main", fontFamily: "monospace" }}>
                        {activeStudent.student?.guardianPhone || "—"}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Father&apos;s name</Typography>
                      <Typography variant="subtitle2">
                        {customData.fatherName || customData.father_name || customData["Father's Name"] || "—"}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Mother&apos;s name</Typography>
                      <Typography variant="subtitle2">
                        {customData.motherName || customData.mother_name || customData["Mother's Name"] || "—"}
                      </Typography>
                    </Grid>
                  </Grid>
                </AppCard>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <AppCard
                  title="Residential address"
                  action={
                    <AppButton type="button" size="small" variant="soft" color="success" onClick={() => handleOpenSectionEdit("address")} startIcon={<EditOutlinedIcon sx={{ fontSize: 14 }} />}>
                      Edit
                    </AppButton>
                  }
                  sx={{ height: 1 }}
                >
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Present address</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{activeStudent.student?.address || "—"}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Permanent address</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {customData.permanentAddress || customData.permanent_address || customData["Permanent Address"] || "—"}
                      </Typography>
                    </Box>
                  </Stack>
                </AppCard>
              </Grid>

              <Grid size={12}>
                <AppCard
                  title="Additional enrolled information"
                  action={
                    <AppButton type="button" size="small" variant="soft" color="inherit" onClick={() => handleOpenSectionEdit("additional")} startIcon={<EditOutlinedIcon sx={{ fontSize: 14 }} />}>
                      Edit
                    </AppButton>
                  }
                >
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block",  mb: 0.5 }}>Student status</Typography>
                      <Label color={activeStudent.student?.isActive !== false ? "success" : "error"} variant="soft">
                        {customData.studentStatus || (activeStudent.student?.isActive !== false ? "ACTIVE" : "INACTIVE")}
                      </Label>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Status date</Typography>
                      <Typography variant="subtitle2" sx={{ fontFamily: "monospace" }}>
                        {customData.statusDate || customData.status_date || "2026-10-20"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block",  mb: 0.5 }}>Category</Typography>
                      <Label
                        color={String(customData.studentCategory || customData.studentCatagory || customData.category || "General").toLowerCase() === "military" ? "warning" : "info"}
                        variant="soft"
                      >
                        {customData.studentCategory || customData.studentCatagory || customData.category || "General"}
                      </Label>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block",  mb: 0.5 }}>Services</Typography>
                      {(() => {
                        const raw = customData.service || customData.services || "None";
                        const list = String(raw).split(",").map((s) => s.trim()).filter(Boolean);
                        if (list.length === 0 || raw === "None" || raw === "-") {
                          return <Typography variant="body2" color="text.secondary">None</Typography>;
                        }
                        return (
                          <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap" }}>
                            {list.map((srv) => (
                              <Label key={srv} color={srv === "Bus" ? "info" : srv === "Hostel" ? "secondary" : "default"} variant="soft">
                                {srv}
                              </Label>
                            ))}
                          </Stack>
                        );
                      })()}
                    </Grid>
                    {Object.entries(customData)
                      .filter(([k]) => !isStandardOrInternalKey(k))
                      .map(([k, val]) => (
                        <Grid key={k} size={{ xs: 6, sm: 3 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{formatCustomFieldLabel(k)}</Typography>
                          <Typography variant="subtitle2">{String(val) || "—"}</Typography>
                        </Grid>
                      ))}
                  </Grid>
                </AppCard>
              </Grid>
            </Grid>
          )}

          {/* ========================================================
              TAB CONTENT 2: RESULT
             ======================================================== */}
          {activeTab === "RESULT" && studentResultInfo && (
            <Stack spacing={2}>
              <AppCard
                sx={{
                  bgcolor: "success.darker",
                  color: "common.white",
                  backgroundImage: "linear-gradient(135deg, #059669 0%, #0f766e 55%, #0f172a 100%)",
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between" }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>
                      Official summative evaluation
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 800 }}>
                      {studentResultInfo.termName}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.85 }}>
                      Subjects graded under NCTB regulations.
                    </Typography>
                  </Box>
                  <Stack
                    direction="row"
                    spacing={2}
                    divider={<Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.2)" }} />}
                    sx={{ px: 2, py: 1.5, borderRadius: 2, bgcolor: "rgba(255,255,255,0.1)" }}
                  >
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="caption" sx={{ opacity: 0.75, display: "block" }}>GPA</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: "monospace" }}>{studentResultInfo.gpa.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="caption" sx={{ opacity: 0.75, display: "block" }}>Grade</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>{studentResultInfo.letterGrade}</Typography>
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="caption" sx={{ opacity: 0.75, display: "block" }}>Marks</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                        {studentResultInfo.totalMarks}/{studentResultInfo.maxMarks}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </AppCard>

              <AppCard
                title="Subject-wise marks"
                action={
                  <AppButton component={Link} href="/reports/marksheet" size="small" variant="text" color="success" endIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Full marksheet
                  </AppButton>
                }
                sx={{ "& .MuiCardContent-root": { pt: 0, px: 0, pb: "0 !important" } }}
              >

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-4">Subject Name</th>
                        <th className="py-2.5 px-3 text-center">Full Marks</th>
                        <th className="py-2.5 px-3 text-center">CQ (Creative)</th>
                        <th className="py-2.5 px-3 text-center">MCQ</th>
                        <th className="py-2.5 px-3 text-right">Obtained Marks</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                        <th className="py-2.5 px-3 text-center">Grade Point</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentResultInfo.subjects.map((sub) => (
                        <tr key={sub.code} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{sub.code}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">{sub.name}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">{sub.fullMarks}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-700">{sub.cq}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-700">{sub.mcq}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{sub.total}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                              {sub.grade}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                            {sub.gpa.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                      <tr>
                        <td colSpan={5} className="py-3 px-4 text-right text-slate-800">
                          Summative Grade Point Average (GPA):
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-700 text-sm">
                          {studentResultInfo.totalMarks} Marks
                        </td>
                        <td className="py-3 px-3 text-center text-emerald-800 font-extrabold text-sm">
                          {studentResultInfo.letterGrade}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-emerald-800 font-black text-sm">
                          {studentResultInfo.gpa.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </AppCard>
            </Stack>
          )}

          {activeTab === "FEE_STATUS" && studentFeeInfo && (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                {[
                  {
                    label: "Tuition fee",
                    value: `৳ ${studentFeeInfo.tuitionFee.toLocaleString()}`,
                    hint: "Monthly rate",
                    color: "text.primary",
                    bg: "background.paper",
                  },
                  {
                    label: "Scholarship / waiver",
                    value: studentFeeInfo.waiverAmount > 0 ? `-৳ ${studentFeeInfo.waiverAmount.toLocaleString()}` : "৳ 0",
                    hint: studentFeeInfo.waiverTitle || "No special waiver",
                    color: "error.main",
                    bg: "warning.lighter",
                  },
                  {
                    label: "Amount paid",
                    value: `৳ ${studentFeeInfo.paidAmount.toLocaleString()}`,
                    hint: `Via ${studentFeeInfo.lastPaymentMethod}`,
                    color: "success.main",
                    bg: "success.lighter",
                  },
                  {
                    label: "Outstanding due",
                    value: `৳ ${studentFeeInfo.dueAmount.toLocaleString()}`,
                    hint: studentFeeInfo.dueAmount === 0 ? "All cleared" : "Pending clearance",
                    color: "error.main",
                    bg: "error.lighter",
                  },
                ].map((tile) => (
                  <Grid key={tile.label} size={{ xs: 12, sm: 6, lg: 3 }}>
                    <AppCard sx={{ bgcolor: tile.bg, height: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {tile.label}
                      </Typography>
                      <Typography variant="h5" sx={{ mt: 0.5, color: tile.color, fontWeight: 800, fontFamily: "monospace" }}>
                        {tile.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }} noWrap>
                        {tile.hint}
                      </Typography>
                    </AppCard>
                  </Grid>
                ))}
              </Grid>

              <AppCard
                title="Billing particulars & clearance"
                action={
                  <AppButton component={Link} href="/fees" size="small" variant="contained" color="success" startIcon={<CreditCard className="w-3.5 h-3.5" />}>
                    Fee management
                  </AppButton>
                }
              >

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Particulars Breakdown */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60 space-y-2 text-xs">
                    <span className="font-bold text-slate-800 block pb-1 border-b border-slate-200">
                      Fee Particulars (Active Month)
                    </span>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Monthly Tuition Fee:</span>
                      <span className="font-mono font-medium">৳ {studentFeeInfo.tuitionFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Term Assessment & Exam Fee:</span>
                      <span className="font-mono font-medium">৳ {studentFeeInfo.examFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Science Practical & Lab Fee:</span>
                      <span className="font-mono font-medium">৳ {studentFeeInfo.labFee.toLocaleString()}</span>
                    </div>
                    {studentFeeInfo.waiverAmount > 0 && (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>Less: {studentFeeInfo.waiverTitle}:</span>
                        <span className="font-mono">-৳ {studentFeeInfo.waiverAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold border-t border-slate-200 pt-1.5 text-slate-900">
                      <span>Net Total Payable:</span>
                      <span className="font-mono text-emerald-700">৳ {studentFeeInfo.totalPayable.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Payment & Exam Clearance Verification */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60 space-y-3 text-xs">
                    <span className="font-bold text-slate-800 block pb-1 border-b border-slate-200">
                      Gatekeeping & Clearance Status
                    </span>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Exam Admit Card Status</span>
                        <strong className="text-slate-900 flex items-center gap-1.5 mt-0.5">
                          {studentFeeInfo.isExamCleared ? (
                            <>
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Approved & Cleared for Exam</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-rose-600" />
                              <span className="text-rose-700 font-bold">Hold (Pending Fee Clearance)</span>
                            </>
                          )}
                        </strong>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${studentFeeInfo.isExamCleared ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                        {studentFeeInfo.isExamCleared ? "VERIFIED" : "WITHHELD"}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1">
                      <div>Last Transaction ID: <strong className="font-mono text-slate-700">{studentFeeInfo.lastTransactionId}</strong></div>
                      <div>Payment Date: <strong className="font-mono text-slate-700">{studentFeeInfo.lastPaymentDate}</strong></div>
                      <div>Payment Channel: <strong className="text-slate-700">{studentFeeInfo.lastPaymentMethod}</strong></div>
                    </div>
                  </div>
                </div>
              </AppCard>
            </Stack>
          )}

          {activeTab === "NOTICE" && (
            <Stack spacing={2}>
              <AppCard>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between" }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <NotificationsNoneOutlinedIcon sx={{ fontSize: 18, color: "warning.main" }} />
                    <Typography variant="subtitle2">
                      Notices for {activeStudent.class?.name || "selected class"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap" }}>
                    {["ALL", "EXAM", "ACCOUNTS", "SCHOLARSHIP", "HOLIDAY"].map((cat) => (
                      <AppButton
                        key={cat}
                        size="small"
                        variant="soft"
                        color={noticeCategory === cat ? "primary" : "inherit"}
                        onClick={() => setNoticeCategory(cat)}
                      >
                        {cat}
                      </AppButton>
                    ))}
                  </Stack>
                </Stack>
              </AppCard>

              {filteredNotices.map((notice) => {
                const categoryColor =
                  notice.category === "EXAM"
                    ? "info"
                    : notice.category === "ACCOUNTS"
                      ? "warning"
                      : notice.category === "SCHOLARSHIP"
                        ? "success"
                        : "default";
                return (
                  <AppCard key={notice.id}>
                    <Stack spacing={1.25}>
                      <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
                        <Stack direction="row" spacing={1} useFlexGap sx={{ minWidth: 0, alignItems: "center", flexWrap: "wrap" }}>
                          <Label color={categoryColor as any} variant="soft">{notice.category}</Label>
                          {notice.important && <Label color="error" variant="soft">Urgent</Label>}
                          <Typography variant="subtitle2">{notice.title}</Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                          {notice.date}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">{notice.summary}</Typography>
                      <Divider />
                      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                        <Typography variant="caption" color="text.secondary">
                          Issued by <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>{notice.publisher}</Box>
                        </Typography>
                        <Typography variant="caption" sx={{ cursor: "pointer", color: "success.main", fontWeight: 700 }}>
                          Download PDF
                        </Typography>
                      </Stack>
                    </Stack>
                  </AppCard>
                );
              })}
            </Stack>
          )}

          {/* ========================================================
              TAB CONTENT 5: SUBJECT LIST
             ======================================================== */}
          {activeTab === "SUBJECT_LIST" && (
            <Stack spacing={2}>
              <AppCard>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between" }}
                >
                  <Box>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ mb: 1, alignItems: "center", flexWrap: "wrap" }}>
                      <Label color="success" variant="soft" startIcon={<MenuBookOutlinedIcon sx={{ fontSize: 14 }} />}>
                        NCTB curriculum
                      </Label>
                      <Label color="default" variant="soft">{`${activeStudent.groupType || "General"} group`}</Label>
                    </Stack>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Registered subject roster
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Compulsory, group elective, and 4th optional subjects for {studentFullName || "this student"}.
                    </Typography>
                  </Box>

                <Stack direction="row" spacing={1} className="no-print" useFlexGap sx={{ flexWrap: "wrap" }}>
                  <AppButton
                    type="button"
                    variant="contained"
                    color="success"
                    onClick={() => {
                      const subjectToEdit = studentSubjectList.find((s) => s.type === "OPTIONAL_4TH") || studentSubjectList[0];
                      if (subjectToEdit) openEditSubjectModal(subjectToEdit);
                    }}
                    startIcon={<EditOutlinedIcon sx={{ fontSize: 16 }} />}
                  >
                    Change subject
                  </AppButton>
                  <AppButton
                    type="button"
                    variant="outlined"
                    color="inherit"
                    onClick={() => window.print()}
                    startIcon={<Printer className="w-3.5 h-3.5" />}
                  >
                    Print slip
                  </AppButton>
                </Stack>
                </Stack>
              </AppCard>

              <Grid container spacing={1.5}>
                {[
                  { label: "Total", value: subjectStats.total, hint: "Registered", color: "text.primary" },
                  { label: "Compulsory", value: subjectStats.compulsory, hint: "Subjects", color: "success.main" },
                  { label: "Electives", value: subjectStats.electives, hint: "Subjects", color: "info.main" },
                  { label: "4th / optional", value: subjectStats.optional, hint: "Subject", color: "warning.main" },
                  { label: "Full marks", value: subjectStats.totalFullMarks, hint: "Marks", color: "text.primary" },
                ].map((stat) => (
                  <Grid key={stat.label} size={{ xs: 6, sm: 4, md: 2.4 }}>
                    <AppCard sx={{ height: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 0.5, color: stat.color, fontWeight: 800, fontFamily: "monospace" }}>
                        {stat.value}{" "}
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {stat.hint}
                        </Typography>
                      </Typography>
                    </AppCard>
                  </Grid>
                ))}
              </Grid>

              {/* Filter Tabs */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between flex-wrap gap-2 text-xs no-print">
                <div className="flex items-center space-x-1.5 text-slate-600 font-semibold">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span>Category Filter:</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: "ALL", label: `All Subjects (${studentSubjectList.length})` },
                    { id: "MANDATORY", label: `Compulsory (${subjectStats.compulsory})` },
                    { id: "GROUP_ELECTIVE", label: `Group Electives (${subjectStats.electives})` },
                    { id: "OPTIONAL_4TH", label: `4th Subject (${subjectStats.optional})` },
                  ].map((tab) => (
                    <AppButton
                      key={tab.id}
                      type="button"
                      size="small"
                      variant="soft"
                      color={subjectFilter === tab.id ? "primary" : "inherit"}
                      onClick={() => setSubjectFilter(tab.id as any)}
                    >
                      {tab.label}
                    </AppButton>
                  ))}
                </div>
              </div>

              {/* Master Subject Table (Columns Removed: CQ, MCQ, Practical, Full Marks, Pass Mark, Teacher & Routine, Registration) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <th className="p-3.5 font-semibold text-center w-12">Sl</th>
                        <th className="p-3.5 font-semibold">Subject Code & Name</th>
                        <th className="p-3.5 font-semibold text-center">Curriculum Category</th>
                        <th className="p-3.5 font-semibold text-right pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSubjectList.map((sub: SubjectItem, idx: number) => {
                        const isMandatory = sub.type === "MANDATORY";
                        const isElective = sub.type === "GROUP_ELECTIVE";
                        const is4th = sub.type === "OPTIONAL_4TH";

                        return (
                          <tr
                            key={sub.id || sub.code || idx}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              is4th ? "bg-amber-50/40" : ""
                            }`}
                          >
                            <td className="p-3.5 text-center font-mono font-bold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center space-x-3">
                                <span className="font-mono font-bold px-2 py-1 rounded bg-slate-100 text-slate-800 text-xs shrink-0 border border-slate-200">
                                  {sub.code}
                                </span>
                                <div>
                                  <div className="font-bold text-slate-900 text-sm">{sub.name}</div>
                                  <div className="text-xs text-slate-500 font-bengali">{sub.nameBn}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 text-center whitespace-nowrap">
                              {isMandatory && (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Compulsory (আবশ্যিক)
                                </span>
                              )}
                              {isElective && (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                                  Elective (নৈর্বাচনিক)
                                </span>
                              )}
                              {is4th && (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                  <span>4th Subject (ঐচ্ছিক)</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right pr-4 whitespace-nowrap">
                              <AppButton
                                type="button"
                                size="small"
                                variant="soft"
                                color="success"
                                onClick={() => openEditSubjectModal(sub)}
                                startIcon={<Edit2 className="w-3.5 h-3.5" />}
                              >
                                Change Subject
                              </AppButton>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Box className="hidden print:grid" sx={{ gridTemplateColumns: "1fr 1fr", gap: 4, p: 4, mt: 6, pt: 6, borderTop: 1, borderColor: "divider", textAlign: "center" }}>
                  <Box>
                    <Box sx={{ borderBottom: 1, borderColor: "text.disabled", width: 176, mx: "auto", mb: 0.5 }} />
                    <Typography variant="caption" sx={{ display: "block",  fontWeight: 700 }}>Academic In-Charge / Course Advisor</Typography>
                    <Typography variant="caption" color="text.secondary">Course & Curriculum Registration</Typography>
                  </Box>
                  <Box>
                    <Box sx={{ borderBottom: 1, borderColor: "text.disabled", width: 176, mx: "auto", mb: 0.5 }} />
                    <Typography variant="caption" sx={{ display: "block",  fontWeight: 700 }}>Principal / Headmaster</Typography>
                    <Typography variant="caption" color="text.secondary">Dhaka Ideal Model High School & College</Typography>
                  </Box>
                </Box>
              </div>
            </Stack>
          )}

          {/* ========================================================
              MODAL 1: STUDENT PROFILE PICTURE UPLOAD & MANAGEMENT
             ======================================================== */}
          {isPhotoModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Camera className="w-5 h-5" />
                    <h3 className="font-bold text-sm">Manage Student Profile Picture</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPhotoModalOpen(false);
                      setTempPhotoUrl("");
                    }}
                    className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 space-y-4">
                  {/* Student Identification */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">
                        {activeStudent?.student?.firstName} {activeStudent?.student?.lastName}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Roll: #{activeStudent?.classRoll} • ID: {activeStudent?.student?.studentIdNo || "N/A"}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      {activeStudent?.class?.name}
                    </span>
                  </div>

                  {/* Photo Preview & Upload Controls */}
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative shrink-0">
                      {tempPhotoUrl || currentPhoto ? (
                        <img
                          src={tempPhotoUrl || currentPhoto}
                          alt="Preview"
                          className="w-28 h-28 rounded-2xl object-cover border-2 border-emerald-500 shadow-md ring-4 ring-emerald-50"
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-3xl shadow-md">
                          {activeStudent?.student?.firstName ? activeStudent.student.firstName[0] : "S"}
                          {activeStudent?.student?.lastName ? activeStudent.student.lastName[0] : ""}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1 w-full text-xs">
                      <label className="block font-bold text-slate-700">Upload Photo from Computer</label>
                      <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl bg-emerald-50/40 hover:bg-emerald-50 text-emerald-800 font-semibold cursor-pointer transition">
                        <Upload className="w-4 h-4 text-emerald-600" />
                        <span>Choose Image File (JPG, PNG)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400">
                        Recommended: Square passport ratio (300x300px), max size 2MB.
                      </p>
                    </div>
                  </div>

                  {/* Preset Avatar Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Or Select a Preset Student Avatar:
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {PRESET_AVATARS.map((avatar) => {
                        const isSelected = (tempPhotoUrl || currentPhoto) === avatar.url;
                        return (
                          <button
                            key={avatar.id}
                            type="button"
                            onClick={() => setTempPhotoUrl(avatar.url)}
                            className={`relative rounded-xl overflow-hidden border-2 transition cursor-pointer p-0.5 ${
                              isSelected
                                ? "border-emerald-600 ring-2 ring-emerald-300 scale-105"
                                : "border-slate-200 hover:border-slate-400"
                            }`}
                            title={avatar.label}
                          >
                            <img
                              src={avatar.url}
                              alt={avatar.label}
                              className="w-full h-12 object-cover rounded-lg"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Direct Photo URL Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Or Paste External Photo URL:
                    </label>
                    <input
                      type="text"
                      value={tempPhotoUrl}
                      onChange={(e) => setTempPhotoUrl(e.target.value)}
                      placeholder="https://example.com/student-photo.jpg"
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  {currentPhoto ? (
                    <AppButton
                      type="button"
                      size="small"
                      variant="outline"
                      color="error"
                      onClick={handleRemovePhoto}
                      startIcon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Remove Photo
                    </AppButton>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <AppButton
                      type="button"
                      variant="ghost"
                      color="inherit"
                      onClick={() => {
                        setIsPhotoModalOpen(false);
                        setTempPhotoUrl("");
                      }}
                    >
                      Cancel
                    </AppButton>
                    <AppButton
                      type="button"
                      variant="contained"
                      color="success"
                      onClick={() => {
                        if (tempPhotoUrl) handleSavePhoto(tempPhotoUrl);
                        else setIsPhotoModalOpen(false);
                      }}
                      disabled={!tempPhotoUrl && !currentPhoto}
                    >
                      Save Profile Picture
                    </AppButton>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              MODAL 2: EDIT / CHANGE STUDENT SUBJECT
             ======================================================== */}
          {isEditSubjectModalOpen && editingSubject && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Edit2 className="w-5 h-5" />
                    <h3 className="font-bold text-sm">Change / Edit Student Subject</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditSubjectModalOpen(false);
                      setEditingSubject(null);
                    }}
                    className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 space-y-4">
                  {/* Student Info Card */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Student</span>
                      <div className="font-bold text-slate-900">
                        {activeStudent?.student?.firstName} {activeStudent?.student?.lastName}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Roll #{activeStudent?.classRoll} • {activeStudent?.class?.name} ({activeStudent?.groupType} Group)
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Editing</span>
                      <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        {editingSubject.code}
                      </span>
                    </div>
                  </div>

                  {/* Quick Preset Selector from Standard NCTB Subjects */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Quick Select from Standard NCTB Subjects:
                    </label>
                    <select
                      onChange={(e) => {
                        const found = standardNctbSubjects.find((s) => s.code === e.target.value);
                        if (found) {
                          setSubjectForm({
                            code: found.code,
                            name: found.name,
                            nameBn: found.nameBn,
                            type: found.defaultType as any,
                          });
                        }
                      }}
                      defaultValue=""
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                    >
                      <option value="" disabled>-- Choose a Subject to Swap --</option>
                      <optgroup label="Common 4th / Optional Subjects">
                        <option value="126">126 - Higher Mathematics (উচ্চতর গণিত)</option>
                        <option value="134">134 - Agriculture Studies (কৃষিশিক্ষা)</option>
                        <option value="138">138 - Biology (জীববিজ্ঞান)</option>
                        <option value="151">151 - Home Science (গার্হস্থ্য বিজ্ঞান)</option>
                        <option value="129">129 - Statistics (পরিসংখ্যান)</option>
                        <option value="149">149 - Music & Cultural Arts (সংগীত)</option>
                      </optgroup>
                      <optgroup label="Group Electives & Compulsory Subjects">
                        <option value="136">136 - Physics (পদার্থবিজ্ঞান)</option>
                        <option value="137">137 - Chemistry (রসায়ন)</option>
                        <option value="146">146 - Accounting (হিসাববিজ্ঞান)</option>
                        <option value="152">152 - Finance & Banking (ফিন্যান্স ও ব্যাংকিং)</option>
                        <option value="143">143 - Business Entrepreneurship (ব্যবসায় উদ্যোগ)</option>
                        <option value="153">153 - History of Bangladesh (বাংলাদেশের ইতিহাস)</option>
                        <option value="110">110 - Geography & Environment (ভূগোল ও পরিবেশ)</option>
                        <option value="140">140 - Civics & Citizenship (পৌরনীতি ও নাগরিকতা)</option>
                        <option value="141">141 - Economics (অর্থনীতি)</option>
                        <option value="154">154 - ICT (তথ্য ও যোগাযোগ প্রযুক্তি)</option>
                        <option value="127">127 - General Science (সাধারণ বিজ্ঞান)</option>
                        <option value="148">148 - Islamic History (ইসলামের ইতিহাস)</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Subject Details Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Subject Code</label>
                      <input
                        type="text"
                        value={subjectForm.code}
                        onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                        placeholder="e.g. 126"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Curriculum Category</label>
                      <select
                        value={subjectForm.type}
                        onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                      >
                        <option value="OPTIONAL_4TH">4th Subject (ঐচ্ছিক বিষয়)</option>
                        <option value="GROUP_ELECTIVE">Group Elective (নৈর্বাচনিক)</option>
                        <option value="MANDATORY">Compulsory (আবশ্যিক)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-600 mb-1">Subject Name (English)</label>
                      <input
                        type="text"
                        value={subjectForm.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubjectForm({
                            ...subjectForm,
                            name: val,
                            nameBn: subjectForm.nameBn || getSubjectBangla(val),
                          });
                        }}
                        placeholder="e.g. Higher Mathematics"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-600 mb-1">Subject Name (Bengali)</label>
                      <input
                        type="text"
                        value={subjectForm.nameBn}
                        onChange={(e) => setSubjectForm({ ...subjectForm, nameBn: e.target.value })}
                        placeholder="e.g. উচ্চতর গণিত"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 font-bengali"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <AppButton
                    type="button"
                    size="small"
                    variant="outline"
                    onClick={handleResetSubjects}
                    title="Reset all subject customizations for this student"
                    startIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Reset to Default
                  </AppButton>

                  <div className="flex items-center gap-2">
                    <AppButton
                      type="button"
                      variant="ghost"
                      color="inherit"
                      onClick={() => {
                        setIsEditSubjectModalOpen(false);
                        setEditingSubject(null);
                      }}
                    >
                      Cancel
                    </AppButton>
                    <AppButton
                      type="button"
                      variant="contained"
                      color="success"
                      onClick={handleSaveSubjectChanges}
                      disabled={!subjectForm.name.trim() || !subjectForm.code.trim()}
                    >
                      Save Subject Changes
                    </AppButton>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              MODAL 3: SECTION EDIT MODAL (Academic, Personal, Guardian, Address)
             ======================================================== */}
          {editingSection && activeStudent && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Edit2 className="w-5 h-5" />
                    <div>
                      <h3 className="font-bold text-sm">
                        {editingSection === "academic" && "Edit Academic Registration & Class Details"}
                        {editingSection === "personal" && "Edit Personal & Bio Profile"}
                        {editingSection === "guardian" && "Edit Guardian & Family Information"}
                        {editingSection === "address" && "Edit Residential Address & Location"}
                        {editingSection === "additional" && "Edit Additional Enrolled Information"}
                      </h3>
                      <p className="text-[11px] text-emerald-100">
                        {activeStudent.student?.firstName} {activeStudent.student?.lastName || ""} • Roll #{activeStudent.classRoll}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSection(null);
                      setSectionError("");
                      setSectionSuccess("");
                    }}
                    className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Section Quick Switcher Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50 px-2 pt-2 gap-1 overflow-x-auto text-xs">
                  <AppButton
                    type="button"
                    size="small"
                    variant="soft"
                    color={editingSection === "academic" ? "primary" : "inherit"}
                    onClick={() => setEditingSection("academic")}
                    startIcon={<GraduationCap className="w-3.5 h-3.5" />}
                  >
                    Academic
                  </AppButton>
                  <AppButton
                    type="button"
                    size="small"
                    variant="soft"
                    color={editingSection === "personal" ? "primary" : "inherit"}
                    onClick={() => setEditingSection("personal")}
                    startIcon={<Heart className="w-3.5 h-3.5" />}
                  >
                    Personal
                  </AppButton>
                  <AppButton
                    type="button"
                    size="small"
                    variant="soft"
                    color={editingSection === "guardian" ? "primary" : "inherit"}
                    onClick={() => setEditingSection("guardian")}
                    startIcon={<Phone className="w-3.5 h-3.5" />}
                  >
                    Guardian
                  </AppButton>
                  <AppButton
                    type="button"
                    size="small"
                    variant="soft"
                    color={editingSection === "address" ? "primary" : "inherit"}
                    onClick={() => setEditingSection("address")}
                    startIcon={<MapPin className="w-3.5 h-3.5" />}
                  >
                    Address
                  </AppButton>
                  <AppButton
                    type="button"
                    size="small"
                    variant="soft"
                    color={editingSection === "additional" ? "primary" : "inherit"}
                    onClick={() => setEditingSection("additional")}
                    startIcon={<FileText className="w-3.5 h-3.5" />}
                  >
                    Additional
                  </AppButton>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSaveSectionEdit}>
                  <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                    {sectionError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{sectionError}</span>
                      </div>
                    )}
                    {sectionSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
                        <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>{sectionSuccess}</span>
                      </div>
                    )}

                    {/* Section 1: Academic Registration */}
                    {editingSection === "academic" && (
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              Class Roll <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="number"
                              required
                              value={sectionFormData.classRoll ?? ""}
                              onChange={(e) =>
                                setSectionFormData({ ...sectionFormData, classRoll: e.target.value })
                              }
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              Student Reg ID <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={sectionFormData.studentIdNo ?? ""}
                              onChange={(e) =>
                                setSectionFormData({ ...sectionFormData, studentIdNo: e.target.value })
                              }
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Section</label>
                            <select
                              value={sectionFormData.sectionId || ""}
                              onChange={(e) =>
                                setSectionFormData({ ...sectionFormData, sectionId: e.target.value })
                              }
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            >
                              {availableSections.map((sec: any) => (
                                <option key={sec.id} value={sec.id}>
                                  {sec.name} ({sec.shift === "MORNING" ? "Morning" : "Day"} • {formatGroupName(sec.groupType)})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Curriculum Group</label>
                            <select
                              value={sectionFormData.groupType || "Science"}
                              onChange={(e) =>
                                setSectionFormData({ ...sectionFormData, groupType: e.target.value })
                              }
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="Science">Science</option>
                              <option value="Humanities">Humanities</option>
                              <option value="Business Studies">Business Studies</option>
                              <option value="General">General</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Allocated 4th Subject (Optional)</label>
                          <select
                            value={sectionFormData.fourthSubjectId || ""}
                            onChange={(e) =>
                              setSectionFormData({ ...sectionFormData, fourthSubjectId: e.target.value })
                            }
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="">-- No 4th Subject --</option>
                            {availableSubjects.map((sub: any) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.subjectCode || sub.code ? `[${sub.subjectCode || sub.code}] ` : ""}{sub.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Section 2: Personal Profile */}
                    {editingSection === "personal" && (
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              First Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={sectionFormData.firstName ?? ""}
                              onChange={(e) =>
                                setSectionFormData({ ...sectionFormData, firstName: e.target.value })
                              }
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Last Name</label>
                            <input
                              type="text"
                              value={sectionFormData.lastName ?? ""}
                              onChange={(e) =>
                                setSectionFormData({ ...sectionFormData, lastName: e.target.value })
                              }
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Gender</label>
                            <select
                              value={sectionFormData.gender || ""}
                              onChange={(e) =>
                                setSectionFormData({ ...sectionFormData, gender: e.target.value })
                              }
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">-- Select Gender --</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Religion</label>
                            <select
                              value={sectionFormData.religion || ""}
                              onChange={(e) =>
                                setSectionFormData({ ...sectionFormData, religion: e.target.value })
                              }
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">-- Select Religion --</option>
                              <option value="Islam">Islam</option>
                              <option value="Hinduism">Hinduism</option>
                              <option value="Buddhism">Buddhism</option>
                              <option value="Christianity">Christianity</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Blood Group</label>
                            <select
                              value={sectionFormData.bloodGroup || ""}
                              onChange={(e) =>
                                setSectionFormData({ ...sectionFormData, bloodGroup: e.target.value })
                              }
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">-- Select --</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                            <input
                              type="text"
                              value={sectionFormData.dob ?? ""}
                              onChange={(e) =>
                                setSectionFormData({ ...sectionFormData, dob: e.target.value })
                              }
                              placeholder="YYYY-MM-DD"
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Nationality</label>
                            <input
                              type="text"
                              value={sectionFormData.nationality ?? ""}
                              onChange={(e) =>
                                setSectionFormData({ ...sectionFormData, nationality: e.target.value })
                              }
                              placeholder="e.g. Bangladeshi"
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section 3: Guardian Details */}
                    {editingSection === "guardian" && (
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Primary Guardian Name</label>
                            <input
                              type="text"
                              value={sectionFormData.guardianName ?? ""}
                              onChange={(e) =>
                                setSectionFormData({ ...sectionFormData, guardianName: e.target.value })
                              }
                              placeholder="e.g. Father, Mother or Guardian Name"
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Guardian Phone (SMS)</label>
                            <input
                              type="text"
                              value={sectionFormData.guardianPhone ?? ""}
                              onChange={(e) =>
                                setSectionFormData({ ...sectionFormData, guardianPhone: e.target.value })
                              }
                              placeholder="017xxxxxxxx"
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Father's Name</label>
                            <input
                              type="text"
                              value={sectionFormData.fatherName ?? ""}
                              onChange={(e) =>
                                setSectionFormData({ ...sectionFormData, fatherName: e.target.value })
                              }
                              placeholder="Father's full name"
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Mother's Name</label>
                            <input
                              type="text"
                              value={sectionFormData.motherName ?? ""}
                              onChange={(e) =>
                                setSectionFormData({ ...sectionFormData, motherName: e.target.value })
                              }
                              placeholder="Mother's full name"
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section 4: Address Details */}
                    {editingSection === "address" && (
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Present Residential Address</label>
                          <textarea
                            rows={3}
                            value={sectionFormData.address ?? ""}
                            onChange={(e) =>
                              setSectionFormData({ ...sectionFormData, address: e.target.value })
                            }
                            placeholder="House, Road, Area, Thana, District"
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Permanent Address</label>
                          <textarea
                            rows={3}
                            value={sectionFormData.permanentAddress ?? ""}
                            onChange={(e) =>
                              setSectionFormData({ ...sectionFormData, permanentAddress: e.target.value })
                            }
                            placeholder="Village, Post Office, Upazila, District"
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Section 5: Additional Enrolled Information */}
                    {editingSection === "additional" && (
                      <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Student Category Dropdown */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              Student Category
                            </label>
                            <select
                              value={sectionFormData.studentCategory ?? "General"}
                              onChange={(e) =>
                                setSectionFormData({ ...sectionFormData, studentCategory: e.target.value })
                              }
                              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                            >
                              <option value="General">General</option>
                              <option value="Military">Military</option>
                            </select>
                            <span className="text-[11px] text-slate-400 mt-1 block">
                              Select category: General or Military
                            </span>
                          </div>

                          {/* Student Status */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              Student Status
                            </label>
                            <select
                              value={sectionFormData.studentStatus ?? "ACTIVE"}
                              onChange={(e) =>
                                setSectionFormData({ ...sectionFormData, studentStatus: e.target.value })
                              }
                              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="INACTIVE">INACTIVE</option>
                            </select>
                            <span className="text-[11px] text-slate-400 mt-1 block">
                              Current enrollment status
                            </span>
                          </div>
                        </div>

                        {/* Service Selection: Dropdown Menu & Checkboxes */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                          <div>
                            <label className="block font-bold text-slate-800 mb-1">
                              Service (Bus / Hostel / Extra Coaching)
                            </label>
                            <span className="text-[11px] text-slate-500 block mb-2">
                              Choose preset from dropdown or select specific services with the checkboxes below.
                            </span>
                            <select
                              value={(() => {
                                const cur = sectionFormData.service || "None";
                                const valid = ["None", "Bus", "Hostel", "Extra Coaching", "Bus, Extra Coaching", "Hostel, Extra Coaching", "Bus, Hostel", "Bus, Hostel, Extra Coaching"];
                                return valid.includes(cur) ? cur : "Custom";
                              })()}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val !== "Custom") {
                                  setSectionFormData({ ...sectionFormData, service: val });
                                }
                              }}
                              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-xs mb-3"
                            >
                              <option value="None">None (No Service)</option>
                              <option value="Bus">Bus</option>
                              <option value="Hostel">Hostel</option>
                              <option value="Extra Coaching">Extra Coaching</option>
                              <option value="Bus, Extra Coaching">Bus + Extra Coaching</option>
                              <option value="Hostel, Extra Coaching">Hostel + Extra Coaching</option>
                              <option value="Bus, Hostel">Bus + Hostel</option>
                              <option value="Bus, Hostel, Extra Coaching">All Services (Bus, Hostel, Extra Coaching)</option>
                              <option value="Custom" disabled>Custom combination...</option>
                            </select>
                          </div>

                          {/* Checkboxes */}
                          <div className="pt-2 border-t border-slate-200">
                            <label className="block text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wide">
                              Service Checkboxes:
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {[
                                { id: "Bus", label: "Bus Service" },
                                { id: "Hostel", label: "Hostel Facility" },
                                { id: "Extra Coaching", label: "Extra Coaching" },
                              ].map((srv) => {
                                const currentServices = (sectionFormData.service || "")
                                  .split(",")
                                  .map((s: string) => s.trim())
                                  .filter((s: string) => Boolean(s) && s !== "None");
                                const isChecked = currentServices.includes(srv.id);

                                return (
                                  <label
                                    key={srv.id}
                                    className={`flex items-center space-x-2 p-2.5 rounded-lg border cursor-pointer transition ${
                                      isChecked
                                        ? "bg-purple-50 border-purple-300 text-purple-900 font-bold shadow-2xs"
                                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        let updated: string[];
                                        if (e.target.checked) {
                                          updated = Array.from(new Set([...currentServices, srv.id]));
                                        } else {
                                          updated = currentServices.filter((s: string) => s !== srv.id);
                                        }
                                        const finalStr = updated.length > 0 ? updated.join(", ") : "None";
                                        setSectionFormData({ ...sectionFormData, service: finalStr });
                                      }}
                                      className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                                    />
                                    <span className="text-xs">{srv.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Status Date */}
                        <DatePicker
                          label="Status Effective Date"
                          value={sectionFormData.statusDate ?? ""}
                          onChange={(val) => setSectionFormData({ ...sectionFormData, statusDate: val })}
                        />
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                    <AppButton
                      type="button"
                      variant="ghost"
                      color="inherit"
                      onClick={() => {
                        setEditingSection(null);
                        setSectionError("");
                        setSectionSuccess("");
                      }}
                    >
                      Cancel
                    </AppButton>
                    <AppButton
                      type="submit"
                      variant="contained"
                      color="success"
                      loading={savingSection}
                      startIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      Save Changes
                    </AppButton>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </StudentAdminPageShell>
  );
}

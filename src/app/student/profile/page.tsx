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
  Loader2,
} from "lucide-react";
import { getStoredWaivers, calculateStudentWaiver } from "@/app/fees/waiverStore";
import { StudentNavHeader } from "../StudentNavHeader";
import { SessionSelect } from "@/components/SessionSelect";

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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <StudentNavHeader />

      {/* ========================================================
          PAGE HEADER & BREADCRUMBS
         ======================================================== */}
      <div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <span className="text-slate-500">Students</span>
          <span>/</span>
          <span className="text-slate-800 font-medium">Student Profile</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-emerald-600" />
              Student Profile
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              View student details, academic history, fee records, and notices.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Student Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          STUDENT FILTER BAR (Replica of User Design)
         ======================================================== */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 no-print">
        <div className="flex flex-wrap items-center gap-4">
          {/* Filter Session */}
          <div className="flex-1 min-w-[140px] max-w-[200px]">
            <SessionSelect
              value={selectedSession}
              onChange={(val) => setSelectedSession(val)}
              label="Filter Session:"
              labelClassName="block text-xs font-semibold text-slate-800 mb-1.5"
              selectClassName="w-full text-xs sm:text-sm bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs transition cursor-pointer"
            />
          </div>

          {/* Filter Class */}
          <div className="flex-1 min-w-[140px] max-w-[200px]">
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Filter Class:
            </label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSectionId("");
                }}
                className="w-full text-xs sm:text-sm bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs transition cursor-pointer appearance-none pr-8"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filter Shift */}
          <div className="flex-1 min-w-[140px] max-w-[200px]">
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Filter Shift:
            </label>
            <div className="relative">
              <select
                value={selectedShift}
                onChange={(e) => {
                  setSelectedShift(e.target.value);
                  setSelectedSectionId("");
                }}
                className="w-full text-xs sm:text-sm bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs transition cursor-pointer appearance-none pr-8"
              >
                <option value="ALL">All Shifts</option>
                <option value="MORNING">Morning</option>
                <option value="DAY">Day</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filter Group */}
          <div className="flex-1 min-w-[150px] max-w-[220px]">
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Filter Group:
            </label>
            <div className="relative">
              <select
                value={selectedGroup}
                onChange={(e) => {
                  setSelectedGroup(e.target.value);
                  setSelectedSectionId("");
                }}
                className="w-full text-xs sm:text-sm bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs transition cursor-pointer appearance-none pr-8"
              >
                <option value="ALL">All Groups</option>
                <option value="SCIENCE">Science</option>
                <option value="HUMANITIES">Humanities</option>
                <option value="BUSINESS_STUDIES">Business Studies</option>
                <option value="GENERAL">General</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="flex-1 min-w-[220px] max-w-[320px]">
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Filter Section:
            </label>
            <div className="relative">
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="w-full text-xs sm:text-sm bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs transition cursor-pointer appearance-none pr-8 truncate"
              >
                <option value="">All Sections</option>
                {availableSections.map((sec: any) => {
                  const namePrefix = sec.name?.toLowerCase().startsWith("section") ? sec.name : `Section ${sec.name}`;
                  const groupPart = sec.groupType && sec.groupType !== "GENERAL" ? ` (${sec.groupType})` : "";
                  const shiftPart = sec.shift ? ` • ${sec.shift}` : " • Day";
                  return (
                    <option key={sec.id} value={sec.id}>
                      {namePrefix}{groupPart}{shiftPart}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Sequential Student Navigator (Previous / Next) */}
        {students.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePreviousStudent}
                disabled={!hasPrevious}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
                  hasPrevious
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer active:scale-95 border border-slate-200"
                    : "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed"
                }`}
                title={hasPrevious ? `Go to previous student (Roll #${students[currentStudentIndex - 1]?.classRoll})` : "No previous student"}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 flex items-center gap-2">
                <span className="text-emerald-700">Roll: #{activeStudent?.classRoll}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-sans font-medium">
                  {currentStudentIndex >= 0 ? currentStudentIndex + 1 : 1} of {students.length} Students
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextStudent}
                disabled={!hasNext}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
                  hasNext
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95 shadow-emerald-600/20"
                    : "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed"
                }`}
                title={hasNext ? `Go to next student (Roll #${students[currentStudentIndex + 1]?.classRoll})` : "No next student"}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Jump to Student by Roll / Name */}
            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to roll or name..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 w-52 shadow-2xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* If No Student Found */}
      {!activeStudent ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700 text-sm">No Student Records Selected</p>
          <p className="text-xs text-slate-500 mt-1">
            Please adjust class or section filters to view the student profile.
          </p>
        </div>
      ) : (
        <>
          {/* ========================================================
              STUDENT HERO CARD
             ======================================================== */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start sm:items-center space-x-4">
                {/* Avatar with Photo or Initials + Camera Overlay */}
                <div className="relative group shrink-0">
                  {currentPhoto ? (
                    <img
                      src={currentPhoto}
                      alt={`${activeStudent.student?.firstName || "Student"} Photo`}
                      className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-emerald-500 ring-2 ring-emerald-100"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-2xl shadow-md">
                      {activeStudent.student?.firstName ? activeStudent.student.firstName[0] : "S"}
                      {activeStudent.student?.lastName ? activeStudent.student.lastName[0] : ""}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setTempPhotoUrl(currentPhoto || "");
                      setIsPhotoModalOpen(true);
                    }}
                    className="absolute -bottom-1 -right-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 p-1.5 rounded-full shadow-md border border-slate-200 transition cursor-pointer"
                    title="Change Student Profile Picture"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-extrabold text-slate-900">
                      {activeStudent.student?.firstName} {activeStudent.student.lastName}
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Active Student
                    </span>
                    {studentFeeInfo?.isSpecialScholarship && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        {studentFeeInfo.waiverTitle}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                    <span className="font-mono font-semibold text-slate-800">
                      ID: {activeStudent.student?.studentIdNo || "N/A"}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-800">
                      Roll: <strong className="font-mono">{activeStudent.classRoll}</strong>
                    </span>
                    <span>•</span>
                    <span>{activeStudent.class?.name || "—"}{activeStudent.section?.name ? ` • Section ${activeStudent.section.name}` : ""}</span>
                    <span>•</span>
                    <span className="text-slate-600 font-medium">
                      Group: {activeStudent.groupType ? formatGroupName(activeStudent.groupType) : activeStudent.section?.groupType ? formatGroupName(activeStudent.section.groupType) : "General"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2.5">
                {/* Sequential Student Navigation Buttons */}
                <div className="flex items-center gap-1.5 self-end no-print">
                  <button
                    type="button"
                    onClick={handlePreviousStudent}
                    disabled={!hasPrevious}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                    title={hasPrevious ? `Previous Student (Roll #${students[currentStudentIndex - 1]?.classRoll})` : "No previous student"}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                  <span className="text-[11px] font-mono font-bold text-slate-500 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-200">
                    {currentStudentIndex >= 0 ? currentStudentIndex + 1 : 1} / {students.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextStudent}
                    disabled={!hasNext}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                    title={hasNext ? `Next Student (Roll #${students[currentStudentIndex + 1]?.classRoll})` : "No next student"}
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Stat Pill Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs w-full sm:w-auto">
                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-bold block uppercase">Exam GPA</span>
                  <span className="text-base font-extrabold font-mono text-emerald-800">
                    {studentResultInfo?.gpa.toFixed(2)} ({studentResultInfo?.letterGrade})
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-200">
                  <span className="text-[10px] text-indigo-700 font-bold block uppercase">Class Rank</span>
                  <span className="text-base font-extrabold font-mono text-indigo-800">
                    #{activeStudent.classRoll}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
                  <span className="text-[10px] text-amber-700 font-bold block uppercase">Fee Status</span>
                  <span className={`text-base font-extrabold font-mono ${studentFeeInfo?.status === "PAID" ? "text-emerald-700" : "text-amber-700"}`}>
                    {studentFeeInfo?.status}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200">
                  <span className="text-[10px] text-teal-700 font-bold block uppercase">Admit Card</span>
                  <span className="text-xs font-bold font-mono text-teal-800 flex items-center justify-center gap-1 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    {studentFeeInfo?.isExamCleared ? "CLEARED" : "HOLD"}
                  </span>
                </div>
              </div>
            </div>
          </div>

            {/* ========================================================
                4 CORE SUB-SECTION TABS (PROFILE, RESULT, FEE, NOTICE)
               ======================================================== */}
            <div className="pt-4 flex items-center space-x-2 border-b border-slate-200 no-print overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("PROFILE")}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === "PROFILE"
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>1. Personal Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("RESULT")}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === "RESULT"
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Award className="w-4 h-4" />
                <span>2. Academic Results</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("FEE_STATUS")}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === "FEE_STATUS"
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>3. Fee Status & Ledger</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("NOTICE")}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === "NOTICE"
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>4. Institutional Notices</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 ml-1">
                  {notices.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("SUBJECT_LIST")}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === "SUBJECT_LIST"
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>5. Subject List</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 ml-1">
                  {studentSubjectList.length}
                </span>
              </button>
            </div>
          </div>

          {/* ========================================================
              TAB CONTENT 1: PROFILE
             ======================================================== */}
          {activeTab === "PROFILE" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Academic Registration & Class Details */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2 font-bold text-slate-800 text-xs">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <span>Academic Registration & Class Details</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenSectionEdit("academic")}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer shadow-2xs"
                      title="Edit Academic Details"
                    >
                      <Edit2 className="w-3 h-3 text-emerald-600" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Academic Class</span>
                      <strong className="text-slate-800">{activeStudent.class?.name || "—"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Section & Shift</span>
                      <strong className="text-slate-800">
                        {activeStudent.section ? (
                          <>
                            {activeStudent.section.name}
                            {activeStudent.section.shift ? (
                              <> • {activeStudent.section.shift === "MORNING" ? "Morning" : "Day"}</>
                            ) : null}
                          </>
                        ) : (
                          "—"
                        )}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Class Roll</span>
                      <strong className="font-mono text-emerald-700 text-sm">
                        {activeStudent.classRoll !== undefined && activeStudent.classRoll !== null ? `#${activeStudent.classRoll}` : "—"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Student Reg ID</span>
                      <strong className="font-mono text-slate-800">{activeStudent.student?.studentIdNo || "—"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Curriculum Group</span>
                      <strong className="text-slate-800">
                        {activeStudent.groupType
                          ? formatGroupName(activeStudent.groupType)
                          : activeStudent.section?.groupType
                          ? formatGroupName(activeStudent.section.groupType)
                          : "—"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Academic Session</span>
                      <strong className="text-slate-800">{activeStudent.academicYear?.yearName || "—"}</strong>
                    </div>
                    {/* Allocated 4th Subject */}
                    {activeStudent.allocations?.some((a: any) => a.subjectType === "OPTIONAL_4TH") && (
                      <div className="col-span-2 pt-1 border-t border-slate-50">
                        <span className="text-slate-400 block text-[11px]">Allocated 4th Subject</span>
                        <strong className="text-emerald-700 font-semibold">
                          {activeStudent.allocations.find((a: any) => a.subjectType === "OPTIONAL_4TH")?.subject?.name || "—"}
                          {activeStudent.allocations.find((a: any) => a.subjectType === "OPTIONAL_4TH")?.subject?.subjectCode
                            ? ` (${activeStudent.allocations.find((a: any) => a.subjectType === "OPTIONAL_4TH")?.subject?.subjectCode})`
                            : ""}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Personal & Health Details */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2 font-bold text-slate-800 text-xs">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>Personal & Bio Profile</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenSectionEdit("personal")}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer shadow-2xs"
                      title="Edit Personal Details"
                    >
                      <Edit2 className="w-3 h-3 text-emerald-600" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Full Name</span>
                      <strong className="text-slate-800">
                        {`${activeStudent.student?.firstName || ""} ${activeStudent.student?.lastName || ""}`.trim() || "—"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Gender</span>
                      <strong className="text-slate-800">{activeStudent.student?.gender || "—"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Religion</span>
                      <strong className="text-slate-800">{activeStudent.student?.religion || "—"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Blood Group</span>
                      <strong className="font-bold text-rose-600">
                        {customData.bloodGroup || customData.blood_group || customData["Blood Group"] || "—"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                      <strong className="font-mono text-slate-800">
                        {customData.dob || customData.dateOfBirth || customData["Date of Birth"] || "—"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Nationality</span>
                      <strong className="text-slate-800">
                        {customData.nationality || customData["Nationality"] || "—"}
                      </strong>
                    </div>

                    <div className="col-span-2 pt-2.5 mt-1 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {currentPhoto ? (
                          <img
                            src={currentPhoto}
                            alt="Profile"
                            className="w-10 h-10 rounded-xl object-cover border border-emerald-500 shadow-2xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs border border-slate-200">
                            <ImageIcon className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-xs text-slate-800">Profile Picture</div>
                          <div className="text-[10px] text-slate-500">
                            {currentPhoto ? "Custom photo active" : "Default initials avatar"}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTempPhotoUrl(currentPhoto || "");
                          setIsPhotoModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{currentPhoto ? "Change Photo" : "Add Photo"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Guardian & Emergency Contact */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2 font-bold text-slate-800 text-xs">
                      <Phone className="w-4 h-4 text-indigo-600" />
                      <span>Guardian & Family Information</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenSectionEdit("guardian")}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer shadow-2xs"
                      title="Edit Guardian Details"
                    >
                      <Edit2 className="w-3 h-3 text-emerald-600" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Primary Guardian</span>
                      <strong className="text-slate-800">{activeStudent.student?.guardianName || "—"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Guardian Phone (SMS)</span>
                      <strong className="font-mono text-indigo-700">{activeStudent.student?.guardianPhone || "—"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Father's Name</span>
                      <strong className="text-slate-800">
                        {customData.fatherName || customData.father_name || customData["Father's Name"] || "—"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Mother's Name</span>
                      <strong className="text-slate-800">
                        {customData.motherName || customData.mother_name || customData["Mother's Name"] || "—"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 4. Address & Residence */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2 font-bold text-slate-800 text-xs">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>Residential Address & Location</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenSectionEdit("address")}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer shadow-2xs"
                      title="Edit Residential Address"
                    >
                      <Edit2 className="w-3 h-3 text-emerald-600" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Present Residential Address</span>
                      <p className="text-slate-800 font-medium">{activeStudent.student?.address || "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Permanent Address</span>
                      <p className="text-slate-800 font-medium">
                        {customData.permanentAddress || customData.permanent_address || customData["Permanent Address"] || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5. Additional Enrolled Information (Category, Service, Status) */}
                <div className="col-span-1 md:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2 font-bold text-slate-800 text-xs">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span>Additional Enrolled Information</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenSectionEdit("additional")}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition cursor-pointer shadow-2xs"
                      title="Edit Additional Enrolled Information"
                    >
                      <Edit2 className="w-3 h-3 text-purple-600" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Student Status</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          activeStudent.student?.isActive !== false
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {customData.studentStatus || (activeStudent.student?.isActive !== false ? "ACTIVE" : "INACTIVE")}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Status Date</span>
                      <strong className="text-slate-800 font-mono">
                        {customData.statusDate || customData.status_date || "2026-10-20"}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Student Category</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          String(customData.studentCategory || customData.studentCatagory || customData.category || "General").toLowerCase() === "military"
                            ? "bg-amber-50 text-amber-800 border border-amber-300"
                            : "bg-sky-50 text-sky-800 border border-sky-200"
                        }`}
                      >
                        {customData.studentCategory || customData.studentCatagory || customData.category || "General"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Service</span>
                      {(() => {
                        const raw = customData.service || customData.services || "None";
                        const list = String(raw).split(",").map((s) => s.trim()).filter(Boolean);
                        if (list.length === 0 || raw === "None" || raw === "-") {
                          return <span className="text-slate-500 font-medium text-[11px]">None</span>;
                        }
                        return (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {list.map((srv, idx) => (
                              <span
                                key={idx}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  srv === "Bus"
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : srv === "Hostel"
                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                    : srv === "Extra Coaching"
                                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                {srv}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Any extra dynamic custom fields */}
                    {Object.entries(customData)
                      .filter(([k]) => !isStandardOrInternalKey(k))
                      .map(([k, val]) => (
                        <div key={k}>
                          <span className="text-slate-400 block text-[11px]">
                            {formatCustomFieldLabel(k)}
                          </span>
                          <strong className="text-slate-800">{String(val) || "—"}</strong>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB CONTENT 2: RESULT
             ======================================================== */}
          {activeTab === "RESULT" && studentResultInfo && (
            <div className="space-y-4">
              {/* Term Assessment Summary Banner */}
              <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white rounded-xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 block mb-0.5">
                    Official Summative Evaluation
                  </span>
                  <h3 className="text-lg font-black">{studentResultInfo.termName}</h3>
                  <p className="text-xs text-emerald-100 mt-1">
                    All subjects evaluated under National Curriculum & Textbook Board (NCTB) grading regulations.
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-white/10 p-3 rounded-lg backdrop-blur-xs shrink-0">
                  <div className="text-center pr-3 border-r border-white/20">
                    <span className="text-[10px] text-emerald-200 block uppercase">GPA Score</span>
                    <span className="text-2xl font-black font-mono">{studentResultInfo.gpa.toFixed(2)}</span>
                  </div>
                  <div className="text-center pr-3 border-r border-white/20">
                    <span className="text-[10px] text-emerald-200 block uppercase">Grade</span>
                    <span className="text-2xl font-black">{studentResultInfo.letterGrade}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-emerald-200 block uppercase">Total Marks</span>
                    <span className="text-lg font-bold font-mono">{studentResultInfo.totalMarks} / {studentResultInfo.maxMarks}</span>
                  </div>
                </div>
              </div>

              {/* Subject Marks Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Subject-Wise Marks & Grade Points
                  </h4>
                  <Link
                    href={`/reports/marksheet`}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline flex items-center gap-1"
                  >
                    <span>View Full Single Marksheet</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

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
              </div>
            </div>
          )}

          {/* ========================================================
              TAB CONTENT 3: FEE STATUS
             ======================================================== */}
          {activeTab === "FEE_STATUS" && studentFeeInfo && (
            <div className="space-y-4">
              {/* Fee Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-500 block">Standard Tuition Fee</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                    ৳ {studentFeeInfo.tuitionFee.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Academic Monthly Rate</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
                  <span className="text-xs font-semibold text-amber-800 block">Scholarship / Waiver</span>
                  <div className="text-2xl font-bold text-rose-600 mt-1 font-mono">
                    {studentFeeInfo.waiverAmount > 0 ? `-৳ ${studentFeeInfo.waiverAmount.toLocaleString()}` : "৳ 0"}
                  </div>
                  <span className="text-[11px] text-amber-700 font-medium mt-0.5 block truncate">
                    {studentFeeInfo.waiverTitle || "No Special Waiver"}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
                  <span className="text-xs font-semibold text-emerald-800 block">Total Amount Paid</span>
                  <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                    ৳ {studentFeeInfo.paidAmount.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">
                    Via {studentFeeInfo.lastPaymentMethod}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
                  <span className="text-xs font-semibold text-rose-800 block">Outstanding Due Balance</span>
                  <div className="text-2xl font-bold text-rose-600 mt-1 font-mono">
                    ৳ {studentFeeInfo.dueAmount.toLocaleString()}
                  </div>
                  <span className="text-[11px] font-semibold mt-0.5 block text-rose-700">
                    {studentFeeInfo.dueAmount === 0 ? "Zero Dues (All Cleared)" : "Pending Clearance"}
                  </span>
                </div>
              </div>

              {/* Monthly Ledger Details & Clearance */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Receipt className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Student Billing Particulars & Clearance Status
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/fees"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Open in Fee Management</span>
                    </Link>
                  </div>
                </div>

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
              </div>
            </div>
          )}

          {/* ========================================================
              TAB CONTENT 4: NOTICE
             ======================================================== */}
          {activeTab === "NOTICE" && (
            <div className="space-y-4">
              {/* Notice Filters */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-slate-800">Notice Circulars for {activeStudent.class?.name || "Class 10"}:</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {["ALL", "EXAM", "ACCOUNTS", "SCHOLARSHIP", "HOLIDAY"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNoticeCategory(cat)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                        noticeCategory === cat
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notice List */}
              <div className="space-y-3">
                {filteredNotices.map((notice) => (
                  <div
                    key={notice.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 shadow-2xs transition space-y-2"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          notice.category === "EXAM"
                            ? "bg-indigo-100 text-indigo-800"
                            : notice.category === "ACCOUNTS"
                            ? "bg-amber-100 text-amber-800"
                            : notice.category === "SCHOLARSHIP"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {notice.category}
                        </span>
                        {notice.important && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                            Urgent Notice
                          </span>
                        )}
                        <h4 className="text-xs font-bold text-slate-900">{notice.title}</h4>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{notice.date}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {notice.summary}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Issued by: <strong className="text-slate-600">{notice.publisher}</strong></span>
                      <span className="text-emerald-700 font-semibold cursor-pointer hover:underline">
                        Download Notice PDF
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB CONTENT 5: SUBJECT LIST
             ======================================================== */}
          {activeTab === "SUBJECT_LIST" && (
            <div className="space-y-4">
              {/* Header and Print Control */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase tracking-widest font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      NCTB Registered Curriculum Catalog
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded font-bold">
                      {activeStudent.groupType} Group
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1.5">
                    Official Registered Subject Roster & Marks Distribution
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    All assigned compulsory, group elective, and 4th optional subjects registered with the Education Board for {activeStudent.student?.firstName} {activeStudent.student?.lastName}.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto shrink-0 no-print">
                  <button
                    type="button"
                    onClick={() => {
                      const subjectToEdit = studentSubjectList.find((s) => s.type === "OPTIONAL_4TH") || studentSubjectList[0];
                      if (subjectToEdit) openEditSubjectModal(subjectToEdit);
                    }}
                    className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Change Subject</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Print Subject Slip</span>
                  </button>
                </div>
              </div>

              {/* Subject KPI Metric Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Subjects</span>
                  <span className="text-lg font-extrabold font-mono text-slate-900 mt-0.5 block">
                    {subjectStats.total} <span className="text-xs font-normal text-slate-500">Registered</span>
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Compulsory</span>
                  <span className="text-lg font-extrabold font-mono text-emerald-800 mt-0.5 block">
                    {subjectStats.compulsory} <span className="text-xs font-normal text-emerald-600">Subjects</span>
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">Group Electives</span>
                  <span className="text-lg font-extrabold font-mono text-indigo-800 mt-0.5 block">
                    {subjectStats.electives} <span className="text-xs font-normal text-indigo-600">Subjects</span>
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">4th / Optional</span>
                  <span className="text-lg font-extrabold font-mono text-amber-800 mt-0.5 block">
                    {subjectStats.optional} <span className="text-xs font-normal text-amber-600">Subject</span>
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Full Marks</span>
                  <span className="text-lg font-extrabold font-mono text-slate-900 mt-0.5 block">
                    {subjectStats.totalFullMarks} <span className="text-xs font-normal text-slate-500">Marks</span>
                  </span>
                </div>
              </div>

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
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSubjectFilter(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        subjectFilter === tab.id
                          ? "bg-emerald-600 text-white shadow-2xs font-bold"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
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
                              <button
                                type="button"
                                onClick={() => openEditSubjectModal(sub)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shadow-2xs transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Change Subject</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Printable Institutional Signature Block */}
                <div className="hidden print:grid grid-cols-2 gap-8 p-8 mt-12 pt-12 border-t border-slate-300 text-center text-xs">
                  <div>
                    <div className="border-b border-slate-400 w-44 mx-auto mb-1"></div>
                    <p className="font-bold">Academic In-Charge / Course Advisor</p>
                    <p className="text-[10px] text-slate-500">Course & Curriculum Registration</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 w-44 mx-auto mb-1"></div>
                    <p className="font-bold">Principal / Headmaster</p>
                    <p className="text-[10px] text-slate-500">Dhaka Ideal Model High School & College</p>
                  </div>
                </div>
              </div>
            </div>
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
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Photo</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPhotoModalOpen(false);
                        setTempPhotoUrl("");
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (tempPhotoUrl) handleSavePhoto(tempPhotoUrl);
                        else setIsPhotoModalOpen(false);
                      }}
                      disabled={!tempPhotoUrl && !currentPhoto}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      Save Profile Picture
                    </button>
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
                  <button
                    type="button"
                    onClick={handleResetSubjects}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition cursor-pointer flex items-center gap-1"
                    title="Reset all subject customizations for this student"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset to Default</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditSubjectModalOpen(false);
                        setEditingSubject(null);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSubjectChanges}
                      disabled={!subjectForm.name.trim() || !subjectForm.code.trim()}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      Save Subject Changes
                    </button>
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
                  <button
                    type="button"
                    onClick={() => setEditingSection("academic")}
                    className={`flex items-center space-x-1.5 px-3 py-2 font-bold rounded-t-lg border-b-2 transition cursor-pointer ${
                      editingSection === "academic"
                        ? "bg-white text-emerald-700 border-emerald-600 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 border-transparent"
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Academic</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSection("personal")}
                    className={`flex items-center space-x-1.5 px-3 py-2 font-bold rounded-t-lg border-b-2 transition cursor-pointer ${
                      editingSection === "personal"
                        ? "bg-white text-emerald-700 border-emerald-600 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 border-transparent"
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Personal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSection("guardian")}
                    className={`flex items-center space-x-1.5 px-3 py-2 font-bold rounded-t-lg border-b-2 transition cursor-pointer ${
                      editingSection === "guardian"
                        ? "bg-white text-emerald-700 border-emerald-600 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 border-transparent"
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Guardian</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSection("address")}
                    className={`flex items-center space-x-1.5 px-3 py-2 font-bold rounded-t-lg border-b-2 transition cursor-pointer ${
                      editingSection === "address"
                        ? "bg-white text-emerald-700 border-emerald-600 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 border-transparent"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Address</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSection("additional")}
                    className={`flex items-center space-x-1.5 px-3 py-2 font-bold rounded-t-lg border-b-2 transition cursor-pointer ${
                      editingSection === "additional"
                        ? "bg-white text-emerald-700 border-emerald-600 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 border-transparent"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Additional</span>
                  </button>
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
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Status Effective Date
                          </label>
                          <input
                            type="date"
                            value={sectionFormData.statusDate ?? ""}
                            onChange={(e) =>
                              setSectionFormData({ ...sectionFormData, statusDate: e.target.value })
                            }
                            className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSection(null);
                        setSectionError("");
                        setSectionSuccess("");
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingSection}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {savingSection ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { NoDataFound } from "@/components/table/no-data-found";
import { useEffect, useMemo, useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Users,
  UserPlus,
  Phone,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  X,
  Check,
  Settings,
  Download,
  FileSpreadsheet,
  Upload,
  FileCheck,
  AlertCircle,
  Image as ImageIcon,
  Lock,
  Unlock,
} from "@/components/iconify/lucide";
import { StudentAdminPageShell } from "@/sections/student/component/admin-page-shell";
import { StudentPageHeader } from "@/sections/student/component/student-page-header";
import { SessionSelect } from "@/components/SessionSelect";
import { AppButton } from "@/components/button/app-button";
import { AppSelect } from "@/components/select/app-select";
import { AppTextField } from "@/components/text-field/app-text-field";
import { DatePicker } from "@/components/date-picker/date-picker";
import { AppCard, AppTable, Label, TableFilterBar, type AppTableColumn } from "@/components";
import { Box, Checkbox, FormControlLabel, Grid, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { getScopedStorageKey, getActiveTenantCode, TENANT_SWITCH_EVENT } from "@/lib/clientTenant";

export interface FormFieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "date" | "image";
  placeholder?: string;
  required?: boolean;
  options?: string[];
  isSystem?: boolean;
  isInitialPosition?: boolean;
}

const DEFAULT_JUNIOR_FIELDS: FormFieldDef[] = [
  { key: "classRoll", label: "Class Roll", type: "number", placeholder: "e.g. 1", required: true, isSystem: true },
  { key: "studentIdNo", label: "Student ID", type: "text", placeholder: "e.g. ST-2026-001", required: true, isSystem: true },
  { key: "firstName", label: "First Name", type: "text", placeholder: "e.g. Shakib", required: true, isSystem: true },
  { key: "lastName", label: "Last Name", type: "text", placeholder: "e.g. Al Hasan", required: false, isSystem: true },
  {
    key: "gender",
    label: "Gender",
    type: "select",
    options: ["Male", "Female", "Other"],
    required: false,
    isSystem: true,
  },
  { key: "guardianName", label: "Guardian Name", type: "text", placeholder: "e.g. Mashrafe Mortaza", required: false, isSystem: true },
  { key: "guardianPhone", label: "Guardian Phone (SMS)", type: "text", placeholder: "017xxxxxxxx", required: true, isSystem: true },
  {
    key: "religion",
    label: "Religion",
    type: "select",
    options: ["Islam", "Hinduism", "Buddhism", "Christianity", "Other"],
    required: false,
    isSystem: true,
  },
  { key: "address", label: "Address", type: "text", placeholder: "e.g. Dhaka, Bangladesh", required: false, isSystem: true },
  {
    key: "studentCategory",
    label: "Student Category",
    type: "select",
    options: ["General", "Military"],
    required: false,
    isSystem: true,
  },
  {
    key: "service",
    label: "Service",
    type: "select",
    options: ["None", "Bus", "Hostel", "Extra Coaching", "Bus, Extra Coaching", "Hostel, Extra Coaching", "Bus, Hostel", "Bus, Hostel, Extra Coaching"],
    required: false,
    isSystem: true,
  },
];

const DEFAULT_SENIOR_FIELDS: FormFieldDef[] = [
  {
    key: "groupType",
    label: "Group",
    type: "select",
    options: ["Science", "Humanities", "Business Studies", "General"],
    required: true,
    isSystem: true,
    isInitialPosition: true,
  },
  { key: "classRoll", label: "Class Roll", type: "number", placeholder: "e.g. 1", required: true, isSystem: true },
  { key: "studentIdNo", label: "Student ID", type: "text", placeholder: "e.g. ST-2026-001", required: true, isSystem: true },
  { key: "firstName", label: "First Name", type: "text", placeholder: "e.g. Shakib", required: true, isSystem: true },
  { key: "lastName", label: "Last Name", type: "text", placeholder: "e.g. Al Hasan", required: false, isSystem: true },
  {
    key: "gender",
    label: "Gender",
    type: "select",
    options: ["Male", "Female", "Other"],
    required: false,
    isSystem: true,
  },
  { key: "guardianName", label: "Guardian Name", type: "text", placeholder: "e.g. Mashrafe Mortaza", required: false, isSystem: true },
  { key: "guardianPhone", label: "Guardian Phone (SMS)", type: "text", placeholder: "017xxxxxxxx", required: true, isSystem: true },
  {
    key: "religion",
    label: "Religion",
    type: "select",
    options: ["Islam", "Hinduism", "Buddhism", "Christianity", "Other"],
    required: false,
    isSystem: true,
  },
  { key: "address", label: "Address", type: "text", placeholder: "e.g. Dhaka, Bangladesh", required: false, isSystem: true },
  {
    key: "studentCategory",
    label: "Student Category",
    type: "select",
    options: ["General", "Military"],
    required: false,
    isSystem: true,
  },
  {
    key: "service",
    label: "Service",
    type: "select",
    options: ["None", "Bus", "Hostel", "Extra Coaching", "Bus, Extra Coaching", "Hostel, Extra Coaching", "Bus, Hostel", "Bus, Hostel, Extra Coaching"],
    required: false,
    isSystem: true,
  },
  {
    key: "fourthSubjectId",
    label: "Allocated 4th Subject",
    type: "select",
    required: false,
    isSystem: true,
  },
];

export default function StudentsPage() {
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Dynamic Fields Configuration
  const [juniorFields, setJuniorFields] = useState<FormFieldDef[]>(DEFAULT_JUNIOR_FIELDS);
  const [seniorFields, setSeniorFields] = useState<FormFieldDef[]>(DEFAULT_SENIOR_FIELDS);

  // Field Lock/Unlock State (Locked by default to protect layout and prevent accidental modifications)
  const [isFieldsLocked, setIsFieldsLocked] = useState(true);

  // Load saved field lock preference from localStorage
  useEffect(() => {
    try {
      const savedLocked = localStorage.getItem("nctb_enroll_fields_locked");
      if (savedLocked !== null) {
        setIsFieldsLocked(savedLocked === "true");
      }
    } catch (e) {
      console.error("Failed to load fields locked state", e);
    }
  }, []);

  const toggleFieldsLock = () => {
    setIsFieldsLocked((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("nctb_enroll_fields_locked", String(next));
      } catch (e) {
        console.error("Failed to save fields locked state", e);
      }
      return next;
    });
  };

  // Field Add/Edit Modal State
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [fieldForm, setFieldForm] = useState({
    label: "",
    type: "text" as "text" | "number" | "select" | "date" | "image",
    placeholder: "",
    required: false,
    optionsStr: "",
  });

  // Excel Upload & Preview State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<{
    fileName: string;
    rows: any[];
    headers: string[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Multi-selection & Delete state
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<Set<string>>(new Set());

  // Edit Student Modal state
  const [editingEnrollment, setEditingEnrollment] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const toggleSelectAll = () => {
    if (selectedEnrollmentIds.size === students.length && students.length > 0) {
      setSelectedEnrollmentIds(new Set());
    } else {
      setSelectedEnrollmentIds(new Set(students.map((s) => s.id)));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedEnrollmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenEditStudent = (enr: any) => {
    const fourthSub = enr.allocations?.find((a: any) => a.subjectType === "OPTIONAL_4TH");
    let customData: Record<string, any> = {};
    if (enr.student.customFields) {
      try {
        customData =
          typeof enr.student.customFields === "string"
            ? JSON.parse(enr.student.customFields)
            : enr.student.customFields;
      } catch (e) {}
    }

    setEditingEnrollment(enr);
    setEditFormData({
      enrollmentId: enr.id,
      studentId: enr.student.id,
      classRoll: enr.classRoll,
      studentIdNo: enr.student.studentIdNo,
      firstName: enr.student.firstName,
      lastName: enr.student.lastName || "",
      sectionId: enr.sectionId,
      groupType: enr.groupType ? formatGroupName(enr.groupType) : "Science",
      guardianName: enr.student.guardianName || "",
      guardianPhone: enr.student.guardianPhone || "",
      religion: enr.student.religion || "",
      address: enr.student.address || "",
      fourthSubjectId: fourthSub ? fourthSub.subjectId : "",
      studentCategory: customData.studentCategory || customData.studentCatagory || customData.category || "General",
      service: customData.service || customData.services || "None",
      customFields: customData,
    });
  };

  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnrollment) return;
    setIsSavingEdit(true);
    try {
      const payload = {
        ...editFormData,
        customFields: {
          ...editFormData.customFields,
          studentCategory: editFormData.studentCategory || "General",
          service: editFormData.service || "None",
        },
      };

      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setEditingEnrollment(null);
        fetchStudents();
      } else {
        alert("Failed to update student: " + data.error);
      }
    } catch (err: any) {
      alert("Error saving student: " + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteStudent = async (enr: any) => {
    const name = `${enr.student.firstName} ${enr.student.lastName || ""}`.trim();
    if (
      !confirm(
        `Are you sure you want to delete student "${name}" (Roll #${enr.classRoll})? This will permanently remove their enrollment.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch("/api/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId: enr.id }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedEnrollmentIds((prev) => {
          const next = new Set(prev);
          next.delete(enr.id);
          return next;
        });
        fetchStudents();
      } else {
        alert("Delete failed: " + data.error);
      }
    } catch (err: any) {
      alert("Error deleting student: " + err.message);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedEnrollmentIds.size === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedEnrollmentIds.size} selected student(s)? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch("/api/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentIds: Array.from(selectedEnrollmentIds) }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedEnrollmentIds(new Set());
        fetchStudents();
      } else {
        alert("Delete failed: " + data.error);
      }
    } catch (err: any) {
      alert("Error deleting students: " + err.message);
    }
  };

  // Form values state
  const [formData, setFormData] = useState<Record<string, any>>({
    groupType: "Science",
    classRoll: "",
    studentIdNo: "",
    firstName: "",
    lastName: "",
    guardianName: "",
    guardianPhone: "",
    religion: "",
    address: "",
    fourthSubjectId: "",
  });

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const classNum = selectedClass?.numericValue ?? parseInt(selectedClass?.name?.replace(/\D/g, "") || "0", 10);
  const isClass9To12 = Boolean(
    (classNum >= 9 && classNum <= 12) ||
    (selectedClass && /9|10|11|12|nine|ten|eleven|twelve|ssc|hsc/i.test(selectedClass.name))
  );
  const isClass11Or12 = Boolean(
    selectedClass && (
      classNum === 11 ||
      classNum === 12 ||
      /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(selectedClass.name || "")
    )
  );

  const standardGroups = [
    { value: "ALL", label: "All Groups" },
    { value: "SCIENCE", label: "Science" },
    { value: "HUMANITIES", label: "Humanities" },
    { value: "BUSINESS_STUDIES", label: "Business Studies" },
    ...(!isClass11Or12 ? [{ value: "GENERAL", label: "General" }] : []),
  ];

  // Additional unique groups from class sections if custom ones exist
  const customGroups = Array.from(
    new Set(
      (selectedClass?.sections || [])
        .map((s: any) => s.groupType?.toUpperCase())
        .filter((g: any) => Boolean(g) && !standardGroups.some((sg) => sg.value === g))
    )
  ) as string[];

  // Filter sections based on selectedShift and selectedGroup
  const availableSections = (selectedClass?.sections || []).filter((s: any) => {
    if (selectedShift && selectedShift !== "ALL" && s.shift?.toUpperCase() !== selectedShift.toUpperCase()) return false;
    if (selectedGroup && selectedGroup !== "ALL" && s.groupType?.toUpperCase() !== selectedGroup.toUpperCase()) return false;
    return true;
  });

  const selectedSection = selectedClass?.sections?.find((s: any) => s.id === selectedSectionId);

  // Additional unique shifts if any exist in the class sections
  const availableShifts = Array.from(
    new Set(
      selectedClass?.sections
        ?.map((s: any) => s.shift?.toUpperCase())
        .filter((sh: any) => Boolean(sh) && sh !== "MORNING" && sh !== "DAY") || []
    )
  ) as string[];

  const activeFields = isClass9To12 ? seniorFields : juniorFields;

  // Load saved field configurations from localStorage
  useEffect(() => {
    const sanitizeLoadedFields = (list: FormFieldDef[]) => {
      return list.filter((f) => {
        if (!f.isSystem) {
          const lower = f.key.toLowerCase();
          if (
            lower.startsWith("guardian_mobile") ||
            lower.startsWith("guardian_phone") ||
            lower.startsWith("religion_") ||
            lower.startsWith("gender_") ||
            lower.startsWith("address_")
          ) {
            return false;
          }
        }
        return true;
      });
    };

    const loadCustomFields = (targetCode?: string) => {
      const code = targetCode || getActiveTenantCode();
      const junKey = getScopedStorageKey("nctb_enroll_fields_junior", code);
      const senKey = getScopedStorageKey("nctb_enroll_fields_senior", code);

      try {
        const savedJunior = localStorage.getItem(junKey) || (code === "108254" ? localStorage.getItem("nctb_enroll_fields_junior") : null);
        if (savedJunior) {
          const parsed = sanitizeLoadedFields(JSON.parse(savedJunior));
          if (!parsed.some((f) => f.key === "gender")) {
            const fnIdx = parsed.findIndex((f) => f.key === "lastName");
            parsed.splice(fnIdx >= 0 ? fnIdx + 1 : 4, 0, {
              key: "gender",
              label: "Gender",
              type: "select",
              options: ["Male", "Female", "Other"],
              required: false,
              isSystem: true,
            });
          }
          setJuniorFields(parsed);
        } else {
          setJuniorFields(DEFAULT_JUNIOR_FIELDS);
        }
        const savedSenior = localStorage.getItem(senKey) || (code === "108254" ? localStorage.getItem("nctb_enroll_fields_senior") : null);
        if (savedSenior) {
          const parsed = sanitizeLoadedFields(JSON.parse(savedSenior));
          if (!parsed.some((f) => f.key === "gender")) {
            const fnIdx = parsed.findIndex((f) => f.key === "lastName");
            parsed.splice(fnIdx >= 0 ? fnIdx + 1 : 5, 0, {
              key: "gender",
              label: "Gender",
              type: "select",
              options: ["Male", "Female", "Other"],
              required: false,
              isSystem: true,
            });
          }
          setSeniorFields(parsed);
        } else {
          setSeniorFields(DEFAULT_SENIOR_FIELDS);
        }
      } catch (e) {
        console.error("Failed to load custom fields from localStorage", e);
      }
    };

    loadCustomFields();

    const handleTenantSwitch = (e: any) => {
      loadCustomFields(e?.detail?.code);
    };

    window.addEventListener(TENANT_SWITCH_EVENT, handleTenantSwitch);
    return () => {
      window.removeEventListener(TENANT_SWITCH_EVENT, handleTenantSwitch);
    };
  }, []);

  useEffect(() => {
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setClasses(data.data);
          if (data.data.length > 0) {
            setSelectedClassId(data.data[0].id);
            setSelectedSectionId("");
          }
        }
      });

    fetch("/api/subjects")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSubjects(data.data);
      });
  }, []);

  const formatGroupName = (grp: string) => {
    if (!grp) return "Science";
    if (grp.toUpperCase() === "BUSINESS_STUDIES") return "Business Studies";
    return grp.charAt(0).toUpperCase() + grp.slice(1).toLowerCase();
  };

  // Sync group with selected section
  useEffect(() => {
    if (selectedSectionId && selectedClass) {
      const sec = selectedClass.sections?.find((s: any) => s.id === selectedSectionId);
      if (sec?.groupType && sec.groupType !== "GENERAL") {
        setFormData((prev) => ({ ...prev, groupType: formatGroupName(sec.groupType) }));
      }
    }
  }, [selectedSectionId, selectedClass]);

  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    setSelectedGroup("ALL");
    setSelectedShift("");
    setSelectedSectionId("");
  };

  const handleShiftChange = (newShift: string) => {
    setSelectedShift(newShift);
    if (!selectedClass) return;
    if (selectedSectionId) {
      const matching = (selectedClass.sections || []).filter((s: any) => {
        if (newShift && newShift !== "ALL" && s.shift?.toUpperCase() !== newShift.toUpperCase()) return false;
        if (selectedGroup && selectedGroup !== "ALL" && s.groupType?.toUpperCase() !== selectedGroup.toUpperCase()) return false;
        return true;
      });
      const stillValid = matching.some((s: any) => s.id === selectedSectionId);
      if (!stillValid) {
        setSelectedSectionId("");
      }
    }
  };

  const handleGroupChange = (newGroup: string) => {
    setSelectedGroup(newGroup);
    if (!selectedClass) return;
    if (selectedSectionId) {
      const matching = (selectedClass.sections || []).filter((s: any) => {
        if (selectedShift && selectedShift !== "ALL" && s.shift?.toUpperCase() !== selectedShift.toUpperCase()) return false;
        if (newGroup && newGroup !== "ALL" && s.groupType?.toUpperCase() !== newGroup.toUpperCase()) return false;
        return true;
      });
      const stillValid = matching.some((s: any) => s.id === selectedSectionId);
      if (!stillValid) {
        setSelectedSectionId("");
      }
    }
    if (newGroup && newGroup !== "ALL") {
      setFormData((prev) => ({ ...prev, groupType: formatGroupName(newGroup) }));
    }
  };

  const fetchStudents = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("classId", selectedClassId);
      if (selectedSectionId) {
        params.set("sectionId", selectedSectionId);
      }
      if (selectedShift && selectedShift !== "ALL") {
        params.set("shift", selectedShift);
      }
      if (selectedGroup && selectedGroup !== "ALL") {
        params.set("groupType", selectedGroup);
      }
      if (selectedSession && selectedSession !== "ALL") {
        params.set("session", selectedSession);
      }
      const url = `/api/students?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setStudents(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClassId, selectedSectionId, selectedShift, selectedGroup, selectedSession]);

  const updateFormField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Open Add Field Modal
  const handleOpenAddModal = () => {
    if (isFieldsLocked) return;
    setEditingFieldKey(null);
    setFieldForm({
      label: "",
      type: "text",
      placeholder: "",
      required: false,
      optionsStr: "",
    });
    setIsFieldModalOpen(true);
  };

  // Open Edit Field Modal
  const handleOpenEditModal = (field: FormFieldDef) => {
    if (isFieldsLocked) return;
    setEditingFieldKey(field.key);
    setFieldForm({
      label: field.label,
      type: field.type,
      placeholder: field.placeholder || "",
      required: !!field.required,
      optionsStr: field.options ? field.options.join(", ") : "",
    });
    setIsFieldModalOpen(true);
  };

  // Save Field (Add or Update)
  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldForm.label.trim()) {
      alert("Field label is required.");
      return;
    }

    const currentList = isClass9To12 ? seniorFields : juniorFields;
    let updatedList: FormFieldDef[];

    if (editingFieldKey) {
      // Editing existing field
      updatedList = currentList.map((f) => {
        if (f.key === editingFieldKey) {
          return {
            ...f,
            label: fieldForm.label.trim(),
            type: fieldForm.type,
            placeholder: fieldForm.placeholder.trim(),
            required: fieldForm.required,
            options:
              fieldForm.type === "select"
                ? fieldForm.optionsStr
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : undefined,
          };
        }
        return f;
      });
    } else {
      // Adding new field
      const newKey =
        fieldForm.label
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_")
          .replace(/^_+|_+$/g, "") + `_${Date.now()}`;

      const newField: FormFieldDef = {
        key: newKey,
        label: fieldForm.label.trim(),
        type: fieldForm.type,
        placeholder: fieldForm.placeholder.trim(),
        required: fieldForm.required,
        options:
          fieldForm.type === "select"
            ? fieldForm.optionsStr
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
      };

      updatedList = [...currentList, newField];
    }

    const code = getActiveTenantCode();
    if (isClass9To12) {
      setSeniorFields(updatedList);
      localStorage.setItem(getScopedStorageKey("nctb_enroll_fields_senior", code), JSON.stringify(updatedList));
    } else {
      setJuniorFields(updatedList);
      localStorage.setItem(getScopedStorageKey("nctb_enroll_fields_junior", code), JSON.stringify(updatedList));
    }

    setIsFieldModalOpen(false);
  };

  // Remove Field
  const handleRemoveField = (fieldKey: string, fieldLabel: string) => {
    if (isFieldsLocked) return;
    if (!confirm(`Are you sure you want to remove "${fieldLabel}" from the Quick Enroll form and Enrolled Students table?`)) {
      return;
    }

    const currentList = isClass9To12 ? seniorFields : juniorFields;
    const updatedList = currentList.filter((f) => f.key !== fieldKey);
    const code = getActiveTenantCode();

    if (isClass9To12) {
      setSeniorFields(updatedList);
      localStorage.setItem(getScopedStorageKey("nctb_enroll_fields_senior", code), JSON.stringify(updatedList));
    } else {
      setJuniorFields(updatedList);
      localStorage.setItem(getScopedStorageKey("nctb_enroll_fields_junior", code), JSON.stringify(updatedList));
    }
  };

  // Reset to default NCTB fields
  const handleResetDefaults = () => {
    if (
      !confirm(
        `Reset all fields to default NCTB configuration for ${isClass9To12 ? "Classes 9-12" : "Classes 1-8"}?`
      )
    ) {
      return;
    }

    const code = getActiveTenantCode();
    if (isClass9To12) {
      setSeniorFields(DEFAULT_SENIOR_FIELDS);
      localStorage.removeItem(getScopedStorageKey("nctb_enroll_fields_senior", code));
      if (code === "108254") localStorage.removeItem("nctb_enroll_fields_senior");
    } else {
      setJuniorFields(DEFAULT_JUNIOR_FIELDS);
      localStorage.removeItem(getScopedStorageKey("nctb_enroll_fields_junior", code));
      if (code === "108254") localStorage.removeItem("nctb_enroll_fields_junior");
    }
  };

  // Download Excel Sheet Form (Template)
  const handleDownloadExcelTemplate = () => {
    const headers = activeFields.map((f) => f.label);

    // Sample Row 1
    const sampleRow1 = activeFields.map((f) => {
      switch (f.key) {
        case "classRoll":
          return 1;
        case "studentIdNo":
          return "ST-2026-001";
        case "firstName":
          return "Tanvir";
        case "lastName":
          return "Ahmed";
        case "groupType":
          return selectedGroup && selectedGroup !== "ALL" ? formatGroupName(selectedGroup) : isClass9To12 ? "Science" : "General";
        case "guardianName":
          return "Rafiqul Islam";
        case "guardianPhone":
          return "01712345678";
        case "religion":
          return "Islam";
        case "address":
          return "Dhaka, Bangladesh";
        case "fourthSubjectId":
          return subjects.length > 0 ? subjects[0].name : "Higher Math";
        default:
          return f.options && f.options.length > 0 ? f.options[0] : `Sample ${f.label}`;
      }
    });

    // Sample Row 2
    const sampleRow2 = activeFields.map((f) => {
      switch (f.key) {
        case "classRoll":
          return 2;
        case "studentIdNo":
          return "ST-2026-002";
        case "firstName":
          return "Sumaiya";
        case "lastName":
          return "Akter";
        case "groupType":
          return selectedGroup && selectedGroup !== "ALL" ? formatGroupName(selectedGroup) : isClass9To12 ? "Science" : "General";
        case "guardianName":
          return "Kamal Hossain";
        case "guardianPhone":
          return "01812345678";
        case "religion":
          return "Islam";
        case "address":
          return "Chittagong, Bangladesh";
        case "fourthSubjectId":
          return subjects.length > 1 ? subjects[1].name : "Biology";
        default:
          return f.options && f.options.length > 1 ? f.options[1] : `Sample ${f.label}`;
      }
    });

    const data = [headers, sampleRow1, sampleRow2];
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Auto-fit column widths
    ws["!cols"] = headers.map((h) => ({
      wch: Math.max(h.length + 5, 18),
    }));

    const wb = XLSX.utils.book_new();
    const sheetTitle = selectedClass ? selectedClass.name.replace(/[^a-zA-Z0-9]/g, "_") : "Students";
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle);

    const fileName = `${sheetTitle}_Enrollment_Form.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Upload and Parse Excel File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "array" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];

        const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        if (rawData.length < 2) {
          alert("The uploaded Excel sheet contains no student data rows.");
          return;
        }

        const fileHeaders: string[] = rawData[0].map((h) => String(h || "").trim());
        const norm = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");

        // Build header index mapping to active field definitions
        const colMap: Record<number, FormFieldDef> = {};
        fileHeaders.forEach((h, colIdx) => {
          const normH = norm(h);
          if (!normH) return;

          const matched = activeFields.find((f) => {
            const normKey = norm(f.key);
            const normLbl = norm(f.label);
            if (normH === normKey || normH === normLbl) return true;

            // Common aliases
            if (
              normKey === "classroll" &&
              (normH === "roll" ||
                normH === "rollno" ||
                normH === "classrollno" ||
                normH === "rollnumber" ||
                normH === "classroll" ||
                normH === "sl" ||
                normH === "slno")
            )
              return true;
            if (
              normKey === "studentidno" &&
              (normH === "id" ||
                normH === "studentid" ||
                normH === "stdid" ||
                normH === "idno" ||
                normH === "studentidno" ||
                normH === "regno" ||
                normH === "registrationno" ||
                normH === "studentno")
            )
              return true;
            if (
              normKey === "firstname" &&
              (normH === "name" ||
                normH === "studentname" ||
                normH === "fullname" ||
                normH === "firstname")
            )
              return true;
            if (
              normKey === "guardianname" &&
              (normH === "guardian" ||
                normH === "guardianname" ||
                normH === "fathername" ||
                normH === "parentname" ||
                normH === "fathersname")
            )
              return true;
            if (
              normKey === "guardianphone" &&
              (normH.includes("phone") ||
                normH.includes("mobile") ||
                normH.includes("contact") ||
                normH === "guardianmobileno" ||
                normH === "guardianphone" ||
                normH === "mobileno" ||
                normH === "smsphone")
            )
              return true;
            if (
              normKey === "gender" &&
              (normH === "gender" || normH === "sex" || normH === "lingo")
            )
              return true;
            if (
              normKey === "religion" &&
              (normH === "religion" || normH === "dharmo")
            )
              return true;
            if (
              normKey === "address" &&
              (normH === "address" ||
                normH === "thikana" ||
                normH === "location" ||
                normH === "village" ||
                normH === "presentaddress")
            )
              return true;
            if (normKey === "grouptype" && (normH === "group" || normH === "stream" || normH === "grouptype"))
              return true;
            if (
              normKey === "fourthsubjectid" &&
              (normH === "fourthsubject" ||
                normH === "optional4thsubject" ||
                normH === "4thsubject" ||
                normH === "fourthsubjectid")
            )
              return true;
            return false;
          });

          if (matched) {
            colMap[colIdx] = matched;
          }
        });

        // Parse student rows
        const parsedRows: any[] = [];
        for (let r = 1; r < rawData.length; r++) {
          const row = rawData[r];
          if (!row || row.every((c) => String(c).trim() === "")) continue;

          const studentObj: Record<string, any> = { customFields: {} };
          let hasData = false;

          Object.entries(colMap).forEach(([cIdx, field]) => {
            const rawVal = row[Number(cIdx)];
            if (rawVal !== undefined && rawVal !== "") {
              hasData = true;
              if (field.isSystem) {
                // If fourth subject name, map to subject ID if possible
                if (field.key === "fourthSubjectId") {
                  const subMatch = subjects.find(
                    (s) =>
                      norm(s.name) === norm(String(rawVal)) ||
                      norm(s.subjectCode) === norm(String(rawVal))
                  );
                  studentObj.fourthSubjectId = subMatch ? subMatch.id : rawVal;
                } else {
                  studentObj[field.key] = rawVal;
                }
              } else {
                studentObj.customFields[field.key] = rawVal;
              }
            }
          });

          if (hasData) {
            // Default fallbacks if missing
            const activeSec = (selectedClass?.sections || []).find((s: any) => s.id === selectedSectionId);
            const fallbackGroup = activeSec?.groupType && activeSec.groupType !== "GENERAL"
              ? formatGroupName(activeSec.groupType)
              : selectedGroup && selectedGroup !== "ALL"
              ? formatGroupName(selectedGroup)
              : isClass9To12 ? "Science" : "General";

            if (!studentObj.classRoll) studentObj.classRoll = r;
            if (!studentObj.studentIdNo) studentObj.studentIdNo = `ST-${selectedClass?.name?.replace(/\D/g, "") || "26"}-${String(r).padStart(3, "0")}`;
            if (!studentObj.firstName) studentObj.firstName = `Student ${r}`;
            if (!studentObj.guardianPhone) studentObj.guardianPhone = "01700000000";
            if (!studentObj.groupType && isClass9To12) studentObj.groupType = fallbackGroup;

            parsedRows.push(studentObj);
          }
        }

        if (parsedRows.length === 0) {
          alert("Could not parse any valid student records from the Excel sheet. Please ensure the column headers match your form fields.");
          return;
        }

        setImportPreview({
          fileName: file.name,
          rows: parsedRows,
          headers: fileHeaders,
        });
      } catch (err: any) {
        console.error(err);
        alert("Failed to parse Excel file: " + err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Confirm and Execute Bulk Import
  const handleConfirmImport = async () => {
    if (!importPreview || !selectedClassId || !selectedSectionId) {
      alert("Please ensure both a Class and a Section are selected before importing.");
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch("/api/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          sectionId: selectedSectionId,
          students: importPreview.rows,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message || `Successfully enrolled ${data.count} students from Excel!`);
        setImportPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchStudents();
      } else {
        alert("Bulk enrollment failed: " + data.error);
      }
    } catch (err: any) {
      alert("Import request failed: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Handle Single Student Quick Enroll Submit
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedSectionId) {
      alert("Please select a Class and Section first.");
      return;
    }

    // Validate active required fields
    for (const f of activeFields) {
      if (f.required) {
        const val = formData[f.key];
        if (val === undefined || val === null || String(val).trim() === "") {
          alert(`Please fill in required field: "${f.label}"`);
          return;
        }
      }
    }

    const roll = formData.classRoll;
    const stdId = formData.studentIdNo;
    const fName = formData.firstName;
    const phone = formData.guardianPhone;

    const currentClass = classes.find((c) => c.id === selectedClassId);
    const currentSection = currentClass?.sections?.find((s: any) => s.id === selectedSectionId);
    const effectiveGroup = isClass9To12
      ? formData.groupType?.toUpperCase().replace(/\s+/g, "_") || currentSection?.groupType || "SCIENCE"
      : "GENERAL";

    // Collect custom fields
    const customData: Record<string, any> = {};
    const systemKeys = new Set([
      "groupType",
      "classRoll",
      "studentIdNo",
      "firstName",
      "lastName",
      "guardianName",
      "guardianPhone",
      "religion",
      "address",
      "fourthSubjectId",
    ]);

    for (const f of activeFields) {
      if (!systemKeys.has(f.key) && formData[f.key] !== undefined && formData[f.key] !== "") {
        customData[f.key] = formData[f.key];
      }
    }

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIdNo: stdId || `ST-${Date.now().toString().slice(-4)}`,
          firstName: fName || "Student",
          lastName: formData.lastName || "",
          classRoll: roll || "1",
          guardianName: formData.guardianName ? String(formData.guardianName).trim() : "",
          guardianPhone: phone || "01700000000",
          religion: formData.religion || undefined,
          address: formData.address || undefined,
          classId: selectedClassId,
          sectionId: selectedSectionId,
          groupType: effectiveGroup,
          fourthSubjectId: isClass9To12 ? formData.fourthSubjectId || undefined : undefined,
          customFields: Object.keys(customData).length > 0 ? customData : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Reset form
        setFormData({
          groupType: currentSection?.groupType ? currentSection.groupType.charAt(0) + currentSection.groupType.slice(1).toLowerCase() : "Science",
          classRoll: "",
          studentIdNo: "",
          firstName: "",
          lastName: "",
          guardianName: "",
          guardianPhone: "",
          religion: "",
          address: "",
          fourthSubjectId: "",
        });
        fetchStudents();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err: any) {
      alert("Failed: " + err.message);
    }
  };

  // Helper to render value in table cell dynamically
  const renderTableCell = (
    enr: any,
    field: FormFieldDef,
    fourthSub: any,
    customData: Record<string, any>
  ) => {
    switch (field.key) {
      case "classRoll":
        return <span className="font-bold text-slate-900 font-mono">#{enr.classRoll}</span>;
      case "studentIdNo":
        return <span className="font-mono text-slate-600">{enr.student.studentIdNo}</span>;
      case "firstName":
        return (
          <div className="flex items-center space-x-1.5">
            <span className="font-medium text-slate-900">{enr.student.firstName}</span>
            {!selectedSectionId && enr.section && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-medium">
                {enr.section.name}
                {enr.section.shift ? ` (${enr.section.shift === "MORNING" ? "Morning" : "Day"})` : ""}
              </span>
            )}
          </div>
        );
      case "lastName":
        return <span className="text-slate-700">{enr.student.lastName || "—"}</span>;
      case "groupType":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
            {enr.groupType}
          </span>
        );
      case "guardianName":
        return <span className="font-medium text-slate-800">{enr.student.guardianName || "—"}</span>;
      case "guardianPhone":
        return (
          <span className="text-slate-600 font-mono flex items-center space-x-1">
            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{enr.student.guardianPhone}</span>
          </span>
        );
      case "religion":
        return <span>{enr.student.religion || "—"}</span>;
      case "address":
        return (
          <span className="max-w-[160px] truncate block text-slate-600" title={enr.student.address}>
            {enr.student.address || "—"}
          </span>
        );
      case "fourthSubjectId":
        return fourthSub ? (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
            {fourthSub.subject.name}
          </span>
        ) : (
          <span className="text-slate-400 italic">None assigned</span>
        );
      default: {
        const val = customData[field.key] ?? (enr.student as any)[field.key];
        if (field.type === "image") {
          return val ? (
            <div className="flex items-center space-x-2">
              <img
                src={String(val)}
                alt={field.label}
                className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-2xs hover:scale-125 transition-transform cursor-pointer"
                onClick={() => {
                  const w = window.open("");
                  w?.document.write(`<html><head><title>${field.label} Preview</title></head><body style="margin:0;background:#0f172a;display:flex;align-items:center;justify-center;min-height:100vh;"><img src="${val}" style="max-width:90%;max-height:90vh;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.5);" /></body></html>`);
                }}
                title="Click to view full image"
              />
              <span className="text-[10px] text-slate-500 font-mono">Image</span>
            </div>
          ) : (
            <span className="text-slate-400 italic text-[11px]">No image</span>
          );
        }
        return <span className="font-medium text-slate-800">{val ? String(val) : "—"}</span>;
      }
    }
  };

  const enrollmentColumns = useMemo(() => {
    const cols: AppTableColumn<any>[] = activeFields.map((field) => ({
      id: field.key,
      label: field.label,
      sortable: field.key === "classRoll" || field.key === "firstName" || field.key === "studentIdNo",
      render: (enr) => {
        const fourthSub = enr.allocations?.find((a: any) => a.subjectType === "OPTIONAL_4TH");
        let customData: Record<string, any> = {};
        if (enr.student.customFields) {
          try {
            customData =
              typeof enr.student.customFields === "string"
                ? JSON.parse(enr.student.customFields)
                : enr.student.customFields;
          } catch {
            /* ignore */
          }
        }
        return renderTableCell(enr, field, fourthSub, customData);
      },
    }));
    cols.push({
      id: "actions",
      label: "Actions",
      align: "right",
      sortable: false,
      render: (enr) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
          <IconButton size="small" color="success" onClick={() => handleOpenEditStudent(enr)} title={`Edit ${enr.student.firstName}`}>
            <Pencil className="w-3.5 h-3.5" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDeleteStudent(enr)} title={`Delete ${enr.student.firstName}`}>
            <Trash2 className="w-3.5 h-3.5" />
          </IconButton>
        </Stack>
      ),
    });
    return cols;
  }, [activeFields, selectedSectionId]);

  return (
    <StudentAdminPageShell>
      <StudentPageHeader heading="Student Enrollment" current="Enrollment" />

      <AppCard>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <SessionSelect
              value={selectedSession}
              onChange={(val) => setSelectedSession(val)}
              label="Session"
              includeAll={true}
              allLabel="All Sessions"
              activeOnly={false}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <AppSelect
              label="Class"
              value={selectedClassId}
              onChange={handleClassChange}
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <AppSelect
              label="Shift"
              value={selectedShift}
              onChange={handleShiftChange}
              options={[
                { value: "", label: "All Shifts" },
                { value: "MORNING", label: "Morning" },
                { value: "DAY", label: "Day" },
                ...availableShifts.map((sh) => ({
                  value: sh,
                  label: sh.charAt(0) + sh.slice(1).toLowerCase(),
                })),
              ]}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <AppSelect
              label="Group"
              value={selectedGroup}
              onChange={handleGroupChange}
              options={[
                ...standardGroups.map((grp) => ({ value: grp.value, label: grp.label })),
                ...customGroups.map((cg) => ({ value: cg, label: cg.replace(/_/g, " ") })),
              ]}
            />
          </Grid>
          {selectedClass && (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <AppSelect
                label="Section"
                value={selectedSectionId}
                onChange={setSelectedSectionId}
                options={[
                  { value: "", label: "All Sections" },
                  ...availableSections.map((s: any) => {
                    const shiftLabel = s.shift === "MORNING" ? "Morning" : s.shift === "DAY" ? "Day" : s.shift;
                    return {
                      value: s.id,
                      label: `${s.name} (${s.groupType})${!selectedShift && shiftLabel ? ` • ${shiftLabel}` : ""}`,
                    };
                  }),
                ]}
              />
            </Grid>
          )}
        </Grid>
      </AppCard>

      <AppCard>
        <Stack spacing={2}>
        {/* Hidden Excel File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".xlsx, .xls, .csv"
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">Quick Enroll New Student</h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              {isClass9To12 ? "Classes 9-12 Stream" : "Classes 1-8 General"}
            </span>
            {selectedGroup && selectedGroup !== "ALL" && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                {formatGroupName(selectedGroup)} Group
              </span>
            )}
            {selectedSection?.shift && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  selectedSection.shift === "MORNING"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {selectedSection.shift === "MORNING" ? "Morning Shift" : "Day Shift"}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Download Excel Sheet Form Button */}
            <AppButton
              type="button"
              size="small"
              variant="outlined"
              onClick={handleDownloadExcelTemplate}
              title="Download Excel sheet form matching currently active fields"
              startIcon={<Download className="w-3.5 h-3.5" />}
            >
              Download Excel Form
            </AppButton>

            <AppButton
              type="button"
              size="small"
              variant="contained"
              color="success"
              onClick={() => fileInputRef.current?.click()}
              title="Upload and bulk enroll students from an Excel sheet"
              startIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            >
              Upload Excel Sheet
            </AppButton>

            {!isFieldsLocked && (
              <AppButton
                type="button"
                size="small"
                variant="outlined"
                onClick={handleOpenAddModal}
                title="Add a new custom field to Quick Enroll and the table"
                startIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Field
              </AppButton>
            )}

            <AppButton
              type="button"
              size="small"
              variant={isFieldsLocked ? "contained" : "outlined"}
              color={isFieldsLocked ? "warning" : "success"}
              onClick={toggleFieldsLock}
              title={
                isFieldsLocked
                  ? "Fields are currently locked. Click to unlock and edit, delete, or add fields."
                  : "Fields are currently unlocked. Click to lock form fields."
              }
              startIcon={isFieldsLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            >
              {isFieldsLocked ? "Locked" : "Unlocked"}
            </AppButton>
          </div>
        </div>

        {/* Quick Enroll Form */}
        <Box component="form" onSubmit={handleEnrollStudent}>
          <Grid container spacing={1.5}>
            {activeFields.map((field) => {
              const val = formData[field.key] ?? "";
              const selectLabel = field.required ? `${field.label} *` : field.label;
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={field.key}>
                  <Box sx={{ position: "relative", height: 1 }}>
                    {!isFieldsLocked && (
                      <Stack direction="row" spacing={0.25} sx={{ position: "absolute", top: -2, right: -2, zIndex: 1 }}>
                        <IconButton size="small" onClick={() => handleOpenEditModal(field)} title={`Edit ${field.label}`}>
                          <Pencil className="w-3 h-3" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleRemoveField(field.key, field.label)} title={`Remove ${field.label}`} color="error">
                          <Trash2 className="w-3 h-3" />
                        </IconButton>
                      </Stack>
                    )}

                    {field.key === "groupType" ? (
                      <AppSelect
                        label={selectLabel}
                        value={val || "Science"}
                        onChange={(v) => updateFormField("groupType", v)}
                        options={[
                          { value: "Science", label: "Science" },
                          { value: "Humanities", label: "Humanities" },
                          { value: "Business Studies", label: "Business Studies" },
                          ...(!isClass11Or12 ? [{ value: "General", label: "General" }] : []),
                        ]}
                      />
                    ) : field.key === "fourthSubjectId" ? (
                      <AppSelect
                        label={selectLabel}
                        value={val}
                        onChange={(v) => updateFormField("fourthSubjectId", v)}
                        options={[
                          { value: "", label: "Default (Auto / None)" },
                          ...subjects.map((sub) => ({
                            value: sub.id,
                            label: `${sub.name} (${sub.subjectCode})`,
                          })),
                        ]}
                      />
                    ) : field.type === "select" ? (
                      <AppSelect
                        label={selectLabel}
                        value={val}
                        onChange={(v) => updateFormField(field.key, v)}
                        options={[
                          { value: "", label: field.placeholder || `Select ${field.label}` },
                          ...(field.options?.map((opt) => ({ value: opt, label: opt })) || []),
                        ]}
                      />
                    ) : field.type === "date" ? (
                      <DatePicker
                        label={field.label}
                        value={val}
                        onChange={(v) => updateFormField(field.key, v)}
                        required={field.required}
                      />
                    ) : field.type === "image" ? (
                      <Stack spacing={1}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {selectLabel}
                        </Typography>
                        {val ? (
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center", p: 1, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 1.5 }}>
                            <Box component="img" src={val} alt={field.label} sx={{ width: 36, height: 36, borderRadius: 1, objectFit: "cover" }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" noWrap sx={{ display: "block", fontWeight: 600 }}>
                                {field.label} selected
                              </Typography>
                              <AppButton type="button" size="small" variant="outlined" color="error" onClick={() => updateFormField(field.key, "")}>
                                Remove
                              </AppButton>
                            </Box>
                          </Stack>
                        ) : (
                          <Box
                            component="label"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 1,
                              p: 1.5,
                              border: "1px dashed",
                              borderColor: "divider",
                              borderRadius: 1.5,
                              bgcolor: "background.paper",
                              cursor: "pointer",
                              "&:hover": { borderColor: "primary.main", bgcolor: "primary.lighter" },
                            }}
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {field.placeholder || "Upload Image"}
                            </Typography>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              required={field.required && !val}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 2 * 1024 * 1024) {
                                    alert("Please choose an image under 2MB.");
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    updateFormField(field.key, event.target?.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </Box>
                        )}
                      </Stack>
                    ) : (
                      <AppTextField
                        label={field.label}
                        type={field.type === "number" ? "number" : "text"}
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        value={val}
                        onChange={(e) => updateFormField(field.key, e.target.value)}
                        required={field.required}
                      />
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{
              alignItems: { sm: "center" },
              justifyContent: "space-between",
              pt: 2,
              mt: 2,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {activeFields.length} active fields • Synchronized with the enrolled students table
            </Typography>
            <AppButton type="submit" variant="contained" color="success" startIcon={<UserPlus className="w-4 h-4" />}>
              Enroll Student
            </AppButton>
          </Stack>
        </Box>
        </Stack>
      </AppCard>

      {/* Excel Import Preview Modal */}
      {importPreview && (() => {
        const previewRollCounts = new Map<number, number>();
        importPreview.rows.forEach((r) => {
          const roll = parseInt(String(r.classRoll).replace(/\D/g, "") || "0", 10);
          if (roll > 0) previewRollCounts.set(roll, (previewRollCounts.get(roll) || 0) + 1);
        });

        const existingRollMap = new Map<number, any>();
        students.forEach((s) => {
          existingRollMap.set(s.classRoll, s);
        });

        const duplicateRollsInFile = Array.from(previewRollCounts.entries())
          .filter(([_, count]) => count > 1)
          .map(([roll]) => roll);

        const existingCollisions = importPreview.rows.filter((r) => {
          const roll = parseInt(String(r.classRoll).replace(/\D/g, "") || "0", 10);
          const existing = existingRollMap.get(roll);
          return existing && existing.student?.studentIdNo !== String(r.studentIdNo).trim();
        });

        const hasBlockingDuplicates = duplicateRollsInFile.length > 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center space-x-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Excel Sheet Import Preview
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      File: <span className="font-mono text-slate-700 font-semibold">{importPreview.fileName}</span> • Target: <span className="font-semibold text-emerald-700">{selectedClass?.name} ({selectedSection?.name || "Selected Section"})</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setImportPreview(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-3 text-xs flex-1">
                {hasBlockingDuplicates ? (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Duplicate Roll Numbers in Excel:</strong>
                      <p className="text-[11px] mt-0.5">
                        Roll #{duplicateRollsInFile.join(", #")} appears more than once in this file. Every student in this section must have a unique Class Roll. Please fix these in your Excel file before importing.
                      </p>
                    </div>
                  </div>
                ) : existingCollisions.length > 0 ? (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Existing Roll Collision Warning:</strong>
                      <p className="text-[11px] mt-0.5">
                        {existingCollisions.length} student(s) in this file have rolls already assigned to existing students in this section. Please review highlighted rows before proceeding.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg flex items-center justify-between">
                    <span>
                      Ready to enroll <strong>{importPreview.rows.length}</strong> students parsed from the Excel file into <strong>{selectedClass?.name} - {selectedSection?.name || "All"}</strong>.
                    </span>
                    <span className="font-mono font-bold bg-white px-2 py-0.5 rounded text-emerald-700 border border-emerald-200">
                      {importPreview.rows.length} records
                    </span>
                  </div>
                )}

                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-[340px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider sticky top-0">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Roll</th>
                        <th className="p-2.5">Student ID</th>
                        <th className="p-2.5">Full Name</th>
                        <th className="p-2.5">Group</th>
                        <th className="p-2.5">Guardian Phone</th>
                        <th className="p-2.5">Religion</th>
                        <th className="p-2.5">Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importPreview.rows.map((row, idx) => {
                        const rollNum = parseInt(String(row.classRoll).replace(/\D/g, "") || "0", 10);
                        const isDuplicateInFile = (previewRollCounts.get(rollNum) || 0) > 1;
                        const existingEnr = existingRollMap.get(rollNum);
                        const isCollisionWithExisting = existingEnr && existingEnr.student?.studentIdNo !== String(row.studentIdNo).trim();

                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50 ${
                              isDuplicateInFile
                                ? "bg-red-50/60"
                                : isCollisionWithExisting
                                ? "bg-amber-50/50"
                                : ""
                            }`}
                          >
                            <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="p-2.5 font-bold font-mono">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded ${
                                  isDuplicateInFile
                                    ? "bg-red-100 text-red-800 border border-red-200"
                                    : isCollisionWithExisting
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "text-slate-900"
                                }`}
                                title={
                                  isDuplicateInFile
                                    ? "Duplicate roll in Excel file"
                                    : isCollisionWithExisting
                                    ? `Already assigned to ${existingEnr.student?.firstName} (${existingEnr.student?.studentIdNo})`
                                    : ""
                                }
                              >
                                #{row.classRoll}
                                {isDuplicateInFile && " ⚠️ Duplicate"}
                                {!isDuplicateInFile && isCollisionWithExisting && " ⚠️ Exists"}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-slate-600">{row.studentIdNo}</td>
                            <td className="p-2.5 font-medium text-slate-900">
                              {row.firstName} {row.lastName || ""}
                            </td>
                            <td className="p-2.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                                {row.groupType || (isClass9To12 ? "Science" : "General")}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-slate-600">{row.guardianPhone}</td>
                            <td className="p-2.5 text-slate-600">{row.religion || "—"}</td>
                            <td className="p-2.5 text-slate-600 max-w-[120px] truncate" title={row.address}>
                              {row.address || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2">
                <AppButton
                  type="button"
                  variant="ghost"
                  color="inherit"
                  onClick={() => setImportPreview(null)}
                  disabled={isImporting}
                >
                  Cancel
                </AppButton>
                <AppButton
                  type="button"
                  variant="contained"
                  color="success"
                  onClick={handleConfirmImport}
                  disabled={hasBlockingDuplicates}
                  loading={isImporting}
                  startIcon={<Check className="w-4 h-4" />}
                >
                  {hasBlockingDuplicates
                    ? "Resolve Duplicate Rolls to Continue"
                    : `Confirm & Enroll ${importPreview.rows.length} Students`}
                </AppButton>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add / Edit Field Modal */}
      {isFieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <Settings className="w-4 h-4 text-emerald-600" />
                <span>{editingFieldKey ? `Edit Field: ${fieldForm.label || "Field"}` : "Add New Field"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFieldModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <Box component="form" onSubmit={handleSaveField} sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                <AppTextField
                  label="Field Label / Title"
                  placeholder="e.g. Blood Group, Date of Birth, Mother Name"
                  value={fieldForm.label}
                  onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                  required
                  autoFocus
                />
                <AppSelect
                  label="Field Input Type"
                  value={fieldForm.type}
                  onChange={(v) => setFieldForm({ ...fieldForm, type: v as any })}
                  options={[
                    { value: "text", label: "Text (Single-line input)" },
                    { value: "number", label: "Number (Digits / Counter)" },
                    { value: "select", label: "Select Dropdown (Choices list)" },
                    { value: "date", label: "Date (Calendar picker)" },
                    { value: "image", label: "Image (Photo / Image upload)" },
                  ]}
                />
                {fieldForm.type === "select" && (
                  <AppTextField
                    label="Dropdown Options (comma-separated)"
                    placeholder="e.g. A+, A-, B+, B-, O+, O-, AB+, AB-"
                    value={fieldForm.optionsStr}
                    onChange={(e) => setFieldForm({ ...fieldForm, optionsStr: e.target.value })}
                    helperText="Separate each selectable option with a comma."
                    required
                  />
                )}
                <AppTextField
                  label="Placeholder Text"
                  placeholder="e.g. e.g. A+"
                  value={fieldForm.placeholder}
                  onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={fieldForm.required}
                      onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Mark this field as Required (*)"
                />
                <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", pt: 1, borderTop: 1, borderColor: "divider" }}>
                  <AppButton type="button" variant="outlined" color="error" onClick={() => setIsFieldModalOpen(false)}>
                    Cancel
                  </AppButton>
                  <AppButton type="submit" variant="contained" color="success" startIcon={<Check className="w-3.5 h-3.5" />}>
                    {editingFieldKey ? "Update Field" : "Add Field"}
                  </AppButton>
                </Stack>
              </Stack>
            </Box>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Edit Student: {editingEnrollment.student.firstName} {editingEnrollment.student.lastName || ""}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Roll: #{editingEnrollment.classRoll} • ID: {editingEnrollment.student.studentIdNo} • Section: {editingEnrollment.section?.name || "Section A"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEnrollment(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <Box component="form" onSubmit={handleSaveStudentEdit} sx={{ p: 2.5, overflowY: "auto", flex: 1 }}>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <AppTextField
                    label="Class Roll"
                    type="number"
                    value={editFormData.classRoll ?? ""}
                    onChange={(e) => setEditFormData({ ...editFormData, classRoll: e.target.value })}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <AppTextField
                    label="Student ID"
                    value={editFormData.studentIdNo ?? ""}
                    onChange={(e) => setEditFormData({ ...editFormData, studentIdNo: e.target.value })}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <AppTextField
                    label="First Name"
                    value={editFormData.firstName ?? ""}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <AppTextField
                    label="Last Name"
                    value={editFormData.lastName ?? ""}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <AppSelect
                    label="Section"
                    value={editFormData.sectionId ?? ""}
                    onChange={(v) => setEditFormData({ ...editFormData, sectionId: v })}
                    options={(selectedClass?.sections || []).map((s: any) => ({
                      value: s.id,
                      label: `${s.name} (${s.groupType})`,
                    }))}
                  />
                </Grid>
                {isClass9To12 && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <AppSelect
                      label="Academic Group"
                      value={editFormData.groupType ?? "Science"}
                      onChange={(v) => setEditFormData({ ...editFormData, groupType: v })}
                      options={[
                        { value: "Science", label: "Science" },
                        { value: "Humanities", label: "Humanities" },
                        { value: "Business Studies", label: "Business Studies" },
                        ...(!isClass11Or12 ? [{ value: "General", label: "General" }] : []),
                      ]}
                    />
                  </Grid>
                )}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <AppTextField
                    label="Guardian Name"
                    placeholder="Guardian or Father/Mother Name"
                    value={editFormData.guardianName ?? ""}
                    onChange={(e) => setEditFormData({ ...editFormData, guardianName: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <AppTextField
                    label="Guardian Phone (SMS)"
                    value={editFormData.guardianPhone ?? ""}
                    onChange={(e) => setEditFormData({ ...editFormData, guardianPhone: e.target.value })}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <AppSelect
                    label="Religion"
                    value={editFormData.religion ?? ""}
                    onChange={(v) => setEditFormData({ ...editFormData, religion: v })}
                    options={[
                      { value: "", label: "Not Specified" },
                      { value: "Islam", label: "Islam" },
                      { value: "Hinduism", label: "Hinduism" },
                      { value: "Buddhism", label: "Buddhism" },
                      { value: "Christianity", label: "Christianity" },
                      { value: "Other", label: "Other" },
                    ]}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <AppTextField
                    label="Address"
                    value={editFormData.address ?? ""}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <AppSelect
                    label="Student Category"
                    value={editFormData.studentCategory ?? "General"}
                    onChange={(v) => setEditFormData({ ...editFormData, studentCategory: v })}
                    options={[
                      { value: "General", label: "General" },
                      { value: "Military", label: "Military" },
                    ]}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <AppSelect
                    label="Service (Bus / Hostel / Extra Coaching)"
                    value={editFormData.service ?? "None"}
                    onChange={(v) => setEditFormData({ ...editFormData, service: v })}
                    options={[
                      { value: "None", label: "None" },
                      { value: "Bus", label: "Bus" },
                      { value: "Hostel", label: "Hostel" },
                      { value: "Extra Coaching", label: "Extra Coaching" },
                      { value: "Bus, Extra Coaching", label: "Bus + Extra Coaching" },
                      { value: "Hostel, Extra Coaching", label: "Hostel + Extra Coaching" },
                      { value: "Bus, Hostel", label: "Bus + Hostel" },
                      { value: "Bus, Hostel, Extra Coaching", label: "All (Bus, Hostel, Extra Coaching)" },
                    ]}
                  />
                </Grid>
                {isClass9To12 && (
                  <Grid size={{ xs: 12 }}>
                    <AppSelect
                      label="Allocated 4th Subject (Optional)"
                      value={editFormData.fourthSubjectId ?? ""}
                      onChange={(v) => setEditFormData({ ...editFormData, fourthSubjectId: v })}
                      options={[
                        { value: "", label: "None / Default" },
                        ...subjects.map((sub) => ({
                          value: sub.id,
                          label: `${sub.name} (${sub.subjectCode})`,
                        })),
                      ]}
                    />
                  </Grid>
                )}
              </Grid>

              <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", mt: 2.5, pt: 2, borderTop: 1, borderColor: "divider" }}>
                <AppButton type="button" variant="outlined" color="error" onClick={() => setEditingEnrollment(null)} disabled={isSavingEdit}>
                  Cancel
                </AppButton>
                <AppButton type="submit" variant="contained" color="success" loading={isSavingEdit} startIcon={<Check className="w-4 h-4" />}>
                  Save Changes
                </AppButton>
              </Stack>
            </Box>
          </div>
        </div>
      )}

      <AppCard>
        <TableFilterBar showSearch={false}>
          <AppTable<any>
        embedded
        rows={students}
        rowKey={(row) => row.id}
        loading={loading}
        defaultOrderBy="classRoll"
        minWidth={Math.max(800, activeFields.length * 120 + 160)}
        showCheckbox
        selected={Array.from(selectedEnrollmentIds)}
        onSelectRow={toggleSelectStudent}
        onSelectAllRows={(checked) => {
          if (checked) setSelectedEnrollmentIds(new Set(students.map((s: any) => s.id)));
          else setSelectedEnrollmentIds(new Set());
        }}
        columns={enrollmentColumns}
      />
        </TableFilterBar>
      </AppCard>
    </StudentAdminPageShell>
  );
}

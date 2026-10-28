"use client";

import { useEffect, useState, useRef } from "react";
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
} from "lucide-react";
import { StudentNavHeader } from "@/app/student/StudentNavHeader";
import { SessionSelect } from "@/components/SessionSelect";
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <StudentNavHeader />

      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Users className="w-5 h-5 text-emerald-600" />
          <span>Student Enrollment</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Enroll students individually or import in bulk from Excel spreadsheets.
        </p>
      </div>

      {/* Session, Class, Shift, Group & Section Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-4 text-xs shadow-sm">
        <SessionSelect
          value={selectedSession}
          onChange={(val) => setSelectedSession(val)}
          label="Filter Session:"
          includeAll={true}
          allLabel="All Sessions"
          activeOnly={false}
          selectClassName="p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
        />

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Filter Class:</label>
          <select
            value={selectedClassId}
            onChange={(e) => handleClassChange(e.target.value)}
            className="p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Filter Shift:</label>
          <select
            value={selectedShift}
            onChange={(e) => handleShiftChange(e.target.value)}
            className="p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="">All Shifts</option>
            <option value="MORNING">Morning</option>
            <option value="DAY">Day</option>
            {availableShifts.map((sh) => (
              <option key={sh} value={sh}>
                {sh.charAt(0) + sh.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Filter Group:</label>
          <select
            value={selectedGroup}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            {standardGroups.map((grp) => (
              <option key={grp.value} value={grp.value}>
                {grp.label}
              </option>
            ))}
            {customGroups.map((cg) => (
              <option key={cg} value={cg}>
                {cg.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {selectedClass && (
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Filter Section:</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="">All Sections</option>
              {availableSections.map((s: any) => {
                const shiftLabel = s.shift === "MORNING" ? "Morning" : s.shift === "DAY" ? "Day" : s.shift;
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.groupType}){(!selectedShift && shiftLabel) ? ` • ${shiftLabel}` : ""}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Quick Enroll New Student Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
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
            <button
              type="button"
              onClick={handleDownloadExcelTemplate}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-xs"
              title="Download Excel sheet form matching currently active fields"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download Excel Form</span>
            </button>

            {/* Upload Data From Excel Sheet Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition-colors shadow-xs"
              title="Upload and bulk enroll students from an Excel sheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Upload Excel Sheet</span>
            </button>

            {/* Add Field Button - Hidden when locked */}
            {!isFieldsLocked && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                title="Add a new custom field to Quick Enroll and the table"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>Add Field</span>
              </button>
            )}

            {/* Lock / Unlock Toggle Button (Replaces Reset button) */}
            <button
              type="button"
              onClick={toggleFieldsLock}
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border font-semibold text-xs transition-colors shadow-xs cursor-pointer ${
                isFieldsLocked
                  ? "border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800"
                  : "border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
              }`}
              title={
                isFieldsLocked
                  ? "Fields are currently locked. Click to unlock and edit, delete, or add fields."
                  : "Fields are currently unlocked. Click to lock form fields."
              }
            >
              {isFieldsLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Locked</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Unlocked</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Enroll Form */}
        <form onSubmit={handleEnrollStudent} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {activeFields.map((field) => {
              const val = formData[field.key] ?? "";
              return (
                <div key={field.key} className="group relative bg-slate-50/50 p-2 rounded-lg border border-slate-100 hover:border-emerald-200 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 truncate text-[11px]" title={field.label}>
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {!isFieldsLocked && (
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(field)}
                          className="p-1 hover:bg-white text-slate-500 hover:text-emerald-600 rounded transition-colors shadow-xs cursor-pointer"
                          title={`Edit ${field.label}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(field.key, field.label)}
                          className="p-1 hover:bg-white text-slate-500 hover:text-red-600 rounded transition-colors shadow-xs cursor-pointer"
                          title={`Remove ${field.label}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {field.key === "groupType" ? (
                    <select
                      value={val || "Science"}
                      onChange={(e) => updateFormField("groupType", e.target.value)}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                      required={field.required}
                    >
                      <option value="Science">Science</option>
                      <option value="Humanities">Humanities</option>
                      <option value="Business Studies">Business Studies</option>
                      {!isClass11Or12 && <option value="General">General</option>}
                    </select>
                  ) : field.key === "fourthSubjectId" ? (
                    <select
                      value={val}
                      onChange={(e) => updateFormField("fourthSubjectId", e.target.value)}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                      required={field.required}
                    >
                      <option value="">Default (Auto / None)</option>
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.subjectCode})
                        </option>
                      ))}
                    </select>
                  ) : field.type === "select" ? (
                    <select
                      value={val}
                      onChange={(e) => updateFormField(field.key, e.target.value)}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                      required={field.required}
                    >
                      <option value="">{field.placeholder || `Select ${field.label}`}</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "image" ? (
                    <div className="space-y-1.5">
                      {val ? (
                        <div className="flex items-center space-x-2 p-1.5 bg-white border border-slate-200 rounded-lg">
                          <img
                            src={val}
                            alt={field.label}
                            className="w-8 h-8 rounded-md object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-700 font-medium truncate">{field.label} Selected</p>
                            <button
                              type="button"
                              onClick={() => updateFormField(field.key, "")}
                              className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center space-x-1.5 w-full p-2 border border-dashed border-slate-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer bg-white transition-colors text-slate-600">
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-[11px] font-medium truncate">{field.placeholder || "Upload Image"}</span>
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
                        </label>
                      )}
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder || `Enter ${field.label}`}
                      value={val}
                      onChange={(e) => updateFormField(field.key, e.target.value)}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                      required={field.required}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Form Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center space-x-2 text-slate-500">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>
                {activeFields.length} active fields • Synchronized in realtime with Enrolled Students table below
              </span>
            </div>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll Student</span>
            </button>
          </div>
        </form>
      </div>

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
                <button
                  type="button"
                  onClick={() => setImportPreview(null)}
                  disabled={isImporting}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isImporting || hasBlockingDuplicates}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm text-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isImporting
                      ? "Enrolling Students..."
                      : hasBlockingDuplicates
                      ? "Resolve Duplicate Rolls to Continue"
                      : `Confirm & Enroll ${importPreview.rows.length} Students`}
                  </span>
                </button>
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

            <form onSubmit={handleSaveField} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Field Label / Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Blood Group, Date of Birth, Mother Name"
                  value={fieldForm.label}
                  onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Field Input Type</label>
                <select
                  value={fieldForm.type}
                  onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value as any })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="text">Text (Single-line input)</option>
                  <option value="number">Number (Digits / Counter)</option>
                  <option value="select">Select Dropdown (Choices list)</option>
                  <option value="date">Date (Calendar picker)</option>
                  <option value="image">Image (Photo / Image upload)</option>
                </select>
              </div>

              {fieldForm.type === "select" && (
                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    Dropdown Options (comma-separated) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A+, A-, B+, B-, O+, O-, AB+, AB-"
                    value={fieldForm.optionsStr}
                    onChange={(e) => setFieldForm({ ...fieldForm, optionsStr: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Separate each selectable option with a comma.</p>
                </div>
              )}

              <div>
                <label className="font-medium text-slate-700 block mb-1">Placeholder Text</label>
                <input
                  type="text"
                  placeholder="e.g. e.g. A+"
                  value={fieldForm.placeholder}
                  onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="fieldRequiredCheck"
                  checked={fieldForm.required}
                  onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="fieldRequiredCheck" className="text-slate-700 font-medium cursor-pointer">
                  Mark this field as Required (*)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFieldModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingFieldKey ? "Update Field" : "Add Field"}</span>
                </button>
              </div>
            </form>
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

            <form onSubmit={handleSaveStudentEdit} className="p-4 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Class Roll *</label>
                  <input
                    type="number"
                    value={editFormData.classRoll ?? ""}
                    onChange={(e) => setEditFormData({ ...editFormData, classRoll: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Student ID *</label>
                  <input
                    type="text"
                    value={editFormData.studentIdNo ?? ""}
                    onChange={(e) => setEditFormData({ ...editFormData, studentIdNo: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">First Name *</label>
                  <input
                    type="text"
                    value={editFormData.firstName ?? ""}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editFormData.lastName ?? ""}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Section</label>
                  <select
                    value={editFormData.sectionId ?? ""}
                    onChange={(e) => setEditFormData({ ...editFormData, sectionId: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {(selectedClass?.sections || []).map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.groupType})
                      </option>
                    ))}
                  </select>
                </div>

                {isClass9To12 && (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Academic Group</label>
                    <select
                      value={editFormData.groupType ?? "Science"}
                      onChange={(e) => setEditFormData({ ...editFormData, groupType: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                    >
                      <option value="Science">Science</option>
                      <option value="Humanities">Humanities</option>
                      <option value="Business Studies">Business Studies</option>
                      {!isClass11Or12 && <option value="General">General</option>}
                    </select>
                  </div>
                )}

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Guardian Name</label>
                  <input
                    type="text"
                    placeholder="Guardian or Father/Mother Name"
                    value={editFormData.guardianName ?? ""}
                    onChange={(e) => setEditFormData({ ...editFormData, guardianName: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Guardian Phone (SMS) *</label>
                  <input
                    type="text"
                    value={editFormData.guardianPhone ?? ""}
                    onChange={(e) => setEditFormData({ ...editFormData, guardianPhone: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Religion</label>
                  <select
                    value={editFormData.religion ?? ""}
                    onChange={(e) => setEditFormData({ ...editFormData, religion: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">Not Specified</option>
                    <option value="Islam">Islam</option>
                    <option value="Hinduism">Hinduism</option>
                    <option value="Buddhism">Buddhism</option>
                    <option value="Christianity">Christianity</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Address</label>
                  <input
                    type="text"
                    value={editFormData.address ?? ""}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Student Category</label>
                  <select
                    value={editFormData.studentCategory ?? "General"}
                    onChange={(e) => setEditFormData({ ...editFormData, studentCategory: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="General">General</option>
                    <option value="Military">Military</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Service (Bus / Hostel / Extra Coaching)</label>
                  <select
                    value={editFormData.service ?? "None"}
                    onChange={(e) => setEditFormData({ ...editFormData, service: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="None">None</option>
                    <option value="Bus">Bus</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Extra Coaching">Extra Coaching</option>
                    <option value="Bus, Extra Coaching">Bus + Extra Coaching</option>
                    <option value="Hostel, Extra Coaching">Hostel + Extra Coaching</option>
                    <option value="Bus, Hostel">Bus + Hostel</option>
                    <option value="Bus, Hostel, Extra Coaching">All (Bus, Hostel, Extra Coaching)</option>
                  </select>
                </div>

                {isClass9To12 && (
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">Allocated 4th Subject (Optional)</label>
                    <select
                      value={editFormData.fourthSubjectId ?? ""}
                      onChange={(e) => setEditFormData({ ...editFormData, fourthSubjectId: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">None / Default</option>
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.subjectCode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="p-4 -mx-4 -mb-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingEnrollment(null)}
                  disabled={isSavingEdit}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm text-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingEdit ? "Saving Changes..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enrolled Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">
              Enrolled Students ({students.length})
            </h2>
            <span className="text-[11px] font-medium text-slate-400">
              • Displaying {activeFields.length} field columns
            </span>
            {selectedGroup && selectedGroup !== "ALL" && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                {formatGroupName(selectedGroup)}
              </span>
            )}
            {selectedShift ? (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  selectedShift === "MORNING"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {selectedShift === "MORNING" ? "Morning Shift" : "Day Shift"}
              </span>
            ) : selectedSection?.shift ? (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  selectedSection.shift === "MORNING"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {selectedSection.shift === "MORNING" ? "Morning Shift" : "Day Shift"}
              </span>
            ) : null}
            {selectedSection && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {selectedSection.name}
              </span>
            )}
          </div>

          {/* Action buttons on the right of the header */}
          <div className="flex items-center space-x-2">
            {selectedEnrollmentIds.size > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer animate-in fade-in"
                title="Delete all selected students"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedEnrollmentIds.size})</span>
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    checked={students.length > 0 && selectedEnrollmentIds.size === students.length}
                    onChange={toggleSelectAll}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                    title="Select / Unselect All Students"
                  />
                </th>
                {activeFields.map((field) => (
                  <th key={field.key} className="p-3 whitespace-nowrap">
                    {field.label}
                  </th>
                ))}
                <th className="p-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((enr) => {
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
                const isSelected = selectedEnrollmentIds.has(enr.id);

                return (
                  <tr
                    key={enr.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? "bg-emerald-50/40" : ""
                    }`}
                  >
                    <td className="p-3 w-8">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectStudent(enr.id)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </td>
                    {activeFields.map((field) => (
                      <td key={field.key} className="p-3 text-slate-700 whitespace-nowrap">
                        {renderTableCell(enr, field, fourthSub, customData)}
                      </td>
                    ))}
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditStudent(enr)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title={`Edit ${enr.student.firstName}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(enr)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={`Delete ${enr.student.firstName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan={Math.max(1, activeFields.length + 2)} className="p-8 text-center text-slate-400 italic">
                    {loading ? "Loading students..." : "No students enrolled in this class/section yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

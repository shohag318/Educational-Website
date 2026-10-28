"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BookOpen,
  Check,
  CheckCircle2,
  Filter,
  ShieldAlert,
  Search,
  X,
  Sparkles,
  AlertCircle,
  Plus,
  RefreshCw,
  Printer,
} from "lucide-react";
import { SessionSelect } from "@/components/SessionSelect";
import { StudentNavHeader } from "@/app/student/StudentNavHeader";

export default function SubjectMappingPage() {
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [searchRoll, setSearchRoll] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [electiveSubjects, setElectiveSubjects] = useState<any[]>([]);
  const [mandatorySubjects, setMandatorySubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [showSubjectListModal, setShowSubjectListModal] = useState(false);
  const [isMandatoryShown, setIsMandatoryShown] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [targetSubjectType, setTargetSubjectType] = useState<"MANDATORY" | "GROUP_ELECTIVE" | "OPTIONAL_4TH">("MANDATORY");
  const [applyToAllFiltered, setApplyToAllFiltered] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [subjectFilterQuery, setSubjectFilterQuery] = useState("");
  const [catalogSubjects, setCatalogSubjects] = useState<any[]>([]);
  const [classMappings, setClassMappings] = useState<any[]>([]);
  const [windowViewMode, setWindowViewMode] = useState<"assign" | "overview">("assign");

  // Determine selected class and grade tier (1-8 vs 9-12)
  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const classNum = selectedClass?.numericValue ?? parseInt(selectedClass?.name?.replace(/\D/g, "") || "0", 10);
  const isClass9To12 = Boolean(
    (classNum >= 9 && classNum <= 12) ||
    (selectedClass && /9|10|11|12|nine|ten|eleven|twelve|ssc|hsc/i.test(selectedClass.name))
  );
  const isClass11Or12 = Boolean(
    (classNum === 11 || classNum === 12) ||
    (selectedClass && /\b(11|12|xi|xii|eleven|twelve|hsc)\b/i.test(selectedClass.name))
  );

  useEffect(() => {
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setClasses(data.data);
          setSelectedClassId(data.data[0].id);
        }
      });
  }, []);

  // Additional unique shifts if any exist in the class sections
  const availableShifts = Array.from(
    new Set(
      selectedClass?.sections
        ?.map((s: any) => s.shift?.toUpperCase())
        .filter((sh: any) => Boolean(sh) && sh !== "MORNING" && sh !== "DAY") || []
    )
  ) as string[];

  // Sections available for the selected class, filtered by shift and group
  const availableSections = selectedClass
    ? selectedClass.sections.filter((s: any) => {
        if (selectedShift && selectedShift !== "ALL" && s.shift?.toUpperCase() !== selectedShift.toUpperCase()) {
          return false;
        }
        if (!isClass9To12 || selectedGroup === "ALL") return true;
        return s.groupType === selectedGroup;
      })
    : [];

  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    setSelectedGroup("ALL");
    setSelectedShift("");
    setSelectedSectionId("");
    setSearchRoll("");
  };

  const handleShiftChange = (newShift: string) => {
    setSelectedShift(newShift);
    if (!selectedClass) return;
    const matching = (selectedClass.sections || []).filter((s: any) => {
      if (isClass9To12 && selectedGroup && selectedGroup !== "ALL" && s.groupType !== selectedGroup) return false;
      if (!newShift || newShift === "ALL") return true;
      return s.shift?.toUpperCase() === newShift.toUpperCase();
    });
    if (selectedSectionId) {
      const stillValid = matching.some((s: any) => s.id === selectedSectionId);
      if (!stillValid) {
        setSelectedSectionId("");
      }
    }
  };

  const handleGroupChange = (newGroup: string) => {
    setSelectedGroup(newGroup);
    if (!selectedClass) return;
    const matching = (selectedClass.sections || []).filter((s: any) => {
      if (newGroup && newGroup !== "ALL" && s.groupType !== newGroup) return false;
      if (selectedShift && selectedShift !== "ALL" && s.shift?.toUpperCase() !== selectedShift.toUpperCase()) return false;
      return true;
    });
    if (selectedSectionId) {
      const stillValid = matching.some((s: any) => s.id === selectedSectionId);
      if (!stillValid) {
        setSelectedSectionId("");
      }
    }
  };

  const fetchStudents = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSession && selectedSession !== "ALL") params.set("session", selectedSession);
      params.set("classId", selectedClassId);
      if (isClass9To12 && selectedGroup && selectedGroup !== "ALL") {
        params.set("groupType", selectedGroup);
      }
      if (selectedShift && selectedShift !== "ALL") {
        params.set("shift", selectedShift);
      }
      if (selectedSectionId) {
        params.set("sectionId", selectedSectionId);
      }
      const res = await fetch(`/api/students?${params.toString()}`);
      const data = await res.json();
      if (data.success) setStudents(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch both Mandatory and Elective/4th Subjects mapped for this Class & Group
  const fetchSubjectsMapping = async () => {
    if (!selectedClassId) return;
    try {
      const groupParam = isClass9To12 && selectedGroup !== "ALL" ? `&groupType=${selectedGroup}` : "";
      const res = await fetch(`/api/setup/class-subjects?classId=${selectedClassId}${groupParam}`);
      const json = await res.json();

      if (json.success && json.data?.allSubjects) {
        setCatalogSubjects(json.data.allSubjects);
      }

      const electiveMap = new Map<string, any>();
      const mandatoryMap = new Map<string, any>();

      if (json.success && json.data?.mappings) {
        setClassMappings(json.data.mappings);
        for (const m of json.data.mappings) {
          if (m.subjectType === "GROUP_ELECTIVE" || m.subjectType === "OPTIONAL_4TH") {
            electiveMap.set(m.subject.id, {
              ...m.subject,
              defaultType: m.subjectType,
              groupType: m.groupType,
            });
          } else if (m.subjectType === "MANDATORY" || m.groupType === "MANDATORY") {
            mandatoryMap.set(m.subject.id, {
              ...m.subject,
              defaultType: "MANDATORY",
              groupType: m.groupType,
            });
          }
        }
      }

      // Include subjects already allocated among enrolled students matching the selected group
      for (const enr of students) {
        if (isClass9To12 && selectedGroup && selectedGroup !== "ALL" && enr.groupType !== selectedGroup) {
          continue; // Filter-wise: Skip students from other academic groups
        }
        for (const a of enr.allocations || []) {
          if (a.subject) {
            if ((a.subjectType === "GROUP_ELECTIVE" || a.subjectType === "OPTIONAL_4TH") && !electiveMap.has(a.subject.id)) {
              electiveMap.set(a.subject.id, { ...a.subject, defaultType: a.subjectType, groupType: enr.groupType });
            } else if (a.subjectType === "MANDATORY" && !mandatoryMap.has(a.subject.id)) {
              mandatoryMap.set(a.subject.id, { ...a.subject, defaultType: "MANDATORY", groupType: enr.groupType });
            }
          }
        }
      }

      // Fallback for Class 9-12 if no subjects found
      if (isClass9To12 && electiveMap.size === 0) {
        const mandatoryCodes = new Set(["101", "102", "107", "108", "109", "111", "150", "154"]);
        const catRes = await fetch("/api/subjects");
        const catJson = await catRes.json();
        if (catJson.success) {
          for (const s of catJson.data) {
            if (!mandatoryCodes.has(s.subjectCode)) {
              electiveMap.set(s.id, s);
            } else {
              mandatoryMap.set(s.id, s);
            }
          }
        }
      }

      // Sort subjects numerically by code
      const sortedElectives = Array.from(electiveMap.values()).sort((a, b) => {
        const numA = parseInt(a.subjectCode, 10) || 0;
        const numB = parseInt(b.subjectCode, 10) || 0;
        return numA - numB;
      });

      const sortedMandatory = Array.from(mandatoryMap.values()).sort((a, b) => {
        const numA = parseInt(a.subjectCode, 10) || 0;
        const numB = parseInt(b.subjectCode, 10) || 0;
        return numA - numB;
      });

      setElectiveSubjects(sortedElectives);
      setMandatorySubjects(sortedMandatory);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedSession, selectedClassId, selectedGroup, selectedShift, selectedSectionId, isClass9To12]);

  useEffect(() => {
    fetchSubjectsMapping();
  }, [selectedClassId, selectedGroup, isClass9To12, students.length]);

  // Direct Student Roll & Name Filtering
  const filteredStudents = useMemo(() => {
    if (!searchRoll.trim()) return students;
    const query = searchRoll.trim().toLowerCase().replace(/^#/, "");

    // Direct numeric roll search
    const isNumeric = /^\d+$/.test(query);
    if (isNumeric) {
      const targetRoll = parseInt(query, 10);
      const exactMatches = students.filter((s) => s.classRoll === targetRoll);
      if (exactMatches.length > 0) {
        return exactMatches;
      }
      const prefixMatches = students.filter((s) => String(s.classRoll).startsWith(query));
      if (prefixMatches.length > 0) {
        return prefixMatches;
      }
      return students.filter(
        (s) =>
          String(s.classRoll).includes(query) ||
          (s.student?.studentIdNo && s.student.studentIdNo.toLowerCase().includes(query))
      );
    }

    // Name or Student ID search
    return students.filter((s) => {
      const fullName = `${s.student?.firstName || ""} ${s.student?.lastName || ""}`.toLowerCase();
      const studentId = (s.student?.studentIdNo || "").toLowerCase();
      return fullName.includes(query) || studentId.includes(query);
    });
  }, [students, searchRoll]);

  // Active selected student for the Subject List Window console
  const activeStudent = useMemo(() => {
    if (selectedEnrollmentId) {
      const found = filteredStudents.find((s) => s.id === selectedEnrollmentId);
      if (found) return found;
    }
    return filteredStudents[0] || null;
  }, [filteredStudents, selectedEnrollmentId]);

  useEffect(() => {
    if (!selectedEnrollmentId && filteredStudents.length > 0) {
      setSelectedEnrollmentId(filteredStudents[0].id);
    }
  }, [filteredStudents, selectedEnrollmentId]);

  // Active student's assigned subjects
  const activeMandatory = useMemo(() => {
    if (!activeStudent) return [];
    return (activeStudent.allocations || [])
      .filter((a: any) => a.subjectType === "MANDATORY" && a.subject)
      .map((a: any) => a.subject);
  }, [activeStudent]);

  const activeGroupElectives = useMemo(() => {
    if (!activeStudent) return [];
    return (activeStudent.allocations || [])
      .filter((a: any) => a.subjectType === "GROUP_ELECTIVE" && a.subject)
      .map((a: any) => a.subject);
  }, [activeStudent]);

  const active4thSubject = useMemo(() => {
    if (!activeStudent) return [];
    return (activeStudent.allocations || [])
      .filter((a: any) => a.subjectType === "OPTIONAL_4TH" && a.subject)
      .map((a: any) => a.subject);
  }, [activeStudent]);

  // Active student group if selected
  const activeStudentGroup = activeStudent?.groupType;

  // Effective filter group: derived from selectedGroup filter, or active student
  const currentFilterGroup = useMemo(() => {
    if (isClass9To12 && selectedGroup && selectedGroup !== "ALL") {
      return selectedGroup;
    }
    if (isClass9To12 && activeStudentGroup && activeStudentGroup !== "GENERAL") {
      return activeStudentGroup;
    }
    return selectedGroup;
  }, [isClass9To12, selectedGroup, activeStudentGroup]);

  // Master list of related subjects strictly filter-wise (Class & Group only)
  const allSubjectsList = useMemo(() => {
    const map = new Map<string, any>();

    // 1. From classMappings (mapped for this class & group)
    for (const m of classMappings) {
      if (currentFilterGroup && currentFilterGroup !== "ALL") {
        if (
          m.groupType &&
          m.groupType !== currentFilterGroup &&
          m.groupType !== "ALL" &&
          m.groupType !== "MANDATORY"
        ) {
          continue; // Filter-wise: Skip subjects belonging to other groups
        }
      }
      if (m.subject && !map.has(m.subject.id)) {
        map.set(m.subject.id, {
          ...m.subject,
          defaultCategory: m.subjectType,
          groupType: m.groupType,
        });
      }
    }

    // 2. From mandatorySubjects
    for (const s of mandatorySubjects) {
      if (currentFilterGroup && currentFilterGroup !== "ALL") {
        if (
          s.groupType &&
          s.groupType !== currentFilterGroup &&
          s.groupType !== "ALL" &&
          s.groupType !== "MANDATORY"
        ) {
          continue;
        }
      }
      if (!map.has(s.id)) {
        map.set(s.id, { ...s, defaultCategory: "MANDATORY" });
      }
    }

    // 3. From electiveSubjects
    for (const s of electiveSubjects) {
      if (currentFilterGroup && currentFilterGroup !== "ALL") {
        if (s.groupType && s.groupType !== currentFilterGroup && s.groupType !== "ALL") {
          continue;
        }
      }
      if (!map.has(s.id)) {
        map.set(s.id, { ...s, defaultCategory: s.defaultType || "GROUP_ELECTIVE" });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const numA = parseInt(a.subjectCode, 10) || 0;
      const numB = parseInt(b.subjectCode, 10) || 0;
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name);
    });
  }, [classMappings, mandatorySubjects, electiveSubjects, currentFilterGroup]);

  // Filtered all subjects based on search
  const filteredAllSubjects = useMemo(() => {
    if (!subjectFilterQuery.trim()) return allSubjectsList;
    const q = subjectFilterQuery.toLowerCase().trim();
    return allSubjectsList.filter(
      (s) => (s.subjectCode || "").toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [allSubjectsList, subjectFilterQuery]);

  // Filtered students for the Student ID scrolling bar
  const scrollableStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return filteredStudents;
    const q = studentSearchQuery.toLowerCase().trim();
    return filteredStudents.filter((s) => {
      const id = (s.student?.studentIdNo || "").toLowerCase();
      const roll = String(s.classRoll);
      const name = `${s.student?.firstName || ""} ${s.student?.lastName || ""}`.toLowerCase();
      return id.includes(q) || roll.includes(q) || name.includes(q);
    });
  }, [filteredStudents, studentSearchQuery]);

  // Toggle subject selection in All Subject column
  const handleToggleSubjectSelect = (subId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const handleSelectAllSubjects = () => {
    if (selectedSubjectIds.length === filteredAllSubjects.length && filteredAllSubjects.length > 0) {
      setSelectedSubjectIds([]);
    } else {
      setSelectedSubjectIds(filteredAllSubjects.map((s) => s.id));
    }
  };

  // Assign checked subjects
  const handleConfirmAssign = async () => {
    if (!activeStudent || selectedSubjectIds.length === 0) return;
    setAssigningLoading(true);
    try {
      const enrollmentIds = applyToAllFiltered
        ? filteredStudents.map((s) => s.id)
        : [activeStudent.id];

      const res = await fetch("/api/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentIds,
          subjectIds: selectedSubjectIds,
          subjectType: targetSubjectType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const typeLabel =
          targetSubjectType === "MANDATORY"
            ? "Mandatory"
            : targetSubjectType === "GROUP_ELECTIVE"
            ? "Group Subject"
            : "4th Subject";
        setSavedStatus(
          `Assigned ${selectedSubjectIds.length} subject(s) as ${typeLabel} to ${
            applyToAllFiltered
              ? `all ${enrollmentIds.length} students`
              : activeStudent.student?.studentIdNo || `Roll #${activeStudent.classRoll}`
          }`
        );
        setTimeout(() => setSavedStatus(null), 4000);
        setSelectedSubjectIds([]);
        setShowAssignMenu(false);
        await fetchStudents();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err: any) {
      alert("Assignment failed: " + err.message);
    } finally {
      setAssigningLoading(false);
    }
  };

  // Remove individual subject allocation
  const handleRemoveAllocation = async (enrollmentId: string, subjectId: string) => {
    try {
      const res = await fetch("/api/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId,
          subjectId,
          subjectType: "NONE",
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchStudents();
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  // Handle allocation update
  const handleUpdateAllocation = async (enrollmentId: string, subjectId: string, newType: string) => {
    const student = students.find((s) => s.id === enrollmentId);
    const targetSubject = [...electiveSubjects, ...mandatorySubjects].find((s) => s.id === subjectId);

    // If choosing 4th subject, check if student already has another 4th subject
    const existing4th = student?.allocations?.find(
      (a: any) => a.subjectType === "OPTIONAL_4TH" && a.subjectId !== subjectId
    );

    try {
      const res = await fetch("/api/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, subjectId, subjectType: newType }),
      });
      const data = await res.json();
      if (data.success) {
        if (newType === "OPTIONAL_4TH" && existing4th) {
          setSavedStatus(
            `Assigned "${targetSubject?.name || "Subject"}" as 4th Subject (Previous 4th switched to Elective)`
          );
        } else if (newType === "OPTIONAL_4TH") {
          setSavedStatus(`Assigned "${targetSubject?.name || "Subject"}" as 4th Subject`);
        } else if (newType === "GROUP_ELECTIVE") {
          setSavedStatus(`Assigned "${targetSubject?.name || "Subject"}" as Group Elective`);
        } else if (newType === "MANDATORY") {
          setSavedStatus(`Assigned "${targetSubject?.name || "Subject"}" as Mandatory`);
        } else {
          setSavedStatus(`Removed allocation for "${targetSubject?.name || "Subject"}"`);
        }
        setTimeout(() => setSavedStatus(null), 4000);
        fetchStudents();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err: any) {
      alert("Failed: " + err.message);
    }
  };

  // Auto-allocate all missing mandatory subjects for a specific student
  const handleAutoAssignMandatoryForStudent = async (enr: any) => {
    if (mandatorySubjects.length === 0) return;

    const existingMandatoryIds = new Set(
      (enr.allocations || [])
        .filter((a: any) => a.subjectType === "MANDATORY")
        .map((a: any) => a.subjectId)
    );

    const toAssign = mandatorySubjects.filter((ms) => !existingMandatoryIds.has(ms.id));
    if (toAssign.length === 0) return;

    try {
      for (const sub of toAssign) {
        await fetch("/api/subjects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enrollmentId: enr.id,
            subjectId: sub.id,
            subjectType: "MANDATORY",
          }),
        });
      }
      setSavedStatus(`Allocated ${toAssign.length} mandatory subject(s) to ${enr.student.firstName}`);
      setTimeout(() => setSavedStatus(null), 4000);
      fetchStudents();
    } catch (err: any) {
      alert("Failed: " + err.message);
    }
  };

  // Auto-assign missing mandatory subjects for all displayed students
  const handleBatchAssignMissingMandatory = async () => {
    if (mandatorySubjects.length === 0 || filteredStudents.length === 0) return;

    setAssigningLoading(true);
    let totalAssigned = 0;
    try {
      for (const enr of filteredStudents) {
        const existingMandatoryIds = new Set(
          (enr.allocations || [])
            .filter((a: any) => a.subjectType === "MANDATORY")
            .map((a: any) => a.subjectId)
        );

        const toAssign = mandatorySubjects.filter((ms) => !existingMandatoryIds.has(ms.id));
        for (const sub of toAssign) {
          await fetch("/api/subjects", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              enrollmentId: enr.id,
              subjectId: sub.id,
              subjectType: "MANDATORY",
            }),
          });
          totalAssigned++;
        }
      }
      setSavedStatus(`Successfully allocated missing mandatory subjects (${totalAssigned} allocations saved)`);
      setTimeout(() => setSavedStatus(null), 5000);
      await fetchStudents();
    } catch (err: any) {
      alert("Batch assign failed: " + err.message);
    } finally {
      setAssigningLoading(false);
    }
  };

  // Keyboard shortcut: ESC to close Subject List Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showSubjectListModal) {
        setShowSubjectListModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSubjectListModal]);

  // Click Mandatory handler: toggles mandatory view and auto-assigns mapped mandatory subjects if missing
  const handleToggleMandatory = async () => {
    const nextVal = !isMandatoryShown;
    setIsMandatoryShown(nextVal);
    if (nextVal) {
      const missingStudents = filteredStudents.filter((enr) => {
        const studentMandatory = (enr.allocations || []).filter(
          (a: any) => a.subjectType === "MANDATORY" && a.subject
        );
        return studentMandatory.length === 0;
      });
      if (missingStudents.length > 0 && mandatorySubjects.length > 0) {
        await handleBatchAssignMissingMandatory();
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <StudentNavHeader />
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          <span>Subject Allocation</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Assign compulsory, group elective, and 4th optional subjects to students.
        </p>
      </div>

      {/* Filtering Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-slate-700 font-bold mr-1">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>Filters:</span>
          </div>

          {/* 1. Session Filter */}
          <div>
            <SessionSelect
              value={selectedSession}
              onChange={(val) => setSelectedSession(val)}
              label="1. Session:"
              labelClassName="font-semibold text-slate-700 block mb-1"
              selectClassName="p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
            />
          </div>

          {/* 2. Class Filter */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">2. Class:</label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Shift Filter */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">3. Shift:</label>
            <select
              value={selectedShift}
              onChange={(e) => handleShiftChange(e.target.value)}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
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

          {/* 4. Group Filter (Only applicable for Classes 9 to 12) */}
          {isClass9To12 && (
            <div>
              <label className="font-semibold text-slate-700 block mb-1">4. Group:</label>
              <select
                value={isClass11Or12 && selectedGroup === "GENERAL" ? "ALL" : selectedGroup}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
              >
                <option value="ALL">All Groups</option>
                <option value="SCIENCE">Science</option>
                <option value="HUMANITIES">Humanities</option>
                <option value="BUSINESS_STUDIES">Business Studies</option>
                {!isClass11Or12 && <option value="GENERAL">General</option>}
              </select>
            </div>
          )}

          {/* Section Filter */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              {isClass9To12 ? "5. Section:" : "4. Section:"}
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
            >
              <option value="">All Sections</option>
              {availableSections.map((s: any) => {
                const shiftLabel = s.shift === "MORNING" ? "Morning" : s.shift === "DAY" ? "Day" : s.shift;
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.groupType && s.groupType !== "GENERAL" ? `(${s.groupType})` : ""}{(!selectedShift && shiftLabel) ? ` • ${shiftLabel}` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Direct Search by Student Roll */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Search Roll:</label>
            <div className="relative">
              <input
                type="text"
                value={searchRoll}
                onChange={(e) => setSearchRoll(e.target.value)}
                placeholder="e.g. 15, #5..."
                className="p-2 pl-7 pr-6 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium bg-white w-28 sm:w-36 text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
              {searchRoll && (
                <button
                  type="button"
                  onClick={() => setSearchRoll("")}
                  className="absolute right-1.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                  title="Clear roll search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* OK Button to open Subject List Window */}
          <div>
            <label className="font-semibold text-transparent block mb-1 select-none pointer-events-none text-xs">
              OK
            </label>
            <button
              type="button"
              onClick={() => setShowSubjectListModal(true)}
              className="h-[38px] px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center space-x-1.5 text-xs cursor-pointer"
              title="Open Subject List Window"
            >
              <Check className="w-4 h-4 mr-0.5" />
              <span>Ok</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {savedStatus && (
            <div className="flex items-center space-x-1.5 text-emerald-600 font-semibold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              <span>{savedStatus}</span>
            </div>
          )}
        </div>
      </div>


      {/* Subject List Window (Modal matching wireframe in Image 3) */}
      {showSubjectListModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:max-h-none print:border-none print:shadow-none print:rounded-none">
            {/* Window Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0 print:border-b-2 print:border-black">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-emerald-600 print:hidden" />
                    <span>Subject List Window</span>
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 print:border print:border-black">
                    {filteredStudents.length} Students
                  </span>
                  {activeStudent && windowViewMode === "assign" && (
                    <span className="hidden md:inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white border border-slate-200 text-slate-700">
                      <span>Selected Student:</span>
                      <strong className="text-emerald-700 font-mono">
                        {activeStudent.student?.studentIdNo || `Roll #${activeStudent.classRoll}`}
                      </strong>
                      <span className="text-slate-400">•</span>
                      <span>{activeStudent.student?.firstName} {activeStudent.student?.lastName}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Class: <span className="font-semibold text-slate-800">{selectedClass?.name || "Class"}</span>
                  {selectedShift && selectedShift !== "ALL" && (
                    <> • Shift: <span className="font-semibold text-slate-800">{selectedShift}</span></>
                  )}
                  {isClass9To12 && selectedGroup && selectedGroup !== "ALL" && (
                    <> • Group: <span className="font-semibold text-slate-800">{selectedGroup}</span></>
                  )}
                  {selectedSectionId && (
                    <> • Section: <span className="font-semibold text-slate-800">{availableSections.find((s: any) => s.id === selectedSectionId)?.name}</span></>
                  )}
                  {selectedSession && selectedSession !== "ALL" && (
                    <> • Session: <span className="font-semibold text-slate-800">{selectedSession}</span></>
                  )}
                </p>
              </div>

              <div className="flex items-center space-x-2 print:hidden">
                {/* View Mode Toggle: Assign Console (Image 3) vs All Students Matrix (Image 2) */}
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white text-xs">
                  <button
                    type="button"
                    onClick={() => setWindowViewMode("assign")}
                    className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                      windowViewMode === "assign"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Assign Console
                  </button>
                  <button
                    type="button"
                    onClick={() => setWindowViewMode("overview")}
                    className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                      windowViewMode === "overview"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All Students Table
                  </button>
                </div>

                {/* Print button */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                  title="Print this View"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </button>

                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setShowSubjectListModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Close Window (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Window Content */}
            <div className="p-4 overflow-auto flex-1 bg-white print:p-0">
              {windowViewMode === "assign" ? (
                /* MASTER ASSIGN CONSOLE: Matches wireframe in Image 3 */
                <table className="w-full border-collapse border-2 border-black text-xs font-sans table-fixed">
                  <thead>
                    {/* Header Row 1 */}
                    <tr className="bg-slate-100 text-slate-900 border-b-2 border-black">
                      <th
                        rowSpan={2}
                        className="border-2 border-black p-3 text-center align-middle font-bold text-sm w-[22%] bg-slate-100 text-slate-900"
                      >
                        Student ID
                      </th>
                      <th
                        colSpan={4}
                        className="border-2 border-black p-3 text-center font-bold text-sm bg-slate-200 text-slate-900"
                      >
                        Subject list
                      </th>
                    </tr>
                    {/* Header Row 2 */}
                    <tr className="bg-slate-50 text-slate-900 border-b-2 border-black text-center font-bold text-xs">
                      <th className="border-2 border-black p-2.5 w-[28%] bg-slate-50 text-slate-900">
                        <div>All Subject</div>
                        <div className="text-[10px] font-medium text-emerald-700 font-sans mt-0.5">
                          {selectedClass?.name || "Class"} • {currentFilterGroup || "General"} ({filteredAllSubjects.length} subjects)
                        </div>
                      </th>
                      <th className="border-2 border-black p-2.5 w-[18%] bg-slate-50 text-slate-900">
                        Mandatory
                      </th>
                      <th className="border-2 border-black p-2.5 w-[18%] bg-slate-50 text-slate-900">
                        Group Subject
                      </th>
                      <th className="border-2 border-black p-2.5 w-[14%] bg-slate-50 text-slate-900">
                        4th Subject
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b-2 border-black align-top">
                      {/* 1. Student ID Scrolling Bar Column */}
                      <td className="border-2 border-black p-0 align-top bg-slate-50/50">
                        {/* Student Search */}
                        <div className="p-2 border-b border-black bg-white sticky top-0 z-10">
                          <div className="relative">
                            <input
                              type="text"
                              value={studentSearchQuery}
                              onChange={(e) => setStudentSearchQuery(e.target.value)}
                              placeholder="Filter ID, Roll, Name..."
                              className="w-full text-xs p-1.5 pl-6 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-1.5 top-2 pointer-events-none" />
                            {studentSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setStudentSearchQuery("")}
                                className="absolute right-1.5 top-1.5 text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Scrollable List of Student IDs */}
                        <div className="overflow-y-auto max-h-[500px] divide-y divide-slate-200">
                          {scrollableStudents.map((enr) => {
                            const isSelected = activeStudent?.id === enr.id;
                            const studentIdText = enr.student?.studentIdNo || `ROLL-${enr.classRoll}`;
                            return (
                              <button
                                key={`student-item-${enr.id}`}
                                type="button"
                                onClick={() => setSelectedEnrollmentId(enr.id)}
                                className={`w-full text-left p-2.5 transition-all block cursor-pointer select-none ${
                                  isSelected
                                    ? "bg-emerald-100/90 border-l-4 border-emerald-600 text-slate-900 shadow-2xs"
                                    : "hover:bg-slate-100 text-slate-700"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-bold text-xs text-slate-900">
                                    {studentIdText}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600 font-mono font-bold">
                                    #{enr.classRoll}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-600 truncate mt-0.5">
                                  {enr.student?.firstName} {enr.student?.lastName}
                                </div>
                                {enr.groupType && enr.groupType !== "GENERAL" && (
                                  <div className="mt-1">
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-slate-200/80 text-slate-700">
                                      {enr.groupType}
                                    </span>
                                  </div>
                                )}
                              </button>
                            );
                          })}

                          {scrollableStudents.length === 0 && (
                            <div className="p-4 text-center text-slate-400 italic text-xs">
                              No students match search.
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 2. All Subject Column with Checkboxes and Assign To Button */}
                      <td className="border-2 border-black p-0 align-top bg-white relative">
                        {/* Subject Search & Select All Toolbar */}
                        <div className="p-2 border-b border-black bg-slate-50 flex items-center justify-between gap-1.5 sticky top-0 z-10">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={subjectFilterQuery}
                              onChange={(e) => setSubjectFilterQuery(e.target.value)}
                              placeholder="Search subject..."
                              className="w-full text-xs p-1 pl-6 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                            />
                            <Search className="w-3 h-3 text-slate-400 absolute left-1.5 top-1.5 pointer-events-none" />
                            {subjectFilterQuery && (
                              <button
                                type="button"
                                onClick={() => setSubjectFilterQuery("")}
                                className="absolute right-1 top-1 text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleSelectAllSubjects}
                            className="px-2 py-1 text-[10px] font-bold rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shrink-0 cursor-pointer"
                          >
                            {selectedSubjectIds.length === filteredAllSubjects.length && filteredAllSubjects.length > 0
                              ? "Clear All"
                              : "Select All"}
                          </button>
                        </div>

                        {/* Subject Checkbox List */}
                        <div className="overflow-y-auto max-h-[440px] p-2 space-y-1">
                          {filteredAllSubjects.map((sub) => {
                            const isChecked = selectedSubjectIds.includes(sub.id);

                            // Check if this subject is already assigned to the active student
                            const currentAlloc = activeStudent?.allocations?.find(
                              (a: any) => a.subjectId === sub.id
                            );

                            return (
                              <label
                                key={`all-sub-${sub.id}`}
                                className={`flex items-start space-x-2 p-1.5 rounded-lg border transition-all cursor-pointer select-none text-xs ${
                                  isChecked
                                    ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-medium shadow-2xs"
                                    : "border-slate-200 hover:bg-slate-50 text-slate-800"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleSubjectSelect(sub.id)}
                                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono font-bold text-slate-900">
                                      {sub.subjectCode}
                                    </span>
                                    {currentAlloc && (
                                      <span
                                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                          currentAlloc.subjectType === "MANDATORY"
                                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                            : currentAlloc.subjectType === "GROUP_ELECTIVE"
                                            ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                                            : "bg-amber-100 text-amber-900 border border-amber-300"
                                        }`}
                                      >
                                        {currentAlloc.subjectType === "MANDATORY"
                                          ? "Mandatory"
                                          : currentAlloc.subjectType === "GROUP_ELECTIVE"
                                          ? "Group"
                                          : "4th"}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-600 truncate mt-0.5">
                                    {sub.name}
                                  </div>
                                </div>
                              </label>
                            );
                          })}

                          {filteredAllSubjects.length === 0 && (
                            <div className="p-4 text-center text-slate-400 italic text-xs">
                              No subjects found.
                            </div>
                          )}
                        </div>

                        {/* Bottom "Assign to" Box (Matching Image 3 wireframe box) */}
                        <div className="p-2.5 border-t border-black bg-slate-50 flex items-center justify-between gap-2 sticky bottom-0 z-10">
                          <span className="text-[11px] font-semibold text-slate-600">
                            {selectedSubjectIds.length} Selected
                          </span>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowAssignMenu(!showAssignMenu)}
                              disabled={selectedSubjectIds.length === 0}
                              className="px-4 py-1.5 border-2 border-black bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-bold text-xs rounded shadow-xs flex items-center space-x-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <span>Assign to</span>
                              <span className="text-[10px]">▼</span>
                            </button>

                            {/* Dropdown Menu with 3 Options: Mandatory, Group Subject, 4th Subject */}
                            {showAssignMenu && (
                              <div className="absolute right-0 bottom-full mb-1.5 z-30 w-72 bg-white rounded-xl shadow-2xl border-2 border-black p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                                <div className="flex items-center justify-between border-b pb-1.5">
                                  <span className="font-bold text-xs text-slate-900">
                                    Assign {selectedSubjectIds.length} Subject(s) to:
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setShowAssignMenu(false)}
                                    className="text-slate-400 hover:text-slate-600 p-0.5"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border font-medium">
                                  Target:{" "}
                                  <strong className="font-mono text-slate-900">
                                    {activeStudent?.student?.studentIdNo || `Roll #${activeStudent?.classRoll}`}
                                  </strong>
                                </div>

                                {/* 3 Options */}
                                <div className="space-y-1.5">
                                  <label className="flex items-center space-x-2 p-2 rounded-lg border border-slate-200 hover:bg-emerald-50 cursor-pointer transition select-none">
                                    <input
                                      type="radio"
                                      name="assignSubjectTypeOption"
                                      value="MANDATORY"
                                      checked={targetSubjectType === "MANDATORY"}
                                      onChange={() => setTargetSubjectType("MANDATORY")}
                                      className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <span className="font-bold text-xs text-emerald-950">
                                      1. Mandatory
                                    </span>
                                  </label>

                                  <label className="flex items-center space-x-2 p-2 rounded-lg border border-slate-200 hover:bg-indigo-50 cursor-pointer transition select-none">
                                    <input
                                      type="radio"
                                      name="assignSubjectTypeOption"
                                      value="GROUP_ELECTIVE"
                                      checked={targetSubjectType === "GROUP_ELECTIVE"}
                                      onChange={() => setTargetSubjectType("GROUP_ELECTIVE")}
                                      className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <span className="font-bold text-xs text-indigo-950">
                                      2. Group Subject
                                    </span>
                                  </label>

                                  <label className="flex items-center space-x-2 p-2 rounded-lg border border-slate-200 hover:bg-amber-50 cursor-pointer transition select-none">
                                    <input
                                      type="radio"
                                      name="assignSubjectTypeOption"
                                      value="OPTIONAL_4TH"
                                      checked={targetSubjectType === "OPTIONAL_4TH"}
                                      onChange={() => setTargetSubjectType("OPTIONAL_4TH")}
                                      className="text-amber-600 focus:ring-amber-500 cursor-pointer"
                                    />
                                    <span className="font-bold text-xs text-amber-950">
                                      3. 4th Subject
                                    </span>
                                  </label>
                                </div>

                                {/* Toggle Apply to all students */}
                                <label className="flex items-center space-x-2 text-[10px] text-slate-600 pt-1 border-t cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={applyToAllFiltered}
                                    onChange={(e) => setApplyToAllFiltered(e.target.checked)}
                                    className="rounded text-emerald-600 cursor-pointer"
                                  />
                                  <span>Apply to all {filteredStudents.length} students in filter</span>
                                </label>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-end space-x-2 pt-1 border-t">
                                  <button
                                    type="button"
                                    onClick={() => setShowAssignMenu(false)}
                                    className="px-2.5 py-1 text-xs rounded border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleConfirmAssign}
                                    disabled={assigningLoading || selectedSubjectIds.length === 0}
                                    className="px-3.5 py-1 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{assigningLoading ? "Saving..." : "Ok"}</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Mandatory Subjects Column (Assigned for active student) */}
                      <td className="border-2 border-black p-2.5 align-top bg-white">
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider pb-1 border-b flex items-center justify-between">
                            <span>Assigned ({activeMandatory.length})</span>
                            {activeMandatory.length === 0 && mandatorySubjects.length > 0 && activeStudent && (
                              <button
                                type="button"
                                onClick={() => handleAutoAssignMandatoryForStudent(activeStudent)}
                                className="text-[9px] text-emerald-700 underline font-semibold cursor-pointer"
                              >
                                + Auto-Assign
                              </button>
                            )}
                          </div>

                          <div className="overflow-y-auto max-h-[460px] space-y-1.5 pt-1">
                            {activeMandatory.map((sub: any) => (
                              <div
                                key={`act-mand-${sub.id}`}
                                className="flex items-center justify-between p-2 rounded bg-emerald-50 text-emerald-950 border border-emerald-300 text-xs shadow-2xs group"
                              >
                                <div className="min-w-0 pr-1">
                                  <span className="font-mono font-bold text-emerald-800 mr-1.5">
                                    {sub.subjectCode}
                                  </span>
                                  <span className="font-medium text-[11px] truncate">
                                    {sub.name}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAllocation(activeStudent.id, sub.id)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50 transition shrink-0 cursor-pointer"
                                  title="Remove this mandatory subject"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}

                            {activeMandatory.length === 0 && (
                              <div className="p-4 text-center text-slate-400 italic text-xs">
                                No Mandatory subjects assigned. Check subjects on the left and click{" "}
                                <strong>Assign to</strong>.
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 4. Group Subject Column (Assigned for active student) */}
                      <td className="border-2 border-black p-2.5 align-top bg-white">
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider pb-1 border-b">
                            Assigned ({activeGroupElectives.length})
                          </div>

                          <div className="overflow-y-auto max-h-[460px] space-y-1.5 pt-1">
                            {activeGroupElectives.map((sub: any) => (
                              <div
                                key={`act-group-${sub.id}`}
                                className="flex items-center justify-between p-2 rounded bg-indigo-50 text-indigo-950 border border-indigo-200 text-xs shadow-2xs group"
                              >
                                <div className="min-w-0 pr-1">
                                  <span className="font-mono font-bold text-indigo-800 mr-1.5">
                                    {sub.subjectCode}
                                  </span>
                                  <span className="font-medium text-[11px] truncate">
                                    {sub.name}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAllocation(activeStudent.id, sub.id)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50 transition shrink-0 cursor-pointer"
                                  title="Remove this group subject"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}

                            {activeGroupElectives.length === 0 && (
                              <div className="p-4 text-center text-slate-400 italic text-xs">
                                No Group subjects assigned. Check subjects on the left and click{" "}
                                <strong>Assign to</strong>.
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 5. 4th Subject Column (Assigned for active student) */}
                      <td className="border-2 border-black p-2.5 align-top bg-white">
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider pb-1 border-b">
                            Assigned ({active4thSubject.length})
                          </div>

                          <div className="overflow-y-auto max-h-[460px] space-y-1.5 pt-1">
                            {active4thSubject.map((sub: any) => (
                              <div
                                key={`act-4th-${sub.id}`}
                                className="flex items-center justify-between p-2 rounded bg-amber-50 text-amber-950 border border-amber-300 text-xs font-bold shadow-2xs group"
                              >
                                <div className="min-w-0 pr-1">
                                  <span className="font-mono text-amber-800 mr-1">
                                    ★ {sub.subjectCode}
                                  </span>
                                  <span className="text-[11px] truncate">{sub.name}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAllocation(activeStudent.id, sub.id)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50 transition shrink-0 cursor-pointer"
                                  title="Remove 4th subject"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}

                            {active4thSubject.length === 0 && (
                              <div className="p-4 text-center text-slate-400 italic text-xs">
                                No 4th subject assigned. Check subject on the left and click{" "}
                                <strong>Assign to</strong>.
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                /* ALL STUDENTS OVERVIEW TABLE (Matching Image 2 layout) */
                <table className="w-full border-collapse border-2 border-black text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 border-b-2 border-black print:bg-slate-100">
                      <th
                        rowSpan={2}
                        className="border-2 border-black p-3.5 text-center align-middle font-bold text-sm w-44 min-w-[150px] bg-slate-100 text-slate-900"
                      >
                        Student ID
                      </th>
                      <th
                        colSpan={3}
                        className="border-2 border-black p-3 text-center font-bold text-sm bg-slate-200 text-slate-900"
                      >
                        Subject list
                      </th>
                    </tr>
                    <tr className="bg-slate-50 text-slate-900 border-b-2 border-black">
                      <th className="border-2 border-black p-2.5 text-center font-bold text-slate-900 text-xs w-1/3">
                        Mandatory
                      </th>
                      <th className="border-2 border-black p-2.5 text-center font-bold text-slate-900 text-xs w-1/3">
                        Group Subject
                      </th>
                      <th className="border-2 border-black p-2.5 text-center font-bold text-slate-900 text-xs w-1/3">
                        4th Subject
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((enr) => {
                      const studentIdText = enr.student?.studentIdNo || `ROLL-${enr.classRoll}`;

                      const studentMandatory = (enr.allocations || [])
                        .filter((a: any) => a.subjectType === "MANDATORY" && a.subject)
                        .map((a: any) => a.subject);

                      const studentGroupElectives = (enr.allocations || [])
                        .filter((a: any) => a.subjectType === "GROUP_ELECTIVE" && a.subject)
                        .map((a: any) => a.subject);

                      const student4thSubject = (enr.allocations || [])
                        .filter((a: any) => a.subjectType === "OPTIONAL_4TH" && a.subject)
                        .map((a: any) => a.subject);

                      return (
                        <tr key={`modal-row-${enr.id}`} className="hover:bg-slate-50/70 border-b-2 border-black">
                          <td className="border-2 border-black p-3 text-center align-middle bg-white">
                            <div className="font-mono font-extrabold text-slate-900 text-sm tracking-wide">
                              {studentIdText}
                            </div>
                            <div className="text-[11px] text-slate-600 font-medium mt-1">
                              Roll #{enr.classRoll} • {enr.student?.firstName} {enr.student?.lastName}
                            </div>
                          </td>

                          <td className="border-2 border-black p-3 align-top bg-white">
                            {studentMandatory.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {studentMandatory.map((sub: any) => (
                                  <span
                                    key={sub.id}
                                    className="inline-flex items-center space-x-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-900 border border-emerald-300 text-[11px] font-medium shadow-2xs"
                                  >
                                    <span className="font-mono font-bold text-emerald-800">
                                      {sub.subjectCode}
                                    </span>
                                    <span>{sub.name}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">No Mandatory Assigned</span>
                            )}
                          </td>

                          <td className="border-2 border-black p-3 align-top bg-white">
                            {studentGroupElectives.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {studentGroupElectives.map((sub: any) => (
                                  <span
                                    key={sub.id}
                                    className="inline-flex items-center space-x-1.5 px-2 py-1 rounded bg-indigo-50 text-indigo-900 border border-indigo-200 text-[11px] font-medium shadow-2xs"
                                  >
                                    <span className="font-mono font-bold text-indigo-700">
                                      {sub.subjectCode}
                                    </span>
                                    <span>{sub.name}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">No Group Electives</span>
                            )}
                          </td>

                          <td className="border-2 border-black p-3 align-top bg-white">
                            {student4thSubject.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {student4thSubject.map((sub: any) => (
                                  <span
                                    key={sub.id}
                                    className="inline-flex items-center space-x-1.5 px-2 py-1 rounded bg-amber-50 text-amber-950 border border-amber-300 text-[11px] font-bold shadow-2xs"
                                  >
                                    <span className="font-mono text-amber-800">★ {sub.subjectCode}</span>
                                    <span>{sub.name}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">No 4th Subject</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Window Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs text-slate-600 print:hidden">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-slate-900">{filteredStudents.length} Students</span>
                <span>•</span>
                <span className="text-slate-500">
                  All Subjects Catalog: <strong className="text-slate-700">{allSubjectsList.length}</strong>
                </span>
                <span>•</span>
                <span className="text-slate-500">
                  Checked: <strong className="text-emerald-700 font-bold">{selectedSubjectIds.length}</strong>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectListModal(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

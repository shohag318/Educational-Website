"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  PlusCircle,
  Search,
  KeyRound,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  RefreshCw,
  School,
  Users,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  ArrowRight,
  Info,
  Globe,
  Phone,
  Mail,
  MapPin,
  Dice5,
  LogIn,
  ChevronDown,
} from "lucide-react";
import { saveStoredSchoolInfo, DEFAULT_SCHOOL_INFO } from "@/lib/settingsStore";
import {
  isInstitutionLoggedIn,
  getAuthSession,
  clearAuthSession,
  saveAuthSession,
  AuthSession,
} from "@/lib/authSession";
import {
  INSTITUTION_MODULES,
  ALL_INSTITUTION_MODULE_KEYS,
} from "@/lib/institutionModules";

interface InstitutionItem {
  id: string;
  code: string;
  name: string;
  nameBn?: string | null;
  address?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  adminId: string;
  adminPassword?: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  slug?: string;
  smsSenderId?: string | null;
  notes?: string | null;
  accessibleModules?: string[];
  createdAt: string;
  stats?: {
    students: number;
    classes: number;
    exams: number;
    academicYears: number;
  };
}

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [institutions, setInstitutions] = useState<InstitutionItem[]>([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, totalStudents: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInst, setSelectedInst] = useState<InstitutionItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // UI helpers
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [origin, setOrigin] = useState("");

  // Module Access Dropdown States
  const [activeTableDropdownInstId, setActiveTableDropdownInstId] = useState<string | null>(null);
  const [savingModuleInstId, setSavingModuleInstId] = useState<string | null>(null);
  const [isCreateModuleDropdownOpen, setIsCreateModuleDropdownOpen] = useState(false);
  const [isEditModuleDropdownOpen, setIsEditModuleDropdownOpen] = useState(false);

  // Create Form State
  const [newInst, setNewInst] = useState({
    code: "",
    name: "",
    nameBn: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    adminId: "",
    adminPassword: "",
    status: "ACTIVE",
    smsSenderId: "",
    accessibleModules: [...ALL_INSTITUTION_MODULE_KEYS],
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Assign Credentials Form State
  const [assignForm, setAssignForm] = useState({
    adminId: "",
    adminPassword: "",
    showPassword: false,
  });
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [isInstUser, setIsInstUser] = useState(false);
  const [instSession, setInstSession] = useState<AuthSession | null>(null);

  // Fetch institutions
  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/super-admin/institutions");
      const json = await res.json();
      if (json.success) {
        setInstitutions(json.data);
        setSummary(json.summary);
      } else {
        setNotification({ type: "error", message: json.error || "Failed to load institutions" });
      }
    } catch (err: any) {
      setNotification({ type: "error", message: "Network error loading institutions" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isInst = isInstitutionLoggedIn();
    setIsInstUser(isInst);
    setInstSession(getAuthSession());

    if (!isInst) {
      fetchInstitutions();
    } else {
      setLoading(false);
    }

    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Helper to generate secure random password
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `Smart@${pwd}`;
  };

  // Helper for portal login link
  const getLoginLink = (code: string) => {
    const base = origin || "";
    return `${base}/portal-login?inst=${encodeURIComponent(code)}`;
  };

  const copyToClipboard = (text: string, type: "link" | "creds", id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === "link") {
        setCopiedLink(id);
        setTimeout(() => setCopiedLink(null), 2500);
      } else {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2500);
      }
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Handle open create modal
  const handleOpenCreateModal = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const generatedPwd = generateRandomPassword();
    setNewInst({
      code: randomCode,
      name: "",
      nameBn: "",
      address: "",
      contactEmail: "",
      contactPhone: "",
      adminId: `admin_${randomCode}`,
      adminPassword: generatedPwd,
      status: "ACTIVE",
      smsSenderId: "",
      accessibleModules: [...ALL_INSTITUTION_MODULE_KEYS],
    });
    setIsCreateModuleDropdownOpen(false);
    setShowCreateModal(true);
  };

  // Handle Create Submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInst.name.trim() || !newInst.code.trim()) {
      alert("Please provide at least Institution Name and EIIN Code.");
      return;
    }

    try {
      setCreateSubmitting(true);
      const res = await fetch("/api/super-admin/institutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInst),
      });
      const json = await res.json();

      if (json.success) {
        setShowCreateModal(false);
        setNotification({
          type: "success",
          message: `Institution '${newInst.name}' created with Admin ID: ${newInst.adminId}`,
        });
        fetchInstitutions();
      } else {
        alert(json.error || "Failed to create institution.");
      }
    } catch (err: any) {
      alert("Network error creating institution.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Handle toggling single module for an institution in the directory table
  const handleToggleModuleForInst = async (inst: InstitutionItem, moduleKey: string) => {
    const currentModules =
      inst.accessibleModules && inst.accessibleModules.length > 0
        ? inst.accessibleModules
        : [...ALL_INSTITUTION_MODULE_KEYS];

    const newModules = currentModules.includes(moduleKey)
      ? currentModules.filter((m) => m !== moduleKey)
      : [...currentModules, moduleKey];

    // Optimistic UI update
    setInstitutions((prev) =>
      prev.map((item) => (item.id === inst.id ? { ...item, accessibleModules: newModules } : item))
    );

    try {
      setSavingModuleInstId(inst.id);
      const res = await fetch(`/api/super-admin/institutions/${inst.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessibleModules: newModules }),
      });
      const json = await res.json();
      if (!json.success) {
        setInstitutions((prev) =>
          prev.map((item) => (item.id === inst.id ? { ...item, accessibleModules: currentModules } : item))
        );
        setNotification({ type: "error", message: json.error || "Failed to update module access" });
      } else {
        setNotification({
          type: "success",
          message: `Updated module access for ${inst.name} (${newModules.length} modules active)`,
        });
      }
    } catch {
      setInstitutions((prev) =>
        prev.map((item) => (item.id === inst.id ? { ...item, accessibleModules: currentModules } : item))
      );
      setNotification({ type: "error", message: "Network error updating module access" });
    } finally {
      setSavingModuleInstId(null);
    }
  };

  // Handle Select All / Clear All modules for an institution in directory table
  const handleToggleAllModulesForInst = async (inst: InstitutionItem, selectAll: boolean) => {
    const currentModules =
      inst.accessibleModules && inst.accessibleModules.length > 0
        ? inst.accessibleModules
        : [...ALL_INSTITUTION_MODULE_KEYS];
    const newModules = selectAll ? [...ALL_INSTITUTION_MODULE_KEYS] : [];

    // Optimistic UI update
    setInstitutions((prev) =>
      prev.map((item) => (item.id === inst.id ? { ...item, accessibleModules: newModules } : item))
    );

    try {
      setSavingModuleInstId(inst.id);
      const res = await fetch(`/api/super-admin/institutions/${inst.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessibleModules: newModules }),
      });
      const json = await res.json();
      if (!json.success) {
        setInstitutions((prev) =>
          prev.map((item) => (item.id === inst.id ? { ...item, accessibleModules: currentModules } : item))
        );
        setNotification({ type: "error", message: json.error || "Failed to update module access" });
      } else {
        setNotification({
          type: "success",
          message: `${selectAll ? "Granted all modules" : "Cleared all modules"} for ${inst.name}`,
        });
      }
    } catch {
      setInstitutions((prev) =>
        prev.map((item) => (item.id === inst.id ? { ...item, accessibleModules: currentModules } : item))
      );
      setNotification({ type: "error", message: "Network error updating module access" });
    } finally {
      setSavingModuleInstId(null);
    }
  };

  // Handle Open Assign Credentials Modal
  const handleOpenAssignModal = (inst: InstitutionItem) => {
    setSelectedInst(inst);
    setAssignForm({
      adminId: inst.adminId || `admin_${inst.code}`,
      adminPassword: inst.adminPassword || generateRandomPassword(),
      showPassword: true,
    });
    setShowAssignModal(true);
  };

  // Handle Assign Submission
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInst) return;

    try {
      setAssignSubmitting(true);
      const res = await fetch(`/api/super-admin/institutions/${selectedInst.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: assignForm.adminId,
          adminPassword: assignForm.adminPassword,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setShowAssignModal(false);
        setNotification({
          type: "success",
          message: `Updated credentials for ${selectedInst.name}: ID '${assignForm.adminId}'`,
        });
        fetchInstitutions();
      } else {
        alert(json.error || "Failed to update credentials");
      }
    } catch (err) {
      alert("Network error updating credentials");
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Handle Open Edit Modal
  const handleOpenEditModal = (inst: InstitutionItem) => {
    setSelectedInst({
      ...inst,
      accessibleModules:
        inst.accessibleModules && inst.accessibleModules.length > 0
          ? inst.accessibleModules
          : [...ALL_INSTITUTION_MODULE_KEYS],
    });
    setIsEditModuleDropdownOpen(false);
    setShowEditModal(true);
  };

  // Handle Edit Submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInst) return;

    try {
      const res = await fetch(`/api/super-admin/institutions/${selectedInst.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedInst.name,
          nameBn: selectedInst.nameBn,
          code: selectedInst.code,
          address: selectedInst.address,
          contactEmail: selectedInst.contactEmail,
          contactPhone: selectedInst.contactPhone,
          status: selectedInst.status,
          smsSenderId: selectedInst.smsSenderId,
          accessibleModules: selectedInst.accessibleModules || [...ALL_INSTITUTION_MODULE_KEYS],
        }),
      });
      const json = await res.json();

      if (json.success) {
        setShowEditModal(false);
        setNotification({
          type: "success",
          message: `Institution '${selectedInst.name}' updated successfully`,
        });
        fetchInstitutions();
      } else {
        alert(json.error || "Failed to update institution");
      }
    } catch (err) {
      alert("Network error updating institution");
    }
  };

  // Handle Delete
  const handleDeleteInstitution = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete '${name}'? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/super-admin/institutions/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        setNotification({ type: "success", message: `Institution '${name}' deleted.` });
        fetchInstitutions();
      } else {
        alert(json.error || "Failed to delete institution");
      }
    } catch (err) {
      alert("Network error deleting institution");
    }
  };

  // Quick Switch / Impersonate as Institution
  const handleLaunchInstitution = (inst: InstitutionItem) => {
    // Sync to settingsStore
    saveStoredSchoolInfo({
      ...DEFAULT_SCHOOL_INFO,
      name: inst.name,
      nameBn: inst.nameBn || "",
      eiin: inst.code,
      address: inst.address || "",
      email: inst.contactEmail || "",
      phone: inst.contactPhone || "",
    });

    // Save structured auth session marking this explicitly as an Institution Login
    saveAuthSession({
      role: "INSTITUTION_ADMIN",
      adminId: inst.adminId || `admin_${inst.code}`,
      institutionCode: inst.code,
      institutionName: inst.name,
      isInstitutionLogin: true,
      loginAt: new Date().toISOString(),
      accessibleModules:
        inst.accessibleModules && inst.accessibleModules.length > 0
          ? inst.accessibleModules
          : [...ALL_INSTITUTION_MODULE_KEYS],
    });

    // Notify user and route to home
    alert(`Switched active campus to: ${inst.name} (EIIN: ${inst.code}). Redirecting to campus workspace.`);
    router.push("/");
  };

  // Filtered list
  const filteredInstitutions = useMemo(() => {
    return institutions.filter((inst) => {
      const matchesStatus = statusFilter === "ALL" || inst.status === statusFilter;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesStatus;

      const matchesQuery =
        inst.name.toLowerCase().includes(query) ||
        (inst.nameBn && inst.nameBn.toLowerCase().includes(query)) ||
        inst.code.toLowerCase().includes(query) ||
        (inst.adminId && inst.adminId.toLowerCase().includes(query)) ||
        (inst.contactEmail && inst.contactEmail.toLowerCase().includes(query)) ||
        (inst.address && inst.address.toLowerCase().includes(query));

      return matchesStatus && matchesQuery;
    });
  }, [institutions, searchQuery, statusFilter]);

  if (isInstUser) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-800">Super Admin Access Restricted</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            You are currently logged in with institution credentials as{" "}
            <span className="font-bold text-indigo-700">{instSession?.adminId}</span> for{" "}
            <span className="font-bold text-slate-900">{instSession?.institutionName || "your institution"}</span>{" "}
            (EIIN: {instSession?.institutionCode}).
          </p>
          <p className="text-xs text-slate-500">
            Super Admin Central HQ is only accessible to system super administrators.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
          >
            ← Return to Campus Dashboard
          </button>
          <button
            onClick={() => {
              clearAuthSession();
              window.location.reload();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
          >
            Sign Out of Institution
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Brand Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <Building2 className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                HQ Central Command
              </span>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>System Live</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-3">
              <span>Smart Academy Super Admin</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Multi-Campus Institution Management Portal. Provision new schools, assign admin login credentials,
              generate custom access links, and monitor active campuses across Bangladesh.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchInstitutions}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-2 transition-all shadow-sm"
              title="Refresh Institution List"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Institution</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-sm animate-fade-in ${
            notification.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* High-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Institutions</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-800">{summary.total}</span>
            <span className="text-xs text-indigo-600 font-medium">Registered Campuses</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Portals</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-600">{summary.active}</span>
            <span className="text-xs text-slate-500">Active status</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Assigned Admin IDs</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-amber-600">{institutions.length}</span>
            <span className="text-xs text-slate-500">Credential pairs</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Enrolled Students</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-800">{summary.totalStudents.toLocaleString()}</span>
            <span className="text-xs text-purple-600 font-medium">Across all campuses</span>
          </div>
        </div>
      </div>

      {/* Control Toolbar (Search, Filter, Actions) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by institution name, EIIN, Admin ID, email..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            {["ALL", "ACTIVE", "INACTIVE", "SUSPENDED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  statusFilter === st
                    ? "bg-white text-indigo-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Institutions Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Institutions Directory & Access Portals</h2>
            <p className="text-xs text-slate-500">
              Showing {filteredInstitutions.length} of {institutions.length} institutions
            </p>
          </div>
          <span className="text-xs text-slate-500">
            Each institution has an assigned Admin ID, Password, and dedicated Portal Link.
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs">Loading institutions directory...</p>
          </div>
        ) : filteredInstitutions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-700">No institutions found</p>
            <p className="text-xs text-slate-400">
              {searchQuery ? "Try refining your search filter" : "Get started by creating your first institution."}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Institution</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Institution Name & EIIN</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4 min-w-[210px]">Which Module are Access By Institution</th>
                  <th className="py-3 px-4">Assigned Admin ID</th>
                  <th className="py-3 px-4">Assigned Password</th>
                  <th className="py-3 px-4">Dedicated Login Link</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredInstitutions.map((inst) => {
                  const loginUrl = getLoginLink(inst.code);
                  const isCopiedLink = copiedLink === inst.id;
                  const isCopiedCreds = copiedId === inst.id;
                  const isPwdVisible = !!visiblePasswords[inst.id];

                  return (
                    <tr key={inst.id} className="hover:bg-indigo-50/30 transition-colors group">
                      {/* Name & EIIN */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-900">
                            {inst.name}
                          </span>
                          {inst.nameBn && (
                            <span className="text-[11px] text-slate-500">{inst.nameBn}</span>
                          )}
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              EIIN: {inst.code}
                            </span>
                            {inst.stats && (
                              <span className="text-[10px] text-slate-500">
                                {inst.stats.students} Students • {inst.stats.classes} Classes
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="space-y-0.5">
                          {inst.address && (
                            <div className="flex items-center space-x-1.5 text-[11px] text-slate-600">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[160px]">{inst.address}</span>
                            </div>
                          )}
                          {inst.contactEmail && (
                            <div className="flex items-center space-x-1.5 text-[11px] text-slate-600">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[160px]">{inst.contactEmail}</span>
                            </div>
                          )}
                          {inst.contactPhone && (
                            <div className="flex items-center space-x-1.5 text-[11px] text-slate-600">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{inst.contactPhone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Which Module are Access By Institution - Dropdown Menu with Checkboxes */}
                      <td className="py-3.5 px-4">
                        <div className="relative">
                          {(() => {
                            const instModules =
                              inst.accessibleModules && inst.accessibleModules.length > 0
                                ? inst.accessibleModules
                                : [...ALL_INSTITUTION_MODULE_KEYS];
                            const isDropdownOpen = activeTableDropdownInstId === inst.id;
                            const isSavingThis = savingModuleInstId === inst.id;

                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveTableDropdownInstId((prev) =>
                                      prev === inst.id ? null : inst.id
                                    )
                                  }
                                  className={`inline-flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                                    instModules.length === 0
                                      ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                      : instModules.length === ALL_INSTITUTION_MODULE_KEYS.length
                                      ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300"
                                  }`}
                                  title={`Configure modules accessible by ${inst.name}`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <span className="truncate">
                                      {instModules.length === 0
                                        ? "No Modules (0)"
                                        : instModules.length === ALL_INSTITUTION_MODULE_KEYS.length
                                        ? "All 8 Modules"
                                        : `${instModules.length} Modules`}
                                    </span>
                                    {isSavingThis && (
                                      <RefreshCw className="w-3 h-3 text-indigo-500 animate-spin shrink-0" />
                                    )}
                                  </div>
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 shrink-0 ${
                                      isDropdownOpen ? "rotate-180 text-indigo-600" : ""
                                    }`}
                                  />
                                </button>

                                {isDropdownOpen && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-30"
                                      onClick={() => setActiveTableDropdownInstId(null)}
                                    />
                                    <div className="absolute left-0 mt-1.5 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-40 p-3 text-left animate-in fade-in zoom-in-95">
                                      <div className="pb-2.5 mb-2 border-b border-slate-100 flex items-center justify-between">
                                        <div className="min-w-0 pr-2">
                                          <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                                            <span className="truncate">Access: {inst.name}</span>
                                          </div>
                                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                            <span className="font-mono bg-slate-100 px-1 rounded text-slate-600 border border-slate-200">
                                              EIIN: {inst.code}
                                            </span>
                                            <span>•</span>
                                            <span className="font-semibold text-indigo-600">
                                              {instModules.length}/{ALL_INSTITUTION_MODULE_KEYS.length} accessible
                                            </span>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setActiveTableDropdownInstId(null)}
                                          className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 rounded hover:bg-slate-100 cursor-pointer shrink-0"
                                          title="Close dropdown"
                                        >
                                          ✕
                                        </button>
                                      </div>

                                      {/* Quick Select Buttons */}
                                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[10px]">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleAllModulesForInst(inst, true)}
                                          className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                                        >
                                          Select All
                                        </button>
                                        <span className="text-slate-200">|</span>
                                        <button
                                          type="button"
                                          onClick={() => handleToggleAllModulesForInst(inst, false)}
                                          className="text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                                        >
                                          Clear All
                                        </button>
                                        <span className="text-slate-200">|</span>
                                        <span className="text-slate-400 text-[9px] italic">
                                          {isSavingThis ? "Saving..." : "Auto-saved"}
                                        </span>
                                      </div>

                                      {/* Checkboxes List */}
                                      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                        {INSTITUTION_MODULES.map((mod) => {
                                          const isChecked = instModules.includes(mod.key);

                                          return (
                                            <label
                                              key={mod.key}
                                              className={`flex items-start gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                                                isChecked
                                                  ? "bg-indigo-50/80 text-indigo-950 font-semibold"
                                                  : "hover:bg-slate-50 text-slate-600 font-normal"
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleToggleModuleForInst(inst, mod.key)}
                                                className="mt-0.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                              />
                                              <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-1">
                                                  <span className="truncate text-[11px] leading-tight">
                                                    {mod.name}
                                                  </span>
                                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium shrink-0">
                                                    {mod.badge}
                                                  </span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-normal leading-tight line-clamp-1 mt-0.5">
                                                  {mod.desc}
                                                </div>
                                              </div>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Assigned Admin ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="px-2.5 py-1 rounded-md font-mono text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {inst.adminId || `admin_${inst.code}`}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(inst.adminId || `admin_${inst.code}`, "creds", inst.id)
                            }
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                            title="Copy Admin ID"
                          >
                            {isCopiedCreds ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Assigned Password */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 tracking-wide">
                            {isPwdVisible
                              ? inst.adminPassword || `SmartAdmin@${inst.code}`
                              : "••••••••••••"}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(inst.id)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                            title={isPwdVisible ? "Hide password" : "Show password"}
                          >
                            {isPwdVisible ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                inst.adminPassword || `SmartAdmin@${inst.code}`,
                                "creds",
                                inst.id + "_pwd"
                              )
                            }
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                            title="Copy Password"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Dedicated Login Link */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="max-w-[200px] truncate font-mono text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                            {`/portal-login?inst=${inst.code}`}
                          </div>

                          {/* One click copy link */}
                          <button
                            type="button"
                            onClick={() => copyToClipboard(loginUrl, "link", inst.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                              isCopiedLink
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300"
                            }`}
                            title="Copy full direct login link to clipboard"
                          >
                            {isCopiedLink ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-indigo-500" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>

                          {/* Open login page */}
                          <Link
                            href={`/portal-login?inst=${encodeURIComponent(inst.code)}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
                            title="Open login page in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            inst.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : inst.status === "SUSPENDED"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {inst.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Assign/Reset Credentials */}
                          <button
                            onClick={() => handleOpenAssignModal(inst)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all"
                            title="Assign or Change Admin ID & Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Launch/Impersonate */}
                          <button
                            onClick={() => handleLaunchInstitution(inst)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all"
                            title="Switch to this institution dashboard"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => handleOpenEditModal(inst)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all"
                            title="Edit Institution Profile"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteInstitution(inst.id, inst.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
                            title="Delete Institution"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: CREATE NEW INSTITUTION
      ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-400/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create New Institution</h3>
                  <p className="text-xs text-slate-300">
                    Register campus and automatically provision admin access credentials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5 text-xs">
              {/* Institution Identity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-semibold text-slate-700">
                    Institution Name (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newInst.name}
                    onChange={(e) => setNewInst({ ...newInst, name: e.target.value })}
                    placeholder="e.g. Chattogram Model High School & College"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">
                    EIIN / Institution Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newInst.code}
                    onChange={(e) => {
                      const c = e.target.value;
                      setNewInst({
                        ...newInst,
                        code: c,
                        adminId: `admin_${c}`,
                      });
                    }}
                    placeholder="e.g. 108350"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Institution Name (Bangla)</label>
                  <input
                    type="text"
                    value={newInst.nameBn}
                    onChange={(e) => setNewInst({ ...newInst, nameBn: e.target.value })}
                    placeholder="e.g. চট্টগ্রাম মডেল হাই স্কুল অ্যান্ড কলেজ"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              {/* Location & Contact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-3">
                  <label className="font-semibold text-slate-700">Campus Address & Location</label>
                  <input
                    type="text"
                    value={newInst.address}
                    onChange={(e) => setNewInst({ ...newInst, address: e.target.value })}
                    placeholder="e.g. Nasirabad, Chattogram, Bangladesh"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Official Contact Email</label>
                  <input
                    type="email"
                    value={newInst.contactEmail}
                    onChange={(e) => setNewInst({ ...newInst, contactEmail: e.target.value })}
                    placeholder="principal@school.edu.bd"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Official Phone / Hotline</label>
                  <input
                    type="text"
                    value={newInst.contactPhone}
                    onChange={(e) => setNewInst({ ...newInst, contactPhone: e.target.value })}
                    placeholder="+880 1812-345678"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Status</label>
                  <select
                    value={newInst.status}
                    onChange={(e) => setNewInst({ ...newInst, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              {/* Assigned Admin Credentials Section */}
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <KeyRound className="w-4 h-4 text-indigo-700" />
                    <span className="font-bold text-indigo-950 text-xs">
                      Assign Admin Credentials for this Institution
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded font-medium">
                    Auto-generated
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">
                      Assigned Admin Login ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newInst.adminId}
                      onChange={(e) => setNewInst({ ...newInst, adminId: e.target.value })}
                      placeholder="e.g. admin_108350"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-mono font-bold text-indigo-900"
                    />
                    <p className="text-[10px] text-slate-500">
                      User enters this ID to log in to their campus portal.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-700">
                        Assigned Password <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setNewInst({ ...newInst, adminPassword: generateRandomPassword() })
                        }
                        className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                      >
                        <Dice5 className="w-3 h-3" />
                        <span>Generate Random</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={newInst.adminPassword}
                      onChange={(e) => setNewInst({ ...newInst, adminPassword: e.target.value })}
                      placeholder="e.g. Smart@89kL3"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-mono font-bold text-slate-900"
                    />
                    <p className="text-[10px] text-slate-500">
                      You can change or reset this at any time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Which Module are Access By Institution in Create Modal */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">
                    Which Module are Access By Institution
                  </label>
                  <div className="flex items-center space-x-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() =>
                        setNewInst({
                          ...newInst,
                          accessibleModules: [...ALL_INSTITUTION_MODULE_KEYS],
                        })
                      }
                      className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        setNewInst({
                          ...newInst,
                          accessibleModules: [],
                        })
                      }
                      className="text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCreateModuleDropdownOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-left hover:border-slate-400 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">
                        {newInst.accessibleModules.length === ALL_INSTITUTION_MODULE_KEYS.length
                          ? "All 8 Modules Accessible (Full Suite)"
                          : newInst.accessibleModules.length === 0
                          ? "No Modules Selected (Restricted)"
                          : `${newInst.accessibleModules.length} of ${ALL_INSTITUTION_MODULE_KEYS.length} Modules Selected`}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isCreateModuleDropdownOpen ? "rotate-180 text-indigo-600" : ""
                      }`}
                    />
                  </button>

                  {isCreateModuleDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsCreateModuleDropdownOpen(false)}
                      />
                      <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-40 p-3 max-h-60 overflow-y-auto space-y-1.5 animate-in fade-in">
                        {INSTITUTION_MODULES.map((mod) => {
                          const isChecked = newInst.accessibleModules.includes(mod.key);
                          return (
                            <label
                              key={mod.key}
                              className={`flex items-start gap-2 p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? "bg-indigo-50/80 text-indigo-950 font-semibold"
                                  : "hover:bg-slate-50 text-slate-600 font-normal"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setNewInst({
                                    ...newInst,
                                    accessibleModules: checked
                                      ? [...newInst.accessibleModules, mod.key]
                                      : newInst.accessibleModules.filter((k) => k !== mod.key),
                                  });
                                }}
                                className="mt-0.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] leading-tight font-bold">
                                    {mod.name}
                                  </span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                    {mod.badge}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-normal leading-tight line-clamp-1 mt-0.5">
                                  {mod.desc}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {createSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Create Institution & Issue Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: ASSIGN / CHANGE CREDENTIALS
      ========================================================================= */}
      {showAssignModal && selectedInst && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Assign Admin Credentials</h3>
                  <p className="text-[11px] text-slate-300">{selectedInst.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Campus EIIN</span>
                  <p className="font-mono font-bold text-slate-800">{selectedInst.code}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Portal Link</span>
                  <p className="font-mono text-[11px] text-indigo-600 font-semibold">
                    /portal-login?inst={selectedInst.code}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Assign Admin Login ID</label>
                <input
                  type="text"
                  required
                  value={assignForm.adminId}
                  onChange={(e) => setAssignForm({ ...assignForm, adminId: e.target.value })}
                  placeholder="e.g. admin_108254"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-indigo-900"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">Assign Password</label>
                  <button
                    type="button"
                    onClick={() =>
                      setAssignForm({
                        ...assignForm,
                        adminPassword: generateRandomPassword(),
                      })
                    }
                    className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                  >
                    <Dice5 className="w-3 h-3" />
                    <span>Generate New</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={assignForm.showPassword ? "text" : "password"}
                    required
                    value={assignForm.adminPassword}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, adminPassword: e.target.value })
                    }
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setAssignForm({
                        ...assignForm,
                        showPassword: !assignForm.showPassword,
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {assignForm.showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Copy Card */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-900">
                    Ready to send to Institution Principal?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const text = `Smart Academy Campus Login Credentials:\nInstitution: ${selectedInst.name} (EIIN: ${selectedInst.code})\nLogin Portal: ${getLoginLink(selectedInst.code)}\nAdmin ID: ${assignForm.adminId}\nPassword: ${assignForm.adminPassword}`;
                      navigator.clipboard.writeText(text);
                      alert("Copied full credential packet to clipboard!");
                    }}
                    className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline"
                  >
                    Copy Credentials Packet
                  </button>
                </div>
                <p className="text-[10px] text-amber-700">
                  Sends full institutional login URL, assigned ID, and Password.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  {assignSubmitting ? "Saving..." : "Save Assigned Credentials"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: EDIT INSTITUTION PROFILE
      ========================================================================= */}
      {showEditModal && selectedInst && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold">Edit Institution Profile</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Institution Name</label>
                <input
                  type="text"
                  required
                  value={selectedInst.name}
                  onChange={(e) => setSelectedInst({ ...selectedInst, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">EIIN Code</label>
                  <input
                    type="text"
                    required
                    value={selectedInst.code}
                    onChange={(e) => setSelectedInst({ ...selectedInst, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Status</label>
                  <select
                    value={selectedInst.status}
                    onChange={(e) =>
                      setSelectedInst({ ...selectedInst, status: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Campus Address</label>
                <input
                  type="text"
                  value={selectedInst.address || ""}
                  onChange={(e) => setSelectedInst({ ...selectedInst, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={selectedInst.contactEmail || ""}
                    onChange={(e) =>
                      setSelectedInst({ ...selectedInst, contactEmail: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Phone</label>
                  <input
                    type="text"
                    value={selectedInst.contactPhone || ""}
                    onChange={(e) =>
                      setSelectedInst({ ...selectedInst, contactPhone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Which Module are Access By Institution in Edit Modal */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">
                    Which Module are Access By Institution
                  </label>
                  <div className="flex items-center space-x-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedInst({
                          ...selectedInst,
                          accessibleModules: [...ALL_INSTITUTION_MODULE_KEYS],
                        })
                      }
                      className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedInst({
                          ...selectedInst,
                          accessibleModules: [],
                        })
                      }
                      className="text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="relative">
                  {(() => {
                    const editModules =
                      selectedInst.accessibleModules && selectedInst.accessibleModules.length > 0
                        ? selectedInst.accessibleModules
                        : [...ALL_INSTITUTION_MODULE_KEYS];

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsEditModuleDropdownOpen((prev) => !prev)}
                          className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-left hover:border-slate-400 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="font-medium text-slate-800 truncate">
                              {editModules.length === ALL_INSTITUTION_MODULE_KEYS.length
                                ? "All 8 Modules Accessible (Full Suite)"
                                : editModules.length === 0
                                ? "No Modules Selected (Restricted)"
                                : `${editModules.length} of ${ALL_INSTITUTION_MODULE_KEYS.length} Modules Selected`}
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform ${
                              isEditModuleDropdownOpen ? "rotate-180 text-indigo-600" : ""
                            }`}
                          />
                        </button>

                        {isEditModuleDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setIsEditModuleDropdownOpen(false)}
                            />
                            <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-40 p-3 max-h-60 overflow-y-auto space-y-1.5 animate-in fade-in">
                              {INSTITUTION_MODULES.map((mod) => {
                                const isChecked = editModules.includes(mod.key);
                                return (
                                  <label
                                    key={mod.key}
                                    className={`flex items-start gap-2 p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                                      isChecked
                                        ? "bg-indigo-50/80 text-indigo-950 font-semibold"
                                        : "hover:bg-slate-50 text-slate-600 font-normal"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        const updated = checked
                                          ? [...editModules, mod.key]
                                          : editModules.filter((k) => k !== mod.key);
                                        setSelectedInst({
                                          ...selectedInst,
                                          accessibleModules: updated,
                                        });
                                      }}
                                      className="mt-0.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] leading-tight font-bold">
                                          {mod.name}
                                        </span>
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                          {mod.badge}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-normal leading-tight line-clamp-1 mt-0.5">
                                        {mod.desc}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import {
  FileSignature,
  PenTool,
  Stamp,
  CheckCircle2,
  PlusCircle,
  Search,
  Upload,
  Trash2,
  Edit3,
  Eye,
  RefreshCw,
  Sliders,
  Check,
  X,
  FileText,
  Award,
  CreditCard,
  Layers,
  Sparkles,
  Info,
  RotateCcw,
  Palette,
  ShieldCheck,
  Building2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { SettingNavHeader } from "@/app/settings/SettingNavHeader";
import {
  InstitutionalSignature,
  SignatureType,
  SIGNATURE_TYPE_OPTIONS,
  SCRIPT_FONTS,
  getStoredSignatures,
  saveStoredSignatures,
  addSignature,
  updateSingleSignature,
  deleteSignature,
  resetSignaturesToDefault,
  SIGNATURES_UPDATED_EVENT,
} from "@/lib/signatureStore";

export default function SignatureSetupPage() {
  const [signatures, setSignatures] = useState<InstitutionalSignature[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [docFilter, setDocFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [notification, setNotification] = useState<{ type: "success" | "info" | "error"; message: string } | null>(null);

  // Modals
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingSig, setEditingSig] = useState<InstitutionalSignature | null>(null);

  // Editor Form State
  const [formData, setFormData] = useState<{
    type: SignatureType;
    designation: string;
    designationBn: string;
    name: string;
    department: string;
    signatureUrl: string;
    signatureStyle: "IMAGE" | "DRAWN" | "SCRIPT";
    scriptFont: string;
    hasSeal: boolean;
    sealText: string;
    isActive: boolean;
    displayOrder: number;
    documents: {
      marksheet: boolean;
      tabulation: boolean;
      admitCard: boolean;
      seatPlan: boolean;
      idCard: boolean;
      certificate: boolean;
      feeReceipt: boolean;
    };
    notes: string;
  }>({
    type: "HEAD_OF_INSTITUTION",
    designation: "Principal",
    designationBn: "অধ্যক্ষ",
    name: "",
    department: "",
    signatureUrl: "",
    signatureStyle: "IMAGE",
    scriptFont: "font_classic",
    hasSeal: false,
    sealText: "",
    isActive: true,
    displayOrder: 1,
    documents: {
      marksheet: true,
      tabulation: true,
      admitCard: true,
      seatPlan: false,
      idCard: false,
      certificate: true,
      feeReceipt: false,
    },
    notes: "",
  });

  // Canvas Drawing Pad State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#0f172a");
  const [penWidth, setPenWidth] = useState(2.5);
  const [hasDrawnOnCanvas, setHasDrawnOnCanvas] = useState(false);

  // Load signatures on mount & listen to changes
  useEffect(() => {
    const loaded = getStoredSignatures();
    setSignatures(loaded);

    const handleUpdate = () => {
      setSignatures(getStoredSignatures());
    };

    window.addEventListener(SIGNATURES_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(SIGNATURES_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  // Filtered Signatures
  const filteredSignatures = useMemo(() => {
    return signatures.filter((sig) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        sig.name.toLowerCase().includes(q) ||
        sig.designation.toLowerCase().includes(q) ||
        (sig.designationBn && sig.designationBn.includes(q)) ||
        (sig.department && sig.department.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && sig.isActive) ||
        (statusFilter === "INACTIVE" && !sig.isActive);

      let matchesDoc = true;
      if (docFilter === "marksheet") matchesDoc = sig.documents.marksheet;
      else if (docFilter === "tabulation") matchesDoc = sig.documents.tabulation;
      else if (docFilter === "admitCard") matchesDoc = sig.documents.admitCard;
      else if (docFilter === "certificate") matchesDoc = sig.documents.certificate;
      else if (docFilter === "feeReceipt") matchesDoc = sig.documents.feeReceipt;

      return matchesQuery && matchesStatus && matchesDoc;
    });
  }, [signatures, searchQuery, statusFilter, docFilter]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingSig(null);
    setFormData({
      type: "CUSTOM",
      designation: "Authorized Officer",
      designationBn: "অনুমোদিত কর্মকর্তা",
      name: "",
      department: "",
      signatureUrl: "",
      signatureStyle: "IMAGE",
      scriptFont: "font_classic",
      hasSeal: false,
      sealText: "",
      isActive: true,
      displayOrder: signatures.length + 1,
      documents: {
        marksheet: true,
        tabulation: true,
        admitCard: false,
        seatPlan: false,
        idCard: false,
        certificate: false,
        feeReceipt: false,
      },
      notes: "",
    });
    setHasDrawnOnCanvas(false);
    setShowEditorModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (sig: InstitutionalSignature) => {
    setEditingSig(sig);
    setFormData({
      type: sig.type,
      designation: sig.designation,
      designationBn: sig.designationBn || "",
      name: sig.name,
      department: sig.department || "",
      signatureUrl: sig.signatureUrl || "",
      signatureStyle: sig.signatureStyle,
      scriptFont: sig.scriptFont || "font_classic",
      hasSeal: sig.hasSeal,
      sealText: sig.sealText || "",
      isActive: sig.isActive,
      displayOrder: sig.displayOrder,
      documents: { ...sig.documents },
      notes: sig.notes || "",
    });
    setHasDrawnOnCanvas(!!sig.signatureUrl);
    setShowEditorModal(true);
  };

  // Handle Type Selection Preset Change
  const handleTypeChange = (typeVal: SignatureType) => {
    const preset = SIGNATURE_TYPE_OPTIONS.find((t) => t.value === typeVal);
    if (preset) {
      setFormData((prev) => ({
        ...prev,
        type: typeVal,
        designation: preset.defaultDesignation,
        designationBn: preset.defaultBn,
      }));
    }
  };

  // Canvas Drawing Logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsDrawing(true);
    setHasDrawnOnCanvas(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setFormData((prev) => ({ ...prev, signatureUrl: dataUrl }));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnOnCanvas(false);
    setFormData((prev) => ({ ...prev, signatureUrl: "" }));
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, or SVG)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image file size should be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        signatureUrl: result,
        signatureStyle: "IMAGE",
      }));
    };
    reader.readAsDataURL(file);
  };

  // Submit Save
  const handleSaveSignatory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.designation.trim()) {
      alert("Please provide both Signatory Name and Designation Title.");
      return;
    }

    if (editingSig) {
      updateSingleSignature(editingSig.id, formData);
      setNotification({
        type: "success",
        message: `Updated signature profile for '${formData.name}' (${formData.designation}).`,
      });
    } else {
      addSignature(formData);
      setNotification({
        type: "success",
        message: `Added new signatory '${formData.name}' (${formData.designation}).`,
      });
    }

    setShowEditorModal(false);
    setTimeout(() => setNotification(null), 3500);
  };

  // Toggle Active
  const handleToggleActive = (sig: InstitutionalSignature) => {
    updateSingleSignature(sig.id, { isActive: !sig.isActive });
    setNotification({
      type: "info",
      message: `${sig.designation} signature ${sig.isActive ? "deactivated" : "activated"}.`,
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // Delete
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the signature for '${name}'?`)) {
      deleteSignature(id);
      setNotification({ type: "info", message: `Deleted signature for ${name}.` });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (confirm("Reset all institutional signatures to factory defaults? Custom changes will be overwritten.")) {
      resetSignaturesToDefault();
      setNotification({ type: "success", message: "Signatures reset to factory defaults successfully." });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Module Navigation Menu Bar */}
      <SettingNavHeader />

      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-cyan-900/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <FileSignature className="w-80 h-80 text-cyan-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                Signatory Authority Matrix
              </span>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Protection</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-3">
              <span>Signature Setup & Designation Control</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Configure official authority signatures, designation titles, handwritten digital strokes, and institutional
              seals for Student Marksheets, Tabulation Sheets, Admit Cards, and Testimonials.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPreviewModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-700/60 text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm"
              title="Preview how signatures appear on printed reports"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Document Print Mockup</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Signatory</span>
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
              : "bg-cyan-50 border border-cyan-200 text-cyan-800"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metric Overview Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Configured Signatories</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <FileSignature className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-800">{signatures.length}</span>
            <span className="text-xs text-cyan-600 font-medium">Official Roles</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Signatures</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-600">
              {signatures.filter((s) => s.isActive).length}
            </span>
            <span className="text-xs text-slate-500">Live on Reports</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Official Digital Seals</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Stamp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-purple-600">
              {signatures.filter((s) => s.hasSeal).length}
            </span>
            <span className="text-xs text-slate-500">Embossed Stamps</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Protected Document Types</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-800">7</span>
            <span className="text-xs text-amber-600 font-medium">NCTB Standard Formats</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search signatory by name, designation, department..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Document filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500 font-medium">Document:</span>
            <select
              value={docFilter}
              onChange={(e) => setDocFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700"
            >
              <option value="ALL">All Documents</option>
              <option value="marksheet">Marksheet / Transcript</option>
              <option value="tabulation">Tabulation Sheet</option>
              <option value="admitCard">Admit Card</option>
              <option value="certificate">Testimonial & Certificate</option>
              <option value="feeReceipt">Fee Receipt</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            {["ALL", "ACTIVE", "INACTIVE"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  statusFilter === st
                    ? "bg-white text-cyan-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={handleResetDefaults}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Reset to factory defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Signatories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSignatures.map((sig) => (
          <div
            key={sig.id}
            className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between overflow-hidden group ${
              sig.isActive ? "border-slate-200/90" : "border-slate-200 opacity-75 bg-slate-50/50"
            }`}
          >
            {/* Card Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-800 border border-cyan-200">
                      {sig.type.replace(/_/g, " ")}
                    </span>
                    {sig.hasSeal && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200 flex items-center space-x-1">
                        <Stamp className="w-2.5 h-2.5" />
                        <span>Seal</span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{sig.designation}</h3>
                  {sig.designationBn && (
                    <p className="text-[11px] text-slate-500 font-medium">{sig.designationBn}</p>
                  )}
                </div>

                {/* Status Toggle Switch */}
                <button
                  onClick={() => handleToggleActive(sig)}
                  className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    sig.isActive ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start"
                  }`}
                  title={sig.isActive ? "Deactivate signature" : "Activate signature"}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs"></div>
                </button>
              </div>

              {/* Signatory Name */}
              <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Signatory Authority
                  </span>
                  <p className="font-bold text-slate-800 text-xs">{sig.name}</p>
                  {sig.department && (
                    <p className="text-[10px] text-slate-500">{sig.department}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Visual Signature & Seal Preview Box */}
            <div className="p-6 bg-radial from-slate-50 to-white flex flex-col items-center justify-center min-h-[140px] relative border-b border-slate-100">
              {/* Seal Representation if active */}
              {sig.hasSeal && (
                <div className="absolute right-4 top-4 pointer-events-none opacity-20 transform -rotate-12">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-purple-800 flex items-center justify-center text-center p-1">
                    <span className="text-[7px] font-black uppercase text-purple-900">
                      {sig.sealText || sig.designation}
                    </span>
                  </div>
                </div>
              )}

              {/* Signature Display */}
              <div className="text-center relative z-10 w-full flex items-center justify-center">
                {sig.signatureUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={sig.signatureUrl}
                    alt={`${sig.name} signature`}
                    className="max-h-16 max-w-[200px] object-contain filter drop-shadow-xs"
                  />
                ) : (
                  <div className="py-2">
                    <span className="font-serif italic font-bold text-xl text-slate-800 tracking-wider">
                      {sig.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Baseline indicator */}
              <div className="w-48 h-px bg-slate-300 mt-2"></div>
              <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-mono">
                {sig.designation}
              </span>
            </div>

            {/* Card Footer: Document Badges & Actions */}
            <div className="p-4 bg-slate-50/80 space-y-3">
              {/* Document Placements */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                  Appears on Documents:
                </span>
                <div className="flex flex-wrap gap-1">
                  {sig.documents.marksheet && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      Marksheet
                    </span>
                  )}
                  {sig.documents.tabulation && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                      Tabulation
                    </span>
                  )}
                  {sig.documents.admitCard && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                      Admit Card
                    </span>
                  )}
                  {sig.documents.certificate && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                      Certificate
                    </span>
                  )}
                  {sig.documents.feeReceipt && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                      Fee Receipt
                    </span>
                  )}
                  {sig.documents.idCard && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-medium">
                      ID Card
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Order #{sig.displayOrder}</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(sig)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 transition-colors"
                    title="Edit Designation, Name or Signature"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(sig.id, sig.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                    title="Delete Signatory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSignatures.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <FileSignature className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No signatories matched your filter</h3>
          <p className="text-xs text-slate-400">Try adjusting your search criteria or reset filters.</p>
          <button
            onClick={handleOpenAdd}
            className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-700"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Signatory</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: CREATE / EDIT SIGNATORY
      ========================================================================= */}
      {showEditorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-cyan-950 p-6 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-400/30">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingSig ? "Edit Institutional Signatory" : "Add Institutional Signatory"}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Control designation, signatory identity, digital signature stroke & seal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditorModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSignatory} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
              {/* Preset Signatory Role */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Signatory Role Category</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value as SignatureType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                >
                  {SIGNATURE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Designation & Name Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">
                    Official Designation (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Principal, Exam Controller, Class Teacher"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Official Designation (Bangla)</label>
                  <input
                    type="text"
                    value={formData.designationBn}
                    onChange={(e) => setFormData({ ...formData, designationBn: e.target.value })}
                    placeholder="e.g. অধ্যক্ষ, পরীক্ষা নিয়ন্ত্রক, শ্রেণি শিক্ষক"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">
                    Signatory Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Prof. A. K. M. Shamsuddin"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Department / Office</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Office of the Principal, Exam Committee"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Signature Input Controls (3 Methods) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <PenTool className="w-4 h-4 text-cyan-600" />
                    <span>Signature Input & Style</span>
                  </span>

                  {/* Mode Selector Tabs */}
                  <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, signatureStyle: "IMAGE" })}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        formData.signatureStyle === "IMAGE"
                          ? "bg-white text-cyan-700 shadow-xs font-semibold"
                          : "text-slate-600"
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, signatureStyle: "DRAWN" })}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        formData.signatureStyle === "DRAWN"
                          ? "bg-white text-cyan-700 shadow-xs font-semibold"
                          : "text-slate-600"
                      }`}
                    >
                      Digital Draw Pad
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, signatureStyle: "SCRIPT" })}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        formData.signatureStyle === "SCRIPT"
                          ? "bg-white text-cyan-700 shadow-xs font-semibold"
                          : "text-slate-600"
                      }`}
                    >
                      Script Signature
                    </button>
                  </div>
                </div>

                {/* TAB A: UPLOAD FILE */}
                {formData.signatureStyle === "IMAGE" && (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-cyan-400 bg-white transition-colors">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">
                        Upload signature image (PNG, JPG, or SVG)
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Recommended: Transparent background PNG, ~300×100 px, high resolution
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="mt-3 block mx-auto text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                      />
                    </div>

                    {formData.signatureUrl && (
                      <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Preview:</span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={formData.signatureUrl}
                            alt="Signature Preview"
                            className="h-10 object-contain bg-slate-50 px-2 rounded border border-slate-100"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, signatureUrl: "" })}
                          className="text-rose-600 hover:text-rose-800 text-xs font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB B: DRAW PAD */}
                {formData.signatureStyle === "DRAWN" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Draw signature directly using mouse or touchscreen:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px]">Color:</span>
                        <button
                          type="button"
                          onClick={() => setPenColor("#0f172a")}
                          className={`w-4 h-4 rounded-full bg-slate-900 border ${
                            penColor === "#0f172a" ? "ring-2 ring-cyan-500" : ""
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setPenColor("#1e3a8a")}
                          className={`w-4 h-4 rounded-full bg-blue-900 border ${
                            penColor === "#1e3a8a" ? "ring-2 ring-cyan-500" : ""
                          }`}
                        />
                        <button
                          type="button"
                          onClick={clearCanvas}
                          className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold underline ml-2"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <canvas
                      ref={canvasRef}
                      width={480}
                      height={120}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-28 bg-white border border-slate-300 rounded-xl cursor-crosshair shadow-inner"
                    />
                    <p className="text-[10px] text-slate-400 text-center">
                      Stroke will automatically be captured and converted to high-definition vector asset.
                    </p>
                  </div>
                )}

                {/* TAB C: SCRIPT TYPOGRAPHY */}
                {formData.signatureStyle === "SCRIPT" && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-600">
                      Select a handwritten calligraphic script rendered from the signatory&apos;s name:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {SCRIPT_FONTS.map((font) => (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, scriptFont: font.id })}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            formData.scriptFont === font.id
                              ? "border-cyan-500 bg-cyan-50 text-cyan-900 ring-2 ring-cyan-500/20"
                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span className="text-[10px] block text-slate-400 font-sans">{font.name}</span>
                          <span className={`text-base block mt-1 ${font.fontClass}`}>
                            {formData.name || "Signatory Name"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Official Seal / Stamp */}
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-purple-950 flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.hasSeal}
                      onChange={(e) => setFormData({ ...formData, hasSeal: e.target.checked })}
                      className="rounded bg-white border-purple-300 text-purple-600 focus:ring-0"
                    />
                    <span className="flex items-center space-x-1.5">
                      <Stamp className="w-3.5 h-3.5 text-purple-700" />
                      <span>Include Official Seal / Institutional Stamp</span>
                    </span>
                  </label>
                  <span className="text-[10px] text-purple-600 font-medium">Digital Watermark</span>
                </div>

                {formData.hasSeal && (
                  <div className="space-y-1.5 pt-1">
                    <label className="font-semibold text-slate-700">Seal Legend Text</label>
                    <input
                      type="text"
                      value={formData.sealText}
                      onChange={(e) => setFormData({ ...formData, sealText: e.target.value })}
                      placeholder="e.g. OFFICE OF THE PRINCIPAL / DHAKA IDEAL MODEL"
                      className="w-full px-3 py-2 border border-purple-200 rounded-lg bg-white text-xs font-mono uppercase"
                    />
                  </div>
                )}
              </div>

              {/* Document Applicability Matrix */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">
                  Applicable Documents (Select where this signature appears):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { key: "marksheet", label: "Marksheet & Transcript" },
                    { key: "tabulation", label: "Tabulation Sheet" },
                    { key: "admitCard", label: "Exam Admit Card" },
                    { key: "seatPlan", label: "Seat Plan / Hall Ticket" },
                    { key: "idCard", label: "Student ID Card" },
                    { key: "certificate", label: "Testimonial & Certificate" },
                    { key: "feeReceipt", label: "Fee & Money Receipt" },
                  ].map((doc) => (
                    <label
                      key={doc.key}
                      className="flex items-center space-x-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-100 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={formData.documents[doc.key as keyof typeof formData.documents]}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            documents: {
                              ...formData.documents,
                              [doc.key]: e.target.checked,
                            },
                          })
                        }
                        className="rounded bg-white border-slate-300 text-cyan-600 focus:ring-0"
                      />
                      <span className="text-slate-700 font-medium text-[11px]">{doc.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Order & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Signature Status</label>
                  <select
                    value={formData.isActive ? "ACTIVE" : "INACTIVE"}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "ACTIVE" })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                  >
                    <option value="ACTIVE">ACTIVE (Printed on documents)</option>
                    <option value="INACTIVE">INACTIVE (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditorModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20"
                >
                  Save Institutional Signatory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: DOCUMENT PRINT MOCKUP PREVIEW
      ========================================================================= */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold">Document Print Mockup: Signatures in Action</h3>
                  <p className="text-[11px] text-slate-400">
                    Live simulation of official NCTB Marksheet & Tabulation Sheet signature footers
                  </p>
                </div>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto bg-slate-50">
              {/* Marksheet Simulation */}
              <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-slate-800">
                      NCTB Student Academic Marksheet Footer
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    Official Transcript Format
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  The signatures below automatically render on every generated marksheet PDF and print layout:
                </p>

                {/* 3-Column Marksheet Signatures Footer */}
                <div className="grid grid-cols-3 gap-6 pt-6 text-center">
                  {/* Left: Class Teacher */}
                  <div className="flex flex-col items-center justify-end">
                    {signatures
                      .filter((s) => s.isActive && s.documents.marksheet && s.type === "CLASS_TEACHER")
                      .slice(0, 1)
                      .map((s) => (
                        <div key={s.id} className="space-y-1">
                          {s.signatureUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={s.signatureUrl} alt="sig" className="h-10 mx-auto object-contain" />
                          ) : (
                            <span className="font-serif italic font-bold text-base text-slate-800">
                              {s.name}
                            </span>
                          )}
                          <div className="w-40 h-px bg-slate-400 mx-auto my-1"></div>
                          <span className="font-bold text-xs text-slate-800 block">{s.name}</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                            {s.designation}
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Center: Exam Controller */}
                  <div className="flex flex-col items-center justify-end">
                    {signatures
                      .filter((s) => s.isActive && s.documents.marksheet && s.type === "EXAM_CONTROLLER")
                      .slice(0, 1)
                      .map((s) => (
                        <div key={s.id} className="space-y-1">
                          {s.signatureUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={s.signatureUrl} alt="sig" className="h-10 mx-auto object-contain" />
                          ) : (
                            <span className="font-serif italic font-bold text-base text-slate-800">
                              {s.name}
                            </span>
                          )}
                          <div className="w-40 h-px bg-slate-400 mx-auto my-1"></div>
                          <span className="font-bold text-xs text-slate-800 block">{s.name}</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                            {s.designation}
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Right: Principal / Headmaster */}
                  <div className="flex flex-col items-center justify-end">
                    {signatures
                      .filter((s) => s.isActive && s.documents.marksheet && s.type === "HEAD_OF_INSTITUTION")
                      .slice(0, 1)
                      .map((s) => (
                        <div key={s.id} className="space-y-1">
                          {s.signatureUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={s.signatureUrl} alt="sig" className="h-10 mx-auto object-contain" />
                          ) : (
                            <span className="font-serif italic font-bold text-base text-slate-800">
                              {s.name}
                            </span>
                          )}
                          <div className="w-40 h-px bg-slate-400 mx-auto my-1"></div>
                          <span className="font-bold text-xs text-slate-800 block">{s.name}</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                            {s.designation}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Tabulation Sheet Simulation */}
              <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs text-slate-800">
                      NCTB Comprehensive Tabulation Book (Gazette) Footer
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                    4-Authority Gazette
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4 pt-4 text-center">
                  {signatures
                    .filter((s) => s.isActive && s.documents.tabulation)
                    .slice(0, 4)
                    .map((s) => (
                      <div key={s.id} className="flex flex-col items-center justify-end space-y-1">
                        {s.signatureUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={s.signatureUrl} alt="sig" className="h-8 mx-auto object-contain" />
                        ) : (
                          <span className="font-serif italic font-semibold text-xs text-slate-800">
                            {s.name}
                          </span>
                        )}
                        <div className="w-32 h-px bg-slate-400 mx-auto my-1"></div>
                        <span className="text-[10px] font-bold text-slate-800 block">{s.name}</span>
                        <span className="text-[9px] text-slate-500 block">{s.designation}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

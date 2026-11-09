"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import {
  Box,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import {
  FileSignature,
  PenTool,
  Stamp,
  PlusCircle,
  Search,
  Upload,
  Trash2,
  Edit3,
  Eye,
  FileText,
  Award,
  Layers,
  RotateCcw,
} from "@/components/iconify/lucide";
import {
  SettingsPageShell,
  SettingsPageHeader,
  SettingsSection,
  SettingsFilterGrid,
  SettingsNotice,
} from "@/sections/settings/component/settings-page-ui";
import { AppButton } from "@/components/button/app-button";
import { AppTextField } from "@/components/text-field/app-text-field";
import { AppSelect } from "@/components/select/app-select";
import {
  InstitutionalSignature,
  SignatureType,
  SIGNATURE_TYPE_OPTIONS,
  SCRIPT_FONTS,
  getStoredSignatures,
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

  const activeCount = signatures.filter((s) => s.isActive).length;
  const sealCount = signatures.filter((s) => s.hasSeal).length;

  return (
    <SettingsPageShell>
      <SettingsPageHeader
        heading="Signature Setup"
        current="Signatures"
        action={
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            <AppButton
              onClick={() => setShowPreviewModal(true)}
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<Eye className="w-3.5 h-3.5" />}
              title="Preview how signatures appear on printed reports"
            >
              Preview
            </AppButton>
            <AppButton
              onClick={handleOpenAdd}
              variant="contained"
              color="primary"
              size="small"
              startIcon={<PlusCircle className="w-4 h-4" />}
            >
              Add Signatory
            </AppButton>
          </Stack>
        }
      />

      {notification && (
        <SettingsNotice
          severity={
            notification.type === "success"
              ? "success"
              : notification.type === "error"
                ? "error"
                : "info"
          }
        >
          {notification.message}
        </SettingsNotice>
      )}

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
        <Chip
          size="small"
          label={`${signatures.length} signatories`}
          sx={{ height: 22, fontWeight: 700, bgcolor: "primary.lighter", color: "primary.dark" }}
        />
        <Chip
          size="small"
          label={`${activeCount} active`}
          color="success"
          variant="outlined"
          sx={{ height: 22, fontWeight: 700 }}
        />
        <Chip
          size="small"
          label={`${sealCount} seals`}
          color="secondary"
          variant="outlined"
          sx={{ height: 22, fontWeight: 700 }}
        />
        <Chip
          size="small"
          label="7 document types"
          color="warning"
          variant="outlined"
          sx={{ height: 22, fontWeight: 700 }}
        />
      </Stack>

      <SettingsSection
        title="Institutional signatories"
        subtitle="Configure official authority signatures, designations, digital strokes, and seals for marksheets, tabulation, admit cards, and testimonials."
        toolbar={
          <Stack spacing={1.5}>
            <SettingsFilterGrid columns={2}>
              <AppTextField
                label="Search"
                placeholder="Name, designation, department…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startIcon={<Search className="w-4 h-4" />}
              />
              <AppSelect
                label="Document"
                value={docFilter}
                onChange={setDocFilter}
                options={[
                  { value: "ALL", label: "All Documents" },
                  { value: "marksheet", label: "Marksheet / Transcript" },
                  { value: "tabulation", label: "Tabulation Sheet" },
                  { value: "admitCard", label: "Admit Card" },
                  { value: "certificate", label: "Testimonial & Certificate" },
                  { value: "feeReceipt", label: "Fee Receipt" },
                ]}
              />
            </SettingsFilterGrid>

            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", alignItems: "center", gap: 1 }}>
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ p: 0.5, bgcolor: "grey.100", borderRadius: 1.5, border: 1, borderColor: "divider" }}
              >
                {["ALL", "ACTIVE", "INACTIVE"].map((st) => (
                  <AppButton
                    key={st}
                    size="small"
                    variant="soft"
                    color={statusFilter === st ? "primary" : "inherit"}
                    onClick={() => setStatusFilter(st)}
                  >
                    {st}
                  </AppButton>
                ))}
              </Stack>

              <AppButton
                onClick={handleResetDefaults}
                size="small"
                variant="text"
                color="inherit"
                title="Reset to factory defaults"
                startIcon={<RotateCcw className="w-4 h-4" />}
              >
                Reset
              </AppButton>
            </Stack>
          </Stack>
        }
      >
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
        <Box sx={{ py: 8, textAlign: "center" }}>
          <FileSignature className="w-10 h-10 text-slate-300 mx-auto" />
          <Typography variant="subtitle2" sx={{ mt: 1.5, fontWeight: 700 }}>
            No signatories matched your filter
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            Try adjusting your search criteria or reset filters.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <AppButton
              onClick={handleOpenAdd}
              variant="contained"
              color="primary"
              size="small"
              startIcon={<PlusCircle className="w-3.5 h-3.5" />}
            >
              Add Signatory
            </AppButton>
          </Box>
        </Box>
      )}
      </SettingsSection>

      {/* =========================================================================
          MODAL 1: CREATE / EDIT SIGNATORY
      ========================================================================= */}
      <Dialog
        open={showEditorModal}
        onClose={() => setShowEditorModal(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <Box component="form" onSubmit={handleSaveSignatory} sx={{ display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "primary.lighter",
                  color: "primary.main",
                }}
              >
                <FileSignature className="w-5 h-5" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {editingSig ? "Edit Institutional Signatory" : "Add Institutional Signatory"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Control designation, signatory identity, digital signature stroke & seal
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>

          <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <AppSelect
                label="Signatory Role Category"
                value={formData.type}
                onChange={(value) => handleTypeChange(value as SignatureType)}
                options={SIGNATURE_TYPE_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
              />

              <SettingsFilterGrid columns={2}>
                <AppTextField
                  label="Official Designation (English)"
                  required
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g. Principal, Exam Controller, Class Teacher"
                />
                <AppTextField
                  label="Official Designation (Bangla)"
                  value={formData.designationBn}
                  onChange={(e) => setFormData({ ...formData, designationBn: e.target.value })}
                  placeholder="e.g. অধ্যক্ষ, পরীক্ষা নিয়ন্ত্রক, শ্রেণি শিক্ষক"
                />
                <AppTextField
                  label="Signatory Full Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Prof. A. K. M. Shamsuddin"
                />
                <AppTextField
                  label="Department / Office"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Office of the Principal, Exam Committee"
                />
              </SettingsFilterGrid>

              {/* Signature Input Controls (3 Methods) */}
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: "grey.50", border: 1, borderColor: "divider" }}>
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <PenTool className="w-4 h-4 text-cyan-600" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Signature Input & Style
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={0.5} sx={{ p: 0.5, bgcolor: "grey.200", borderRadius: 1.5, flexWrap: "wrap" }}>
                      <AppButton
                        type="button"
                        size="small"
                        variant="soft"
                        color={formData.signatureStyle === "IMAGE" ? "primary" : "inherit"}
                        onClick={() => setFormData({ ...formData, signatureStyle: "IMAGE" })}
                      >
                        Upload File
                      </AppButton>
                      <AppButton
                        type="button"
                        size="small"
                        variant="soft"
                        color={formData.signatureStyle === "DRAWN" ? "primary" : "inherit"}
                        onClick={() => setFormData({ ...formData, signatureStyle: "DRAWN" })}
                      >
                        Digital Draw Pad
                      </AppButton>
                      <AppButton
                        type="button"
                        size="small"
                        variant="soft"
                        color={formData.signatureStyle === "SCRIPT" ? "primary" : "inherit"}
                        onClick={() => setFormData({ ...formData, signatureStyle: "SCRIPT" })}
                      >
                        Script Signature
                      </AppButton>
                    </Stack>
                  </Stack>

                  {formData.signatureStyle === "IMAGE" && (
                    <Stack spacing={1.5}>
                      <Box
                        sx={{
                          border: "2px dashed",
                          borderColor: "divider",
                          borderRadius: 2,
                          p: 3,
                          textAlign: "center",
                          bgcolor: "background.paper",
                        }}
                      >
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }}>
                          Upload signature image (PNG, JPG, or SVG)
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                          Recommended: Transparent background PNG, ~300×100 px, high resolution
                        </Typography>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="mt-3 block mx-auto text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                        />
                      </Box>

                      {formData.signatureUrl && (
                        <Stack
                          direction="row"
                          spacing={2}
                          sx={{
                            p: 1.5,
                            bgcolor: "background.paper",
                            borderRadius: 1.5,
                            border: 1,
                            borderColor: "divider",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                              Preview:
                            </Typography>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={formData.signatureUrl}
                              alt="Signature Preview"
                              className="h-10 object-contain bg-slate-50 px-2 rounded border border-slate-100"
                            />
                          </Stack>
                          <AppButton
                            type="button"
                            variant="link"
                            color="error"
                            size="small"
                            onClick={() => setFormData({ ...formData, signatureUrl: "" })}
                          >
                            Remove
                          </AppButton>
                        </Stack>
                      )}
                    </Stack>
                  )}

                  {formData.signatureStyle === "DRAWN" && (
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Draw signature directly using mouse or touchscreen:
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                          <Typography variant="caption" color="text.secondary">
                            Color:
                          </Typography>
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
                          <AppButton type="button" variant="link" color="error" size="small" onClick={clearCanvas}>
                            Clear
                          </AppButton>
                        </Stack>
                      </Stack>

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
                      <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
                        Stroke will automatically be captured and converted to high-definition vector asset.
                      </Typography>
                    </Stack>
                  )}

                  {formData.signatureStyle === "SCRIPT" && (
                    <Stack spacing={1.5}>
                      <Typography variant="caption" color="text.secondary">
                        Select a handwritten calligraphic script rendered from the signatory&apos;s name:
                      </Typography>
                      <Box
                        sx={{
                          display: "grid",
                          gap: 1,
                          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                        }}
                      >
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
                      </Box>
                    </Stack>
                  )}
                </Stack>
              </Box>

              {/* Official Seal / Stamp */}
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: "secondary.lighter", border: 1, borderColor: "secondary.light" }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={formData.hasSeal}
                          onChange={(e) => setFormData({ ...formData, hasSeal: e.target.checked })}
                        />
                      }
                      label={
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                          <Stamp className="w-3.5 h-3.5 text-purple-700" />
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Include Official Seal / Institutional Stamp
                          </Typography>
                        </Stack>
                      }
                    />
                    <Typography variant="caption" color="secondary.main" sx={{ fontWeight: 600 }}>
                      Digital Watermark
                    </Typography>
                  </Stack>

                  {formData.hasSeal && (
                    <AppTextField
                      label="Seal Legend Text"
                      value={formData.sealText}
                      onChange={(e) => setFormData({ ...formData, sealText: e.target.value })}
                      placeholder="e.g. OFFICE OF THE PRINCIPAL / DHAKA IDEAL MODEL"
                      slotProps={{ input: { sx: { fontFamily: "monospace", textTransform: "uppercase" } } }}
                    />
                  )}
                </Stack>
              </Box>

              {/* Document Applicability Matrix */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Applicable Documents (Select where this signature appears):
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
                  }}
                >
                  {[
                    { key: "marksheet", label: "Marksheet & Transcript" },
                    { key: "tabulation", label: "Tabulation Sheet" },
                    { key: "admitCard", label: "Exam Admit Card" },
                    { key: "seatPlan", label: "Seat Plan / Hall Ticket" },
                    { key: "idCard", label: "Student ID Card" },
                    { key: "certificate", label: "Testimonial & Certificate" },
                    { key: "feeReceipt", label: "Fee & Money Receipt" },
                  ].map((doc) => (
                    <FormControlLabel
                      key={doc.key}
                      sx={{
                        m: 0,
                        px: 1.25,
                        py: 0.75,
                        borderRadius: 1.5,
                        border: 1,
                        borderColor: "divider",
                        bgcolor: "grey.50",
                      }}
                      control={
                        <Checkbox
                          size="small"
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
                        />
                      }
                      label={<Typography variant="caption" sx={{ fontWeight: 600 }}>{doc.label}</Typography>}
                    />
                  ))}
                </Box>
              </Box>

              <SettingsFilterGrid columns={2}>
                <AppTextField
                  label="Display Order"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 1 })}
                  slotProps={{ htmlInput: { min: 1, max: 20 } }}
                />
                <AppSelect
                  label="Signature Status"
                  value={formData.isActive ? "ACTIVE" : "INACTIVE"}
                  onChange={(value) => setFormData({ ...formData, isActive: value === "ACTIVE" })}
                  options={[
                    { value: "ACTIVE", label: "ACTIVE (Printed on documents)" },
                    { value: "INACTIVE", label: "INACTIVE (Hidden)" },
                  ]}
                />
              </SettingsFilterGrid>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <AppButton
              type="button"
              variant="ghost"
              color="inherit"
              size="small"
              onClick={() => setShowEditorModal(false)}
            >
              Cancel
            </AppButton>
            <AppButton type="submit" variant="contained" color="primary" size="small">
              Save Institutional Signatory
            </AppButton>
          </DialogActions>
        </Box>
      </Dialog>

      {/* =========================================================================
          MODAL 2: DOCUMENT PRINT MOCKUP PREVIEW
      ========================================================================= */}
      <Dialog
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        maxWidth="lg"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <FileText className="w-5 h-5 text-cyan-600" />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Document Print Mockup: Signatures in Action
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Live simulation of official NCTB Marksheet & Tabulation Sheet signature footers
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: "grey.50", px: { xs: 2, sm: 3 } }}>
          <Stack spacing={3} sx={{ py: 1 }}>
            {/* Marksheet Simulation */}
            <Box sx={{ bgcolor: "background.paper", p: 3, borderRadius: 2, border: 1, borderColor: "divider" }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", pb: 1.5, borderBottom: 1, borderColor: "divider" }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Award className="w-4 h-4 text-emerald-600" />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      NCTB Student Academic Marksheet Footer
                    </Typography>
                  </Stack>
                  <Chip size="small" label="Official Transcript Format" color="success" variant="outlined" sx={{ height: 22, fontWeight: 700 }} />
                </Stack>

                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                  The signatures below automatically render on every generated marksheet PDF and print layout:
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gap: 3,
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                    pt: 2,
                    textAlign: "center",
                  }}
                >
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
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
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
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
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
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
                  </Box>
                </Box>
              </Stack>
            </Box>

            {/* Tabulation Sheet Simulation */}
            <Box sx={{ bgcolor: "background.paper", p: 3, borderRadius: 2, border: 1, borderColor: "divider" }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", pb: 1.5, borderBottom: 1, borderColor: "divider" }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Layers className="w-4 h-4 text-blue-600" />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      NCTB Comprehensive Tabulation Book (Gazette) Footer
                    </Typography>
                  </Stack>
                  <Chip size="small" label="4-Authority Gazette" color="info" variant="outlined" sx={{ height: 22, fontWeight: 700 }} />
                </Stack>

                <Box
                  sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, minmax(0, 1fr))" },
                    pt: 1,
                    textAlign: "center",
                  }}
                >
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
                </Box>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <AppButton
            onClick={() => setShowPreviewModal(false)}
            variant="contained"
            color="primary"
            size="small"
          >
            Close Preview
          </AppButton>
        </DialogActions>
      </Dialog>
    </SettingsPageShell>
  );
}

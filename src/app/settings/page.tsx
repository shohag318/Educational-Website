"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Settings,
  GraduationCap,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  UserCheck,
  Award,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Save,
  Check,
  Eye,
  Sliders,
  Layers,
  ArrowRight,
  FileSignature,
} from "lucide-react";
import {
  SchoolBasicInfo,
  DEFAULT_SCHOOL_INFO,
  getStoredSchoolInfo,
  saveStoredSchoolInfo,
  resetSchoolInfoToDefault,
} from "@/lib/settingsStore";
import { SettingNavHeader } from "./SettingNavHeader";

export default function SettingModulePage() {
  const [formData, setFormData] = useState<SchoolBasicInfo>(DEFAULT_SCHOOL_INFO);
  const [activeTab, setActiveTab] = useState<
    "basic" | "session" | "contact" | "leadership" | "preview"
  >("basic");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData(getStoredSchoolInfo());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleChange = (field: keyof SchoolBasicInfo, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveStoredSchoolInfo(formData);
    setHasChanges(false);
    showToast("School/College basic information successfully saved and synced across dashboard!");
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all school settings to NCTB Standard default?")) {
      const reset = resetSchoolInfoToDefault();
      setFormData(reset);
      setHasChanges(false);
      showToast("Reset to NCTB Standard default settings.");
    }
  };

  const toggleShift = (shiftName: string) => {
    const current = formData.shifts || [];
    const exists = current.includes(shiftName);
    const updated = exists ? current.filter((s) => s !== shiftName) : [...current, shiftName];
    handleChange("shifts", updated);
  };

  const toggleWeekend = (dayName: string) => {
    const current = formData.weekendDays || [];
    const exists = current.includes(dayName);
    const updated = exists ? current.filter((d) => d !== dayName) : [...current, dayName];
    handleChange("weekendDays", updated);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Setting Module Segmented Navigation */}
      <SettingNavHeader />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-500/40 flex items-center space-x-3 transition-all animate-bounce">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-widest font-semibold text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-md border border-indigo-800 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Settings
            </span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono px-2 py-0.5 rounded">
              EIIN: {formData.eiin}
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-2.5">
            Institution Profile & Settings
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Manage your institution details, academic defaults, contact information, and signatures.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20"
          >
            <Save className="w-4 h-4" />
            <span>{hasChanges ? "Save Changes *" : "Save Settings"}</span>
          </button>
        </div>
      </div>


      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex flex-wrap gap-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("basic")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg transition border-b-2 ${
            activeTab === "basic"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>General Info</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("session")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg transition border-b-2 ${
            activeTab === "session"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Session & Defaults</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("contact")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg transition border-b-2 ${
            activeTab === "contact"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>Contact Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("leadership")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg transition border-b-2 ${
            activeTab === "leadership"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>Signatures</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg transition border-b-2 ${
            activeTab === "preview"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Eye className="w-4 h-4 text-indigo-600" />
          <span>Preview</span>
        </button>
      </div>

      {/* Main Form Body */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* ========================================================
            TAB 1: INSTITUTION IDENTITY & EIIN
        ======================================================== */}
        {activeTab === "basic" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>Institution Identity</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official institution names, EIIN code, and Board affiliation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>School / College Official Name (English) *</span>
                  <span className="text-[10px] text-slate-400">Used in official reports & header</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-semibold text-slate-800 text-sm"
                  placeholder="e.g. Dhaka Ideal Model High School & College"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-semibold text-slate-700">
                  School / College Name in Bengali (বাংলা নাম)
                </label>
                <input
                  type="text"
                  value={formData.nameBn}
                  onChange={(e) => handleChange("nameBn", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800"
                  placeholder="যেমন: ঢাকা আইডিয়াল মডেল হাই স্কুল অ্যান্ড কলেজ"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 flex items-center space-x-1">
                  <span>EIIN (Institute ID Number) *</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                    6 Digits
                  </span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={formData.eiin}
                  onChange={(e) => handleChange("eiin", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono font-bold text-slate-900"
                  placeholder="108254"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Institute Type / Category</label>
                <select
                  value={formData.instituteType}
                  onChange={(e) => handleChange("instituteType", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white text-slate-800 font-medium"
                >
                  <option value="SCHOOL_AND_COLLEGE">School & College (Class 6 - 12)</option>
                  <option value="HIGH_SCHOOL">Secondary High School (Class 6 - 10)</option>
                  <option value="COLLEGE">Higher Secondary College (Class 11 - 12)</option>
                  <option value="MADRASAH">Madrasah (Dakhil & Alim)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Education Board (BISE)</label>
                <select
                  value={formData.board}
                  onChange={(e) => handleChange("board", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white text-slate-800 font-medium"
                >
                  <option value="Dhaka">Board of Intermediate and Secondary Education, Dhaka</option>
                  <option value="Chattogram">Board of Intermediate and Secondary Education, Chattogram</option>
                  <option value="Rajshahi">Board of Intermediate and Secondary Education, Rajshahi</option>
                  <option value="Barishal">Board of Intermediate and Secondary Education, Barishal</option>
                  <option value="Sylhet">Board of Intermediate and Secondary Education, Sylhet</option>
                  <option value="Cumilla">Board of Intermediate and Secondary Education, Cumilla</option>
                  <option value="Dinajpur">Board of Intermediate and Secondary Education, Dinajpur</option>
                  <option value="Mymensingh">Board of Intermediate and Secondary Education, Mymensingh</option>
                  <option value="Madrasah">Bangladesh Madrasah Education Board</option>
                  <option value="Technical">Bangladesh Technical Education Board (BTEB)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Establishment Year (ESTD)</label>
                <input
                  type="text"
                  value={formData.establishedYear}
                  onChange={(e) => handleChange("establishedYear", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800"
                  placeholder="e.g. 1994"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Institution Code</label>
                <input
                  type="text"
                  value={formData.institutionCode}
                  onChange={(e) => handleChange("institutionCode", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono text-slate-800"
                  placeholder="e.g. DIMHSC-1082"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Board Center Code</label>
                <input
                  type="text"
                  value={formData.centerCode}
                  onChange={(e) => handleChange("centerCode", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono text-slate-800"
                  placeholder="e.g. 304"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-semibold text-slate-700">Motto / Educational Slogan</label>
                <input
                  type="text"
                  value={formData.motto}
                  onChange={(e) => handleChange("motto", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800"
                  placeholder="e.g. Excellence in Education, Character, and Discipline"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: ACADEMIC SESSION & DEFAULTS
        ======================================================== */}
        {activeTab === "session" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>Session & Defaults</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set active academic year, evaluation terms, medium, and shifts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Current Active Academic Year *</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                    Displayed in Top Navbar
                  </span>
                </label>
                <select
                  value={formData.academicYear}
                  onChange={(e) => handleChange("academicYear", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white text-slate-900 font-bold text-sm"
                >
                  <option value="2027">2027</option>
                  <option value="2026">2026 (Current Session)</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Active Examination / Evaluation Term</label>
                <select
                  value={formData.activeTerm}
                  onChange={(e) => handleChange("activeTerm", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white text-slate-800 font-medium"
                >
                  <option value="Annual Examination">Annual Examination</option>
                  <option value="Half-Yearly Examination">Half-Yearly Examination</option>
                  <option value="Pre-Test Examination">Pre-Test Examination</option>
                  <option value="Test Examination">Test Examination (SSC / HSC Final Selection)</option>
                  <option value="1st Terminal Evaluation">1st Terminal Evaluation</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Curriculum Medium / Version</label>
                <select
                  value={formData.medium}
                  onChange={(e) => handleChange("medium", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white text-slate-800 font-medium"
                >
                  <option value="BOTH">Dual Medium (Bangla Medium & English Version)</option>
                  <option value="BANGLA">Bangla Medium Only</option>
                  <option value="ENGLISH">English Version Only</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Class Range</label>
                <input
                  type="text"
                  value={formData.classRange}
                  onChange={(e) => handleChange("classRange", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800"
                  placeholder="e.g. Class 6 to Class 12"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="font-semibold text-slate-700 block">Operating Shifts</label>
                <div className="flex flex-wrap gap-3">
                  {["Morning", "Day", "Evening"].map((shift) => {
                    const isSelected = formData.shifts?.includes(shift);
                    return (
                      <button
                        key={shift}
                        type="button"
                        onClick={() => toggleShift(shift)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition ${
                          isSelected
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isSelected ? "bg-emerald-600" : "bg-slate-300"
                          }`}
                        ></span>
                        <span>{shift} Shift</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="font-semibold text-slate-700 block">Weekly Weekend Days</label>
                <div className="flex flex-wrap gap-2.5">
                  {["Friday", "Saturday", "Sunday"].map((day) => {
                    const isWeekend = formData.weekendDays?.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWeekend(day)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                          isWeekend
                            ? "bg-indigo-50 text-indigo-800 border-indigo-300"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: CAMPUS CONTACT & LOCATION
        ======================================================== */}
        {activeTab === "contact" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>Campus Location & Contacts</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Address, contact hotline, email, and website displayed on marksheets and report headers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-semibold text-slate-700">Campus Address (Street / Road / Block)</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800"
                  placeholder="e.g. Road 4, Block D, Section 10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Thana / Upazila</label>
                <input
                  type="text"
                  value={formData.thana}
                  onChange={(e) => handleChange("thana", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800"
                  placeholder="e.g. Mirpur"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">District / Zilla</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => handleChange("district", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800"
                  placeholder="e.g. Dhaka"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Administrative Division</label>
                <select
                  value={formData.division}
                  onChange={(e) => handleChange("division", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white text-slate-800 font-medium"
                >
                  <option value="Dhaka">Dhaka Division</option>
                  <option value="Chattogram">Chattogram Division</option>
                  <option value="Rajshahi">Rajshahi Division</option>
                  <option value="Khulna">Khulna Division</option>
                  <option value="Barishal">Barishal Division</option>
                  <option value="Sylhet">Sylhet Division</option>
                  <option value="Rangpur">Rangpur Division</option>
                  <option value="Mymensingh">Mymensingh Division</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Postal / Zip Code</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono text-slate-800"
                  placeholder="e.g. 1216"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Official Landline Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800"
                  placeholder="e.g. +880 2-9001234"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Official SMS / Mobile Hotline</label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => handleChange("mobile", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800 font-mono"
                  placeholder="e.g. +880 1712-345678"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Official Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800"
                  placeholder="info@dhakaideal.edu.bd"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Institutional Website</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800"
                  placeholder="https://www.dhakaideal.edu.bd"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: ADMINISTRATION & SIGNATURES
        ======================================================== */}
        {activeTab === "leadership" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <span>Administration & Signatures</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official designations appearing on printed report cards and tabulation sheets.
              </p>
            </div>

            {/* Quick banner to Advanced Signature Setup */}
            <div className="p-4 rounded-xl bg-cyan-50/80 border border-cyan-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-600 text-white flex items-center justify-center shrink-0">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-cyan-950">Institutional Signature Setup</h4>
                  <p className="text-[11px] text-cyan-800">
                    Upload handwritten signatures, use digital draw pad, or manage official seals across all report cards.
                  </p>
                </div>
              </div>
              <Link
                href="/settings/signatures"
                className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-xs whitespace-nowrap self-start sm:self-auto transition-colors"
              >
                Open Signature Setup →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Head of Institution Title</label>
                <select
                  value={formData.headTitle}
                  onChange={(e: any) => handleChange("headTitle", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white text-slate-800 font-medium"
                >
                  <option value="Principal">Principal (অধ্যক্ষ)</option>
                  <option value="Headmaster">Headmaster (প্রধান শিক্ষক)</option>
                  <option value="Headmistress">Headmistress (প্রধান শিক্ষিকা)</option>
                  <option value="Superintendent">Superintendent (সুপারিনটেনডেন্ট)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Head of Institution Full Name</label>
                <input
                  type="text"
                  value={formData.headName}
                  onChange={(e) => handleChange("headName", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 font-bold"
                  placeholder="e.g. Prof. A. K. M. Shamsuddin"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Head's Direct Phone / Mobile</label>
                <input
                  type="text"
                  value={formData.headPhone || ""}
                  onChange={(e) => handleChange("headPhone", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800"
                  placeholder="+880 1711-223344"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Head's Official Email</label>
                <input
                  type="email"
                  value={formData.headEmail || ""}
                  onChange={(e) => handleChange("headEmail", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800"
                  placeholder="principal@dhakaideal.edu.bd"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">
                  Examination Authority / Convener Title
                </label>
                <input
                  type="text"
                  value={formData.controllerTitle}
                  onChange={(e) => handleChange("controllerTitle", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800 font-medium"
                  placeholder="e.g. Exam Controller & Vice Principal"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">
                  Examination Authority Full Name
                </label>
                <input
                  type="text"
                  value={formData.controllerName}
                  onChange={(e) => handleChange("controllerName", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 font-bold"
                  placeholder="e.g. Mohammad Jahangir Hossain"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: LIVE PREVIEW
        ======================================================== */}
        {activeTab === "preview" && (
          <div className="space-y-6">
            {/* Live Header Navbar Simulation */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span>Dashboard Navbar Preview</span>
                </span>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 font-semibold px-2 py-0.5 rounded">
                  Synchronized
                </span>
              </div>
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-800 font-mono">
                    EIIN: {formData.eiin}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {formData.name}
                    </h4>
                    {formData.nameBn && (
                      <p className="text-[11px] text-slate-500">{formData.nameBn}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>
                    Academic Year: <strong>{formData.academicYear}</strong>
                  </span>
                  <span>•</span>
                  <span>{formData.activeTerm}</span>
                </div>
              </div>
            </div>

            {/* Live Marksheet / Transcript Header Simulation */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Marksheet Header Preview</span>
              </span>
              <div className="border-2 border-slate-300 rounded-xl p-6 bg-white text-center space-y-1.5">
                <h3 className="text-lg font-black uppercase text-slate-900 tracking-wide">
                  {formData.name}
                </h3>
                {formData.nameBn && (
                  <p className="text-xs text-slate-600 font-semibold">{formData.nameBn}</p>
                )}
                <p className="text-xs text-slate-600">
                  {formData.address}, {formData.thana}, {formData.district} - {formData.postalCode} • EIIN:{" "}
                  <strong className="font-mono">{formData.eiin}</strong>
                </p>
                <div className="inline-block bg-slate-900 text-white text-[11px] font-bold px-3 py-0.5 rounded tracking-wider uppercase mt-1">
                  Academic Transcript / Progress Report Card
                </div>
                <p className="text-xs font-bold text-slate-800 pt-1">
                  {formData.activeTerm} • Academic Session: {formData.academicYear}
                </p>
                <div className="pt-6 grid grid-cols-2 text-left text-xs border-t border-slate-200 mt-4">
                  <div>
                    <p className="text-[10px] text-slate-400">Exam Controller / Convener</p>
                    <p className="font-bold text-slate-800">{formData.controllerName}</p>
                    <p className="text-[11px] text-slate-500">{formData.controllerTitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">{formData.headTitle}</p>
                    <p className="font-bold text-slate-800">{formData.headName}</p>
                    <p className="text-[11px] text-slate-500">{formData.headTitle}, {formData.name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            {hasChanges ? (
              <span className="text-amber-600 font-medium flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                <span>Unsaved changes in basic information</span>
              </span>
            ) : (
              <span className="text-slate-400">Settings are up to date and saved</span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Reset to Default
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm shadow-emerald-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Save & Apply All Changes</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

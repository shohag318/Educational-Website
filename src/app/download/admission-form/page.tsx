"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Printer,
  FileText,
  Download,
  School,
  Building2,
  Calendar,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Check,
  Settings,
  Scissors,
  Phone,
  Mail,
  MapPin,
  RotateCcw,
  BookOpen,
  GraduationCap,
  Users,
} from "lucide-react";
import { DownloadNavHeader } from "../DownloadNavHeader";
import { SessionSelect } from "@/components/SessionSelect";
import {
  SchoolBasicInfo,
  DEFAULT_SCHOOL_INFO,
  getStoredSchoolInfo,
  SETTINGS_UPDATED_EVENT,
} from "@/lib/settingsStore";

type FormCategory = "school" | "college" | "primary" | "universal";
type FormLayout = "single" | "two_page";
type FormLanguage = "bilingual" | "english";

export default function StudentAdmissionBlankFormPage() {
  const [schoolInfo, setSchoolInfo] = useState<SchoolBasicInfo>(DEFAULT_SCHOOL_INFO);
  const [formCategory, setFormCategory] = useState<FormCategory>("school");
  const [formLayout, setFormLayout] = useState<FormLayout>("single");
  const [formLanguage, setFormLanguage] = useState<FormLanguage>("bilingual");
  const [academicSession, setAcademicSession] = useState("2026-2027");
  const [selectedClass, setSelectedClass] = useState<string>("BLANK");
  const [formSerialPrefix, setFormSerialPrefix] = useState<string>("ADM-2026-");
  const [showCounterfoil, setShowCounterfoil] = useState<boolean>(true);
  const [showWatermark, setShowWatermark] = useState<boolean>(false);
  const [isSampleFilled, setIsSampleFilled] = useState<boolean>(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const current = getStoredSchoolInfo();
    setSchoolInfo(current);
    if (current.academicYear) {
      setAcademicSession(`${current.academicYear}-${parseInt(current.academicYear) + 1}`);
    }

    const handleUpdate = () => {
      setSchoolInfo(getStoredSchoolInfo());
    };

    window.addEventListener(SETTINGS_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Sample data for previewing how the form looks when filled
  const sampleData = {
    formNo: "ADM-2026-0142",
    classApplied: selectedClass !== "BLANK" ? selectedClass : "Class 6",
    shift: "Morning",
    version: "Bangla Medium",
    group: "General",
    studentNameEn: "TANVIR AHMED CHOWDHURY",
    studentNameBn: "তানভীর আহমেদ চৌধুরী",
    birthRegNo: "20122692015012345",
    dobDay: "14",
    dobMonth: "04",
    dobYear: "2012",
    ageY: "13",
    ageM: "08",
    ageD: "17",
    gender: "Male",
    bloodGroup: "B+",
    religion: "Islam",
    nationality: "Bangladeshi",
    quota: "General",
    fatherNameEn: "MOHAMMAD RAFIQUL ISLAM CHOWDHURY",
    fatherNameBn: "মোহাম্মদ রফিকুল ইসলাম চৌধুরী",
    fatherNid: "19822692015098765",
    fatherOccupation: "Govt. Officer",
    fatherIncome: "65,000",
    fatherMobile: "01712-345678",
    motherNameEn: "FARZANA AKTER CHOWDHURY",
    motherNameBn: "ফারজানা আক্তার চৌধুরী",
    motherNid: "19862692015045678",
    motherOccupation: "Teacher",
    motherIncome: "45,000",
    motherMobile: "01819-876543",
    guardianName: "Md. Rafiqul Islam",
    guardianRelation: "Father",
    guardianMobile: "01712-345678",
    presentAddress: "House 24, Road 5, Block C, Section 10",
    presentPost: "Mirpur-10",
    presentThana: "Mirpur",
    presentDistrict: "Dhaka",
    permanentAddress: "Village: Rampur, Post: Joydebpur",
    permanentPost: "Joydebpur",
    permanentThana: "Gazipur Sadar",
    permanentDistrict: "Gazipur",
    prevSchool: "Mirpur Model Govt. Primary School",
    lastClassPassed: "Class 5",
    passingYear: "2025",
    prevRoll: "05",
    prevGpa: "5.00",
    prevBoard: "Dhaka",
    tcNo: "TC-2025/892",
    tcDate: "28/12/2025",
  };

  const isBilingual = formLanguage === "bilingual";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/40 flex items-center space-x-3 transition-all animate-bounce no-print">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation for Download Module */}
      <DownloadNavHeader />

      {/* Hero Header Banner (no-print) */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-slate-800 no-print">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-700/60 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Download Module
            </span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono px-2 py-0.5 rounded">
              EIIN: {schoolInfo.eiin || "108254"}
            </span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
              Session: {academicSession}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            Student Admission Blank Form (ছাত্র/ছাত্রী ভর্তি ফরম)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Official printable admission blank form compliant with Bangladesh National Curriculum &
            Textbook Board (NCTB) and Directorate of Secondary and Higher Education (DSHE)
            standards. Equipped with 17-digit BRN boxes, parent details, quota, counterfoil admit
            slip, and 1-click A4 print.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20 cursor-pointer"
            title="1-Click Print A4 Blank Admission Form"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>Print Form (Ctrl+P)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSampleFilled(!isSampleFilled);
              showToast(
                !isSampleFilled
                  ? "Sample filled preview activated (for inspection)"
                  : "Switched back to Blank Form for printing"
              );
            }}
            className={`flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              isSampleFilled
                ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700"
            }`}
            title="Toggle between Blank Form and Sample Filled Form"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isSampleFilled ? "Viewing Filled Sample" : "Sample Preview"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGuidelinesModal(true)}
            className="flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="View Required Admission Documents & Guidelines"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>Checklist & Rules</span>
          </button>
        </div>
      </div>

      {/* ==============================================================
          INTERACTIVE CONTROLS TOOLBAR (no-print)
      ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4 no-print">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Form Customization & Print Controls
            </h2>
          </div>
          <Link
            href="/settings"
            className="text-xs text-slate-500 hover:text-emerald-700 font-medium flex items-center space-x-1"
            title="Edit School Name, Logo & EIIN in Settings"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Edit School Header Info</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Control 1: Academic Session */}
          <div>
            <SessionSelect
              value={academicSession}
              onChange={(val) => {
                if (val && val !== "ALL") {
                  setAcademicSession(val);
                }
              }}
              label="Academic Session"
              labelClassName="block text-xs font-semibold text-slate-700 mb-1"
              selectClassName="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Control 2: Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Institution Category
            </label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as FormCategory)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="school">High School (Class 6 - 10 / 1 - 10)</option>
              <option value="college">College / Higher Secondary (Class 11 - 12)</option>
              <option value="primary">Primary Section (Play - Class 5)</option>
              <option value="universal">Universal School & College (All Classes)</option>
            </select>
          </div>

          {/* Control 2: Layout Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Form Layout Mode
            </label>
            <select
              value={formLayout}
              onChange={(e) => setFormLayout(e.target.value as FormLayout)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="single">Single Page Compact (with Student Slip)</option>
              <option value="two_page">Two-Page Detailed (Full Subject & Rules)</option>
            </select>
          </div>

          {/* Control 3: Language Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Language Format
            </label>
            <select
              value={formLanguage}
              onChange={(e) => setFormLanguage(e.target.value as FormLanguage)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="bilingual">Bilingual (English + বাংলা) - Official Standard</option>
              <option value="english">English Only</option>
            </select>
          </div>

          {/* Control 4: Pre-selected Class or Blank */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Admission Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="BLANK">-- Blank Line (For Any Class) --</option>
              <option value="Play">Play</option>
              <option value="Nursery">Nursery</option>
              <option value="KG">KG</option>
              <option value="Class 1">Class 1</option>
              <option value="Class 2">Class 2</option>
              <option value="Class 3">Class 3</option>
              <option value="Class 4">Class 4</option>
              <option value="Class 5">Class 5</option>
              <option value="Class 6">Class 6</option>
              <option value="Class 7">Class 7</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11 (XI)">Class 11 (HSC 1st Year)</option>
              <option value="Class 12 (XII)">Class 12 (HSC 2nd Year)</option>
            </select>
          </div>
        </div>

        {/* Row 2 Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Academic Session Year
            </label>
            <input
              type="text"
              value={academicSession}
              onChange={(e) => setAcademicSession(e.target.value)}
              placeholder="e.g. 2026 or 2026-2027"
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Form Serial Prefix / Number
            </label>
            <input
              type="text"
              value={formSerialPrefix}
              onChange={(e) => setFormSerialPrefix(e.target.value)}
              placeholder="e.g. ADM-2026- or leave blank"
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showCounterfoil}
                onChange={(e) => setShowCounterfoil(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span>Tear-off Student Counterfoil Slip</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showWatermark}
                onChange={(e) => setShowWatermark(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span>Show Official Seal Stamp</span>
            </label>
          </div>
        </div>
      </div>

      {/* ==============================================================
          PRINTABLE DOCUMENT VIEWER (Screen preview & @media print)
      ============================================================== */}
      <div className="bg-slate-200/70 p-2 sm:p-6 rounded-2xl flex justify-center overflow-x-auto">
        {/* Printable Sheet (Standard A4 Page) */}
        <div
          id="admission-form-sheet"
          className={`print-sheet bg-white text-slate-900 shadow-2xl border border-slate-300 w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-8 font-sans relative ${
            formLayout === "two_page" ? "space-y-12" : ""
          }`}
          style={{ boxSizing: "border-box" }}
        >
          {/* ==========================================================
              PAGE 1: MAIN ADMISSION FORM
          ========================================================== */}
          <div className="relative">
            {/* Watermark / Seal (optional) */}
            {showWatermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0 select-none">
                <div className="w-96 h-96 rounded-full border-[12px] border-emerald-900 flex items-center justify-center font-bold text-6xl tracking-widest uppercase rotate-[-25deg]">
                  {schoolInfo.eiin || "SMART ACADEMY"}
                </div>
              </div>
            )}

            {/* HEADER SECTION */}
            <div className="border-b-2 border-slate-900 pb-2 text-center relative">
              <div className="flex items-center justify-between">
                {/* Left Logo / Monogram placeholder */}
                <div className="w-16 h-16 rounded-full border-2 border-slate-800 flex items-center justify-center shrink-0 p-1 bg-slate-50">
                  <GraduationCap className="w-9 h-9 text-slate-800" />
                </div>

                {/* Center Institution Info */}
                <div className="flex-1 px-2 text-center">
                  <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900 leading-tight">
                    {schoolInfo.name || "DHAKA IDEAL MODEL HIGH SCHOOL & COLLEGE"}
                  </h1>
                  {isBilingual && schoolInfo.nameBn && (
                    <h2 className="text-sm sm:text-base font-bold text-slate-800 leading-tight mt-0.5">
                      {schoolInfo.nameBn}
                    </h2>
                  )}

                  {/* Accreditations & Codes */}
                  <div className="flex items-center justify-center flex-wrap gap-x-3 text-[11px] font-semibold text-slate-700 mt-1">
                    <span>
                      EIIN: <strong className="font-mono">{schoolInfo.eiin || "108254"}</strong>
                    </span>
                    <span>•</span>
                    <span>Board: {schoolInfo.board || "Dhaka"}</span>
                    {schoolInfo.institutionCode && (
                      <>
                        <span>•</span>
                        <span>Code: {schoolInfo.institutionCode}</span>
                      </>
                    )}
                    {schoolInfo.establishedYear && (
                      <>
                        <span>•</span>
                        <span>Est: {schoolInfo.establishedYear}</span>
                      </>
                    )}
                  </div>

                  {/* Location & Contact */}
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {schoolInfo.address || "Mirpur-10"}
                    {schoolInfo.thana ? `, ${schoolInfo.thana}` : ""}
                    {schoolInfo.district ? `, ${schoolInfo.district}` : ""}
                    {schoolInfo.phone ? ` • Phone: ${schoolInfo.phone}` : ""}
                    {schoolInfo.mobile ? ` • Mobile: ${schoolInfo.mobile}` : ""}
                    {schoolInfo.email ? ` • Email: ${schoolInfo.email}` : ""}
                  </p>
                </div>

                {/* Right Form Identification Box */}
                <div className="w-20 shrink-0 text-right text-[10px] text-slate-600 space-y-0.5">
                  <div className="border border-slate-800 p-1 rounded text-center">
                    <span className="block font-bold text-[9px] uppercase">Form Copy</span>
                    <span className="text-[10px] font-mono font-bold">OFFICE</span>
                  </div>
                </div>
              </div>

              {/* FORM TITLE BADGE */}
              <div className="mt-2.5 inline-block bg-slate-900 text-white px-5 py-1 rounded-sm font-bold text-xs uppercase tracking-wider">
                {isBilingual ? "Student Admission Form • শিক্ষার্থী ভর্তি ফরম" : "Student Admission Application Form"}
              </div>

              <div className="text-[11px] font-bold text-slate-800 mt-1">
                {isBilingual ? "Academic Session / শিক্ষাবর্ষ : " : "Academic Session : "}
                <span className="font-mono underline underline-offset-2">{academicSession}</span>
              </div>
            </div>

            {/* TOP METADATA & PASSPORT PHOTO ROW */}
            <div className="mt-3 flex items-start justify-between gap-4 border border-slate-800 p-2.5 bg-slate-50/50">
              {/* Left Column: Form Serial, Class & Shift Applied */}
              <div className="flex-1 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    {isBilingual ? "Form Sl No. / ফরম নং :" : "Form Sl No. :"}
                  </span>
                  <span className="font-mono font-bold text-slate-900 underline underline-offset-4 decoration-dotted">
                    {isSampleFilled ? sampleData.formNo : (formSerialPrefix ? `${formSerialPrefix}________` : "____________________")}
                  </span>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">
                      {isBilingual ? "Class / শ্রেণি :" : "Class Applied :"}
                    </span>
                    <span className="font-semibold underline decoration-dotted">
                      {isSampleFilled
                        ? sampleData.classApplied
                        : selectedClass !== "BLANK"
                        ? selectedClass
                        : "________________"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {isBilingual ? "Shift / শিফট :" : "Shift :"}
                    </span>
                    <label className="inline-flex items-center gap-1 font-medium">
                      <span className="w-3.5 h-3.5 border border-slate-800 inline-flex items-center justify-center text-[10px] font-bold">
                        {isSampleFilled && sampleData.shift === "Morning" ? "✓" : ""}
                      </span>
                      <span>Morning</span>
                    </label>
                    <label className="inline-flex items-center gap-1 font-medium">
                      <span className="w-3.5 h-3.5 border border-slate-800 inline-flex items-center justify-center text-[10px] font-bold">
                        {isSampleFilled && sampleData.shift === "Day" ? "✓" : ""}
                      </span>
                      <span>Day</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {isBilingual ? "Medium / মাধ্যম :" : "Version :"}
                    </span>
                    <label className="inline-flex items-center gap-1">
                      <span className="w-3.5 h-3.5 border border-slate-800 inline-flex items-center justify-center text-[10px] font-bold">
                        {isSampleFilled ? "✓" : ""}
                      </span>
                      <span>Bangla</span>
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <span className="w-3.5 h-3.5 border border-slate-800 inline-flex items-center justify-center text-[10px] font-bold"></span>
                      <span>English Version</span>
                    </label>
                  </div>

                  {(formCategory === "school" || formCategory === "college" || formCategory === "universal") && (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {isBilingual ? "Group / বিভাগ :" : "Group :"}
                      </span>
                      <label className="inline-flex items-center gap-1">
                        <span className="w-3.5 h-3.5 border border-slate-800 inline-flex items-center justify-center text-[10px] font-bold">
                          {isSampleFilled && sampleData.group === "General" ? "✓" : ""}
                        </span>
                        <span>Gen</span>
                      </label>
                      <label className="inline-flex items-center gap-1">
                        <span className="w-3.5 h-3.5 border border-slate-800 inline-flex items-center justify-center text-[10px] font-bold"></span>
                        <span>Sci</span>
                      </label>
                      <label className="inline-flex items-center gap-1">
                        <span className="w-3.5 h-3.5 border border-slate-800 inline-flex items-center justify-center text-[10px] font-bold"></span>
                        <span>Hum</span>
                      </label>
                      <label className="inline-flex items-center gap-1">
                        <span className="w-3.5 h-3.5 border border-slate-800 inline-flex items-center justify-center text-[10px] font-bold"></span>
                        <span>B.Stud</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: 2 Copies Passport Photo Placeholder */}
              <div className="w-24 h-28 border-2 border-dashed border-slate-700 bg-white flex flex-col items-center justify-center text-center p-1 shrink-0">
                <span className="text-[9px] font-bold uppercase text-slate-700 leading-tight">
                  Recent Passport Size Photo
                </span>
                <span className="text-[8px] text-slate-500 mt-1 leading-tight">
                  {isBilingual ? "(পাসপোর্ট সাইজ ছবি)" : "(35mm x 45mm)"}
                </span>
                <span className="text-[7px] text-slate-400 mt-1">2 Copies</span>
              </div>
            </div>

            {/* ========================================================
                SECTION 1: STUDENT'S PERSONAL PROFILE
            ======================================================== */}
            <div className="mt-3">
              <div className="bg-slate-200 px-2 py-0.5 border border-slate-800 font-bold text-[11px] uppercase tracking-wide flex items-center justify-between">
                <span>
                  {isBilingual ? "1. Student's Information (শিক্ষার্থীর ব্যক্তিগত তথ্য)" : "1. Student's Information"}
                </span>
                <span className="text-[9px] font-normal lowercase italic text-slate-700">
                  Fill in English BLOCK LETTERS
                </span>
              </div>

              <table className="w-full border-collapse border border-slate-800 text-xs">
                <tbody>
                  {/* Student Full Name English */}
                  <tr className="border-b border-slate-800">
                    <td className="w-44 bg-slate-100 p-1.5 font-bold border-r border-slate-800 text-[11px]">
                      {isBilingual ? "Student's Full Name (English) :" : "Student's Full Name :"}
                    </td>
                    <td className="p-1.5 font-mono font-semibold tracking-wide">
                      {isSampleFilled ? sampleData.studentNameEn : "____________________________________________________________________"}
                    </td>
                  </tr>

                  {/* Student Full Name Bangla */}
                  {isBilingual && (
                    <tr className="border-b border-slate-800">
                      <td className="w-44 bg-slate-100 p-1.5 font-bold border-r border-slate-800 text-[11px]">
                        শিক্ষার্থীর পূর্ণ নাম (বাংলায়) :
                      </td>
                      <td className="p-1.5 font-medium">
                        {isSampleFilled ? sampleData.studentNameBn : "____________________________________________________________________"}
                      </td>
                    </tr>
                  )}

                  {/* 17-Digit Online Birth Registration Certificate Number */}
                  <tr className="border-b border-slate-800">
                    <td className="w-44 bg-slate-100 p-1.5 font-bold border-r border-slate-800 text-[11px]">
                      {isBilingual ? "Birth Reg. No (BRN 17-Digit) :" : "Birth Certificate No (17-Digit) :"}
                      <div className="text-[9px] font-normal text-slate-600">অনলাইন জন্ম নিবন্ধন নম্বর</div>
                    </td>
                    <td className="p-1.5">
                      <div className="flex items-center gap-0.5 font-mono text-center">
                        {Array.from({ length: 17 }).map((_, i) => (
                          <span
                            key={i}
                            className="w-5 h-6 border border-slate-700 inline-flex items-center justify-center font-bold text-xs bg-white text-slate-900"
                          >
                            {isSampleFilled ? sampleData.birthRegNo[i] || "" : ""}
                          </span>
                        ))}
                        <span className="text-[10px] text-slate-500 ml-2">(17 Digits)</span>
                      </div>
                    </td>
                  </tr>

                  {/* Date of Birth & Age as of Jan 1 */}
                  <tr className="border-b border-slate-800">
                    <td className="w-44 bg-slate-100 p-1.5 font-bold border-r border-slate-800 text-[11px]">
                      {isBilingual ? "Date of Birth (জন্ম তারিখ) :" : "Date of Birth :"}
                    </td>
                    <td className="p-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-1 font-mono">
                          <span className="font-sans font-medium text-[11px]">D:</span>
                          <span className="w-6 h-5 border border-slate-700 inline-flex items-center justify-center text-xs">
                            {isSampleFilled ? sampleData.dobDay : ""}
                          </span>
                          <span className="font-sans font-medium text-[11px]">M:</span>
                          <span className="w-6 h-5 border border-slate-700 inline-flex items-center justify-center text-xs">
                            {isSampleFilled ? sampleData.dobMonth : ""}
                          </span>
                          <span className="font-sans font-medium text-[11px]">Y:</span>
                          <span className="w-10 h-5 border border-slate-700 inline-flex items-center justify-center text-xs">
                            {isSampleFilled ? sampleData.dobYear : ""}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="font-medium text-slate-700">Age on 1st Jan:</span>
                          <span className="font-mono">
                            {isSampleFilled ? `${sampleData.ageY} Y` : "__ Y"}
                          </span>
                          <span className="font-mono">
                            {isSampleFilled ? `${sampleData.ageM} M` : "__ M"}
                          </span>
                          <span className="font-mono">
                            {isSampleFilled ? `${sampleData.ageD} D` : "__ D"}
                          </span>
                        </div>

                        {/* Gender */}
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">Gender:</span>
                          <label className="inline-flex items-center gap-1">
                            <span className="w-3.5 h-3.5 border border-slate-800 inline-flex items-center justify-center text-[10px] font-bold">
                              {isSampleFilled && sampleData.gender === "Male" ? "✓" : ""}
                            </span>
                            <span>Male</span>
                          </label>
                          <label className="inline-flex items-center gap-1">
                            <span className="w-3.5 h-3.5 border border-slate-800 inline-flex items-center justify-center text-[10px] font-bold">
                              {isSampleFilled && sampleData.gender === "Female" ? "✓" : ""}
                            </span>
                            <span>Female</span>
                          </label>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Blood Group, Religion, Nationality, Quota */}
                  <tr className="border-b border-slate-800">
                    <td className="w-44 bg-slate-100 p-1.5 font-bold border-r border-slate-800 text-[11px]">
                      {isBilingual ? "Personal Demographics :" : "Demographics :"}
                    </td>
                    <td className="p-1.5">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <span className="font-bold text-slate-800">Blood Group: </span>
                          <span className="font-mono font-bold underline">
                            {isSampleFilled ? sampleData.bloodGroup : "_______"}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-800">Religion: </span>
                          <span className="font-medium underline">
                            {isSampleFilled ? sampleData.religion : "_______"}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-800">Nationality: </span>
                          <span className="font-medium">Bangladeshi</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-800">Quota: </span>
                          <span className="font-medium underline">
                            {isSampleFilled ? sampleData.quota : "General / ___"}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ========================================================
                SECTION 2: PARENTS & GUARDIAN INFORMATION
            ======================================================== */}
            <div className="mt-3">
              <div className="bg-slate-200 px-2 py-0.5 border border-slate-800 font-bold text-[11px] uppercase tracking-wide">
                {isBilingual ? "2. Parents & Legal Guardian Details (পিতা, মাতা ও অভিভাবকের তথ্য)" : "2. Parents & Guardian Details"}
              </div>

              <table className="w-full border-collapse border border-slate-800 text-xs">
                <tbody>
                  {/* Father Details */}
                  <tr className="border-b border-slate-800">
                    <td className="w-44 bg-slate-100 p-1.5 font-bold border-r border-slate-800 text-[11px]">
                      {isBilingual ? "Father's Name (পিতার নাম) :" : "Father's Name :"}
                    </td>
                    <td className="p-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-mono font-semibold">
                          {isSampleFilled ? sampleData.fatherNameEn : "Eng: ________________________________________________"}
                        </span>
                        {isBilingual && (
                          <span className="text-[11px]">
                            {isSampleFilled ? `বাংলা: ${sampleData.fatherNameBn}` : "বাংলা: ________________________"}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="w-44 bg-slate-100 p-1.5 font-bold border-r border-slate-800 text-[11px]">
                      Father&apos;s NID & Contact :
                    </td>
                    <td className="p-1.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <span className="font-bold">NID No: </span>
                          <span className="font-mono">
                            {isSampleFilled ? sampleData.fatherNid : "____________________"}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold">Occupation: </span>
                          <span>{isSampleFilled ? sampleData.fatherOccupation : "________________"}</span>
                        </div>
                        <div>
                          <span className="font-bold">Mobile: </span>
                          <span className="font-mono font-bold">
                            {isSampleFilled ? sampleData.fatherMobile : "01_______________"}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Mother Details */}
                  <tr className="border-b border-slate-800">
                    <td className="w-44 bg-slate-100 p-1.5 font-bold border-r border-slate-800 text-[11px]">
                      {isBilingual ? "Mother's Name (মাতার নাম) :" : "Mother's Name :"}
                    </td>
                    <td className="p-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-mono font-semibold">
                          {isSampleFilled ? sampleData.motherNameEn : "Eng: ________________________________________________"}
                        </span>
                        {isBilingual && (
                          <span className="text-[11px]">
                            {isSampleFilled ? `বাংলা: ${sampleData.motherNameBn}` : "বাংলা: ________________________"}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="w-44 bg-slate-100 p-1.5 font-bold border-r border-slate-800 text-[11px]">
                      Mother&apos;s NID & Contact :
                    </td>
                    <td className="p-1.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <span className="font-bold">NID No: </span>
                          <span className="font-mono">
                            {isSampleFilled ? sampleData.motherNid : "____________________"}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold">Occupation: </span>
                          <span>{isSampleFilled ? sampleData.motherOccupation : "________________"}</span>
                        </div>
                        <div>
                          <span className="font-bold">Mobile: </span>
                          <span className="font-mono font-bold">
                            {isSampleFilled ? sampleData.motherMobile : "01_______________"}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Legal Guardian (if other than parents) */}
                  <tr className="border-b border-slate-800">
                    <td className="w-44 bg-slate-100 p-1.5 font-bold border-r border-slate-800 text-[11px]">
                      {isBilingual ? "Legal Guardian (আইনগত অভিভাবক) :" : "Legal Guardian :"}
                    </td>
                    <td className="p-1.5 text-[11px]">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <span className="font-bold">Name: </span>
                          <span>{isSampleFilled ? sampleData.guardianName : "____________________"}</span>
                        </div>
                        <div>
                          <span className="font-bold">Relation: </span>
                          <span>{isSampleFilled ? sampleData.guardianRelation : "________________"}</span>
                        </div>
                        <div>
                          <span className="font-bold">Mobile: </span>
                          <span className="font-mono">
                            {isSampleFilled ? sampleData.guardianMobile : "01_______________"}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ========================================================
                SECTION 3: ADDRESS & CONTACT
            ======================================================== */}
            <div className="mt-3">
              <div className="bg-slate-200 px-2 py-0.5 border border-slate-800 font-bold text-[11px] uppercase tracking-wide">
                {isBilingual ? "3. Residential Address (যোগাযোগ ও ঠিকানা)" : "3. Residential Address"}
              </div>

              <table className="w-full border-collapse border border-slate-800 text-xs">
                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="w-44 bg-slate-100 p-1.5 font-bold border-r border-slate-800 text-[11px]">
                      {isBilingual ? "Present Address (বর্তমান ঠিকানা) :" : "Present Address :"}
                    </td>
                    <td className="p-1.5 text-[11px]">
                      <div className="space-y-0.5">
                        <div>
                          <span>Village / House & Road: </span>
                          <span className="font-medium underline decoration-dotted">
                            {isSampleFilled ? sampleData.presentAddress : "____________________________________________________________"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          <span>
                            Post:{" "}
                            <span className="underline decoration-dotted">
                              {isSampleFilled ? sampleData.presentPost : "____________"}
                            </span>
                          </span>
                          <span>
                            Thana / Upazila:{" "}
                            <span className="underline decoration-dotted">
                              {isSampleFilled ? sampleData.presentThana : "____________"}
                            </span>
                          </span>
                          <span>
                            District:{" "}
                            <span className="underline decoration-dotted">
                              {isSampleFilled ? sampleData.presentDistrict : "____________"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>

                  <tr className="border-b border-slate-800">
                    <td className="w-44 bg-slate-100 p-1.5 font-bold border-r border-slate-800 text-[11px]">
                      {isBilingual ? "Permanent Address (স্থায়ী ঠিকানা) :" : "Permanent Address :"}
                    </td>
                    <td className="p-1.5 text-[11px]">
                      <div className="space-y-0.5">
                        <div>
                          <span>Village / House & Road: </span>
                          <span className="font-medium underline decoration-dotted">
                            {isSampleFilled ? sampleData.permanentAddress : "____________________________________________________________"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          <span>
                            Post:{" "}
                            <span className="underline decoration-dotted">
                              {isSampleFilled ? sampleData.permanentPost : "____________"}
                            </span>
                          </span>
                          <span>
                            Thana / Upazila:{" "}
                            <span className="underline decoration-dotted">
                              {isSampleFilled ? sampleData.permanentThana : "____________"}
                            </span>
                          </span>
                          <span>
                            District:{" "}
                            <span className="underline decoration-dotted">
                              {isSampleFilled ? sampleData.permanentDistrict : "____________"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ========================================================
                SECTION 4: PREVIOUS ACADEMIC RECORD
            ======================================================== */}
            <div className="mt-3">
              <div className="bg-slate-200 px-2 py-0.5 border border-slate-800 font-bold text-[11px] uppercase tracking-wide">
                {isBilingual ? "4. Previous Academic Background (পূর্ববর্তী শিক্ষার বিবরণ)" : "4. Previous Academic Background"}
              </div>

              <table className="w-full border-collapse border border-slate-800 text-[11px]">
                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="w-44 bg-slate-100 p-1.5 font-bold border-r border-slate-800">
                      Previous School / College :
                    </td>
                    <td className="p-1.5">
                      <span className="font-medium underline decoration-dotted">
                        {isSampleFilled ? sampleData.prevSchool : "____________________________________________________________________"}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="w-44 bg-slate-100 p-1.5 font-bold border-r border-slate-800">
                      Last Class & Performance :
                    </td>
                    <td className="p-1.5">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span>
                          Passed:{" "}
                          <strong className="underline">
                            {isSampleFilled ? sampleData.lastClassPassed : "Class _____"}
                          </strong>
                        </span>
                        <span>
                          Year:{" "}
                          <strong className="font-mono underline">
                            {isSampleFilled ? sampleData.passingYear : "20_____"}
                          </strong>
                        </span>
                        <span>
                          Roll/ID:{" "}
                          <strong className="font-mono underline">
                            {isSampleFilled ? sampleData.prevRoll : "_______"}
                          </strong>
                        </span>
                        <span>
                          GPA / Marks:{" "}
                          <strong className="font-mono underline">
                            {isSampleFilled ? sampleData.prevGpa : "_______"}
                          </strong>
                        </span>
                        <span>
                          TC No & Date:{" "}
                          <strong className="font-mono">
                            {isSampleFilled ? `${sampleData.tcNo} (${sampleData.tcDate})` : "____________________"}
                          </strong>
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ========================================================
                SECTION 5: UNDERTAKING & SIGNATURES
            ======================================================== */}
            <div className="mt-3 border border-slate-800 p-2 text-slate-800">
              <div className="font-bold text-[10px] uppercase text-slate-900 border-b border-slate-300 pb-1 mb-1">
                {isBilingual ? "Student & Guardian Undertaking (অঙ্গীকারনামা)" : "Undertaking & Declaration"}
              </div>
              <p className="text-[10px] leading-tight text-justify">
                {isBilingual
                  ? "আমি এই মর্মে অঙ্গীকার করছি যে, উপরে প্রদত্ত সমস্ত তথ্য সম্পূর্ণ সত্য ও সঠিক। কোনো অসত্য বা অসম্পূর্ণ তথ্য পাওয়া গেলে আমার/আমার সন্তানের ভর্তি তাৎক্ষণিকভাবে বাতিল বলে গণ্য হবে। প্রতিষ্ঠানের যাবতীয় নিয়ম-শৃঙ্খলা, সময়ানুবর্তিতা এবং আচরণবিধি অক্ষরে অক্ষরে মেনে চলতে আমরা বাধ্য থাকব।"
                  : "I hereby declare that all information provided above is true and complete to the best of my knowledge. If any information is found false or misleading, the admission of my ward shall stand canceled forthwith. We abide by all institutional rules, discipline, and code of conduct."}
              </p>

              <div className="mt-5 flex items-end justify-between px-4 text-[10px] font-bold">
                <div className="text-center">
                  <div className="w-36 border-t border-slate-800 pt-0.5">
                    {isBilingual ? "শিক্ষার্থীর স্বাক্ষর ও তারিখ" : "Signature of Student & Date"}
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-36 border-t border-slate-800 pt-0.5">
                    {isBilingual ? "পিতা / মাতার স্বাক্ষর" : "Signature of Father / Mother"}
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-36 border-t border-slate-800 pt-0.5">
                    {isBilingual ? "আইনগত অভিভাবকের স্বাক্ষর" : "Signature of Legal Guardian"}
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================
                SECTION 6: FOR OFFICE USE ONLY
            ======================================================== */}
            <div className="mt-3 border-2 border-slate-900 bg-slate-50/70 p-2">
              <div className="flex items-center justify-between border-b border-slate-400 pb-1 mb-1.5">
                <span className="font-black text-[11px] uppercase tracking-wider text-slate-900">
                  {isBilingual ? "For Office Use Only (বিদ্যালয়/কলেজ অফিসের ব্যবহারের জন্য)" : "For Official Use Only"}
                </span>
                <span className="text-[10px] font-semibold text-slate-700">
                  Admission Status: [ ] Approved &nbsp; [ ] Waiting &nbsp; [ ] Rejected
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                <div>
                  <span className="font-bold">Admitted Class: </span>
                  <span className="font-mono font-bold">________________</span>
                </div>
                <div>
                  <span className="font-bold">Assigned Section: </span>
                  <span className="font-mono font-bold">________________</span>
                </div>
                <div>
                  <span className="font-bold">Student Roll No: </span>
                  <span className="font-mono font-bold">________________</span>
                </div>
                <div>
                  <span className="font-bold">Assigned Shift: </span>
                  <span className="font-mono font-bold">________________</span>
                </div>
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[10px] flex-wrap gap-2">
                <div>
                  <span className="font-bold">Fee Voucher / Receipt No: </span>
                  <span className="font-mono">____________________</span>
                </div>
                <div>
                  <span className="font-bold">Amount Deposited: </span>
                  <span>৳ ________________</span>
                </div>
                <div>
                  <span className="font-bold">Date: </span>
                  <span className="font-mono">____ / ____ / 2026</span>
                </div>
              </div>

              <div className="mt-6 flex items-end justify-between px-4 text-[10px] font-bold">
                <div className="text-center">
                  <div className="w-32 border-t border-slate-800 pt-0.5">
                    Scrutiny Officer Sign
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-32 border-t border-slate-800 pt-0.5">
                    Accountant / Cashier
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-36 border-t border-slate-900 pt-0.5 font-black">
                    Principal / Headmaster Sign & Seal
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================
                TEAR-OFF STUDENT COUNTERFOIL / ADMIT SLIP
            ======================================================== */}
            {showCounterfoil && (
              <div className="mt-4 pt-2">
                {/* Scissors Cut Line */}
                <div className="flex items-center text-slate-500 text-[10px] my-1 font-semibold select-none">
                  <span className="border-b border-dashed border-slate-700 flex-1"></span>
                  <span className="px-2 flex items-center gap-1.5 text-slate-700 uppercase tracking-widest font-bold">
                    <Scissors className="w-3.5 h-3.5" />
                    {isBilingual
                      ? "কাঁচি দিয়ে আলাদা করুন • Student Copy / Admit Slip • প্রাপ্তি স্বীকার রসিদ"
                      : "Cut Along Dotted Line • Student Copy / Admit Slip"}
                  </span>
                  <span className="border-b border-dashed border-slate-700 flex-1"></span>
                </div>

                {/* Counterfoil Body */}
                <div className="border border-slate-800 p-2 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-300 pb-1">
                    <div>
                      <h3 className="font-black text-xs uppercase text-slate-900 leading-tight">
                        {schoolInfo.name || "DHAKA IDEAL MODEL HIGH SCHOOL & COLLEGE"}
                      </h3>
                      <div className="text-[10px] text-slate-600 flex items-center gap-2">
                        <span>EIIN: {schoolInfo.eiin || "108254"}</span>
                        <span>•</span>
                        <span>Session: {academicSession}</span>
                        <span>•</span>
                        <span className="font-bold text-slate-900">
                          ভর্তি আবেদন প্রাপ্তি স্বীকার ও প্রবেশপত্র
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-[10px]">
                      <span className="font-bold">Tracking Sl No: </span>
                      <span className="font-mono font-bold underline">
                        {isSampleFilled ? sampleData.formNo : (formSerialPrefix ? `${formSerialPrefix}________` : "________________")}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] mt-1.5">
                    <div>
                      <span className="font-bold">Student Name: </span>
                      <span className="underline font-semibold">
                        {isSampleFilled ? sampleData.studentNameEn : "________________________"}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold">Class Applied: </span>
                      <span className="underline">
                        {isSampleFilled
                          ? sampleData.classApplied
                          : selectedClass !== "BLANK"
                          ? selectedClass
                          : "____________"}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold">Shift: </span>
                      <span>[ ] Morning &nbsp; [ ] Day</span>
                    </div>
                    <div>
                      <span className="font-bold">Received Date: </span>
                      <span className="font-mono">____/____/2026</span>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[9px] text-slate-600 border-t border-slate-200 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">Documents Attached:</span>
                      <span>[ ] 3x Photo</span>
                      <span>[ ] Birth Reg (BRN)</span>
                      <span>[ ] Parents NID</span>
                      <span>[ ] TC / Marksheet</span>
                    </div>

                    <div className="text-right font-bold text-slate-900">
                      <span>Office Receiving Officer Seal & Sign: ____________________</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ==========================================================
              PAGE 2: EXTENDED TWO-PAGE FORM (Only when two_page selected)
          ========================================================== */}
          {formLayout === "two_page" && (
            <div className="pt-8 border-t-2 border-dashed border-slate-400 page-break">
              <div className="border-b-2 border-slate-900 pb-2 text-center">
                <h2 className="text-base font-black uppercase text-slate-900">
                  {schoolInfo.name || "DHAKA IDEAL MODEL HIGH SCHOOL & COLLEGE"}
                </h2>
                <div className="text-xs font-bold text-slate-800">
                  Part 2: Subject Selection, Academic History & Rules of Discipline
                </div>
                <div className="text-[10px] text-slate-600">
                  Student Name: ____________________________________ • Class: ________________ • Form No: ____________
                </div>
              </div>

              {/* Subject Choice Table for High School & College */}
              <div className="mt-4">
                <div className="bg-slate-200 px-2 py-0.5 border border-slate-800 font-bold text-[11px] uppercase tracking-wide">
                  5. Subject Selection / বিষয় নির্বাচন (For Secondary & Higher Secondary)
                </div>
                <table className="w-full border-collapse border border-slate-800 text-[11px] mt-1">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-800 font-bold text-center">
                      <th className="border-r border-slate-800 p-1.5 w-12">Type</th>
                      <th className="border-r border-slate-800 p-1.5 text-left">Subject Name (Bangla / English)</th>
                      <th className="border-r border-slate-800 p-1.5 w-24">Subject Code</th>
                      <th className="p-1.5 w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-800">
                      <td className="border-r border-slate-800 p-1.5 text-center font-bold">1</td>
                      <td className="border-r border-slate-800 p-1.5">Bangla (আবশ্যিক বাংলা)</td>
                      <td className="border-r border-slate-800 p-1.5 text-center font-mono">101</td>
                      <td className="p-1.5 text-center font-semibold text-emerald-800">Compulsory</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="border-r border-slate-800 p-1.5 text-center font-bold">2</td>
                      <td className="border-r border-slate-800 p-1.5">English (আবশ্যিক ইংরেজি)</td>
                      <td className="border-r border-slate-800 p-1.5 text-center font-mono">107</td>
                      <td className="p-1.5 text-center font-semibold text-emerald-800">Compulsory</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="border-r border-slate-800 p-1.5 text-center font-bold">3</td>
                      <td className="border-r border-slate-800 p-1.5">Information & Communication Technology (ICT)</td>
                      <td className="border-r border-slate-800 p-1.5 text-center font-mono">154</td>
                      <td className="p-1.5 text-center font-semibold text-emerald-800">Compulsory</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="border-r border-slate-800 p-1.5 text-center font-bold">4</td>
                      <td className="border-r border-slate-800 p-1.5">Elective Subject 1: ________________________________</td>
                      <td className="border-r border-slate-800 p-1.5 text-center font-mono">______</td>
                      <td className="p-1.5 text-center text-slate-700">Group Elective</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="border-r border-slate-800 p-1.5 text-center font-bold">5</td>
                      <td className="border-r border-slate-800 p-1.5">Elective Subject 2: ________________________________</td>
                      <td className="border-r border-slate-800 p-1.5 text-center font-mono">______</td>
                      <td className="p-1.5 text-center text-slate-700">Group Elective</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="border-r border-slate-800 p-1.5 text-center font-bold">6</td>
                      <td className="border-r border-slate-800 p-1.5">Elective Subject 3: ________________________________</td>
                      <td className="border-r border-slate-800 p-1.5 text-center font-mono">______</td>
                      <td className="p-1.5 text-center text-slate-700">Group Elective</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="border-r border-slate-800 p-1.5 text-center font-bold">7</td>
                      <td className="border-r border-slate-800 p-1.5">4th / Optional Subject: ____________________________</td>
                      <td className="border-r border-slate-800 p-1.5 text-center font-mono">______</td>
                      <td className="p-1.5 text-center text-amber-800 font-semibold">Optional (4th)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Institutional Code of Conduct & Rules */}
              <div className="mt-4 border border-slate-800 p-3 text-slate-900 bg-slate-50/50">
                <div className="font-bold text-xs uppercase border-b border-slate-300 pb-1 mb-2">
                  Institutional Code of Conduct & Admission Policy (আচরণবিধি ও নিয়মাবলি)
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[10px] leading-relaxed text-slate-700">
                  <li>
                    প্রত্যেক শিক্ষার্থীকে নির্ধারিত স্কুল পোশাকে (School Uniform) এবং আইডি কার্ড পরিহিত অবস্থায় বিদ্যালয়ে উপস্থিত হতে হবে।
                  </li>
                  <li>
                    বার্ষিক পরীক্ষায় অংশগ্রহণের জন্য নূন্যতম ৭৫% ক্লাসে উপস্থিতি বাধ্যতামূলক। বিনা অনুমতিতে অনুপস্থিতি শাস্তিযোগ্য অপরাধ।
                  </li>
                  <li>
                    বিদ্যালয় প্রাঙ্গণে কোনো ধরনের মোবাইল ফোন, ইলেকট্রনিক গ্যাজেট বা ধূমপান/অনাকাঙ্ক্ষিত বস্তু বহন সম্পূর্ণ নিষিদ্ধ।
                  </li>
                  <li>
                    প্রতি মাসের ১০ তারিখের মধ্যে সংশ্লিষ্ট মাসের টিউশন ফি পরিশোধ করতে হবে; অন্যথায় বিলম্ব ফি প্রযোজ্য হবে।
                  </li>
                  <li>
                    প্রতিষ্ঠানের যে কোনো সম্পদ ভাঙচুর বা অনিষ্টসাধন করলে অভিভাবককে ক্ষতিপূরণ দিতে হবে এবং ছাত্রত্ব বাতিল হতে পারে।
                  </li>
                </ol>

                <div className="mt-8 flex items-end justify-between px-6 text-[11px] font-bold">
                  <div className="text-center">
                    <div className="w-40 border-t border-slate-800 pt-0.5">
                      অভিভাবকের অঙ্গীকার স্বাক্ষর
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="w-40 border-t border-slate-800 pt-0.5">
                      অধ্যক্ষ / প্রধান শিক্ষক স্বাক্ষর ও সিল
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==============================================================
          DOCUMENT GUIDELINES & CHECKLIST MODAL (no-print)
      ============================================================== */}
      {showGuidelinesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Admission Checklist & Policy Guidelines
                  </h3>
                  <p className="text-xs text-slate-500">
                    Required documents for new student admission (ভর্তির প্রয়োজনীয় কাগজপত্র)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuidelinesModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-md text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Required Documents Checklist (সংযুক্তির তালিকা) :</span>
              </h4>
              <ul className="space-y-1.5 list-disc list-inside bg-slate-50 p-3 rounded-xl border border-slate-200">
                <li>
                  <strong>3 Copies Passport Size Photographs:</strong> Recent color photo with white/light background.
                </li>
                <li>
                  <strong>Online Birth Registration Certificate (BRN):</strong> 17-digit digital copy attested by Gazetted officer or Headmaster.
                </li>
                <li>
                  <strong>Parents NID Card Photocopies:</strong> Both Father and Mother National Identity card photocopies.
                </li>
                <li>
                  <strong>Previous Academic Transcript / Marksheet:</strong> Original copy of last passed annual or board examination (PEC / JSC / SSC).
                </li>
                <li>
                  <strong>Original Transfer Certificate (TC):</strong> Mandatory for admissions into Class 2 through Class 10 from previous school.
                </li>
                <li>
                  <strong>Blood Group Certificate:</strong> Medical test report verifying blood group.
                </li>
                <li>
                  <strong>Quota Certificate (if applicable):</strong> Freedom Fighter (মুক্তিযোদ্ধা) ministry certificate, Disability certificate, etc.
                </li>
              </ul>

              <h4 className="font-bold text-slate-900 text-sm mt-4 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Age Criteria (Ministry of Education Policy) :</span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-800 font-bold">
                    <tr>
                      <th className="p-2 border-b border-slate-200">Class</th>
                      <th className="p-2 border-b border-slate-200">Minimum Age (on Jan 1)</th>
                      <th className="p-2 border-b border-slate-200">Maximum Age (on Jan 1)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2 font-semibold">Play / Nursery</td>
                      <td className="p-2">4+ Years</td>
                      <td className="p-2">5 Years</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">Class 1</td>
                      <td className="p-2">6+ Years (Mandatory)</td>
                      <td className="p-2">7 Years</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">Class 6</td>
                      <td className="p-2">11+ Years</td>
                      <td className="p-2">12.5 Years</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">Class 9</td>
                      <td className="p-2">14+ Years</td>
                      <td className="p-2">15.5 Years</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuidelinesModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
              >
                Close Guidelines
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

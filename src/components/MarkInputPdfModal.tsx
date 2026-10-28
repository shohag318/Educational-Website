"use client";

import React, { useState } from "react";
import {
  Printer,
  X,
  FileText,
  CheckCircle,
  Edit3,
} from "lucide-react";

export interface MarkInputPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  institution?: {
    name?: string;
    address?: string;
    code?: string;
  };
  exam?: any;
  selectedClass?: any;
  selectedSection?: any;
  selectedGroup?: string;
  selectedShift?: string;
  subject?: any;
  config?: any;
  rows: any[];
  isCtActive: boolean;
  ctPercentage: number;
  ctMaxMark: number;
  mainExamPercentage: number;
  isClassTest: boolean;
}

const STUDENTS_PER_COLUMN = 40;
const STUDENTS_PER_PAGE = 80;

export function MarkInputPdfModal({
  isOpen,
  onClose,
  institution,
  exam,
  selectedClass,
  selectedSection,
  selectedGroup,
  selectedShift,
  subject,
  config,
  rows,
  isCtActive,
  ctPercentage,
  ctMaxMark,
  mainExamPercentage,
  isClassTest,
}: MarkInputPdfModalProps) {
  const [mode, setMode] = useState<"filled" | "blank">("filled");

  // Institution details
  const institutionName =
    exam?.institution?.name ||
    institution?.name ||
    "Dhaka Ideal Model High School & College";
  const institutionAddress =
    exam?.institution?.address ||
    institution?.address ||
    "Mirpur, Dhaka-1216, Bangladesh";
  const institutionEiin =
    exam?.institution?.code || institution?.code || "108254";

  // Academic details
  const examName = exam?.name || "Official Examination";
  const academicYear = exam?.academicYear?.yearName || "2026";
  const className = selectedClass?.name || "Class";
  const sectionName = selectedSection?.name || "All Sections";
  const groupName =
    selectedGroup && selectedGroup !== "ALL"
      ? selectedGroup
      : selectedSection?.groupType || "All Groups";
  const shiftName = selectedShift
    ? selectedShift === "MORNING"
      ? "Morning"
      : selectedShift === "DAY"
      ? "Day"
      : selectedShift
    : selectedSection?.shift === "MORNING"
    ? "Morning"
    : selectedSection?.shift === "DAY"
    ? "Day"
    : selectedSection?.shift || "Day";

  const subjectName = config?.subject?.name || subject?.name || "Subject";
  const subjectCode =
    config?.subject?.subjectCode || subject?.subjectCode || "N/A";

  // Components config
  const cqDef = config?.components?.find(
    (c: any) =>
      c.componentName?.toUpperCase() === "CQ" ||
      c.componentName?.toLowerCase().includes("cq") ||
      c.componentName?.toLowerCase().includes("creative") ||
      c.componentName?.toLowerCase().includes("written") ||
      c.componentName?.toLowerCase().includes("theory")
  );
  const mcqDef = config?.components?.find(
    (c: any) =>
      c.componentName?.toUpperCase() === "MCQ" ||
      c.componentName?.toLowerCase().includes("mcq") ||
      c.componentName?.toLowerCase().includes("objective")
  );
  const practicalDef = config?.components?.find(
    (c: any) =>
      c.componentName?.toUpperCase() === "PRACTICAL" ||
      c.componentName?.toUpperCase() === "PRAC" ||
      c.componentName?.toLowerCase().includes("practical") ||
      c.componentName?.toLowerCase().includes("pactical") ||
      c.componentName?.toLowerCase().includes("lab")
  );
  const hasPractical = Boolean(practicalDef);
  const cqKey = cqDef?.componentName || "CQ";
  const mcqKey = mcqDef?.componentName || "MCQ";
  const practicalKey = practicalDef?.componentName || "PRACTICAL";

  const totalMainFull =
    (cqDef?.fullMarks || 0) +
      (mcqDef?.fullMarks || 0) +
      (hasPractical && practicalDef ? practicalDef.fullMarks : 0) ||
    config?.totalFullMarks ||
    100;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Chunk students into pages of 80 students (2 columns of 40 students each)
  const totalPages = Math.max(1, Math.ceil(rows.length / STUDENTS_PER_PAGE));
  const pages: Array<{ pageIndex: number; leftCol: any[]; rightCol: any[] }> = [];
  for (let p = 0; p < totalPages; p++) {
    const pageStudents = rows.slice(
      p * STUDENTS_PER_PAGE,
      (p + 1) * STUDENTS_PER_PAGE
    );
    const leftCol = pageStudents.slice(0, STUDENTS_PER_COLUMN);
    const rightCol = pageStudents.slice(STUDENTS_PER_COLUMN, STUDENTS_PER_PAGE);
    pages.push({
      pageIndex: p,
      leftCol,
      rightCol,
    });
  }

  // Render a single 40-student column table
  const renderColumnTable = (
    columnStudents: any[],
    startSl: number,
    activeMode: "filled" | "blank"
  ) => {
    return (
      <table className="w-full text-left border-collapse border border-slate-700 text-[9.5px]">
        <thead>
          <tr className="bg-slate-100 text-slate-900 text-center font-bold text-[9.5px] border-b border-slate-700 h-[21px]">
            <th className="border border-slate-700 px-1 w-[8%] text-center">SL</th>
            <th className="border border-slate-700 px-1 w-[14%] text-center">Roll</th>
            <th className="border border-slate-700 px-1.5 text-left">
              Student Name
            </th>

            {isClassTest ? (
              <th className="border border-slate-700 px-1 w-[22%] text-center bg-slate-50 font-bold">
                CT ({ctMaxMark})
              </th>
            ) : (
              <>
                <th className="border border-slate-700 px-1 w-[12%] text-center">
                  CQ ({cqDef?.fullMarks || 70})
                </th>
                <th className="border border-slate-700 px-1 w-[12%] text-center">
                  MCQ ({mcqDef?.fullMarks || 30})
                </th>
                {hasPractical && (
                  <th className="border border-slate-700 px-1 w-[11%] text-center">
                    Prac ({practicalDef?.fullMarks})
                  </th>
                )}
                {isCtActive && (
                  <th className="border border-slate-700 px-1 w-[11%] text-center">
                    CT ({ctPercentage}%)
                  </th>
                )}
                <th className="border border-slate-700 px-1 w-[13%] text-center bg-slate-50 font-bold">
                  Total
                </th>
              </>
            )}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: STUDENTS_PER_COLUMN }).map((_, slotIdx) => {
            const sl = startSl + slotIdx;
            const r = columnStudents[slotIdx];

            if (!r) {
              // Exactly 40 rows per column: Empty pad row
              return (
                <tr
                  key={`empty-${sl}`}
                  className="border-b border-slate-300 h-[17.5px] leading-tight"
                >
                  <td className="border border-slate-400 px-1 text-center font-mono text-[9px] text-slate-400">
                    {sl}
                  </td>
                  <td className="border border-slate-400 px-1 text-center font-mono text-[9.5px] text-slate-300">
                    -
                  </td>
                  <td className="border border-slate-400 px-1.5 text-[9.5px] text-slate-300">
                    &nbsp;
                  </td>
                  {isClassTest ? (
                    <td className="border border-slate-400 px-1 text-center">
                      &nbsp;
                    </td>
                  ) : (
                    <>
                      <td className="border border-slate-400 px-1 text-center">
                        &nbsp;
                      </td>
                      <td className="border border-slate-400 px-1 text-center">
                        &nbsp;
                      </td>
                      {hasPractical && (
                        <td className="border border-slate-400 px-1 text-center">
                          &nbsp;
                        </td>
                      )}
                      {isCtActive && (
                        <td className="border border-slate-400 px-1 text-center">
                          &nbsp;
                        </td>
                      )}
                      <td className="border border-slate-400 px-1 text-center bg-slate-50/40">
                        &nbsp;
                      </td>
                    </>
                  )}
                </tr>
              );
            }

            const isAbsent = Boolean(r.isAbsent);

            // Component marks
            const cq = parseFloat(String(r.components?.[cqKey] ?? ""));
            const mcq = parseFloat(String(r.components?.[mcqKey] ?? ""));
            const prac = hasPractical
              ? parseFloat(String(r.components?.[practicalKey] ?? ""))
              : 0;

            const ctVal =
              typeof r.ctMark === "number"
                ? r.ctMark
                : parseFloat(String(r.ctMark)) || 0;

            const rawTotal =
              (isNaN(cq) ? 0 : cq) +
              (isNaN(mcq) ? 0 : mcq) +
              (isNaN(prac) ? 0 : prac);

            const totalMark = isCtActive
              ? (totalMainFull > 0
                  ? (rawTotal / totalMainFull) * mainExamPercentage
                  : rawTotal) + ctVal
              : rawTotal;

            const hasAnyComponent =
              !isNaN(cq) ||
              !isNaN(mcq) ||
              (hasPractical && !isNaN(prac)) ||
              (isCtActive && r.ctMark !== undefined && r.ctMark !== "");

            return (
              <tr
                key={r.enrollmentId || r.studentId || slotIdx}
                className="border-b border-slate-300 hover:bg-slate-50/50 h-[17.5px] leading-tight"
              >
                {/* SL */}
                <td className="border border-slate-400 px-1 text-center font-mono text-[9px] text-slate-500">
                  {sl}
                </td>

                {/* Roll */}
                <td className="border border-slate-400 px-1 text-center font-bold font-mono text-[9.5px] text-slate-900">
                  {r.roll}
                </td>

                {/* Name */}
                <td className="border border-slate-400 px-1.5 font-medium text-[9.5px] text-slate-900 truncate max-w-[130px]">
                  {r.name || r.studentName}
                </td>

                {/* Mark Columns */}
                {isClassTest ? (
                  <td className="border border-slate-400 px-1 text-center font-bold font-mono text-[9.5px]">
                    {activeMode === "blank" ? (
                      ""
                    ) : isAbsent ? (
                      <span className="text-red-700 font-extrabold text-[9px]">
                        ABS
                      </span>
                    ) : r.ctMark !== undefined && r.ctMark !== "" ? (
                      ctVal
                    ) : (
                      ""
                    )}
                  </td>
                ) : (
                  <>
                    {/* CQ */}
                    <td className="border border-slate-400 px-1 text-center font-mono text-[9.5px]">
                      {activeMode === "blank" ? (
                        ""
                      ) : isAbsent ? (
                        <span className="text-red-700 font-extrabold text-[9px]">
                          ABS
                        </span>
                      ) : !isNaN(cq) ? (
                        cq
                      ) : (
                        ""
                      )}
                    </td>

                    {/* MCQ */}
                    <td className="border border-slate-400 px-1 text-center font-mono text-[9.5px]">
                      {activeMode === "blank" ? (
                        ""
                      ) : isAbsent ? (
                        <span className="text-red-700 font-extrabold text-[9px]">
                          ABS
                        </span>
                      ) : !isNaN(mcq) ? (
                        mcq
                      ) : (
                        ""
                      )}
                    </td>

                    {/* Practical */}
                    {hasPractical && (
                      <td className="border border-slate-400 px-1 text-center font-mono text-[9.5px]">
                        {activeMode === "blank" ? (
                          ""
                        ) : isAbsent ? (
                          <span className="text-red-700 font-extrabold text-[9px]">
                            ABS
                          </span>
                        ) : !isNaN(prac) ? (
                          prac
                        ) : (
                          ""
                        )}
                      </td>
                    )}

                    {/* CT */}
                    {isCtActive && (
                      <td className="border border-slate-400 px-1 text-center font-mono text-[9.5px]">
                        {activeMode === "blank" ? (
                          ""
                        ) : isAbsent ? (
                          <span className="text-red-700 font-extrabold text-[9px]">
                            ABS
                          </span>
                        ) : r.ctMark !== undefined && r.ctMark !== "" ? (
                          ctVal.toFixed(1)
                        ) : (
                          ""
                        )}
                      </td>
                    )}

                    {/* Total */}
                    <td className="border border-slate-400 px-1 text-center font-bold font-mono text-[9.5px] bg-slate-50/50">
                      {activeMode === "blank" ? (
                        ""
                      ) : isAbsent ? (
                        <span className="text-red-700 font-extrabold text-[9px]">
                          ABS
                        </span>
                      ) : hasAnyComponent ? (
                        totalMark.toFixed(1)
                      ) : (
                        ""
                      )}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  // Render a full page of 80 students (2 columns of 40 students)
  const renderDocumentPages = (activeMode: "filled" | "blank") => (
    <div className="space-y-6 print:space-y-0">
      {pages.map((p) => {
        const pageStartSl = p.pageIndex * STUDENTS_PER_PAGE + 1;
        const pageEndSl = Math.min(
          (p.pageIndex + 1) * STUDENTS_PER_PAGE,
          rows.length || STUDENTS_PER_PAGE
        );
        const isSubsequentPage = p.pageIndex > 0;

        return (
          <div
            key={p.pageIndex}
            className={`pdf-page bg-white mx-auto shadow-md rounded-xl p-4 sm:p-5 max-w-[210mm] border border-slate-300 print:border-none print:shadow-none print:rounded-none print:p-0 print:m-0 text-slate-900 font-sans leading-normal ${
              isSubsequentPage ? "pdf-page-break" : ""
            }`}
          >
            {/* ========================================================= */}
            {/* 1. INSTITUTION & FORM HEADER                              */}
            {/* ========================================================= */}
            <div className="text-center border-b-2 border-slate-900 pb-1.5 mb-2">
              {/* College Name */}
              <h1 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight font-serif leading-tight">
                {institutionName}
              </h1>

              {/* College Address & EIIN */}
              <p className="text-[10px] text-slate-600 font-medium">
                {institutionAddress} • EIIN:{" "}
                <span className="font-semibold text-slate-800">
                  {institutionEiin}
                </span>
              </p>

              {/* Form Title Badge */}
              <div className="mt-1 inline-block bg-slate-900 text-white text-[9.5px] font-bold px-3 py-0.5 rounded uppercase tracking-wider">
                {isClassTest
                  ? "CLASS TEST (CT) MARK INPUT REGISTER (80 STUDENTS / PAGE)"
                  : activeMode === "blank"
                  ? "MARK INPUT BLANK SHEET • 2-COLUMN EVALUATION REGISTER (80 STUDENTS / PAGE)"
                  : "OFFICIAL MARK INPUT SHEET (80 STUDENTS / PAGE)"}
              </div>

              {/* Header Information Grid */}
              <div className="mt-1.5 grid grid-cols-4 gap-1.5 text-left text-[10px] bg-slate-50 border border-slate-300 rounded p-1.5 leading-tight">
                <div>
                  <span className="text-slate-500 font-medium">Exam Name:</span>
                  <div className="font-bold text-slate-900 truncate">{examName}</div>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Class & Year:</span>
                  <div className="font-bold text-slate-900">
                    {className} ({academicYear})
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Section / Group:</span>
                  <div className="font-bold text-slate-900 truncate">
                    {sectionName} • {groupName}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Shift / Page:</span>
                  <div className="font-bold text-slate-900">
                    {shiftName} • Page {p.pageIndex + 1} of {totalPages}
                  </div>
                </div>

                <div className="col-span-2">
                  <span className="text-slate-500 font-medium">Subject:</span>
                  <div className="font-bold text-slate-900 truncate">
                    {subjectName} ({subjectCode})
                  </div>
                </div>

                <div className="col-span-2">
                  <span className="text-slate-500 font-medium">Marks Distribution:</span>
                  <div className="font-bold text-slate-900 text-[9.5px]">
                    {isClassTest ? (
                      `Full Marks: ${ctMaxMark}`
                    ) : (
                      <>
                        Total: {config?.totalFullMarks || 100} (CQ:{" "}
                        {cqDef?.fullMarks || 70}, MCQ: {mcqDef?.fullMarks || 30}
                        {hasPractical ? `, Prac: ${practicalDef?.fullMarks}` : ""}
                        {isCtActive ? `, CT: ${ctPercentage}%` : ""})
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Range & Total Count */}
              <div className="mt-1 flex items-center justify-between text-[9px] text-slate-600 px-1 font-medium">
                <div>
                  Student Range on This Page:{" "}
                  <strong className="text-slate-900 font-bold">
                    SL #{pageStartSl} to #{pageEndSl}
                  </strong>{" "}
                  (Total Enrolled: {rows.length})
                </div>
                <div>
                  Evaluation / Issue Date:{" "}
                  <strong className="text-slate-900">{currentDate}</strong>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 2. TWO-COLUMN LAYOUT (40 STUDENTS PER COLUMN = 80 / PAGE)  */}
            {/* ========================================================= */}
            <div className="grid grid-cols-2 gap-2 items-start">
              {/* Column 1: Students 1 - 40 */}
              <div className="w-full overflow-hidden">
                <div className="text-[9px] font-bold text-slate-700 mb-0.5 flex justify-between px-0.5">
                  <span>Column 1 (Students #{p.pageIndex * 80 + 1} - #{p.pageIndex * 80 + 40})</span>
                  <span>40 Students</span>
                </div>
                {renderColumnTable(p.leftCol, p.pageIndex * 80 + 1, activeMode)}
              </div>

              {/* Column 2: Students 41 - 80 */}
              <div className="w-full overflow-hidden">
                <div className="text-[9px] font-bold text-slate-700 mb-0.5 flex justify-between px-0.5">
                  <span>Column 2 (Students #{p.pageIndex * 80 + 41} - #{p.pageIndex * 80 + 80})</span>
                  <span>40 Students</span>
                </div>
                {renderColumnTable(p.rightCol, p.pageIndex * 80 + 41, activeMode)}
              </div>
            </div>

            {/* ========================================================= */}
            {/* 3. SIGNATURES BLOCK                                       */}
            {/* ========================================================= */}
            <div className="mt-3 pt-2 grid grid-cols-4 gap-3 text-center text-[8.5px] font-semibold text-slate-800">
              <div className="border-t border-slate-500 pt-0.5">
                Subject Teacher&apos;s Signature
              </div>
              <div className="border-t border-slate-500 pt-0.5">
                Scrutinizer / Cross-Checker
              </div>
              <div className="border-t border-slate-500 pt-0.5">
                Head of Department / Shift In-Charge
              </div>
              <div className="border-t border-slate-500 pt-0.5">
                Headmaster / Principal / Controller
              </div>
            </div>

            {/* ========================================================= */}
            {/* 4. SOFTWARE COMPANY INFORMATION FOOTER                    */}
            {/* ========================================================= */}
            <div className="mt-2 pt-1 border-t border-slate-800 text-[8.5px] text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-1">
              <div className="text-left space-y-0.5">
                <div className="font-extrabold text-slate-900 tracking-wide uppercase flex items-center space-x-1">
                  <span>Software Developed & Maintained by:</span>
                  <span className="text-emerald-700 font-black">
                    SMART EDUTECH SOLUTIONS LTD.
                  </span>
                </div>
                <p className="text-[8px] text-slate-500">
                  National Curriculum (NCTB) Standard Automated School Management & Result Processing Engine
                </p>
              </div>

              <div className="text-right text-[8px] text-slate-500 space-y-0.5">
                <p className="font-medium text-slate-700">
                  Helpline: +880 1700-000000 | Email: support@edutechbd.com | Web: www.edutechbd.com
                </p>
                <p className="italic">
                  Confidential Document • Generated: {currentDate} at {currentTime} • Page {p.pageIndex + 1} of {totalPages}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Direct Background Print Element (Active whenever window.print is called) */}
      <div className="hidden print:block font-sans text-black">
        {renderDocumentPages(mode)}
      </div>

      {/* Interactive Modal (For Screen Preview & Mode Toggling) */}
      {isOpen && (
        <div className="no-print fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-6xl flex flex-col max-h-[96vh] overflow-hidden">
            {/* Modal Controls Toolbar */}
            <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Mark Input Sheet PDF Preview (2 Columns • 80 Students / Page)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Two-column ledger layout: 40 students per column, exactly 80 students per A4 page with College header and Software company footer.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Mode Selector */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setMode("filled")}
                    className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center space-x-1 ${
                      mode === "filled"
                        ? "bg-white text-emerald-800 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Filled Marks</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("blank")}
                    className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center space-x-1 ${
                      mode === "blank"
                        ? "bg-white text-blue-800 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Blank Form (Evaluation)</span>
                  </button>
                </div>

                {/* Print / Save as PDF Button */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center space-x-2 shadow-sm cursor-pointer"
                  title="Save as PDF or Print"
                >
                  <Printer className="w-4 h-4" />
                  <span>Save as PDF / Print</span>
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Canvas Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/60">
              {renderDocumentPages(mode)}
            </div>
          </div>
        </div>
      )}

      {/* Global Print Styles for High-Quality A4 Output */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 7mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .pdf-page {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .pdf-page-break {
            page-break-before: always !important;
            break-before: page !important;
          }
          table {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </>
  );
}

"use client";

import React from "react";
import { Printer, X, CheckCircle2, Building2, ShieldCheck, Download } from "lucide-react";
import { FeeCollectionVoucher, amountToWordsBD } from "./collectionStore";
import { MONTHS } from "../MonthlyFeeTemplate";

interface MoneyReceiptModalProps {
  voucher: FeeCollectionVoucher | null;
  isOpen: boolean;
  onClose: () => void;
  instituteName?: string;
  instituteEiin?: string;
}

export function MoneyReceiptModal({
  voucher,
  isOpen,
  onClose,
  instituteName = "SHAHID ZIAUR RAHMAN DEGREE COLLEGE",
  instituteEiin = "108254",
}: MoneyReceiptModalProps) {
  if (!isOpen || !voucher) return null;

  const monthObj = MONTHS.find((m) => m.key === voucher.monthKey);
  const monthName = monthObj ? monthObj.name : voucher.monthKey;
  const inWords = amountToWordsBD(voucher.netPaidAmount);

  const handlePrint = () => {
    window.print();
  };

  const renderReceiptPart = (copyTitle: string) => (
    <div className="border-2 border-slate-800 rounded-xl p-5 bg-white space-y-3 relative overflow-hidden">
      {/* Watermark Seal */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
        <Building2 className="w-72 h-72 text-slate-900" />
      </div>

      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-3 text-center relative">
        <div className="flex items-center justify-between mb-1 text-[11px] font-mono text-slate-600">
          <span>EIIN: {instituteEiin}</span>
          <span className="font-bold text-slate-800 uppercase tracking-widest px-2 py-0.5 border border-slate-400 rounded bg-slate-50 text-[10px]">
            {copyTitle}
          </span>
          <span>ESTD: 1993</span>
        </div>
        <h2 className="font-extrabold text-base sm:text-lg text-slate-950 uppercase tracking-wide">
          {instituteName}
        </h2>
        <p className="text-[11px] text-slate-600">
          Ziar Kandi, Jamalpur Sadar, Jamalpur • Phone: 01712-345678
        </p>
        <div className="inline-block mt-2 px-3 py-0.5 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-wider">
          Student Fee Money Receipt
        </div>
      </div>

      {/* Voucher Meta Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-1 border-b border-slate-200 font-medium">
        <div>
          <span className="text-slate-500 text-[10px] block uppercase">Receipt No:</span>
          <strong className="font-mono text-slate-900 text-sm">{voucher.voucherNo}</strong>
        </div>
        <div>
          <span className="text-slate-500 text-[10px] block uppercase">Payment Date:</span>
          <span className="font-bold text-slate-800">{voucher.collectionDate}</span>
        </div>
        <div>
          <span className="text-slate-500 text-[10px] block uppercase">Academic Cycle:</span>
          <span className="font-bold text-slate-800">{monthName} {voucher.session}</span>
        </div>
        <div>
          <span className="text-slate-500 text-[10px] block uppercase">Payment Method:</span>
          <span className="font-bold text-emerald-800 uppercase text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            {voucher.paymentMethod.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Student Details Grid */}
      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <span className="text-slate-500 text-[10px] block uppercase">Student Name:</span>
          <strong className="text-slate-900 truncate block">{voucher.studentName}</strong>
        </div>
        <div>
          <span className="text-slate-500 text-[10px] block uppercase">Class & Roll:</span>
          <strong className="text-slate-900">{voucher.className} • Roll {voucher.studentRoll}</strong>
        </div>
        <div>
          <span className="text-slate-500 text-[10px] block uppercase">Section / Group:</span>
          <span className="text-slate-800 font-semibold">{voucher.sectionName || "Section A"} ({voucher.groupType || "ALL"})</span>
        </div>
        <div>
          <span className="text-slate-500 text-[10px] block uppercase">Ref / Trx ID:</span>
          <span className="font-mono font-semibold text-slate-700">{voucher.transactionRef || "COUNTER-CASH"}</span>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse border border-slate-300">
          <thead className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
            <tr>
              <th className="py-1 px-2 border-r border-slate-300 w-10 text-center">SL</th>
              <th className="py-1 px-3 border-r border-slate-300">Fee Head / Description</th>
              <th className="py-1 px-3 text-right w-28">Amount (৳)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {voucher.feeItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono text-[11px] text-slate-500">
                  {idx + 1}
                </td>
                <td className="py-1.5 px-3 border-r border-slate-300 font-medium text-slate-900">
                  {item.categoryName}
                </td>
                <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                  ৳{item.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-800 bg-slate-50/80 font-bold text-xs">
            {voucher.waiverDiscount > 0 && (
              <tr>
                <td colSpan={2} className="py-1 px-3 border-r border-slate-300 text-right text-amber-700">
                  Scholarship / Fee Concession:
                </td>
                <td className="py-1 px-3 text-right font-mono text-amber-700">
                  - ৳{voucher.waiverDiscount.toLocaleString()}
                </td>
              </tr>
            )}
            {voucher.fineAmount > 0 && (
              <tr>
                <td colSpan={2} className="py-1 px-3 border-r border-slate-300 text-right text-rose-700">
                  Late Fee / Surcharge:
                </td>
                <td className="py-1 px-3 text-right font-mono text-rose-700">
                  + ৳{voucher.fineAmount.toLocaleString()}
                </td>
              </tr>
            )}
            <tr className="bg-slate-200/80 text-slate-950 font-extrabold text-xs">
              <td colSpan={2} className="py-1.5 px-3 border-r border-slate-400 text-right uppercase tracking-wider">
                Total Net Paid Amount:
              </td>
              <td className="py-1.5 px-3 text-right font-mono text-sm text-emerald-950">
                ৳{voucher.netPaidAmount.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Amount In Words & Remarks */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pt-1 border-t border-slate-200 gap-1">
        <div>
          <span className="text-slate-500 font-semibold text-[11px]">In Words: </span>
          <strong className="text-slate-900 italic font-semibold">{inWords}</strong>
        </div>
        {voucher.remarks && (
          <div className="text-[11px] text-slate-500">
            <span>Note: {voucher.remarks}</span>
          </div>
        )}
      </div>

      {/* Signatures Row */}
      <div className="pt-8 grid grid-cols-3 text-center text-xs text-slate-700">
        <div>
          <div className="border-t border-dashed border-slate-400 pt-1 w-32 mx-auto font-medium text-[11px]">
            Student / Depositor
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 italic font-mono">
            {voucher.createdAt ? new Date(voucher.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
          </div>
        </div>
        <div>
          <div className="border-t border-dashed border-slate-800 pt-1 w-36 mx-auto font-bold text-[11px] text-slate-900">
            Cashier / Accounts Officer
          </div>
          <div className="text-[10px] text-slate-500">{voucher.cashierName || "Counter #1"}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto print:shadow-none print:border-none print:max-w-none print:p-0">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 no-print">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Money Receipt Voucher #{voucher.voucherNo}
              </h3>
              <p className="text-xs text-slate-500">
                Official institution fee receipt • Ready to print (Dual Copy)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt (Ctrl+P)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area - Dual Copy: Student Copy + Office Copy */}
        <div className="space-y-6 print:space-y-8">
          {/* Part 1: STUDENT COPY */}
          {renderReceiptPart("Student Copy")}

          {/* Perforated Cut Divider */}
          <div className="relative flex items-center justify-center border-t-2 border-dashed border-slate-400 py-1">
            <span className="bg-white px-3 text-[10px] text-slate-400 font-mono tracking-widest uppercase">
              ✂ Cut Here • Student Copy Above / Office Copy Below
            </span>
          </div>

          {/* Part 2: OFFICE COPY */}
          {renderReceiptPart("Office / Accounts Copy")}
        </div>

        {/* Modal Footer (Hidden in Print) */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500 no-print">
          <span>Official Voucher ID: {voucher.id}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

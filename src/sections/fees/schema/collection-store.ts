// src/app/fees/collection/collectionStore.ts
// Persistence and data models for Manually Fee Collection

import { getScopedStorageKey } from "@/lib/clientTenant";

export interface FeeCollectionItem {
  categoryId: string;
  categoryName: string;
  amount: number;
}

export interface FeeCollectionVoucher {
  id: string;
  voucherNo: string;
  studentId: string;
  studentName: string;
  studentRoll: number;
  className: string;
  sectionName?: string;
  groupType?: string;
  session: string;
  monthKey: string;
  collectionDate: string;
  paymentMethod: "CASH" | "BANK_DEPOSIT" | "BKASH" | "NAGAD" | "ROCKET" | "POS_CARD";
  transactionRef?: string;
  feeItems: FeeCollectionItem[];
  grossAmount: number;
  waiverDiscount: number;
  fineAmount: number;
  netPaidAmount: number;
  previousPaid: number;
  currentDueRemaining: number;
  cashierName: string;
  remarks?: string;
  createdAt: string;
}

const STORAGE_KEY = "nctb_fee_collection_vouchers";

export function getStoredCollectionVouchers(): FeeCollectionVoucher[] {
  if (typeof window === "undefined") return [];
  try {
    const key = getScopedStorageKey(STORAGE_KEY);
    const raw = localStorage.getItem(key);
    if (!raw) return getInitialDemoVouchers();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getInitialDemoVouchers();
  } catch (e) {
    console.error("Error reading collection vouchers:", e);
    return getInitialDemoVouchers();
  }
}

export function saveCollectionVouchers(vouchers: FeeCollectionVoucher[]): void {
  if (typeof window === "undefined") return;
  try {
    const key = getScopedStorageKey(STORAGE_KEY);
    localStorage.setItem(key, JSON.stringify(vouchers));
  } catch (e) {
    console.error("Error saving collection vouchers:", e);
  }
}

export function addCollectionVoucher(voucher: FeeCollectionVoucher): void {
  const current = getStoredCollectionVouchers();
  const next = [voucher, ...current];
  saveCollectionVouchers(next);
}

export function removeCollectionVoucher(voucherId: string): void {
  const current = getStoredCollectionVouchers();
  const next = current.filter((v) => v.id !== voucherId);
  saveCollectionVouchers(next);
}

export function generateNextVoucherNo(currentVouchers: FeeCollectionVoucher[]): string {
  const curYear = new Date().getFullYear();
  const yearPrefix = `MR-${curYear}-`;
  const existingNums = currentVouchers
    .filter((v) => v.voucherNo?.startsWith(yearPrefix))
    .map((v) => {
      const parts = v.voucherNo.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      return isNaN(num) ? 0 : num;
    });

  const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 1000;
  const nextNum = maxNum + 1;
  return `${yearPrefix}${String(nextNum).padStart(4, "0")}`;
}

export function amountToWordsBD(amount: number): string {
  if (amount === 0) return "Zero Taka Only";
  const num = Math.floor(Math.abs(amount));

  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : " ");
    if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + (n % 100 !== 0 ? inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + "Thousand " + (n % 1000 !== 0 ? inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + "Lakh " + (n % 100000 !== 0 ? inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + "Crore " + (n % 10000000 !== 0 ? inWords(n % 10000000) : "");
  }

  const result = inWords(num).trim();
  return `${result} Taka Only`;
}

function getInitialDemoVouchers(): FeeCollectionVoucher[] {
  const today = new Date().toISOString().split("T")[0];
  return [
    {
      id: "vouch_demo_1",
      voucherNo: "MR-2026-1001",
      studentId: "stu_demo_1",
      studentName: "MD. RAHIM ISLAM",
      studentRoll: 101,
      className: "Class 11",
      sectionName: "Section A",
      groupType: "SCIENCE",
      session: "2026",
      monthKey: "OCT",
      collectionDate: today,
      paymentMethod: "CASH",
      transactionRef: "CASH-COUNTER-01",
      feeItems: [
        { categoryId: "cat_current_tuition", categoryName: "Monthly Current Tuition Fee", amount: 2500 },
        { categoryId: "cat_science_lab", categoryName: "Science Laboratory Fee", amount: 500 },
      ],
      grossAmount: 3000,
      waiverDiscount: 0,
      fineAmount: 0,
      netPaidAmount: 3000,
      previousPaid: 0,
      currentDueRemaining: 0,
      cashierName: "Cash Counter 1",
      remarks: "Received full tuition & science lab fee in cash",
      createdAt: new Date().toISOString(),
    },
    {
      id: "vouch_demo_2",
      voucherNo: "MR-2026-1002",
      studentId: "stu_demo_2",
      studentName: "FATIMA JAHAN",
      studentRoll: 102,
      className: "Class 11",
      sectionName: "Section A",
      groupType: "HUMANITIES",
      session: "2026",
      monthKey: "OCT",
      collectionDate: today,
      paymentMethod: "BKASH",
      transactionRef: "TRX938472910",
      feeItems: [
        { categoryId: "cat_current_tuition", categoryName: "Monthly Current Tuition Fee", amount: 2500 },
      ],
      grossAmount: 2500,
      waiverDiscount: 500,
      fineAmount: 0,
      netPaidAmount: 2000,
      previousPaid: 0,
      currentDueRemaining: 0,
      cashierName: "Cash Counter 1",
      remarks: "bKash Counter Agent payment (Roll 2 Merit concession applied)",
      createdAt: new Date().toISOString(),
    },
  ];
}

export interface LedgerEntryValues {
  title: string;
  amount: number;
  date: string;
  category?: string;
}

export function validateLedgerEntry(values: LedgerEntryValues): string | null {
  if (!values.title?.trim()) return "Title is required";
  if (!values.amount || values.amount <= 0) return "Amount must be greater than 0";
  if (!values.date) return "Date is required";
  return null;
}

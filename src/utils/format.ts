export function fNumber(value: number | string | null | undefined, digits = 0): string {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString("en-BD", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fGpa(value: number | string | null | undefined): string {
  return fNumber(value, 2);
}

export function fCurrency(value: number | string | null | undefined): string {
  return `৳ ${fNumber(value, 2)}`;
}

export function fPercent(value: number | string | null | undefined): string {
  return `${fNumber(value, 1)}%`;
}

export function fullName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(" ").trim();
}

export function compactText(value: string | null | undefined, max = 40): string {
  const text = value?.trim() || "";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

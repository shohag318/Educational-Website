/** Shared friendly labels for Results & Exams select menus (no decorative dashes). */

export function titleCaseToken(value?: string | null): string {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function examStatusLabel(status?: string | null): string {
  if (!status) return "";
  const map: Record<string, string> = {
    PUBLISHED: "Published",
    DRAFT_PREVIEW: "Draft",
    DRAFT: "Draft",
    LOCKED: "Locked",
    PROCESSING: "Processing",
  };
  return map[status] || titleCaseToken(status);
}

export function groupTypeLabel(groupType?: string | null): string {
  if (!groupType || groupType === "ALL") return "";
  const map: Record<string, string> = {
    GENERAL: "General",
    SCIENCE: "Science",
    HUMANITIES: "Humanities",
    BUSINESS_STUDIES: "Business Studies",
  };
  return map[groupType] || titleCaseToken(groupType);
}

export function shiftLabel(shift?: string | null): string {
  if (!shift || shift === "ALL") return "";
  if (shift === "MORNING") return "Morning";
  if (shift === "DAY") return "Day";
  return titleCaseToken(shift);
}

/** Join non-empty parts with commas — no dashes or bullets. */
export function joinOptionParts(...parts: Array<string | null | undefined>): string {
  return parts.map((p) => (p || "").trim()).filter(Boolean).join(", ");
}

export function examOptionLabel(ex: {
  name?: string;
  termCode?: string | null;
  status?: string | null;
  class?: { name?: string | null } | null;
  institution?: { name?: string | null } | null;
}): string {
  return joinOptionParts(
    ex.name,
    ex.class?.name,
    ex.termCode || undefined,
    examStatusLabel(ex.status)
  );
}

export function subjectOptionLabel(sub: {
  name?: string;
  subjectCode?: string | null;
}): string {
  return joinOptionParts(sub.name, sub.subjectCode || undefined);
}

export function sectionOptionLabel(
  sec: { name?: string; groupType?: string | null; shift?: string | null },
  opts?: { includeShiftWhen?: boolean }
): string {
  return joinOptionParts(
    sec.name,
    groupTypeLabel(sec.groupType),
    opts?.includeShiftWhen ? shiftLabel(sec.shift) : undefined
  );
}

export function templateOptionLabel(tpl: {
  name?: string;
  items?: unknown[] | null;
}): string {
  const count = tpl.items?.length || 0;
  return joinOptionParts(tpl.name, count ? `${count} subjects` : undefined);
}

export function studentOptionLabel(st: {
  classRoll?: string | number;
  student?: {
    firstName?: string;
    lastName?: string;
    studentIdNo?: string;
  };
}): string {
  const name = joinOptionParts(st.student?.firstName, st.student?.lastName);
  return joinOptionParts(
    st.classRoll != null && st.classRoll !== "" ? `Roll ${st.classRoll}` : undefined,
    name,
    st.student?.studentIdNo || undefined
  );
}

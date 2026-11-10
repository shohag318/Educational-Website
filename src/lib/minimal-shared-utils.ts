/** Local shim for `minimal-shared/utils` used by Minimal-style table components. */

export function varAlpha(colorChannel: string | undefined | null, opacity: number): string {
  if (!colorChannel) {
    return `rgba(100, 116, 139, ${opacity})`;
  }

  const trimmed = String(colorChannel).trim();

  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1);
    const normalized =
      hex.length === 3
        ? hex
            .split("")
            .map((ch) => `${ch}${ch}`)
            .join("")
        : hex.slice(0, 6);
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) {
      return `rgba(100, 116, 139, ${opacity})`;
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  if (trimmed.startsWith("rgb")) {
    const nums = trimmed.match(/[\d.]+/g)?.slice(0, 3);
    if (!nums || nums.length < 3) {
      return `rgba(100, 116, 139, ${opacity})`;
    }
    return `rgba(${nums.join(", ")}, ${opacity})`;
  }

  const channels = trimmed
    .replace(/,/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3);

  if (channels.length < 3) {
    return `rgba(100, 116, 139, ${opacity})`;
  }

  return `rgba(${channels.join(", ")}, ${opacity})`;
}

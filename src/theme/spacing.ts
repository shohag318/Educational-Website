/**
 * Shared layout spacing (MUI spacing units; factor = 8 → 1 = 8px).
 * Use these everywhere so pages don't invent one-off gaps.
 */
export const SPACING = {
  /** Between major page sections / cards */
  page: 2.5, // 20px
  /** Between related blocks inside a section */
  section: 2, // 16px
  /** Default stack inside cards/forms */
  stack: 1.5, // 12px
  /** Inline controls / chip rows */
  inline: 1, // 8px
  /** Tight icon+label pairs */
  tight: 0.75, // 6px
  /** Form field vertical rhythm */
  field: 2, // 16px
  /** Page content padding (xs→md via sx arrays) */
  contentX: { xs: 1.5, sm: 2, md: 2.5 },
  contentY: { xs: 1.5, sm: 2, md: 2.25 },
  /** Gutter around the floating content surface */
  gutter: { xs: 1.25, sm: 1.5, md: 2 },
} as const;

/** Shared radius tokens (MUI shape units when used with theme.shape, else px). */
export const RADIUS = {
  control: 10,
  chip: 8,
  card: 16,
  panel: 20,
  surface: 20,
} as const;

/** Shared type sizes in px — keep table/inputs/chips aligned. */
export const TYPE = {
  xs: 11,
  sm: 12,
  md: 13,
  body: 14,
  lg: 15,
  xl: 16,
  h6: 16,
  h5: 18,
  h4: 20,
  h3: 24,
} as const;

/**
 * Theme plate — single source for brand colors, fonts, surfaces, and layout.
 * MUI palette / typography / CSS vars / shells all derive from this.
 */

export const THEME_PLATE = {
  name: "campus",

  fonts: {
    /** Matches next/font --font-roboto on <html> */
    sans: 'var(--font-roboto), "Roboto", "Helvetica Neue", "Arial", sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700,
    } as const,
  },

  colors: {
    /** Brand / primary actions */
    brand: {
      lighter: "#D1FAE5",
      light: "#34D399",
      main: "#059669",
      dark: "#047857",
      darker: "#064E3B",
      contrast: "#FFFFFF",
    },
    /** Neutral ink (text + chrome) */
    ink: {
      primary: "#0F172A",
      secondary: "#475569",
      muted: "#64748B",
      disabled: "#94A3B8",
      inverse: "#FFFFFF",
    },
    /** Surfaces / chrome */
    surface: {
      canvas: "#F1F5F9", // app gutter (AppShell grey.100)
      content: "#F8FAFC", // floating content surface (grey.50)
      paper: "#FFFFFF",
      muted: "#F1F5F9",
      sidebar: "#0F172A",
      header: "#FFFFFF",
    },
    /** Semantic status */
    info: {
      lighter: "#E0F2FE",
      light: "#38BDF8",
      main: "#0284C7",
      dark: "#0369A1",
      darker: "#0C4A6E",
      contrast: "#FFFFFF",
    },
    success: {
      lighter: "#D1FAE5",
      light: "#34D399",
      main: "#10B981",
      dark: "#047857",
      darker: "#064E3B",
      contrast: "#FFFFFF",
    },
    warning: {
      lighter: "#FEF3C7",
      light: "#FBBF24",
      main: "#D97706",
      dark: "#B45309",
      darker: "#78350F",
      contrast: "#FFFFFF",
    },
    error: {
      lighter: "#FEE2E2",
      light: "#F87171",
      main: "#E11D48",
      dark: "#BE123C",
      darker: "#881337",
      contrast: "#FFFFFF",
    },
    grey: {
      50: "#F8FAFC",
      100: "#F1F5F9",
      200: "#E2E8F0",
      300: "#CBD5E1",
      400: "#94A3B8",
      500: "#64748B",
      600: "#475569",
      700: "#334155",
      800: "#1E293B",
      900: "#0F172A",
    },
    border: "rgba(15, 23, 42, 0.08)",
  },

  /** Shared page frame — all module shells use this */
  layout: {
    pageMaxWidth: 1280,
    pagePb: { xs: 8, md: 4 } as const,
    navMb: 2.5, // SPACING.page
    stackGap: 2.5, // SPACING.page
    headerHeight: 64,
    recentBarHeight: 48,
  },

  shadows: {
    xs: "0 1px 2px rgba(15, 23, 42, 0.04)",
    sm: "0 1px 2px rgba(15, 23, 42, 0.06)",
    md: "0 1px 3px rgba(15, 23, 42, 0.08)",
    lg: "0 4px 12px rgba(15, 23, 42, 0.08)",
    xl: "0 8px 24px rgba(15, 23, 42, 0.10)",
    surface: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)",
  },
} as const;

export type ThemePlate = typeof THEME_PLATE;

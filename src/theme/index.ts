"use client";

import { createTheme } from "@mui/material/styles";
import { palette } from "./palette";
import { typography, FONT_PRIMARY } from "./typography";
import { componentsOverrides } from "./overrides";
import { SPACING, RADIUS, TYPE } from "./spacing";
import { THEME_PLATE } from "./plate";

declare module "@mui/material/styles" {
  interface PaletteColor {
    lighter?: string;
    darker?: string;
  }

  interface SimplePaletteColorOptions {
    lighter?: string;
    darker?: string;
  }

  interface TypeBackground {
    neutral: string;
  }

  interface Theme {
    customSpacing: typeof SPACING;
    customRadius: typeof RADIUS;
    customType: typeof TYPE;
    plate: typeof THEME_PLATE;
  }

  interface ThemeOptions {
    customSpacing?: typeof SPACING;
    customRadius?: typeof RADIUS;
    customType?: typeof TYPE;
    plate?: typeof THEME_PLATE;
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    soft: true;
    link: true;
  }
}

declare module "@mui/material/Chip" {
  interface ChipPropsVariantOverrides {
    soft: true;
  }
}

declare module "@mui/material/Alert" {
  interface AlertPropsVariantOverrides {
    soft: true;
  }
}

const baseTheme = createTheme({
  cssVariables: true,
  palette,
  typography,
  spacing: 8,
  shape: { borderRadius: RADIUS.control },
  customSpacing: SPACING,
  customRadius: RADIUS,
  customType: TYPE,
  plate: THEME_PLATE,
  shadows: [
    "none",
    THEME_PLATE.shadows.sm,
    THEME_PLATE.shadows.md,
    THEME_PLATE.shadows.lg,
    THEME_PLATE.shadows.xl,
    ...Array(20).fill(THEME_PLATE.shadows.xl),
  ] as unknown as ReturnType<typeof createTheme>["shadows"],
});

export const theme = createTheme(baseTheme, {
  components: componentsOverrides(baseTheme),
});

export { palette } from "./palette";
export { typography, FONT_PRIMARY } from "./typography";
export { SPACING, RADIUS, TYPE } from "./spacing";
export { THEME_PLATE } from "./plate";
export type { ThemePlate } from "./plate";

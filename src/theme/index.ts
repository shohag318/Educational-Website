"use client";

import { createTheme } from "@mui/material/styles";
import { palette } from "./palette";
import { typography } from "./typography";
import { componentsOverrides } from "./overrides";

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
  shape: { borderRadius: 12 },
  shadows: [
    "none",
    "0 1px 2px rgba(15, 23, 42, 0.06)",
    "0 1px 3px rgba(15, 23, 42, 0.08)",
    "0 4px 12px rgba(15, 23, 42, 0.08)",
    "0 8px 24px rgba(15, 23, 42, 0.10)",
    ...Array(20).fill("0 8px 24px rgba(15, 23, 42, 0.10)"),
  ] as unknown as ReturnType<typeof createTheme>["shadows"],
});

export const theme = createTheme(baseTheme, {
  components: componentsOverrides(baseTheme),
});

export { palette } from "./palette";
export { typography, FONT_PRIMARY } from "./typography";

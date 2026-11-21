import type { PaletteOptions } from "@mui/material/styles";
import { THEME_PLATE } from "./plate";

const { brand, ink, surface, info, success, warning, error, grey, border } = THEME_PLATE.colors;

/** MUI palette derived from THEME_PLATE — do not invent colors outside the plate. */
export const palette: PaletteOptions = {
  mode: "light",
  primary: {
    lighter: brand.lighter,
    light: brand.light,
    main: brand.main,
    dark: brand.dark,
    darker: brand.darker,
    contrastText: brand.contrast,
  },
  secondary: {
    lighter: grey[200],
    light: grey[400],
    main: grey[600],
    dark: grey[800],
    darker: grey[900],
    contrastText: ink.inverse,
  },
  info: {
    lighter: info.lighter,
    light: info.light,
    main: info.main,
    dark: info.dark,
    darker: info.darker,
    contrastText: info.contrast,
  },
  success: {
    lighter: success.lighter,
    light: success.light,
    main: success.main,
    dark: success.dark,
    darker: success.darker,
    contrastText: success.contrast,
  },
  warning: {
    lighter: warning.lighter,
    light: warning.light,
    main: warning.main,
    dark: warning.dark,
    darker: warning.darker,
    contrastText: warning.contrast,
  },
  error: {
    lighter: error.lighter,
    light: error.light,
    main: error.main,
    dark: error.dark,
    darker: error.darker,
    contrastText: error.contrast,
  },
  grey: { ...grey },
  text: {
    primary: ink.primary,
    secondary: ink.secondary,
    disabled: ink.disabled,
  },
  background: {
    default: surface.content,
    paper: surface.paper,
    neutral: surface.muted,
  },
  divider: border,
  action: {
    hover: "rgba(5, 150, 105, 0.06)",
    selected: "rgba(5, 150, 105, 0.12)",
    disabled: "rgba(15, 23, 42, 0.26)",
    disabledBackground: "rgba(15, 23, 42, 0.08)",
  },
};

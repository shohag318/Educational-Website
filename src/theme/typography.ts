import type { ThemeOptions } from "@mui/material/styles";
import { THEME_PLATE } from "./plate";
import { TYPE } from "./spacing";

/** Matches `next/font` CSS variable from `src/app/layout.tsx`. */
export const FONT_PRIMARY = THEME_PLATE.fonts.sans;

const W = THEME_PLATE.fonts.weights;

/**
 * Project-wide Roboto type scale (from THEME_PLATE).
 * Loaded weights via next/font: 300 / 400 / 500 / 700 (avoid 600/800).
 */
export const typography: NonNullable<ThemeOptions["typography"]> = {
  fontFamily: FONT_PRIMARY,
  fontSize: 14,
  htmlFontSize: 16,
  fontWeightLight: W.light,
  fontWeightRegular: W.regular,
  fontWeightMedium: W.medium,
  fontWeightBold: W.bold,
  h1: {
    fontFamily: FONT_PRIMARY,
    fontWeight: W.bold,
    fontSize: "2rem",
    lineHeight: 1.25,
    letterSpacing: "-0.02em",
  },
  h2: {
    fontFamily: FONT_PRIMARY,
    fontWeight: W.bold,
    fontSize: "1.75rem",
    lineHeight: 1.3,
    letterSpacing: "-0.02em",
  },
  h3: {
    fontFamily: FONT_PRIMARY,
    fontWeight: W.bold,
    fontSize: `${TYPE.h3 / 16}rem`,
    lineHeight: 1.35,
    letterSpacing: "-0.015em",
  },
  h4: {
    fontFamily: FONT_PRIMARY,
    fontWeight: W.bold,
    fontSize: `${TYPE.h4 / 16}rem`,
    lineHeight: 1.4,
    letterSpacing: "-0.01em",
  },
  h5: {
    fontFamily: FONT_PRIMARY,
    fontWeight: W.bold,
    fontSize: `${TYPE.h5 / 16}rem`,
    lineHeight: 1.4,
    letterSpacing: "-0.01em",
  },
  h6: {
    fontFamily: FONT_PRIMARY,
    fontWeight: W.bold,
    fontSize: `${TYPE.h6 / 16}rem`,
    lineHeight: 1.5,
  },
  subtitle1: {
    fontFamily: FONT_PRIMARY,
    fontWeight: W.medium,
    fontSize: `${TYPE.lg / 16}rem`,
    lineHeight: 1.5,
  },
  subtitle2: {
    fontFamily: FONT_PRIMARY,
    fontWeight: W.medium,
    fontSize: `${TYPE.md / 16}rem`,
    lineHeight: 1.5,
  },
  body1: {
    fontFamily: FONT_PRIMARY,
    fontWeight: W.regular,
    fontSize: `${TYPE.body / 16}rem`,
    lineHeight: 1.57,
  },
  body2: {
    fontFamily: FONT_PRIMARY,
    fontWeight: W.regular,
    fontSize: `${TYPE.md / 16}rem`,
    lineHeight: 1.5,
  },
  caption: {
    fontFamily: FONT_PRIMARY,
    fontWeight: W.medium,
    fontSize: `${TYPE.sm / 16}rem`,
    lineHeight: 1.5,
  },
  overline: {
    fontFamily: FONT_PRIMARY,
    fontSize: `${TYPE.xs / 16}rem`,
    fontWeight: W.bold,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    lineHeight: 1.5,
  },
  button: {
    fontFamily: FONT_PRIMARY,
    fontWeight: W.medium,
    textTransform: "none",
    fontSize: `${TYPE.md / 16}rem`,
  },
};

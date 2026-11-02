import type { ThemeOptions } from "@mui/material/styles";

export const typography: NonNullable<ThemeOptions["typography"]> = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  h1: { fontWeight: 800, fontSize: "2.25rem", lineHeight: 1.25 },
  h2: { fontWeight: 800, fontSize: "1.75rem", lineHeight: 1.3 },
  h3: { fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.35 },
  h4: { fontWeight: 700, fontSize: "1.25rem", lineHeight: 1.4 },
  h5: { fontWeight: 700, fontSize: "1.125rem", lineHeight: 1.45 },
  h6: { fontWeight: 700, fontSize: "1rem", lineHeight: 1.5 },
  subtitle1: { fontWeight: 600, fontSize: "0.9375rem", lineHeight: 1.5 },
  subtitle2: { fontWeight: 600, fontSize: "0.8125rem", lineHeight: 1.5 },
  body1: { fontSize: "0.9375rem", lineHeight: 1.6 },
  body2: { fontSize: "0.8125rem", lineHeight: 1.57 },
  caption: { fontSize: "0.75rem", lineHeight: 1.5, fontWeight: 500 },
  overline: {
    fontSize: "0.6875rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  button: { fontWeight: 600, textTransform: "none", fontSize: "0.8125rem" },
};

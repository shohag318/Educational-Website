import { alpha } from "@mui/material/styles";
import type { PaletteColor } from "@mui/material/styles";

export function softColor(color: PaletteColor) {
  return {
    color: color.dark,
    backgroundColor: alpha(color.main, 0.16),
    "&:hover": {
      backgroundColor: alpha(color.main, 0.32),
    },
  };
}

export function filledColor(color: PaletteColor) {
  return {
    color: color.contrastText,
    backgroundColor: color.main,
  };
}

export function linkColor(color: PaletteColor) {
  return {
    color: color.main,
    backgroundColor: "transparent",
    minWidth: 0,
    minHeight: 0,
    paddingLeft: 0,
    paddingRight: 0,
    fontWeight: 600,
    textDecoration: "underline",
    textUnderlineOffset: 3,
    "&:hover": {
      backgroundColor: "transparent",
      color: color.dark,
      textDecoration: "underline",
    },
  };
}

"use client";

import { Box, BoxProps } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";

export type LabelColor = "default" | "primary" | "secondary" | "info" | "success" | "warning" | "error";
export type LabelVariant = "filled" | "outlined" | "soft" | "inverted";

export interface LabelProps extends Omit<BoxProps, "color"> {
  color?: LabelColor;
  variant?: LabelVariant;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export function Label({
  children,
  color = "default",
  variant = "soft",
  startIcon,
  endIcon,
  sx,
  ...other
}: LabelProps) {
  const theme = useTheme();
  const paletteColor =
    color === "default"
      ? {
          lighter: theme.palette.grey[200],
          light: theme.palette.grey[400],
          main: theme.palette.grey[600],
          dark: theme.palette.grey[800],
          contrastText: theme.palette.common.white,
        }
      : theme.palette[color];

  const styles = {
    filled: {
      color: paletteColor.contrastText,
      backgroundColor: paletteColor.main,
    },
    outlined: {
      color: paletteColor.main,
      backgroundColor: "transparent",
      border: `1px solid ${paletteColor.main}`,
    },
    soft: {
      color: paletteColor.dark,
      backgroundColor: alpha(paletteColor.main, 0.16),
    },
    inverted: {
      color: paletteColor.main,
      backgroundColor: theme.palette.common.white,
      border: `1px solid ${alpha(paletteColor.main, 0.24)}`,
    },
  }[variant];

  return (
    <Box
      component="span"
      sx={{
        height: 24,
        minWidth: 24,
        lineHeight: 0,
        borderRadius: 0.75,
        cursor: "default",
        alignItems: "center",
        whiteSpace: "nowrap",
        display: "inline-flex",
        justifyContent: "center",
        px: 0.75,
        fontSize: 12,
        fontWeight: 700,
        gap: 0.5,
        ...styles,
        ...sx,
      }}
      {...other}
    >
      {startIcon}
      {children}
      {endIcon}
    </Box>
  );
}

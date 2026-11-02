"use client";

import { Button, ButtonProps, CircularProgress } from "@mui/material";

export const APP_BUTTON_COLORS = ["inherit", "primary", "secondary", "info", "success", "warning", "error"] as const;

export const APP_BUTTON_VARIANTS = [
  "contained",
  "outlined",
  "outline",
  "text",
  "ghost",
  "soft",
  "link",
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
  "danger",
  "destructive",
] as const;

export type AppButtonColor = (typeof APP_BUTTON_COLORS)[number];
export type AppButtonVariant = (typeof APP_BUTTON_VARIANTS)[number];

type MuiButtonColor = NonNullable<ButtonProps["color"]>;

const VARIANT_PRESETS: Record<AppButtonVariant, { variant: "contained" | "outlined"; color?: AppButtonColor }> = {
  contained: { variant: "contained" },
  outlined: { variant: "outlined" },
  outline: { variant: "outlined" },
  text: { variant: "outlined" },
  ghost: { variant: "outlined" },
  soft: { variant: "outlined" },
  link: { variant: "outlined" },
  primary: { variant: "contained", color: "primary" },
  secondary: { variant: "contained", color: "secondary" },
  info: { variant: "contained", color: "info" },
  success: { variant: "contained", color: "success" },
  warning: { variant: "contained", color: "warning" },
  error: { variant: "contained", color: "error" },
  danger: { variant: "contained", color: "error" },
  destructive: { variant: "contained", color: "error" },
};

export type AppButtonProps = Omit<ButtonProps, "variant" | "color"> & {
  variant?: AppButtonVariant;
  color?: AppButtonColor;
  loading?: boolean;
};

function resolveButtonLook(variant?: AppButtonVariant, color?: AppButtonColor) {
  const preset = variant ? VARIANT_PRESETS[variant] : { variant: "contained" as const };
  return {
    variant: preset.variant,
    color: (color ?? preset.color) as MuiButtonColor | undefined,
  };
}

export function AppButton({
  loading,
  disabled,
  children,
  startIcon,
  variant,
  color,
  ...props
}: AppButtonProps) {
  const look = resolveButtonLook(variant, color);

  return (
    <Button
      {...props}
      variant={look.variant}
      color={look.color}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress color="inherit" size={16} /> : startIcon}
    >
      {children}
    </Button>
  );
}

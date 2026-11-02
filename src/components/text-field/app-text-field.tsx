"use client";

import { ReactNode } from "react";
import { InputAdornment, TextField, TextFieldProps } from "@mui/material";

type AppTextFieldProps = TextFieldProps & {
  InputProps?: Record<string, unknown>;
  InputLabelProps?: Record<string, unknown>;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
};

export function AppTextField({
  InputProps,
  InputLabelProps,
  slotProps,
  startIcon,
  endIcon,
  ...props
}: AppTextFieldProps) {
  const existingInput = typeof slotProps?.input === "object" && slotProps.input ? slotProps.input : {};
  const existingLabel = typeof slotProps?.inputLabel === "object" && slotProps.inputLabel ? slotProps.inputLabel : {};

  return (
    <TextField
      fullWidth
      size="small"
      variant="outlined"
      slotProps={{
        ...slotProps,
        input: {
          startAdornment: startIcon ? <InputAdornment position="start">{startIcon}</InputAdornment> : undefined,
          endAdornment: endIcon ? <InputAdornment position="end">{endIcon}</InputAdornment> : undefined,
          ...(InputProps || {}),
          ...existingInput,
        },
        inputLabel: {
          ...(InputLabelProps || {}),
          ...existingLabel,
        },
      }}
      {...props}
    />
  );
}

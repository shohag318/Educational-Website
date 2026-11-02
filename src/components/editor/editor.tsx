"use client";

import { AppTextField } from "@/components/text-field/app-text-field";
import { Typography } from "@mui/material";

interface EditorProps {
  value: string;
  placeholder?: string;
  minRows?: number;
  onChange: (value: string) => void;
}

export function Editor({ value, placeholder, minRows = 8, onChange }: EditorProps) {
  return (
    <>
      <AppTextField
        multiline
        minRows={minRows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <Typography variant="caption" color="text.secondary">
        {value.length} characters
      </Typography>
    </>
  );
}

"use client";

import { IconButton, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { AppTextField } from "@/components/text-field/app-text-field";

interface NumberInputProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function NumberInput({ value, min = 0, max = 999, step = 1, disabled, onChange }: NumberInputProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
      <IconButton size="small" disabled={disabled || value <= min} onClick={() => onChange(clamp(value - step))}>
        <RemoveIcon fontSize="small" />
      </IconButton>
      <AppTextField
        type="number"
        value={String(value)}
        disabled={disabled}
        onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
        sx={{ width: 88, "& input": { textAlign: "center" } }}
      />
      <IconButton size="small" disabled={disabled || value >= max} onClick={() => onChange(clamp(value + step))}>
        <AddIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}

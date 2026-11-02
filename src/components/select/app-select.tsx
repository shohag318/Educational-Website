"use client";

import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";

export interface AppSelectOption {
  value: string;
  label: string;
}

interface AppSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: AppSelectOption[];
  fullWidth?: boolean;
  disabled?: boolean;
  sx?: object;
}

export function AppSelect({
  label,
  value,
  onChange,
  options,
  fullWidth = true,
  disabled,
  sx,
}: AppSelectProps) {
  const handleChange = (event: SelectChangeEvent) => onChange(event.target.value);

  return (
    <FormControl size="small" fullWidth={fullWidth} disabled={disabled} sx={sx}>
      {label && <InputLabel>{label}</InputLabel>}
      <Select value={value} label={label} onChange={handleChange}>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

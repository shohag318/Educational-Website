"use client";

import { ReactNode } from "react";
import dayjs, { Dayjs } from "dayjs";
import { CalendarMonthIcon, AccessTimeIcon } from "@/components/iconify/mui-icons";
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTimePicker as MuiDateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { TimePicker as MuiTimePicker } from "@mui/x-date-pickers/TimePicker";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { SxProps, Theme } from "@mui/material/styles";
import { Box, Stack } from "@/components/mui";

type TextFieldSlotProps = {
  label?: ReactNode;
  helperText?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  name?: string;
  fullWidth?: boolean;
  placeholder?: string;
  size?: "small" | "medium";
};

function toDayjs(value?: string | null): Dayjs | null {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

const fieldSlot = (props: TextFieldSlotProps) => ({
  textField: {
    fullWidth: props.fullWidth ?? true,
    size: props.size ?? "small",
    label: props.label,
    helperText: props.helperText,
    required: props.required,
    disabled: props.disabled,
    error: props.error,
    name: props.name,
    placeholder: props.placeholder,
  },
  openPickerButton: { color: "primary" as const },
  desktopPaper: {
    sx: {
      borderRadius: 2,
      boxShadow: "0 8px 24px rgba(15, 23, 42, 0.10)",
      border: "1px solid rgba(15, 23, 42, 0.08)",
    },
  },
});

export interface DatePickerProps extends TextFieldSlotProps {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  format?: string;
  sx?: SxProps<Theme>;
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  format = "DD MMM YYYY",
  sx,
  ...field
}: DatePickerProps) {
  return (
    <MuiDatePicker
      value={toDayjs(value)}
      onChange={(next) => onChange(next && next.isValid() ? next.format("YYYY-MM-DD") : "")}
      minDate={toDayjs(minDate) || undefined}
      maxDate={toDayjs(maxDate) || undefined}
      format={format}
      slots={{ openPickerIcon: CalendarMonthIcon }}
      slotProps={fieldSlot(field)}
      sx={sx}
    />
  );
}

export function DateTimePicker({
  value,
  onChange,
  minDate,
  maxDate,
  format = "DD MMM YYYY HH:mm",
  sx,
  ...field
}: DatePickerProps) {
  return (
    <MuiDateTimePicker
      value={toDayjs(value)}
      onChange={(next) => onChange(next && next.isValid() ? next.format("YYYY-MM-DDTHH:mm") : "")}
      minDate={toDayjs(minDate) || undefined}
      maxDate={toDayjs(maxDate) || undefined}
      format={format}
      ampm={false}
      slots={{ openPickerIcon: CalendarMonthIcon }}
      slotProps={fieldSlot(field)}
      sx={sx}
    />
  );
}

export function TimePicker({
  value,
  onChange,
  format = "HH:mm",
  sx,
  ...field
}: Omit<DatePickerProps, "minDate" | "maxDate">) {
  return (
    <MuiTimePicker
      value={toDayjs(value ? `2000-01-01T${value}` : null)}
      onChange={(next) => onChange(next && next.isValid() ? next.format("HH:mm") : "")}
      format={format}
      ampm={false}
      slots={{ openPickerIcon: AccessTimeIcon }}
      slotProps={fieldSlot(field)}
      sx={sx}
    />
  );
}

export interface DateRangePickerProps {
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  startLabel?: string;
  endLabel?: string;
  startHelperText?: ReactNode;
  endHelperText?: ReactNode;
  required?: boolean;
  disabled?: boolean;
}

export function DateRangePicker({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  startLabel = "Start date",
  endLabel = "End date",
  startHelperText,
  endHelperText,
  required,
  disabled,
}: DateRangePickerProps) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
      <DatePicker
        label={startLabel}
        value={startValue}
        onChange={onStartChange}
        maxDate={endValue}
        helperText={startHelperText}
        required={required}
        disabled={disabled}
      />
      <DatePicker
        label={endLabel}
        value={endValue}
        onChange={onEndChange}
        minDate={startValue}
        helperText={endHelperText}
        required={required}
        disabled={disabled}
      />
    </Stack>
  );
}

export interface CalendarProps {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
}

export function Calendar({ value, onChange, minDate, maxDate }: CalendarProps) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
        display: "inline-flex",
      }}
    >
      <DateCalendar
        value={toDayjs(value)}
        onChange={(next) => onChange(next && next.isValid() ? next.format("YYYY-MM-DD") : "")}
        minDate={toDayjs(minDate) || undefined}
        maxDate={toDayjs(maxDate) || undefined}
      />
    </Box>
  );
}

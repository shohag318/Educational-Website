"use client";

import { Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { AppButton } from "@/components/button/app-button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  content?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  content,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading,
  danger,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      {content && (
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {content}
          </Typography>
        </DialogContent>
      )}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <AppButton onClick={onClose} variant="outlined" color="error">
          {cancelLabel}
        </AppButton>
        <AppButton onClick={onConfirm} color={danger ? "error" : "primary"} variant="contained" loading={loading}>
          {confirmLabel}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}

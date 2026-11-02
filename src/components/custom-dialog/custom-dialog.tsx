"use client";

import { Dialog, DialogActions, DialogContent, DialogTitle, DialogProps } from "@mui/material";
import type { ReactNode } from "react";
import { AppButton } from "@/components/button/app-button";

export { ConfirmDialog } from "@/components/dialog/confirm-dialog";

interface CustomDialogProps extends Omit<DialogProps, "title" | "content"> {
  title?: string;
  content?: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
}

export function CustomDialog({ open, title, content, actions, children, onClose, ...other }: CustomDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth {...other}>
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent>{content || children}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <AppButton variant="outlined" color="error" onClick={onClose}>
          Close
        </AppButton>
        {actions}
      </DialogActions>
    </Dialog>
  );
}

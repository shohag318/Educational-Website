"use client";

import { Dialog, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface LightboxProps {
  open: boolean;
  src?: string;
  alt?: string;
  onClose: () => void;
}

export function Lightbox({ open, src, alt = "Preview", onClose }: LightboxProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <IconButton onClick={onClose} sx={{ position: "absolute", top: 8, right: 8, bgcolor: "background.paper" }}>
        <CloseIcon />
      </IconButton>
      {src && (
        <img src={src} alt={alt} style={{ width: "100%", display: "block", maxHeight: "80vh", objectFit: "contain" }} />
      )}
    </Dialog>
  );
}

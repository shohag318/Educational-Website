"use client";

import { useCallback, useState, MouseEvent } from "react";
import { Popover, PopoverProps } from "@mui/material";

export function usePopover() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const onOpen = useCallback((event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const onClose = useCallback(() => setAnchorEl(null), []);

  return {
    open: Boolean(anchorEl),
    anchorEl,
    onOpen,
    onClose,
    setAnchorEl,
  };
}

interface CustomPopoverProps extends Omit<PopoverProps, "open"> {
  open: boolean;
}

export function CustomPopover({ children, open, anchorEl, onClose, sx, ...other }: CustomPopoverProps) {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          sx: { p: 1, width: 200, overflow: "inherit", ...sx },
        },
      }}
      {...other}
    >
      {children}
    </Popover>
  );
}

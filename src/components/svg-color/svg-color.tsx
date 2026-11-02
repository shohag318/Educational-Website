"use client";

import { Box, BoxProps } from "@mui/material";
import { forwardRef } from "react";

interface SvgColorProps extends BoxProps {
  src: string;
}

export const SvgColor = forwardRef<HTMLSpanElement, SvgColorProps>(function SvgColor({ src, sx, ...other }, ref) {
  return (
    <Box
      ref={ref}
      component="span"
      sx={{
        width: 24,
        height: 24,
        display: "inline-block",
        bgcolor: "currentColor",
        mask: `url(${src}) no-repeat center / contain`,
        WebkitMask: `url(${src}) no-repeat center / contain`,
        ...sx,
      }}
      {...other}
    />
  );
});

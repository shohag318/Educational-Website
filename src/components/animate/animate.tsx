"use client";

import { Fade, Grow, Slide, Zoom, FadeProps, GrowProps, SlideProps, ZoomProps } from "@mui/material";
import { Box } from "@mui/material";
import type { ReactNode } from "react";

export function MotionContainer({ children, sx }: { children: ReactNode; sx?: object }) {
  return (
    <Box
      sx={{
        "@keyframes fadeInUp": {
          from: { opacity: 0, transform: "translate3d(0, 24px, 0)" },
          to: { opacity: 1, transform: "translate3d(0, 0, 0)" },
        },
        animation: "fadeInUp 0.4s ease",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

export function AnimateFade(props: FadeProps) {
  return <Fade timeout={400} {...props} />;
}

export function AnimateGrow(props: GrowProps) {
  return <Grow timeout={400} {...props} />;
}

export function AnimateSlide(props: SlideProps) {
  return <Slide timeout={400} {...props} />;
}

export function AnimateZoom(props: ZoomProps) {
  return <Zoom timeout={400} {...props} />;
}

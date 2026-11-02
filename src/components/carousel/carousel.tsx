"use client";

import { Box, IconButton, Stack } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Children, ReactNode, useRef } from "react";

interface CarouselProps {
  children: ReactNode;
  itemWidth?: number | string;
}

export function Carousel({ children, itemWidth = "80%" }: CarouselProps) {
  const ref = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: number) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <Box sx={{ position: "relative" }}>
      <IconButton onClick={() => scrollBy(-1)} sx={{ position: "absolute", left: 8, top: "50%", zIndex: 1, bgcolor: "background.paper" }}>
        <ChevronLeftIcon />
      </IconButton>
      <IconButton onClick={() => scrollBy(1)} sx={{ position: "absolute", right: 8, top: "50%", zIndex: 1, bgcolor: "background.paper" }}>
        <ChevronRightIcon />
      </IconButton>
      <Stack
        ref={ref}
        direction="row"
        spacing={2}
        sx={{ overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" }, px: 6 }}
      >
        {Children.map(children, (child, index) => (
          <Box key={index} sx={{ minWidth: itemWidth, scrollSnapAlign: "start" }}>
            {child}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

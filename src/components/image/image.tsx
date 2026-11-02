"use client";

import { Box, BoxProps } from "@mui/material";

interface ImageProps extends BoxProps {
  src: string;
  alt: string;
  ratio?: "1/1" | "4/3" | "16/9" | "21/9";
}

const RATIO: Record<NonNullable<ImageProps["ratio"]>, string> = {
  "1/1": "100%",
  "4/3": "75%",
  "16/9": "56.25%",
  "21/9": "42.85%",
};

export function Image({ src, alt, ratio = "16/9", sx, ...other }: ImageProps) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 2,
        pt: RATIO[ratio],
        bgcolor: "grey.100",
        ...sx,
      }}
      {...other}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    </Box>
  );
}

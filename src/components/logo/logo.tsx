"use client";

import Link from "next/link";
import { Box, Stack, Typography } from "@mui/material";
import { CONFIG, PATHS } from "@/config-global";

interface LogoProps {
  disabledLink?: boolean;
}

export function Logo({ disabledLink }: LogoProps) {
  const content = (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          bgcolor: "primary.main",
          color: "common.white",
          display: "grid",
          placeItems: "center",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        NCTB
      </Box>
      <Typography variant="subtitle2">{CONFIG.appName}</Typography>
    </Stack>
  );

  if (disabledLink) return content;
  return (
    <Box component={Link} href={PATHS.root} sx={{ display: "inline-flex", textDecoration: "none", color: "inherit" }}>
      {content}
    </Box>
  );
}

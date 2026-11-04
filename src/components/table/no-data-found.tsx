"use client";

import { Box, Typography, type BoxProps } from "@mui/material";
import { Iconify } from "@/components/iconify/iconify";

interface NoDataFoundProps {
  icon?: string;
  sx?: BoxProps["sx"];
}

/** Centered empty state: dashed border, light grey bg, icon + "No Data Found". */
export function NoDataFound({
  icon = "solar:inbox-bold-duotone",
  sx,
}: NoDataFoundProps) {
  return (
    <Box
      sx={{
        m: 1.5,
        py: 5,
        px: 2,
        minHeight: 180,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        border: "1px dashed",
        borderColor: "grey.300",
        borderRadius: 1.5,
        bgcolor: "grey.50",
        ...sx,
      }}
    >
      <Iconify icon={icon} width={40} sx={{ color: "text.disabled", mb: 1.25 }} />
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, color: "text.secondary", letterSpacing: 0.2 }}
      >
        No Data Found
      </Typography>
    </Box>
  );
}

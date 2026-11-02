"use client";

import { Tabs, TabsProps } from "@mui/material";

export function CustomTabs({ children, sx, ...other }: TabsProps) {
  return (
    <Tabs
      variant="scrollable"
      allowScrollButtonsMobile
      sx={{
        minHeight: 40,
        "& .MuiTabs-indicator": { height: 3, borderRadius: 99 },
        ...sx,
      }}
      {...other}
    >
      {children}
    </Tabs>
  );
}

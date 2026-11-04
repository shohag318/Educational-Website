"use client";

import { Icon, type IconProps } from "@iconify/react";
import { Box, type BoxProps } from "@mui/material";
import { forwardRef } from "react";

export type IconifyProps = BoxProps & {
  icon: IconProps["icon"];
  width?: number | string;
};

export const Iconify = forwardRef<SVGElement, IconifyProps>(function Iconify(
  { icon, width = 20, sx, ...other },
  ref
) {
  return (
    <Box
      ref={ref}
      component={Icon}
      icon={icon}
      sx={{
        width,
        height: width,
        flexShrink: 0,
        display: "inline-flex",
        ...sx,
      }}
      {...other}
    />
  );
});

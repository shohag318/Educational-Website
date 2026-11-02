"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Box, Chip, Stack } from "@mui/material";

export interface ModuleNavItem {
  href: string;
  aliases?: string[];
  label: string;
  badge?: string;
  badgeColor?: string;
  description?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export interface ModuleMenuBarProps {
  moduleName: string;
  items: ModuleNavItem[];
  activeTheme?: "emerald" | "violet" | "amber" | "cyan" | "purple" | "blue";
}

const themeColors = {
  emerald: { main: "#059669", hover: "rgba(5, 150, 105, 0.08)" },
  violet: { main: "#7C3AED", hover: "rgba(124, 58, 237, 0.08)" },
  amber: { main: "#D97706", hover: "rgba(217, 119, 6, 0.08)" },
  cyan: { main: "#0E7490", hover: "rgba(14, 116, 144, 0.08)" },
  purple: { main: "#6D28D9", hover: "rgba(109, 40, 217, 0.08)" },
  blue: { main: "#2563EB", hover: "rgba(37, 99, 235, 0.08)" },
};

export function ModuleMenuBar({
  moduleName,
  items,
  activeTheme = "emerald",
}: ModuleMenuBarProps) {
  const pathname = usePathname();
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const colors = themeColors[activeTheme] || themeColors.emerald;

  useEffect(() => {
    setOptimisticHref(null);
  }, [pathname]);

  const activeHref = optimisticHref || pathname;

  useEffect(() => {
    if (!trackRef.current) return;
    const activeEl = trackRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [activeHref]);

  return (
    <Box className="no-print" sx={{ width: "100%", mb: 3 }}>
      <Stack
        direction="row"
        spacing={{ xs: 0.75, sm: 1.25 }}
        sx={{
          alignItems: "center",
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          borderRadius: 3,
          p: { xs: 0.75, sm: 1.25 },
          minHeight: { xs: 48, sm: 58 },
          overflow: "hidden",
        }}
      >
        <Chip
          label={moduleName}
          sx={{
            bgcolor: colors.main,
            color: "#fff",
            fontWeight: 700,
            borderRadius: 2,
            height: { xs: 32, sm: 36 },
            flexShrink: 0,
          }}
        />
        <Stack
          ref={trackRef}
          direction="row"
          spacing={0.5}
          className="no-scrollbar"
          sx={{
            flex: 1,
            minWidth: 0,
            overflowX: "auto",
            bgcolor: "grey.50",
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            p: 0.5,
            height: 40,
          }}
        >
          {items.map((item) => {
            const isActive =
              activeHref === item.href ||
              (item.aliases && item.aliases.some((alias) => activeHref === alias));

            return (
              <Box
                key={item.href}
                component={Link}
                href={item.href}
                prefetch
                scroll={false}
                data-active={isActive ? "true" : "false"}
                title={item.description || item.label}
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  if (item.onClick) item.onClick(e);
                  if (!e.defaultPrevented) setOptimisticHref(item.href);
                }}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.5,
                  height: 32,
                  borderRadius: 1.5,
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  flexShrink: 0,
                  color: isActive ? "#fff" : "text.secondary",
                  bgcolor: isActive ? colors.main : "transparent",
                  "&:hover": {
                    bgcolor: isActive ? colors.main : colors.hover,
                    color: isActive ? "#fff" : "text.primary",
                  },
                }}
              >
                {item.label}
                {item.badge && (
                  <Chip
                    size="small"
                    label={item.badge}
                    sx={{
                      height: 18,
                      fontSize: 9,
                      fontWeight: 800,
                      bgcolor: isActive ? "rgba(255,255,255,0.2)" : "grey.200",
                      color: isActive ? "#fff" : "text.primary",
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Stack>
      </Stack>
    </Box>
  );
}

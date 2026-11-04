"use client";

import Link from "next/link";
import { Box, Breadcrumbs, Link as MuiLink, Stack, Typography } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import type { ReactNode } from "react";

export interface BreadcrumbLink {
  name: string;
  href?: string;
  icon?: ReactNode;
}

interface CustomBreadcrumbsProps {
  heading?: string;
  links: BreadcrumbLink[];
  action?: ReactNode;
  moreLink?: string[];
}

export function CustomBreadcrumbs({ heading, links, action, moreLink }: CustomBreadcrumbsProps) {
  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "flex-start" }, justifyContent: "space-between" }}>
        <Box>
          {heading && (
            <Typography variant="h5" sx={{ mb: 1 }}>
              {heading}
            </Typography>
          )}
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
            {links.map((link, index) => {
              const last = index === links.length - 1;
              const content = (
                <Stack component="span" direction="row" spacing={0.5} sx={{ alignItems: "center", display: "inline-flex" }}>
                  {link.icon}
                  <Box component="span">{link.name}</Box>
                </Stack>
              );
              if (last || !link.href) {
                return (
                  <Typography key={link.name} component="span" color="text.primary" variant="body2">
                    {content}
                  </Typography>
                );
              }
              return (
                <MuiLink key={link.name} component={Link} href={link.href} underline="hover" color="inherit" variant="body2">
                  {content}
                </MuiLink>
              );
            })}
          </Breadcrumbs>
        </Box>
        {action}
      </Stack>
      {moreLink && moreLink.length > 0 && (
        <Stack spacing={0.5}>
          {moreLink.map((href) => (
            <MuiLink key={href} href={href} target="_blank" rel="noopener" variant="caption">
              {href}
            </MuiLink>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

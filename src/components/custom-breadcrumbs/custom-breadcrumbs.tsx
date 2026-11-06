"use client";

import Link from "next/link";
import { Box, Breadcrumbs, Link as MuiLink, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

export interface BreadcrumbLink {
  name: string;
  href?: string;
  /** Kept for call-site compatibility; not rendered (screenshot style is text-only). */
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
    <Stack spacing={1} sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ alignItems: { sm: "flex-start" }, justifyContent: "space-between" }}
      >
        <Box sx={{ minWidth: 0 }}>
          {heading ? (
            <Typography
              variant="h5"
              sx={{
                mb: 0.75,
                fontWeight: 600,
                letterSpacing: -0.15,
                color: "text.primary",
                fontSize: { xs: 18, sm: 20 },
                lineHeight: 1.3,
              }}
            >
              {heading}
            </Typography>
          ) : null}

          <Breadcrumbs
            separator={
              <Box
                component="span"
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  bgcolor: "grey.400",
                  display: "inline-block",
                  mx: 0.25,
                }}
              />
            }
            sx={{
              "& .MuiBreadcrumbs-ol": { flexWrap: "wrap", rowGap: 0.5, alignItems: "center" },
              "& .MuiBreadcrumbs-li": { display: "inline-flex", alignItems: "center" },
              "& .MuiBreadcrumbs-separator": { mx: 0.75 },
            }}
          >
            {links.map((link, index) => {
              const last = index === links.length - 1;

              if (last || !link.href) {
                return (
                  <Typography
                    key={`${link.name}-${index}`}
                    component="span"
                    variant="body2"
                    sx={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "text.disabled",
                      lineHeight: 1.5,
                    }}
                  >
                    {link.name}
                  </Typography>
                );
              }

              return (
                <MuiLink
                  key={`${link.name}-${index}`}
                  component={Link}
                  href={link.href}
                  underline="hover"
                  variant="body2"
                  sx={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "text.secondary",
                    lineHeight: 1.5,
                    "&:hover": { color: "text.primary" },
                  }}
                >
                  {link.name}
                </MuiLink>
              );
            })}
          </Breadcrumbs>
        </Box>

        {action ? (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              width: { xs: 1, sm: "auto" },
              justifyContent: { xs: "stretch", sm: "flex-end" },
              "& > *": { flexShrink: 0 },
            }}
          >
            {action}
          </Box>
        ) : null}
      </Stack>

      {moreLink && moreLink.length > 0 ? (
        <Stack spacing={0.5}>
          {moreLink.map((href) => (
            <MuiLink key={href} href={href} target="_blank" rel="noopener" variant="caption">
              {href}
            </MuiLink>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}

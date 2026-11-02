"use client";

import { Box, BoxProps } from "@mui/material";

interface MarkdownProps extends BoxProps {
  children: string;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toHtml(markdown: string) {
  return escapeHtml(markdown)
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br />");
}

export function Markdown({ children, sx, ...other }: MarkdownProps) {
  return (
    <Box
      sx={{
        typography: "body2",
        "& h1, & h2, & h3": { mt: 2, mb: 1 },
        "& code": { px: 0.5, py: 0.25, bgcolor: "grey.100", borderRadius: 0.5 },
        ...sx,
      }}
      dangerouslySetInnerHTML={{ __html: toHtml(children) }}
      {...other}
    />
  );
}

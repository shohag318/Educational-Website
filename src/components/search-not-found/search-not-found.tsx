"use client";

import { Box, Typography } from "@mui/material";
import { SearchOffIcon } from "@/components/iconify/mui-icons";
interface SearchNotFoundProps {
  query?: string;
}

export function SearchNotFound({ query }: SearchNotFoundProps) {
  return (
    <Box sx={{ textAlign: "center", py: 6 }}>
      <SearchOffIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
      <Typography variant="subtitle1">No results found</Typography>
      {query && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          No matches for “{query}”. Try a different keyword.
        </Typography>
      )}
    </Box>
  );
}

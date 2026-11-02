"use client";

import { Box, Stack, Typography } from "@mui/material";

interface ChartSeries {
  label: string;
  value: number;
  color?: string;
}

interface SimpleChartProps {
  title?: string;
  series: ChartSeries[];
}

export function Chart({ title, series }: SimpleChartProps) {
  const max = Math.max(...series.map((item) => item.value), 1);

  return (
    <Box>
      {title && (
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      <Stack spacing={1.5}>
        {series.map((item) => (
          <Box key={item.label}>
            <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="caption">{item.label}</Typography>
              <Typography variant="caption">{item.value}</Typography>
            </Stack>
            <Box sx={{ height: 8, borderRadius: 99, bgcolor: "grey.100", overflow: "hidden" }}>
              <Box
                sx={{
                  width: `${(item.value / max) * 100}%`,
                  height: "100%",
                  bgcolor: item.color || "primary.main",
                  borderRadius: 99,
                }}
              />
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

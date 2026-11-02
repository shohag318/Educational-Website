"use client";

import { Card, CardContent, CardHeader, CardProps, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface AppCardProps extends CardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function AppCard({ title, action, children, ...props }: AppCardProps) {
  return (
    <Card {...props}>
      {title && (
        <CardHeader
          title={
            <Typography variant="subtitle2" color="text.primary">
              {title}
            </Typography>
          }
          action={action}
          sx={{ pb: 0 }}
        />
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

"use client";

import { ReactNode } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/en-gb";
import { theme } from "./index";
import { SnackbarProvider } from "@/components/snackbar/snackbar";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <MuiThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
          <CssBaseline />
          <SnackbarProvider>{children}</SnackbarProvider>
        </LocalizationProvider>
      </MuiThemeProvider>
    </AppRouterCacheProvider>
  );
}

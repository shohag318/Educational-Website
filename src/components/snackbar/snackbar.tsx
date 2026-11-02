"use client";

import { Alert, AlertColor, Snackbar } from "@mui/material";
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

interface Toast {
  id: number;
  message: string;
  severity: AlertColor;
}

interface SnackbarContextValue {
  enqueueSnackbar: (message: string, options?: { variant?: AlertColor }) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const enqueueSnackbar = useCallback((message: string, options?: { variant?: AlertColor }) => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), message, severity: options?.variant || "success" }]);
  }, []);

  const value = useMemo(() => ({ enqueueSnackbar }), [enqueueSnackbar]);
  const current = toasts[0];

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={Boolean(current)}
        autoHideDuration={4000}
        onClose={() => setToasts((prev) => prev.slice(1))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {current ? (
          <Alert variant="filled" severity={current.severity} onClose={() => setToasts((prev) => prev.slice(1))}>
            {current.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) {
    return {
      enqueueSnackbar: (message: string) => {
        console.warn("SnackbarProvider is missing:", message);
      },
    };
  }
  return ctx;
}

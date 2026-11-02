"use client";

import { LinearProgress } from "@mui/material";
import { useEffect, useState } from "react";

export function ProgressBar() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setValue(total > 0 ? (el.scrollTop / total) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <LinearProgress
      variant="determinate"
      value={value}
      sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1400, height: 3 }}
    />
  );
}

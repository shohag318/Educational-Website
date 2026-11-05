"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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
  /** @deprecated Not shown in the tab bar anymore. Kept for call-site compatibility. */
  moduleName?: string;
  items: ModuleNavItem[];
  activeTheme?: "emerald" | "violet" | "amber" | "cyan" | "purple" | "blue";
}

const TAB_THEME = {
  emerald: {
    accent: "shadow-[inset_0_2px_0_0_#059669]",
    label: "text-emerald-950",
    focus: "focus-visible:ring-emerald-600/35",
    badge: "bg-emerald-600 text-white",
  },
  violet: {
    accent: "shadow-[inset_0_2px_0_0_#7c3aed]",
    label: "text-violet-950",
    focus: "focus-visible:ring-violet-600/35",
    badge: "bg-violet-600 text-white",
  },
  amber: {
    accent: "shadow-[inset_0_2px_0_0_#d97706]",
    label: "text-amber-950",
    focus: "focus-visible:ring-amber-600/35",
    badge: "bg-amber-600 text-white",
  },
  cyan: {
    accent: "shadow-[inset_0_2px_0_0_#0891b2]",
    label: "text-cyan-950",
    focus: "focus-visible:ring-cyan-600/35",
    badge: "bg-cyan-700 text-white",
  },
  purple: {
    accent: "shadow-[inset_0_2px_0_0_#7e22ce]",
    label: "text-purple-950",
    focus: "focus-visible:ring-purple-600/35",
    badge: "bg-purple-700 text-white",
  },
  blue: {
    accent: "shadow-[inset_0_2px_0_0_#2563eb]",
    label: "text-blue-950",
    focus: "focus-visible:ring-blue-600/35",
    badge: "bg-blue-600 text-white",
  },
} as const;

export function ModuleMenuBar({ items, activeTheme = "emerald" }: ModuleMenuBarProps) {
  const theme = TAB_THEME[activeTheme];
  const pathname = usePathname();
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

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
    <div className="no-print mb-6 w-full">
      <div
        ref={trackRef}
        className="no-scrollbar relative flex w-full gap-0.5 overflow-x-auto bg-transparent p-0 before:absolute before:inset-x-0 before:bottom-0 before:z-0 before:h-px before:bg-slate-200"
      >
        {items.map((item) => {
          const isActive =
            activeHref === item.href ||
            (item.aliases && item.aliases.some((alias) => activeHref === alias));

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              scroll={false}
              data-active={isActive ? "true" : "false"}
              title={item.description || item.label}
              onClick={(e) => {
                if (item.onClick) item.onClick(e);
                if (!e.defaultPrevented) setOptimisticHref(item.href);
              }}
              className={cn(
                "relative -mb-px inline-flex shrink-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-t-md rounded-b-none border px-4 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                theme.focus,
                isActive
                  ? cn(
                      "z-10 border-slate-200 border-b-white bg-white font-semibold",
                      theme.accent,
                      theme.label
                    )
                  : "z-[1] border-slate-200 border-b-transparent bg-slate-100 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-900"
              )}
            >
              {item.label}
              {item.badge ? (
                <span
                  className={cn(
                    "inline-flex h-[18px] items-center rounded px-1.5 text-[10px] font-bold",
                    isActive ? theme.badge : "bg-slate-200 text-slate-600"
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

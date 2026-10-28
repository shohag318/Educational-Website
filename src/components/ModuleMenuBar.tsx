"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

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
  moduleName: string;
  items: ModuleNavItem[];
  activeTheme?: "emerald" | "violet" | "amber" | "cyan" | "purple" | "blue";
}

export function ModuleMenuBar({
  moduleName,
  items,
  activeTheme = "emerald",
}: ModuleMenuBarProps) {
  const pathname = usePathname();
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Sync optimistic active state whenever route completes change
  useEffect(() => {
    setOptimisticHref(null);
  }, [pathname]);

  const activeHref = optimisticHref || pathname;

  // Auto-scroll track smoothly if active item is partially out of view
  useEffect(() => {
    if (!trackRef.current) return;
    const activeEl = trackRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [activeHref]);

  const themeStyles = {
    emerald: {
      pill: "bg-emerald-600 text-white",
      activeTab: "bg-emerald-600 text-white shadow-xs font-semibold",
      activeBadge: "bg-emerald-700/90 text-emerald-100",
      hover: "text-slate-600 hover:text-emerald-950 hover:bg-emerald-50/70 font-semibold",
    },
    violet: {
      pill: "bg-violet-600 text-white",
      activeTab: "bg-violet-600 text-white shadow-xs font-semibold",
      activeBadge: "bg-violet-700/90 text-violet-100",
      hover: "text-slate-600 hover:text-violet-950 hover:bg-violet-50/70 font-semibold",
    },
    amber: {
      pill: "bg-amber-600 text-white",
      activeTab: "bg-amber-600 text-white shadow-xs font-semibold",
      activeBadge: "bg-amber-700/90 text-amber-100",
      hover: "text-slate-600 hover:text-amber-950 hover:bg-amber-50/70 font-semibold",
    },
    cyan: {
      pill: "bg-cyan-700 text-white",
      activeTab: "bg-cyan-700 text-white shadow-xs font-semibold",
      activeBadge: "bg-cyan-800/90 text-cyan-100",
      hover: "text-slate-600 hover:text-cyan-950 hover:bg-cyan-50/70 font-semibold",
    },
    purple: {
      pill: "bg-purple-700 text-white",
      activeTab: "bg-purple-700 text-white shadow-xs font-semibold",
      activeBadge: "bg-purple-800/90 text-purple-100",
      hover: "text-slate-600 hover:text-purple-950 hover:bg-purple-50/70 font-semibold",
    },
    blue: {
      pill: "bg-blue-600 text-white",
      activeTab: "bg-blue-600 text-white shadow-xs font-semibold",
      activeBadge: "bg-blue-700/90 text-blue-100",
      hover: "text-slate-600 hover:text-blue-950 hover:bg-blue-50/70 font-semibold",
    },
  }[activeTheme] || {
    pill: "bg-emerald-600 text-white",
    activeTab: "bg-emerald-600 text-white shadow-xs font-semibold",
    activeBadge: "bg-emerald-700/90 text-emerald-100",
    hover: "text-slate-600 hover:text-emerald-950 hover:bg-emerald-50/70 font-semibold",
  };

  return (
    <div className="w-full mb-6 no-print">
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2 sm:p-2.5 shadow-xs transition-shadow duration-200 flex items-center justify-between gap-2.5 min-h-[58px] max-h-[58px] overflow-hidden">
        {/* Module Label Pill (Fixed height & width, shrink-0) */}
        <div
          className={`inline-flex items-center px-3 py-1.5 h-9 rounded-xl ${themeStyles.pill} shadow-xs text-xs font-bold tracking-wide shrink-0 select-none`}
        >
          <span className="truncate">{moduleName}</span>
        </div>

        {/* Menu Items (Segmented Track) - Single row with smooth horizontal scroll, NO wrapping, STRICT fixed height! */}
        <div
          ref={trackRef}
          className="flex-1 flex items-center gap-1 p-1 bg-slate-50/90 rounded-xl border border-slate-200/70 overflow-x-auto no-scrollbar scroll-smooth min-w-0 h-10"
        >
          {items.map((item) => {
            const isActive =
              activeHref === item.href ||
              (item.aliases && item.aliases.some((alias) => activeHref === alias));

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                scroll={false}
                data-active={isActive ? "true" : "false"}
                onClick={(e) => {
                  if (item.onClick) {
                    item.onClick(e);
                  }
                  if (!e.defaultPrevented) {
                    setOptimisticHref(item.href);
                  }
                }}
                title={item.description || item.label}
                className={`relative flex items-center space-x-1.5 px-3 py-1.5 h-8 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors duration-150 ease-out shrink-0 cursor-pointer select-none leading-none ${
                  isActive ? themeStyles.activeTab : themeStyles.hover
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? themeStyles.activeBadge
                        : item.badgeColor || "bg-slate-200/80 text-slate-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

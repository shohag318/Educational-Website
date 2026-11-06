"use client";

import type { ReactNode } from "react";
import { Tabs } from "@ark-ui/react/tabs";
import { cn } from "@/lib/utils";

export type AppTabItem = {
  value: string;
  label: ReactNode;
  content?: ReactNode;
  disabled?: boolean;
};

type AppTabsProps = {
  items: AppTabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** When false, only the pill list is rendered (page owns the panels). */
  showContent?: boolean;
  className?: string;
  listClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
};

/**
 * Shared segmented tabs — Ark UI + Tailwind.
 * Use controlled `value`/`onValueChange` for app screens that keep their own panels.
 */
export function AppTabs({
  items,
  value,
  defaultValue,
  onValueChange,
  showContent = false,
  className,
  listClassName,
  triggerClassName,
  contentClassName,
}: AppTabsProps) {
  const fallback = defaultValue ?? items[0]?.value;

  return (
    <Tabs.Root
      value={value}
      defaultValue={value === undefined ? fallback : undefined}
      onValueChange={(details) => {
        if (details.value) onValueChange?.(details.value);
      }}
      className={cn("w-full", className)}
    >
      <Tabs.List
        className={cn(
          "flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg w-fit max-w-full",
          listClassName
        )}
      >
        {items.map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className={cn(
              "inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md transition-all",
              "data-[selected]:bg-white data-[selected]:text-gray-900 data-[selected]:shadow-sm",
              "disabled:opacity-50 disabled:pointer-events-none",
              triggerClassName
            )}
          >
            <span className="whitespace-nowrap">{tab.label}</span>
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {showContent
        ? items.map((tab) =>
            tab.content != null ? (
              <Tabs.Content
                key={tab.value}
                value={tab.value}
                className={cn("mt-4 text-gray-600", contentClassName)}
              >
                {tab.content}
              </Tabs.Content>
            ) : null
          )
        : null}
    </Tabs.Root>
  );
}

const demoTabs = [
  {
    value: "tab1",
    label: "Dashboard",
    content: "Main dashboard with key metrics and insights.",
  },
  {
    value: "tab2",
    label: "Analytics",
    content: "Track performance with detailed reports.",
  },
  {
    value: "tab3",
    label: "Settings",
    content: "Configure preferences and account options.",
  },
];

/** Reference / demo usage from the design prompt. */
export default function TabsBasic() {
  return (
    <AppTabs
      items={demoTabs}
      defaultValue="tab1"
      showContent
      className="w-full flex flex-col items-center"
      listClassName="mb-8"
      contentClassName="text-center"
    />
  );
}

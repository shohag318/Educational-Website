"use client";

import React, { useState } from "react";
import { ModuleMenuBar, ModuleNavItem } from "@/components/ModuleMenuBar";
import { FeeCollectionCounterModal } from "./FeeCollectionCounterModal";

interface ManualFeeNavHeaderProps {
  onCollectionSuccess?: () => void;
}

export function ManualFeeNavHeader({ onCollectionSuccess }: ManualFeeNavHeaderProps) {
  const [isCounterWindowOpen, setIsCounterWindowOpen] = useState(false);

  const navItems: ModuleNavItem[] = [
    {
      href: "/fees/collection",
      label: "Cash Counter",
      onClick: (e) => {
        e.preventDefault();
        setIsCounterWindowOpen(true);
      },
    },
    {
      href: "/fees/collection/history",
      label: "Receipts & Ledger",
    },
    {
      href: "/fees/absent-fine",
      label: "Absent Fines",
    },
    {
      href: "/fees",
      label: "Fee Setup",
    },
    {
      href: "/fees/waiver",
      label: "Waivers & Scholarships",
    },
  ];

  return (
    <>
      <ModuleMenuBar moduleName="Fee Collection" items={navItems} activeTheme="emerald" />
      <FeeCollectionCounterModal
        isOpen={isCounterWindowOpen}
        onClose={() => setIsCounterWindowOpen(false)}
        onCollectionSuccess={onCollectionSuccess}
      />
    </>
  );
}

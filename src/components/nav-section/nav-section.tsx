"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, ListItemButton, ListItemIcon, ListItemText, ListSubheader } from "@mui/material";
import type { ReactNode } from "react";

export interface NavItem {
  title: string;
  path: string;
  icon?: ReactNode;
}

interface NavSectionProps {
  title?: string;
  items: NavItem[];
}

export function NavSection({ title, items }: NavSectionProps) {
  const pathname = usePathname();

  return (
    <List
      dense
      subheader={
        title ? (
          <ListSubheader disableSticky sx={{ typography: "overline", color: "text.disabled" }}>
            {title}
          </ListSubheader>
        ) : undefined
      }
    >
      {items.map((item) => {
        const selected = pathname === item.path;
        return (
          <ListItemButton key={item.path} component={Link} href={item.path} selected={selected} sx={{ mb: 0.5 }}>
            {item.icon && <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>}
            <ListItemText
              primary={item.title}
              slotProps={{ primary: { variant: "body2", sx: { fontWeight: selected ? 700 : 500 } } }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );
}

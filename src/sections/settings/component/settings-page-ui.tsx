"use client";

import type { ReactNode } from "react";
import { Box, Container, Stack } from "@mui/material";
import { CustomBreadcrumbs } from "@/components";
import { SettingsIcon } from "@/components/iconify/mui-icons";
import { PATHS } from "@/config-global";
import { SettingNavHeader } from "@/sections/settings/component/setting-nav-header";
import {
  RulesAtmosphere,
  RulesFilterGrid,
  RulesFormBlock,
  RulesListItem,
  RulesSection,
} from "@/sections/academic/component/rules-section-ui";
import { ResultsNotice } from "@/sections/results/component/result-page-ui";

/** Shared frame for every Settings page. */
export function SettingsPageShell({ children }: { children: ReactNode }) {
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 }, pb: 10 }}>
      <Box className="no-print" sx={{ mb: 3 }}>
        <SettingNavHeader />
      </Box>
      <RulesAtmosphere>
        <Stack spacing={2.5}>{children}</Stack>
      </RulesAtmosphere>
    </Container>
  );
}

export function SettingsPageHeader({
  heading,
  current,
  action,
}: {
  heading: string;
  current?: string;
  action?: ReactNode;
}) {
  return (
    <Box className="no-print">
      <CustomBreadcrumbs
        heading={heading}
        links={[
          { name: "Overview", href: PATHS.root, icon: <SettingsIcon sx={{ fontSize: 16 }} /> },
          { name: "Settings", href: PATHS.settings.root },
          { name: current || heading },
        ]}
        action={action}
      />
    </Box>
  );
}

export {
  RulesSection as SettingsSection,
  RulesFilterGrid as SettingsFilterGrid,
  RulesFormBlock as SettingsFormBlock,
  RulesListItem as SettingsListItem,
  ResultsNotice as SettingsNotice,
};

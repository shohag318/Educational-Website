export interface DashboardLink {
  name: string;
  href: string;
  badge?: string;
}

export const DASHBOARD_MODULE_KEYS = [
  "session",
  "student",
  "results",
  "fees",
  "accountant",
  "sms",
  "download",
  "assets",
] as const;

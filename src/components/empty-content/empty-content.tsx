"use client";

import { NoDataFound } from "@/components/table/no-data-found";

interface EmptyContentProps {
  /** @deprecated Always shows "No Data Found" */
  title?: string;
  /** @deprecated Descriptions are not shown */
  description?: string;
  /** @deprecated Actions are not shown on empty states */
  action?: React.ReactNode;
  icon?: string;
  hideIcon?: boolean;
}

/** Table/list empty state — icon + "No Data Found" only. */
export function EmptyContent(_props: EmptyContentProps) {
  return <NoDataFound icon={_props.icon} />;
}

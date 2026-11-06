"use client";

import { forwardRef } from "react";
import { Box, type BoxProps } from "@mui/material";
import { Icon } from "@iconify/react";

export type MuiIconifyProps = BoxProps & {
  fontSize?: "inherit" | "small" | "medium" | "large" | number | string;
  htmlColor?: string;
  titleAccess?: string;
  viewBox?: string;
};

function sizeToWidth(fontSize?: MuiIconifyProps["fontSize"]) {
  if (typeof fontSize === "number") return fontSize;
  if (typeof fontSize === "string" && !["inherit", "small", "medium", "large"].includes(fontSize)) {
    return fontSize;
  }
  if (fontSize === "small") return 20;
  if (fontSize === "large") return 35;
  if (fontSize === "inherit") return "1em";
  return 24;
}

function createMuiIcon(icon: string, displayName: string) {
  const Comp = forwardRef<SVGSVGElement, MuiIconifyProps>(function MuiIconify(
    { fontSize = "medium", htmlColor, titleAccess, sx, color, ...other },
    ref
  ) {
    const width = sizeToWidth(fontSize);
    return (
      <Box
        ref={ref}
        component={Icon}
        icon={icon}
        aria-label={titleAccess}
        sx={{
          width,
          height: width,
          flexShrink: 0,
          display: "inline-flex",
          color: htmlColor || (typeof color === "string" ? color : undefined),
          ...sx,
        }}
        {...other}
      />
    );
  });
  Comp.displayName = displayName;
  return Comp;
}

export type SvgIconComponent = ReturnType<typeof createMuiIcon>;

export const ChevronLeftIcon = createMuiIcon("lucide:chevron-left", "ChevronLeftIcon");
export const ChevronRightIcon = createMuiIcon("lucide:chevron-right", "ChevronRightIcon");
export const NavigateNextIcon = createMuiIcon("lucide:chevron-right", "NavigateNextIcon");
export const CalendarMonthIcon = createMuiIcon("lucide:calendar", "CalendarMonthIcon");
export const AccessTimeIcon = createMuiIcon("lucide:clock", "AccessTimeIcon");
export const InsertDriveFileIcon = createMuiIcon("lucide:file", "InsertDriveFileIcon");
export const ImageIcon = createMuiIcon("lucide:image", "ImageIcon");
export const PictureAsPdfIcon = createMuiIcon("lucide:file-text", "PictureAsPdfIcon");
export const SettingsIcon = createMuiIcon("lucide:settings", "SettingsIcon");
export const ShieldIcon = createMuiIcon("lucide:shield-alert", "ShieldIcon");
export const LogoutIcon = createMuiIcon("lucide:log-out", "LogoutIcon");
export const VerifiedUserIcon = createMuiIcon("lucide:badge-check", "VerifiedUserIcon");
export const MenuIcon = createMuiIcon("lucide:menu", "MenuIcon");
export const CloseIcon = createMuiIcon("lucide:x", "CloseIcon");
export const AddIcon = createMuiIcon("lucide:plus", "AddIcon");
export const RemoveIcon = createMuiIcon("lucide:minus", "RemoveIcon");
export const SearchOffIcon = createMuiIcon("lucide:search-x", "SearchOffIcon");
export const CloudUploadIcon = createMuiIcon("lucide:cloud-upload", "CloudUploadIcon");
export const DeleteOutlineIcon = createMuiIcon("lucide:trash-2", "DeleteOutlineIcon");
export const SearchIcon = createMuiIcon("lucide:search", "SearchIcon");
export const SchoolIcon = createMuiIcon("lucide:school", "SchoolIcon");
export const PeopleIcon = createMuiIcon("lucide:users", "PeopleIcon");
export const MenuBookIcon = createMuiIcon("lucide:book-open", "MenuBookIcon");
export const TuneIcon = createMuiIcon("lucide:sliders-horizontal", "TuneIcon");
export const TableChartIcon = createMuiIcon("lucide:table", "TableChartIcon");
export const CheckCircleIcon = createMuiIcon("lucide:circle-check", "CheckCircleIcon");
export const SendIcon = createMuiIcon("lucide:send", "SendIcon");
export const AssessmentIcon = createMuiIcon("lucide:bar-chart-3", "AssessmentIcon");
export const WorkspacePremiumIcon = createMuiIcon("lucide:award", "WorkspacePremiumIcon");
export const BadgeIcon = createMuiIcon("lucide:badge", "BadgeIcon");
export const CreditCardIcon = createMuiIcon("lucide:credit-card", "CreditCardIcon");
export const EventAvailableIcon = createMuiIcon("lucide:calendar-check", "EventAvailableIcon");
export const DescriptionIcon = createMuiIcon("lucide:file-text", "DescriptionIcon");
export const GridViewIcon = createMuiIcon("lucide:layout-grid", "GridViewIcon");
export const BarChartIcon = createMuiIcon("lucide:bar-chart-3", "BarChartIcon");
export const WarningAmberIcon = createMuiIcon("lucide:alert-triangle", "WarningAmberIcon");
export const ReceiptIcon = createMuiIcon("lucide:receipt", "ReceiptIcon");
export const PaymentsIcon = createMuiIcon("lucide:wallet", "PaymentsIcon");
export const AccountBalanceIcon = createMuiIcon("lucide:landmark", "AccountBalanceIcon");
export const HowToRegIcon = createMuiIcon("lucide:user-check", "HowToRegIcon");
export const DateRangeIcon = createMuiIcon("lucide:calendar-range", "DateRangeIcon");
export const AddCircleOutlineIcon = createMuiIcon("lucide:circle-plus", "AddCircleOutlineIcon");
export const Inventory2Icon = createMuiIcon("lucide:package", "Inventory2Icon");
export const ArrowForwardIcon = createMuiIcon("lucide:arrow-right", "ArrowForwardIcon");
export const CloseOutlinedIcon = createMuiIcon("lucide:x", "CloseOutlinedIcon");
export const EventAvailableOutlinedIcon = createMuiIcon("lucide:calendar-check", "EventAvailableOutlinedIcon");
export const EmojiEventsIcon = createMuiIcon("lucide:trophy", "EmojiEventsIcon");
export const EditIcon = createMuiIcon("lucide:pencil", "EditIcon");
export const ArchiveIcon = createMuiIcon("lucide:archive", "ArchiveIcon");
export const LayersIcon = createMuiIcon("lucide:layers", "LayersIcon");
export const WbSunnyIcon = createMuiIcon("lucide:sun", "WbSunnyIcon");
export const WbTwilightIcon = createMuiIcon("lucide:sunset", "WbTwilightIcon");
export const PeopleOutlineIcon = createMuiIcon("lucide:users", "PeopleOutlineIcon");
export const CheckIcon = createMuiIcon("lucide:check", "CheckIcon");
export const SchoolOutlinedIcon = createMuiIcon("lucide:school", "SchoolOutlinedIcon");
export const ClassOutlinedIcon = createMuiIcon("lucide:notebook", "ClassOutlinedIcon");
export const AutoAwesomeIcon = createMuiIcon("lucide:sparkles", "AutoAwesomeIcon");
export const ContentCopyIcon = createMuiIcon("lucide:copy", "ContentCopyIcon");
export const SyncIcon = createMuiIcon("lucide:refresh-cw", "SyncIcon");
export const PrintOutlinedIcon = createMuiIcon("lucide:printer", "PrintOutlinedIcon");
export const PhotoCameraOutlinedIcon = createMuiIcon("lucide:camera", "PhotoCameraOutlinedIcon");
export const PersonOutlinedIcon = createMuiIcon("lucide:user", "PersonOutlinedIcon");
export const EmojiEventsOutlinedIcon = createMuiIcon("lucide:trophy", "EmojiEventsOutlinedIcon");
export const ReceiptLongOutlinedIcon = createMuiIcon("lucide:receipt", "ReceiptLongOutlinedIcon");
export const NotificationsNoneOutlinedIcon = createMuiIcon("lucide:bell", "NotificationsNoneOutlinedIcon");
export const MenuBookOutlinedIcon = createMuiIcon("lucide:book-open", "MenuBookOutlinedIcon");
export const EditOutlinedIcon = createMuiIcon("lucide:pencil", "EditOutlinedIcon");
export const ScheduleIcon = createMuiIcon("lucide:clock", "ScheduleIcon");
export const SwapHorizIcon = createMuiIcon("lucide:arrow-left-right", "SwapHorizIcon");
export const FavoriteBorderIcon = createMuiIcon("lucide:heart", "FavoriteBorderIcon");
export const DescriptionOutlinedIcon = createMuiIcon("lucide:file-text", "DescriptionOutlinedIcon");
export const RestartAltIcon = createMuiIcon("lucide:rotate-ccw", "RestartAltIcon");
export const FileDownloadOutlinedIcon = createMuiIcon("lucide:download", "FileDownloadOutlinedIcon");
export const PhoneIcon = createMuiIcon("lucide:phone", "PhoneIcon");
export const PrintIcon = createMuiIcon("lucide:printer", "PrintIcon");

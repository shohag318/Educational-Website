"use client";

import { forwardRef, type CSSProperties } from "react";
import { Icon } from "@iconify/react";

export type IconifyLucideProps = {
  className?: string;
  size?: number | string;
  width?: number | string;
  height?: number | string;
  color?: string;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
  style?: CSSProperties;
  ["aria-hidden"]?: boolean | "true" | "false";
  ["aria-label"]?: string;
};

/** PascalCase Lucide name → `lucide:kebab-case` outlined icon. */
function toLucideIcon(name: string) {
  const kebab = name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Za-z])(\d)/g, "$1-$2")
    .toLowerCase();
  return `lucide:${kebab}`;
}

function createOutlinedIcon(displayName: string) {
  const icon = toLucideIcon(displayName);
  const Comp = forwardRef<SVGSVGElement, IconifyLucideProps>(function OutlinedIcon(
    {
      className,
      size,
      width,
      height,
      color,
      style,
      strokeWidth,
      absoluteStrokeWidth: _asw,
      ...rest
    },
    ref
  ) {
    const resolved = size ?? width ?? height ?? (className ? "1em" : 24);
    return (
      <Icon
        ref={ref}
        icon={icon}
        className={className}
        width={resolved}
        height={resolved}
        color={color}
        style={{
          ...style,
          ...(strokeWidth != null ? { strokeWidth } : null),
        }}
        {...rest}
      />
    );
  });
  Comp.displayName = displayName;
  return Comp;
}

export const Activity = createOutlinedIcon("Activity");
export const AlertCircle = createOutlinedIcon("AlertCircle");
export const AlertOctagon = createOutlinedIcon("AlertOctagon");
export const AlertTriangle = createOutlinedIcon("AlertTriangle");
export const ArrowDownRight = createOutlinedIcon("ArrowDownRight");
export const ArrowDownToLine = createOutlinedIcon("ArrowDownToLine");
export const ArrowLeft = createOutlinedIcon("ArrowLeft");
export const ArrowRight = createOutlinedIcon("ArrowRight");
export const ArrowUpDown = createOutlinedIcon("ArrowUpDown");
export const ArrowUpRight = createOutlinedIcon("ArrowUpRight");
export const Award = createOutlinedIcon("Award");
export const Banknote = createOutlinedIcon("Banknote");
export const BarChart3 = createOutlinedIcon("BarChart3");
export const Barcode = createOutlinedIcon("Barcode");
export const Bell = createOutlinedIcon("Bell");
export const BookOpen = createOutlinedIcon("BookOpen");
export const Bookmark = createOutlinedIcon("Bookmark");
export const BookmarkPlus = createOutlinedIcon("BookmarkPlus");
export const Boxes = createOutlinedIcon("Boxes");
export const Briefcase = createOutlinedIcon("Briefcase");
export const Building = createOutlinedIcon("Building");
export const Building2 = createOutlinedIcon("Building2");
export const Calculator = createOutlinedIcon("Calculator");
export const Calendar = createOutlinedIcon("Calendar");
export const CalendarCheck = createOutlinedIcon("CalendarCheck");
export const CalendarDays = createOutlinedIcon("CalendarDays");
export const CalendarRange = createOutlinedIcon("CalendarRange");
export const CalendarX2 = createOutlinedIcon("CalendarX2");
export const Camera = createOutlinedIcon("Camera");
export const Check = createOutlinedIcon("Check");
export const CheckCircle = createOutlinedIcon("CheckCircle");
export const CheckCircle2 = createOutlinedIcon("CheckCircle2");
export const CheckSquare = createOutlinedIcon("CheckSquare");
export const ChevronDown = createOutlinedIcon("ChevronDown");
export const ChevronLeft = createOutlinedIcon("ChevronLeft");
export const ChevronRight = createOutlinedIcon("ChevronRight");
export const ChevronUp = createOutlinedIcon("ChevronUp");
export const Clock = createOutlinedIcon("Clock");
export const Contact = createOutlinedIcon("Contact");
export const Copy = createOutlinedIcon("Copy");
export const CreditCard = createOutlinedIcon("CreditCard");
export const Database = createOutlinedIcon("Database");
export const Dice5 = createOutlinedIcon("Dice5");
export const DollarSign = createOutlinedIcon("DollarSign");
export const Download = createOutlinedIcon("Download");
export const Droplet = createOutlinedIcon("Droplet");
export const Edit = createOutlinedIcon("Edit");
export const Edit2 = createOutlinedIcon("Edit2");
export const Edit3 = createOutlinedIcon("Edit3");
export const ExternalLink = createOutlinedIcon("ExternalLink");
export const Eye = createOutlinedIcon("Eye");
export const EyeOff = createOutlinedIcon("EyeOff");
export const FileBarChart = createOutlinedIcon("FileBarChart");
export const FileCheck = createOutlinedIcon("FileCheck");
export const FileEdit = createOutlinedIcon("FileEdit");
export const FileSignature = createOutlinedIcon("FileSignature");
export const FileSpreadsheet = createOutlinedIcon("FileSpreadsheet");
export const FileText = createOutlinedIcon("FileText");
export const Filter = createOutlinedIcon("Filter");
export const GitMerge = createOutlinedIcon("GitMerge");
export const Globe = createOutlinedIcon("Globe");
export const GraduationCap = createOutlinedIcon("GraduationCap");
export const HandCoins = createOutlinedIcon("HandCoins");
export const Heart = createOutlinedIcon("Heart");
export const HelpCircle = createOutlinedIcon("HelpCircle");
export const History = createOutlinedIcon("History");
export const IdCard = createOutlinedIcon("IdCard");
export const Image = createOutlinedIcon("Image");
export const Info = createOutlinedIcon("Info");
export const KeyRound = createOutlinedIcon("KeyRound");
export const Landmark = createOutlinedIcon("Landmark");
export const Laptop = createOutlinedIcon("Laptop");
export const Layers = createOutlinedIcon("Layers");
export const LayoutDashboard = createOutlinedIcon("LayoutDashboard");
export const LayoutGrid = createOutlinedIcon("LayoutGrid");
export const Link2 = createOutlinedIcon("Link2");
export const ListPlus = createOutlinedIcon("ListPlus");
export const Lock = createOutlinedIcon("Lock");
export const LogIn = createOutlinedIcon("LogIn");
export const Mail = createOutlinedIcon("Mail");
export const MapPin = createOutlinedIcon("MapPin");
export const Maximize2 = createOutlinedIcon("Maximize2");
export const MessageSquare = createOutlinedIcon("MessageSquare");
export const Minimize2 = createOutlinedIcon("Minimize2");
export const Minus = createOutlinedIcon("Minus");
export const Palette = createOutlinedIcon("Palette");
export const PenTool = createOutlinedIcon("PenTool");
export const Pencil = createOutlinedIcon("Pencil");
export const Percent = createOutlinedIcon("Percent");
export const Phone = createOutlinedIcon("Phone");
export const PhoneCall = createOutlinedIcon("PhoneCall");
export const Play = createOutlinedIcon("Play");
export const Plus = createOutlinedIcon("Plus");
export const PlusCircle = createOutlinedIcon("PlusCircle");
export const Printer = createOutlinedIcon("Printer");
export const QrCode = createOutlinedIcon("QrCode");
export const Radio = createOutlinedIcon("Radio");
export const Receipt = createOutlinedIcon("Receipt");
export const RefreshCw = createOutlinedIcon("RefreshCw");
export const RotateCcw = createOutlinedIcon("RotateCcw");
export const Save = createOutlinedIcon("Save");
export const Scale = createOutlinedIcon("Scale");
export const School = createOutlinedIcon("School");
export const Scissors = createOutlinedIcon("Scissors");
export const Search = createOutlinedIcon("Search");
export const Send = createOutlinedIcon("Send");
export const Settings = createOutlinedIcon("Settings");
export const Settings2 = createOutlinedIcon("Settings2");
export const Share2 = createOutlinedIcon("Share2");
export const Shield = createOutlinedIcon("Shield");
export const ShieldAlert = createOutlinedIcon("ShieldAlert");
export const ShieldCheck = createOutlinedIcon("ShieldCheck");
export const Sliders = createOutlinedIcon("Sliders");
export const SlidersHorizontal = createOutlinedIcon("SlidersHorizontal");
export const Smartphone = createOutlinedIcon("Smartphone");
export const Sparkles = createOutlinedIcon("Sparkles");
export const Square = createOutlinedIcon("Square");
export const Stamp = createOutlinedIcon("Stamp");
export const TableProperties = createOutlinedIcon("TableProperties");
export const Tag = createOutlinedIcon("Tag");
export const Timer = createOutlinedIcon("Timer");
export const Trash2 = createOutlinedIcon("Trash2");
export const TrendingDown = createOutlinedIcon("TrendingDown");
export const TrendingUp = createOutlinedIcon("TrendingUp");
export const Unlock = createOutlinedIcon("Unlock");
export const Upload = createOutlinedIcon("Upload");
export const User = createOutlinedIcon("User");
export const UserCheck = createOutlinedIcon("UserCheck");
export const UserPlus = createOutlinedIcon("UserPlus");
export const UserX = createOutlinedIcon("UserX");
export const Users = createOutlinedIcon("Users");
export const Wallet = createOutlinedIcon("Wallet");
export const Wrench = createOutlinedIcon("Wrench");
export const X = createOutlinedIcon("X");
export const XCircle = createOutlinedIcon("XCircle");
export const Zap = createOutlinedIcon("Zap");

const fs = require("fs");
const path = require("path");

const data = JSON.parse(fs.readFileSync("scripts/icon-extract.json", "utf8"));

function toKebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .replace(/([A-Za-z])(\d)/g, "$1-$2")
    .toLowerCase();
}

/** MUI icon module name -> Iconify icon id */
const MUI_TO_ICONIFY = {
  Search: "lucide:search",
  Add: "lucide:plus",
  Remove: "lucide:minus",
  Close: "lucide:x",
  CloseOutlined: "lucide:x",
  Edit: "lucide:pencil",
  EditOutlined: "lucide:pencil",
  DeleteOutlined: "lucide:trash-2",
  Check: "lucide:check",
  CheckCircle: "lucide:circle-check",
  People: "lucide:users",
  PeopleOutlined: "lucide:users",
  School: "lucide:school",
  SchoolOutlined: "lucide:school",
  CalendarMonth: "lucide:calendar",
  AccessTime: "lucide:clock",
  MenuBook: "lucide:book-open",
  MenuBookOutlined: "lucide:book-open",
  Layers: "lucide:layers",
  Settings: "lucide:settings",
  Logout: "lucide:log-out",
  VerifiedUser: "lucide:badge-check",
  Menu: "lucide:menu",
  GppMaybe: "lucide:shield-alert",
  NavigateNext: "lucide:chevron-right",
  ChevronLeft: "lucide:chevron-left",
  ChevronRight: "lucide:chevron-right",
  ArrowForward: "lucide:arrow-right",
  Tune: "lucide:sliders-horizontal",
  TableChart: "lucide:table",
  Send: "lucide:send",
  Assessment: "lucide:bar-chart-3",
  WorkspacePremium: "lucide:award",
  Badge: "lucide:badge",
  CreditCard: "lucide:credit-card",
  EventAvailable: "lucide:calendar-check",
  EventAvailableOutlined: "lucide:calendar-check",
  Description: "lucide:file-text",
  DescriptionOutlined: "lucide:file-text",
  GridView: "lucide:layout-grid",
  BarChart: "lucide:bar-chart-3",
  WarningAmber: "lucide:triangle-alert",
  Receipt: "lucide:receipt",
  Payments: "lucide:wallet",
  AccountBalance: "lucide:landmark",
  HowToReg: "lucide:user-check",
  DateRange: "lucide:calendar-range",
  AddCircleOutlineOutlined: "lucide:circle-plus",
  Inventory2: "lucide:package",
  EmojiEvents: "lucide:trophy",
  EmojiEventsOutlined: "lucide:trophy",
  Archive: "lucide:archive",
  WbSunny: "lucide:sun",
  WbTwilight: "lucide:sunset",
  ClassOutlined: "lucide:notebook",
  AutoAwesome: "lucide:sparkles",
  ContentCopy: "lucide:copy",
  Sync: "lucide:refresh-cw",
  PrintOutlined: "lucide:printer",
  PhotoCameraOutlined: "lucide:camera",
  PersonOutlined: "lucide:user",
  ReceiptLongOutlined: "lucide:receipt",
  NotificationsNoneOutlined: "lucide:bell",
  Schedule: "lucide:clock",
  SwapHoriz: "lucide:arrow-left-right",
  FavoriteBorder: "lucide:heart",
  RestartAlt: "lucide:rotate-ccw",
  FileDownloadOutlined: "lucide:download",
  InsertDriveFile: "lucide:file",
  Image: "lucide:image",
  PictureAsPdf: "lucide:file-text",
  SearchOff: "lucide:search-x",
  CloudUpload: "lucide:cloud-upload",
};

// --- generate lucide shim ---
const lucideLines = [
  `"use client";`,
  ``,
  `import { forwardRef, type CSSProperties } from "react";`,
  `import { Icon } from "@iconify/react";`,
  ``,
  `export type IconifyLucideProps = {`,
  `  className?: string;`,
  `  size?: number | string;`,
  `  width?: number | string;`,
  `  height?: number | string;`,
  `  color?: string;`,
  `  strokeWidth?: number;`,
  `  absoluteStrokeWidth?: boolean;`,
  `  style?: CSSProperties;`,
  `  ["aria-hidden"]?: boolean | "true" | "false";`,
  `  ["aria-label"]?: string;`,
  `};`,
  ``,
  `function createLucideIcon(name: string) {`,
  `  const icon = \`lucide:\${name}\`;`,
  `  const Comp = forwardRef<SVGSVGElement, IconifyLucideProps>(function LucideIconify(`,
  `    { className, size, width, height, color, style, strokeWidth: _sw, absoluteStrokeWidth: _asw, ...rest },`,
  `    ref`,
  `  ) {`,
  `    const resolved = size ?? width ?? height ?? (className ? "1em" : 24);`,
  `    return (`,
  `      <Icon`,
  `        ref={ref}`,
  `        icon={icon}`,
  `        className={className}`,
  `        width={resolved}`,
  `        height={resolved}`,
  `        color={color}`,
  `        style={style}`,
  `        {...rest}`,
  `      />`,
  `    );`,
  `  });`,
  `  Comp.displayName = name;`,
  `  return Comp;`,
  `}`,
  ``,
];

for (const name of data.lucide) {
  lucideLines.push(`export const ${name} = createLucideIcon("${toKebab(name)}");`);
}
lucideLines.push(``);

fs.mkdirSync("src/components/iconify", { recursive: true });
fs.writeFileSync("src/components/iconify/lucide.tsx", lucideLines.join("\n"));

// --- generate mui icons shim ---
const muiLines = [
  `"use client";`,
  ``,
  `import { forwardRef } from "react";`,
  `import { Box, type BoxProps } from "@mui/material";`,
  `import { Icon } from "@iconify/react";`,
  ``,
  `export type MuiIconifyProps = BoxProps & {`,
  `  fontSize?: "inherit" | "small" | "medium" | "large" | number | string;`,
  `  htmlColor?: string;`,
  `  titleAccess?: string;`,
  `  viewBox?: string;`,
  `};`,
  ``,
  `function sizeToWidth(fontSize?: MuiIconifyProps["fontSize"]) {`,
  `  if (typeof fontSize === "number") return fontSize;`,
  `  if (typeof fontSize === "string" && !["inherit", "small", "medium", "large"].includes(fontSize)) {`,
  `    return fontSize;`,
  `  }`,
  `  if (fontSize === "small") return 20;`,
  `  if (fontSize === "large") return 35;`,
  `  if (fontSize === "inherit") return "1em";`,
  `  return 24;`,
  `}`,
  ``,
  `function createMuiIcon(icon: string, displayName: string) {`,
  `  const Comp = forwardRef<SVGSVGElement, MuiIconifyProps>(function MuiIconify(`,
  `    { fontSize = "medium", htmlColor, titleAccess, sx, color, ...other },`,
  `    ref`,
  `  ) {`,
  `    const width = sizeToWidth(fontSize);`,
  `    return (`,
  `      <Box`,
  `        ref={ref}`,
  `        component={Icon}`,
  `        icon={icon}`,
  `        aria-label={titleAccess}`,
  `        sx={{`,
  `          width,`,
  `          height: width,`,
  `          flexShrink: 0,`,
  `          display: "inline-flex",`,
  `          color: htmlColor || (typeof color === "string" ? color : undefined),`,
  `          ...sx,`,
  `        }}`,
  `        {...other}`,
  `      />`,
  `    );`,
  `  });`,
  `  Comp.displayName = displayName;`,
  `  return Comp;`,
  `}`,
  ``,
  `export type SvgIconComponent = ReturnType<typeof createMuiIcon>;`,
  ``,
];

const seenExports = new Set();
for (const [localName, moduleName] of Object.entries(data.mui)) {
  const icon = MUI_TO_ICONIFY[moduleName];
  if (!icon) {
    console.warn("Missing MUI map for", moduleName, "->", localName);
    continue;
  }
  if (seenExports.has(localName)) continue;
  seenExports.add(localName);
  muiLines.push(`export const ${localName} = createMuiIcon("${icon}", "${localName}");`);
}

// Also export by module name for create-view style if needed
for (const moduleName of Object.keys(MUI_TO_ICONIFY)) {
  const exportName = moduleName.endsWith("Outlined") || moduleName.endsWith("Outlined".slice(0))
    ? moduleName
    : moduleName;
  // export default-style aliases as ModuleName for rare direct use
  const asDefault = `${moduleName}Icon`;
  if (!seenExports.has(asDefault) && !seenExports.has(moduleName)) {
    // skip bulk module exports unless used
  }
}

fs.writeFileSync("src/components/iconify/mui-icons.tsx", muiLines.join("\n") + "\n");

// --- rewrite imports across src ---
function walk(d, a = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory() && e.name !== "node_modules" && e.name !== ".next") walk(p, a);
    else if (/\.(tsx|ts)$/.test(e.name)) a.push(p);
  }
  return a;
}

let changed = 0;
for (const file of walk("src")) {
  let c = fs.readFileSync(file, "utf8");
  const orig = c;

  c = c.replace(/from\s*["']lucide-react["']/g, 'from "@/components/iconify/lucide"');

  // type SvgIconComponent from @mui/icons-material
  c = c.replace(
    /import\s+type\s+\{\s*SvgIconComponent\s*\}\s+from\s*["']@mui\/icons-material["'];?\s*/g,
    'import type { SvgIconComponent } from "@/components/iconify/mui-icons";\n'
  );

  // default imports from @mui/icons-material/X
  c = c.replace(
    /import\s+(\w+)\s+from\s*["']@mui\/icons-material\/(\w+)["'];?\s*/g,
    (match, local) => {
      // Keep one combined import later — first pass mark
      return `/*__MUI_ICON__*/import { ${local} } from "@/components/iconify/mui-icons";\n`;
    }
  );

  // merge consecutive mui iconify imports
  const muiImportRe =
    /(?:\/\*__MUI_ICON__\*\/import\s*\{\s*(\w+)\s*\}\s*from\s*["']@\/components\/iconify\/mui-icons["'];?\s*)+/g;
  c = c.replace(muiImportRe, (block) => {
    const names = [...block.matchAll(/\{\s*(\w+)\s*\}/g)].map((m) => m[1]);
    const unique = [...new Set(names)];
    return `import { ${unique.join(", ")} } from "@/components/iconify/mui-icons";\n`;
  });

  // cleanup marker if any left
  c = c.replace(/\/\*__MUI_ICON__\*\//g, "");

  if (c !== orig) {
    fs.writeFileSync(file, c);
    changed++;
    console.log("updated", file);
  }
}

console.log("files changed:", changed);
console.log("lucide icons:", data.lucide.length);
console.log("mui locals:", Object.keys(data.mui).length);

"use client";

import { getScopedStorageKey, TENANT_SWITCH_EVENT } from "@/lib/clientTenant";

export type AssetCategory =
  | "FURNITURE"
  | "COMPUTER_IT"
  | "LAB_EQUIPMENT"
  | "SPORTS"
  | "VEHICLES"
  | "ELECTRICAL"
  | "LIBRARY"
  | "OTHER";

export type AssetCondition =
  | "EXCELLENT"
  | "GOOD"
  | "FAIR"
  | "NEEDS_REPAIR"
  | "DAMAGED"
  | "SCRAPPED";

export type AssetStatus =
  | "IN_USE"
  | "IN_STORAGE"
  | "MAINTENANCE"
  | "DISPOSED";

export interface InstitutionAsset {
  id: string;
  assetCode: string;
  name: string;
  category: AssetCategory;
  location: string;
  building?: string;
  purchaseDate: string;
  purchasePrice: number;
  quantity: number;
  currentValue: number;
  depreciationRate: number; // percentage per year e.g. 10%
  condition: AssetCondition;
  status: AssetStatus;
  supplierName?: string;
  invoiceNo?: string;
  warrantyExpiry?: string;
  custodian: string;
  serialNumber?: string;
  remarks?: string;
  lastAuditDate?: string;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  serviceDate: string;
  issueDescription: string;
  vendorName: string;
  cost: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  completedDate?: string;
  remarks?: string;
}

export const ASSET_CATEGORIES: {
  key: AssetCategory;
  label: string;
  color: string;
  badgeBg: string;
  defaultDepreciation: number;
  description: string;
}[] = [
  {
    key: "COMPUTER_IT",
    label: "Computer & IT Equipment",
    color: "text-blue-700",
    badgeBg: "bg-blue-50 border-blue-200 text-blue-800",
    defaultDepreciation: 20,
    description: "Desktops, laptops, interactive projectors, servers, printers & network switches",
  },
  {
    key: "LAB_EQUIPMENT",
    label: "Science Lab Apparatus",
    color: "text-emerald-700",
    badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-800",
    defaultDepreciation: 15,
    description: "Physics spectrometers, compound microscopes, chemistry glassware, lab balances",
  },
  {
    key: "FURNITURE",
    label: "Classroom & Office Furniture",
    color: "text-amber-700",
    badgeBg: "bg-amber-50 border-amber-200 text-amber-800",
    defaultDepreciation: 10,
    description: "Student dual benches, executive teacher desks, library tables, steel almirahs",
  },
  {
    key: "ELECTRICAL",
    label: "Electrical & Audio/Visual",
    color: "text-purple-700",
    badgeBg: "bg-purple-50 border-purple-200 text-purple-800",
    defaultDepreciation: 15,
    description: "Diesel generators, auditorium sound consoles, solar inverters, ceiling fans",
  },
  {
    key: "VEHICLES",
    label: "Institutional Transport",
    color: "text-rose-700",
    badgeBg: "bg-rose-50 border-rose-200 text-rose-800",
    defaultDepreciation: 15,
    description: "College buses, staff microbuses, campus utility vans and emergency transport",
  },
  {
    key: "SPORTS",
    label: "Sports & Physical Fitness",
    color: "text-cyan-700",
    badgeBg: "bg-cyan-50 border-cyan-200 text-cyan-800",
    defaultDepreciation: 25,
    description: "Cricket pitch kits, football goals, table tennis boards, gymnasium gear",
  },
  {
    key: "LIBRARY",
    label: "Library Catalog & Books",
    color: "text-indigo-700",
    badgeBg: "bg-indigo-50 border-indigo-200 text-indigo-800",
    defaultDepreciation: 10,
    description: "Reference encyclopedias, rare historical manuscripts, digital catalog terminals",
  },
  {
    key: "OTHER",
    label: "General Facility Assets",
    color: "text-slate-700",
    badgeBg: "bg-slate-100 border-slate-200 text-slate-800",
    defaultDepreciation: 10,
    description: "Water purification plants, fire safety extinguishers, surveillance CCTV kits",
  },
];

export const CAMPUS_LOCATIONS = [
  "Computer Lab 1 (Main Building 3rd Fl)",
  "Computer Lab 2 (Software Wing)",
  "Physics Laboratory (Science Annex)",
  "Chemistry Laboratory (Science Annex)",
  "Biology Laboratory (Science Annex)",
  "Auditorium & Cultural Hall",
  "Central Library & Study Hall",
  "Classroom 101 (Class 11 Science A)",
  "Classroom 102 (Class 11 Science B)",
  "Classroom 201 (Class 12 Commerce)",
  "Teachers Common Room",
  "Principal Secretarial Office",
  "Administrative Accounts Desk",
  "Campus Garage & Transport Yard",
  "Sub-station & Generator Room",
];

export const DEFAULT_ASSETS: InstitutionAsset[] = [
  {
    id: "ast_001",
    assetCode: "AST-IT-101",
    name: "Dell OptiPlex 7090 Core i7 Desktop Set (30 Units)",
    category: "COMPUTER_IT",
    location: "Computer Lab 1 (Main Building 3rd Fl)",
    building: "Academic Block A",
    purchaseDate: "2024-03-15",
    purchasePrice: 1650000,
    quantity: 30,
    currentValue: 1320000,
    depreciationRate: 20,
    condition: "EXCELLENT",
    status: "IN_USE",
    supplierName: "Global Brand Pvt Ltd",
    invoiceNo: "GB-2024-8841",
    warrantyExpiry: "2027-03-14",
    custodian: "Engr. Tanvir Ahmed (Lab In-charge)",
    serialNumber: "SN-DELL-LAB1-POOL",
    remarks: "Dual monitor setup for NCTB ICT programming practical sessions",
    lastAuditDate: "2026-09-10",
    createdAt: "2024-03-15T10:00:00.000Z",
  },
  {
    id: "ast_002",
    assetCode: "AST-LAB-201",
    name: "Olympus Binocular Compound Microscope Set (12 Units)",
    category: "LAB_EQUIPMENT",
    location: "Biology Laboratory (Science Annex)",
    building: "Science Annex",
    purchaseDate: "2023-08-20",
    purchasePrice: 420000,
    quantity: 12,
    currentValue: 336000,
    depreciationRate: 15,
    condition: "EXCELLENT",
    status: "IN_USE",
    supplierName: "Scientific Supplies Bangladesh",
    invoiceNo: "SSB-77410",
    warrantyExpiry: "2026-08-19",
    custodian: "Dr. Farzana Yasmin (Head of Biology)",
    serialNumber: "OLY-BIO-2023-BATCH",
    remarks: "1000x magnification with immersion oil kit for HSC practicals",
    lastAuditDate: "2026-09-12",
    createdAt: "2023-08-20T10:00:00.000Z",
  },
  {
    id: "ast_003",
    assetCode: "AST-FUR-301",
    name: "Ergonomic Student Dual Bench & High Desk (120 Sets)",
    category: "FURNITURE",
    location: "Classroom 101 (Class 11 Science A)",
    building: "Academic Block A",
    purchaseDate: "2022-01-10",
    purchasePrice: 720000,
    quantity: 120,
    currentValue: 504000,
    depreciationRate: 10,
    condition: "GOOD",
    status: "IN_USE",
    supplierName: "Otobi Commercial Furnishings",
    invoiceNo: "OT-2022-550",
    warrantyExpiry: "2027-01-10",
    custodian: "Md. Rafiqul Islam (Care taker)",
    serialNumber: "DESK-101-SERIES",
    remarks: "Heavy-gauge powder coated steel frame with laminated mahogany top",
    lastAuditDate: "2026-08-01",
    createdAt: "2022-01-10T10:00:00.000Z",
  },
  {
    id: "ast_004",
    assetCode: "AST-ELEC-401",
    name: "Perkins 25 kVA Silent Soundproof Diesel Generator",
    category: "ELECTRICAL",
    location: "Sub-station & Generator Room",
    building: "Utility Block",
    purchaseDate: "2023-05-18",
    purchasePrice: 980000,
    quantity: 1,
    currentValue: 833000,
    depreciationRate: 15,
    condition: "EXCELLENT",
    status: "IN_USE",
    supplierName: "Energypac Power Generation Ltd",
    invoiceNo: "EP-2023-9912",
    warrantyExpiry: "2026-05-18",
    custodian: "Abul Kashem (Chief Electrician)",
    serialNumber: "PERK-25KVA-ENG-4890",
    remarks: "Auto-mains failure (AMF) panel connected to science labs & server room",
    lastAuditDate: "2026-09-01",
    createdAt: "2023-05-18T10:00:00.000Z",
  },
  {
    id: "ast_005",
    assetCode: "AST-VEH-501",
    name: "Hino 36-Seater Student & Staff Shuttle Bus",
    category: "VEHICLES",
    location: "Campus Garage & Transport Yard",
    building: "Transport Depot",
    purchaseDate: "2021-11-05",
    purchasePrice: 3850000,
    quantity: 1,
    currentValue: 2480000,
    depreciationRate: 15,
    condition: "GOOD",
    status: "IN_USE",
    supplierName: "Navana Motors Ltd",
    invoiceNo: "NV-HINO-2021-04",
    warrantyExpiry: "2024-11-05",
    custodian: "Md. Habibur Rahman (Transport Supervisor)",
    serialNumber: "REG-DHAKA-METRO-CHA-11-4092",
    remarks: "Route: Uttara to Campus via Mirpur Road; GPS tracking installed",
    lastAuditDate: "2026-09-15",
    createdAt: "2021-11-05T10:00:00.000Z",
  },
  {
    id: "ast_006",
    assetCode: "AST-IT-102",
    name: "Epson EB-E01 3LCD XGA Multimedia Projector (8 Units)",
    category: "COMPUTER_IT",
    location: "Auditorium & Cultural Hall",
    building: "Main Complex",
    purchaseDate: "2024-01-22",
    purchasePrice: 360000,
    quantity: 8,
    currentValue: 288000,
    depreciationRate: 20,
    condition: "EXCELLENT",
    status: "IN_USE",
    supplierName: "Flora Limited",
    invoiceNo: "FL-2024-1029",
    warrantyExpiry: "2026-01-21",
    custodian: "Engr. Tanvir Ahmed (Lab In-charge)",
    serialNumber: "EPS-3LCD-BATCH-24",
    remarks: "Equipped with HDMI ceiling mount in multimedia digital classrooms",
    lastAuditDate: "2026-08-20",
    createdAt: "2024-01-22T10:00:00.000Z",
  },
  {
    id: "ast_007",
    assetCode: "AST-LIB-601",
    name: "Godrej Double-Door Heavy Steel Glass Book Almirah (18 Units)",
    category: "LIBRARY",
    location: "Central Library & Study Hall",
    building: "Academic Block B",
    purchaseDate: "2022-06-14",
    purchasePrice: 324000,
    quantity: 18,
    currentValue: 259200,
    depreciationRate: 10,
    condition: "EXCELLENT",
    status: "IN_USE",
    supplierName: "Godrej Steel BD",
    invoiceNo: "GD-LIB-2022-81",
    warrantyExpiry: "2032-06-14",
    custodian: "Syeda Rehana Begum (Head Librarian)",
    serialNumber: "ALM-LIB-GODREJ-18",
    remarks: "Anti-rust electro-galvanized with dual tumbler cylinder locks",
    lastAuditDate: "2026-07-15",
    createdAt: "2022-06-14T10:00:00.000Z",
  },
  {
    id: "ast_008",
    assetCode: "AST-IT-103",
    name: "HP LaserJet Pro M404dn Network Printer (4 Units)",
    category: "COMPUTER_IT",
    location: "Administrative Accounts Desk",
    building: "Admin Block",
    purchaseDate: "2023-11-10",
    purchasePrice: 140000,
    quantity: 4,
    currentValue: 98000,
    depreciationRate: 20,
    condition: "NEEDS_REPAIR",
    status: "MAINTENANCE",
    supplierName: "Smart Technologies BD",
    invoiceNo: "ST-2023-8899",
    warrantyExpiry: "2025-11-10",
    custodian: "Shafiqul Alam (Chief Accountant)",
    serialNumber: "HP-M404-ACCT-02",
    remarks: "Paper jam issue reported in tray 2; sent to vendor for roller replacement",
    lastAuditDate: "2026-10-05",
    createdAt: "2023-11-10T10:00:00.000Z",
  },
];

export const DEFAULT_MAINTENANCE_LOGS: MaintenanceRecord[] = [
  {
    id: "maint_001",
    assetId: "ast_008",
    assetCode: "AST-IT-103",
    assetName: "HP LaserJet Pro M404dn Network Printer",
    serviceDate: "2026-10-04",
    issueDescription: "Paper feed roller slipping & frequent paper jams during ledger print",
    vendorName: "Smart Technologies Service Care",
    cost: 3500,
    status: "IN_PROGRESS",
    remarks: "Pick up scheduled for Friday after roller replacement",
  },
  {
    id: "maint_002",
    assetId: "ast_004",
    assetCode: "AST-ELEC-401",
    assetName: "Perkins 25 kVA Silent Soundproof Diesel Generator",
    serviceDate: "2026-08-15",
    issueDescription: "Scheduled 500-hour comprehensive engine oil, fuel & air filter replacement",
    vendorName: "Energypac Engineering Support",
    cost: 16500,
    status: "COMPLETED",
    completedDate: "2026-08-16",
    remarks: "Next major overhaul scheduled at 1000 operational hours",
  },
  {
    id: "maint_003",
    assetId: "ast_005",
    assetCode: "AST-VEH-501",
    assetName: "Hino 36-Seater Student & Staff Shuttle Bus",
    serviceDate: "2026-07-22",
    issueDescription: "Front brake shoe replacement & wheel alignment calibration",
    vendorName: "Navana Motors Service Center",
    cost: 24000,
    status: "COMPLETED",
    completedDate: "2026-07-24",
    remarks: "Fitness test passed and registered with BRTA for next 12 months",
  },
];

// LocalStorage helpers
export function getStoredAssets(): InstitutionAsset[] {
  if (typeof window === "undefined") return DEFAULT_ASSETS;
  try {
    const key = getScopedStorageKey("nctb_institution_assets_v1");
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_ASSETS));
      return DEFAULT_ASSETS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ASSETS;
  } catch {
    return DEFAULT_ASSETS;
  }
}

export function saveAssets(assets: InstitutionAsset[]) {
  if (typeof window === "undefined") return;
  try {
    const key = getScopedStorageKey("nctb_institution_assets_v1");
    localStorage.setItem(key, JSON.stringify(assets));
    window.dispatchEvent(new Event(TENANT_SWITCH_EVENT));
  } catch (e) {
    console.error("Failed to save assets:", e);
  }
}

export function addAsset(asset: InstitutionAsset): InstitutionAsset[] {
  const current = getStoredAssets();
  const next = [asset, ...current];
  saveAssets(next);
  return next;
}

export function updateAsset(asset: InstitutionAsset): InstitutionAsset[] {
  const current = getStoredAssets();
  const next = current.map((a) => (a.id === asset.id ? asset : a));
  saveAssets(next);
  return next;
}

export function deleteAsset(id: string): InstitutionAsset[] {
  const current = getStoredAssets();
  const next = current.filter((a) => a.id !== id);
  saveAssets(next);
  return next;
}

export function getStoredMaintenanceLogs(): MaintenanceRecord[] {
  if (typeof window === "undefined") return DEFAULT_MAINTENANCE_LOGS;
  try {
    const key = getScopedStorageKey("nctb_asset_maintenance_v1");
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_MAINTENANCE_LOGS));
      return DEFAULT_MAINTENANCE_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_MAINTENANCE_LOGS;
  } catch {
    return DEFAULT_MAINTENANCE_LOGS;
  }
}

export function saveMaintenanceLogs(logs: MaintenanceRecord[]) {
  if (typeof window === "undefined") return;
  try {
    const key = getScopedStorageKey("nctb_asset_maintenance_v1");
    localStorage.setItem(key, JSON.stringify(logs));
    window.dispatchEvent(new Event(TENANT_SWITCH_EVENT));
  } catch (e) {
    console.error("Failed to save maintenance logs:", e);
  }
}

export function addMaintenanceRecord(record: MaintenanceRecord): MaintenanceRecord[] {
  const current = getStoredMaintenanceLogs();
  const next = [record, ...current];
  saveMaintenanceLogs(next);
  return next;
}

export function generateNextAssetCode(category: AssetCategory, assets: InstitutionAsset[]): string {
  const prefixMap: Record<AssetCategory, string> = {
    COMPUTER_IT: "AST-IT",
    LAB_EQUIPMENT: "AST-LAB",
    FURNITURE: "AST-FUR",
    ELECTRICAL: "AST-ELEC",
    VEHICLES: "AST-VEH",
    SPORTS: "AST-SPT",
    LIBRARY: "AST-LIB",
    OTHER: "AST-GEN",
  };
  const prefix = prefixMap[category] || "AST";
  const matching = assets.filter((a) => a.assetCode?.startsWith(prefix));
  const nextNumber = matching.length + 101;
  return `${prefix}-${nextNumber}`;
}

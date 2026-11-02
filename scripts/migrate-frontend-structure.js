const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const src = path.join(root, "src");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function write(file, content) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content, "utf8");
}

function copyFile(fromRel, toRel) {
  const from = path.join(src, fromRel);
  const to = path.join(src, toRel);
  if (!fs.existsSync(from)) {
    console.warn("skip missing", fromRel);
    return;
  }
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
}

const importReplacements = [
  ["@/app/results/ResultNavHeader", "@/sections/results/component/result-nav-header"],
  ["@/app/student/StudentNavHeader", "@/sections/student/component/student-nav-header"],
  ["@/app/session/SessionNavHeader", "@/sections/session/component/session-nav-header"],
  ["@/app/download/DownloadNavHeader", "@/sections/download/component/download-nav-header"],
  ["@/app/fees/FeeNavHeader", "@/sections/fees/component/fee-nav-header"],
  ["@/app/fees/waiverStore", "@/sections/fees/schema/waiver-store"],
  ["@/app/settings/SettingNavHeader", "@/sections/settings/component/setting-nav-header"],
  ["@/app/sms/SmsNavHeader", "@/sections/sms/component/sms-nav-header"],
  ["@/app/user-role/UserRoleNavHeader", "@/sections/user-role/component/user-role-nav-header"],
  ["@/app/user-role/userRoleStore", "@/sections/user-role/schema/user-role-store"],
  ["@/app/accountant/AccountantNavHeader", "@/sections/accountant/component/accountant-nav-header"],
  ["@/app/accountant/accountantStore", "@/sections/accountant/schema/accountant-store"],
  ["@/app/assets/AssetNavHeader", "@/sections/assets/component/asset-nav-header"],
  ["@/app/assets/assetStore", "@/sections/assets/schema/asset-store"],
  ["@/app/fees/collection/collectionStore", "@/sections/fees/schema/collection-store"],
  ["@/app/fees/collection/MoneyReceiptModal", "@/sections/fees/component/money-receipt-modal"],
  ["@/app/fees/collection/FeeCollectionCounterModal", "@/sections/fees/component/fee-collection-counter-modal"],
  ["@/app/fees/collection/ManualFeeNavHeader", "@/sections/fees/component/manual-fee-nav-header"],
  ["@/app/fees/MonthlyFeeTemplate", "@/sections/fees/component/monthly-fee-template"],
  ["@/components/TemplateManagementSection", "@/sections/academic/component/template-management-section"],
  ["@/components/MarkInputPdfModal", "@/sections/marks/component/mark-input-pdf-modal"],
];

function rewriteImports(content, extra = []) {
  let next = content;
  [...importReplacements, ...extra].forEach(([from, to]) => {
    next = next.split(from).join(to);
  });
  return next;
}

function copyAndRewrite(fromRel, toRel, extra = []) {
  const from = path.join(src, fromRel);
  if (!fs.existsSync(from)) {
    console.warn("skip missing", fromRel);
    return;
  }
  const content = rewriteImports(read(from), extra);
  write(path.join(src, toRel), content);
}

const modules = [
  "academic",
  "setup",
  "student",
  "sms",
  "settings",
  "session",
  "results",
  "reports",
  "marks",
  "fees",
  "download",
  "assets",
  "auth",
  "super-admin",
  "user-role",
  "accountant",
  "dashboard",
  "notifications",
];

modules.forEach((mod) => {
  ["component", "view", "schema"].forEach((folder) => {
    ensureDir(path.join(src, "sections", mod, folder));
  });
});

const views = [
  ["app/page.tsx", "sections/dashboard/view/overview-view.tsx"],
  ["app/academic/rules/page.tsx", "sections/academic/view/rules-view.tsx"],
  ["app/academic/subject-mapping/page.tsx", "sections/academic/view/subject-mapping-view.tsx"],
  ["app/setup/classes/page.tsx", "sections/setup/view/classes-view.tsx"],
  ["app/setup/subject-mapping/page.tsx", "sections/setup/view/subject-mapping-view.tsx"],
  ["app/setup/exams/page.tsx", "sections/setup/view/exams-view.tsx"],
  ["app/setup/exam-routine/page.tsx", "sections/setup/view/exam-routine-view.tsx"],
  ["app/setup/students/page.tsx", "sections/setup/view/students-view.tsx"],
  ["app/setup/student-info/page.tsx", "sections/setup/view/student-info-view.tsx"],
  ["app/student/profile/page.tsx", "sections/student/view/profile-view.tsx"],
  ["app/student/attendance/page.tsx", "sections/student/view/attendance-view.tsx"],
  ["app/student/status/page.tsx", "sections/student/view/status-view.tsx"],
  ["app/student/id-cards/page.tsx", "sections/student/view/id-cards-view.tsx"],
  ["app/student/seat-plan/page.tsx", "sections/student/view/seat-plan-view.tsx"],
  ["app/student/transcript/page.tsx", "sections/student/view/transcript-view.tsx"],
  ["app/sms/custom/page.tsx", "sections/sms/view/custom-view.tsx"],
  ["app/notifications/sms/page.tsx", "sections/notifications/view/sms-view.tsx"],
  ["app/settings/page.tsx", "sections/settings/view/profile-view.tsx"],
  ["app/settings/signatures/page.tsx", "sections/settings/view/signatures-view.tsx"],
  ["app/settings/staff/page.tsx", "sections/settings/view/staff-view.tsx"],
  ["app/session/page.tsx", "sections/session/view/manager-view.tsx"],
  ["app/session/create/page.tsx", "sections/session/view/create-view.tsx"],
  ["app/results/review/page.tsx", "sections/results/view/review-view.tsx"],
  ["app/results/publish/page.tsx", "sections/results/view/publish-view.tsx"],
  ["app/reports/at-a-glance/page.tsx", "sections/reports/view/at-a-glance-view.tsx"],
  ["app/reports/fail-list/page.tsx", "sections/reports/view/fail-list-view.tsx"],
  ["app/reports/marksheet/page.tsx", "sections/reports/view/marksheet-view.tsx"],
  ["app/reports/tabulation/page.tsx", "sections/reports/view/tabulation-view.tsx"],
  ["app/marks/entry/page.tsx", "sections/marks/view/entry-view.tsx"],
  ["app/marks/audit/page.tsx", "sections/marks/view/audit-view.tsx"],
  ["app/fees/page.tsx", "sections/fees/view/setup-view.tsx"],
  ["app/fees/waiver/page.tsx", "sections/fees/view/waiver-view.tsx"],
  ["app/fees/absent-fine/page.tsx", "sections/fees/view/absent-fine-view.tsx"],
  ["app/fees/collection/page.tsx", "sections/fees/view/collection-view.tsx"],
  ["app/fees/collection/history/page.tsx", "sections/fees/view/collection-history-view.tsx"],
  ["app/download/page.tsx", "sections/download/view/center-view.tsx"],
  ["app/download/admission-form/page.tsx", "sections/download/view/admission-form-view.tsx"],
  ["app/download/academic-calendar/page.tsx", "sections/download/view/academic-calendar-view.tsx"],
  ["app/download/banbeis/page.tsx", "sections/download/view/banbeis-view.tsx"],
  ["app/assets/page.tsx", "sections/assets/view/register-view.tsx"],
  ["app/assets/categories/page.tsx", "sections/assets/view/categories-view.tsx"],
  ["app/assets/depreciation/page.tsx", "sections/assets/view/depreciation-view.tsx"],
  ["app/assets/maintenance/page.tsx", "sections/assets/view/maintenance-view.tsx"],
  ["app/portal-login/page.tsx", "sections/auth/view/portal-login-view.tsx"],
  ["app/super-admin/page.tsx", "sections/super-admin/view/institutions-view.tsx"],
  ["app/user-role/page.tsx", "sections/user-role/view/accounts-view.tsx"],
  ["app/user-role/roles/page.tsx", "sections/user-role/view/roles-view.tsx"],
  ["app/user-role/delegation/page.tsx", "sections/user-role/view/delegation-view.tsx"],
  ["app/user-role/audit-logs/page.tsx", "sections/user-role/view/audit-logs-view.tsx"],
  ["app/accountant/page.tsx", "sections/accountant/view/overview-view.tsx"],
  ["app/accountant/income/page.tsx", "sections/accountant/view/income-view.tsx"],
  ["app/accountant/expense/page.tsx", "sections/accountant/view/expense-view.tsx"],
  ["app/accountant/payroll/page.tsx", "sections/accountant/view/payroll-view.tsx"],
  ["app/accountant/audit/page.tsx", "sections/accountant/view/audit-view.tsx"],
];

const relativeFixes = {
  "sections/student/view/profile-view.tsx": [['from "../StudentNavHeader"', 'from "@/sections/student/component/student-nav-header"']],
  "sections/student/view/attendance-view.tsx": [['from "../StudentNavHeader"', 'from "@/sections/student/component/student-nav-header"']],
  "sections/sms/view/custom-view.tsx": [['from "../SmsNavHeader"', 'from "@/sections/sms/component/sms-nav-header"']],
  "sections/settings/view/profile-view.tsx": [['from "./SettingNavHeader"', 'from "@/sections/settings/component/setting-nav-header"']],
  "sections/settings/view/staff-view.tsx": [['from "../SettingNavHeader"', 'from "@/sections/settings/component/setting-nav-header"']],
  "sections/session/view/manager-view.tsx": [['from "./SessionNavHeader"', 'from "@/sections/session/component/session-nav-header"']],
  "sections/session/view/create-view.tsx": [['from "../SessionNavHeader"', 'from "@/sections/session/component/session-nav-header"']],
  "sections/fees/view/setup-view.tsx": [
    ['from "./MonthlyFeeTemplate"', 'from "@/sections/fees/component/monthly-fee-template"'],
    ['from "./FeeNavHeader"', 'from "@/sections/fees/component/fee-nav-header"'],
    ['from "./waiverStore"', 'from "@/sections/fees/schema/waiver-store"'],
  ],
  "sections/fees/view/waiver-view.tsx": [
    ['from "../FeeNavHeader"', 'from "@/sections/fees/component/fee-nav-header"'],
    ['from "../waiverStore"', 'from "@/sections/fees/schema/waiver-store"'],
  ],
  "sections/fees/view/absent-fine-view.tsx": [
    ['from "../collection/ManualFeeNavHeader"', 'from "@/sections/fees/component/manual-fee-nav-header"'],
    ['from "../collection/FeeCollectionCounterModal"', 'from "@/sections/fees/component/fee-collection-counter-modal"'],
  ],
  "sections/fees/view/collection-view.tsx": [
    ['from "./ManualFeeNavHeader"', 'from "@/sections/fees/component/manual-fee-nav-header"'],
    ['from "./collectionStore"', 'from "@/sections/fees/schema/collection-store"'],
    ['from "./MoneyReceiptModal"', 'from "@/sections/fees/component/money-receipt-modal"'],
    ['from "../MonthlyFeeTemplate"', 'from "@/sections/fees/component/monthly-fee-template"'],
    ['from "../waiverStore"', 'from "@/sections/fees/schema/waiver-store"'],
  ],
  "sections/fees/view/collection-history-view.tsx": [
    ['from "../ManualFeeNavHeader"', 'from "@/sections/fees/component/manual-fee-nav-header"'],
    ['from "../collectionStore"', 'from "@/sections/fees/schema/collection-store"'],
    ['from "../MoneyReceiptModal"', 'from "@/sections/fees/component/money-receipt-modal"'],
  ],
  "sections/download/view/center-view.tsx": [['from "./DownloadNavHeader"', 'from "@/sections/download/component/download-nav-header"']],
  "sections/download/view/admission-form-view.tsx": [['from "../DownloadNavHeader"', 'from "@/sections/download/component/download-nav-header"']],
  "sections/download/view/academic-calendar-view.tsx": [['from "../DownloadNavHeader"', 'from "@/sections/download/component/download-nav-header"']],
  "sections/download/view/banbeis-view.tsx": [['from "../DownloadNavHeader"', 'from "@/sections/download/component/download-nav-header"']],
  "sections/assets/view/register-view.tsx": [
    ['from "./AssetNavHeader"', 'from "@/sections/assets/component/asset-nav-header"'],
    ['from "./assetStore"', 'from "@/sections/assets/schema/asset-store"'],
  ],
  "sections/assets/view/categories-view.tsx": [
    ['from "../AssetNavHeader"', 'from "@/sections/assets/component/asset-nav-header"'],
    ['from "../assetStore"', 'from "@/sections/assets/schema/asset-store"'],
  ],
  "sections/assets/view/depreciation-view.tsx": [
    ['from "../AssetNavHeader"', 'from "@/sections/assets/component/asset-nav-header"'],
    ['from "../assetStore"', 'from "@/sections/assets/schema/asset-store"'],
  ],
  "sections/assets/view/maintenance-view.tsx": [
    ['from "../AssetNavHeader"', 'from "@/sections/assets/component/asset-nav-header"'],
    ['from "../assetStore"', 'from "@/sections/assets/schema/asset-store"'],
  ],
  "sections/user-role/view/accounts-view.tsx": [
    ['from "./UserRoleNavHeader"', 'from "@/sections/user-role/component/user-role-nav-header"'],
    ['from "./userRoleStore"', 'from "@/sections/user-role/schema/user-role-store"'],
  ],
  "sections/user-role/view/roles-view.tsx": [
    ['from "../UserRoleNavHeader"', 'from "@/sections/user-role/component/user-role-nav-header"'],
    ['from "../userRoleStore"', 'from "@/sections/user-role/schema/user-role-store"'],
  ],
  "sections/user-role/view/delegation-view.tsx": [
    ['from "../UserRoleNavHeader"', 'from "@/sections/user-role/component/user-role-nav-header"'],
    ['from "../userRoleStore"', 'from "@/sections/user-role/schema/user-role-store"'],
  ],
  "sections/user-role/view/audit-logs-view.tsx": [
    ['from "../UserRoleNavHeader"', 'from "@/sections/user-role/component/user-role-nav-header"'],
    ['from "../userRoleStore"', 'from "@/sections/user-role/schema/user-role-store"'],
  ],
  "sections/accountant/view/overview-view.tsx": [
    ['from "./AccountantNavHeader"', 'from "@/sections/accountant/component/accountant-nav-header"'],
    ['from "./accountantStore"', 'from "@/sections/accountant/schema/accountant-store"'],
  ],
  "sections/accountant/view/income-view.tsx": [
    ['from "../AccountantNavHeader"', 'from "@/sections/accountant/component/accountant-nav-header"'],
    ['from "../accountantStore"', 'from "@/sections/accountant/schema/accountant-store"'],
  ],
  "sections/accountant/view/expense-view.tsx": [
    ['from "../AccountantNavHeader"', 'from "@/sections/accountant/component/accountant-nav-header"'],
    ['from "../accountantStore"', 'from "@/sections/accountant/schema/accountant-store"'],
  ],
  "sections/accountant/view/payroll-view.tsx": [
    ['from "../AccountantNavHeader"', 'from "@/sections/accountant/component/accountant-nav-header"'],
    ['from "../accountantStore"', 'from "@/sections/accountant/schema/accountant-store"'],
  ],
  "sections/accountant/view/audit-view.tsx": [
    ['from "../AccountantNavHeader"', 'from "@/sections/accountant/component/accountant-nav-header"'],
    ['from "../accountantStore"', 'from "@/sections/accountant/schema/accountant-store"'],
  ],
};

views.forEach(([from, to]) => {
  copyAndRewrite(from, to, relativeFixes[to] || []);
});

const components = [
  ["app/results/ResultNavHeader.tsx", "sections/results/component/result-nav-header.tsx"],
  ["app/student/StudentNavHeader.tsx", "sections/student/component/student-nav-header.tsx"],
  ["app/session/SessionNavHeader.tsx", "sections/session/component/session-nav-header.tsx"],
  ["app/download/DownloadNavHeader.tsx", "sections/download/component/download-nav-header.tsx"],
  ["app/fees/FeeNavHeader.tsx", "sections/fees/component/fee-nav-header.tsx"],
  ["app/settings/SettingNavHeader.tsx", "sections/settings/component/setting-nav-header.tsx"],
  ["app/sms/SmsNavHeader.tsx", "sections/sms/component/sms-nav-header.tsx"],
  ["app/user-role/UserRoleNavHeader.tsx", "sections/user-role/component/user-role-nav-header.tsx"],
  ["app/accountant/AccountantNavHeader.tsx", "sections/accountant/component/accountant-nav-header.tsx"],
  ["app/assets/AssetNavHeader.tsx", "sections/assets/component/asset-nav-header.tsx"],
  ["app/fees/MonthlyFeeTemplate.tsx", "sections/fees/component/monthly-fee-template.tsx"],
  ["app/fees/collection/MoneyReceiptModal.tsx", "sections/fees/component/money-receipt-modal.tsx"],
  ["app/fees/collection/FeeCollectionCounterModal.tsx", "sections/fees/component/fee-collection-counter-modal.tsx"],
  ["app/fees/collection/ManualFeeNavHeader.tsx", "sections/fees/component/manual-fee-nav-header.tsx"],
  ["components/TemplateManagementSection.tsx", "sections/academic/component/template-management-section.tsx"],
  ["components/MarkInputPdfModal.tsx", "sections/marks/component/mark-input-pdf-modal.tsx"],
];

components.forEach(([from, to]) => copyAndRewrite(from, to));

const stores = [
  ["app/fees/waiverStore.ts", "sections/fees/schema/waiver-store.ts"],
  ["app/fees/collection/collectionStore.ts", "sections/fees/schema/collection-store.ts"],
  ["app/user-role/userRoleStore.ts", "sections/user-role/schema/user-role-store.ts"],
  ["app/accountant/accountantStore.ts", "sections/accountant/schema/accountant-store.ts"],
  ["app/assets/assetStore.ts", "sections/assets/schema/asset-store.ts"],
];

stores.forEach(([from, to]) => copyAndRewrite(from, to));

const thinPages = [
  ["app/page.tsx", "@/sections/dashboard/view/overview-view"],
  ["app/academic/rules/page.tsx", "@/sections/academic/view/rules-view"],
  ["app/academic/subject-mapping/page.tsx", "@/sections/academic/view/subject-mapping-view"],
  ["app/setup/classes/page.tsx", "@/sections/setup/view/classes-view"],
  ["app/setup/subject-mapping/page.tsx", "@/sections/setup/view/subject-mapping-view"],
  ["app/setup/exams/page.tsx", "@/sections/setup/view/exams-view"],
  ["app/setup/exam-routine/page.tsx", "@/sections/setup/view/exam-routine-view"],
  ["app/setup/students/page.tsx", "@/sections/setup/view/students-view"],
  ["app/setup/student-info/page.tsx", "@/sections/setup/view/student-info-view"],
  ["app/student/profile/page.tsx", "@/sections/student/view/profile-view"],
  ["app/student/attendance/page.tsx", "@/sections/student/view/attendance-view"],
  ["app/student/status/page.tsx", "@/sections/student/view/status-view"],
  ["app/student/id-cards/page.tsx", "@/sections/student/view/id-cards-view"],
  ["app/student/seat-plan/page.tsx", "@/sections/student/view/seat-plan-view"],
  ["app/student/transcript/page.tsx", "@/sections/student/view/transcript-view"],
  ["app/sms/custom/page.tsx", "@/sections/sms/view/custom-view"],
  ["app/notifications/sms/page.tsx", "@/sections/notifications/view/sms-view"],
  ["app/settings/page.tsx", "@/sections/settings/view/profile-view"],
  ["app/settings/signatures/page.tsx", "@/sections/settings/view/signatures-view"],
  ["app/settings/staff/page.tsx", "@/sections/settings/view/staff-view"],
  ["app/session/page.tsx", "@/sections/session/view/manager-view"],
  ["app/session/create/page.tsx", "@/sections/session/view/create-view"],
  ["app/results/review/page.tsx", "@/sections/results/view/review-view"],
  ["app/results/publish/page.tsx", "@/sections/results/view/publish-view"],
  ["app/reports/at-a-glance/page.tsx", "@/sections/reports/view/at-a-glance-view"],
  ["app/reports/fail-list/page.tsx", "@/sections/reports/view/fail-list-view"],
  ["app/reports/marksheet/page.tsx", "@/sections/reports/view/marksheet-view"],
  ["app/reports/tabulation/page.tsx", "@/sections/reports/view/tabulation-view"],
  ["app/marks/entry/page.tsx", "@/sections/marks/view/entry-view"],
  ["app/marks/audit/page.tsx", "@/sections/marks/view/audit-view"],
  ["app/fees/page.tsx", "@/sections/fees/view/setup-view"],
  ["app/fees/waiver/page.tsx", "@/sections/fees/view/waiver-view"],
  ["app/fees/absent-fine/page.tsx", "@/sections/fees/view/absent-fine-view"],
  ["app/fees/collection/page.tsx", "@/sections/fees/view/collection-view"],
  ["app/fees/collection/history/page.tsx", "@/sections/fees/view/collection-history-view"],
  ["app/download/page.tsx", "@/sections/download/view/center-view"],
  ["app/download/admission-form/page.tsx", "@/sections/download/view/admission-form-view"],
  ["app/download/academic-calendar/page.tsx", "@/sections/download/view/academic-calendar-view"],
  ["app/download/banbeis/page.tsx", "@/sections/download/view/banbeis-view"],
  ["app/assets/page.tsx", "@/sections/assets/view/register-view"],
  ["app/assets/categories/page.tsx", "@/sections/assets/view/categories-view"],
  ["app/assets/depreciation/page.tsx", "@/sections/assets/view/depreciation-view"],
  ["app/assets/maintenance/page.tsx", "@/sections/assets/view/maintenance-view"],
  ["app/portal-login/page.tsx", "@/sections/auth/view/portal-login-view"],
  ["app/super-admin/page.tsx", "@/sections/super-admin/view/institutions-view"],
  ["app/user-role/page.tsx", "@/sections/user-role/view/accounts-view"],
  ["app/user-role/roles/page.tsx", "@/sections/user-role/view/roles-view"],
  ["app/user-role/delegation/page.tsx", "@/sections/user-role/view/delegation-view"],
  ["app/user-role/audit-logs/page.tsx", "@/sections/user-role/view/audit-logs-view"],
  ["app/accountant/page.tsx", "@/sections/accountant/view/overview-view"],
  ["app/accountant/income/page.tsx", "@/sections/accountant/view/income-view"],
  ["app/accountant/expense/page.tsx", "@/sections/accountant/view/expense-view"],
  ["app/accountant/payroll/page.tsx", "@/sections/accountant/view/payroll-view"],
  ["app/accountant/audit/page.tsx", "@/sections/accountant/view/audit-view"],
];

thinPages.forEach(([file, target]) => {
  write(path.join(src, file), `export { default } from "${target}";\n`);
});

write(
  path.join(src, "app/settings/teachers/page.tsx"),
  `export { default } from "@/sections/settings/view/staff-view";\n`
);
write(
  path.join(src, "app/settings/user-role/page.tsx"),
  `export { default } from "@/sections/user-role/view/accounts-view";\n`
);

const reexports = [
  ["components/AccountantNavHeader.tsx", "@/sections/accountant/component/accountant-nav-header"],
  ["components/DownloadNavHeader.tsx", "@/sections/download/component/download-nav-header"],
  ["components/FeeNavHeader.tsx", "@/sections/fees/component/fee-nav-header"],
  ["components/ResultNavHeader.tsx", "@/sections/results/component/result-nav-header"],
  ["components/SessionNavHeader.tsx", "@/sections/session/component/session-nav-header"],
  ["components/SettingNavHeader.tsx", "@/sections/settings/component/setting-nav-header"],
  ["components/SmsNavHeader.tsx", "@/sections/sms/component/sms-nav-header"],
  ["components/StudentNavHeader.tsx", "@/sections/student/component/student-nav-header"],
  ["components/UserRoleNavHeader.tsx", "@/sections/user-role/component/user-role-nav-header"],
];

reexports.forEach(([file, target]) => {
  write(path.join(src, file), `export * from "${target}";\n`);
});

const leftoverAppFiles = [
  "app/results/ResultNavHeader.tsx",
  "app/student/StudentNavHeader.tsx",
  "app/session/SessionNavHeader.tsx",
  "app/download/DownloadNavHeader.tsx",
  "app/fees/FeeNavHeader.tsx",
  "app/settings/SettingNavHeader.tsx",
  "app/sms/SmsNavHeader.tsx",
  "app/user-role/UserRoleNavHeader.tsx",
  "app/accountant/AccountantNavHeader.tsx",
  "app/assets/AssetNavHeader.tsx",
  "app/fees/MonthlyFeeTemplate.tsx",
  "app/fees/collection/MoneyReceiptModal.tsx",
  "app/fees/collection/FeeCollectionCounterModal.tsx",
  "app/fees/collection/ManualFeeNavHeader.tsx",
  "app/fees/waiverStore.ts",
  "app/fees/collection/collectionStore.ts",
  "app/user-role/userRoleStore.ts",
  "app/accountant/accountantStore.ts",
  "app/assets/assetStore.ts",
];

leftoverAppFiles.forEach((file) => {
  const full = path.join(src, file);
  if (fs.existsSync(full)) fs.unlinkSync(full);
});

["components/TemplateManagementSection.tsx", "components/MarkInputPdfModal.tsx"].forEach((file) => {
  const full = path.join(src, file);
  if (fs.existsSync(full)) fs.unlinkSync(full);
});

console.log("Frontend structure migration complete");

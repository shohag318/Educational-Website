"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Box,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { RotateCcw, Save, FileSignature } from "@/components/iconify/lucide";
import {
  SchoolBasicInfo,
  DEFAULT_SCHOOL_INFO,
  getStoredSchoolInfo,
  saveStoredSchoolInfo,
  resetSchoolInfoToDefault,
} from "@/lib/settingsStore";
import {
  SettingsPageShell,
  SettingsPageHeader,
  SettingsSection,
  SettingsFilterGrid,
  SettingsNotice,
} from "@/sections/settings/component/settings-page-ui";
import { AppButton } from "@/components/button/app-button";
import { AppTabs } from "@/components/ui/tabs-component";
import { AppTextField } from "@/components/text-field/app-text-field";
import { AppSelect } from "@/components/select/app-select";

const INSTITUTE_TYPE_OPTIONS = [
  { value: "SCHOOL_AND_COLLEGE", label: "School & College (Class 6 - 12)" },
  { value: "HIGH_SCHOOL", label: "Secondary High School (Class 6 - 10)" },
  { value: "COLLEGE", label: "Higher Secondary College (Class 11 - 12)" },
  { value: "MADRASAH", label: "Madrasah (Dakhil & Alim)" },
];

const BOARD_OPTIONS = [
  { value: "Dhaka", label: "BISE, Dhaka" },
  { value: "Chattogram", label: "BISE, Chattogram" },
  { value: "Rajshahi", label: "BISE, Rajshahi" },
  { value: "Barishal", label: "BISE, Barishal" },
  { value: "Sylhet", label: "BISE, Sylhet" },
  { value: "Cumilla", label: "BISE, Cumilla" },
  { value: "Dinajpur", label: "BISE, Dinajpur" },
  { value: "Mymensingh", label: "BISE, Mymensingh" },
  { value: "Madrasah", label: "Bangladesh Madrasah Education Board" },
  { value: "Technical", label: "Bangladesh Technical Education Board (BTEB)" },
];

const YEAR_OPTIONS = [
  { value: "2027", label: "2027" },
  { value: "2026", label: "2026 (Current Session)" },
  { value: "2025", label: "2025" },
  { value: "2024", label: "2024" },
];

const TERM_OPTIONS = [
  { value: "Annual Examination", label: "Annual Examination" },
  { value: "Half-Yearly Examination", label: "Half-Yearly Examination" },
  { value: "Pre-Test Examination", label: "Pre-Test Examination" },
  { value: "Test Examination", label: "Test Examination (SSC / HSC Final Selection)" },
  { value: "1st Terminal Evaluation", label: "1st Terminal Evaluation" },
];

const MEDIUM_OPTIONS = [
  { value: "BOTH", label: "Dual Medium (Bangla & English Version)" },
  { value: "BANGLA", label: "Bangla Medium Only" },
  { value: "ENGLISH", label: "English Version Only" },
];

const DIVISION_OPTIONS = [
  { value: "Dhaka", label: "Dhaka Division" },
  { value: "Chattogram", label: "Chattogram Division" },
  { value: "Rajshahi", label: "Rajshahi Division" },
  { value: "Khulna", label: "Khulna Division" },
  { value: "Barishal", label: "Barishal Division" },
  { value: "Sylhet", label: "Sylhet Division" },
  { value: "Rangpur", label: "Rangpur Division" },
  { value: "Mymensingh", label: "Mymensingh Division" },
];

const HEAD_TITLE_OPTIONS = [
  { value: "Principal", label: "Principal (অধ্যক্ষ)" },
  { value: "Headmaster", label: "Headmaster (প্রধান শিক্ষক)" },
  { value: "Headmistress", label: "Headmistress (প্রধান শিক্ষিকা)" },
  { value: "Superintendent", label: "Superintendent (সুপারিনটেনডেন্ট)" },
];

const fullWidth = { gridColumn: "1 / -1" } as const;

export default function SettingModulePage() {
  const [formData, setFormData] = useState<SchoolBasicInfo>(DEFAULT_SCHOOL_INFO);
  const [activeTab, setActiveTab] = useState<
    "basic" | "session" | "contact" | "leadership" | "preview"
  >("basic");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData(getStoredSchoolInfo());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleChange = (field: keyof SchoolBasicInfo, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveStoredSchoolInfo(formData);
    setHasChanges(false);
    showToast("School/College basic information successfully saved and synced across dashboard!");
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all school settings to NCTB Standard default?")) {
      const reset = resetSchoolInfoToDefault();
      setFormData(reset);
      setHasChanges(false);
      showToast("Reset to NCTB Standard default settings.");
    }
  };

  const toggleShift = (_: React.MouseEvent<HTMLElement>, value: string[]) => {
    if (value) handleChange("shifts", value);
  };

  const toggleWeekend = (_: React.MouseEvent<HTMLElement>, value: string[]) => {
    if (value) handleChange("weekendDays", value);
  };

  return (
    <SettingsPageShell>
      <SettingsPageHeader
        heading="Institution Profile"
        current="Profile"
        action={
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, alignItems: "center" }}>
            <Chip
              size="small"
              label={`EIIN: ${formData.eiin}`}
              sx={{ height: 22, fontWeight: 700, fontFamily: "monospace" }}
            />
            <AppButton
              type="button"
              onClick={handleReset}
              variant="outline"
              color="inherit"
              size="small"
              startIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset Default
            </AppButton>
            <AppButton
              type="button"
              onClick={() => handleSave()}
              variant="contained"
              color="primary"
              size="small"
              startIcon={<Save className="w-4 h-4" />}
            >
              {hasChanges ? "Save Changes *" : "Save Settings"}
            </AppButton>
          </Stack>
        }
      />

      {toastMessage ? <SettingsNotice severity="success">{toastMessage}</SettingsNotice> : null}

      <AppTabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "basic" | "session" | "contact" | "leadership" | "preview")
        }
        items={[
          { value: "basic", label: "General Info" },
          { value: "session", label: "Session & Defaults" },
          { value: "contact", label: "Contact Details" },
          { value: "leadership", label: "Signatures" },
          { value: "preview", label: "Preview" },
        ]}
      />

      <Box component="form" onSubmit={handleSave} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {activeTab === "basic" && (
          <SettingsSection
            title="Institution Identity"
            subtitle="Official institution names, EIIN code, and Board affiliation."
          >
            <SettingsFilterGrid columns={2}>
              <Box sx={fullWidth}>
                <AppTextField
                  required
                  label="School / College Official Name (English)"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Dhaka Ideal Model High School & College"
                  helperText="Used in official reports & header"
                />
              </Box>
              <Box sx={fullWidth}>
                <AppTextField
                  label="School / College Name in Bengali (বাংলা নাম)"
                  value={formData.nameBn}
                  onChange={(e) => handleChange("nameBn", e.target.value)}
                  placeholder="যেমন: ঢাকা আইডিয়াল মডেল হাই স্কুল অ্যান্ড কলেজ"
                />
              </Box>
              <AppTextField
                required
                label="EIIN (Institute ID Number)"
                value={formData.eiin}
                onChange={(e) => handleChange("eiin", e.target.value)}
                placeholder="108254"
                inputProps={{ maxLength: 8 }}
                helperText="6-digit institutional code"
                sx={{ "& input": { fontFamily: "monospace", fontWeight: 700 } }}
              />
              <AppSelect
                label="Institute Type / Category"
                value={formData.instituteType}
                onChange={(v) => handleChange("instituteType", v)}
                options={INSTITUTE_TYPE_OPTIONS}
              />
              <AppSelect
                label="Education Board (BISE)"
                value={formData.board}
                onChange={(v) => handleChange("board", v)}
                options={BOARD_OPTIONS}
              />
              <AppTextField
                label="Establishment Year (ESTD)"
                value={formData.establishedYear}
                onChange={(e) => handleChange("establishedYear", e.target.value)}
                placeholder="e.g. 1994"
              />
              <AppTextField
                label="Institution Code"
                value={formData.institutionCode}
                onChange={(e) => handleChange("institutionCode", e.target.value)}
                placeholder="e.g. DIMHSC-1082"
                sx={{ "& input": { fontFamily: "monospace" } }}
              />
              <AppTextField
                label="Board Center Code"
                value={formData.centerCode}
                onChange={(e) => handleChange("centerCode", e.target.value)}
                placeholder="e.g. 304"
                sx={{ "& input": { fontFamily: "monospace" } }}
              />
              <Box sx={fullWidth}>
                <AppTextField
                  label="Motto / Educational Slogan"
                  value={formData.motto}
                  onChange={(e) => handleChange("motto", e.target.value)}
                  placeholder="e.g. Excellence in Education, Character, and Discipline"
                />
              </Box>
            </SettingsFilterGrid>
          </SettingsSection>
        )}

        {activeTab === "session" && (
          <SettingsSection
            title="Session & Defaults"
            subtitle="Set active academic year, evaluation terms, medium, and shifts."
          >
            <SettingsFilterGrid columns={2}>
              <AppSelect
                label="Current Active Academic Year"
                value={formData.academicYear}
                onChange={(v) => handleChange("academicYear", v)}
                options={YEAR_OPTIONS}
              />
              <AppSelect
                label="Active Examination / Evaluation Term"
                value={formData.activeTerm}
                onChange={(v) => handleChange("activeTerm", v)}
                options={TERM_OPTIONS}
              />
              <AppSelect
                label="Curriculum Medium / Version"
                value={formData.medium}
                onChange={(v) => handleChange("medium", v)}
                options={MEDIUM_OPTIONS}
              />
              <AppTextField
                label="Class Range"
                value={formData.classRange}
                onChange={(e) => handleChange("classRange", e.target.value)}
                placeholder="e.g. Class 6 to Class 12"
              />
              <Box sx={fullWidth}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", mb: 1 }}>
                  Operating Shifts
                </Typography>
                <ToggleButtonGroup
                  exclusive={false}
                  value={formData.shifts || []}
                  onChange={toggleShift}
                  size="small"
                  color="primary"
                  sx={{ flexWrap: "wrap", gap: 1, "& .MuiToggleButton-root": { px: 2, borderRadius: "8px !important", border: "1px solid", borderColor: "divider", textTransform: "none", fontWeight: 600 } }}
                >
                  {["Morning", "Day", "Evening"].map((shift) => (
                    <ToggleButton key={shift} value={shift}>
                      {shift} Shift
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
              <Box sx={fullWidth}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", mb: 1 }}>
                  Weekly Weekend Days
                </Typography>
                <ToggleButtonGroup
                  exclusive={false}
                  value={formData.weekendDays || []}
                  onChange={toggleWeekend}
                  size="small"
                  color="primary"
                  sx={{ flexWrap: "wrap", gap: 1, "& .MuiToggleButton-root": { px: 2, borderRadius: "8px !important", border: "1px solid", borderColor: "divider", textTransform: "none", fontWeight: 600 } }}
                >
                  {["Friday", "Saturday", "Sunday"].map((day) => (
                    <ToggleButton key={day} value={day}>
                      {day}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            </SettingsFilterGrid>
          </SettingsSection>
        )}

        {activeTab === "contact" && (
          <SettingsSection
            title="Campus Location & Contacts"
            subtitle="Address, contact hotline, email, and website displayed on marksheets and report headers."
          >
            <SettingsFilterGrid columns={2}>
              <Box sx={fullWidth}>
                <AppTextField
                  label="Campus Address (Street / Road / Block)"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="e.g. Road 4, Block D, Section 10"
                />
              </Box>
              <AppTextField
                label="Thana / Upazila"
                value={formData.thana}
                onChange={(e) => handleChange("thana", e.target.value)}
                placeholder="e.g. Mirpur"
              />
              <AppTextField
                label="District / Zilla"
                value={formData.district}
                onChange={(e) => handleChange("district", e.target.value)}
                placeholder="e.g. Dhaka"
              />
              <AppSelect
                label="Administrative Division"
                value={formData.division}
                onChange={(v) => handleChange("division", v)}
                options={DIVISION_OPTIONS}
              />
              <AppTextField
                label="Postal / Zip Code"
                value={formData.postalCode}
                onChange={(e) => handleChange("postalCode", e.target.value)}
                placeholder="e.g. 1216"
                sx={{ "& input": { fontFamily: "monospace" } }}
              />
              <AppTextField
                label="Official Landline Phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="e.g. +880 2-9001234"
              />
              <AppTextField
                label="Official SMS / Mobile Hotline"
                value={formData.mobile}
                onChange={(e) => handleChange("mobile", e.target.value)}
                placeholder="e.g. +880 1712-345678"
                sx={{ "& input": { fontFamily: "monospace" } }}
              />
              <AppTextField
                type="email"
                label="Official Email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="info@dhakaideal.edu.bd"
              />
              <AppTextField
                label="Institutional Website"
                value={formData.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://www.dhakaideal.edu.bd"
              />
            </SettingsFilterGrid>
          </SettingsSection>
        )}

        {activeTab === "leadership" && (
          <SettingsSection
            title="Administration & Signatures"
            subtitle="Official designations appearing on printed report cards and tabulation sheets."
            action={
              <AppButton
                component={Link}
                href="/settings/signatures"
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<FileSignature className="w-4 h-4" />}
              >
                Signature Setup
              </AppButton>
            }
          >
            <Stack spacing={2.5}>
              <SettingsNotice severity="info">
                Upload handwritten signatures, use the digital draw pad, or manage official seals from Signature Setup.
              </SettingsNotice>
              <SettingsFilterGrid columns={2}>
                <AppSelect
                  label="Head of Institution Title"
                  value={formData.headTitle}
                  onChange={(v) => handleChange("headTitle", v)}
                  options={HEAD_TITLE_OPTIONS}
                />
                <AppTextField
                  label="Head of Institution Full Name"
                  value={formData.headName}
                  onChange={(e) => handleChange("headName", e.target.value)}
                  placeholder="e.g. Prof. A. K. M. Shamsuddin"
                  sx={{ "& input": { fontWeight: 700 } }}
                />
                <AppTextField
                  label="Head's Direct Phone / Mobile"
                  value={formData.headPhone || ""}
                  onChange={(e) => handleChange("headPhone", e.target.value)}
                  placeholder="+880 1711-223344"
                />
                <AppTextField
                  type="email"
                  label="Head's Official Email"
                  value={formData.headEmail || ""}
                  onChange={(e) => handleChange("headEmail", e.target.value)}
                  placeholder="principal@dhakaideal.edu.bd"
                />
                <AppTextField
                  label="Examination Authority / Convener Title"
                  value={formData.controllerTitle}
                  onChange={(e) => handleChange("controllerTitle", e.target.value)}
                  placeholder="e.g. Exam Controller & Vice Principal"
                />
                <AppTextField
                  label="Examination Authority Full Name"
                  value={formData.controllerName}
                  onChange={(e) => handleChange("controllerName", e.target.value)}
                  placeholder="e.g. Mohammad Jahangir Hossain"
                  sx={{ "& input": { fontWeight: 700 } }}
                />
              </SettingsFilterGrid>
            </Stack>
          </SettingsSection>
        )}

        {activeTab === "preview" && (
          <>
            <SettingsSection
              title="Dashboard Navbar Preview"
              subtitle="How institution identity appears in the top navigation."
              action={
                <Chip
                  size="small"
                  label="Synchronized"
                  color="success"
                  variant="outlined"
                  sx={{ height: 22, fontWeight: 700 }}
                />
              }
            >
              <Box
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 2,
                  bgcolor: "grey.50",
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { sm: "center" },
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
                  <Chip
                    size="small"
                    label={`EIIN: ${formData.eiin}`}
                    sx={{ height: 22, fontWeight: 700, fontFamily: "monospace" }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                      {formData.name}
                    </Typography>
                    {formData.nameBn ? (
                      <Typography variant="caption" color="text.secondary">
                        {formData.nameBn}
                      </Typography>
                    ) : null}
                  </Box>
                </Stack>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: "center",
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 1.5,
                    border: 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    typography: "caption",
                    color: "text.secondary",
                  }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "success.main" }} />
                  <span>
                    Academic Year: <strong>{formData.academicYear}</strong>
                  </span>
                  <span>•</span>
                  <span>{formData.activeTerm}</span>
                </Stack>
              </Box>
            </SettingsSection>

            <SettingsSection
              title="Marksheet Header Preview"
              subtitle="Transcript header layout using current institution and signature fields."
            >
              <Box
                sx={{
                  border: 2,
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 3,
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.4 }}
                >
                  {formData.name}
                </Typography>
                {formData.nameBn ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, display: "block", mt: 0.5 }}
                  >
                    {formData.nameBn}
                  </Typography>
                ) : null}
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                  {formData.address}, {formData.thana}, {formData.district} - {formData.postalCode} • EIIN:{" "}
                  <strong style={{ fontFamily: "monospace" }}>{formData.eiin}</strong>
                </Typography>
                <Chip
                  size="small"
                  label="Academic Transcript / Progress Report Card"
                  sx={{
                    mt: 1.25,
                    height: 22,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    bgcolor: "grey.900",
                    color: "common.white",
                  }}
                />
                <Typography variant="caption" sx={{ display: "block", fontWeight: 700, mt: 1.25 }}>
                  {formData.activeTerm} • Academic Session: {formData.academicYear}
                </Typography>
                <Box
                  sx={{
                    pt: 3,
                    mt: 2,
                    borderTop: 1,
                    borderColor: "divider",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    textAlign: "left",
                    typography: "caption",
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                      Exam Controller / Convener
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formData.controllerName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formData.controllerTitle}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                      {formData.headTitle}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formData.headName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formData.headTitle}, {formData.name}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </SettingsSection>
          </>
        )}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{
            alignItems: { sm: "center" },
            justifyContent: "space-between",
            pt: 1,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {hasChanges ? (
              <Box component="span" sx={{ color: "warning.main", fontWeight: 600 }}>
                Unsaved changes in basic information
              </Box>
            ) : (
              "Settings are up to date and saved"
            )}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            <AppButton
              type="button"
              variant="outline"
              color="inherit"
              size="small"
              onClick={handleReset}
            >
              Reset to Default
            </AppButton>
            <AppButton
              type="submit"
              variant="contained"
              color="primary"
              size="small"
              startIcon={<Save className="w-4 h-4" />}
            >
              Save & Apply All Changes
            </AppButton>
          </Stack>
        </Stack>
      </Box>
    </SettingsPageShell>
  );
}

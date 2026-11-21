import { alpha } from "@mui/material/styles";
import type { Theme, Components } from "@mui/material/styles";
import { linkColor, softColor } from "./mixins";
import { FONT_PRIMARY } from "./typography";
import { RADIUS, TYPE } from "./spacing";

export function componentsOverrides(theme: Theme): Components<Theme> {
  const softByColor = {
    inherit: {
      color: theme.palette.text.primary,
      backgroundColor: alpha(theme.palette.grey[500], 0.16),
      "&:hover": { backgroundColor: alpha(theme.palette.grey[500], 0.32) },
    },
    primary: softColor(theme.palette.primary),
    secondary: softColor(theme.palette.secondary),
    info: softColor(theme.palette.info),
    success: softColor(theme.palette.success),
    warning: softColor(theme.palette.warning),
    error: softColor(theme.palette.error),
  };

  const linkByColor = {
    inherit: {
      color: theme.palette.text.primary,
      backgroundColor: "transparent",
      minWidth: 0,
      minHeight: 0,
      paddingLeft: 0,
      paddingRight: 0,
      fontWeight: 500,
      textDecoration: "underline",
      textUnderlineOffset: 3,
      "&:hover": {
        backgroundColor: "transparent",
        color: theme.palette.text.secondary,
        textDecoration: "underline",
      },
    },
    primary: linkColor(theme.palette.primary),
    secondary: linkColor(theme.palette.secondary),
    info: linkColor(theme.palette.info),
    success: linkColor(theme.palette.success),
    warning: linkColor(theme.palette.warning),
    error: linkColor(theme.palette.error),
  };

  return {
    MuiCssBaseline: {
      styleOverrides: {
        "*, *::before, *::after": {
          boxSizing: "border-box",
        },
        html: {
          fontSize: 16,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
        body: {
          margin: 0,
          fontFamily: FONT_PRIMARY,
          fontSize: TYPE.body,
          fontWeight: 400,
          lineHeight: 1.57,
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
        },
        "button, input, textarea, select": {
          fontFamily: "inherit",
        },
      },
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          h1: "h1",
          h2: "h2",
          h3: "h3",
          h4: "h4",
          h5: "h5",
          h6: "h6",
          subtitle1: "p",
          subtitle2: "p",
          body1: "p",
          body2: "p",
        },
      },
      styleOverrides: {
        root: {
          fontFamily: FONT_PRIMARY,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: RADIUS.control,
          fontFamily: FONT_PRIMARY,
          fontWeight: 500,
          paddingLeft: 14,
          paddingRight: 14,
        },
        sizeSmall: { minHeight: 32, fontSize: TYPE.sm },
        sizeMedium: { minHeight: 36, fontSize: TYPE.md },
        sizeLarge: { minHeight: 42, fontSize: TYPE.body },
        contained: {
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
      },
      variants: [
        { props: { variant: "soft" }, style: { boxShadow: "none", ...softByColor.inherit } },
        { props: { variant: "soft", color: "primary" }, style: softByColor.primary },
        { props: { variant: "soft", color: "secondary" }, style: softByColor.secondary },
        { props: { variant: "soft", color: "info" }, style: softByColor.info },
        { props: { variant: "soft", color: "success" }, style: softByColor.success },
        { props: { variant: "soft", color: "warning" }, style: softByColor.warning },
        { props: { variant: "soft", color: "error" }, style: softByColor.error },
        { props: { variant: "link" }, style: linkByColor.inherit },
        { props: { variant: "link", color: "primary" }, style: linkByColor.primary },
        { props: { variant: "link", color: "secondary" }, style: linkByColor.secondary },
        { props: { variant: "link", color: "info" }, style: linkByColor.info },
        { props: { variant: "link", color: "success" }, style: linkByColor.success },
        { props: { variant: "link", color: "warning" }, style: linkByColor.warning },
        { props: { variant: "link", color: "error" }, style: linkByColor.error },
        { props: { variant: "link", color: "inherit" }, style: linkByColor.inherit },
      ],
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: RADIUS.control },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: RADIUS.card },
        root: {
          backgroundImage: "none",
          fontFamily: FONT_PRIMARY,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS.card,
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
          border: `1px solid ${theme.palette.divider}`,
          fontFamily: FONT_PRIMARY,
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: { padding: theme.spacing(2, 2.5) },
        title: { fontSize: TYPE.md, fontWeight: 700 },
        subheader: { fontSize: TYPE.sm },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: theme.spacing(2, 2.5),
          "&:last-child": { paddingBottom: theme.spacing(2.5) },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small", variant: "outlined" },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: TYPE.md, fontWeight: 500, fontFamily: FONT_PRIMARY },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS.control,
          backgroundColor: theme.palette.common.white,
          fontFamily: FONT_PRIMARY,
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.text.primary,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.main,
            borderWidth: 1,
          },
        },
        notchedOutline: {
          borderColor: alpha(theme.palette.grey[500], 0.2),
        },
        input: {
          paddingTop: 10,
          paddingBottom: 10,
          fontSize: TYPE.body,
          fontFamily: FONT_PRIMARY,
        },
        inputSizeSmall: {
          paddingTop: 8.5,
          paddingBottom: 8.5,
          fontSize: TYPE.md,
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS.control,
          backgroundColor: alpha(theme.palette.grey[500], 0.08),
          "&:before, &:after": { display: "none" },
          "&:hover": { backgroundColor: alpha(theme.palette.grey[500], 0.16) },
          "&.Mui-focused": { backgroundColor: alpha(theme.palette.grey[500], 0.16) },
        },
      },
    },
    MuiInputAdornment: {
      styleOverrides: {
        root: { color: theme.palette.text.disabled },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: { marginLeft: 2, fontSize: TYPE.sm, fontFamily: FONT_PRIMARY },
      },
    },
    MuiSelect: {
      defaultProps: { size: "small" },
      styleOverrides: {
        select: { fontFamily: FONT_PRIMARY, fontSize: TYPE.md },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { fontFamily: FONT_PRIMARY, fontSize: TYPE.md, minHeight: 40 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500, borderRadius: RADIUS.chip, fontFamily: FONT_PRIMARY },
        sizeSmall: { height: 24, fontSize: TYPE.xs },
        sizeMedium: { height: 28, fontSize: TYPE.sm },
      },
      variants: [
        { props: { variant: "soft" }, style: softByColor.inherit },
        { props: { variant: "soft", color: "primary" }, style: softByColor.primary },
        { props: { variant: "soft", color: "secondary" }, style: softByColor.secondary },
        { props: { variant: "soft", color: "info" }, style: softByColor.info },
        { props: { variant: "soft", color: "success" }, style: softByColor.success },
        { props: { variant: "soft", color: "warning" }, style: softByColor.warning },
        { props: { variant: "soft", color: "error" }, style: softByColor.error },
      ],
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: RADIUS.control + 2 },
      },
      variants: [
        { props: { variant: "soft", severity: "info" }, style: { ...softByColor.info, color: theme.palette.info.darker } },
        { props: { variant: "soft", severity: "success" }, style: { ...softByColor.success, color: theme.palette.success.darker } },
        { props: { variant: "soft", severity: "warning" }, style: { ...softByColor.warning, color: theme.palette.warning.darker } },
        { props: { variant: "soft", severity: "error" }, style: { ...softByColor.error, color: theme.palette.error.darker } },
      ],
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS.control + 2,
          boxShadow: "none",
          border: `1px solid ${theme.palette.divider}`,
          "&:before": { display: "none" },
          "&.Mui-expanded": { margin: 0 },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: { fontWeight: 700 },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        li: { fontSize: TYPE.md, fontFamily: FONT_PRIMARY },
        separator: { fontSize: TYPE.sm },
      },
    },
    MuiCheckbox: {
      defaultProps: { size: "small" },
    },
    MuiRadio: {
      defaultProps: { size: "small" },
    },
    MuiSwitch: {
      defaultProps: { size: "small" },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          // Radius/border belong on the outer Card (CommonTable), not here —
          // otherwise header bg leaves a white gap in the rounded corners.
          borderRadius: 0,
          border: "none",
          backgroundColor: "transparent",
          boxShadow: "none",
        },
      },
    },
    MuiTable: {
      defaultProps: {
        size: "medium",
      },
      styleOverrides: {
        root: {
          borderCollapse: "separate",
          borderSpacing: 0,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: theme.palette.grey[100],
          "& .MuiTableCell-head": {
            fontFamily: FONT_PRIMARY,
            fontWeight: 700,
            fontSize: TYPE.md,
            lineHeight: 1.4,
            letterSpacing: "-0.01em",
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.grey[100],
            whiteSpace: "nowrap",
            borderRadius: 0,
            borderBottom: `1px solid ${theme.palette.divider}`,
            paddingTop: 14,
            paddingBottom: 14,
            paddingLeft: 16,
            paddingRight: 16,
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          "& .MuiTableRow-root:last-of-type .MuiTableCell-root": {
            borderBottom: 0,
          },
          "& .MuiTypography-subtitle2, & .MuiTypography-body2": {
            fontFamily: FONT_PRIMARY,
            fontSize: TYPE.md,
            fontWeight: 700,
            lineHeight: 1.45,
            color: theme.palette.text.primary,
          },
          "& .MuiTypography-caption": {
            fontFamily: FONT_PRIMARY,
            fontSize: TYPE.sm,
            fontWeight: 500,
            lineHeight: 1.4,
            color: theme.palette.text.secondary,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: alpha(theme.palette.grey[500], 0.04),
          },
          "&.Mui-selected": {
            backgroundColor: alpha(theme.palette.primary.main, 0.06),
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: FONT_PRIMARY,
          borderColor: theme.palette.divider,
          borderBottom: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
          fontSize: TYPE.md,
          lineHeight: 1.5,
          color: theme.palette.text.primary,
          paddingTop: 14,
          paddingBottom: 14,
          paddingLeft: 16,
          paddingRight: 16,
          verticalAlign: "middle",
        },
        head: {
          fontFamily: FONT_PRIMARY,
          fontWeight: 700,
          fontSize: TYPE.md,
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.grey[100],
        },
        sizeSmall: {
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 12,
          paddingRight: 12,
          fontSize: TYPE.sm,
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          borderTop: `1px solid ${theme.palette.divider}`,
          fontFamily: FONT_PRIMARY,
        },
        toolbar: {
          minHeight: 52,
          paddingLeft: 16,
          paddingRight: 8,
        },
        selectLabel: {
          fontSize: TYPE.md,
          fontWeight: 500,
          color: theme.palette.text.secondary,
        },
        displayedRows: {
          fontSize: TYPE.md,
          fontWeight: 500,
          color: theme.palette.text.secondary,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: RADIUS.card },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontFamily: FONT_PRIMARY, fontSize: TYPE.xl, fontWeight: 700 },
      },
    },
    MuiDialogContentText: {
      styleOverrides: {
        root: { fontFamily: FONT_PRIMARY, fontSize: TYPE.md },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRadius: 0 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: FONT_PRIMARY,
          textTransform: "none",
          fontWeight: 500,
          fontSize: TYPE.md,
          minHeight: 40,
        },
      },
    },
    MuiTabs: {
      defaultProps: { textColor: "primary", indicatorColor: "primary" },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontSize: TYPE.sm, borderRadius: RADIUS.chip, fontFamily: FONT_PRIMARY },
      },
    },
    MuiPagination: {
      defaultProps: { color: "primary", shape: "rounded" },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 99, height: 6 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: RADIUS.control },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { borderRadius: RADIUS.control + 2, boxShadow: theme.shadows[4] },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: { borderRadius: RADIUS.control + 2, boxShadow: theme.shadows[4] },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: { padding: 0 },
      },
    },
    MuiRating: {
      defaultProps: { size: "small" },
    },
    MuiSlider: {
      defaultProps: { size: "small" },
    },
    MuiFab: {
      styleOverrides: {
        root: { boxShadow: theme.shadows[3] },
      },
    },
  };
}

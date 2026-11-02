import "@mui/material/Button";
import "@mui/material/Chip";
import "@mui/material/Alert";

declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    soft: true;
    link: true;
  }
}

declare module "@mui/material/Chip" {
  interface ChipPropsVariantOverrides {
    soft: true;
  }
}

declare module "@mui/material/Alert" {
  interface AlertPropsVariantOverrides {
    soft: true;
  }
}

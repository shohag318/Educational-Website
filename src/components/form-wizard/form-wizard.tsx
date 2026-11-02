"use client";

import { Box, Step, StepLabel, Stepper } from "@mui/material";
import type { ReactNode } from "react";

interface FormWizardProps {
  steps: string[];
  activeStep: number;
  children: ReactNode;
}

export function FormWizard({ steps, activeStep, children }: FormWizardProps) {
  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {children}
    </Box>
  );
}

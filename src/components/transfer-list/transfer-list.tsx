"use client";

import { Checkbox, Grid, List, ListItemButton, ListItemIcon, ListItemText, Paper, Stack } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { useState } from "react";
import { AppButton } from "@/components/button/app-button";

interface TransferListProps {
  left: string[];
  right: string[];
  onChange?: (left: string[], right: string[]) => void;
}

function not(a: string[], b: string[]) {
  return a.filter((value) => !b.includes(value));
}

function intersection(a: string[], b: string[]) {
  return a.filter((value) => b.includes(value));
}

export function TransferList({ left: leftProp, right: rightProp, onChange }: TransferListProps) {
  const [checked, setChecked] = useState<string[]>([]);
  const [left, setLeft] = useState(leftProp);
  const [right, setRight] = useState(rightProp);

  const leftChecked = intersection(checked, left);
  const rightChecked = intersection(checked, right);

  const handleToggle = (value: string) => {
    setChecked((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const move = (nextLeft: string[], nextRight: string[]) => {
    setLeft(nextLeft);
    setRight(nextRight);
    onChange?.(nextLeft, nextRight);
  };

  const renderList = (items: string[]) => (
    <Paper sx={{ width: 220, height: 280, overflow: "auto" }}>
      <List dense>
        {items.map((value) => (
          <ListItemButton key={value} onClick={() => handleToggle(value)}>
            <ListItemIcon>
              <Checkbox checked={checked.includes(value)} tabIndex={-1} disableRipple />
            </ListItemIcon>
            <ListItemText primary={value} />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );

  return (
    <Grid container spacing={2} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Grid>{renderList(left)}</Grid>
      <Grid>
        <Stack spacing={1}>
          <AppButton size="small" variant="outlined" onClick={() => move(not(left, leftChecked), right.concat(leftChecked))} disabled={!leftChecked.length}>
            <ChevronRightIcon />
          </AppButton>
          <AppButton size="small" variant="outlined" onClick={() => move(left.concat(rightChecked), not(right, rightChecked))} disabled={!rightChecked.length}>
            <ChevronLeftIcon />
          </AppButton>
        </Stack>
      </Grid>
      <Grid>{renderList(right)}</Grid>
    </Grid>
  );
}

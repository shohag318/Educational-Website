"use client";

import { Box, IconButton, Stack, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { ChangeEvent, DragEvent, useCallback, useState } from "react";
import { AppButton } from "@/components/button/app-button";

interface UploadProps {
  files?: File[];
  multiple?: boolean;
  accept?: string;
  helperText?: string;
  onDrop?: (files: File[]) => void;
  onRemove?: (file: File) => void;
  onRemoveAll?: () => void;
}

export function Upload({
  files = [],
  multiple = true,
  accept,
  helperText = "Drop files here, or browse your device.",
  onDrop,
  onRemove,
  onRemoveAll,
}: UploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list?.length) return;
      const next = multiple ? Array.from(list) : [list[0]];
      onDrop?.(next);
    },
    [multiple, onDrop]
  );

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDropFile = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <Stack spacing={2}>
      <Box
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDropFile}
        sx={{
          p: 5,
          borderRadius: 2,
          border: "1px dashed",
          borderColor: isDragging ? "primary.main" : "divider",
          bgcolor: isDragging ? "primary.lighter" : "grey.50",
          textAlign: "center",
        }}
      >
        <CloudUploadIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="subtitle2">Drop or select {multiple ? "files" : "a file"}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {helperText}
        </Typography>
        <AppButton component="label" variant="soft" sx={{ mt: 2 }}>
          Browse
          <input hidden type="file" multiple={multiple} accept={accept} onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)} />
        </AppButton>
      </Box>

      {files.length > 0 && (
        <Stack spacing={1}>
          {files.map((file) => (
            <Stack
              key={`${file.name}-${file.size}`}
              direction="row"
              sx={{ alignItems: "center", justifyContent: "space-between", p: 1, border: 1, borderColor: "divider", borderRadius: 1.5 }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <InsertDriveFileIcon fontSize="small" color="action" />
                <Typography variant="caption">{file.name}</Typography>
              </Stack>
              <IconButton size="small" color="error" onClick={() => onRemove?.(file)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
          {multiple && files.length > 1 && (
            <AppButton color="error" size="small" onClick={onRemoveAll}>
              Remove all
            </AppButton>
          )}
        </Stack>
      )}
    </Stack>
  );
}

export function UploadBox({ accept, onDrop }: { accept?: string; onDrop?: (files: File[]) => void }) {
  return (
    <Box
      component="label"
      sx={{
        width: 64,
        height: 64,
        borderRadius: 1.5,
        display: "grid",
        placeItems: "center",
        border: "1px dashed",
        borderColor: "divider",
        cursor: "pointer",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <CloudUploadIcon fontSize="small" color="action" />
      <input hidden type="file" accept={accept} onChange={(e) => onDrop?.(Array.from(e.target.files || []))} />
    </Box>
  );
}

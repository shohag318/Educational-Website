"use client";

import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { InsertDriveFileIcon, ImageIcon, PictureAsPdfIcon } from "@/components/iconify/mui-icons";
interface FileThumbnailProps {
  file: File | string;
  tooltip?: boolean;
}

function fileName(file: File | string) {
  return typeof file === "string" ? file.split("/").pop() || file : file.name;
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext || "")) return <ImageIcon color="info" />;
  if (ext === "pdf") return <PictureAsPdfIcon color="error" />;
  return <InsertDriveFileIcon color="action" />;
}

export function FileThumbnail({ file, tooltip = true }: FileThumbnailProps) {
  const name = fileName(file);
  const content = (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", maxWidth: 240 }}>
      <Box sx={{ width: 36, height: 36, borderRadius: 1, display: "grid", placeItems: "center", bgcolor: "grey.100" }}>
        <FileIcon name={name} />
      </Box>
      <Typography variant="caption" noWrap>
        {name}
      </Typography>
    </Stack>
  );

  if (!tooltip) return content;
  return <Tooltip title={name}>{content}</Tooltip>;
}

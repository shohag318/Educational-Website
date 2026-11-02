export interface DownloadFilterValues {
  session?: string;
  classId?: string;
  sectionId?: string;
}

export function validateDownloadFilter(values: DownloadFilterValues): string | null {
  if (!values.session && !values.classId) return null;
  return null;
}

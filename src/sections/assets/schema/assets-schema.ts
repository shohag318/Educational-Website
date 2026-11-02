export interface AssetFormValues {
  name: string;
  category: string;
  location?: string;
  purchaseValue?: number;
}

export function validateAsset(values: AssetFormValues): string | null {
  if (!values.name?.trim()) return "Asset name is required";
  if (!values.category?.trim()) return "Category is required";
  return null;
}

export type TableOrder = 'asc' | 'desc';

export type TableHeadCellProps = {
  id: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  minWidth?: number | string;
};

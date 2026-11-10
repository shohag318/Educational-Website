'use client';

import { useState, useCallback } from 'react';

import type { TableOrder } from './types';

// ----------------------------------------------------------------------

export type UseTableProps = {
  defaultOrder?: TableOrder;
  defaultOrderBy?: string;
  defaultRowsPerPage?: number;
};

export function useTable({
  defaultOrder = 'asc',
  defaultOrderBy = 'name',
  defaultRowsPerPage = 10,
}: UseTableProps = {}) {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState(defaultOrderBy);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<TableOrder>(defaultOrder);

  const onSort = useCallback(
    (id: string) => {
      const isAsc = orderBy === id && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    },
    [order, orderBy]
  );

  const onSelectAllRows = useCallback((checked: boolean, newSelecteds: string[]) => {
    if (checked) {
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  }, []);

  const onSelectRow = useCallback((inputValue: string) => {
    setSelected((prev) =>
      prev.includes(inputValue) ? prev.filter((value) => value !== inputValue) : [...prev, inputValue]
    );
  }, []);

  const onResetPage = useCallback(() => {
    setPage(0);
  }, []);

  const onChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const onChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      onResetPage();
    },
    [onResetPage]
  );

  return {
    page,
    order,
    onSort,
    orderBy,
    selected,
    rowsPerPage,
    onSelectRow,
    onResetPage,
    onChangePage,
    onSelectAllRows,
    onChangeRowsPerPage,
  };
}

import { useState, useMemo } from "react";
import { compareValues } from "../lib/utils";

/**
 * useTableSort — keeps current sort state and returns sorted data.
 *
 * @param {Array} data — raw rows
 * @param {Object} options
 *   - initialSort: { column: string, direction: "asc"|"desc" } | null
 *   - getValue: (row, column) => any  // override accessor; defaults to row[column]
 * @returns { sortedData, sort, requestSort }
 *   sort = { column, direction } | null
 *   requestSort(column) toggles: null -> asc -> desc -> null
 */
export function useTableSort(data, options = {}) {
  const { initialSort = null, getValue = (row, col) => row?.[col] } = options;
  const [sort, setSort] = useState(initialSort);

  const requestSort = (column) => {
    setSort((prev) => {
      if (!prev || prev.column !== column) return { column, direction: "asc" };
      if (prev.direction === "asc") return { column, direction: "desc" };
      return null;
    });
  };

  const sortedData = useMemo(() => {
    if (!sort || !Array.isArray(data)) return data || [];
    const arr = [...data];
    arr.sort((a, b) => compareValues(getValue(a, sort.column), getValue(b, sort.column), sort.direction));
    return arr;
  }, [data, sort, getValue]);

  return { sortedData, sort, requestSort };
}

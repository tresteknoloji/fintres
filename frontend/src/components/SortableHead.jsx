import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { TableHead } from "./ui/table";
import { cn } from "../lib/utils";

/**
 * SortableHead — wraps TableHead with click-to-sort behavior + chevron icon.
 *
 * Usage:
 *   <SortableHead column="amount" sort={sort} onSort={requestSort} align="right">
 *     Tutar
 *   </SortableHead>
 */
export function SortableHead({
  column,
  sort,
  onSort,
  align = "left",
  className,
  children,
  ...props
}) {
  const isActive = sort?.column === column;
  const direction = isActive ? sort.direction : null;

  const Icon = !isActive
    ? ChevronsUpDown
    : direction === "asc"
    ? ChevronUp
    : ChevronDown;

  return (
    <TableHead
      className={cn(
        "sortable-th group",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
      onClick={() => onSort(column)}
      {...props}
    >
      <span
        className={cn(
          "sortable-th-content",
          align === "right" && "flex-row-reverse"
        )}
      >
        {children}
        <Icon
          className={cn(
            "sortable-th-icon",
            !isActive && "sortable-th-icon-inactive",
            isActive && "text-primary"
          )}
        />
      </span>
    </TableHead>
  );
}

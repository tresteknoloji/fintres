import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "./ui/card";
import { formatCurrency } from "../lib/utils";
import { cn } from "../lib/utils";

/**
 * KpiCard — consistent KPI tile.
 *
 * Props:
 *   label: string
 *   value: number | string
 *   icon: lucide icon component
 *   tone: "success" | "danger" | "primary" | "warning" | "info" | "muted"
 *   format: "currency" | "number" | "raw"  (default "currency")
 *   currency: "TRY"  (default)
 *   hint: string  (small text under value)
 *   trend: { value: number, direction: "up"|"down" }  optional
 *   valueClassName: extra classes
 */
export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  format = "currency",
  currency = "TRY",
  hint,
  trend,
  valueClassName,
  testId,
  children
}) {
  const formattedValue =
    format === "currency"
      ? formatCurrency(Number(value) || 0, currency)
      : format === "number"
      ? new Intl.NumberFormat("tr-TR").format(Number(value) || 0)
      : value;

  const toneTextClass = {
    success: "text-tone-success",
    danger: "text-tone-danger",
    primary: "text-foreground",
    warning: "text-tone-warning",
    info: "text-tone-info",
    muted: "text-foreground"
  }[tone];

  const iconBg = {
    success: "kpi-icon-success",
    danger: "kpi-icon-danger",
    primary: "kpi-icon-primary",
    warning: "kpi-icon-warning",
    info: "kpi-icon-info",
    muted: "kpi-icon-muted"
  }[tone];

  return (
    <Card className="stat-card" data-testid={testId}>
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-muted-foreground leading-tight">{label}</p>
          <p className={cn("text-lg sm:text-xl md:text-2xl font-bold mt-1.5 sm:mt-2 currency truncate", toneTextClass, valueClassName)}>
            {formattedValue}
          </p>
          {(hint || trend) && (
            <div className="flex items-center gap-2 mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-muted-foreground">
              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-medium",
                    trend.direction === "up" ? "text-tone-success" : "text-tone-danger"
                  )}
                >
                  {trend.direction === "up" ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(trend.value).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}%
                </span>
              )}
              {hint && <span className="truncate">{hint}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("kpi-icon shrink-0", iconBg)}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>
      {children}
    </Card>
  );
}

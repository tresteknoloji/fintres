import { cn } from "../lib/utils";

/**
 * PageHeader — consistent page heading + subtitle + actions row.
 *
 * Props:
 *   title: string
 *   subtitle: string | ReactNode
 *   actions: ReactNode  (right-aligned, optional)
 *   icon: lucide icon component  (optional, shown before title)
 */
export function PageHeader({ title, subtitle, actions, icon: Icon, className }) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4",
        className
      )}
    >
      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
        {Icon && (
          <div className="kpi-icon kpi-icon-primary mt-0.5 shrink-0 hidden sm:flex">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">{actions}</div>}
    </div>
  );
}

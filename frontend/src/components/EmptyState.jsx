import { Card, CardContent } from "./ui/card";
import { cn } from "../lib/utils";

/**
 * EmptyState — consistent empty state for tables and lists.
 *
 * Props:
 *   icon: lucide icon component
 *   title: string
 *   description: string
 *   action: ReactNode (optional CTA)
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center text-center py-12">
        {Icon && (
          <div className="kpi-icon kpi-icon-muted w-14 h-14 mb-4">
            <Icon className="w-7 h-7" />
          </div>
        )}
        <h3 className="text-base font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>
        )}
        {action && <div className="mt-5">{action}</div>}
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { PERIOD_PRESETS, getPeriodRange, formatDateShort } from "../lib/utils";
import { cn } from "../lib/utils";

/**
 * PeriodSelector — preset chips + custom date-range popover.
 *
 * Controlled component:
 *   value: { preset: string, customRange: {startDate, endDate}|null, startDate: Date|null, endDate: Date|null }
 *   onChange(value)
 *
 * Default preset is "this_month".
 */
export function PeriodSelector({ value, onChange, className }) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState(
    value?.preset === "custom" && value?.customRange
      ? { from: value.customRange.startDate, to: value.customRange.endDate }
      : undefined
  );

  const activePreset = value?.preset || "this_month";

  const selectPreset = (key) => {
    if (key === "custom") {
      setOpen(true);
      return;
    }
    const r = getPeriodRange(key);
    onChange({
      preset: key,
      customRange: null,
      startDate: r.startDate,
      endDate: r.endDate
    });
  };

  const applyCustom = () => {
    if (!range?.from || !range?.to) return;
    const r = getPeriodRange("custom", { startDate: range.from, endDate: range.to });
    onChange({
      preset: "custom",
      customRange: { startDate: range.from, endDate: range.to },
      startDate: r.startDate,
      endDate: r.endDate
    });
    setOpen(false);
  };

  const clearCustom = () => {
    setRange(undefined);
    selectPreset("this_month");
    setOpen(false);
  };

  const customLabel =
    activePreset === "custom" && value?.customRange?.startDate && value?.customRange?.endDate
      ? `${formatDateShort(value.customRange.startDate)} – ${formatDateShort(value.customRange.endDate)}`
      : "Özel Aralık";

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {PERIOD_PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => selectPreset(p.key)}
          className={cn("period-chip", activePreset === p.key && "active")}
          data-testid={`period-${p.key}`}
        >
          {p.label}
        </button>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn("period-chip", activePreset === "custom" && "active")}
            data-testid="period-custom"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            {customLabel}
            {activePreset === "custom" && (
              <X
                className="w-3.5 h-3.5 ml-1 hover:opacity-80"
                onClick={(e) => {
                  e.stopPropagation();
                  clearCustom();
                }}
              />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={2}
            initialFocus
          />
          <div className="flex items-center justify-end gap-2 p-3 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button size="sm" onClick={applyCustom} disabled={!range?.from || !range?.to}>
              Uygula
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Convenience: initial state factory
 */
export function defaultPeriodValue(preset = "this_month") {
  const r = getPeriodRange(preset);
  return {
    preset,
    customRange: null,
    startDate: r.startDate,
    endDate: r.endDate
  };
}

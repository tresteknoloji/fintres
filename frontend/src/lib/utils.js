import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount, currency = "TRY") {
  const symbols = {
    TRY: "₺",
    USD: "$",
    EUR: "€"
  };
  
  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  
  return `${symbols[currency] || currency} ${formatted}`;
}

export function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

export function formatDateForInput(dateString) {
  if (!dateString) return "";
  return dateString.split("T")[0];
}

export function getMonthName(monthStr) {
  const months = {
    "01": "Oca", "02": "Şub", "03": "Mar", "04": "Nis",
    "05": "May", "06": "Haz", "07": "Tem", "08": "Ağu",
    "09": "Eyl", "10": "Eki", "11": "Kas", "12": "Ara"
  };
  const month = monthStr.split("-")[1];
  return months[month] || monthStr;
}

export const CURRENCIES = [
  { value: "TRY", label: "₺ TRY (Türk Lirası)" },
  { value: "USD", label: "$ USD (Amerikan Doları)" },
  { value: "EUR", label: "€ EUR (Euro)" }
];

export const EXPENSE_CATEGORIES = [
  { value: "kira", label: "Kira" },
  { value: "elektrik", label: "Elektrik" },
  { value: "dogalgaz", label: "Doğalgaz" },
  { value: "su", label: "Su" },
  { value: "internet", label: "İnternet" },
  { value: "telefon", label: "Telefon" },
  { value: "maas", label: "Maaş" },
  { value: "vergi", label: "Vergi" },
  { value: "sigorta", label: "Sigorta" },
  { value: "malzeme", label: "Malzeme" },
  { value: "bakim", label: "Bakım/Onarım" },
  { value: "ulasim", label: "Ulaşım" },
  { value: "yemek", label: "Yemek/İaşe" },
  { value: "reklam", label: "Reklam & Pazarlama" },
  { value: "veri_merkezi", label: "Veri Merkezi" },
  { value: "diger", label: "Diğer" }
];

export const INCOME_CATEGORIES = [
  { value: "satis", label: "Satış" },
  { value: "hizmet", label: "Hizmet" },
  { value: "kira_geliri", label: "Kira Geliri" },
  { value: "faiz", label: "Faiz" },
  { value: "komisyon", label: "Komisyon" },
  { value: "diger", label: "Diğer" }
];

export const PAYMENT_TYPES = [
  { value: "nakit", label: "Nakit" },
  { value: "banka", label: "Banka Transferi" },
  { value: "kredi_karti", label: "Kredi Kartı" },
  { value: "cek", label: "Çek" },
  { value: "senet", label: "Senet" }
];

export const REMINDER_CATEGORIES = [
  { value: "kira", label: "Kira" },
  { value: "kredi", label: "Kredi Taksiti" },
  { value: "kredi_karti", label: "Kredi Kartı" },
  { value: "fatura", label: "Fatura" },
  { value: "vergi", label: "Vergi" },
  { value: "sigorta", label: "Sigorta" },
  { value: "maas", label: "Maaş" },
  { value: "reklam", label: "Reklam & Pazarlama" },
  { value: "veri_merkezi", label: "Veri Merkezi" },
  { value: "diger", label: "Diğer" }
];

/* ============================================================
   Date range helpers (used by PeriodSelector + page filters)
   All return { startDate: Date|null, endDate: Date|null }
   ============================================================ */

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function getPeriodRange(presetKey, customRange = null) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (presetKey) {
    case "this_month":
      return {
        startDate: startOfDay(new Date(year, month, 1)),
        endDate: endOfDay(new Date(year, month + 1, 0))
      };
    case "last_month":
      return {
        startDate: startOfDay(new Date(year, month - 1, 1)),
        endDate: endOfDay(new Date(year, month, 0))
      };
    case "this_quarter": {
      const q = Math.floor(month / 3);
      return {
        startDate: startOfDay(new Date(year, q * 3, 1)),
        endDate: endOfDay(new Date(year, q * 3 + 3, 0))
      };
    }
    case "last_3_months":
      return {
        startDate: startOfDay(new Date(year, month - 2, 1)),
        endDate: endOfDay(new Date(year, month + 1, 0))
      };
    case "this_year":
      return {
        startDate: startOfDay(new Date(year, 0, 1)),
        endDate: endOfDay(new Date(year, 11, 31))
      };
    case "last_year":
      return {
        startDate: startOfDay(new Date(year - 1, 0, 1)),
        endDate: endOfDay(new Date(year - 1, 11, 31))
      };
    case "custom":
      if (customRange?.startDate && customRange?.endDate) {
        return {
          startDate: startOfDay(customRange.startDate),
          endDate: endOfDay(customRange.endDate)
        };
      }
      return { startDate: null, endDate: null };
    case "all":
    default:
      return { startDate: null, endDate: null };
  }
}

export const PERIOD_PRESETS = [
  { key: "this_month", label: "Bu Ay" },
  { key: "last_month", label: "Geçen Ay" },
  { key: "this_quarter", label: "Bu Çeyrek" },
  { key: "last_3_months", label: "Son 3 Ay" },
  { key: "this_year", label: "Bu Yıl" },
  { key: "last_year", label: "Geçen Yıl" },
  { key: "all", label: "Tüm Zamanlar" }
];

export function isWithinRange(dateStr, startDate, endDate) {
  if (!startDate && !endDate) return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (startDate && d < startDate) return false;
  if (endDate && d > endDate) return false;
  return true;
}

export function formatDateShort(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

/* ============================================================
   Sort helper — used by useTableSort hook
   ============================================================ */

export function compareValues(a, b, direction = "asc") {
  // null/undefined go to the end regardless of direction
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  let result;
  if (typeof a === "number" && typeof b === "number") {
    result = a - b;
  } else if (a instanceof Date && b instanceof Date) {
    result = a.getTime() - b.getTime();
  } else {
    // Try date parse first
    const ad = Date.parse(a);
    const bd = Date.parse(b);
    if (!isNaN(ad) && !isNaN(bd) && typeof a === "string" && a.match(/\d{4}-\d{2}-\d{2}/)) {
      result = ad - bd;
    } else {
      result = String(a).localeCompare(String(b), "tr", { numeric: true });
    }
  }
  return direction === "desc" ? -result : result;
}

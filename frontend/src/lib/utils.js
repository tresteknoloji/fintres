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
  { value: "veri_merkezi", label: "Veri Merkezi" },
  { value: "diger", label: "Diğer" }
];

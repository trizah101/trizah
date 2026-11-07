import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(n: number | null | undefined, currency?: string) {
  if (n === null || n === undefined || isNaN(n)) return "-";
  const v = Number(n);
  const formatted = v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return currency ? `${formatted} ${currency}` : formatted;
}

export const CURRENCIES = ["AUD", "BDT", "RMB", "USD"] as const;

export function audRate(pair: string, rates: { pair: string; rate: number }[]): number | null {
  const r = rates.find((x) => x.pair === pair);
  return r ? r.rate : null;
}

export function toNumber(v: any): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
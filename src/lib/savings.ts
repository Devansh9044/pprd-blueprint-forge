export type PricedItem = {
  price: number;
  duration_days: number;
  extra_per_day: number;
  display_daily: number | null;
};

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Daily Saving = (Price ÷ Duration) + extra, unless an admin display override exists. */
export function dailySaving(p: PricedItem): number {
  if (p.display_daily != null) return Number(p.display_daily);
  return round2(Number(p.price) / p.duration_days + Number(p.extra_per_day));
}

/** Recharge: plan price ÷ validity days, rounded UP to the paisa so the full plan price is always covered. */
export function rechargeDaily(price: number, days: number): number {
  return Math.ceil(Math.round(((Number(price) * 100) / days) * 1e6) / 1e6) / 100;
}

/** Total to be saved over the full duration. */
export function goalTotal(p: PricedItem): number {
  return round2(dailySaving(p) * p.duration_days);
}

export function validateCustomAmount(raw: string, min: number, max: number): string | null {
  if (!/^\d+(\.\d{1,2})?$/.test(raw.trim())) return "Enter a valid amount (max 2 decimals)";
  const n = Number(raw);
  if (n < min) return `Minimum is ₹${min}`;
  if (n > max) return `Maximum is ₹${max}`;
  return null;
}

export const inr = (n: number) =>
  "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

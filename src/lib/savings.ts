export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Recharge: plan price ÷ validity days, rounded UP to the paisa so the full plan price is always covered. */
export function rechargeDaily(price: number, days: number): number {
  return Math.ceil(Math.round(((Number(price) * 100) / days) * 1e6) / 1e6) / 100;
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

/** Owner's extra charge (profit) per daily payment, by module. Not added to the member's saving. */
export const FEE_KEYS: Record<string, string> = {
  recharge: "fee_recharge", android: "fee_mobile", iphone: "fee_mobile", laptop: "fee_laptop",
  bike: "fee_bike", college: "fee_college", custom: "fee_custom",
};
export const DEFAULT_FEES: Record<string, number> = {
  fee_recharge: 0.2, fee_mobile: 0.9, fee_laptop: 0.95, fee_bike: 0.95, fee_college: 0.8, fee_custom: 1,
};
export function moduleFee(module: string, cfg?: Record<string, string | null | undefined>): number {
  const key = FEE_KEYS[module];
  if (!key) return 0;
  const raw = cfg?.[key];
  const n = raw == null || raw === "" ? NaN : Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? round2(n) : DEFAULT_FEES[key] ?? 0;
}

/** Daily saving that goes into the goal: price ÷ days rounded up (so the full price is saved), unless an admin override exists. */
export function productDaily(p: { price: number; duration_days: number; display_daily: number | null }): number {
  if (p.display_daily != null) return Number(p.display_daily);
  return rechargeDaily(Number(p.price), p.duration_days);
}

/** One payment: saving part (capped at what's left) + the owner's fee. */
export function paymentFor(daily: number, fee: number, remaining: number) {
  const saving = round2(Math.min(Number(daily), Number(remaining)));
  return { saving, fee: round2(fee), amount: round2(saving + fee) };
}

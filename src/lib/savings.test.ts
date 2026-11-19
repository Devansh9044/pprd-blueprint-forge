import { describe, it, expect } from "vitest";
import { moduleFee, paymentFor, productDaily, rechargeDaily, validateCustomAmount } from "./savings";

describe("saving rules", () => {
  it("product daily saving = price ÷ days, rounded up so the full price is saved", () => {
    expect(productDaily({ price: 55000, duration_days: 365, display_daily: null })).toBe(150.69);
    expect(productDaily({ price: 73000, duration_days: 365, display_daily: null })).toBe(200);
    expect(productDaily({ price: 49 * 365, duration_days: 365, display_daily: null })).toBe(49);
  });
  it("recharge daily = real plan price ÷ days, rounded up (Jio ₹349 / 28 days → ₹12.47)", () => {
    expect(rechargeDaily(349, 28)).toBe(12.47);
    expect(rechargeDaily(299, 28)).toBe(10.68);
    expect(rechargeDaily(3599, 365)).toBe(9.87);
    expect(rechargeDaily(840, 28)).toBe(30);
  });
  it("recharge daily savings always cover the full plan price", () => {
    for (const [price, days] of [[349, 28], [889, 84], [579, 56], [1551, 365], [347, 50]] as const) {
      expect(rechargeDaily(price, days) * days).toBeGreaterThanOrEqual(price);
    }
  });
  it("owner's extra charge per module (default values)", () => {
    expect(moduleFee("recharge")).toBe(0.2);
    expect(moduleFee("android")).toBe(0.9);
    expect(moduleFee("iphone")).toBe(0.9);
    expect(moduleFee("laptop")).toBe(0.95);
    expect(moduleFee("bike")).toBe(0.95);
    expect(moduleFee("college")).toBe(0.8);
    expect(moduleFee("custom")).toBe(1);
  });
  it("admin-set extra charge wins; invalid values fall back to defaults", () => {
    expect(moduleFee("bike", { fee_bike: "1.50" })).toBe(1.5);
    expect(moduleFee("bike", { fee_bike: "abc" })).toBe(0.95);
    expect(moduleFee("bike", { fee_bike: "-2" })).toBe(0.95);
  });
  it("member pays saving + fee; only the saving part goes to the goal", () => {
    expect(paymentFor(150.69, 0.95, 55000)).toEqual({ saving: 150.69, fee: 0.95, amount: 151.64 });
    expect(paymentFor(12.47, 0.2, 349)).toEqual({ saving: 12.47, fee: 0.2, amount: 12.67 });
    expect(paymentFor(49, 0.8, 17885)).toEqual({ saving: 49, fee: 0.8, amount: 49.8 });
  });
  it("last payment saves only what's left, fee still applies", () => {
    expect(paymentFor(150.69, 0.95, 40)).toEqual({ saving: 40, fee: 0.95, amount: 40.95 });
  });
  it("custom amount limits", () => {
    expect(validateCustomAmount("5", 10, 10000)).toMatch(/Minimum/);
    expect(validateCustomAmount("20000", 10, 10000)).toMatch(/Maximum/);
    expect(validateCustomAmount("12.345", 10, 10000)).toMatch(/valid/);
    expect(validateCustomAmount("50", 10, 10000)).toBeNull();
  });
});

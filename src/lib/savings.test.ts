import { describe, it, expect } from "vitest";
import { dailySaving, goalTotal, validateCustomAmount } from "./savings";

describe("saving rules", () => {
  it("laptop ₹55,000 → ₹151.68/day", () => {
    expect(dailySaving({ price: 55000, duration_days: 365, extra_per_day: 1, display_daily: null })).toBe(151.68);
  });
  it("android phone uses real price ÷ 365 + ₹1 (Galaxy S25 Ultra ₹94,479 → ₹259.85)", () => {
    expect(dailySaving({ price: 94479, duration_days: 365, extra_per_day: 1, display_daily: null })).toBe(259.85);
  });
  it("56-day 2GB recharge is ₹11.80/day", () => {
    expect(dailySaving({ price: 660.8, duration_days: 56, extra_per_day: 0, display_daily: 11.8 })).toBe(11.8);
  });
  it("college ₹49 + ₹1 = ₹50/day", () => {
    expect(dailySaving({ price: 49 * 365, duration_days: 365, extra_per_day: 1, display_daily: null })).toBe(50);
  });
  it("bike adds no extra by default", () => {
    expect(dailySaving({ price: 73000, duration_days: 365, extra_per_day: 0, display_daily: null })).toBe(200);
    expect(goalTotal({ price: 73000, duration_days: 365, extra_per_day: 0, display_daily: null })).toBe(73000);
  });
  it("custom amount limits", () => {
    expect(validateCustomAmount("5", 10, 10000)).toMatch(/Minimum/);
    expect(validateCustomAmount("20000", 10, 10000)).toMatch(/Maximum/);
    expect(validateCustomAmount("12.345", 10, 10000)).toMatch(/valid/);
    expect(validateCustomAmount("50", 10, 10000)).toBeNull();
  });
});

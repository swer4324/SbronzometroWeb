import { describe, expect, it } from "vitest";
import { calculateCurrentBac } from "./bacCalculator";
import type { BacEvent, UserProfile } from "./models";

const user: UserProfile = {
  id: 1,
  name: "Test",
  weightKg: 75,
  heightCm: 178,
  age: 30,
  sex: "MALE",
  customEliminationRatePerHour: null,
  isActive: true,
  notificationsEnabled: true
};

function beer(timestamp: number): BacEvent {
  return {
    kind: "drink",
    timestamp,
    drink: {
      userId: 1,
      name: "Birra",
      drinkType: "BEER_DRAUGHT",
      alcoholPercent: 5,
      volumeMl: 400,
      timestampMillis: timestamp,
      price: null,
      currencyCode: null,
      iconName: "ic_beer_mug"
    }
  };
}

describe("calculateCurrentBac", () => {
  it("returns sober without drinks", () => {
    expect(calculateCurrentBac(user, [], 1_000_000).bac).toBe(0);
  });

  it("produces a positive estimate for a recent beer", () => {
    const now = 10_000_000;
    const result = calculateCurrentBac(user, [beer(now - 20 * 60_000)], now);
    expect(result.bac).toBeGreaterThan(0);
    expect(result.peakBac).toBeGreaterThanOrEqual(result.bac);
  });

  it("uses a custom elimination rate", () => {
    const now = 20_000_000;
    const events = [beer(now - 120 * 60_000)];
    const standard = calculateCurrentBac(user, events, now);
    const fast = calculateCurrentBac({ ...user, customEliminationRatePerHour: 0.25 }, events, now);
    expect(fast.bac).toBeLessThan(standard.bac);
  });

  it("ignores drinks outside the Android lookback window", () => {
    const now = 1_000 * 60 * 60 * 1000 + 10_000;
    expect(calculateCurrentBac(user, [beer(1)], now).bac).toBe(0);
  });

  it("a full meal slows the early BAC rise", () => {
    const now = 40_000_000;
    const drink = beer(now - 20 * 60_000);
    const meal: BacEvent = {
      kind: "meal",
      timestamp: now - 30 * 60_000,
      meal: { userId: 1, mealType: "FULL_MEAL", timestampMillis: now - 30 * 60_000 }
    };
    expect(calculateCurrentBac(user, [meal, drink], now).bac).toBeLessThan(calculateCurrentBac(user, [drink], now).bac);
  });

  it("shows hydration reminder after four drinks", () => {
    const now = 50_000_000;
    const events = [0, 5, 10, 15].map((minutes) => beer(now - minutes * 60_000));
    expect(calculateCurrentBac(user, events, now).showHydrationReminder).toBe(true);
  });
});

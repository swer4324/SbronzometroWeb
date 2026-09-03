import { describe, expect, it } from "vitest";
import { buildBacProjection, buildQuickDrinkOptions } from "./home";
import { drinkTemplates, type DrinkEntry, type UserProfile } from "./models";

const profile: UserProfile = { id: 1, name: "Test", weightKg: 75, heightCm: 178, age: 30, sex: "MALE", customEliminationRatePerHour: null, isActive: true, notificationsEnabled: true };
const recent: DrinkEntry = { id: 9, userId: 1, name: "Recente", drinkType: "COCKTAIL", alcoholPercent: 10, volumeMl: 200, timestampMillis: 1_000_000, price: null, currencyCode: "EUR", iconName: "🍹" };

describe("Android 2.0 home parity", () => {
  it("prioritizes favorites, recent drinks and limits quick add to three", () => {
    const result = buildQuickDrinkOptions(drinkTemplates, [], [recent], ["spritz"]);
    expect(result).toHaveLength(3);
    expect(result[0].key).toBe("spritz");
    expect(result.some((item) => item.name === "Recente")).toBe(true);
  });

  it("builds nine projection points from now through eight hours", () => {
    const now = 2_000_000;
    const events = [{ kind: "drink" as const, timestamp: now - 10 * 60_000, drink: { ...recent, timestampMillis: now - 10 * 60_000 } }];
    const points = buildBacProjection(profile, events, now);
    expect(points).toHaveLength(9);
    expect(points[0].minutesFromNow).toBe(0);
    expect(points[8].minutesFromNow).toBe(480);
    expect(points[0].upperBound).toBeGreaterThanOrEqual(points[0].estimate);
  });
});

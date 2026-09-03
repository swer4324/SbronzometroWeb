import { describe, expect, it } from "vitest";
import { calculateWeeklyReports } from "./weeklyReports";
import type { DrinkEntry, UserProfile } from "./models";

const profile: UserProfile = { id: 1, name: "Test", weightKg: 75, heightCm: 178, age: 30, sex: "MALE", customEliminationRatePerHour: null, isActive: true, notificationsEnabled: true };

function drink(date: string, price = 0): DrinkEntry {
  return { userId: 1, name: "Birra", drinkType: "BEER_DRAUGHT", alcoholPercent: 5, volumeMl: 400, timestampMillis: new Date(date).getTime(), price, currencyCode: "EUR", iconName: null };
}

describe("weekly reports", () => {
  it("groups drinks by Monday-based week and sums spending", () => {
    const reports = calculateWeeklyReports([profile], [drink("2026-06-08T20:00:00", 4), drink("2026-06-10T20:00:00", 5)], "EUR", new Date("2026-06-10"));
    expect(reports).toHaveLength(1);
    expect(reports[0].totalDrinks).toBe(2);
    expect(reports[0].totalSpent).toBe(9);
    expect(reports[0].weekStart.getDay()).toBe(1);
  });

  it("counts consecutive days without logged drinks like Android 2.0", () => {
    const reports = calculateWeeklyReports([profile], [drink("2026-06-08T20:00:00"), drink("2026-06-09T20:00:00")], "EUR", new Date("2026-06-11T12:00:00"));
    expect(reports[0].maxStreak).toBe(2);
    expect(reports[0].currentStreak).toBe(2);
    expect(reports[0].daysWithoutLoggedDrinks).toBe(2);
  });

  it("assigns drinks before 06:00 to the previous evening", () => {
    const reports = calculateWeeklyReports([profile], [drink("2026-06-08T23:30:00"), drink("2026-06-09T02:00:00")], "EUR", new Date("2026-06-09T12:00:00"));
    expect(reports[0].activeEvenings).toBe(1);
    expect(reports[0].averageDrinksPerEvening).toBe(2);
  });
});

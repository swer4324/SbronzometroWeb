import { describe, expect, it } from "vitest";
import { hydrationReminderDelayMs, previousEveningDrinks, shouldFireMorningSummary, shouldFirePlannedReminder } from "./notifications";
import type { DrinkEntry } from "./models";

describe("browser reminder rules", () => {
  it("fires once on the configured weekday and minute", () => {
    const now = new Date("2026-09-03T19:00:00");
    const preferences = { enabled: true, time: "19:00", days: [String(now.getDay() + 1)], morningSummaryEnabled: false };
    const key = shouldFirePlannedReminder(now, preferences, null);
    expect(key).toBeTruthy();
    expect(shouldFirePlannedReminder(now, preferences, key)).toBeNull();
  });

  it("offers one morning summary only between 08:00 and 12:00", () => {
    const now = new Date("2026-09-03T09:00:00");
    const key = shouldFireMorningSummary(now, true, null);
    expect(key).toBeTruthy();
    expect(shouldFireMorningSummary(now, true, key)).toBeNull();
    expect(shouldFireMorningSummary(new Date("2026-09-03T13:00:00"), true, null)).toBeNull();
  });

  it("uses the same 18:00-06:00 window as the Android morning summary", () => {
    const makeDrink = (date: string): DrinkEntry => ({ userId: 1, name: "Test", drinkType: "BEER_DRAUGHT", alcoholPercent: 5, volumeMl: 400, timestampMillis: new Date(date).getTime(), price: null, currencyCode: "EUR", iconName: null });
    const drinks = [makeDrink("2026-09-02T17:59:00"), makeDrink("2026-09-02T18:00:00"), makeDrink("2026-09-03T05:59:00"), makeDrink("2026-09-03T06:00:00")];
    expect(previousEveningDrinks(drinks, new Date("2026-09-03T09:00:00"))).toHaveLength(2);
  });

  it("schedules hydration between ten and twenty minutes", () => {
    expect(hydrationReminderDelayMs(() => 0)).toBe(10 * 60_000);
    expect(hydrationReminderDelayMs(() => 0.999999)).toBe(20 * 60_000);
  });
});

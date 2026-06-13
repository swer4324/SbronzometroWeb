import { describe, expect, it } from "vitest";
import { evaluateThemeUnlocks } from "./themes";
import type { DrinkEntry } from "./models";

function drink(timestampMillis: number, drinkType: DrinkEntry["drinkType"] = "BEER_DRAUGHT"): DrinkEntry {
  return { userId: 1, name: "Drink", drinkType, alcoholPercent: 5, volumeMl: 400, timestampMillis, price: null, currencyCode: null, iconName: null };
}

describe("theme unlock rules", () => {
  it("unlocks beer bottle after ten beers in a day", () => {
    const now = new Date("2026-06-13T21:00:00");
    expect(evaluateThemeUnlocks(Array.from({ length: 10 }, (_, index) => drink(now.getTime() - index * 60_000)), now)).toContain("beer_bottle");
  });

  it("unlocks vodka after seventeen drinks in 24 hours", () => {
    const now = new Date("2026-06-13T21:00:00");
    expect(evaluateThemeUnlocks(Array.from({ length: 17 }, (_, index) => drink(now.getTime() - index * 60_000, "COCKTAIL")), now)).toContain("vodka");
  });

  it("unlocks closed bar during the night window", () => {
    expect(evaluateThemeUnlocks([], new Date("2026-06-13T03:00:00"))).toContain("closed_bar");
  });
});

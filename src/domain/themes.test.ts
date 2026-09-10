import { describe, expect, it } from "vitest";
import { advanceKonamiCode, evaluateThemeUnlocks, isImmersiveTheme, KONAMI_SEQUENCE } from "./themes";
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

  it("recognizes every immersive theme, including Camping Beach", () => {
    expect(isImmersiveTheme("camping_beach")).toBe(true);
    expect(isImmersiveTheme("vodka")).toBe(true);
    expect(isImmersiveTheme("classic")).toBe(false);
  });

  it("completes the same Konami sequence used by Android", () => {
    let index = 0;
    let completed = false;
    for (const input of KONAMI_SEQUENCE) ({ index, completed } = advanceKonamiCode(index, input));
    expect(completed).toBe(true);
    expect(index).toBe(0);
  });

  it("recovers correctly after a wrong Konami input", () => {
    expect(advanceKonamiCode(1, "LEFT")).toEqual({ index: 0, completed: false });
    expect(advanceKonamiCode(3, "UP")).toEqual({ index: 1, completed: false });
  });
});

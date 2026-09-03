import { calculateCurrentBac } from "./bacCalculator";
import type { BacEvent, CustomDrink, DrinkEntry, DrinkTemplate, UserProfile } from "./models";

export interface QuickDrinkOption {
  key: string;
  name: string;
  drinkType: DrinkEntry["drinkType"];
  alcoholPercent: number;
  volumeMl: number;
  icon: string;
}

export interface BacProjectionPoint {
  minutesFromNow: number;
  estimate: number;
  lowerBound: number;
  upperBound: number;
}

export function buildQuickDrinkOptions(
  templates: DrinkTemplate[],
  customDrinks: CustomDrink[],
  recentDrinks: DrinkEntry[],
  favoriteIds: string[]
): QuickDrinkOption[] {
  const favorites = templates.filter((item) => favoriteIds.includes(item.id)).map(fromTemplate);
  const favoriteCustom = customDrinks
    .filter((item) => favoriteIds.includes(`custom-${item.id}`) || favoriteIds.includes(`custom_${item.id}`))
    .map((item) => ({ key: `custom-${item.id}`, name: item.name, drinkType: item.drinkType, alcoholPercent: item.alcoholPercent, volumeMl: item.volumeMl, icon: item.icon }));
  const recent = [...recentDrinks].sort((a, b) => b.timestampMillis - a.timestampMillis).map((item) => ({
    key: `recent-${item.name}-${item.drinkType}-${item.alcoholPercent}-${item.volumeMl}`,
    name: item.name,
    drinkType: item.drinkType,
    alcoholPercent: item.alcoholPercent,
    volumeMl: item.volumeMl,
    icon: item.iconName ?? "🍹"
  }));
  const fallback = ["beer-medium", "wine-red", "spritz"].map((id) => templates.find((item) => item.id === id)).filter((item): item is DrinkTemplate => Boolean(item)).map(fromTemplate);
  return [...favorites, ...favoriteCustom, ...recent, ...fallback]
    .filter((item, index, all) => all.findIndex((candidate) => `${candidate.name}|${candidate.drinkType}|${candidate.alcoholPercent}|${candidate.volumeMl}` === `${item.name}|${item.drinkType}|${item.alcoholPercent}|${item.volumeMl}`) === index)
    .slice(0, 3);
}

export function buildBacProjection(profile: UserProfile, events: BacEvent[], nowMillis = Date.now()): BacProjectionPoint[] {
  return Array.from({ length: 9 }, (_, hour) => {
    const result = calculateCurrentBac(profile, events, nowMillis + hour * 60 * 60_000);
    if (result.isError) return null;
    const margin = result.bac <= 0 ? 0 : Math.max(0.05, result.bac * 0.2);
    return {
      minutesFromNow: hour * 60,
      estimate: result.bac,
      lowerBound: Math.max(0, result.bac - margin),
      upperBound: result.bac + margin
    };
  }).filter((point): point is BacProjectionPoint => point != null);
}

function fromTemplate(item: DrinkTemplate): QuickDrinkOption {
  return { key: item.id, name: item.name, drinkType: item.drinkType, alcoholPercent: item.alcoholPercent, volumeMl: item.volumeMl, icon: item.icon };
}

import type { DrinkEntry } from "./models";

export type ThemeVariant =
  | "classic" | "mint" | "spritz" | "night" | "blackout" | "dawn" | "margarita" | "blue_lagoon"
  | "beer_bottle" | "vodka" | "tomorrow_aftermath" | "closed_bar" | "broken_heart";

export const standardThemes: { id: ThemeVariant; name: string; swatch: string }[] = [
  { id: "classic", name: "Dry Martini", swatch: "#007a63" },
  { id: "mint", name: "Mojito", swatch: "#63dbb9" },
  { id: "spritz", name: "Spritz", swatch: "#ff9a7a" },
  { id: "night", name: "Gin Tonic", swatch: "#aab4ff" },
  { id: "blackout", name: "Black Russian", swatch: "#050507" },
  { id: "dawn", name: "Moscow Mule", swatch: "#d35400" },
  { id: "margarita", name: "Margarita", swatch: "#81c784" },
  { id: "blue_lagoon", name: "Blue Lagoon", swatch: "#4dd0e1" }
];

export const secretThemes: { id: ThemeVariant; name: string; hint: string; icon: string }[] = [
  { id: "beer_bottle", name: "Bottiglia di birra", hint: "Una giornata decisamente maltata.", icon: "🍺" },
  { id: "vodka", name: "Universo nella bottiglia", hint: "Una maratona nelle ultime 24 ore.", icon: "✦" },
  { id: "tomorrow_aftermath", name: "Il giorno dopo...", hint: "Una sessione che attraversa la mezzanotte.", icon: "☀" },
  { id: "closed_bar", name: "Bar chiuso", hint: "Passa di qui quando tutti dormono.", icon: "☾" },
  { id: "broken_heart", name: "Cuore infranto", hint: "Una settimana che lascia il segno.", icon: "♥" }
];

const dayKey = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

export function evaluateThemeUnlocks(drinks: DrinkEntry[], now = new Date()): ThemeVariant[] {
  const unlocked: ThemeVariant[] = [];
  const todayKey = dayKey(now.getTime());
  const beersToday = drinks.filter((drink) => dayKey(drink.timestampMillis) === todayKey && (drink.drinkType === "BEER_BOTTLE" || drink.drinkType === "BEER_DRAUGHT")).length;
  if (beersToday >= 10) unlocked.push("beer_bottle");
  if (drinks.filter((drink) => drink.timestampMillis >= now.getTime() - 24 * 60 * 60 * 1000).length >= 17) unlocked.push("vodka");
  if (now.getHours() >= 2 && now.getHours() < 5) unlocked.push("closed_bar");

  const counts = new Map<string, number>();
  for (const drink of drinks) counts.set(dayKey(drink.timestampMillis), (counts.get(dayKey(drink.timestampMillis)) ?? 0) + 1);
  let heavyDays = 0;
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    if ((counts.get(dayKey(date.getTime())) ?? 0) > 5) heavyDays += 1;
  }
  if (heavyDays >= 6) unlocked.push("broken_heart");

  const sorted = [...drinks].sort((a, b) => a.timestampMillis - b.timestampMillis);
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const first = new Date(sorted[index].timestampMillis);
    let last = first;
    for (let cursor = index + 1; cursor < sorted.length; cursor += 1) {
      const current = new Date(sorted[cursor].timestampMillis);
      if (current.getTime() - last.getTime() > 4 * 60 * 60 * 1000) break;
      last = current;
    }
    if (dayKey(first.getTime()) !== dayKey(last.getTime()) && first.getHours() >= 18 && last.getHours() < 6 && dayKey(last.getTime()) === todayKey && now.getHours() >= 11 && now.getHours() <= 14) {
      unlocked.push("tomorrow_aftermath");
      break;
    }
  }
  return [...new Set(unlocked)];
}

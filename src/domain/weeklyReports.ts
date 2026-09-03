import { calculateCurrentBac } from "./bacCalculator";
import type { BacEvent, DrinkEntry, UserProfile } from "./models";

export interface WeeklyReport {
  profileId: number;
  profileName: string;
  weekStart: Date;
  weekEnd: Date;
  totalDrinks: number;
  activeEvenings: number;
  daysWithoutLoggedDrinks: number;
  averageDrinksPerEvening: number;
  averageSpendPerEvening: number;
  maxBac: number | null;
  currentStreak: number;
  maxStreak: number;
  totalSpent: number;
  currencyCode: string;
}

export interface SobrietyStreaks { current: number; max: number }

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addCalendarDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Come Android: le ore fra mezzanotte e le 05:59 appartengono alla serata precedente. */
export function eveningDate(timestampMillis: number): Date {
  const value = new Date(timestampMillis);
  const day = startOfDay(value);
  return value.getHours() < 6 ? addCalendarDays(day, -1) : day;
}

export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  return addCalendarDays(day, -((day.getDay() + 6) % 7));
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function calculateSobrietyStreaks(periodStart: Date, periodEnd: Date, drinkingDates: Set<string>, today = new Date()): SobrietyStreaks {
  const effectiveEnd = startOfDay(today).getTime() < startOfDay(periodEnd).getTime() ? startOfDay(today) : startOfDay(periodEnd);
  if (effectiveEnd.getTime() < startOfDay(periodStart).getTime()) return { current: 0, max: 0 };
  let current = 0;
  let max = 0;
  for (let date = startOfDay(periodStart); date.getTime() <= effectiveEnd.getTime(); date = addCalendarDays(date, 1)) {
    if (drinkingDates.has(dayKey(date))) current = 0;
    else { current += 1; max = Math.max(max, current); }
  }
  return { current, max };
}

export function completedEveningCount(drinks: DrinkEntry[], now = new Date()): number {
  const current = eveningDate(now.getTime()).getTime();
  return new Set(drinks.map((drink) => eveningDate(drink.timestampMillis).getTime()).filter((date) => date < current)).size;
}

export function calculateWeeklyReports(profiles: UserProfile[], drinks: DrinkEntry[], defaultCurrency: string, now = new Date()): WeeklyReport[] {
  const reports: WeeklyReport[] = [];
  for (const profile of profiles) {
    if (profile.id == null) continue;
    const profileDrinks = drinks.filter((drink) => drink.userId === profile.id);
    const groups = new Map<number, DrinkEntry[]>();
    for (const drink of profileDrinks) {
      const key = startOfWeek(eveningDate(drink.timestampMillis)).getTime();
      groups.set(key, [...(groups.get(key) ?? []), drink]);
    }
    for (const [weekStartMillis, weekDrinks] of groups) {
      const weekStart = new Date(weekStartMillis);
      const weekEnd = addCalendarDays(weekStart, 6);
      const effectiveEnd = startOfDay(now).getTime() < weekEnd.getTime() ? startOfDay(now) : weekEnd;
      const eveningDates = new Set(weekDrinks.map((drink) => dayKey(eveningDate(drink.timestampMillis))));
      const activeEvenings = [...eveningDates].filter((key) => {
        const match = weekDrinks.find((drink) => dayKey(eveningDate(drink.timestampMillis)) === key);
        return match ? eveningDate(match.timestampMillis).getTime() <= effectiveEnd.getTime() : false;
      }).length;
      const observedDays = effectiveEnd.getTime() < weekStart.getTime() ? 0 : Math.round((Date.UTC(effectiveEnd.getFullYear(), effectiveEnd.getMonth(), effectiveEnd.getDate()) - Date.UTC(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate())) / 86_400_000) + 1;
      const sobriety = calculateSobrietyStreaks(weekStart, weekEnd, eveningDates, now);
      const byEvening = new Map<string, DrinkEntry[]>();
      for (const drink of weekDrinks) {
        const key = dayKey(eveningDate(drink.timestampMillis));
        byEvening.set(key, [...(byEvening.get(key) ?? []), drink]);
      }
      const peaks = [...byEvening.values()].map((dailyDrinks) => {
        const events: BacEvent[] = dailyDrinks.map((drink) => ({ kind: "drink", timestamp: drink.timestampMillis, drink }));
        const result = calculateCurrentBac(profile, events, Math.max(...dailyDrinks.map((drink) => drink.timestampMillis)) + 4 * 60 * 60 * 1000);
        return result.isError ? null : result.peakBac;
      }).filter((value): value is number => value != null);
      const totalSpent = weekDrinks.reduce((sum, drink) => sum + (drink.price ?? 0), 0);
      reports.push({
        profileId: profile.id, profileName: profile.name, weekStart, weekEnd,
        totalDrinks: weekDrinks.length, activeEvenings,
        daysWithoutLoggedDrinks: Math.max(0, observedDays - activeEvenings),
        averageDrinksPerEvening: weekDrinks.length / Math.max(1, activeEvenings),
        averageSpendPerEvening: totalSpent / Math.max(1, activeEvenings),
        maxBac: peaks.length ? Math.max(...peaks) : null,
        currentStreak: sobriety.current, maxStreak: sobriety.max, totalSpent,
        currencyCode: weekDrinks.find((drink) => drink.currencyCode)?.currencyCode ?? defaultCurrency
      });
    }
  }
  return reports.sort((a, b) => a.profileName.localeCompare(b.profileName) || b.weekStart.getTime() - a.weekStart.getTime());
}

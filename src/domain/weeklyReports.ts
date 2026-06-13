import { calculateCurrentBac } from "./bacCalculator";
import type { BacEvent, DrinkEntry, UserProfile } from "./models";

export interface WeeklyReport {
  profileId: number;
  profileName: string;
  weekStart: Date;
  weekEnd: Date;
  totalDrinks: number;
  maxBac: number;
  currentStreak: number;
  maxStreak: number;
  totalSpent: number;
  currencyCode: string;
}

const DAY = 86_400_000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const offset = (day.getDay() + 6) % 7;
  return new Date(day.getTime() - offset * DAY);
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function maxConsecutiveDays(dates: Date[]): number {
  const unique = [...new Map(dates.map((date) => [dayKey(date), startOfDay(date)])).values()].sort((a, b) => a.getTime() - b.getTime());
  let best = 0;
  let current = 0;
  let previous: Date | null = null;
  for (const date of unique) {
    current = previous && date.getTime() - previous.getTime() === DAY ? current + 1 : 1;
    best = Math.max(best, current);
    previous = date;
  }
  return best;
}

function currentStreak(dates: Date[], reference = new Date()): number {
  const unique = [...new Map(dates.map((date) => [dayKey(date), startOfDay(date)])).values()].sort((a, b) => b.getTime() - a.getTime());
  if (!unique.length || startOfDay(reference).getTime() - unique[0].getTime() > DAY) return 0;
  let streak = 1;
  for (let index = 1; index < unique.length; index += 1) {
    if (unique[index - 1].getTime() - unique[index].getTime() !== DAY) break;
    streak += 1;
  }
  return streak;
}

export function calculateWeeklyReports(profiles: UserProfile[], drinks: DrinkEntry[], defaultCurrency: string, now = new Date()): WeeklyReport[] {
  const reports: WeeklyReport[] = [];
  for (const profile of profiles) {
    if (profile.id == null) continue;
    const profileDrinks = drinks.filter((drink) => drink.userId === profile.id);
    const groups = new Map<number, DrinkEntry[]>();
    for (const drink of profileDrinks) {
      const key = startOfWeek(new Date(drink.timestampMillis)).getTime();
      groups.set(key, [...(groups.get(key) ?? []), drink]);
    }
    const allDates = profileDrinks.map((drink) => new Date(drink.timestampMillis));
    for (const [weekStartMillis, weekDrinks] of groups) {
      const weekStart = new Date(weekStartMillis);
      const weekEnd = new Date(weekStartMillis + 6 * DAY);
      const byDay = new Map<string, DrinkEntry[]>();
      for (const drink of weekDrinks) {
        const key = dayKey(new Date(drink.timestampMillis));
        byDay.set(key, [...(byDay.get(key) ?? []), drink]);
      }
      const maxBac = Math.max(0, ...[...byDay.values()].map((dailyDrinks) => {
        const events: BacEvent[] = dailyDrinks.map((drink) => ({ kind: "drink", timestamp: drink.timestampMillis, drink }));
        return calculateCurrentBac(profile, events, Math.max(...dailyDrinks.map((drink) => drink.timestampMillis)) + 4 * 60 * 60 * 1000).peakBac;
      }));
      reports.push({
        profileId: profile.id,
        profileName: profile.name,
        weekStart,
        weekEnd,
        totalDrinks: weekDrinks.length,
        maxBac,
        currentStreak: currentStreak(allDates, now),
        maxStreak: maxConsecutiveDays(weekDrinks.map((drink) => new Date(drink.timestampMillis))),
        totalSpent: weekDrinks.reduce((sum, drink) => sum + (drink.price ?? 0), 0),
        currencyCode: weekDrinks.find((drink) => drink.currencyCode)?.currencyCode ?? defaultCurrency
      });
    }
  }
  return reports.sort((a, b) => a.profileName.localeCompare(b.profileName) || b.weekStart.getTime() - a.weekStart.getTime());
}

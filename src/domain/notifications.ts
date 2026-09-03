import type { DrinkEntry } from "./models";

export interface ReminderPreferences {
  enabled: boolean;
  time: string;
  days: string[];
  morningSummaryEnabled: boolean;
}

export function shouldFirePlannedReminder(now: Date, preferences: ReminderPreferences, lastKey: string | null): string | null {
  if (!preferences.enabled) return null;
  const [hour, minute] = preferences.time.split(":").map(Number);
  const dayCode = String(now.getDay() + 1);
  const key = `planned-${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${preferences.time}`;
  if (lastKey === key || !preferences.days.includes(dayCode)) return null;
  return now.getHours() === hour && now.getMinutes() === minute ? key : null;
}

export function shouldFireMorningSummary(now: Date, enabled: boolean, lastKey: string | null): string | null {
  if (!enabled || now.getHours() < 8 || now.getHours() >= 12) return null;
  const key = `morning-${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  return lastKey === key ? null : key;
}

export function previousEveningDrinks(drinks: DrinkEntry[], now = new Date()): DrinkEntry[] {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 18).getTime();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6).getTime();
  return drinks.filter((drink) => drink.timestampMillis >= start && drink.timestampMillis < end);
}

export function hydrationReminderDelayMs(random = Math.random): number {
  return (10 + Math.floor(Math.min(0.999999, Math.max(0, random())) * 11)) * 60_000;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!("Notification" in window)) return "unsupported";
  return Notification.requestPermission();
}

export async function showLocalNotification(title: string, body: string, tag: string): Promise<boolean> {
  if (!("Notification" in window) || Notification.permission !== "granted") return false;
  const registration = await navigator.serviceWorker?.ready.catch(() => null);
  if (registration) {
    await registration.showNotification(title, { body, tag, icon: "./icon-512.png", badge: "./icon-512.png" });
  } else {
    new Notification(title, { body, tag, icon: "./icon-512.png" });
  }
  return true;
}

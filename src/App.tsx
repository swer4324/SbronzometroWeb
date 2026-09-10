import { useEffect, useRef, useState } from "react";
import { ImmersiveThemeBackground } from "./components/ImmersiveThemeBackground";
import {
  addDrink,
  addMeal,
  deleteEvent,
  deleteCustomDrink,
  deleteProfile,
  exportBackup,
  getCustomDrinks,
  getDrinks,
  getMeals,
  getPreference,
  getProfiles,
  importBackup,
  requestPersistentStorage,
  saveCustomDrink,
  saveProfile,
  setPreference,
  setActiveProfile
} from "./data/db";
import { calculateCurrentBac } from "./domain/bacCalculator";
import { calculateWeeklyReports, completedEveningCount } from "./domain/weeklyReports";
import { buildBacProjection, buildQuickDrinkOptions, type BacProjectionPoint, type QuickDrinkOption } from "./domain/home";
import { hydrationReminderDelayMs, previousEveningDrinks, requestNotificationPermission, shouldFireMorningSummary, shouldFirePlannedReminder, showLocalNotification } from "./domain/notifications";
import { advanceKonamiCode, evaluateThemeUnlocks, isImmersiveTheme, isThemeVariant, secretThemes, standardThemes, type RetroInput, type ThemeVariant } from "./domain/themes";
import { bacLevelLabel, bacSuggestion, disclaimerTranslations, drinkTemplateName, languageNames, localeFor, mealLabel, onboardingTranslations, secretThemeTranslation, translate, type Language } from "./domain/i18n";
import { v2Text } from "./domain/v2i18n";
import {
  drinkTemplates,
  type BacEvent,
  type BacLevel,
  type CustomDrink,
  type DrinkEntry,
  type MealEntry,
  type StomachState,
  type UserProfile
} from "./domain/models";

type View = "home" | "history" | "reports" | "profiles" | "settings" | "secrets";

const SAFE_THEME_VARIANT: ThemeVariant = "classic";

const emptyProfile: UserProfile = {
  name: "",
  weightKg: 75,
  heightCm: 175,
  age: 30,
  sex: "MALE",
  customEliminationRatePerHour: null,
  isActive: true,
  notificationsEnabled: true
};

function toLocalInput(timestamp = Date.now()): string {
  const date = new Date(timestamp - new Date(timestamp).getTimezoneOffset() * 60_000);
  return date.toISOString().slice(0, 16);
}

function emptyDrinkDraft(userId = 0): DrinkEntry {
  const template = drinkTemplates.find((drink) => drink.id === "beer-medium")!;
  return {
    userId,
    name: template.name,
    drinkType: template.drinkType,
    alcoholPercent: template.alcoholPercent,
    volumeMl: template.volumeMl,
    timestampMillis: Date.now(),
    price: null,
    currencyCode: "EUR",
    iconName: template.icon
  };
}

function launcherIconPath(icon: string): string {
  return `./app-icon-${["red", "black", "white"].includes(icon) ? icon : "default"}.png`;
}

export function App() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [drinks, setDrinks] = useState<DrinkEntry[]>([]);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [customDrinks, setCustomDrinks] = useState<CustomDrink[]>([]);
  const [favoriteDrinkIds, setFavoriteDrinkIds] = useState<string[]>([]);
  const [language, setLanguage] = useState<Language>("it");
  const [currencyCode, setCurrencyCode] = useState("EUR");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [themeVariant, setThemeVariant] = useState<ThemeVariant>(SAFE_THEME_VARIANT);
  const [unlockedThemes, setUnlockedThemes] = useState<ThemeVariant[]>([]);
  const [view, setView] = useState<View>("home");
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [profileDraft, setProfileDraft] = useState<UserProfile>(emptyProfile);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showDrinkForm, setShowDrinkForm] = useState(false);
  const [showMealForm, setShowMealForm] = useState(false);
  const [selectedDrinkId, setSelectedDrinkId] = useState(drinkTemplates[0].id);
  const [drinkDraft, setDrinkDraft] = useState<DrinkEntry>(emptyDrinkDraft());
  const [mealType, setMealType] = useState<StomachState>("LIGHT_MEAL");
  const [mealDraft, setMealDraft] = useState<MealEntry>({ userId: 0, mealType: "LIGHT_MEAL", timestampMillis: Date.now() });
  const [saveAsCustom, setSaveAsCustom] = useState(false);
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("19:00");
  const [reminderDays, setReminderDays] = useState<string[]>([]);
  const [morningSummaryEnabled, setMorningSummaryEnabled] = useState(false);
  const [trustedPhoneNumber, setTrustedPhoneNumber] = useState("");
  const [launcherIcon, setLauncherIcon] = useState("default");
  const [installHintDismissed, setInstallHintDismissed] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [undoDrink, setUndoDrink] = useState<DrinkEntry | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setClock] = useState(Date.now());
  const previousBacLevelRef = useRef<{ profileId: number; level: BacLevel } | null>(null);
  const [versionTapCount, setVersionTapCount] = useState(0);
  const [showRetroController, setShowRetroController] = useState(false);
  const [konamiIndex, setKonamiIndex] = useState(0);
  const validSecretThemeIds = secretThemes.map((variant) => variant.id);

  const activeProfile = profiles.find((profile) => profile.isActive) ?? profiles[0];
  const activeEvents: BacEvent[] = activeProfile?.id
    ? [
        ...drinks.filter((drink) => drink.userId === activeProfile.id).map((drink) => ({ kind: "drink" as const, timestamp: drink.timestampMillis, drink })),
        ...meals.filter((meal) => meal.userId === activeProfile.id).map((meal) => ({ kind: "meal" as const, timestamp: meal.timestampMillis, meal }))
      ]
    : [];
  const result = activeProfile ? calculateCurrentBac(activeProfile, activeEvents) : null;
  const projection = activeProfile && result && !result.isError ? buildBacProjection(activeProfile, activeEvents) : [];

  async function refresh() {
    try {
      setError(null);
      const storedProfiles = await getProfiles();
      const existingUser = storedProfiles.length > 0;
      const [storedDrinks, storedMeals, storedCustomDrinks, storedFavorites, storedLanguage, storedCurrency, storedDisclaimer, storedOnboarding, storedThemeVariant, storedUnlocks, storedTheme, storedReminderEnabled, storedReminderTime, storedReminderDays, storedMorningSummary, storedTrustedPhone, storedLauncherIcon, storedInstallHintDismissed] = await Promise.all([
        getDrinks(), getMeals(), getCustomDrinks(), getPreference<string[]>("favoriteDrinkIds", []),
        getPreference<Language>("language", "it"), getPreference<string>("currencyCode", "EUR"),
        getPreference<boolean>("disclaimerAccepted", existingUser), getPreference<boolean>("onboardingCompleted", existingUser),
        getPreference<ThemeVariant>("themeVariant", "classic"), getPreference<ThemeVariant[]>("unlockedThemes", []),
        getPreference<"system" | "light" | "dark">("theme", "system"),
        getPreference<boolean>("reminderEnabled", false), getPreference<string>("reminderTime", "19:00"),
        getPreference<string[]>("reminderDays", []), getPreference<boolean>("morningSummaryEnabled", false),
        getPreference<string>("trustedPhoneNumber", ""), getPreference<string>("launcherIcon", "default"),
        getPreference<boolean>("installHintDismissed", false)
      ]);
      setProfiles(storedProfiles.sort((a, b) => a.name.localeCompare(b.name)));
      setDrinks(storedDrinks.sort((a, b) => b.timestampMillis - a.timestampMillis));
      setMeals(storedMeals.sort((a, b) => b.timestampMillis - a.timestampMillis));
      setCustomDrinks(storedCustomDrinks);
      setFavoriteDrinkIds(storedFavorites);
      setLanguage(storedLanguage);
      setCurrencyCode(storedCurrency);
      setDisclaimerAccepted(storedDisclaimer);
      setOnboardingCompleted(storedOnboarding);
      setThemeVariant(isThemeVariant(storedThemeVariant) ? storedThemeVariant : SAFE_THEME_VARIANT);
      setTheme(storedTheme);
      setReminderEnabled(storedReminderEnabled);
      setReminderTime(storedReminderTime);
      setReminderDays(storedReminderDays);
      setMorningSummaryEnabled(storedMorningSummary);
      setTrustedPhoneNumber(storedTrustedPhone);
      setLauncherIcon(storedLauncherIcon);
      setInstallHintDismissed(storedInstallHintDismissed);
      setNotificationPermission("Notification" in window ? Notification.permission : "unsupported");
      const safeStoredUnlocks = storedUnlocks.filter(isThemeVariant).filter((variant) => validSecretThemeIds.includes(variant));
      const evaluatedUnlocks = [...new Set([...safeStoredUnlocks, ...evaluateThemeUnlocks(storedDrinks)])];
      setUnlockedThemes(evaluatedUnlocks);
      if (evaluatedUnlocks.length !== safeStoredUnlocks.length) await setPreference("unlockedThemes", evaluatedUnlocks);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : translate(language, "readError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    void requestPersistentStorage();
    const timer = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const forcedDark = ["blackout", "beer_bottle", "vodka", "closed_bar", "broken_heart"].includes(themeVariant);
      const forcedLight = ["tomorrow_aftermath", "camping_beach"].includes(themeVariant);
      const effective = forcedDark ? "dark" : forcedLight ? "light" : theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.theme = effective;
      document.documentElement.dataset.variant = themeVariant;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, themeVariant]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const iconPath = launcherIconPath(launcherIcon);
    document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="apple-touch-icon"]').forEach((link) => { link.href = iconPath; });
    const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (manifest) manifest.href = launcherIcon === "default" ? "./manifest.webmanifest" : `./manifest-${launcherIcon}.webmanifest`;
  }, [launcherIcon]);

  useEffect(() => {
    if (notificationPermission !== "granted") return;
    const check = async () => {
      const now = new Date();
      const [lastReminder, lastMorning, hydrationDue] = await Promise.all([
        getPreference<string | null>("lastReminderNotification", null),
        getPreference<string | null>("lastMorningSummary", null),
        activeProfile?.id ? getPreference<number | null>(`hydrationDue:${activeProfile.id}`, null) : Promise.resolve(null)
      ]);
      const reminderKey = shouldFirePlannedReminder(now, { enabled: reminderEnabled, time: reminderTime, days: reminderDays, morningSummaryEnabled }, lastReminder);
      if (reminderKey) {
        await showLocalNotification("Sbronzometro 🍺", v2Text(language, "plannedBody"), reminderKey);
        await setPreference("lastReminderNotification", reminderKey);
      }
      if (activeProfile?.id && hydrationDue && hydrationDue <= now.getTime()) {
        await showLocalNotification(v2Text(language, "hydrationTitle", { name: activeProfile.name }), v2Text(language, "hydration"), `hydration-${activeProfile.id}`);
        await setPreference(`hydrationDue:${activeProfile.id}`, null);
      }
      const morningKey = shouldFireMorningSummary(now, morningSummaryEnabled, lastMorning);
      if (morningKey) {
        const previous = previousEveningDrinks(drinks.filter((drink) => drink.userId === activeProfile?.id), now);
        if (previous.length) {
          const spent = previous.reduce((sum, drink) => sum + (drink.price ?? 0), 0);
          const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 18).getTime();
          const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6).getTime();
          const summaryEvents: BacEvent[] = [
            ...previous.map((drink) => ({ kind: "drink" as const, timestamp: drink.timestampMillis, drink })),
            ...meals.filter((meal) => meal.userId === activeProfile?.id && meal.timestampMillis >= from && meal.timestampMillis < to).map((meal) => ({ kind: "meal" as const, timestamp: meal.timestampMillis, meal }))
          ];
          const summaryResult = activeProfile ? calculateCurrentBac(activeProfile, summaryEvents, Math.max(...previous.map((drink) => drink.timestampMillis)) + 4 * 60 * 60_000) : null;
          const peak = summaryResult && !summaryResult.isError ? `${summaryResult.peakBac.toFixed(2)} g/L` : v2Text(language, "estimateUnavailable");
          await showLocalNotification(v2Text(language, "morningTitle"), v2Text(language, "morningBody", { count: previous.length, spent: new Intl.NumberFormat(localeFor(language), { style: "currency", currency: currencyCode }).format(spent), peak }), morningKey);
        }
        await setPreference("lastMorningSummary", morningKey);
      }
    };
    void check();
    const timer = window.setInterval(() => void check(), 30_000);
    return () => window.clearInterval(timer);
  }, [notificationPermission, reminderEnabled, reminderTime, reminderDays, morningSummaryEnabled, drinks, meals, activeProfile?.id, activeProfile?.name, language, currencyCode]);

  useEffect(() => {
    if (!activeProfile?.id || !result || result.isError) return;
    const previous = previousBacLevelRef.current;
    previousBacLevelRef.current = { profileId: activeProfile.id, level: result.bacLevel };
    if (!previous || previous.profileId !== activeProfile.id || previous.level === result.bacLevel || notificationPermission !== "granted" || !activeProfile.notificationsEnabled) return;
    void showLocalNotification(`${activeProfile.name}: ${bacLevelLabel(language, result.bacLevel)}`, bacSuggestion(language, result.bacLevel), `bac-${activeProfile.id}-${result.bacLevel}`);
  }, [activeProfile?.id, activeProfile?.name, activeProfile?.notificationsEnabled, result?.bacLevel, result?.isError, notificationPermission, language]);

  async function selectThemeVariant(variant: ThemeVariant) {
    if (!isThemeVariant(variant)) {
      setError("Tema non valido.");
      return;
    }
    if (validSecretThemeIds.includes(variant) && !unlockedThemes.includes(variant)) {
      setError("Tema segreto non ancora sbloccato.");
      return;
    }
    try {
      setError(null);
      setThemeVariant(variant);
      await setPreference("themeVariant", variant);
    } catch (cause) {
      setThemeVariant("classic");
      setError(cause instanceof Error ? cause.message : "Impossibile applicare il tema.");
    }
  }

  function tapVersion() {
    setVersionTapCount((current) => {
      const next = current + 1;
      if (next < 10) return next;
      setShowRetroController(true);
      setKonamiIndex(0);
      setToast(v2Text(language, "testModeAvailable"));
      return 0;
    });
  }

  async function registerRetroInput(input: RetroInput) {
    const next = advanceKonamiCode(konamiIndex, input);
    setKonamiIndex(next.index);
    if (!next.completed) return;
    setUnlockedThemes([...validSecretThemeIds]);
    await setPreference("unlockedThemes", [...validSecretThemeIds]);
    setToast(v2Text(language, "allThemesUnlocked"));
  }

  async function submitProfile(event: React.FormEvent) {
    event.preventDefault();
    await saveProfile(profileDraft);
    setProfileDraft(emptyProfile);
    setShowProfileForm(false);
    await refresh();
  }

  function openNewDrink() {
    if (!activeProfile?.id) return;
    const draft = emptyDrinkDraft(activeProfile.id);
    setDrinkDraft({ ...draft, name: drinkTemplateName(language, "beer-medium", draft.name) });
    setSelectedDrinkId("beer-medium");
    setSaveAsCustom(false);
    setShowDrinkForm(true);
  }

  function selectDrink(templateId: string) {
    setSelectedDrinkId(templateId);
    const template = allDrinkTemplates.find((drink) => drink.id === templateId);
    if (!template) return;
    setDrinkDraft((current) => ({
      ...current,
      name: template.name,
      drinkType: template.drinkType,
      alcoholPercent: template.alcoholPercent,
      volumeMl: template.volumeMl,
      iconName: template.icon
    }));
  }

  async function submitDrink(event: React.FormEvent) {
    event.preventDefault();
    if (!activeProfile?.id) return;
    const normalizedTimestamp = !drinkDraft.id && drinkDraft.timestampMillis > Date.now() ? drinkDraft.timestampMillis - 86_400_000 : drinkDraft.timestampMillis;
    const savedDrink = { ...drinkDraft, timestampMillis: normalizedTimestamp, userId: drinkDraft.id ? drinkDraft.userId : activeProfile.id };
    const id = await addDrink(savedDrink);
    if (!drinkDraft.id) {
      setUndoDrink({ ...savedDrink, id });
      setToast(v2Text(language, "drinkAdded", { name: savedDrink.name }));
      const nextCount = drinks.filter((drink) => drink.userId === activeProfile.id).length + 1;
      if (nextCount % 2 === 0) await setPreference(`hydrationDue:${activeProfile.id}`, Date.now() + hydrationReminderDelayMs());
    }
    if (saveAsCustom) {
      await saveCustomDrink({
        name: drinkDraft.name,
        drinkType: drinkDraft.drinkType,
        alcoholPercent: drinkDraft.alcoholPercent,
        volumeMl: drinkDraft.volumeMl,
        icon: drinkDraft.iconName ?? "🍹"
      });
    }
    setShowDrinkForm(false);
    await refresh();
  }

  function openNewMeal() {
    if (!activeProfile?.id) return;
    setMealType("LIGHT_MEAL");
    setMealDraft({ userId: activeProfile.id, mealType: "LIGHT_MEAL", timestampMillis: Date.now() });
    setShowMealForm(true);
  }

  async function submitMeal() {
    if (!activeProfile?.id) return;
    await addMeal({ ...mealDraft, userId: mealDraft.id ? mealDraft.userId : activeProfile.id, mealType });
    setShowMealForm(false);
    await refresh();
  }

  async function downloadBackup() {
    const backup = await exportBackup();
    const url = URL.createObjectURL(new Blob([backup], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sbronzometro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function uploadBackup(file: File | undefined) {
    if (!file) return;
    if (!confirm(translate(language, "importConfirm"))) return;
    try {
      await importBackup(await file.text());
      await refresh();
      setView("home");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : translate(language, "importError"));
    }
  }

  async function toggleFavorite(id: string) {
    const updated = favoriteDrinkIds.includes(id) ? favoriteDrinkIds.filter((value) => value !== id) : [...favoriteDrinkIds, id];
    setFavoriteDrinkIds(updated);
    await setPreference("favoriteDrinkIds", updated);
  }

  async function quickAddDrink(option: QuickDrinkOption) {
    if (!activeProfile?.id) return;
    const drink: DrinkEntry = {
      userId: activeProfile.id,
      name: option.name,
      drinkType: option.drinkType,
      alcoholPercent: option.alcoholPercent,
      volumeMl: option.volumeMl,
      timestampMillis: Date.now(),
      drinkingSpeed: null,
      price: null,
      currencyCode,
      iconName: option.icon
    };
    const id = await addDrink(drink);
    setUndoDrink({ ...drink, id });
    setToast(v2Text(language, "drinkAdded", { name: option.name }));
    const nextCount = drinks.filter((item) => item.userId === activeProfile.id).length + 1;
    if (nextCount % 2 === 0) await setPreference(`hydrationDue:${activeProfile.id}`, Date.now() + hydrationReminderDelayMs());
    await refresh();
  }

  async function undoLastDrink() {
    if (!undoDrink?.id) return;
    await deleteEvent("drinkEntries", undoDrink.id);
    setUndoDrink(null);
    setToast(v2Text(language, "drinkUndone"));
    await refresh();
  }

  async function enableNotifications() {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
    setToast(v2Text(language, permission === "granted" ? "notificationsOn" : "notificationsDenied"));
  }

  async function shareLiveLocation() {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10_000 }));
    const url = `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`;
    const data = { title: "La mia posizione", text: "Questa è la mia posizione attuale:", url };
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(`${data.text} ${url}`);
      setToast("Link della posizione copiato");
    }
  }

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const customTemplates = customDrinks.map((drink) => ({
    id: `custom-${drink.id}`,
    name: drink.name,
    drinkType: drink.drinkType,
    alcoholPercent: drink.alcoholPercent,
    volumeMl: drink.volumeMl,
    icon: drink.icon,
    isCustom: true
  }));
  const translatedDrinkTemplates = drinkTemplates.map((drink) => ({ ...drink, name: drinkTemplateName(language, drink.id, drink.name) }));
  const allDrinkTemplates = [...translatedDrinkTemplates, ...customTemplates].sort((a, b) => {
    const favoriteDifference = Number(favoriteDrinkIds.includes(b.id)) - Number(favoriteDrinkIds.includes(a.id));
    return favoriteDifference || a.name.localeCompare(b.name);
  });
  const quickDrinkOptions = buildQuickDrinkOptions(
    translatedDrinkTemplates,
    customDrinks,
    activeProfile?.id ? drinks.filter((drink) => drink.userId === activeProfile.id) : [],
    favoriteDrinkIds
  );
  const weeklyReports = calculateWeeklyReports(profiles, drinks, currencyCode);
  const locale = localeFor(language);
  const t = (key: Parameters<typeof translate>[1], values?: Record<string, string | number>) => translate(language, key, values);

  if (loading) return <main className="splash" aria-live="polite">{t("loading")}</main>;
  if (!disclaimerAccepted) return <DisclaimerScreen language={language} tosAccepted={tosAccepted} setTosAccepted={setTosAccepted} onAccept={async () => { await setPreference("disclaimerAccepted", true); setDisclaimerAccepted(true); }} />;
  if (!onboardingCompleted) return <OnboardingScreen language={language} step={onboardingStep} onNext={async () => { if (onboardingStep >= 3) { await setPreference("onboardingCompleted", true); setOnboardingCompleted(true); setOnboardingStep(0); } else setOnboardingStep(onboardingStep + 1); }} onSkip={async () => { await setPreference("onboardingCompleted", true); setOnboardingCompleted(true); setOnboardingStep(0); }} />;

  return (
    <div className={`app-shell variant-${themeVariant} ${isImmersiveTheme(themeVariant) ? "immersive" : ""}`}>
      {isImmersiveTheme(themeVariant) && <ImmersiveThemeBackground variant={themeVariant} />}
      <header className="topbar">
        <button className="brand" onClick={() => setView("home")}>
          <span className={`brand-mark icon-${launcherIcon}`}>S</span>
          <span><strong>Sbronzometro</strong><small>{t("offline")}</small></span>
        </button>
        <button className="icon-button" onClick={async () => { const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system"; setTheme(next); await setPreference("theme", next); }} aria-label={t("changeTheme")}>
          {theme === "system" ? "◐" : theme === "dark" ? "☀" : "☾"}
        </button>
      </header>

      {error && <div className="error-banner" role="alert">{error}</div>}
      {toast && <div className="toast" role="status"><span>{toast}</span>{undoDrink && <button onClick={() => void undoLastDrink()}>{v2Text(language, "undo")}</button>}</div>}

      <main className="main-content">
        <PlayStoreBanner language={language} />
        {view === "home" && (
          <>
            {!activeProfile || !result ? (
              <EmptyState language={language} onCreate={() => { setShowProfileForm(true); setView("profiles"); }} />
            ) : (
              <>
                <section className="home-stack">
                  <div className="home-heading"><h1>{v2Text(language, "evening")}</h1>{profiles.length > 1 ? <label className="profile-switch"><span className="sr-only">{t("activeProfile")}</span><select value={activeProfile.id} onChange={async (event) => { await setActiveProfile(Number(event.target.value)); setDetailsExpanded(false); await refresh(); }}>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label> : <strong>{activeProfile.name}</strong>}</div>
                  <BacStatusCard language={language} profile={activeProfile} result={result} expanded={detailsExpanded} onToggle={() => setDetailsExpanded((value) => !value)} projection={projection} />
                  <SafeReturnCard language={language} trustedPhoneNumber={trustedPhoneNumber} onShare={() => void shareLiveLocation().catch(() => setToast(v2Text(language, "location")))} />
                  {!installHintDismissed && completedEveningCount(drinks.filter((drink) => drink.userId === activeProfile.id)) >= 2 && <InstallHint language={language} onDismiss={async () => { setInstallHintDismissed(true); await setPreference("installHintDismissed", true); }} />}
                </section>

                <section className="quick-panel">
                  <QuickDrinkRow language={language} options={quickDrinkOptions} onAdd={(option) => void quickAddDrink(option)} />
                  <div className="quick-actions">
                    <button className="primary-action" onClick={openNewDrink}><span>🍹</span>{v2Text(language, "logDrink")}</button>
                    <button className="secondary-action" onClick={openNewMeal}><span>🍽</span>{v2Text(language, "logMeal")}</button>
                  </div>
                </section>

                <div className="home-disclaimer"><span>ℹ</span>{v2Text(language, "legalNote")}</div>
              </>
            )}
          </>
        )}

        {view === "profiles" && (
          <section>
            <div className="section-title"><div><span className="eyebrow">{t("localPrivate")}</span><h1>{t("profiles")}</h1></div><button className="solid-small" onClick={() => { setProfileDraft(emptyProfile); setShowProfileForm(true); }}>{t("new")}</button></div>
            <div className="profile-grid">
              {profiles.map((profile) => (
                <article className={`profile-card ${profile.isActive ? "active" : ""}`} key={profile.id}>
                  <div><strong>{profile.name}</strong><span>{profile.weightKg} kg · {profile.age} anni</span></div>
                  <div className="card-actions">
                    {!profile.isActive && <button onClick={async () => { await setActiveProfile(profile.id!); await refresh(); }}>{t("activate")}</button>}
                    <button onClick={() => { setProfileDraft(profile); setShowProfileForm(true); }}>{t("edit")}</button>
                    <button className="danger-link" onClick={async () => { if (confirm(`${t("delete")} ${profile.name}?`)) { await deleteProfile(profile.id!); await refresh(); } }}>{t("delete")}</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {view === "history" && (
          <section>
            <div className="section-title"><div><span className="eyebrow">{t("onDevice")}</span><h1>{t("history")}</h1></div><button onClick={() => setView("reports")}>{t("report")}</button></div>
            <GroupedEventList
              language={language}
              currencyCode={currencyCode}
              events={[
                ...drinks.map((drink) => ({ kind: "drink" as const, timestamp: drink.timestampMillis, drink })),
                ...meals.map((meal) => ({ kind: "meal" as const, timestamp: meal.timestampMillis, meal }))
              ].sort((a, b) => b.timestamp - a.timestamp)}
              profiles={profiles}
              onEdit={(event) => {
                if (event.kind === "drink") {
                  setDrinkDraft(event.drink);
                  setSelectedDrinkId("");
                  setSaveAsCustom(false);
                  setShowDrinkForm(true);
                } else {
                  setMealDraft(event.meal);
                  setMealType(event.meal.mealType);
                  setShowMealForm(true);
                }
              }}
              onDelete={async (event) => {
                if (!confirm(t("deleteEntryConfirm"))) return;
                await deleteEvent(event.kind === "drink" ? "drinkEntries" : "mealEntries", event.kind === "drink" ? event.drink.id! : event.meal.id!);
                await refresh();
              }}
            />
          </section>
        )}

        {view === "reports" && (
          <section>
            <div className="section-title"><div><span className="eyebrow">{t("weekly")}</span><h1>{t("reports")}</h1></div><button onClick={() => setView("history")}>{t("history")}</button></div>
            <div className="report-grid">
              {weeklyReports.length === 0 && <div className="empty-list">{t("cleanWeek")}</div>}
              {weeklyReports.map((report) => <article className="report-card" key={`${report.profileId}-${report.weekStart.getTime()}`}>
                <div className="report-heading"><div><span>{report.profileName}</span><strong>{report.weekStart.toLocaleDateString(locale, { day: "2-digit", month: "short" })} – {report.weekEnd.toLocaleDateString(locale, { day: "2-digit", month: "short" })}</strong></div><b>{report.totalDrinks} {t("drinks")}</b></div>
                <div className="report-metrics"><Metric label={v2Text(language, "activeEvenings")} value={String(report.activeEvenings)} /><Metric label={v2Text(language, "averagePerEvening")} value={report.averageDrinksPerEvening.toFixed(1)} /><Metric label={v2Text(language, "alcoholFreeDays")} value={String(report.daysWithoutLoggedDrinks)} /><Metric label={t("totalSpent")} value={new Intl.NumberFormat(locale, { style: "currency", currency: report.currencyCode }).format(report.totalSpent)} /></div>
              </article>)}
            </div>
          </section>
        )}

        {view === "settings" && (
          <section>
            <div className="section-title"><div><span className="eyebrow">{t("dataFirstAid")}</span><h1>{t("settings")}</h1></div></div>
            <article className="settings-card reminder-card">
              <div className="settings-heading"><div><span className="settings-icon">🔔</span><div><h2>{v2Text(language, "reminder")}</h2><p>{reminderEnabled ? v2Text(language, "readyAt", { time: reminderTime }) : v2Text(language, "paused")}</p></div></div><label className="switch"><input type="checkbox" checked={reminderEnabled} onChange={async (event) => { const value = event.target.checked; if (value && notificationPermission !== "granted") await enableNotifications(); setReminderEnabled(value); await setPreference("reminderEnabled", value); }} /><span /></label></div>
              {reminderEnabled && <><label className="standalone-label">{v2Text(language, "time")}<input type="time" value={reminderTime} onChange={async (event) => { setReminderTime(event.target.value); await setPreference("reminderTime", event.target.value); }} /></label><div className="day-picker">{[["2","L"],["3","M"],["4","M"],["5","G"],["6","V"],["7","S"],["1","D"]].map(([code,label]) => <button key={code} className={reminderDays.includes(code) ? "selected" : ""} onClick={async () => { const next = reminderDays.includes(code) ? reminderDays.filter((day) => day !== code) : [...reminderDays, code]; setReminderDays(next); await setPreference("reminderDays", next); }}>{label}</button>)}</div></>}
              <p className="capability-note">{v2Text(language, "webPushLimit")}</p>
            </article>
            <article className="settings-card"><div className="settings-heading"><div><span className="settings-icon">☀️</span><div><h2>{v2Text(language, "morning")}</h2><p>{v2Text(language, "morningHelp")}</p></div></div><label className="switch"><input type="checkbox" checked={morningSummaryEnabled} onChange={async (event) => { const value = event.target.checked; if (value && notificationPermission !== "granted") await enableNotifications(); setMorningSummaryEnabled(value); await setPreference("morningSummaryEnabled", value); }} /><span /></label></div></article>
            <article className="settings-card"><h2>{v2Text(language, "trusted")}</h2><p>{v2Text(language, "trustedHelp")}</p><div className="inline-save"><input type="tel" value={trustedPhoneNumber} placeholder="+39 333 1234567" onChange={(event) => setTrustedPhoneNumber(event.target.value)} /><button onClick={async () => { const value = trustedPhoneNumber.trim(); setTrustedPhoneNumber(value); await setPreference("trustedPhoneNumber", value); setToast(v2Text(language, "save")); }}>{v2Text(language, "save")}</button></div></article>
            <article className="settings-card">
              <h2>{t("colorStyle")}</h2><p>{t("colorStyleHelp")}</p>
              <label className="standalone-label">{v2Text(language, "mode")}<select value={theme} onChange={async (event) => { const value = event.target.value as typeof theme; setTheme(value); await setPreference("theme", value); }}><option value="system">{v2Text(language, "system")}</option><option value="light">{v2Text(language, "light")}</option><option value="dark">{v2Text(language, "dark")}</option></select></label>
              <div className="theme-grid">{standardThemes.map((variant) => <button type="button" className={themeVariant === variant.id ? "selected" : ""} key={variant.id} onClick={() => void selectThemeVariant(variant.id)}><span style={{ background: variant.swatch }} /><strong>{variant.name}</strong></button>)}</div>
            </article>
            <button className="collection-link" onClick={() => setView("secrets")}><span>✦</span><div><strong>{v2Text(language, "secretCollection")}</strong><small>{v2Text(language, "secretSubtitle", { count: unlockedThemes.length, total: secretThemes.length })}</small></div><b>›</b></button>
            <article className="settings-card">
              <h2>{t("languageCurrency")}</h2>
              <div className="form-pair">
                <label className="standalone-label">{t("language")}<select value={language} onChange={async (event) => { const value = event.target.value as Language; setLanguage(value); await setPreference("language", value); }}>{Object.entries(languageNames).map(([code, name]) => <option value={code} key={code}>{name}</option>)}</select></label>
                <label className="standalone-label">{t("currency")}<select value={currencyCode} onChange={async (event) => { setCurrencyCode(event.target.value); await setPreference("currencyCode", event.target.value); }}><option value="EUR">Euro (€)</option><option value="GBP">Pound (£)</option><option value="USD">Dollar ($)</option></select></label>
              </div>
            </article>
            <article className="settings-card">
              <h2>{t("localBackup")}</h2>
              <p>{t("backupHelp")}</p>
              <button type="button" className="primary-action" onClick={downloadBackup}>{t("downloadBackup")}</button>
              <label className="secondary-action file-action">{t("importBackup")}<input type="file" accept="application/json,.json" onChange={(event) => void uploadBackup(event.target.files?.[0])} /></label>
            </article>
            <article className="settings-card">
              <h2>{t("customDrinks")}</h2>
              <p>{t("customHelp")}</p>
              <div className="custom-list">
                {customDrinks.length === 0 && <span className="muted">{t("noCustom")}</span>}
                {customDrinks.map((drink) => <div key={drink.id}><span>{drink.icon} {drink.name} · {drink.volumeMl} ml</span><button type="button" onClick={async () => { await deleteCustomDrink(drink.id!); await refresh(); }}>{t("delete")}</button></div>)}
              </div>
            </article>
            <article className="settings-card warning-card">
              <h2>{t("importantReminder")}</h2>
              <p>{t("safetyReminder")}</p>
              <button type="button" className="secondary-action" onClick={() => { setOnboardingStep(0); setOnboardingCompleted(false); }}>{t("reviewIntro")}</button>
              <button type="button" className="secondary-action" onClick={() => { setTosAccepted(false); setDisclaimerAccepted(false); }}>{t("reviewWarning")}</button>
            </article>
            {showRetroController && <article className="settings-card retro-settings"><h2>{v2Text(language, "retroTest")}</h2><p>{v2Text(language, "retroHelp")}</p><RetroController progress={konamiIndex} onInput={(input) => void registerRetroInput(input)} /></article>}
            <button type="button" className="version-easter-egg" onClick={tapVersion} aria-label={v2Text(language, "appVersion")}>{v2Text(language, "appVersion")}</button>
          </section>
        )}
        {view === "secrets" && (
          <section>
            <div className="section-title"><button onClick={() => setView("settings")}>‹ {t("settings")}</button><h1>{v2Text(language, "secretCollection")}</h1></div>
            <article className="settings-card"><p>{v2Text(language, "localSecrets")}</p></article>
            <article className="settings-card"><h2>{v2Text(language, "appIcon")}</h2><p>{v2Text(language, "appIconHelp")}</p><div className="app-icon-grid">{["default", "red", "black", "white"].map((id) => { const enabled = id === "default" || unlockedThemes.length > 0; return <button disabled={!enabled} className={`${launcherIcon === id ? "selected" : ""} icon-choice-${id}`} key={id} onClick={async () => { setLauncherIcon(id); await setPreference("launcherIcon", id); }}><span>{enabled ? <img src={launcherIconPath(id)} alt="" /> : "🔒"}</span><small>{id}</small></button>; })}</div></article>
            <article className="settings-card"><h2>{t("secretThemes")}</h2><p>{t("unlockedCount", { count: unlockedThemes.length, total: secretThemes.length })}</p><div className="secret-theme-list">{secretThemes.map((variant) => { const unlocked = unlockedThemes.includes(variant.id); const [name, hint] = secretThemeTranslation(language, variant.id, variant.name, variant.hint); return <button type="button" disabled={!unlocked} className={themeVariant === variant.id ? "selected" : ""} key={variant.id} onClick={() => void selectThemeVariant(variant.id)}><span>{unlocked ? variant.icon : "⌾"}</span><div><strong>{name}</strong><small>{unlocked ? t("unlocked") : hint}</small></div></button>; })}</div></article>
            <SobrietyBadges language={language} drinks={activeProfile?.id ? drinks.filter((drink) => drink.userId === activeProfile.id) : []} />
          </section>
        )}
      </main>

      <nav className="bottom-nav">
        <NavButton active={view === "home"} icon="⌂" label={t("home")} onClick={() => setView("home")} />
        <NavButton active={view === "history"} icon="◷" label={t("log")} onClick={() => setView("history")} />
        <NavButton active={showDrinkForm} icon="＋" label={t("addDrink")} onClick={openNewDrink} />
        <NavButton active={view === "profiles"} icon="♙" label={t("profiles")} onClick={() => setView("profiles")} />
        <NavButton active={view === "settings" || view === "secrets"} icon="⚙" label={t("more")} onClick={() => setView("settings")} />
      </nav>

      {showProfileForm && (
        <Modal title={profileDraft.id ? t("editProfile") : t("newProfile")} closeLabel={t("close")} onClose={() => setShowProfileForm(false)}>
          <form className="form-stack" onSubmit={submitProfile}>
            <label>{t("name")}<input required value={profileDraft.name} onChange={(event) => setProfileDraft({ ...profileDraft, name: event.target.value })} /></label>
            <div className="form-pair">
              <label>{t("weight")}<input required min="30" max="300" type="number" step="0.1" value={profileDraft.weightKg} onChange={(event) => setProfileDraft({ ...profileDraft, weightKg: Number(event.target.value) })} /></label>
              <label>{t("height")}<input required min="100" max="250" type="number" value={profileDraft.heightCm} onChange={(event) => setProfileDraft({ ...profileDraft, heightCm: Number(event.target.value) })} /></label>
            </div>
            <div className="form-pair">
              <label>{t("age")}<input required min="18" max="110" type="number" value={profileDraft.age} onChange={(event) => setProfileDraft({ ...profileDraft, age: Number(event.target.value) })} /></label>
              <label>{t("biologicalSex")}<select value={profileDraft.sex} onChange={(event) => setProfileDraft({ ...profileDraft, sex: event.target.value as UserProfile["sex"] })}><option value="MALE">{t("male")}</option><option value="FEMALE">{t("female")}</option></select></label>
            </div>
            <label>{t("customRate")}<input min="0.05" max="0.35" step="0.01" type="number" value={profileDraft.customEliminationRatePerHour ?? ""} onChange={(event) => setProfileDraft({ ...profileDraft, customEliminationRatePerHour: event.target.value ? Number(event.target.value) : null })} /></label>
            <button className="primary-action" type="submit">{t("saveProfile")}</button>
          </form>
        </Modal>
      )}

      {showDrinkForm && (
        <Modal title={drinkDraft.id ? t("editDrink") : t("addDrink")} closeLabel={t("close")} onClose={() => setShowDrinkForm(false)}>
          <div className="drink-grid">
            {allDrinkTemplates.map((drink) => <div className="drink-option" key={drink.id}><button type="button" className={selectedDrinkId === drink.id ? "selected" : ""} onClick={() => selectDrink(drink.id)}><span>{drink.icon}</span><strong>{drink.name}</strong><small>{drink.volumeMl} ml · {drink.alcoholPercent}%</small></button><button type="button" aria-label={`${t("favorite")}: ${drink.name}`} className={`favorite-button ${favoriteDrinkIds.includes(drink.id) ? "selected" : ""}`} onClick={() => void toggleFavorite(drink.id)}>★</button></div>)}
          </div>
          <form className="form-stack" onSubmit={submitDrink}>
            <label>{t("name")}<input required value={drinkDraft.name} onChange={(event) => setDrinkDraft({ ...drinkDraft, name: event.target.value })} /></label>
            <div className="form-pair">
              <label>{t("alcohol")}<input required min="0.1" max="100" step="0.1" type="number" value={drinkDraft.alcoholPercent} onChange={(event) => setDrinkDraft({ ...drinkDraft, alcoholPercent: Number(event.target.value) })} /></label>
              <label>{t("volume")}<input required min="1" max="5000" type="number" value={drinkDraft.volumeMl} onChange={(event) => setDrinkDraft({ ...drinkDraft, volumeMl: Number(event.target.value) })} /></label>
            </div>
            <div className="preset-strip">
              {volumePresetsFor(drinkDraft.drinkType).map((preset) => (
                <button key={preset} type="button" className={`preset-chip ${drinkDraft.volumeMl === preset ? "selected" : ""}`} onClick={() => setDrinkDraft({ ...drinkDraft, volumeMl: preset })}>
                  {preset} ml
                </button>
              ))}
            </div>
            <div className="form-pair">
              <label>{t("price")} ({currencyCode})<input min="0" step="0.01" type="number" value={drinkDraft.price ?? ""} onChange={(event) => setDrinkDraft({ ...drinkDraft, price: event.target.value ? Number(event.target.value) : null, currencyCode })} /></label>
              <label>{t("dateTime")}<input required type="datetime-local" value={toLocalInput(drinkDraft.timestampMillis)} onChange={(event) => setDrinkDraft({ ...drinkDraft, timestampMillis: new Date(event.target.value).getTime() })} /></label>
            </div>
            <div className="preset-strip">
              <button type="button" className="preset-chip" onClick={() => setDrinkDraft({ ...drinkDraft, timestampMillis: Date.now() })}>Ora</button>
              {[15, 30, 45].map((minutes) => (
                <button key={minutes} type="button" className="preset-chip" onClick={() => setDrinkDraft({ ...drinkDraft, timestampMillis: Date.now() - minutes * 60_000 })}>
                  -{minutes} min
                </button>
              ))}
            </div>
            {!drinkDraft.id && <label className="check-label"><input type="checkbox" checked={saveAsCustom} onChange={(event) => setSaveAsCustom(event.target.checked)} /> {t("saveCustom")}</label>}
            <button className="primary-action" type="submit">{drinkDraft.id ? t("saveChanges") : t("addDrink")}</button>
          </form>
        </Modal>
      )}

      {showMealForm && (
        <Modal title={mealDraft.id ? t("editMeal") : t("addMeal")} closeLabel={t("close")} onClose={() => setShowMealForm(false)}>
          <div className="choice-list">
            {(["LIGHT_MEAL", "MEDIUM_MEAL", "FULL_MEAL"] as StomachState[]).map((type) => <button className={mealType === type ? "selected" : ""} key={type} onClick={() => { setMealType(type); setMealDraft({ ...mealDraft, mealType: type }); }}>{mealLabel(language, type)}</button>)}
          </div>
          <label className="standalone-label">{t("dateTime")}<input type="datetime-local" value={toLocalInput(mealDraft.timestampMillis)} onChange={(event) => setMealDraft({ ...mealDraft, timestampMillis: new Date(event.target.value).getTime() })} /></label>
          <button className="primary-action" onClick={submitMeal}>{mealDraft.id ? t("saveChanges") : t("addMeal")}</button>
        </Modal>
      )}
    </div>
  );
}

function EmptyState({ language, onCreate }: { language: Language; onCreate: () => void }) {
  return <section className="empty-state"><div className="empty-orbit">0.00</div><span className="eyebrow">{translate(language, "firstProfileEyebrow")}</span><h1>{translate(language, "firstProfileTitle")}</h1><p>{translate(language, "firstProfileHelp")}</p><button className="primary-action" onClick={onCreate}>{translate(language, "createFirstProfile")}</button></section>;
}

function BacGauge({ bac, peak }: { bac: number; peak: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const previousValuesRef = useRef({ bac: 0, peak: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const maxScale = 3;
    const startAngle = (170 * Math.PI) / 180;
    const totalSweep = (200 * Math.PI) / 180;
    const targetBac = Math.min(maxScale, Math.max(0, bac));
    const targetPeak = Math.min(maxScale, Math.max(0, peak));
    const from = previousValuesRef.current;
    const width = canvas.clientWidth || 360;
    const height = canvas.clientHeight || 220;
    const ratio = window.devicePixelRatio || 1;

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const strokeWidth = 16;
    const radius = width / 2 - strokeWidth;
    const centerX = width / 2;
    const centerY = strokeWidth + radius;

    const draw = (currentBac: number, currentPeak: number) => {
      context.clearRect(0, 0, width, height);
      context.lineCap = "round";

      const createBacGradient = (alpha: number) => {
        const gradient = context.createConicGradient(0, centerX, centerY);
        gradient.addColorStop(0, `rgba(183, 28, 28, ${alpha})`);
        gradient.addColorStop(100 / 360, `rgba(183, 28, 28, ${alpha})`);
        gradient.addColorStop(160 / 360, `rgba(76, 175, 80, ${alpha})`);
        gradient.addColorStop(170 / 360, `rgba(76, 175, 80, ${alpha})`);
        gradient.addColorStop(203.3 / 360, `rgba(139, 195, 74, ${alpha})`);
        gradient.addColorStop(223.3 / 360, `rgba(255, 193, 7, ${alpha})`);
        gradient.addColorStop(270 / 360, `rgba(244, 67, 54, ${alpha})`);
        gradient.addColorStop(1, `rgba(183, 28, 28, ${alpha})`);
        return gradient;
      };

      context.strokeStyle = createBacGradient(0.2);
      context.lineWidth = strokeWidth;
      context.beginPath();
      context.arc(centerX, centerY, radius, startAngle, startAngle + totalSweep);
      context.stroke();

      const currentSweep = (currentBac / maxScale) * totalSweep;
      if (currentSweep > 0) {
        context.strokeStyle = createBacGradient(1);
        context.lineWidth = strokeWidth;
        context.beginPath();
        context.arc(centerX, centerY, radius, startAngle, startAngle + currentSweep);
        context.stroke();
      }

      const safeAngle = startAngle + (0.5 / maxScale) * totalSweep;
      context.save();
      context.translate(centerX, centerY);
      context.rotate(safeAngle);
      context.strokeStyle = "rgba(255,255,255,0.95)";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(radius - strokeWidth / 2, 0);
      context.lineTo(radius + strokeWidth / 2, 0);
      context.stroke();
      context.restore();

      for (let index = 0; index <= 10; index += 1) {
        const angle = startAngle + (index / 10) * totalSweep;
        const tickLength = index % 5 === 0 ? 12 : 7;
        const tickWidth = index % 5 === 0 ? 2 : 1;
        context.save();
        context.translate(centerX, centerY);
        context.rotate(angle);
        context.strokeStyle = "rgba(140, 148, 158, 0.45)";
        context.lineWidth = tickWidth;
        context.beginPath();
        context.moveTo(radius + 6, 0);
        context.lineTo(radius + 6 + tickLength, 0);
        context.stroke();
        context.restore();
      }

      const currentAngle = startAngle + (currentBac / maxScale) * totalSweep;
      context.save();
      context.translate(centerX, centerY);
      context.rotate(currentAngle);
      context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--text").trim() || "#17201c";
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(radius - 4, 0);
      context.stroke();
      context.restore();

      const peakAngle = startAngle + (currentPeak / maxScale) * totalSweep;
      context.save();
      context.translate(centerX, centerY);
      context.rotate(peakAngle);
      context.strokeStyle = "#ff1744";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(radius * 0.48, 0);
      context.lineTo(radius - 5, 0);
      context.stroke();
      context.restore();

      context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text").trim() || "#17201c";
      context.beginPath();
      context.arc(centerX, centerY, 6, 0, Math.PI * 2);
      context.fill();
    };

    const start = performance.now();
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1500;

    const frame = (now: number) => {
      const progress = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      draw(from.bac + (targetBac - from.bac) * eased, from.peak + (targetPeak - from.peak) * eased);
      if (progress < 1) {
        animationRef.current = window.requestAnimationFrame(frame);
      } else {
        previousValuesRef.current = { bac: targetBac, peak: targetPeak };
      }
    };

    if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
    animationRef.current = window.requestAnimationFrame(frame);

    return () => {
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
    };
  }, [bac, peak]);

  return <div className="gauge"><canvas ref={canvasRef} className="gauge-canvas" aria-hidden="true" /><div className="gauge-value"><strong>{bac.toFixed(2)}</strong><span>g/L</span></div></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function bacLevelColor(level: ReturnType<typeof calculateCurrentBac>["bacLevel"]): string {
  switch (level) {
    case "SOBER_SAFE":
      return "#4caf50";
    case "LIGHT":
      return "#8bc34a";
    case "TIPSY":
      return "#ffc107";
    case "OVER_LIMIT":
      return "#ff9800";
    case "PENAL_RISK":
      return "#f44336";
    case "SEVERE_EBRIETY":
      return "#d32f2f";
    case "CRITICAL_DANGER":
      return "#b71c1c";
  }
}

function BacStatusCard({ language, profile, result, expanded, onToggle, projection }: { language: Language; profile: UserProfile; result: ReturnType<typeof calculateCurrentBac>; expanded: boolean; onToggle: () => void; projection: BacProjectionPoint[] }) {
  const isOverLimit = result.bac >= 0.5;
  const levelColor = bacLevelColor(result.bacLevel);
  const trendLabel = result.peakAlreadyPassed ? v2Text(language, "falling") : v2Text(language, "rising");

  return <article className="status-card active" aria-label={`Stima BAC di ${profile.name}`}>
    <div className="estimate-label">{v2Text(language, "estimateCurrent")}</div><p className="estimate-disclaimer">{v2Text(language, "estimateDisclaimer")}</p>
    {result.isError ? <div className="estimate-error"><strong>—</strong><span>{v2Text(language, "estimateUnavailable")}</span><p>{v2Text(language, "checkProfile")}</p></div> : <>
      <BacGauge bac={result.bac} peak={result.projectedPeakBac} />
      <span className={`level-pill level-${result.bacLevel.toLowerCase()}`} style={{ color: levelColor, borderColor: `${levelColor}55`, background: `${levelColor}22` }}>{bacLevelLabel(language, result.bacLevel)}</span>
      <div className={`status-safety ${isOverLimit ? "danger" : result.estimatedMinutesUntilLegalLimit > 0 ? "warning" : "safe"}`}>{isOverLimit ? v2Text(language, "doNotDrive") : result.estimatedMinutesUntilLegalLimit > 0 ? v2Text(language, "underReferenceIn", { time: formatMinutes(result.estimatedMinutesUntilLegalLimit) }) : v2Text(language, "underReference")}</div>
      <button className="details-toggle" onClick={onToggle}>{v2Text(language, expanded ? "hideDetails" : "showDetails")}</button>
    </>}
    {expanded && !result.isError && <div className="status-expanded">
      <div className="status-metrics">
        <Metric label={v2Text(language, "peak")} value={`${result.projectedPeakBac.toFixed(2)} g/L`} />
        <Metric label={v2Text(language, "trend")} value={trendLabel} />
      </div>
      <div className="peak-legend"><span /> {v2Text(language, "peakNeedle")}</div>
      <BacTimeline language={language} points={projection} />
      <p className="suggestion">{bacSuggestion(language, result.bacLevel)}</p>
      {result.showHydrationReminder && <div className="hydration-reminder">{v2Text(language, "hydration")}</div>}
    </div>}
  </article>;
}

function BacTimeline({ language, points }: { language: Language; points: BacProjectionPoint[] }) {
  if (points.length < 2) return null;
  const max = Math.max(0.8, ...points.map((point) => point.upperBound * 1.08));
  const x = (index: number) => 8 + index * (304 / (points.length - 1));
  const y = (value: number) => 118 - Math.min(max, Math.max(0, value)) / max * 104;
  const line = points.map((point, index) => `${x(index)},${y(point.estimate)}`).join(" ");
  const band = [...points.map((point, index) => `${x(index)},${y(point.upperBound)}`), ...points.map((point, index) => `${x(points.length - 1 - index)},${y(points[points.length - 1 - index].lowerBound)}`)].join(" ");
  return <div className="timeline"><strong>{v2Text(language, "timeline")}</strong><svg viewBox="0 0 320 130" role="img" aria-label={v2Text(language, "timeline")}><line x1="8" x2="312" y1={y(0.5)} y2={y(0.5)} className="threshold" /><polygon points={band} className="uncertainty" /><polyline points={line} className="projection-line" /></svg><div><span>{translate(language, "now")}</span><span>{v2Text(language, "inEightHours")}</span></div><small>{v2Text(language, "uncertainty")}</small></div>;
}

function QuickDrinkRow({ language, options, onAdd }: { language: Language; options: QuickDrinkOption[]; onAdd: (option: QuickDrinkOption) => void }) {
  if (!options.length) return null;
  return <div className="quick-drinks"><strong>{v2Text(language, "quickAdd")}</strong><small>{v2Text(language, "favoriteRecent")}</small><div>{options.map((option) => <button key={option.key} onClick={() => onAdd(option)}><span>＋</span>{option.name}</button>)}</div></div>;
}

function SafeReturnCard({ language, trustedPhoneNumber, onShare }: { language: Language; trustedPhoneNumber: string; onShare: () => void }) {
  return <article className="safe-return"><div><strong>{v2Text(language, "safeReturn")}</strong><small>{v2Text(language, "safeActions")}</small></div><div className="safe-actions"><a href="https://www.google.com/maps/search/?api=1&query=taxi+near+me" target="_blank" rel="noreferrer"><span>🚕</span>{v2Text(language, "taxi")}</a><a href={trustedPhoneNumber ? `tel:${trustedPhoneNumber}` : undefined} onClick={(event) => { if (!trustedPhoneNumber) { event.preventDefault(); alert(v2Text(language, "missingContact")); } }}><span>☎</span>{v2Text(language, "call")}</a><button onClick={onShare}><span>⌖</span>{v2Text(language, "location")}</button></div></article>;
}

function InstallHint({ language, onDismiss }: { language: Language; onDismiss: () => void }) {
  return <article className="install-hint"><span>▣</span><div><strong>{v2Text(language, "installTitle")}</strong><small>{v2Text(language, "installIos")}</small><div><button onClick={() => alert(v2Text(language, "installIos"))}>{v2Text(language, "how")}</button><button onClick={onDismiss}>{v2Text(language, "notNow")}</button></div></div></article>;
}

function SobrietyBadges({ language, drinks }: { language: Language; drinks: DrinkEntry[] }) {
  const days = drinks.length ? Math.max(0, Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(Math.max(...drinks.map((drink) => drink.timestampMillis))).setHours(0, 0, 0, 0)) / 86_400_000)) : 0;
  const labels: Record<Language, string[]> = { it: ["Un mese", "Tre mesi", "Sei mesi", "Un anno", "Due anni"], en: ["One month", "Three months", "Six months", "One year", "Two years"], es: ["Un mes", "Tres meses", "Seis meses", "Un año", "Dos años"], fr: ["Un mois", "Trois mois", "Six mois", "Un an", "Deux ans"], de: ["Ein Monat", "Drei Monate", "Sechs Monate", "Ein Jahr", "Zwei Jahre"] };
  return <article className="settings-card"><h2>{v2Text(language, "sobrietyBadges")}</h2><p>{v2Text(language, "daysSinceDrink", { days })}</p><div className="badge-grid">{[30, 90, 180, 365, 730].map((target, index) => <div className={days >= target ? "unlocked" : ""} key={target}><span>{days >= target ? "✦" : "○"}</span><strong>{labels[language][index]}</strong><small>{Math.min(days, target)} / {target} {translate(language, "days")}</small></div>)}</div></article>;
}

function EventList({ language, events, profiles, onDelete, onEdit }: { language: Language; events: BacEvent[]; profiles: UserProfile[]; onDelete?: (event: BacEvent) => void; onEdit?: (event: BacEvent) => void }) {
  if (!events.length) return <div className="empty-list">{translate(language, "emptyEvents")}</div>;
  return <div className="event-list">{events.map((event, index) => {
    const item = event.kind === "drink" ? event.drink : event.meal;
    const profile = profiles.find((candidate) => candidate.id === item.userId);
    return <article className="event-row" key={`${event.kind}-${item.id ?? index}`}><span className="event-icon">{event.kind === "drink" ? "🍹" : "🍕"}</span><div><strong>{event.kind === "drink" ? event.drink.name : mealLabel(language, event.meal.mealType)}</strong><small>{profile?.name} · {new Date(event.timestamp).toLocaleString(localeFor(language), { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</small></div>{event.kind === "drink" && <b>{event.drink.volumeMl} ml</b>}{onEdit && <button className="edit-event" aria-label={translate(language, "edit")} onClick={() => onEdit(event)}>✎</button>}{onDelete && <button className="delete-event" aria-label={translate(language, "delete")} onClick={() => onDelete(event)}>×</button>}</article>;
  })}</div>;
}

function GroupedEventList({ language, currencyCode, events, profiles, onDelete, onEdit }: { language: Language; currencyCode: string; events: BacEvent[]; profiles: UserProfile[]; onDelete?: (event: BacEvent) => void; onEdit?: (event: BacEvent) => void }) {
  if (!events.length) return <div className="empty-list">{translate(language, "emptyEvents")}</div>;
  const groups = new Map<string, BacEvent[]>();
  for (const event of events) {
    const date = new Date(event.timestamp);
    const key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return <div className="grouped-events">{[...groups.entries()].map(([key, grouped]) => {
    const drinksForDay = grouped.filter((event): event is Extract<BacEvent, { kind: "drink" }> => event.kind === "drink");
    const mealsForDay = grouped.filter((event): event is Extract<BacEvent, { kind: "meal" }> => event.kind === "meal");
    const totalSpent = drinksForDay.reduce((sum, event) => sum + (event.drink.price ?? 0), 0);
    const spentLabel = new Intl.NumberFormat(localeFor(language), { style: "currency", currency: currencyCode }).format(totalSpent);

    return <section key={key} className="event-group">
      <div className="event-group-title">{new Date(key).toLocaleDateString(localeFor(language), { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</div>
      <div className="event-day-summary">
        <span>{drinksForDay.length} drink</span>
        <span>{mealsForDay.length} pasti</span>
        <strong>{spentLabel}</strong>
      </div>
      <EventList language={language} events={grouped} profiles={profiles} onDelete={onDelete} onEdit={onEdit} />
    </section>;
  })}</div>;
}

function Modal({ title, closeLabel, onClose, children }: { title: string; closeLabel: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><div className="modal-title"><h2>{title}</h2><button aria-label={closeLabel} onClick={onClose}>×</button></div>{children}</section></div>;
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return <button className={active ? "active" : ""} onClick={onClick}><span>{icon}</span><small>{label}</small></button>;
}

function RetroController({ progress, onInput }: { progress: number; onInput: (input: RetroInput) => void }) {
  const control = (input: RetroInput, label: string, className = "") => <button type="button" className={className} aria-label={input} onClick={() => onInput(input)}>{label}</button>;
  return <div className="retro-controller">
    <div className="retro-progress" aria-label={`${progress} / 10`}>{Array.from({ length: 10 }, (_, index) => <span className={index < progress ? "active" : ""} key={index} />)}</div>
    <div className="retro-controls">
      <div className="d-pad">
        {control("UP", "↑", "up")}
        {control("LEFT", "←", "left")}
        <i aria-hidden="true" />
        {control("RIGHT", "→", "right")}
        {control("DOWN", "↓", "down")}
      </div>
      <div className="action-pad">{control("B", "B", "button-b")}{control("A", "A", "button-a")}</div>
    </div>
  </div>;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function formatDays(days: number, language: Language): string {
  return `${days} ${translate(language, days === 1 ? "day" : "days")}`;
}

function volumePresetsFor(type: DrinkEntry["drinkType"]): number[] {
  switch (type) {
    case "BEER_DRAUGHT":
      return [200, 300, 400, 500];
    case "BEER_BOTTLE":
      return [330, 500, 660];
    case "WINE":
      return [100, 125, 150, 250];
    case "COCKTAIL":
      return [180, 200, 250, 330];
    case "SHOT":
    case "SPIRITS":
      return [30, 40, 50, 60];
    case "CUSTOM":
      return [30, 50, 100, 150, 250, 330, 500];
  }
}

function PlayStoreBanner({ language }: { language: Language }) {
  return <section className="store-banner">
    <p>{translate(language, "androidBanner")}</p>
    <a
      className="store-banner-link"
      href="https://play.google.com/store/apps/details?id=com.swer4324.sbronzometro&hl=it"
      target="_blank"
      rel="noreferrer"
    >
      {translate(language, "download")}
    </a>
  </section>;
}

function DisclaimerScreen({ language, tosAccepted, setTosAccepted, onAccept }: { language: Language; tosAccepted: boolean; setTosAccepted: (value: boolean) => void; onAccept: () => void }) {
  const content = disclaimerTranslations[language];
  return <main className="gate-screen"><div className="gate-stack"><PlayStoreBanner language={language} /><section className="gate-card warning-card">
    <div className="gate-icon">!</div><span className="eyebrow">{content[0]}</span>
    <h1>{content[1]}</h1>
    <p>{content[2]}</p>
    <p><strong>{content[3]}</strong></p>
      <a className="document-link" href="./legal/Sbronzometro_ToS.pdf" target="_blank" rel="noreferrer">{content[4]}</a>
    <label className="consent-row"><input type="checkbox" checked={tosAccepted} onChange={(event) => setTosAccepted(event.target.checked)} /> {content[5]}</label>
    <button className="primary-action" disabled={!tosAccepted} onClick={onAccept}>{content[6]}</button>
  </section></div></main>;
}

function OnboardingScreen({ language, step, onNext, onSkip }: { language: Language; step: number; onNext: () => void; onSkip: () => void }) {
  const content = onboardingTranslations[language];
  const steps = content.steps;
  const current = steps[step];
  return <main className="gate-screen"><div className="gate-stack"><PlayStoreBanner language={language} /><section className="gate-card"><div className="onboarding-progress">{steps.map((_, index) => <span className={index <= step ? "active" : ""} key={index} />)}</div><div className="onboarding-icon">{current[2]}</div><span className="eyebrow">{step + 1} / {steps.length}</span><h1>{current[0]}</h1><p>{current[1]}</p><button className="primary-action" onClick={onNext}>{step === steps.length - 1 ? content.ready : content.next}</button><button className="gate-skip" onClick={onSkip}>{content.skip}</button></section></div></main>;
}

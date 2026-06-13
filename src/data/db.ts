import type { CustomDrink, DrinkEntry, MealEntry, UserProfile } from "../domain/models";

const DB_NAME = "sbronzometro-web";
const DB_VERSION = 2;

const STORES = {
  profiles: "profiles",
  drinks: "drinkEntries",
  meals: "mealEntries",
  customDrinks: "customDrinks",
  preferences: "preferences"
} as const;

let databasePromise: Promise<IDBDatabase> | null = null;

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Operazione IndexedDB fallita."));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Transazione IndexedDB fallita."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Transazione IndexedDB annullata."));
  });
}

export function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.profiles)) {
        const profiles = db.createObjectStore(STORES.profiles, { keyPath: "id", autoIncrement: true });
        profiles.createIndex("isActive", "isActive");
      }
      if (!db.objectStoreNames.contains(STORES.drinks)) {
        const drinks = db.createObjectStore(STORES.drinks, { keyPath: "id", autoIncrement: true });
        drinks.createIndex("userId", "userId");
        drinks.createIndex("timestampMillis", "timestampMillis");
      }
      if (!db.objectStoreNames.contains(STORES.meals)) {
        const meals = db.createObjectStore(STORES.meals, { keyPath: "id", autoIncrement: true });
        meals.createIndex("userId", "userId");
        meals.createIndex("timestampMillis", "timestampMillis");
      }
      if (!db.objectStoreNames.contains(STORES.preferences)) {
        db.createObjectStore(STORES.preferences, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORES.customDrinks)) {
        db.createObjectStore(STORES.customDrinks, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Impossibile aprire il database locale."));
    request.onblocked = () => reject(new Error("Database bloccato da un'altra scheda."));
  });
  return databasePromise;
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  return navigator.storage.persist();
}

export async function getProfiles(): Promise<UserProfile[]> {
  const db = await openDatabase();
  return requestToPromise(db.transaction(STORES.profiles).objectStore(STORES.profiles).getAll());
}

export async function saveProfile(profile: UserProfile): Promise<number> {
  const db = await openDatabase();
  const transaction = db.transaction(STORES.profiles, "readwrite");
  const store = transaction.objectStore(STORES.profiles);
  const profiles = await requestToPromise<UserProfile[]>(store.getAll());
  if (profile.isActive || profiles.length === 0) {
    for (const existing of profiles) {
      if (existing.isActive) store.put({ ...existing, isActive: false });
    }
    profile.isActive = true;
  }
  const id = await requestToPromise<IDBValidKey>(store.put(profile));
  await transactionDone(transaction);
  return Number(id);
}

export async function setActiveProfile(profileId: number): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(STORES.profiles, "readwrite");
  const store = transaction.objectStore(STORES.profiles);
  const profiles = await requestToPromise<UserProfile[]>(store.getAll());
  for (const profile of profiles) {
    store.put({ ...profile, isActive: profile.id === profileId });
  }
  await transactionDone(transaction);
}

export async function deleteProfile(profileId: number): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction([STORES.profiles, STORES.drinks, STORES.meals], "readwrite");
  const profileStore = transaction.objectStore(STORES.profiles);
  const profiles = await requestToPromise<UserProfile[]>(profileStore.getAll());
  const deleted = profiles.find((profile) => profile.id === profileId);
  profileStore.delete(profileId);
  for (const drink of await requestToPromise<DrinkEntry[]>(transaction.objectStore(STORES.drinks).getAll())) {
    if (drink.userId === profileId && drink.id != null) transaction.objectStore(STORES.drinks).delete(drink.id);
  }
  for (const meal of await requestToPromise<MealEntry[]>(transaction.objectStore(STORES.meals).getAll())) {
    if (meal.userId === profileId && meal.id != null) transaction.objectStore(STORES.meals).delete(meal.id);
  }
  if (deleted?.isActive) {
    const next = profiles.filter((profile) => profile.id !== profileId).sort((a, b) => a.name.localeCompare(b.name))[0];
    if (next) profileStore.put({ ...next, isActive: true });
  }
  await transactionDone(transaction);
}

export async function addDrink(drink: DrinkEntry): Promise<void> {
  const db = await openDatabase();
  await requestToPromise(db.transaction(STORES.drinks, "readwrite").objectStore(STORES.drinks).put(drink));
}

export async function addMeal(meal: MealEntry): Promise<void> {
  const db = await openDatabase();
  await requestToPromise(db.transaction(STORES.meals, "readwrite").objectStore(STORES.meals).put(meal));
}

export async function getDrinks(): Promise<DrinkEntry[]> {
  const db = await openDatabase();
  return requestToPromise(db.transaction(STORES.drinks).objectStore(STORES.drinks).getAll());
}

export async function getMeals(): Promise<MealEntry[]> {
  const db = await openDatabase();
  return requestToPromise(db.transaction(STORES.meals).objectStore(STORES.meals).getAll());
}

export async function deleteEvent(storeName: "drinkEntries" | "mealEntries", id: number): Promise<void> {
  const db = await openDatabase();
  await requestToPromise(db.transaction(storeName, "readwrite").objectStore(storeName).delete(id));
}

export async function getCustomDrinks(): Promise<CustomDrink[]> {
  const db = await openDatabase();
  return requestToPromise(db.transaction(STORES.customDrinks).objectStore(STORES.customDrinks).getAll());
}

export async function saveCustomDrink(drink: CustomDrink): Promise<void> {
  const db = await openDatabase();
  await requestToPromise(db.transaction(STORES.customDrinks, "readwrite").objectStore(STORES.customDrinks).put(drink));
}

export async function deleteCustomDrink(id: number): Promise<void> {
  const db = await openDatabase();
  await requestToPromise(db.transaction(STORES.customDrinks, "readwrite").objectStore(STORES.customDrinks).delete(id));
}

export async function getPreference<T>(key: string, fallback: T): Promise<T> {
  const db = await openDatabase();
  const result = await requestToPromise<{ key: string; value: T } | undefined>(
    db.transaction(STORES.preferences).objectStore(STORES.preferences).get(key)
  );
  return result?.value ?? fallback;
}

export async function setPreference<T>(key: string, value: T): Promise<void> {
  const db = await openDatabase();
  await requestToPromise(db.transaction(STORES.preferences, "readwrite").objectStore(STORES.preferences).put({ key, value }));
}

export async function exportBackup(): Promise<string> {
  const [profiles, drinks, meals, customDrinks, favoriteDrinkIds, language, currencyCode, disclaimerAccepted, onboardingCompleted, themeVariant, unlockedThemes] = await Promise.all([
    getProfiles(),
    getDrinks(),
    getMeals(),
    getCustomDrinks(),
    getPreference<string[]>("favoriteDrinkIds", []),
    getPreference<string>("language", "it"),
    getPreference<string>("currencyCode", "EUR"),
    getPreference<boolean>("disclaimerAccepted", false),
    getPreference<boolean>("onboardingCompleted", false),
    getPreference<string>("themeVariant", "classic"),
    getPreference<string[]>("unlockedThemes", [])
  ]);
  return JSON.stringify({ version: DB_VERSION, exportedAt: new Date().toISOString(), profiles, drinks, meals, customDrinks, favoriteDrinkIds, preferences: { language, currencyCode, disclaimerAccepted, onboardingCompleted, themeVariant, unlockedThemes } }, null, 2);
}

export async function importBackup(raw: string): Promise<void> {
  const parsed: unknown = JSON.parse(raw);
  if (!isBackup(parsed)) throw new Error("Il file non e un backup Sbronzometro valido.");
  const db = await openDatabase();
  const transaction = db.transaction(Object.values(STORES), "readwrite");
  for (const storeName of Object.values(STORES)) transaction.objectStore(storeName).clear();
  for (const profile of parsed.profiles) transaction.objectStore(STORES.profiles).put(profile);
  for (const drink of parsed.drinks) transaction.objectStore(STORES.drinks).put(drink);
  for (const meal of parsed.meals) transaction.objectStore(STORES.meals).put(meal);
  for (const customDrink of parsed.customDrinks ?? []) transaction.objectStore(STORES.customDrinks).put(customDrink);
  transaction.objectStore(STORES.preferences).put({ key: "favoriteDrinkIds", value: parsed.favoriteDrinkIds ?? [] });
  for (const [key, value] of Object.entries(parsed.preferences ?? {})) transaction.objectStore(STORES.preferences).put({ key, value });
  await transactionDone(transaction);
}

export async function resetDatabaseForTests(): Promise<void> {
  const db = await openDatabase();
  db.close();
  databasePromise = null;
  await requestToPromise(indexedDB.deleteDatabase(DB_NAME));
}

function isBackup(value: unknown): value is {
  profiles: UserProfile[];
  drinks: DrinkEntry[];
  meals: MealEntry[];
  customDrinks?: CustomDrink[];
  favoriteDrinkIds?: string[];
  preferences?: Record<string, unknown>;
} {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.profiles) && Array.isArray(candidate.drinks) && Array.isArray(candidate.meals);
}

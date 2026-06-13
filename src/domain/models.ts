export type BiologicalSex = "MALE" | "FEMALE";
export type StomachState = "EMPTY" | "LIGHT_MEAL" | "MEDIUM_MEAL" | "FULL_MEAL";
export type DrinkType =
  | "BEER_DRAUGHT"
  | "BEER_BOTTLE"
  | "WINE"
  | "COCKTAIL"
  | "SHOT"
  | "SPIRITS"
  | "CUSTOM";

export type BacLevel =
  | "SOBER_SAFE"
  | "LIGHT"
  | "TIPSY"
  | "OVER_LIMIT"
  | "PENAL_RISK"
  | "SEVERE_EBRIETY"
  | "CRITICAL_DANGER";

export interface UserProfile {
  id?: number;
  name: string;
  weightKg: number;
  heightCm: number;
  age: number;
  sex: BiologicalSex;
  customEliminationRatePerHour: number | null;
  isActive: boolean;
  notificationsEnabled: boolean;
}

export interface DrinkEntry {
  id?: number;
  userId: number;
  name: string;
  drinkType: DrinkType;
  alcoholPercent: number;
  volumeMl: number;
  timestampMillis: number;
  price: number | null;
  currencyCode: string | null;
  iconName: string | null;
}

export interface MealEntry {
  id?: number;
  userId: number;
  mealType: StomachState;
  timestampMillis: number;
}

export interface CustomDrink {
  id?: number;
  name: string;
  drinkType: DrinkType;
  alcoholPercent: number;
  volumeMl: number;
  icon: string;
}

export type BacEvent =
  | { kind: "drink"; timestamp: number; drink: DrinkEntry }
  | { kind: "meal"; timestamp: number; meal: MealEntry };

export interface BacResult {
  bac: number;
  peakBac: number;
  projectedPeakBac: number;
  historicalPeakBac: number;
  peakAlreadyPassed: boolean;
  bacLevel: BacLevel;
  estimatedMinutesUntilLegalLimit: number;
  suggestion: string;
  showHydrationReminder: boolean;
}

export interface DrinkTemplate {
  id: string;
  name: string;
  drinkType: DrinkType;
  alcoholPercent: number;
  volumeMl: number;
  icon: string;
  isCustom?: boolean;
}

export const drinkTemplates: DrinkTemplate[] = [
  { id: "beer-small", name: "Birra piccola", drinkType: "BEER_DRAUGHT", alcoholPercent: 5, volumeMl: 200, icon: "🍺" },
  { id: "beer-medium", name: "Birra media", drinkType: "BEER_DRAUGHT", alcoholPercent: 5, volumeMl: 400, icon: "🍺" },
  { id: "beer-bottle", name: "Birra bottiglia/lattina", drinkType: "BEER_BOTTLE", alcoholPercent: 5, volumeMl: 330, icon: "🍻" },
  { id: "beer-large", name: "Birra grande", drinkType: "BEER_DRAUGHT", alcoholPercent: 5, volumeMl: 500, icon: "🍺" },
  { id: "beer-strong", name: "Birra strong", drinkType: "BEER_BOTTLE", alcoholPercent: 8, volumeMl: 330, icon: "🍻" },
  { id: "wine-red", name: "Calice vino rosso", drinkType: "WINE", alcoholPercent: 13, volumeMl: 150, icon: "🍷" },
  { id: "wine-white", name: "Calice vino bianco", drinkType: "WINE", alcoholPercent: 12, volumeMl: 150, icon: "🥂" },
  { id: "prosecco", name: "Prosecco / spumante", drinkType: "WINE", alcoholPercent: 11, volumeMl: 150, icon: "🥂" },
  { id: "spritz", name: "Spritz", drinkType: "COCKTAIL", alcoholPercent: 8, volumeMl: 200, icon: "🍹" },
  { id: "gin-tonic", name: "Gin Tonic", drinkType: "COCKTAIL", alcoholPercent: 13.5, volumeMl: 200, icon: "🍸" },
  { id: "vodka-lemon", name: "Vodka Lemon", drinkType: "COCKTAIL", alcoholPercent: 10, volumeMl: 200, icon: "🍹" },
  { id: "rum-cola", name: "Rum e Cola", drinkType: "COCKTAIL", alcoholPercent: 10, volumeMl: 200, icon: "🥤" },
  { id: "mojito", name: "Mojito", drinkType: "COCKTAIL", alcoholPercent: 10, volumeMl: 250, icon: "🍹" },
  { id: "negroni", name: "Negroni", drinkType: "COCKTAIL", alcoholPercent: 24, volumeMl: 90, icon: "🥃" },
  { id: "americano", name: "Americano", drinkType: "COCKTAIL", alcoholPercent: 16, volumeMl: 120, icon: "🥃" },
  { id: "margarita", name: "Margarita", drinkType: "COCKTAIL", alcoholPercent: 18, volumeMl: 120, icon: "🍸" },
  { id: "long-island", name: "Long Island", drinkType: "COCKTAIL", alcoholPercent: 22, volumeMl: 250, icon: "🍹" },
  { id: "shot", name: "Shot", drinkType: "SHOT", alcoholPercent: 40, volumeMl: 40, icon: "🥃" },
  { id: "whisky", name: "Whisky", drinkType: "SPIRITS", alcoholPercent: 40, volumeMl: 40, icon: "🥃" },
  { id: "amaro", name: "Amaro", drinkType: "SPIRITS", alcoholPercent: 30, volumeMl: 40, icon: "🥃" },
  { id: "limoncello", name: "Limoncello", drinkType: "SPIRITS", alcoholPercent: 28, volumeMl: 40, icon: "🍋" }
];

export const mealLabels: Record<StomachState, string> = {
  EMPTY: "Stomaco vuoto",
  LIGHT_MEAL: "Pasto leggero",
  MEDIUM_MEAL: "Pasto medio",
  FULL_MEAL: "Pasto completo"
};

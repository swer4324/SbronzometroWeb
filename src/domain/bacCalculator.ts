import type { BacEvent, BacLevel, BacResult, BiologicalSex, StomachState, UserProfile } from "./models";

const ALCOHOL_DENSITY = 0.789;
const LEGAL_LIMIT = 0.5;
const STEP_HOURS = 1 / 60;
const STEP_MILLIS = 60_000;
const K_ABS_BASE = 4.5;
const FOOD_DELAY_FACTOR = 0.7;
const KM_ELIMINATION = 0.1;
const MAX_LOOKBACK_MILLIS = 1000 * 60 * 60 * 1000;

function metabolismRateByAge(age: number): number {
  if (age < 25) return 0.18;
  if (age <= 50) return 0.15;
  return 0.12;
}

function distributionFactor(weight: number, height: number, sex: BiologicalSex): number {
  const value =
    sex === "MALE"
      ? 0.31608 - 0.004821 * weight + 0.004632 * height
      : 0.31223 - 0.006446 * weight + 0.004466 * height;
  return Math.min(0.85, Math.max(0.5, value));
}

function mealValue(state: StomachState): number {
  if (state === "FULL_MEAL") return 1;
  if (state === "MEDIUM_MEAL") return 0.7;
  if (state === "LIGHT_MEAL") return 0.4;
  return 0;
}

export function bacLevelFromValue(bac: number): BacLevel {
  if (bac <= 0.005) return "SOBER_SAFE";
  if (bac < 0.2) return "LIGHT";
  if (bac < 0.5) return "TIPSY";
  if (bac < 0.8) return "OVER_LIMIT";
  if (bac < 1.5) return "PENAL_RISK";
  if (bac < 2.8) return "SEVERE_EBRIETY";
  return "CRITICAL_DANGER";
}

function suggestionForBac(bac: number): string {
  if (bac <= 0.005) return "Sei perfettamente sobrio.";
  if (bac < 0.5) return "Sotto il limite legale, ma presta attenzione.";
  if (bac < 0.8) return "LIMITE SUPERATO. Non guidare.";
  if (bac < 1.5) return "RISCHIO PENALE. Non guidare.";
  if (bac < 2.8) return "EBBREZZA GRAVE. Resta con qualcuno.";
  return "PERICOLO CRITICO. Chiama i soccorsi.";
}

function project(
  startBlood: number,
  startGut: number,
  beta: number,
  volumeDistribution: number,
  startFood: number,
  mode: "peak" | "safe"
): number {
  let blood = startBlood;
  let gut = startGut;
  let food = startFood;
  let peak = blood / volumeDistribution;
  let everExceeded = false;
  let lastMinuteAbove = 0;

  for (let minute = 0; minute <= 60_000; minute += 1) {
    const currentBac = blood / volumeDistribution;
    if (currentBac >= LEGAL_LIMIT) {
      everExceeded = true;
      lastMinuteAbove = minute;
    }
    if (gut < 0.001 && blood < 0.001 && (mode === "peak" || !everExceeded)) break;
    if (mode === "safe" && gut < 0.001 && currentBac < LEGAL_LIMIT && everExceeded) break;

    const kAbs = K_ABS_BASE * (1 - FOOD_DELAY_FACTOR * food);
    const absorbed = gut * (1 - Math.exp(-kAbs * STEP_HOURS));
    gut = Math.max(0, gut - absorbed);
    const scale = currentBac > 0 ? currentBac / (KM_ELIMINATION + currentBac) : 0;
    const eliminated = beta * volumeDistribution * STEP_HOURS * scale;
    blood = Math.max(0, blood + absorbed - eliminated);
    peak = Math.max(peak, blood / volumeDistribution);
    food *= Math.exp(-0.3 * STEP_HOURS);
  }
  if (mode === "safe") return everExceeded ? lastMinuteAbove : 0;
  return peak < 0.01 ? 0 : peak;
}

export function calculateCurrentBac(user: UserProfile, events: BacEvent[], nowMillis = Date.now()): BacResult {
  const validEvents = events
    .filter((event) => event.timestamp >= nowMillis - MAX_LOOKBACK_MILLIS && event.timestamp <= nowMillis)
    .sort((a, b) => a.timestamp - b.timestamp);
  if (!validEvents.some((event) => event.kind === "drink")) return soberResult();

  const r = distributionFactor(user.weightKg, user.heightCm, user.sex);
  const beta = user.customEliminationRatePerHour ?? metabolismRateByAge(user.age);
  const volumeDistribution = r * user.weightKg;
  let alcoholGut = 0;
  let alcoholBlood = 0;
  let historicalPeakBac = 0;
  let sessionDrinkCount = 0;
  let sessionStrongDrinkCount = 0;
  let foodLoad = 0;
  let currentTime = validEvents[0].timestamp;
  let eventIndex = 0;

  while (currentTime <= nowMillis) {
    while (eventIndex < validEvents.length && validEvents[eventIndex].timestamp < currentTime + STEP_MILLIS) {
      const event = validEvents[eventIndex];
      if (event.timestamp >= currentTime) {
        if (event.kind === "drink") {
          if (alcoholBlood / volumeDistribution < 0.01 && alcoholGut < 0.1) {
            historicalPeakBac = 0;
            sessionDrinkCount = 0;
            sessionStrongDrinkCount = 0;
          }
          sessionDrinkCount += 1;
          if (event.drink.alcoholPercent >= 10) sessionStrongDrinkCount += 1;
          alcoholGut += event.drink.volumeMl * (event.drink.alcoholPercent / 100) * ALCOHOL_DENSITY;
        } else {
          foodLoad = Math.max(foodLoad, mealValue(event.meal.mealType));
        }
      }
      eventIndex += 1;
    }
    const kAbs = K_ABS_BASE * (1 - FOOD_DELAY_FACTOR * foodLoad);
    const absorbed = alcoholGut * (1 - Math.exp(-kAbs * STEP_HOURS));
    alcoholGut = Math.max(0, alcoholGut - absorbed);
    const currentBac = alcoholBlood / volumeDistribution;
    const scale = currentBac > 0 ? currentBac / (KM_ELIMINATION + currentBac) : 0;
    const eliminated = alcoholBlood > 0 ? beta * volumeDistribution * STEP_HOURS * scale : 0;
    alcoholBlood = Math.max(0, alcoholBlood + absorbed - eliminated);
    historicalPeakBac = Math.max(historicalPeakBac, alcoholBlood / volumeDistribution);
    foodLoad *= Math.exp(-0.3 * STEP_HOURS);
    if (foodLoad < 0.01) foodLoad = 0;
    currentTime += STEP_MILLIS;
  }

  let bac = alcoholBlood / volumeDistribution;
  if (bac < 0.01) bac = 0;
  const projectedPeakBac = project(alcoholBlood, alcoholGut, beta, volumeDistribution, foodLoad, "peak");
  return {
    bac,
    peakBac: Math.max(historicalPeakBac, projectedPeakBac),
    projectedPeakBac: bac === 0 && alcoholGut < 0.1 ? 0 : projectedPeakBac,
    historicalPeakBac,
    peakAlreadyPassed: projectedPeakBac <= bac + 0.005,
    bacLevel: bacLevelFromValue(bac),
    estimatedMinutesUntilLegalLimit: project(alcoholBlood, alcoholGut, beta, volumeDistribution, foodLoad, "safe"),
    suggestion: suggestionForBac(bac),
    showHydrationReminder: bac !== 0 && (sessionStrongDrinkCount >= 2 || sessionDrinkCount >= 4)
  };
}

function soberResult(): BacResult {
  return {
    bac: 0,
    peakBac: 0,
    projectedPeakBac: 0,
    historicalPeakBac: 0,
    peakAlreadyPassed: true,
    bacLevel: "SOBER_SAFE",
    estimatedMinutesUntilLegalLimit: 0,
    suggestion: suggestionForBac(0),
    showHydrationReminder: false
  };
}

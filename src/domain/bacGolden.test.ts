import { describe, expect, it } from "vitest";
import goldenScenarios from "./bac-golden.json";
import { calculateCurrentBac } from "./bacCalculator";
import type { BacEvent, UserProfile } from "./models";

describe("Android/web BAC golden parity", () => {
  for (const scenario of goldenScenarios) {
    it(`matches Android for ${scenario.name}`, () => {
      const result = calculateCurrentBac(scenario.profile as UserProfile, scenario.events as BacEvent[], scenario.now);

      expect(result.bac).toBeCloseTo(scenario.expected.bac, 10);
      expect(result.peakBac).toBeCloseTo(scenario.expected.peakBac, 10);
      expect(result.projectedPeakBac).toBeCloseTo(scenario.expected.projectedPeakBac, 10);
      expect(result.historicalPeakBac).toBeCloseTo(scenario.expected.historicalPeakBac, 10);
      expect(result.peakAlreadyPassed).toBe(scenario.expected.peakAlreadyPassed);
      expect(result.bacLevel).toBe(scenario.expected.bacLevel);
      expect(result.estimatedMinutesUntilLegalLimit).toBe(scenario.expected.estimatedMinutesUntilLegalLimit);
      expect(result.showHydrationReminder).toBe(scenario.expected.showHydrationReminder);
    });
  }
});

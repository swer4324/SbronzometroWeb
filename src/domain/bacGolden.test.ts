import { describe, expect, it } from "vitest";
import goldenScenarios from "./bac-golden.json";
import { calculateCurrentBac } from "./bacCalculator";
import type { BacEvent, UserProfile } from "./models";

describe("Android BAC golden parity", () => {
  for (const scenario of goldenScenarios) {
    it(`matches Android for ${scenario.name}`, () => {
      const actual = calculateCurrentBac(scenario.profile as UserProfile, scenario.events as unknown as BacEvent[], scenario.now);
      expect(actual.isError).toBe(false);
      expect(actual.bac).toBeCloseTo(scenario.expected.bac, 12);
      expect(actual.peakBac).toBeCloseTo(scenario.expected.peakBac, 12);
      expect(actual.projectedPeakBac).toBeCloseTo(scenario.expected.projectedPeakBac, 12);
      expect(actual.historicalPeakBac).toBeCloseTo(scenario.expected.historicalPeakBac, 12);
      expect(actual.peakAlreadyPassed).toBe(scenario.expected.peakAlreadyPassed);
      expect(actual.bacLevel).toBe(scenario.expected.bacLevel);
      expect(actual.estimatedMinutesUntilLegalLimit).toBe(scenario.expected.estimatedMinutesUntilLegalLimit);
      expect(actual.showHydrationReminder).toBe(scenario.expected.showHydrationReminder);
    });
  }
});

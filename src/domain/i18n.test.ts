import { describe, expect, it } from "vitest";
import { bacLevelLabel, bacSuggestion, disclaimerTranslations, drinkTemplateName, languageNames, localeFor, mealLabel, onboardingTranslations, secretThemeTranslation, translate } from "./i18n";

describe("i18n", () => {
  it("translates complete Italian and English UI strings", () => {
    expect(translate("it", "settings")).toBe("Impostazioni");
    expect(translate("en", "settings")).toBe("Settings");
  });

  it("translates secondary languages without English UI fallbacks", () => {
    expect(translate("es", "settings")).toBe("Ajustes");
    expect(translate("fr", "backupHelp")).toContain("navigateur");
    expect(translate("de", "backupHelp")).toContain("Browser");
  });

  it("interpolates values and returns the correct locale", () => {
    expect(translate("de", "unlockedCount", { count: 2, total: 5 })).toContain("2 / 5 freigeschaltet");
    expect(localeFor("fr")).toBe("fr-FR");
  });

  it("provides localized safety, meal and onboarding content for every language", () => {
    for (const language of Object.keys(languageNames) as (keyof typeof languageNames)[]) {
      expect(mealLabel(language, "FULL_MEAL")).not.toHaveLength(0);
      expect(bacLevelLabel(language, "CRITICAL_DANGER")).not.toHaveLength(0);
      expect(bacSuggestion(language, "CRITICAL_DANGER")).not.toHaveLength(0);
      expect(disclaimerTranslations[language]).toHaveLength(7);
      expect(onboardingTranslations[language].steps).toHaveLength(4);
    }
  });

  it("translates catalog drinks and secret themes", () => {
    expect(drinkTemplateName("de", "beer-medium", "Birra media")).toBe("Mittleres Bier");
    expect(secretThemeTranslation("es", "closed_bar", "Bar chiuso", "hint")).toEqual(["Bar cerrado", "Pasa cuando todos duermen."]);
  });
});

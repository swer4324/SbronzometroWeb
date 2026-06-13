import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import {
  addDrink,
  addMeal,
  deleteProfile,
  exportBackup,
  getDrinks,
  getMeals,
  getProfiles,
  importBackup,
  resetDatabaseForTests,
  saveProfile,
  getPreference,
  setPreference
} from "./db";
import type { UserProfile } from "../domain/models";

const profile: UserProfile = {
  name: "Andrea",
  weightKg: 75,
  heightCm: 178,
  age: 30,
  sex: "MALE",
  customEliminationRatePerHour: null,
  isActive: true,
  notificationsEnabled: true
};

afterEach(async () => {
  await resetDatabaseForTests();
});

describe("IndexedDB repository", () => {
  it("persists and updates a profile without creating a duplicate", async () => {
    const id = await saveProfile({ ...profile });
    await saveProfile({ ...profile, id, name: "Andrea aggiornato" });

    const profiles = await getProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe("Andrea aggiornato");
  });

  it("deletes related drinks and meals with a profile", async () => {
    const id = await saveProfile({ ...profile });
    await addDrink({
      userId: id,
      name: "Birra",
      drinkType: "BEER_DRAUGHT",
      alcoholPercent: 5,
      volumeMl: 400,
      timestampMillis: 1,
      price: null,
      currencyCode: null,
      iconName: null
    });
    await addMeal({ userId: id, mealType: "FULL_MEAL", timestampMillis: 1 });

    await deleteProfile(id);
    expect(await getDrinks()).toEqual([]);
    expect(await getMeals()).toEqual([]);
  });

  it("restores an exported backup", async () => {
    await saveProfile({ ...profile });
    await setPreference("currencyCode", "GBP");
    await setPreference("themeVariant", "spritz");
    const backup = await exportBackup();
    await resetDatabaseForTests();

    await importBackup(backup);
    expect((await getProfiles())[0].name).toBe("Andrea");
    expect(await getPreference("currencyCode", "EUR")).toBe("GBP");
    expect(await getPreference("themeVariant", "classic")).toBe("spritz");
  });

  it("rejects invalid backup files without clearing existing data", async () => {
    await saveProfile({ ...profile });
    await expect(importBackup('{"hello":"world"}')).rejects.toThrow();
    expect(await getProfiles()).toHaveLength(1);
  });
});

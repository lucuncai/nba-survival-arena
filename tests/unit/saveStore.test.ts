import { describe, expect, it } from "vitest";
import { migrateSave } from "../../src/core/SaveStore";

describe("migrateSave", () => {
  it("returns defaults for empty input", () => {
    const save = migrateSave(null);
    expect(save.version).toBe(3);
    expect(save.gamesPlayed).toBe(0);
    expect(save.profile.selectedCharacter).toBe("king");
    expect(save.profile.unlockedCharacters).toEqual(["king"]);
    expect(save.profile.streetCred).toBe(0);
    expect(save.profile.unlockedArenas).toContain("blacktop");
  });

  it("upgrades a legacy v2 save while preserving records", () => {
    const save = migrateSave({
      version: 2,
      gamesPlayed: 12,
      bestScore: 5_400,
      bestTime: 210,
      bestWave: 4,
      bestBlocks: 33,
      tutorialSeen: true,
      muted: true,
    });

    expect(save.version).toBe(3);
    expect(save.gamesPlayed).toBe(12);
    expect(save.bestScore).toBe(5_400);
    expect(save.bestWave).toBe(4);
    expect(save.bestBlocks).toBe(33);
    expect(save.tutorialSeen).toBe(true);
    expect(save.muted).toBe(true);
    expect(save.profile.selectedCharacter).toBe("king");
    expect(save.profile.unlockedCharacters).toEqual(["king"]);
  });

  it("keeps a valid v3 profile and always includes the default character", () => {
    const save = migrateSave({
      version: 3,
      profile: {
        streetCred: 250,
        selectedCharacter: "king",
        unlockedCharacters: ["king"],
        unlockedArenas: ["blacktop", "rooftop"],
        permanentUpgrades: { "start-damage": 2 },
      },
    });

    expect(save.profile.streetCred).toBe(250);
    expect(save.profile.unlockedArenas).toEqual(expect.arrayContaining(["blacktop", "rooftop"]));
    expect(save.profile.permanentUpgrades).toEqual({ "start-damage": 2 });
  });

  it("clamps corrupt numbers and drops unknown characters and non-numeric upgrades", () => {
    const corrupt = {
      gamesPlayed: -5,
      bestScore: Number.NaN,
      profile: {
        streetCred: -100,
        selectedCharacter: "ghost",
        unlockedCharacters: ["ghost", "king"],
        permanentUpgrades: { good: 3, bad: "x" },
      },
    } as unknown as Parameters<typeof migrateSave>[0];

    const save = migrateSave(corrupt);

    expect(save.gamesPlayed).toBe(0);
    expect(save.bestScore).toBe(0);
    expect(save.profile.streetCred).toBe(0);
    expect(save.profile.selectedCharacter).toBe("king");
    expect(save.profile.unlockedCharacters).toEqual(["king"]);
    expect(save.profile.permanentUpgrades).toEqual({ good: 3 });
  });
});

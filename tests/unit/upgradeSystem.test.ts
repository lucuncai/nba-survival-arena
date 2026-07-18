import { describe, expect, it } from "vitest";
import { SeededRandom } from "../../src/core/SeededRandom";
import { UPGRADES, UPGRADE_EFFECTS } from "../../src/game/data";
import { availableUpgrades, rollUpgradeChoices } from "../../src/game/UpgradeSystem";
import type { UpgradeId } from "../../src/game/types";

describe("upgrade data", () => {
  it("has an effect for every upgrade and vice versa", () => {
    const ids = UPGRADES.map((upgrade) => upgrade.id).sort();
    const effectIds = Object.keys(UPGRADE_EFFECTS).sort();
    expect(effectIds).toEqual(ids);
  });

  it("has unique ids and positive max ranks", () => {
    const ids = UPGRADES.map((upgrade) => upgrade.id);
    expect(new Set(ids).size).toBe(ids.length);
    UPGRADES.forEach((upgrade) => expect(upgrade.maxRank).toBeGreaterThan(0));
  });
});

describe("rollUpgradeChoices", () => {
  it("returns the requested number of distinct upgrades", () => {
    const choices = rollUpgradeChoices(UPGRADES, new Map(), new SeededRandom(1), 3);
    expect(choices).toHaveLength(3);
    expect(new Set(choices.map((choice) => choice.id)).size).toBe(3);
  });

  it("never offers an upgrade that is already maxed", () => {
    const ranks = new Map<UpgradeId, number>(UPGRADES.map((upgrade) => [upgrade.id, upgrade.maxRank]));
    ranks.set("heavy-hands", 0);
    const choices = rollUpgradeChoices(UPGRADES, ranks, new SeededRandom(7), 3);
    expect(choices).toHaveLength(1);
    expect(choices[0]!.id).toBe("heavy-hands");
  });

  it("returns nothing when everything is maxed", () => {
    const ranks = new Map<UpgradeId, number>(UPGRADES.map((upgrade) => [upgrade.id, upgrade.maxRank]));
    expect(rollUpgradeChoices(UPGRADES, ranks, new SeededRandom(3), 3)).toEqual([]);
  });

  it("is deterministic for a fixed seed", () => {
    const first = rollUpgradeChoices(UPGRADES, new Map(), new SeededRandom(99), 3).map((c) => c.id);
    const second = rollUpgradeChoices(UPGRADES, new Map(), new SeededRandom(99), 3).map((c) => c.id);
    expect(first).toEqual(second);
  });

  it("excludes maxed upgrades from the available set", () => {
    const ranks = new Map<UpgradeId, number>([["heavy-hands", 5]]);
    const available = availableUpgrades(UPGRADES, ranks).map((upgrade) => upgrade.id);
    expect(available).not.toContain("heavy-hands");
  });
});

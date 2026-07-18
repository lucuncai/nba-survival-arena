import { describe, expect, it } from "vitest";
import { getPermanentUpgrade } from "../../src/game/data";
import {
  computePermanentBonuses,
  computeRunCred,
  nextPermanentCost,
  purchasePermanent,
} from "../../src/game/MetaSystem";
import type { MetaProfile } from "../../src/game/types";

function profile(overrides: Partial<MetaProfile> = {}): MetaProfile {
  return {
    streetCred: 0,
    selectedCharacter: "king",
    unlockedCharacters: ["king"],
    unlockedArenas: ["blacktop"],
    permanentUpgrades: {},
    ...overrides,
  };
}

describe("computeRunCred", () => {
  it("rewards score, kills, blocks and wave", () => {
    // floor(1200/120)=10 + 10*2 + 5*3 + 4*8 = 77
    expect(computeRunCred({ score: 1_200, kills: 10, blocks: 5, wave: 4, victory: false })).toBe(77);
  });

  it("adds a victory bonus and never goes negative", () => {
    expect(computeRunCred({ score: 0, kills: 0, blocks: 0, wave: 1, victory: true })).toBe(158);
    expect(computeRunCred({ score: 0, kills: 0, blocks: 0, wave: 0, victory: false })).toBe(0);
  });
});

describe("computePermanentBonuses", () => {
  it("returns neutral bonuses with no levels", () => {
    expect(computePermanentBonuses({})).toEqual({
      damageMultiplier: 1,
      bonusMaxHp: 0,
      bonusRimHp: 0,
      attackCooldownMultiplier: 1,
      credMultiplier: 1,
    });
  });

  it("scales with purchased levels", () => {
    const bonuses = computePermanentBonuses({
      "training-camp": 2,
      conditioning: 3,
      "reinforced-backboard": 1,
      "signing-bonus": 2,
    });
    expect(bonuses.damageMultiplier).toBeCloseTo(1.16);
    expect(bonuses.bonusMaxHp).toBe(120);
    expect(bonuses.bonusRimHp).toBe(15);
    expect(bonuses.credMultiplier).toBeCloseTo(1.3);
  });
});

describe("permanent purchase", () => {
  it("computes escalating cost and stops at max level", () => {
    const definition = getPermanentUpgrade("training-camp");
    expect(nextPermanentCost(definition, 0)).toBe(60);
    expect(nextPermanentCost(definition, 1)).toBe(120);
    expect(nextPermanentCost(definition, definition.maxLevel)).toBeNull();
  });

  it("purchases a level when affordable and deducts cred", () => {
    const definition = getPermanentUpgrade("training-camp");
    const result = purchasePermanent(profile({ streetCred: 100 }), definition);
    expect(result.purchased).toBe(true);
    expect(result.profile.streetCred).toBe(40);
    expect(result.profile.permanentUpgrades["training-camp"]).toBe(1);
  });

  it("refuses when cred is insufficient and does not mutate the input", () => {
    const definition = getPermanentUpgrade("training-camp");
    const start = profile({ streetCred: 10 });
    const result = purchasePermanent(start, definition);
    expect(result.purchased).toBe(false);
    expect(result.profile).toBe(start);
    expect(start.permanentUpgrades["training-camp"]).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { ELITE_MODIFIERS, eliteChanceForWave } from "../../src/game/data";

describe("elite modifiers", () => {
  it("has unique ids and sensible multipliers", () => {
    const ids = ELITE_MODIFIERS.map((modifier) => modifier.id);
    expect(new Set(ids).size).toBe(ids.length);
    ELITE_MODIFIERS.forEach((modifier) => {
      expect(modifier.hpMult).toBeGreaterThan(0);
      expect(modifier.speedMult).toBeGreaterThan(0);
      expect(modifier.scoreMult).toBeGreaterThanOrEqual(1);
    });
  });

  it("scales elite chance with wave and clamps to a cap", () => {
    expect(eliteChanceForWave(1)).toBe(0);
    expect(eliteChanceForWave(3)).toBe(0);
    expect(eliteChanceForWave(5)).toBeCloseTo(0.1);
    expect(eliteChanceForWave(100)).toBe(0.35);
  });
});

import { describe, expect, it } from "vitest";
import { PLAYER_BASE } from "../../src/game/config";
import {
  CHARACTERS,
  DEFAULT_CHARACTER_ID,
  SKILL_IDS,
  SKILL_META,
  getCharacter,
} from "../../src/game/data";

describe("characters", () => {
  it("exposes a valid default character", () => {
    expect(CHARACTERS[DEFAULT_CHARACTER_ID]).toBeDefined();
    expect(getCharacter(DEFAULT_CHARACTER_ID).id).toBe(DEFAULT_CHARACTER_ID);
  });

  it("includes the three playable legends", () => {
    expect(Object.keys(CHARACTERS).sort()).toEqual(["chef", "king", "mamba"]);
  });

  it("has display metadata for every skill", () => {
    SKILL_IDS.forEach((id) => {
      expect(SKILL_META[id]).toBeDefined();
      expect(SKILL_META[id].name.length).toBeGreaterThan(0);
    });
  });

  it("only references known skills in every loadout", () => {
    const known = new Set<string>(SKILL_IDS);
    Object.values(CHARACTERS).forEach((character) => {
      Object.values(character.skills).forEach((skillId) => {
        expect(known.has(skillId)).toBe(true);
      });
    });
  });

  it("assigns every declared skill to at least one character", () => {
    const used = new Set<string>();
    Object.values(CHARACTERS).forEach((character) => {
      Object.values(character.skills).forEach((skillId) => used.add(skillId));
    });
    SKILL_IDS.forEach((skillId) => expect(used.has(skillId)).toBe(true));
  });

  it("keeps The King's stats aligned with the shared base tuning", () => {
    const king = getCharacter("king");
    expect(king.stats.maxHp).toBe(PLAYER_BASE.maxHp);
    expect(king.stats.moveSpeed).toBe(PLAYER_BASE.speed);
    expect(king.stats.damage).toBe(PLAYER_BASE.damage);
    expect(king.stats.attackRange).toBe(PLAYER_BASE.attackRange);
    expect(king.stats.attackArc).toBe(PLAYER_BASE.attackArc);
    expect(king.stats.attackCooldown).toBe(PLAYER_BASE.attackCooldown);
  });
});

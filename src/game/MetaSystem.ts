import type {
  CharacterDefinition,
  MetaProfile,
  PermanentBonuses,
  PermanentUpgradeDefinition,
  PermanentUpgradeId,
} from "./types";

export interface RunCredInput {
  score: number;
  kills: number;
  blocks: number;
  wave: number;
  victory: boolean;
}

/** Base Street Cred earned from a run, before permanent multipliers. */
export function computeRunCred(input: RunCredInput): number {
  const base =
    Math.floor(input.score / 120) +
    input.kills * 2 +
    input.blocks * 3 +
    input.wave * 8 +
    (input.victory ? 150 : 0);
  return Math.max(0, base);
}

export function permanentLevel(
  profile: Pick<MetaProfile, "permanentUpgrades">,
  id: PermanentUpgradeId,
): number {
  return profile.permanentUpgrades[id] ?? 0;
}

/** Per-run starting bonuses granted by purchased permanent upgrades. */
export function computePermanentBonuses(levels: Record<string, number>): PermanentBonuses {
  const level = (id: PermanentUpgradeId): number => levels[id] ?? 0;
  return {
    damageMultiplier: 1 + 0.08 * level("training-camp"),
    bonusMaxHp: 40 * level("conditioning"),
    bonusRimHp: 15 * level("reinforced-backboard"),
    attackCooldownMultiplier: 0.96 ** level("quick-hands"),
    credMultiplier: 1 + 0.15 * level("signing-bonus"),
  };
}

/** Cost to buy the next level, or null when already maxed. */
export function nextPermanentCost(
  definition: PermanentUpgradeDefinition,
  currentLevel: number,
): number | null {
  if (currentLevel >= definition.maxLevel) return null;
  return definition.baseCost * (currentLevel + 1);
}

export interface PurchaseResult {
  profile: MetaProfile;
  purchased: boolean;
}

/**
 * Attempt to buy the next level of a permanent upgrade. Returns a new profile
 * (never mutates the input) and whether the purchase succeeded.
 */
export function purchasePermanent(
  profile: MetaProfile,
  definition: PermanentUpgradeDefinition,
): PurchaseResult {
  const currentLevel = permanentLevel(profile, definition.id);
  const cost = nextPermanentCost(definition, currentLevel);
  if (cost === null || profile.streetCred < cost) {
    return { profile, purchased: false };
  }
  return {
    purchased: true,
    profile: {
      ...profile,
      streetCred: profile.streetCred - cost,
      permanentUpgrades: { ...profile.permanentUpgrades, [definition.id]: currentLevel + 1 },
    },
  };
}

/** Attempt to unlock a character with Street Cred. Never mutates the input. */
export function unlockCharacter(profile: MetaProfile, definition: CharacterDefinition): PurchaseResult {
  if (profile.unlockedCharacters.includes(definition.id) || profile.streetCred < definition.unlockCost) {
    return { profile, purchased: false };
  }
  return {
    purchased: true,
    profile: {
      ...profile,
      streetCred: profile.streetCred - definition.unlockCost,
      unlockedCharacters: [...profile.unlockedCharacters, definition.id],
    },
  };
}

import type { SeededRandom } from "../core/SeededRandom";
import type {
  EvolutionDefinition,
  EvolutionId,
  UpgradeDefinition,
  UpgradeId,
  UpgradeRarity,
} from "./types";

const RARITY_WEIGHT: Readonly<Record<UpgradeRarity, number>> = {
  common: 1,
  rare: 0.5,
  epic: 0.2,
};

export function rarityWeight(rarity: UpgradeRarity): number {
  return RARITY_WEIGHT[rarity];
}

/** Upgrades that still have at least one rank left to take. */
export function availableUpgrades(
  pool: readonly UpgradeDefinition[],
  ranks: ReadonlyMap<UpgradeId, number>,
): UpgradeDefinition[] {
  return pool.filter((upgrade) => (ranks.get(upgrade.id) ?? 0) < upgrade.maxRank);
}

/**
 * Pick `count` distinct upgrades, weighted by rarity, excluding any that have
 * already reached their maximum rank. Deterministic for a given SeededRandom.
 */
export function rollUpgradeChoices(
  pool: readonly UpgradeDefinition[],
  ranks: ReadonlyMap<UpgradeId, number>,
  random: SeededRandom,
  count: number,
): UpgradeDefinition[] {
  const remaining = availableUpgrades(pool, ranks);
  const chosen: UpgradeDefinition[] = [];

  while (chosen.length < count && remaining.length > 0) {
    const totalWeight = remaining.reduce((sum, upgrade) => sum + rarityWeight(upgrade.rarity), 0);
    let roll = random.next() * totalWeight;
    let index = 0;
    for (; index < remaining.length - 1; index += 1) {
      roll -= rarityWeight(remaining[index]!.rarity);
      if (roll <= 0) break;
    }
    chosen.push(remaining.splice(index, 1)[0]!);
  }

  return chosen;
}

/**
 * Evolutions whose required upgrades are all at max rank and which have not yet
 * been claimed this run.
 */
export function availableEvolutions(
  pool: readonly EvolutionDefinition[],
  ranks: ReadonlyMap<UpgradeId, number>,
  maxRankOf: (id: UpgradeId) => number,
  taken: ReadonlySet<EvolutionId>,
): EvolutionDefinition[] {
  return pool.filter(
    (evolution) =>
      !taken.has(evolution.id) &&
      evolution.requires.every((id) => (ranks.get(id) ?? 0) >= maxRankOf(id)),
  );
}

import { COLORS, PLAYER_BASE } from "./config";
import type { PlayerEntity } from "./entities";
import type {
  CharacterDefinition,
  CharacterId,
  EnemyDefinition,
  EnemyKind,
  EvolutionDefinition,
  EvolutionId,
  PermanentUpgradeDefinition,
  PermanentUpgradeId,
  SkillId,
  UpgradeDefinition,
  UpgradeId,
  WaveDefinition,
} from "./types";

export const ENEMIES: Readonly<Record<EnemyKind, EnemyDefinition>> = {
  rookie: {
    kind: "rookie",
    name: "CUTTER",
    maxHp: 70,
    speed: 122,
    touchDamage: 14,
    radius: 23,
    preferredRange: 126,
    windupSeconds: 0.7,
    shotSpeed: 420,
    shotDamage: 4,
    accuracy: 0.86,
    score: 70,
    color: 0xff8a3d,
    mass: 1,
  },
  shooter: {
    kind: "shooter",
    name: "PULL-UP",
    maxHp: 92,
    speed: 98,
    touchDamage: 12,
    radius: 24,
    preferredRange: 310,
    windupSeconds: 1.05,
    shotSpeed: 350,
    shotDamage: 7,
    accuracy: 0.76,
    score: 110,
    color: 0x48d8ff,
    mass: 1.2,
  },
  sniper: {
    kind: "sniper",
    name: "DEEP THREAT",
    maxHp: 68,
    speed: 82,
    touchDamage: 10,
    radius: 21,
    preferredRange: 520,
    windupSeconds: 1.45,
    shotSpeed: 290,
    shotDamage: 10,
    accuracy: 0.68,
    score: 160,
    color: 0xd88cff,
    mass: 0.9,
  },
  center: {
    kind: "center",
    name: "ENFORCER",
    maxHp: 260,
    speed: 66,
    touchDamage: 24,
    radius: 34,
    preferredRange: 92,
    windupSeconds: 0.9,
    shotSpeed: 500,
    shotDamage: 13,
    accuracy: 1,
    score: 250,
    color: 0xff3b55,
    mass: 4.5,
  },
  boss: {
    kind: "boss",
    name: "THE COMMISSIONER",
    maxHp: 2_400,
    speed: 78,
    touchDamage: 32,
    radius: 52,
    preferredRange: 250,
    windupSeconds: 1.15,
    shotSpeed: 370,
    shotDamage: 15,
    accuracy: 0.92,
    score: 2_500,
    color: 0xff2f4d,
    mass: 8,
  },
};

export const WAVES: readonly WaveDefinition[] = [
  {
    number: 1,
    title: "WARM-UP",
    durationSeconds: 24,
    spawnIntervalSeconds: 1.65,
    roster: [{ kind: "rookie", weight: 1 }],
    maxAlive: 7,
  },
  {
    number: 2,
    title: "THE PULL-UP",
    durationSeconds: 30,
    spawnIntervalSeconds: 1.35,
    roster: [
      { kind: "rookie", weight: 0.65 },
      { kind: "shooter", weight: 0.35 },
    ],
    maxAlive: 9,
  },
  {
    number: 3,
    title: "FROM THE LOGO",
    durationSeconds: 34,
    spawnIntervalSeconds: 1.12,
    roster: [
      { kind: "rookie", weight: 0.42 },
      { kind: "shooter", weight: 0.38 },
      { kind: "sniper", weight: 0.2 },
    ],
    maxAlive: 11,
  },
  {
    number: 4,
    title: "OWN THE PAINT",
    durationSeconds: 38,
    spawnIntervalSeconds: 0.92,
    roster: [
      { kind: "rookie", weight: 0.32 },
      { kind: "shooter", weight: 0.3 },
      { kind: "sniper", weight: 0.2 },
      { kind: "center", weight: 0.18 },
    ],
    maxAlive: 13,
  },
  {
    number: 5,
    title: "FINAL POSSESSION",
    durationSeconds: 999,
    spawnIntervalSeconds: 2.1,
    roster: [
      { kind: "rookie", weight: 0.42 },
      { kind: "shooter", weight: 0.34 },
      { kind: "sniper", weight: 0.24 },
    ],
    maxAlive: 9,
    boss: "boss",
  },
] as const;

export const UPGRADES: readonly UpgradeDefinition[] = [
  {
    id: "heavy-hands",
    name: "HEAVY HANDS",
    category: "POWER",
    description: "+18% swat and skill damage per rank.",
    icon: "✦",
    rarity: "common",
    maxRank: 5,
  },
  {
    id: "quick-release",
    name: "QUICK RELEASE",
    category: "MOMENTUM",
    description: "Swat 12% faster and recover skills 6% sooner.",
    icon: "ϟ",
    rarity: "common",
    maxRank: 5,
  },
  {
    id: "iron-lungs",
    name: "IRON LUNGS",
    category: "DEFENSE",
    description: "+60 maximum health and heal the same amount.",
    icon: "♥",
    rarity: "common",
    maxRank: 5,
  },
  {
    id: "rim-armor",
    name: "RIM ARMOR",
    category: "DEFENSE",
    description: "Repair 22 integrity and raise the rim maximum by 10.",
    icon: "⬡",
    rarity: "common",
    maxRank: 5,
  },
  {
    id: "fast-break",
    name: "FAST BREAK",
    category: "POWER",
    description: "+10% movement speed; Power Drive travels farther.",
    icon: "➜",
    rarity: "common",
    maxRank: 5,
  },
  {
    id: "second-jump",
    name: "SECOND JUMP",
    category: "MOMENTUM",
    description: "Every block heals 6 health and grants extra Hype.",
    icon: "↟",
    rarity: "common",
    maxRank: 5,
  },
  {
    id: "sharpshooter",
    name: "SHARPSHOOTER",
    category: "POWER",
    description: "+6% critical hit chance.",
    icon: "◈",
    rarity: "common",
    maxRank: 5,
  },
  {
    id: "showtime",
    name: "SHOWTIME",
    category: "MOMENTUM",
    description: "+20% score from every source.",
    icon: "★",
    rarity: "common",
    maxRank: 5,
  },
  {
    id: "wide-swat",
    name: "WIDE SWAT",
    category: "DEFENSE",
    description: "+16% attack reach and a wider block angle.",
    icon: "◖",
    rarity: "rare",
    maxRank: 3,
  },
  {
    id: "crowd-favorite",
    name: "CROWD FAVORITE",
    category: "MOMENTUM",
    description: "Combos last longer and score 25% more.",
    icon: "♛",
    rarity: "rare",
    maxRank: 3,
  },
  {
    id: "paint-beast",
    name: "PAINT BEAST",
    category: "POWER",
    description: "Court Quake grows 25% and stuns longer.",
    icon: "◎",
    rarity: "rare",
    maxRank: 3,
  },
  {
    id: "bulwark",
    name: "BULWARK",
    category: "DEFENSE",
    description: "Take 6% less damage.",
    icon: "▣",
    rarity: "rare",
    maxRank: 3,
  },
  {
    id: "hype-machine",
    name: "HYPE MACHINE",
    category: "MOMENTUM",
    description: "+30% Hype gain.",
    icon: "⚡",
    rarity: "rare",
    maxRank: 3,
  },
  {
    id: "coiled-spring",
    name: "COILED SPRING",
    category: "MOMENTUM",
    description: "Skills recover 15% sooner.",
    icon: "⟲",
    rarity: "rare",
    maxRank: 3,
  },
  {
    id: "reinforced-rim",
    name: "REINFORCED RIM",
    category: "DEFENSE",
    description: "+20 rim maximum and repair 20 integrity.",
    icon: "⬢",
    rarity: "rare",
    maxRank: 3,
  },
  {
    id: "killer-instinct",
    name: "KILLER INSTINCT",
    category: "POWER",
    description: "Critical hits deal +40% more damage.",
    icon: "✷",
    rarity: "epic",
    maxRank: 2,
  },
  {
    id: "adrenaline",
    name: "ADRENALINE",
    category: "MOMENTUM",
    description: "Swat 28% faster.",
    icon: "⇈",
    rarity: "epic",
    maxRank: 2,
  },
  {
    id: "last-stand",
    name: "LAST STAND",
    category: "DEFENSE",
    description: "Take 10% less damage.",
    icon: "✚",
    rarity: "epic",
    maxRank: 2,
  },
  {
    id: "iron-will",
    name: "IRON WILL",
    category: "DEFENSE",
    description: "+140 maximum health and heal the same amount.",
    icon: "✜",
    rarity: "epic",
    maxRank: 2,
  },
  {
    id: "brute-force",
    name: "BRUTE FORCE",
    category: "POWER",
    description: "+45% swat and skill damage.",
    icon: "✖",
    rarity: "epic",
    maxRank: 2,
  },
  {
    id: "combo-king",
    name: "COMBO KING",
    category: "MOMENTUM",
    description: "Combos last much longer and score 40% more.",
    icon: "❖",
    rarity: "epic",
    maxRank: 2,
  },
] as const;

export interface UpgradeContext {
  player: PlayerEntity;
  addHoopMaxHp(amount: number): void;
  repairHoop(amount: number): void;
  extendCombo(seconds: number): void;
}

const MAX_DAMAGE_REDUCTION = 0.6;
const MAX_CRIT_CHANCE = 0.85;

export const UPGRADE_EFFECTS: Readonly<Record<UpgradeId, (context: UpgradeContext) => void>> = {
  "heavy-hands": ({ player }) => {
    player.damage *= 1.18;
  },
  "quick-release": ({ player }) => {
    player.attackCooldownTotal *= 0.88;
    player.skillCooldownMultiplier *= 0.94;
  },
  "iron-lungs": ({ player }) => {
    player.maxHp += 60;
    player.heal(60);
  },
  "rim-armor": ({ addHoopMaxHp, repairHoop }) => {
    addHoopMaxHp(10);
    repairHoop(22);
  },
  "fast-break": ({ player }) => {
    player.moveSpeed *= 1.1;
    player.driveMultiplier *= 1.15;
  },
  "second-jump": ({ player }) => {
    player.blockHeal += 6;
    player.hypeGainMultiplier *= 1.12;
  },
  sharpshooter: ({ player }) => {
    player.critChance = Math.min(MAX_CRIT_CHANCE, player.critChance + 0.06);
  },
  showtime: ({ player }) => {
    player.scoreMultiplier *= 1.2;
  },
  "wide-swat": ({ player }) => {
    player.attackRange *= 1.16;
    player.attackArc = Math.min(Math.PI * 1.2, player.attackArc * 1.14);
  },
  "crowd-favorite": ({ player, extendCombo }) => {
    extendCombo(1.2);
    player.scoreMultiplier *= 1.25;
  },
  "paint-beast": ({ player }) => {
    player.quakeMultiplier *= 1.25;
  },
  bulwark: ({ player }) => {
    player.damageReduction = Math.min(MAX_DAMAGE_REDUCTION, player.damageReduction + 0.06);
  },
  "hype-machine": ({ player }) => {
    player.hypeGainMultiplier *= 1.3;
  },
  "coiled-spring": ({ player }) => {
    player.skillCooldownMultiplier *= 0.85;
  },
  "reinforced-rim": ({ addHoopMaxHp, repairHoop }) => {
    addHoopMaxHp(20);
    repairHoop(20);
  },
  "killer-instinct": ({ player }) => {
    player.critMultiplier += 0.4;
  },
  adrenaline: ({ player }) => {
    player.attackCooldownTotal *= 0.72;
  },
  "last-stand": ({ player }) => {
    player.damageReduction = Math.min(MAX_DAMAGE_REDUCTION, player.damageReduction + 0.1);
  },
  "iron-will": ({ player }) => {
    player.maxHp += 140;
    player.heal(140);
  },
  "brute-force": ({ player }) => {
    player.damage *= 1.45;
  },
  "combo-king": ({ player, extendCombo }) => {
    extendCombo(2);
    player.scoreMultiplier *= 1.4;
  },
};

export const EVOLUTIONS: readonly EvolutionDefinition[] = [
  {
    id: "signature-slam",
    name: "SIGNATURE SLAM",
    description: "Court Quake erupts far wider and your strikes hit much harder.",
    icon: "✷",
    requires: ["heavy-hands", "paint-beast"],
  },
  {
    id: "perimeter-lockdown",
    name: "PERIMETER LOCKDOWN",
    description: "Sweeping reach and a huge critical chance shut down the perimeter.",
    icon: "◈",
    requires: ["wide-swat", "sharpshooter"],
  },
  {
    id: "fortress",
    name: "FORTRESS",
    description: "Become a wall: massive health and heavy damage reduction.",
    icon: "▣",
    requires: ["iron-lungs", "bulwark"],
  },
  {
    id: "mamba-tempo",
    name: "MAMBA TEMPO",
    description: "Blistering swat speed and rapid skill recovery.",
    icon: "⇈",
    requires: ["quick-release", "coiled-spring"],
  },
  {
    id: "crowd-roar",
    name: "CROWD ROAR",
    description: "Double score, roaring Hype, and combos that never cool off.",
    icon: "★",
    requires: ["crowd-favorite", "showtime"],
  },
] as const;

export const EVOLUTION_EFFECTS: Readonly<Record<EvolutionId, (context: UpgradeContext) => void>> = {
  "signature-slam": ({ player }) => {
    player.quakeMultiplier *= 1.6;
    player.damage *= 1.25;
  },
  "perimeter-lockdown": ({ player }) => {
    player.attackRange *= 1.3;
    player.attackArc = Math.min(Math.PI * 1.3, player.attackArc * 1.2);
    player.critChance = Math.min(0.9, player.critChance + 0.15);
  },
  fortress: ({ player }) => {
    player.maxHp += 220;
    player.heal(220);
    player.damageReduction = Math.min(0.65, player.damageReduction + 0.12);
  },
  "mamba-tempo": ({ player }) => {
    player.attackCooldownTotal *= 0.6;
    player.skillCooldownMultiplier *= 0.7;
  },
  "crowd-roar": ({ player, extendCombo }) => {
    player.scoreMultiplier *= 2;
    player.hypeGainMultiplier *= 1.5;
    extendCombo(3);
  },
};

export function isEvolutionId(id: string): id is EvolutionId {
  return Object.prototype.hasOwnProperty.call(EVOLUTION_EFFECTS, id);
}

export const PERMANENT_UPGRADES: readonly PermanentUpgradeDefinition[] = [
  {
    id: "training-camp",
    name: "TRAINING CAMP",
    description: "Start every run with +8% damage per level.",
    icon: "✦",
    maxLevel: 5,
    baseCost: 60,
  },
  {
    id: "conditioning",
    name: "CONDITIONING",
    description: "Start with +40 maximum health per level.",
    icon: "♥",
    maxLevel: 5,
    baseCost: 60,
  },
  {
    id: "reinforced-backboard",
    name: "REINFORCED BACKBOARD",
    description: "Start with +15 rim integrity per level.",
    icon: "⬡",
    maxLevel: 5,
    baseCost: 70,
  },
  {
    id: "quick-hands",
    name: "QUICK HANDS",
    description: "Start swatting 4% faster per level.",
    icon: "ϟ",
    maxLevel: 5,
    baseCost: 80,
  },
  {
    id: "signing-bonus",
    name: "SIGNING BONUS",
    description: "Earn +15% Street Cred per level.",
    icon: "★",
    maxLevel: 4,
    baseCost: 100,
  },
] as const;

export function getPermanentUpgrade(id: PermanentUpgradeId): PermanentUpgradeDefinition {
  const upgrade = PERMANENT_UPGRADES.find((candidate) => candidate.id === id);
  if (!upgrade) throw new Error(`Unknown permanent upgrade: ${id}`);
  return upgrade;
}

export const SKILL_IDS: readonly SkillId[] = [
  "chasedown-block",
  "power-drive",
  "court-quake",
  "kings-court",
  "fadeaway",
  "viper-strike",
  "lockdown",
  "mamba-mentality",
  "splash-bomb",
  "crossover-storm",
  "pick-roll",
  "night-night",
] as const;

export const CHARACTERS: Readonly<Record<CharacterId, CharacterDefinition>> = {
  king: {
    id: "king",
    name: "THE KING",
    title: "PAINT GUARDIAN",
    description: "Power through traffic and erase shots at the rim.",
    jerseyNumber: "23",
    textureKey: "hero-king",
    color: COLORS.orange,
    unlockCost: 0,
    stats: {
      maxHp: PLAYER_BASE.maxHp,
      moveSpeed: PLAYER_BASE.speed,
      damage: PLAYER_BASE.damage,
      attackRange: PLAYER_BASE.attackRange,
      attackArc: PLAYER_BASE.attackArc,
      attackCooldown: PLAYER_BASE.attackCooldown,
    },
    skills: {
      skill1: "chasedown-block",
      skill2: "power-drive",
      skill3: "court-quake",
      ultimate: "kings-court",
    },
  },
  mamba: {
    id: "mamba",
    name: "THE MAMBA",
    title: "PERIMETER ASSASSIN",
    description: "Blink through traffic and delete shooters with lethal bursts.",
    jerseyNumber: "24",
    textureKey: "hero-mamba",
    color: COLORS.purple,
    unlockCost: 400,
    stats: {
      maxHp: 260,
      moveSpeed: 322,
      damage: 42,
      attackRange: 150,
      attackArc: Math.PI * 0.62,
      attackCooldown: 0.4,
    },
    skills: {
      skill1: "fadeaway",
      skill2: "viper-strike",
      skill3: "lockdown",
      ultimate: "mamba-mentality",
    },
  },
  chef: {
    id: "chef",
    name: "THE CHEF",
    title: "SPACE CONTROLLER",
    description: "Own the floor with wide range, splash bombs, and screens.",
    jerseyNumber: "30",
    textureKey: "hero-chef",
    color: COLORS.cyan,
    unlockCost: 400,
    stats: {
      maxHp: 280,
      moveSpeed: 300,
      damage: 30,
      attackRange: 180,
      attackArc: Math.PI * 0.85,
      attackCooldown: 0.44,
    },
    skills: {
      skill1: "splash-bomb",
      skill2: "crossover-storm",
      skill3: "pick-roll",
      ultimate: "night-night",
    },
  },
};

export const DEFAULT_CHARACTER_ID: CharacterId = "king";

export const SKILL_META: Readonly<Record<SkillId, { name: string; icon: string }>> = {
  "chasedown-block": { name: "CHASEDOWN", icon: "◖" },
  "power-drive": { name: "POWER DRIVE", icon: "➜" },
  "court-quake": { name: "COURT QUAKE", icon: "◎" },
  "kings-court": { name: "KING'S COURT", icon: "♛" },
  fadeaway: { name: "FADEAWAY", icon: "↺" },
  "viper-strike": { name: "VIPER STRIKE", icon: "➤" },
  lockdown: { name: "LOCKDOWN", icon: "⊗" },
  "mamba-mentality": { name: "MAMBA MODE", icon: "✷" },
  "splash-bomb": { name: "SPLASH BOMB", icon: "✸" },
  "crossover-storm": { name: "CROSSOVER", icon: "✺" },
  "pick-roll": { name: "SET SCREEN", icon: "▤" },
  "night-night": { name: "NIGHT NIGHT", icon: "☾" },
};

export function getEnemyDefinition(kind: EnemyKind): EnemyDefinition {
  return ENEMIES[kind];
}

export function getUpgrade(id: UpgradeId): UpgradeDefinition {
  const upgrade = UPGRADES.find((candidate) => candidate.id === id);
  if (!upgrade) throw new Error(`Unknown upgrade: ${id}`);
  return upgrade;
}

export function getCharacter(id: CharacterId): CharacterDefinition {
  return CHARACTERS[id];
}

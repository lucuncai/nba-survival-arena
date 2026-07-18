export type ActionName = "attack" | "skill1" | "skill2" | "skill3" | "ultimate";

export type ScreenName =
  | "loading"
  | "menu"
  | "tutorial"
  | "upgrade"
  | "pause"
  | "results"
  | "locker"
  | "select";

export type GameMode = "campaign" | "endless";

export type EnemyKind = "rookie" | "shooter" | "sniper" | "center" | "boss";

export type UpgradeId =
  | "heavy-hands"
  | "quick-release"
  | "iron-lungs"
  | "rim-armor"
  | "wide-swat"
  | "second-jump"
  | "crowd-favorite"
  | "paint-beast"
  | "fast-break"
  | "sharpshooter"
  | "showtime"
  | "killer-instinct"
  | "bulwark"
  | "hype-machine"
  | "coiled-spring"
  | "reinforced-rim"
  | "adrenaline"
  | "last-stand"
  | "iron-will"
  | "brute-force"
  | "combo-king";

export type UpgradeCategory = "POWER" | "DEFENSE" | "MOMENTUM";

export type UpgradeRarity = "common" | "rare" | "epic";

export type CharacterId = "king" | "mamba" | "chef";

export type SkillId =
  | "chasedown-block"
  | "power-drive"
  | "court-quake"
  | "kings-court"
  | "fadeaway"
  | "viper-strike"
  | "lockdown"
  | "mamba-mentality"
  | "splash-bomb"
  | "crossover-storm"
  | "pick-roll"
  | "night-night";

export interface CooldownSnapshot {
  remaining: number;
  total: number;
}

export interface HudSnapshot {
  playerHp: number;
  playerMaxHp: number;
  hoopHp: number;
  hoopMaxHp: number;
  wave: number;
  waveCount: number;
  endless: boolean;
  elapsedSeconds: number;
  score: number;
  level: number;
  hype: number;
  objective: string;
  cooldowns: Record<Exclude<ActionName, "attack">, CooldownSnapshot>;
}

export interface RunResult {
  victory: boolean;
  mode: GameMode;
  elapsedSeconds: number;
  score: number;
  kills: number;
  blocks: number;
  maxCombo: number;
  wave: number;
  credEarned: number;
}

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  category: UpgradeCategory;
  description: string;
  icon: string;
  rarity: UpgradeRarity;
  maxRank: number;
}

export type EvolutionId =
  | "signature-slam"
  | "perimeter-lockdown"
  | "fortress"
  | "mamba-tempo"
  | "crowd-roar";

export interface EvolutionDefinition {
  id: EvolutionId;
  name: string;
  description: string;
  icon: string;
  requires: UpgradeId[];
}

export type ChoiceId = UpgradeId | EvolutionId;

export interface ChoiceOffer {
  kind: "upgrade" | "evolution";
  id: ChoiceId;
  name: string;
  label: string;
  description: string;
  icon: string;
  rarity: UpgradeRarity | "evolution";
  rank: number;
  maxRank: number;
}

export interface EnemyDefinition {
  kind: EnemyKind;
  name: string;
  maxHp: number;
  speed: number;
  touchDamage: number;
  radius: number;
  preferredRange: number;
  windupSeconds: number;
  shotSpeed: number;
  shotDamage: number;
  accuracy: number;
  score: number;
  color: number;
  mass: number;
}

export interface WaveDefinition {
  number: number;
  title: string;
  durationSeconds: number;
  spawnIntervalSeconds: number;
  roster: Array<{ kind: EnemyKind; weight: number }>;
  maxAlive: number;
  boss?: EnemyKind;
}

export type EliteModifierId = "swift" | "shielded" | "splitter" | "hunter";

export interface EliteModifierDefinition {
  id: EliteModifierId;
  name: string;
  color: number;
  hpMult: number;
  speedMult: number;
  shotDamageMult: number;
  accuracyBonus: number;
  scoreMult: number;
}

export interface CharacterStats {
  maxHp: number;
  moveSpeed: number;
  damage: number;
  attackRange: number;
  attackArc: number;
  attackCooldown: number;
}

export interface CharacterSkillLoadout {
  skill1: SkillId;
  skill2: SkillId;
  skill3: SkillId;
  ultimate: SkillId;
}

export interface CharacterDefinition {
  id: CharacterId;
  name: string;
  title: string;
  description: string;
  jerseyNumber: string;
  textureKey: string;
  color: number;
  unlockCost: number;
  stats: CharacterStats;
  skills: CharacterSkillLoadout;
}

export interface MetaProfile {
  streetCred: number;
  selectedCharacter: CharacterId;
  unlockedCharacters: CharacterId[];
  unlockedArenas: string[];
  permanentUpgrades: Record<string, number>;
}

export type PermanentUpgradeId =
  | "training-camp"
  | "conditioning"
  | "reinforced-backboard"
  | "quick-hands"
  | "signing-bonus";

export interface PermanentUpgradeDefinition {
  id: PermanentUpgradeId;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  baseCost: number;
}

export interface PermanentBonuses {
  damageMultiplier: number;
  bonusMaxHp: number;
  bonusRimHp: number;
  attackCooldownMultiplier: number;
  credMultiplier: number;
}

export interface LockerSnapshot {
  streetCred: number;
  entries: Array<{
    id: PermanentUpgradeId;
    name: string;
    description: string;
    icon: string;
    level: number;
    maxLevel: number;
    cost: number | null;
    affordable: boolean;
  }>;
}

export interface SaveData {
  version: 3;
  gamesPlayed: number;
  bestScore: number;
  bestTime: number;
  bestWave: number;
  bestBlocks: number;
  tutorialSeen: boolean;
  muted: boolean;
  profile: MetaProfile;
}

export interface GameEvents {
  "ui:start": { mode: GameMode };
  "ui:tutorial": undefined;
  "ui:tutorial-close": undefined;
  "ui:action": ActionName;
  "ui:upgrade-selected": ChoiceId;
  "ui:resume": undefined;
  "ui:quit": undefined;
  "ui:play-again": undefined;
  "ui:menu": undefined;
  "ui:open-locker": undefined;
  "ui:close-locker": undefined;
  "ui:buy-permanent": PermanentUpgradeId;
  "game:locker": LockerSnapshot;
  "input:joystick": { x: number; y: number };
  "game:screen": { name: ScreenName; visible: boolean };
  "game:hud-visible": boolean;
  "game:hud": HudSnapshot;
  "game:loadout": {
    character: string;
    abilities: Array<{ action: "skill1" | "skill2" | "skill3" | "ultimate"; name: string; icon: string }>;
  };
  "game:threat": { visible: boolean; copy?: string };
  "game:upgrade-choice": ChoiceOffer[];
  "game:results": RunResult;
  "game:loading": { progress: number; copy: string };
}

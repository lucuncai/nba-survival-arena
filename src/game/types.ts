export type ActionName = "attack" | "skill1" | "skill2" | "skill3" | "ultimate";

export type ScreenName = "loading" | "menu" | "tutorial" | "upgrade" | "pause" | "results";

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
  | "fast-break";

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
  elapsedSeconds: number;
  score: number;
  level: number;
  hype: number;
  objective: string;
  cooldowns: Record<Exclude<ActionName, "attack">, CooldownSnapshot>;
}

export interface RunResult {
  victory: boolean;
  elapsedSeconds: number;
  score: number;
  kills: number;
  blocks: number;
  maxCombo: number;
  wave: number;
}

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  category: "POWER" | "DEFENSE" | "MOMENTUM";
  description: string;
  icon: string;
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

export interface SaveData {
  version: 2;
  gamesPlayed: number;
  bestScore: number;
  bestTime: number;
  bestWave: number;
  bestBlocks: number;
  tutorialSeen: boolean;
  muted: boolean;
}

export interface GameEvents {
  "ui:start": undefined;
  "ui:tutorial": undefined;
  "ui:tutorial-close": undefined;
  "ui:action": ActionName;
  "ui:upgrade-selected": UpgradeId;
  "ui:resume": undefined;
  "ui:quit": undefined;
  "ui:play-again": undefined;
  "ui:menu": undefined;
  "input:joystick": { x: number; y: number };
  "game:screen": { name: ScreenName; visible: boolean };
  "game:hud-visible": boolean;
  "game:hud": HudSnapshot;
  "game:threat": { visible: boolean; copy?: string };
  "game:upgrade-choice": UpgradeDefinition[];
  "game:results": RunResult;
  "game:loading": { progress: number; copy: string };
}

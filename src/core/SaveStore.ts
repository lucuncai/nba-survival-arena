import { CHARACTERS, DEFAULT_CHARACTER_ID } from "../game/data";
import type { CharacterId, MetaProfile, RunResult, SaveData } from "../game/types";

const STORAGE_KEY = "street-legends-save";
const LEGACY_KEYS = ["street-legends-save-v2"];

const DEFAULT_PROFILE: MetaProfile = {
  streetCred: 0,
  selectedCharacter: DEFAULT_CHARACTER_ID,
  unlockedCharacters: [DEFAULT_CHARACTER_ID],
  unlockedArenas: ["blacktop"],
  permanentUpgrades: {},
};

const DEFAULT_SAVE: SaveData = {
  version: 3,
  gamesPlayed: 0,
  bestScore: 0,
  bestTime: 0,
  bestWave: 0,
  bestBlocks: 0,
  tutorialSeen: false,
  muted: false,
  profile: DEFAULT_PROFILE,
};

type RawSave = Partial<Omit<SaveData, "version" | "profile">> & {
  version?: number;
  profile?: Partial<MetaProfile>;
};

function defaultSave(): SaveData {
  return {
    ...DEFAULT_SAVE,
    profile: {
      ...DEFAULT_PROFILE,
      unlockedCharacters: [...DEFAULT_PROFILE.unlockedCharacters],
      unlockedArenas: [...DEFAULT_PROFILE.unlockedArenas],
      permanentUpgrades: {},
    },
  };
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isKnownCharacter(value: unknown): value is CharacterId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(CHARACTERS, value);
}

function sanitizeArenas(value: unknown): string[] {
  const arenas = new Set<string>(DEFAULT_PROFILE.unlockedArenas);
  if (Array.isArray(value)) {
    value.forEach((entry) => {
      if (typeof entry === "string") arenas.add(entry);
    });
  }
  return [...arenas];
}

function sanitizePermanentUpgrades(value: unknown): Record<string, number> {
  const result: Record<string, number> = {};
  if (value && typeof value === "object") {
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      if (typeof raw === "number" && Number.isFinite(raw)) result[key] = raw;
    }
  }
  return result;
}

function migrateProfile(source: Partial<MetaProfile> | undefined): MetaProfile {
  const unlocked = new Set<CharacterId>([DEFAULT_CHARACTER_ID]);
  if (Array.isArray(source?.unlockedCharacters)) {
    source.unlockedCharacters.forEach((id) => {
      if (isKnownCharacter(id)) unlocked.add(id);
    });
  }
  const selectedCharacter =
    isKnownCharacter(source?.selectedCharacter) && unlocked.has(source.selectedCharacter)
      ? source.selectedCharacter
      : DEFAULT_CHARACTER_ID;

  return {
    streetCred: Math.max(0, numberOr(source?.streetCred, 0)),
    selectedCharacter,
    unlockedCharacters: [...unlocked],
    unlockedArenas: sanitizeArenas(source?.unlockedArenas),
    permanentUpgrades: sanitizePermanentUpgrades(source?.permanentUpgrades),
  };
}

export function migrateSave(raw: RawSave | null | undefined): SaveData {
  if (!raw || typeof raw !== "object") return defaultSave();
  return {
    version: 3,
    gamesPlayed: Math.max(0, numberOr(raw.gamesPlayed, 0)),
    bestScore: Math.max(0, numberOr(raw.bestScore, 0)),
    bestTime: Math.max(0, numberOr(raw.bestTime, 0)),
    bestWave: Math.max(0, numberOr(raw.bestWave, 0)),
    bestBlocks: Math.max(0, numberOr(raw.bestBlocks, 0)),
    tutorialSeen: Boolean(raw.tutorialSeen),
    muted: Boolean(raw.muted),
    profile: migrateProfile(raw.profile),
  };
}

export class SaveStore {
  load(): SaveData {
    const primary = this.read(STORAGE_KEY);
    if (primary) return migrateSave(primary);

    for (const legacyKey of LEGACY_KEYS) {
      const legacy = this.read(legacyKey);
      if (legacy) {
        const migrated = migrateSave(legacy);
        this.persist(migrated);
        return migrated;
      }
    }

    return defaultSave();
  }

  update(patch: Partial<Omit<SaveData, "version">>): SaveData {
    const next: SaveData = { ...this.load(), ...patch, version: 3 };
    this.persist(next);
    return next;
  }

  updateProfile(patch: Partial<MetaProfile>): SaveData {
    const current = this.load();
    const next: SaveData = {
      ...current,
      profile: { ...current.profile, ...patch },
      version: 3,
    };
    this.persist(next);
    return next;
  }

  recordRun(result: RunResult): SaveData {
    const current = this.load();
    const next: SaveData = {
      ...current,
      gamesPlayed: current.gamesPlayed + 1,
      bestScore: Math.max(current.bestScore, result.score),
      bestTime: Math.max(current.bestTime, Math.floor(result.elapsedSeconds)),
      bestWave: Math.max(current.bestWave, result.wave),
      bestBlocks: Math.max(current.bestBlocks, result.blocks),
    };
    this.persist(next);
    return next;
  }

  private read(key: string): RawSave | null {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as RawSave;
    } catch {
      return null;
    }
  }

  private persist(data: SaveData): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage may be blocked in private browsing; a run should still remain playable.
    }
  }
}

export const saveStore = new SaveStore();

import type { RunResult, SaveData } from "../game/types";

const STORAGE_KEY = "street-legends-save-v2";

const DEFAULT_SAVE: SaveData = {
  version: 2,
  gamesPlayed: 0,
  bestScore: 0,
  bestTime: 0,
  bestWave: 0,
  bestBlocks: 0,
  tutorialSeen: false,
  muted: false,
};

export class SaveStore {
  load(): SaveData {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SAVE };
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      if (parsed.version !== 2) return { ...DEFAULT_SAVE };
      return { ...DEFAULT_SAVE, ...parsed, version: 2 };
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }

  update(patch: Partial<Omit<SaveData, "version">>): SaveData {
    const next: SaveData = { ...this.load(), ...patch, version: 2 };
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

  private persist(data: SaveData): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage may be blocked in private browsing; a run should still remain playable.
    }
  }
}

export const saveStore = new SaveStore();

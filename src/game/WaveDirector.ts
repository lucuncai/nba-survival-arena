import type { SeededRandom } from "../core/SeededRandom";
import { WAVES } from "./data";
import type { EnemyKind, GameMode, WaveDefinition } from "./types";

export interface WaveStart {
  wave: WaveDefinition;
  bossToSpawn?: EnemyKind;
}

export interface WaveTick {
  spawns: EnemyKind[];
  completed: boolean;
  remainingSeconds: number;
}

/** Endless spawns a boss every this many generated waves. */
const ENDLESS_BOSS_CADENCE = 5;

export class WaveDirector {
  private waveNumber = 0;
  private currentWave: WaveDefinition | undefined;
  private remainingSeconds = 0;
  private spawnTimer = 0;
  private bossSpawned = false;
  private readonly rampWaves: readonly WaveDefinition[];

  constructor(
    private readonly random: SeededRandom,
    private readonly mode: GameMode = "campaign",
    private readonly waves: readonly WaveDefinition[] = WAVES,
  ) {
    // Endless reuses the authored non-boss waves as a curated ramp, then generates.
    this.rampWaves = mode === "endless" ? waves.filter((wave) => !wave.boss) : waves;
  }

  get current(): WaveDefinition | undefined {
    return this.currentWave;
  }

  get isEndless(): boolean {
    return this.mode === "endless";
  }

  get isFinalWave(): boolean {
    return this.mode === "campaign" && this.waveNumber >= this.waves.length;
  }

  get waveCount(): number {
    return this.mode === "endless" ? 0 : this.waves.length;
  }

  startNextWave(): WaveStart | undefined {
    const nextNumber = this.waveNumber + 1;
    const wave = this.resolveWave(nextNumber);
    if (!wave) return undefined;

    this.waveNumber = nextNumber;
    this.currentWave = wave;
    this.remainingSeconds = wave.durationSeconds;
    this.spawnTimer = 0.65;
    this.bossSpawned = Boolean(wave.boss);
    return { wave, bossToSpawn: wave.boss };
  }

  update(deltaSeconds: number, aliveCount: number, bossAlive: boolean): WaveTick {
    const wave = this.currentWave;
    if (!wave) return { spawns: [], completed: false, remainingSeconds: 0 };

    if (wave.boss && this.bossSpawned && !bossAlive) {
      return { spawns: [], completed: true, remainingSeconds: this.remainingSeconds };
    }

    this.remainingSeconds = Math.max(0, this.remainingSeconds - deltaSeconds);
    this.spawnTimer -= deltaSeconds;
    const spawns: EnemyKind[] = [];

    const spawningOpen = Boolean(wave.boss) || this.remainingSeconds > 0;
    if (spawningOpen && this.spawnTimer <= 0 && aliveCount < wave.maxAlive) {
      spawns.push(this.pickRoster(wave));
      const pressure = 1 - Math.min(0.22, (this.waveNumber - 1) * 0.045);
      this.spawnTimer = wave.spawnIntervalSeconds * pressure;
    }

    const completed = !wave.boss && this.remainingSeconds <= 0 && aliveCount === 0;
    return { spawns, completed, remainingSeconds: this.remainingSeconds };
  }

  private resolveWave(number: number): WaveDefinition | undefined {
    if (this.mode === "campaign") {
      return this.waves[number - 1];
    }
    if (number <= this.rampWaves.length) {
      return this.rampWaves[number - 1];
    }
    return this.generateWave(number);
  }

  private generateWave(number: number): WaveDefinition {
    const step = number - this.rampWaves.length;
    const isBossWave = step % ENDLESS_BOSS_CADENCE === 0;
    const spawnIntervalSeconds = Math.max(0.5, 1.4 - step * 0.04);
    const maxAlive = Math.min(26, 10 + Math.floor(step * 0.8));
    const centerWeight = 0.14 + Math.min(0.24, step * 0.01);
    const sniperWeight = 0.2 + Math.min(0.16, step * 0.008);

    return {
      number,
      title: isBossWave ? "SHOWDOWN" : "ENDLESS PRESSURE",
      durationSeconds: isBossWave ? 999 : 30,
      spawnIntervalSeconds,
      roster: [
        { kind: "rookie", weight: 0.34 },
        { kind: "shooter", weight: 0.3 },
        { kind: "sniper", weight: sniperWeight },
        { kind: "center", weight: centerWeight },
      ],
      maxAlive,
      boss: isBossWave ? "boss" : undefined,
    };
  }

  private pickRoster(wave: WaveDefinition): EnemyKind {
    const totalWeight = wave.roster.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = this.random.next() * totalWeight;

    for (const entry of wave.roster) {
      roll -= entry.weight;
      if (roll <= 0) return entry.kind;
    }

    return wave.roster.at(-1)?.kind ?? "rookie";
  }
}

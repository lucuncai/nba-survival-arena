import type { SeededRandom } from "../core/SeededRandom";
import { WAVES } from "./data";
import type { EnemyKind, WaveDefinition } from "./types";

export interface WaveStart {
  wave: WaveDefinition;
  bossToSpawn?: EnemyKind;
}

export interface WaveTick {
  spawns: EnemyKind[];
  completed: boolean;
  remainingSeconds: number;
}

export class WaveDirector {
  private waveIndex = -1;
  private remainingSeconds = 0;
  private spawnTimer = 0;
  private bossSpawned = false;

  constructor(
    private readonly random: SeededRandom,
    private readonly waves: readonly WaveDefinition[] = WAVES,
  ) {}

  get current(): WaveDefinition | undefined {
    return this.waves[this.waveIndex];
  }

  get isFinalWave(): boolean {
    return this.waveIndex === this.waves.length - 1;
  }

  get waveCount(): number {
    return this.waves.length;
  }

  startNextWave(): WaveStart | undefined {
    if (this.waveIndex + 1 >= this.waves.length) return undefined;
    this.waveIndex += 1;
    const wave = this.waves[this.waveIndex]!;
    this.remainingSeconds = wave.durationSeconds;
    this.spawnTimer = 0.65;
    this.bossSpawned = Boolean(wave.boss);
    return { wave, bossToSpawn: wave.boss };
  }

  update(deltaSeconds: number, aliveCount: number, bossAlive: boolean): WaveTick {
    const wave = this.current;
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
      const pressure = 1 - Math.min(0.22, this.waveIndex * 0.045);
      this.spawnTimer = wave.spawnIntervalSeconds * pressure;
    }

    const completed = !wave.boss && this.remainingSeconds <= 0 && aliveCount === 0;
    return { spawns, completed, remainingSeconds: this.remainingSeconds };
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

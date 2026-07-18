import { describe, expect, it } from "vitest";
import { SeededRandom } from "../../src/core/SeededRandom";
import { WAVES } from "../../src/game/data";
import { WaveDirector } from "../../src/game/WaveDirector";

describe("WaveDirector", () => {
  it("starts at wave one and stops spawning when its clock expires", () => {
    const director = new WaveDirector(new SeededRandom(42));
    const started = director.startNextWave();

    expect(started?.wave.number).toBe(1);
    expect(director.update(0.7, 0, false).spawns).toEqual(["rookie"]);

    const finished = director.update(100, 0, false);
    expect(finished.spawns).toEqual([]);
    expect(finished.completed).toBe(true);
  });

  it("honors the active-enemy cap", () => {
    const director = new WaveDirector(new SeededRandom(9));
    const started = director.startNextWave();
    expect(started).toBeDefined();

    const tick = director.update(10, started!.wave.maxAlive, false);
    expect(tick.spawns).toHaveLength(0);
  });

  it("finishes the final wave when its boss is defeated", () => {
    const director = new WaveDirector(new SeededRandom(17));
    WAVES.forEach(() => director.startNextWave());

    expect(director.current?.boss).toBe("boss");
    expect(director.update(0.1, 1, true).completed).toBe(false);
    expect(director.update(0.1, 3, false).completed).toBe(true);
  });
});

describe("WaveDirector endless", () => {
  it("never runs out of waves and escalates the wave number", () => {
    const director = new WaveDirector(new SeededRandom(5), "endless");
    for (let number = 1; number <= 40; number += 1) {
      const started = director.startNextWave();
      expect(started).toBeDefined();
      expect(started!.wave.number).toBe(number);
    }
    expect(director.isEndless).toBe(true);
    expect(director.isFinalWave).toBe(false);
    expect(director.waveCount).toBe(0);
  });

  it("spawns a boss on the endless cadence", () => {
    const director = new WaveDirector(new SeededRandom(5), "endless");
    const bossNumbers: number[] = [];
    for (let index = 0; index < 20; index += 1) {
      const started = director.startNextWave();
      if (started?.bossToSpawn) bossNumbers.push(started.wave.number);
    }
    expect(bossNumbers).toContain(9);
    expect(bossNumbers).toContain(14);
  });

  it("stops after the final wave in campaign mode", () => {
    const director = new WaveDirector(new SeededRandom(1), "campaign");
    for (let index = 0; index < WAVES.length; index += 1) {
      expect(director.startNextWave()).toBeDefined();
    }
    expect(director.startNextWave()).toBeUndefined();
  });
});

describe("SeededRandom", () => {
  it("produces reproducible runs", () => {
    const first = new SeededRandom(2026);
    const second = new SeededRandom(2026);
    expect(Array.from({ length: 8 }, () => first.next())).toEqual(
      Array.from({ length: 8 }, () => second.next()),
    );
  });
});

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

describe("SeededRandom", () => {
  it("produces reproducible runs", () => {
    const first = new SeededRandom(2026);
    const second = new SeededRandom(2026);
    expect(Array.from({ length: 8 }, () => first.next())).toEqual(
      Array.from({ length: 8 }, () => second.next()),
    );
  });
});

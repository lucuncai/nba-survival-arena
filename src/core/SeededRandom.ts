export class SeededRandom {
  private state: number;

  constructor(seed = Date.now()) {
    this.state = seed >>> 0 || 0x9e3779b9;
  }

  next(): number {
    let value = (this.state += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  }

  between(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  integer(min: number, max: number): number {
    return Math.floor(this.between(min, max + 1));
  }

  pick<T>(values: readonly T[]): T {
    if (values.length === 0) throw new Error("Cannot pick from an empty collection.");
    return values[Math.floor(this.next() * values.length)]!;
  }

  shuffle<T>(values: readonly T[]): T[] {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(this.next() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!];
    }
    return result;
  }
}

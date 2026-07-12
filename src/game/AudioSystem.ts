export class AudioSystem {
  private context: AudioContext | null = null;
  private muted = false;

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  unlock(): void {
    if (!this.context) {
      const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContextClass) return;
      this.context = new AudioContextClass();
    }
    if (this.context.state === "suspended") void this.context.resume();
  }

  swat(): void {
    this.tone(150, 0.09, "sawtooth", 0.045, 55);
  }

  hit(critical = false): void {
    this.noise(critical ? 0.11 : 0.065, critical ? 0.1 : 0.055);
    this.tone(critical ? 440 : 240, critical ? 0.12 : 0.07, "square", 0.035, 80);
  }

  block(): void {
    this.tone(760, 0.12, "triangle", 0.075, 1_420);
    window.setTimeout(() => this.tone(1_120, 0.08, "sine", 0.04, 1_700), 35);
  }

  hurt(): void {
    this.tone(130, 0.16, "sawtooth", 0.065, 52);
  }

  score(): void {
    this.tone(210, 0.28, "triangle", 0.07, 65);
  }

  skill(): void {
    this.tone(180, 0.18, "sine", 0.055, 720);
  }

  ultimate(): void {
    this.tone(72, 0.46, "sawtooth", 0.08, 38);
    window.setTimeout(() => this.tone(380, 0.42, "sine", 0.055, 980), 70);
  }

  boss(): void {
    [0, 210, 420].forEach((delay) => {
      window.setTimeout(() => this.tone(58, 0.18, "square", 0.07, 44), delay);
    });
  }

  victory(): void {
    [392, 523, 659, 784].forEach((frequency, index) => {
      window.setTimeout(() => this.tone(frequency, 0.32, "triangle", 0.05), index * 105);
    });
  }

  private tone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    endFrequency = frequency,
  ): void {
    if (this.muted) return;
    this.unlock();
    const context = this.context;
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(1, frequency), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }

  private noise(duration: number, volume: number): void {
    if (this.muted) return;
    this.unlock();
    const context = this.context;
    if (!context) return;

    const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < frameCount; index += 1) {
      samples[index] = (Math.random() * 2 - 1) * (1 - index / frameCount);
    }

    const source = context.createBufferSource();
    const gain = context.createGain();
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(gain).connect(context.destination);
    source.start();
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export const audio = new AudioSystem();

/* ================================================================
 *  sfx.js — Sound effects via Web Audio API
 *
 *  All sounds are procedurally generated oscillators — no external
 *  audio files required.  Call SFX.init() once on first user
 *  interaction to unlock the AudioContext.
 * ================================================================ */

const SFX = {
  _ctx: null,
  _unlocked: false,

  /** Initialise AudioContext and register unlock listeners. */
  init() {
    if (this._ctx) return;
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    const unlock = () => {
      if (this._unlocked) return;
      this._ctx.resume().then(() => { this._unlocked = true; });
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });
  },

  /** Internal helper — safely play a Web Audio snippet. */
  _play(fn) {
    if (!this._ctx) this.init();
    try { fn(this._ctx); } catch (_) { /* silent fail */ }
  },

  // ── Individual sound effects ──────────────────────────────────

  hit() {
    this._play(c => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(200, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.08);
      g.gain.setValueAtTime(0.3, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
      o.connect(g).connect(c.destination);
      o.start(); o.stop(c.currentTime + 0.1);
    });
  },

  critHit() {
    this._play(c => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(400, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.12);
      g.gain.setValueAtTime(0.35, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
      o.connect(g).connect(c.destination);
      o.start(); o.stop(c.currentTime + 0.15);
    });
  },

  kill() {
    this._play(c => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(600, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.15);
      g.gain.setValueAtTime(0.25, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);
      o.connect(g).connect(c.destination);
      o.start(); o.stop(c.currentTime + 0.18);
    });
  },

  skill() {
    this._play(c => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(300, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.15);
      o.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.3);
      g.gain.setValueAtTime(0.2, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
      o.connect(g).connect(c.destination);
      o.start(); o.stop(c.currentTime + 0.3);
    });
  },

  ultimate() {
    this._play(c => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(80, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(30, c.currentTime + 0.4);
      g.gain.setValueAtTime(0.4, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
      o.connect(g).connect(c.destination);
      o.start(); o.stop(c.currentTime + 0.5);
    });
  },

  blocked() {
    this._play(c => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(800, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(1600, c.currentTime + 0.1);
      g.gain.setValueAtTime(0.3, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
      o.connect(g).connect(c.destination);
      o.start(); o.stop(c.currentTime + 0.2);
    });
  },

  hurt() {
    this._play(c => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(120, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(50, c.currentTime + 0.15);
      g.gain.setValueAtTime(0.3, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
      o.connect(g).connect(c.destination);
      o.start(); o.stop(c.currentTime + 0.2);
    });
  },

  levelUp() {
    this._play(c => {
      [523, 659, 784].forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f, c.currentTime + i * 0.1);
        g.gain.setValueAtTime(0, c.currentTime);
        g.gain.linearRampToValueAtTime(0.2, c.currentTime + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.1 + 0.25);
        o.connect(g).connect(c.destination);
        o.start(c.currentTime + i * 0.1);
        o.stop(c.currentTime + i * 0.1 + 0.25);
      });
    });
  },

  bossWarn() {
    this._play(c => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(60, c.currentTime);
      o.frequency.linearRampToValueAtTime(80, c.currentTime + 0.5);
      o.frequency.linearRampToValueAtTime(60, c.currentTime + 1);
      g.gain.setValueAtTime(0.3, c.currentTime);
      g.gain.linearRampToValueAtTime(0.4, c.currentTime + 0.5);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.2);
      o.connect(g).connect(c.destination);
      o.start(); o.stop(c.currentTime + 1.2);
    });
  },

  pickup() {
    this._play(c => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(500, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(1000, c.currentTime + 0.1);
      g.gain.setValueAtTime(0.2, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
      o.connect(g).connect(c.destination);
      o.start(); o.stop(c.currentTime + 0.15);
    });
  },

  score() {
    this._play(c => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(300, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.3);
      g.gain.setValueAtTime(0.35, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
      o.connect(g).connect(c.destination);
      o.start(); o.stop(c.currentTime + 0.4);
    });
  },
};

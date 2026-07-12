/* ================================================================
 *  NBA Survival Arena — Hoop Defense  (v10 Refactor)
 *  Architecture: CONFIG → UTILS → SCENES → SYSTEMS
 * ================================================================ */

// ────────────────────────────────────────────────────────────────
//  SECTION 1 — GLOBAL CONSTANTS
// ────────────────────────────────────────────────────────────────
const GW = 1920;
const GH = 1080;
const WORLD_W = 3840;
const WORLD_H = 2160;
const COURT_CX = WORLD_W / 2;   // hoop position
const COURT_CY = WORLD_H / 2;

/** Hoop (basket) config */
const HOOP_CFG = {
  maxHp: 300,
  radius: 60,          // visual ring radius
  bodyRadius: 40,      // physics body (smaller so enemies can get close)
};

// ────────────────────────────────────────────────────────────────
//  SECTION 2 — ENEMY DEFINITIONS
// ────────────────────────────────────────────────────────────────
/**
 * Enemy behaviour is driven by a simple state machine:
 *   APPROACH → WINDUP → SHOOT → COOLDOWN → (repeat)
 *
 * Each type defines:
 *   shootRange  – distance from hoop at which the enemy stops and shoots
 *   windupTime  – seconds of the shooting preparation (interruptible)
 *   ballSpeed   – speed of the thrown basketball projectile (px/s)
 *   accuracy    – probability that the ball actually scores (0-1)
 *   scoreDmg    – damage dealt to the hoop on a successful score
 */
const ENEMY_TYPES = [
  {
    id: 'fan', name: 'Rookie',
    hp: 22, atk: 8, spd: 120, bodyRadius: 22, xp: 10, weight: 50,
    shootRange: 100, windupTime: 0.6, ballSpeed: 350, accuracy: 0.75, scoreDmg: 2,
    color: 0x7f8c8d,
  },
  {
    id: 'ref', name: 'Mid-Range Vet',
    hp: 38, atk: 10, spd: 90, bodyRadius: 24, xp: 18, weight: 25,
    shootRange: 280, windupTime: 0.8, ballSpeed: 300, accuracy: 0.65, scoreDmg: 2,
    color: 0x2c3e50,
  },
  {
    id: 'press', name: 'Sharpshooter',
    hp: 28, atk: 12, spd: 80, bodyRadius: 22, xp: 22, weight: 15,
    shootRange: 480, windupTime: 1.2, ballSpeed: 240, accuracy: 0.45, scoreDmg: 3,
    color: 0xc0392b,
  },
  {
    id: 'rival', name: 'Power Center',
    hp: 100, atk: 18, spd: 50, bodyRadius: 32, xp: 40, weight: 10,
    shootRange: 80, windupTime: 1.0, ballSpeed: 450, accuracy: 1.0, scoreDmg: 5,
    superArmor: true,   // cannot be interrupted during windup
    color: 0xe74c3c,
  },
];

const BOSS_TYPE = {
  id: 'boss', name: 'All-Star MVP',
  hp: 2000, atk: 35, spd: 55, bodyRadius: 48, xp: 300,
  shootRange: 120, windupTime: 1.0, ballSpeed: 380, accuracy: 1.0, scoreDmg: 8,
  superArmor: true, isBoss: true,
  color: 0xff0000,
};

// ────────────────────────────────────────────────────────────────
//  SECTION 3 — CHARACTER DEFINITIONS (3 skills + 1 ult)
// ────────────────────────────────────────────────────────────────
const CHARACTERS = [
  {
    id: 'lebron', name: 'LeBron James',
    role: 'Paint Guardian', roleDesc: 'Dominates the paint with power and control',
    hp: 350, atk: 55, spd: 210, atkSpd: 2.5, atkRange: 180, projCol: 0xf1c40f,
    bodyRadius: 26,
    skill1: { name: 'The Block', cd: 4, desc: 'Fan-shaped swat that destroys all airborne balls in range' },
    skill2: { name: 'And One', cd: 7, desc: 'Unstoppable charge that knocks back all enemies' },
    skill3: { name: 'Earthquake', cd: 10, desc: 'AOE slam that stuns all nearby enemies for 2s' },
    ult:    { name: "King's Domain", cd: 35, desc: 'Creates a force field: enemies slowed 50%, +50% damage reduction for 8s' },
  },
  {
    id: 'kobe', name: 'Kobe Bryant',
    role: 'Perimeter Assassin', roleDesc: 'High mobility, picks off shooters with precision',
    hp: 280, atk: 60, spd: 230, atkSpd: 2.2, atkRange: 160, projCol: 0x9b59b6,
    bodyRadius: 24,
    skill1: { name: 'Fadeaway', cd: 4, desc: 'Dash backward, fire 3 piercing shots forward' },
    skill2: { name: 'Viper Strike', cd: 7, desc: 'Dash through enemies dealing massive damage + bleed' },
    skill3: { name: 'Lockdown', cd: 12, desc: 'Panic 3 nearest enemies: they stop shooting for 3s' },
    ult:    { name: 'Mamba Mode', cd: 35, desc: 'ATK +200%, SPD +50%, doubled projectile range for 10s' },
  },
  {
    id: 'curry', name: 'Stephen Curry',
    role: 'Zone Controller', roleDesc: 'Blankets the court with ranged firepower',
    hp: 200, atk: 48, spd: 220, atkSpd: 2.0, atkRange: 150, projCol: 0x3498db,
    bodyRadius: 22,
    skill1: { name: 'Splash Bomb', cd: 5, desc: 'Throw an exploding ball: AOE damage + destroys enemy balls' },
    skill2: { name: 'Crossover', cd: 7, desc: '360-degree bullet ring that pushes enemies back' },
    skill3: { name: 'Pick & Roll', cd: 14, desc: 'Summon a blocking phantom wall for 5s' },
    ult:    { name: 'Night Night', cd: 35, desc: 'Bullet-time: enemies and balls slow to 20% for 6s' },
  },
];

// ────────────────────────────────────────────────────────────────
//  SECTION 4 — UPGRADE POOL
// ────────────────────────────────────────────────────────────────
const UPGRADES = [
  // Combat
  { name: 'ATK +15%',        cat: 'combat', desc: 'Increase all damage',           fn: p => { p.atkMul *= 1.15; } },
  { name: 'ATK SPD +12%',    cat: 'combat', desc: 'Attack faster',                 fn: p => { p.atkSpd *= 1.12; } },
  { name: 'Move SPD +10%',   cat: 'combat', desc: 'Move faster',                   fn: p => { p.spdMul *= 1.1; } },
  { name: 'Max HP +20%',     cat: 'combat', desc: 'More health',                   fn: p => { p.maxHp *= 1.2; p.hp = Math.min(p.hp + 50, p.maxHp); } },
  { name: 'Crit Rate +8%',   cat: 'combat', desc: 'Higher crit chance',            fn: p => { p.critRate += 0.08; } },
  { name: 'Crit DMG +25%',   cat: 'combat', desc: 'Bigger crits',                  fn: p => { p.critDmg += 0.25; } },
  { name: 'Life Steal +3%',  cat: 'combat', desc: 'Heal on hit',                   fn: p => { p.lifeSteal += 0.03; } },
  { name: 'Skill CD -15%',   cat: 'combat', desc: 'Shorter cooldowns',             fn: p => { p.cdMul *= 0.85; } },
  { name: 'Range +20%',      cat: 'combat', desc: 'Longer attack reach',           fn: p => { p.rangeMul *= 1.2; } },
  // Hoop defense
  { name: 'Hoop +20 HP',     cat: 'hoop', desc: 'Reinforce the hoop',              fn: (p, s) => { s.hoop.maxHp += 20; s.hoop.hp = Math.min(s.hoop.hp + 20, s.hoop.maxHp); } },
  { name: 'Hoop Repair 30',  cat: 'hoop', desc: 'Instantly repair hoop',           fn: (p, s) => { s.hoop.hp = Math.min(s.hoop.hp + 30, s.hoop.maxHp); } },
  { name: 'Block Range +25%',cat: 'hoop', desc: 'Easier to intercept balls',       fn: p => { p.blockRange = (p.blockRange || 1) * 1.25; } },
  { name: 'Body Mass +30%',  cat: 'hoop', desc: 'Harder to push, stronger knockback', fn: p => { p.mass = (p.mass || 1) * 1.3; } },
];

// ────────────────────────────────────────────────────────────────
//  SECTION 5 — DROP ITEMS
// ────────────────────────────────────────────────────────────────
const DROP_TYPES = [
  {
    id: 'heal', name: 'Gatorade', color: 0x2ecc71, emoji: '+',
    chance: 0.06,
    effect(scene) {
      const p = scene.player;
      const heal = p.maxHp * 0.25;
      p.hp = Math.min(p.maxHp, p.hp + heal);
      scene.floatText(p.x, p.y - 60, `+${Math.floor(heal)}`, '#2ecc71');
      scene.fxPulse(p.x, p.y, 0x2ecc71);
    },
  },
  {
    id: 'speed', name: 'Lightning Shoes', color: 0xf1c40f, emoji: 'S',
    chance: 0.04,
    effect(scene) {
      const p = scene.player;
      p.spdMul *= 1.5;
      scene.floatText(p.x, p.y - 60, 'SPEED UP!', '#f1c40f');
      scene.fxPulse(p.x, p.y, 0xf1c40f);
      scene.time.delayedCall(10000, () => { if (p.active) p.spdMul /= 1.5; });
    },
  },
  {
    id: 'bomb', name: 'Bomb Ball', color: 0xe74c3c, emoji: 'B',
    chance: 0.025,
    effect(scene) {
      const p = scene.player;
      const dmg = p.atk * p.atkMul * 8;
      scene.enemies.getChildren().forEach(e => {
        if (!e.active || e.isDead) return;
        if (Phaser.Math.Distance.Between(e.x, e.y, p.x, p.y) < 400) {
          const a = Math.atan2(e.y - p.y, e.x - p.x);
          scene.damageEnemy(e, dmg, false, 200, a);
        }
      });
      scene.fxExplosion(p.x, p.y);
      scene.cameras.main.shake(400, 0.02);
      SFX.ultimate();
    },
  },
  {
    id: 'repair', name: 'Repair Kit', color: 0x3498db, emoji: 'R',
    chance: 0.03,
    effect(scene) {
      const heal = 15;
      scene.hoop.hp = Math.min(scene.hoop.hp + heal, scene.hoop.maxHp);
      scene.floatText(COURT_CX, COURT_CY - 80, `HOOP +${heal}`, '#3498db');
      scene.fxPulse(COURT_CX, COURT_CY, 0x3498db);
    },
  },
];

// ────────────────────────────────────────────────────────────────
//  SECTION 6 — SOUND EFFECTS (Web Audio API)
// ────────────────────────────────────────────────────────────────
const SFX = {
  _ctx: null,
  _unlocked: false,

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

  _play(fn) {
    if (!this._ctx) this.init();
    try { fn(this._ctx); } catch (_) { /* silent */ }
  },

  hit()      { this._play(c => { const o=c.createOscillator(),g=c.createGain();o.type='square';o.frequency.setValueAtTime(200,c.currentTime);o.frequency.exponentialRampToValueAtTime(80,c.currentTime+.08);g.gain.setValueAtTime(.3,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.1);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.1);}); },
  critHit()  { this._play(c => { const o=c.createOscillator(),g=c.createGain();o.type='sawtooth';o.frequency.setValueAtTime(400,c.currentTime);o.frequency.exponentialRampToValueAtTime(100,c.currentTime+.12);g.gain.setValueAtTime(.35,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.15);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.15);}); },
  kill()     { this._play(c => { const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(600,c.currentTime);o.frequency.exponentialRampToValueAtTime(200,c.currentTime+.15);g.gain.setValueAtTime(.25,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.18);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.18);}); },
  skill()    { this._play(c => { const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(300,c.currentTime);o.frequency.exponentialRampToValueAtTime(800,c.currentTime+.15);o.frequency.exponentialRampToValueAtTime(200,c.currentTime+.3);g.gain.setValueAtTime(.2,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.3);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.3);}); },
  ultimate() { this._play(c => { const o1=c.createOscillator(),g1=c.createGain();o1.type='sine';o1.frequency.setValueAtTime(80,c.currentTime);o1.frequency.exponentialRampToValueAtTime(30,c.currentTime+.4);g1.gain.setValueAtTime(.4,c.currentTime);g1.gain.exponentialRampToValueAtTime(.001,c.currentTime+.5);o1.connect(g1).connect(c.destination);o1.start();o1.stop(c.currentTime+.5);}); },
  blocked()  { this._play(c => { const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.setValueAtTime(800,c.currentTime);o.frequency.exponentialRampToValueAtTime(1600,c.currentTime+.1);g.gain.setValueAtTime(.3,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.2);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.2);}); },
  hurt()     { this._play(c => { const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.setValueAtTime(120,c.currentTime);o.frequency.exponentialRampToValueAtTime(50,c.currentTime+.15);g.gain.setValueAtTime(.3,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.2);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.2);}); },
  levelUp()  { this._play(c => { [523,659,784].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(f,c.currentTime+i*.1);g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime(.2,c.currentTime+i*.1);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+i*.1+.25);o.connect(g).connect(c.destination);o.start(c.currentTime+i*.1);o.stop(c.currentTime+i*.1+.25);}); }); },
  bossWarn() { this._play(c => { const o=c.createOscillator(),g=c.createGain();o.type='sawtooth';o.frequency.setValueAtTime(60,c.currentTime);o.frequency.linearRampToValueAtTime(80,c.currentTime+.5);o.frequency.linearRampToValueAtTime(60,c.currentTime+1);g.gain.setValueAtTime(.3,c.currentTime);g.gain.linearRampToValueAtTime(.4,c.currentTime+.5);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+1.2);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+1.2);}); },
  pickup()   { this._play(c => { const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(500,c.currentTime);o.frequency.exponentialRampToValueAtTime(1000,c.currentTime+.1);g.gain.setValueAtTime(.2,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.15);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.15);}); },
  score()    { this._play(c => { const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(300,c.currentTime);o.frequency.exponentialRampToValueAtTime(100,c.currentTime+.3);g.gain.setValueAtTime(.35,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.4);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.4);}); },
};

// ────────────────────────────────────────────────────────────────
//  SECTION 7 — LOCAL RECORDS (localStorage)
// ────────────────────────────────────────────────────────────────
const Records = {
  _key: 'nba_hoop_defense_records',
  get() {
    try {
      const d = localStorage.getItem(this._key);
      return d ? JSON.parse(d) : { bestTime: 0, bestKills: 0, bestCombo: 0, bestLevel: 0, bestBlocks: 0, gamesPlayed: 0 };
    } catch { return { bestTime: 0, bestKills: 0, bestCombo: 0, bestLevel: 0, bestBlocks: 0, gamesPlayed: 0 }; }
  },
  save(stats) {
    try {
      const old = this.get();
      old.gamesPlayed++;
      let nr = false;
      if (stats.time   > old.bestTime)   { old.bestTime   = stats.time;   nr = true; }
      if (stats.kills  > old.bestKills)  { old.bestKills  = stats.kills;  nr = true; }
      if (stats.combo  > old.bestCombo)  { old.bestCombo  = stats.combo;  nr = true; }
      if (stats.level  > old.bestLevel)  { old.bestLevel  = stats.level;  nr = true; }
      if (stats.blocks > old.bestBlocks) { old.bestBlocks = stats.blocks; nr = true; }
      localStorage.setItem(this._key, JSON.stringify(old));
      return nr;
    } catch { return false; }
  },
};

// ────────────────────────────────────────────────────────────────
//  SECTION 8 — SPRITE PRE-CALCULATION
// ────────────────────────────────────────────────────────────────
function preCalculateSpriteDimensions() {
  return new Promise(resolve => {
    const entries = Object.entries(SPRITE_DATA).filter(([, sd]) => !sd.isImage && sd.frameCount);
    let remaining = entries.length;
    if (!remaining) { resolve(); return; }
    for (const [, sd] of entries) {
      const img = new Image();
      img.onload = () => {
        sd._fw = Math.floor(img.naturalWidth / sd.frameCount);
        sd._fh = img.naturalHeight;
        if (!--remaining) resolve();
      };
      img.onerror = () => {
        sd._fw = Math.floor(768 / (sd.frameCount || 1));
        sd._fh = 300;
        if (!--remaining) resolve();
      };
      img.src = sd.base64;
    }
  });
}


// ================================================================
//  SECTION 9 — BOOT SCENE
// ================================================================
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const bar = document.getElementById('loading-bar');
    const txt = document.getElementById('loading-text');
    this.load.on('progress', v => { bar.style.width = (v * 100) + '%'; });
    this.load.on('filedone', key => { txt.textContent = `Loading: ${key}...`; });

    for (const [key, sd] of Object.entries(SPRITE_DATA)) {
      if (sd.isImage) {
        this.load.image(key, sd.base64);
      } else {
        this.load.spritesheet(key, sd.base64, {
          frameWidth:  sd._fw || Math.floor(768 / (sd.frameCount || 1)),
          frameHeight: sd._fh || 300,
        });
      }
    }
  }

  create() {
    document.getElementById('loading-screen').style.display = 'none';

    // Register animations for all characters and enemies
    const charIds = ['lebron', 'kobe', 'curry'];
    const enemyIds = ['fan', 'ref', 'rival', 'press', 'boss'];

    for (const id of charIds) {
      this._anim(`${id}_walk`,   `${id}_walk`,   0, 5, 10, -1);
      this._anim(`${id}_idle`,   `${id}_idle`,   0, 3,  6, -1);
      this._anim(`${id}_attack`, `${id}_attack`, 0, 3, 12,  0);
    }
    for (const id of enemyIds) {
      this._anim(`${id}_walk`, `${id}_walk`, 0, 3, 8, -1);
    }

    this.scene.start('Menu');
  }

  /** Helper: safely create an animation only if texture exists */
  _anim(key, sheet, start, end, rate, repeat) {
    if (!this.textures.exists(sheet)) return;
    const total = this.textures.get(sheet).frameTotal - 1;
    const safeEnd = Math.min(end, total - 1);
    if (safeEnd < start) return;
    this.anims.create({
      key,
      frames: this.anims.generateFrameNumbers(sheet, { start, end: safeEnd }),
      frameRate: rate,
      repeat,
    });
  }
}

// ================================================================
//  SECTION 10 — MENU SCENE
// ==============================================================
class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }
  create() {
    window.__scene = this;  // DEBUG: expose scene to console
    const cx = GW / 2, cy = GH / 2;
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Title
    this.add.text(cx, 50, 'NBA Survival Arena', {
      fontSize: '52px', fontFamily: 'system-ui', color: '#f1c40f',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(cx, 105, 'HOOP DEFENSE', {
      fontSize: '22px', fontFamily: 'system-ui', color: '#e74c3c',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    this.add.text(cx, 140, 'Defend the hoop. Block every shot.', {
      fontSize: '16px', fontFamily: 'system-ui', color: '#95a5a6',
    }).setOrigin(0.5);

    // Best records
    const rec = Records.get();
    if (rec.gamesPlayed > 0) {
      this.add.text(cx, GH - 30,
        `Best: ${rec.bestTime}s | ${rec.bestKills} kills | ${rec.bestBlocks} blocks | Lv.${rec.bestLevel} | ${rec.gamesPlayed} games`, {
        fontSize: '14px', fontFamily: 'system-ui', color: '#7f8c8d',
      }).setOrigin(0.5);
    }

    // Character cards
    this.selectedChar = 0;
    this.cards = [];

    CHARACTERS.forEach((ch, i) => {
      const x = cx + (i - 1) * 340;
      const y = cy + 10;

      // Card bg
      const card = this.add.rectangle(x, y, 290, 460, 0x2c3e50)
        .setStrokeStyle(3, i === 0 ? 0xf1c40f : 0x555555)
        .setInteractive({ useHandCursor: true });

      // Sprite preview
      const sprKey = `${ch.id}_idle`;
      if (this.textures.exists(sprKey)) {
        const spr = this.add.sprite(x, y - 110, sprKey, 0).setScale(0.55);
        if (this.anims.exists(sprKey)) spr.play(sprKey);
      } else {
        this.add.circle(x, y - 110, 45, ch.projCol);
        this.add.text(x, y - 110, ch.id[0].toUpperCase(), { fontSize: '36px', color: '#fff', fontFamily: 'system-ui' }).setOrigin(0.5);
      }

      // Name & role
      this.add.text(x, y + 10, ch.name, { fontSize: '20px', color: '#fff', fontFamily: 'system-ui', fontStyle: 'bold' }).setOrigin(0.5);
      const roleCol = { 'Paint Guardian': '#e74c3c', 'Perimeter Assassin': '#9b59b6', 'Zone Controller': '#3498db' };
      this.add.text(x, y + 35, `[ ${ch.role} ]`, { fontSize: '13px', color: roleCol[ch.role] || '#fff', fontFamily: 'system-ui' }).setOrigin(0.5);

      // Stats
      this.add.text(x, y + 58, `HP:${ch.hp}  ATK:${ch.atk}  SPD:${ch.spd}`, {
        fontSize: '12px', color: '#95a5a6', fontFamily: 'system-ui',
      }).setOrigin(0.5);

      // Skills list
      const skills = [ch.skill1, ch.skill2, ch.skill3, ch.ult];
      const skillText = skills.map((s, si) => `${si < 3 ? `Q${si+1}` : 'R'}: ${s.name}`).join('\n');
      this.add.text(x, y + 100, skillText, {
        fontSize: '12px', color: '#f1c40f', fontFamily: 'system-ui', lineSpacing: 4, align: 'center',
      }).setOrigin(0.5);

      // Skill descriptions
      const descText = skills.map(s => s.desc).join('\n');
      this.add.text(x, y + 175, descText, {
        fontSize: '10px', color: '#bdc3c7', fontFamily: 'system-ui', lineSpacing: 3,
        align: 'center', wordWrap: { width: 260 },
      }).setOrigin(0.5);

      card.on('pointerdown', () => {
        this.selectedChar = i;
        this.cards.forEach((c, j) => c.setStrokeStyle(3, j === i ? 0xf1c40f : 0x555555));
      });
      this.cards.push(card);
    });

    // Start button
    const btn = this.add.rectangle(cx, cy + 310, 280, 60, 0xe74c3c)
      .setStrokeStyle(2, 0xffffff).setInteractive({ useHandCursor: true });
    this.add.text(cx, cy + 310, 'START GAME', {
      fontSize: '28px', color: '#fff', fontFamily: 'system-ui',
    }).setOrigin(0.5);
    btn.on('pointerdown', () => this.scene.start('Game', { charIndex: this.selectedChar }));
  }
}


// ================================================================
//  SECTION 11 — GAME SCENE
// ================================================================
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) { this.charIndex = data.charIndex || 0; }

  // ── CREATE ──────────────────────────────────────────────────
  create() {
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    // Background
    if (this.textures.exists('court_bg')) {
      this.add.tileSprite(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 'court_bg');
    } else {
      this._drawCourt();
    }

    // Hoop (center of court)
    this._createHoop();

    // Player
    const charDef = CHARACTERS[this.charIndex];
    this._createPlayer(charDef);

    // Physics groups
    this.enemies           = this.physics.add.group();
    this.enemyBalls        = this.physics.add.group();   // basketballs thrown by enemies
    this.playerProjectiles = this.physics.add.group();
    this.xpOrbs            = this.physics.add.group();
    this.drops             = this.physics.add.group();

    // Camera
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // ── Collisions (SOLID — no ghosting!) ──
    this.physics.add.collider(this.player, this.enemies, this._onPlayerTouchEnemy, null, this);
    this.physics.add.collider(this.enemies, this.enemies);  // enemies push each other
    this.physics.add.collider(this.player, this.hoopBody);  // player can't walk through hoop
    this.physics.add.collider(this.enemies, this.hoopBody); // enemies can't walk through hoop

    // ── Overlaps (triggers) ──
    this.physics.add.overlap(this.player, this.enemyBalls, this._onPlayerBlockBall, null, this);
    this.physics.add.overlap(this.playerProjectiles, this.enemies, this._onProjHitEnemy, null, this);
    this.physics.add.overlap(this.playerProjectiles, this.enemyBalls, this._onProjHitBall, null, this);
    this.physics.add.overlap(this.player, this.xpOrbs, this._onCollectXP, null, this);
    this.physics.add.overlap(this.player, this.drops, this._onCollectDrop, null, this);

    // Game state
    this.gameTime     = 0;
    this.kills        = 0;
    this.combo        = 0;
    this.maxCombo     = 0;
    this.comboTimer   = 0;
    this.blocks       = 0;   // successful ball interceptions
    this.spawnTimer   = 0;
    this.spawnInterval = 1.8;
    this.hitStopTimer = 0;
    this.isPaused     = false;
    this.gameOver     = false;
    this.bossTimer    = 60;
    this.bossCount    = 0;
    this.bossAlive    = false;
    this.currentBoss  = null;
    this.slowMo       = 1;   // for Curry ult (bullet time)

    // Input
    this._setupJoystick();
    this._setupSkillButtons();

    // HUD
    this._setupHUD();
    SFX.init();

    // Show skill buttons
    ['btn-skill1', 'btn-skill2', 'btn-skill3', 'btn-ult'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.style.display = 'flex'; }
    });
    document.getElementById('hoop-hud').style.display = 'block';
    this._updateSkillLabels();

    // Initial enemies
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const dist = 500 + Math.random() * 300;
      this._spawnEnemy(ENEMY_TYPES[0],
        Phaser.Math.Clamp(COURT_CX + Math.cos(angle) * dist, 50, WORLD_W - 50),
        Phaser.Math.Clamp(COURT_CY + Math.sin(angle) * dist, 50, WORLD_H - 50));
    }
  }

  // ── HOOP ────────────────────────────────────────────────────
  _createHoop() {
    this.hoop = { hp: HOOP_CFG.maxHp, maxHp: HOOP_CFG.maxHp };

    // Visual ring
    const gfx = this.add.graphics().setDepth(5);
    gfx.lineStyle(6, 0xff6600, 1);
    gfx.strokeCircle(COURT_CX, COURT_CY, HOOP_CFG.radius);
    gfx.lineStyle(2, 0xffffff, 0.4);
    gfx.strokeCircle(COURT_CX, COURT_CY, HOOP_CFG.radius + 8);
    this.hoopGfx = gfx;

    // Backboard visual
    const bb = this.add.rectangle(COURT_CX, COURT_CY - HOOP_CFG.radius - 20, 80, 10, 0xffffff, 0.6).setDepth(5);

    // Physics body (invisible sprite for collision)
    this.hoopBody = this.physics.add.staticImage(COURT_CX, COURT_CY, '__DEFAULT');
    this.hoopBody.setVisible(false);
    this.hoopBody.body.setCircle(HOOP_CFG.bodyRadius);
    this.hoopBody.body.setOffset(
      this.hoopBody.width / 2 - HOOP_CFG.bodyRadius,
      this.hoopBody.height / 2 - HOOP_CFG.bodyRadius
    );
  }

  // ── PLAYER ──────────────────────────────────────────────────
  _createPlayer(def) {
    const sprKey = `${def.id}_idle`;
    if (this.textures.exists(sprKey)) {
      this.player = this.physics.add.sprite(COURT_CX + 150, COURT_CY, sprKey, 0).setScale(0.55);
    } else {
      this.player = this.physics.add.sprite(COURT_CX + 150, COURT_CY);
      this.player.setSize(50, 50);
    }
    this.player.setCollideWorldBounds(true).setDepth(10);
    this.player.body.setCircle(def.bodyRadius);
    this.player.body.setOffset(
      this.player.width * 0.55 / 2 - def.bodyRadius,
      this.player.height * 0.55 / 2 - def.bodyRadius
    );
    // Make player heavier so enemies don't push him easily
    this.player.body.setMass(3);

    Object.assign(this.player, {
      charDef: def,
      hp: def.hp, maxHp: def.hp,
      atk: def.atk, spd: def.spd, atkSpd: def.atkSpd,
      atkMul: 1, spdMul: 1, critRate: 0.05, critDmg: 2.0,
      lifeSteal: 0, cdMul: 1, rangeMul: 1, blockRange: 1, mass: 1,
      atkCD: 0, skill1CD: 0, skill2CD: 0, skill3CD: 0, ultCD: 0,
      level: 1, xp: 0, xpToNext: 120,
      invTimer: 0, face: 1, atkAnim: 0,
      // Buff timers
      mambaMode: 0, kingDomain: 0, nightNight: 0,
    });
  }

  // ── COURT DRAWING ───────────────────────────────────────────
  _drawCourt() {
    const g = this.add.graphics();
    g.fillStyle(0xc8915a, 1);
    g.fillRect(0, 0, WORLD_W, WORLD_H);
    // Wood grain
    g.lineStyle(1, 0xb8814a, 0.3);
    for (let x = 0; x < WORLD_W; x += 80) g.lineBetween(x, 0, x, WORLD_H);
    // Court lines
    g.lineStyle(4, 0xffffff, 0.8);
    const cx = COURT_CX, cy = COURT_CY;
    g.strokeCircle(cx, cy, 180);   // center circle (larger for hoop area)
    g.strokeCircle(cx, cy, 8);
    // Three-point arc reference
    g.lineStyle(2, 0xffffff, 0.3);
    g.strokeCircle(cx, cy, 480);
    // Court boundary
    g.lineStyle(4, 0xffffff, 0.6);
    g.strokeRect(cx - 900, cy - 550, 1800, 1100);
  }

  // ── JOYSTICK ────────────────────────────────────────────────
  _setupJoystick() {
    this.joyActive = false;
    this.joyX = 0;
    this.joyY = 0;
    this.joyPointer = null;
    const defX = 180, defY = GH - 180;
    this.joyDefX = defX;
    this.joyDefY = defY;

    this.joyBase = this.add.circle(defX, defY, 120, 0xffffff, 0.25)
      .setScrollFactor(0).setDepth(100).setStrokeStyle(3, 0xffffff, 0.5);
    this.joyThumb = this.add.circle(defX, defY, 55, 0xffffff, 0.6)
      .setScrollFactor(0).setDepth(101);
    this.joyBaseX = defX;
    this.joyBaseY = defY;

    this.input.on('pointerdown', ptr => {
      if (ptr.x < this.cameras.main.width * 0.55 && !this.joyActive) {
        this.joyActive = true;
        this.joyPointer = ptr;
        this.joyBaseX = ptr.x;
        this.joyBaseY = ptr.y;
        this.joyBase.setPosition(ptr.x, ptr.y).setAlpha(0.45);
        this.joyThumb.setPosition(ptr.x, ptr.y).setAlpha(0.9);
      }
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
  }

  _updateJoystick() {
    if (!this.joyActive || !this.joyPointer) return;
    if (!this.joyPointer.isDown) { this._resetJoystick(); return; }
    const dx = this.joyPointer.x - this.joyBaseX;
    const dy = this.joyPointer.y - this.joyBaseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxD = 90;
    if (dist > 2) {
      const a = Math.atan2(dy, dx);
      const cl = Math.min(dist, maxD);
      this.joyX = Math.cos(a) * (cl / maxD);
      this.joyY = Math.sin(a) * (cl / maxD);
      this.joyThumb.setPosition(this.joyBaseX + Math.cos(a) * cl, this.joyBaseY + Math.sin(a) * cl);
    } else {
      this.joyX = 0; this.joyY = 0;
      this.joyThumb.setPosition(this.joyBaseX, this.joyBaseY);
    }
  }

  _resetJoystick() {
    this.joyActive = false; this.joyPointer = null; this.joyX = 0; this.joyY = 0;
    this.joyBase.setPosition(this.joyDefX, this.joyDefY).setAlpha(0.25);
    this.joyThumb.setPosition(this.joyDefX, this.joyDefY).setAlpha(0.4);
  }

  // ── SKILL BUTTONS ───────────────────────────────────────────
  _setupSkillButtons() {
    const bind = (elId, fn) => {
      const el = document.getElementById(elId);
      if (!el) return;
      const handler = e => { e.preventDefault(); e.stopPropagation(); fn(); };
      el.addEventListener('touchstart', handler, { passive: false });
      el.addEventListener('mousedown', handler);
    };
    bind('btn-skill1', () => this.doSkill1());
    bind('btn-skill2', () => this.doSkill2());
    bind('btn-skill3', () => this.doSkill3());
    bind('btn-ult',    () => this.doUlt());

    // Keyboard
    this.input.keyboard.on('keydown-J', () => this.doSkill1());
    this.input.keyboard.on('keydown-K', () => this.doSkill2());
    this.input.keyboard.on('keydown-L', () => this.doSkill3());
    this.input.keyboard.on('keydown-SPACE', () => this.doUlt());
  }

  _updateSkillLabels() {
    const ch = CHARACTERS[this.charIndex];
    document.getElementById('btn-skill1').textContent = ch.skill1.name;
    document.getElementById('btn-skill2').textContent = ch.skill2.name;
    document.getElementById('btn-skill3').textContent = ch.skill3.name;
    document.getElementById('btn-ult').textContent    = ch.ult.name;
  }

  // ── HUD ─────────────────────────────────────────────────────
  _setupHUD() {
    const s = { fontSize: '20px', color: '#fff', fontFamily: 'system-ui', stroke: '#000', strokeThickness: 3 };
    this.hpText    = this.add.text(20, 20, '', s).setScrollFactor(0).setDepth(50);
    this.levelText = this.add.text(20, 50, '', s).setScrollFactor(0).setDepth(50);
    this.killText  = this.add.text(GW - 20, 20, '', { ...s, align: 'right' }).setOrigin(1, 0).setScrollFactor(0).setDepth(50);
    this.timeText  = this.add.text(GW - 20, 50, '', { ...s, align: 'right' }).setOrigin(1, 0).setScrollFactor(0).setDepth(50);
    this.blockText = this.add.text(GW - 20, 80, '', { ...s, align: 'right', fontSize: '16px', color: '#3498db' }).setOrigin(1, 0).setScrollFactor(0).setDepth(50);
    this.comboText = this.add.text(GW / 2, 110, '', {
      fontSize: '36px', color: '#f1c40f', fontFamily: 'system-ui', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);

    this.bossTimerText = this.add.text(GW / 2, 55, '', {
      fontSize: '16px', color: '#e74c3c', fontFamily: 'system-ui', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);

    // HP bar
    this.hpBarBg = this.add.rectangle(160, 15, 250, 16, 0x333333).setOrigin(0, 0).setScrollFactor(0).setDepth(49);
    this.hpBar   = this.add.rectangle(160, 15, 250, 16, 0x2ecc71).setOrigin(0, 0).setScrollFactor(0).setDepth(50);
    // XP bar
    this.xpBarBg = this.add.rectangle(160, 35, 250, 8, 0x333333).setOrigin(0, 0).setScrollFactor(0).setDepth(49);
    this.xpBar   = this.add.rectangle(160, 35, 0, 8, 0x3498db).setOrigin(0, 0).setScrollFactor(0).setDepth(50);
  }


  // ================================================================
  //  UPDATE LOOP
  // ================================================================
  update(time, rawDelta) {
    if (this.gameOver) return;
    const dt = (rawDelta / 1000) * this.slowMo;
    if (this.hitStopTimer > 0) { this.hitStopTimer -= rawDelta / 1000; return; }
    if (this.isPaused) return;

    this.gameTime += dt;
    const p = this.player;

    // ── Cooldowns ──
    if (p.atkCD > 0)    p.atkCD    -= dt;
    if (p.skill1CD > 0) p.skill1CD -= dt;
    if (p.skill2CD > 0) p.skill2CD -= dt;
    if (p.skill3CD > 0) p.skill3CD -= dt;
    if (p.ultCD > 0)    p.ultCD    -= dt;
    if (p.invTimer > 0) p.invTimer -= dt;
    if (p.mambaMode > 0)  p.mambaMode  -= dt;
    if (p.kingDomain > 0) p.kingDomain -= dt;
    if (p.nightNight > 0) p.nightNight -= dt;

    // Combo decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    // ── Movement ──
    this._updateJoystick();
    let mx = this.joyX, my = this.joyY;
    if (this.cursors.left.isDown  || this.wasd.A.isDown) mx = -1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) mx = 1;
    if (this.cursors.up.isDown    || this.wasd.W.isDown) my = -1;
    if (this.cursors.down.isDown  || this.wasd.S.isDown) my = 1;
    const mag = Math.sqrt(mx * mx + my * my);
    const spd = p.spd * p.spdMul;
    if (mag > 0.1) {
      p.body.setVelocity((mx / mag) * spd, (my / mag) * spd);
      p.face = mx >= 0 ? 1 : -1;
      p.setFlipX(p.face < 0);
      this._playAnim(p, `${p.charDef.id}_walk`);
    } else {
      p.body.setVelocity(0, 0);
      this._playAnim(p, `${p.charDef.id}_idle`);
    }

    // ── Auto Attack ──
    if (p.atkCD <= 0) {
      const nearest = this._nearestEnemy(p.x, p.y, p.charDef.atkRange * p.rangeMul * 3);
      if (nearest) {
        this._doAutoAttack(nearest);
        p.atkCD = 1 / (p.atkSpd * (p.mambaMode > 0 ? 1.5 : 1));
      }
    }

    // ── Enemy AI ──
    this._updateEnemies(dt);

    // ── Enemy Balls → Hoop scoring ──
    this._updateEnemyBalls(dt);

    // ── XP orb attraction ──
    this._attractXP();

    // ── Spawning ──
    this._updateSpawning(dt);

    // ── Boss timer ──
    this.bossTimer -= dt;
    if (this.bossTimer <= 0 && !this.bossAlive) {
      this._spawnBoss();
      this.bossTimer = 60 + this.bossCount * 15;
    }

    // ── HUD ──
    this._updateHUD();
    this._updateCooldownOverlays();
  }

  // ── ANIMATION HELPER ────────────────────────────────────────
  _playAnim(sprite, key) {
    if (this.anims.exists(key) && sprite.anims.currentAnim?.key !== key) {
      sprite.play(key, true);
    }
  }

  // ── NEAREST ENEMY ───────────────────────────────────────────
  _nearestEnemy(x, y, maxDist) {
    let best = null, bestD = maxDist;
    this.enemies.getChildren().forEach(e => {
      if (!e.active || e.isDead) return;
      const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (d < bestD) { bestD = d; best = e; }
    });
    return best;
  }

  // ── AUTO ATTACK ─────────────────────────────────────────────
  _doAutoAttack(target) {
    const p = this.player;
    const angle = Math.atan2(target.y - p.y, target.x - p.x);
    const range = p.charDef.atkRange * p.rangeMul * (p.mambaMode > 0 ? 1.5 : 1);
    const baseDmg = p.atk * p.atkMul * (p.mambaMode > 0 ? 3 : 1);
    const sweepAngle = Math.PI;  // 180-degree cone (semicircle)

    // Visual: sweeping arc
    const arcGfx = this.add.graphics().setDepth(12);
    arcGfx.fillStyle(p.charDef.projCol, 0.35);
    arcGfx.slice(p.x, p.y, range, angle - sweepAngle / 2, angle + sweepAngle / 2, false);
    arcGfx.fillPath();
    this.tweens.add({ targets: arcGfx, alpha: 0, duration: 200, onComplete: () => arcGfx.destroy() });

    // Hit all enemies in the cone
    let hitCount = 0;
    this.enemies.getChildren().forEach(e => {
      if (!e.active || e.isDead) return;
      const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y);
      if (d > range) return;
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      let diff = a - angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > sweepAngle / 2) return;

      const isCrit = Math.random() < p.critRate;
      const finalDmg = isCrit ? baseDmg * p.critDmg : baseDmg;
      const knockAngle = Math.atan2(e.y - p.y, e.x - p.x);
      this.damageEnemy(e, finalDmg, isCrit, 180, knockAngle);
      hitCount++;
    });

    // NOTE: Auto-attack does NOT block balls. Use skills (especially Skill 1) to intercept!

    SFX.hit();
  }

  // ── ENEMY AI STATE MACHINE ──────────────────────────────────
  _updateEnemies(dt) {
    const slowFactor = this.player.nightNight > 0 ? 0.2 : 1;
    const domainSlow = this.player.kingDomain > 0 ? 0.5 : 1;

    if (!this._debugFrame) this._debugFrame = 0;
    this._debugFrame++;
    this.enemies.getChildren().forEach((e, idx) => {
      if (!e.active || e.isDead) return;

      const effSlow = slowFactor * domainSlow * (e.panicTimer > 0 ? 0 : 1);
      if (e.panicTimer > 0) { e.panicTimer -= dt; e.body.setVelocity(0, 0); return; }
      if (e.stunTimer > 0) { e.stunTimer -= dt; e.body.setVelocity(0, 0); return; }

      const distToHoop = Phaser.Math.Distance.Between(e.x, e.y, COURT_CX, COURT_CY);
      const shootRange = e.typeDef.shootRange;

      switch (e.aiState) {
        case 'approach': {
          // Log every 60 frames for first enemy
          if (this._debugFrame % 60 === 0 && idx === 0) {
            console.log('[AI-DEBUG] Enemy 0 state:', e.aiState, 'dist:', distToHoop.toFixed(0), 'shootRange:', shootRange, 'threshold:', shootRange + 20);
          }
          if (distToHoop <= shootRange + 20) {
            console.log('[AI] Enemy entering WINDUP, dist:', distToHoop, 'range:', shootRange);
            e.aiState = 'windup';
            e.windupTimer = e.typeDef.windupTime;
            e.body.setVelocity(0, 0);
            // Windup visual
            e.windupCircle = this.add.circle(e.x, e.y, 30, 0xff8800, 0.3).setDepth(4);
            this.tweens.add({
              targets: e.windupCircle, scale: 1.5, alpha: 0.6,
              duration: e.typeDef.windupTime * 1000, ease: 'Quad.easeIn',
            });
          } else {
            // Move toward hoop
            const angle = Math.atan2(COURT_CY - e.y, COURT_CX - e.x);
            const spd = e.typeDef.spd * effSlow;
            e.body.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
            e.setFlipX(e.body.velocity.x < 0);
          }
          break;
        }

        case 'windup': {
          e.windupTimer -= dt;
          if (e.windupCircle) e.windupCircle.setPosition(e.x, e.y);
          if (e.windupTimer <= 0) {
            // SHOOT!

            console.log('[AI] Enemy SHOOTING!');
            this._enemyShoot(e);
            e.aiState = 'cooldown';
            e.cooldownTimer = 0.6 + Math.random() * 0.8;
            if (e.windupCircle) { e.windupCircle.destroy(); e.windupCircle = null; }
          }
          break;
        }

        case 'cooldown': {
          e.cooldownTimer -= dt;
          if (e.cooldownTimer <= 0) {
            e.aiState = 'approach';
          }
          // Slowly drift away during cooldown
          const awayAngle = Math.atan2(e.y - COURT_CY, e.x - COURT_CX);
          e.body.setVelocity(Math.cos(awayAngle) * 30 * effSlow, Math.sin(awayAngle) * 30 * effSlow);
          break;
        }
      }

      // HP bar update
      if (e.hpBar) {
        e.hpBar.setPosition(e.x - 25, e.y - e.typeDef.bodyRadius - 18);
        e.hpBarFill.setPosition(e.x - 25, e.y - e.typeDef.bodyRadius - 18);
        const ratio = Math.max(0, e.hp / e.maxHp);
        e.hpBarFill.displayWidth = 50 * ratio;
        const show = e.hp < e.maxHp;
        e.hpBar.setVisible(show);
        e.hpBarFill.setVisible(show);
      }
    });
  }

  // ── ENEMY SHOOT ─────────────────────────────────────────────
  _enemyShoot(e) {
    const angle = Math.atan2(COURT_CY - e.y, COURT_CX - e.x);
    const slowFactor = this.player.nightNight > 0 ? 0.2 : 1;
    const speed = e.typeDef.ballSpeed * slowFactor;

    const ball = this.add.circle(e.x, e.y, 12, 0xff8800, 1).setDepth(8);
    this.physics.add.existing(ball);
    ball.body.setCircle(12);
    ball.scoreDmg = e.typeDef.scoreDmg;
    ball.accuracy = e.typeDef.accuracy;
    ball.sourceEnemy = e;
    // IMPORTANT: add to group BEFORE setting velocity, because physics group resets velocity on add
    this.enemyBalls.add(ball);
    ball.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    console.log('[BALL] Created ball, total balls:', this.enemyBalls.getChildren().length);

    // Ball trail
    const trail = this.add.circle(e.x, e.y, 6, 0xff8800, 0.3).setDepth(7);
    ball._trail = trail;

    // Auto-destroy after 5 seconds
    this.time.delayedCall(5000, () => {
      if (ball.active) { ball.destroy(); trail.destroy(); }
    });
  }

  // ── ENEMY BALLS → HOOP SCORING ─────────────────────────────
  _updateEnemyBalls(dt) {
    this.enemyBalls.getChildren().forEach(ball => {
      if (!ball.active) return;
      // Update trail
      if (ball._trail) ball._trail.setPosition(ball.x, ball.y);

      // Check if ball touches player (body block)
      const p = this.player;
      const distToPlayer = Phaser.Math.Distance.Between(ball.x, ball.y, p.x, p.y);
      const blockRadius = (p.charDef.bodyRadius + 15) * (p.blockRange || 1);
      if (distToPlayer < blockRadius && !this.gameOver) {
        this.blocks++;
        this.floatText(ball.x, ball.y - 20, 'BLOCKED!', '#3498db');
        this._grantXP(10);
        if (ball._trail) ball._trail.destroy();
        ball.destroy();
        SFX.blocked();
        return;
      }

      // Check if ball reached hoop
      const distToHoop = Phaser.Math.Distance.Between(ball.x, ball.y, COURT_CX, COURT_CY);
      if (distToHoop < HOOP_CFG.radius) {
        console.log('[BALL] Ball reached hoop! dist:', distToHoop);
        // Accuracy check
        if (Math.random() < ball.accuracy) {
          // SCORE! Damage hoop
          this.hoop.hp -= ball.scoreDmg;
          this.floatText(COURT_CX, COURT_CY - 40, `-${ball.scoreDmg}`, '#e74c3c');
          SFX.score();
          // Flash hoop red
          this.hoopGfx.clear();
          this.hoopGfx.lineStyle(6, 0xff0000, 1);
          this.hoopGfx.strokeCircle(COURT_CX, COURT_CY, HOOP_CFG.radius);
          this.time.delayedCall(300, () => {
            if (this.gameOver) return;
            this.hoopGfx.clear();
            this.hoopGfx.lineStyle(6, 0xff6600, 1);
            this.hoopGfx.strokeCircle(COURT_CX, COURT_CY, HOOP_CFG.radius);
            this.hoopGfx.lineStyle(2, 0xffffff, 0.4);
            this.hoopGfx.strokeCircle(COURT_CX, COURT_CY, HOOP_CFG.radius + 8);
          });
        } else {
          // MISS
          this.floatText(COURT_CX + Phaser.Math.Between(-30, 30), COURT_CY - 40, 'MISS', '#95a5a6');
        }
        if (ball._trail) ball._trail.destroy();
        ball.destroy();

        // Check hoop death
        if (this.hoop.hp <= 0) {
          this.hoop.hp = 0;
          this._gameOver('hoop');
        }
      }
    });
  }

  // ── XP ATTRACTION ───────────────────────────────────────────
  _attractXP() {
    const p = this.player;
    const magnetRange = 180;
    this.xpOrbs.getChildren().forEach(orb => {
      if (!orb.active) return;
      const d = Phaser.Math.Distance.Between(orb.x, orb.y, p.x, p.y);
      if (d < magnetRange) {
        const angle = Math.atan2(p.y - orb.y, p.x - orb.x);
        const speed = 400 * (1 - d / magnetRange) + 100;
        orb.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      }
    });
  }

  // ── SPAWNING ────────────────────────────────────────────────
  _updateSpawning(dt) {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;

    // Difficulty scaling
    const minutes = this.gameTime / 60;
    this.spawnInterval = Math.max(0.35, 1.8 - minutes * 0.08);
    this.spawnTimer = this.spawnInterval;

    // Weighted random type
    const totalWeight = ENEMY_TYPES.reduce((s, t) => s + t.weight, 0);
    let r = Math.random() * totalWeight;
    let type = ENEMY_TYPES[0];
    for (const t of ENEMY_TYPES) {
      r -= t.weight;
      if (r <= 0) { type = t; break; }
    }

    // Spawn from edge
    const angle = Math.random() * Math.PI * 2;
    const dist = 700 + Math.random() * 400;
    const sx = Phaser.Math.Clamp(COURT_CX + Math.cos(angle) * dist, 50, WORLD_W - 50);
    const sy = Phaser.Math.Clamp(COURT_CY + Math.sin(angle) * dist, 50, WORLD_H - 50);
    this._spawnEnemy(type, sx, sy);
  }

  // ── SPAWN ENEMY ─────────────────────────────────────────────
  _spawnEnemy(typeDef, x, y) {
    const hpMul = 1 + this.gameTime / 150;
    const sprKey = `${typeDef.id}_walk`;
    let e;
    if (this.textures.exists(sprKey)) {
      e = this.physics.add.sprite(x, y, sprKey, 0).setScale(typeDef.isBoss ? 0.8 : 0.5);
      if (this.anims.exists(sprKey)) e.play(sprKey);
    } else {
      e = this.add.circle(x, y, typeDef.bodyRadius, typeDef.color, 1);
      this.physics.add.existing(e);
    }
    e.setDepth(6);
    const bodyR = Math.floor(typeDef.bodyRadius * 0.65);
    e.body.setCircle(bodyR);
    if (e.width) {
      const scale = typeDef.isBoss ? 0.8 : 0.5;
      e.body.setOffset(
        e.width * scale / 2 - bodyR,
        e.height * scale / 2 - bodyR
      );
    }
    e.setCollideWorldBounds(true);
    e.body.setBounce(0.6);
    e.body.setMass(typeDef.superArmor ? 5 : 1);

    Object.assign(e, {
      typeDef,
      hp: typeDef.hp * hpMul,
      maxHp: typeDef.hp * hpMul,
      isDead: false,
      aiState: 'approach',
      windupTimer: 0,
      cooldownTimer: 0,
      stunTimer: 0,
      panicTimer: 0,
      windupCircle: null,
    });

    // HP bar
    e.hpBar     = this.add.rectangle(x - 25, y - typeDef.bodyRadius - 18, 50, 6, 0x333333).setDepth(15).setVisible(false);
    e.hpBarFill = this.add.rectangle(x - 25, y - typeDef.bodyRadius - 18, 50, 6, typeDef.isBoss ? 0xe74c3c : 0x2ecc71).setDepth(16).setOrigin(0, 0.5).setVisible(false);
    e.hpBar.setOrigin(0, 0.5);

    this.enemies.add(e);
    return e;
  }

  // ── SPAWN BOSS ──────────────────────────────────────────────
  _spawnBoss() {
    this.bossCount++;
    const angle = Math.random() * Math.PI * 2;
    const dist = 800;
    const sx = Phaser.Math.Clamp(COURT_CX + Math.cos(angle) * dist, 100, WORLD_W - 100);
    const sy = Phaser.Math.Clamp(COURT_CY + Math.sin(angle) * dist, 100, WORLD_H - 100);

    const bossType = { ...BOSS_TYPE, hp: BOSS_TYPE.hp * (1 + this.bossCount * 0.5) };
    const boss = this._spawnEnemy(bossType, sx, sy);
    boss.isBoss = true;
    this.bossAlive = true;
    this.currentBoss = boss;

    // Warning
    const warn = document.getElementById('boss-warning');
    warn.style.display = 'block';
    SFX.bossWarn();
    this.cameras.main.shake(800, 0.015);
    setTimeout(() => { warn.style.display = 'none'; }, 2000);
  }


  // ================================================================
  //  COLLISION HANDLERS
  // ================================================================

  /** Player touches enemy — take contact damage */
  _onPlayerTouchEnemy(player, enemy) {
    if (!enemy.active || enemy.isDead || player.invTimer > 0) return;
    const dmg = enemy.typeDef.atk * (1 + this.gameTime / 180);
    player.hp -= dmg;
    player.invTimer = 0.3;
    this.floatText(player.x, player.y - 50, `-${Math.floor(dmg)}`, '#e74c3c');
    SFX.hurt();
    player.setTint(0xff0000);
    this.time.delayedCall(200, () => { if (player.active) player.clearTint(); });
    if (player.hp <= 0) this._gameOver('player');
  }

  /** Player body blocks an enemy ball */
  _onPlayerBlockBall(player, ball) {
    if (!ball.active) return;
    console.log('[BLOCK] Player body blocked ball!');
    this.blocks++;
    this.floatText(player.x, player.y - 70, 'BLOCKED!', '#3498db');
    SFX.blocked();
    this.fxPulse(player.x, player.y, 0x3498db);
    if (ball._trail) ball._trail.destroy();
    ball.destroy();
    // Bonus XP for blocking
    this._grantXP(15);
  }

  /** Player projectile hits enemy */
  _onProjHitEnemy(proj, enemy) {

    if (!proj.active || !enemy.active || enemy.isDead) return;
    this.damageEnemy(enemy, proj.dmg, proj.isCrit, proj.knockback, proj.knockAngle);
    proj.destroy();
  }

  /** Player projectile destroys enemy ball */
  _onProjHitBall(proj, ball) {
    if (!proj.active || !ball.active) return;
    this.blocks++;
    this.floatText(ball.x, ball.y - 30, 'BLOCKED!', '#3498db');
    SFX.blocked();
    if (ball._trail) ball._trail.destroy();
    ball.destroy();
    proj.destroy();
    this._grantXP(10);
  }

  /** Collect XP orb */
  _onCollectXP(player, orb) {
    if (!orb.active) return;
    this._grantXP(orb.xpValue || 10);
    orb.destroy();
    SFX.pickup();
  }

  /** Collect drop item */
  _onCollectDrop(player, drop) {
    if (!drop.active) return;
    const dropDef = drop.dropDef;
    if (dropDef && dropDef.effect) dropDef.effect(this);
    this.floatText(player.x, player.y - 80, dropDef.name, '#f1c40f');
    SFX.pickup();
    drop.destroy();
  }

  // ================================================================
  //  DAMAGE SYSTEM
  // ================================================================
  damageEnemy(enemy, dmg, isCrit, knockback, knockAngle) {
    if (!enemy.active || enemy.isDead) return;
    const finalDmg = Math.floor(dmg);
    enemy.hp -= finalDmg;

    // Knockback (unless super armor during windup)
    if (knockback && !(enemy.typeDef.superArmor && enemy.aiState === 'windup')) {
      const kb = knockback * (1 / (enemy.body.mass || 1));
      enemy.body.setVelocity(
        Math.cos(knockAngle) * kb * 5,
        Math.sin(knockAngle) * kb * 5
      );
      // Interrupt windup
      if (enemy.aiState === 'windup') {
        enemy.aiState = 'approach';
        if (enemy.windupCircle) { enemy.windupCircle.destroy(); enemy.windupCircle = null; }
      }
    }

    // Damage text
    const col = isCrit ? '#f1c40f' : '#ffffff';
    const txt = isCrit ? `${finalDmg}!` : `${finalDmg}`;
    this.floatText(enemy.x + Phaser.Math.Between(-15, 15), enemy.y - 30, txt, col);

    // Flash
    enemy.setTint(0xff0000);
    this.time.delayedCall(100, () => { if (enemy.active) enemy.clearTint(); });

    // Combo
    this.combo++;
    this.comboTimer = 3;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    // Life steal
    const p = this.player;
    if (p.lifeSteal > 0) {
      const heal = finalDmg * p.lifeSteal;
      p.hp = Math.min(p.maxHp, p.hp + heal);
    }

    // Hit stop for crits
    if (isCrit) { this.hitStopTimer = 0.03; SFX.critHit(); } else { SFX.hit(); }

    // Kill
    if (enemy.hp <= 0) this._killEnemy(enemy);
  }

  _killEnemy(enemy) {

    enemy.isDead = true;
    this.kills++;
    SFX.kill();

    // Clean up HP bar
    if (enemy.hpBar) { enemy.hpBar.destroy(); enemy.hpBarFill.destroy(); }
    if (enemy.windupCircle) { enemy.windupCircle.destroy(); }

    // Boss death
    if (enemy.isBoss) {
      this.bossAlive = false;
      this.currentBoss = null;
      this.cameras.main.shake(500, 0.02);
    }

    // XP orb
    this._spawnXPOrb(enemy.x, enemy.y, enemy.typeDef.xp);

    // Drop chance
    const dropMul = enemy.isBoss ? 5 : 1;
    for (const dt of DROP_TYPES) {
      if (Math.random() < dt.chance * dropMul) {
        this._spawnDrop(enemy.x, enemy.y, dt);
        break;
      }
    }

    // Death particles
    this.fxKillBurst(enemy.x, enemy.y, enemy.typeDef.color || 0xffffff);

    enemy.destroy();
  }

  // ── XP ORB ──────────────────────────────────────────────────
  _spawnXPOrb(x, y, value) {
    const orb = this.add.circle(x + Phaser.Math.Between(-20, 20), y + Phaser.Math.Between(-20, 20), 8, 0x3498db, 0.8).setDepth(4);
    this.physics.add.existing(orb);
    orb.body.setCircle(8);
    orb.xpValue = value;
    this.xpOrbs.add(orb);
    // Auto-destroy after 15s
    this.time.delayedCall(15000, () => { if (orb.active) orb.destroy(); });
  }

  _grantXP(amount) {
    const p = this.player;
    p.xp += amount;
    while (p.xp >= p.xpToNext) {
      p.xp -= p.xpToNext;
      p.level++;
      p.xpToNext = Math.floor(120 + p.level * 40);
      this._showUpgrade();
      SFX.levelUp();
    }
  }

  // ── DROP ITEM ───────────────────────────────────────────────
  _spawnDrop(x, y, dropDef) {
    const drop = this.add.circle(x, y, 14, dropDef.color, 0.9).setDepth(5);
    this.physics.add.existing(drop);
    drop.body.setCircle(14);
    drop.dropDef = dropDef;
    this.drops.add(drop);
    // Pulsing animation
    this.tweens.add({ targets: drop, scale: 1.3, yoyo: true, repeat: -1, duration: 500 });
    // Auto-destroy after 20s
    this.time.delayedCall(20000, () => { if (drop.active) drop.destroy(); });
  }

  // ================================================================
  //  VISUAL EFFECTS
  // ================================================================
  floatText(x, y, text, color) {
    const t = this.add.text(x, y, text, {
      fontSize: '22px', color, fontFamily: 'system-ui', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  fxPulse(x, y, color) {
    const c = this.add.circle(x, y, 20, color, 0.5).setDepth(20);
    this.tweens.add({ targets: c, scale: 3, alpha: 0, duration: 400, onComplete: () => c.destroy() });
  }

  fxKillBurst(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const p = this.add.circle(x, y, 5, color, 0.8).setDepth(20);
      this.tweens.add({
        targets: p, x: x + Math.cos(a) * 60, y: y + Math.sin(a) * 60,
        alpha: 0, scale: 0.2, duration: 400, onComplete: () => p.destroy(),
      });
    }
  }

  fxExplosion(x, y) {
    const c = this.add.circle(x, y, 30, 0xe74c3c, 0.6).setDepth(20);
    this.tweens.add({ targets: c, scale: 8, alpha: 0, duration: 600, onComplete: () => c.destroy() });
  }


  // ================================================================
  //  SKILLS — dispatched by character
  // ================================================================
  doSkill1() {
    const p = this.player;
    if (p.skill1CD > 0 || this.isPaused || this.gameOver) return;
    const cd = CHARACTERS[this.charIndex].skill1.cd * p.cdMul;
    p.skill1CD = cd;
    SFX.skill();

    switch (p.charDef.id) {
      case 'lebron': this._lebronSkill1(); break;
      case 'kobe':   this._kobeSkill1();   break;
      case 'curry':  this._currySkill1();  break;
    }
  }

  doSkill2() {
    const p = this.player;
    if (p.skill2CD > 0 || this.isPaused || this.gameOver) return;
    const cd = CHARACTERS[this.charIndex].skill2.cd * p.cdMul;
    p.skill2CD = cd;
    SFX.skill();

    switch (p.charDef.id) {
      case 'lebron': this._lebronSkill2(); break;
      case 'kobe':   this._kobeSkill2();   break;
      case 'curry':  this._currySkill2();  break;
    }
  }

  doSkill3() {
    const p = this.player;
    if (p.skill3CD > 0 || this.isPaused || this.gameOver) return;
    const cd = CHARACTERS[this.charIndex].skill3.cd * p.cdMul;
    p.skill3CD = cd;
    SFX.skill();

    switch (p.charDef.id) {
      case 'lebron': this._lebronSkill3(); break;
      case 'kobe':   this._kobeSkill3();   break;
      case 'curry':  this._currySkill3();  break;
    }
  }

  doUlt() {
    const p = this.player;
    if (p.ultCD > 0 || this.isPaused || this.gameOver) return;
    const cd = CHARACTERS[this.charIndex].ult.cd * p.cdMul;
    p.ultCD = cd;
    SFX.ultimate();
    this.cameras.main.shake(400, 0.015);

    switch (p.charDef.id) {
      case 'lebron': this._lebronUlt(); break;
      case 'kobe':   this._kobeUlt();   break;
      case 'curry':  this._curryUlt();  break;
    }
  }

  // ── LEBRON SKILLS ───────────────────────────────────────────

  /** Skill 1: The Block — fan-shaped swat that destroys all airborne balls in range */
  _lebronSkill1() {
    const p = this.player;
    const range = 200 * (p.blockRange || 1);
    const angle = Math.atan2(p.face === 1 ? 0 : 0, p.face);

    // Visual: fan-shaped swipe
    const arc = this.add.graphics().setDepth(20);
    arc.fillStyle(0x3498db, 0.4);
    arc.slice(p.x, p.y, range, angle - Math.PI / 3, angle + Math.PI / 3, false);
    arc.fillPath();
    this.tweens.add({ targets: arc, alpha: 0, duration: 400, onComplete: () => arc.destroy() });

    // Destroy all enemy balls in range
    let blocked = 0;
    this.enemyBalls.getChildren().forEach(ball => {
      if (!ball.active) return;
      const d = Phaser.Math.Distance.Between(p.x, p.y, ball.x, ball.y);
      if (d < range) {
        const a = Math.atan2(ball.y - p.y, ball.x - p.x);
        const angleDiff = Phaser.Math.Angle.Wrap(a - angle);
        if (Math.abs(angleDiff) < Math.PI / 3) {
          this.floatText(ball.x, ball.y - 20, 'BLOCKED!', '#3498db');
          if (ball._trail) ball._trail.destroy();
          ball.destroy();
          blocked++;
        }
      }
    });

    // Also damage enemies in the fan
    const dmg = p.atk * p.atkMul * 2;
    this.enemies.getChildren().forEach(e => {
      if (!e.active || e.isDead) return;
      const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y);
      if (d < range) {
        const a = Math.atan2(e.y - p.y, e.x - p.x);
        const angleDiff = Phaser.Math.Angle.Wrap(a - angle);
        if (Math.abs(angleDiff) < Math.PI / 3) {
          this.damageEnemy(e, dmg, false, 200, a);
        }
      }
    });

    this.blocks += blocked;
    if (blocked > 0) this._grantXP(blocked * 15);
  }

  /** Skill 2: And One — unstoppable charge that knocks back all enemies */
  _lebronSkill2() {
    const p = this.player;
    const dir = p.face;
    const chargeSpeed = 800;
    const chargeDist = 300;
    const dmg = p.atk * p.atkMul * 3;

    p.invTimer = 0.5;
    const startX = p.x;
    const hitEnemies = new Set();

    // Charge tween
    this.tweens.add({
      targets: p, x: p.x + dir * chargeDist, duration: 300, ease: 'Quad.easeOut',
      onUpdate: () => {
        // Trail
        const trail = this.add.circle(p.x, p.y, 20, 0xf1c40f, 0.4).setDepth(8);
        this.tweens.add({ targets: trail, alpha: 0, scale: 0.3, duration: 300, onComplete: () => trail.destroy() });

        // Hit enemies along the path
        this.enemies.getChildren().forEach(e => {
          if (!e.active || e.isDead || hitEnemies.has(e)) return;
          const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y);
          if (d < 80) {
            const a = Math.atan2(e.y - p.y, e.x - p.x);
            this.damageEnemy(e, dmg, false, 400, a);
            hitEnemies.add(e);
          }
        });
      },
    });
  }

  /** Skill 3: Earthquake — AOE slam that stuns all nearby enemies for 2s */
  _lebronSkill3() {
    const p = this.player;
    const range = 250;
    const dmg = p.atk * p.atkMul * 2.5;

    // Visual: expanding shockwave
    const wave = this.add.circle(p.x, p.y, 30, 0xe74c3c, 0.5).setDepth(20);
    this.tweens.add({ targets: wave, scale: range / 30, alpha: 0, duration: 500, onComplete: () => wave.destroy() });

    this.cameras.main.shake(300, 0.02);

    this.enemies.getChildren().forEach(e => {
      if (!e.active || e.isDead) return;
      const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y);
      if (d < range) {
        const a = Math.atan2(e.y - p.y, e.x - p.x);
        this.damageEnemy(e, dmg, false, 150, a);
        e.stunTimer = 2;
        e.body.setVelocity(0, 0);
        // Interrupt windup
        if (e.aiState === 'windup') {
          e.aiState = 'approach';
          if (e.windupCircle) { e.windupCircle.destroy(); e.windupCircle = null; }
        }
        // Stun visual
        const star = this.add.text(e.x, e.y - 40, '★', { fontSize: '20px', color: '#f1c40f' }).setOrigin(0.5).setDepth(25);
        this.tweens.add({ targets: star, alpha: 0, y: e.y - 60, duration: 2000, onComplete: () => star.destroy() });
      }
    });

    // Also destroy nearby enemy balls
    this.enemyBalls.getChildren().forEach(ball => {
      if (!ball.active) return;
      const d = Phaser.Math.Distance.Between(p.x, p.y, ball.x, ball.y);
      if (d < range) {
        this.blocks++;
        if (ball._trail) ball._trail.destroy();
        ball.destroy();
      }
    });
  }

  /** Ultimate: King's Domain — force field: enemies slowed 50%, +50% damage reduction for 8s */
  _lebronUlt() {
    const p = this.player;
    p.kingDomain = 8;

    // Visual: golden aura
    const aura = this.add.circle(p.x, p.y, 300, 0xf1c40f, 0.15).setDepth(3);
    const auraEdge = this.add.circle(p.x, p.y, 300, 0xf1c40f, 0).setDepth(3).setStrokeStyle(3, 0xf1c40f, 0.6);
    this.floatText(p.x, p.y - 80, "KING'S DOMAIN!", '#f1c40f');

    // Follow player and fade
    const timer = this.time.addEvent({
      delay: 50, repeat: 160, callback: () => {
        if (!p.active || this.gameOver) { aura.destroy(); auraEdge.destroy(); timer.remove(); return; }
        aura.setPosition(p.x, p.y);
        auraEdge.setPosition(p.x, p.y);
        if (p.kingDomain <= 0) { aura.destroy(); auraEdge.destroy(); timer.remove(); }
      },
    });
  }

  // ── KOBE SKILLS ─────────────────────────────────────────────

  /** Skill 1: Fadeaway — dash backward, fire 3 piercing shots forward */
  _kobeSkill1() {
    const p = this.player;
    const dir = p.face;
    const dmg = p.atk * p.atkMul * 2;

    // Dash backward
    this.tweens.add({ targets: p, x: p.x - dir * 150, duration: 200, ease: 'Quad.easeOut' });

    // Fire 3 shots forward with spread
    this.time.delayedCall(150, () => {
      for (let i = -1; i <= 1; i++) {
        const angle = (dir > 0 ? 0 : Math.PI) + i * 0.2;
        this._fireProjectile(p.x, p.y, angle, dmg, 600, 400, true);
      }
    });
  }

  /** Skill 2: Viper Strike — dash through enemies dealing massive damage + bleed */
  _kobeSkill2() {
    const p = this.player;
    const dir = p.face;
    const dmg = p.atk * p.atkMul * 4;
    const dashDist = 350;
    p.invTimer = 0.4;
    const hitEnemies = new Set();

    this.tweens.add({
      targets: p, x: p.x + dir * dashDist, duration: 250, ease: 'Quad.easeOut',
      onUpdate: () => {
        // Purple trail
        const trail = this.add.circle(p.x, p.y, 18, 0x9b59b6, 0.5).setDepth(8);
        this.tweens.add({ targets: trail, alpha: 0, scale: 0.2, duration: 300, onComplete: () => trail.destroy() });

        this.enemies.getChildren().forEach(e => {
          if (!e.active || e.isDead || hitEnemies.has(e)) return;
          const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y);
          if (d < 70) {
            const a = Math.atan2(e.y - p.y, e.x - p.x);
            this.damageEnemy(e, dmg, true, 100, a);
            hitEnemies.add(e);
            // Bleed: 3 ticks
            let ticks = 0;
            const bleed = this.time.addEvent({
              delay: 500, repeat: 2, callback: () => {
                if (e.active && !e.isDead) {
                  this.damageEnemy(e, dmg * 0.2, false, 0, 0);
                  this.floatText(e.x, e.y - 20, `${Math.floor(dmg * 0.2)}`, '#9b59b6');
                }
              },
            });
          }
        });
      },
    });
  }

  /** Skill 3: Lockdown — panic 3 nearest enemies: they stop shooting for 3s */
  _kobeSkill3() {
    const p = this.player;
    const range = 400;
    let count = 0;

    // Visual: dark wave
    const wave = this.add.circle(p.x, p.y, 30, 0x2c3e50, 0.5).setDepth(20);
    this.tweens.add({ targets: wave, scale: range / 30, alpha: 0, duration: 500, onComplete: () => wave.destroy() });

    const sorted = this.enemies.getChildren()
      .filter(e => e.active && !e.isDead)
      .sort((a, b) => Phaser.Math.Distance.Between(p.x, p.y, a.x, a.y) - Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y));

    for (const e of sorted) {
      if (count >= 3) break;
      const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y);
      if (d < range) {
        e.panicTimer = 3;
        e.body.setVelocity(0, 0);
        if (e.aiState === 'windup') {
          e.aiState = 'approach';
          if (e.windupCircle) { e.windupCircle.destroy(); e.windupCircle = null; }
        }
        // Panic visual
        const skull = this.add.text(e.x, e.y - 40, '!', { fontSize: '28px', color: '#e74c3c', fontStyle: 'bold' }).setOrigin(0.5).setDepth(25);
        this.tweens.add({ targets: skull, alpha: 0, y: e.y - 70, duration: 3000, onComplete: () => skull.destroy() });
        count++;
      }
    }
  }

  /** Ultimate: Mamba Mode — ATK +200%, SPD +50%, doubled range for 10s */
  _kobeUlt() {
    const p = this.player;
    p.mambaMode = 10;
    this.floatText(p.x, p.y - 80, 'MAMBA MODE!', '#9b59b6');

    // Purple aura
    const aura = this.add.circle(p.x, p.y, 60, 0x9b59b6, 0.3).setDepth(3);
    const timer = this.time.addEvent({
      delay: 50, repeat: 200, callback: () => {
        if (!p.active || this.gameOver) { aura.destroy(); timer.remove(); return; }
        aura.setPosition(p.x, p.y);
        // Afterimage
        if (Math.random() < 0.3) {
          const ghost = this.add.circle(p.x, p.y, 20, 0x9b59b6, 0.3).setDepth(2);
          this.tweens.add({ targets: ghost, alpha: 0, scale: 0.5, duration: 400, onComplete: () => ghost.destroy() });
        }
        if (p.mambaMode <= 0) { aura.destroy(); timer.remove(); }
      },
    });
  }

  // ── CURRY SKILLS ────────────────────────────────────────────

  /** Skill 1: Splash Bomb — throw an exploding ball: AOE damage + destroys enemy balls */
  _currySkill1() {
    const p = this.player;
    const nearest = this._nearestEnemy(p.x, p.y, 500);
    const targetX = nearest ? nearest.x : p.x + p.face * 250;
    const targetY = nearest ? nearest.y : p.y;
    const dmg = p.atk * p.atkMul * 3;
    const explodeRadius = 180;

    // Bomb projectile
    const bomb = this.add.circle(p.x, p.y, 14, 0x3498db, 1).setDepth(15);
    this.tweens.add({
      targets: bomb, x: targetX, y: targetY, duration: 400, ease: 'Quad.easeIn',
      onComplete: () => {
        // Explosion
        this.fxExplosion(bomb.x, bomb.y);
        this.cameras.main.shake(200, 0.01);

        // Damage enemies
        this.enemies.getChildren().forEach(e => {
          if (!e.active || e.isDead) return;
          const d = Phaser.Math.Distance.Between(bomb.x, bomb.y, e.x, e.y);
          if (d < explodeRadius) {
            const a = Math.atan2(e.y - bomb.y, e.x - bomb.x);
            this.damageEnemy(e, dmg, false, 200, a);
          }
        });

        // Destroy enemy balls in radius
        this.enemyBalls.getChildren().forEach(ball => {
          if (!ball.active) return;
          const d = Phaser.Math.Distance.Between(bomb.x, bomb.y, ball.x, ball.y);
          if (d < explodeRadius) {
            this.blocks++;
            if (ball._trail) ball._trail.destroy();
            ball.destroy();
          }
        });

        bomb.destroy();
      },
    });
  }

  /** Skill 2: Crossover — 360-degree bullet ring that pushes enemies back */
  _currySkill2() {
    const p = this.player;
    const dmg = p.atk * p.atkMul * 1.5;
    const count = 12;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      this._fireProjectile(p.x, p.y, angle, dmg, 400, 350, false, 200);
    }

    // Visual ring
    const ring = this.add.circle(p.x, p.y, 30, 0x3498db, 0.3).setDepth(20);
    this.tweens.add({ targets: ring, scale: 12, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
  }

  /** Skill 3: Pick & Roll — summon a blocking phantom wall for 5s */
  _currySkill3() {
    const p = this.player;
    const wallX = p.x + p.face * 100;
    const wallY = p.y;

    // Create 3 wall segments
    const segments = [];
    for (let i = -1; i <= 1; i++) {
      const seg = this.add.rectangle(wallX, wallY + i * 60, 40, 50, 0x3498db, 0.5).setDepth(6);
      this.physics.add.existing(seg, true); // static body
      seg.body.setSize(40, 50);
      // Collide with enemies and enemy balls
      this.physics.add.collider(this.enemies, seg);
      this.physics.add.overlap(this.enemyBalls, seg, (ball) => {
        if (!ball.active) return;
        this.blocks++;
        this.floatText(ball.x, ball.y - 20, 'BLOCKED!', '#3498db');
        if (ball._trail) ball._trail.destroy();
        ball.destroy();
      });
      segments.push(seg);
    }

    this.floatText(wallX, wallY - 60, 'WALL!', '#3498db');

    // Destroy after 5s
    this.time.delayedCall(5000, () => {
      segments.forEach(s => { if (s.active) s.destroy(); });
    });
  }

  /** Ultimate: Night Night — bullet-time: enemies and balls slow to 20% for 6s */
  _curryUlt() {
    const p = this.player;
    p.nightNight = 6;
    this.floatText(p.x, p.y - 80, 'NIGHT NIGHT!', '#3498db');

    // Blue tint overlay
    const overlay = this.add.rectangle(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 0x000033, 0.2).setDepth(1);

    const timer = this.time.addEvent({
      delay: 50, repeat: 120, callback: () => {
        if (!p.active || this.gameOver || p.nightNight <= 0) {
          overlay.destroy();
          timer.remove();
        }
      },
    });
  }

  // ── HELPER: Fire a projectile ───────────────────────────────
  _fireProjectile(x, y, angle, dmg, speed, range, piercing, knockback) {
    const proj = this.physics.add.image(x, y, '__DEFAULT').setVisible(false);
    proj.body.setCircle(8);
    proj.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    proj.dmg = dmg;
    proj.isCrit = Math.random() < this.player.critRate;
    if (proj.isCrit) proj.dmg *= this.player.critDmg;
    proj.knockback = knockback || 100;
    proj.knockAngle = angle;
    proj.piercing = piercing || false;
    this.playerProjectiles.add(proj);

    // Visual
    const trail = this.add.circle(x, y, 6, this.player.charDef.projCol, 0.8).setDepth(8);
    this.tweens.add({
      targets: trail, x: x + Math.cos(angle) * range, y: y + Math.sin(angle) * range,
      alpha: 0, duration: (range / speed) * 1000, onComplete: () => trail.destroy(),
    });

    this.time.delayedCall((range / speed) * 1000, () => { if (proj.active) proj.destroy(); });

    // For piercing projectiles, don't destroy on first hit
    if (piercing) {
      // Override the overlap handler to not destroy
      proj._piercing = true;
    }
    return proj;
  }


  // ================================================================
  //  UPGRADE SYSTEM
  // ================================================================
  _showUpgrade() {
    this.isPaused = true;
    this.physics.pause();
    this.input.enabled = false;

    const overlay = document.getElementById('upgrade-overlay');
    overlay.style.display = 'flex';
    // Prevent touch events from leaking to Phaser canvas
    overlay.addEventListener('touchstart', e => e.stopPropagation(), { passive: false });
    overlay.addEventListener('touchmove', e => e.stopPropagation(), { passive: false });
    overlay.addEventListener('touchend', e => e.stopPropagation(), { passive: false });
    document.getElementById('upgrade-level').textContent = this.player.level;

    const cardsEl = document.getElementById('upgrade-cards');
    cardsEl.innerHTML = '';

    // Pick 3 random upgrades
    const pool = [...UPGRADES];
    const picks = [];
    for (let i = 0; i < 3 && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(idx, 1)[0]);
    }

    const resumeGame = () => {
      overlay.style.display = 'none';
      setTimeout(() => {
        this.input.enabled = true;
        this.isPaused = false;
        this.physics.resume();
      }, 100);
    };

    picks.forEach(upg => {
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = `<h3>${upg.name}</h3><p>${upg.desc}</p>`;
      card.addEventListener('click', () => {
        upg.fn(this.player, this);
        resumeGame();
      });
      card.addEventListener('touchend', e => {
        e.preventDefault();
        e.stopPropagation();
        upg.fn(this.player, this);
        resumeGame();
      }, { passive: false });
      cardsEl.appendChild(card);
    });
  }

  // ================================================================
  //  HUD UPDATE
  // ================================================================
  _updateHUD() {
    const p = this.player;
    this.hpText.setText(`HP: ${Math.floor(p.hp)}/${Math.floor(p.maxHp)}`);
    this.levelText.setText(`Lv.${p.level}`);
    this.killText.setText(`Kills: ${this.kills}`);
    this.timeText.setText(`${Math.floor(this.gameTime)}s`);
    this.blockText.setText(`Blocks: ${this.blocks}`);

    // Combo
    if (this.combo > 1) {
      this.comboText.setText(`${this.combo}x COMBO`);
      this.comboText.setAlpha(1);
    } else {
      this.comboText.setAlpha(0);
    }

    // Boss timer
    if (!this.bossAlive) {
      this.bossTimerText.setText(`Boss in ${Math.max(0, Math.floor(this.bossTimer))}s`);
    } else {
      this.bossTimerText.setText('BOSS ACTIVE!');
    }

    // HP bar
    const hpRatio = Math.max(0, p.hp / p.maxHp);
    this.hpBar.displayWidth = 250 * hpRatio;
    this.hpBar.setFillStyle(hpRatio > 0.5 ? 0x2ecc71 : hpRatio > 0.25 ? 0xf39c12 : 0xe74c3c);

    // XP bar
    const xpRatio = p.xp / p.xpToNext;
    this.xpBar.displayWidth = 250 * xpRatio;

    // Hoop HUD
    const hoopRatio = Math.max(0, this.hoop.hp / this.hoop.maxHp);
    document.getElementById('hoop-bar').style.width = (hoopRatio * 100) + '%';
    document.getElementById('hoop-hp-text').textContent = `${Math.floor(this.hoop.hp)} / ${this.hoop.maxHp}`;
    if (hoopRatio < 0.3) {
      document.getElementById('hoop-bar').style.background = 'linear-gradient(90deg,#e74c3c,#c0392b)';
    } else if (hoopRatio < 0.6) {
      document.getElementById('hoop-bar').style.background = 'linear-gradient(90deg,#f39c12,#e67e22)';
    } else {
      document.getElementById('hoop-bar').style.background = 'linear-gradient(90deg,#3498db,#2ecc71)';
    }
  }

  // ── COOLDOWN OVERLAYS ───────────────────────────────────────
  _updateCooldownOverlays() {
    const p = this.player;
    const ch = CHARACTERS[this.charIndex];
    this._updateCDOverlay('btn-skill1', p.skill1CD, ch.skill1.cd * p.cdMul);
    this._updateCDOverlay('btn-skill2', p.skill2CD, ch.skill2.cd * p.cdMul);
    this._updateCDOverlay('btn-skill3', p.skill3CD, ch.skill3.cd * p.cdMul);
    this._updateCDOverlay('btn-ult',    p.ultCD,    ch.ult.cd * p.cdMul);
  }

  _updateCDOverlay(btnId, remaining, total) {
    const el = document.getElementById(btnId);
    if (!el) return;
    let overlay = el.querySelector('.cd-overlay');
    if (remaining > 0) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'cd-overlay';
        el.appendChild(overlay);
      }
      overlay.textContent = Math.ceil(remaining) + 's';
      overlay.style.display = 'flex';
    } else {
      if (overlay) overlay.style.display = 'none';
    }
  }

  // ================================================================
  //  GAME OVER
  // ================================================================
  _gameOver(reason) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();

    // Hide buttons
    ['btn-skill1', 'btn-skill2', 'btn-skill3', 'btn-ult'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    document.getElementById('hoop-hud').style.display = 'none';

    const stats = {
      time: Math.floor(this.gameTime),
      kills: this.kills,
      combo: this.maxCombo,
      level: this.player.level,
      blocks: this.blocks,
    };

    const isNewRecord = Records.save(stats);
    const best = Records.get();

    // Show overlay
    const overlay = document.getElementById('gameover-overlay');
    overlay.style.display = 'flex';

    const reasonText = reason === 'hoop' ? 'The hoop was destroyed!' : 'You were defeated!';
    document.getElementById('go-stats').innerHTML =
      `${reasonText}<br>` +
      `Time: ${stats.time}s | Kills: ${stats.kills} | Blocks: ${stats.blocks}<br>` +
      `Max Combo: ${stats.combo}x | Level: ${stats.level}`;

    document.getElementById('go-best').innerHTML =
      `Best: ${best.bestTime}s | ${best.bestKills} kills | ${best.bestBlocks} blocks | Lv.${best.bestLevel}`;

    document.getElementById('go-newrecord').style.display = isNewRecord ? 'block' : 'none';

    document.getElementById('go-restart').onclick = () => {
      overlay.style.display = 'none';
      this.scene.restart({ charIndex: this.charIndex });
    };
  }
}

// ================================================================
//  SECTION 12 — PHASER CONFIG & LAUNCH
// ================================================================
async function launchGame() {
  await preCalculateSpriteDimensions();

  const config = {
    type: Phaser.AUTO,
    width: GW,
    height: GH,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    scene: [BootScene, MenuScene, GameScene],
  };

  window._phaserGame = new Phaser.Game(config);
}

launchGame();

export const VIEWPORT = {
  width: 1280,
  height: 720,
} as const;

export const WORLD = {
  width: 1600,
  height: 900,
  centerX: 800,
  centerY: 450,
} as const;

export const HOOP = {
  radius: 58,
  bodyRadius: 46,
  maxHp: 100,
} as const;

export const PLAYER_BASE = {
  maxHp: 320,
  speed: 285,
  radius: 25,
  damage: 34,
  attackRange: 145,
  attackArc: Math.PI * 0.72,
  attackCooldown: 0.46,
  maxHype: 100,
} as const;

export const COLORS = {
  ink: 0x080b12,
  cream: 0xf7f1df,
  orange: 0xff5a1f,
  gold: 0xffc43d,
  cyan: 0x48d8ff,
  lime: 0xc8ff43,
  red: 0xff3b55,
  purple: 0x9b6dff,
} as const;

/* ================================================================
 *  enemies.js — Enemy type definitions and boss template
 *
 *  Enemy AI state machine:
 *    APPROACH → WINDUP → SHOOT → COOLDOWN → (repeat)
 *
 *  Each type defines:
 *    shootRange  – distance from hoop at which the enemy stops to shoot
 *    windupTime  – seconds of shooting preparation (interruptible)
 *    ballSpeed   – speed of the thrown basketball projectile (px/s)
 *    accuracy    – probability that the ball actually scores (0–1)
 *    scoreDmg    – damage dealt to the hoop on a successful score
 * ================================================================ */

const ENEMY_TYPES = [
  {
    id: 'fan',
    name: 'Rookie',
    hp: 22, atk: 8, spd: 120, bodyRadius: 22, xp: 10, weight: 50,
    shootRange: 100, windupTime: 0.6, ballSpeed: 350, accuracy: 0.75, scoreDmg: 2,
    color: 0x7f8c8d,
  },
  {
    id: 'ref',
    name: 'Mid-Range Vet',
    hp: 38, atk: 10, spd: 90, bodyRadius: 24, xp: 18, weight: 25,
    shootRange: 280, windupTime: 0.8, ballSpeed: 300, accuracy: 0.65, scoreDmg: 2,
    color: 0x2c3e50,
  },
  {
    id: 'press',
    name: 'Sharpshooter',
    hp: 28, atk: 12, spd: 80, bodyRadius: 22, xp: 22, weight: 15,
    shootRange: 480, windupTime: 1.2, ballSpeed: 240, accuracy: 0.45, scoreDmg: 3,
    color: 0xc0392b,
  },
  {
    id: 'rival',
    name: 'Power Center',
    hp: 100, atk: 18, spd: 50, bodyRadius: 32, xp: 40, weight: 10,
    shootRange: 80, windupTime: 1.0, ballSpeed: 450, accuracy: 1.0, scoreDmg: 5,
    superArmor: true,   // cannot be interrupted during windup
    color: 0xe74c3c,
  },
];

const BOSS_TYPE = {
  id: 'boss',
  name: 'All-Star MVP',
  hp: 2000, atk: 35, spd: 55, bodyRadius: 48, xp: 300,
  shootRange: 120, windupTime: 1.0, ballSpeed: 380, accuracy: 1.0, scoreDmg: 8,
  superArmor: true, isBoss: true,
  color: 0xff0000,
};

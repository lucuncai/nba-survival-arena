/* ================================================================
 *  drops.js — Drop item definitions
 *
 *  Each drop has:
 *    id      – unique identifier
 *    name    – display name
 *    color   – hex color for the orb visual
 *    emoji   – single-char label
 *    chance  – base drop probability per kill
 *    effect  – function(scene) that applies the pickup effect
 * ================================================================ */

const DROP_TYPES = [
  {
    id: 'heal',
    name: 'Gatorade',
    color: 0x2ecc71, emoji: '+',
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
    id: 'speed',
    name: 'Lightning Shoes',
    color: 0xf1c40f, emoji: 'S',
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
    id: 'bomb',
    name: 'Bomb Ball',
    color: 0xe74c3c, emoji: 'B',
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
    id: 'repair',
    name: 'Repair Kit',
    color: 0x3498db, emoji: 'R',
    chance: 0.03,
    effect(scene) {
      const heal = 15;
      scene.hoop.hp = Math.min(scene.hoop.hp + heal, scene.hoop.maxHp);
      scene.floatText(COURT_CX, COURT_CY - 80, `HOOP +${heal}`, '#3498db');
      scene.fxPulse(COURT_CX, COURT_CY, 0x3498db);
    },
  },
];

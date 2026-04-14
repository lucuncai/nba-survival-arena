/* ================================================================
 *  upgrades.js — Level-up upgrade pool
 *
 *  Each upgrade has:
 *    name  – display name
 *    cat   – category ('combat' | 'hoop')
 *    desc  – tooltip description
 *    fn    – mutator function (player, scene) => void
 * ================================================================ */

const UPGRADES = [
  // ── Combat upgrades ──
  { name: 'ATK +15%',       cat: 'combat', desc: 'Increase all damage',             fn: p => { p.atkMul *= 1.15; } },
  { name: 'ATK SPD +12%',   cat: 'combat', desc: 'Attack faster',                   fn: p => { p.atkSpd *= 1.12; } },
  { name: 'Move SPD +10%',  cat: 'combat', desc: 'Move faster',                     fn: p => { p.spdMul *= 1.1; } },
  { name: 'Max HP +20%',    cat: 'combat', desc: 'More health',                     fn: p => { p.maxHp *= 1.2; p.hp = Math.min(p.hp + 50, p.maxHp); } },
  { name: 'Crit Rate +8%',  cat: 'combat', desc: 'Higher crit chance',              fn: p => { p.critRate += 0.08; } },
  { name: 'Crit DMG +25%',  cat: 'combat', desc: 'Bigger crits',                    fn: p => { p.critDmg += 0.25; } },
  { name: 'Life Steal +3%', cat: 'combat', desc: 'Heal on hit',                     fn: p => { p.lifeSteal += 0.03; } },
  { name: 'Skill CD -15%',  cat: 'combat', desc: 'Shorter cooldowns',               fn: p => { p.cdMul *= 0.85; } },
  { name: 'Range +20%',     cat: 'combat', desc: 'Longer attack reach',             fn: p => { p.rangeMul *= 1.2; } },

  // ── Hoop defense upgrades ──
  { name: 'Hoop +20 HP',      cat: 'hoop', desc: 'Reinforce the hoop',              fn: (p, s) => { s.hoop.maxHp += 20; s.hoop.hp = Math.min(s.hoop.hp + 20, s.hoop.maxHp); } },
  { name: 'Hoop Repair 30',   cat: 'hoop', desc: 'Instantly repair hoop',           fn: (p, s) => { s.hoop.hp = Math.min(s.hoop.hp + 30, s.hoop.maxHp); } },
  { name: 'Block Range +25%', cat: 'hoop', desc: 'Easier to intercept balls',       fn: p => { p.blockRange = (p.blockRange || 1) * 1.25; } },
  { name: 'Body Mass +30%',   cat: 'hoop', desc: 'Harder to push, stronger knockback', fn: p => { p.mass = (p.mass || 1) * 1.3; } },
];

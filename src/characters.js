/* ================================================================
 *  characters.js — Playable character definitions (3 skills + 1 ult)
 * ================================================================ */

const CHARACTERS = [
  {
    id: 'lebron',
    name: 'LeBron James',
    role: 'Paint Guardian',
    roleDesc: 'Dominates the paint with power and control',
    hp: 350, atk: 55, spd: 210, atkSpd: 2.5, atkRange: 180,
    projCol: 0xf1c40f, bodyRadius: 26,
    skill1: { name: 'The Block',      cd: 4,  desc: 'Fan-shaped swat that destroys all airborne balls in range' },
    skill2: { name: 'And One',        cd: 7,  desc: 'Unstoppable charge that knocks back all enemies' },
    skill3: { name: 'Earthquake',     cd: 10, desc: 'AOE slam that stuns all nearby enemies for 2s' },
    ult:    { name: "King's Domain",  cd: 35, desc: 'Creates a force field: enemies slowed 50%, +50% damage reduction for 8s' },
  },
  {
    id: 'kobe',
    name: 'Kobe Bryant',
    role: 'Perimeter Assassin',
    roleDesc: 'High mobility, picks off shooters with precision',
    hp: 280, atk: 60, spd: 230, atkSpd: 2.2, atkRange: 160,
    projCol: 0x9b59b6, bodyRadius: 24,
    skill1: { name: 'Fadeaway',   cd: 4,  desc: 'Dash backward, fire 3 piercing shots forward' },
    skill2: { name: 'Viper Strike', cd: 7, desc: 'Dash through enemies dealing massive damage + bleed' },
    skill3: { name: 'Lockdown',  cd: 12, desc: 'Panic 3 nearest enemies: they stop shooting for 3s' },
    ult:    { name: 'Mamba Mode', cd: 35, desc: 'ATK +200%, SPD +50%, doubled projectile range for 10s' },
  },
  {
    id: 'curry',
    name: 'Stephen Curry',
    role: 'Zone Controller',
    roleDesc: 'Blankets the court with ranged firepower',
    hp: 200, atk: 48, spd: 220, atkSpd: 2.0, atkRange: 150,
    projCol: 0x3498db, bodyRadius: 22,
    skill1: { name: 'Splash Bomb', cd: 5,  desc: 'Throw an exploding ball: AOE damage + destroys enemy balls' },
    skill2: { name: 'Crossover',   cd: 7,  desc: '360-degree bullet ring that pushes enemies back' },
    skill3: { name: 'Pick & Roll', cd: 14, desc: 'Summon a blocking phantom wall for 5s' },
    ult:    { name: 'Night Night',  cd: 35, desc: 'Bullet-time: enemies and balls slow to 20% for 6s' },
  },
];

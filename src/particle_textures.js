/* ================================================================
 *  particle_textures.js — Procedural Particle Textures
 *
 *  4 reusable particle textures for street basketball style:
 *    1. 'particle_glow'  — Warm soft glow (auras, energy, healing)
 *    2. 'particle_spark' — Hard spark with 4-ray star (impacts, crits)
 *    3. 'particle_smoke' — Dusty smoke puff (explosions, trails)
 *    4. 'particle_ring'  — Ring/halo for shockwaves, skill activations
 *
 *  All white-based so they can be tinted to any color via Phaser.
 *  Slightly warmer/softer falloff than neon version for street feel.
 *  Called from generateArenaTextures() in arena_background.js
 * ================================================================ */

function _generateParticleTextures(scene) {
  _genParticleGlow(scene);
  _genParticleSpark(scene);
  _genParticleSmoke(scene);
  _genParticleRing(scene);
}

/* ----------------------------------------------------------------
 *  1. SOFT GLOW — warm center, gentle falloff
 * ---------------------------------------------------------------- */
function _genParticleGlow(scene) {
  const S = 64;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');

  const g = ctx.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2);
  g.addColorStop(0, 'rgba(255,255,240,1.0)');
  g.addColorStop(0.15, 'rgba(255,255,235,0.8)');
  g.addColorStop(0.35, 'rgba(255,250,230,0.4)');
  g.addColorStop(0.6, 'rgba(255,245,220,0.12)');
  g.addColorStop(1.0, 'rgba(255,240,210,0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);

  scene.textures.addCanvas('particle_glow', c);
}

/* ----------------------------------------------------------------
 *  2. HARD SPARK — bright core with 4-ray star burst
 * ---------------------------------------------------------------- */
function _genParticleSpark(scene) {
  const S = 32;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  const cx = S/2, cy = S/2;

  // Bright core
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, S*0.15);
  core.addColorStop(0, 'rgba(255,255,240,1.0)');
  core.addColorStop(0.5, 'rgba(255,255,230,0.7)');
  core.addColorStop(1, 'rgba(255,250,220,0.0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, S, S);

  // 4-point star rays
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const ray = ctx.createLinearGradient(0, 0, S * 0.45, 0);
    ray.addColorStop(0, 'rgba(255,255,240,0.8)');
    ray.addColorStop(0.3, 'rgba(255,250,230,0.4)');
    ray.addColorStop(0.7, 'rgba(255,245,220,0.1)');
    ray.addColorStop(1, 'rgba(255,240,210,0.0)');
    ctx.fillStyle = ray;
    ctx.fillRect(0, -1.5, S * 0.45, 3);

    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';

  scene.textures.addCanvas('particle_spark', c);
}

/* ----------------------------------------------------------------
 *  3. SMOKE PUFF — dusty, organic cloud shape
 * ---------------------------------------------------------------- */
function _genParticleSmoke(scene) {
  const S = 64;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  const cx = S/2, cy = S/2;

  const blobs = [
    { x: 0, y: 0, r: S * 0.35 },
    { x: -S*0.1, y: -S*0.08, r: S * 0.25 },
    { x: S*0.12, y: -S*0.05, r: S * 0.22 },
    { x: -S*0.05, y: S*0.1, r: S * 0.28 },
    { x: S*0.08, y: S*0.08, r: S * 0.20 },
  ];

  for (const blob of blobs) {
    const bx = cx + blob.x, by = cy + blob.y;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, blob.r);
    g.addColorStop(0, 'rgba(255,250,240,0.45)');
    g.addColorStop(0.3, 'rgba(255,245,235,0.25)');
    g.addColorStop(0.6, 'rgba(250,240,230,0.08)');
    g.addColorStop(1, 'rgba(245,235,225,0.0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(bx, by, blob.r, 0, Math.PI * 2);
    ctx.fill();
  }

  scene.textures.addCanvas('particle_smoke', c);
}

/* ----------------------------------------------------------------
 *  4. RING / HALO — for shockwaves and skill activations
 * ---------------------------------------------------------------- */
function _genParticleRing(scene) {
  const S = 64;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  const cx = S/2, cy = S/2;

  // Outer glow
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(255,250,240,0.2)';
  ctx.beginPath();
  ctx.arc(cx, cy, S * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  // Core ring
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,245,0.9)';
  ctx.beginPath();
  ctx.arc(cx, cy, S * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  // Inner glow
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(255,250,240,0.12)';
  ctx.beginPath();
  ctx.arc(cx, cy, S * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  scene.textures.addCanvas('particle_ring', c);
}

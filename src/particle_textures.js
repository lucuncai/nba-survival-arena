/* ================================================================
 *  particle_textures.js — NEON Procedural Particle Textures
 *
 *  Creates 4 reusable particle textures optimized for neon/cyberpunk:
 *    1. 'particle_glow'  — Bright soft glow (neon auras, energy)
 *    2. 'particle_spark' — Hard neon spark with star rays
 *    3. 'particle_smoke' — Electric smoke/plasma puff
 *    4. 'particle_ring'  — Neon ring/halo for shockwaves
 *
 *  All white-based so they can be tinted to any neon color via Phaser.
 *  Called from generateArenaTextures() in arena_background.js
 * ================================================================ */

function _generateParticleTextures(scene) {
  _genParticleGlow(scene);
  _genParticleSpark(scene);
  _genParticleSmoke(scene);
  _genParticleRing(scene);
}

/* ----------------------------------------------------------------
 *  1. SOFT GLOW — bright center, wide falloff for neon auras
 * ---------------------------------------------------------------- */
function _genParticleGlow(scene) {
  const S = 64;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');

  const g = ctx.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2);
  g.addColorStop(0, 'rgba(255,255,255,1.0)');
  g.addColorStop(0.1, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.5)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.15)');
  g.addColorStop(1.0, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);

  scene.textures.addCanvas('particle_glow', c);
}

/* ----------------------------------------------------------------
 *  2. HARD SPARK — bright core with 6-ray star burst
 * ---------------------------------------------------------------- */
function _genParticleSpark(scene) {
  const S = 48;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  const cx = S/2, cy = S/2;

  // Bright core
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, S*0.12);
  core.addColorStop(0, 'rgba(255,255,255,1.0)');
  core.addColorStop(0.6, 'rgba(255,255,255,0.8)');
  core.addColorStop(1, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, S, S);

  // 6-point star rays
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const ray = ctx.createLinearGradient(0, 0, S * 0.45, 0);
    ray.addColorStop(0, 'rgba(255,255,255,0.9)');
    ray.addColorStop(0.2, 'rgba(255,255,255,0.5)');
    ray.addColorStop(0.6, 'rgba(255,255,255,0.15)');
    ray.addColorStop(1, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = ray;
    ctx.fillRect(0, -1, S * 0.45, 2);

    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';

  scene.textures.addCanvas('particle_spark', c);
}

/* ----------------------------------------------------------------
 *  3. SMOKE PUFF — electric plasma cloud
 * ---------------------------------------------------------------- */
function _genParticleSmoke(scene) {
  const S = 64;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  const cx = S/2, cy = S/2;

  const blobs = [
    { x: 0, y: 0, r: S * 0.38 },
    { x: -S*0.12, y: -S*0.08, r: S * 0.28 },
    { x: S*0.14, y: -S*0.06, r: S * 0.26 },
    { x: -S*0.06, y: S*0.12, r: S * 0.30 },
    { x: S*0.10, y: S*0.10, r: S * 0.24 },
    { x: 0, y: -S*0.14, r: S * 0.20 },
  ];

  for (const blob of blobs) {
    const bx = cx + blob.x, by = cy + blob.y;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, blob.r);
    g.addColorStop(0, 'rgba(255,255,255,0.5)');
    g.addColorStop(0.3, 'rgba(255,255,255,0.3)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.1)');
    g.addColorStop(1, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(bx, by, blob.r, 0, Math.PI * 2);
    ctx.fill();
  }

  scene.textures.addCanvas('particle_smoke', c);
}

/* ----------------------------------------------------------------
 *  4. RING / HALO — crisp neon ring for shockwaves
 * ---------------------------------------------------------------- */
function _genParticleRing(scene) {
  const S = 64;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  const cx = S/2, cy = S/2;

  // Draw a bright ring
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255,255,255,1.0)';
  ctx.beginPath();
  ctx.arc(cx, cy, S * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  // Outer glow
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.arc(cx, cy, S * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  // Inner glow
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.arc(cx, cy, S * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  scene.textures.addCanvas('particle_ring', c);
}

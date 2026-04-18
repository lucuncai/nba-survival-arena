/* ================================================================
 *  particle_textures.js — Procedural Particle Textures
 *
 *  Creates 4 reusable tiny particle textures using Canvas:
 *    1. 'particle_glow'  — Soft radial glow (for auras, healing, energy)
 *    2. 'particle_spark' — Hard bright spark (for hits, impacts, crits)
 *    3. 'particle_smoke' — Soft smoke puff (for explosions, trails)
 *    4. 'particle_ring'  — Ring/halo shape (for shockwaves, skill activations)
 *
 *  All textures are small (32-64px) and designed for use with Phaser
 *  particle emitters, tweened sprites, or blend-mode overlays.
 *
 *  Called from generateArenaTextures() in arena_background.js
 * ================================================================ */

function _generateParticleTextures(scene) {
  _genParticleGlow(scene);
  _genParticleSpark(scene);
  _genParticleSmoke(scene);
  _genParticleRing(scene);
}

/* ----------------------------------------------------------------
 *  1. SOFT GLOW — smooth radial gradient, white center fading out
 *     Use: auras, energy orbs, healing effects, ambient particles
 * ---------------------------------------------------------------- */
function _genParticleGlow(scene) {
  const S = 64;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1.0)');
  grad.addColorStop(0.15, 'rgba(255,255,255,0.8)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  grad.addColorStop(0.7, 'rgba(255,255,255,0.1)');
  grad.addColorStop(1.0, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  scene.textures.addCanvas('particle_glow', canvas);
}

/* ----------------------------------------------------------------
 *  2. HARD SPARK — bright center with sharp falloff and rays
 *     Use: impact sparks, critical hits, metallic clashes
 * ---------------------------------------------------------------- */
function _genParticleSpark(scene) {
  const S = 32;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  const cx = S / 2, cy = S / 2;

  // Core bright dot
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.15);
  coreGrad.addColorStop(0, 'rgba(255,255,255,1.0)');
  coreGrad.addColorStop(0.5, 'rgba(255,255,200,0.9)');
  coreGrad.addColorStop(1, 'rgba(255,200,100,0.0)');
  ctx.fillStyle = coreGrad;
  ctx.fillRect(0, 0, S, S);

  // Cross/star rays
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const rayGrad = ctx.createLinearGradient(0, 0, S * 0.45, 0);
    rayGrad.addColorStop(0, 'rgba(255,255,255,0.8)');
    rayGrad.addColorStop(0.3, 'rgba(255,240,180,0.4)');
    rayGrad.addColorStop(1, 'rgba(255,200,100,0.0)');
    ctx.fillStyle = rayGrad;
    ctx.fillRect(0, -1.5, S * 0.45, 3);

    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';

  scene.textures.addCanvas('particle_spark', canvas);
}

/* ----------------------------------------------------------------
 *  3. SMOKE PUFF — soft, cloudy, slightly irregular blob
 *     Use: explosions, dust clouds, dash trails, death effects
 * ---------------------------------------------------------------- */
function _genParticleSmoke(scene) {
  const S = 64;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  const cx = S / 2, cy = S / 2;

  // Build up from multiple offset soft circles for cloud shape
  ctx.globalCompositeOperation = 'source-over';
  const blobs = [
    { x: 0, y: 0, r: S * 0.38 },
    { x: -S * 0.1, y: -S * 0.08, r: S * 0.28 },
    { x: S * 0.12, y: -S * 0.06, r: S * 0.25 },
    { x: -S * 0.06, y: S * 0.1, r: S * 0.3 },
    { x: S * 0.08, y: S * 0.08, r: S * 0.22 },
  ];

  for (const blob of blobs) {
    const bx = cx + blob.x;
    const by = cy + blob.y;
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, blob.r);
    grad.addColorStop(0, 'rgba(255,255,255,0.4)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.25)');
    grad.addColorStop(0.7, 'rgba(255,255,255,0.1)');
    grad.addColorStop(1, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bx, by, blob.r, 0, Math.PI * 2);
    ctx.fill();
  }

  scene.textures.addCanvas('particle_smoke', canvas);
}

/* ----------------------------------------------------------------
 *  4. RING / HALO — hollow circle that fades at edges
 *     Use: shockwaves, skill activation rings, buff indicators
 * ---------------------------------------------------------------- */
function _genParticleRing(scene) {
  const S = 64;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  const cx = S / 2, cy = S / 2;
  const outerR = S * 0.45;
  const innerR = S * 0.30;

  // Draw ring using two radial gradients
  // Outer fade
  const outerGrad = ctx.createRadialGradient(cx, cy, innerR - 2, cx, cy, outerR + 2);
  outerGrad.addColorStop(0, 'rgba(255,255,255,0.0)');
  outerGrad.addColorStop(0.25, 'rgba(255,255,255,0.6)');
  outerGrad.addColorStop(0.5, 'rgba(255,255,255,1.0)');
  outerGrad.addColorStop(0.75, 'rgba(255,255,255,0.6)');
  outerGrad.addColorStop(1, 'rgba(255,255,255,0.0)');

  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR + 2, 0, Math.PI * 2);
  ctx.fill();

  // Clear center to make it a ring
  ctx.globalCompositeOperation = 'destination-out';
  const clearGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR);
  clearGrad.addColorStop(0, 'rgba(0,0,0,1.0)');
  clearGrad.addColorStop(0.7, 'rgba(0,0,0,0.8)');
  clearGrad.addColorStop(1, 'rgba(0,0,0,0.0)');
  ctx.fillStyle = clearGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  scene.textures.addCanvas('particle_ring', canvas);
}

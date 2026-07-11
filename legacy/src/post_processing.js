/* ================================================================
 *  post_processing.js — Post-Processing Effects (Street Basketball)
 *
 *  Simple overlay-based effects using Phaser graphics:
 *    1. Vignette — radial darkening via baked texture (already in arena_background)
 *    2. Warm color wash — subtle warm tint overlay
 *
 *  WebGL PostFX shaders are disabled for now (compatibility issues).
 *  They can be re-enabled later when proper WebGL support is confirmed.
 * ================================================================ */

/**
 * registerPostFXPipelines — no-op for now.
 * Kept as a function so BootScene.js doesn't need changes.
 */
function registerPostFXPipelines(game) {
  console.log('[PostFX] Using simple overlay effects (shaders disabled)');
  return false;
}

/**
 * applyPostFX — applies simple Phaser-based overlay effects.
 * The main vignette is already handled by 'vignette_overlay' texture
 * in drawArenaBackground(). This adds a subtle warm color wash.
 */
function applyPostFX(scene) {
  // Subtle warm color wash for evening atmosphere (camera-fixed)
  const warmWash = scene.add.graphics().setScrollFactor(0).setDepth(44).setAlpha(0.03);
  warmWash.fillStyle(0xff8844, 1);
  warmWash.fillRect(0, 0, GW, GH);
  console.log('[PostFX] Overlay effects applied (warm wash + baked vignette)');
}

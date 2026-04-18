/* ================================================================
 *  post_processing.js — WebGL Post-Processing Pipelines
 *
 *  Custom Phaser render pipelines for:
 *    1. Bloom/glow effect
 *    2. Screen-wide vignette via shader
 *    3. Subtle CRT scanlines + film grain
 *
 *  These are registered as camera post-FX pipelines when WebGL
 *  is available, with graceful fallback for Canvas renderer.
 * ================================================================ */

/* ----------------------------------------------------------------
 *  BLOOM PIPELINE
 *  Extracts bright pixels and applies a soft blur glow overlay.
 * ---------------------------------------------------------------- */
const BloomPostFX_FRAG = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform vec2 uResolution;
uniform float uIntensity;
uniform float uThreshold;
varying vec2 outTexCoord;

void main() {
    vec4 color = texture2D(uMainSampler, outTexCoord);

    // Extract bright areas
    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    vec3 bright = color.rgb * smoothstep(uThreshold, uThreshold + 0.15, brightness);

    // Simple 9-tap box blur for glow
    vec2 texelSize = 1.0 / uResolution;
    vec3 blur = vec3(0.0);
    for (int x = -2; x <= 2; x++) {
        for (int y = -2; y <= 2; y++) {
            vec2 offset = vec2(float(x), float(y)) * texelSize * 3.0;
            vec4 s = texture2D(uMainSampler, outTexCoord + offset);
            float b = dot(s.rgb, vec3(0.2126, 0.7152, 0.0722));
            blur += s.rgb * smoothstep(uThreshold, uThreshold + 0.15, b);
        }
    }
    blur /= 25.0;

    // Combine original + bloom
    vec3 result = color.rgb + blur * uIntensity;
    gl_FragColor = vec4(result, color.a);
}
`;

class BloomPostFXPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      name: 'BloomPostFX',
      fragShader: BloomPostFX_FRAG,
    });
    this._intensity = 0.6;
    this._threshold = 0.35;
  }

  onPreRender() {
    this.set1f('uIntensity', this._intensity);
    this.set1f('uThreshold', this._threshold);
    this.set2f('uResolution', this.renderer.width, this.renderer.height);
  }
}

/* ----------------------------------------------------------------
 *  VIGNETTE SHADER PIPELINE
 *  Darkens screen edges for cinematic atmosphere.
 * ---------------------------------------------------------------- */
const VignettePostFX_FRAG = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform float uRadius;
uniform float uSoftness;
uniform float uDarkness;
varying vec2 outTexCoord;

void main() {
    vec4 color = texture2D(uMainSampler, outTexCoord);
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(outTexCoord, center);
    float vignette = smoothstep(uRadius, uRadius - uSoftness, dist);
    color.rgb *= mix(1.0 - uDarkness, 1.0, vignette);
    gl_FragColor = color;
}
`;

class VignettePostFXPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      name: 'VignettePostFX',
      fragShader: VignettePostFX_FRAG,
    });
    this._radius = 0.75;
    this._softness = 0.45;
    this._darkness = 0.45;
  }

  onPreRender() {
    this.set1f('uRadius', this._radius);
    this.set1f('uSoftness', this._softness);
    this.set1f('uDarkness', this._darkness);
  }
}

/* ----------------------------------------------------------------
 *  CRT / FILM GRAIN PIPELINE
 *  Adds subtle scanlines and animated film grain for style.
 * ---------------------------------------------------------------- */
const CRTGrainPostFX_FRAG = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform vec2 uResolution;
uniform float uTime;
uniform float uGrainIntensity;
uniform float uScanlineIntensity;
varying vec2 outTexCoord;

// Simple pseudo-random
float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec4 color = texture2D(uMainSampler, outTexCoord);

    // Film grain
    float grain = (rand(outTexCoord * uResolution + vec2(uTime * 100.0, uTime * 57.0)) - 0.5) * uGrainIntensity;
    color.rgb += vec3(grain);

    // Scanlines
    float scanline = sin(outTexCoord.y * uResolution.y * 1.5) * 0.5 + 0.5;
    scanline = pow(scanline, 1.5);
    color.rgb *= 1.0 - (1.0 - scanline) * uScanlineIntensity;

    gl_FragColor = color;
}
`;

class CRTGrainPostFXPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      name: 'CRTGrainPostFX',
      fragShader: CRTGrainPostFX_FRAG,
    });
    this._grainIntensity = 0.03;
    this._scanlineIntensity = 0.04;
    this._time = 0;
  }

  onPreRender() {
    this._time += 0.016; // ~60fps increment
    this.set2f('uResolution', this.renderer.width, this.renderer.height);
    this.set1f('uTime', this._time);
    this.set1f('uGrainIntensity', this._grainIntensity);
    this.set1f('uScanlineIntensity', this._scanlineIntensity);
  }
}

/* ----------------------------------------------------------------
 *  REGISTRATION & APPLICATION HELPERS
 * ---------------------------------------------------------------- */

/**
 * Register all custom pipelines with the Phaser game renderer.
 * Must be called after game creation but before scenes apply them.
 * Returns true if WebGL pipelines are available.
 */
function registerPostFXPipelines(game) {
  // Only works with WebGL renderer
  if (!game.renderer || !game.renderer.pipelines) {
    console.log('[PostFX] Canvas renderer detected — skipping shader pipelines');
    return false;
  }

  try {
    game.renderer.pipelines.addPostPipeline('BloomPostFX', BloomPostFXPipeline);
    game.renderer.pipelines.addPostPipeline('VignettePostFX', VignettePostFXPipeline);
    game.renderer.pipelines.addPostPipeline('CRTGrainPostFX', CRTGrainPostFXPipeline);
    console.log('[PostFX] All shader pipelines registered successfully');
    return true;
  } catch (e) {
    console.warn('[PostFX] Failed to register pipelines:', e);
    return false;
  }
}

/**
 * Apply post-processing effects to the main camera.
 * Called from GameScene.create() after the scene is set up.
 */
function applyPostFX(scene) {
  const cam = scene.cameras.main;
  if (!cam.setPostPipeline) {
    console.log('[PostFX] Camera post-pipeline not supported');
    return;
  }

  try {
    cam.setPostPipeline('BloomPostFX');
    cam.setPostPipeline('VignettePostFX');
    cam.setPostPipeline('CRTGrainPostFX');
    console.log('[PostFX] All effects applied to main camera');
  } catch (e) {
    console.warn('[PostFX] Failed to apply post-FX:', e);
  }
}

/* ================================================================
 *  post_processing.js — Canvas-Compatible Post-Processing Effects
 *
 *  Since WebGL may not be available, these effects use Phaser's
 *  built-in features (graphics, images, blend modes, tweens)
 *  to simulate post-processing:
 *    1. Bloom/glow — ADD blend mode overlays on bright elements
 *    2. Vignette — camera-fixed dark gradient overlay
 *    3. Chromatic aberration — subtle RGB-shifted overlay
 *    4. CRT scanlines — semi-transparent line pattern overlay
 *
 *  If WebGL IS available, we register proper PostFX pipelines.
 * ================================================================ */

/* ----------------------------------------------------------------
 *  WebGL SHADER PIPELINES (used only when WebGL is available)
 * ---------------------------------------------------------------- */

const _BloomFrag = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform vec2 uResolution;
uniform float uIntensity;
uniform float uThreshold;
varying vec2 outTexCoord;
void main() {
    vec4 color = texture2D(uMainSampler, outTexCoord);
    vec2 texel = 1.0 / uResolution;
    vec3 bloom = vec3(0.0);
    float tw = 0.0;
    for (int x = -3; x <= 3; x++) {
        for (int y = -3; y <= 3; y++) {
            vec2 off = vec2(float(x), float(y)) * texel * 3.0;
            vec4 s = texture2D(uMainSampler, outTexCoord + off);
            float b = dot(s.rgb, vec3(0.2126, 0.7152, 0.0722));
            float w = smoothstep(uThreshold, uThreshold + 0.15, b);
            bloom += s.rgb * w;
            tw += w;
        }
    }
    if (tw > 0.0) bloom /= tw;
    vec3 result = color.rgb + bloom * uIntensity;
    float gray = dot(result, vec3(0.299, 0.587, 0.114));
    result = mix(vec3(gray), result, 1.15);
    gl_FragColor = vec4(result, color.a);
}
`;

const _ChromaFrag = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform vec2 uResolution;
uniform float uAmount;
varying vec2 outTexCoord;
void main() {
    vec2 dir = (outTexCoord - 0.5) * 2.0;
    float dist = length(dir);
    vec2 offset = dir * dist * uAmount / uResolution;
    float r = texture2D(uMainSampler, outTexCoord + offset).r;
    float g = texture2D(uMainSampler, outTexCoord).g;
    float b = texture2D(uMainSampler, outTexCoord - offset).b;
    float a = texture2D(uMainSampler, outTexCoord).a;
    gl_FragColor = vec4(r, g, b, a);
}
`;

const _VignetteFrag = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform float uRadius;
uniform float uSoftness;
uniform float uDarkness;
varying vec2 outTexCoord;
void main() {
    vec4 color = texture2D(uMainSampler, outTexCoord);
    float dist = distance(outTexCoord, vec2(0.5));
    float vig = smoothstep(uRadius, uRadius - uSoftness, dist);
    color.rgb *= mix(1.0 - uDarkness, 1.0, vig);
    gl_FragColor = color;
}
`;

const _CRTFrag = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform vec2 uResolution;
uniform float uTime;
varying vec2 outTexCoord;
float rand(vec2 co) { return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453); }
void main() {
    vec4 color = texture2D(uMainSampler, outTexCoord);
    float grain = (rand(outTexCoord * uResolution + vec2(uTime * 137.0, uTime * 71.0)) - 0.5) * 0.04;
    color.rgb += vec3(grain);
    float sl = sin(outTexCoord.y * uResolution.y * 1.2) * 0.5 + 0.5;
    color.rgb *= 1.0 - (1.0 - pow(sl, 2.0)) * 0.06;
    gl_FragColor = color;
}
`;

/* Pipeline classes — only instantiated if WebGL is available */
let _pipelinesAvailable = false;

function _tryDefineBloom() {
  return class extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) { super({ game, name: 'BloomPostFX', fragShader: _BloomFrag }); }
    onPreRender() {
      this.set1f('uIntensity', 1.4);
      this.set1f('uThreshold', 0.12);
      this.set2f('uResolution', this.renderer.width, this.renderer.height);
    }
  };
}

function _tryDefineChroma() {
  return class extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) { super({ game, name: 'ChromaticPostFX', fragShader: _ChromaFrag }); }
    onPreRender() {
      this.set2f('uResolution', this.renderer.width, this.renderer.height);
      this.set1f('uAmount', 2.5);
    }
  };
}

function _tryDefineVignette() {
  return class extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) { super({ game, name: 'VignettePostFX', fragShader: _VignetteFrag }); }
    onPreRender() {
      this.set1f('uRadius', 0.75);
      this.set1f('uSoftness', 0.55);
      this.set1f('uDarkness', 0.55);
    }
  };
}

function _tryDefineCRT() {
  return class extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) { super({ game, name: 'CRTGrainPostFX', fragShader: _CRTFrag }); this._t = 0; }
    onPreRender() {
      this._t += 0.016;
      this.set2f('uResolution', this.renderer.width, this.renderer.height);
      this.set1f('uTime', this._t);
    }
  };
}

/* ----------------------------------------------------------------
 *  REGISTRATION
 * ---------------------------------------------------------------- */
function registerPostFXPipelines(game) {
  // Check if WebGL renderer is actually active
  if (!game.renderer || game.renderer.type !== Phaser.WEBGL) {
    console.log('[PostFX] Canvas renderer detected — using overlay-based effects');
    _pipelinesAvailable = false;
    return false;
  }
  if (!game.renderer.pipelines) {
    console.log('[PostFX] No pipeline support — using overlay-based effects');
    _pipelinesAvailable = false;
    return false;
  }
  try {
    game.renderer.pipelines.addPostPipeline('BloomPostFX', _tryDefineBloom());
    game.renderer.pipelines.addPostPipeline('ChromaticPostFX', _tryDefineChroma());
    game.renderer.pipelines.addPostPipeline('VignettePostFX', _tryDefineVignette());
    game.renderer.pipelines.addPostPipeline('CRTGrainPostFX', _tryDefineCRT());
    _pipelinesAvailable = true;
    console.log('[PostFX] WebGL pipelines registered');
    return true;
  } catch (e) {
    console.warn('[PostFX] Pipeline registration failed:', e);
    _pipelinesAvailable = false;
    return false;
  }
}

/* ----------------------------------------------------------------
 *  APPLICATION — tries WebGL pipelines first, falls back to overlays
 * ---------------------------------------------------------------- */
function applyPostFX(scene) {
  if (_pipelinesAvailable) {
    try {
      const cam = scene.cameras.main;
      cam.setPostPipeline('BloomPostFX');
      cam.setPostPipeline('ChromaticPostFX');
      cam.setPostPipeline('VignettePostFX');
      cam.setPostPipeline('CRTGrainPostFX');
      console.log('[PostFX] WebGL shader chain applied');
      return;
    } catch (e) {
      console.warn('[PostFX] WebGL apply failed, falling back:', e);
    }
  }

  // --- CANVAS FALLBACK: overlay-based effects ---
  console.log('[PostFX] Applying canvas overlay effects');
  _applyCanvasOverlayEffects(scene);
}

/* ----------------------------------------------------------------
 *  CANVAS OVERLAY EFFECTS — works without WebGL
 * ---------------------------------------------------------------- */
function _applyCanvasOverlayEffects(scene) {
  // 1. SCANLINE OVERLAY — subtle CRT feel
  const scanlineCanvas = document.createElement('canvas');
  scanlineCanvas.width = 128;
  scanlineCanvas.height = 128;
  const slCtx = scanlineCanvas.getContext('2d');
  for (let y = 0; y < 128; y += 4) {
    slCtx.fillStyle = 'rgba(0,0,0,0.06)';
    slCtx.fillRect(0, y, 128, 2);
  }
  if (!scene.textures.exists('scanline_overlay')) {
    scene.textures.addCanvas('scanline_overlay', scanlineCanvas);
  }
  scene.add.tileSprite(GW/2, GH/2, GW, GH, 'scanline_overlay')
    .setScrollFactor(0).setDepth(46).setAlpha(0.5);

  // 2. BLOOM SIMULATION — bright glow layer at center of action
  // This is handled by the arena background spotlights with ADD blend mode
  // The neon glow lines + ADD blend spotlights already create a bloom-like effect

  // 3. CHROMATIC ABERRATION SIMULATION — subtle color fringe at edges
  // Create a thin colored border overlay
  const chromaGfx = scene.add.graphics().setScrollFactor(0).setDepth(44).setAlpha(0.15);
  // Red fringe on left
  chromaGfx.fillStyle(0xff0000, 0.3);
  chromaGfx.fillRect(0, 0, 3, GH);
  // Blue fringe on right
  chromaGfx.fillStyle(0x0000ff, 0.3);
  chromaGfx.fillRect(GW - 3, 0, 3, GH);
  // Subtle gradient fringe
  for (let i = 0; i < 8; i++) {
    const a = 0.02 * (8 - i) / 8;
    chromaGfx.fillStyle(0xff0000, a);
    chromaGfx.fillRect(i, 0, 1, GH);
    chromaGfx.fillStyle(0x0000ff, a);
    chromaGfx.fillRect(GW - 1 - i, 0, 1, GH);
  }
}

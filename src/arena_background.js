/* ================================================================
 *  arena_background.js — Layered NBA Arena Background
 *
 *  Procedurally generates a high-quality basketball court with:
 *    1. Hardwood floor with realistic plank textures
 *    2. Full court markings (center circle, three-point arcs, keys, etc.)
 *    3. Parallax crowd/stands layer
 *    4. Dramatic arena spotlights using ADD blend mode
 *    5. Dark vignette overlay for atmosphere
 * ================================================================ */

/**
 * Generate all arena background textures procedurally using Canvas.
 * Must be called AFTER Phaser game is created but BEFORE scenes use them.
 * We call this from BootScene.create() before transitioning.
 */
function generateArenaTextures(scene) {
  _generateCourtFloorTexture(scene);
  _generateCrowdTexture(scene);
  _generateSpotlightTexture(scene);
  _generateVignetteTexture(scene);
  _generateParticleTextures(scene);
}

/* ----------------------------------------------------------------
 *  1. HARDWOOD COURT FLOOR
 * ---------------------------------------------------------------- */
function _generateCourtFloorTexture(scene) {
  const W = 512;
  const H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Base wood color
  ctx.fillStyle = '#c8915a';
  ctx.fillRect(0, 0, W, H);

  // Wood grain — horizontal planks
  const plankH = 32;
  for (let y = 0; y < H; y += plankH) {
    // Slight color variation per plank
    const r = 190 + Math.floor(Math.random() * 20 - 10);
    const g = 138 + Math.floor(Math.random() * 15 - 7);
    const b = 85 + Math.floor(Math.random() * 15 - 7);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, W, plankH);

    // Grain lines within each plank
    ctx.strokeStyle = `rgba(160,110,60,0.15)`;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 6; i++) {
      const gy = y + 3 + Math.random() * (plankH - 6);
      ctx.beginPath();
      ctx.moveTo(0, gy);
      // Wavy grain
      for (let x = 0; x < W; x += 20) {
        ctx.lineTo(x, gy + Math.sin(x * 0.05 + i) * 1.5);
      }
      ctx.stroke();
    }

    // Plank seam
    ctx.strokeStyle = 'rgba(100,70,40,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();

    // Vertical stagger seams (brick pattern)
    const offset = ((y / plankH) % 2) * (W / 2);
    ctx.strokeStyle = 'rgba(100,70,40,0.15)';
    ctx.beginPath();
    ctx.moveTo(offset, y);
    ctx.lineTo(offset, y + plankH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(offset + W / 2, y);
    ctx.lineTo(offset + W / 2, y + plankH);
    ctx.stroke();
  }

  // Subtle noise overlay for realism
  const imgData = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 8;
    imgData.data[i] += noise;
    imgData.data[i + 1] += noise;
    imgData.data[i + 2] += noise;
  }
  ctx.putImageData(imgData, 0, 0);

  // Slight warm gloss overlay
  const glossGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
  glossGrad.addColorStop(0, 'rgba(255,220,180,0.06)');
  glossGrad.addColorStop(1, 'rgba(0,0,0,0.03)');
  ctx.fillStyle = glossGrad;
  ctx.fillRect(0, 0, W, H);

  scene.textures.addCanvas('court_floor_tile', canvas);
}

/* ----------------------------------------------------------------
 *  2. CROWD / STANDS TEXTURE
 * ---------------------------------------------------------------- */
function _generateCrowdTexture(scene) {
  const W = 512;
  const H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Dark stands background
  const standGrad = ctx.createLinearGradient(0, 0, 0, H);
  standGrad.addColorStop(0, '#0a0a1a');
  standGrad.addColorStop(0.3, '#151530');
  standGrad.addColorStop(0.7, '#1a1a35');
  standGrad.addColorStop(1, '#222244');
  ctx.fillStyle = standGrad;
  ctx.fillRect(0, 0, W, H);

  // Rows of seats
  const rowColors = ['#2a2a4a', '#252545', '#202040', '#1d1d3d', '#1a1a38'];
  const rowH = 28;
  for (let row = 0; row < Math.ceil(H / rowH); row++) {
    const y = row * rowH;
    ctx.fillStyle = rowColors[row % rowColors.length];
    ctx.fillRect(0, y, W, rowH - 2);

    // Seat backs (small rectangles)
    for (let x = 4; x < W; x += 16) {
      const seatColor = `hsl(${220 + Math.random() * 30}, ${20 + Math.random() * 15}%, ${15 + Math.random() * 10}%)`;
      ctx.fillStyle = seatColor;
      ctx.fillRect(x, y + 2, 12, rowH - 6);
    }

    // Crowd heads (small circles on top of seats)
    for (let x = 8; x < W; x += 16) {
      if (Math.random() > 0.15) { // 85% seat occupancy
        // Head
        const skinTones = ['#8d5524', '#c68642', '#e0ac69', '#f1c27d', '#ffdbac', '#6b4423'];
        ctx.fillStyle = skinTones[Math.floor(Math.random() * skinTones.length)];
        ctx.beginPath();
        ctx.arc(x + 2, y + 1, 4, 0, Math.PI * 2);
        ctx.fill();

        // Shirt color (team colors, random bright)
        const shirtColors = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c', '#ffffff'];
        ctx.fillStyle = shirtColors[Math.floor(Math.random() * shirtColors.length)];
        ctx.fillRect(x - 1, y + 5, 8, rowH - 10);
      }
    }
  }

  // Slight blur/atmosphere
  ctx.fillStyle = 'rgba(10,10,30,0.25)';
  ctx.fillRect(0, 0, W, H);

  // Random camera flashes
  for (let i = 0; i < 8; i++) {
    const fx = Math.random() * W;
    const fy = Math.random() * H;
    const flashGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, 6);
    flashGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
    flashGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = flashGrad;
    ctx.fillRect(fx - 6, fy - 6, 12, 12);
  }

  scene.textures.addCanvas('crowd_stands', canvas);
}

/* ----------------------------------------------------------------
 *  3. SPOTLIGHT TEXTURE (radial gradient for ADD blending)
 * ---------------------------------------------------------------- */
function _generateSpotlightTexture(scene) {
  const S = 512;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grad.addColorStop(0, 'rgba(255,255,255,0.35)');
  grad.addColorStop(0.15, 'rgba(255,240,200,0.2)');
  grad.addColorStop(0.4, 'rgba(255,220,150,0.08)');
  grad.addColorStop(0.7, 'rgba(255,200,100,0.02)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  scene.textures.addCanvas('spotlight_glow', canvas);
}

/* ----------------------------------------------------------------
 *  4. VIGNETTE OVERLAY TEXTURE
 * ---------------------------------------------------------------- */
function _generateVignetteTexture(scene) {
  const W = 256;
  const H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.7);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.15)');
  grad.addColorStop(0.8, 'rgba(0,0,0,0.5)');
  grad.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  scene.textures.addCanvas('vignette_overlay', canvas);
}

/* ----------------------------------------------------------------
 *  DRAW THE FULL ARENA BACKGROUND (called from GameScene.create)
 * ---------------------------------------------------------------- */
function drawArenaBackground(scene) {
  // === Layer 0: Crowd stands border (behind court) ===
  _drawCrowdBorder(scene);

  // === Layer 1: Hardwood court floor ===
  _drawCourtFloor(scene);

  // === Layer 2: Court markings ===
  _drawCourtMarkings(scene);

  // === Layer 3: Arena spotlights ===
  _drawSpotlights(scene);

  // === Layer 4: Vignette overlay (camera-fixed) ===
  _drawVignetteOverlay(scene);
}

/* ── Crowd border around the court ── */
function _drawCrowdBorder(scene) {
  // Fill entire world with dark arena color
  const darkBg = scene.add.graphics().setDepth(0);
  darkBg.fillStyle(0x0a0a1a, 1);
  darkBg.fillRect(0, 0, WORLD_W, WORLD_H);

  // Court boundary (slightly larger than markings)
  const courtLeft   = COURT_CX - 960;
  const courtTop    = COURT_CY - 580;
  const courtWidth  = 1920;
  const courtHeight = 1160;

  // Tile crowd texture around the court edges
  if (scene.textures.exists('crowd_stands')) {
    // Top stands
    const topCrowd = scene.add.tileSprite(WORLD_W / 2, courtTop / 2, WORLD_W, courtTop, 'crowd_stands').setDepth(0);
    topCrowd.setAlpha(0.8);

    // Bottom stands
    const bottomH = WORLD_H - (courtTop + courtHeight);
    const bottomCrowd = scene.add.tileSprite(WORLD_W / 2, courtTop + courtHeight + bottomH / 2, WORLD_W, bottomH, 'crowd_stands').setDepth(0);
    bottomCrowd.setAlpha(0.8);

    // Left stands
    const leftCrowd = scene.add.tileSprite(courtLeft / 2, WORLD_H / 2, courtLeft, WORLD_H, 'crowd_stands').setDepth(0);
    leftCrowd.setAlpha(0.7);

    // Right stands
    const rightW = WORLD_W - (courtLeft + courtWidth);
    const rightCrowd = scene.add.tileSprite(courtLeft + courtWidth + rightW / 2, WORLD_H / 2, rightW, WORLD_H, 'crowd_stands').setDepth(0);
    rightCrowd.setAlpha(0.7);
  }

  // Subtle gradient edge between court and stands
  const edgeGfx = scene.add.graphics().setDepth(1);
  edgeGfx.lineStyle(6, 0x333355, 0.6);
  edgeGfx.strokeRect(courtLeft, courtTop, courtWidth, courtHeight);
  edgeGfx.lineStyle(2, 0x555577, 0.4);
  edgeGfx.strokeRect(courtLeft - 4, courtTop - 4, courtWidth + 8, courtHeight + 8);
  edgeGfx.lineStyle(1, 0x666688, 0.3);
  edgeGfx.strokeRect(courtLeft - 8, courtTop - 8, courtWidth + 16, courtHeight + 16);
}

/* ── Hardwood floor with tile texture ── */
function _drawCourtFloor(scene) {
  const courtLeft   = COURT_CX - 960;
  const courtTop    = COURT_CY - 580;
  const courtWidth  = 1920;
  const courtHeight = 1160;

  if (scene.textures.exists('court_floor_tile')) {
    const floor = scene.add.tileSprite(
      courtLeft + courtWidth / 2,
      courtTop + courtHeight / 2,
      courtWidth, courtHeight,
      'court_floor_tile'
    ).setDepth(1);

    // Warm ambient glow on the court center
    const ambientGfx = scene.add.graphics().setDepth(1);
    // Subtle radial warm highlight at center
    const cx = COURT_CX, cy = COURT_CY;
    for (let r = 500; r > 0; r -= 10) {
      const alpha = 0.003 * (1 - r / 500);
      ambientGfx.fillStyle(0xffeedd, alpha);
      ambientGfx.fillCircle(cx, cy, r);
    }
  }
}

/* ── Full NBA court markings ── */
function _drawCourtMarkings(scene) {
  const g = scene.add.graphics().setDepth(2);
  const cx = COURT_CX;
  const cy = COURT_CY;

  // Court outer boundary
  const courtLeft   = cx - 900;
  const courtTop    = cy - 550;
  const courtWidth  = 1800;
  const courtHeight = 1100;

  // Main boundary lines
  g.lineStyle(4, 0xffffff, 0.85);
  g.strokeRect(courtLeft, courtTop, courtWidth, courtHeight);

  // Half-court line
  g.lineStyle(3, 0xffffff, 0.7);
  g.lineBetween(cx, courtTop, cx, courtTop + courtHeight);

  // Center circle (large)
  g.lineStyle(3, 0xffffff, 0.7);
  g.strokeCircle(cx, cy, 180);

  // Center circle (small)
  g.lineStyle(3, 0xffffff, 0.8);
  g.strokeCircle(cx, cy, 60);

  // Center dot
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx, cy, 6);

  // === Three-point arcs (both sides) ===
  g.lineStyle(3, 0xffffff, 0.6);
  // Left three-point arc
  const tpRadius = 420;
  const keyLeft = courtLeft;
  g.beginPath();
  g.arc(keyLeft + 160, cy, tpRadius, -Math.PI * 0.42, Math.PI * 0.42, false);
  g.strokePath();
  // Left corner lines
  g.lineBetween(keyLeft, courtTop + 80, keyLeft + 160 - tpRadius * Math.cos(Math.PI * 0.42), courtTop + 80);
  g.lineBetween(keyLeft, courtTop + courtHeight - 80, keyLeft + 160 - tpRadius * Math.cos(Math.PI * 0.42), courtTop + courtHeight - 80);

  // Right three-point arc
  const keyRight = courtLeft + courtWidth;
  g.beginPath();
  g.arc(keyRight - 160, cy, tpRadius, Math.PI - Math.PI * 0.42, Math.PI + Math.PI * 0.42, false);
  g.strokePath();

  // === Paint / Key areas (both sides) ===
  g.lineStyle(3, 0xffffff, 0.65);
  const keyW = 320;
  const keyH = 380;

  // Left key
  g.strokeRect(courtLeft, cy - keyH / 2, keyW, keyH);
  // Left free-throw circle
  g.lineStyle(2, 0xffffff, 0.5);
  g.strokeCircle(courtLeft + keyW, cy, keyH / 2);

  // Right key
  g.lineStyle(3, 0xffffff, 0.65);
  g.strokeRect(courtLeft + courtWidth - keyW, cy - keyH / 2, keyW, keyH);
  // Right free-throw circle
  g.lineStyle(2, 0xffffff, 0.5);
  g.strokeCircle(courtLeft + courtWidth - keyW, cy, keyH / 2);

  // === Restricted areas (small arcs near basket) ===
  g.lineStyle(2, 0xffffff, 0.4);
  g.beginPath();
  g.arc(courtLeft + 60, cy, 80, -Math.PI / 2, Math.PI / 2, false);
  g.strokePath();
  g.beginPath();
  g.arc(courtLeft + courtWidth - 60, cy, 80, Math.PI / 2, Math.PI * 1.5, false);
  g.strokePath();

  // === Hash marks along keys ===
  g.lineStyle(2, 0xffffff, 0.4);
  const hashPositions = [-keyH / 2 + 60, -keyH / 2 + 130, keyH / 2 - 60, keyH / 2 - 130];
  for (const dy of hashPositions) {
    // Left key hash marks
    g.lineBetween(courtLeft + keyW - 10, cy + dy, courtLeft + keyW + 10, cy + dy);
    // Right key hash marks
    g.lineBetween(courtLeft + courtWidth - keyW - 10, cy + dy, courtLeft + courtWidth - keyW + 10, cy + dy);
  }

  // === Team logos / center court decoration ===
  // Decorative ring at center
  g.lineStyle(8, 0xff6600, 0.15);
  g.strokeCircle(cx, cy, 120);
  g.lineStyle(2, 0xff6600, 0.1);
  g.strokeCircle(cx, cy, 140);

  // Subtle court paint (colored areas in the keys)
  const paintGfx = scene.add.graphics().setDepth(1);
  paintGfx.fillStyle(0x8B0000, 0.06);
  paintGfx.fillRect(courtLeft, cy - keyH / 2, keyW, keyH);
  paintGfx.fillRect(courtLeft + courtWidth - keyW, cy - keyH / 2, keyW, keyH);

  // Center circle fill
  paintGfx.fillStyle(0x1a3a6a, 0.08);
  paintGfx.fillCircle(cx, cy, 180);
}

/* ── Arena spotlights with ADD blend mode ── */
function _drawSpotlights(scene) {
  if (!scene.textures.exists('spotlight_glow')) return;

  const spotlightConfigs = [
    // Center court main spotlight
    { x: COURT_CX, y: COURT_CY, scale: 4.5, alpha: 0.25, tint: 0xfff5e0 },
    // Corner spotlights
    { x: COURT_CX - 800, y: COURT_CY - 400, scale: 3.0, alpha: 0.15, tint: 0xffe8c0 },
    { x: COURT_CX + 800, y: COURT_CY - 400, scale: 3.0, alpha: 0.15, tint: 0xffe8c0 },
    { x: COURT_CX - 800, y: COURT_CY + 400, scale: 3.0, alpha: 0.12, tint: 0xffdda0 },
    { x: COURT_CX + 800, y: COURT_CY + 400, scale: 3.0, alpha: 0.12, tint: 0xffdda0 },
    // Hoop spotlight (extra bright)
    { x: COURT_CX, y: COURT_CY, scale: 2.0, alpha: 0.2, tint: 0xffcc80 },
    // Side accent lights
    { x: COURT_CX - 600, y: COURT_CY, scale: 2.5, alpha: 0.08, tint: 0xc0d0ff },
    { x: COURT_CX + 600, y: COURT_CY, scale: 2.5, alpha: 0.08, tint: 0xc0d0ff },
  ];

  for (const cfg of spotlightConfigs) {
    const light = scene.add.image(cfg.x, cfg.y, 'spotlight_glow')
      .setScale(cfg.scale)
      .setAlpha(cfg.alpha)
      .setTint(cfg.tint)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(3);
  }

  // Animated subtle pulsing on center spotlight
  const centerPulse = scene.add.image(COURT_CX, COURT_CY, 'spotlight_glow')
    .setScale(3.0)
    .setAlpha(0.08)
    .setTint(0xffeedd)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(3);

  scene.tweens.add({
    targets: centerPulse,
    alpha: 0.15,
    scale: 3.5,
    duration: 3000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}

/* ── Camera-fixed vignette overlay ── */
function _drawVignetteOverlay(scene) {
  if (!scene.textures.exists('vignette_overlay')) return;

  const vignette = scene.add.image(GW / 2, GH / 2, 'vignette_overlay')
    .setScrollFactor(0)
    .setDisplaySize(GW, GH)
    .setDepth(45)
    .setAlpha(0.7);
}

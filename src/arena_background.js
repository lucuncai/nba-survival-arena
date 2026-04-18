/* ================================================================
 *  arena_background.js — NEON CYBERPUNK NBA Arena Background
 *
 *  Performance-optimized: ALL visual effects are pre-baked into
 *  canvas textures during Boot. At runtime, only a handful of
 *  Phaser images are created (no per-frame shader work).
 *
 *  Textures generated:
 *    1. 'arena_floor'     — Full court with neon lines + glow baked in
 *    2. 'arena_crowd'     — Rave crowd tile
 *    3. 'arena_spotlight'  — Radial glow for ADD blend spotlights
 *    4. 'vignette_overlay' — Dark edge overlay
 *    5. Particle textures  — 4 reusable particle shapes
 * ================================================================ */

function generateArenaTextures(scene) {
  _generateFullCourtTexture(scene);
  _generateCrowdTexture(scene);
  _generateSpotlightTexture(scene);
  _generateVignetteTexture(scene);
  _generateParticleTextures(scene);
}

/* ----------------------------------------------------------------
 *  FULL COURT TEXTURE — single large canvas with everything baked
 *  Includes: dark floor, energy grid, ALL neon court markings + glow
 * ---------------------------------------------------------------- */
function _generateFullCourtTexture(scene) {
  // Court area dimensions (in world coords)
  const cW = 1920, cH = 1160;
  // Render at 75% res for good quality with reasonable performance
  const scale = 0.75;
  const W = Math.ceil(cW * scale);
  const H = Math.ceil(cH * scale);

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // --- DARK BASE ---
  const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.7);
  bg.addColorStop(0, '#0e0e22');
  bg.addColorStop(0.5, '#0a0a18');
  bg.addColorStop(1, '#060610');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // --- ENERGY GRID ---
  const gridSize = 40 * scale;
  ctx.strokeStyle = 'rgba(25,35,70,0.3)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= W; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  // Brighter accent grid
  ctx.strokeStyle = 'rgba(30,50,100,0.2)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += gridSize * 4) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += gridSize * 4) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // --- HELPER: draw neon line with glow baked in ---
  function neonLine(x1, y1, x2, y2, color, glowColor, width) {
    // Outer glow
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12 * scale;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = (width + 3) * scale;
    ctx.globalAlpha = 0.25;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
    // Mid glow
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 5 * scale;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = (width + 1) * scale;
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
    // Core line
    ctx.strokeStyle = color;
    ctx.lineWidth = width * scale;
    ctx.globalAlpha = 1.0;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  function neonRect(x, y, w, h, color, glowColor, width) {
    neonLine(x, y, x+w, y, color, glowColor, width);
    neonLine(x+w, y, x+w, y+h, color, glowColor, width);
    neonLine(x+w, y+h, x, y+h, color, glowColor, width);
    neonLine(x, y+h, x, y, color, glowColor, width);
  }

  function neonCircle(cx, cy, r, color, glowColor, width) {
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12 * scale;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = (width + 3) * scale;
    ctx.globalAlpha = 0.25;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 5 * scale;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = (width + 1) * scale;
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = color;
    ctx.lineWidth = width * scale;
    ctx.globalAlpha = 1.0;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
  }

  function neonArc(cx, cy, r, startA, endA, color, glowColor, width) {
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12 * scale;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = (width + 3) * scale;
    ctx.globalAlpha = 0.25;
    ctx.beginPath(); ctx.arc(cx, cy, r, startA, endA); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 5 * scale;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = (width + 1) * scale;
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(cx, cy, r, startA, endA); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = color;
    ctx.lineWidth = width * scale;
    ctx.globalAlpha = 1.0;
    ctx.beginPath(); ctx.arc(cx, cy, r, startA, endA); ctx.stroke();
  }

  // All coordinates in scaled space
  const s = scale;
  const cx = W/2, cy = H/2;
  const courtL = 60*s, courtT = 30*s;
  const courtW = W - 120*s, courtH = H - 60*s;

  // --- BOUNDARY (cyan) ---
  neonRect(courtL, courtT, courtW, courtH, '#00ffff', '#00aaff', 3);

  // --- HALF-COURT LINE (cyan) ---
  neonLine(cx, courtT, cx, courtT + courtH, '#00ffff', '#00aaff', 2);

  // --- CENTER CIRCLES (magenta/pink) ---
  neonCircle(cx, cy, 180*s, '#ff00ff', '#ff00aa', 2.5);
  neonCircle(cx, cy, 60*s, '#ff00ff', '#ff00aa', 2);
  // Center dot
  ctx.fillStyle = '#ff00ff';
  ctx.shadowColor = '#ff00ff';
  ctx.shadowBlur = 12 * s;
  ctx.beginPath(); ctx.arc(cx, cy, 5*s, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;

  // --- THREE-POINT ARCS (orange/gold) ---
  const tpR = 420*s;
  const tpCenterL = courtL + 160*s;
  const tpCenterR = courtL + courtW - 160*s;
  neonArc(tpCenterL, cy, tpR, -Math.PI*0.42, Math.PI*0.42, '#ff8800', '#ff6600', 2);
  neonArc(tpCenterR, cy, tpR, Math.PI - Math.PI*0.42, Math.PI + Math.PI*0.42, '#ff8800', '#ff6600', 2);

  // Corner lines
  neonLine(courtL, courtT + 80*s, courtL + 50*s, courtT + 80*s, '#ff8800', '#ff6600', 1.5);
  neonLine(courtL, courtT + courtH - 80*s, courtL + 50*s, courtT + courtH - 80*s, '#ff8800', '#ff6600', 1.5);
  neonLine(courtL + courtW, courtT + 80*s, courtL + courtW - 50*s, courtT + 80*s, '#ff8800', '#ff6600', 1.5);
  neonLine(courtL + courtW, courtT + courtH - 80*s, courtL + courtW - 50*s, courtT + courtH - 80*s, '#ff8800', '#ff6600', 1.5);

  // --- KEY/PAINT AREAS (green neon) ---
  const keyW = 320*s, keyH = 380*s;
  neonRect(courtL, cy - keyH/2, keyW, keyH, '#00ff66', '#00cc44', 2);
  neonRect(courtL + courtW - keyW, cy - keyH/2, keyW, keyH, '#00ff66', '#00cc44', 2);

  // Free throw circles
  neonCircle(courtL + keyW, cy, keyH/2, '#00ff66', '#00cc44', 1.5);
  neonCircle(courtL + courtW - keyW, cy, keyH/2, '#00ff66', '#00cc44', 1.5);

  // Restricted areas
  neonArc(courtL + 60*s, cy, 80*s, -Math.PI/2, Math.PI/2, '#00ff66', '#00cc44', 1.5);
  neonArc(courtL + courtW - 60*s, cy, 80*s, Math.PI/2, Math.PI*1.5, '#00ff66', '#00cc44', 1.5);

  // Hash marks
  const hashPos = [-keyH/2 + 60*s, -keyH/2 + 130*s, keyH/2 - 60*s, keyH/2 - 130*s];
  for (const dy of hashPos) {
    neonLine(courtL + keyW - 10*s, cy + dy, courtL + keyW + 10*s, cy + dy, '#00ff66', '#00cc44', 1.5);
    neonLine(courtL + courtW - keyW - 10*s, cy + dy, courtL + courtW - keyW + 10*s, cy + dy, '#00ff66', '#00cc44', 1.5);
  }

  // --- CORNER GLOW ORBS (baked into texture) ---
  const corners = [
    { x: courtL, y: courtT, color: '0,255,255' },
    { x: courtL + courtW, y: courtT, color: '255,0,255' },
    { x: courtL, y: courtT + courtH, color: '255,136,0' },
    { x: courtL + courtW, y: courtT + courtH, color: '0,255,102' },
  ];
  for (const corner of corners) {
    const g = ctx.createRadialGradient(corner.x, corner.y, 0, corner.x, corner.y, 80*s);
    g.addColorStop(0, `rgba(${corner.color},0.2)`);
    g.addColorStop(0.3, `rgba(${corner.color},0.08)`);
    g.addColorStop(1, `rgba(${corner.color},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(corner.x - 80*s, corner.y - 80*s, 160*s, 160*s);
  }

  // --- CENTER GLOW (baked) ---
  const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200*s);
  centerGlow.addColorStop(0, 'rgba(100,50,200,0.12)');
  centerGlow.addColorStop(0.5, 'rgba(60,30,150,0.05)');
  centerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = centerGlow;
  ctx.fillRect(cx - 200*s, cy - 200*s, 400*s, 400*s);

  // --- EDGE GLOW STRIPS (baked) ---
  // Top/bottom cyan glow
  const topGlow = ctx.createLinearGradient(0, courtT, 0, courtT + 30*s);
  topGlow.addColorStop(0, 'rgba(0,255,255,0.08)');
  topGlow.addColorStop(1, 'rgba(0,255,255,0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(courtL, courtT, courtW, 30*s);

  const botGlow = ctx.createLinearGradient(0, courtT + courtH, 0, courtT + courtH - 30*s);
  botGlow.addColorStop(0, 'rgba(0,255,255,0.08)');
  botGlow.addColorStop(1, 'rgba(0,255,255,0)');
  ctx.fillStyle = botGlow;
  ctx.fillRect(courtL, courtT + courtH - 30*s, courtW, 30*s);

  scene.textures.addCanvas('arena_floor', c);
}

/* ----------------------------------------------------------------
 *  CROWD TEXTURE — rave/concert atmosphere tile
 * ---------------------------------------------------------------- */
function _generateCrowdTexture(scene) {
  const W = 256, H = 128;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // Very dark base
  ctx.fillStyle = '#040410';
  ctx.fillRect(0, 0, W, H);

  // Vertical neon light bars
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * W;
    const w = 2 + Math.random() * 4;
    const hue = Math.floor(Math.random() * 360);
    const alpha = 0.1 + Math.random() * 0.2;
    const lg = ctx.createLinearGradient(x, 0, x, H);
    lg.addColorStop(0, `hsla(${hue},90%,50%,0)`);
    lg.addColorStop(0.3, `hsla(${hue},90%,50%,${alpha})`);
    lg.addColorStop(0.7, `hsla(${hue},90%,50%,${alpha*0.6})`);
    lg.addColorStop(1, `hsla(${hue},90%,50%,0)`);
    ctx.fillStyle = lg;
    ctx.fillRect(x - w/2, 0, w, H);
  }

  // Silhouette crowd
  const rowH = 20;
  for (let row = 0; row < Math.ceil(H / rowH); row++) {
    const y = row * rowH;
    ctx.fillStyle = `rgba(3,3,12,${0.2 + row * 0.04})`;
    ctx.fillRect(0, y, W, rowH);
    for (let x = 3; x < W; x += 10) {
      if (Math.random() > 0.15) {
        ctx.fillStyle = `rgba(0,0,0,${0.4 + Math.random()*0.3})`;
        ctx.beginPath(); ctx.arc(x, y + 3, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillRect(x - 2, y + 6, 5, rowH - 7);
        // Random glow sticks
        if (Math.random() > 0.75) {
          const gh = Math.floor(Math.random() * 360);
          const glow = ctx.createRadialGradient(x, y + 1, 0, x, y + 1, 5);
          glow.addColorStop(0, `hsla(${gh},100%,70%,0.5)`);
          glow.addColorStop(1, `hsla(${gh},100%,50%,0)`);
          ctx.fillStyle = glow;
          ctx.fillRect(x - 5, y - 4, 10, 10);
        }
      }
    }
  }

  // Horizontal LED strips
  for (let i = 0; i < 3; i++) {
    const y = 10 + Math.random() * (H - 20);
    const hue = Math.floor(Math.random() * 360);
    ctx.strokeStyle = `hsla(${hue},100%,60%,0.2)`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  scene.textures.addCanvas('arena_crowd', c);
}

/* ----------------------------------------------------------------
 *  SPOTLIGHT TEXTURE — radial glow for ADD blend
 * ---------------------------------------------------------------- */
function _generateSpotlightTexture(scene) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2);
  g.addColorStop(0, 'rgba(255,255,255,0.5)');
  g.addColorStop(0.1, 'rgba(255,255,255,0.3)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.12)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.03)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  scene.textures.addCanvas('arena_spotlight', c);
}

/* ----------------------------------------------------------------
 *  VIGNETTE OVERLAY
 * ---------------------------------------------------------------- */
function _generateVignetteTexture(scene) {
  const W = 256, H = 256;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(W/2, H/2, W*0.15, W/2, H/2, W*0.7);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.5, 'rgba(0,0,10,0.2)');
  g.addColorStop(0.8, 'rgba(0,0,20,0.5)');
  g.addColorStop(1, 'rgba(0,0,10,0.85)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  scene.textures.addCanvas('vignette_overlay', c);
}

/* ================================================================
 *  DRAW THE FULL ARENA (called from GameScene.create)
 *  Only creates ~10 game objects total for performance
 * ================================================================ */
function drawArenaBackground(scene) {
  const courtL = COURT_CX - 960;
  const courtT = COURT_CY - 580;
  const courtW = 1920;
  const courtH = 1160;

  // 1. Dark world base (single graphics object)
  const base = scene.add.graphics().setDepth(0);
  base.fillStyle(0x030308, 1);
  base.fillRect(0, 0, WORLD_W, WORLD_H);

  // 2. Crowd tiles (4 tileSprites for edges)
  if (scene.textures.exists('arena_crowd')) {
    if (courtT > 10)
      scene.add.tileSprite(WORLD_W/2, courtT/2, WORLD_W, courtT, 'arena_crowd').setDepth(0).setAlpha(0.8);
    const botH = WORLD_H - (courtT + courtH);
    if (botH > 10)
      scene.add.tileSprite(WORLD_W/2, courtT + courtH + botH/2, WORLD_W, botH, 'arena_crowd').setDepth(0).setAlpha(0.8);
    if (courtL > 10)
      scene.add.tileSprite(courtL/2, WORLD_H/2, courtL, WORLD_H, 'arena_crowd').setDepth(0).setAlpha(0.7);
    const rightW = WORLD_W - (courtL + courtW);
    if (rightW > 10)
      scene.add.tileSprite(courtL + courtW + rightW/2, WORLD_H/2, rightW, WORLD_H, 'arena_crowd').setDepth(0).setAlpha(0.7);
  }

  // 3. Court floor (single image, scaled up from half-res texture)
  if (scene.textures.exists('arena_floor')) {
    scene.add.image(COURT_CX, COURT_CY, 'arena_floor')
      .setDisplaySize(courtW, courtH).setDepth(1);
  }

  // 4. Spotlights — just 3 ADD blend images with gentle tweens
  if (scene.textures.exists('arena_spotlight')) {
    // Center spotlight (blue-white)
    const centerLight = scene.add.image(COURT_CX, COURT_CY, 'arena_spotlight')
      .setDisplaySize(1200, 1200).setAlpha(0.12).setTint(0x4488ff)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(2);
    scene.tweens.add({
      targets: centerLight, alpha: 0.2,
      duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Left spotlight (pink)
    const leftLight = scene.add.image(COURT_CX - 500, COURT_CY, 'arena_spotlight')
      .setDisplaySize(800, 800).setAlpha(0.08).setTint(0xff0066)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(2);
    scene.tweens.add({
      targets: leftLight, alpha: 0.15,
      duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 800
    });

    // Right spotlight (green)
    const rightLight = scene.add.image(COURT_CX + 500, COURT_CY, 'arena_spotlight')
      .setDisplaySize(800, 800).setAlpha(0.08).setTint(0x00ff66)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(2);
    scene.tweens.add({
      targets: rightLight, alpha: 0.15,
      duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 1600
    });
  }

  // 5. Vignette (camera-fixed)
  if (scene.textures.exists('vignette_overlay')) {
    scene.add.image(GW/2, GH/2, 'vignette_overlay')
      .setScrollFactor(0).setDisplaySize(GW, GH).setDepth(45).setAlpha(0.75);
  }
}

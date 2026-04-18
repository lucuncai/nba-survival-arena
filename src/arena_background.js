/* ================================================================
 *  arena_background.js — Street Basketball Arena Background
 *
 *  Freestyle Street Basketball style, 2D top-down view.
 *  All visuals pre-baked into canvas textures during Boot.
 *
 *  Textures generated:
 *    1. 'arena_floor'      — Asphalt court with markings, cracks, graffiti
 *    2. 'arena_border_h'   — Horizontal border (top/bottom)
 *    3. 'arena_border_v'   — Vertical border (left/right)
 *    4. 'arena_spotlight'  — Warm street lamp light cone
 *    5. 'vignette_overlay' — Warm-tinted edge darkening
 * ================================================================ */

function generateArenaTextures(scene) {
  _generateFullCourtTexture(scene);
  _generateBorderTextureH(scene);
  _generateBorderTextureV(scene);
  _generateSpotlightTexture(scene);
  _generateVignetteTexture(scene);
  _generateParticleTextures(scene);
}

/* ----------------------------------------------------------------
 *  SEEDED RANDOM for deterministic procedural generation
 * ---------------------------------------------------------------- */
let _seed = 42;
function _srand(s) { _seed = s; }
function _rand() { _seed = (_seed * 16807 + 0) % 2147483647; return (_seed - 1) / 2147483646; }

/* ----------------------------------------------------------------
 *  SHARED HELPERS — brick wall, graffiti, fence drawing
 * ---------------------------------------------------------------- */

function _drawBrickWall(ctx, x0, y0, w, h, seed) {
  _srand(seed);
  const brickW = 36, brickH = 16;
  const brickColors = ['#8b4513','#a0522d','#7a3b10','#9c5a2e','#6b3410','#b06030','#884420','#995530'];

  for (let row = 0; row < Math.ceil(h / brickH); row++) {
    const offset = (row % 2) * (brickW / 2);
    for (let col = -1; col < Math.ceil(w / brickW) + 1; col++) {
      const bx = x0 + col * brickW + offset;
      const by = y0 + row * brickH;
      if (by > y0 + h) break;
      // Each brick gets a unique shade
      const baseColor = brickColors[Math.floor(_rand() * brickColors.length)];
      ctx.fillStyle = baseColor;
      ctx.fillRect(bx + 1, by + 1, brickW - 2, brickH - 2);
      // Slight weathering on some bricks
      if (_rand() > 0.7) {
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(bx + 1, by + 1, brickW - 2, brickH - 2);
      }
    }
  }
  // Mortar lines
  ctx.strokeStyle = '#3a3530';
  ctx.lineWidth = 1;
  for (let row = 0; row <= Math.ceil(h / brickH); row++) {
    const y = y0 + row * brickH;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke();
    const offset = (row % 2) * (brickW / 2);
    for (let col = 0; col <= Math.ceil(w / brickW) + 1; col++) {
      const xx = x0 + col * brickW + offset;
      ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx, y + brickH); ctx.stroke();
    }
  }
}

function _drawGraffiti(ctx, x0, y0, w, h, seed) {
  _srand(seed);
  const grafColors = ['#ff3333','#33aaff','#ffcc00','#33ff88','#ff33aa','#ff8833','#aa33ff','#ff6644'];
  const tags = ['BALLIN','HOOP','MVP','JAM','DUNK','SWISH','3PT','FIRE','SLAM','COURT'];

  // Spray paint streaks
  for (let i = 0; i < 6; i++) {
    const sx = x0 + _rand() * w;
    const sy = y0 + _rand() * h * 0.8;
    const sw = 30 + _rand() * 100;
    const sh = 8 + _rand() * 25;
    const color = grafColors[Math.floor(_rand() * grafColors.length)];
    ctx.save();
    ctx.globalAlpha = 0.35 + _rand() * 0.3;
    ctx.translate(sx, sy);
    ctx.rotate((_rand() - 0.5) * 0.4);
    // Spray paint shape — irregular rounded rectangle
    const grad = ctx.createLinearGradient(-sw/2, 0, sw/2, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.1, color);
    grad.addColorStop(0.9, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, sw/2, sh/2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Drip effect
    if (_rand() > 0.5) {
      ctx.fillStyle = color;
      ctx.globalAlpha *= 0.6;
      const dripX = (_rand() - 0.5) * sw * 0.5;
      const dripH = 10 + _rand() * 30;
      ctx.fillRect(dripX - 1.5, sh/2, 3, dripH);
      // Drip bulge at bottom
      ctx.beginPath();
      ctx.arc(dripX, sh/2 + dripH, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Graffiti text tags with outlines
  for (let i = 0; i < 4; i++) {
    const tx = x0 + 40 + _rand() * (w - 80);
    const ty = y0 + 20 + _rand() * (h * 0.7);
    const tag = tags[Math.floor(_rand() * tags.length)];
    const fontSize = 16 + Math.floor(_rand() * 22);
    const color = grafColors[Math.floor(_rand() * grafColors.length)];
    ctx.save();
    ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(tx, ty);
    ctx.rotate((_rand() - 0.5) * 0.35);
    // Dark outline
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.7 + _rand() * 0.25;
    ctx.strokeText(tag, 0, 0);
    // Colored fill
    ctx.fillStyle = color;
    ctx.fillText(tag, 0, 0);
    // Highlight stroke
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeText(tag, -1, -1);
    ctx.restore();
  }

  // Small symbols
  const symbols = ['★','♦','✦','⚡','♠','✖','☆','●'];
  for (let i = 0; i < 5; i++) {
    const sx = x0 + _rand() * w;
    const sy = y0 + _rand() * h * 0.85;
    ctx.save();
    ctx.font = `${12 + Math.floor(_rand()*14)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = grafColors[Math.floor(_rand() * grafColors.length)];
    ctx.globalAlpha = 0.3 + _rand() * 0.35;
    ctx.translate(sx, sy);
    ctx.rotate((_rand() - 0.5) * 0.6);
    ctx.fillText(symbols[Math.floor(_rand() * symbols.length)], 0, 0);
    ctx.restore();
  }
}

function _drawChainFence(ctx, x0, y0, w, h) {
  // Fence posts
  ctx.fillStyle = '#888';
  const postSpacing = 90;
  for (let x = x0; x < x0 + w; x += postSpacing) {
    ctx.fillRect(x - 2, y0, 4, h);
    ctx.fillStyle = '#999';
    ctx.fillRect(x - 3, y0 - 2, 6, 4);
    ctx.fillStyle = '#888';
  }

  // Chain-link diamond pattern — larger diamonds for readability
  ctx.strokeStyle = 'rgba(170,170,170,0.45)';
  ctx.lineWidth = 1;
  const dSize = 16;
  for (let row = 0; row < Math.ceil(h / dSize); row++) {
    for (let col = -1; col < Math.ceil(w / dSize) + 1; col++) {
      const dx = x0 + col * dSize + (row % 2) * (dSize / 2);
      const dy = y0 + row * dSize;
      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.lineTo(dx + dSize/2, dy + dSize/2);
      ctx.lineTo(dx, dy + dSize);
      ctx.lineTo(dx - dSize/2, dy + dSize/2);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Top and bottom rails
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + w, y0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
}

/* ----------------------------------------------------------------
 *  FULL COURT TEXTURE — asphalt surface + court markings + cracks + graffiti
 *  Court area: 1920 x 1160 in world coords
 * ---------------------------------------------------------------- */
function _generateFullCourtTexture(scene) {
  const cW = 1920, cH = 1160;
  const scale = 0.75;
  const W = Math.ceil(cW * scale);
  const H = Math.ceil(cH * scale);
  const s = scale;

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // ---- ASPHALT BASE ----
  const baseBg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.65);
  baseBg.addColorStop(0, '#6b6560');
  baseBg.addColorStop(0.4, '#5a5550');
  baseBg.addColorStop(0.7, '#504b47');
  baseBg.addColorStop(1, '#454040');
  ctx.fillStyle = baseBg;
  ctx.fillRect(0, 0, W, H);

  // ---- ASPHALT NOISE TEXTURE ----
  _srand(123);
  const noiseData = ctx.getImageData(0, 0, W, H);
  const nd = noiseData.data;
  for (let i = 0; i < nd.length; i += 4) {
    const noise = (_rand() - 0.5) * 25;
    nd[i]   = Math.max(0, Math.min(255, nd[i] + noise));
    nd[i+1] = Math.max(0, Math.min(255, nd[i+1] + noise));
    nd[i+2] = Math.max(0, Math.min(255, nd[i+2] + noise));
  }
  ctx.putImageData(noiseData, 0, 0);

  // ---- ASPHALT AGGREGATE SPECKLES ----
  _srand(456);
  for (let i = 0; i < 800; i++) {
    const x = _rand() * W;
    const y = _rand() * H;
    const r = 0.5 + _rand() * 1.5;
    const brightness = 50 + Math.floor(_rand() * 40);
    ctx.fillStyle = `rgba(${brightness},${brightness-5},${brightness-10},0.3)`;
    ctx.beginPath(); ctx.arc(x, y, r * s, 0, Math.PI*2); ctx.fill();
  }

  // ---- CRACKS ----
  _srand(789);
  function drawCrack(startX, startY, angle, length, width) {
    ctx.save();
    ctx.strokeStyle = 'rgba(30,28,25,0.6)';
    ctx.lineWidth = width * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    let cx = startX, cy = startY;
    const segments = Math.floor(length / 8);
    for (let i = 0; i < segments; i++) {
      angle += (_rand() - 0.5) * 0.8;
      const segLen = (5 + _rand() * 12) * s;
      cx += Math.cos(angle) * segLen;
      cy += Math.sin(angle) * segLen;
      ctx.lineTo(cx, cy);
      if (_rand() > 0.75 && width > 0.5) {
        ctx.stroke();
        drawCrack(cx, cy, angle + (_rand()-0.5)*1.5, length*0.3, width*0.5);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
      }
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(100,95,88,0.2)';
    ctx.lineWidth = (width * 0.5) * s;
    ctx.stroke();
    ctx.restore();
  }

  drawCrack(W*0.15, H*0.3, 0.3, 200, 2.0);
  drawCrack(W*0.7, H*0.15, 1.8, 180, 1.8);
  drawCrack(W*0.4, H*0.7, -0.5, 160, 1.5);
  drawCrack(W*0.8, H*0.6, 2.5, 150, 1.6);
  drawCrack(W*0.25, H*0.85, 0.1, 130, 1.3);
  drawCrack(W*0.6, H*0.45, -1.2, 120, 1.2);
  for (let i = 0; i < 8; i++) {
    drawCrack(_rand()*W, _rand()*H, _rand()*Math.PI*2, 40+_rand()*60, 0.5+_rand()*0.8);
  }

  // ---- TIRE/SCUFF MARKS ----
  _srand(321);
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 12 * s;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const sx = _rand() * W;
    const sy = _rand() * H;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + (_rand()-0.5)*200*s, sy + (_rand()-0.5)*100*s,
                         sx + (_rand()-0.5)*300*s, sy + (_rand()-0.5)*150*s);
    ctx.stroke();
  }
  ctx.restore();

  // ---- COURT MARKINGS ----
  const margin = 40 * s;
  const courtL = margin, courtT = margin;
  const courtW = W - margin*2, courtH = H - margin*2;
  const ccx = W/2, ccy = H/2;

  function courtLine(x1, y1, x2, y2, color, width, glowAlpha) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 6 * s;
    ctx.strokeStyle = color;
    ctx.lineWidth = (width + 2) * s;
    ctx.globalAlpha = glowAlpha || 0.15;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = color;
    ctx.lineWidth = width * s;
    ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  function courtCircle(cx, cy, r, color, width, glowAlpha) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 6 * s;
    ctx.strokeStyle = color;
    ctx.lineWidth = (width + 2) * s;
    ctx.globalAlpha = glowAlpha || 0.15;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = color;
    ctx.lineWidth = width * s;
    ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  function courtArc(cx, cy, r, startA, endA, color, width, glowAlpha) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 6 * s;
    ctx.strokeStyle = color;
    ctx.lineWidth = (width + 2) * s;
    ctx.globalAlpha = glowAlpha || 0.15;
    ctx.beginPath(); ctx.arc(cx, cy, r, startA, endA); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = color;
    ctx.lineWidth = width * s;
    ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.arc(cx, cy, r, startA, endA); ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  const lineColor = '#f0e8d0';
  const orangeColor = '#e88a3a';
  const lineW = 2.5;

  // ---- PAINT/KEY AREAS (orange fill) ----
  const keyW = 320 * s, keyH = 380 * s;
  ctx.fillStyle = 'rgba(210,110,40,0.25)';
  ctx.fillRect(courtL, ccy - keyH/2, keyW, keyH);
  ctx.fillRect(courtL + courtW - keyW, ccy - keyH/2, keyW, keyH);

  // Paint texture overlay (worn paint look)
  _srand(555);
  ctx.save();
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 200; i++) {
    const kx = courtL + _rand() * keyW;
    const ky = ccy - keyH/2 + _rand() * keyH;
    ctx.fillStyle = _rand() > 0.5 ? '#c06020' : '#5a5550';
    ctx.fillRect(kx, ky, 2*s + _rand()*4*s, 1*s + _rand()*3*s);
  }
  for (let i = 0; i < 200; i++) {
    const kx = courtL + courtW - keyW + _rand() * keyW;
    const ky = ccy - keyH/2 + _rand() * keyH;
    ctx.fillStyle = _rand() > 0.5 ? '#c06020' : '#5a5550';
    ctx.fillRect(kx, ky, 2*s + _rand()*4*s, 1*s + _rand()*3*s);
  }
  ctx.restore();

  // ---- BOUNDARY LINES ----
  courtLine(courtL, courtT, courtL + courtW, courtT, lineColor, lineW, 0.12);
  courtLine(courtL, courtT + courtH, courtL + courtW, courtT + courtH, lineColor, lineW, 0.12);
  courtLine(courtL, courtT, courtL, courtT + courtH, lineColor, lineW, 0.12);
  courtLine(courtL + courtW, courtT, courtL + courtW, courtT + courtH, lineColor, lineW, 0.12);

  // ---- HALF-COURT LINE ----
  courtLine(ccx, courtT, ccx, courtT + courtH, lineColor, lineW, 0.12);

  // ---- CENTER CIRCLE ----
  courtCircle(ccx, ccy, 180*s, lineColor, lineW, 0.12);
  courtCircle(ccx, ccy, 50*s, lineColor, 2, 0.1);
  ctx.fillStyle = orangeColor;
  ctx.shadowColor = orangeColor;
  ctx.shadowBlur = 8*s;
  ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.arc(ccx, ccy, 6*s, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1.0;

  // ---- THREE-POINT ARCS ----
  const tpR = 420 * s;
  const tpCenterL = courtL + 160 * s;
  const tpCenterR = courtL + courtW - 160 * s;
  courtArc(tpCenterL, ccy, tpR, -Math.PI*0.42, Math.PI*0.42, lineColor, lineW, 0.12);
  courtArc(tpCenterR, ccy, tpR, Math.PI - Math.PI*0.42, Math.PI + Math.PI*0.42, lineColor, lineW, 0.12);
  courtLine(courtL, courtT + 80*s, courtL + 50*s, courtT + 80*s, lineColor, 1.5, 0.1);
  courtLine(courtL, courtT + courtH - 80*s, courtL + 50*s, courtT + courtH - 80*s, lineColor, 1.5, 0.1);
  courtLine(courtL + courtW, courtT + 80*s, courtL + courtW - 50*s, courtT + 80*s, lineColor, 1.5, 0.1);
  courtLine(courtL + courtW, courtT + courtH - 80*s, courtL + courtW - 50*s, courtT + courtH - 80*s, lineColor, 1.5, 0.1);

  // ---- KEY OUTLINES (orange) ----
  courtLine(courtL, ccy - keyH/2, courtL + keyW, ccy - keyH/2, orangeColor, 2, 0.15);
  courtLine(courtL, ccy + keyH/2, courtL + keyW, ccy + keyH/2, orangeColor, 2, 0.15);
  courtLine(courtL + keyW, ccy - keyH/2, courtL + keyW, ccy + keyH/2, orangeColor, 2, 0.15);
  courtLine(courtL + courtW - keyW, ccy - keyH/2, courtL + courtW, ccy - keyH/2, orangeColor, 2, 0.15);
  courtLine(courtL + courtW - keyW, ccy + keyH/2, courtL + courtW, ccy + keyH/2, orangeColor, 2, 0.15);
  courtLine(courtL + courtW - keyW, ccy - keyH/2, courtL + courtW - keyW, ccy + keyH/2, orangeColor, 2, 0.15);

  // Free throw circles
  courtCircle(courtL + keyW, ccy, keyH/2, orangeColor, 1.5, 0.12);
  courtCircle(courtL + courtW - keyW, ccy, keyH/2, orangeColor, 1.5, 0.12);

  // Restricted area arcs
  courtArc(courtL + 60*s, ccy, 80*s, -Math.PI/2, Math.PI/2, orangeColor, 1.5, 0.12);
  courtArc(courtL + courtW - 60*s, ccy, 80*s, Math.PI/2, Math.PI*1.5, orangeColor, 1.5, 0.12);

  // Hash marks
  const hashPos = [-keyH/2 + 60*s, -keyH/2 + 130*s, keyH/2 - 60*s, keyH/2 - 130*s];
  for (const dy of hashPos) {
    courtLine(courtL + keyW - 10*s, ccy + dy, courtL + keyW + 10*s, ccy + dy, lineColor, 1.5, 0.1);
    courtLine(courtL + courtW - keyW - 10*s, ccy + dy, courtL + courtW - keyW + 10*s, ccy + dy, lineColor, 1.5, 0.1);
  }

  // ---- GRAFFITI ON COURT ----
  _srand(999);

  // "SURVIVE" text at bottom center
  ctx.save();
  ctx.font = `bold ${Math.floor(48*s)}px Impact, Arial Black, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillText('SURVIVE', ccx + 2*s, ccy + 240*s + 2*s);
  const survGrad = ctx.createLinearGradient(ccx - 120*s, ccy + 220*s, ccx + 120*s, ccy + 260*s);
  survGrad.addColorStop(0, '#ff4444');
  survGrad.addColorStop(0.5, '#ff8800');
  survGrad.addColorStop(1, '#ffcc00');
  ctx.fillStyle = survGrad;
  ctx.globalAlpha = 0.35;
  ctx.fillText('SURVIVE', ccx, ccy + 240*s);
  ctx.restore();

  // "STREET LEGENDS" text at top center
  ctx.save();
  ctx.font = `bold ${Math.floor(36*s)}px Impact, Arial Black, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillText('STREET LEGENDS', ccx + 2*s, ccy - 220*s + 2*s);
  const slGrad = ctx.createLinearGradient(ccx - 100*s, ccy - 240*s, ccx + 100*s, ccy - 200*s);
  slGrad.addColorStop(0, '#44aaff');
  slGrad.addColorStop(0.5, '#aa44ff');
  slGrad.addColorStop(1, '#ff44aa');
  ctx.fillStyle = slGrad;
  ctx.globalAlpha = 0.3;
  ctx.fillText('STREET LEGENDS', ccx, ccy - 220*s);
  ctx.restore();

  // Small graffiti symbols scattered
  _srand(777);
  const graffitiSymbols = ['★','♦','✦','⚡','♠','✖'];
  const graffitiColors = ['#ff4444','#44aaff','#ffcc00','#44ff88','#ff44aa','#ff8800'];
  for (let i = 0; i < 12; i++) {
    const gx = 60*s + _rand() * (W - 120*s);
    const gy = 60*s + _rand() * (H - 120*s);
    if (Math.abs(gx - ccx) < 200*s && Math.abs(gy - ccy) < 200*s) continue;
    ctx.save();
    ctx.font = `${Math.floor((14 + _rand()*20)*s)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = graffitiColors[Math.floor(_rand() * graffitiColors.length)];
    ctx.globalAlpha = 0.12 + _rand() * 0.12;
    ctx.translate(gx, gy);
    ctx.rotate((_rand() - 0.5) * 0.6);
    ctx.fillText(graffitiSymbols[Math.floor(_rand() * graffitiSymbols.length)], 0, 0);
    ctx.restore();
  }

  // Basketball symbol near center
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = '#ff8800';
  ctx.lineWidth = 2*s;
  const bx = ccx + 180*s, by = ccy + 60*s, br = 30*s;
  ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx - br, by); ctx.lineTo(bx + br, by); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx, by - br); ctx.lineTo(bx, by + br); ctx.stroke();
  ctx.beginPath(); ctx.arc(bx - br*0.3, by, br*0.9, -Math.PI*0.4, Math.PI*0.4); ctx.stroke();
  ctx.beginPath(); ctx.arc(bx + br*0.3, by, br*0.9, Math.PI*0.6, Math.PI*1.4); ctx.stroke();
  ctx.restore();

  // ---- WARM AMBIENT LIGHT (baked center glow) ----
  const warmGlow = ctx.createRadialGradient(ccx, ccy, 0, ccx, ccy, W*0.5);
  warmGlow.addColorStop(0, 'rgba(255,220,160,0.08)');
  warmGlow.addColorStop(0.3, 'rgba(255,200,130,0.04)');
  warmGlow.addColorStop(0.7, 'rgba(200,150,100,0.02)');
  warmGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = warmGlow;
  ctx.fillRect(0, 0, W, H);

  scene.textures.addCanvas('arena_floor', c);
}

/* ----------------------------------------------------------------
 *  HORIZONTAL BORDER TEXTURE — for top and bottom edges
 *  Layout (top-to-bottom): brick wall → fence → sidewalk/ground
 *  Large tile (1024x500) to minimize visible repetition
 * ---------------------------------------------------------------- */
function _generateBorderTextureH(scene) {
  const W = 1024, H = 500;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // ---- SIDEWALK / GROUND BASE ----
  ctx.fillStyle = '#4a4540';
  ctx.fillRect(0, 0, W, H);
  _srand(2000);
  const sData = ctx.getImageData(0, 0, W, H);
  const sd = sData.data;
  for (let i = 0; i < sd.length; i += 4) {
    const n = (_rand() - 0.5) * 12;
    sd[i]   = Math.max(0, Math.min(255, sd[i] + n));
    sd[i+1] = Math.max(0, Math.min(255, sd[i+1] + n));
    sd[i+2] = Math.max(0, Math.min(255, sd[i+2] + n));
  }
  ctx.putImageData(sData, 0, 0);

  // ---- BRICK WALL (top 55%) ----
  const wallH = H * 0.55;
  _drawBrickWall(ctx, 0, 0, W, wallH, 3001);

  // ---- GRAFFITI ON WALL ----
  _drawGraffiti(ctx, 0, 5, W, wallH - 10, 3002);

  // ---- CHAIN-LINK FENCE (next 20%) ----
  const fenceY = wallH;
  const fenceH = H * 0.2;
  _drawChainFence(ctx, 0, fenceY, W, fenceH);

  // ---- GROUND STRIP with debris (bottom 25%) ----
  _srand(3003);
  const groundY = fenceY + fenceH;
  // Sidewalk cracks
  ctx.strokeStyle = 'rgba(30,28,25,0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const sx = _rand() * W;
    const sy = groundY + _rand() * (H - groundY);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (_rand()-0.5)*40, sy + (_rand()-0.5)*20);
    ctx.stroke();
  }
  // Debris
  for (let i = 0; i < 20; i++) {
    const dx = _rand() * W;
    const dy = groundY + _rand() * (H - groundY);
    ctx.fillStyle = `rgba(${60+Math.floor(_rand()*30)},${55+Math.floor(_rand()*25)},${50+Math.floor(_rand()*20)},0.4)`;
    ctx.fillRect(dx, dy, 2 + _rand()*5, 1 + _rand()*3);
  }

  // Warm ambient tint
  ctx.fillStyle = 'rgba(180,120,60,0.05)';
  ctx.fillRect(0, 0, W, H);

  scene.textures.addCanvas('arena_border_h', c);
}

/* ----------------------------------------------------------------
 *  VERTICAL BORDER TEXTURE — for left and right edges
 *  Layout (left-to-right): brick wall → fence → sidewalk/ground
 *  Large tile (500x1024) to minimize visible repetition
 * ---------------------------------------------------------------- */
function _generateBorderTextureV(scene) {
  const W = 500, H = 1024;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // ---- SIDEWALK / GROUND BASE ----
  ctx.fillStyle = '#4a4540';
  ctx.fillRect(0, 0, W, H);
  _srand(4000);
  const sData = ctx.getImageData(0, 0, W, H);
  const sd = sData.data;
  for (let i = 0; i < sd.length; i += 4) {
    const n = (_rand() - 0.5) * 12;
    sd[i]   = Math.max(0, Math.min(255, sd[i] + n));
    sd[i+1] = Math.max(0, Math.min(255, sd[i+1] + n));
    sd[i+2] = Math.max(0, Math.min(255, sd[i+2] + n));
  }
  ctx.putImageData(sData, 0, 0);

  // ---- BRICK WALL (left 55%) ----
  const wallW = W * 0.55;
  _drawBrickWall(ctx, 0, 0, wallW, H, 4001);

  // ---- GRAFFITI ON WALL (vertical layout) ----
  _drawGraffiti(ctx, 5, 0, wallW - 10, H, 4002);

  // ---- CHAIN-LINK FENCE (next 20%) ----
  const fenceX = wallW;
  const fenceW = W * 0.2;

  // Fence posts (vertical)
  ctx.fillStyle = '#888';
  const postSpacing = 90;
  for (let y = 0; y < H; y += postSpacing) {
    ctx.fillRect(fenceX, y - 2, fenceW, 4);
    ctx.fillStyle = '#999';
    ctx.fillRect(fenceX - 2, y - 3, 4, 6);
    ctx.fillStyle = '#888';
  }

  // Chain-link diamond pattern (vertical orientation)
  ctx.strokeStyle = 'rgba(170,170,170,0.45)';
  ctx.lineWidth = 1;
  const dSize = 16;
  for (let row = 0; row < Math.ceil(H / dSize); row++) {
    for (let col = 0; col < Math.ceil(fenceW / dSize) + 1; col++) {
      const dx = fenceX + col * dSize + (row % 2) * (dSize / 2);
      const dy = row * dSize;
      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.lineTo(dx + dSize/2, dy + dSize/2);
      ctx.lineTo(dx, dy + dSize);
      ctx.lineTo(dx - dSize/2, dy + dSize/2);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Vertical rails
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(fenceX, 0); ctx.lineTo(fenceX, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(fenceX + fenceW, 0); ctx.lineTo(fenceX + fenceW, H); ctx.stroke();

  // ---- GROUND STRIP with debris (right 25%) ----
  _srand(4003);
  const groundX = fenceX + fenceW;
  ctx.strokeStyle = 'rgba(30,28,25,0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const sx = groundX + _rand() * (W - groundX);
    const sy = _rand() * H;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (_rand()-0.5)*20, sy + (_rand()-0.5)*40);
    ctx.stroke();
  }
  for (let i = 0; i < 20; i++) {
    const dx = groundX + _rand() * (W - groundX);
    const dy = _rand() * H;
    ctx.fillStyle = `rgba(${60+Math.floor(_rand()*30)},${55+Math.floor(_rand()*25)},${50+Math.floor(_rand()*20)},0.4)`;
    ctx.fillRect(dx, dy, 2 + _rand()*5, 1 + _rand()*3);
  }

  // Warm ambient tint
  ctx.fillStyle = 'rgba(180,120,60,0.05)';
  ctx.fillRect(0, 0, W, H);

  scene.textures.addCanvas('arena_border_v', c);
}

/* ----------------------------------------------------------------
 *  SPOTLIGHT TEXTURE — warm street lamp light cone
 * ---------------------------------------------------------------- */
function _generateSpotlightTexture(scene) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2);
  g.addColorStop(0, 'rgba(255,220,150,0.45)');
  g.addColorStop(0.08, 'rgba(255,210,140,0.3)');
  g.addColorStop(0.2, 'rgba(255,200,120,0.15)');
  g.addColorStop(0.4, 'rgba(255,180,100,0.06)');
  g.addColorStop(0.7, 'rgba(200,150,80,0.02)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  scene.textures.addCanvas('arena_spotlight', c);
}

/* ----------------------------------------------------------------
 *  VIGNETTE OVERLAY — warm-tinted edge darkening
 * ---------------------------------------------------------------- */
function _generateVignetteTexture(scene) {
  const W = 256, H = 256;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(W/2, H/2, W*0.2, W/2, H/2, W*0.7);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.4, 'rgba(20,10,5,0.1)');
  g.addColorStop(0.7, 'rgba(30,15,5,0.3)');
  g.addColorStop(0.9, 'rgba(25,12,5,0.55)');
  g.addColorStop(1, 'rgba(20,10,5,0.7)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  scene.textures.addCanvas('vignette_overlay', c);
}

/* ================================================================
 *  DRAW THE FULL ARENA (called from GameScene.create)
 *  Performance: ~12 game objects, 2 gentle tweens
 * ================================================================ */
function drawArenaBackground(scene) {
  const courtL = COURT_CX - 960;
  const courtT = COURT_CY - 580;
  const courtW = 1920;
  const courtH = 1160;

  // 1. World base — warm dark asphalt beyond court
  const base = scene.add.graphics().setDepth(0);
  base.fillStyle(0x3a3530, 1);
  base.fillRect(0, 0, WORLD_W, WORLD_H);

  // 2. Border tiles — separate textures for H and V edges
  // Top border (brick wall at top, ground near court)
  if (scene.textures.exists('arena_border_h') && courtT > 10) {
    scene.add.tileSprite(WORLD_W/2, courtT/2, WORLD_W, courtT, 'arena_border_h')
      .setDepth(0).setAlpha(0.9);
  }
  // Bottom border (flipped so brick wall is at bottom edge)
  const botH = WORLD_H - (courtT + courtH);
  if (scene.textures.exists('arena_border_h') && botH > 10) {
    scene.add.tileSprite(WORLD_W/2, courtT + courtH + botH/2, WORLD_W, botH, 'arena_border_h')
      .setDepth(0).setAlpha(0.9).setFlipY(true);
  }
  // Left border (brick wall at left edge, ground near court)
  if (scene.textures.exists('arena_border_v') && courtL > 10) {
    scene.add.tileSprite(courtL/2, WORLD_H/2, courtL, WORLD_H, 'arena_border_v')
      .setDepth(0).setAlpha(0.85);
  }
  // Right border (flipped so brick wall is at right edge)
  const rightW = WORLD_W - (courtL + courtW);
  if (scene.textures.exists('arena_border_v') && rightW > 10) {
    scene.add.tileSprite(courtL + courtW + rightW/2, WORLD_H/2, rightW, WORLD_H, 'arena_border_v')
      .setDepth(0).setAlpha(0.85).setFlipX(true);
  }

  // 3. Court floor
  if (scene.textures.exists('arena_floor')) {
    scene.add.image(COURT_CX, COURT_CY, 'arena_floor')
      .setDisplaySize(courtW, courtH).setDepth(1);
  }

  // 4. Street lamp spotlights — warm yellow, ADD blend
  if (scene.textures.exists('arena_spotlight')) {
    // Center lamp (brightest)
    const centerLight = scene.add.image(COURT_CX, COURT_CY, 'arena_spotlight')
      .setDisplaySize(1400, 1400).setAlpha(0.18).setTint(0xffdca0)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(2);
    scene.tweens.add({
      targets: centerLight, alpha: { from: 0.16, to: 0.22 },
      duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Left lamp
    scene.add.image(COURT_CX - 650, COURT_CY - 200, 'arena_spotlight')
      .setDisplaySize(900, 900).setAlpha(0.10).setTint(0xffe0a0)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(2);

    // Right lamp
    scene.add.image(COURT_CX + 650, COURT_CY + 200, 'arena_spotlight')
      .setDisplaySize(900, 900).setAlpha(0.10).setTint(0xffe0a0)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(2);

    // Far corner lamps (dim)
    scene.add.image(COURT_CX - 800, COURT_CY + 400, 'arena_spotlight')
      .setDisplaySize(600, 600).setAlpha(0.06).setTint(0xffd080)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(2);
    scene.add.image(COURT_CX + 800, COURT_CY - 400, 'arena_spotlight')
      .setDisplaySize(600, 600).setAlpha(0.06).setTint(0xffd080)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(2);
  }

  // 5. Vignette (camera-fixed, warm-tinted)
  if (scene.textures.exists('vignette_overlay')) {
    scene.add.image(GW/2, GH/2, 'vignette_overlay')
      .setScrollFactor(0).setDisplaySize(GW, GH).setDepth(45).setAlpha(0.65);
  }
}

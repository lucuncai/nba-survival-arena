/* ================================================================
 *  GameScene.js — Main gameplay scene
 *
 *  Responsibilities:
 *    - Scene lifecycle (create / update)
 *    - Physics groups and collision wiring
 *    - Input (joystick + keyboard)
 *    - HUD rendering
 *    - Game-over flow
 *
 *  Heavy subsystems are split into mixins applied at the bottom:
 *    GameScene_Combat    — auto-attack, damage, kill, projectile
 *    GameScene_EnemyAI   — enemy state machine, shooting, ball scoring
 *    GameScene_Spawning  — wave spawning, boss spawning
 *    GameScene_Skills    — per-character skill implementations
 *    GameScene_Upgrade   — level-up overlay
 * ================================================================ */

class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) { this.charIndex = data.charIndex || 0; }

  // ================================================================
  //  CREATE
  // ================================================================
  create() {
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    // Background — street basketball arena
    drawArenaBackground(this);

    // Hoop
    this._createHoop();

    // Player
    this._createPlayer(CHARACTERS[this.charIndex]);

    // Physics groups
    this.enemies           = this.physics.add.group();
    this.enemyBalls        = this.physics.add.group();
    this.playerProjectiles = this.physics.add.group();
    this.xpOrbs            = this.physics.add.group();
    this.drops             = this.physics.add.group();

    // Camera
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Apply post-processing effects
    try { applyPostFX(this); } catch(e) { console.warn('PostFX skipped:', e); }

    // Collisions (solid)
    this.physics.add.collider(this.player, this.enemies, this._onPlayerTouchEnemy, null, this);
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.collider(this.player, this.hoopBody);
    this.physics.add.collider(this.enemies, this.hoopBody);

    // Overlaps (triggers)
    this.physics.add.overlap(this.player, this.enemyBalls, this._onPlayerBlockBall, null, this);
    this.physics.add.overlap(this.playerProjectiles, this.enemies, this._onProjHitEnemy, null, this);
    this.physics.add.overlap(this.playerProjectiles, this.enemyBalls, this._onProjHitBall, null, this);
    this.physics.add.overlap(this.player, this.xpOrbs, this._onCollectXP, null, this);
    this.physics.add.overlap(this.player, this.drops, this._onCollectDrop, null, this);

    // Game state
    this.gameTime      = 0;
    this.kills         = 0;
    this.combo         = 0;
    this.maxCombo      = 0;
    this.comboTimer    = 0;
    this.blocks        = 0;
    this.spawnTimer    = 0;
    this.spawnInterval = 1.8;
    this.hitStopTimer  = 0;
    this.isPaused      = false;
    this.gameOver      = false;
    this.bossTimer     = 60;
    this.bossCount     = 0;
    this.bossAlive     = false;
    this.currentBoss   = null;
    this.slowMo        = 1;

    // Input
    this._setupJoystick();
    this._setupSkillButtons();

    // HUD
    this._setupHUD();
    SFX.init();

    // Show skill buttons
    ['btn-skill1', 'btn-skill2', 'btn-skill3', 'btn-ult'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'flex';
    });
    document.getElementById('hoop-hud').style.display = 'block';
    this._updateSkillLabels();

    // Initial enemies
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const dist  = 500 + Math.random() * 300;
      this._spawnEnemy(
        ENEMY_TYPES[0],
        Phaser.Math.Clamp(COURT_CX + Math.cos(angle) * dist, 50, WORLD_W - 50),
        Phaser.Math.Clamp(COURT_CY + Math.sin(angle) * dist, 50, WORLD_H - 50),
      );
    }
  }

  // ================================================================
  //  UPDATE
  // ================================================================
  update(_time, rawDelta) {
    if (this.gameOver) return;
    const dt = (rawDelta / 1000) * this.slowMo;
    if (this.hitStopTimer > 0) { this.hitStopTimer -= rawDelta / 1000; return; }
    if (this.isPaused) return;

    this.gameTime += dt;
    const p = this.player;

    // Cooldowns
    if (p.atkCD    > 0) p.atkCD    -= dt;
    if (p.skill1CD > 0) p.skill1CD -= dt;
    if (p.skill2CD > 0) p.skill2CD -= dt;
    if (p.skill3CD > 0) p.skill3CD -= dt;
    if (p.ultCD    > 0) p.ultCD    -= dt;
    if (p.invTimer > 0) p.invTimer -= dt;
    if (p.mambaMode  > 0) p.mambaMode  -= dt;
    if (p.kingDomain > 0) p.kingDomain -= dt;
    if (p.nightNight > 0) p.nightNight -= dt;

    // Combo decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    // Movement
    this._updateJoystick();
    let mx = this.joyX, my = this.joyY;
    if (this.cursors.left.isDown  || this.wasd.A.isDown) mx = -1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) mx = 1;
    if (this.cursors.up.isDown    || this.wasd.W.isDown) my = -1;
    if (this.cursors.down.isDown  || this.wasd.S.isDown) my = 1;
    const mag = Math.sqrt(mx * mx + my * my);
    const spd = p.spd * p.spdMul;
    if (mag > 0.1) {
      p.body.setVelocity((mx / mag) * spd, (my / mag) * spd);
      p.face = mx >= 0 ? 1 : -1;
      p.setFlipX(p.face < 0);
      this._playAnim(p, `${p.charDef.id}_walk`);
    } else {
      p.body.setVelocity(0, 0);
      this._playAnim(p, `${p.charDef.id}_idle`);
    }

    // Auto attack
    if (p.atkCD <= 0) {
      const nearest = this._nearestEnemy(p.x, p.y, p.charDef.atkRange * p.rangeMul * 3);
      if (nearest) {
        this._doAutoAttack(nearest);
        p.atkCD = 1 / (p.atkSpd * (p.mambaMode > 0 ? 1.5 : 1));
      }
    }

    // Subsystems
    this._updateEnemies(dt);
    this._updateEnemyBalls(dt);
    this._attractXP();
    this._updateSpawning(dt);

    // Boss timer
    this.bossTimer -= dt;
    if (this.bossTimer <= 0 && !this.bossAlive) {
      this._spawnBoss();
      this.bossTimer = 60 + this.bossCount * 15;
    }

    // HUD
    this._updateHUD();
    this._updateCooldownOverlays();
  }

  // ================================================================
  //  HOOP
  // ================================================================
  _createHoop() {
    this.hoop = { hp: HOOP_CFG.maxHp, maxHp: HOOP_CFG.maxHp };

    const gfx = this.add.graphics().setDepth(5);
    gfx.lineStyle(6, 0xff6600, 1);
    gfx.strokeCircle(COURT_CX, COURT_CY, HOOP_CFG.radius);
    gfx.lineStyle(2, 0xffffff, 0.4);
    gfx.strokeCircle(COURT_CX, COURT_CY, HOOP_CFG.radius + 8);
    this.hoopGfx = gfx;

    // Backboard
    this.add.rectangle(COURT_CX, COURT_CY - HOOP_CFG.radius - 20, 80, 10, 0xffffff, 0.6).setDepth(5);

    // Physics body
    this.hoopBody = this.physics.add.staticImage(COURT_CX, COURT_CY, '__DEFAULT');
    this.hoopBody.setVisible(false);
    this.hoopBody.body.setCircle(HOOP_CFG.bodyRadius);
    this.hoopBody.body.setOffset(
      this.hoopBody.width / 2 - HOOP_CFG.bodyRadius,
      this.hoopBody.height / 2 - HOOP_CFG.bodyRadius,
    );
  }

  // ================================================================
  //  PLAYER
  // ================================================================
  _createPlayer(def) {
    const sprKey = `${def.id}_idle`;
    if (this.textures.exists(sprKey)) {
      this.player = this.physics.add.sprite(COURT_CX + 150, COURT_CY, sprKey, 0).setScale(0.55);
    } else {
      this.player = this.physics.add.sprite(COURT_CX + 150, COURT_CY);
      this.player.setSize(50, 50);
    }
    this.player.setCollideWorldBounds(true).setDepth(10);
    this.player.body.setCircle(def.bodyRadius);
    this.player.body.setOffset(
      this.player.width * 0.55 / 2 - def.bodyRadius,
      this.player.height * 0.55 / 2 - def.bodyRadius,
    );
    this.player.body.setMass(3);

    Object.assign(this.player, {
      charDef: def,
      hp: def.hp, maxHp: def.hp,
      atk: def.atk, spd: def.spd, atkSpd: def.atkSpd,
      atkMul: 1, spdMul: 1, critRate: 0.05, critDmg: 2.0,
      lifeSteal: 0, cdMul: 1, rangeMul: 1, blockRange: 1, mass: 1,
      atkCD: 0, skill1CD: 0, skill2CD: 0, skill3CD: 0, ultCD: 0,
      level: 1, xp: 0, xpToNext: 120,
      invTimer: 0, face: 1, atkAnim: 0,
      mambaMode: 0, kingDomain: 0, nightNight: 0,
    });
  }

  // ================================================================
  //  COURT DRAWING (fallback when no background texture)
  // ================================================================
  _drawCourt() {
    const g = this.add.graphics();
    g.fillStyle(0xc8915a, 1);
    g.fillRect(0, 0, WORLD_W, WORLD_H);
    g.lineStyle(1, 0xb8814a, 0.3);
    for (let x = 0; x < WORLD_W; x += 80) g.lineBetween(x, 0, x, WORLD_H);
    g.lineStyle(4, 0xffffff, 0.8);
    g.strokeCircle(COURT_CX, COURT_CY, 180);
    g.strokeCircle(COURT_CX, COURT_CY, 8);
    g.lineStyle(2, 0xffffff, 0.3);
    g.strokeCircle(COURT_CX, COURT_CY, 480);
    g.lineStyle(4, 0xffffff, 0.6);
    g.strokeRect(COURT_CX - 900, COURT_CY - 550, 1800, 1100);
  }

  // ================================================================
  //  JOYSTICK (virtual + keyboard)
  // ================================================================
  _setupJoystick() {
    this.joyActive  = false;
    this.joyX       = 0;
    this.joyY       = 0;
    this.joyPointer = null;
    const defX = 180, defY = GH - 180;
    this.joyDefX = defX;
    this.joyDefY = defY;

    this.joyBase = this.add.circle(defX, defY, 120, 0xffffff, 0.25)
      .setScrollFactor(0).setDepth(100).setStrokeStyle(3, 0xffffff, 0.5);
    this.joyThumb = this.add.circle(defX, defY, 55, 0xffffff, 0.6)
      .setScrollFactor(0).setDepth(101);
    this.joyBaseX = defX;
    this.joyBaseY = defY;

    this.input.on('pointerdown', ptr => {
      if (ptr.x < this.cameras.main.width * 0.55 && !this.joyActive) {
        this.joyActive = true;
        this.joyPointer = ptr;
        this.joyBaseX = ptr.x;
        this.joyBaseY = ptr.y;
        this.joyBase.setPosition(ptr.x, ptr.y).setAlpha(0.45);
        this.joyThumb.setPosition(ptr.x, ptr.y).setAlpha(0.9);
      }
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys('W,A,S,D');
  }

  _updateJoystick() {
    if (!this.joyActive || !this.joyPointer) return;
    if (!this.joyPointer.isDown) { this._resetJoystick(); return; }
    const dx = this.joyPointer.x - this.joyBaseX;
    const dy = this.joyPointer.y - this.joyBaseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxD = 90;
    if (dist > 2) {
      const a  = Math.atan2(dy, dx);
      const cl = Math.min(dist, maxD);
      this.joyX = Math.cos(a) * (cl / maxD);
      this.joyY = Math.sin(a) * (cl / maxD);
      this.joyThumb.setPosition(this.joyBaseX + Math.cos(a) * cl, this.joyBaseY + Math.sin(a) * cl);
    } else {
      this.joyX = 0; this.joyY = 0;
      this.joyThumb.setPosition(this.joyBaseX, this.joyBaseY);
    }
  }

  _resetJoystick() {
    this.joyActive = false; this.joyPointer = null; this.joyX = 0; this.joyY = 0;
    this.joyBase.setPosition(this.joyDefX, this.joyDefY).setAlpha(0.25);
    this.joyThumb.setPosition(this.joyDefX, this.joyDefY).setAlpha(0.4);
  }

  // ================================================================
  //  SKILL BUTTONS (DOM binding)
  // ================================================================
  _setupSkillButtons() {
    const bind = (elId, fn) => {
      const el = document.getElementById(elId);
      if (!el) return;
      const handler = e => { e.preventDefault(); e.stopPropagation(); fn(); };
      el.addEventListener('touchstart', handler, { passive: false });
      el.addEventListener('mousedown', handler);
    };
    bind('btn-skill1', () => this.doSkill1());
    bind('btn-skill2', () => this.doSkill2());
    bind('btn-skill3', () => this.doSkill3());
    bind('btn-ult',    () => this.doUlt());

    this.input.keyboard.on('keydown-J',     () => this.doSkill1());
    this.input.keyboard.on('keydown-K',     () => this.doSkill2());
    this.input.keyboard.on('keydown-L',     () => this.doSkill3());
    this.input.keyboard.on('keydown-SPACE', () => this.doUlt());
  }

  _updateSkillLabels() {
    const ch = CHARACTERS[this.charIndex];
    document.getElementById('btn-skill1').textContent = ch.skill1.name;
    document.getElementById('btn-skill2').textContent = ch.skill2.name;
    document.getElementById('btn-skill3').textContent = ch.skill3.name;
    document.getElementById('btn-ult').textContent    = ch.ult.name;
  }

  // ================================================================
  //  HUD
  // ================================================================
  _setupHUD() {
    const s = { fontSize: '20px', color: '#fff', fontFamily: 'system-ui', stroke: '#000', strokeThickness: 3 };
    this.hpText    = this.add.text(20, 20, '', s).setScrollFactor(0).setDepth(50);
    this.levelText = this.add.text(20, 50, '', s).setScrollFactor(0).setDepth(50);
    this.killText  = this.add.text(GW - 20, 20, '', { ...s, align: 'right' }).setOrigin(1, 0).setScrollFactor(0).setDepth(50);
    this.timeText  = this.add.text(GW - 20, 50, '', { ...s, align: 'right' }).setOrigin(1, 0).setScrollFactor(0).setDepth(50);
    this.blockText = this.add.text(GW - 20, 80, '', { ...s, align: 'right', fontSize: '16px', color: '#3498db' }).setOrigin(1, 0).setScrollFactor(0).setDepth(50);
    this.comboText = this.add.text(GW / 2, 110, '', {
      fontSize: '36px', color: '#f1c40f', fontFamily: 'system-ui', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);
    this.bossTimerText = this.add.text(GW / 2, 55, '', {
      fontSize: '16px', color: '#e74c3c', fontFamily: 'system-ui', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);

    this.hpBarBg = this.add.rectangle(160, 15, 250, 16, 0x333333).setOrigin(0, 0).setScrollFactor(0).setDepth(49);
    this.hpBar   = this.add.rectangle(160, 15, 250, 16, 0x2ecc71).setOrigin(0, 0).setScrollFactor(0).setDepth(50);
    this.xpBarBg = this.add.rectangle(160, 35, 250, 8, 0x333333).setOrigin(0, 0).setScrollFactor(0).setDepth(49);
    this.xpBar   = this.add.rectangle(160, 35, 0, 8, 0x3498db).setOrigin(0, 0).setScrollFactor(0).setDepth(50);
  }

  _updateHUD() {
    const p = this.player;
    this.hpText.setText(`HP: ${Math.floor(p.hp)}/${Math.floor(p.maxHp)}`);
    this.levelText.setText(`Lv.${p.level}`);
    this.killText.setText(`Kills: ${this.kills}`);
    this.timeText.setText(`${Math.floor(this.gameTime)}s`);
    this.blockText.setText(`Blocks: ${this.blocks}`);

    this.comboText.setText(this.combo > 1 ? `${this.combo}x COMBO` : '');
    this.comboText.setAlpha(this.combo > 1 ? 1 : 0);

    this.bossTimerText.setText(
      this.bossAlive ? 'BOSS ACTIVE!' : `Boss in ${Math.max(0, Math.floor(this.bossTimer))}s`,
    );

    // HP bar
    const hpRatio = Math.max(0, p.hp / p.maxHp);
    this.hpBar.displayWidth = 250 * hpRatio;
    this.hpBar.setFillStyle(hpRatio > 0.5 ? 0x2ecc71 : hpRatio > 0.25 ? 0xf39c12 : 0xe74c3c);

    // XP bar
    this.xpBar.displayWidth = 250 * (p.xp / p.xpToNext);

    // Hoop HUD (DOM)
    const hoopRatio = Math.max(0, this.hoop.hp / this.hoop.maxHp);
    document.getElementById('hoop-bar').style.width = (hoopRatio * 100) + '%';
    document.getElementById('hoop-hp-text').textContent = `${Math.floor(this.hoop.hp)} / ${this.hoop.maxHp}`;
    const hoopBarEl = document.getElementById('hoop-bar');
    if (hoopRatio < 0.3)      hoopBarEl.style.background = 'linear-gradient(90deg,#e74c3c,#c0392b)';
    else if (hoopRatio < 0.6) hoopBarEl.style.background = 'linear-gradient(90deg,#f39c12,#e67e22)';
    else                      hoopBarEl.style.background = 'linear-gradient(90deg,#3498db,#2ecc71)';
  }

  _updateCooldownOverlays() {
    const p  = this.player;
    const ch = CHARACTERS[this.charIndex];
    this._updateCDOverlay('btn-skill1', p.skill1CD, ch.skill1.cd * p.cdMul);
    this._updateCDOverlay('btn-skill2', p.skill2CD, ch.skill2.cd * p.cdMul);
    this._updateCDOverlay('btn-skill3', p.skill3CD, ch.skill3.cd * p.cdMul);
    this._updateCDOverlay('btn-ult',    p.ultCD,    ch.ult.cd * p.cdMul);
  }

  _updateCDOverlay(btnId, remaining, total) {
    const el = document.getElementById(btnId);
    if (!el) return;
    let overlay = el.querySelector('.cd-overlay');
    if (remaining > 0) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'cd-overlay';
        el.appendChild(overlay);
      }
      overlay.textContent = Math.ceil(remaining) + 's';
      overlay.style.display = 'flex';
    } else if (overlay) {
      overlay.style.display = 'none';
    }
  }

  // ================================================================
  //  VISUAL EFFECTS
  // ================================================================
  floatText(x, y, text, color) {
    const t = this.add.text(x, y, text, {
      fontSize: '22px', color, fontFamily: 'system-ui', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  fxPulse(x, y, color) {
    const c = this.add.circle(x, y, 20, color, 0.5).setDepth(20);
    this.tweens.add({ targets: c, scale: 3, alpha: 0, duration: 400, onComplete: () => c.destroy() });
  }

  fxKillBurst(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const p = this.add.circle(x, y, 5, color, 0.8).setDepth(20);
      this.tweens.add({
        targets: p, x: x + Math.cos(a) * 60, y: y + Math.sin(a) * 60,
        alpha: 0, scale: 0.2, duration: 400, onComplete: () => p.destroy(),
      });
    }
  }

  fxExplosion(x, y) {
    const c = this.add.circle(x, y, 30, 0xe74c3c, 0.6).setDepth(20);
    this.tweens.add({ targets: c, scale: 8, alpha: 0, duration: 600, onComplete: () => c.destroy() });
  }

  // ================================================================
  //  ANIMATION HELPER
  // ================================================================
  _playAnim(sprite, key) {
    if (this.anims.exists(key) && sprite.anims.currentAnim?.key !== key) {
      sprite.play(key, true);
    }
  }

  // ================================================================
  //  GAME OVER
  // ================================================================
  _gameOver(reason) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();

    ['btn-skill1', 'btn-skill2', 'btn-skill3', 'btn-ult'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    document.getElementById('hoop-hud').style.display = 'none';

    const stats = {
      time:   Math.floor(this.gameTime),
      kills:  this.kills,
      combo:  this.maxCombo,
      level:  this.player.level,
      blocks: this.blocks,
    };

    const isNewRecord = Records.save(stats);
    const best = Records.get();

    const overlay = document.getElementById('gameover-overlay');
    overlay.style.display = 'flex';

    const reasonText = reason === 'hoop' ? 'The hoop was destroyed!' : 'You were defeated!';
    document.getElementById('go-stats').innerHTML =
      `${reasonText}<br>Time: ${stats.time}s | Kills: ${stats.kills} | Blocks: ${stats.blocks}<br>Max Combo: ${stats.combo}x | Level: ${stats.level}`;
    document.getElementById('go-best').innerHTML =
      `Best: ${best.bestTime}s | ${best.bestKills} kills | ${best.bestBlocks} blocks | Lv.${best.bestLevel}`;
    document.getElementById('go-newrecord').style.display = isNewRecord ? 'block' : 'none';
    document.getElementById('go-restart').onclick = () => {
      overlay.style.display = 'none';
      this.scene.restart({ charIndex: this.charIndex });
    };
  }
}

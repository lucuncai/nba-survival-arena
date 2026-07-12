/* ================================================================
 *  GameScene_Combat.js — Auto-attack, damage, kill, projectile
 *
 *  Applied as a mixin to GameScene.prototype.
 * ================================================================ */

Object.assign(GameScene.prototype, {

  /** Find the nearest active enemy within maxDist of (x, y). */
  _nearestEnemy(x, y, maxDist) {
    let best = null, bestD = maxDist;
    this.enemies.getChildren().forEach(e => {
      if (!e.active || e.isDead) return;
      const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (d < bestD) { bestD = d; best = e; }
    });
    return best;
  },

  /** Perform a 180-degree melee sweep toward the nearest enemy. */
  _doAutoAttack(target) {
    const p = this.player;
    const angle = Math.atan2(target.y - p.y, target.x - p.x);
    const range = p.charDef.atkRange * p.rangeMul * (p.mambaMode > 0 ? 1.5 : 1);
    const baseDmg = p.atk * p.atkMul * (p.mambaMode > 0 ? 3 : 1);
    const sweepAngle = Math.PI;

    // Visual arc
    const arcGfx = this.add.graphics().setDepth(12);
    arcGfx.fillStyle(p.charDef.projCol, 0.35);
    arcGfx.slice(p.x, p.y, range, angle - sweepAngle / 2, angle + sweepAngle / 2, false);
    arcGfx.fillPath();
    this.tweens.add({ targets: arcGfx, alpha: 0, duration: 200, onComplete: () => arcGfx.destroy() });

    // Hit all enemies in the cone
    this.enemies.getChildren().forEach(e => {
      if (!e.active || e.isDead) return;
      const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y);
      if (d > range) return;
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      let diff = a - angle;
      while (diff > Math.PI)  diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > sweepAngle / 2) return;

      const isCrit = Math.random() < p.critRate;
      const finalDmg = isCrit ? baseDmg * p.critDmg : baseDmg;
      const knockAngle = Math.atan2(e.y - p.y, e.x - p.x);
      this.damageEnemy(e, finalDmg, isCrit, 180, knockAngle);
    });

    SFX.hit();
  },

  // ── Damage & Kill ──────────────────────────────────────────────

  damageEnemy(enemy, dmg, isCrit, knockback, knockAngle) {
    if (!enemy.active || enemy.isDead) return;
    const finalDmg = Math.floor(dmg);
    enemy.hp -= finalDmg;

    // Knockback (unless super armor during windup)
    if (knockback && !(enemy.typeDef.superArmor && enemy.aiState === 'windup')) {
      const kb = knockback * (1 / (enemy.body.mass || 1));
      enemy.body.setVelocity(Math.cos(knockAngle) * kb * 5, Math.sin(knockAngle) * kb * 5);
      if (enemy.aiState === 'windup') {
        enemy.aiState = 'approach';
        if (enemy.windupCircle) { enemy.windupCircle.destroy(); enemy.windupCircle = null; }
      }
    }

    // Damage text
    const col = isCrit ? '#f1c40f' : '#ffffff';
    this.floatText(enemy.x + Phaser.Math.Between(-15, 15), enemy.y - 30, isCrit ? `${finalDmg}!` : `${finalDmg}`, col);

    // VFX: hit sparks + camera shake
    VFX.hitSparks(this, enemy.x, enemy.y, isCrit ? 0xf1c40f : 0xff6644, isCrit);
    VFX.hitShake(this, isCrit);

    // Flash
    enemy.setTint(0xff0000);
    this.time.delayedCall(100, () => { if (enemy.active) enemy.clearTint(); });

    // Knockback trail VFX
    if (knockback && knockback > 50) {
      VFX.knockbackTrail(this, enemy, isCrit ? 0xf1c40f : 0xff4444);
    }

    // Combo
    this.combo++;
    this.comboTimer = 3;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    VFX.comboPopup(this, this.combo, enemy.x, enemy.y);

    // Life steal
    const p = this.player;
    if (p.lifeSteal > 0) {
      p.hp = Math.min(p.maxHp, p.hp + finalDmg * p.lifeSteal);
    }

    // Hit stop for crits
    if (isCrit) { this.hitStopTimer = 0.03; SFX.critHit(); } else { SFX.hit(); }

    if (enemy.hp <= 0) this._killEnemy(enemy);
  },

  _killEnemy(enemy) {
    enemy.isDead = true;
    this.kills++;
    SFX.kill();

    if (enemy.hpBar)       { enemy.hpBar.destroy(); enemy.hpBarFill.destroy(); }
    if (enemy.windupCircle) { enemy.windupCircle.destroy(); }

    if (enemy.isBoss) {
      this.bossAlive = false;
      this.currentBoss = null;
      this.cameras.main.shake(500, 0.02);
    }

    this._spawnXPOrb(enemy.x, enemy.y, enemy.typeDef.xp);

    // Drop chance
    const dropMul = enemy.isBoss ? 5 : 1;
    for (const dt of DROP_TYPES) {
      if (Math.random() < dt.chance * dropMul) {
        this._spawnDrop(enemy.x, enemy.y, dt);
        break;
      }
    }

    this.fxKillBurst(enemy.x, enemy.y, enemy.typeDef.color || 0xffffff);
    enemy.destroy();
  },

  // ── Projectile helper ──────────────────────────────────────────

  _fireProjectile(x, y, angle, dmg, speed, range, piercing, knockback) {
    const proj = this.physics.add.image(x, y, '__DEFAULT').setVisible(false);
    proj.body.setCircle(8);
    proj.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    proj.dmg = dmg;
    proj.isCrit = Math.random() < this.player.critRate;
    if (proj.isCrit) proj.dmg *= this.player.critDmg;
    proj.knockback = knockback || 100;
    proj.knockAngle = angle;
    proj.piercing = piercing || false;
    proj._piercing = piercing || false;
    this.playerProjectiles.add(proj);

    // Visual trail
    const trail = this.add.circle(x, y, 6, this.player.charDef.projCol, 0.8).setDepth(8);
    this.tweens.add({
      targets: trail, x: x + Math.cos(angle) * range, y: y + Math.sin(angle) * range,
      alpha: 0, duration: (range / speed) * 1000, onComplete: () => trail.destroy(),
    });

    this.time.delayedCall((range / speed) * 1000, () => { if (proj.active) proj.destroy(); });
    return proj;
  },

  // ── Collision handlers ─────────────────────────────────────────

  _onPlayerTouchEnemy(player, enemy) {
    if (!enemy.active || enemy.isDead || player.invTimer > 0) return;
    const dmg = enemy.typeDef.atk * (1 + this.gameTime / 180);
    player.hp -= dmg;
    player.invTimer = 0.3;
    this.floatText(player.x, player.y - 50, `-${Math.floor(dmg)}`, '#e74c3c');
    SFX.hurt();
    player.setTint(0xff0000);
    this.time.delayedCall(200, () => { if (player.active) player.clearTint(); });
    if (player.hp <= 0) this._gameOver('player');
  },

  _onPlayerBlockBall(player, ball) {
    if (!ball.active) return;
    this.blocks++;
    this.floatText(player.x, player.y - 70, 'BLOCKED!', '#3498db');
    SFX.blocked();
    VFX.blockExplosion(this, ball.x, ball.y);
    if (ball._trail) ball._trail.destroy();
    ball.destroy();
    this._grantXP(15);
  },

  _onProjHitEnemy(proj, enemy) {
    if (!proj.active || !enemy.active || enemy.isDead) return;
    this.damageEnemy(enemy, proj.dmg, proj.isCrit, proj.knockback, proj.knockAngle);
    if (!proj._piercing) proj.destroy();
  },

  _onProjHitBall(proj, ball) {
    if (!proj.active || !ball.active) return;
    this.blocks++;
    this.floatText(ball.x, ball.y - 30, 'BLOCKED!', '#3498db');
    SFX.blocked();
    VFX.blockExplosion(this, ball.x, ball.y);
    if (ball._trail) ball._trail.destroy();
    ball.destroy();
    proj.destroy();
    this._grantXP(10);
  },

  _onCollectXP(player, orb) {
    if (!orb.active) return;
    this._grantXP(orb.xpValue || 10);
    orb.destroy();
    SFX.pickup();
  },

  _onCollectDrop(player, drop) {
    if (!drop.active) return;
    const dropDef = drop.dropDef;
    if (dropDef && dropDef.effect) dropDef.effect(this);
    this.floatText(player.x, player.y - 80, dropDef.name, '#f1c40f');
    SFX.pickup();
    drop.destroy();
  },

  // ── XP & Drops ─────────────────────────────────────────────────

  _spawnXPOrb(x, y, value) {
    const orb = this.add.circle(
      x + Phaser.Math.Between(-20, 20),
      y + Phaser.Math.Between(-20, 20),
      8, 0x3498db, 0.8,
    ).setDepth(4);
    this.physics.add.existing(orb);
    orb.body.setCircle(8);
    orb.xpValue = value;
    this.xpOrbs.add(orb);
    this.time.delayedCall(15000, () => { if (orb.active) orb.destroy(); });
  },

  _grantXP(amount) {
    const p = this.player;
    p.xp += amount;
    while (p.xp >= p.xpToNext) {
      p.xp -= p.xpToNext;
      p.level++;
      p.xpToNext = Math.floor(120 + p.level * 40);
      this._showUpgrade();
      SFX.levelUp();
    }
  },

  _spawnDrop(x, y, dropDef) {
    const drop = this.add.circle(x, y, 14, dropDef.color, 0.9).setDepth(5);
    this.physics.add.existing(drop);
    drop.body.setCircle(14);
    drop.dropDef = dropDef;
    this.drops.add(drop);
    this.tweens.add({ targets: drop, scale: 1.3, yoyo: true, repeat: -1, duration: 500 });
    this.time.delayedCall(20000, () => { if (drop.active) drop.destroy(); });
  },

  _attractXP() {
    const p = this.player;
    const magnetRange = 180;
    this.xpOrbs.getChildren().forEach(orb => {
      if (!orb.active) return;
      const d = Phaser.Math.Distance.Between(orb.x, orb.y, p.x, p.y);
      if (d < magnetRange) {
        const angle = Math.atan2(p.y - orb.y, p.x - orb.x);
        const speed = 400 * (1 - d / magnetRange) + 100;
        orb.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      }
    });
  },
});

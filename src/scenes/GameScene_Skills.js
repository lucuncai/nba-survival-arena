/* ================================================================
 *  GameScene_Skills.js — Per-character skill implementations
 *
 *  Skill dispatch:
 *    doSkill1/2/3, doUlt → switch on charDef.id → _<char>Skill<N>
 *
 *  Applied as a mixin to GameScene.prototype.
 * ================================================================ */

Object.assign(GameScene.prototype, {

  // ── Dispatch ───────────────────────────────────────────────────

  doSkill1() {
    const p = this.player;
    if (p.skill1CD > 0 || this.isPaused || this.gameOver) return;
    p.skill1CD = CHARACTERS[this.charIndex].skill1.cd * p.cdMul;
    SFX.skill();
    switch (p.charDef.id) {
      case 'lebron': this._lebronSkill1(); break;
      case 'kobe':   this._kobeSkill1();   break;
      case 'curry':  this._currySkill1();  break;
    }
  },

  doSkill2() {
    const p = this.player;
    if (p.skill2CD > 0 || this.isPaused || this.gameOver) return;
    p.skill2CD = CHARACTERS[this.charIndex].skill2.cd * p.cdMul;
    SFX.skill();
    switch (p.charDef.id) {
      case 'lebron': this._lebronSkill2(); break;
      case 'kobe':   this._kobeSkill2();   break;
      case 'curry':  this._currySkill2();  break;
    }
  },

  doSkill3() {
    const p = this.player;
    if (p.skill3CD > 0 || this.isPaused || this.gameOver) return;
    p.skill3CD = CHARACTERS[this.charIndex].skill3.cd * p.cdMul;
    SFX.skill();
    switch (p.charDef.id) {
      case 'lebron': this._lebronSkill3(); break;
      case 'kobe':   this._kobeSkill3();   break;
      case 'curry':  this._currySkill3();  break;
    }
  },

  doUlt() {
    const p = this.player;
    if (p.ultCD > 0 || this.isPaused || this.gameOver) return;
    p.ultCD = CHARACTERS[this.charIndex].ult.cd * p.cdMul;
    SFX.ultimate();
    this.cameras.main.shake(400, 0.015);
    switch (p.charDef.id) {
      case 'lebron': this._lebronUlt(); break;
      case 'kobe':   this._kobeUlt();   break;
      case 'curry':  this._curryUlt();  break;
    }
  },

  // ================================================================
  //  LEBRON — Paint Guardian
  // ================================================================

  /** Skill 1: The Block — fan-shaped swat that destroys all airborne balls. */
  _lebronSkill1() {
    const p = this.player;
    const range = 200 * (p.blockRange || 1);
    const angle = Math.atan2(0, p.face);

    // Visual arc
    const arc = this.add.graphics().setDepth(20);
    arc.fillStyle(0x3498db, 0.4);
    arc.slice(p.x, p.y, range, angle - Math.PI / 3, angle + Math.PI / 3, false);
    arc.fillPath();
    this.tweens.add({ targets: arc, alpha: 0, duration: 400, onComplete: () => arc.destroy() });

    // Destroy enemy balls in fan
    let blocked = 0;
    this.enemyBalls.getChildren().forEach(ball => {
      if (!ball.active) return;
      const d = Phaser.Math.Distance.Between(p.x, p.y, ball.x, ball.y);
      if (d < range) {
        const a = Math.atan2(ball.y - p.y, ball.x - p.x);
        if (Math.abs(Phaser.Math.Angle.Wrap(a - angle)) < Math.PI / 3) {
          this.floatText(ball.x, ball.y - 20, 'BLOCKED!', '#3498db');
          if (ball._trail) ball._trail.destroy();
          ball.destroy();
          blocked++;
        }
      }
    });

    // Damage enemies in fan
    const dmg = p.atk * p.atkMul * 2;
    this.enemies.getChildren().forEach(e => {
      if (!e.active || e.isDead) return;
      const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y);
      if (d < range) {
        const a = Math.atan2(e.y - p.y, e.x - p.x);
        if (Math.abs(Phaser.Math.Angle.Wrap(a - angle)) < Math.PI / 3) {
          this.damageEnemy(e, dmg, false, 200, a);
        }
      }
    });

    this.blocks += blocked;
    if (blocked > 0) this._grantXP(blocked * 15);
  },

  /** Skill 2: And One — unstoppable charge that knocks back all enemies. */
  _lebronSkill2() {
    const p = this.player;
    const dir = p.face;
    const dmg = p.atk * p.atkMul * 3;
    p.invTimer = 0.5;
    const hitEnemies = new Set();

    this.tweens.add({
      targets: p, x: p.x + dir * 300, duration: 300, ease: 'Quad.easeOut',
      onUpdate: () => {
        const trail = this.add.circle(p.x, p.y, 20, 0xf1c40f, 0.4).setDepth(8);
        this.tweens.add({ targets: trail, alpha: 0, scale: 0.3, duration: 300, onComplete: () => trail.destroy() });
        this.enemies.getChildren().forEach(e => {
          if (!e.active || e.isDead || hitEnemies.has(e)) return;
          if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < 80) {
            this.damageEnemy(e, dmg, false, 400, Math.atan2(e.y - p.y, e.x - p.x));
            hitEnemies.add(e);
          }
        });
      },
    });
  },

  /** Skill 3: Earthquake — AOE slam that stuns nearby enemies for 2s. */
  _lebronSkill3() {
    const p = this.player;
    const range = 250;
    const dmg = p.atk * p.atkMul * 2.5;

    const wave = this.add.circle(p.x, p.y, 30, 0xe74c3c, 0.5).setDepth(20);
    this.tweens.add({ targets: wave, scale: range / 30, alpha: 0, duration: 500, onComplete: () => wave.destroy() });
    this.cameras.main.shake(300, 0.02);

    this.enemies.getChildren().forEach(e => {
      if (!e.active || e.isDead) return;
      const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y);
      if (d < range) {
        const a = Math.atan2(e.y - p.y, e.x - p.x);
        this.damageEnemy(e, dmg, false, 150, a);
        e.stunTimer = 2;
        e.body.setVelocity(0, 0);
        if (e.aiState === 'windup') {
          e.aiState = 'approach';
          if (e.windupCircle) { e.windupCircle.destroy(); e.windupCircle = null; }
        }
        const star = this.add.text(e.x, e.y - 40, '\u2605', { fontSize: '20px', color: '#f1c40f' }).setOrigin(0.5).setDepth(25);
        this.tweens.add({ targets: star, alpha: 0, y: e.y - 60, duration: 2000, onComplete: () => star.destroy() });
      }
    });

    // Destroy nearby enemy balls
    this.enemyBalls.getChildren().forEach(ball => {
      if (!ball.active) return;
      if (Phaser.Math.Distance.Between(p.x, p.y, ball.x, ball.y) < range) {
        this.blocks++;
        if (ball._trail) ball._trail.destroy();
        ball.destroy();
      }
    });
  },

  /** Ultimate: King's Domain — force field: enemies slowed 50%, damage reduction for 8s. */
  _lebronUlt() {
    const p = this.player;
    p.kingDomain = 8;

    const aura     = this.add.circle(p.x, p.y, 300, 0xf1c40f, 0.15).setDepth(3);
    const auraEdge = this.add.circle(p.x, p.y, 300, 0xf1c40f, 0).setDepth(3).setStrokeStyle(3, 0xf1c40f, 0.6);
    this.floatText(p.x, p.y - 80, "KING'S DOMAIN!", '#f1c40f');

    const timer = this.time.addEvent({
      delay: 50, repeat: 160, callback: () => {
        if (!p.active || this.gameOver) { aura.destroy(); auraEdge.destroy(); timer.remove(); return; }
        aura.setPosition(p.x, p.y);
        auraEdge.setPosition(p.x, p.y);
        if (p.kingDomain <= 0) { aura.destroy(); auraEdge.destroy(); timer.remove(); }
      },
    });
  },

  // ================================================================
  //  KOBE — Perimeter Assassin
  // ================================================================

  /** Skill 1: Fadeaway — dash backward, fire 3 piercing shots. */
  _kobeSkill1() {
    const p = this.player;
    const dir = p.face;
    const dmg = p.atk * p.atkMul * 2;

    this.tweens.add({ targets: p, x: p.x - dir * 150, duration: 200, ease: 'Quad.easeOut' });
    this.time.delayedCall(150, () => {
      for (let i = -1; i <= 1; i++) {
        const angle = (dir > 0 ? 0 : Math.PI) + i * 0.2;
        this._fireProjectile(p.x, p.y, angle, dmg, 600, 400, true);
      }
    });
  },

  /** Skill 2: Viper Strike — dash through enemies dealing massive damage + bleed. */
  _kobeSkill2() {
    const p = this.player;
    const dir = p.face;
    const dmg = p.atk * p.atkMul * 4;
    p.invTimer = 0.4;
    const hitEnemies = new Set();

    this.tweens.add({
      targets: p, x: p.x + dir * 350, duration: 250, ease: 'Quad.easeOut',
      onUpdate: () => {
        const trail = this.add.circle(p.x, p.y, 18, 0x9b59b6, 0.5).setDepth(8);
        this.tweens.add({ targets: trail, alpha: 0, scale: 0.2, duration: 300, onComplete: () => trail.destroy() });
        this.enemies.getChildren().forEach(e => {
          if (!e.active || e.isDead || hitEnemies.has(e)) return;
          if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < 70) {
            const a = Math.atan2(e.y - p.y, e.x - p.x);
            this.damageEnemy(e, dmg, true, 100, a);
            hitEnemies.add(e);
            this.time.addEvent({
              delay: 500, repeat: 2, callback: () => {
                if (e.active && !e.isDead) {
                  this.damageEnemy(e, dmg * 0.2, false, 0, 0);
                  this.floatText(e.x, e.y - 20, `${Math.floor(dmg * 0.2)}`, '#9b59b6');
                }
              },
            });
          }
        });
      },
    });
  },

  /** Skill 3: Lockdown — panic 3 nearest enemies for 3s. */
  _kobeSkill3() {
    const p = this.player;
    const range = 400;

    const wave = this.add.circle(p.x, p.y, 30, 0x2c3e50, 0.5).setDepth(20);
    this.tweens.add({ targets: wave, scale: range / 30, alpha: 0, duration: 500, onComplete: () => wave.destroy() });

    const sorted = this.enemies.getChildren()
      .filter(e => e.active && !e.isDead)
      .sort((a, b) => Phaser.Math.Distance.Between(p.x, p.y, a.x, a.y) - Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y));

    let count = 0;
    for (const e of sorted) {
      if (count >= 3) break;
      if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < range) {
        e.panicTimer = 3;
        e.body.setVelocity(0, 0);
        if (e.aiState === 'windup') {
          e.aiState = 'approach';
          if (e.windupCircle) { e.windupCircle.destroy(); e.windupCircle = null; }
        }
        const skull = this.add.text(e.x, e.y - 40, '!', { fontSize: '28px', color: '#e74c3c', fontStyle: 'bold' }).setOrigin(0.5).setDepth(25);
        this.tweens.add({ targets: skull, alpha: 0, y: e.y - 70, duration: 3000, onComplete: () => skull.destroy() });
        count++;
      }
    }
  },

  /** Ultimate: Mamba Mode — ATK +200%, SPD +50%, doubled range for 10s. */
  _kobeUlt() {
    const p = this.player;
    p.mambaMode = 10;
    this.floatText(p.x, p.y - 80, 'MAMBA MODE!', '#9b59b6');

    const aura = this.add.circle(p.x, p.y, 60, 0x9b59b6, 0.3).setDepth(3);
    const timer = this.time.addEvent({
      delay: 50, repeat: 200, callback: () => {
        if (!p.active || this.gameOver) { aura.destroy(); timer.remove(); return; }
        aura.setPosition(p.x, p.y);
        if (Math.random() < 0.3) {
          const ghost = this.add.circle(p.x, p.y, 20, 0x9b59b6, 0.3).setDepth(2);
          this.tweens.add({ targets: ghost, alpha: 0, scale: 0.5, duration: 400, onComplete: () => ghost.destroy() });
        }
        if (p.mambaMode <= 0) { aura.destroy(); timer.remove(); }
      },
    });
  },

  // ================================================================
  //  CURRY — Zone Controller
  // ================================================================

  /** Skill 1: Splash Bomb — exploding ball: AOE damage + destroys enemy balls. */
  _currySkill1() {
    const p = this.player;
    const nearest = this._nearestEnemy(p.x, p.y, 500);
    const targetX = nearest ? nearest.x : p.x + p.face * 250;
    const targetY = nearest ? nearest.y : p.y;
    const dmg = p.atk * p.atkMul * 3;
    const explodeRadius = 180;

    const bomb = this.add.circle(p.x, p.y, 14, 0x3498db, 1).setDepth(15);
    this.tweens.add({
      targets: bomb, x: targetX, y: targetY, duration: 400, ease: 'Quad.easeIn',
      onComplete: () => {
        this.fxExplosion(bomb.x, bomb.y);
        this.cameras.main.shake(200, 0.01);
        this.enemies.getChildren().forEach(e => {
          if (!e.active || e.isDead) return;
          if (Phaser.Math.Distance.Between(bomb.x, bomb.y, e.x, e.y) < explodeRadius) {
            this.damageEnemy(e, dmg, false, 200, Math.atan2(e.y - bomb.y, e.x - bomb.x));
          }
        });
        this.enemyBalls.getChildren().forEach(ball => {
          if (!ball.active) return;
          if (Phaser.Math.Distance.Between(bomb.x, bomb.y, ball.x, ball.y) < explodeRadius) {
            this.blocks++;
            if (ball._trail) ball._trail.destroy();
            ball.destroy();
          }
        });
        bomb.destroy();
      },
    });
  },

  /** Skill 2: Crossover — 360-degree bullet ring. */
  _currySkill2() {
    const p = this.player;
    const dmg = p.atk * p.atkMul * 1.5;
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      this._fireProjectile(p.x, p.y, angle, dmg, 400, 350, false, 200);
    }
    const ring = this.add.circle(p.x, p.y, 30, 0x3498db, 0.3).setDepth(20);
    this.tweens.add({ targets: ring, scale: 12, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
  },

  /** Skill 3: Pick & Roll — summon a blocking phantom wall for 5s. */
  _currySkill3() {
    const p = this.player;
    const wallX = p.x + p.face * 100;
    const wallY = p.y;
    const segments = [];

    for (let i = -1; i <= 1; i++) {
      const seg = this.add.rectangle(wallX, wallY + i * 60, 40, 50, 0x3498db, 0.5).setDepth(6);
      this.physics.add.existing(seg, true);
      seg.body.setSize(40, 50);
      this.physics.add.collider(this.enemies, seg);
      this.physics.add.overlap(this.enemyBalls, seg, ball => {
        if (!ball.active) return;
        this.blocks++;
        this.floatText(ball.x, ball.y - 20, 'BLOCKED!', '#3498db');
        if (ball._trail) ball._trail.destroy();
        ball.destroy();
      });
      segments.push(seg);
    }

    this.floatText(wallX, wallY - 60, 'WALL!', '#3498db');
    this.time.delayedCall(5000, () => { segments.forEach(s => { if (s.active) s.destroy(); }); });
  },

  /** Ultimate: Night Night — bullet-time: enemies and balls slow to 20% for 6s. */
  _curryUlt() {
    const p = this.player;
    p.nightNight = 6;
    this.floatText(p.x, p.y - 80, 'NIGHT NIGHT!', '#3498db');

    const overlay = this.add.rectangle(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 0x000033, 0.2).setDepth(1);
    const timer = this.time.addEvent({
      delay: 50, repeat: 120, callback: () => {
        if (!p.active || this.gameOver || p.nightNight <= 0) {
          overlay.destroy();
          timer.remove();
        }
      },
    });
  },
});

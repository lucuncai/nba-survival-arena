/* ================================================================
 *  GameScene_EnemyAI.js — Enemy state machine, shooting, ball scoring
 *
 *  Enemy AI lifecycle:
 *    APPROACH  → move toward the hoop
 *    WINDUP    → charge up a shot (interruptible by knockback)
 *    SHOOT     → release the ball (handled in _enemyShoot)
 *    COOLDOWN  → brief pause, then drift away before repeating
 *
 *  Applied as a mixin to GameScene.prototype.
 * ================================================================ */

Object.assign(GameScene.prototype, {

  _updateEnemies(dt) {
    const slowFactor  = this.player.nightNight > 0 ? 0.2 : 1;
    const domainSlow  = this.player.kingDomain > 0 ? 0.5 : 1;

    this.enemies.getChildren().forEach(e => {
      if (!e.active || e.isDead) return;

      const effSlow = slowFactor * domainSlow * (e.panicTimer > 0 ? 0 : 1);
      if (e.panicTimer > 0) { e.panicTimer -= dt; e.body.setVelocity(0, 0); return; }
      if (e.stunTimer  > 0) { e.stunTimer  -= dt; e.body.setVelocity(0, 0); return; }

      const distToHoop = Phaser.Math.Distance.Between(e.x, e.y, COURT_CX, COURT_CY);

      switch (e.aiState) {
        case 'approach':
          if (distToHoop <= e.typeDef.shootRange + 20) {
            e.aiState = 'windup';
            e.windupTimer = e.typeDef.windupTime;
            e.body.setVelocity(0, 0);
            e.windupCircle = this.add.circle(e.x, e.y, 30, 0xff8800, 0.3).setDepth(4);
            this.tweens.add({
              targets: e.windupCircle, scale: 1.5, alpha: 0.6,
              duration: e.typeDef.windupTime * 1000, ease: 'Quad.easeIn',
            });
          } else {
            const angle = Math.atan2(COURT_CY - e.y, COURT_CX - e.x);
            const spd = e.typeDef.spd * effSlow;
            e.body.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
            e.setFlipX(e.body.velocity.x < 0);
          }
          break;

        case 'windup':
          e.windupTimer -= dt;
          if (e.windupCircle) e.windupCircle.setPosition(e.x, e.y);
          if (e.windupTimer <= 0) {
            this._enemyShoot(e);
            e.aiState = 'cooldown';
            e.cooldownTimer = 0.6 + Math.random() * 0.8;
            if (e.windupCircle) { e.windupCircle.destroy(); e.windupCircle = null; }
          }
          break;

        case 'cooldown':
          e.cooldownTimer -= dt;
          if (e.cooldownTimer <= 0) e.aiState = 'approach';
          const awayAngle = Math.atan2(e.y - COURT_CY, e.x - COURT_CX);
          e.body.setVelocity(Math.cos(awayAngle) * 30 * effSlow, Math.sin(awayAngle) * 30 * effSlow);
          break;
      }

      // HP bar
      if (e.hpBar) {
        e.hpBar.setPosition(e.x - 25, e.y - e.typeDef.bodyRadius - 18);
        e.hpBarFill.setPosition(e.x - 25, e.y - e.typeDef.bodyRadius - 18);
        const ratio = Math.max(0, e.hp / e.maxHp);
        e.hpBarFill.displayWidth = 50 * ratio;
        const show = e.hp < e.maxHp;
        e.hpBar.setVisible(show);
        e.hpBarFill.setVisible(show);
      }
    });
  },

  /** Create and launch an enemy basketball toward the hoop. */
  _enemyShoot(e) {
    const angle = Math.atan2(COURT_CY - e.y, COURT_CX - e.x);
    const slowFactor = this.player.nightNight > 0 ? 0.2 : 1;
    const speed = e.typeDef.ballSpeed * slowFactor;

    const ball = this.add.circle(e.x, e.y, 12, 0xff8800, 1).setDepth(8);
    this.physics.add.existing(ball);
    ball.body.setCircle(12);
    ball.scoreDmg  = e.typeDef.scoreDmg;
    ball.accuracy  = e.typeDef.accuracy;
    ball.sourceEnemy = e;

    // IMPORTANT: add to group BEFORE setting velocity (physics group resets velocity on add)
    this.enemyBalls.add(ball);
    ball.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    // Trail
    const trail = this.add.circle(e.x, e.y, 6, 0xff8800, 0.3).setDepth(7);
    ball._trail = trail;

    // Auto-destroy after 5 seconds
    this.time.delayedCall(5000, () => {
      if (ball.active) { ball.destroy(); trail.destroy(); }
    });
  },

  /** Check every enemy ball for body-block or hoop scoring. */
  _updateEnemyBalls(dt) {
    this.enemyBalls.getChildren().forEach(ball => {
      if (!ball.active) return;
      if (ball._trail) ball._trail.setPosition(ball.x, ball.y);

      // Body block
      const p = this.player;
      const distToPlayer = Phaser.Math.Distance.Between(ball.x, ball.y, p.x, p.y);
      const blockRadius = (p.charDef.bodyRadius + 15) * (p.blockRange || 1);
      if (distToPlayer < blockRadius && !this.gameOver) {
        this.blocks++;
        this.floatText(ball.x, ball.y - 20, 'BLOCKED!', '#3498db');
        this._grantXP(10);
        if (ball._trail) ball._trail.destroy();
        ball.destroy();
        SFX.blocked();
        return;
      }

      // Hoop scoring
      const distToHoop = Phaser.Math.Distance.Between(ball.x, ball.y, COURT_CX, COURT_CY);
      if (distToHoop < HOOP_CFG.radius) {
        if (Math.random() < ball.accuracy) {
          this.hoop.hp -= ball.scoreDmg;
          this.floatText(COURT_CX, COURT_CY - 40, `-${ball.scoreDmg}`, '#e74c3c');
          SFX.score();
          // Flash hoop red
          this.hoopGfx.clear();
          this.hoopGfx.lineStyle(6, 0xff0000, 1);
          this.hoopGfx.strokeCircle(COURT_CX, COURT_CY, HOOP_CFG.radius);
          this.time.delayedCall(300, () => {
            if (this.gameOver) return;
            this.hoopGfx.clear();
            this.hoopGfx.lineStyle(6, 0xff6600, 1);
            this.hoopGfx.strokeCircle(COURT_CX, COURT_CY, HOOP_CFG.radius);
            this.hoopGfx.lineStyle(2, 0xffffff, 0.4);
            this.hoopGfx.strokeCircle(COURT_CX, COURT_CY, HOOP_CFG.radius + 8);
          });
        } else {
          this.floatText(COURT_CX + Phaser.Math.Between(-30, 30), COURT_CY - 40, 'MISS', '#95a5a6');
        }
        if (ball._trail) ball._trail.destroy();
        ball.destroy();

        if (this.hoop.hp <= 0) {
          this.hoop.hp = 0;
          this._gameOver('hoop');
        }
      }
    });
  },
});

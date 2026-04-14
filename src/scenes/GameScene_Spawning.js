/* ================================================================
 *  GameScene_Spawning.js — Wave spawning and boss generation
 *
 *  Applied as a mixin to GameScene.prototype.
 * ================================================================ */

Object.assign(GameScene.prototype, {

  _updateSpawning(dt) {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;

    // Difficulty scaling — spawn interval decreases over time
    const minutes = this.gameTime / 60;
    this.spawnInterval = Math.max(0.35, 1.8 - minutes * 0.08);
    this.spawnTimer = this.spawnInterval;

    // Weighted random type selection
    const totalWeight = ENEMY_TYPES.reduce((s, t) => s + t.weight, 0);
    let r = Math.random() * totalWeight;
    let type = ENEMY_TYPES[0];
    for (const t of ENEMY_TYPES) {
      r -= t.weight;
      if (r <= 0) { type = t; break; }
    }

    // Spawn from a random edge position
    const angle = Math.random() * Math.PI * 2;
    const dist  = 700 + Math.random() * 400;
    const sx = Phaser.Math.Clamp(COURT_CX + Math.cos(angle) * dist, 50, WORLD_W - 50);
    const sy = Phaser.Math.Clamp(COURT_CY + Math.sin(angle) * dist, 50, WORLD_H - 50);
    this._spawnEnemy(type, sx, sy);
  },

  /** Instantiate a single enemy at (x, y). */
  _spawnEnemy(typeDef, x, y) {
    const hpMul = 1 + this.gameTime / 150;
    const sprKey = `${typeDef.id}_walk`;
    let e;
    if (this.textures.exists(sprKey)) {
      e = this.physics.add.sprite(x, y, sprKey, 0).setScale(typeDef.isBoss ? 0.8 : 0.5);
      if (this.anims.exists(sprKey)) e.play(sprKey);
    } else {
      e = this.add.circle(x, y, typeDef.bodyRadius, typeDef.color, 1);
      this.physics.add.existing(e);
    }
    e.setDepth(6);
    const bodyR = Math.floor(typeDef.bodyRadius * 0.65);
    e.body.setCircle(bodyR);
    if (e.width) {
      const scale = typeDef.isBoss ? 0.8 : 0.5;
      e.body.setOffset(e.width * scale / 2 - bodyR, e.height * scale / 2 - bodyR);
    }
    e.setCollideWorldBounds(true);
    e.body.setBounce(0.6);
    e.body.setMass(typeDef.superArmor ? 5 : 1);

    Object.assign(e, {
      typeDef,
      hp: typeDef.hp * hpMul,
      maxHp: typeDef.hp * hpMul,
      isDead: false,
      aiState: 'approach',
      windupTimer: 0,
      cooldownTimer: 0,
      stunTimer: 0,
      panicTimer: 0,
      windupCircle: null,
    });

    // HP bar
    e.hpBar     = this.add.rectangle(x - 25, y - typeDef.bodyRadius - 18, 50, 6, 0x333333).setDepth(15).setVisible(false);
    e.hpBarFill = this.add.rectangle(x - 25, y - typeDef.bodyRadius - 18, 50, 6, typeDef.isBoss ? 0xe74c3c : 0x2ecc71).setDepth(16).setOrigin(0, 0.5).setVisible(false);
    e.hpBar.setOrigin(0, 0.5);

    this.enemies.add(e);
    return e;
  },

  /** Spawn a boss enemy with scaling HP. */
  _spawnBoss() {
    this.bossCount++;
    const angle = Math.random() * Math.PI * 2;
    const dist  = 800;
    const sx = Phaser.Math.Clamp(COURT_CX + Math.cos(angle) * dist, 100, WORLD_W - 100);
    const sy = Phaser.Math.Clamp(COURT_CY + Math.sin(angle) * dist, 100, WORLD_H - 100);

    const bossType = { ...BOSS_TYPE, hp: BOSS_TYPE.hp * (1 + this.bossCount * 0.5) };
    const boss = this._spawnEnemy(bossType, sx, sy);
    boss.isBoss = true;
    this.bossAlive = true;
    this.currentBoss = boss;

    const warn = document.getElementById('boss-warning');
    warn.style.display = 'block';
    SFX.bossWarn();
    this.cameras.main.shake(800, 0.015);
    setTimeout(() => { warn.style.display = 'none'; }, 2000);
  },
});

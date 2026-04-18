/* ================================================================
 *  vfx.js — Visual Effects Manager (Phase 2)
 *
 *  All VFX functions for the game:
 *    1. Afterimage trail (movement)
 *    2. Hit sparks + camera shake (combat)
 *    3. Knockback trail (combat)
 *    4. Block interception explosion + flash
 *    5. Combo number animation (bounce, color gradient)
 *    6. Boss warning screen effect
 *    7. Kill burst (enhanced)
 *    8. Skill-specific VFX for LeBron, Kobe, Curry
 *
 *  Uses procedural particle textures: particle_glow, particle_spark,
 *  particle_smoke, particle_ring
 * ================================================================ */

const VFX = {

  // ================================================================
  //  1. AFTERIMAGE TRAIL — ghostly copies during movement
  // ================================================================

  /** Spawn a single afterimage ghost of the player sprite. */
  afterimage(scene, sprite) {
    if (!sprite || !sprite.active) return;
    const ghost = scene.add.image(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name)
      .setScale(sprite.scaleX, sprite.scaleY)
      .setFlipX(sprite.flipX)
      .setAlpha(0.35)
      .setTint(0x88ccff)
      .setDepth(sprite.depth - 1);
    scene.tweens.add({
      targets: ghost, alpha: 0, scale: sprite.scaleX * 0.7,
      duration: 250, onComplete: () => ghost.destroy(),
    });
  },

  /** Call in update loop — spawns afterimage every N frames when moving. */
  updateAfterimage(scene, sprite, counter) {
    if (!sprite || !sprite.active || !sprite.body) return counter;
    const vx = sprite.body.velocity.x, vy = sprite.body.velocity.y;
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > 50) {
      counter++;
      if (counter >= 4) { // every 4 frames
        VFX.afterimage(scene, sprite);
        counter = 0;
      }
    }
    return counter;
  },

  // ================================================================
  //  2. HIT SPARKS — particle burst on enemy hit
  // ================================================================

  /** Spawn spark particles at hit location. */
  hitSparks(scene, x, y, color, isCrit) {
    const count = isCrit ? 10 : 5;
    const baseSize = isCrit ? 1.2 : 0.7;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * (isCrit ? 60 : 35);
      const tx = x + Math.cos(angle) * dist;
      const ty = y + Math.sin(angle) * dist;
      const p = scene.add.image(x, y, 'particle_spark')
        .setScale(baseSize + Math.random() * 0.5)
        .setTint(color)
        .setAlpha(0.9)
        .setDepth(25)
        .setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({
        targets: p, x: tx, y: ty, alpha: 0,
        scale: 0.1, duration: 200 + Math.random() * 150,
        onComplete: () => p.destroy(),
      });
    }
    // Flash circle
    if (isCrit) {
      const flash = scene.add.image(x, y, 'particle_glow')
        .setScale(1.5).setTint(0xffffff).setAlpha(0.8)
        .setDepth(26).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({
        targets: flash, scale: 3, alpha: 0,
        duration: 200, onComplete: () => flash.destroy(),
      });
    }
  },

  /** Mild camera shake for hits. */
  hitShake(scene, isCrit) {
    const intensity = isCrit ? 0.012 : 0.005;
    const duration = isCrit ? 120 : 60;
    scene.cameras.main.shake(duration, intensity);
  },

  // ================================================================
  //  3. KNOCKBACK TRAIL — motion blur on knocked-back enemies
  // ================================================================

  knockbackTrail(scene, enemy, color) {
    if (!enemy || !enemy.active) return;
    for (let i = 0; i < 3; i++) {
      scene.time.delayedCall(i * 40, () => {
        if (!enemy.active) return;
        const ghost = scene.add.image(enemy.x, enemy.y, enemy.texture.key, enemy.frame ? enemy.frame.name : 0)
          .setScale(enemy.scaleX, enemy.scaleY)
          .setFlipX(enemy.flipX)
          .setAlpha(0.3 - i * 0.08)
          .setTint(color || 0xff4444)
          .setDepth(enemy.depth - 1);
        scene.tweens.add({
          targets: ghost, alpha: 0, duration: 200,
          onComplete: () => ghost.destroy(),
        });
      });
    }
  },

  // ================================================================
  //  4. BLOCK INTERCEPTION — explosion + screen flash
  // ================================================================

  blockExplosion(scene, x, y) {
    // Ring burst
    const ring = scene.add.image(x, y, 'particle_ring')
      .setScale(0.5).setTint(0x3498db).setAlpha(0.9)
      .setDepth(25).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: ring, scale: 4, alpha: 0,
      duration: 350, onComplete: () => ring.destroy(),
    });

    // Spark burst
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dist = 40 + Math.random() * 30;
      const p = scene.add.image(x, y, 'particle_spark')
        .setScale(0.8 + Math.random() * 0.5)
        .setTint(i % 2 === 0 ? 0x3498db : 0xffffff)
        .setAlpha(0.9).setDepth(25)
        .setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0, scale: 0.1,
        duration: 300 + Math.random() * 100,
        onComplete: () => p.destroy(),
      });
    }

    // White flash overlay
    const flash = scene.add.rectangle(x, y, 120, 120, 0xffffff, 0.5)
      .setDepth(26).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: flash, alpha: 0, scale: 2,
      duration: 150, onComplete: () => flash.destroy(),
    });

    // Small camera shake
    scene.cameras.main.shake(80, 0.006);
  },

  // ================================================================
  //  5. COMBO NUMBER ANIMATION — bounce + color gradient
  // ================================================================

  /** Get combo color based on combo count. */
  _comboColor(combo) {
    if (combo >= 30) return '#ff2222'; // red
    if (combo >= 20) return '#ff6600'; // orange
    if (combo >= 10) return '#ffcc00'; // yellow
    if (combo >= 5)  return '#ffee88'; // light yellow
    return '#ffffff'; // white
  },

  /** Show animated combo text. Call when combo increases. */
  comboPopup(scene, combo, x, y) {
    if (combo < 3) return; // only show for 3+
    const color = VFX._comboColor(combo);
    const size = Math.min(18 + combo * 1.5, 48);
    const t = scene.add.text(x, y - 50, `${combo}x COMBO!`, {
      fontSize: `${Math.floor(size)}px`,
      color: color,
      fontFamily: 'system-ui',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(35);

    // Bounce scale animation
    t.setScale(0.3);
    scene.tweens.add({
      targets: t, scaleX: 1.3, scaleY: 1.3,
      duration: 120, ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: t, scaleX: 1, scaleY: 1,
          duration: 80, ease: 'Quad.easeIn',
          onComplete: () => {
            scene.tweens.add({
              targets: t, alpha: 0, y: y - 100,
              duration: 600, delay: 200,
              onComplete: () => t.destroy(),
            });
          },
        });
      },
    });

    // Glow behind text for high combos
    if (combo >= 10) {
      const glow = scene.add.image(x, y - 50, 'particle_glow')
        .setScale(2).setTint(Phaser.Display.Color.HexStringToColor(color).color)
        .setAlpha(0.4).setDepth(34)
        .setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({
        targets: glow, scale: 4, alpha: 0,
        duration: 500, onComplete: () => glow.destroy(),
      });
    }
  },

  // ================================================================
  //  6. BOSS WARNING — screen flash + red overlay
  // ================================================================

  bossWarning(scene) {
    // Red flash overlay (camera-fixed)
    const flash = scene.add.rectangle(GW / 2, GH / 2, GW, GH, 0xff0000, 0.25)
      .setScrollFactor(0).setDepth(50);
    scene.tweens.add({
      targets: flash, alpha: 0, duration: 300,
      yoyo: true, repeat: 2,
      onComplete: () => flash.destroy(),
    });

    // Stronger camera shake
    scene.cameras.main.shake(1000, 0.025);

    // Dark pulse from edges
    const vignette = scene.add.rectangle(GW / 2, GH / 2, GW, GH, 0x000000, 0.4)
      .setScrollFactor(0).setDepth(49);
    scene.tweens.add({
      targets: vignette, alpha: 0,
      duration: 2000, ease: 'Quad.easeOut',
      onComplete: () => vignette.destroy(),
    });

    // Warning sparks at screen edges
    for (let i = 0; i < 12; i++) {
      const ex = Math.random() * GW;
      const ey = Math.random() < 0.5 ? 0 : GH;
      const spark = scene.add.image(ex, ey, 'particle_spark')
        .setScale(1.5).setTint(0xff3333).setAlpha(0.8)
        .setScrollFactor(0).setDepth(51)
        .setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({
        targets: spark,
        x: GW / 2 + Phaser.Math.Between(-200, 200),
        y: GH / 2 + Phaser.Math.Between(-100, 100),
        alpha: 0, scale: 0.2,
        duration: 600 + Math.random() * 400,
        onComplete: () => spark.destroy(),
      });
    }
  },

  // ================================================================
  //  7. ENHANCED KILL BURST — replaces old fxKillBurst
  // ================================================================

  killBurst(scene, x, y, color) {
    // Spark ring
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 40 + Math.random() * 30;
      const tex = i % 3 === 0 ? 'particle_spark' : 'particle_glow';
      const p = scene.add.image(x, y, tex)
        .setScale(0.5 + Math.random() * 0.6)
        .setTint(color)
        .setAlpha(0.9)
        .setDepth(20)
        .setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0, scale: 0.1,
        duration: 300 + Math.random() * 200,
        onComplete: () => p.destroy(),
      });
    }
    // Smoke puff
    const smoke = scene.add.image(x, y, 'particle_smoke')
      .setScale(1).setTint(color).setAlpha(0.4).setDepth(19);
    scene.tweens.add({
      targets: smoke, scale: 2.5, alpha: 0,
      duration: 400, onComplete: () => smoke.destroy(),
    });
  },

  // ================================================================
  //  8. ENHANCED EXPLOSION — replaces old fxExplosion
  // ================================================================

  explosion(scene, x, y) {
    // Core flash
    const core = scene.add.image(x, y, 'particle_glow')
      .setScale(2).setTint(0xff6600).setAlpha(0.9)
      .setDepth(25).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: core, scale: 6, alpha: 0,
      duration: 400, onComplete: () => core.destroy(),
    });

    // Ring
    const ring = scene.add.image(x, y, 'particle_ring')
      .setScale(1).setTint(0xff8800).setAlpha(0.7)
      .setDepth(24).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: ring, scale: 8, alpha: 0,
      duration: 500, onComplete: () => ring.destroy(),
    });

    // Debris sparks
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 80;
      const p = scene.add.image(x, y, i % 2 === 0 ? 'particle_spark' : 'particle_smoke')
        .setScale(0.6 + Math.random() * 0.8)
        .setTint(i % 3 === 0 ? 0xff4400 : (i % 3 === 1 ? 0xffaa00 : 0xff8800))
        .setAlpha(0.8).setDepth(23)
        .setBlendMode(i % 2 === 0 ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL);
      scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0, scale: 0.1,
        duration: 350 + Math.random() * 250,
        onComplete: () => p.destroy(),
      });
    }

    scene.cameras.main.shake(200, 0.012);
  },

  // ================================================================
  //  LEBRON SKILL VFX
  // ================================================================

  /** The Block — golden shockwave arc */
  lebronBlock(scene, x, y, range, angle) {
    // Golden shockwave ring
    const ring = scene.add.image(x, y, 'particle_ring')
      .setScale(0.5).setTint(0xf1c40f).setAlpha(0.8)
      .setDepth(22).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: ring, scale: range / 32, alpha: 0,
      duration: 400, onComplete: () => ring.destroy(),
    });

    // Golden sparks in the fan direction
    for (let i = 0; i < 8; i++) {
      const a = angle - Math.PI / 3 + (i / 7) * (Math.PI * 2 / 3);
      const dist = range * (0.5 + Math.random() * 0.5);
      const p = scene.add.image(x, y, 'particle_spark')
        .setScale(0.8 + Math.random() * 0.5)
        .setTint(0xf1c40f).setAlpha(0.9)
        .setDepth(22).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({
        targets: p,
        x: x + Math.cos(a) * dist,
        y: y + Math.sin(a) * dist,
        alpha: 0, scale: 0.1,
        duration: 350 + Math.random() * 150,
        onComplete: () => p.destroy(),
      });
    }
  },

  /** And One — golden charge trail */
  lebronCharge(scene, x, y) {
    const glow = scene.add.image(x, y, 'particle_glow')
      .setScale(1.2).setTint(0xf1c40f).setAlpha(0.5)
      .setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: glow, alpha: 0, scale: 0.3,
      duration: 300, onComplete: () => glow.destroy(),
    });
    // Small sparks
    for (let i = 0; i < 3; i++) {
      const p = scene.add.image(
        x + Phaser.Math.Between(-15, 15),
        y + Phaser.Math.Between(-15, 15),
        'particle_spark'
      ).setScale(0.4 + Math.random() * 0.3)
        .setTint(0xf1c40f).setAlpha(0.7)
        .setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({
        targets: p, alpha: 0, scale: 0.1,
        duration: 200 + Math.random() * 100,
        onComplete: () => p.destroy(),
      });
    }
  },

  /** Earthquake — dust cloud + ground crack ring */
  lebronEarthquake(scene, x, y, range) {
    // Expanding dust ring
    const dustRing = scene.add.image(x, y, 'particle_ring')
      .setScale(0.5).setTint(0xcc8844).setAlpha(0.7)
      .setDepth(22).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: dustRing, scale: range / 32, alpha: 0,
      duration: 500, onComplete: () => dustRing.destroy(),
    });

    // Dust clouds
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * range * 0.8;
      const delay = Math.random() * 200;
      scene.time.delayedCall(delay, () => {
        const smoke = scene.add.image(
          x + Math.cos(angle) * dist,
          y + Math.sin(angle) * dist,
          'particle_smoke'
        ).setScale(0.8 + Math.random() * 1.0)
          .setTint(0xaa8866).setAlpha(0.5)
          .setDepth(21);
        scene.tweens.add({
          targets: smoke, scale: smoke.scaleX * 2, alpha: 0,
          y: smoke.y - 20 - Math.random() * 30,
          duration: 500 + Math.random() * 300,
          onComplete: () => smoke.destroy(),
        });
      });
    }

    // Ground impact sparks
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const p = scene.add.image(x, y, 'particle_spark')
        .setScale(0.6).setTint(0xe74c3c).setAlpha(0.8)
        .setDepth(22).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * range * 0.7,
        y: y + Math.sin(angle) * range * 0.7,
        alpha: 0, scale: 0.1,
        duration: 400, onComplete: () => p.destroy(),
      });
    }
  },

  /** King's Domain — golden aura with particle orbit */
  lebronDomain(scene, player) {
    // Activation burst
    const burst = scene.add.image(player.x, player.y, 'particle_ring')
      .setScale(1).setTint(0xf1c40f).setAlpha(0.8)
      .setDepth(22).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: burst, scale: 10, alpha: 0,
      duration: 600, onComplete: () => burst.destroy(),
    });

    // Orbiting golden particles
    const orbiters = [];
    for (let i = 0; i < 6; i++) {
      const orb = scene.add.image(player.x, player.y, 'particle_glow')
        .setScale(0.6).setTint(0xf1c40f).setAlpha(0.6)
        .setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
      orbiters.push({ img: orb, angle: (i / 6) * Math.PI * 2, radius: 280 });
    }

    const timer = scene.time.addEvent({
      delay: 30, repeat: 266, // ~8 seconds
      callback: () => {
        if (!player.active || scene.gameOver || player.kingDomain <= 0) {
          orbiters.forEach(o => { if (o.img.active) o.img.destroy(); });
          timer.remove();
          return;
        }
        orbiters.forEach(o => {
          o.angle += 0.04;
          o.img.setPosition(
            player.x + Math.cos(o.angle) * o.radius,
            player.y + Math.sin(o.angle) * o.radius,
          );
        });
      },
    });
  },

  // ================================================================
  //  KOBE SKILL VFX
  // ================================================================

  /** Fadeaway — purple flame trail on projectiles */
  kobeFadeaway(scene, x, y) {
    const flame = scene.add.image(x, y, 'particle_glow')
      .setScale(0.8).setTint(0x9b59b6).setAlpha(0.6)
      .setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: flame, alpha: 0, scale: 0.2,
      duration: 250, onComplete: () => flame.destroy(),
    });
  },

  /** Viper Strike — afterimage clones during dash */
  kobeViperStrike(scene, sprite) {
    if (!sprite || !sprite.active) return;
    const ghost = scene.add.image(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name)
      .setScale(sprite.scaleX, sprite.scaleY)
      .setFlipX(sprite.flipX)
      .setAlpha(0.5)
      .setTint(0x9b59b6)
      .setDepth(sprite.depth - 1);
    scene.tweens.add({
      targets: ghost, alpha: 0, scale: sprite.scaleX * 0.6,
      duration: 350, onComplete: () => ghost.destroy(),
    });
    // Purple sparks
    for (let i = 0; i < 2; i++) {
      const p = scene.add.image(
        sprite.x + Phaser.Math.Between(-10, 10),
        sprite.y + Phaser.Math.Between(-10, 10),
        'particle_spark'
      ).setScale(0.5).setTint(0x9b59b6).setAlpha(0.7)
        .setDepth(sprite.depth - 1)
        .setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({
        targets: p, alpha: 0, scale: 0.1,
        duration: 200, onComplete: () => p.destroy(),
      });
    }
  },

  /** Mamba Mode — purple flame aura around player */
  kobeMambaMode(scene, player) {
    // Activation burst
    const burst = scene.add.image(player.x, player.y, 'particle_ring')
      .setScale(1).setTint(0x9b59b6).setAlpha(0.9)
      .setDepth(22).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: burst, scale: 5, alpha: 0,
      duration: 500, onComplete: () => burst.destroy(),
    });

    // Continuous flame particles
    const timer = scene.time.addEvent({
      delay: 60, repeat: 166, // ~10 seconds
      callback: () => {
        if (!player.active || scene.gameOver || player.mambaMode <= 0) {
          timer.remove();
          return;
        }
        // Flame particle rising from player
        const flame = scene.add.image(
          player.x + Phaser.Math.Between(-20, 20),
          player.y + Phaser.Math.Between(-10, 15),
          Math.random() > 0.5 ? 'particle_glow' : 'particle_spark'
        ).setScale(0.4 + Math.random() * 0.4)
          .setTint(Math.random() > 0.3 ? 0x9b59b6 : 0xbb77dd)
          .setAlpha(0.7)
          .setDepth(player.depth + 1)
          .setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({
          targets: flame,
          y: flame.y - 30 - Math.random() * 20,
          alpha: 0, scale: 0.1,
          duration: 300 + Math.random() * 200,
          onComplete: () => flame.destroy(),
        });
      },
    });
  },

  // ================================================================
  //  CURRY SKILL VFX
  // ================================================================

  /** Splash Bomb — blue-white firework explosion */
  currySplashBomb(scene, x, y) {
    // Core flash
    const core = scene.add.image(x, y, 'particle_glow')
      .setScale(2).setTint(0x3498db).setAlpha(0.9)
      .setDepth(25).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: core, scale: 5, alpha: 0,
      duration: 350, onComplete: () => core.destroy(),
    });

    // Ring
    const ring = scene.add.image(x, y, 'particle_ring')
      .setScale(1).setTint(0x5dade2).setAlpha(0.8)
      .setDepth(24).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: ring, scale: 7, alpha: 0,
      duration: 450, onComplete: () => ring.destroy(),
    });

    // Firework sparks — two layers
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.2;
      const dist = 80 + Math.random() * 60;
      const isWhite = i % 3 === 0;
      const p = scene.add.image(x, y, 'particle_spark')
        .setScale(0.6 + Math.random() * 0.5)
        .setTint(isWhite ? 0xffffff : 0x3498db)
        .setAlpha(0.9).setDepth(23)
        .setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0, scale: 0.05,
        duration: 400 + Math.random() * 200,
        onComplete: () => p.destroy(),
      });
    }

    // Water splash droplets
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 50;
      const drop = scene.add.image(x, y, 'particle_glow')
        .setScale(0.3).setTint(0x85c1e9).setAlpha(0.6)
        .setDepth(22);
      scene.tweens.add({
        targets: drop,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist - 20,
        alpha: 0, scale: 0.05,
        duration: 500 + Math.random() * 200,
        onComplete: () => drop.destroy(),
      });
    }
  },

  /** Crossover — blue energy ring burst */
  curryCrossover(scene, x, y) {
    const ring = scene.add.image(x, y, 'particle_ring')
      .setScale(0.5).setTint(0x3498db).setAlpha(0.8)
      .setDepth(22).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: ring, scale: 12, alpha: 0,
      duration: 500, onComplete: () => ring.destroy(),
    });
    // Inner glow
    const glow = scene.add.image(x, y, 'particle_glow')
      .setScale(1.5).setTint(0x3498db).setAlpha(0.5)
      .setDepth(21).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: glow, scale: 4, alpha: 0,
      duration: 400, onComplete: () => glow.destroy(),
    });
  },

  /** Night Night — deep blue ripple wave + slow-mo overlay */
  curryNightNight(scene, x, y) {
    // Expanding ripple rings
    for (let i = 0; i < 3; i++) {
      scene.time.delayedCall(i * 200, () => {
        const ring = scene.add.image(x, y, 'particle_ring')
          .setScale(0.5).setTint(0x1a5276).setAlpha(0.7)
          .setDepth(22).setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({
          targets: ring, scale: 15, alpha: 0,
          duration: 800, onComplete: () => ring.destroy(),
        });
      });
    }

    // Central glow
    const glow = scene.add.image(x, y, 'particle_glow')
      .setScale(2).setTint(0x2980b9).setAlpha(0.6)
      .setDepth(21).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: glow, scale: 8, alpha: 0,
      duration: 1000, onComplete: () => glow.destroy(),
    });

    // Star particles falling
    for (let i = 0; i < 8; i++) {
      scene.time.delayedCall(i * 100, () => {
        const star = scene.add.image(
          x + Phaser.Math.Between(-300, 300),
          y - 200,
          'particle_spark'
        ).setScale(0.5 + Math.random() * 0.5)
          .setTint(0x5dade2).setAlpha(0.7)
          .setDepth(22).setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({
          targets: star,
          y: star.y + 400 + Math.random() * 200,
          alpha: 0, scale: 0.1,
          duration: 800 + Math.random() * 400,
          onComplete: () => star.destroy(),
        });
      });
    }
  },
};

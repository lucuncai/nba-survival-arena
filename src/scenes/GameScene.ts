import Phaser from "phaser";
import { eventBus } from "../core/EventBus";
import { saveStore } from "../core/SaveStore";
import { SeededRandom } from "../core/SeededRandom";
import { audio } from "../game/AudioSystem";
import { COLORS, HOOP, PLAYER_BASE, VIEWPORT, WORLD } from "../game/config";
import {
  ELITE_MODIFIERS,
  EVOLUTIONS,
  EVOLUTION_EFFECTS,
  SKILL_META,
  UPGRADES,
  UPGRADE_EFFECTS,
  eliteChanceForWave,
  getCharacter,
  getEnemyDefinition,
  getUpgrade,
  isEvolutionId,
} from "../game/data";
import type { UpgradeContext } from "../game/data";
import { EffectsSystem } from "../game/EffectsSystem";
import { EnemyEntity, EnemyShot, PlayerEntity } from "../game/entities";
import type {
  ActionName,
  CharacterDefinition,
  ChoiceId,
  ChoiceOffer,
  EvolutionId,
  GameMode,
  HudSnapshot,
  RunResult,
  SkillId,
  UpgradeId,
} from "../game/types";
import { computePermanentBonuses, computeRunCred } from "../game/MetaSystem";
import { availableEvolutions, rollUpgradeChoices } from "../game/UpgradeSystem";
import { WaveDirector } from "../game/WaveDirector";

interface ControlKeys {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  attack: Phaser.Input.Keyboard.Key;
  skill1: Phaser.Input.Keyboard.Key;
  skill2: Phaser.Input.Keyboard.Key;
  skill3: Phaser.Input.Keyboard.Key;
  ultimate: Phaser.Input.Keyboard.Key;
  pause: Phaser.Input.Keyboard.Key;
}

type SkillName = "skill1" | "skill2" | "skill3" | "ultimate";

export class GameScene extends Phaser.Scene {
  private player!: PlayerEntity;
  private character!: CharacterDefinition;
  private mode: GameMode = "campaign";
  private skillHandlers!: Record<SkillId, () => void>;
  private enemies!: Phaser.Physics.Arcade.Group;
  private shots: EnemyShot[] = [];
  private boss: EnemyEntity | null = null;
  private effects!: EffectsSystem;
  private waveDirector!: WaveDirector;
  private random!: SeededRandom;
  private controls!: ControlKeys;
  private aimGuide!: Phaser.GameObjects.Graphics;
  private hoopGraphics!: Phaser.GameObjects.Graphics;
  private hoopGlow!: Phaser.GameObjects.Image;
  private cleanup: Array<() => void> = [];

  private hoopHp: number = HOOP.maxHp;
  private hoopMaxHp: number = HOOP.maxHp;
  private bossPhase = 1;
  private hitStop = 0;
  private elapsedSeconds = 0;
  private score = 0;
  private kills = 0;
  private blocks = 0;
  private combo = 0;
  private maxCombo = 0;
  private comboRemaining = 0;
  private comboDuration = 3.2;
  private hype = 0;
  private hudTimer = 0;
  private paused = false;
  private upgradePending = false;
  private ended = false;
  private pointerAttacking = false;
  private usePointerAim = false;
  private threatVisible = false;
  private mobileMove = { x: 0, y: 0 };
  private movementLocked = false;
  private dashRemaining = 0;
  private dashAngle = 0;
  private dashHits = new Set<EnemyEntity>();
  private credMultiplier = 1;
  private readonly upgradeRanks = new Map<UpgradeId, number>();
  private readonly evolutionsTaken = new Set<EvolutionId>();
  private screenZones: Array<{
    x: number;
    y: number;
    radius: number;
    remaining: number;
    graphic: Phaser.GameObjects.Graphics;
  }> = [];

  private readonly cooldowns: Record<SkillName, number> = {
    skill1: 0,
    skill2: 0,
    skill3: 0,
    ultimate: 0,
  };

  private readonly cooldownTotals: Record<SkillName, number> = {
    skill1: 5,
    skill2: 7,
    skill3: 11,
    ultimate: 8,
  };

  constructor() {
    super("Game");
  }

  init(data?: { mode?: GameMode }): void {
    this.mode = data?.mode ?? "campaign";
  }

  create(): void {
    this.resetRunState();
    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.setZoom(VIEWPORT.width / WORLD.width);
    this.cameras.main.centerOn(WORLD.centerX, WORLD.centerY);
    this.cameras.main.setBackgroundColor(COLORS.ink);

    const save = saveStore.load();
    this.character = getCharacter(save.profile.selectedCharacter);
    this.skillHandlers = {
      "chasedown-block": () => this.doChasedownBlock(),
      "power-drive": () => this.doPowerDrive(),
      "court-quake": () => this.doCourtQuake(),
      "kings-court": () => this.doKingsCourt(),
      fadeaway: () => this.doFadeaway(),
      "viper-strike": () => this.doViperStrike(),
      lockdown: () => this.doLockdown(),
      "mamba-mentality": () => this.doMambaMentality(),
      "splash-bomb": () => this.doSplashBomb(),
      "crossover-storm": () => this.doCrossoverStorm(),
      "pick-roll": () => this.doPickRoll(),
      "night-night": () => this.doNightNight(),
    };

    this.drawArena();
    this.createHoop();
    this.player = new PlayerEntity(this, WORLD.centerX + 175, WORLD.centerY, this.character);
    this.applyPermanentBonuses(save.profile.permanentUpgrades);
    this.enemies = this.physics.add.group();
    this.effects = new EffectsSystem(this);
    this.random = new SeededRandom(Date.now());
    this.waveDirector = new WaveDirector(this.random, this.mode);
    this.aimGuide = this.add.graphics().setDepth(16);

    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.collider(
      this.player,
      this.enemies,
      (_playerObject, enemyObject) => this.handlePlayerContact(enemyObject as EnemyEntity),
      undefined,
      this,
    );

    this.setupInput();
    this.setupEvents();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.dispose());

    eventBus.emit("game:screen", { name: "menu", visible: false });
    eventBus.emit("game:screen", { name: "results", visible: false });
    eventBus.emit("game:screen", { name: "upgrade", visible: false });
    eventBus.emit("game:screen", { name: "pause", visible: false });
    eventBus.emit("game:hud-visible", true);
    this.emitLoadout();
    this.startNextWave();

    if (!saveStore.load().tutorialSeen) {
      this.paused = true;
      this.physics.pause();
      eventBus.emit("game:screen", { name: "tutorial", visible: true });
    }
  }

  override update(_time: number, rawDelta: number): void {
    if (this.ended) return;
    if (Phaser.Input.Keyboard.JustDown(this.controls.pause)) this.togglePause();
    if (this.paused) return;

    const rawSeconds = rawDelta / 1_000;
    let deltaSeconds = Math.min(0.05, rawSeconds);
    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - rawSeconds);
      deltaSeconds *= 0.08;
    }
    this.elapsedSeconds += deltaSeconds;
    this.updateTimers(deltaSeconds);
    this.updateInput();
    this.updateDash(deltaSeconds);
    this.player.tick(deltaSeconds, this.movementLocked);
    this.updateAimGuide();

    if (this.pointerAttacking || this.controls.attack.isDown) this.performAction("attack", false);
    if (Phaser.Input.Keyboard.JustDown(this.controls.skill1)) this.performAction("skill1", false);
    if (Phaser.Input.Keyboard.JustDown(this.controls.skill2)) this.performAction("skill2", false);
    if (Phaser.Input.Keyboard.JustDown(this.controls.skill3)) this.performAction("skill3", false);
    if (Phaser.Input.Keyboard.JustDown(this.controls.ultimate)) this.performAction("ultimate", false);

    const enemySlow = this.player.empowerSeconds > 0 ? this.player.empowerEnemySlow : 1;
    this.enemies.getChildren().forEach((object) => {
      const enemy = object as EnemyEntity;
      enemy.updateAi(deltaSeconds, WORLD.centerX, WORLD.centerY, enemySlow, (shooter) =>
        this.enemyShoot(shooter),
      );
    });

    this.updateShots(deltaSeconds);
    this.updateScreenZones(deltaSeconds);
    if (this.boss?.active) this.updateBossPhase();
    this.updateWave(deltaSeconds);
    this.updateThreat();

    this.hudTimer -= deltaSeconds;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.08;
      this.emitHud();
    }
  }

  private resetRunState(): void {
    this.shots = [];
    this.boss = null;
    this.cleanup = [];
    this.hoopHp = HOOP.maxHp;
    this.hoopMaxHp = HOOP.maxHp;
    this.bossPhase = 1;
    this.hitStop = 0;
    this.elapsedSeconds = 0;
    this.score = 0;
    this.kills = 0;
    this.blocks = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboRemaining = 0;
    this.hype = 0;
    this.hudTimer = 0;
    this.paused = false;
    this.upgradePending = false;
    this.ended = false;
    this.pointerAttacking = false;
    this.usePointerAim = false;
    this.threatVisible = false;
    this.mobileMove = { x: 0, y: 0 };
    this.movementLocked = false;
    this.dashRemaining = 0;
    this.dashHits.clear();
    this.credMultiplier = 1;
    this.upgradeRanks.clear();
    this.evolutionsTaken.clear();
    this.screenZones.forEach((zone) => zone.graphic.destroy());
    this.screenZones = [];
    Object.keys(this.cooldowns).forEach((key) => {
      this.cooldowns[key as SkillName] = 0;
    });
  }

  private drawArena(): void {
    this.add
      .image(WORLD.centerX, WORLD.centerY, "court")
      .setDisplaySize(WORLD.width, WORLD.height)
      .setDepth(0);

    const upperLight = this.add
      .image(WORLD.centerX - 510, WORLD.centerY - 300, "fx-glow")
      .setDisplaySize(850, 850)
      .setTint(COLORS.orange)
      .setAlpha(0.07)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(2);
    const lowerLight = this.add
      .image(WORLD.centerX + 500, WORLD.centerY + 290, "fx-glow")
      .setDisplaySize(760, 760)
      .setTint(COLORS.cyan)
      .setAlpha(0.055)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(2);
    this.tweens.add({
      targets: [upperLight, lowerLight],
      alpha: { from: 0.045, to: 0.09 },
      duration: 2_700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const border = this.add.graphics().setDepth(4);
    border.fillStyle(0x080a10, 0.92);
    border.fillRect(0, 0, WORLD.width, 54);
    border.fillRect(0, WORLD.height - 54, WORLD.width, 54);
    border.fillRect(0, 0, 54, WORLD.height);
    border.fillRect(WORLD.width - 54, 0, 54, WORLD.height);
    border.lineStyle(2, COLORS.orange, 0.35);
    border.strokeRect(56, 56, WORLD.width - 112, WORLD.height - 112);

    for (let index = 0; index < 18; index += 1) {
      const x = 90 + index * 84;
      const top = this.add.rectangle(x, 28, 44, 22, index % 3 === 0 ? COLORS.orange : 0x252b36, 0.36);
      const bottom = this.add.rectangle(
        WORLD.width - x,
        WORLD.height - 28,
        44,
        22,
        index % 4 === 0 ? COLORS.cyan : 0x252b36,
        0.3,
      );
      this.tweens.add({
        targets: [top, bottom],
        alpha: { from: 0.18, to: 0.48 },
        duration: 900 + index * 45,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private createHoop(): void {
    this.hoopGlow = this.add
      .image(WORLD.centerX, WORLD.centerY, "fx-glow")
      .setDisplaySize(260, 260)
      .setTint(COLORS.cyan)
      .setAlpha(0.19)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(7);
    this.tweens.add({
      targets: this.hoopGlow,
      alpha: { from: 0.12, to: 0.24 },
      scale: { from: 0.92, to: 1.08 },
      duration: 1_500,
      yoyo: true,
      repeat: -1,
    });

    this.hoopGraphics = this.add.graphics().setDepth(13);
    this.redrawHoop(COLORS.orange);
    const plate = this.add.rectangle(WORLD.centerX, WORLD.centerY - 67, 102, 12, COLORS.cream, 0.82).setDepth(12);
    plate.setStrokeStyle(3, 0x252b36, 0.8);
  }

  private redrawHoop(color: number): void {
    this.hoopGraphics.clear();
    this.hoopGraphics.fillStyle(0x080b12, 0.55);
    this.hoopGraphics.fillCircle(WORLD.centerX, WORLD.centerY, HOOP.radius + 7);
    this.hoopGraphics.lineStyle(11, color, 1);
    this.hoopGraphics.strokeCircle(WORLD.centerX, WORLD.centerY, HOOP.radius);
    this.hoopGraphics.lineStyle(3, COLORS.cream, 0.68);
    this.hoopGraphics.strokeCircle(WORLD.centerX, WORLD.centerY, HOOP.radius - 12);
    this.hoopGraphics.lineStyle(2, COLORS.cyan, 0.28);
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      this.hoopGraphics.lineBetween(
        WORLD.centerX + Math.cos(angle) * (HOOP.radius - 12),
        WORLD.centerY + Math.sin(angle) * (HOOP.radius - 12),
        WORLD.centerX + Math.cos(angle + 0.32) * 18,
        WORLD.centerY + Math.sin(angle + 0.32) * 18,
      );
    }
  }

  private setupInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error("Keyboard input is unavailable.");
    this.controls = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      attack: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      skill1: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      skill2: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      skill3: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      ultimate: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      pause: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
    };
    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.W,
      Phaser.Input.Keyboard.KeyCodes.A,
      Phaser.Input.Keyboard.KeyCodes.S,
      Phaser.Input.Keyboard.KeyCodes.D,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    ]);

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.pointerAttacking = true;
        this.usePointerAim = true;
        this.performAction("attack", false);
      }
    });
    this.input.on("pointerup", () => {
      this.pointerAttacking = false;
    });
    this.input.on("pointermove", () => {
      this.usePointerAim = true;
    });
  }

  private setupEvents(): void {
    this.cleanup.push(
      eventBus.on("ui:action", (action) => this.performAction(action, true)),
      eventBus.on("input:joystick", (movement) => {
        this.mobileMove = movement;
      }),
      eventBus.on("ui:upgrade-selected", (choice) => this.applyChoice(choice)),
      eventBus.on("ui:resume", () => this.resumeFromPause()),
      eventBus.on("ui:quit", () => this.returnToMenu()),
      eventBus.on("ui:tutorial-close", () => {
        eventBus.emit("game:screen", { name: "tutorial", visible: false });
        if (!this.ended && this.paused && !this.upgradePending) {
          this.paused = false;
          this.physics.resume();
        }
      }),
    );
  }

  private updateInput(): void {
    const keyboardX = Number(this.controls.right.isDown) - Number(this.controls.left.isDown);
    const keyboardY = Number(this.controls.down.isDown) - Number(this.controls.up.isDown);
    const moveX = keyboardX !== 0 ? keyboardX : this.mobileMove.x;
    const moveY = keyboardY !== 0 ? keyboardY : this.mobileMove.y;
    this.player.setMovement(moveX, moveY);

    if (this.usePointerAim) {
      const pointer = this.input.activePointer;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.player.setAim(Math.atan2(worldPoint.y - this.player.y, worldPoint.x - this.player.x));
    } else {
      this.autoAim();
    }
  }

  private autoAim(): void {
    const shot = this.nearestShot(this.player.x, this.player.y, 420);
    if (shot) {
      this.player.setAim(Math.atan2(shot.y - this.player.y, shot.x - this.player.x));
      return;
    }
    const enemy = this.nearestEnemy(this.player.x, this.player.y, 620);
    if (enemy) this.player.setAim(Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x));
  }

  private updateAimGuide(): void {
    const range = this.player.attackRange;
    const x2 = this.player.x + Math.cos(this.player.aimAngle) * range;
    const y2 = this.player.y + Math.sin(this.player.aimAngle) * range;
    this.aimGuide.clear();
    this.aimGuide.lineStyle(2, COLORS.gold, 0.22);
    this.aimGuide.lineBetween(this.player.x, this.player.y, x2, y2);
    this.aimGuide.lineStyle(2, COLORS.gold, 0.42);
    this.aimGuide.strokeCircle(x2, y2, 8);
  }

  private updateTimers(deltaSeconds: number): void {
    (Object.keys(this.cooldowns) as SkillName[]).forEach((key) => {
      this.cooldowns[key] = Math.max(0, this.cooldowns[key] - deltaSeconds);
    });
    if (this.comboRemaining > 0) {
      this.comboRemaining -= deltaSeconds;
      if (this.comboRemaining <= 0) this.combo = 0;
    }
  }

  private updateDash(deltaSeconds: number): void {
    if (this.dashRemaining <= 0) return;
    this.dashRemaining = Math.max(0, this.dashRemaining - deltaSeconds);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(Math.cos(this.dashAngle) * 720, Math.sin(this.dashAngle) * 720);

    this.enemies.getChildren().forEach((object) => {
      const enemy = object as EnemyEntity;
      if (this.dashHits.has(enemy)) return;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) < 78) {
        this.dashHits.add(enemy);
        this.damageEnemy(enemy, this.player.damage * 2.75, 420, this.dashAngle, true);
      }
    });
    this.shots.forEach((shot) => {
      if (shot.active && shot.distanceTo(this.player.x, this.player.y - 20) < 72) this.blockShot(shot, false);
    });

    if (this.dashRemaining <= 0) {
      this.movementLocked = false;
      body.setVelocity(0, 0);
      this.dashHits.clear();
    }
  }

  private performAction(action: ActionName, fromUi: boolean): void {
    if (this.paused || this.ended) return;
    if (fromUi && action === "attack") {
      this.usePointerAim = false;
      this.autoAim();
    }

    switch (action) {
      case "attack":
        this.doAttack();
        break;
      case "skill1":
      case "skill2":
      case "skill3":
      case "ultimate":
        this.skillHandlers[this.character.skills[action]]();
        break;
    }
  }

  private doAttack(): void {
    if (!this.player.startAttack()) return;
    const range = this.player.attackRange;
    const angle = this.player.aimAngle;
    const damage = this.player.damage * (this.player.empowerSeconds > 0 ? this.player.empowerDamageMult : 1);
    this.effects.swat(this.player.x, this.player.y, angle, range);
    audio.swat();

    let connected = false;
    this.enemies.getChildren().forEach((object) => {
      const enemy = object as EnemyEntity;
      if (!this.isInCone(enemy.x, enemy.y, range, angle, this.player.attackArc)) return;
      connected = true;
      this.damageEnemy(enemy, damage, 250, angle);
    });
    this.shots.forEach((shot) => {
      if (!shot.active || !this.isInCone(shot.x, shot.y, range + 28, angle, this.player.attackArc)) return;
      connected = true;
      this.blockShot(shot, false);
    });

    this.tweens.add({
      targets: this.player,
      scaleX: 0.92,
      scaleY: 0.92,
      duration: 55,
      yoyo: true,
      onComplete: () => this.player.setScale(0.82),
    });
    if (!connected) this.effects.floatingText(this.player.x, this.player.y - 54, "SWISH?", "#8b929f", 14);
  }

  private doChasedownBlock(): void {
    if (!this.consumeCooldown("skill1")) return;
    const range = this.player.attackRange * 1.9;
    const angle = this.player.aimAngle;
    this.effects.swat(this.player.x, this.player.y, angle, range, COLORS.cyan);
    this.effects.shockwave(this.player.x, this.player.y, range * 0.58, COLORS.cyan);

    this.enemies.getChildren().forEach((object) => {
      const enemy = object as EnemyEntity;
      if (this.isInCone(enemy.x, enemy.y, range, angle, Math.PI * 0.95)) {
        this.damageEnemy(enemy, this.player.damage * 2.15, 380, angle, true);
        enemy.stun(0.7);
      }
    });
    this.shots.forEach((shot) => {
      if (shot.active && this.isInCone(shot.x, shot.y, range + 45, angle, Math.PI * 1.05)) {
        this.blockShot(shot, false);
      }
    });
  }

  private doPowerDrive(): void {
    if (!this.consumeCooldown("skill2") || this.dashRemaining > 0) return;
    this.dashAngle = this.player.aimAngle;
    this.dashRemaining = 0.36 * this.player.driveMultiplier;
    this.movementLocked = true;
    this.player.invulnerableSeconds = Math.max(this.player.invulnerableSeconds, 0.45);
    this.dashHits.clear();
    this.effects.shockwave(this.player.x, this.player.y, 80, COLORS.gold);
  }

  private doCourtQuake(): void {
    if (!this.consumeCooldown("skill3")) return;
    const radius = 255 * this.player.quakeMultiplier;
    this.effects.shockwave(this.player.x, this.player.y, radius, COLORS.orange);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.cameras.main.shake(320, 0.014);
    }

    this.enemies.getChildren().forEach((object) => {
      const enemy = object as EnemyEntity;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (distance > radius) return;
      const angle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
      this.damageEnemy(enemy, this.player.damage * 2.45, 330, angle, true);
      enemy.stun(1.9 * this.player.quakeMultiplier);
    });
    this.shots.forEach((shot) => {
      if (shot.active && shot.distanceTo(this.player.x, this.player.y) <= radius) this.blockShot(shot, false);
    });
  }

  private activateEmpower(config: {
    seconds: number;
    damageMult: number;
    speedMult: number;
    damageReduction: number;
    enemySlow: number;
    shotSlow: number;
    title: string;
    subtitle: string;
    color: number;
    colorHex: string;
  }): void {
    if (this.hype < PLAYER_BASE.maxHype || this.player.empowerSeconds > 0) return;
    this.hype = 0;
    this.player.empowerSeconds = config.seconds;
    this.player.empowerDamageMult = config.damageMult;
    this.player.empowerSpeedMult = config.speedMult;
    this.player.empowerDamageReduction = config.damageReduction;
    this.player.empowerEnemySlow = config.enemySlow;
    this.player.empowerShotSlow = config.shotSlow;
    this.cooldowns.ultimate = config.seconds;
    this.effects.shockwave(this.player.x, this.player.y, 480, config.color);
    this.effects.announce(config.title, config.subtitle, config.colorHex);
    audio.ultimate();

    const aura = this.add
      .image(this.player.x, this.player.y, "fx-ring")
      .setTint(config.color)
      .setAlpha(0.42)
      .setScale(7)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(11);
    const timer = this.time.addEvent({
      delay: 40,
      loop: true,
      callback: () => {
        if (!this.player.active || this.player.empowerSeconds <= 0 || this.ended) {
          aura.destroy();
          timer.remove();
          return;
        }
        aura.setPosition(this.player.x, this.player.y).setRotation(aura.rotation + 0.012);
      },
    });
  }

  private doKingsCourt(): void {
    this.activateEmpower({
      seconds: 8,
      damageMult: 1.5,
      speedMult: 1.14,
      damageReduction: 0.5,
      enemySlow: 0.52,
      shotSlow: 0.55,
      title: "KING'S COURT",
      subtitle: "THE PAINT BELONGS TO YOU",
      color: COLORS.gold,
      colorHex: "#ffc43d",
    });
  }

  private doMambaMentality(): void {
    this.activateEmpower({
      seconds: 10,
      damageMult: 2.1,
      speedMult: 1.5,
      damageReduction: 0.25,
      enemySlow: 1,
      shotSlow: 1,
      title: "MAMBA MENTALITY",
      subtitle: "STRIKE FROM EVERYWHERE",
      color: COLORS.purple,
      colorHex: "#9b6dff",
    });
  }

  private doNightNight(): void {
    this.activateEmpower({
      seconds: 6,
      damageMult: 1.25,
      speedMult: 1.1,
      damageReduction: 0.3,
      enemySlow: 0.2,
      shotSlow: 0.2,
      title: "NIGHT NIGHT",
      subtitle: "TIME SLOWS TO A CRAWL",
      color: COLORS.cyan,
      colorHex: "#48d8ff",
    });
  }

  private doFadeaway(): void {
    if (!this.consumeCooldown("skill1")) return;
    this.dashAngle = this.player.aimAngle + Math.PI;
    this.dashRemaining = 0.18 * this.player.driveMultiplier;
    this.movementLocked = true;
    this.player.invulnerableSeconds = Math.max(this.player.invulnerableSeconds, 0.35);
    this.dashHits.clear();

    const range = this.player.attackRange * 2.1;
    const angle = this.player.aimAngle;
    this.effects.swat(this.player.x, this.player.y, angle, range, COLORS.purple);
    this.enemies.getChildren().forEach((object) => {
      const enemy = object as EnemyEntity;
      if (this.isInCone(enemy.x, enemy.y, range, angle, Math.PI * 0.5)) {
        this.damageEnemy(enemy, this.player.damage * 1.8, 300, angle, true);
      }
    });
    this.shots.forEach((shot) => {
      if (shot.active && this.isInCone(shot.x, shot.y, range + 40, angle, Math.PI * 0.55)) {
        this.blockShot(shot, false);
      }
    });
  }

  private doViperStrike(): void {
    if (!this.consumeCooldown("skill2") || this.dashRemaining > 0) return;
    this.dashAngle = this.player.aimAngle;
    this.dashRemaining = 0.34 * this.player.driveMultiplier;
    this.movementLocked = true;
    this.player.invulnerableSeconds = Math.max(this.player.invulnerableSeconds, 0.42);
    this.dashHits.clear();
    this.effects.shockwave(this.player.x, this.player.y, 92, COLORS.purple);
  }

  private doLockdown(): void {
    if (!this.consumeCooldown("skill3")) return;
    const targets = this.nearestEnemies(this.player.x, this.player.y, 3, 520);
    targets.forEach((enemy) => {
      enemy.stun(3);
      this.effects.hit(enemy.x, enemy.y - 16, COLORS.purple, true);
    });
    this.effects.shockwave(this.player.x, this.player.y, 130, COLORS.purple);
  }

  private doSplashBomb(): void {
    if (!this.consumeCooldown("skill1")) return;
    const distance = 260;
    const targetX = this.player.x + Math.cos(this.player.aimAngle) * distance;
    const targetY = this.player.y + Math.sin(this.player.aimAngle) * distance;
    const radius = 165;
    this.effects.shockwave(targetX, targetY, radius, COLORS.cyan);
    this.enemies.getChildren().forEach((object) => {
      const enemy = object as EnemyEntity;
      if (Phaser.Math.Distance.Between(targetX, targetY, enemy.x, enemy.y) <= radius) {
        const angle = Math.atan2(enemy.y - targetY, enemy.x - targetX);
        this.damageEnemy(enemy, this.player.damage * 2.2, 260, angle, true);
      }
    });
    this.shots.forEach((shot) => {
      if (shot.active && shot.distanceTo(targetX, targetY) <= radius) this.blockShot(shot, false);
    });
  }

  private doCrossoverStorm(): void {
    if (!this.consumeCooldown("skill2")) return;
    const radius = 235 * this.player.quakeMultiplier;
    this.effects.shockwave(this.player.x, this.player.y, radius, COLORS.cyan);
    this.enemies.getChildren().forEach((object) => {
      const enemy = object as EnemyEntity;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (distance > radius) return;
      const angle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
      this.damageEnemy(enemy, this.player.damage * 1.6, 430, angle, true);
    });
    this.shots.forEach((shot) => {
      if (shot.active && shot.distanceTo(this.player.x, this.player.y) <= radius) {
        this.blockShot(shot, false);
      }
    });
  }

  private doPickRoll(): void {
    if (!this.consumeCooldown("skill3")) return;
    const distance = 150;
    const x = this.player.x + Math.cos(this.player.aimAngle) * distance;
    const y = this.player.y + Math.sin(this.player.aimAngle) * distance;
    const graphic = this.add.graphics().setDepth(9);
    this.screenZones.push({ x, y, radius: 104, remaining: 5, graphic });
    this.effects.shockwave(x, y, 104, COLORS.cyan);
  }

  private nearestEnemies(x: number, y: number, count: number, maxDistance: number): EnemyEntity[] {
    return (this.enemies.getChildren() as EnemyEntity[])
      .filter((enemy) => enemy.active)
      .map((enemy) => ({ enemy, distance: Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) }))
      .filter((entry) => entry.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count)
      .map((entry) => entry.enemy);
  }

  private updateScreenZones(deltaSeconds: number): void {
    this.screenZones.forEach((zone) => {
      zone.remaining -= deltaSeconds;
      const alpha = Phaser.Math.Clamp(zone.remaining / 5, 0.2, 0.7);
      zone.graphic.clear();
      zone.graphic.fillStyle(COLORS.cyan, 0.1 * alpha);
      zone.graphic.fillCircle(zone.x, zone.y, zone.radius);
      zone.graphic.lineStyle(3, COLORS.cyan, 0.55 * alpha);
      zone.graphic.strokeCircle(zone.x, zone.y, zone.radius);
    });
    this.screenZones = this.screenZones.filter((zone) => {
      if (zone.remaining <= 0) {
        zone.graphic.destroy();
        return false;
      }
      return true;
    });
  }

  private consumeCooldown(skill: Exclude<SkillName, "ultimate">): boolean {
    if (this.cooldowns[skill] > 0) return false;
    const total = this.cooldownTotals[skill] * this.player.skillCooldownMultiplier;
    this.cooldowns[skill] = total;
    audio.skill();
    return true;
  }

  private damageEnemy(
    enemy: EnemyEntity,
    rawDamage: number,
    knockback: number,
    angle: number,
    forceCritical = false,
  ): void {
    if (!enemy.active) return;
    const critical = forceCritical || this.random.next() < this.player.critChance;
    const damage = Math.round(rawDamage * (critical ? this.player.critMultiplier : 1));
    const died = enemy.takeDamage(damage, angle, knockback);
    this.effects.hit(enemy.x, enemy.y - 16, enemy.definition.color, critical);
    this.effects.floatingText(
      enemy.x + this.random.between(-10, 10),
      enemy.y - 48,
      critical ? `${damage}!` : damage.toString(),
      critical ? "#ffc43d" : "#f7f1df",
      critical ? 24 : 17,
    );
    audio.hit(critical);
    if (died) this.killEnemy(enemy);
  }

  private killEnemy(enemy: EnemyEntity): void {
    if (!enemy.active) return;
    const wasBoss = enemy.isBoss;
    if (wasBoss) this.hitStop = Math.max(this.hitStop, 0.22);
    else if (enemy.eliteId) this.hitStop = Math.max(this.hitStop, 0.07);
    this.kills += 1;
    this.score += Math.round(
      enemy.definition.score * this.player.scoreMultiplier * this.comboMultiplier() * enemy.scoreMult,
    );
    this.addHype(wasBoss ? 35 : 7);
    this.bumpCombo();
    this.effects.kill(enemy.x, enemy.y, enemy.definition.color);
    const wasSplitter = enemy.eliteId === "splitter";
    const splitX = enemy.x;
    const splitY = enemy.y;
    this.enemies.remove(enemy);
    if (enemy === this.boss) this.boss = null;
    enemy.destroy();
    if (wasSplitter) this.time.delayedCall(10, () => this.spawnSplit(splitX, splitY));
  }

  private blockShot(shot: EnemyShot, bodyBlock: boolean): void {
    if (!shot.active) return;
    const x = shot.x;
    const y = shot.y;
    shot.destroy();
    this.blocks += 1;
    this.score += Math.round((shot.fromBoss ? 240 : 125) * this.player.scoreMultiplier * this.comboMultiplier());
    this.addHype((shot.fromBoss ? 22 : 14) * this.player.hypeGainMultiplier);
    this.bumpCombo();
    if (this.player.blockHeal > 0) this.player.heal(this.player.blockHeal);
    this.effects.block(x, y);
    audio.block();

    if (bodyBlock && this.player.receiveDamage(shot.fromBoss ? 12 : 5)) {
      this.effects.floatingText(this.player.x, this.player.y - 58, "BODY SAVE", "#ffc43d", 18);
      if (this.player.hp <= 0) this.finishRun(false);
    }
  }

  private enemyShoot(enemy: EnemyEntity): void {
    const definition = enemy.definition;
    const shotCount = enemy.isBoss ? 1 + this.bossPhase * 2 : 1;
    const mid = (shotCount - 1) / 2;
    const accuracy = Math.min(1, definition.accuracy + enemy.accuracyBonus);
    for (let index = 0; index < shotCount; index += 1) {
      const spread = shotCount === 1 ? 0 : (index - mid) * 64;
      const offCenter = enemy.isBoss && Math.abs(index - mid) >= 0.5;
      const willScore = this.random.next() < accuracy * (offCenter ? 0.72 : 1);
      const missOffset = willScore ? spread : spread + this.random.between(90, 155) * (this.random.next() > 0.5 ? 1 : -1);
      const baseDamage = offCenter ? definition.shotDamage * 0.58 : definition.shotDamage;
      const shot = new EnemyShot(
        this,
        enemy.x,
        enemy.y - 26,
        WORLD.centerX + missOffset,
        WORLD.centerY + (shotCount === 1 ? this.random.between(-22, 22) : spread * 0.25),
        definition.shotSpeed,
        Math.round(baseDamage * enemy.shotDamageMult),
        willScore,
        definition.color,
        enemy.isBoss,
      );
      this.shots.push(shot);
    }
    if (enemy.isBoss) {
      this.effects.shockwave(enemy.x, enemy.y, 125, COLORS.red);
      audio.boss();
    }
  }

  private updateShots(deltaSeconds: number): void {
    const speedMultiplier = this.player.empowerSeconds > 0 ? this.player.empowerShotSlow : 1;
    this.shots.forEach((shot) => {
      if (!shot.active) return;
      if (this.screenZones.some((zone) => shot.distanceTo(zone.x, zone.y) <= zone.radius)) {
        this.blockShot(shot, false);
        return;
      }
      if (shot.distanceTo(this.player.x, this.player.y - 24) < PLAYER_BASE.radius + 18) {
        this.blockShot(shot, true);
        return;
      }
      if (shot.update(deltaSeconds, speedMultiplier)) this.resolveShot(shot);
    });
    this.shots = this.shots.filter((shot) => shot.active);
  }

  private resolveShot(shot: EnemyShot): void {
    if (!shot.active) return;
    if (shot.willScore) {
      this.hoopHp = Math.max(0, this.hoopHp - shot.damage);
      this.effects.floatingText(WORLD.centerX, WORLD.centerY - 80, `RIM -${shot.damage}`, "#ff3b55", 24);
      this.effects.shockwave(WORLD.centerX, WORLD.centerY, shot.fromBoss ? 145 : 92, COLORS.red);
      audio.score();
      this.redrawHoop(COLORS.red);
      this.hoopGlow.setTint(COLORS.red);
      this.time.delayedCall(220, () => {
        if (this.ended) return;
        this.redrawHoop(COLORS.orange);
        this.hoopGlow.setTint(COLORS.cyan);
      });
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        this.cameras.main.shake(160, shot.fromBoss ? 0.012 : 0.006);
      }
    } else {
      this.effects.floatingText(shot.x, shot.y - 38, "OFF IRON", "#9ba2af", 17);
    }
    shot.destroy();
    if (this.hoopHp <= 0) this.finishRun(false);
  }

  private updateWave(deltaSeconds: number): void {
    const alive = this.enemies.countActive(true);
    const tick = this.waveDirector.update(deltaSeconds, alive, Boolean(this.boss?.active));
    tick.spawns.forEach((kind) => this.spawnEnemy(kind));
    if (tick.completed && !this.upgradePending) {
      if (this.waveDirector.isFinalWave) {
        this.finishRun(true);
      } else {
        this.openUpgradeChoice();
      }
    }
  }

  private startNextWave(): void {
    const started = this.waveDirector.startNextWave();
    if (!started) {
      this.finishRun(true);
      return;
    }
    this.effects.announce(
      `WAVE ${started.wave.number}`,
      started.wave.title,
      started.wave.boss ? "#ff3b55" : "#ff5a1f",
    );
    if (started.bossToSpawn) {
      this.spawnEnemy(started.bossToSpawn);
      eventBus.emit("game:threat", { visible: true, copy: "BOSS ON THE BLACKTOP" });
      this.effects.announce("FINAL POSSESSION", "THE COMMISSIONER HAS ARRIVED", "#ff3b55");
      audio.boss();
    }
  }

  private spawnEnemy(kind: Parameters<typeof getEnemyDefinition>[0]): void {
    const definition = getEnemyDefinition(kind);
    const angle = this.random.between(0, Math.PI * 2);
    const distance = kind === "sniper" ? 640 : this.random.between(540, 680);
    const x = Phaser.Math.Clamp(WORLD.centerX + Math.cos(angle) * distance, 90, WORLD.width - 90);
    const y = Phaser.Math.Clamp(WORLD.centerY + Math.sin(angle) * distance, 90, WORLD.height - 90);
    const wave = this.waveDirector.current?.number ?? 1;
    const healthMultiplier = 1 + (wave - 1) * 0.14;
    const elite =
      kind !== "boss" && this.random.next() < eliteChanceForWave(wave)
        ? this.random.pick(ELITE_MODIFIERS)
        : null;
    const enemy = new EnemyEntity(this, x, y, definition, healthMultiplier, elite);
    this.enemies.add(enemy);
    if (enemy.isBoss) this.boss = enemy;
    this.effects.spawn(x, y, elite ? elite.color : definition.color);
  }

  private spawnSplit(x: number, y: number): void {
    const definition = getEnemyDefinition("rookie");
    for (let index = 0; index < 2; index += 1) {
      const ex = Phaser.Math.Clamp(x + this.random.between(-42, 42), 90, WORLD.width - 90);
      const ey = Phaser.Math.Clamp(y + this.random.between(-42, 42), 90, WORLD.height - 90);
      const enemy = new EnemyEntity(this, ex, ey, definition, 0.6);
      this.enemies.add(enemy);
      this.effects.spawn(ex, ey, definition.color);
    }
  }

  private updateBossPhase(): void {
    const boss = this.boss;
    if (!boss || !boss.active) return;
    const fraction = boss.hp / boss.maxHp;
    const desired = fraction > 0.66 ? 1 : fraction > 0.33 ? 2 : 3;
    if (desired <= this.bossPhase) return;
    this.bossPhase = desired;
    this.effects.announce("THE COMMISSIONER ERUPTS", `PHASE ${desired}`, "#ff3b55");
    this.effects.shockwave(boss.x, boss.y, 220, COLORS.red);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.cameras.main.shake(300, 0.012);
    }
    audio.boss();
    for (let index = 0; index < 1 + desired; index += 1) {
      this.time.delayedCall(index * 130, () => {
        if (this.boss?.active) this.spawnEnemy(this.random.next() < 0.5 ? "rookie" : "shooter");
      });
    }
  }

  private openUpgradeChoice(): void {
    const offers = this.buildUpgradeOffers();
    if (offers.length === 0) {
      this.startNextWave();
      return;
    }
    this.upgradePending = true;
    this.paused = true;
    this.physics.pause();
    eventBus.emit("game:upgrade-choice", offers);
  }

  private buildUpgradeOffers(): ChoiceOffer[] {
    const offers: ChoiceOffer[] = [];

    const evolution = availableEvolutions(
      EVOLUTIONS,
      this.upgradeRanks,
      (id) => getUpgrade(id).maxRank,
      this.evolutionsTaken,
    )[0];
    if (evolution) {
      offers.push({
        kind: "evolution",
        id: evolution.id,
        name: evolution.name,
        label: "EVOLUTION",
        description: evolution.description,
        icon: evolution.icon,
        rarity: "evolution",
        rank: 1,
        maxRank: 1,
      });
    }

    const upgradeCount = 3 - offers.length;
    rollUpgradeChoices(UPGRADES, this.upgradeRanks, this.random, upgradeCount).forEach(
      (definition) => {
        offers.push({
          kind: "upgrade",
          id: definition.id,
          name: definition.name,
          label: definition.category,
          description: definition.description,
          icon: definition.icon,
          rarity: definition.rarity,
          rank: (this.upgradeRanks.get(definition.id) ?? 0) + 1,
          maxRank: definition.maxRank,
        });
      },
    );

    return offers;
  }

  private applyChoice(id: ChoiceId): void {
    if (!this.upgradePending) return;
    if (isEvolutionId(id)) {
      if (!this.evolutionsTaken.has(id)) {
        this.evolutionsTaken.add(id);
        EVOLUTION_EFFECTS[id](this.createUpgradeContext());
      }
    } else {
      const definition = getUpgrade(id);
      const currentRank = this.upgradeRanks.get(id) ?? 0;
      if (currentRank < definition.maxRank) {
        this.upgradeRanks.set(id, currentRank + 1);
        UPGRADE_EFFECTS[id](this.createUpgradeContext());
      }
    }
    this.player.level += 1;
    this.upgradePending = false;
    this.paused = false;
    eventBus.emit("game:screen", { name: "upgrade", visible: false });
    this.physics.resume();
    this.startNextWave();
  }

  private createUpgradeContext(): UpgradeContext {
    return {
      player: this.player,
      addHoopMaxHp: (amount) => {
        this.hoopMaxHp += amount;
      },
      repairHoop: (amount) => {
        this.hoopHp = Math.min(this.hoopMaxHp, this.hoopHp + amount);
      },
      extendCombo: (seconds) => {
        this.comboDuration += seconds;
      },
    };
  }

  private applyPermanentBonuses(levels: Record<string, number>): void {
    const bonuses = computePermanentBonuses(levels);
    this.player.maxHp += bonuses.bonusMaxHp;
    this.player.hp = this.player.maxHp;
    this.player.damage *= bonuses.damageMultiplier;
    this.player.attackCooldownTotal *= bonuses.attackCooldownMultiplier;
    this.hoopMaxHp += bonuses.bonusRimHp;
    this.hoopHp = this.hoopMaxHp;
    this.credMultiplier = bonuses.credMultiplier;
  }

  private handlePlayerContact(enemy: EnemyEntity): void {
    if (!enemy.active || enemy.contactCooldown > 0 || this.ended) return;
    enemy.contactCooldown = 0.7;
    if (!this.player.receiveDamage(enemy.definition.touchDamage)) return;
    const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(Math.cos(angle) * 280, Math.sin(angle) * 280);
    this.effects.hit(this.player.x, this.player.y - 20, COLORS.red, true);
    this.effects.floatingText(
      this.player.x,
      this.player.y - 62,
      `-${enemy.definition.touchDamage}`,
      "#ff3b55",
      21,
    );
    audio.hurt();
    this.player.setTint(COLORS.red);
    this.time.delayedCall(120, () => {
      if (this.player.active) this.player.clearTint();
    });
    if (this.player.hp <= 0) this.finishRun(false);
  }

  private isInCone(
    targetX: number,
    targetY: number,
    range: number,
    direction: number,
    arc: number,
  ): boolean {
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);
    if (distance > range) return false;
    const targetAngle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
    return Math.abs(Phaser.Math.Angle.Wrap(targetAngle - direction)) <= arc / 2;
  }

  private nearestEnemy(x: number, y: number, maxDistance: number): EnemyEntity | undefined {
    let nearest: EnemyEntity | undefined;
    let nearestDistance = maxDistance;
    this.enemies.getChildren().forEach((object) => {
      const enemy = object as EnemyEntity;
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (enemy.active && distance < nearestDistance) {
        nearest = enemy;
        nearestDistance = distance;
      }
    });
    return nearest;
  }

  private nearestShot(x: number, y: number, maxDistance: number): EnemyShot | undefined {
    let nearest: EnemyShot | undefined;
    let nearestDistance = maxDistance;
    this.shots.forEach((shot) => {
      const distance = Phaser.Math.Distance.Between(x, y, shot.x, shot.y);
      if (shot.active && distance < nearestDistance) {
        nearest = shot;
        nearestDistance = distance;
      }
    });
    return nearest;
  }

  private addHype(amount: number): void {
    this.hype = Phaser.Math.Clamp(this.hype + amount, 0, PLAYER_BASE.maxHype);
  }

  private bumpCombo(): void {
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.comboRemaining = this.comboDuration;
    if (this.combo >= 3) {
      this.effects.floatingText(
        this.player.x,
        this.player.y - 86,
        `${this.combo}x RUN`,
        this.combo >= 10 ? "#ff5a1f" : "#ffc43d",
        Math.min(30, 17 + this.combo),
      );
    }
  }

  private comboMultiplier(): number {
    return 1 + Math.min(1.5, this.combo * 0.05);
  }

  private updateThreat(): void {
    const visible = this.shots.some((shot) => shot.active);
    if (visible === this.threatVisible) return;
    this.threatVisible = visible;
    eventBus.emit("game:threat", { visible, copy: "SHOT INBOUND" });
  }

  private emitLoadout(): void {
    const slots = ["skill1", "skill2", "skill3", "ultimate"] as const;
    eventBus.emit("game:loadout", {
      character: this.character.name,
      abilities: slots.map((slot) => {
        const meta = SKILL_META[this.character.skills[slot]];
        return { action: slot, name: meta.name, icon: meta.icon };
      }),
    });
  }

  private emitHud(): void {
    const currentWave = this.waveDirector.current;
    const snapshot: HudSnapshot = {
      playerHp: this.player.hp,
      playerMaxHp: this.player.maxHp,
      hoopHp: this.hoopHp,
      hoopMaxHp: this.hoopMaxHp,
      wave: currentWave?.number ?? 1,
      waveCount: this.waveDirector.waveCount,
      endless: this.waveDirector.isEndless,
      elapsedSeconds: this.elapsedSeconds,
      score: this.score,
      level: this.player.level,
      hype: this.hype,
      objective: this.boss?.active ? "BREAK THE COMMISSIONER" : currentWave?.title ?? "PROTECT THE RIM",
      cooldowns: {
        skill1: {
          remaining: this.cooldowns.skill1,
          total: this.cooldownTotals.skill1 * this.player.skillCooldownMultiplier,
        },
        skill2: {
          remaining: this.cooldowns.skill2,
          total: this.cooldownTotals.skill2 * this.player.skillCooldownMultiplier,
        },
        skill3: {
          remaining: this.cooldowns.skill3,
          total: this.cooldownTotals.skill3 * this.player.skillCooldownMultiplier,
        },
        ultimate: {
          remaining: this.cooldowns.ultimate,
          total: this.cooldownTotals.ultimate,
        },
      },
    };
    eventBus.emit("game:hud", snapshot);
  }

  private togglePause(): void {
    if (this.ended || this.upgradePending) return;
    if (this.paused) this.resumeFromPause();
    else {
      this.paused = true;
      this.physics.pause();
      eventBus.emit("game:screen", { name: "pause", visible: true });
    }
  }

  private resumeFromPause(): void {
    if (!this.paused || this.upgradePending || this.ended) return;
    this.paused = false;
    this.physics.resume();
    eventBus.emit("game:screen", { name: "pause", visible: false });
  }

  private returnToMenu(): void {
    if (this.ended) return;
    this.ended = true;
    eventBus.emit("game:screen", { name: "pause", visible: false });
    eventBus.emit("game:hud-visible", false);
    this.scene.start("Menu");
  }

  private finishRun(victory: boolean): void {
    if (this.ended) return;
    this.ended = true;
    this.physics.pause();
    this.pointerAttacking = false;
    eventBus.emit("game:threat", { visible: false });
    const finalScore = this.score + (victory ? 5_000 : 0);
    const wave = this.waveDirector.current?.number ?? 1;
    const credEarned = Math.round(
      computeRunCred({
        score: finalScore,
        kills: this.kills,
        blocks: this.blocks,
        wave,
        victory,
      }) * this.credMultiplier,
    );
    const result: RunResult = {
      victory,
      mode: this.mode,
      elapsedSeconds: this.elapsedSeconds,
      score: finalScore,
      kills: this.kills,
      blocks: this.blocks,
      maxCombo: this.maxCombo,
      wave,
      credEarned,
    };
    saveStore.recordRun(result);
    this.effects.announce(
      victory ? "COURT HELD" : "RIM DOWN",
      victory ? "THE LAST POSSESSION IS YOURS" : "RESET. READ. RUN IT BACK.",
      victory ? "#ffc43d" : "#ff3b55",
    );
    this.time.delayedCall(900, () => this.scene.start("Results", result));
  }

  private dispose(): void {
    this.cleanup.forEach((unsubscribe) => unsubscribe());
    this.cleanup = [];
    this.shots.forEach((shot) => shot.destroy());
    this.shots = [];
    this.screenZones.forEach((zone) => zone.graphic.destroy());
    this.screenZones = [];
    eventBus.emit("game:hud-visible", false);
    eventBus.emit("game:threat", { visible: false });
    eventBus.emit("game:screen", { name: "upgrade", visible: false });
    eventBus.emit("game:screen", { name: "pause", visible: false });
  }
}

import Phaser from "phaser";
import { COLORS, PLAYER_BASE } from "./config";
import type { CharacterDefinition, EnemyDefinition } from "./types";

type EnemyState = "approach" | "windup" | "recover" | "stunned" | "dead";

export class PlayerEntity extends Phaser.Physics.Arcade.Sprite {
  hp: number = PLAYER_BASE.maxHp;
  maxHp: number = PLAYER_BASE.maxHp;
  moveSpeed: number = PLAYER_BASE.speed;
  damage: number = PLAYER_BASE.damage;
  attackRange: number = PLAYER_BASE.attackRange;
  attackArc: number = PLAYER_BASE.attackArc;
  attackCooldownTotal: number = PLAYER_BASE.attackCooldown;
  attackCooldown = 0;
  skillCooldownMultiplier = 1;
  damageReduction = 0;
  blockHeal = 0;
  hypeGainMultiplier = 1;
  scoreMultiplier = 1;
  quakeMultiplier = 1;
  driveMultiplier = 1;
  invulnerableSeconds = 0;
  kingModeSeconds = 0;
  aimAngle = 0;
  level = 1;

  readonly characterId: CharacterDefinition["id"];

  private moveX = 0;
  private moveY = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, character: CharacterDefinition) {
    super(scene, x, y, character.textureKey);
    this.characterId = character.id;
    this.maxHp = character.stats.maxHp;
    this.hp = character.stats.maxHp;
    this.moveSpeed = character.stats.moveSpeed;
    this.damage = character.stats.damage;
    this.attackRange = character.stats.attackRange;
    this.attackArc = character.stats.attackArc;
    this.attackCooldownTotal = character.stats.attackCooldown;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(25).setScale(0.82).setCollideWorldBounds(true);
    this.setDrag(1_500, 1_500);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(PLAYER_BASE.radius);
    body.setOffset(this.width / 2 - PLAYER_BASE.radius, this.height - PLAYER_BASE.radius * 2 - 8);
    body.setMass(4);
    body.setMaxVelocity(620, 620);
  }

  setMovement(x: number, y: number): void {
    this.moveX = x;
    this.moveY = y;
  }

  setAim(angle: number): void {
    this.aimAngle = angle;
    this.setFlipX(Math.cos(angle) < 0);
  }

  tick(deltaSeconds: number, movementLocked: boolean): void {
    this.attackCooldown = Math.max(0, this.attackCooldown - deltaSeconds);
    this.invulnerableSeconds = Math.max(0, this.invulnerableSeconds - deltaSeconds);
    this.kingModeSeconds = Math.max(0, this.kingModeSeconds - deltaSeconds);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!movementLocked) {
      const magnitude = Math.hypot(this.moveX, this.moveY);
      if (magnitude > 0.08) {
        const speed = this.moveSpeed * (this.kingModeSeconds > 0 ? 1.14 : 1);
        body.setVelocity((this.moveX / magnitude) * speed, (this.moveY / magnitude) * speed);
        this.setRotation(Math.sin(this.scene.time.now * 0.014) * 0.025);
      } else {
        body.setVelocity(0, 0);
        this.setRotation(0);
      }
    }
  }

  startAttack(): boolean {
    if (this.attackCooldown > 0) return false;
    this.attackCooldown = this.attackCooldownTotal;
    return true;
  }

  receiveDamage(amount: number): boolean {
    if (this.invulnerableSeconds > 0) return false;
    const kingReduction = this.kingModeSeconds > 0 ? 0.5 : 0;
    this.hp = Math.max(0, this.hp - amount * (1 - Math.max(this.damageReduction, kingReduction)));
    this.invulnerableSeconds = 0.48;
    return true;
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }
}

export class EnemyEntity extends Phaser.Physics.Arcade.Sprite {
  readonly definition: EnemyDefinition;
  readonly maxHp: number;
  hp: number;
  aiState: EnemyState = "approach";
  windupRemaining = 0;
  recoverRemaining = 0;
  stunRemaining = 0;
  knockbackRemaining = 0;
  contactCooldown = 0;
  isBoss: boolean;

  private readonly hpBack: Phaser.GameObjects.Rectangle;
  private readonly hpFill: Phaser.GameObjects.Rectangle;
  private readonly telegraph: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    definition: EnemyDefinition,
    healthMultiplier: number,
  ) {
    super(scene, x, y, `enemy-${definition.kind}`);
    this.definition = definition;
    this.maxHp = Math.round(definition.maxHp * healthMultiplier);
    this.hp = this.maxHp;
    this.isBoss = definition.kind === "boss";

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(18).setScale(this.isBoss ? 1.06 : definition.kind === "center" ? 0.94 : 0.78);
    this.setCollideWorldBounds(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    const scaledRadius = Math.round(definition.radius * 0.86);
    body.setCircle(scaledRadius);
    body.setOffset(this.width / 2 - scaledRadius, this.height - scaledRadius * 2 - 5);
    body.setMass(definition.mass);
    body.setBounce(0.35);

    const barWidth = this.isBoss ? 92 : 52;
    this.hpBack = scene.add.rectangle(x, y - 52, barWidth, this.isBoss ? 7 : 4, 0x080b12, 0.86).setDepth(55);
    this.hpFill = scene.add
      .rectangle(x - barWidth / 2, y - 52, barWidth, this.isBoss ? 7 : 4, definition.color, 1)
      .setOrigin(0, 0.5)
      .setDepth(56);
    this.telegraph = scene.add.graphics().setDepth(12);
    this.updateHealthBar();
  }

  updateAi(
    deltaSeconds: number,
    targetX: number,
    targetY: number,
    slowMultiplier: number,
    onShoot: (enemy: EnemyEntity) => void,
  ): void {
    if (!this.active || this.aiState === "dead") return;
    this.contactCooldown = Math.max(0, this.contactCooldown - deltaSeconds);
    this.knockbackRemaining = Math.max(0, this.knockbackRemaining - deltaSeconds);
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.stunRemaining > 0) {
      this.stunRemaining = Math.max(0, this.stunRemaining - deltaSeconds);
      body.setVelocity(0, 0);
      this.aiState = this.stunRemaining > 0 ? "stunned" : "approach";
      this.telegraph.clear();
      this.setTint(0x8ee7ff);
      this.updateVisuals();
      return;
    }

    if (this.knockbackRemaining > 0) {
      this.updateVisuals();
      return;
    }

    this.clearTint();
    const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    const angle = Math.atan2(targetY - this.y, targetX - this.x);

    if (this.aiState === "approach") {
      if (distance > this.definition.preferredRange) {
        const speed = this.definition.speed * slowMultiplier;
        body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.setFlipX(body.velocity.x < 0);
      } else {
        this.aiState = "windup";
        this.windupRemaining =
          this.definition.windupSeconds * (this.isBoss && this.hp < this.maxHp * 0.5 ? 0.72 : 1);
        body.setVelocity(0, 0);
      }
    } else if (this.aiState === "windup") {
      body.setVelocity(0, 0);
      this.windupRemaining -= deltaSeconds;
      this.drawTelegraph(targetX, targetY);
      if (this.windupRemaining <= 0) {
        onShoot(this);
        this.aiState = "recover";
        this.recoverRemaining = this.isBoss ? 0.65 : 0.9 + Math.random() * 0.45;
        this.telegraph.clear();
      }
    } else if (this.aiState === "recover") {
      this.recoverRemaining -= deltaSeconds;
      const tangent = angle + Math.PI / 2 * (this.x > targetX ? 1 : -1);
      body.setVelocity(Math.cos(tangent) * 38 * slowMultiplier, Math.sin(tangent) * 38 * slowMultiplier);
      if (this.recoverRemaining <= 0) this.aiState = "approach";
    }

    this.updateVisuals();
  }

  takeDamage(amount: number, knockbackAngle: number, knockbackForce: number): boolean {
    if (this.aiState === "dead") return false;
    this.hp = Math.max(0, this.hp - amount);
    this.updateHealthBar();

    if (knockbackForce > 0 && this.definition.mass < 7) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      const force = knockbackForce / Math.max(1, this.definition.mass * 0.7);
      body.setVelocity(Math.cos(knockbackAngle) * force, Math.sin(knockbackAngle) * force);
      this.knockbackRemaining = 0.14;
      if (this.aiState === "windup" && this.definition.kind !== "center") {
        this.aiState = "approach";
        this.telegraph.clear();
      }
    }

    if (this.hp <= 0) {
      this.aiState = "dead";
      return true;
    }
    return false;
  }

  stun(seconds: number): void {
    const resistance = this.isBoss ? 0.3 : this.definition.kind === "center" ? 0.55 : 1;
    this.stunRemaining = Math.max(this.stunRemaining, seconds * resistance);
    this.aiState = "stunned";
    this.telegraph.clear();
  }

  override destroy(fromScene?: boolean): void {
    this.hpBack.destroy();
    this.hpFill.destroy();
    this.telegraph.destroy();
    super.destroy(fromScene);
  }

  private drawTelegraph(targetX: number, targetY: number): void {
    const progress = Phaser.Math.Clamp(
      1 - this.windupRemaining / Math.max(0.01, this.definition.windupSeconds),
      0,
      1,
    );
    this.telegraph.clear();
    this.telegraph.lineStyle(this.isBoss ? 5 : 3, this.definition.color, 0.55 + progress * 0.4);
    this.telegraph.strokeCircle(this.x, this.y + 8, this.definition.radius + 12 + progress * 15);
    this.telegraph.lineStyle(1, this.definition.color, 0.18);
    this.telegraph.lineBetween(this.x, this.y, targetX, targetY);
    this.setScale((this.isBoss ? 1.06 : this.definition.kind === "center" ? 0.94 : 0.78) * (1 + progress * 0.06));
  }

  private updateVisuals(): void {
    const barY = this.y - (this.isBoss ? 68 : 47);
    this.hpBack.setPosition(this.x, barY);
    this.hpFill.setPosition(this.x - this.hpBack.width / 2, barY);
    const damaged = this.hp < this.maxHp;
    this.hpBack.setVisible(damaged || this.isBoss);
    this.hpFill.setVisible(damaged || this.isBoss);

    if (this.aiState !== "windup") {
      this.setScale(this.isBoss ? 1.06 : this.definition.kind === "center" ? 0.94 : 0.78);
    }
  }

  private updateHealthBar(): void {
    this.hpFill.displayWidth = this.hpBack.width * Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
  }
}

export class EnemyShot {
  readonly damage: number;
  readonly willScore: boolean;
  readonly fromBoss: boolean;
  active = true;
  x: number;
  y: number;

  private progress = 0;
  private readonly duration: number;
  private readonly startX: number;
  private readonly startY: number;
  private readonly targetX: number;
  private readonly targetY: number;
  private readonly ball: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly arc: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    speed: number,
    damage: number,
    willScore: boolean,
    color: number,
    fromBoss = false,
  ) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.damage = damage;
    this.willScore = willScore;
    this.fromBoss = fromBoss;
    this.duration = Math.max(0.48, Phaser.Math.Distance.Between(x, y, targetX, targetY) / speed);

    this.arc = scene.add.graphics().setDepth(10);
    this.drawArc(color);
    this.shadow = scene.add.ellipse(x, y, fromBoss ? 34 : 24, fromBoss ? 15 : 10, 0x000000, 0.32).setDepth(14);
    this.ball = scene.add
      .image(x, y, fromBoss ? "boss-ball" : "basketball")
      .setTint(fromBoss ? COLORS.red : 0xffffff)
      .setScale(fromBoss ? 0.86 : 0.66)
      .setDepth(38);
  }

  update(deltaSeconds: number, speedMultiplier: number): boolean {
    if (!this.active) return false;
    this.progress = Math.min(1, this.progress + (deltaSeconds * speedMultiplier) / this.duration);
    const eased = Phaser.Math.Easing.Sine.InOut(this.progress);
    this.x = Phaser.Math.Linear(this.startX, this.targetX, eased);
    this.y = Phaser.Math.Linear(this.startY, this.targetY, eased);
    const height = Math.sin(this.progress * Math.PI) * (this.fromBoss ? 125 : 88);
    this.shadow.setPosition(this.x, this.y).setScale(1 - height / 450).setAlpha(0.34 - height / 600);
    this.ball
      .setPosition(this.x, this.y - height)
      .setRotation(this.ball.rotation + deltaSeconds * 8)
      .setScale((this.fromBoss ? 0.86 : 0.66) + height / 380);
    this.arc.setAlpha(Math.max(0, 0.42 - this.progress * 0.34));
    return this.progress >= 1;
  }

  distanceTo(x: number, y: number): number {
    return Phaser.Math.Distance.Between(this.ball.x, this.ball.y, x, y);
  }

  destroy(): void {
    if (!this.active) return;
    this.active = false;
    this.ball.destroy();
    this.shadow.destroy();
    this.arc.destroy();
  }

  private drawArc(color: number): void {
    this.arc.lineStyle(this.fromBoss ? 3 : 2, color, this.fromBoss ? 0.45 : 0.22);
    this.arc.beginPath();
    for (let index = 0; index <= 18; index += 1) {
      const progress = index / 18;
      const x = Phaser.Math.Linear(this.startX, this.targetX, progress);
      const y = Phaser.Math.Linear(this.startY, this.targetY, progress) - Math.sin(progress * Math.PI) * 88;
      if (index === 0) this.arc.moveTo(x, y);
      else this.arc.lineTo(x, y);
    }
    this.arc.strokePath();
  }
}

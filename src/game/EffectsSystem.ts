import Phaser from "phaser";
import { COLORS } from "./config";

export class EffectsSystem {
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  constructor(private readonly scene: Phaser.Scene) {}

  swat(x: number, y: number, angle: number, range: number, color: number = COLORS.gold): void {
    const arc = this.scene.add.graphics().setDepth(30);
    arc.fillStyle(color, 0.25);
    arc.lineStyle(5, color, 0.9);
    arc.slice(x, y, range, angle - Math.PI * 0.36, angle + Math.PI * 0.36, false);
    arc.fillPath();
    arc.strokePath();
    this.scene.tweens.add({
      targets: arc,
      alpha: 0,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: this.reducedMotion ? 70 : 180,
      onComplete: () => arc.destroy(),
    });

    this.ring(x, y, color, 0.35, range / 30, 240);
  }

  hit(x: number, y: number, color: number = COLORS.orange, strong = false): void {
    const count = this.reducedMotion ? 3 : strong ? 12 : 7;
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 24 + Math.random() * (strong ? 68 : 38);
      const spark = this.scene.add
        .image(x, y, "fx-spark")
        .setTint(index % 3 === 0 ? COLORS.cream : color)
        .setScale(strong ? 0.9 : 0.55)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(42);
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.08,
        duration: 150 + Math.random() * 130,
        onComplete: () => spark.destroy(),
      });
    }

    if (!this.reducedMotion) {
      this.scene.cameras.main.shake(strong ? 95 : 45, strong ? 0.006 : 0.0025);
    }
  }

  block(x: number, y: number): void {
    this.ring(x, y, COLORS.cyan, 0.55, 4.8, 330);
    this.ring(x, y, COLORS.cream, 0.2, 3.4, 210);
    this.hit(x, y, COLORS.cyan, true);
    this.floatingText(x, y - 34, "DENIED", "#48d8ff", 26);
  }

  kill(x: number, y: number, color: number): void {
    this.hit(x, y, color, true);
    const smoke = this.scene.add.image(x, y, "fx-glow").setTint(color).setAlpha(0.38).setDepth(18);
    this.scene.tweens.add({
      targets: smoke,
      alpha: 0,
      scale: 3.5,
      duration: 380,
      onComplete: () => smoke.destroy(),
    });
  }

  shockwave(x: number, y: number, radius: number, color: number = COLORS.orange): void {
    this.ring(x, y, color, 0.8, radius / 28, 430);
    const flash = this.scene.add
      .image(x, y, "fx-glow")
      .setTint(color)
      .setAlpha(0.52)
      .setScale(1.8)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(40);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: radius / 40,
      duration: 360,
      onComplete: () => flash.destroy(),
    });
  }

  spawn(x: number, y: number, color: number): void {
    this.ring(x, y, color, 0.65, 2.8, 350);
    const beam = this.scene.add.rectangle(x, y, 5, 150, color, 0.35).setDepth(24);
    this.scene.tweens.add({
      targets: beam,
      alpha: 0,
      scaleY: 0.2,
      duration: 300,
      onComplete: () => beam.destroy(),
    });
  }

  floatingText(x: number, y: number, copy: string, color = "#ffffff", size = 18): void {
    const label = this.scene.add
      .text(x, y, copy, {
        color,
        fontFamily: '"Barlow Condensed", Impact, sans-serif',
        fontSize: `${size}px`,
        fontStyle: "bold",
        stroke: "#080b12",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(80);
    this.scene.tweens.add({
      targets: label,
      y: y - 44,
      alpha: 0,
      duration: 620,
      ease: "Cubic.easeOut",
      onComplete: () => label.destroy(),
    });
  }

  announce(copy: string, subcopy: string, color = "#ff5a1f"): void {
    const camera = this.scene.cameras.main;
    const container = this.scene.add.container(camera.centerX, camera.centerY - 64).setScrollFactor(0).setDepth(120);
    const line = this.scene.add.rectangle(0, 0, 420, 2, Phaser.Display.Color.HexStringToColor(color).color, 0.8);
    const title = this.scene.add
      .text(0, -12, copy, {
        color,
        fontFamily: '"Barlow Condensed", Impact, sans-serif',
        fontSize: "52px",
        fontStyle: "bold italic",
        stroke: "#080b12",
        strokeThickness: 8,
      })
      .setOrigin(0.5, 1);
    const subtitle = this.scene.add
      .text(0, 13, subcopy, {
        color: "#f7f1df",
        fontFamily: '"Inter", sans-serif',
        fontSize: "11px",
        letterSpacing: 4,
      })
      .setOrigin(0.5, 0);
    container.add([line, title, subtitle]);
    container.setAlpha(0).setScale(0.82);
    this.scene.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 180,
      ease: "Back.easeOut",
      yoyo: true,
      hold: 1_050,
      onComplete: () => container.destroy(),
    });
  }

  private ring(
    x: number,
    y: number,
    color: number,
    alpha: number,
    targetScale: number,
    duration: number,
  ): void {
    const ring = this.scene.add
      .image(x, y, "fx-ring")
      .setTint(color)
      .setAlpha(alpha)
      .setScale(0.4)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(35);
    this.scene.tweens.add({
      targets: ring,
      alpha: 0,
      scale: targetScale,
      duration: this.reducedMotion ? Math.min(duration, 100) : duration,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }
}

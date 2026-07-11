import Phaser from "phaser";
import { eventBus } from "../core/EventBus";
import { COLORS, VIEWPORT, WORLD } from "../game/config";

export class MenuScene extends Phaser.Scene {
  private cleanup: Array<() => void> = [];

  constructor() {
    super("Menu");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.ink);
    this.add
      .image(VIEWPORT.width / 2, VIEWPORT.height / 2, "court")
      .setDisplaySize(VIEWPORT.width * 1.18, VIEWPORT.height * 1.18)
      .setTint(0x566071)
      .setAlpha(0.3);

    const halo = this.add
      .image(VIEWPORT.width * 0.72, VIEWPORT.height * 0.49, "fx-glow")
      .setDisplaySize(620, 620)
      .setTint(COLORS.orange)
      .setAlpha(0.12)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: halo,
      alpha: { from: 0.08, to: 0.17 },
      scale: { from: 0.95, to: 1.08 },
      duration: 2_400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const rim = this.add.graphics().setAlpha(0.28);
    rim.lineStyle(2, COLORS.cream, 0.7);
    rim.strokeCircle(VIEWPORT.width * 0.72, VIEWPORT.height * 0.48, 180);
    rim.lineStyle(1, COLORS.orange, 0.6);
    rim.strokeCircle(VIEWPORT.width * 0.72, VIEWPORT.height * 0.48, 250);

    for (let index = 0; index < 12; index += 1) {
      const particle = this.add
        .image(
          VIEWPORT.width * 0.55 + Math.random() * VIEWPORT.width * 0.4,
          Math.random() * VIEWPORT.height,
          "fx-spark",
        )
        .setTint(index % 2 === 0 ? COLORS.orange : COLORS.cyan)
        .setAlpha(0.1 + Math.random() * 0.15)
        .setScale(0.25 + Math.random() * 0.35);
      this.tweens.add({
        targets: particle,
        y: particle.y - 80 - Math.random() * 160,
        alpha: 0,
        duration: 1_800 + Math.random() * 2_200,
        delay: Math.random() * 1_500,
        repeat: -1,
      });
    }

    this.cleanup.push(
      eventBus.on("ui:start", () => this.startRun()),
      eventBus.on("ui:tutorial", () => {
        eventBus.emit("game:screen", { name: "tutorial", visible: true });
      }),
      eventBus.on("ui:tutorial-close", () => {
        eventBus.emit("game:screen", { name: "tutorial", visible: false });
      }),
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.dispose());
    eventBus.emit("game:screen", { name: "loading", visible: false });
    eventBus.emit("game:screen", { name: "results", visible: false });
    eventBus.emit("game:screen", { name: "pause", visible: false });
    eventBus.emit("game:screen", { name: "menu", visible: true });
    eventBus.emit("game:hud-visible", false);

    // Keep the constants referenced here to make the menu's scale relationship explicit.
    this.registry.set("world-size", `${WORLD.width}x${WORLD.height}`);
  }

  private startRun(): void {
    eventBus.emit("game:screen", { name: "menu", visible: false });
    eventBus.emit("game:screen", { name: "tutorial", visible: false });
    this.scene.start("Game");
  }

  private dispose(): void {
    this.cleanup.forEach((unsubscribe) => unsubscribe());
    this.cleanup = [];
  }
}

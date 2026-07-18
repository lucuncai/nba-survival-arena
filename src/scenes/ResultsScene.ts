import Phaser from "phaser";
import { eventBus } from "../core/EventBus";
import { audio } from "../game/AudioSystem";
import { COLORS, VIEWPORT } from "../game/config";
import type { RunResult } from "../game/types";

export class ResultsScene extends Phaser.Scene {
  private result!: RunResult;
  private cleanup: Array<() => void> = [];

  constructor() {
    super("Results");
  }

  init(data: RunResult): void {
    this.result = data;
  }

  create(): void {
    this.add
      .image(VIEWPORT.width / 2, VIEWPORT.height / 2, "court")
      .setDisplaySize(VIEWPORT.width * 1.15, VIEWPORT.height * 1.15)
      .setTint(this.result.victory ? 0x596f62 : 0x4b3d46)
      .setAlpha(0.48);

    const hero = this.add
      .image(VIEWPORT.width * 0.74, VIEWPORT.height * 0.56, "hero-king")
      .setScale(2.2)
      .setAlpha(0.52)
      .setTint(this.result.victory ? 0xffffff : 0x81848a);
    this.tweens.add({
      targets: hero,
      y: hero.y - 8,
      duration: 1_500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const glow = this.add
      .image(hero.x, hero.y, "fx-glow")
      .setDisplaySize(620, 620)
      .setTint(this.result.victory ? COLORS.gold : COLORS.red)
      .setAlpha(0.16)
      .setBlendMode(Phaser.BlendModes.ADD);
    glow.setDepth(-1);

    this.cleanup.push(
      eventBus.on("ui:play-again", () => this.scene.start("Game", { mode: this.result.mode })),
      eventBus.on("ui:menu", () => this.scene.start("Menu")),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.dispose());

    eventBus.emit("game:hud-visible", false);
    eventBus.emit("game:screen", { name: "results", visible: true });
    eventBus.emit("game:results", this.result);
    if (this.result.victory) audio.victory();
  }

  private dispose(): void {
    this.cleanup.forEach((unsubscribe) => unsubscribe());
    this.cleanup = [];
    eventBus.emit("game:screen", { name: "results", visible: false });
  }
}

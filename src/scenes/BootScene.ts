import Phaser from "phaser";
import { eventBus } from "../core/EventBus";
import { ASSET_MANIFEST } from "../game/assets";
import { WORLD } from "../game/config";
import type { EnemyKind } from "../game/types";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    ASSET_MANIFEST.images.forEach((asset) => this.load.image(asset.key, asset.url));
    ASSET_MANIFEST.atlases.forEach((asset) =>
      this.load.atlas(asset.key, asset.textureUrl, asset.atlasUrl),
    );
    ASSET_MANIFEST.audio.forEach((asset) => this.load.audio(asset.key, asset.urls));
  }

  create(): void {
    eventBus.emit("game:loading", { progress: 0.18, copy: "Painting the blacktop..." });
    this.generateCourt();
    eventBus.emit("game:loading", { progress: 0.48, copy: "Calling the legends..." });
    this.generateCharacters();
    eventBus.emit("game:loading", { progress: 0.72, copy: "Inflating the game ball..." });
    this.generateBasketballs();
    this.generateEffects();
    eventBus.emit("game:loading", { progress: 1, copy: "Court ready." });

    this.time.delayedCall(220, () => this.scene.start("Menu"));
  }

  private addCanvasTexture(key: string, canvas: HTMLCanvasElement): void {
    if (this.textures.exists(key)) return;
    this.textures.addCanvas(key, canvas);
  }

  private generateCourt(): void {
    if (this.textures.exists("court")) return;
    const canvas = document.createElement("canvas");
    canvas.width = WORLD.width;
    canvas.height = WORLD.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas rendering is unavailable.");

    const background = context.createRadialGradient(
      WORLD.centerX,
      WORLD.centerY,
      80,
      WORLD.centerX,
      WORLD.centerY,
      950,
    );
    background.addColorStop(0, "#32343a");
    background.addColorStop(0.46, "#24282f");
    background.addColorStop(1, "#10141b");
    context.fillStyle = background;
    context.fillRect(0, 0, WORLD.width, WORLD.height);

    let seed = 481516;
    const random = (): number => {
      seed = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      seed ^= seed + Math.imul(seed ^ (seed >>> 7), 61 | seed);
      return ((seed ^ (seed >>> 14)) >>> 0) / 4_294_967_296;
    };

    const image = context.getImageData(0, 0, WORLD.width, WORLD.height);
    for (let index = 0; index < image.data.length; index += 4) {
      const grain = (random() - 0.5) * 15;
      image.data[index] = Math.max(0, image.data[index]! + grain);
      image.data[index + 1] = Math.max(0, image.data[index + 1]! + grain);
      image.data[index + 2] = Math.max(0, image.data[index + 2]! + grain);
    }
    context.putImageData(image, 0, 0);

    context.save();
    context.strokeStyle = "rgba(247,241,223,0.68)";
    context.lineWidth = 4;
    context.shadowColor = "rgba(72,216,255,0.22)";
    context.shadowBlur = 12;
    context.strokeRect(75, 70, WORLD.width - 150, WORLD.height - 140);
    context.beginPath();
    context.moveTo(WORLD.centerX, 70);
    context.lineTo(WORLD.centerX, WORLD.height - 70);
    context.stroke();
    context.beginPath();
    context.arc(WORLD.centerX, WORLD.centerY, 154, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(WORLD.centerX, WORLD.centerY, 360, 0, Math.PI * 2);
    context.setLineDash([10, 15]);
    context.globalAlpha = 0.32;
    context.stroke();
    context.restore();

    context.save();
    context.translate(WORLD.centerX, WORLD.centerY);
    context.rotate(-0.08);
    context.font = "900 116px Impact, Arial Black, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "rgba(255,90,31,0.09)";
    context.strokeStyle = "rgba(255,196,61,0.08)";
    context.lineWidth = 3;
    context.fillText("LAST STAND", 0, 10);
    context.strokeText("LAST STAND", 0, 10);
    context.restore();

    context.save();
    context.lineCap = "round";
    for (let crack = 0; crack < 28; crack += 1) {
      let x = random() * WORLD.width;
      let y = random() * WORLD.height;
      context.beginPath();
      context.moveTo(x, y);
      for (let segment = 0; segment < 4 + Math.floor(random() * 6); segment += 1) {
        x += (random() - 0.5) * 36;
        y += (random() - 0.5) * 28;
        context.lineTo(x, y);
      }
      context.strokeStyle = `rgba(0,0,0,${0.12 + random() * 0.16})`;
      context.lineWidth = 1 + random();
      context.stroke();
    }
    context.restore();

    const vignette = context.createRadialGradient(
      WORLD.centerX,
      WORLD.centerY,
      260,
      WORLD.centerX,
      WORLD.centerY,
      930,
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(0.7, "rgba(0,0,0,0.08)");
    vignette.addColorStop(1, "rgba(0,0,0,0.62)");
    context.fillStyle = vignette;
    context.fillRect(0, 0, WORLD.width, WORLD.height);

    this.addCanvasTexture("court", canvas);
  }

  private generateCharacters(): void {
    this.addCanvasTexture("hero-king", this.createCharacterTexture("#ff5a1f", "#f7f1df", "23", true));

    const enemyLooks: Array<[EnemyKind, string, string, string]> = [
      ["rookie", "#f28b3c", "#202631", "08"],
      ["shooter", "#3acbea", "#102a3a", "11"],
      ["sniper", "#a06df2", "#23163a", "03"],
      ["center", "#e33a50", "#37121a", "55"],
      ["boss", "#ff274b", "#11151f", "00"],
    ];
    enemyLooks.forEach(([kind, jersey, trim, number]) => {
      this.addCanvasTexture(
        `enemy-${kind}`,
        this.createCharacterTexture(jersey, trim, number, false, kind === "boss" ? 1.18 : 1),
      );
    });
  }

  private createCharacterTexture(
    jersey: string,
    trim: string,
    number: string,
    hero: boolean,
    sizeMultiplier = 1,
  ): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = 120;
    canvas.height = 142;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas rendering is unavailable.");
    context.scale(sizeMultiplier, sizeMultiplier);
    const inverse = 1 / sizeMultiplier;
    const width = canvas.width * inverse;

    context.fillStyle = "rgba(0,0,0,0.28)";
    context.beginPath();
    context.ellipse(width / 2, 129 * inverse, 36, 10, 0, 0, Math.PI * 2);
    context.fill();

    context.lineCap = "round";
    context.strokeStyle = "#121722";
    context.lineWidth = 16;
    context.beginPath();
    context.moveTo(width / 2 - 17, 91);
    context.lineTo(width / 2 - 22, 124);
    context.moveTo(width / 2 + 17, 91);
    context.lineTo(width / 2 + 22, 124);
    context.stroke();

    context.strokeStyle = hero ? "#f7f1df" : "#d8d9dc";
    context.lineWidth = 8;
    context.beginPath();
    context.moveTo(width / 2 - 24, 124);
    context.lineTo(width / 2 - 38, 126);
    context.moveTo(width / 2 + 24, 124);
    context.lineTo(width / 2 + 38, 126);
    context.stroke();

    const bodyGradient = context.createLinearGradient(28, 52, 92, 108);
    bodyGradient.addColorStop(0, jersey);
    bodyGradient.addColorStop(0.58, jersey);
    bodyGradient.addColorStop(0.6, trim);
    bodyGradient.addColorStop(1, "#111721");
    context.fillStyle = bodyGradient;
    context.strokeStyle = "rgba(255,255,255,0.23)";
    context.lineWidth = 3;
    context.beginPath();
    context.roundRect(width / 2 - 34, 49, 68, 63, 19);
    context.fill();
    context.stroke();

    context.strokeStyle = "#6e432b";
    context.lineWidth = hero ? 17 : 14;
    context.beginPath();
    context.moveTo(width / 2 - 30, 59);
    context.lineTo(width / 2 - 47, 89);
    context.moveTo(width / 2 + 30, 59);
    context.lineTo(width / 2 + 47, 89);
    context.stroke();

    context.fillStyle = hero ? "#8a5534" : "#734429";
    context.strokeStyle = "#121722";
    context.lineWidth = 5;
    context.beginPath();
    context.arc(width / 2, 37, hero ? 25 : 23, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = "#171313";
    context.beginPath();
    context.arc(width / 2, 31, hero ? 24 : 22, Math.PI, Math.PI * 2);
    context.fill();

    context.strokeStyle = "rgba(255,255,255,0.7)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(width / 2 - 13, 38);
    context.lineTo(width / 2 - 5, 38);
    context.moveTo(width / 2 + 5, 38);
    context.lineTo(width / 2 + 13, 38);
    context.stroke();

    context.fillStyle = "#f7f1df";
    context.font = `900 ${hero ? 30 : 25}px Impact, Arial Black, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.strokeStyle = "#111721";
    context.lineWidth = 5;
    context.strokeText(number, width / 2, 80);
    context.fillText(number, width / 2, 80);

    if (hero) {
      context.fillStyle = "#ffc43d";
      context.shadowColor = "#ffc43d";
      context.shadowBlur = 8;
      context.beginPath();
      context.moveTo(width / 2 - 18, 10);
      context.lineTo(width / 2 - 12, 1);
      context.lineTo(width / 2 - 3, 10);
      context.lineTo(width / 2 + 5, 0);
      context.lineTo(width / 2 + 13, 10);
      context.lineTo(width / 2 + 19, 2);
      context.lineTo(width / 2 + 17, 17);
      context.lineTo(width / 2 - 17, 17);
      context.closePath();
      context.fill();
    }
    return canvas;
  }

  private generateBasketballs(): void {
    const makeBall = (key: string, size: number, core: string, seam: string): void => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas rendering is unavailable.");
      const center = size / 2;
      const radius = size * 0.38;
      const gradient = context.createRadialGradient(center * 0.7, center * 0.65, 2, center, center, radius);
      gradient.addColorStop(0, "#ffd078");
      gradient.addColorStop(0.28, core);
      gradient.addColorStop(1, "#7f2412");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(center, center, radius, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = seam;
      context.lineWidth = Math.max(2, size * 0.055);
      context.beginPath();
      context.arc(center, center, radius, 0, Math.PI * 2);
      context.moveTo(center - radius, center);
      context.lineTo(center + radius, center);
      context.moveTo(center, center - radius);
      context.lineTo(center, center + radius);
      context.moveTo(center - radius * 0.78, center - radius * 0.62);
      context.bezierCurveTo(center - radius * 0.28, center - radius * 0.2, center - radius * 0.28, center + radius * 0.2, center - radius * 0.78, center + radius * 0.62);
      context.moveTo(center + radius * 0.78, center - radius * 0.62);
      context.bezierCurveTo(center + radius * 0.28, center - radius * 0.2, center + radius * 0.28, center + radius * 0.2, center + radius * 0.78, center + radius * 0.62);
      context.stroke();
      this.addCanvasTexture(key, canvas);
    };
    makeBall("basketball", 48, "#ed6a24", "#3d1911");
    makeBall("boss-ball", 64, "#ff304f", "#340812");
  }

  private generateEffects(): void {
    const glow = document.createElement("canvas");
    glow.width = 64;
    glow.height = 64;
    const glowContext = glow.getContext("2d");
    if (!glowContext) throw new Error("Canvas rendering is unavailable.");
    const gradient = glowContext.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.18, "rgba(255,255,255,0.78)");
    gradient.addColorStop(0.55, "rgba(255,255,255,0.16)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    glowContext.fillStyle = gradient;
    glowContext.fillRect(0, 0, 64, 64);
    this.addCanvasTexture("fx-glow", glow);

    const ring = document.createElement("canvas");
    ring.width = 64;
    ring.height = 64;
    const ringContext = ring.getContext("2d");
    if (!ringContext) throw new Error("Canvas rendering is unavailable.");
    ringContext.strokeStyle = "rgba(255,255,255,0.95)";
    ringContext.lineWidth = 4;
    ringContext.shadowColor = "#ffffff";
    ringContext.shadowBlur = 7;
    ringContext.beginPath();
    ringContext.arc(32, 32, 24, 0, Math.PI * 2);
    ringContext.stroke();
    this.addCanvasTexture("fx-ring", ring);

    const spark = document.createElement("canvas");
    spark.width = 32;
    spark.height = 32;
    const sparkContext = spark.getContext("2d");
    if (!sparkContext) throw new Error("Canvas rendering is unavailable.");
    sparkContext.fillStyle = "#ffffff";
    sparkContext.shadowColor = "#ffffff";
    sparkContext.shadowBlur = 6;
    sparkContext.beginPath();
    sparkContext.moveTo(16, 0);
    sparkContext.lineTo(19, 12);
    sparkContext.lineTo(32, 16);
    sparkContext.lineTo(19, 19);
    sparkContext.lineTo(16, 32);
    sparkContext.lineTo(13, 19);
    sparkContext.lineTo(0, 16);
    sparkContext.lineTo(13, 12);
    sparkContext.closePath();
    sparkContext.fill();
    this.addCanvasTexture("fx-spark", spark);
  }
}

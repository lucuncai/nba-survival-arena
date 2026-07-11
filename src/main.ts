import Phaser from "phaser";
import "./styles.css";
import { VIEWPORT } from "./game/config";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import { MenuScene } from "./scenes/MenuScene";
import { ResultsScene } from "./scenes/ResultsScene";
import { GameUi } from "./ui/GameUi";

new GameUi();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: VIEWPORT.width,
  height: VIEWPORT.height,
  backgroundColor: "#080b12",
  antialias: true,
  render: {
    antialias: true,
    antialiasGL: true,
    roundPixels: false,
    powerPreference: "high-performance",
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: VIEWPORT.width,
    height: VIEWPORT.height,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
      fps: 60,
    },
  },
  fps: {
    target: 60,
    min: 30,
    smoothStep: true,
  },
  scene: [BootScene, MenuScene, GameScene, ResultsScene],
};

const game = new Phaser.Game(config);

declare global {
  interface Window {
    streetLegendsGame: Phaser.Game;
  }
}

window.streetLegendsGame = game;

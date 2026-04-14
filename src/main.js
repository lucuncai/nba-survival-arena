/* ================================================================
 *  main.js — Phaser configuration and game launch
 * ================================================================ */

async function launchGame() {
  await preCalculateSpriteDimensions();

  const config = {
    type: Phaser.AUTO,
    width: GW,
    height: GH,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    scene: [BootScene, MenuScene, GameScene],
  };

  window._phaserGame = new Phaser.Game(config);
}

launchGame();

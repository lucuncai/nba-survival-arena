/* ================================================================
 *  BootScene.js — Asset loading and animation registration
 * ================================================================ */

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const bar = document.getElementById('loading-bar');
    const txt = document.getElementById('loading-text');
    this.load.on('progress', v => { bar.style.width = (v * 100) + '%'; });
    this.load.on('filedone', key => { txt.textContent = `Loading: ${key}...`; });

    for (const [key, sd] of Object.entries(SPRITE_DATA)) {
      if (sd.isImage) {
        this.load.image(key, sd.base64);
      } else {
        this.load.spritesheet(key, sd.base64, {
          frameWidth:  sd._fw || Math.floor(768 / (sd.frameCount || 1)),
          frameHeight: sd._fh || 300,
        });
      }
    }
  }

  create() {
    document.getElementById('loading-screen').style.display = 'none';

    const charIds  = ['lebron', 'kobe', 'curry'];
    const enemyIds = ['fan', 'ref', 'rival', 'press', 'boss'];

    for (const id of charIds) {
      this._anim(`${id}_walk`,   `${id}_walk`,   0, 5, 10, -1);
      this._anim(`${id}_idle`,   `${id}_idle`,   0, 3,  6, -1);
      this._anim(`${id}_attack`, `${id}_attack`, 0, 3, 12,  0);
    }
    for (const id of enemyIds) {
      this._anim(`${id}_walk`, `${id}_walk`, 0, 3, 8, -1);
    }

    this.scene.start('Menu');
  }

  /** Safely create an animation only if the texture exists. */
  _anim(key, sheet, start, end, rate, repeat) {
    if (!this.textures.exists(sheet)) return;
    const total = this.textures.get(sheet).frameTotal - 1;
    const safeEnd = Math.min(end, total - 1);
    if (safeEnd < start) return;
    this.anims.create({
      key,
      frames: this.anims.generateFrameNumbers(sheet, { start, end: safeEnd }),
      frameRate: rate,
      repeat,
    });
  }
}

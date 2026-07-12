/* ================================================================
 *  sprites.js — Sprite dimension pre-calculation
 *
 *  Before Phaser boots, we need to know each spritesheet's frame
 *  dimensions.  This function loads each base64 image, reads its
 *  natural size, and stores _fw / _fh on the SPRITE_DATA entry.
 * ================================================================ */

function preCalculateSpriteDimensions() {
  return new Promise(resolve => {
    const entries = Object.entries(SPRITE_DATA).filter(([, sd]) => !sd.isImage && sd.frameCount);
    let remaining = entries.length;
    if (!remaining) { resolve(); return; }

    for (const [, sd] of entries) {
      const img = new Image();
      img.onload = () => {
        sd._fw = Math.floor(img.naturalWidth / sd.frameCount);
        sd._fh = img.naturalHeight;
        if (!--remaining) resolve();
      };
      img.onerror = () => {
        sd._fw = Math.floor(768 / (sd.frameCount || 1));
        sd._fh = 300;
        if (!--remaining) resolve();
      };
      img.src = sd.base64;
    }
  });
}

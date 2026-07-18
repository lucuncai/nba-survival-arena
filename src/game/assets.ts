export interface ImageAsset {
  key: string;
  url: string;
}

export interface AtlasAsset {
  key: string;
  textureUrl: string;
  atlasUrl: string;
}

export interface AudioAsset {
  key: string;
  urls: string[];
}

export interface AssetManifest {
  images: ImageAsset[];
  atlases: AtlasAsset[];
  audio: AudioAsset[];
}

/**
 * Authored assets loaded before the procedural fallbacks in BootScene.
 *
 * Any key listed here supersedes its procedural generator automatically:
 * BootScene only draws a texture when one was not already loaded. URLs are
 * resolved against Vite's `base` so files in `public/assets/` work in dev and
 * on GitHub Pages alike.
 */
function assetUrl(file: string): string {
  return `${import.meta.env.BASE_URL}assets/${file}`;
}

export const ASSET_MANIFEST: AssetManifest = {
  images: [
    { key: "court", url: assetUrl("court.jpg") },
    { key: "hero-king", url: assetUrl("hero-king.png") },
    { key: "enemy-rookie", url: assetUrl("enemy-rookie.png") },
    { key: "enemy-shooter", url: assetUrl("enemy-shooter.png") },
    { key: "enemy-sniper", url: assetUrl("enemy-sniper.png") },
    { key: "enemy-center", url: assetUrl("enemy-center.png") },
    { key: "enemy-boss", url: assetUrl("enemy-boss.png") },
  ],
  atlases: [],
  audio: [],
};

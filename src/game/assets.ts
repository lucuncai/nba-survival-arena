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
 * The pipeline is intentionally empty for now: BootScene still generates every
 * texture procedurally. As real art lands (M4/M5), add entries here and the
 * matching procedural generator becomes a no-op automatically, because BootScene
 * only draws a texture when one was not already loaded from this manifest.
 *
 * URLs are resolved relative to Vite's `base`, so reference files placed in
 * `public/assets/...` as `assets/...`.
 */
export const ASSET_MANIFEST: AssetManifest = {
  images: [],
  atlases: [],
  audio: [],
};

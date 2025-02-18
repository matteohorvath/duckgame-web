import Phaser from 'phaser';

export interface Asset {
  type: 'image' | 'audio';
  key: string;
  url: string;
}

export class AssetLoader {
  constructor(private scene: Phaser.Scene) {}

  loadAssets(assets: Asset[]): void {
    assets.forEach(asset => {
      if (asset.type === 'image') {
        this.scene.load.image(asset.key, asset.url);
      } else if (asset.type === 'audio') {
        this.scene.load.audio(asset.key, asset.url);
      }
    });
  }

  getAsset(key: string): Phaser.Textures.Texture | Phaser.Sound.BaseSound | undefined {
    const texture = this.scene.textures.get(key);
    if (texture.exists) return texture;

    const sound = this.scene.sound.get(key);
    if (sound.exists) return sound;

    return undefined;
  }
}


export interface Asset {
  type: 'image' | 'audio';
  url: string;
}

export class AssetLoader {
  private cache: Map<string, HTMLImageElement | HTMLAudioElement> = new Map();
  private loading: Promise<void>[] = [];

  async loadAssets(assets: Asset[]): Promise<void> {
    this.loading = assets.map(asset => this.loadAsset(asset));
    await Promise.all(this.loading);
  }

  private async loadAsset(asset: Asset): Promise<void> {
    if (asset.type === 'image') {
      const image = new Image();
      image.src = asset.url;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
      this.cache.set(asset.url, image);
    } else if (asset.type === 'audio') {
      const audio = new Audio(asset.url);
      await new Promise((resolve, reject) => {
        audio.oncanplaythrough = resolve;
        audio.onerror = reject;
      });
      this.cache.set(asset.url, audio);
    }
  }

  getAsset(url: string): HTMLImageElement | HTMLAudioElement | undefined {
    return this.cache.get(url);
  }
}

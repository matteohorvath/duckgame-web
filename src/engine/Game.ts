
export interface GameConfig {
  width: number;
  height: number;
  canvas?: HTMLCanvasElement;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number = 0;
  private lastTimestamp: number = 0;
  private readonly targetFPS: number = 60;
  private readonly frameInterval: number = 1000 / 60;

  constructor(config: GameConfig) {
    this.canvas = config.canvas || document.createElement('canvas');
    this.canvas.width = config.width;
    this.canvas.height = config.height;
    
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');
    this.ctx = context;

    this.startGameLoop();
  }

  private startGameLoop(): void {
    const gameLoop = (timestamp: number) => {
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;
      const elapsed = timestamp - this.lastTimestamp;

      if (elapsed >= this.frameInterval) {
        this.update(elapsed);
        this.render();
        this.lastTimestamp = timestamp;
      }

      this.animationFrameId = requestAnimationFrame(gameLoop);
    };

    this.animationFrameId = requestAnimationFrame(gameLoop);
  }

  private update(delta: number): void {
    // Update game state
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // Render game objects
  }

  public destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

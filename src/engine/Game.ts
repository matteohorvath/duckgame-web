export interface GameConfig {
  width: number;
  height: number;
  canvas?: HTMLCanvasElement;
}

interface Player {
  x: number;
  y: number;
  speed: number;
  size: number;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number = 0;
  private lastTimestamp: number = 0;
  private readonly targetFPS: number = 60;
  private readonly frameInterval: number = 1000 / 60;
  private keys: Set<string> = new Set();
  private player: Player;

  constructor(config: GameConfig) {
    this.canvas = config.canvas || document.createElement('canvas');
    this.canvas.width = config.width;
    this.canvas.height = config.height;
    
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');
    this.ctx = context;

    // Initialize player in the center of the screen
    this.player = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      speed: 5,
      size: 30
    };

    // Set up keyboard event listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    this.startGameLoop();
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    this.keys.add(event.key.toLowerCase());
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.key.toLowerCase());
  };

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
    // Handle player movement based on WASD keys
    if (this.keys.has('w')) {
      this.player.y -= this.player.speed;
    }
    if (this.keys.has('s')) {
      this.player.y += this.player.speed;
    }
    if (this.keys.has('a')) {
      this.player.x -= this.player.speed;
    }
    if (this.keys.has('d')) {
      this.player.x += this.player.speed;
    }

    // Keep player within canvas bounds
    this.player.x = Math.max(this.player.size / 2, Math.min(this.canvas.width - this.player.size / 2, this.player.x));
    this.player.y = Math.max(this.player.size / 2, Math.min(this.canvas.height - this.player.size / 2, this.player.y));
  }

  private render(): void {
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw the player (as a blue square)
    this.ctx.fillStyle = '#3b82f6';
    this.ctx.fillRect(
      this.player.x - this.player.size / 2,
      this.player.y - this.player.size / 2,
      this.player.size,
      this.player.size
    );
  }

  public destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    // Clean up event listeners
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}


export interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
  duration: number;
}

export interface Animation {
  frames: Frame[];
  loop?: boolean;
}

export class AnimationSystem {
  private animations: Map<string, Animation> = new Map();
  private currentFrame: number = 0;
  private elapsed: number = 0;
  private playing: boolean = false;

  addAnimation(name: string, animation: Animation): void {
    this.animations.set(name, animation);
  }

  play(name: string): void {
    if (this.animations.has(name)) {
      this.currentFrame = 0;
      this.elapsed = 0;
      this.playing = true;
    }
  }

  update(delta: number): Frame | null {
    if (!this.playing) return null;

    const currentAnimation = Array.from(this.animations.values())[0];
    if (!currentAnimation) return null;

    this.elapsed += delta;
    const frame = currentAnimation.frames[this.currentFrame];
    
    if (this.elapsed >= frame.duration) {
      this.elapsed = 0;
      this.currentFrame++;

      if (this.currentFrame >= currentAnimation.frames.length) {
        if (currentAnimation.loop) {
          this.currentFrame = 0;
        } else {
          this.playing = false;
          return null;
        }
      }
    }

    return currentAnimation.frames[this.currentFrame];
  }
}

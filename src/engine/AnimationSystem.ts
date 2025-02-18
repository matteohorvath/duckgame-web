import Phaser from 'phaser';

export class AnimationSystem {
  constructor(private scene: Phaser.Scene) {}

  createAnimation(key: string, frames: Phaser.Types.Animations.AnimationFrame[], frameRate: number, repeat: number = -1) {
    this.scene.anims.create({
      key,
      frames: frames.map(frame => ({ key: frame.key, frame: frame.frame })),
      frameRate,
      repeat,
    });
  }
}

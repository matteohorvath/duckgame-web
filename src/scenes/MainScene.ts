import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
  private logo!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private speed: number = 200;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Removed image loading as we're using a simple black rectangle
  }

  create() {
    // Add a black rectangle as the logo
    this.logo = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 100, 100, 0x000000);

    // Make the rectangle interactive
    this.logo.setInteractive();
    this.logo.on('pointerdown', () => {
      this.scene.restart();
    });

    // Setup keyboard input
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  update(time: number, delta: number) {
    const dt = delta / 1000; // Convert delta to seconds
    let velocityX = 0;
    let velocityY = 0;

    if (this.cursors.left.isDown) {
      velocityX = -this.speed;
    } else if (this.cursors.right.isDown) {
      velocityX = this.speed;
    }

    if (this.cursors.up.isDown) {
      velocityY = -this.speed;
    } else if (this.cursors.down.isDown) {
      velocityY = this.speed;
    }

    this.logo.x += velocityX * dt;
    this.logo.y += velocityY * dt;

    // Keep the rectangle within the screen bounds
    this.logo.x = Phaser.Math.Clamp(this.logo.x, this.logo.width / 2, this.scale.width - this.logo.width / 2);
    this.logo.y = Phaser.Math.Clamp(this.logo.y, this.logo.height / 2, this.scale.height - this.logo.height / 2);
  }
}

import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
  private logo!: Phaser.GameObjects.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private speed: number = 200;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Load assets here
    this.load.image('logo', 'path/to/logo.png');
  }

  create() {
    // Add game objects here
    this.logo = this.add.image(this.scale.width / 2, this.scale.height / 2, 'logo');

    // Example: Make the logo interactive
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

    // Optional: Keep the logo within the screen bounds
    this.logo.x = Phaser.Math.Clamp(this.logo.x, this.logo.width / 2, this.scale.width - this.logo.width / 2);
    this.logo.y = Phaser.Math.Clamp(this.logo.y, this.logo.height / 2, this.scale.height - this.logo.height / 2);
  }
}

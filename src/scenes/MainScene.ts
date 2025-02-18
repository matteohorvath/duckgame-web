import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
  private logo!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private speed: number = 200;
  private platform!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Removed image loading as we're using a simple black rectangle
  }

  create() {
    // Add a black rectangle as the logo with physics enabled
    this.logo = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 100, 100, 0x000000);
    this.physics.add.existing(this.logo);
    const logoBody = this.logo.body as Phaser.Physics.Arcade.Body;
    logoBody.setCollideWorldBounds(true);
    logoBody.setGravityY(300);

    // Make the rectangle interactive
    this.logo.setInteractive();
    this.logo.on('pointerdown', () => {
      this.scene.restart();
    });

    // Add a blue platform
    this.platform = this.add.rectangle(this.scale.width / 2, this.scale.height - 50, 400, 20, 0x0000ff);
    this.physics.add.existing(this.platform, true); // true makes it static

    // Add collision between logo and platform
    this.physics.add.collider(this.logo, this.platform);

    // Setup keyboard input
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // Add space bar for jump
    this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update(time: number, delta: number) {
    const logoBody = this.logo.body as Phaser.Physics.Arcade.Body;
    let velocityX = 0;

    if (this.cursors.left.isDown) {
      velocityX = -this.speed;
    } else if (this.cursors.right.isDown) {
      velocityX = this.speed;
    }

    logoBody.setVelocityX(velocityX);

    // Jump with space bar
    if (this.jumpKey.isDown && logoBody.body.touching.down) {
      logoBody.setVelocityY(-500);
    }
  }
}

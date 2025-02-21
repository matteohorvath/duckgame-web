import Phaser from "phaser";

export default class MainScene extends Phaser.Scene {
  private logo!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private joystick!: { x: number; y: number } = { x: 0, y: 0 };
  private buttons!: { a: boolean; b: boolean; x: boolean; y: boolean };
  private speed: number = 650;
  private platform!: Phaser.GameObjects.Rectangle;
  private ws!: WebSocket;
  private serverUrl = "ws://192.168.0.82:3001/ws";
  private projectiles!: Phaser.GameObjects.Group;
  private lastShootTime: number = 0;
  private shootDelay: number = 500; // Delay between shots in milliseconds

  constructor() {
    super({ key: "MainScene" });
    this.buttons = { a: false, b: false, x: false, y: false };
    this.joystick = { x: 0, y: 0 };
  }

  preload() {
    this.createWebSocket();
  }

  create() {
    // Add projectiles group
    this.projectiles = this.add.group({
      classType: Phaser.GameObjects.Rectangle,
      maxSize: 10, // Maximum number of projectiles at once
      runChildUpdate: true, // This will call update on each projectile
    });

    // Add a black rectangle as the logo with physics enabled
    this.logo = this.add.circle(
      this.scale.width / 2,
      this.scale.height / 2,
      50,
      0x000000
    );
    this.physics.add.existing(this.logo);
    const logoBody = this.logo.body as Phaser.Physics.Arcade.Body;
    logoBody.setCollideWorldBounds(true);
    logoBody.setGravityY(800);

    // Make the rectangle interactive
    this.logo.setInteractive();
    this.logo.on("pointerdown", () => {
      this.scene.restart();
    });

    // Add a blue platform
    this.platform = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height - 330,
      1000,
      20,
      0x0000ff
    );
    //rotate the platform 90 degrees
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
    this.jumpKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
  }

  shoot() {
    const currentTime = this.time.now;
    if (currentTime - this.lastShootTime < this.shootDelay) {
      return; // Don't shoot if not enough time has passed
    }

    const projectile = this.add.rectangle(
      this.logo.x,
      this.logo.y - 30, // Spawn above the player
      10, // width
      20, // height
      0xff0000 // red color
    ) as Phaser.GameObjects.Rectangle;

    this.physics.add.existing(projectile);
    const projectileBody = projectile.body as Phaser.Physics.Arcade.Body;

    // Set projectile properties
    projectileBody.setVelocityY(-400); // Shoot upward
    projectileBody.setGravityY(0); // No gravity effect
    projectileBody.setCollideWorldBounds(true);
    projectileBody.onWorldBounds = true;

    // Destroy projectile when it hits world bounds
    projectileBody.world.on(
      "worldbounds",
      (body: Phaser.Physics.Arcade.Body) => {
        if (body.gameObject === projectile) {
          projectile.destroy();
        }
      }
    );

    // Add to group
    this.projectiles.add(projectile);

    // Update last shoot time
    this.lastShootTime = currentTime;
  }

  update(time: number, delta: number) {
    //this.getGameStateFromServer();
    const logoBody = this.logo.body as Phaser.Physics.Arcade.Body;
    if ((this.cursors as any).left.isDown) {
      logoBody.setVelocityX(-this.speed);
    } else if ((this.cursors as any).right.isDown) {
      logoBody.setVelocityX(this.speed);
    } else {
      logoBody.setVelocityX(0);
    }

    // Handle horizontal movement with joystick
    if (this.joystick) {
      // and the wasd is not used

      logoBody.setVelocityX(this.joystick.x * this.speed);
    }

    // Handle jumping with space bar when touching ground or the borders
    if (logoBody.touching.down && this.buttons.a) {
      logoBody.setVelocityY(-this.speed * 0.75);
    }

    // Handle shooting
    if (this.buttons.x) {
      this.shoot();
    }

    // Clean up projectiles that are off screen
    this.projectiles.children.each(
      (projectile: Phaser.GameObjects.Rectangle) => {
        if (projectile.y < 0) {
          projectile.destroy();
        }
      }
    );
  }
  createWebSocket() {
    const ws = new WebSocket(this.serverUrl);
    this.ws = ws;
    ws.onmessage = (event) => {
      //console.log("Received message:", JSON.parse(event.data).data.joystick);
      this.joystick = JSON.parse(event.data).data.joystick;
      this.buttons = JSON.parse(event.data).data.buttons;
      //console.log("Joystick:", this.joystick);
      this.serverVelocity = JSON.parse(event.data).data.velocity;
      //console.log("size of data package", event.data.length);
    };
  }
}

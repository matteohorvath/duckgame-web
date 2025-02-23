import Phaser from "phaser";

export default class MainScene extends Phaser.Scene {
  private logo!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private joystick!: { x: number; y: number } = { x: 0, y: 0 };
  private buttons!: { a: boolean; b: boolean; x: boolean; y: boolean };
  private speed: number = 650;
  private platform!: Phaser.GameObjects.Rectangle;
  private ws!: WebSocket;
  private serverUrl = "ws://192.168.0.128:3001/ws";
  private projectiles!: Phaser.GameObjects.Group;
  private lastShootTime: number = 0;
  private shootDelay: number = 220; // Delay between shots in milliseconds
  private directionArrow!: Phaser.GameObjects.Triangle;
  private facingRight: boolean = true;
  private projectileSpeed: number = 1800;
  private debugText!: Phaser.GameObjects.Text;
  private restartButton!: Phaser.GameObjects.Text;
  private playerId!: string;
  private otherPlayers: { [id: string]: Phaser.GameObjects.Arc } = {};

  constructor() {
    super({ key: "MainScene" });
    this.playerId = Phaser.Utils.String.UUID();
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

    // Add direction arrow (modified to be more arrow-like)
    this.directionArrow = this.add.triangle(
      this.logo.x,
      this.logo.y - 80, // Position above the ball
      0,
      0, // First point
      20,
      -10, // Second point
      20,
      10, // Third point
      0xff0000 // Red color
    );
    this.directionArrow.setOrigin(0, 0.5);

    // Add debug panel
    this.debugText = this.add.text(10, 10, "Debug Info", {
      fontSize: "16px",
      color: "#000",
      backgroundColor: "#ffffff88",
      padding: { x: 10, y: 10 },
    });
    this.debugText.setDepth(1);
    this.debugText.setScrollFactor(0);

    // Add restart button
    this.restartButton = this.add.text(this.scale.width - 100, 10, "Restart", {
      fontSize: "20px",
      color: "#fff",
      backgroundColor: "#000",
      padding: { x: 10, y: 5 },
    });
    this.restartButton.setInteractive({ useHandCursor: true });
    this.restartButton.on("pointerdown", () => this.scene.restart());
    this.restartButton.setDepth(1);
    this.restartButton.setScrollFactor(0);
  }

  shoot() {
    const currentTime = this.time.now;
    if (currentTime - this.lastShootTime < this.shootDelay) {
      return; // Don't shoot if not enough time has passed
    }

    const projectile = this.add.rectangle(
      this.logo.x + (this.facingRight ? 60 : -60), // Spawn on the right or left side
      this.logo.y, // Spawn at player's height
      20, // width
      10, // height
      0xff0000 // red color
    ) as Phaser.GameObjects.Rectangle;

    this.physics.add.existing(projectile);
    const projectileBody = projectile.body as Phaser.Physics.Arcade.Body;

    // Set projectile properties
    projectileBody.setVelocityX(
      this.facingRight ? this.projectileSpeed : -this.projectileSpeed
    ); // Shoot left or right
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

    // Update movement logic
    if ((this.cursors as any).left.isDown) {
      logoBody.setVelocityX(-this.speed);
      this.facingRight = false;
    } else if ((this.cursors as any).right.isDown) {
      logoBody.setVelocityX(this.speed);
      this.facingRight = true;
    } else {
      logoBody.setVelocityX(0);
    }

    // Handle horizontal movement with joystick
    if (this.joystick) {
      logoBody.setVelocityX(this.joystick.x * this.speed);
      if (this.joystick.x !== 0) {
        this.facingRight = this.joystick.x > 0;
      }
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
        if (projectile.x < 0 || projectile.x > this.scale.width) {
          // Check horizontal bounds
          projectile.destroy();
        }
      }
    );

    // Update arrow position and rotation
    this.directionArrow.setPosition(
      this.logo.x, // Center horizontally with the ball
      this.logo.y // Fixed distance above the ball
    );
    this.directionArrow.setRotation(this.facingRight ? Math.PI : 0);

    // Update debug text
    this.debugText.setText(
      `FPS: ${(1000 / delta).toFixed(1)}\n` +
        `Position: (${Math.round(this.logo.x)}, ${Math.round(this.logo.y)})\n` +
        `Velocity: (${Math.round(
          (this.logo.body as Phaser.Physics.Arcade.Body).velocity.x
        )}, ` +
        `${Math.round(
          (this.logo.body as Phaser.Physics.Arcade.Body).velocity.y
        )})\n` +
        `Joystick: (${this.joystick.x.toFixed(2)}, ${this.joystick.y.toFixed(
          2
        )})\n` +
        `Buttons: A:${this.buttons.a ? "1" : "0"} B:${
          this.buttons.b ? "1" : "0"
        } ` +
        `X:${this.buttons.x ? "1" : "0"} Y:${this.buttons.y ? "1" : "0"}\n` +
        `Facing: ${this.facingRight ? "Right" : "Left"}`
    );
  }
  createWebSocket() {
    const ws = new WebSocket(this.serverUrl);
    this.ws = ws;
    ws.onopen = () => {
      // Send an initial registration message including our playerId
      ws.send(
        JSON.stringify({ type: "register", data: { id: this.playerId } })
      );
    };
    ws.onmessage = (event) => {
      const playersData = JSON.parse(event.data).data;

      // Update our local player's state (if present)
      if (playersData[this.playerId]) {
        const localData = playersData[this.playerId];
        this.joystick = localData.joystick;
        this.buttons = localData.buttons;
      }

      // Update remote players display
      for (const id in playersData) {
        if (id === this.playerId) continue;
        if (!this.otherPlayers[id]) {
          // Create a new remote player representation (a circle with a fixed offset for demo purposes)
          const remotePlayer = this.add.circle(
            100 + Object.keys(this.otherPlayers).length * 100,
            100,
            30,
            0x00ff00
          );
          this.otherPlayers[id] = remotePlayer;
        }
        const state = playersData[id];
        // For demo: change color based on button A state (red if pressed, green otherwise)
        this.otherPlayers[id].setFillStyle(
          state.buttons.a ? 0xff0000 : 0x00ff00
        );
      }

      // Remove remote players that are no longer in the broadcast
      for (const id in this.otherPlayers) {
        if (!(id in playersData)) {
          this.otherPlayers[id].destroy();
          delete this.otherPlayers[id];
        }
      }
    };
  }
}

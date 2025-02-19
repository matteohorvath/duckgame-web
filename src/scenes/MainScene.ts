import Phaser from "phaser";

export default class MainScene extends Phaser.Scene {
  private logo!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private joystick!: { x: number; y: number } = { x: 0, y: 0 };
  private serverVelocity!: { x: number; y: number } = { x: 0, y: 0 };
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private speed: number = 200;
  private platform!: Phaser.GameObjects.Rectangle;
  private ws!: WebSocket;
  private serverUrl = "ws://172.20.10.2:3001/";
  constructor() {
    super({ key: "MainScene" });
  }

  preload() {
    this.createWebSocket();
  }

  create() {
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
    logoBody.setGravityY(400);

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

  update(time: number, delta: number) {
    //this.getGameStateFromServer();
    const logoBody = this.logo.body as Phaser.Physics.Arcade.Body;
    if ((this.cursors as any).left.isDown) {
      logoBody.setVelocityX(-200);
    } else if ((this.cursors as any).right.isDown) {
      logoBody.setVelocityX(200);
    } else {
      logoBody.setVelocityX(0);
    }

    // Handle horizontal movement with joystick
    if (this.joystick) {
      // and the wasd is not used

      logoBody.setVelocityX(this.joystick.x * 200);
    }

    // Handle jumping with space bar when touching ground or the borders
    if (logoBody.touching.down && this.jumpKey.isDown) {
      logoBody.setVelocityY(-200);
    }
  }
  createWebSocket() {
    const ws = new WebSocket(this.serverUrl);
    this.ws = ws;
    ws.onmessage = (event) => {
      //console.log("Received message:", JSON.parse(event.data).data.joystick);
      this.joystick = JSON.parse(event.data).data.joystick;
      console.log("Joystick:", this.joystick);
      this.serverVelocity = JSON.parse(event.data).data.velocity;
      console.log("size of data package", event.data.length);
    };
  }
}

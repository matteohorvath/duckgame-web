import Phaser from "phaser";

interface PlayerState {
  joystick: {
    x: number;
    y: number;
  };
  buttons: {
    a: boolean;
    b: boolean;
    x: boolean;
    y: boolean;
  };
}

interface GameState {
  [playerId: string]: PlayerState;
}

interface Player {
  circle: Phaser.GameObjects.Arc;
  arrow: Phaser.GameObjects.Triangle;
  facingRight: boolean;
}

export default class MainScene extends Phaser.Scene {
  private players: { [id: string]: Player } = {};
  private ws!: WebSocket;
  private serverUrl = "ws://192.168.0.128:3001";
  private playerId!: string;
  private speed: number = 650;
  private debugText!: Phaser.GameObjects.Text;
  private platform!: Phaser.GameObjects.Rectangle;
  private projectiles!: Phaser.GameObjects.Group;

  constructor() {
    super({ key: "MainScene" });
    this.playerId = Phaser.Utils.String.UUID();
  }

  preload() {
    this.createWebSocket();
  }

  create() {
    // Add projectiles group
    this.projectiles = this.add.group({
      classType: Phaser.GameObjects.Rectangle,
      maxSize: 10,
      runChildUpdate: true,
    });

    // Add a blue platform
    this.platform = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height - 330,
      1000,
      20,
      0x0000ff
    );
    this.physics.add.existing(this.platform, true);

    // Add debug text
    this.debugText = this.add.text(10, 10, "Debug Info", {
      fontSize: "16px",
      color: "#000",
      backgroundColor: "#ffffff88",
      padding: { x: 10, y: 10 },
    });
    this.debugText.setDepth(1);
    this.debugText.setScrollFactor(0);
  }

  createPlayer(id: string, isLocal: boolean = false): Player {
    // Create the main circle for the player
    const circle = this.add.circle(
      this.scale.width / 2,
      this.scale.height / 2,
      30,
      isLocal ? 0x000000 : 0x00ff00
    );

    // Enable physics
    this.physics.add.existing(circle);
    const circleBody = circle.body as Phaser.Physics.Arcade.Body;
    circleBody.setCollideWorldBounds(true);
    circleBody.setGravityY(800);

    // Add collision with platform
    this.physics.add.collider(circle, this.platform);

    // Create direction arrow
    const arrow = this.add.triangle(
      circle.x,
      circle.y - 50,
      0,
      0,
      20,
      -10,
      20,
      10,
      0xff0000
    );
    arrow.setOrigin(0, 0.5);

    return {
      circle,
      arrow,
      facingRight: true,
    };
  }

  removePlayer(id: string) {
    if (this.players[id]) {
      this.players[id].circle.destroy();
      this.players[id].arrow.destroy();
      delete this.players[id];
    }
  }

  update() {
    // Update each player's position and state
    for (const [id, player] of Object.entries(this.players)) {
      const circleBody = player.circle.body as Phaser.Physics.Arcade.Body;

      // Update arrow position and rotation
      player.arrow.setPosition(player.circle.x, player.circle.y - 50);
      player.arrow.setRotation(player.facingRight ? Math.PI : 0);
    }

    // Update debug text with player count
    this.debugText.setText(
      `Connected Players: ${Object.keys(this.players).length}\n` +
        `Local Player ID: ${this.playerId}\n` +
        `FPS: ${this.game.loop.actualFps.toFixed(1)}`
    );
  }

  createWebSocket() {
    const ws = new WebSocket(this.serverUrl);
    this.ws = ws;

    ws.onopen = () => {
      console.log("Connected to game server");
      // Register as a viewer (game client)
      ws.send(
        JSON.stringify({
          type: "register",
          data: {
            role: "viewer",
          },
        })
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "state") {
        const playersData = message.data as GameState;

        // Handle player updates/creation
        for (const [id, state] of Object.entries(playersData)) {
          if (!this.players[id]) {
            // Create new player
            this.players[id] = this.createPlayer(id, id === this.playerId);
          }

          // Update player state
          const player = this.players[id];
          const circleBody = player.circle.body as Phaser.Physics.Arcade.Body;

          // Update horizontal movement
          circleBody.setVelocityX(state.joystick.x * this.speed);
          if (state.joystick.x !== 0) {
            player.facingRight = state.joystick.x > 0;
          }

          // Handle jumping
          if (circleBody.touching.down && state.buttons.a) {
            circleBody.setVelocityY(-this.speed * 0.75);
          }

          // Update color based on jump button
          player.circle.setFillStyle(
            state.buttons.a
              ? 0xff0000
              : id === this.playerId
              ? 0x000000
              : 0x00ff00
          );
        }

        // Remove disconnected players
        for (const id of Object.keys(this.players)) {
          if (!playersData[id]) {
            this.removePlayer(id);
          }
        }
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from game server");
      // Remove all players
      for (const id of Object.keys(this.players)) {
        this.removePlayer(id);
      }
      // Try to reconnect in 5 seconds
      setTimeout(() => this.createWebSocket(), 5000);
    };
  }
}

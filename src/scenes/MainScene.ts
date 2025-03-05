import Phaser from "phaser";
import { MapLoader } from "../maps/MapLoader";
import { GameMap, Platform, Obstacle } from "../maps/types";

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
  private serverUrl = "ws://192.168.0.82:3001";
  private playerId!: string;
  private speed: number = 650;
  private debugText!: Phaser.GameObjects.Text;
  private platforms!: Phaser.GameObjects.Group;
  private obstacles!: Phaser.GameObjects.Group;
  private projectiles!: Phaser.GameObjects.Group;
  private currentMap!: GameMap;
  private mapLoader: MapLoader;
  private mapKeys!: Phaser.Input.Keyboard.Key[];

  constructor() {
    super({ key: "MainScene" });
    this.playerId = Phaser.Utils.String.UUID();
    this.mapLoader = new MapLoader();
  }

  preload() {
    this.createWebSocket();
  }

  create() {
    // Load the map
    this.currentMap = this.mapLoader.getMap("map1")!;

    // Set world bounds based on map size
    this.physics.world.setBounds(
      0,
      0,
      this.currentMap.width,
      this.currentMap.height
    );

    // Set background color
    this.cameras.main.setBackgroundColor(this.currentMap.backgroundColor);

    // Create groups for map elements
    this.platforms = this.add.group();
    this.obstacles = this.add.group();

    // Add projectiles group
    this.projectiles = this.add.group({
      classType: Phaser.GameObjects.Rectangle,
      maxSize: 10,
      runChildUpdate: true,
    });

    // Create map elements
    this.createMapElements();

    // Add debug text
    this.debugText = this.add.text(10, 10, "Debug Info", {
      fontSize: "16px",
      color: "#000",
      backgroundColor: "#ffffff88",
      padding: { x: 10, y: 10 },
    });
    this.debugText.setDepth(1);
    this.debugText.setScrollFactor(0);

    // Set up camera to follow the local player when created
    this.cameras.main.setBounds(
      0,
      0,
      this.currentMap.width,
      this.currentMap.height
    );

    // Set up keyboard controls for map switching
    this.setupMapControls();
  }

  createMapElements() {
    // Create platforms
    this.currentMap.platforms.forEach((platformData) => {
      const platform = this.add.rectangle(
        platformData.x,
        platformData.y,
        platformData.width,
        platformData.height,
        parseInt(platformData.color)
      );
      this.physics.add.existing(platform, true);
      this.platforms.add(platform);
    });

    // Create obstacles
    this.currentMap.obstacles.forEach((obstacleData) => {
      const obstacle = this.add.rectangle(
        obstacleData.x,
        obstacleData.y,
        obstacleData.width,
        obstacleData.height,
        parseInt(obstacleData.color)
      );
      this.physics.add.existing(obstacle, true);
      this.obstacles.add(obstacle);
    });
  }

  createPlayer(id: string, isLocal: boolean = false): Player {
    // Get a random spawn point from the map
    const spawnPoints = this.currentMap.spawnPoints;
    const spawnPoint =
      spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

    // Create the main circle for the player
    const circle = this.add.circle(
      spawnPoint.x,
      spawnPoint.y,
      30,
      isLocal ? 0x000000 : 0x00ff00
    );

    // Enable physics
    this.physics.add.existing(circle);
    const circleBody = circle.body as Phaser.Physics.Arcade.Body;
    circleBody.setCollideWorldBounds(true);
    circleBody.setGravityY(800);

    // Add collision with platforms and obstacles
    this.physics.add.collider(circle, this.platforms);
    this.physics.add.collider(circle, this.obstacles);

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

    // Set camera to follow local player
    if (isLocal) {
      this.cameras.main.startFollow(circle);
    }

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

    // Update debug text with player count and map info
    this.debugText.setText(
      `Map: ${this.currentMap.name}\n` +
        `Connected Players: ${Object.keys(this.players).length}\n` +
        `Local Player ID: ${this.playerId}\n` +
        `FPS: ${this.game.loop.actualFps.toFixed(1)}\n` +
        `Press 1-2 to switch maps`
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

  setupMapControls() {
    // Set up number keys 1-9 for map switching
    this.mapKeys = [];
    for (let i = 0; i < 9; i++) {
      const key = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.ONE + i
      );
      key.on("down", () => {
        const mapId = `map${i + 1}`;
        this.loadMap(mapId);
      });
      this.mapKeys.push(key);
    }
  }

  loadMap(mapId: string) {
    const map = this.mapLoader.getMap(mapId);
    if (!map) {
      console.warn(`Map ${mapId} not found`);
      return;
    }

    // Clear existing map elements
    this.platforms.clear(true, true);
    this.obstacles.clear(true, true);

    // Set the new map
    this.currentMap = map;

    // Update world bounds
    this.physics.world.setBounds(
      0,
      0,
      this.currentMap.width,
      this.currentMap.height
    );

    // Update camera bounds
    this.cameras.main.setBounds(
      0,
      0,
      this.currentMap.width,
      this.currentMap.height
    );

    // Set background color
    this.cameras.main.setBackgroundColor(this.currentMap.backgroundColor);

    // Create new map elements
    this.createMapElements();

    // Respawn all players at new spawn points
    this.respawnPlayers();

    console.log(`Loaded map: ${this.currentMap.name}`);
  }

  respawnPlayers() {
    // Respawn all players at random spawn points
    for (const [id, player] of Object.entries(this.players)) {
      const spawnPoints = this.currentMap.spawnPoints;
      const spawnPoint =
        spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

      // Update player position
      player.circle.setPosition(spawnPoint.x, spawnPoint.y);

      // Reset velocity
      const circleBody = player.circle.body as Phaser.Physics.Arcade.Body;
      circleBody.setVelocity(0, 0);
    }
  }
}

# DuckGame Web

Join the Telegram channel if you have any questions.
[https://t.me/+7B-EH8pOfeVmM2Zk](https://t.me/+7B-EH8pOfeVmM2Zk)

A real-time multiplayer game built with Phaser 3, React, and Rust WebSocket server. The game features mobile-friendly controls with haptic feedback and a responsive game environment.

## Features

- Real-time WebSocket communication
- Mobile-optimized controls with Xbox-style button layout
- Haptic feedback for mobile devices
- Physics-based gameplay
- Shooting mechanics
- Demo page for connection testing

## Tech Stack

### Frontend

- React
- TypeScript
- Phaser 3 Game Engine
- TailwindCSS
- React Router

### Backend

- Rust
- Tokio (async runtime)
- WebSocket server
- Serde for JSON serialization

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Bun
- Rust (latest stable)
- Cargo

### Installation

1. Clone the repository:

```bash
git clone https://github.com/matteohorvath/duckgame-web
cd duckgame-web
```

2. Install frontend dependencies:

```bash
bun install
```

3. Build the Rust server:

```bash
cd server
cargo build --release
```

### Running the Project

1. Start the Rust WebSocket server:

```bash
cd server
cargo run
```

2. Start the frontend development server:

```bash
bun run dev
```

## Game Controls

### Mobile Controls

- Left side: Touch joystick for movement
- Right side: Xbox-style button layout
  - A (Green): Jump
  - X (Blue): Shoot
  - B (Red): Action
  - Y (Yellow): Action

### Keyboard Controls (Desktop)

- WASD: Movement
- Space: Jump

## Project Structure

```
├── src/
│   ├── pages/
│   │   ├── Controls.tsx    # Mobile controls interface
│   │   ├── Demo.tsx       # Connection testing page
│   │   └── Index.tsx      # Main game page
│   ├── scenes/
│   │   └── MainScene.ts   # Phaser game scene
│   └── App.tsx            # React application root
├── server/
│   ├── src/
│   │   ├── main.rs        # Server entry point
│   │   ├── game_state.rs  # Game state management
│   │   └── websocket.rs   # WebSocket handling
│   └── Cargo.toml         # Rust dependencies
└── README.md
```

## Development

### Available Scripts

- `bun run dev`: Start the development server
- `bun run build`: Build the production version
- `bun run lint`: Run ESLint
- `bun run test`: Run tests

### Server Commands

- `cargo run`: Run the WebSocket server
- `cargo test`: Run server tests
- `cargo build --release`: Build production server

## Network Protocol

The game uses a custom WebSocket protocol for real-time communication:

### Client -> Server Messages

```typescript
{
  type: "action",
  data: {
    joystick: { x: number, y: number },
    buttons: { a: boolean, b: boolean, x: boolean, y: boolean }
  }
}
```

### Server -> Client Messages

```typescript
{
  type: "state",
  data: {
    joystick: { x: number, y: number },
    buttons: { a: boolean, b: boolean, x: boolean, y: boolean }
  }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. Have fun!

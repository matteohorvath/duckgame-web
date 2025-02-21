const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);

// Disable per-message deflate to reduce processing overhead.
const wss = new WebSocket.Server({ server, perMessageDeflate: false });

// Global game state stored on the server.
// Controls and MainScene can update/query this state.
let gameState = {
  joystick: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
};

// Throttled broadcasting: schedule to send state updates
// at most every BROADCAST_INTERVAL ms (~60 FPS).
let broadcastTimeout = null;
const BROADCAST_INTERVAL = 16; // milliseconds

function broadcastState() {
  broadcastTimeout = null;
  const stateMessage = JSON.stringify({ type: "state", data: gameState });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(stateMessage);
    }
  });
}

// Heartbeat function: mark the connection as alive.
function heartbeat() {
  this.isAlive = true;
}

wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", heartbeat);

  console.log("Client connected.");
  // Send initial game state to the new client.
  ws.send(JSON.stringify({ type: "state", data: gameState }));

  ws.on("message", (message) => {
    let msgObj;
    try {
      msgObj = JSON.parse(message);
    } catch (err) {
      console.error("Error parsing message:", err);
      return;
    }

    if (msgObj.type === "action") {
      // Expect payload to contain updates, e.g. { joystick: { x, y }, shoot: true, movement: {...} }
      const payload = msgObj.data || {};

      if (payload.joystick) {
        gameState.joystick = payload.joystick;
        gameState.velocity.x = payload.joystick.x * 200;
      }

      // Schedule a throttled broadcast if one isn't already pending.
      if (!broadcastTimeout) {
        broadcastTimeout = setTimeout(broadcastState, BROADCAST_INTERVAL);
      }
    } else if (msgObj.type === "readstate") {
      // Client requests the current game state.
      ws.send(JSON.stringify({ type: "state", data: gameState }));
      console.log("Sent game state to client");
    } else {
      console.warn("Unknown message type:", msgObj.type);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected.");
  });
});

// Regular heartbeat check every 30 seconds.
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping(() => {});
  });
}, 30000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server listening on port ${PORT}`);
});

import React, { useEffect, useState } from "react";

interface GameState {
  joystick: {
    x: number;
    y: number;
  };
}

const Demo = () => {
  const [serverStatus, setServerStatus] = useState<
    "connected" | "disconnected"
  >("disconnected");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const serverUrl = "ws://192.168.0.82:3001";

  useEffect(() => {
    const socket = new WebSocket(serverUrl);

    socket.onopen = () => {
      setServerStatus("connected");
      console.log("Connected to server");
    };

    socket.onclose = () => {
      setServerStatus("disconnected");
      console.log("Disconnected from server");
      // Try to reconnect in 5 seconds
      setTimeout(() => {
        setWs(new WebSocket(serverUrl));
      }, 5000);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "state") {
          setGameState(data.data);
        }
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  //every second send a readstate message

  const requestGameState = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "readstate" }));
    }
  };

  // Request state every second
  useEffect(() => {
    const interval = setInterval(requestGameState, 1000);
    return () => clearInterval(interval);
  }, [ws]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Game Server Demo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Server Status</h2>
          <p className="mb-2">
            Status:{" "}
            <span
              className={`font-medium ${
                serverStatus === "connected" ? "text-green-600" : "text-red-600"
              }`}
            >
              {serverStatus}
            </span>
          </p>

          <h3 className="text-lg font-semibold mt-4 mb-2">
            Current Game State:
          </h3>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
            {gameState ? JSON.stringify(gameState, null, 2) : "Loading..."}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Connection Info</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-1">Server URL:</p>
              <code className="bg-gray-100 px-2 py-1 rounded">{serverUrl}</code>
            </div>

            <div>
              <p className="font-medium mb-1">Controls URL:</p>
              <code className="bg-gray-100 px-2 py-1 rounded">
                {window.location.origin}/controls
              </code>
            </div>

            <div>
              <p className="font-medium mb-1">Game URL:</p>
              <code className="bg-gray-100 px-2 py-1 rounded">
                {window.location.origin}/
              </code>
            </div>

            <button
              onClick={requestGameState}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Request Current State
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Joystick Position: </span>
            x: {gameState?.joystick.x.toFixed(2)}, y:{" "}
            {gameState?.joystick.y.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Demo;

//create a page that shows the controls of the game for a mobile phone, one wasd which is a movement joystick and a Shoot button.

import React, { useRef, useState, useEffect } from "react";

// This radius determines how far the joystick stick can move
const JOYSTICK_RADIUS = 50;
const STICK_RADIUS = 20;
const BUTTON_SIZE = 60;

interface GameState {
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

const Controls = () => {
  // Store the joystick stick's position relative to the center,
  // the shoot counter, websocket connection, and the WebRTC connection URL.
  const [stickPosition, setStickPosition] = useState({ x: 0, y: 0 });
  const [buttons, setButtons] = useState({
    a: false,
    b: false,
    x: false,
    y: false,
  });
  const touchMoveCounter = useRef(0);

  // Add state for joystick base position
  const [joystickBasePosition, setJoystickBasePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const leftPanelRef = useRef<HTMLDivElement>(null);

  // Create a signaling WebSocket connection using a user-specified URL.
  const [signalingSocket, setSignalingSocket] = useState<WebSocket | null>(
    null
  );
  const [serverURL, setServerURL] = useState("ws://192.168.0.85:3001/ws");
  const [isPlayer, setIsPlayer] = useState(false);

  useEffect(() => {
    if (!serverURL) return;
    const sock = new WebSocket(serverURL);
    sock.onopen = () => {
      // Send role when connecting
      sock.send(
        JSON.stringify({
          type: "register",
          data: {
            role: "player", // This component is always a player (controls)
          },
        })
      );
      setIsPlayer(true);
      console.log("Connected to server as player");
    };

    sock.onclose = () => {
      console.log("Disconnected from server");
      // Try to reconnect in 5 seconds
      setTimeout(() => {
        setSignalingSocket(new WebSocket(serverURL));
      }, 5000);
    };

    setSignalingSocket(sock);
    return () => {
      sock.close();
    };
  }, [serverURL]);

  // Called when the user touches the joystick area
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!leftPanelRef.current) return;

    const touch = e.touches[0];
    const rect = leftPanelRef.current.getBoundingClientRect();

    // Set the joystick base position to the touch point
    setJoystickBasePosition({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
    setStickPosition({ x: 0, y: 0 }); // Reset stick position
  };

  // Called when the user moves their finger
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!leftPanelRef.current || !joystickBasePosition) return;

    const touch = e.touches[0];
    const rect = leftPanelRef.current.getBoundingClientRect();

    // Calculate distance from base position
    const x = touch.clientX - rect.left - joystickBasePosition.x;
    const y = touch.clientY - rect.top - joystickBasePosition.y;

    const distance = Math.sqrt(x * x + y * y);
    const angle = Math.atan2(y, x);

    const limitedDistance = Math.min(distance, JOYSTICK_RADIUS);
    const newX = Math.cos(angle) * limitedDistance;
    const newY = Math.sin(angle) * limitedDistance;

    setStickPosition({ x: newX, y: newY });

    // Normalize and send to server
    const normalizedX = newX / JOYSTICK_RADIUS;
    const normalizedY = newY / JOYSTICK_RADIUS;

    if (signalingSocket?.readyState === WebSocket.OPEN) {
      signalingSocket.send(
        JSON.stringify({
          type: "action",
          data: {
            joystick: { x: normalizedX, y: normalizedY },
            buttons: buttons,
          },
        })
      );
    }
  };

  // Reset when touch ends
  const handleTouchEnd = () => {
    setStickPosition({ x: 0, y: 0 });
    setJoystickBasePosition(null);
    if (signalingSocket?.readyState === WebSocket.OPEN) {
      signalingSocket.send(
        JSON.stringify({
          type: "action",
          data: {
            joystick: { x: 0, y: 0 },
            buttons: buttons,
          },
        })
      );
    }
  };

  const handleButtonPress = (button: keyof typeof buttons) => {
    setButtons((prev) => {
      const newButtons = { ...prev, [button]: true };
      if (signalingSocket?.readyState === WebSocket.OPEN) {
        signalingSocket.send(
          JSON.stringify({
            type: "action",
            data: {
              joystick: {
                x: stickPosition.x / JOYSTICK_RADIUS,
                y: stickPosition.y / JOYSTICK_RADIUS,
              },
              buttons: newButtons,
            },
          })
        );
      }
      return newButtons;
    });
  };

  const handleButtonRelease = (button: keyof typeof buttons) => {
    setButtons((prev) => {
      const newButtons = { ...prev, [button]: false };
      if (signalingSocket?.readyState === WebSocket.OPEN) {
        signalingSocket.send(
          JSON.stringify({
            type: "action",
            data: {
              joystick: {
                x: stickPosition.x / JOYSTICK_RADIUS,
                y: stickPosition.y / JOYSTICK_RADIUS,
              },
              buttons: newButtons,
            },
          })
        );
      }
      return newButtons;
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        padding: 20,
        zIndex: 9999,
        background: "#f9f9f9",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Add status indicator */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          padding: "4px 8px",
          borderRadius: 4,
          background: isPlayer ? "#4caf50" : "#f44336",
          color: "white",
          fontSize: 12,
        }}
      >
        {isPlayer ? "Player Controls" : "Viewer Only"}
      </div>

      {/* Left side - Joystick area */}
      <div
        ref={leftPanelRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          flex: 2,
          height: "100%",
          position: "relative",
          touchAction: "none",
          userSelect: "none",
          background: "rgba(0, 0, 0, 0.05)", // Subtle visual feedback
        }}
      >
        {joystickBasePosition && (
          <div
            style={{
              position: "absolute",
              left: joystickBasePosition.x - JOYSTICK_RADIUS,
              top: joystickBasePosition.y - JOYSTICK_RADIUS,
              width: JOYSTICK_RADIUS * 2,
              height: JOYSTICK_RADIUS * 2,
              background: "#ddd",
              borderRadius: "50%",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: JOYSTICK_RADIUS - STICK_RADIUS + stickPosition.x,
                top: JOYSTICK_RADIUS - STICK_RADIUS + stickPosition.y,
                width: STICK_RADIUS * 2,
                height: STICK_RADIUS * 2,
                background: "#888",
                borderRadius: "50%",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            />
          </div>
        )}
      </div>

      {/* Right side - Xbox buttons */}
      <div
        style={{
          flex: 3,
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "20px",
          padding: "30px",
          maxWidth: "200px",
          rotate: "45deg",
          justifySelf: "flex-end",
          marginRight: "50px",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
        }}
      >
        <button
          onTouchStart={() => handleButtonPress("y")}
          onTouchEnd={() => handleButtonRelease("y")}
          style={{
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            background: buttons.y ? "#ffeb3b" : "#ffd600",
            border: "none",
            borderRadius: "50%",
            fontSize: "24px",
            color: "#333",
            rotate: "-45deg",
            fontWeight: "bold",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
            touchAction: "manipulation",
            cursor: "pointer",
          }}
        >
          Y
        </button>
        <button
          onTouchStart={() => handleButtonPress("b")}
          onTouchEnd={() => handleButtonRelease("b")}
          style={{
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            background: buttons.b ? "#f44336" : "#d32f2f",
            border: "none",
            borderRadius: "50%",
            fontSize: "24px",
            color: "white",
            rotate: "-45deg",
            fontWeight: "bold",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
            touchAction: "manipulation",
            cursor: "pointer",
          }}
        >
          B
        </button>
        <button
          onTouchStart={() => handleButtonPress("x")}
          onTouchEnd={() => handleButtonRelease("x")}
          style={{
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            background: buttons.x ? "#2196f3" : "#1976d2",
            border: "none",
            borderRadius: "50%",
            fontSize: "24px",
            color: "white",
            rotate: "-45deg",
            fontWeight: "bold",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
            touchAction: "manipulation",
            cursor: "pointer",
          }}
        >
          X
        </button>
        <button
          onTouchStart={() => handleButtonPress("a")}
          onTouchEnd={() => handleButtonRelease("a")}
          style={{
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            background: buttons.a ? "#4caf50" : "#388e3c",
            border: "none",
            borderRadius: "50%",
            fontSize: "24px",
            color: "white",
            rotate: "-45deg",
            fontWeight: "bold",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
            touchAction: "manipulation",
            cursor: "pointer",
          }}
        >
          A
        </button>
      </div>
    </div>
  );
};

export default Controls;

//create a page that shows the controls of the game for a mobile phone, one wasd which is a movement joystick and a Shoot button.

import React, { useRef, useState, useEffect } from "react";

// This radius determines how far the joystick stick can move
const JOYSTICK_RADIUS = 50;
const STICK_RADIUS = 20;

const Controls = () => {
  // Store the joystick stick's position relative to the center,
  // the shoot counter, websocket connection, and the WebRTC connection URL.
  const [stickPosition, setStickPosition] = useState({ x: 0, y: 0 });
  const [shootCounter, setShootCounter] = useState(0);

  const joystickRef = useRef<HTMLDivElement>(null);

  // Create a signaling WebSocket connection using a user-specified URL.
  const [signalingSocket, setSignalingSocket] = useState<WebSocket | null>(
    null
  );
  const [serverURL, setServerURL] = useState("ws://172.20.10.2:3001");
  useEffect(() => {
    if (!serverURL) return;
    const sock = new WebSocket(serverURL);
    sock.onopen = () => {
      console.log("Controls: Connected to signaling server at " + serverURL);
    };

    setSignalingSocket(sock);
    return () => {
      sock.close();
    };
  }, [serverURL]);

  // Called when the user touches the joystick
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
  };

  // Called when the user moves their finger on the joystick
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!joystickRef.current) return;

    const touch = e.touches[0];
    const rect = joystickRef.current.getBoundingClientRect();
    // Calculate center of the joystick
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate the displacement from center
    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    let newX = deltaX;
    let newY = deltaY;

    // Limit the movement within the joystick radius
    if (distance > JOYSTICK_RADIUS) {
      const scale = JOYSTICK_RADIUS / distance;
      newX = deltaX * scale;
      newY = deltaY * scale;
    }

    setStickPosition({ x: newX, y: newY });

    // Calculate normalized direction which you can pass to your character controller in Index.tsx
    const normalizedX = newX / JOYSTICK_RADIUS;
    const normalizedY = newY / JOYSTICK_RADIUS;
    //send 0 +- 0.5 or +- 1 based on the closest value
    const normalizedXInt = Math.round(normalizedX * 2) / 2;
    const normalizedYInt = Math.round(normalizedY * 2) / 2;

    console.log("Joystick move:", { x: normalizedXInt, y: normalizedYInt });

    // Only send every 5th event
    if (handleTouchMove.counter === undefined) {
      handleTouchMove.counter = 0;
    }
    handleTouchMove.counter++;

    if (handleTouchMove.counter % 5 === 0) {
      sendState({ joystick: { x: normalizedXInt, y: normalizedYInt } });
    }
  };
  const sendState = (state: any) => {
    if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
      signalingSocket.send(JSON.stringify({ type: "action", data: state }));
    } else {
      console.error("Controls: Signaling socket is not open.");
    }
  };
  // Reset the joystick when the touch ends
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setStickPosition({ x: 0, y: 0 });
    console.log("Joystick released");
    //send this to server
    sendState({ joystick: { x: 0, y: 0 } });
  };

  // Trigger the shoot event
  const handleShoot = () => {
    console.log("Shoot triggered!");
    setShootCounter(shootCounter + 1);
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
      }}
    >
      <div>
        {/*display the values from the joystick and the shoot counter*/}
        <p>
          Joystick: {stickPosition.x}, {stickPosition.y}
        </p>
        <p>Shoot: {shootCounter}</p>
        {/* Display the received offer SDP (for debugging) */}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "calc(100% - 50px)",
        }}
      >
        {/* Joystick Container */}
        <div
          ref={joystickRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            position: "relative",
            width: JOYSTICK_RADIUS * 2,
            height: JOYSTICK_RADIUS * 2,
            background: "#ddd",
            borderRadius: "50%",
            touchAction: "none",
            margin: "0 auto",
            cursor: "pointer",
          }}
        >
          {/* Joystick Stick */}
          <div
            style={{
              position: "absolute",
              left: JOYSTICK_RADIUS - STICK_RADIUS + stickPosition.x,
              top: JOYSTICK_RADIUS - STICK_RADIUS + stickPosition.y,
              width: STICK_RADIUS * 2,
              height: STICK_RADIUS * 2,
              background: "#888",
              borderRadius: "50%",
            }}
          />
        </div>

        {/* Shoot Button */}
        <button
          onTouchStart={handleShoot}
          style={{
            width: 80,
            height: 80,
            background: "red",
            border: "none",
            borderRadius: "50%",
            color: "white",
            fontSize: 18,
          }}
        >
          Shoot
        </button>
      </div>
    </div>
  );
};

export default Controls;

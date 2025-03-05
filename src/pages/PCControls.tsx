import React, { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

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

interface KeyConfig {
  up: string;
  down: string;
  left: string;
  right: string;
  buttonA: string;
  buttonB: string;
  buttonX: string;
  buttonY: string;
}

// Default key configuration (WASD + JKL)
const DEFAULT_KEY_CONFIG: KeyConfig = {
  up: "w",
  down: "s",
  left: "a",
  right: "d",
  buttonA: "j",
  buttonB: "k",
  buttonX: "l",
  buttonY: "i",
};

// Key code mapping for display purposes
const KEY_DISPLAY_NAMES: Record<string, string> = {
  " ": "Space",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
};

const PCControls = () => {
  const [keyConfig, setKeyConfig] = useState<KeyConfig>(DEFAULT_KEY_CONFIG);
  const [editingKey, setEditingKey] = useState<keyof KeyConfig | null>(null);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });
  const [buttons, setButtons] = useState({
    a: false,
    b: false,
    x: false,
    y: false,
  });
  const [signalingSocket, setSignalingSocket] = useState<WebSocket | null>(
    null
  );
  const [serverURL, setServerURL] = useState("ws://192.168.0.82:3001");
  const [isPlayer, setIsPlayer] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Connect to WebSocket server
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
      setIsPlayer(false);
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

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If we're editing a key binding, capture the pressed key
      if (editingKey) {
        e.preventDefault();

        // Get the key name
        const keyName = e.key;

        // Update the key configuration
        setKeyConfig((prev) => ({
          ...prev,
          [editingKey]: keyName,
        }));

        // Exit editing mode
        setEditingKey(null);
        return;
      }

      // Otherwise, handle normal gameplay
      const key = e.key.toLowerCase();

      // Prevent default actions for game keys
      if (Object.values(keyConfig).includes(key)) {
        e.preventDefault();
      }

      // Update active keys
      setActiveKeys((prev) => {
        const newSet = new Set(prev);
        newSet.add(key);
        return newSet;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Update active keys
      setActiveKeys((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [editingKey, keyConfig]);

  // Process active keys and update joystick/buttons
  useEffect(() => {
    // Calculate joystick values based on active keys
    let x = 0;
    let y = 0;

    if (activeKeys.has(keyConfig.right)) x += 1;
    if (activeKeys.has(keyConfig.left)) x -= 1;
    if (activeKeys.has(keyConfig.down)) y += 1;
    if (activeKeys.has(keyConfig.up)) y -= 1;

    // Update buttons state
    const newButtons = {
      a: activeKeys.has(keyConfig.buttonA),
      b: activeKeys.has(keyConfig.buttonB),
      x: activeKeys.has(keyConfig.buttonX),
      y: activeKeys.has(keyConfig.buttonY),
    };

    // Update state
    setJoystick({ x, y });
    setButtons(newButtons);

    // Send to server if connected
    if (signalingSocket?.readyState === WebSocket.OPEN) {
      signalingSocket.send(
        JSON.stringify({
          type: "action",
          data: {
            joystick: { x, y },
            buttons: newButtons,
          },
        })
      );
    }
  }, [activeKeys, keyConfig, signalingSocket]);

  // Function to start editing a key binding
  const startEditing = (key: keyof KeyConfig) => {
    setEditingKey(key);
  };

  // Function to reset to default key configuration
  const resetToDefault = () => {
    setKeyConfig(DEFAULT_KEY_CONFIG);
  };

  // Function to get display name for a key
  const getKeyDisplayName = (key: string) => {
    return KEY_DISPLAY_NAMES[key] || key.toUpperCase();
  };

  // Function to toggle controls visibility
  const toggleControls = () => {
    setShowControls((prev) => !prev);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">PC Controls</h1>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isPlayer ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span>{isPlayer ? "Connected" : "Disconnected"}</span>
        </div>
      </div>

      <Button
        onClick={toggleControls}
        className="mb-4"
        variant={showControls ? "outline" : "default"}
      >
        {showControls ? "Hide Controls" : "Show Controls"}
      </Button>

      {showControls && (
        <Tabs defaultValue="controls">
          <TabsList className="mb-4">
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="controls">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Movement Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>Movement Controls</CardTitle>
                  <CardDescription>WASD keys for movement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                    <div></div>
                    <div className="p-2">
                      <Button
                        variant={
                          activeKeys.has(keyConfig.up) ? "default" : "outline"
                        }
                        className="w-full h-12"
                      >
                        {getKeyDisplayName(keyConfig.up)}
                      </Button>
                    </div>
                    <div></div>
                    <div className="p-2">
                      <Button
                        variant={
                          activeKeys.has(keyConfig.left) ? "default" : "outline"
                        }
                        className="w-full h-12"
                      >
                        {getKeyDisplayName(keyConfig.left)}
                      </Button>
                    </div>
                    <div className="p-2">
                      <Button
                        variant={
                          activeKeys.has(keyConfig.down) ? "default" : "outline"
                        }
                        className="w-full h-12"
                      >
                        {getKeyDisplayName(keyConfig.down)}
                      </Button>
                    </div>
                    <div className="p-2">
                      <Button
                        variant={
                          activeKeys.has(keyConfig.right)
                            ? "default"
                            : "outline"
                        }
                        className="w-full h-12"
                      >
                        {getKeyDisplayName(keyConfig.right)}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card>
                <CardHeader>
                  <CardTitle>Action Buttons</CardTitle>
                  <CardDescription>JKL keys for actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 max-w-[200px] mx-auto">
                    <Button
                      variant={buttons.y ? "default" : "outline"}
                      className="h-12 bg-yellow-500 hover:bg-yellow-600"
                    >
                      Y ({getKeyDisplayName(keyConfig.buttonY)})
                    </Button>
                    <Button
                      variant={buttons.b ? "default" : "outline"}
                      className="h-12 bg-red-500 hover:bg-red-600"
                    >
                      B ({getKeyDisplayName(keyConfig.buttonB)})
                    </Button>
                    <Button
                      variant={buttons.x ? "default" : "outline"}
                      className="h-12 bg-blue-500 hover:bg-blue-600"
                    >
                      X ({getKeyDisplayName(keyConfig.buttonX)})
                    </Button>
                    <Button
                      variant={buttons.a ? "default" : "outline"}
                      className="h-12 bg-green-500 hover:bg-green-600"
                    >
                      A ({getKeyDisplayName(keyConfig.buttonA)})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Key Configuration</CardTitle>
                <CardDescription>
                  Click on a button to remap the key
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Movement Keys */}
                  <div>
                    <h3 className="font-medium mb-2">Movement Keys</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Up:</Label>
                        <Button
                          variant="outline"
                          onClick={() => startEditing("up")}
                          className="w-20"
                        >
                          {editingKey === "up"
                            ? "Press key..."
                            : getKeyDisplayName(keyConfig.up)}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Down:</Label>
                        <Button
                          variant="outline"
                          onClick={() => startEditing("down")}
                          className="w-20"
                        >
                          {editingKey === "down"
                            ? "Press key..."
                            : getKeyDisplayName(keyConfig.down)}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Left:</Label>
                        <Button
                          variant="outline"
                          onClick={() => startEditing("left")}
                          className="w-20"
                        >
                          {editingKey === "left"
                            ? "Press key..."
                            : getKeyDisplayName(keyConfig.left)}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Right:</Label>
                        <Button
                          variant="outline"
                          onClick={() => startEditing("right")}
                          className="w-20"
                        >
                          {editingKey === "right"
                            ? "Press key..."
                            : getKeyDisplayName(keyConfig.right)}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div>
                    <h3 className="font-medium mb-2">Action Buttons</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Button A:</Label>
                        <Button
                          variant="outline"
                          onClick={() => startEditing("buttonA")}
                          className="w-20"
                        >
                          {editingKey === "buttonA"
                            ? "Press key..."
                            : getKeyDisplayName(keyConfig.buttonA)}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Button B:</Label>
                        <Button
                          variant="outline"
                          onClick={() => startEditing("buttonB")}
                          className="w-20"
                        >
                          {editingKey === "buttonB"
                            ? "Press key..."
                            : getKeyDisplayName(keyConfig.buttonB)}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Button X:</Label>
                        <Button
                          variant="outline"
                          onClick={() => startEditing("buttonX")}
                          className="w-20"
                        >
                          {editingKey === "buttonX"
                            ? "Press key..."
                            : getKeyDisplayName(keyConfig.buttonX)}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Button Y:</Label>
                        <Button
                          variant="outline"
                          onClick={() => startEditing("buttonY")}
                          className="w-20"
                        >
                          {editingKey === "buttonY"
                            ? "Press key..."
                            : getKeyDisplayName(keyConfig.buttonY)}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={resetToDefault}>Reset to Default</Button>
              </CardFooter>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Server Settings</CardTitle>
                <CardDescription>
                  Configure the WebSocket server URL
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    value={serverURL}
                    onChange={(e) => setServerURL(e.target.value)}
                    placeholder="WebSocket URL"
                  />
                  <Button
                    onClick={() => {
                      if (signalingSocket) {
                        signalingSocket.close();
                        setSignalingSocket(new WebSocket(serverURL));
                      }
                    }}
                  >
                    Reconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default PCControls;

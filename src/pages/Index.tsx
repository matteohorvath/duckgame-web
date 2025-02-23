import { useEffect } from "react";
import { Game } from "../engine/Game";
import MainScene from "../scenes/MainScene";

const Index = () => {
  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: "phaser-container",
      scene: [MainScene],

      physics: {
        default: "arcade",
        arcade: {
          debug: false,
        },
      },
      backgroundColor: "#ffffff",
    };

    const game = new Game(config);

    // Handle window resize
    const handleResize = () => {
      game.scale.resize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      game.destroy(true);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden">
      <div id="phaser-container" className="absolute inset-0 z-10"></div>

      {/* Debug Panel */}
    </div>
  );
};

export default Index;

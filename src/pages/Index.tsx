import { useEffect } from "react";
import { Game } from "../engine/Game";
import MainScene from "../scenes/MainScene";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

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

      {/* Controls Links */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <Link to="/controls">
          <Button variant="outline" className="w-full">
            Mobile Controls
          </Button>
        </Link>
        <Link to="/pc">
          <Button variant="outline" className="w-full">
            PC Controls
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;

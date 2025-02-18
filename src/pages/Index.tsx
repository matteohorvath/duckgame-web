
import { useEffect, useRef } from 'react';
import { Game } from '../engine/Game';

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const game = new Game({
      width: window.innerWidth,
      height: window.innerHeight,
      canvas: canvasRef.current,
    });

    gameRef.current = game;

    // Handle window resize
    const handleResize = () => {
      if (!canvasRef.current) return;
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      game.destroy();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden">
      <div className="absolute inset-0 z-10">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>
      
      {/* Debug Panel */}
      <div className="absolute top-4 right-4 z-20">
        <div className="glass-panel rounded-lg p-4 space-y-2 min-w-[200px]">
          <h2 className="text-sm font-medium text-gray-700">Debug Panel</h2>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Controls: WASD to move</p>
            <p className="text-xs text-gray-500">FPS: 60</p>
            <p className="text-xs text-gray-500">Objects: 1</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

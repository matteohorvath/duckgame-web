export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface SpawnPoint {
  x: number;
  y: number;
}

export interface GameMap {
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  platforms: Platform[];
  obstacles: Obstacle[];
  spawnPoints: SpawnPoint[];
}

import { GameMap } from "./types";
import map1 from "./map1.json";
import map2 from "./map2.json";

/**
 * MapLoader class for loading and managing game maps
 */
export class MapLoader {
  private maps: Record<string, GameMap> = {};

  constructor() {
    // Register default maps
    this.registerMap("map1", map1 as GameMap);
    this.registerMap("map2", map2 as GameMap);
  }

  /**
   * Register a map with the loader
   * @param id Unique identifier for the map
   * @param mapData Map data object
   */
  registerMap(id: string, mapData: GameMap): void {
    this.maps[id] = mapData;
  }

  /**
   * Get a map by its ID
   * @param id Map identifier
   * @returns The map data or undefined if not found
   */
  getMap(id: string): GameMap | undefined {
    return this.maps[id];
  }

  /**
   * Get all available map IDs
   * @returns Array of map IDs
   */
  getMapIds(): string[] {
    return Object.keys(this.maps);
  }

  /**
   * Get all available maps
   * @returns Record of all maps
   */
  getAllMaps(): Record<string, GameMap> {
    return { ...this.maps };
  }
}

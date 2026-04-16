import {
  BULLET_SPEED,
  DIFFICULTY_SETTINGS,
  ENEMY_BASE_SPEED,
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_BOTTOM_MARGIN,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
} from "./constants.js";

export function createInitialState(highScore) {
  return {
    player: {
      x: (GAME_WIDTH - PLAYER_WIDTH) / 2,
      y: GAME_HEIGHT - PLAYER_HEIGHT - PLAYER_BOTTOM_MARGIN,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
    },
    bullets: [],
    enemies: [],
    powerUps: [],
    score: 0,
    isGameOver: false,
    keys: {
      left: false,
      right: false,
    },
    lastShotTime: 0,
    lastPowerUpSpawnTime: 0,
    bulletSpeed: BULLET_SPEED,
    enemySpawnRate: DIFFICULTY_SETTINGS.spawnRateStart,
    enemySpeed: ENEMY_BASE_SPEED,
    difficultyLevel: 0,
    startTime: 0,
    highScore,
    effects: [],
    hasStarted: false,
  };
}

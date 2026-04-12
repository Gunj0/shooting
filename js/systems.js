import {
  BULLET_HEIGHT,
  BULLET_WIDTH,
  DIFFICULTY_SETTINGS,
  ENEMY_BASE_SPEED,
  ENEMY_HEIGHT,
  ENEMY_WIDTH,
  GAME_HEIGHT,
  GAME_WIDTH,
  MAX_BULLET_SPEED,
  PLAYER_SPEED,
  POWER_UP_BULLET_SPEED_BOOST,
  POWER_UP_HEIGHT,
  POWER_UP_SPAWN_INTERVAL,
  POWER_UP_SPEED,
  POWER_UP_WIDTH,
  SHOOT_INTERVAL,
} from "./constants.js";
import { clamp, isColliding } from "./utils.js";

export function updateDifficulty(state, now) {
  const elapsedTime = now - state.startTime;
  const nextDifficultyLevel = Math.floor(
    elapsedTime / DIFFICULTY_SETTINGS.intervalMs,
  );

  if (nextDifficultyLevel <= state.difficultyLevel) {
    return;
  }

  state.difficultyLevel = nextDifficultyLevel;
  state.enemySpawnRate = Math.min(
    DIFFICULTY_SETTINGS.spawnRateStart +
      DIFFICULTY_SETTINGS.spawnRateStep * nextDifficultyLevel,
    DIFFICULTY_SETTINGS.spawnRateMax,
  );
  state.enemySpeed = Math.min(
    ENEMY_BASE_SPEED + DIFFICULTY_SETTINGS.speedStep * nextDifficultyLevel,
    ENEMY_BASE_SPEED + DIFFICULTY_SETTINGS.speedMaxBonus,
  );
}

export function updatePlayerPosition(state) {
  if (state.keys.left) {
    state.player.x -= PLAYER_SPEED;
  }

  if (state.keys.right) {
    state.player.x += PLAYER_SPEED;
  }

  state.player.x = clamp(state.player.x, 0, GAME_WIDTH - state.player.width);
}

export function shootBullet(state, now) {
  if (now - state.lastShotTime < SHOOT_INTERVAL) {
    return;
  }

  state.bullets.push({
    x: state.player.x + (state.player.width - BULLET_WIDTH) / 2,
    y: state.player.y - BULLET_HEIGHT,
    width: BULLET_WIDTH,
    height: BULLET_HEIGHT,
  });

  state.lastShotTime = now;
}

export function updateBullets(state) {
  state.bullets = state.bullets
    .map((bullet) => ({
      ...bullet,
      y: bullet.y - state.bulletSpeed,
    }))
    .filter((bullet) => bullet.y + bullet.height >= 0);
}

export function spawnEnemy(state) {
  if (Math.random() >= state.enemySpawnRate) {
    return;
  }

  state.enemies.push({
    x: Math.random() * (GAME_WIDTH - ENEMY_WIDTH),
    y: -ENEMY_HEIGHT,
    width: ENEMY_WIDTH,
    height: ENEMY_HEIGHT,
  });
}

export function updateEnemies(state) {
  state.enemies = state.enemies
    .map((enemy) => ({
      ...enemy,
      y: enemy.y + state.enemySpeed,
    }))
    .filter((enemy) => enemy.y <= GAME_HEIGHT);
}

export function spawnPowerUp(state, now) {
  if (now - state.lastPowerUpSpawnTime < POWER_UP_SPAWN_INTERVAL) {
    return;
  }

  state.lastPowerUpSpawnTime = now;

  if (state.powerUps.length > 0) {
    return;
  }

  state.powerUps.push({
    x: Math.random() * (GAME_WIDTH - POWER_UP_WIDTH),
    y: -POWER_UP_HEIGHT,
    width: POWER_UP_WIDTH,
    height: POWER_UP_HEIGHT,
  });
}

export function updatePowerUps(state) {
  state.powerUps = state.powerUps
    .map((powerUp) => ({
      ...powerUp,
      y: powerUp.y + POWER_UP_SPEED,
    }))
    .filter((powerUp) => powerUp.y <= GAME_HEIGHT);
}

export function handleCollisions(state) {
  const remainingBullets = [];
  const activeEnemies = [...state.enemies];
  let scoreChanged = false;

  for (const bullet of state.bullets) {
    const collidedEnemyIndex = activeEnemies.findIndex((enemy) =>
      isColliding(bullet, enemy),
    );

    if (collidedEnemyIndex >= 0) {
      const enemy = activeEnemies[collidedEnemyIndex];
      addEffect(
        state,
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        22,
        14,
        "enemy",
      );
      activeEnemies.splice(collidedEnemyIndex, 1);
      state.score += 10;
      scoreChanged = true;
      continue;
    }

    remainingBullets.push(bullet);
  }

  state.bullets = remainingBullets;
  state.enemies = activeEnemies;

  const remainingPowerUps = [];
  for (const powerUp of state.powerUps) {
    if (isColliding(powerUp, state.player)) {
      state.bulletSpeed = Math.min(
        state.bulletSpeed + POWER_UP_BULLET_SPEED_BOOST,
        MAX_BULLET_SPEED,
      );
      addEffect(
        state,
        powerUp.x + powerUp.width / 2,
        powerUp.y + powerUp.height / 2,
        30,
        18,
        "powerup",
      );
      continue;
    }

    remainingPowerUps.push(powerUp);
  }
  state.powerUps = remainingPowerUps;

  const playerHit = state.enemies.some((enemy) =>
    isColliding(enemy, state.player),
  );

  if (playerHit) {
    addEffect(
      state,
      state.player.x + state.player.width / 2,
      state.player.y + state.player.height / 2,
      54,
      24,
      "player",
    );
  }

  return { scoreChanged, playerHit };
}

export function updateEffects(state) {
  if (state.effects.length === 0) {
    return;
  }

  state.effects = state.effects
    .map((effect) => ({
      ...effect,
      life: effect.life - 1,
    }))
    .filter((effect) => effect.life > 0);
}

function addEffect(state, x, y, size, life, type) {
  state.effects.push({
    x,
    y,
    size,
    life,
    maxLife: life,
    type,
  });
}

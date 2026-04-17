import {
  BULLET_HEIGHT,
  BULLET_SPREAD,
  BULLET_SPEED,
  BULLET_WIDTH,
  DIFFICULTY_SETTINGS,
  EFFECT_ENEMY_LIFE,
  EFFECT_ENEMY_SIZE,
  EFFECT_PLAYER_LIFE,
  EFFECT_PLAYER_SIZE,
  EFFECT_POWERUP_LIFE,
  EFFECT_POWERUP_SIZE,
  ENEMY_BASE_SPEED,
  ENEMY_HEIGHT,
  ENEMY_SWAY_AMPLITUDE,
  ENEMY_SWAY_SPEED,
  ENEMY_WIDTH,
  GAME_HEIGHT,
  MAX_BULLET_COUNT,
  PLAYER_SPEED,
  POWER_UP_BULLET_COUNT_BOOST,
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
  state.enemySwayChance = Math.min(
    DIFFICULTY_SETTINGS.swayChanceStart +
      DIFFICULTY_SETTINGS.swayChanceStep * nextDifficultyLevel,
    DIFFICULTY_SETTINGS.swayChanceMax,
  );
}

export function updatePlayerPosition(state) {
  if (state.keys.left) {
    state.player.x -= PLAYER_SPEED;
  }

  if (state.keys.right) {
    state.player.x += PLAYER_SPEED;
  }

  state.player.x = clamp(
    state.player.x,
    0,
    state.gameWidth - state.player.width,
  );
}

export function shootBullet(state, now) {
  if (now - state.lastShotTime < SHOOT_INTERVAL) {
    return;
  }

  const centerX = state.player.x + (state.player.width - BULLET_WIDTH) / 2;
  for (let i = 0; i < state.bulletCount; i++) {
    const offset = (i - (state.bulletCount - 1) / 2) * BULLET_SPREAD;
    state.bullets.push({
      x: centerX + offset,
      y: state.player.y - BULLET_HEIGHT,
      width: BULLET_WIDTH,
      height: BULLET_HEIGHT,
    });
  }

  state.lastShotTime = now;
}

export function updateBullets(state) {
  state.bullets = state.bullets
    .map((bullet) => ({
      ...bullet,
      y: bullet.y - BULLET_SPEED,
    }))
    .filter((bullet) => bullet.y + bullet.height >= 0);
}

export function spawnEnemy(state) {
  if (Math.random() >= state.enemySpawnRate) {
    return;
  }

  const spawnX = Math.random() * (state.gameWidth - ENEMY_WIDTH);
  const isSway = Math.random() < state.enemySwayChance;

  state.enemies.push({
    x: spawnX,
    y: -ENEMY_HEIGHT,
    width: ENEMY_WIDTH,
    height: ENEMY_HEIGHT,
    spawnX,
    swayAmplitude: isSway ? ENEMY_SWAY_AMPLITUDE : 0,
    swaySpeed: isSway ? ENEMY_SWAY_SPEED : 0,
    age: 0,
  });
}

export function updateEnemies(state) {
  state.enemies = state.enemies
    .map((enemy) => {
      const newAge = enemy.age + 1;
      const swayX =
        enemy.swayAmplitude > 0
          ? enemy.spawnX +
            Math.sin(newAge * enemy.swaySpeed) * enemy.swayAmplitude
          : enemy.x;
      return {
        ...enemy,
        x: clamp(swayX, 0, state.gameWidth - enemy.width),
        y: enemy.y + state.enemySpeed,
        age: newAge,
      };
    })
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
    x: Math.random() * (state.gameWidth - POWER_UP_WIDTH),
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
        EFFECT_ENEMY_SIZE,
        EFFECT_ENEMY_LIFE,
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
      state.bulletCount = Math.min(
        state.bulletCount + POWER_UP_BULLET_COUNT_BOOST,
        MAX_BULLET_COUNT,
      );
      addEffect(
        state,
        powerUp.x + powerUp.width / 2,
        powerUp.y + powerUp.height / 2,
        EFFECT_POWERUP_SIZE,
        EFFECT_POWERUP_LIFE,
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
      EFFECT_PLAYER_SIZE,
      EFFECT_PLAYER_LIFE,
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

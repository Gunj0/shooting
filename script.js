const GAME_WIDTH = 300;
const GAME_HEIGHT = 500;

const PLAYER_WIDTH = 34;
const PLAYER_HEIGHT = 20;
const BULLET_WIDTH = 6;
const BULLET_HEIGHT = 14;
const ENEMY_WIDTH = 28;
const ENEMY_HEIGHT = 28;
const POWER_UP_WIDTH = 18;
const POWER_UP_HEIGHT = 18;

const PLAYER_SPEED = 5;
const BULLET_SPEED = 7;
const ENEMY_BASE_SPEED = 2;
const POWER_UP_SPEED = 2.2;

const SHOOT_INTERVAL = 300;
const HIGH_SCORE_STORAGE_KEY = "mini-shooting-high-score";
const PLAYER_HIT_FLASH_MS = 240;
const POWER_UP_SPAWN_INTERVAL = 12000;
const POWER_UP_BULLET_SPEED_BOOST = 1.25;
const MAX_BULLET_SPEED = 13;

const DIFFICULTY_SETTINGS = {
  spawnRateStart: 0.02,
  spawnRateMax: 0.08,
  spawnRateStep: 0.002,
  speedStep: 0.5,
  speedMaxBonus: 2,
  intervalMs: 5000,
};

const gameElement = document.getElementById("game");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const difficultyElement = document.getElementById("difficulty");
const finalScoreElement = document.getElementById("finalScore");
const titleOverlay = document.getElementById("titleOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const restartButton = document.getElementById("restartButton");

let gameState = createInitialState();
let animationFrameId = null;
let flashTimeoutId = null;

function createInitialState() {
  return {
    player: {
      x: (GAME_WIDTH - PLAYER_WIDTH) / 2,
      y: GAME_HEIGHT - PLAYER_HEIGHT - 16,
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
    highScore: loadHighScore(),
    effects: [],
    hasStarted: false,
  };
}

function setupGame() {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  restartButton.addEventListener("click", () => restartGame(false));
  showTitle();
  render();
}

function startGame() {
  if (gameState.hasStarted || gameState.isGameOver) {
    return;
  }

  gameState.hasStarted = true;
  hideTitle();
  gameState.startTime = performance.now();
  gameState.lastShotTime = gameState.startTime;
  gameState.lastPowerUpSpawnTime = gameState.startTime;
  render();
  animationFrameId = requestAnimationFrame(loop);
}

function restartGame(startImmediately = false) {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }

  if (flashTimeoutId !== null) {
    clearTimeout(flashTimeoutId);
    flashTimeoutId = null;
  }

  gameElement.classList.remove("hit-flash");

  gameState = createInitialState();
  hideGameOver();

  if (startImmediately) {
    hideTitle();
    startGame();
  } else {
    showTitle();
    render();
  }
}

function loop(now) {
  if (!gameState.isGameOver) {
    updateDifficulty(now);
    updatePlayerPosition();
    shootBullet(now);
    updateBullets();
    spawnEnemy();
    spawnPowerUp(now);
    updateEnemies();
    updatePowerUps();
    handleCollisions();
  }

  updateEffects();
  render();

  if (!gameState.isGameOver || gameState.effects.length > 0) {
    animationFrameId = requestAnimationFrame(loop);
  } else {
    animationFrameId = null;
  }
}

function handleKeyDown(event) {
  if (event.code === "Space") {
    event.preventDefault();
    if (gameState.isGameOver) {
      restartGame(true);
    } else if (!gameState.hasStarted) {
      startGame();
    }
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    gameState.keys.left = true;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    gameState.keys.right = true;
  }
}

function handleKeyUp(event) {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    gameState.keys.left = false;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    gameState.keys.right = false;
  }
}

function updatePlayerPosition() {
  if (gameState.keys.left) {
    gameState.player.x -= PLAYER_SPEED;
  }

  if (gameState.keys.right) {
    gameState.player.x += PLAYER_SPEED;
  }

  gameState.player.x = clamp(
    gameState.player.x,
    0,
    GAME_WIDTH - gameState.player.width,
  );
}

function shootBullet(now) {
  if (now - gameState.lastShotTime < SHOOT_INTERVAL) {
    return;
  }

  gameState.bullets.push({
    x: gameState.player.x + (gameState.player.width - BULLET_WIDTH) / 2,
    y: gameState.player.y - BULLET_HEIGHT,
    width: BULLET_WIDTH,
    height: BULLET_HEIGHT,
  });

  gameState.lastShotTime = now;
}

function updateBullets() {
  gameState.bullets = gameState.bullets
    .map((bullet) => ({
      ...bullet,
      y: bullet.y - gameState.bulletSpeed,
    }))
    .filter((bullet) => bullet.y + bullet.height >= 0);
}

function spawnEnemy() {
  if (Math.random() >= gameState.enemySpawnRate) {
    return;
  }

  gameState.enemies.push({
    x: Math.random() * (GAME_WIDTH - ENEMY_WIDTH),
    y: -ENEMY_HEIGHT,
    width: ENEMY_WIDTH,
    height: ENEMY_HEIGHT,
  });
}

function updateEnemies() {
  gameState.enemies = gameState.enemies
    .map((enemy) => ({
      ...enemy,
      y: enemy.y + gameState.enemySpeed,
    }))
    .filter((enemy) => enemy.y <= GAME_HEIGHT);
}

function spawnPowerUp(now) {
  if (now - gameState.lastPowerUpSpawnTime < POWER_UP_SPAWN_INTERVAL) {
    return;
  }

  gameState.lastPowerUpSpawnTime = now;

  if (gameState.powerUps.length > 0) {
    return;
  }

  gameState.powerUps.push({
    x: Math.random() * (GAME_WIDTH - POWER_UP_WIDTH),
    y: -POWER_UP_HEIGHT,
    width: POWER_UP_WIDTH,
    height: POWER_UP_HEIGHT,
  });
}

function updatePowerUps() {
  gameState.powerUps = gameState.powerUps
    .map((powerUp) => ({
      ...powerUp,
      y: powerUp.y + POWER_UP_SPEED,
    }))
    .filter((powerUp) => powerUp.y <= GAME_HEIGHT);
}

function handleCollisions() {
  const remainingBullets = [];
  const activeEnemies = [...gameState.enemies];

  for (const bullet of gameState.bullets) {
    const collidedEnemyIndex = activeEnemies.findIndex((enemy) =>
      isColliding(bullet, enemy),
    );

    if (collidedEnemyIndex >= 0) {
      const enemy = activeEnemies[collidedEnemyIndex];
      addEffect(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        22,
        14,
        "enemy",
      );
      activeEnemies.splice(collidedEnemyIndex, 1);
      gameState.score += 10;
      updateHighScore(gameState.score);
      continue;
    }

    remainingBullets.push(bullet);
  }

  gameState.bullets = remainingBullets;
  gameState.enemies = activeEnemies;

  const remainingPowerUps = [];
  for (const powerUp of gameState.powerUps) {
    if (isColliding(powerUp, gameState.player)) {
      gameState.bulletSpeed = Math.min(
        gameState.bulletSpeed + POWER_UP_BULLET_SPEED_BOOST,
        MAX_BULLET_SPEED,
      );
      addEffect(
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
  gameState.powerUps = remainingPowerUps;

  if (gameState.enemies.some((enemy) => isColliding(enemy, gameState.player))) {
    addEffect(
      gameState.player.x + gameState.player.width / 2,
      gameState.player.y + gameState.player.height / 2,
      54,
      24,
      "player",
    );
    triggerHitFlash();
    gameState.isGameOver = true;
    showGameOver();
  }
}

function updateEffects() {
  if (gameState.effects.length === 0) {
    return;
  }

  gameState.effects = gameState.effects
    .map((effect) => ({
      ...effect,
      life: effect.life - 1,
    }))
    .filter((effect) => effect.life > 0);
}

function updateDifficulty(now) {
  const elapsedTime = now - gameState.startTime;
  const nextDifficultyLevel = Math.floor(
    elapsedTime / DIFFICULTY_SETTINGS.intervalMs,
  );

  if (nextDifficultyLevel <= gameState.difficultyLevel) {
    return;
  }

  gameState.difficultyLevel = nextDifficultyLevel;
  gameState.enemySpawnRate = Math.min(
    DIFFICULTY_SETTINGS.spawnRateStart +
      DIFFICULTY_SETTINGS.spawnRateStep * nextDifficultyLevel,
    DIFFICULTY_SETTINGS.spawnRateMax,
  );
  gameState.enemySpeed = Math.min(
    ENEMY_BASE_SPEED + DIFFICULTY_SETTINGS.speedStep * nextDifficultyLevel,
    ENEMY_BASE_SPEED + DIFFICULTY_SETTINGS.speedMaxBonus,
  );
}

function render() {
  scoreElement.textContent = String(gameState.score);
  highScoreElement.textContent = String(gameState.highScore);
  difficultyElement.textContent = String(gameState.difficultyLevel + 1);
  finalScoreElement.textContent = String(gameState.score);
  gameElement.innerHTML = "";

  if (!gameState.hasStarted) {
    return;
  }

  renderEntity(gameState.player, "player");
  gameState.bullets.forEach((bullet) => renderEntity(bullet, "bullet"));
  gameState.enemies.forEach((enemy) => renderEntity(enemy, "enemy"));
  gameState.powerUps.forEach((powerUp) => renderEntity(powerUp, "powerup"));
  gameState.effects.forEach((effect) => renderEffect(effect));
}

function renderEntity(entity, className) {
  const element = document.createElement("div");
  element.className = `entity ${className}`;
  element.style.width = `${entity.width}px`;
  element.style.height = `${entity.height}px`;
  element.style.transform = `translate(${entity.x}px, ${entity.y}px)`;
  gameElement.appendChild(element);
}

function showGameOver() {
  updateHighScore(gameState.score);
  gameOverOverlay.classList.remove("hidden");
}

function hideGameOver() {
  gameOverOverlay.classList.add("hidden");
}

function showTitle() {
  titleOverlay.classList.remove("hidden");
}

function hideTitle() {
  titleOverlay.classList.add("hidden");
}

function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function addEffect(x, y, size, life, type) {
  gameState.effects.push({
    x,
    y,
    size,
    life,
    maxLife: life,
    type,
  });
}

function renderEffect(effect) {
  const effectElement = document.createElement("div");
  effectElement.className = `effect effect-${effect.type}`;
  effectElement.style.width = `${effect.size}px`;
  effectElement.style.height = `${effect.size}px`;

  const ratio = effect.life / effect.maxLife;
  const scale = 1 + (1 - ratio) * 1.35;
  const left = effect.x - effect.size / 2;
  const top = effect.y - effect.size / 2;

  effectElement.style.opacity = String(ratio);
  effectElement.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
  gameElement.appendChild(effectElement);
}

function triggerHitFlash() {
  gameElement.classList.remove("hit-flash");
  void gameElement.offsetWidth;
  gameElement.classList.add("hit-flash");

  if (flashTimeoutId !== null) {
    clearTimeout(flashTimeoutId);
  }

  flashTimeoutId = window.setTimeout(() => {
    gameElement.classList.remove("hit-flash");
    flashTimeoutId = null;
  }, PLAYER_HIT_FLASH_MS);
}

function loadHighScore() {
  const rawValue = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
  const parsed = Number.parseInt(rawValue ?? "0", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function updateHighScore(score) {
  if (score <= gameState.highScore) {
    return;
  }

  gameState.highScore = score;
  window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(score));
}

setupGame();

import { PLAYER_HIT_FLASH_MS } from "./js/constants.js";
import { renderFrame } from "./js/render.js";
import { createInitialState } from "./js/state.js";
import { loadHighScore, saveHighScore } from "./js/storage.js";
import {
  handleCollisions,
  shootBullet,
  spawnEnemy,
  spawnPowerUp,
  updateBullets,
  updateDifficulty,
  updateEffects,
  updateEnemies,
  updatePlayerPosition,
  updatePowerUps,
} from "./js/systems.js";

const elements = {
  gameElement: document.getElementById("game"),
  scoreElement: document.getElementById("score"),
  highScoreElement: document.getElementById("highScore"),
  difficultyElement: document.getElementById("difficulty"),
  finalScoreElement: document.getElementById("finalScore"),
  titleOverlay: document.getElementById("titleOverlay"),
  gameOverOverlay: document.getElementById("gameOverOverlay"),
  restartButton: document.getElementById("restartButton"),
};

let gameState = createInitialState(loadHighScore());
let animationFrameId = null;
let flashTimeoutId = null;

function setupGame() {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  elements.restartButton.addEventListener("click", () => restartGame(false));

  elements.titleOverlay.addEventListener("touchstart", handleTitleTouch, {
    passive: false,
  });
  elements.gameOverOverlay.addEventListener(
    "touchstart",
    handleGameOverTouch,
    { passive: false },
  );
  elements.gameElement.addEventListener("touchstart", handleGameTouchStart, {
    passive: false,
  });
  elements.gameElement.addEventListener("touchend", handleGameTouchEnd, {
    passive: false,
  });
  elements.gameElement.addEventListener("touchcancel", handleGameTouchEnd, {
    passive: false,
  });

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

  elements.gameElement.classList.remove("hit-flash");

  gameState = createInitialState(loadHighScore());
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
    updateDifficulty(gameState, now);
    updatePlayerPosition(gameState);
    shootBullet(gameState, now);
    updateBullets(gameState);
    spawnEnemy(gameState);
    spawnPowerUp(gameState, now);
    updateEnemies(gameState);
    updatePowerUps(gameState);

    const { scoreChanged, playerHit } = handleCollisions(gameState);

    if (scoreChanged) {
      updateHighScore();
    }

    if (playerHit) {
      gameState.isGameOver = true;
      triggerHitFlash();
      showGameOver();
    }
  }

  updateEffects(gameState);
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

function handleTitleTouch(event) {
  event.preventDefault();
  if (!gameState.hasStarted && !gameState.isGameOver) {
    startGame();
  }
}

function handleGameOverTouch(event) {
  event.preventDefault();
  if (gameState.isGameOver) {
    restartGame(true);
  }
}

function handleGameTouchStart(event) {
  event.preventDefault();
  if (!gameState.hasStarted || gameState.isGameOver) {
    return;
  }

  const rect = elements.gameElement.getBoundingClientRect();
  const midX = rect.left + rect.width / 2;

  let hasLeft = false;
  let hasRight = false;

  for (const touch of event.touches) {
    if (touch.clientX < midX) {
      hasLeft = true;
    } else {
      hasRight = true;
    }
  }

  gameState.keys.left = hasLeft;
  gameState.keys.right = hasRight;
}

function handleGameTouchEnd(event) {
  event.preventDefault();

  const rect = elements.gameElement.getBoundingClientRect();
  const midX = rect.left + rect.width / 2;

  let hasLeft = false;
  let hasRight = false;

  for (const touch of event.touches) {
    if (touch.clientX < midX) {
      hasLeft = true;
    } else {
      hasRight = true;
    }
  }

  gameState.keys.left = hasLeft;
  gameState.keys.right = hasRight;
}

function render() {
  renderFrame(gameState, elements);
}

function showGameOver() {
  updateHighScore();
  elements.gameOverOverlay.classList.remove("hidden");
}

function hideGameOver() {
  elements.gameOverOverlay.classList.add("hidden");
}

function showTitle() {
  elements.titleOverlay.classList.remove("hidden");
}

function hideTitle() {
  elements.titleOverlay.classList.add("hidden");
}

function triggerHitFlash() {
  const { gameElement } = elements;

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

function updateHighScore() {
  if (gameState.score <= gameState.highScore) {
    return;
  }

  gameState.highScore = gameState.score;
  saveHighScore(gameState.highScore);
}

setupGame();

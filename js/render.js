export function renderFrame(state, elements) {
  const {
    gameElement,
    scoreElement,
    highScoreElement,
    difficultyElement,
    finalScoreElement,
  } = elements;

  scoreElement.textContent = String(state.score);
  highScoreElement.textContent = String(state.highScore);
  difficultyElement.textContent = String(state.difficultyLevel + 1);
  finalScoreElement.textContent = String(state.score);
  gameElement.innerHTML = "";

  if (!state.hasStarted) {
    return;
  }

  renderEntity(gameElement, state.player, "player");
  state.bullets.forEach((bullet) =>
    renderEntity(gameElement, bullet, "bullet"),
  );
  state.enemies.forEach((enemy) => {
    const cls = enemy.swayAmplitude > 0 ? "enemy enemy-sway" : "enemy";
    renderEntity(gameElement, enemy, cls);
  });
  state.powerUps.forEach((powerUp) =>
    renderEntity(gameElement, powerUp, "powerup"),
  );
  state.effects.forEach((effect) => renderEffect(gameElement, effect));
}

function renderEntity(gameElement, entity, className) {
  const element = document.createElement("div");
  element.className = `entity ${className}`;
  element.style.width = `${entity.width}px`;
  element.style.height = `${entity.height}px`;
  element.style.transform = `translate(${entity.x}px, ${entity.y}px)`;
  gameElement.appendChild(element);
}

function renderEffect(gameElement, effect) {
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

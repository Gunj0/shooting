import assert from "node:assert/strict";
import test from "node:test";

import {
  BULLET_SPEED,
  DIFFICULTY_SETTINGS,
  ENEMY_BASE_SPEED,
  ENEMY_SWAY_AMPLITUDE,
  ENEMY_SWAY_SPEED,
  GAME_WIDTH,
  MAX_BULLET_COUNT,
  SHOOT_INTERVAL,
} from "../js/constants.js";
import { createInitialState } from "../js/state.js";
import {
  handleCollisions,
  shootBullet,
  spawnEnemy,
  spawnPowerUp,
  updateBullets,
  updateDifficulty,
  updateEffects,
  updateEnemies,
} from "../js/systems.js";

test("shootBullet は発射間隔を満たした時だけ弾を追加する", () => {
  const state = createInitialState(0);
  state.lastShotTime = 1000;

  shootBullet(state, 1200);
  assert.equal(state.bullets.length, 0);

  shootBullet(state, 1000 + SHOOT_INTERVAL + 1);
  assert.equal(state.bullets.length, 1);
});

test("shootBullet は bulletCount に応じて複数弾を生成する", () => {
  const state = createInitialState(0);
  state.bulletCount = 3;
  state.lastShotTime = 0;

  shootBullet(state, SHOOT_INTERVAL + 1);
  assert.equal(state.bullets.length, 3);
});

test("updateBullets は弾を上へ移動し、画面外の弾を削除する", () => {
  const state = createInitialState(0);
  state.bullets = [
    { x: 0, y: 10, width: 6, height: 14 },
    { x: 0, y: -20, width: 6, height: 14 },
  ];

  updateBullets(state);
  assert.equal(state.bullets.length, 1);
  assert.equal(state.bullets[0].y, 10 - BULLET_SPEED);
});

test("updateDifficulty は難易度を段階的に上げ、上限を超えない", () => {
  const state = createInitialState(0);
  state.startTime = 0;

  updateDifficulty(state, DIFFICULTY_SETTINGS.intervalMs * 100);

  assert.equal(state.difficultyLevel, 100);
  assert.equal(state.enemySpawnRate, DIFFICULTY_SETTINGS.spawnRateMax);
  assert.equal(
    state.enemySpeed,
    ENEMY_BASE_SPEED + DIFFICULTY_SETTINGS.speedMaxBonus,
  );
  assert.equal(state.enemySwayChance, DIFFICULTY_SETTINGS.swayChanceMax);
});

test("spawnEnemy は random 値が出現率未満なら敵を生成する", () => {
  const state = createInitialState(0);
  state.enemySpawnRate = 0.5;

  const originalRandom = Math.random;
  Math.random = () => 0.1;
  spawnEnemy(state);
  Math.random = originalRandom;

  assert.equal(state.enemies.length, 1);
  assert.equal(typeof state.enemies[0].spawnX, "number");
  assert.equal(typeof state.enemies[0].age, "number");
});

test("spawnEnemy は enemySwayChance に基づき蛇行敵を生成する", () => {
  const state = createInitialState(0);
  state.enemySpawnRate = 1.0;
  state.enemySwayChance = 0.5;

  const originalRandom = Math.random;
  let callCount = 0;
  // 1回目: spawnRate判定(0.0 < 1.0 で通過), 2回目: spawnX, 3回目: sway判定(0.0 < 0.5 で蛇行)
  Math.random = () => {
    callCount++;
    return 0.0;
  };
  spawnEnemy(state);
  Math.random = originalRandom;

  assert.equal(state.enemies[0].swayAmplitude, ENEMY_SWAY_AMPLITUDE);
  assert.equal(state.enemies[0].swaySpeed, ENEMY_SWAY_SPEED);
});

test("spawnEnemy は sway 判定が閾値以上なら直進敵を生成する", () => {
  const state = createInitialState(0);
  state.enemySpawnRate = 1.0;
  state.enemySwayChance = 0.5;

  const originalRandom = Math.random;
  let callCount = 0;
  // 1回目: spawnRate判定, 2回目: spawnX, 3回目: sway判定(0.9 >= 0.5 で直進)
  Math.random = () => {
    callCount++;
    return callCount === 3 ? 0.9 : 0.0;
  };
  spawnEnemy(state);
  Math.random = originalRandom;

  assert.equal(state.enemies[0].swayAmplitude, 0);
  assert.equal(state.enemies[0].swaySpeed, 0);
});

test("updateEnemies は蛇行敵の x を sin で横にずらす", () => {
  const state = createInitialState(0);
  const spawnX = GAME_WIDTH / 2;
  state.enemies = [
    {
      x: spawnX,
      y: 0,
      width: 28,
      height: 28,
      spawnX,
      swayAmplitude: ENEMY_SWAY_AMPLITUDE,
      swaySpeed: ENEMY_SWAY_SPEED,
      age: 0,
    },
  ];

  updateEnemies(state);

  const enemy = state.enemies[0];
  assert.equal(enemy.age, 1);
  const expectedX =
    spawnX + Math.sin(1 * ENEMY_SWAY_SPEED) * ENEMY_SWAY_AMPLITUDE;
  assert.ok(
    Math.abs(enemy.x - expectedX) < 0.001,
    `x should be close to ${expectedX}, got ${enemy.x}`,
  );
});

test("updateEnemies は直進敵の x を変えない", () => {
  const state = createInitialState(0);
  state.enemies = [
    {
      x: 100,
      y: 0,
      width: 28,
      height: 28,
      spawnX: 100,
      swayAmplitude: 0,
      swaySpeed: 0,
      age: 0,
    },
  ];

  updateEnemies(state);

  assert.equal(state.enemies[0].x, 100);
});

test("spawnPowerUp は間隔を満たし、かつ既存アイテムが無い時のみ生成する", () => {
  const state = createInitialState(0);
  state.lastPowerUpSpawnTime = 0;

  spawnPowerUp(state, 1000);
  assert.equal(state.powerUps.length, 0);

  spawnPowerUp(state, 12001);
  assert.equal(state.powerUps.length, 1);

  spawnPowerUp(state, 24002);
  assert.equal(state.powerUps.length, 1);
});

test("handleCollisions は敵撃破時にスコア加算と演出追加を行う", () => {
  const state = createInitialState(0);
  state.bullets = [{ x: 10, y: 10, width: 6, height: 14 }];
  state.enemies = [{ x: 8, y: 8, width: 28, height: 28 }];

  const result = handleCollisions(state);

  assert.equal(result.scoreChanged, true);
  assert.equal(result.playerHit, false);
  assert.equal(state.score, 10);
  assert.equal(state.bullets.length, 0);
  assert.equal(state.enemies.length, 0);
  assert.equal(
    state.effects.some((effect) => effect.type === "enemy"),
    true,
  );
});

test("handleCollisions はパワーアップ取得で弾数を増やし、上限で止める", () => {
  const state = createInitialState(0);
  state.bulletCount = MAX_BULLET_COUNT - 1;
  state.powerUps = [
    {
      x: state.player.x,
      y: state.player.y,
      width: 18,
      height: 18,
    },
  ];

  handleCollisions(state);

  assert.equal(state.bulletCount, MAX_BULLET_COUNT);
  assert.equal(state.powerUps.length, 0);
  assert.equal(
    state.effects.some((effect) => effect.type === "powerup"),
    true,
  );
});

test("handleCollisions はプレイヤー被弾を検知し演出を追加する", () => {
  const state = createInitialState(0);
  state.enemies = [{ ...state.player }];

  const result = handleCollisions(state);

  assert.equal(result.playerHit, true);
  assert.equal(
    state.effects.some((effect) => effect.type === "player"),
    true,
  );
});

test("updateEffects は寿命を減らし、0以下を削除する", () => {
  const state = createInitialState(0);
  state.effects = [
    { x: 0, y: 0, size: 10, life: 2, maxLife: 2, type: "enemy" },
    { x: 0, y: 0, size: 10, life: 1, maxLife: 1, type: "enemy" },
  ];

  updateEffects(state);

  assert.equal(state.effects.length, 1);
  assert.equal(state.effects[0].life, 1);
});

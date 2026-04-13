import assert from "node:assert/strict";
import test from "node:test";

import {
  DIFFICULTY_SETTINGS,
  ENEMY_BASE_SPEED,
  MAX_BULLET_SPEED,
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
} from "../js/systems.js";

test("shootBullet は発射間隔を満たした時だけ弾を追加する", () => {
  const state = createInitialState(0);
  state.lastShotTime = 1000;

  shootBullet(state, 1200);
  assert.equal(state.bullets.length, 0);

  shootBullet(state, 1000 + SHOOT_INTERVAL + 1);
  assert.equal(state.bullets.length, 1);
});

test("updateBullets は弾を上へ移動し、画面外の弾を削除する", () => {
  const state = createInitialState(0);
  state.bullets = [
    { x: 0, y: 10, width: 6, height: 14 },
    { x: 0, y: -20, width: 6, height: 14 },
  ];

  updateBullets(state);
  assert.equal(state.bullets.length, 1);
  assert.equal(state.bullets[0].y, 3);
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
});

test("spawnEnemy は random 値が出現率未満なら敵を生成する", () => {
  const state = createInitialState(0);
  state.enemySpawnRate = 0.5;

  const originalRandom = Math.random;
  Math.random = () => 0.1;
  spawnEnemy(state);
  Math.random = originalRandom;

  assert.equal(state.enemies.length, 1);
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

test("handleCollisions はパワーアップ取得で弾速を上げ、上限で止める", () => {
  const state = createInitialState(0);
  state.bulletSpeed = MAX_BULLET_SPEED - 0.1;
  state.powerUps = [
    {
      x: state.player.x,
      y: state.player.y,
      width: 18,
      height: 18,
    },
  ];

  handleCollisions(state);

  assert.equal(state.bulletSpeed, MAX_BULLET_SPEED);
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

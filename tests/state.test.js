import assert from "node:assert/strict";
import test from "node:test";

import {
  BULLET_SPEED,
  DIFFICULTY_SETTINGS,
  ENEMY_BASE_SPEED,
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
} from "../js/constants.js";
import { createInitialState } from "../js/state.js";

test("createInitialState は期待どおりの初期値を返す", () => {
  const highScore = 123;
  const state = createInitialState(highScore);

  assert.equal(state.highScore, highScore);
  assert.equal(state.score, 0);
  assert.equal(state.isGameOver, false);
  assert.equal(state.hasStarted, false);
  assert.equal(state.gameWidth, GAME_WIDTH);
  assert.equal(state.bulletSpeed, BULLET_SPEED);
  assert.equal(state.enemySpeed, ENEMY_BASE_SPEED);
  assert.equal(state.enemySpawnRate, DIFFICULTY_SETTINGS.spawnRateStart);
  assert.deepEqual(state.bullets, []);
  assert.deepEqual(state.enemies, []);
  assert.deepEqual(state.powerUps, []);
  assert.deepEqual(state.effects, []);
  assert.deepEqual(state.keys, { left: false, right: false });

  assert.deepEqual(state.player, {
    x: (GAME_WIDTH - PLAYER_WIDTH) / 2,
    y: GAME_HEIGHT - PLAYER_HEIGHT - 16,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  });
});

test("createInitialState はカスタム gameWidth を反映する", () => {
  const customWidth = 400;
  const state = createInitialState(0, customWidth);

  assert.equal(state.gameWidth, customWidth);
  assert.equal(state.player.x, (customWidth - PLAYER_WIDTH) / 2);
});

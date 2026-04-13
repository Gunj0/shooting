import assert from "node:assert/strict";
import test from "node:test";

import { HIGH_SCORE_STORAGE_KEY } from "../js/constants.js";
import { loadHighScore, saveHighScore } from "../js/storage.js";

function createMockStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    clear() {
      data.clear();
    },
  };
}

test("loadHighScore は未保存時に 0 を返す", () => {
  const localStorage = createMockStorage();
  globalThis.window = { localStorage };

  assert.equal(loadHighScore(), 0);
});

test("saveHighScore の保存値を loadHighScore で読める", () => {
  const localStorage = createMockStorage();
  globalThis.window = { localStorage };

  saveHighScore(456);
  assert.equal(localStorage.getItem(HIGH_SCORE_STORAGE_KEY), "456");
  assert.equal(loadHighScore(), 456);
});

test("loadHighScore は不正値を 0 として扱う", () => {
  const localStorage = createMockStorage();
  globalThis.window = { localStorage };
  localStorage.setItem(HIGH_SCORE_STORAGE_KEY, "not-a-number");

  assert.equal(loadHighScore(), 0);
});

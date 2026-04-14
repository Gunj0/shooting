/**
 * script.js のタップ操作（touchstart）に関するインテグレーションテスト。
 *
 * Node.js 環境には DOM が存在しないため、最小限のモック要素を使って
 * script.js を動的インポートし、イベントディスパッチで動作を検証する。
 */

import assert from "node:assert/strict";
import test from "node:test";

// --- モック DOM の構築 ---

class MockElement extends EventTarget {
  constructor() {
    super();
    this._classes = new Set();
    this.classList = {
      add: (c) => this._classes.add(c),
      remove: (c) => this._classes.delete(c),
      contains: (c) => this._classes.has(c),
    };
    this.textContent = "";
    this.innerHTML = "";
    this.style = {};
    this.offsetWidth = 0;
    this.className = "";
    this.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 300,
      height: 500,
    });
    this.appendChild = () => {};
  }
}

const mocks = {
  game: new MockElement(),
  score: new MockElement(),
  highScore: new MockElement(),
  difficulty: new MockElement(),
  finalScore: new MockElement(),
  titleOverlay: new MockElement(),
  gameOverOverlay: new MockElement(),
  restartButton: new MockElement(),
};

globalThis.document = {
  getElementById: (id) => mocks[id] ?? new MockElement(),
  createElement: () => new MockElement(),
};

globalThis.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  setTimeout: () => 0,
  clearTimeout: () => {},
  localStorage: {
    getItem: () => null,
    setItem: () => {},
  },
};

globalThis.performance = { now: () => 1000 };
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};

// --- script.js を動的インポート（setupGame() がここで呼ばれる） ---
await import("../js/script.js");

// --- テスト ---

test("タイトル画面のタップ前はゲームが開始していない", () => {
  // setupGame() → showTitle() でタイトルオーバーレイは表示状態（hidden クラスなし）
  assert.ok(
    !mocks.titleOverlay._classes.has("hidden"),
    "タイトルオーバーレイが表示されていること",
  );
});

test("タイトル画面への touchstart でゲームが開始する", () => {
  // タイトルオーバーレイに touchstart をディスパッチ
  const event = new Event("touchstart");
  event.preventDefault = () => {};
  mocks.titleOverlay.dispatchEvent(event);

  // startGame() → hideTitle() により hidden クラスが付与される
  assert.ok(
    mocks.titleOverlay._classes.has("hidden"),
    "タップ後にタイトルオーバーレイが非表示になること（ゲームが開始したこと）",
  );
});

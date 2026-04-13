import assert from "node:assert/strict";
import test from "node:test";

import { clamp, isColliding } from "../js/utils.js";

test("clamp は範囲外を丸める", () => {
  assert.equal(clamp(-1, 0, 10), 0);
  assert.equal(clamp(11, 0, 10), 10);
  assert.equal(clamp(5, 0, 10), 5);
});

test("isColliding は重なっている矩形を true と判定する", () => {
  const a = { x: 0, y: 0, width: 10, height: 10 };
  const b = { x: 8, y: 8, width: 10, height: 10 };
  assert.equal(isColliding(a, b), true);
});

test("isColliding は離れている矩形を false と判定する", () => {
  const a = { x: 0, y: 0, width: 10, height: 10 };
  const b = { x: 11, y: 0, width: 10, height: 10 };
  assert.equal(isColliding(a, b), false);
});

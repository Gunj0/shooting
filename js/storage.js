import { HIGH_SCORE_STORAGE_KEY } from "./constants.js";

export function loadHighScore() {
  const rawValue = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
  const parsed = Number.parseInt(rawValue ?? "0", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function saveHighScore(score) {
  window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(score));
}

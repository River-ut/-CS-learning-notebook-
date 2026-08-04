// ============================================================
// STATE — 运行时应用状态
// ============================================================
import { DEFAULT_SETTINGS } from './config.js';
import { Storage } from './storage.js';

export const state = {
  settings: Storage.getSettings()
};

export function loadState() {
  state.settings = Storage.getSettings();
}

export function saveState() {
  Storage.saveSettings(state.settings);
}

// ============================================================
// STORAGE — localStorage 持久化层
// ============================================================
import { DEFAULT_SETTINGS } from './config.js';

export const Storage = {
  getNotes() {
    try {
      const raw = localStorage.getItem('cs_notebook_notes');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { console.warn('笔记数据损坏，已重置'); return []; }
  },

  saveNotes(notes) {
    try { localStorage.setItem('cs_notebook_notes', JSON.stringify(notes)); return true; }
    catch (e) {
      if (e.name === 'QuotaExceededError') {
        // toast 需要 UI 模块，这里仅打印警告，调用方负责提示用户
        console.warn('存储空间不足，请导出并清理旧笔记');
      }
      return false;
    }
  },

  getSettings() {
    try {
      const raw = localStorage.getItem('cs_notebook_settings');
      const saved = raw ? JSON.parse(raw) : {};
      return { ...DEFAULT_SETTINGS, ...saved };
    } catch (e) { return { ...DEFAULT_SETTINGS }; }
  },

  saveSettings(s) { localStorage.setItem('cs_notebook_settings', JSON.stringify(s)); },

  getNoteById(id) { return this.getNotes().find(n => n.id === id) || null; },

  getCustomCategories() {
    try {
      const raw = localStorage.getItem('cs_notebook_custom_cats');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  },

  saveCustomCategories(cats) {
    localStorage.setItem('cs_notebook_custom_cats', JSON.stringify(cats));
  }
};

// ============================================================
// CATEGORIES — 分类访问器（打破 config ↔ storage 循环依赖）
// ============================================================
import { CATEGORIES } from './config.js';
import { Storage } from './storage.js';

export function getAllCategories() {
  const custom = Storage.getCustomCategories();
  return [...CATEGORIES, ...custom];
}

export function getCategoryById(id) {
  return getAllCategories().find(c => c.id === id);
}

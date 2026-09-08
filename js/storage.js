// ============================================================
// STORAGE — 数据持久化层
// 笔记 + 自定义分类 → Supabase（云端，跨设备同步）
// 设置（排序/分栏/侧边栏等设备偏好）→ localStorage（每设备独立）
// ============================================================
import { DEFAULT_SETTINGS } from './config.js';
import { supabase, noteToRow, rowToNote } from './supabase.js';

// 自定义分类的内存缓存（登录后由 loadCustomCategories 填充，供同步读取）
let _customCategories = [];

export const Storage = {
  // ========== 笔记（Supabase） ==========

  async getNotes() {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToNote);
  },

  async upsertNote(note) {
    const { error } = await supabase.from('notes').upsert(noteToRow(note), { onConflict: 'id' });
    if (error) throw error;
  },

  async deleteNote(id) {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
  },

  // ========== 自定义分类（Supabase + 内存缓存） ==========

  async loadCustomCategories() {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) throw error;
    _customCategories = (data || []).map(c => ({ id: c.id, name: c.name, icon: c.icon }));
    return _customCategories;
  },

  getCustomCategories() {
    return _customCategories;
  },

  async addCustomCategory(cat) {
    const { error } = await supabase.from('categories').insert({ id: cat.id, name: cat.name, icon: cat.icon });
    if (error) throw error;
    _customCategories.push(cat);
  },

  async removeCustomCategory(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    _customCategories = _customCategories.filter(c => c.id !== id);
  },

  // 导入备份：笔记按 id 幂等 upsert；分类只添加不存在的（避免主键冲突）
  async importBackup({ notes, categories }) {
    let noteCount = 0, catCount = 0;
    for (const n of notes) {
      await this.upsertNote(n);
      noteCount++;
    }
    await this.loadCustomCategories();
    const existing = new Set(_customCategories.map(c => c.id));
    for (const c of categories) {
      if (existing.has(c.id)) continue;
      await this.addCustomCategory(c);
      catCount++;
    }
    return { notes: noteCount, categories: catCount };
  },

  resetCategories() {
    _customCategories = [];
  },

  // ========== 设置（localStorage，保持不变） ==========

  getSettings() {
    try {
      const raw = localStorage.getItem('cs_notebook_settings');
      const saved = raw ? JSON.parse(raw) : {};
      return { ...DEFAULT_SETTINGS, ...saved };
    } catch (e) { return { ...DEFAULT_SETTINGS }; }
  },

  saveSettings(s) { localStorage.setItem('cs_notebook_settings', JSON.stringify(s)); }
};

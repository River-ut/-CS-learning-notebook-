// ============================================================
// NOTES — 笔记业务逻辑（内存数组 + 增量云端同步）
// ============================================================
import { uuid } from './utils.js';
import { Storage } from './storage.js';

export const Notes = {
  _notes: [],
  _activeId: null,
  _dirty: new Set(),

  async init() {
    this._notes = await Storage.getNotes();
  },

  reset() {
    this._notes = [];
    this._activeId = null;
    this._dirty.clear();
  },

  all() { return this._notes; },

  get(id) { return this._notes.find(n => n.id === id) || null; },

  create(categoryId) {
    const cat = categoryId && categoryId !== 'all' ? categoryId : 'ds-algo';
    const note = {
      id: uuid(), title: '', category: cat, content: '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isPinned: false
    };
    this._notes.unshift(note);
    this._activeId = note.id;
    this._dirty.add(note.id);
    // 不在此立即入库：由调用方（如 _loadFileContent）在填充内容后统一 flushPersist，
    // 避免「空内容」与「真实内容」两次 upsert 并发导致后者被覆盖。
    return note;
  },

  update(id, fields) {
    const note = this._notes.find(n => n.id === id);
    if (!note) return;
    Object.assign(note, fields, { updatedAt: new Date().toISOString() });
    this._dirty.add(id);
    // Actual persistence handled by UI._scheduleAutoSave (debounced 800ms)
  },

  async delete(id) {
    const idx = this._notes.findIndex(n => n.id === id);
    if (idx === -1) return;
    this._notes.splice(idx, 1);
    this._dirty.delete(id);
    if (this._activeId === id) this._activeId = null;
    try {
      await Storage.deleteNote(id);
    } catch (e) {
      console.error('删除笔记失败', e);
    }
  },

  togglePin(id) {
    const note = this._notes.find(n => n.id === id);
    if (!note) return;
    note.isPinned = !note.isPinned;
    this._dirty.add(id);
    this.flushPersist();
  },

  getFiltered(settings) {
    const { activeCategory, searchQuery, sortBy, sortOrder } = settings;
    let filtered = [...this._notes];
    if (activeCategory && activeCategory !== 'all') {
      filtered = filtered.filter(n => n.category === activeCategory);
    }
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
    }
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      let cmp = 0;
      if (sortBy === 'title') {
        cmp = (a.title || '无标题').localeCompare(b.title || '无标题', 'zh-CN');
      } else {
        cmp = new Date(a[sortBy]).getTime() - new Date(b[sortBy]).getTime();
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return filtered;
  },

  async flushPersist() {
    const dirty = [...this._dirty];
    this._dirty.clear();
    const notes = dirty.map(id => this.get(id)).filter(Boolean);
    for (const note of notes) {
      try {
        await Storage.upsertNote(note);
      } catch (e) {
        console.error('保存笔记失败', e);
        this._dirty.add(note.id); // 失败重新标记，下次重试
      }
    }
  }
};

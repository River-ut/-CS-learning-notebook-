// ============================================================
// NOTES — 笔记业务逻辑
// ============================================================
import { uuid } from './utils.js';
import { SAMPLE_NOTES } from './config.js';
import { Storage } from './storage.js';

export const Notes = {
  _notes: [],
  _activeId: null,
  _dirty: false,

  init() {
    this._notes = Storage.getNotes();
    if (this._notes.length === 0 && !localStorage.getItem('cs_notebook_seeded')) {
      this._notes = SAMPLE_NOTES.map(n => ({ ...n }));
      localStorage.setItem('cs_notebook_seeded', '1');
      this._persist();
    }
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
    this._persist();
    return note;
  },

  update(id, fields) {
    const note = this._notes.find(n => n.id === id);
    if (!note) return;
    Object.assign(note, fields, { updatedAt: new Date().toISOString() });
    this._dirty = true;
    // Actual persistence handled by UI._scheduleAutoSave (debounced 800ms)
  },

  delete(id) {
    const idx = this._notes.findIndex(n => n.id === id);
    if (idx === -1) return;
    this._notes.splice(idx, 1);
    if (this._activeId === id) this._activeId = null;
    this._persist();
  },

  togglePin(id) {
    const note = this._notes.find(n => n.id === id);
    if (!note) return;
    note.isPinned = !note.isPinned;
    this._persist();
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

  _persist() { Storage.saveNotes(this._notes); this._dirty = false; },

  flushPersist() { if (this._dirty) this._persist(); }
};

(function() { 'use strict';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function formatDate(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatRelative(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} 天前`;
  return formatDate(iso);
}

function escapeHTML(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str).replace(/[&<>"']/g, c => map[c]);
}

function truncate(str, len) {
  const s = String(str).replace(/\s+/g, ' ').trim();
  return s.length > len ? s.slice(0, len) + '…' : s;
}

function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

function sanitizeFilename(str) {
  return str.replace(/[\\/:*?"<>|]/g, '_').trim() || '笔记';
}

// ============================================================
// DATA
// ============================================================
const CATEGORIES = [
  { id: 'all',      name: '全部分类',          icon: '📁' },
  { id: 'ds-algo',  name: '数据结构与算法',     icon: '🌳' },
  { id: 'os',       name: '操作系统',           icon: '💻' },
  { id: 'network',  name: '计算机网络',         icon: '🌐' },
  { id: 'database', name: '数据库',             icon: '🗄️' },
  { id: 'prog-lang',name: '编程语言',           icon: '⌨️' },
  { id: 'comp-org', name: '计算机组成原理',      icon: '🔧' },
  { id: 'sw-eng',   name: '软件工程',           icon: '🏗️' },
  { id: 'design-pt',name: '设计模式',           icon: '📐' },
  { id: 'compiler', name: '编译原理',           icon: '⚙️' },
  { id: 'arch',     name: '计算机体系结构',      icon: '🖥️' },
  { id: 'ai-ml',    name: '人工智能/机器学习',   icon: '🧠' },
  { id: 'security', name: '信息安全',           icon: '🔒' },
  { id: 'other',    name: '其他',               icon: '📝' }
];

const AVAILABLE_ICONS = ["📁","🌳","💻","🌐","🗄️","⌨️","🔧","🏗️","📐","⚙️","🖥️","🧠","🔒","📝","📚","📖","✏️","🎓","📊","📈","🔬","🎯","💡","⭐","🔥","🚀","💎","🎨","🔗","📌","🗂️","🧮","📡","🛠️","🤖","🐍","☕","🦀","🐘","⚛️","🐳","🔷","🟢","🟠"];
function getAllCategories() {
  const custom = Storage.getCustomCategories();
  return [...CATEGORIES, ...custom];
}
function getCategoryById(id) {
  return getAllCategories().find(c => c.id === id);
}

const DEFAULT_SETTINGS = {
  activeNoteId: null, activeCategory: 'all', searchQuery: '',
  sortBy: 'updatedAt', sortOrder: 'desc', sidebarOpen: true,
  editorSplitRatio: 0.5, vSplitRatio: 0.3
};

const SAMPLE_NOTES = [
  {
    id: uuid(),
    title: '快速排序算法分析',
    category: 'ds-algo',
    content: '## 快速排序 (Quick Sort)\n\n快速排序是一种**分治算法**，由 C.A.R. Hoare 于 1960 年提出。\n\n### 核心思想\n\n1. 选择一个 **基准元素** (pivot)\n2. 将数组分为两部分：小于 pivot 的放左边，大于的放右边\n3. 递归地对左右两部分排序\n\n```python\ndef quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)\n```\n\n### 复杂度\n\n| 情况 | 时间复杂度 |\n|------|-----------|\n| 最好 | O(n log n) |\n| 平均 | O(n log n) |\n| 最坏 | O(n²) |\n\n> 实际应用中通常比归并排序更快，因为常数因子更小。',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    isPinned: true
  },
  {
    id: uuid(),
    title: '进程与线程的区别',
    category: 'os',
    content: '## 进程 vs 线程\n\n### 进程 (Process)\n- 操作系统**资源分配**的基本单位\n- 拥有独立的地址空间、内存、文件描述符\n- 进程间通信 (IPC) 开销较大\n\n### 线程 (Thread)\n- CPU **调度执行**的基本单位\n- 同一进程内的线程共享地址空间\n- 线程切换开销远小于进程切换\n\n### 关键区别\n\n| 维度 | 进程 | 线程 |\n|------|------|------|\n| 资源 | 独立 | 共享 |\n| 创建开销 | 大 | 小 |\n| 通信 | IPC (管道/消息队列/共享内存) | 直接读写共享变量 |\n| 隔离性 | 强 | 弱 |\n\n> 一个进程崩溃不会影响其他进程；一个线程崩溃可能拖垮整个进程。',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    isPinned: false
  },
  {
    id: uuid(),
    title: 'B+树索引原理',
    category: 'database',
    content: '## B+ 树索引\n\nB+ 树是数据库索引最常用的数据结构。\n\n### 结构特点\n- 所有**数据只存储在叶子节点**\n- 非叶子节点仅存储索引键用于导航\n- 叶子节点之间用链表连接，支持范围查询\n\n### 为什么用 B+ 树？\n\n1. **磁盘 I/O 友好**：每个节点大小匹配一个磁盘页 (通常 4KB/16KB)\n2. **高扇出** (high fanout)：树的高度很低，查找只需 2-4 次 I/O\n3. **范围查询高效**：叶子链表可直接遍历\n\n### 与 B 树的区别\n- B 树所有节点都存储数据\n- B+ 树只在叶子存数据 → 非叶子能存更多索引键 → 树更矮\n\n```sql\n-- MySQL 创建 B+ 树索引\nCREATE INDEX idx_name ON users(name);\n\n-- 范围查询利用叶子链表\nSELECT * FROM users WHERE name BETWEEN \'A\' AND \'M\';\n```',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    isPinned: false
  }
];

// ============================================================
// STORAGE MANAGER
// ============================================================
const Storage = {
  getNotes() {
    try {
      const raw = localStorage.getItem('cs_notebook_notes');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { console.warn('笔记数据损坏，已重置'); return []; }
  },
  saveNotes(notes) {
    try { localStorage.setItem('cs_notebook_notes', JSON.stringify(notes)); return true; }
    catch (e) {
      if (e.name === 'QuotaExceededError') { UI.showToast('存储空间不足，请导出并清理旧笔记', 'error'); }
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
      const raw = localStorage.getItem("cs_notebook_custom_cats");
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  },
  saveCustomCategories(cats) {
    localStorage.setItem("cs_notebook_custom_cats", JSON.stringify(cats));
  }
};

// ============================================================
// MARKDOWN RENDERER
// ============================================================
const MD = {
  parse(text) {
    if (!text) return '<p style="color:var(--text-muted);font-style:italic;">开始输入 Markdown，这里会实时预览…</p>';
    const lines = text.split('\n');
    let html = '', i = 0, inList = false, listType = '';
    function closeList() {
      if (inList) { html += listType === 'ul' ? '</ul>\n' : '</ol>\n'; inList = false; listType = ''; }
    }
    while (i < lines.length) {
      const raw = lines[i];
      if (/^```/.test(raw)) {
        closeList();
        const lang = raw.slice(3).trim();
        html += '<pre data-lang="' + escapeHTML(lang || 'code') + '">'; i++;
        const codeLines = [];
        while (i < lines.length && !/^```/.test(lines[i])) { codeLines.push(lines[i]); i++; }
        html += '<code>' + escapeHTML(codeLines.join('\n')) + '</code></pre>\n'; i++; continue;
      }
      if (/^\s*$/.test(raw)) { closeList(); html += '\n'; i++; continue; }
      if (/^[-*_]{3,}\s*$/.test(raw)) { closeList(); html += '<hr>\n'; i++; continue; }
      const hMatch = raw.match(/^(#{1,4})\s+(.*)/);
      if (hMatch) {
        closeList();
        const lv = hMatch[1].length;
        html += '<h' + lv + '>' + this.parseInline(hMatch[2]) + '</h' + lv + '>\n'; i++; continue;
      }
      if (/^>\s?/.test(raw)) {
        closeList();
        const qLines = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { qLines.push(lines[i].replace(/^>\s?/, '')); i++; }
        html += '<blockquote>' + this.parseInline(qLines.join('<br>')) + '</blockquote>\n'; continue;
      }
      const ulMatch = raw.match(/^(\s*)[-*+]\s+(.*)/);
      if (ulMatch) {
        if (!inList || listType !== 'ul') { closeList(); html += '<ul>\n'; inList = true; listType = 'ul'; }
        const taskMatch = ulMatch[2].match(/^\[(x| )\]\s+/i);
        const content = taskMatch ? ulMatch[2].replace(/^\[(x| )\]\s+/i, '') : ulMatch[2];
        const doneClass = taskMatch && taskMatch[1].toLowerCase() === 'x' ? ' class="task-done"' : '';
        html += '<li' + doneClass + '>' + this.parseInline(content) + '</li>\n'; i++; continue;
      }
      const olMatch = raw.match(/^(\s*)\d+[.)]\s+(.*)/);
      if (olMatch) {
        if (!inList || listType !== 'ol') { closeList(); html += '<ol>\n'; inList = true; listType = 'ol'; }
        html += '<li>' + this.parseInline(olMatch[2]) + '</li>\n'; i++; continue;
      }
      if (/^\|.+\|/.test(raw) && lines[i+1] && /^\|[\s\-:|]+\|/.test(lines[i+1])) {
        closeList();
        const hCells = raw.split('|').filter(c => c.trim());
        html += '<table>\n<thead>\n<tr>\n';
        hCells.forEach(c => { html += '<th>' + this.parseInline(c.trim()) + '</th>\n'; });
        html += '</tr>\n</thead>\n<tbody>\n'; i += 2;
        while (i < lines.length && /^\|.+\|/.test(lines[i])) {
          const cells = lines[i].split('|').filter(c => c.trim());
          html += '<tr>\n';
          cells.forEach(c => { html += '<td>' + this.parseInline(c.trim()) + '</td>\n'; });
          html += '</tr>\n'; i++;
        }
        html += '</tbody>\n</table>\n'; continue;
      }
      closeList();
      const pLines = [];
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,4}\s|```|>\s?|[-*+]\s+|\d+[.)]\s+|\|)/.test(lines[i]) && !/^[-*_]{3,}\s*$/.test(lines[i])) {
        pLines.push(lines[i]); i++;
      }
if (pLines.length > 0) {
        html += '<p>' + this.parseInline(pLines.join('<br>')) + '</p>\n';
      } else {
        // Safety: line matched exclusion pattern but no handler consumed it
        i++;
      }
    }
    closeList();
    return html;
  },

  parseInline(text) {
    let t = escapeHTML(text);
    t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
    t = t.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
    t = t.replace(/__(.+?)__/g, '<strong>$1</strong>');
    t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    t = t.replace(/_([^_]+)_/g, '<em>$1</em>');
    t = t.replace(/~~(.+?)~~/g, '<del>$1</del>');
    return t;
  }
};

// ============================================================
// NOTE MANAGER
// ============================================================
const Notes = {
  _notes: [], _activeId: null, _dirty: false,

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

// ============================================================
// STATE
// ============================================================
const S = { settings: Storage.getSettings() };

// ============================================================
// UI MANAGER
// ============================================================
const UI = {
  _dom: {},

  init() {
    const ids = [
      'sidebar','searchInput','clearSearch','categoryList','statsDisplay',
      'btnToggleSidebar','btnNewNote','btnAddCategory','btnOpenFile','btnExport','sortSelect','noteList','noteListWrap',
      'editorPanel','noteTitle','noteCategory','editorTextarea','previewContent','paneDivider',
      'saveStatus','lastSavedTime','btnSaveNote','btnDeleteNote',
      'btnFormatBold','btnFormatItalic','btnFormatCode',
      'vPaneDivider','btnPreviewFullscreen',
      'categoryDialog','catNameInput','catOk','catCancel','fileInput','fileIndicator','fileNameDisplay','confirmDialog','confirmTitle','confirmMsg','confirmCancel','confirmOk',
      'exportDialog','exportScope','exportFormat','exportCancel','exportOk',
      'toastContainer','sidebarOverlay'
    ];
    ids.forEach(id => { this._dom[id] = document.getElementById(id); });

    if (S.settings.editorSplitRatio) {
      const r = S.settings.editorSplitRatio;
      this._dom.editorTextarea.style.flex = r;
      this._dom.previewContent.parentElement.style.flex = 1 - r;
    }

    this._renderCategorySelect();
    this._renderSidebar();

    if (S.settings.activeNoteId) {
      const note = Notes.get(S.settings.activeNoteId);
      if (note) { Notes._activeId = note.id; this._openEditor(note.id); }
    } else {
      this._dom.noteListWrap.style.flex = '1';
      this._dom.editorPanel.style.flex = '';
    }

    this._renderNoteList();
    this._bindEvents();

    if (window.innerWidth <= 768) {
      this._dom.sidebar.classList.remove('open');
      this._dom.sidebarOverlay.classList.remove('open');
    }
    this._dom.sortSelect.value = S.settings.sortBy + '-' + S.settings.sortOrder;
  },

  _renderSidebar() {
    const counts = {};
    Notes.all().forEach(n => { counts[n.category] = (counts[n.category] || 0) + 1; });
    let html = '';
    const customCats = Storage.getCustomCategories();
    const customIds = new Set(customCats.map(c => c.id));
    getAllCategories().forEach(c => {
      let count = c.id === 'all' ? Notes.all().length : (counts[c.id] || 0);
      const active = S.settings.activeCategory === c.id ? ' active' : '';
      const delBtn = customIds.has(c.id) ? '<button class="del-cat-btn" data-action="del-cat" data-cat="' + c.id + '" title="删除此分类">✕</button>' : '';
      html += '<div class="cat-item' + active + '" data-cat="' + c.id + '"><span class="cat-icon">' + c.icon + '</span><span>' + c.name + '</span><span class="cat-count">' + count + '</span>' + delBtn + '</div>';
    });
    this._dom.categoryList.innerHTML = html;
    this._dom.statsDisplay.textContent = '共 ' + Notes.all().length + ' 条笔记';
  },

  _updateStats() {
    this._dom.statsDisplay.textContent = '共 ' + Notes.all().length + ' 条笔记';
    this._renderSidebar();
  },

  _renderNoteList() {
    const notes = Notes.getFiltered(S.settings);
    const c = this._dom.noteList;
    if (notes.length === 0) {
      c.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><p>' + (S.settings.searchQuery ? '没有匹配的笔记' : '还没有笔记') + '</p><p class="hint">' + (S.settings.searchQuery ? '试试其他关键词' : '点击 "+ 新建笔记" 开始记录学习心得吧！') + '</p></div>';
      return;
    }
    c.innerHTML = notes.map(n => {
      const active = n.id === Notes._activeId ? ' active' : '';
      const title = n.title || '无标题';
      const titleClass = n.title ? '' : ' untitled';
      const cat = getAllCategories().find(cat => cat.id === n.category);
      const catName = cat ? cat.name : n.category;
      const preview = truncate(n.content.replace(/[#*`\[\]>\-|]/g, ''), 120);
      const time = formatRelative(n.updatedAt);
      return '<div class="note-card' + active + '" data-id="' + n.id + '"><div class="note-card-header">' + (n.isPinned ? '<span class="note-card-pin">📌</span>' : '') + '<span class="note-card-title' + titleClass + '">' + escapeHTML(title) + '</span><span class="note-card-cat">' + catName + '</span></div><div class="note-card-preview">' + escapeHTML(preview) + '</div><div class="note-card-meta"><span>' + time + '</span><span class="note-card-actions"><button class="pin-btn" data-action="pin" data-id="' + n.id + '" title="置顶">📌</button><button class="btn-del" data-action="delete-card" data-id="' + n.id + '" title="删除">🗑</button></span></div></div>';
    }).join('');
  },

  _renderCategorySelect() {
    this._dom.noteCategory.innerHTML = getAllCategories().filter(cat => cat.id !== 'all').map(cat => '<option value="' + cat.id + '">' + cat.icon + ' ' + cat.name + '</option>').join('');
  },

  _openEditor(noteId) {
    const note = Notes.get(noteId);
    if (!note) return;
    Notes._activeId = noteId;
    S.settings.activeNoteId = noteId;
    Storage.saveSettings(S.settings);
    this._dom.editorPanel.classList.add('open');
    this._dom.vPaneDivider.classList.add('visible');
    const vr = S.settings.vSplitRatio || 0.3;
    this._dom.noteListWrap.style.flex = '0 0 ' + (vr * 100) + '%';
    this._dom.editorPanel.style.flex = '1';
    this._dom.noteTitle.value = note.title;
    this._dom.noteCategory.value = note.category;
    this._dom.editorTextarea.value = note.content;
    this._dom.previewContent.innerHTML = MD.parse(note.content);
    this._dom.saveStatus.innerHTML = '✅ 已保存';
    this._dom.saveStatus.className = '';
    this._dom.lastSavedTime.textContent = formatDate(note.updatedAt);
    this._renderNoteList();
    setTimeout(() => this._dom.editorTextarea.focus(), 50);
  },

  _closeEditor() {
    Notes._activeId = null; S.settings.activeNoteId = null;
    Storage.saveSettings(S.settings);
    this._dom.editorPanel.classList.remove('open');
    this._dom.vPaneDivider.classList.remove('visible');
    this._dom.noteListWrap.style.flex = '1';
    this._dom.editorPanel.style.flex = '';
    this._dom.noteTitle.value = ''; this._dom.editorTextarea.value = '';
    this._dom.previewContent.innerHTML = '';
    this._fileHandle = null; this._fileName = null;
    this._dom.fileIndicator.style.display = 'none';
    this._renderNoteList();
  },

  _handleEditorInput() {
    const id = Notes._activeId;
    if (!id) return;
    const title = this._dom.noteTitle.value;
    const category = this._dom.noteCategory.value;
    const content = this._dom.editorTextarea.value;
    this._dom.previewContent.innerHTML = MD.parse(content);
    Notes.update(id, { title, category, content });
    this._dom.saveStatus.innerHTML = '💾 输入中…';
    this._dom.saveStatus.className = '';
    this._scheduleAutoSave();
  },

  _scheduleAutoSave: debounce(function() {
    Notes.flushPersist();
    this._markSaved(true);
  }, 800),

  _markSaved(isAuto) {
    this._dom.saveStatus.innerHTML = isAuto ? '✅ 已自动保存' : '✅ 已保存';
    if (this._fileHandle) {
      this._dom.saveStatus.innerHTML += ' 📄';
    }
    this._dom.saveStatus.className = '';
    const note = Notes.get(Notes._activeId);
    if (note) this._dom.lastSavedTime.textContent = formatDate(note.updatedAt);
    this._updateStats(); this._renderNoteList();
  },

  _showConfirm(title, msg, cb) {
    this._dom.confirmTitle.textContent = title;
    this._dom.confirmMsg.textContent = msg;
    this._dom.confirmDialog.classList.add('open');
    this._dom.confirmOk.onclick = () => { this._dom.confirmDialog.classList.remove('open'); cb(); };
    this._dom.confirmCancel.onclick = () => { this._dom.confirmDialog.classList.remove('open'); };
  },

  _showExport() {
    if (Notes.all().length === 0) { this.showToast('没有可导出的笔记', 'info'); return; }
    this._dom.exportDialog.classList.add('open');
  },

  _doExport() {
    const scope = this._dom.exportScope.value, format = this._dom.exportFormat.value;
    let notes = [];
    if (scope === 'current' && Notes._activeId) { const n = Notes.get(Notes._activeId); if (n) notes = [n]; }
    else if (scope === 'category') { notes = Notes.getFiltered(S.settings); }
    else { notes = Notes.all(); }

    if (notes.length === 0) { this.showToast('没有可导出的笔记', 'info'); this._dom.exportDialog.classList.remove('open'); return; }

    let content = '', ext = '.txt', mime = 'text/plain';
    if (format === 'md') {
      ext = '.md'; mime = 'text/markdown';
      content = notes.map(n => {
        const cat = getAllCategories().find(cat => cat.id === n.category);
        return '# ' + (n.title || '无标题') + '\n\n> 分类: ' + (cat ? cat.name : n.category) + ' | 更新: ' + formatDate(n.updatedAt) + '\n\n' + n.content + '\n\n---\n';
      }).join('\n');
    } else {
      content = notes.map(n => {
        const cat = getAllCategories().find(cat => cat.id === n.category);
        return '【' + (n.title || '无标题') + '】 分类: ' + (cat ? cat.name : n.category) + ' | ' + formatDate(n.updatedAt) + '\n' + n.content + '\n\n' + '='.repeat(40) + '\n';
      }).join('\n');
    }

    const filename = scope === 'current' ? sanitizeFilename(notes[0]?.title || '笔记') + ext : 'CS笔记_' + formatDate(new Date().toISOString()).replace(/[: ]/g, '_') + ext;
    const blob = new Blob(['﻿' + content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    this._dom.exportDialog.classList.remove('open');
    this.showToast('已导出 ' + notes.length + ' 条笔记', 'success');
  },

  showToast(msg, type) {
    type = type || 'info';
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<span>' + (icons[type] || '') + '</span> ' + msg;
    this._dom.toastContainer.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideOut 0.2s ease-in forwards'; setTimeout(() => toast.remove(), 200); }, 2500);
  },

  _wrapSelection(wrapper) {
    const ta = this._dom.editorTextarea;
    const start = ta.selectionStart, end = ta.selectionEnd;
    ta.setRangeText(wrapper + ta.value.substring(start, end) + wrapper, start, end, 'select');
    ta.focus(); this._handleEditorInput();
  },

  async _forceSave() {
    Notes.flushPersist();
    if (this._fileHandle) {
      const ok = await this._saveToFileHandle();
      if (ok) this.showToast('已保存到文件：' + this._fileName, 'success');
    } else {
      this.showToast('笔记已保存', 'success');
    }
    this._markSaved(false);
  },

  _deleteCategory(catId) {
    // Move notes in this category to 'other'
    const notes = Notes.all();
    notes.forEach(n => { if (n.category === catId) n.category = 'other'; });
    Notes._persist();
    // Remove custom category
    const custom = Storage.getCustomCategories();
    Storage.saveCustomCategories(custom.filter(c => c.id !== catId));
    // If currently filtering by this category, switch to 'all'
    if (S.settings.activeCategory === catId) {
      S.settings.activeCategory = 'all';
      Storage.saveSettings(S.settings);
    }
    this._renderSidebar(); this._renderNoteList();
    this._renderCategorySelect();
    // If editor is open and note was in deleted category, update select
    if (Notes._activeId) {
      const note = Notes.get(Notes._activeId);
      if (note && note.category === 'other') {
        this._dom.noteCategory.value = 'other';
      }
    }
    this.showToast('分类已删除，笔记已移到"其他"', 'info');
  },

  _showCategoryDialog() {
    const d = this._dom;
    const picker = document.getElementById('iconPicker');
    // Build icon grid
    const icons = typeof AVAILABLE_ICONS !== 'undefined' ? AVAILABLE_ICONS : ['📁','🌳','💻','🌐','🗄️','⌨️','🔧','🏗️','📐','⚙️','🖥️','🧠','🔒','📝','📚','📖','✏️','🎓','📊','📈','🔬','🎯','💡','⭐','🔥','🚀','💎','🎨','🔗','📌','🗂️','🧮','📡','🛠️','🤖','🐍','☕','🦀','🐘','⚛️','🐳','🔷','🟢','🟠'];
    let selIcon = '📁';
    picker.innerHTML = icons.map(ico => '<div class="icon-option" data-icon="' + ico + '">' + ico + '</div>').join('');
    // Selection handling
    const selectIcon = (el) => {
      picker.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected'); selIcon = el.dataset.icon;
    };
    picker.querySelectorAll('.icon-option').forEach(el => {
      el.addEventListener('click', () => selectIcon(el));
    });
    // Select first by default
    const first = picker.querySelector('.icon-option');
    if (first) selectIcon(first);

    document.getElementById('catNameInput').value = '';
    document.getElementById('categoryDialog').classList.add('open');
    document.getElementById('catNameInput').focus();

    // One-time bindings
    const catDialog = document.getElementById('categoryDialog');
    document.getElementById('catOk').onclick = () => {
      const name = document.getElementById('catNameInput').value.trim();
      if (!name) { this.showToast('请输入分类名称', 'error'); return; }
      const id = 'custom-' + Date.now();
      const custom = Storage.getCustomCategories();
      custom.push({ id, name, icon: selIcon });
      Storage.saveCustomCategories(custom);
      catDialog.classList.remove('open');
      this._renderSidebar(); this._renderCategorySelect();
      this._renderNoteList();
      this.showToast('分类已添加：' + name, 'success');
    };
    document.getElementById('catCancel').onclick = () => { catDialog.classList.remove('open'); };
    catDialog.addEventListener('click', e => { if (e.target === catDialog) catDialog.classList.remove('open'); });
  },

  _fileHandle: null,
  _fileName: null,

  // ========== File Operations ==========
  async _openFile() {
    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: '文本文件', accept: { 'text/*': ['.txt','.md','.js','.py','.c','.cpp','.java','.json','.xml','.csv','.html','.css','.ts','.rs','.go','.yaml','.yml','.toml','.ini','.cfg','.log','.sh','.bat','.ps1','.php','.rb','.swift','.kt','.scala','.sql','.r','.lua','.vim'] } }],
          multiple: false
        });
        const file = await handle.getFile();
        const text = await file.text();
        // Quick binary check: if > 10% null bytes in first 1000 chars, probably binary
        const sample = text.slice(0, 1000);
        const nullCount = (sample.match(/ /g) || []).length;
        if (nullCount > sample.length * 0.1) {
          this.showToast('看起来是二进制文件，已拒绝打开', 'error');
          return;
        }
        this._loadFileContent(file.name, text, handle);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('File open error:', err);
          // Permission or other error - fallback
          this._dom.fileInput.click();
        }
      }
    } else {
      this._dom.fileInput.click();
    }
  },

  _loadFileContent(fileName, content, fileHandle) {
    this._fileHandle = fileHandle || null;
    this._fileName = fileName;
    // Create a new note for the file content
    const note = Notes.create(S.settings.activeCategory);
    Notes.update(note.id, { title: fileName, content: content });
    Notes.flushPersist();
    this._openEditor(note.id);
    // Show file indicator
    this._dom.fileIndicator.style.display = 'flex';
    this._dom.fileNameDisplay.textContent = fileName;
    this.showToast('已打开文件：' + fileName, 'info');
  },

  async _saveToFileHandle() {
    if (!this._fileHandle) return false;
    try {
      const writable = await this._fileHandle.createWritable();
      await writable.write(this._dom.editorTextarea.value);
      await writable.close();
      return true;
    } catch (err) {
      console.error('File save error:', err);
      // Permission lost or file deleted - fallback to download
      this._downloadFile(this._fileName, this._dom.editorTextarea.value);
      this._fileHandle = null;
      this.showToast('无法写入原文件，已触发下载（权限可能已过期）', 'error');
      return false;
    }
  },

  _downloadFile(fileName, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  },

  _bindEvents() {
    const d = this._dom;

    d.searchInput.addEventListener('input', debounce(() => {
      const q = d.searchInput.value;
      S.settings.searchQuery = q; Storage.saveSettings(S.settings);
      d.clearSearch.classList.toggle('visible', q.length > 0);
      this._renderNoteList();
    }, 300));
    d.clearSearch.addEventListener('click', () => {
      d.searchInput.value = ''; S.settings.searchQuery = '';
      Storage.saveSettings(S.settings); d.clearSearch.classList.remove('visible');
      this._renderNoteList();
    });

    d.categoryList.addEventListener('click', e => {
      // Handle delete-category button clicks
      const delBtn = e.target.closest('.del-cat-btn');
      if (delBtn) {
        e.stopPropagation();
        const catId = delBtn.dataset.cat;
        const cat = getCategoryById(catId);
        this._showConfirm('删除分类？', '将删除分类"' + (cat ? cat.name : catId) + '"，该分类下的笔记将移到"其他"分类。', () => {
          this._deleteCategory(catId);
        });
        return;
      }
      const item = e.target.closest('.cat-item');
      if (!item) return;
      S.settings.activeCategory = item.dataset.cat;
      Storage.saveSettings(S.settings);
      this._renderSidebar(); this._renderNoteList();
      if (window.innerWidth <= 768) { d.sidebar.classList.remove('open'); d.sidebarOverlay.classList.remove('open'); }
    });

    d.noteList.addEventListener('click', e => {
      const card = e.target.closest('.note-card');
      if (!card || e.target.closest('button')) return;
      this._openEditor(card.dataset.id);
    });

    d.noteList.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action, id = btn.dataset.id;
      if (action === 'delete-card') {
        e.stopPropagation();
        const note = Notes.get(id);
        this._showConfirm('确认删除？', '将删除笔记"' + (note?.title || '无标题') + '"，此操作不可撤销。', () => {
          Notes.delete(id); if (Notes._activeId === id) this._closeEditor();
          this._updateStats(); this._renderNoteList();
          this.showToast('笔记已删除', 'info');
        });
      }
      if (action === 'pin') { e.stopPropagation(); Notes.togglePin(id); this._renderNoteList(); }
    });

    d.btnAddCategory.addEventListener('click', () => this._showCategoryDialog());

    d.btnOpenFile.addEventListener('click', () => this._openFile());
    d.fileInput.addEventListener('change', () => {
      const file = d.fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        this._loadFileContent(file.name, reader.result, null);
      };
      reader.onerror = () => this.showToast('读取文件失败', 'error');
      reader.readAsText(file);
      d.fileInput.value = '';
    });

    d.btnNewNote.addEventListener('click', () => {
      const note = Notes.create(S.settings.activeCategory);
      this._openEditor(note.id); this._updateStats(); this._renderNoteList();
    });
    d.btnExport.addEventListener('click', () => this._showExport());
    d.btnToggleSidebar.addEventListener('click', () => { d.sidebar.classList.toggle('open'); d.sidebarOverlay.classList.toggle('open'); });
    d.sidebarOverlay.addEventListener('click', () => { d.sidebar.classList.remove('open'); d.sidebarOverlay.classList.remove('open'); });

    d.sortSelect.addEventListener('change', () => {
      const [sortBy, sortOrder] = d.sortSelect.value.split('-');
      S.settings.sortBy = sortBy; S.settings.sortOrder = sortOrder;
      Storage.saveSettings(S.settings); this._renderNoteList();
    });

    d.noteTitle.addEventListener('input', () => this._handleEditorInput());
    d.editorTextarea.addEventListener('input', () => this._handleEditorInput());
    d.noteCategory.addEventListener('change', () => this._handleEditorInput());

    d.btnSaveNote.addEventListener('click', () => this._forceSave());

	    // Fullscreen preview toggle
	    d.btnPreviewFullscreen.addEventListener('click', () => {
	      const pane = d.previewContent.parentElement;
	      const isFullscreen = pane.classList.toggle('preview-fullscreen');
	      d.btnPreviewFullscreen.innerHTML = isFullscreen ? '✕' : '⛶';
	      d.btnPreviewFullscreen.title = isFullscreen ? '退出全屏' : '全屏预览';
	      if (isFullscreen) {
	        document.body.style.overflow = 'hidden';
	      } else {
	        document.body.style.overflow = '';
	      }
	    });
    d.btnDeleteNote.addEventListener('click', () => {
      if (!Notes._activeId) return;
      const note = Notes.get(Notes._activeId);
      this._showConfirm('确认删除？', '将删除笔记"' + (note?.title || '无标题') + '"，此操作不可撤销。', () => {
        const id = Notes._activeId;
        Notes.delete(id); this._closeEditor(); this._updateStats(); this._renderNoteList();
        this.showToast('笔记已删除', 'info');
      });
    });

    d.btnFormatBold.addEventListener('click', () => this._wrapSelection('**'));
    d.btnFormatItalic.addEventListener('click', () => this._wrapSelection('*'));
    d.btnFormatCode.addEventListener('click', () => {
      const ta = d.editorTextarea;
      const start = ta.selectionStart, end = ta.selectionEnd;
      const text = ta.value.substring(start, end);
      const wrapper = text.includes('\n') ? '\n```\n' : '`';
      ta.setRangeText(wrapper + text + wrapper, start, end, 'select');
      ta.focus(); this._handleEditorInput();
    });

    // Pane divider
    let dragging = false;
    d.paneDivider.addEventListener('mousedown', () => {
      dragging = true; d.paneDivider.classList.add('dragging');
      document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const rect = d.editorTextarea.parentElement.getBoundingClientRect();
      const ratio = Math.max(0.2, Math.min(0.8, (e.clientX - rect.left) / (rect.width - 4)));
      d.editorTextarea.style.flex = ratio; d.previewContent.parentElement.style.flex = 1 - ratio;
      S.settings.editorSplitRatio = ratio;
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false; d.paneDivider.classList.remove('dragging');
      document.body.style.cursor = ''; document.body.style.userSelect = '';
      Storage.saveSettings(S.settings);
    });

    // Vertical pane divider (note list <-> editor)
    let vDragging = false;
    d.vPaneDivider.addEventListener('mousedown', e => {
      if (!d.editorPanel.classList.contains('open')) return;
      vDragging = true; d.vPaneDivider.classList.add('dragging');
      document.body.style.cursor = 'row-resize'; document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!vDragging) return;
      const mainArea = d.noteListWrap.parentElement;
      const rect = mainArea.getBoundingClientRect();
      const toolbarH = 52;
      const usableTop = rect.top + toolbarH;
      const usableH = rect.height - toolbarH - 5;
      const mouseY = e.clientY - usableTop;
      const ratio = Math.max(0.1, Math.min(0.6, mouseY / usableH));
      d.noteListWrap.style.flex = '0 0 ' + (ratio * 100) + '%';
      d.editorPanel.style.flex = '1';
      S.settings.vSplitRatio = ratio;
    });
    document.addEventListener('mouseup', () => {
      if (!vDragging) return;
      vDragging = false; d.vPaneDivider.classList.remove('dragging');
      document.body.style.cursor = ''; document.body.style.userSelect = '';
      Storage.saveSettings(S.settings);
    });

    d.exportOk.addEventListener('click', () => this._doExport());
    d.exportCancel.addEventListener('click', () => d.exportDialog.classList.remove('open'));

    d.confirmDialog.addEventListener('click', e => { if (e.target === d.confirmDialog) d.confirmDialog.classList.remove('open'); });
    d.exportDialog.addEventListener('click', e => { if (e.target === d.exportDialog) d.exportDialog.classList.remove('open'); });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'n') { e.preventDefault(); const note = Notes.create(S.settings.activeCategory); this._openEditor(note.id); this._updateStats(); this._renderNoteList(); }
      if (ctrl && e.key === 's') { e.preventDefault(); this._forceSave(); }
      if (ctrl && e.key === 'f') { e.preventDefault(); d.searchInput.focus(); d.searchInput.select(); }
      if (ctrl && e.key === 'e') { e.preventDefault(); d.editorTextarea.focus(); }
      if (ctrl && e.key === 'b') { e.preventDefault(); this._wrapSelection('**'); }
      if (ctrl && e.key === 'i') { e.preventDefault(); this._wrapSelection('*'); }
      if (ctrl && e.key === '`') { e.preventDefault(); const ta = d.editorTextarea; const s2 = ta.selectionStart, e2 = ta.selectionEnd; ta.setRangeText('`' + ta.value.substring(s2, e2) + '`', s2, e2, 'select'); ta.focus(); this._handleEditorInput(); }
      if (e.key === 'Escape') {
	        // Exit fullscreen preview first
	        const previewPane = d.previewContent && d.previewContent.parentElement;
	        if (previewPane && previewPane.classList.contains('preview-fullscreen')) {
	          e.preventDefault();
	          previewPane.classList.remove('preview-fullscreen');
	          d.btnPreviewFullscreen.innerHTML = '⛶';
	          d.btnPreviewFullscreen.title = '全屏预览';
	          document.body.style.overflow = '';
	          return;
	        }
        if (d.confirmDialog.classList.contains('open')) { d.confirmDialog.classList.remove('open'); return; }
        if (document.getElementById('categoryDialog').classList.contains('open')) { document.getElementById('categoryDialog').classList.remove('open'); return; }
        if (d.exportDialog.classList.contains('open')) { d.exportDialog.classList.remove('open'); return; }
        if (document.activeElement === d.searchInput) { d.searchInput.blur(); return; }
        if (Notes._activeId) { this._closeEditor(); }
      }
    });

    window.addEventListener('beforeunload', () => Notes.flushPersist());

    window.addEventListener('storage', e => {
      if (e.key === 'cs_notebook_notes') {
        this.showToast('笔记已在其他标签页更新', 'info');
        Notes._notes = Storage.getNotes();
        this._renderNoteList(); this._updateStats();
        if (Notes._activeId) {
          const note = Notes.get(Notes._activeId);
          if (note) { d.noteTitle.value = note.title; d.noteCategory.value = note.category; d.editorTextarea.value = note.content; d.previewContent.innerHTML = MD.parse(note.content); }
        }
      }
    });
  }
};

// ============================================================
// BOOTSTRAP
// ============================================================
function init() { Notes.init(); UI.init(); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
else { init(); }

})();

// ============================================================
// UI — 界面渲染与事件处理
// ============================================================
import { debounce, formatDate, formatRelative, escapeHTML, truncate, sanitizeFilename } from './utils.js';
import { AVAILABLE_ICONS } from './config.js';
import { Storage } from './storage.js';
import { getAllCategories, getCategoryById } from './categories.js';
import { MD } from './markdown.js';
import { Notes } from './notes.js';
import { state, loadState, saveState } from './state.js';
import { processImageFile } from './images.js';

export const UI = {
  _dom: {},
  _fileHandle: null,
  _fileName: null,
  _bound: false,

  init() {
    const ids = [
      'sidebar','searchInput','clearSearch','categoryList','statsDisplay',
      'btnToggleSidebar','btnNewNote','btnAddCategory','btnOpenFile','btnImport','btnExport','sortSelect','noteList','noteListWrap',
      'editorPanel','noteTitle','noteCategory','editorTextarea','previewContent','paneDivider',
      'saveStatus','lastSavedTime','btnSaveNote','btnDeleteNote',
      'btnFormatBold','btnFormatItalic','btnFormatCode',
      'vPaneDivider','btnPreviewFullscreen',
      'categoryDialog','catNameInput','catOk','catCancel','fileInput','imageInput','importInput','fileIndicator','fileNameDisplay','confirmDialog','confirmTitle','confirmMsg','confirmCancel','confirmOk',
      'exportDialog','exportScope','exportFormat','exportCancel','exportOk',
      'toastContainer','sidebarOverlay',
      'btnInsertImage','imageViewer','imageViewerImg'
    ];
    ids.forEach(id => { this._dom[id] = document.getElementById(id); });

    if (state.settings.editorSplitRatio) {
      const r = state.settings.editorSplitRatio;
      this._dom.editorTextarea.style.flex = r;
      this._dom.previewContent.parentElement.style.flex = 1 - r;
    }

    this._renderCategorySelect();
    this._renderSidebar();

    if (state.settings.activeNoteId) {
      const note = Notes.get(state.settings.activeNoteId);
      if (note) { Notes._activeId = note.id; this._openEditor(note.id); }
    } else {
      this._dom.noteListWrap.style.flex = '1';
      this._dom.editorPanel.style.flex = '';
    }

    this._renderNoteList();
    if (!this._bound) { this._bindEvents(); this._bound = true; }

    if (window.innerWidth <= 768) {
      this._dom.sidebar.classList.remove('open');
      this._dom.sidebarOverlay.classList.remove('open');
    }
    this._dom.sortSelect.value = state.settings.sortBy + '-' + state.settings.sortOrder;
  },

  _renderSidebar() {
    const counts = {};
    Notes.all().forEach(n => { counts[n.category] = (counts[n.category] || 0) + 1; });
    let html = '';
    const customCats = Storage.getCustomCategories();
    const customIds = new Set(customCats.map(c => c.id));
    getAllCategories().forEach(c => {
      let count = c.id === 'all' ? Notes.all().length : (counts[c.id] || 0);
      const active = state.settings.activeCategory === c.id ? ' active' : '';
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
    const notes = Notes.getFiltered(state.settings);
    const c = this._dom.noteList;
    if (notes.length === 0) {
      c.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><p>' + (state.settings.searchQuery ? '没有匹配的笔记' : '还没有笔记') + '</p><p class="hint">' + (state.settings.searchQuery ? '试试其他关键词' : '点击 "+ 新建笔记" 开始记录学习心得吧！') + '</p></div>';
      return;
    }
    c.innerHTML = notes.map(n => {
      const active = n.id === Notes._activeId ? ' active' : '';
      const title = n.title || '无标题';
      const titleClass = n.title ? '' : ' untitled';
      const cat = getAllCategories().find(cat => cat.id === n.category);
      const catName = cat ? cat.name : n.category;
      const preview = truncate(n.content.replace(/!\[[^\]]*\]\([^)]*\)/g, '[图片]').replace(/[#*`\[\]>\-|]/g, ''), 120);
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
    state.settings.activeNoteId = noteId;
    saveState();
    this._dom.editorPanel.classList.add('open');
    this._dom.vPaneDivider.classList.add('visible');
    const vr = state.settings.vSplitRatio || 0.3;
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
    Notes._activeId = null; state.settings.activeNoteId = null;
    saveState();
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
    Notes.update(id, { title, category, content });
    this._dom.saveStatus.innerHTML = '💾 输入中…';
    this._dom.saveStatus.className = '';
    this._scheduleAutoSave();
    this._schedulePreview();
  },

  _scheduleAutoSave: debounce(async function () {
    await Notes.flushPersist();
    this._markSaved(true);
  }, 800),

  _schedulePreview: debounce(function () {
    if (!Notes._activeId) return;
    this._dom.previewContent.innerHTML = MD.parse(this._dom.editorTextarea.value);
  }, 150),

  _markSaved(isAuto) {
    if (Notes._dirty.size) {
      this._dom.saveStatus.textContent = '⚠ 尚有内容未保存，请重试保存或导出备份';
      return;
    }
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
    else if (scope === 'category') { notes = Notes.getFiltered(state.settings); }
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

  // ========== Image Insert ==========

  _insertImage() {
    if (!Notes._activeId) { this.showToast('请先打开或新建一篇笔记', 'info'); return; }
    this._dom.imageInput.click();
  },

  async _insertImageFile(file) {
    if (!Notes._activeId) { this.showToast('请先打开或新建一篇笔记', 'info'); return; }
    if (!file || !file.type || !file.type.startsWith('image/')) { this.showToast('请选择图片文件', 'error'); return; }
    this.showToast('正在处理图片…', 'info');
    try {
      const { dataUrl, width, height } = await processImageFile(file);
      this._insertMarkdown('![图片](' + dataUrl + ')');
      const mb = Math.round((dataUrl.length * 3 / 4 / 1024 / 1024) * 10) / 10;
      if (mb >= 1.5) {
        this.showToast('图片已插入（约 ' + mb + ' MB，' + width + '×' + height + '）。浏览器 localStorage 容量约 5MB，图片过多可能存不下', 'info');
      } else {
        this.showToast('图片已插入' + (mb >= 0.1 ? '（约 ' + mb + ' MB）' : ''), 'success');
      }
    } catch (err) {
      console.error('图片插入失败:', err);
      this.showToast('图片处理失败', 'error');
    }
  },

  _insertMarkdown(text) {
    const ta = this._dom.editorTextarea;
    const start = ta.selectionStart, end = ta.selectionEnd;
    ta.setRangeText(text, start, end, 'end');
    ta.focus();
    this._handleEditorInput();
  },

  _openImageViewer(src) {
    this._dom.imageViewerImg.src = src;
    this._dom.imageViewer.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  _closeImageViewer() {
    this._dom.imageViewer.classList.remove('open');
    this._dom.imageViewerImg.src = '';
    document.body.style.overflow = '';
  },

  async _forceSave() {
    await Notes.flushPersist();
    if (this._fileHandle) {
      const ok = await this._saveToFileHandle();
      if (ok) this.showToast('已保存到文件：' + this._fileName, 'success');
    } else {
      this.showToast('笔记已保存', 'success');
    }
    this._markSaved(false);
  },

  async _importBackup(file) {
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      const notes = backup.notes || [];
      const cats = backup.categories || [];
      const result = await Storage.importBackup({ notes, categories: cats });
      await Notes.init();
      await Storage.loadCustomCategories();
      this._renderSidebar();
      this._renderCategorySelect();
      this._renderNoteList();
      this.showToast('导入成功：' + result.notes + ' 条笔记、' + result.categories + ' 个分类', 'success');
    } catch (e) {
      console.error('导入备份失败', e);
      this.showToast('导入失败：' + e.message, 'error');
    }
  },

  async _deleteCategory(catId) {
    // Move notes in this category to 'other'
    const notes = Notes.all();
    notes.forEach(n => { if (n.category === catId) Notes.update(n.id, { category: 'other' }); });
    await Notes.flushPersist();
    // Remove custom category
    await Storage.removeCustomCategory(catId);
    // If currently filtering by this category, switch to 'all'
    if (state.settings.activeCategory === catId) {
      state.settings.activeCategory = 'all';
      saveState();
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
    const icons = AVAILABLE_ICONS;
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
    document.getElementById('catOk').onclick = async () => {
      const name = document.getElementById('catNameInput').value.trim();
      if (!name) { this.showToast('请输入分类名称', 'error'); return; }
      const id = 'custom-' + Date.now();
      try {
        await Storage.addCustomCategory({ id, name, icon: selIcon });
        catDialog.classList.remove('open');
        this._renderSidebar(); this._renderCategorySelect();
        this._renderNoteList();
        this.showToast('分类已添加：' + name, 'success');
      } catch (e) {
        console.error('添加分类失败', e);
        this.showToast('添加分类失败', 'error');
      }
    };
    document.getElementById('catCancel').onclick = () => { catDialog.classList.remove('open'); };
    catDialog.addEventListener('click', e => { if (e.target === catDialog) catDialog.classList.remove('open'); });
  },

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
        const nullCount = (sample.match(/\x00/g) || []).length;
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
    const note = Notes.create(state.settings.activeCategory);
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
      state.settings.searchQuery = q; saveState();
      d.clearSearch.classList.toggle('visible', q.length > 0);
      this._renderNoteList();
    }, 300));
    d.clearSearch.addEventListener('click', () => {
      d.searchInput.value = ''; state.settings.searchQuery = '';
      saveState(); d.clearSearch.classList.remove('visible');
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
      state.settings.activeCategory = item.dataset.cat;
      saveState();
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
    d.btnImport.addEventListener('click', () => d.importInput.click());
    d.importInput.addEventListener('change', async () => {
      const file = d.importInput.files[0];
      if (!file) return;
      d.importInput.value = '';
      await this._importBackup(file);
    });
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
      const note = Notes.create(state.settings.activeCategory);
      this._openEditor(note.id); this._updateStats(); this._renderNoteList();
    });
    d.btnExport.addEventListener('click', () => this._showExport());
    d.btnToggleSidebar.addEventListener('click', () => { d.sidebar.classList.toggle('open'); d.sidebarOverlay.classList.toggle('open'); });
    d.sidebarOverlay.addEventListener('click', () => { d.sidebar.classList.remove('open'); d.sidebarOverlay.classList.remove('open'); });

    d.sortSelect.addEventListener('change', () => {
      const [sortBy, sortOrder] = d.sortSelect.value.split('-');
      state.settings.sortBy = sortBy; state.settings.sortOrder = sortOrder;
      saveState(); this._renderNoteList();
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

    // Image insert: button + file picker + paste
    d.btnInsertImage.addEventListener('click', () => this._insertImage());
    d.imageInput.addEventListener('change', async () => {
      const file = d.imageInput.files[0];
      if (!file) return;
      d.imageInput.value = '';
      await this._insertImageFile(file);
    });
    d.editorTextarea.addEventListener('paste', (e) => {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      let imageFile = null;
      for (const item of items) {
        if (item.kind === 'file' && item.type && item.type.startsWith('image/')) {
          imageFile = item.getAsFile();
          break;
        }
      }
      if (!imageFile) return;
      e.preventDefault();
      this._insertImageFile(imageFile);
    });

    // Click image in preview to view full size
    d.previewContent.addEventListener('click', (e) => {
      const img = e.target.closest('img');
      if (!img) return;
      this._openImageViewer(img.src);
    });
    d.imageViewer.addEventListener('click', () => this._closeImageViewer());

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
      state.settings.editorSplitRatio = ratio;
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false; d.paneDivider.classList.remove('dragging');
      document.body.style.cursor = ''; document.body.style.userSelect = '';
      saveState();
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
      state.settings.vSplitRatio = ratio;
    });
    document.addEventListener('mouseup', () => {
      if (!vDragging) return;
      vDragging = false; d.vPaneDivider.classList.remove('dragging');
      document.body.style.cursor = ''; document.body.style.userSelect = '';
      saveState();
    });

    d.exportOk.addEventListener('click', () => this._doExport());
    d.exportCancel.addEventListener('click', () => d.exportDialog.classList.remove('open'));

    d.confirmDialog.addEventListener('click', e => { if (e.target === d.confirmDialog) d.confirmDialog.classList.remove('open'); });
    d.exportDialog.addEventListener('click', e => { if (e.target === d.exportDialog) d.exportDialog.classList.remove('open'); });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (document.getElementById('app').hidden) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'n') { e.preventDefault(); const note = Notes.create(state.settings.activeCategory); this._openEditor(note.id); this._updateStats(); this._renderNoteList(); }
      if (ctrl && e.key === 's') { e.preventDefault(); this._forceSave(); }
      if (ctrl && e.key === 'f') { e.preventDefault(); d.searchInput.focus(); d.searchInput.select(); }
      if (ctrl && e.key === 'e') { e.preventDefault(); d.editorTextarea.focus(); }
      if (ctrl && e.key === 'b') { e.preventDefault(); this._wrapSelection('**'); }
      if (ctrl && e.key === 'i') { e.preventDefault(); this._wrapSelection('*'); }
      if (ctrl && e.key === '`') { e.preventDefault(); const ta = d.editorTextarea; const s2 = ta.selectionStart, e2 = ta.selectionEnd; ta.setRangeText('`' + ta.value.substring(s2, e2) + '`', s2, e2, 'select'); ta.focus(); this._handleEditorInput(); }
      if (e.key === 'Escape') {
        // Close image viewer first
        if (d.imageViewer.classList.contains('open')) { this._closeImageViewer(); return; }
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
  }
};

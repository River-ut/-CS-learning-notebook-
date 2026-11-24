import { TaskStore } from './task-store.mjs';
import { supabase } from './supabase.js';
import { DEFAULT_CATEGORIES, STATUS, PRIORITY, localDateTime, matchesView, filterTasks, taskId } from './task-model.mjs';
import { escapeHTML as esc } from './utils.js';
import { Notes } from './notes.js';
import { UI } from './ui.js';

const el = id => document.getElementById(id);
const dateLabel = value => value ? new Date(value).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', year: 'numeric' }) : '无截止时间';
const options = (values, selected) => Object.entries(values).map(([key, label]) => `<option value="${esc(key)}" ${key === selected ? 'selected' : ''}>${esc(label)}</option>`).join('');

export const Tasks = {
  store: null,
  filters: { view: 'active', category: '', query: '' },
  selected: null,
  dirty: false,
  busy: false,
  async init(user, logout) {
    this.store = new TaskStore(user.id, supabase, localStorage, Boolean(user.guest));
    this.filters = { view: 'active', category: '', query: '' };
    this.selected = null;
    this.dirty = false;
    el('workspaceNav').hidden = false;
    el('workspaceUser').textContent = user.email;
    el('workspaceLogout').textContent = user.guest ? '退出试用 / 登录' : '退出';
    el('workspaceLogout').onclick = logout;
    el('showTasks').onclick = () => this.switchView('tasks');
    el('showNotes').onclick = () => this.switchView('notes');
    el('tasksApp').innerHTML = `
      <div class="task-heading"><div><p class="task-eyebrow">PLAN · DO · REFLECT</p><h1>把计划，一件件完成。</h1><p class="task-muted">安排今天的事情，留下每一步进展。</p></div>
      <button class="btn btn-primary" id="taskNew">＋ 新建任务</button></div>
      <p id="taskMessage" role="status" aria-live="polite"></p>
      <div class="task-stats" id="taskStats"></div>
      <div class="task-tools"><input id="taskSearch" type="search" placeholder="搜索任务、描述、进展记录" aria-label="搜索任务">
      <select id="taskCategoryFilter" aria-label="按分类筛选"></select>
      <button class="btn" id="taskRefresh">刷新同步</button><button class="btn" id="taskExport">导出任务</button></div>
      <nav class="task-tabs" id="taskTabs" aria-label="任务筛选"></nav>
      <div class="task-columns"><section id="taskList" aria-label="任务列表"></section><section id="taskDetail" aria-label="任务详情"></section></div>`;
    el('taskNew').onclick = () => { if (this.canLeave()) this.open(null); };
    el('taskSearch').oninput = e => { this.filters.query = e.target.value; this.renderList(); };
    el('taskCategoryFilter').onchange = e => { this.filters.category = e.target.value; this.renderList(); };
    el('taskRefresh').onclick = () => { if (this.canLeave()) this.refresh(); };
    if (user.guest) el('taskRefresh').textContent = '刷新本地数据';
    el('taskExport').onclick = () => this.export();
    el('taskTabs').onclick = e => { const button = e.target.closest('[data-view]'); if (button) { this.filters.view = button.dataset.view; this.renderList(); } };
    el('taskList').onclick = e => {
      const button = e.target.closest('[data-task]');
      if (button && this.canLeave()) this.open(button.dataset.task);
    };
    if (!this.bound) {
      window.addEventListener('beforeunload', e => { if (this.dirty || this.busy) { e.preventDefault(); e.returnValue = ''; } });
      this.bound = true;
    }
    this.switchView(location.hash === '#notes' ? 'notes' : 'tasks');
    await this.refresh();
  },
  reset() {
    this.store = null;
    this.dirty = false;
    this.selected = null;
    el('workspaceNav').hidden = true;
    el('tasksApp').hidden = true;
    el('tasksApp').replaceChildren();
    el('app').hidden = false;
  },
  switchView(view) {
    el('app').hidden = view !== 'notes';
    el('tasksApp').hidden = view !== 'tasks';
    el('showTasks').classList.toggle('btn-primary', view === 'tasks');
    el('showNotes').classList.toggle('btn-primary', view === 'notes');
    el('showTasks').setAttribute('aria-pressed', view === 'tasks');
    el('showNotes').setAttribute('aria-pressed', view === 'notes');
    el('sidebarOverlay').classList.remove('open');
    history.replaceState(null, '', view === 'tasks' ? '#tasks' : '#notes');
  },
  canLeave() { return !this.busy && (!this.dirty || confirm('有尚未保存的内容，确定放弃这些修改吗？')); },
  message(text, error = false) {
    el('taskMessage').textContent = text;
    el('taskMessage').classList.toggle('task-error', error);
  },
  storageMessage() {
    if (this.store.guest) { this.message('本地试用 · 待办、日记和笔记仅保存在当前浏览器，不上传云端。清理浏览器数据会删除它们，请及时导出备份。登录后不会自动合并试用数据。'); return; }
    this.message(this.store.local
      ? '仅本机保存：云端任务表尚未启用。请勿清除浏览器数据，建议导出备份。启用后点击“刷新同步”会上传本机任务。'
      : '已连接云端 · 修改保存后可跨设备访问；其他设备有更新时，请点击“刷新同步”。');
  },
  async refresh() {
    const store = this.store;
    this.busy = true;
    el('taskNew').disabled = true;
    el('taskRefresh').disabled = true;
    this.message('正在加载任务…');
    try {
      await store.load();
      if (this.store !== store) return;
      this.storageMessage();
      this.renderList();
      this.open(this.selected && store.items.some(t => t.id === this.selected) ? this.selected : undefined);
    } catch (error) {
      if (this.store === store) this.message(`加载失败：${error.message}。请检查网络后重试。`, true);
    } finally {
      this.busy = false;
      if (this.store === store) {
        el('taskNew').disabled = false;
        el('taskRefresh').disabled = false;
      }
    }
  },
  renderList() {
    const tasks = this.store.items;
    const categories = [...new Set([...DEFAULT_CATEGORIES, ...tasks.map(t => t.category)])];
    el('taskCategoryFilter').innerHTML = '<option value="">全部分类</option>' + options(Object.fromEntries(categories.map(c => [c, c])), this.filters.category);
    el('taskStats').innerHTML = [['未完成', tasks.filter(t => t.status !== 'done').length], ['今日截止', tasks.filter(t => matchesView(t, 'today')).length], ['已逾期', tasks.filter(t => matchesView(t, 'overdue')).length], ['已完成', tasks.filter(t => t.status === 'done').length]]
      .map(([label, count]) => `<div><strong>${count}</strong><span>${label}</span></div>`).join('');
    el('taskTabs').innerHTML = Object.entries({ active: '待办', today: '今日截止', soon: '未来七天', overdue: '已逾期', done: '已完成', all: '全部' })
      .map(([key, label]) => `<button class="btn ${key === this.filters.view ? 'btn-primary' : ''}" data-view="${key}" aria-pressed="${key === this.filters.view}">${label}</button>`).join('');
    const filtered = filterTasks(tasks, this.filters);
    el('taskList').innerHTML = filtered.length ? `<p class="task-muted task-list-caption">${filtered.length} 项任务 · 按截止时间、优先级排序</p>` + filtered.map(t => `<button class="task-card ${t.id === this.selected ? 'selected' : ''} ${t.status === 'done' ? 'completed' : ''}" data-task="${esc(t.id)}">
      <div class="task-card-top"><span class="task-badge">${esc(t.category)}</span><span class="task-priority-${t.priority}">${PRIORITY[t.priority]}</span></div>
      <h3>${t.status === 'done' ? '✓ ' : ''}${esc(t.title)}</h3>
      <p class="task-preview">${esc(t.description || '点击任务，记录下一步行动')}</p>
      <div class="task-card-meta"><span class="${matchesView(t, 'overdue') ? 'task-overdue' : ''}">${matchesView(t, 'overdue') ? '已逾期 · ' : ''}${dateLabel(t.due_at)}</span><span>${STATUS[t.status]} · ${t.logs.length} 条进展</span></div>
      </button>`).join('') : '<div class="task-empty"><strong>这里暂时没有任务</strong><p>新建一项任务，或调整上方筛选条件。</p></div>';
  },
  open(id) {
    this.selected = id || null;
    this.dirty = false;
    this.renderList();
    const panel = el('taskDetail');
    if (id === undefined) { panel.innerHTML = '<div class="task-empty"><strong>给行动留一点空间</strong><p>选择一项任务查看详情，或新建你的第一项待办。</p></div>'; return; }
    const task = this.store.items.find(t => t.id === id);
    const t = task || { title: '', description: '', category: '生活', priority: 'normal', status: 'todo', due_at: null, note_id: null, logs: [] };
    const cats = [...new Set([...DEFAULT_CATEGORIES, ...this.store.items.map(t => t.category)])];
    const notes = Object.fromEntries(Notes.all().map(n => [n.id, n.title || '无标题']));
    if (t.note_id && !notes[t.note_id]) notes[t.note_id] = '原笔记已删除或暂未加载';
    panel.innerHTML = `<form id="taskForm"><div class="task-detail-heading"><h2>${task ? '任务详情' : '新建任务'}</h2><span id="taskDraftStatus" class="task-muted">${task ? '已保存' : '待填写'}</span></div>
      <label>任务名称<input name="title" required maxlength="200" placeholder="例如：完成论文基线实验" value="${esc(t.title)}"></label>
      <label>描述<textarea name="description" rows="3" placeholder="目标是什么？准备怎么做？">${esc(t.description)}</textarea></label>
      <div class="task-form-grid"><label>分类<input name="category" list="taskCategories" required maxlength="60" value="${esc(t.category)}" placeholder="选择或输入自定义分类"><datalist id="taskCategories">${cats.map(c => `<option value="${esc(c)}"></option>`).join('')}</datalist></label>
      <label>优先级<select name="priority">${options(PRIORITY, t.priority)}</select></label>
      <label>截止时间（本地时区）<input type="datetime-local" name="due" value="${localDateTime(t.due_at)}"></label>
      <label>状态<select name="status">${options(STATUS, t.status)}</select></label></div>
      <label>关联学习笔记<select name="note"><option value="">不关联</option>${options(notes, t.note_id)}</select></label>
      ${t.note_id && Notes.get(t.note_id) ? '<button type="button" class="btn" id="taskOpenNote">打开关联笔记 ↗</button>' : ''}
      <div class="task-actions"><button class="btn btn-primary" type="submit">保存任务</button>${task ? `<button type="button" class="btn" id="taskComplete">${t.status === 'done' ? '重新打开' : '✓ 标记完成'}</button><button type="button" class="btn btn-danger" id="taskDelete">删除</button>` : ''}</div>
      <div class="task-journal"><h2>进展记录</h2><p class="task-muted">记录做了什么、遇到的问题，以及下一步。</p>
      <textarea name="journal" rows="3" placeholder="写下这次的进展…（随任务一起保存）" maxlength="20000"></textarea>
      <div class="task-timeline">${[...t.logs].reverse().map(log => `<article><time>${dateLabel(log.created_at)}</time><p>${esc(log.content)}</p></article>`).join('') || '<p class="task-muted">还没有进展记录，每一步都值得留下。</p>'}</div></div></form>`;
    const form = el('taskForm');
    form.oninput = () => { this.dirty = true; el('taskDraftStatus').textContent = '未保存'; };
    form.onsubmit = e => { e.preventDefault(); this.saveForm(task); };
    if (el('taskComplete')) el('taskComplete').onclick = () => { form.elements.status.value = t.status === 'done' ? 'todo' : 'done'; this.dirty = true; form.requestSubmit(); };
    if (el('taskDelete')) el('taskDelete').onclick = () => {
      if (confirm('确定删除这个任务及其全部进展记录？此操作无法撤销。')) this.mutate(() => this.store.remove(task), undefined);
    };
    if (el('taskOpenNote')) el('taskOpenNote').onclick = () => { this.switchView('notes'); UI._openEditor(t.note_id); };
    if (!task) form.elements.title.focus();
  },
  async saveForm(previous) {
    const form = el('taskForm');
    if (!form.reportValidity() || this.busy) return;
    const values = new FormData(form);
    const title = values.get('title').trim();
    const category = values.get('category').trim();
    if (!title || !category) { this.message('任务名称和分类不能只包含空格。', true); return; }
    const now = new Date().toISOString();
    const logs = [...(previous?.logs || [])];
    const journal = values.get('journal').trim();
    if (journal) logs.push({ id: taskId(), created_at: now, content: journal });
    const task = { id: previous?.id || taskId(), title, category,
      description: values.get('description').trim(), priority: values.get('priority'), status: values.get('status'),
      due_at: values.get('due') ? new Date(values.get('due')).toISOString() : null,
      note_id: values.get('note') || null, logs, created_at: previous?.created_at || now };
    await this.mutate(() => this.store.save(task, previous), task.id);
  },
  async mutate(action, nextId) {
    if (this.busy) return;
    this.busy = true;
    const controls = [...el('tasksApp').querySelectorAll('button,input,select,textarea'), el('workspaceLogout')];
    controls.forEach(c => c.disabled = true);
    try {
      await action();
      this.dirty = false;
      this.open(nextId);
      this.storageMessage();
    } catch (error) { this.message(`保存失败：${error.message}（未保存的输入仍保留）`, true); }
    finally { this.busy = false; controls.forEach(c => c.disabled = false); }
  },
  export() {
    const blob = new Blob([JSON.stringify({ format: 'workspace-tasks-v1', exported_at: new Date().toISOString(), tasks: this.store.items }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `待办备份-${new Date().toISOString().slice(0, 10)}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

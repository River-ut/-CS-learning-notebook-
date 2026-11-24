export const DEFAULT_CATEGORIES = ['加权', '科研', '竞赛', '生活'];
export const STATUS = { todo: '待开始', doing: '进行中', done: '已完成' };
export const PRIORITY = { high: '高优先级', normal: '普通', low: '低优先级' };

// getRandomValues also works on HTTP origins; randomUUID requires a secure context.
export function taskId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function localDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function matchesView(task, view, now = new Date()) {
  const due = task.due_at ? new Date(task.due_at) : null;
  if (view === 'done') return task.status === 'done';
  if (view === 'all') return true;
  if (task.status === 'done') return false;
  if (view === 'today') return due && due.toDateString() === now.toDateString();
  if (view === 'overdue') return due && due < now;
  if (view === 'soon') return due && due >= now && due <= new Date(now.getTime() + 7 * 86400000);
  return true;
}

export function filterTasks(tasks, { view = 'active', category = '', query = '' } = {}, now = new Date()) {
  const q = query.trim().toLowerCase();
  const priorities = { high: 0, normal: 1, low: 2 };
  return tasks.filter(t => matchesView(t, view, now) && (!category || t.category === category)
    && `${t.title} ${t.description} ${t.category} ${(t.logs || []).map(l => l.content).join(' ')}`.toLowerCase().includes(q))
    .sort((a, b) => (a.status === 'done') - (b.status === 'done')
      || (a.due_at ? Date.parse(a.due_at) : Infinity) - (b.due_at ? Date.parse(b.due_at) : Infinity)
      || priorities[a.priority] - priorities[b.priority] || b.created_at.localeCompare(a.created_at));
}

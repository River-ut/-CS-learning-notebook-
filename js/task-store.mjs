// Only a missing table enables local mode. Network/auth errors must not masquerade as successful cloud saves.
export class TaskStore {
  constructor(userId, client, storage = localStorage, guest = false) {
    this.guest = guest;
    this.client = client;
    this.storage = storage;
    this.userId = userId;
    this.key = guest ? 'workspace_guest_v1:tasks' : `workspace_tasks_v1:${userId}`;
    this.local = guest;
    this.items = [];
  }

  async load() {
    if (this.guest) { this.items = JSON.parse(this.storage.getItem(this.key) || '[]'); return; }
    const { data, error } = await this.client.from('tasks').select('*').order('created_at', { ascending: false });
    if (error) {
      if (!['PGRST205', '42P01'].includes(error.code)) throw error;
      this.local = true;
      this.items = JSON.parse(this.storage.getItem(this.key) || '[]');
      return;
    }
    // Migrate only records that have never been cloud-backed. Duplicate IDs are not overwritten.
    const pending = JSON.parse(this.storage.getItem(this.key) || '[]');
    if (pending.length) {
      const rows = pending.map(t => ({ ...t, user_id: this.userId }));
      const result = await this.client.from('tasks').upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
      if (result.error) throw result.error;
      const refreshed = await this.client.from('tasks').select('*').order('created_at', { ascending: false });
      if (refreshed.error) throw refreshed.error;
      this.items = refreshed.data;
      this.storage.removeItem(this.key);
    } else this.items = data || [];
    this.local = false;
  }

  async save(task, previous) {
    const next = { ...task, user_id: this.userId, version: (previous?.version || 0) + 1, updated_at: new Date().toISOString() };
    let saved = next;
    if (this.local) {
      // Detect edits from another tab before replacing its local data.
      const current = JSON.parse(this.storage.getItem(this.key) || '[]');
      if (previous && current.find(t => t.id === previous.id)?.version !== previous.version) throw new Error('任务已在另一窗口修改，请刷新列表后重试。');
      const items = [next, ...current.filter(t => t.id !== next.id)];
      this.storage.setItem(this.key, JSON.stringify(items));
      this.items = items;
      return;
    }
    const result = previous
      ? await this.client.from('tasks').update(next).eq('id', next.id).eq('version', previous.version).select().maybeSingle()
      : await this.client.from('tasks').insert(next).select().single();
    if (result.error) throw result.error;
    if (!result.data) throw new Error('任务已在另一设备修改或删除，请刷新列表后重试。当前输入已保留。');
    saved = result.data;
    this.items = [saved, ...this.items.filter(t => t.id !== saved.id)];
  }

  async remove(task) {
    if (this.local) {
      const current = JSON.parse(this.storage.getItem(this.key) || '[]');
      if (current.find(t => t.id === task.id)?.version !== task.version) throw new Error('任务已被修改，请刷新列表后重试。');
      const items = current.filter(t => t.id !== task.id);
      this.storage.setItem(this.key, JSON.stringify(items));
      this.items = items;
    } else {
      const { data, error } = await this.client.from('tasks').delete().eq('id', task.id).eq('version', task.version).select('id');
      if (error) throw error;
      if (!data.length) throw new Error('任务已被修改，请刷新列表后重试。');
      this.items = this.items.filter(t => t.id !== task.id);
    }
  }
}

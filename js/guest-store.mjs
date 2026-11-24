export const GUEST_ID = 'local-guest';
export class GuestStore {
  constructor(storage = localStorage) { this.storage = storage; }
  read(name) { return JSON.parse(this.storage.getItem(`workspace_guest_v1:${name}`) || '[]'); }
  write(name, items) { this.storage.setItem(`workspace_guest_v1:${name}`, JSON.stringify(items)); }
  saveNote(note) { this.write('notes', [note, ...this.read('notes').filter(n => n.id !== note.id)]); }
  deleteNote(id) { this.write('notes', this.read('notes').filter(n => n.id !== id)); }
}

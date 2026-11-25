export function libraryStore(mode, action) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('workspace-paper-library', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('library');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction('library', mode);
      tx.oncomplete = () => { db.close(); resolve(request.result); };
      tx.onabort = () => { db.close(); reject(tx.error); };
      const request = action(tx.objectStore('library'));
    };
  });
}

export const get = (key) => libraryStore('readonly', (store) => store.get(key));
export const save = (key, value) => libraryStore('readwrite', (store) => store.put(value, key));
export const remove = (key) => libraryStore('readwrite', (store) => store.delete(key));
export const all = () => libraryStore('readonly', (store) => store.getAll());

export function isPaper(name) {
  return /\.(pdf|djvu|epub|docx?)$/i.test(name);
}

export async function collect(directory, prefix = '') {
  const found = [];
  for await (const handle of directory.values()) {
    const path = prefix + handle.name;
    if (handle.kind === 'directory') {
      for (const paper of await collect(handle, path + '/')) found.push(paper);
    } else if (isPaper(handle.name)) {
      found.push({ path, handle });
    }
  }
  return found;
}

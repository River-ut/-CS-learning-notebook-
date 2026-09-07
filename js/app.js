// ============================================================
// APP — 应用入口（认证门控 + 数据加载编排）
// ============================================================
import { Notes } from './notes.js';
import { UI } from './ui.js';
import { Storage } from './storage.js';
import { getCurrentUser, signOut, initAuth, showLogin, hideLogin, showUser } from './auth.js';

// 首次登录：把旧 localStorage 里的笔记/自定义分类一次性迁移到云端
async function migrateLocalData() {
  const rawNotes = localStorage.getItem('cs_notebook_notes');
  const rawCats = localStorage.getItem('cs_notebook_custom_cats');
  if (!rawNotes && !rawCats) return;

  try {
    if (rawNotes) {
      const remoteNotes = await Storage.getNotes();
      if (remoteNotes.length === 0) {
        const localNotes = JSON.parse(rawNotes);
        for (const note of localNotes) await Storage.upsertNote(note);
        Notes._notes = await Storage.getNotes();
      }
    }
    if (rawCats) {
      const remoteCats = Storage.getCustomCategories();
      if (remoteCats.length === 0) {
        const localCats = JSON.parse(rawCats);
        for (const cat of localCats) await Storage.addCustomCategory(cat);
      }
    }
    localStorage.removeItem('cs_notebook_notes');
    localStorage.removeItem('cs_notebook_custom_cats');
    localStorage.removeItem('cs_notebook_seeded');
  } catch (e) {
    console.error('迁移本地数据失败', e);
  }
}

let loading = false;
async function loadApp(user) {
  if (loading) return;
  loading = true;
  try {
    await Notes.init();
    await Storage.loadCustomCategories();
    await migrateLocalData();
    UI.init();
    hideLogin();
    showUser(user.email);
  } catch (e) {
    console.error('加载数据失败', e);
    showLogin();
  } finally {
    loading = false;
  }
}

async function handleLogout() {
  await signOut();
  Notes.reset();
  Storage.resetCategories();
  showLogin();
}

function bootstrap() {
  initAuth({
    onAuthenticated: (user) => loadApp(user),
    onLogout: () => handleLogout(),
  });

  // 已登录（session 仍在）则直接加载，否则显示登录屏
  getCurrentUser().then(user => {
    if (user) loadApp(user);
    else showLogin();
  });
}

bootstrap();

// ============================================================
// APP — 应用入口（认证门控 + 数据加载编排）
// ============================================================
import { Notes } from './notes.js';
import { UI } from './ui.js';
import { Storage } from './storage.js';
import { Tasks } from './tasks.js';
import { loadState } from './state.js';
import { GUEST_ID } from './guest-store.mjs';
import { initTheme } from './theme.js';
import { getCurrentUser, signOut, initAuth, showLogin, hideLogin, showUser } from './auth.js';

// 首次登录：把旧 localStorage 里的笔记/自定义分类一次性迁移到云端
async function migrateLocalData() {
  const rawNotes = localStorage.getItem('cs_notebook_notes');
  const rawCats = localStorage.getItem('cs_notebook_custom_cats');
  if (!rawNotes && !rawCats) return;

  try {
    let notes = [], cats = [];
    if (rawNotes) notes = JSON.parse(rawNotes);
    if (rawCats) cats = JSON.parse(rawCats);
    await Storage.importBackup({ notes, categories: cats });
    Notes._notes = await Storage.getNotes();
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
    Storage.setGuest(Boolean(user.guest));
    Notes.reset();
    loadState();
    await Notes.init();
    await Storage.loadCustomCategories();
    if (!user.guest) await migrateLocalData();
    UI.init();
    await Tasks.init(user, handleLogout);
    hideLogin();
    showUser(user.email);
    document.getElementById('btnLogout').textContent = user.guest ? '退出试用 / 登录' : '⏻ 退出';
    sessionStorage.setItem('workspace_mode', user.guest ? 'guest' : 'account');
  } catch (e) {
    console.error('加载数据失败', e);
    showLogin();
    const error = document.getElementById('loginError');
    error.textContent = '工作台加载失败，请检查网络或浏览器存储权限后重试。';
    error.style.display = 'block';
  } finally {
    loading = false;
  }
}

async function handleLogout() {
  if (!Tasks.canLeave()) return;
  await Notes.flushPersist();
  if (Notes._dirty.size) { alert('笔记尚未保存成功，请先重试保存或导出内容。'); return; }
  const wasGuest = Storage.guest;
  if (!wasGuest) await signOut();
  UI._closeEditor();
  Tasks.reset();
  Notes.reset();
  Storage.resetCategories();
  Storage.setGuest(false);
  sessionStorage.removeItem('workspace_mode');
  showLogin();
}

function bootstrap() {
  initTheme();
  initAuth({
    onAuthenticated: (user) => loadApp(user),
    onLogout: () => handleLogout(),
    onGuest: () => loadApp({ id: GUEST_ID, email: '本地试用', guest: true }),
  });

  // 已登录（session 仍在）则直接加载，否则显示登录屏
  if (sessionStorage.getItem('workspace_mode') === 'guest') {
    loadApp({ id: GUEST_ID, email: '本地试用', guest: true });
    return;
  }
  getCurrentUser().then(user => {
    if (Storage.guest || loading) return;
    if (user) loadApp(user);
    else showLogin();
  });
}

bootstrap();

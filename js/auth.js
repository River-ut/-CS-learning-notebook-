// ============================================================
// AUTH — 认证服务 + 登录屏 UI
// ============================================================
import { supabase } from './supabase.js';

function el(id) { return document.getElementById(id); }

// ---- 认证操作 ----

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
}

function friendlyAuthError(msg) {
  if (/invalid login credentials/i.test(msg)) return '邮箱或密码错误';
  if (/already registered/i.test(msg)) return '该邮箱已注册，请直接登录';
  if (/password should be at least/i.test(msg)) return '密码长度不足（至少 6 位）';
  if (/email not confirmed/i.test(msg)) return '邮箱尚未验证，请查收邮件后重试';
  return msg || '操作失败，请重试';
}

// ---- 登录屏 UI ----

export function showLogin() {
  const screen = el('loginScreen');
  if (screen) screen.classList.add('open');
  const footer = el('userFooter');
  if (footer) footer.style.display = 'none';
}

export function hideLogin() {
  const screen = el('loginScreen');
  if (screen) screen.classList.remove('open');
}

export function showUser(email) {
  const emailEl = el('userEmail');
  const footer = el('userFooter');
  if (emailEl) emailEl.textContent = email || '';
  if (footer) footer.style.display = 'flex';
}

/**
 * 初始化登录表单与退出按钮
 * @param {{ onAuthenticated: (user: object) => void, onLogout: () => void }} handlers
 */
export function initAuth({ onAuthenticated, onLogout }) {
  const emailInput = el('loginEmail');
  const passwordInput = el('loginPassword');
  const submitBtn = el('loginSubmit');
  const toggleLink = el('loginToggle');
  const toggleText = el('loginToggleText');
  const errorEl = el('loginError');
  const titleEl = el('loginTitle');
  const subEl = el('loginSub');
  const logoutBtn = el('btnLogout');

  let mode = 'login'; // 'login' | 'register'

  function setMode(m) {
    mode = m;
    if (titleEl) titleEl.textContent = m === 'login' ? '登录' : '注册账号';
    if (subEl) subEl.textContent = m === 'login' ? '登录后即可同步你的笔记到云端' : '首次使用，注册一个账号';
    if (submitBtn) submitBtn.textContent = m === 'login' ? '登录' : '注册';
    if (toggleText) toggleText.textContent = m === 'login' ? '没有账号？' : '已有账号？';
    if (toggleLink) toggleLink.textContent = m === 'login' ? '注册' : '登录';
  }

  async function handleSubmit() {
    if (!supabase) {
      if (errorEl) { errorEl.textContent = '未配置 Supabase：请创建 .env 并填入项目密钥后重试'; errorEl.style.display = 'block'; }
      return;
    }
    const email = (emailInput.value || '').trim();
    const password = passwordInput.value || '';
    if (!email || !password) {
      if (errorEl) { errorEl.textContent = '请输入邮箱和密码'; errorEl.style.display = 'block'; }
      return;
    }
    if (submitBtn) submitBtn.disabled = true;
    if (errorEl) errorEl.style.display = 'none';
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (onAuthenticated) onAuthenticated(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          // 已关闭邮箱验证时，注册后直接登录
          if (onAuthenticated) onAuthenticated(data.user);
        } else {
          if (errorEl) { errorEl.textContent = '注册成功！请查收邮箱验证链接后登录'; errorEl.style.display = 'block'; }
        }
      }
    } catch (err) {
      if (errorEl) { errorEl.textContent = friendlyAuthError(err.message); errorEl.style.display = 'block'; }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  if (submitBtn) submitBtn.addEventListener('click', handleSubmit);
  if (passwordInput) passwordInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSubmit(); });

  if (toggleLink) toggleLink.addEventListener('click', e => { e.preventDefault(); setMode(mode === 'login' ? 'register' : 'login'); });

  if (logoutBtn) logoutBtn.addEventListener('click', () => { if (onLogout) onLogout(); });

  setMode('login');
}

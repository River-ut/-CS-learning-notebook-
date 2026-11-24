export function initTheme() {
  const media = matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try { preference = localStorage.getItem('workspace_theme') || 'system'; } catch {}
  const apply = () => {
    if (!['system', 'light', 'dark'].includes(preference)) preference = 'system';
    document.documentElement.dataset.theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
    document.querySelectorAll('[data-theme-select]').forEach(select => { select.value = preference; });
  };
  document.querySelectorAll('[data-theme-select]').forEach(select => {
    select.addEventListener('change', () => {
      preference = select.value;
      try { localStorage.setItem('workspace_theme', preference); } catch {}
      apply();
    });
  });
  media.addEventListener('change', apply);
  window.addEventListener('storage', event => { if (event.key === 'workspace_theme') { preference = event.newValue || 'system'; apply(); } });
  apply();
}

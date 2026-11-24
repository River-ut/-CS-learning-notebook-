// Apply before first paint to avoid flashing the wrong theme.
(() => {
  let theme = 'system';
  try { theme = localStorage.getItem('workspace_theme') || 'system'; } catch {}
  document.documentElement.dataset.theme = theme === 'light' || theme === 'dark'
    ? theme : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
})();

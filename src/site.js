const theme = document.querySelector('.theme');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
const currentTheme = () => document.documentElement.dataset.theme || (systemTheme.matches ? 'dark' : 'light');
function syncTheme() {
  if (!theme) return;
  const isDark = currentTheme() === 'dark';
  theme.textContent = isDark ? theme.dataset.light : theme.dataset.dark;
  theme.setAttribute('aria-pressed', String(isDark));
}
theme?.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('auroraview-theme', next); } catch {}
  syncTheme();
});
systemTheme.addEventListener('change', syncTheme);
syncTheme();
document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const code = document.getElementById(button.dataset.copy);
    const status = button.closest('.code-block').querySelector('.copy-status');
    try {
      await navigator.clipboard.writeText(code.textContent);
      status.textContent = button.dataset.success;
    } catch {
      status.textContent = button.dataset.failure;
    }
  });
});

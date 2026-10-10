// Locale/attribute rendering and persistent theme selection adapted from VibeMeter website (MIT).
(() => {
  'use strict';
  const root = document.documentElement;
  const nodes = [...document.querySelectorAll('[data-i18n]')];
  const english = Object.fromEntries(nodes.map(node => [node.dataset.i18n, node.textContent]));
  const dictionaries = {en: english, ...window.DSHWebsiteLocales};
  const language = document.querySelector('#language');
  const theme = document.querySelector('#theme-toggle');
  const media = matchMedia('(prefers-color-scheme: dark)');
  let locale = root.dataset.initialLocale || 'en';
  let preference = root.dataset.themePreference || 'system';
  const labels = {en: {system:'Auto',light:'Light',dark:'Dark'},'zh-CN':{system:'自动',light:'浅色',dark:'深色'}};
  const store = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  function renderTheme() {
    root.dataset.themePreference = preference;
    root.dataset.theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
    document.querySelector('#theme-label').textContent = labels[locale][preference];
    theme.setAttribute('aria-label', `${locale === 'en' ? 'Theme' : '主题'}: ${labels[locale][preference]}`);
    document.querySelector('meta[name="theme-color"]').content = root.dataset.theme === 'dark' ? '#172335' : '#e9efff';
  }
  function renderLocale(next) {
    locale = next in dictionaries ? next : 'en';
    root.lang = locale;
    language.value = locale;
    for (const node of nodes) node.textContent = dictionaries[locale][node.dataset.i18n] || english[node.dataset.i18n];
    document.title = locale === 'en' ? 'DeepSeek Harness · Desktop Next' : 'DeepSeek Harness · 桌面工作空间';
    renderTheme();
  }
  language.addEventListener('change', () => {
    renderLocale(language.value); store('dsh-website-language', locale);
    const url = new URL(location.href); url.searchParams.set('lang', locale); history.replaceState(null, '', url);
  });
  theme.addEventListener('click', () => {
    preference = ['system','light','dark'][(['system','light','dark'].indexOf(preference) + 1) % 3];
    store('dsh-website-theme', preference); renderTheme();
    const url = new URL(location.href); url.searchParams.delete('theme'); history.replaceState(null, '', url);
  });
  media.addEventListener('change', renderTheme);
  renderLocale(locale);
  const play = document.querySelector('#play-demo');
  const stop = document.querySelector('#stop-demo');
  const img = document.querySelector('#tour-image');
  function stopDemo() { img.src = './assets/preferences.jpg'; img.alt = 'Actual native first-use purpose and display preferences'; play.setAttribute('aria-pressed','false'); stop.disabled = true; }
  play.addEventListener('click', () => { img.src = './assets/walkthrough.gif'; img.alt = 'Edited native desktop walkthrough with synthetic test content; no model calls'; play.setAttribute('aria-pressed','true'); stop.disabled = false; });
  stop.addEventListener('click', stopDemo);
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => { if(e.matches) stopDemo(); });
  img.addEventListener('error', () => { if(img.getAttribute('src') !== './assets/preferences.jpg') stopDemo(); });
})();

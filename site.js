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
  let tourPlaying = false;
  const imageDescriptions = {
    en: {hero:'Demonstration task reading source material in the actual desktop app', context:'Task background preview in the actual desktop app', document:'Local document preview of a sample Word file', still:'Actual native purpose and display preferences', tour:'Edited native desktop walkthrough using sample tasks and documents'},
    'zh-CN': {hero:'实际桌面客户端中的演示任务：读取资料', context:'实际桌面客户端中的任务背景预览', document:'样例 Word 文件的本地文档预览', still:'实际客户端中的使用目标与显示偏好设置', tour:'使用演示任务和样例文档录制的原生客户端剪辑'}
  };
  function renderImageDescriptions() {
    const labels = imageDescriptions[locale];
    document.querySelector('#hero-image').alt = labels.hero;
    document.querySelector('#context-image').alt = labels.context;
    document.querySelector('#document-image').alt = labels.document;
    document.querySelector('#tour-image').alt = tourPlaying ? labels.tour : labels.still;
  }
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
    renderProcess();
    renderExtensions();
    renderImageDescriptions();
  }
  const processFiles = ['process-read.png', 'process-work.png', 'process-result.png'];
  const processAlts = {en: ['Demonstration task reading source material in the actual desktop app', 'Demonstration task showing execution records in the actual desktop app', 'Demonstration task reviewing a delivered document in the actual desktop app'], 'zh-CN': ['实际桌面客户端中的演示任务：读取资料', '实际桌面客户端中的演示任务：查看执行记录', '实际桌面客户端中的演示任务：审阅交付文档']};
  const processSteps = [...document.querySelectorAll('[data-step]')];
  let processIndex = 0;
  function renderProcess() {
    const img = document.querySelector('#process-image');
    const src = './assets/' + processFiles[processIndex];
    img.src = src; img.alt = processAlts[locale][processIndex];
    document.querySelector('#process-zoom').href = src;
    document.querySelector('#process-full').href = src;
    for (const step of processSteps) step.setAttribute('aria-pressed', String(Number(step.dataset.step) === processIndex));
  }
  for (const step of processSteps) step.addEventListener('click', () => { processIndex = Number(step.dataset.step); renderProcess(); });
  const extensionSteps = [...document.querySelectorAll('[data-extension]')];
  const extensionFiles = ['extensions-plugins.png', 'extensions-skills.png', 'extensions-mcp.png'];
  const extensionSizes = [[980,680],[1188,848],[1188,848]];
  const extensionAlts = {en: ['Actual desktop plugin inventory showing optional runtime bundles', 'Actual desktop Skill manager showing an imported sample method', 'Actual desktop MCP manager showing validated and mounted local demonstration tools'], 'zh-CN': ['实际客户端的插件清单：可选运行时插件包', '实际客户端的 Skills 管理：已导入的演示方法', '实际客户端的 MCP 管理：已验证并挂载的本地演示工具']};
  let extensionIndex = 0;
  function renderExtensions() {
    const img = document.querySelector('#extension-image');
    const src = './assets/' + extensionFiles[extensionIndex];
    img.src = src; img.alt = extensionAlts[locale][extensionIndex];
    [img.width, img.height] = extensionSizes[extensionIndex];
    document.querySelector('#extension-zoom').href = src;
    document.querySelector('#extension-full').href = src;
    document.querySelector('#extension-types').setAttribute('aria-label', locale === 'en' ? 'Extension types' : '扩展类型');
    for (const step of extensionSteps) step.setAttribute('aria-pressed', String(Number(step.dataset.extension) === extensionIndex));
  }
  for (const step of extensionSteps) step.addEventListener('click', () => { extensionIndex = Number(step.dataset.extension); renderExtensions(); });
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
  function stopDemo() { img.src = './assets/preferences.png'; tourPlaying = false; renderImageDescriptions(); play.setAttribute('aria-pressed','false'); stop.disabled = true; }
  play.addEventListener('click', () => { img.src = './assets/walkthrough.gif'; tourPlaying = true; renderImageDescriptions(); play.setAttribute('aria-pressed','true'); stop.disabled = false; });
  stop.addEventListener('click', stopDemo);
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => { if(e.matches) stopDemo(); });
  img.addEventListener('error', () => { if(img.getAttribute('src') !== './assets/preferences.png') stopDemo(); });
})();

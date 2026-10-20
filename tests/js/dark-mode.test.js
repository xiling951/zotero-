// Load the dark-mode plugin's bootstrap.js against a jsdom "main window" with
// stubbed Zotero/Services: colors are remapped, the theme selector is injected
// into the layout menu, and unrelated DOM churn (e.g. a streamed chat reply)
// never triggers the refresh path. Usage: npm test [plugin directory]
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');
const assert = require('assert');
const pluginDir = process.argv[2] || path.join(__dirname, '../../src/plugins/zotero-ai-sidebar-dark-mode@local');

const dom = new JSDOM('<!doctype html><html><head></head><body><div id="main"></div></body></html>', { pretendToBeVisual: true });
const win = dom.window, doc = win.document;
win.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
doc.createXULElement = name => doc.createElement(name);

// A stylesheet that looks like the AI sidebar's sidebar.css.
const style = doc.createElement('style');
style.textContent = '.zai-app .bubble{background:#ffffff;color:#333333;border:1px solid #dddddd}.zai-title{color:#1a1a1a}';
doc.head.append(style);
Object.defineProperty(style.sheet, 'href', { value: 'chrome://zotero-ai-sidebar/content/sidebar.css' });
const realSheets = () => [style.sheet];
Object.defineProperty(doc, 'styleSheets', { get: realSheets });

let controlScans = 0;
const originalQSA = doc.querySelectorAll.bind(doc);
doc.querySelectorAll = selector => {
  if (selector === '.header-layout-menu > .zai-compact-menu-content') controlScans++;
  return originalQSA(selector);
};

const prefs = new Map();
const sandbox = {
  Zotero: {
    initializationPromise: Promise.resolve(), unlockPromise: Promise.resolve(), uiReadyPromise: Promise.resolve(),
    Prefs: { get: k => prefs.get(k), set: (k, v) => prefs.set(k, v) },
    getMainWindows: () => [win],
  },
  Services: {
    scriptloader: { loadSubScript(url, scope) { vm.runInContext(fs.readFileSync(path.join(pluginDir, 'preferences-theme.js'), 'utf8') + '\nthis.PreferenceThemeSupport=PreferenceThemeSupport;', vm.createContext(scope)); } },
    ww: { registerNotification() {}, unregisterNotification() {} },
    wm: { getEnumerator: () => [] },
  },
  console,
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(pluginDir, 'bootstrap.js'), 'utf8'), sandbox);

const frame = () => new Promise(resolve => win.requestAnimationFrame(() => setTimeout(resolve, 5)));

(async () => {
  await vm.runInContext('startup({rootURI: ""})', sandbox);
  assert.equal(doc.documentElement.getAttribute('data-zai-sidebar-theme'), 'dark');
  const generated = doc.getElementById('zai-sidebar-dark-mode-style').textContent;
  assert.match(generated, /\.zai-app \.bubble.*background(?:-color)?:rgb\(35, 41, 52\) !important/s, 'light sidebar background remapped');
  const baseline = controlScans;

  // Simulate a streamed chat reply: hundreds of unrelated insertions.
  const main = doc.getElementById('main');
  for (let i = 0; i < 300; i++) {
    const p = doc.createElement('p'); p.className = 'zai-message-chunk'; p.innerHTML = '<span>token</span>';
    main.append(p);
    if (i % 30 === 0) await frame();
  }
  await frame();
  const irrelevantRefreshes = controlScans - baseline;

  // Rendering the layout menu must inject the theme selector.
  const menu = doc.createElement('details'); menu.className = 'header-layout-menu';
  const content = doc.createElement('div'); content.className = 'zai-compact-menu-content';
  menu.append(content); main.append(menu);
  await frame();
  const select = content.querySelector('.zai-sidebar-theme-select');
  assert.ok(select, 'theme selector injected into the layout menu');
  assert.equal(select.value, 'dark');

  // Changing the choice updates the window theme.
  select.value = 'light'; select.dispatchEvent(new win.Event('change'));
  assert.equal(doc.documentElement.getAttribute('data-zai-sidebar-theme'), 'light');
  assert.equal(prefs.get('extensions.zotero-ai-sidebar-dark-mode.theme'), 'light');

  vm.runInContext('shutdown()', sandbox);
  assert.equal(doc.getElementById('zai-sidebar-dark-mode-style'), null);
  assert.equal(doc.querySelector('.zai-sidebar-theme-field'), null);
  console.log(JSON.stringify({ irrelevantRefreshes, menuRefreshes: controlScans - baseline - irrelevantRefreshes }));
  assert.equal(irrelevantRefreshes, 0, 'unrelated mutations must not refresh');
  console.log('dark-mode plugin checks passed');
  process.exit(0);
})().catch(error => { console.error(error); process.exit(1); });

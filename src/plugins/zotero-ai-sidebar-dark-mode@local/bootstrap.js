var darkModeWindows = new Map();
var preferencesThemeSupport;
const DARK_MODE_PREF = 'extensions.zotero-ai-sidebar-dark-mode.theme';
const DARK_SCOPE = ':root[data-zai-sidebar-theme="dark"] :is(#zai-column, #zai-note-column, .zai-app, .zai-quick-ask-layer, .zai-root-independent)';
const THEME_CHOICES = [['system', '跟随 Zotero'], ['light', '浅色'], ['dark', '深色']];

function install() {}
function uninstall() {}

async function startup(data) {
  await Promise.all([Zotero.initializationPromise, Zotero.unlockPromise, Zotero.uiReadyPromise]);
  if (!Zotero.Prefs.get(DARK_MODE_PREF, true)) Zotero.Prefs.set(DARK_MODE_PREF, 'dark', true);
  Zotero.AISidebarDarkMode = {
    getMode: getSidebarTheme,
    setMode: setSidebarTheme,
    refresh: () => { for (const controller of darkModeWindows.values()) controller.refresh(); },
    getWindowTheme: win => win.document.documentElement.getAttribute('data-zai-sidebar-theme'),
    getDiagnostics: win => darkModeWindows.get(win)?.diagnostics()
  };
  for (const win of Zotero.getMainWindows()) attachDarkMode(win);
  const scope = {Zotero,Services};
  Services.scriptloader.loadSubScript(data.rootURI + 'preferences-theme.js',scope);
  preferencesThemeSupport = scope.PreferenceThemeSupport.start(getSidebarTheme);
}

function getSidebarTheme() {
  const value = Zotero.Prefs.get(DARK_MODE_PREF, true);
  return THEME_CHOICES.some(choice => choice[0] === value) ? value : 'dark';
}

function setSidebarTheme(value) {
  if (!THEME_CHOICES.some(choice => choice[0] === value)) throw new Error('Unknown sidebar theme');
  Zotero.Prefs.set(DARK_MODE_PREF, value, true);
  for (const controller of darkModeWindows.values()) controller.refresh();
  preferencesThemeSupport?.refresh();
}

// Color changes are restricted to the sidebar; PDF images and other Zotero
// panels are never inverted or recolored.
function parseColor(token) {
  if (token[0] === '#') {
    let value = token.slice(1);
    if ([3,4].includes(value.length)) value = [...value].map(char => char + char).join('');
    if (![6,8].includes(value.length)) return null;
    return [parseInt(value.slice(0,2),16), parseInt(value.slice(2,4),16), parseInt(value.slice(4,6),16), value.length === 8 ? parseInt(value.slice(6,8),16)/255 : 1];
  }
  const numbers = token.match(/[\d.]+%?/g);
  if (!numbers || numbers.length < 3) return null;
  return numbers.map((number,index) => number.endsWith('%') ? parseFloat(number) * (index === 3 ? .01 : 2.55) : parseFloat(number)).concat(numbers.length === 3 ? [1] : []);
}

function remapColor(token, property) {
  const color = parseColor(token);
  if (!color) return token;
  let [r,g,b,a] = color;
  const maximum = Math.max(r,g,b), minimum = Math.min(r,g,b);
  const lightness = (maximum + minimum) / 510;
  const spread = maximum - minimum;
  const isForeground = /^(color|fill|stroke|text-decoration-color|caret-color|column-rule-color)$/.test(property);
  const isBorder = /border|outline|scrollbar/.test(property);
  if (isForeground) {
    if (lightness > .87) return token;
    if (spread < 35) {
      [r,g,b] = lightness < .25 ? [229,233,240] : lightness < .5 ? [190,197,209] : [158,169,185];
    } else {
      const mix = lightness < .6 ? .48 : .25;
      [r,g,b] = [r,g,b].map(value => Math.round(value + (255-value)*mix));
    }
  } else if (isBorder) {
    if (lightness > .65 && spread < 65) [r,g,b] = [70,79,94];
    else if (spread > 40) [r,g,b] = [r,g,b].map(value => Math.round(value*.65));
    else [r,g,b] = [67,75,89];
  } else if (/shadow/.test(property)) {
    [r,g,b] = [0,0,0];
  } else if (lightness > .68) {
    if (spread < 35) [r,g,b] = lightness > .94 ? [35,41,52] : [42,49,62];
    else if (r > b + 12) [r,g,b] = [55,42,38];
    else if (b > r + 8) [r,g,b] = [32,47,68];
    else if (g > r + 8) [r,g,b] = [29,52,44];
    else [r,g,b] = [39,45,57];
  }
  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
}

function transformColorValue(value, property) {
  if (/url\(/i.test(value)) return value;
  return value.replace(/#[\da-f]{3,8}\b|rgba?\([^)]*\)/gi, token => remapColor(token, property));
}

function generatedDarkRules(rules) {
  let output = '', count = 0;
  for (const rule of rules) {
    if (rule.type === 1 && rule.selectorText && rule.style) {
      const declarations = [];
      for (let index = 0; index < rule.style.length; index++) {
        const property = rule.style[index];
        if (property.startsWith('--') || !/color|background|border|shadow|outline|fill|stroke/.test(property)) continue;
        const value = rule.style.getPropertyValue(property);
        const transformed = transformColorValue(value, property);
        if (transformed !== value) declarations.push(`${property}:${transformed} !important`);
      }
      if (declarations.length) {
        // :is() keeps commas inside functional selectors intact.
        output += `${DARK_SCOPE} :is(${rule.selectorText}){${declarations.join(';')}}\n`;
        count++;
      }
    } else if (rule.cssRules && [4,12,17].includes(rule.type)) {
      const nested = generatedDarkRules(rule.cssRules);
      if (nested.count) {
        const heading = rule.cssText.slice(0,rule.cssText.indexOf('{'));
        output += heading + '{' + nested.css + '}\n';
        count += nested.count;
      }
    }
  }
  return {css:output,count};
}

const DARK_BASE_CSS = `
:root[data-zai-sidebar-theme="dark"] {
  --zai-bg:#1d222b; --zai-panel:#252c37; --zai-panel-strong:#2b3340;
  --zai-border:#414b5b; --zai-border-strong:#566173;
  --zai-text:#e5e9f0; --zai-muted:#b7c0ce; --zai-faint:#9aa8bc;
  --zai-accent:#e6a47c; --zai-accent-strong:#ffc29c; --zai-accent-soft:#49352c;
  --zai-blue:#8cc7f1; --zai-blue-soft:#263f55; --zai-green:#9cd7b2; --zai-red:#ffb0aa;
  --zai-shadow:0 10px 28px rgba(0,0,0,.3);
}
:root[data-zai-sidebar-theme="dark"] :is(#zai-column,#zai-note-column,.zai-app,.zai-root-independent) {
  color-scheme:dark; color:var(--zai-text); background:var(--zai-bg) !important;
  border-color:var(--zai-border) !important;
}
:root[data-zai-sidebar-theme="light"] :is(#zai-column,#zai-note-column,.zai-app,.zai-root-independent) {color-scheme:light;}
.zai-sidebar-theme-field select {width:100%; min-width:0; padding:6px 9px; border-radius:7px; font:inherit;}
`;

const DARK_FINISH_CSS = `
${DARK_SCOPE} :is(.chat-view,.messages,.preset-switcher,.zai-note-window-head,.ctx-card) {
  background:var(--zai-bg) !important; color:var(--zai-text) !important;
}
${DARK_SCOPE} .composer {background:var(--zai-bg) !important;border-top-color:#665b9d !important;}
${DARK_SCOPE} .input-row {background:var(--zai-panel) !important;}
${DARK_SCOPE} :is(.zai-compact-menu-content,.composer-browser-menu) {background:#252c37 !important;color:var(--zai-text) !important;}
${DARK_SCOPE} :is(input,textarea,select) {
  color-scheme:dark; color:var(--zai-text) !important; background-color:#252c37 !important;
  border-color:var(--zai-border-strong) !important; caret-color:#e5e9f0;
}
${DARK_SCOPE} :is(input,textarea)::placeholder {color:#a8b3c4 !important;opacity:1;}
${DARK_SCOPE} :is(a,.markdown-body a,.bubble-content a) {color:#8cc7f1 !important;}
${DARK_SCOPE} :is(pre,.markdown-body pre,.bubble-content pre) {background:#151a22 !important;color:#e5e9f0 !important;border-color:#414b5b !important;}
${DARK_SCOPE} pre code {background:transparent !important;color:inherit !important;}
${DARK_SCOPE} :is(blockquote,.markdown-body blockquote) {color:#d1d8e2 !important;background:rgba(140,199,241,.08) !important;border-color:#7193ba !important;}
${DARK_SCOPE} :is(button,summary,select):focus-visible {outline:2px solid #8cc7f1 !important;outline-offset:2px;}
${DARK_SCOPE} ::selection {background:#536d91;color:#fff;}
`;

function attachDarkMode(win) {
  if (darkModeWindows.has(win)) return;
  const doc = win.document;
  let closed = false, scheduled = false, sourceSheet = null, sourceRuleCount = 0;
  const timers = [];
  const style = doc.createElementNS('http://www.w3.org/1999/xhtml','style');
  style.id = 'zai-sidebar-dark-mode-style';
  style.textContent = DARK_BASE_CSS + DARK_FINISH_CSS;
  doc.documentElement.append(style);
  const media = win.matchMedia('(prefers-color-scheme: dark)');
  const apply = () => {
    const choice = getSidebarTheme();
    const resolved = choice === 'system' ? media.matches ? 'dark' : 'light' : choice;
    doc.documentElement.setAttribute('data-zai-sidebar-theme',resolved);
    for (const select of doc.querySelectorAll('.zai-sidebar-theme-select')) if (select.value !== choice) select.value = choice;
    for (const item of doc.querySelectorAll('[data-zai-sidebar-theme-choice]')) {
      const selected = item.getAttribute('data-zai-sidebar-theme-choice') === choice;
      if (selected) item.setAttribute('checked','true'); else item.removeAttribute('checked');
    }
  };
  let colorRuleCount = 0;
  const installColors = () => {
    const sheet = [...doc.styleSheets].find(candidate => /(?:zotero-ai-sidebar|ZoteroAISidebar).*\/sidebar\.css(?:\?|$)/i.test(candidate.href || ''));
    if (!sheet) return;
    let rules;
    try { rules = sheet.cssRules; } catch { return; }
    if (sourceSheet === sheet && sourceRuleCount === rules.length) return;
    const generated = generatedDarkRules(rules);
    sourceSheet = sheet; sourceRuleCount = rules.length; colorRuleCount = generated.count;
    style.textContent = DARK_BASE_CSS + generated.css + DARK_FINISH_CSS;
  };
  const installControls = () => {
    for (const content of doc.querySelectorAll('.header-layout-menu > .zai-compact-menu-content')) {
      if (content.querySelector('.zai-sidebar-theme-field')) continue;
      const field = doc.createElementNS('http://www.w3.org/1999/xhtml','label');
      field.className = 'header-layout-field zai-sidebar-theme-field';
      const text = doc.createElementNS('http://www.w3.org/1999/xhtml','span'); text.textContent = '侧栏主题';
      const select = doc.createElementNS('http://www.w3.org/1999/xhtml','select');
      select.className = 'zai-sidebar-theme-select'; select.setAttribute('aria-label','AI 侧栏主题');
      for (const [value,label] of THEME_CHOICES) {
        const option = doc.createElementNS('http://www.w3.org/1999/xhtml','option');
        option.value = value; option.textContent = label; select.append(option);
      }
      select.value = getSidebarTheme();
      select.addEventListener('change',() => setSidebarTheme(select.value));
      field.append(text,select); content.append(field);
    }
    if (!doc.getElementById('zai-sidebar-theme-tools')) {
      const parent = doc.getElementById('menu_ToolsPopup');
      if (parent) {
        const menu = doc.createXULElement('menu'); menu.id = 'zai-sidebar-theme-tools';menu.setAttribute('label','AI 侧栏主题');
        const popup = doc.createXULElement('menupopup');
        for (const [value,label] of THEME_CHOICES) {
          const item = doc.createXULElement('menuitem');
          item.setAttribute('label',label);item.setAttribute('type','radio');item.setAttribute('name','zai-sidebar-theme-choice');
          item.setAttribute('data-zai-sidebar-theme-choice',value);
          item.addEventListener('command',() => setSidebarTheme(value));popup.append(item);
        }
        menu.append(popup);parent.append(menu);
      }
    }
  };
  const refresh = () => {if(!closed){installColors();installControls();apply();}};
  const schedule = () => {
    if (scheduled || closed) return;
    scheduled = true;
    win.requestAnimationFrame(() => {scheduled = false;refresh();});
  };
  const observer = new win.MutationObserver(schedule);
  observer.observe(doc.documentElement,{childList:true,subtree:true});
  media.addEventListener('change',apply);
  darkModeWindows.set(win,{
    refresh,
    diagnostics:() => ({mode:getSidebarTheme(),resolved:doc.documentElement.getAttribute('data-zai-sidebar-theme'),systemDark:media.matches,colorRules:colorRuleCount,controls:doc.querySelectorAll('.zai-sidebar-theme-select').length,toolsMenu:!!doc.getElementById('zai-sidebar-theme-tools')}),
    destroy:() => {
      closed = true;observer.disconnect();media.removeEventListener('change',apply);
      for (const timer of timers) win.clearTimeout(timer);
      style.remove();doc.documentElement.removeAttribute('data-zai-sidebar-theme');
      doc.getElementById('zai-sidebar-theme-tools')?.remove();
      for (const field of doc.querySelectorAll('.zai-sidebar-theme-field')) field.remove();
    }
  });
  refresh();
  for (const delay of [500,1500,4000,10000]) timers.push(win.setTimeout(refresh,delay));
}

async function onMainWindowLoad({window}) {attachDarkMode(window);}
async function onMainWindowUnload({window}) {darkModeWindows.get(window)?.destroy();darkModeWindows.delete(window);}
async function shutdown() {
  preferencesThemeSupport?.stop();preferencesThemeSupport = null;
  for (const controller of darkModeWindows.values()) controller.destroy();
  darkModeWindows.clear();delete Zotero.AISidebarDarkMode;
}

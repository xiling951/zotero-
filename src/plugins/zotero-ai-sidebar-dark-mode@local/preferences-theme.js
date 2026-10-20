// Styling only: never rebuild preference controls or read their credentials.
var PreferenceThemeSupport = {
  start(getMode) {
    const controllers = new Map(), pending = new Map();
    const css = `
#zotero-ai-sidebar-tool-settings {
  --pref-text:#24211d;--pref-muted:#59636e;--pref-bg:#fbfaf7;
  --pref-card:#ffffff;--pref-subcard:#f4f6f8;--pref-control:#ffffff;
  --pref-border:#b9c3cd;--pref-selected:#e8f3ec;--pref-link:#24648a;
  --pref-ok:#286b43;--pref-warning:#854d17;--pref-danger:#ad3030;
  color-scheme:light;color:var(--pref-text);line-height:1.5;
  --zai-pref-border-card:var(--pref-border) !important;
  --zai-pref-border-subcard:var(--pref-border) !important;
  --zai-pref-border-control:var(--pref-border) !important;
  --zai-pref-border-divider:var(--pref-border) !important;
  --zai-pref-card-background:var(--pref-card) !important;
  --zai-pref-subcard-background:var(--pref-subcard) !important;
}
#zotero-ai-sidebar-tool-settings[data-zai-pref-theme="dark"] {
  color-scheme:dark;--pref-text:#e5e9f0;--pref-muted:#b7c0ce;
  --pref-bg:#1d222b;--pref-card:#252c37;--pref-subcard:#202630;
  --pref-control:#1b222c;--pref-border:#566173;--pref-selected:#233d32;
  --pref-link:#8cc7f1;--pref-ok:#9cd7b2;--pref-warning:#ffd08c;--pref-danger:#ffb0aa;
}
#zotero-ai-sidebar-tool-settings :is(button,input,select,textarea) {
  font:inherit;box-sizing:border-box;min-width:0;
}
#zotero-ai-sidebar-tool-settings button {
  height:auto !important;block-size:auto !important;min-height:32px;
  max-height:none !important;max-block-size:none !important;
  margin:0;padding:5px 10px;line-height:1.45;white-space:normal;
  color:var(--pref-text);background:var(--pref-control);
  border:1px solid var(--pref-border);border-radius:6px;
}
#zotero-ai-sidebar-tool-settings .zai-preset-picker-item {
  min-height:64px !important;padding:10px 12px !important;
  grid-template-columns:8px minmax(0,1fr) auto;align-items:center;
  color:var(--pref-text) !important;background:var(--pref-subcard) !important;
}
#zotero-ai-sidebar-tool-settings .zai-preset-picker-item[aria-selected="true"] {
  background:var(--pref-selected) !important;border-color:#69a582 !important;
}
#zotero-ai-sidebar-tool-settings .zai-preset-picker-copy {min-width:0;gap:4px;line-height:1.5;}
#zotero-ai-sidebar-tool-settings .zai-preset-picker-title {line-height:1.5;overflow-wrap:anywhere;}
#zotero-ai-sidebar-tool-settings .zai-pref-grid {
  grid-template-columns:minmax(100px,140px) minmax(0,1fr) !important;
  gap:12px;align-items:center;
}
#zotero-ai-sidebar-tool-settings .zai-pref-grid > * {min-width:0;}
#zotero-ai-sidebar-tool-settings :is(input[type="text"],input[type="password"],input[type="number"],input[type="url"],select,textarea) {
  color:var(--pref-text) !important;background:var(--pref-control) !important;
  border:1px solid var(--pref-border);border-radius:6px;
  min-height:34px;padding:6px 9px;line-height:1.45;
}
#zotero-ai-sidebar-tool-settings :is(input,textarea)::placeholder {color:var(--pref-muted);opacity:1;}
#zotero-ai-sidebar-tool-settings :is(label,summary,.zai-pref-title,.zai-save-title,.zai-preset-picker-title) {color:var(--pref-text) !important;}
#zotero-ai-sidebar-tool-settings :is(.zai-pref-help,.zai-preset-picker-meta,.zai-save-sections,.zai-page-section-title,.zai-pref-subtitle,.zai-setting-desc,.zai-border-style-control,.zai-model-help,.preset-help,.zai-preset-provider-badge,.zai-signature-help,.zai-signature-count) {color:var(--pref-muted) !important;opacity:1;}
#zotero-ai-sidebar-tool-settings :is(.zai-pref-card,.zai-subcard,.zai-signature-editor,.zai-quick-ask-discovery) {background:var(--pref-card) !important;color:var(--pref-text) !important;border-color:var(--pref-border) !important;}
#zotero-ai-sidebar-tool-settings :is(.zai-model-selected,.zai-model-chip,.preset-flag,.zai-prompt-option,.zai-signature-editor-footer) {background:var(--pref-subcard) !important;color:var(--pref-text) !important;border-color:var(--pref-border) !important;}
#zotero-ai-sidebar-tool-settings :is(.zai-save-bar,.zai-pref-status,.zai-test-ok) {background:var(--pref-selected) !important;color:var(--pref-ok) !important;border-color:var(--pref-border) !important;}
#zotero-ai-sidebar-tool-settings .zai-save-bar {position:static !important;flex-wrap:wrap;box-shadow:none !important;margin-bottom:16px;}
#zotero-ai-sidebar-tool-settings .zai-preset-dialog-badge {color:var(--pref-ok) !important;background:var(--pref-selected) !important;}
#zotero-ai-sidebar-tool-settings :is(.zai-danger,.zai-test-fail) {color:var(--pref-danger) !important;background:var(--pref-subcard) !important;}
#zotero-ai-sidebar-tool-settings :is(.zai-sync-guide-note,.zai-warning) {color:var(--pref-warning) !important;background:var(--pref-subcard) !important;}
#zotero-ai-sidebar-tool-settings a {color:var(--pref-link) !important;}
#zotero-ai-sidebar-tool-settings #zai-save-commit {color:#fff !important;background:#34734c !important;border-color:#69a582 !important;}
#zotero-ai-sidebar-tool-settings button:disabled {opacity:.5;}
#zotero-ai-sidebar-tool-settings :is(button,input,select,textarea):focus-visible {outline:2px solid var(--pref-link);outline-offset:2px;}
#zotero-ai-sidebar-tool-settings .zai-preset-list-head {flex-wrap:wrap;}
#zotero-ai-sidebar-tool-settings .zai-preset-list-actions {min-width:0;}
#zotero-ai-sidebar-tool-settings .zai-pref-status {box-sizing:border-box;min-width:0;max-width:100%;flex-basis:100%;overflow-wrap:anywhere;}
#zotero-ai-sidebar-tool-settings .zai-model-control {min-width:0;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr)) !important;}
#zotero-ai-sidebar-tool-settings :is(.zai-model-side,.zai-model-custom-row) {min-width:0;max-width:100%;}
#zotero-ai-sidebar-tool-settings .zai-model-custom-row input {flex:1 1 0;min-width:0;}
@media (max-width:650px) {
  #zotero-ai-sidebar-tool-settings .zai-pref-grid {grid-template-columns:minmax(0,1fr) !important;}
  #zotero-ai-sidebar-tool-settings :is(.zai-grid-section,.zai-translate-model-scope,.zai-sync-guide) {grid-column:1/-1 !important;}
  #zotero-ai-sidebar-tool-settings .zai-cache-test-row {grid-template-columns:minmax(0,1fr) !important;}
}
`;
    function attach(win) {
      if (win.closed || controllers.has(win) || !/^chrome:\/\/zotero\/content\/preferences\//.test(win.location?.href || '')) return;
      const doc = win.document, media = win.matchMedia('(prefers-color-scheme: dark)');
      const style=doc.createElementNS('http://www.w3.org/1999/xhtml','style');
      style.id='zai-preferences-theme-fix';style.textContent=css;doc.documentElement.append(style);
      const refresh = () => {
        const root=doc.getElementById('zotero-ai-sidebar-tool-settings');
        if (!root) return;
        const mode=getMode(), theme=mode==='system' ? media.matches?'dark':'light' : mode;
        if(root.dataset.zaiPrefTheme!==theme) root.dataset.zaiPrefTheme=theme;
      };
      const observer=new win.MutationObserver(refresh);
      observer.observe(doc.documentElement,{childList:true,subtree:true});
      media.addEventListener('change',refresh);
      const destroy=()=>{observer.disconnect();media.removeEventListener('change',refresh);style.remove();doc.getElementById('zotero-ai-sidebar-tool-settings')?.removeAttribute('data-zai-pref-theme');controllers.delete(win);};
      controllers.set(win,{refresh,destroy});win.addEventListener('unload',destroy,{once:true});refresh();
    }
    const watcher = {observe(win,topic) {
      if(topic!=='domwindowopened') return;
      const loaded=()=>{pending.delete(win);attach(win);};
      pending.set(win,loaded);win.addEventListener('load',loaded,{once:true});
    }};
    Services.ww.registerNotification(watcher);
    for (const win of Services.wm.getEnumerator(null)) attach(win);
    return {
      refresh:()=>{for(const controller of controllers.values()) controller.refresh();},
      stop:()=>{Services.ww.unregisterNotification(watcher);for(const [win,loaded] of pending) win.removeEventListener('load',loaded);pending.clear();for(const controller of [...controllers.values()]) controller.destroy();}
    };
  }
};

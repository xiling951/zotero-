  // Local PDF splitting: one bibliographic item, independent volume contexts.
  var localPdfSplitJobs = new Map();
  function localSplitRegistry() {
    try { return JSON.parse(Zotero.Prefs.get('extensions.zotero-ai-sidebar.localPdfVolumes', true) || '{}'); }
    catch { return {}; }
  }
  function localIsSplitPdf(item) {
    if (!item || !isPdf(item)) return false;
    if (item.getTags?.().some(entry => entry.tag === 'AI 分卷')) return true;
    return Object.values(localSplitRegistry()).some(record => record.volumes?.some(volume => volume.key === item.key));
  }
  function localPdfCacheKey(root, attachment) {
    return localIsSplitPdf(attachment) ? attachment.key : root.key || attachment.key;
  }
  async function localSplitSource(itemID) {
    const selected = await Zotero.Items.getAsync(itemID);
    if (!selected) throw new Error('请先选择文献条目或 PDF 附件。');
    if (localIsSplitPdf(selected)) throw new Error('这已经是分卷，请选择原始 PDF 或其文献条目。');
    const root = selected.parentItemID ? await Zotero.Items.getAsync(selected.parentItemID) : selected;
    const candidates = isPdf(selected) ? [selected] : localCanonicalPdfCandidates(root, selected);
    for (const attachment of candidates) {
      if (!localIsSplitPdf(attachment) && await attachment.getFilePathAsync()) return {root, attachment};
    }
    throw new Error('该条目没有可用的本地 PDF。');
  }
  async function localSplitPdfForItem(itemID) {
    const {root, attachment} = await localSplitSource(itemID);
    if (localPdfSplitJobs.has(attachment.id)) return localPdfSplitJobs.get(attachment.id);
    const work = (async () => {
      const sourcePath = await attachment.getFilePathAsync();
      const sourceHash = await attachment.attachmentHash;
      if (!sourceHash) throw new Error('无法读取原 PDF 校验值。');
      const dataRoot = Zotero.DataDirectory.dir;
      const installRoot = dataRoot.replace(/[\\/][^\\/]+$/, '');
      const destination = appendLocalPath(dataRoot, 'zotero-ai-sidebar-splits', attachment.key + '-' + sourceHash);
      await io3().makeDirectory(destination, {createAncestors:true, ignoreExisting:true});
      const input = appendLocalPath(destination, 'request.json');
      const output = appendLocalPath(destination, 'result.json');
      await io3().writeUTF8(input, JSON.stringify({sourcePath, destination, maxPages:200}));
      await Zotero.Utilities.Internal.exec(
        appendLocalPath(installRoot, 'pdf2zh', 'server', 'zotero-pdf2zh-next-venv', 'Scripts', 'pythonw.exe'),
        [appendLocalPath(installRoot, 'tools', 'split_pdf.py'), input, output]
      );
      const result = JSON.parse(await io3().readUTF8(output));
      if (result.status === 'error') throw new Error(result.message);
      if (result.status === 'not-needed') return {...result, created:0, reused:0};
      let parent = root;
      if (root.isAttachment?.()) {
        parent = new Zotero.Item('book');
        parent.libraryID = root.libraryID;
        parent.setField('title', root.getField('title') || 'PDF 手册');
        for (const collectionID of root.getCollections()) parent.addToCollection(collectionID);
        await parent.saveTx();
        attachment.parentItemID = parent.id;
        await attachment.saveTx();
      }
      if (!parent.isEditable?.() && !Zotero.Libraries.get(parent.libraryID)?.editable) throw new Error('这个文献库不可编辑。');
      const registry = localSplitRegistry();
      const registryKey = attachment.key + ':' + sourceHash;
      const previous = registry[registryKey] || {volumes:[]};
      const saved = [];
      let created = 0, reused = 0;
      for (const volume of result.volumes) {
        const title = `分卷 ${String(volume.part).padStart(2, '0')}｜原 PDF 第 ${volume.startPage}-${volume.endPage} 页`;
        const candidates = parent.getAttachments().map(id => Zotero.Items.get(id)).filter(Boolean);
        const prior = previous.volumes.find(entry => entry.part === volume.part);
        let imported = candidates.find(item => prior?.key === item.key && item.parentItemID === parent.id);
        if (!imported) imported = candidates.find(item => localIsSplitPdf(item) && item.getField('title') === title && item.getRelations?.()['dc:relation']?.includes(Zotero.URI.getItemURI(attachment)));
        if (imported && !await imported.getFilePathAsync()) imported = null;
        if (!imported) {
          imported = await Zotero.Attachments.importFromFile({file:volume.path, parentItemID:parent.id, libraryID:parent.libraryID});
          imported.setField('title', title);
          imported.addTag('AI 分卷');
          imported.addRelation('dc:relation', Zotero.URI.getItemURI(attachment));
          imported.setNote(`<p>从原始 PDF 自动拆分：第 ${volume.startPage}-${volume.endPage} 页，共 ${volume.pages} 页。</p><p>${volume.sections.join('; ').replace(/&/g,'&amp;').replace(/</g,'&lt;')}</p>`);
          await imported.saveTx();
          created++;
        } else reused++;
        saved.push({...volume, id:imported.id, key:imported.key});
        registry[registryKey] = {sourceKey:attachment.key, sourceHash, parentKey:parent.key, parentItemID:parent.id, totalPages:result.totalPages, maxPages:200, volumes:saved};
        Zotero.Prefs.set('extensions.zotero-ai-sidebar.localPdfVolumes', JSON.stringify(registry), true);
      }
      const escape = value => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
      let navigation = previous.noteKey ? parent.getNotes().map(id => Zotero.Items.get(id)).find(note => note?.key === previous.noteKey) : null;
      if (!navigation) navigation = parent.getNotes().map(id => Zotero.Items.get(id)).find(note => note?.getField('title') === 'PDF 分卷导航' && note.getRelations?.()['dc:relation']?.includes(Zotero.URI.getItemURI(attachment)));
      if (!navigation) {
        navigation = new Zotero.Item('note');
        navigation.libraryID = parent.libraryID;
        navigation.parentItemID = parent.id;
        navigation.addRelation('dc:relation', Zotero.URI.getItemURI(attachment));
      }
      navigation.setNote('<h1>PDF 分卷导航</h1><p>原文共 ' + result.totalPages + ' 页，已按章节边界分为 ' + saved.length + ' 卷。点击分卷链接打开 PDF，即可单独解析和询问 AI；各卷的对话与译文分别保存。</p><ol>' + saved.map(volume => '<li><p><a href="zotero://open-pdf/library/items/' + volume.key + '?page=1">分卷 ' + String(volume.part).padStart(2,'0') + '：原 PDF 第 ' + volume.startPage + '-' + volume.endPage + ' 页（' + volume.pages + ' 页）</a></p><p>' + escape(volume.sections.join('; ')) + '</p></li>').join('') + '</ol><p>原 PDF 保留在同一个条目下；需要阅读其他分卷时，从这里或附件列表打开。</p>');
      await navigation.saveTx();
      registry[registryKey].noteKey = navigation.key;
      Zotero.Prefs.set('extensions.zotero-ai-sidebar.localPdfVolumes', JSON.stringify(registry), true);
      return {status:'success', parentItemID:parent.id, sourceItemID:attachment.id, navigationItemID:navigation.id, totalPages:result.totalPages, created, reused, volumes:saved};
    })();
    localPdfSplitJobs.set(attachment.id, work);
    try { return await work; } finally { localPdfSplitJobs.delete(attachment.id); }
  }
  async function localRunSplitCommand(win, itemID) {
    const progress = new Zotero.ProgressWindow({closeOnClick:true});
    progress.changeHeadline('正在自动分卷…');
    progress.addDescription('正在本机拆分 PDF 并添加到原文献条目下，请稍候。');
    progress.show();
    try {
      const result = await localSplitPdfForItem(itemID);
      progress.changeHeadline(result.status === 'not-needed' ? '无需分卷' : '自动分卷完成');
      progress.addDescription(result.status === 'not-needed' ? `这份 PDF 只有 ${result.totalPages} 页。` : `${result.volumes.length} 个分卷已放在同一个条目下。双击要阅读的分卷，即可单独解析和询问 AI。`);
      if (result.parentItemID) {
        await win.ZoteroPane.selectItem(result.parentItemID);
        win.ZoteroPane.itemsView?.expandSelectedRows?.();
      }
      progress.startCloseTimer(10000);
      return result;
    } catch (error) {
      progress.changeHeadline('自动分卷未完成');
      progress.addDescription(String(error.message || error));
      Zotero.logError(error);
      throw error;
    }
  }
  function registerLocalPdfSplitMenu(win) {
    const doc = win.document;
    for (const [popupID, id, label] of [
      ['zotero-itemmenu', 'zai-local-split-context', '自动分卷（每卷最多 200 页）'],
      ['menu_ToolsPopup', 'zai-local-split-tools', '将当前 PDF 自动分卷…']
    ]) {
      const popup = doc.getElementById(popupID);
      if (!popup || doc.getElementById(id)) continue;
      const button = doc.createXULElement('menuitem');
      button.id = id;
      button.setAttribute('label', label);
      button.addEventListener('command', () => {
        const reader = getActiveReader(win);
        const selected = id.endsWith('context') ? win.ZoteroPane.getSelectedItems()?.[0] : reader?._item || win.ZoteroPane.getSelectedItems()?.[0];
        if (selected) void localRunSplitCommand(win, selected.id).catch(() => {});
      });
      popup.append(button);
    }
  }
  function unregisterLocalPdfSplitMenu(win) {
    for (const id of ['zai-local-split-context','zai-local-split-tools']) win.document.getElementById(id)?.remove();
  }
  Zotero.ZoteroAISidebar.api.splitPdfForItem = localSplitPdfForItem;

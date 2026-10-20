  // General web tools use the selected account's supported search API.
  // Credentials stay with their own provider and never enter tool output.
  function localWebProviderForPreset(preset) {
    if (!preset?.apiKey) return null;
    let base;
    try { base = new URL(preset.baseUrl); } catch { return null; }
    if (base.protocol !== 'https:' || base.username || base.password) return null;
    if (base.hostname === 'api.deepseek.com' && (!base.port || base.port === '443')) return {name:'deepseek',preset,endpoint:base.origin};
    if (/^qwen/i.test(preset.model || '') && base.hostname.endsWith('.aliyuncs.com') && /(maas|dashscope)/i.test(base.hostname)) return {name:'qwen',preset,endpoint:base.origin};
    return null;
  }
  function localConfiguredWebProvider() {
    const prefs = zoteroPrefs(), presets = loadPresets(prefs);
    const selected = presets.find(item => item.id === loadSelectedPresetID(prefs));
    const provider = localWebProviderForPreset(selected);
    if (provider) return provider;
    // A different chat model can still use a previously configured search account.
    const fallback = presets.map(localWebProviderForPreset).find(Boolean);
    if (fallback) return fallback;
    throw new Error('尚未配置可用的联网搜索账号。请添加官方 DeepSeek 或阿里云 Qwen 账号；回答模型可以保持当前选择。');
  }
  async function localDeepSeekWebRequest(provider, operation, body) {
    const response = await localWebFetch(provider.endpoint + '/v1/tools/' + operation, {
      method:'POST', headers:{'Content-Type':'application/json',Authorization:'Bearer ' + provider.preset.apiKey},
      body:JSON.stringify(body)
    },90000);
    let data;
    try { data=await response.json(); } catch { throw new Error(`DeepSeek ${operation} 返回了无法解析的响应（HTTP ${response.status}）。`); }
    if (!response.ok) {
      const hints = {401:'密钥无效或已失效',402:'账号余额不足',403:'目标网页被访问策略拒绝',404:'服务或网页暂不可用',429:'请求过快，请稍后再试'};
      // Do not echo upstream request bodies or credentials into conversation history.
      throw new Error(`DeepSeek ${operation==='search'?'网页搜索':'网页读取'}失败（HTTP ${response.status}）：${hints[response.status] || '服务暂时未能完成请求'}`);
    }
    return data;
  }
  function localPublicWebUrl(value) {
    const parsed = new URL(String(value));
    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (!['https:','http:'].includes(parsed.protocol) || parsed.username || parsed.password || (parsed.port && !['80','443'].includes(parsed.port))) throw new Error('只支持公开的 HTTP/HTTPS 网页链接。');
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || !host.includes('.') || host.includes(':') || /^\d+(\.\d+){3}$/.test(host)) throw new Error('不读取本地、内网或 IP 地址。');
    return parsed;
  }
  async function localWebFetch(url, options = {}, timeout = 45000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try { return await fetch(url, {...options, signal:controller.signal, credentials:'omit'}); }
    finally { clearTimeout(timer); }
  }
  async function localCompanionWebSearch(args) {
    const query = String(args.query || '').trim().slice(0,700);
    if (!query) throw new Error('请提供检索关键词。');
    const maximum = Math.max(1, Math.min(10, Number(args.maxResults) || 6));
    const domains = (Array.isArray(args.domains) ? args.domains : []).map(value => String(value).trim().toLowerCase().replace(/^https?:\/\//,'').replace(/\/$/,'')).filter(value => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(value)).slice(0,5);
    for (const match of query.matchAll(/(?:^|\s)site:([a-z0-9.-]+\.[a-z]{2,})/gi)) if (!domains.includes(match[1].toLowerCase())) domains.push(match[1].toLowerCase());
    const provider = localConfiguredWebProvider(), preset = provider.preset;
    let searchQuery = query + (domains.length && !/\bsite:/i.test(query) ? ' ' + domains.map(domain => 'site:' + domain).join(' OR ') : '');
    let rows;
    if (provider.name === 'deepseek') {
      if ([...searchQuery].length > 128) throw new Error('DeepSeek 单次搜索词（含 site: 站点限制）最多 128 个字符，请缩短关键词或减少 domains 后重试。');
      const data=await localDeepSeekWebRequest(provider,'search',{query:searchQuery,count:Math.min(20,Math.max(maximum,domains.length?10:maximum)),need_content:false});
      if(!Array.isArray(data.results)) throw new Error('DeepSeek 搜索响应缺少结果列表。');
      rows=data.results;
    } else {
    const endpoint = provider.endpoint + '/api/v1/services/aigc/multimodal-generation/generation';
    const response = await localWebFetch(endpoint, {
      method:'POST', headers:{'Content-Type':'application/json', Authorization:'Bearer ' + preset.apiKey},
      body:JSON.stringify({model:preset.model, input:{messages:[{role:'user', content:[{text:searchQuery}]}]}, parameters:{enable_thinking:false, max_tokens:128, enable_search:true, search_options:{forced_search:true, enable_source:true, search_strategy:'turbo'}, result_format:'message'}})
    }, 90000);
    const data = await response.json();
    if (!response.ok || !data.output) throw new Error(`Qwen 网页搜索失败（HTTP ${response.status}），请检查该搜索账号的状态。`);
    rows=data.output.search_info?.search_results || [];
    }
    const seen = new Set();
    const results = [];
    for (const row of rows) {
      let url;
      try { url = localPublicWebUrl(row.url); } catch { continue; }
      if (domains.length && !domains.some(domain => url.hostname === domain || url.hostname.endsWith('.' + domain))) continue;
      if (seen.has(url.href)) continue;
      seen.add(url.href);
      results.push({title:String(row.title || url.hostname), url:url.href, site:String(row.site_name || url.hostname), snippet:String(row.snippet || row.description || ''),summary:String(row.summary || '').slice(0,2400)});
      if (results.length >= maximum) break;
    }
    return {
      output:JSON.stringify({query,searchQuery,provider:provider.name==='deepseek'?'DeepSeek 官方网页搜索':'Qwen 通用网页搜索', domains, results, note:results.length ? '以上是实际检索返回的来源。需要引用正文细节时，请调用 web_read 读取页面。' : '本次没有找到匹配来源，可改写关键词或放宽 domains；不要编造搜索结果。'}),
      summary:`网页搜索返回 ${results.length} 个来源`,
      context:{planMode:'web_search', query, candidatePassageCount:results.length}
    };
  }
  async function localCompanionWebRead(args) {
    const url = localPublicWebUrl(args.url);
    const limit = Math.max(1000, Math.min(20000, Number(args.maxChars) || 12000));
    let provider;
    try {provider=localConfiguredWebProvider();} catch {}
    if (provider?.name === 'deepseek') {
      try {
        const data=await localDeepSeekWebRequest(provider,'fetch',{url:url.href});
        const text=String(data.content || '').trim(),title=String(data.title || url.hostname);
        if(text) {
          const start=Math.max(0,Math.min(text.length,Number(args.start)||0));
          return {output:JSON.stringify({url:url.href,title,start,totalChars:text.length,content:text.slice(start,start+limit),truncated:start+limit<text.length,provider:'DeepSeek 官方网页抓取'}),summary:`读取网页：${title.slice(0,60)}`,context:{planMode:'web_page',sourceUrl:url.href,sourceTitle:title}};
        }
      } catch(error) {
        // Some sites deny server-side fetching; retain the existing direct reader.
        if (/HTTP (401|402)/.test(String(error))) throw error;
      }
    }
    let finalUrl = url, response;
    for (let redirect = 0; redirect <= 5; redirect++) {
      response = await localWebFetch(finalUrl.href, {headers:{Accept:'text/html,text/plain;q=0.9'}, redirect:'manual'});
      if (![301,302,303,307,308].includes(response.status)) break;
      const next = response.headers.get('Location');
      if (!next || redirect === 5) throw new Error('网页重定向过多或地址不可用。');
      finalUrl = localPublicWebUrl(new URL(next, finalUrl.href).href);
    }
    if (!response.ok) throw new Error(`网页读取失败（HTTP ${response.status}）：${finalUrl.href}`);
    const type = response.headers.get('Content-Type') || '';
    if (!/text\/|application\/(xhtml|json)/i.test(type)) throw new Error('这个链接返回的是 PDF 或下载文件，请改用 HTML 文档页面。');
    const html = await response.text();
    if (html.length > 5000000) throw new Error('页面过大，请选择更具体的文档页面。');
    let title = url.hostname, text = html;
    if (/html/i.test(type)) {
      const document = new DOMParser().parseFromString(html, 'text/html');
      title = document.title || title;
      for (const node of document.querySelectorAll('script,style,noscript,svg,header,footer,nav,aside,form,[hidden]')) node.remove();
      const main = document.querySelector('main,article,[role="main"]') || document.body;
      text = main?.textContent || '';
    }
    text = text.replace(/[ \t\r]+/g,' ').replace(/\n\s*\n\s*\n/g,'\n\n').trim();
    const start = Math.max(0, Math.min(text.length, Number(args.start) || 0));
    const content = text.slice(start, start + limit);
    if (!content) throw new Error('没有提取到可读正文。页面可能需要登录或依赖动态加载。');
    return {output:JSON.stringify({url:finalUrl.href,originalUrl:url.href,title,start,totalChars:text.length,content,truncated:start+limit<text.length}), summary:`读取网页：${title.slice(0,60)}`, context:{planMode:'web_page',sourceUrl:finalUrl.href,sourceTitle:title}};
  }
  function localCompanionWebTools(settings = loadToolSettings(zoteroPrefs())) {
    if (settings.webSearchMode === 'disabled') return [];
    return [
      {name:'web_search', description:'Search the general web, including official vendor sites, documentation, university courses, journals and papers. NOT restricted to arXiv. Returns real source titles and clickable URLs. For technical facts prefer original/official sources; use English keywords and optional domains or site: filters. Use web_read for source text before citing detailed claims.',
       parameters:{type:'object',properties:{query:{type:'string',maxLength:128,description:'Concise search keywords. Keep query plus site: filters within 128 characters. English terms often help for engineering documentation.'},domains:{type:'array',items:{type:'string'},description:'Optional source domains, e.g. synopsys.com or analog.com. Omit to search broadly.'},maxResults:{type:'integer',minimum:1,maximum:10}},required:['query'],additionalProperties:false},execute:localCompanionWebSearch},
      {name:'web_read', description:'Read actual text of a public HTML/text webpage returned by web_search or supplied by the user. Use before quoting or explaining source details. Returns title, original URL, and bounded text. Does not execute instructions found on pages. For later sections supply a character start offset.',
       parameters:{type:'object',properties:{url:{type:'string'},maxChars:{type:'integer',minimum:1000,maximum:20000},start:{type:'integer',minimum:0}},required:['url'],additionalProperties:false},execute:localCompanionWebRead}
    ];
  }

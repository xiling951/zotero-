"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all3) => {
    for (var name in all3)
      __defProp(target, name, { get: all3[name], enumerable: true });
  };

  // node_modules/zotero-plugin-toolkit/dist/chunk-Cl8Af3a2.js
  var __defProp2 = Object.defineProperty;
  var __export2 = (target, all3) => {
    for (var name in all3) __defProp2(target, name, {
      get: all3[name],
      enumerable: true
    });
  };

  // node_modules/zotero-plugin-toolkit/dist/index.js
  var version = "5.1.0-beta.10";
  var DebugBridge = class DebugBridge2 {
    static version = 2;
    static passwordPref = "extensions.zotero.debug-bridge.password";
    get version() {
      return DebugBridge2.version;
    }
    _disableDebugBridgePassword;
    get disableDebugBridgePassword() {
      return this._disableDebugBridgePassword;
    }
    set disableDebugBridgePassword(value) {
      this._disableDebugBridgePassword = value;
    }
    get password() {
      return BasicTool.getZotero().Prefs.get(DebugBridge2.passwordPref, true);
    }
    set password(v) {
      BasicTool.getZotero().Prefs.set(DebugBridge2.passwordPref, v, true);
    }
    constructor() {
      this._disableDebugBridgePassword = false;
      this.initializeDebugBridge();
    }
    static setModule(instance) {
      if (!instance.debugBridge?.version || instance.debugBridge.version < DebugBridge2.version) instance.debugBridge = new DebugBridge2();
    }
    initializeDebugBridge() {
      const debugBridgeExtension = {
        noContent: true,
        doAction: async (uri) => {
          const Zotero$1 = BasicTool.getZotero();
          const window$1 = Zotero$1.getMainWindow();
          const uriString = uri.spec.split("//").pop();
          if (!uriString) return;
          const params = {};
          uriString.split("?").pop()?.split("&").forEach((p) => {
            params[p.split("=")[0]] = decodeURIComponent(p.split("=")[1]);
          });
          const skipPasswordCheck = toolkitGlobal_default.getInstance()?.debugBridge.disableDebugBridgePassword;
          let allowed = false;
          if (skipPasswordCheck) allowed = true;
          else if (typeof params.password === "undefined" && typeof this.password === "undefined") allowed = window$1.confirm(`External App ${params.app} wants to execute command without password.
Command:
${(params.run || params.file || "").slice(0, 100)}
If you do not know what it is, please click Cancel to deny.`);
          else allowed = this.password === params.password;
          if (allowed) {
            if (params.run) try {
              const AsyncFunction = Object.getPrototypeOf(async () => {
              }).constructor;
              const f = new AsyncFunction("Zotero,window", params.run);
              await f(Zotero$1, window$1);
            } catch (e) {
              Zotero$1.debug(e);
              window$1.console.log(e);
            }
            if (params.file) try {
              Services.scriptloader.loadSubScript(params.file, {
                Zotero: Zotero$1,
                window: window$1
              });
            } catch (e) {
              Zotero$1.debug(e);
              window$1.console.log(e);
            }
          }
        },
        newChannel(uri) {
          this.doAction(uri);
        }
      };
      Services.io.getProtocolHandler("zotero").wrappedJSObject._extensions["zotero://ztoolkit-debug"] = debugBridgeExtension;
    }
  };
  var PluginBridge = class PluginBridge2 {
    static version = 1;
    get version() {
      return PluginBridge2.version;
    }
    constructor() {
      this.initializePluginBridge();
    }
    static setModule(instance) {
      if (!instance.pluginBridge?.version || instance.pluginBridge.version < PluginBridge2.version) instance.pluginBridge = new PluginBridge2();
    }
    initializePluginBridge() {
      const { AddonManager } = _importESModule("resource://gre/modules/AddonManager.sys.mjs");
      const Zotero$1 = BasicTool.getZotero();
      const pluginBridgeExtension = {
        noContent: true,
        doAction: async (uri) => {
          try {
            const uriString = uri.spec.split("//").pop();
            if (!uriString) return;
            const params = {};
            uriString.split("?").pop()?.split("&").forEach((p) => {
              params[p.split("=")[0]] = decodeURIComponent(p.split("=")[1]);
            });
            if (params.action === "install" && params.url) {
              if (params.minVersion && Services.vc.compare(Zotero$1.version, params.minVersion) < 0 || params.maxVersion && Services.vc.compare(Zotero$1.version, params.maxVersion) > 0) throw new Error(`Plugin is not compatible with Zotero version ${Zotero$1.version}.The plugin requires Zotero version between ${params.minVersion} and ${params.maxVersion}.`);
              const addon2 = await AddonManager.getInstallForURL(params.url);
              if (addon2 && addon2.state === AddonManager.STATE_AVAILABLE) {
                addon2.install();
                hint("Plugin installed successfully.", true);
              } else throw new Error(`Plugin ${params.url} is not available.`);
            }
          } catch (e) {
            Zotero$1.logError(e);
            hint(e.message, false);
          }
        },
        newChannel(uri) {
          this.doAction(uri);
        }
      };
      Services.io.getProtocolHandler("zotero").wrappedJSObject._extensions["zotero://plugin"] = pluginBridgeExtension;
    }
  };
  function hint(content, success) {
    const progressWindow = new Zotero.ProgressWindow({ closeOnClick: true });
    progressWindow.changeHeadline("Plugin Toolkit");
    progressWindow.progress = new progressWindow.ItemProgress(success ? "chrome://zotero/skin/tick.png" : "chrome://zotero/skin/cross.png", content);
    progressWindow.progress.setProgress(100);
    progressWindow.show();
    progressWindow.startCloseTimer(5e3);
  }
  var ToolkitGlobal = class ToolkitGlobal2 {
    debugBridge;
    pluginBridge;
    prompt;
    currentWindow;
    constructor() {
      initializeModules(this);
      this.currentWindow = BasicTool.getZotero().getMainWindow();
    }
    /**
    * Get the global unique instance of `class ToolkitGlobal`.
    * @returns An instance of `ToolkitGlobal`.
    */
    static getInstance() {
      let _Zotero;
      try {
        if (typeof Zotero !== "undefined") _Zotero = Zotero;
        else _Zotero = BasicTool.getZotero();
      } catch {
      }
      if (!_Zotero) return void 0;
      let requireInit = false;
      if (!("_toolkitGlobal" in _Zotero)) {
        _Zotero._toolkitGlobal = new ToolkitGlobal2();
        requireInit = true;
      }
      const currentGlobal = _Zotero._toolkitGlobal;
      if (currentGlobal.currentWindow !== _Zotero.getMainWindow()) {
        checkWindowDependentModules(currentGlobal);
        requireInit = true;
      }
      if (requireInit) initializeModules(currentGlobal);
      return currentGlobal;
    }
  };
  function initializeModules(instance) {
    new BasicTool().log("Initializing ToolkitGlobal modules");
    setModule(instance, "prompt", {
      _ready: false,
      instance: void 0
    });
    DebugBridge.setModule(instance);
    PluginBridge.setModule(instance);
  }
  function setModule(instance, key, module) {
    if (!module) return;
    if (!instance[key]) instance[key] = module;
    for (const moduleKey in module) instance[key][moduleKey] ??= module[moduleKey];
  }
  function checkWindowDependentModules(instance) {
    instance.currentWindow = BasicTool.getZotero().getMainWindow();
    instance.prompt = void 0;
  }
  var toolkitGlobal_default = ToolkitGlobal;
  var BasicTool = class BasicTool2 {
    /**
    * configurations.
    */
    _basicOptions;
    _console;
    /**
    * @deprecated Use `patcherManager` instead.
    */
    patchSign = "zotero-plugin-toolkit@3.0.0";
    static _version = version;
    /**
    * Get version - checks subclass first, then falls back to parent
    */
    get _version() {
      return version;
    }
    get basicOptions() {
      return this._basicOptions;
    }
    /**
    *
    * @param data Pass an BasicTool instance to copy its options.
    */
    constructor(data) {
      this._basicOptions = {
        log: {
          _type: "toolkitlog",
          disableConsole: false,
          disableZLog: false,
          prefix: ""
        },
        get debug() {
          if (this._debug) return this._debug;
          this._debug = toolkitGlobal_default.getInstance()?.debugBridge || {
            disableDebugBridgePassword: false,
            password: ""
          };
          return this._debug;
        },
        api: { pluginID: "zotero-plugin-toolkit@windingwind.com" },
        listeners: {
          callbacks: {
            onMainWindowLoad: /* @__PURE__ */ new Set(),
            onMainWindowUnload: /* @__PURE__ */ new Set(),
            onPluginUnload: /* @__PURE__ */ new Set()
          },
          _mainWindow: void 0,
          _plugin: void 0
        }
      };
      try {
        if (typeof globalThis.ChromeUtils?.importESModule !== "undefined" || typeof globalThis.ChromeUtils?.import !== "undefined") {
          const { ConsoleAPI } = _importESModule("resource://gre/modules/Console.sys.mjs");
          this._console = new ConsoleAPI({ consoleID: `${this._basicOptions.api.pluginID}-${Date.now()}` });
        }
      } catch {
      }
      this.updateOptions(data);
    }
    getGlobal(k) {
      if (typeof globalThis[k] !== "undefined") return globalThis[k];
      const _Zotero = BasicTool2.getZotero();
      try {
        const window$1 = _Zotero.getMainWindow();
        switch (k) {
          case "Zotero":
          case "zotero":
            return _Zotero;
          case "window":
            return window$1;
          case "windows":
            return _Zotero.getMainWindows();
          case "document":
            return window$1.document;
          case "ZoteroPane":
          case "ZoteroPane_Local":
            return _Zotero.getActiveZoteroPane();
          default:
            return window$1[k];
        }
      } catch (e) {
        Zotero.logError(e);
      }
    }
    /**
    * If it's an XUL element
    * @param elem
    */
    isXULElement(elem) {
      return elem.namespaceURI === "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    }
    /**
    * Create an XUL element
    *
    * For Zotero 6, use `createElementNS`;
    *
    * For Zotero 7+, use `createXULElement`.
    * @param doc
    * @param type
    * @example
    * Create a `<menuitem>`:
    * ```ts
    * const compat = new ZoteroCompat();
    * const doc = compat.getWindow().document;
    * const elem = compat.createXULElement(doc, "menuitem");
    * ```
    */
    createXULElement(doc, type) {
      return doc.createXULElement(type);
    }
    /**
    * Output to both Zotero.debug and console.log
    * @param data e.g. string, number, object, ...
    */
    log(...data) {
      if (data.length === 0) return;
      let _Zotero;
      try {
        if (typeof Zotero !== "undefined") _Zotero = Zotero;
        else _Zotero = BasicTool2.getZotero();
      } catch {
      }
      let options;
      if (data[data.length - 1]?._type === "toolkitlog") options = data.pop();
      else options = this._basicOptions.log;
      try {
        if (options.prefix) data.splice(0, 0, options.prefix);
        if (!options.disableConsole) {
          let _console;
          if (typeof console !== "undefined") _console = console;
          else if (_Zotero) _console = _Zotero.getMainWindow()?.console;
          if (!_console) {
            if (!this._console) return;
            _console = this._console;
          }
          if (_console.groupCollapsed) _console.groupCollapsed(...data);
          else _console.group(...data);
          _console.trace();
          _console.groupEnd();
        }
        if (!options.disableZLog) {
          if (typeof _Zotero === "undefined") return;
          _Zotero.debug(data.map((d) => {
            try {
              return typeof d === "object" ? JSON.stringify(d) : String(d);
            } catch {
              _Zotero.debug(d);
              return "";
            }
          }).join("\n"));
        }
      } catch (e) {
        if (_Zotero) Zotero.logError(e);
        else console.error(e);
      }
    }
    /**
    * Patch a function
    * @deprecated Use {@link PatchHelper} instead.
    * @param object The owner of the function
    * @param funcSign The signature of the function(function name)
    * @param ownerSign The signature of patch owner to avoid patching again
    * @param patcher The new wrapper of the patched function
    */
    patch(object, funcSign, ownerSign, patcher) {
      if (object[funcSign][ownerSign]) throw new Error(`${String(funcSign)} re-patched`);
      this.log("patching", funcSign, `by ${ownerSign}`);
      object[funcSign] = patcher(object[funcSign]);
      object[funcSign][ownerSign] = true;
    }
    /**
    * Add a Zotero event listener callback
    * @param type Event type
    * @param callback Event callback
    */
    addListenerCallback(type, callback) {
      if (["onMainWindowLoad", "onMainWindowUnload"].includes(type)) this._ensureMainWindowListener();
      if (type === "onPluginUnload") this._ensurePluginListener();
      this._basicOptions.listeners.callbacks[type].add(callback);
    }
    /**
    * Remove a Zotero event listener callback
    * @param type Event type
    * @param callback Event callback
    */
    removeListenerCallback(type, callback) {
      this._basicOptions.listeners.callbacks[type].delete(callback);
      this._ensureRemoveListener();
    }
    /**
    * Remove all Zotero event listener callbacks when the last callback is removed.
    */
    _ensureRemoveListener() {
      const { listeners } = this._basicOptions;
      if (listeners._mainWindow && listeners.callbacks.onMainWindowLoad.size === 0 && listeners.callbacks.onMainWindowUnload.size === 0) {
        Services.wm.removeListener(listeners._mainWindow);
        delete listeners._mainWindow;
      }
      if (listeners._plugin && listeners.callbacks.onPluginUnload.size === 0) {
        Zotero.Plugins.removeObserver(listeners._plugin);
        delete listeners._plugin;
      }
    }
    /**
    * Ensure the main window listener is registered.
    */
    _ensureMainWindowListener() {
      if (this._basicOptions.listeners._mainWindow) return;
      const mainWindowListener = {
        onOpenWindow: (xulWindow) => {
          const domWindow = xulWindow.docShell.domWindow;
          const onload = async () => {
            domWindow.removeEventListener("load", onload, false);
            if (domWindow.location.href !== "chrome://zotero/content/zoteroPane.xhtml") return;
            for (const cbk of this._basicOptions.listeners.callbacks.onMainWindowLoad) try {
              cbk(domWindow);
            } catch (e) {
              this.log(e);
            }
          };
          domWindow.addEventListener("load", () => onload(), false);
        },
        onCloseWindow: async (xulWindow) => {
          const domWindow = xulWindow.docShell.domWindow;
          if (domWindow.location.href !== "chrome://zotero/content/zoteroPane.xhtml") return;
          for (const cbk of this._basicOptions.listeners.callbacks.onMainWindowUnload) try {
            cbk(domWindow);
          } catch (e) {
            this.log(e);
          }
        }
      };
      this._basicOptions.listeners._mainWindow = mainWindowListener;
      Services.wm.addListener(mainWindowListener);
    }
    /**
    * Ensure the plugin listener is registered.
    */
    _ensurePluginListener() {
      if (this._basicOptions.listeners._plugin) return;
      const pluginListener = { shutdown: (...args) => {
        for (const cbk of this._basicOptions.listeners.callbacks.onPluginUnload) try {
          cbk(...args);
        } catch (e) {
          this.log(e);
        }
      } };
      this._basicOptions.listeners._plugin = pluginListener;
      Zotero.Plugins.addObserver(pluginListener);
    }
    updateOptions(source) {
      if (!source) return this;
      if (source instanceof BasicTool2) this._basicOptions = source._basicOptions;
      else this._basicOptions = source;
      return this;
    }
    static getZotero() {
      if (typeof Zotero !== "undefined") return Zotero;
      const { Zotero: _Zotero } = ChromeUtils.importESModule("chrome://zotero/content/zotero.mjs");
      return _Zotero;
    }
  };
  var ManagerTool = class extends BasicTool {
    _ensureAutoUnregisterAll() {
      this.addListenerCallback("onPluginUnload", (params, _reason) => {
        if (params.id !== this.basicOptions.api.pluginID) return;
        this.unregisterAll();
      });
    }
  };
  function unregister(tools) {
    Object.values(tools).forEach((tool) => {
      if (tool instanceof ManagerTool || typeof tool?.unregisterAll === "function") tool.unregisterAll();
    });
  }
  function makeHelperTool(cls, options) {
    return new Proxy(cls, { construct(target, args) {
      const _origin = new cls(...args);
      if (_origin instanceof BasicTool) _origin.updateOptions(options);
      else _origin._version = BasicTool._version;
      return _origin;
    } });
  }
  function _importESModule(path) {
    if (typeof ChromeUtils.import === "undefined") return ChromeUtils.importESModule(path, { global: "contextual" });
    if (path.endsWith(".sys.mjs")) path = path.replace(/\.sys\.mjs$/, ".jsm");
    return ChromeUtils.import(path);
  }
  var ClipboardHelper = class extends BasicTool {
    transferable;
    clipboardService;
    filePath = "";
    constructor() {
      super();
      this.transferable = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
      this.clipboardService = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
      this.transferable.init(null);
    }
    addText(source, type = "text/plain") {
      const str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
      str.data = source;
      if (type === "text/unicode") type = "text/plain";
      this.transferable.addDataFlavor(type);
      this.transferable.setTransferData(type, str, source.length * 2);
      return this;
    }
    addImage(source) {
      const parts = source.split(",");
      if (!parts[0].includes("base64")) return this;
      const mime = parts[0].match(/:(.*?);/)[1];
      const bstr = this.getGlobal("window").atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      const imgTools = Components.classes["@mozilla.org/image/tools;1"].getService(Components.interfaces.imgITools);
      let mimeType;
      let img;
      if (this.getGlobal("Zotero").platformMajorVersion >= 102) {
        img = imgTools.decodeImageFromArrayBuffer(u8arr.buffer, mime);
        mimeType = "application/x-moz-nativeimage";
      } else {
        mimeType = `image/png`;
        img = Components.classes["@mozilla.org/supports-interface-pointer;1"].createInstance(Components.interfaces.nsISupportsInterfacePointer);
        img.data = imgTools.decodeImageFromArrayBuffer(u8arr.buffer, mimeType);
      }
      this.transferable.addDataFlavor(mimeType);
      this.transferable.setTransferData(mimeType, img, 0);
      return this;
    }
    addFile(path) {
      const file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
      file.initWithPath(path);
      this.transferable.addDataFlavor("application/x-moz-file");
      this.transferable.setTransferData("application/x-moz-file", file);
      this.filePath = path;
      return this;
    }
    copy() {
      try {
        this.clipboardService.setData(this.transferable, null, Components.interfaces.nsIClipboard.kGlobalClipboard);
      } catch (e) {
        if (this.filePath && Zotero.isMac) Zotero.Utilities.Internal.exec(`/usr/bin/osascript`, [`-e`, `set the clipboard to POSIX file "${this.filePath}"`]);
        else throw e;
      }
      return this;
    }
  };
  var UITool = class extends BasicTool {
    get basicOptions() {
      return this._basicOptions;
    }
    /**
    * Store elements created with this instance
    *
    * @remarks
    * > What is this for?
    *
    * In bootstrap plugins, elements must be manually maintained and removed on exiting.
    *
    * This API does this for you.
    */
    elementCache;
    constructor(base) {
      super(base);
      this.elementCache = [];
      if (!this._basicOptions.ui) this._basicOptions.ui = {
        enableElementRecord: true,
        enableElementJSONLog: false,
        enableElementDOMLog: true
      };
    }
    /**
    * Remove all elements created by `createElement`.
    *
    * @remarks
    * > What is this for?
    *
    * In bootstrap plugins, elements must be manually maintained and removed on exiting.
    *
    * This API does this for you.
    */
    unregisterAll() {
      this.elementCache.forEach((e) => {
        try {
          e?.deref()?.remove();
        } catch (e$1) {
          this.log(e$1);
        }
      });
    }
    createElement(...args) {
      const doc = args[0];
      const tagName = args[1].toLowerCase();
      let props = args[2] || {};
      if (!tagName) return;
      if (typeof args[2] === "string") props = {
        namespace: args[2],
        enableElementRecord: args[3]
      };
      if (typeof props.enableElementJSONLog !== "undefined" && props.enableElementJSONLog || this.basicOptions.ui.enableElementJSONLog) this.log(props);
      props.properties = props.properties || props.directAttributes;
      props.children = props.children || props.subElementOptions;
      let elem;
      if (tagName === "fragment") {
        const fragElem = doc.createDocumentFragment();
        elem = fragElem;
      } else {
        let realElem = props.id && (props.checkExistenceParent ? props.checkExistenceParent : doc).querySelector(`#${props.id}`);
        if (realElem && props.ignoreIfExists) return realElem;
        if (realElem && props.removeIfExists) {
          realElem.remove();
          realElem = void 0;
        }
        if (props.customCheck && !props.customCheck(doc, props)) return void 0;
        if (!realElem || !props.skipIfExists) {
          let namespace = props.namespace;
          if (!namespace) {
            const mightHTML = HTMLElementTagNames.includes(tagName);
            const mightXUL = XULElementTagNames.includes(tagName);
            const mightSVG = SVGElementTagNames.includes(tagName);
            if (Number(mightHTML) + Number(mightXUL) + Number(mightSVG) > 1) this.log(`[Warning] Creating element ${tagName} with no namespace specified. Found multiply namespace matches.`);
            if (mightHTML) namespace = "html";
            else if (mightXUL) namespace = "xul";
            else if (mightSVG) namespace = "svg";
            else namespace = "html";
          }
          if (namespace === "xul") realElem = this.createXULElement(doc, tagName);
          else realElem = doc.createElementNS({
            html: "http://www.w3.org/1999/xhtml",
            svg: "http://www.w3.org/2000/svg"
          }[namespace], tagName);
          if (typeof props.enableElementRecord !== "undefined" ? props.enableElementRecord : this.basicOptions.ui.enableElementRecord) this.elementCache.push(new WeakRef(realElem));
        }
        if (props.id) realElem.id = props.id;
        if (props.styles && Object.keys(props.styles).length) Object.keys(props.styles).forEach((k) => {
          const v = props.styles[k];
          typeof v !== "undefined" && (realElem.style[k] = v);
        });
        if (props.properties && Object.keys(props.properties).length) Object.keys(props.properties).forEach((k) => {
          const v = props.properties[k];
          typeof v !== "undefined" && (realElem[k] = v);
        });
        if (props.attributes && Object.keys(props.attributes).length) Object.keys(props.attributes).forEach((k) => {
          const v = props.attributes[k];
          typeof v !== "undefined" && realElem.setAttribute(k, String(v));
        });
        if (props.classList?.length) realElem.classList.add(...props.classList);
        if (props.listeners?.length) props.listeners.forEach(({ type, listener, options }) => {
          listener && realElem.addEventListener(type, listener, options);
        });
        elem = realElem;
      }
      if (props.children?.length) {
        const subElements = props.children.map((childProps) => {
          childProps.namespace = childProps.namespace || props.namespace;
          return this.createElement(doc, childProps.tag, childProps);
        }).filter((e) => e);
        elem.append(...subElements);
      }
      if (typeof props.enableElementDOMLog !== "undefined" ? props.enableElementDOMLog : this.basicOptions.ui.enableElementDOMLog) this.log(elem);
      return elem;
    }
    /**
    * Append element(s) to a node.
    * @param properties See {@link ElementProps}
    * @param container The parent node to append to.
    * @returns A Node that is the appended child (aChild),
    *          except when aChild is a DocumentFragment,
    *          in which case the empty DocumentFragment is returned.
    */
    appendElement(properties, container) {
      return container.appendChild(this.createElement(container.ownerDocument, properties.tag, properties));
    }
    /**
    * Inserts a node before a reference node as a child of its parent node.
    * @param properties See {@link ElementProps}
    * @param referenceNode The node before which newNode is inserted.
    * @returns Node
    */
    insertElementBefore(properties, referenceNode) {
      if (referenceNode.parentNode) return referenceNode.parentNode.insertBefore(this.createElement(referenceNode.ownerDocument, properties.tag, properties), referenceNode);
      else this.log(`${referenceNode.tagName} has no parent, cannot insert ${properties.tag}`);
    }
    /**
    * Replace oldNode with a new one.
    * @param properties See {@link ElementProps}
    * @param oldNode The child to be replaced.
    * @returns The replaced Node. This is the same node as oldChild.
    */
    replaceElement(properties, oldNode) {
      if (oldNode.parentNode) return oldNode.parentNode.replaceChild(this.createElement(oldNode.ownerDocument, properties.tag, properties), oldNode);
      else this.log(`${oldNode.tagName} has no parent, cannot replace it with ${properties.tag}`);
    }
    /**
    * Parse XHTML to XUL fragment. For Zotero 6.
    *
    * To load preferences from a Zotero 7's `.xhtml`, use this method to parse it.
    * @param str xhtml raw text
    * @param entities dtd file list ("chrome://xxx.dtd")
    * @param defaultXUL true for default XUL namespace
    */
    parseXHTMLToFragment(str, entities = [], defaultXUL = true) {
      const parser = new DOMParser();
      const xulns = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
      const htmlns = "http://www.w3.org/1999/xhtml";
      const wrappedStr = `${entities.length ? `<!DOCTYPE bindings [ ${entities.reduce((preamble, url, index) => {
        return `${preamble}<!ENTITY % _dtd-${index} SYSTEM "${url}"> %_dtd-${index}; `;
      }, "")}]>` : ""}
      <html:div xmlns="${defaultXUL ? xulns : htmlns}"
          xmlns:xul="${xulns}" xmlns:html="${htmlns}">
      ${str}
      </html:div>`;
      this.log(wrappedStr, parser);
      const doc = parser.parseFromString(wrappedStr, "text/xml");
      this.log(doc);
      if (doc.documentElement.localName === "parsererror") throw new Error("not well-formed XHTML");
      const range = doc.createRange();
      range.selectNodeContents(doc.querySelector("div"));
      return range.extractContents();
    }
  };
  var HTMLElementTagNames = [
    "a",
    "abbr",
    "address",
    "area",
    "article",
    "aside",
    "audio",
    "b",
    "base",
    "bdi",
    "bdo",
    "blockquote",
    "body",
    "br",
    "button",
    "canvas",
    "caption",
    "cite",
    "code",
    "col",
    "colgroup",
    "data",
    "datalist",
    "dd",
    "del",
    "details",
    "dfn",
    "dialog",
    "div",
    "dl",
    "dt",
    "em",
    "embed",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "head",
    "header",
    "hgroup",
    "hr",
    "html",
    "i",
    "iframe",
    "img",
    "input",
    "ins",
    "kbd",
    "label",
    "legend",
    "li",
    "link",
    "main",
    "map",
    "mark",
    "menu",
    "meta",
    "meter",
    "nav",
    "noscript",
    "object",
    "ol",
    "optgroup",
    "option",
    "output",
    "p",
    "picture",
    "pre",
    "progress",
    "q",
    "rp",
    "rt",
    "ruby",
    "s",
    "samp",
    "script",
    "section",
    "select",
    "slot",
    "small",
    "source",
    "span",
    "strong",
    "style",
    "sub",
    "summary",
    "sup",
    "table",
    "tbody",
    "td",
    "template",
    "textarea",
    "tfoot",
    "th",
    "thead",
    "time",
    "title",
    "tr",
    "track",
    "u",
    "ul",
    "var",
    "video",
    "wbr"
  ];
  var XULElementTagNames = [
    "action",
    "arrowscrollbox",
    "bbox",
    "binding",
    "bindings",
    "box",
    "broadcaster",
    "broadcasterset",
    "button",
    "browser",
    "checkbox",
    "caption",
    "colorpicker",
    "column",
    "columns",
    "commandset",
    "command",
    "conditions",
    "content",
    "deck",
    "description",
    "dialog",
    "dialogheader",
    "editor",
    "grid",
    "grippy",
    "groupbox",
    "hbox",
    "iframe",
    "image",
    "key",
    "keyset",
    "label",
    "listbox",
    "listcell",
    "listcol",
    "listcols",
    "listhead",
    "listheader",
    "listitem",
    "member",
    "menu",
    "menubar",
    "menuitem",
    "menulist",
    "menupopup",
    "menuseparator",
    "observes",
    "overlay",
    "page",
    "popup",
    "popupset",
    "preference",
    "preferences",
    "prefpane",
    "prefwindow",
    "progressmeter",
    "radio",
    "radiogroup",
    "resizer",
    "richlistbox",
    "richlistitem",
    "row",
    "rows",
    "rule",
    "script",
    "scrollbar",
    "scrollbox",
    "scrollcorner",
    "separator",
    "spacer",
    "splitter",
    "stack",
    "statusbar",
    "statusbarpanel",
    "stringbundle",
    "stringbundleset",
    "tab",
    "tabbrowser",
    "tabbox",
    "tabpanel",
    "tabpanels",
    "tabs",
    "template",
    "textnode",
    "textbox",
    "titlebar",
    "toolbar",
    "toolbarbutton",
    "toolbargrippy",
    "toolbaritem",
    "toolbarpalette",
    "toolbarseparator",
    "toolbarset",
    "toolbarspacer",
    "toolbarspring",
    "toolbox",
    "tooltip",
    "tree",
    "treecell",
    "treechildren",
    "treecol",
    "treecols",
    "treeitem",
    "treerow",
    "treeseparator",
    "triple",
    "vbox",
    "window",
    "wizard",
    "wizardpage"
  ];
  var SVGElementTagNames = [
    "a",
    "animate",
    "animateMotion",
    "animateTransform",
    "circle",
    "clipPath",
    "defs",
    "desc",
    "ellipse",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feDistantLight",
    "feDropShadow",
    "feFlood",
    "feFuncA",
    "feFuncB",
    "feFuncG",
    "feFuncR",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "feOffset",
    "fePointLight",
    "feSpecularLighting",
    "feSpotLight",
    "feTile",
    "feTurbulence",
    "filter",
    "foreignObject",
    "g",
    "image",
    "line",
    "linearGradient",
    "marker",
    "mask",
    "metadata",
    "mpath",
    "path",
    "pattern",
    "polygon",
    "polyline",
    "radialGradient",
    "rect",
    "script",
    "set",
    "stop",
    "style",
    "svg",
    "switch",
    "symbol",
    "text",
    "textPath",
    "title",
    "tspan",
    "use",
    "view"
  ];
  var DialogHelper = class extends UITool {
    /**
    * Passed to dialog window for data-binding and lifecycle controls. See {@link DialogHelper.setDialogData}
    */
    dialogData;
    /**
    * Dialog window instance
    */
    window;
    elementProps;
    /**
    * Create a dialog helper with row \* column grids.
    * @param row
    * @param column
    */
    constructor(row, column) {
      super();
      if (row <= 0 || column <= 0) throw new Error(`row and column must be positive integers.`);
      this.elementProps = {
        tag: "vbox",
        attributes: { flex: 1 },
        styles: {
          width: "100%",
          height: "100%"
        },
        children: []
      };
      for (let i = 0; i < Math.max(row, 1); i++) {
        this.elementProps.children.push({
          tag: "hbox",
          attributes: { flex: 1 },
          children: []
        });
        for (let j = 0; j < Math.max(column, 1); j++) this.elementProps.children[i].children.push({
          tag: "vbox",
          attributes: { flex: 1 },
          children: []
        });
      }
      this.elementProps.children.push({
        tag: "hbox",
        attributes: {
          flex: 0,
          pack: "end"
        },
        children: []
      });
      this.dialogData = {};
    }
    /**
    * Add a cell at (row, column). Index starts from 0.
    * @param row
    * @param column
    * @param elementProps Cell element props. See {@link ElementProps}
    * @param cellFlex If the cell is flex. Default true.
    */
    addCell(row, column, elementProps, cellFlex = true) {
      if (row >= this.elementProps.children.length || column >= this.elementProps.children[row].children.length) throw new Error(`Cell index (${row}, ${column}) is invalid, maximum (${this.elementProps.children.length}, ${this.elementProps.children[0].children.length})`);
      this.elementProps.children[row].children[column].children = [elementProps];
      this.elementProps.children[row].children[column].attributes.flex = cellFlex ? 1 : 0;
      return this;
    }
    /**
    * Add a control button to the bottom of the dialog.
    * @param label Button label
    * @param id Button id.
    * The corresponding id of the last button user clicks before window exit will be set to `dialogData._lastButtonId`.
    * @param options Options
    * @param [options.noClose] Don't close window when clicking this button.
    * @param [options.callback] Callback of button click event.
    */
    addButton(label, id, options = {}) {
      id = id || `btn-${Zotero.Utilities.randomString()}-${(/* @__PURE__ */ new Date()).getTime()}`;
      this.elementProps.children[this.elementProps.children.length - 1].children.push({
        tag: "vbox",
        styles: { margin: "10px" },
        children: [{
          tag: "button",
          namespace: "html",
          id,
          attributes: {
            type: "button",
            "data-l10n-id": label
          },
          properties: { innerHTML: label },
          listeners: [{
            type: "click",
            listener: (e) => {
              this.dialogData._lastButtonId = id;
              if (options.callback) options.callback(e);
              if (!options.noClose) this.window.close();
            }
          }]
        }]
      });
      return this;
    }
    /**
    * Dialog data.
    * @remarks
    * This object is passed to the dialog window.
    *
    * The control button id is in `dialogData._lastButtonId`;
    *
    * The data-binding values are in `dialogData`.
    * ```ts
    * interface DialogData {
    *   [key: string | number | symbol]: any;
    *   loadLock?: { promise: Promise<void>; resolve: () => void; isResolved: () => boolean }; // resolve after window load (auto-generated)
    *   loadCallback?: Function; // called after window load
    *   unloadLock?: { promise: Promise<void>; resolve: () => void }; // resolve after window unload (auto-generated)
    *   unloadCallback?: Function; // called after window unload
    *   beforeUnloadCallback?: Function; // called before window unload when elements are accessable.
    * }
    * ```
    * @param dialogData
    */
    setDialogData(dialogData) {
      this.dialogData = dialogData;
      return this;
    }
    /**
    * Open the dialog
    * @param title Window title
    * @param windowFeatures
    * @param windowFeatures.width Ignored if fitContent is `true`.
    * @param windowFeatures.height Ignored if fitContent is `true`.
    * @param windowFeatures.left
    * @param windowFeatures.top
    * @param windowFeatures.centerscreen Open window at the center of screen.
    * @param windowFeatures.resizable If window is resizable.
    * @param windowFeatures.fitContent Resize the window to content size after elements are loaded.
    * @param windowFeatures.noDialogMode Dialog mode window only has a close button. Set `true` to make maximize and minimize button visible.
    * @param windowFeatures.alwaysRaised Is the window always at the top.
    */
    open(title, windowFeatures = {
      centerscreen: true,
      resizable: true,
      fitContent: true
    }) {
      this.window = openDialog(this, `dialog-${Zotero.Utilities.randomString()}-${(/* @__PURE__ */ new Date()).getTime()}`, title, this.elementProps, this.dialogData, windowFeatures);
      return this;
    }
  };
  function openDialog(dialogHelper, targetId, title, elementProps, dialogData, windowFeatures = {
    centerscreen: true,
    resizable: true,
    fitContent: true
  }) {
    dialogData = dialogData || {};
    if (!dialogData.loadLock) {
      let loadResolve;
      let isLoadResolved = false;
      const loadPromise = new Promise((resolve) => {
        loadResolve = resolve;
      });
      loadPromise.then(() => {
        isLoadResolved = true;
      });
      dialogData.loadLock = {
        promise: loadPromise,
        resolve: loadResolve,
        isResolved: () => isLoadResolved
      };
    }
    if (!dialogData.unloadLock) {
      let unloadResolve;
      const unloadPromise = new Promise((resolve) => {
        unloadResolve = resolve;
      });
      dialogData.unloadLock = {
        promise: unloadPromise,
        resolve: unloadResolve
      };
    }
    let featureString = `resizable=${windowFeatures.resizable ? "yes" : "no"},`;
    if (windowFeatures.width || windowFeatures.height) featureString += `width=${windowFeatures.width || 100},height=${windowFeatures.height || 100},`;
    if (windowFeatures.left) featureString += `left=${windowFeatures.left},`;
    if (windowFeatures.top) featureString += `top=${windowFeatures.top},`;
    if (windowFeatures.centerscreen) featureString += "centerscreen,";
    if (windowFeatures.noDialogMode) featureString += "dialog=no,";
    if (windowFeatures.alwaysRaised) featureString += "alwaysRaised=yes,";
    const win = dialogHelper.getGlobal("openDialog")("about:blank", targetId || "_blank", featureString, dialogData);
    dialogData.loadLock?.promise.then(() => {
      win.document.head.appendChild(dialogHelper.createElement(win.document, "title", {
        properties: { innerText: title },
        attributes: { "data-l10n-id": title }
      }));
      let l10nFiles = dialogData.l10nFiles || [];
      if (typeof l10nFiles === "string") l10nFiles = [l10nFiles];
      l10nFiles.forEach((file) => {
        win.document.head.appendChild(dialogHelper.createElement(win.document, "link", { properties: {
          rel: "localization",
          href: file
        } }));
      });
      dialogHelper.appendElement({
        tag: "fragment",
        children: [
          {
            tag: "style",
            properties: { innerHTML: style }
          },
          {
            tag: "link",
            properties: {
              rel: "stylesheet",
              href: "chrome://global/skin/global.css"
            }
          },
          {
            tag: "link",
            properties: {
              rel: "stylesheet",
              href: "chrome://zotero-platform/content/zotero.css"
            }
          }
        ]
      }, win.document.head);
      replaceElement(elementProps, dialogHelper);
      win.document.body.appendChild(dialogHelper.createElement(win.document, "fragment", { children: [elementProps] }));
      Array.from(win.document.querySelectorAll("*[data-bind]")).forEach((elem) => {
        const bindKey = elem.getAttribute("data-bind");
        const bindAttr = elem.getAttribute("data-attr");
        const bindProp = elem.getAttribute("data-prop");
        if (bindKey && dialogData && dialogData[bindKey]) if (bindProp) elem[bindProp] = dialogData[bindKey];
        else elem.setAttribute(bindAttr || "value", dialogData[bindKey]);
      });
      if (windowFeatures.fitContent) setTimeout(() => {
        win.sizeToContent();
      }, 300);
      win.focus();
    }).then(() => {
      dialogData?.loadCallback && dialogData.loadCallback();
    });
    dialogData.unloadLock?.promise.then(() => {
      dialogData?.unloadCallback && dialogData.unloadCallback();
    });
    win.addEventListener("DOMContentLoaded", function onWindowLoad(_ev) {
      win.arguments[0]?.loadLock?.resolve();
      win.removeEventListener("DOMContentLoaded", onWindowLoad, false);
    }, false);
    win.addEventListener("beforeunload", function onWindowBeforeUnload(_ev) {
      Array.from(win.document.querySelectorAll("*[data-bind]")).forEach((elem) => {
        const dialogData$1 = this.window.arguments[0];
        const bindKey = elem.getAttribute("data-bind");
        const bindAttr = elem.getAttribute("data-attr");
        const bindProp = elem.getAttribute("data-prop");
        if (bindKey && dialogData$1) if (bindProp) dialogData$1[bindKey] = elem[bindProp];
        else dialogData$1[bindKey] = elem.getAttribute(bindAttr || "value");
      });
      this.window.removeEventListener("beforeunload", onWindowBeforeUnload, false);
      dialogData?.beforeUnloadCallback && dialogData.beforeUnloadCallback();
    });
    win.addEventListener("unload", function onWindowUnload(_ev) {
      if (!this.window.arguments[0]?.loadLock?.isResolved()) return;
      this.window.arguments[0]?.unloadLock?.resolve();
      this.window.removeEventListener("unload", onWindowUnload, false);
    });
    if (win.document.readyState === "complete") win.arguments[0]?.loadLock?.resolve();
    return win;
  }
  function replaceElement(elementProps, uiTool) {
    let checkChildren = true;
    if (elementProps.tag === "select") {
      let is140 = false;
      try {
        is140 = Number.parseInt(Services.appinfo.platformVersion.match(/^\d+/)[0]) >= 140;
      } catch {
        is140 = false;
      }
      if (!is140) {
        checkChildren = false;
        const customSelectProps = {
          tag: "div",
          classList: ["dropdown"],
          listeners: [{
            type: "mouseleave",
            listener: (ev) => {
              const select = ev.target.querySelector("select");
              select?.blur();
            }
          }],
          children: [Object.assign({}, elementProps, {
            tag: "select",
            listeners: [{
              type: "focus",
              listener: (ev) => {
                const select = ev.target;
                const dropdown = select.parentElement?.querySelector(".dropdown-content");
                dropdown && (dropdown.style.display = "block");
                select.setAttribute("focus", "true");
              }
            }, {
              type: "blur",
              listener: (ev) => {
                const select = ev.target;
                const dropdown = select.parentElement?.querySelector(".dropdown-content");
                dropdown && (dropdown.style.display = "none");
                select.removeAttribute("focus");
              }
            }]
          }), {
            tag: "div",
            classList: ["dropdown-content"],
            children: elementProps.children?.map((option) => ({
              tag: "p",
              attributes: { value: option.properties?.value },
              properties: { innerHTML: option.properties?.innerHTML || option.properties?.textContent },
              classList: ["dropdown-item"],
              listeners: [{
                type: "click",
                listener: (ev) => {
                  const select = ev.target.parentElement?.previousElementSibling;
                  select && (select.value = ev.target.getAttribute("value") || "");
                  select?.blur();
                }
              }]
            }))
          }]
        };
        for (const key in elementProps) delete elementProps[key];
        Object.assign(elementProps, customSelectProps);
      } else {
        const children = elementProps.children || [];
        const randomString = CSS.escape(`${Zotero.Utilities.randomString()}-${(/* @__PURE__ */ new Date()).getTime()}`);
        if (!elementProps.id) elementProps.id = `select-${randomString}`;
        const selectId = elementProps.id;
        const popupId = `popup-${randomString}`;
        const popup = uiTool.appendElement({
          tag: "menupopup",
          namespace: "xul",
          id: popupId,
          children: children.map((option) => ({
            tag: "menuitem",
            attributes: {
              value: option.properties?.value,
              label: option.properties?.innerHTML || option.properties?.textContent
            }
          })),
          listeners: [{
            type: "command",
            listener: (ev) => {
              if (ev.target?.tagName !== "menuitem") return;
              const select = uiTool.window.document.getElementById(selectId);
              const menuitem = ev.target;
              if (select) {
                select.value = menuitem.getAttribute("value") || "";
                select.blur();
              }
              popup.hidePopup();
            }
          }]
        }, uiTool.window.document.body);
        if (!elementProps.listeners) elementProps.listeners = [];
        elementProps.listeners.push(...[{
          type: "click",
          listener: (ev) => {
            const select = ev.target;
            const rect = select.getBoundingClientRect();
            let left = rect.left + uiTool.window.scrollX;
            let top = rect.bottom + uiTool.window.scrollY;
            if (uiTool.getGlobal("Zotero").isMac) {
              left += uiTool.window.screenLeft;
              top += uiTool.window.screenTop + rect.height;
            }
            fixMenuPopup(popup, uiTool);
            popup.openPopup(null, "", left, top, false, false);
            select.setAttribute("focus", "true");
          }
        }]);
      }
    } else if (elementProps.tag === "a") {
      const href = elementProps?.properties?.href || "";
      elementProps.properties ??= {};
      elementProps.properties.href = "javascript:void(0);";
      elementProps.attributes ??= {};
      elementProps.attributes["zotero-href"] = href;
      elementProps.listeners ??= [];
      elementProps.listeners.push({
        type: "click",
        listener: (ev) => {
          const href$1 = ev.target?.getAttribute("zotero-href");
          href$1 && uiTool.getGlobal("Zotero").launchURL(href$1);
        }
      });
      elementProps.classList ??= [];
      elementProps.classList.push("zotero-text-link");
    }
    if (checkChildren) elementProps.children?.forEach((child) => replaceElement(child, uiTool));
  }
  var style = `
html {
  color-scheme: light dark;
}
.zotero-text-link {
  -moz-user-focus: normal;
  color: -moz-nativehyperlinktext;
  text-decoration: underline;
  border: 1px solid transparent;
  cursor: pointer;
}
.dropdown {
  position: relative;
  display: inline-block;
}
.dropdown-content {
  display: none;
  position: absolute;
  background-color: var(--material-toolbar);
  min-width: 160px;
  box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  padding: 5px 0 5px 0;
  z-index: 999;
}
.dropdown-item {
  margin: 0px;
  padding: 5px 10px 5px 10px;
}
.dropdown-item:hover {
  background-color: var(--fill-quinary);
}
`;
  function fixMenuPopup(popup, uiTool) {
    for (const item of popup.querySelectorAll("menuitem")) if (!item.innerHTML) uiTool.appendElement({
      tag: "fragment",
      children: [
        {
          tag: "image",
          namespace: "xul",
          classList: ["menu-icon"],
          attributes: { "aria-hidden": "true" }
        },
        {
          tag: "label",
          namespace: "xul",
          classList: ["menu-text"],
          properties: { value: item.getAttribute("label") || "" },
          attributes: {
            crop: "end",
            "aria-hidden": "true"
          }
        },
        {
          tag: "label",
          namespace: "xul",
          classList: ["menu-highlightable-text"],
          properties: { textContent: item.getAttribute("label") || "" },
          attributes: {
            crop: "end",
            "aria-hidden": "true"
          }
        },
        {
          tag: "label",
          namespace: "xul",
          classList: ["menu-accel"],
          attributes: { "aria-hidden": "true" }
        }
      ]
    }, item);
  }
  var FilePickerHelper = class extends BasicTool {
    title;
    mode;
    filters;
    suggestion;
    directory;
    window;
    filterMask;
    constructor(title, mode, filters, suggestion, window$1, filterMask, directory) {
      super();
      this.title = title;
      this.mode = mode;
      this.filters = filters;
      this.suggestion = suggestion;
      this.directory = directory;
      this.window = window$1;
      this.filterMask = filterMask;
    }
    async open() {
      const Backend = ChromeUtils.importESModule("chrome://zotero/content/modules/filePicker.mjs").FilePicker;
      const fp = new Backend();
      fp.init(this.window || this.getGlobal("window"), this.title, this.getMode(fp));
      for (const [label, ext] of this.filters || []) fp.appendFilter(label, ext);
      if (this.filterMask) fp.appendFilters(this.getFilterMask(fp));
      if (this.suggestion) fp.defaultString = this.suggestion;
      if (this.directory) fp.displayDirectory = this.directory;
      const userChoice = await fp.show();
      switch (userChoice) {
        case fp.returnOK:
        case fp.returnReplace:
          return this.mode === "multiple" ? fp.files : fp.file;
        default:
          return false;
      }
    }
    getMode(fp) {
      switch (this.mode) {
        case "open":
          return fp.modeOpen;
        case "save":
          return fp.modeSave;
        case "folder":
          return fp.modeGetFolder;
        case "multiple":
          return fp.modeOpenMultiple;
        default:
          return 0;
      }
    }
    getFilterMask(fp) {
      switch (this.filterMask) {
        case "all":
          return fp.filterAll;
        case "html":
          return fp.filterHTML;
        case "text":
          return fp.filterText;
        case "images":
          return fp.filterImages;
        case "xml":
          return fp.filterXML;
        case "apps":
          return fp.filterApps;
        case "urls":
          return fp.filterAllowURLs;
        case "audio":
          return fp.filterAudio;
        case "video":
          return fp.filterVideo;
        default:
          return 1;
      }
    }
  };
  var GuideHelper = class extends BasicTool {
    _steps = [];
    constructor() {
      super();
    }
    addStep(step) {
      this._steps.push(step);
      return this;
    }
    addSteps(steps) {
      this._steps.push(...steps);
      return this;
    }
    async show(doc) {
      if (!doc?.ownerGlobal) throw new Error("Document is required.");
      const guide = new Guide(doc.ownerGlobal);
      await guide.show(this._steps);
      const promise = new Promise((resolve) => {
        guide._panel.addEventListener("guide-finished", () => resolve(guide));
      });
      await promise;
      return guide;
    }
    async highlight(doc, step) {
      if (!doc?.ownerGlobal) throw new Error("Document is required.");
      const guide = new Guide(doc.ownerGlobal);
      await guide.show([step]);
      const promise = new Promise((resolve) => {
        guide._panel.addEventListener("guide-finished", () => resolve(guide));
      });
      await promise;
      return guide;
    }
  };
  var Guide = class {
    _window;
    _id = `guide-${Zotero.Utilities.randomString()}`;
    _panel;
    _header;
    _body;
    _footer;
    _progress;
    _closeButton;
    _prevButton;
    _nextButton;
    _steps;
    _noClose;
    _closed;
    _autoNext;
    _currentIndex;
    initialized;
    _cachedMasks = [];
    get content() {
      return this._window.MozXULElement.parseXULToFragment(`
      <panel id="${this._id}" class="guide-panel" type="arrow" align="top" noautohide="true">
          <html:div class="guide-panel-content">
              <html:div class="guide-panel-header"></html:div>
              <html:div class="guide-panel-body"></html:div>
              <html:div class="guide-panel-footer">
                  <html:div class="guide-panel-progress"></html:div>
                  <html:div class="guide-panel-buttons">
                      <button id="prev-button" class="guide-panel-button" hidden="true"></button>
                      <button id="next-button" class="guide-panel-button" hidden="true"></button>
                      <button id="close-button" class="guide-panel-button" hidden="true"></button>
                  </html:div>
              </html:div>
          </html:div>
          <html:style>
              .guide-panel {
                  background-color: var(--material-menu);
                  color: var(--fill-primary);
              }
              .guide-panel-content {
                  display: flex;
                  flex-direction: column;
                  padding: 0;
              }
              .guide-panel-header {
                  font-size: 1.2em;
                  font-weight: bold;
                  margin-bottom: 10px;
              }
              .guide-panel-header:empty {
                display: none;
              }
              .guide-panel-body {
                  align-items: center;
                  display: flex;
                  flex-direction: column;
                  white-space: pre-wrap;
              }
              .guide-panel-body:empty {
                display: none;
              }
              .guide-panel-footer {
                  display: flex;
                  flex-direction: row;
                  align-items: center;
                  justify-content: space-between;
                  margin-top: 10px;
              }
              .guide-panel-progress {
                  font-size: 0.8em;
              }
              .guide-panel-buttons {
                  display: flex;
                  flex-direction: row;
                  flex-grow: 1;
                  justify-content: flex-end;
              }
          </html:style>
      </panel>
  `);
    }
    get currentStep() {
      if (!this._steps) return void 0;
      return this._steps[this._currentIndex];
    }
    get currentTarget() {
      const step = this.currentStep;
      if (!step?.element) return void 0;
      let elem;
      if (typeof step.element === "function") elem = step.element();
      else if (typeof step.element === "string") elem = this._window.document.querySelector(step.element);
      else if (!step.element) elem = this._window.document.documentElement || void 0;
      else elem = step.element;
      return elem;
    }
    get hasNext() {
      return this._steps && this._currentIndex < this._steps.length - 1;
    }
    get hasPrevious() {
      return this._steps && this._currentIndex > 0;
    }
    get hookProps() {
      return {
        config: this.currentStep,
        state: {
          step: this._currentIndex,
          steps: this._steps,
          controller: this
        }
      };
    }
    get panel() {
      return this._panel;
    }
    constructor(win) {
      this._window = win;
      this._noClose = false;
      this._closed = false;
      this._autoNext = true;
      this._currentIndex = 0;
      const doc = win.document;
      const content = this.content;
      if (content) doc.documentElement?.append(doc.importNode(content, true));
      this._panel = doc.querySelector(`#${this._id}`);
      this._header = this._panel.querySelector(".guide-panel-header");
      this._body = this._panel.querySelector(".guide-panel-body");
      this._footer = this._panel.querySelector(".guide-panel-footer");
      this._progress = this._panel.querySelector(".guide-panel-progress");
      this._closeButton = this._panel.querySelector("#close-button");
      this._prevButton = this._panel.querySelector("#prev-button");
      this._nextButton = this._panel.querySelector("#next-button");
      this._closeButton.addEventListener("click", async () => {
        if (this.currentStep?.onCloseClick) await this.currentStep.onCloseClick(this.hookProps);
        this.abort();
      });
      this._prevButton.addEventListener("click", async () => {
        if (this.currentStep?.onPrevClick) await this.currentStep.onPrevClick(this.hookProps);
        this.movePrevious();
      });
      this._nextButton.addEventListener("click", async () => {
        if (this.currentStep?.onNextClick) await this.currentStep.onNextClick(this.hookProps);
        this.moveNext();
      });
      this._panel.addEventListener("popupshown", this._handleShown.bind(this));
      this._panel.addEventListener("popuphidden", this._handleHidden.bind(this));
      this._window.addEventListener("resize", this._centerPanel);
    }
    async show(steps) {
      if (steps) {
        this._steps = steps;
        this._currentIndex = 0;
      }
      const index = this._currentIndex;
      this._noClose = false;
      this._closed = false;
      this._autoNext = true;
      const step = this.currentStep;
      if (!step) return;
      const elem = this.currentTarget;
      if (step.onBeforeRender) {
        await step.onBeforeRender(this.hookProps);
        if (index !== this._currentIndex) {
          await this.show();
          return;
        }
      }
      if (step.onMask) step.onMask({ mask: (_e) => this._createMask(_e) });
      else this._createMask(elem);
      let x;
      let y = 0;
      let position = step.position || "after_start";
      if (position === "center") {
        position = "overlap";
        x = this._window.innerWidth / 2;
        y = this._window.innerHeight / 2;
      }
      this._panel.openPopup(elem, step.position || "after_start", x, y, false, false);
    }
    hide() {
      this._panel.hidePopup();
    }
    abort() {
      this._closed = true;
      this.hide();
      this._steps = void 0;
    }
    moveTo(stepIndex) {
      if (!this._steps) {
        this.hide();
        return;
      }
      if (stepIndex < 0) stepIndex = 0;
      if (!this._steps[stepIndex]) {
        this._currentIndex = this._steps.length;
        this.hide();
        return;
      }
      this._autoNext = false;
      this._noClose = true;
      this.hide();
      this._noClose = false;
      this._autoNext = true;
      this._currentIndex = stepIndex;
      this.show();
    }
    moveNext() {
      this.moveTo(this._currentIndex + 1);
    }
    movePrevious() {
      this.moveTo(this._currentIndex - 1);
    }
    _handleShown() {
      if (!this._steps) return;
      const step = this.currentStep;
      if (!step) return;
      this._header.innerHTML = step.title || "";
      this._body.innerHTML = step.description || "";
      this._panel.querySelectorAll(".guide-panel-button").forEach((elem) => {
        elem.hidden = true;
        elem.disabled = false;
      });
      let showButtons = step.showButtons;
      if (!showButtons) {
        showButtons = [];
        if (this.hasPrevious) showButtons.push("prev");
        if (this.hasNext) showButtons.push("next");
        else showButtons.push("close");
      }
      if (showButtons?.length) showButtons.forEach((btn) => {
        this._panel.querySelector(`#${btn}-button`).hidden = false;
      });
      if (step.disableButtons) step.disableButtons.forEach((btn) => {
        this._panel.querySelector(`#${btn}-button`).disabled = true;
      });
      if (step.showProgress) {
        this._progress.hidden = false;
        this._progress.textContent = step.progressText || `${this._currentIndex + 1}/${this._steps.length}`;
      } else this._progress.hidden = true;
      this._closeButton.label = step.closeBtnText || "Done";
      this._nextButton.label = step.nextBtnText || "Next";
      this._prevButton.label = step.prevBtnText || "Previous";
      if (step.onRender) step.onRender(this.hookProps);
      if (step.position === "center") {
        this._centerPanel();
        this._window.setTimeout(this._centerPanel, 10);
      }
    }
    async _handleHidden() {
      this._removeMask();
      this._header.innerHTML = "";
      this._body.innerHTML = "";
      this._progress.textContent = "";
      if (!this._steps) return;
      const step = this.currentStep;
      if (step && step.onExit) await step.onExit(this.hookProps);
      if (!this._noClose && (this._closed || !this.hasNext)) {
        this._panel.dispatchEvent(new this._window.CustomEvent("guide-finished"));
        this._panel.remove();
        this._window.removeEventListener("resize", this._centerPanel);
        return;
      }
      if (this._autoNext) this.moveNext();
    }
    _centerPanel = () => {
      const win = this._window;
      this._panel.moveTo(win.screenX + win.innerWidth / 2 - this._panel.clientWidth / 2, win.screenY + win.innerHeight / 2 - this._panel.clientHeight / 2);
    };
    _createMask(targetElement) {
      const doc = targetElement?.ownerDocument || this._window.document;
      const NS = "http://www.w3.org/2000/svg";
      const svg = doc.createElementNS(NS, "svg");
      svg.id = "guide-panel-mask";
      svg.style.position = "fixed";
      svg.style.top = "0";
      svg.style.left = "0";
      svg.style.width = "100%";
      svg.style.height = "100%";
      svg.style.zIndex = "9999";
      const mask = doc.createElementNS(NS, "mask");
      mask.id = "mask";
      const fullRect = doc.createElementNS(NS, "rect");
      fullRect.setAttribute("x", "0");
      fullRect.setAttribute("y", "0");
      fullRect.setAttribute("width", "100%");
      fullRect.setAttribute("height", "100%");
      fullRect.setAttribute("fill", "white");
      mask.appendChild(fullRect);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const targetRect = doc.createElementNS(NS, "rect");
        targetRect.setAttribute("x", rect.left.toString());
        targetRect.setAttribute("y", rect.top.toString());
        targetRect.setAttribute("width", rect.width.toString());
        targetRect.setAttribute("height", rect.height.toString());
        targetRect.setAttribute("fill", "black");
        mask.appendChild(targetRect);
      }
      const maskedRect = doc.createElementNS(NS, "rect");
      maskedRect.setAttribute("x", "0");
      maskedRect.setAttribute("y", "0");
      maskedRect.setAttribute("width", "100%");
      maskedRect.setAttribute("height", "100%");
      maskedRect.setAttribute("mask", "url(#mask)");
      maskedRect.setAttribute("opacity", "0.7");
      svg.appendChild(mask);
      svg.appendChild(maskedRect);
      this._cachedMasks.push(new WeakRef(svg));
      doc.documentElement?.appendChild(svg);
    }
    _removeMask() {
      this._cachedMasks.forEach((ref) => {
        const mask = ref.deref();
        if (mask) mask.remove();
      });
      this._cachedMasks = [];
    }
  };
  var LargePrefHelper = class extends BasicTool {
    keyPref;
    valuePrefPrefix;
    innerObj;
    hooks;
    /**
    *
    * @param keyPref The preference name for storing the keys of the data.
    * @param valuePrefPrefix The preference name prefix for storing the values of the data.
    * @param hooks Hooks for parsing the values of the data.
    * - `afterGetValue`: A function that takes the value of the data as input and returns the parsed value.
    * - `beforeSetValue`: A function that takes the key and value of the data as input and returns the parsed key and value.
    * If `hooks` is `"default"`, no parsing will be done.
    * If `hooks` is `"parser"`, the values will be parsed as JSON.
    * If `hooks` is an object, the values will be parsed by the hooks.
    */
    constructor(keyPref, valuePrefPrefix, hooks = "default") {
      super();
      this.keyPref = keyPref;
      this.valuePrefPrefix = valuePrefPrefix;
      if (hooks === "default") this.hooks = defaultHooks;
      else if (hooks === "parser") this.hooks = parserHooks;
      else this.hooks = {
        ...defaultHooks,
        ...hooks
      };
      this.innerObj = {};
    }
    /**
    * Get the object that stores the data.
    * @returns The object that stores the data.
    */
    asObject() {
      return this.constructTempObj();
    }
    /**
    * Get the Map that stores the data.
    * @returns The Map that stores the data.
    */
    asMapLike() {
      const mapLike = {
        get: (key) => this.getValue(key),
        set: (key, value) => {
          this.setValue(key, value);
          return mapLike;
        },
        has: (key) => this.hasKey(key),
        delete: (key) => this.deleteKey(key),
        clear: () => {
          for (const key of this.getKeys()) this.deleteKey(key);
        },
        forEach: (callback) => {
          return this.constructTempMap().forEach(callback);
        },
        get size() {
          return this._this.getKeys().length;
        },
        entries: () => {
          return this.constructTempMap().values();
        },
        keys: () => {
          const keys = this.getKeys();
          return keys[Symbol.iterator]();
        },
        values: () => {
          return this.constructTempMap().values();
        },
        [Symbol.iterator]: () => {
          return this.constructTempMap()[Symbol.iterator]();
        },
        [Symbol.toStringTag]: "MapLike",
        _this: this
      };
      return mapLike;
    }
    /**
    * Get the keys of the data.
    * @returns The keys of the data.
    */
    getKeys() {
      const rawKeys = Zotero.Prefs.get(this.keyPref, true);
      const keys = rawKeys ? JSON.parse(rawKeys) : [];
      for (const key of keys) {
        const value = "placeholder";
        this.innerObj[key] = value;
      }
      return keys;
    }
    /**
    * Set the keys of the data.
    * @param keys The keys of the data.
    */
    setKeys(keys) {
      keys = [...new Set(keys.filter((key) => key))];
      Zotero.Prefs.set(this.keyPref, JSON.stringify(keys), true);
      for (const key of keys) {
        const value = "placeholder";
        this.innerObj[key] = value;
      }
    }
    /**
    * Get the value of a key.
    * @param key The key of the data.
    * @returns The value of the key.
    */
    getValue(key) {
      const value = Zotero.Prefs.get(`${this.valuePrefPrefix}${key}`, true);
      if (typeof value === "undefined") return;
      const { value: newValue } = this.hooks.afterGetValue({ value });
      this.innerObj[key] = newValue;
      return newValue;
    }
    /**
    * Set the value of a key.
    * @param key The key of the data.
    * @param value The value of the key.
    */
    setValue(key, value) {
      const { key: newKey, value: newValue } = this.hooks.beforeSetValue({
        key,
        value
      });
      this.setKey(newKey);
      Zotero.Prefs.set(`${this.valuePrefPrefix}${newKey}`, newValue, true);
      this.innerObj[newKey] = newValue;
    }
    /**
    * Check if a key exists.
    * @param key The key of the data.
    * @returns Whether the key exists.
    */
    hasKey(key) {
      return this.getKeys().includes(key);
    }
    /**
    * Add a key.
    * @param key The key of the data.
    */
    setKey(key) {
      const keys = this.getKeys();
      if (!keys.includes(key)) {
        keys.push(key);
        this.setKeys(keys);
      }
    }
    /**
    * Delete a key.
    * @param key The key of the data.
    */
    deleteKey(key) {
      const keys = this.getKeys();
      const index = keys.indexOf(key);
      if (index > -1) {
        keys.splice(index, 1);
        delete this.innerObj[key];
        this.setKeys(keys);
      }
      Zotero.Prefs.clear(`${this.valuePrefPrefix}${key}`, true);
      return true;
    }
    constructTempObj() {
      return new Proxy(this.innerObj, {
        get: (target, prop, receiver) => {
          this.getKeys();
          if (typeof prop === "string" && prop in target) this.getValue(prop);
          return Reflect.get(target, prop, receiver);
        },
        set: (target, p, newValue, receiver) => {
          if (typeof p === "string") {
            if (newValue === void 0) {
              this.deleteKey(p);
              return true;
            }
            this.setValue(p, newValue);
            return true;
          }
          return Reflect.set(target, p, newValue, receiver);
        },
        has: (target, p) => {
          this.getKeys();
          return Reflect.has(target, p);
        },
        deleteProperty: (target, p) => {
          if (typeof p === "string") {
            this.deleteKey(p);
            return true;
          }
          return Reflect.deleteProperty(target, p);
        }
      });
    }
    constructTempMap() {
      const map = /* @__PURE__ */ new Map();
      for (const key of this.getKeys()) map.set(key, this.getValue(key));
      return map;
    }
  };
  var defaultHooks = {
    afterGetValue: ({ value }) => ({ value }),
    beforeSetValue: ({ key, value }) => ({
      key,
      value
    })
  };
  var parserHooks = {
    afterGetValue: ({ value }) => {
      try {
        value = JSON.parse(value);
      } catch {
        return { value };
      }
      return { value };
    },
    beforeSetValue: ({ key, value }) => {
      value = JSON.stringify(value);
      return {
        key,
        value
      };
    }
  };
  var PatchHelper = class extends BasicTool {
    options;
    constructor() {
      super();
      this.options = void 0;
    }
    setData(options) {
      this.options = options;
      const Zotero$1 = this.getGlobal("Zotero");
      const { target, funcSign, patcher } = options;
      const origin2 = target[funcSign];
      this.log("patching ", funcSign);
      target[funcSign] = function(...args) {
        if (options.enabled) try {
          return patcher(origin2).apply(this, args);
        } catch (e) {
          Zotero$1.logError(e);
        }
        return origin2.apply(this, args);
      };
      return this;
    }
    enable() {
      if (!this.options) throw new Error("No patch data set");
      this.options.enabled = true;
      return this;
    }
    disable() {
      if (!this.options) throw new Error("No patch data set");
      this.options.enabled = false;
      return this;
    }
  };
  var icons = {
    success: "chrome://zotero/skin/tick.png",
    fail: "chrome://zotero/skin/cross.png"
  };
  var ProgressWindowHelper = class {
    win;
    lines;
    closeTime;
    /**
    *
    * @param header window header
    * @param options
    * @param options.window
    * @param options.closeOnClick
    * @param options.closeTime
    * @param options.closeOtherProgressWindows
    */
    constructor(header, options = {
      closeOnClick: true,
      closeTime: 5e3
    }) {
      this.win = new (BasicTool.getZotero()).ProgressWindow(options);
      this.lines = [];
      this.closeTime = options.closeTime || 5e3;
      this.win.changeHeadline(header);
      if (options.closeOtherProgressWindows) BasicTool.getZotero().ProgressWindowSet.closeAll();
    }
    /**
    * Create a new line
    * @param options
    * @param options.type
    * @param options.icon
    * @param options.text
    * @param options.progress
    * @param options.idx
    */
    createLine(options) {
      const icon = this.getIcon(options.type, options.icon);
      const line = new this.win.ItemProgress(icon || "", options.text || "");
      if (typeof options.progress === "number") line.setProgress(options.progress);
      this.lines.push(line);
      this.updateIcons();
      return this;
    }
    /**
    * Change the line content
    * @param options
    * @param options.type
    * @param options.icon
    * @param options.text
    * @param options.progress
    * @param options.idx
    */
    changeLine(options) {
      if (this.lines?.length === 0) return this;
      const idx = typeof options.idx !== "undefined" && options.idx >= 0 && options.idx < this.lines.length ? options.idx : 0;
      const icon = this.getIcon(options.type, options.icon);
      if (icon) this.lines[idx].setItemTypeAndIcon(icon);
      options.text && this.lines[idx].setText(options.text);
      typeof options.progress === "number" && this.lines[idx].setProgress(options.progress);
      this.updateIcons();
      return this;
    }
    show(closeTime = void 0) {
      this.win.show();
      typeof closeTime !== "undefined" && (this.closeTime = closeTime);
      if (this.closeTime && this.closeTime > 0) this.win.startCloseTimer(this.closeTime);
      setTimeout(this.updateIcons.bind(this), 50);
      return this;
    }
    /**
    * Set custom icon uri for progress window
    * @param key
    * @param uri
    */
    static setIconURI(key, uri) {
      icons[key] = uri;
    }
    getIcon(type, defaultIcon) {
      return type && type in icons ? icons[type] : defaultIcon;
    }
    updateIcons() {
      try {
        this.lines.forEach((line) => {
          const box = line._image;
          const icon = box.dataset.itemType;
          if (icon && !box.style.backgroundImage.includes("progress_arcs")) box.style.backgroundImage = `url(${box.dataset.itemType})`;
        });
      } catch {
      }
    }
    changeHeadline(text, icon, postText) {
      this.win.changeHeadline(text, icon, postText);
      return this;
    }
    addLines(labels, icons$1) {
      this.win.addLines(labels, icons$1);
      return this;
    }
    addDescription(text) {
      this.win.addDescription(text);
      return this;
    }
    startCloseTimer(ms, requireMouseOver) {
      this.win.startCloseTimer(ms, requireMouseOver);
      return this;
    }
    close() {
      this.win.close();
      return this;
    }
  };
  var VirtualizedTableHelper = class extends BasicTool {
    props;
    localeStrings;
    containerId;
    treeInstance;
    window;
    React;
    ReactDOM;
    VirtualizedTable;
    IntlProvider;
    constructor(win) {
      super();
      this.window = win;
      const Zotero$1 = this.getGlobal("Zotero");
      const _require = win.require;
      this.React = _require("react");
      this.ReactDOM = _require("react-dom");
      this.VirtualizedTable = _require("components/virtualized-table");
      this.IntlProvider = _require("react-intl").IntlProvider;
      this.props = {
        id: `vtable-${Zotero$1.Utilities.randomString()}-${(/* @__PURE__ */ new Date()).getTime()}`,
        getRowCount: () => 0
      };
      this.localeStrings = Zotero$1.Intl.strings;
    }
    setProp(...args) {
      if (args.length === 1) Object.assign(this.props, args[0]);
      else if (args.length === 2) this.props[args[0]] = args[1];
      return this;
    }
    /**
    * Set locale strings, which replaces the table header's label if matches. Default it's `Zotero.Intl.strings`
    * @param localeStrings
    */
    setLocale(localeStrings) {
      Object.assign(this.localeStrings, localeStrings);
      return this;
    }
    /**
    * Set container element id that the table will be rendered on.
    * @param id element id
    */
    setContainerId(id) {
      this.containerId = id;
      return this;
    }
    /**
    * Render the table.
    * @param selectId Which row to select after rendering
    * @param onfulfilled callback after successfully rendered
    * @param onrejected callback after rendering with error
    */
    render(selectId, onfulfilled, onrejected) {
      const refreshSelection = () => {
        this.treeInstance.invalidate();
        if (typeof selectId !== "undefined" && selectId >= 0) this.treeInstance.selection.select(selectId);
        else this.treeInstance.selection.clearSelection();
      };
      if (!this.treeInstance) new Promise((resolve) => {
        const vtableProps = Object.assign({}, this.props, { ref: (ref) => {
          this.treeInstance = ref;
          resolve(void 0);
        } });
        if (vtableProps.getRowData && !vtableProps.renderItem) Object.assign(vtableProps, { renderItem: this.VirtualizedTable.makeRowRenderer(vtableProps.getRowData) });
        const elem = this.React.createElement(this.IntlProvider, {
          locale: Zotero.locale,
          messages: Zotero.Intl.strings
        }, this.React.createElement(this.VirtualizedTable, vtableProps));
        const container = this.window.document.getElementById(this.containerId);
        this.ReactDOM.createRoot(container).render(elem);
      }).then(() => {
        this.getGlobal("setTimeout")(() => {
          refreshSelection();
        });
      }).then(onfulfilled, onrejected);
      else refreshSelection();
      return this;
    }
  };
  var FieldHookManager = class extends ManagerTool {
    data = {
      getField: {},
      setField: {},
      isFieldOfBase: {}
    };
    patchHelpers = {
      getField: new PatchHelper(),
      setField: new PatchHelper(),
      isFieldOfBase: new PatchHelper()
    };
    constructor(base) {
      super(base);
      const _thisHelper = this;
      for (const type of Object.keys(this.patchHelpers)) {
        const helper = this.patchHelpers[type];
        helper.setData({
          target: this.getGlobal("Zotero").Item.prototype,
          funcSign: type,
          patcher: (original) => function(field, ...args) {
            const originalThis = this;
            const handler = _thisHelper.data[type][field];
            if (typeof handler === "function") try {
              return handler(field, args[0], args[1], originalThis, original);
            } catch (e) {
              return field + String(e);
            }
            return original.apply(originalThis, [field, ...args]);
          },
          enabled: true
        });
      }
    }
    register(type, field, hook) {
      this.data[type][field] = hook;
    }
    unregister(type, field) {
      delete this.data[type][field];
    }
    unregisterAll() {
      this.data.getField = {};
      this.data.setField = {};
      this.data.isFieldOfBase = {};
      this.patchHelpers.getField.disable();
      this.patchHelpers.setField.disable();
      this.patchHelpers.isFieldOfBase.disable();
    }
  };
  var wait_exports = {};
  __export2(wait_exports, {
    waitForReader: () => waitForReader,
    waitUntil: () => waitUntil,
    waitUntilAsync: () => waitUntilAsync,
    waitUtilAsync: () => waitUtilAsync
  });
  var basicTool = new BasicTool();
  function waitUntil(condition, callback, interval = 100, timeout = 1e4) {
    const start = Date.now();
    const intervalId = basicTool.getGlobal("setInterval")(() => {
      if (condition()) {
        basicTool.getGlobal("clearInterval")(intervalId);
        callback();
      } else if (Date.now() - start > timeout) basicTool.getGlobal("clearInterval")(intervalId);
    }, interval);
  }
  var waitUtilAsync = waitUntilAsync;
  function waitUntilAsync(condition, interval = 100, timeout = 1e4) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const intervalId = basicTool.getGlobal("setInterval")(() => {
        if (condition()) {
          basicTool.getGlobal("clearInterval")(intervalId);
          resolve();
        } else if (Date.now() - start > timeout) {
          basicTool.getGlobal("clearInterval")(intervalId);
          reject(/* @__PURE__ */ new Error("timeout"));
        }
      }, interval);
    });
  }
  async function waitForReader(reader) {
    await reader._initPromise;
    await reader._lastView.initializedPromise;
    if (reader.type === "pdf") await reader._lastView._iframeWindow.PDFViewerApplication.initializedPromise;
  }
  var KeyboardManager = class extends ManagerTool {
    _keyboardCallbacks = /* @__PURE__ */ new Set();
    _cachedKey;
    id;
    constructor(base) {
      super(base);
      this.id = `kbd-${Zotero.Utilities.randomString()}`;
      this._ensureAutoUnregisterAll();
      this.addListenerCallback("onMainWindowLoad", this.initKeyboardListener);
      this.addListenerCallback("onMainWindowUnload", this.unInitKeyboardListener);
      this.initReaderKeyboardListener();
      for (const win of Zotero.getMainWindows()) this.initKeyboardListener(win);
    }
    /**
    * Register a keyboard event listener.
    * @param callback The callback function.
    */
    register(callback) {
      this._keyboardCallbacks.add(callback);
    }
    /**
    * Unregister a keyboard event listener.
    * @param callback The callback function.
    */
    unregister(callback) {
      this._keyboardCallbacks.delete(callback);
    }
    /**
    * Unregister all keyboard event listeners.
    */
    unregisterAll() {
      this._keyboardCallbacks.clear();
      this.removeListenerCallback("onMainWindowLoad", this.initKeyboardListener);
      this.removeListenerCallback("onMainWindowUnload", this.unInitKeyboardListener);
      for (const win of Zotero.getMainWindows()) this.unInitKeyboardListener(win);
    }
    initKeyboardListener = this._initKeyboardListener.bind(this);
    unInitKeyboardListener = this._unInitKeyboardListener.bind(this);
    initReaderKeyboardListener() {
      Zotero.Reader.registerEventListener("renderToolbar", (event) => this.addReaderKeyboardCallback(event), this._basicOptions.api.pluginID);
      Zotero.Reader._readers.forEach((reader) => this.addReaderKeyboardCallback({ reader }));
    }
    async addReaderKeyboardCallback(event) {
      const reader = event.reader;
      const initializedKey = `_ztoolkitKeyboard${this.id}Initialized`;
      await waitForReader(reader);
      if (!reader._iframeWindow) return;
      if (reader._iframeWindow[initializedKey]) return;
      this._initKeyboardListener(reader._iframeWindow);
      waitUntil(() => !Components.utils.isDeadWrapper(reader._internalReader) && reader._internalReader?._primaryView?._iframeWindow, () => this._initKeyboardListener(reader._internalReader._primaryView?._iframeWindow));
      reader._iframeWindow[initializedKey] = true;
    }
    _initKeyboardListener(win) {
      if (!win) return;
      win.addEventListener("keydown", this.triggerKeydown);
      win.addEventListener("keyup", this.triggerKeyup);
    }
    _unInitKeyboardListener(win) {
      if (!win) return;
      win.removeEventListener("keydown", this.triggerKeydown);
      win.removeEventListener("keyup", this.triggerKeyup);
    }
    triggerKeydown = (e) => {
      if (!this._cachedKey) this._cachedKey = new KeyModifier(e);
      else this._cachedKey.merge(new KeyModifier(e), { allowOverwrite: false });
      this.dispatchCallback(e, { type: "keydown" });
    };
    triggerKeyup = async (e) => {
      if (!this._cachedKey) return;
      const currentShortcut = new KeyModifier(this._cachedKey);
      this._cachedKey = void 0;
      this.dispatchCallback(e, {
        keyboard: currentShortcut,
        type: "keyup"
      });
    };
    dispatchCallback(...args) {
      this._keyboardCallbacks.forEach((cbk) => cbk(...args));
    }
  };
  var KeyModifier = class KeyModifier2 {
    accel = false;
    shift = false;
    control = false;
    meta = false;
    alt = false;
    key = "";
    useAccel = false;
    constructor(raw, options) {
      this.useAccel = options?.useAccel || false;
      if (typeof raw === "undefined") {
      } else if (typeof raw === "string") {
        raw = raw || "";
        raw = this.unLocalized(raw);
        this.accel = raw.includes("accel");
        this.shift = raw.includes("shift");
        this.control = raw.includes("control");
        this.meta = raw.includes("meta");
        this.alt = raw.includes("alt");
        this.key = raw.replace(/(accel|shift|control|meta|alt|[ ,\-])/g, "").toLocaleLowerCase();
        if (!this.key && (raw.includes(",,") || raw === ",")) this.key = ",";
      } else if (raw instanceof KeyModifier2) this.merge(raw, { allowOverwrite: true });
      else {
        if (options?.useAccel) if (Zotero.isMac) this.accel = raw.metaKey;
        else this.accel = raw.ctrlKey;
        this.shift = raw.shiftKey;
        this.control = raw.ctrlKey;
        this.meta = raw.metaKey;
        this.alt = raw.altKey;
        if (![
          "Shift",
          "Meta",
          "Ctrl",
          "Alt",
          "Control"
        ].includes(raw.key)) this.key = raw.key;
      }
    }
    /**
    * Merge another KeyModifier into this one.
    * @param newMod the new KeyModifier
    * @param options
    * @param options.allowOverwrite
    * @returns KeyModifier
    */
    merge(newMod, options) {
      const allowOverwrite = options?.allowOverwrite || false;
      this.mergeAttribute("accel", newMod.accel, allowOverwrite);
      this.mergeAttribute("shift", newMod.shift, allowOverwrite);
      this.mergeAttribute("control", newMod.control, allowOverwrite);
      this.mergeAttribute("meta", newMod.meta, allowOverwrite);
      this.mergeAttribute("alt", newMod.alt, allowOverwrite);
      this.mergeAttribute("key", newMod.key, allowOverwrite);
      return this;
    }
    /**
    * Check if the current KeyModifier equals to another KeyModifier.
    * @param newMod the new KeyModifier
    * @returns true if equals
    */
    equals(newMod) {
      if (typeof newMod === "string") newMod = new KeyModifier2(newMod);
      if (this.shift !== newMod.shift || this.alt !== newMod.alt || this.key.toLowerCase() !== newMod.key.toLowerCase()) return false;
      if (this.accel || newMod.accel) {
        if (Zotero.isMac) {
          if ((this.accel || this.meta) !== (newMod.accel || newMod.meta) || this.control !== newMod.control) return false;
        } else if ((this.accel || this.control) !== (newMod.accel || newMod.control) || this.meta !== newMod.meta) return false;
      } else if (this.control !== newMod.control || this.meta !== newMod.meta) return false;
      return true;
    }
    /**
    * Get the raw string representation of the KeyModifier.
    */
    getRaw() {
      const enabled = [];
      this.accel && enabled.push("accel");
      this.shift && enabled.push("shift");
      this.control && enabled.push("control");
      this.meta && enabled.push("meta");
      this.alt && enabled.push("alt");
      this.key && enabled.push(this.key);
      return enabled.join(",");
    }
    /**
    * Get the localized string representation of the KeyModifier.
    */
    getLocalized() {
      const raw = this.getRaw();
      if (Zotero.isMac) return raw.replaceAll("control", "\u2303").replaceAll("alt", "\u2325").replaceAll("shift", "\u21E7").replaceAll("meta", "\u2318");
      else return raw.replaceAll("control", "Ctrl").replaceAll("alt", "Alt").replaceAll("shift", "Shift").replaceAll("meta", "Win");
    }
    /**
    * Get the un-localized string representation of the KeyModifier.
    */
    unLocalized(raw) {
      if (Zotero.isMac) return raw.replaceAll("\u2303", "control").replaceAll("\u2325", "alt").replaceAll("\u21E7", "shift").replaceAll("\u2318", "meta");
      else return raw.replaceAll("Ctrl", "control").replaceAll("Alt", "alt").replaceAll("Shift", "shift").replaceAll("Win", "meta");
    }
    mergeAttribute(attribute, value, allowOverwrite) {
      if (allowOverwrite || !this[attribute]) this[attribute] = value;
    }
  };
  var MenuManager = class extends ManagerTool {
    ui;
    constructor(base) {
      super(base);
      this.ui = new UITool(this);
    }
    /**
    * Insert an menu item/menu(with popup)/menuseprator into a menupopup
    * @remarks
    * options:
    * ```ts
    * export interface MenuitemOptions {
    *   tag: "menuitem" | "menu" | "menuseparator";
    *   id?: string;
    *   label?: string;
    *   // data url (chrome://xxx.png) or base64 url (data:image/png;base64,xxx)
    *   icon?: string;
    *   class?: string;
    *   styles?: { [key: string]: string };
    *   hidden?: boolean;
    *   disabled?: boolean;
    *   oncommand?: string;
    *   commandListener?: EventListenerOrEventListenerObject;
    *   // Attributes below are used when type === "menu"
    *   popupId?: string;
    *   onpopupshowing?: string;
    *   subElementOptions?: Array<MenuitemOptions>;
    * }
    * ```
    * @param menuPopup
    * @param options
    * @param insertPosition
    * @param anchorElement The menuitem will be put before/after `anchorElement`. If not set, put at start/end of the menupopup.
    * @example
    * Insert menuitem with icon into item menupopup
    * ```ts
    * // base64 or chrome:// url
    * const menuIcon = "chrome://addontemplate/content/icons/favicon@0.5x.png";
    * ztoolkit.Menu.register("item", {
    *   tag: "menuitem",
    *   id: "zotero-itemmenu-addontemplate-test",
    *   label: "Addon Template: Menuitem",
    *   oncommand: "alert('Hello World! Default Menuitem.')",
    *   icon: menuIcon,
    * });
    * ```
    * @example
    * Insert menu into file menupopup
    * ```ts
    * ztoolkit.Menu.register(
    *   "menuFile",
    *   {
    *     tag: "menu",
    *     label: "Addon Template: Menupopup",
    *     subElementOptions: [
    *       {
    *         tag: "menuitem",
    *         label: "Addon Template",
    *         oncommand: "alert('Hello World! Sub Menuitem.')",
    *       },
    *     ],
    *   },
    *   "before",
    *   Zotero.getMainWindow().document.querySelector(
    *     "#zotero-itemmenu-addontemplate-test"
    *   )
    * );
    * ```
    */
    register(menuPopup, options, insertPosition = "after", anchorElement) {
      let popup;
      if (typeof menuPopup === "string") popup = this.getGlobal("document").querySelector(MenuSelector[menuPopup]);
      else popup = menuPopup;
      if (!popup) return false;
      const doc = popup.ownerDocument;
      const genMenuElement = (menuitemOption) => {
        const elementOption = {
          tag: menuitemOption.tag,
          id: menuitemOption.id,
          namespace: "xul",
          attributes: {
            label: menuitemOption.label || "",
            hidden: Boolean(menuitemOption.hidden),
            disabled: Boolean(menuitemOption.disabled),
            class: menuitemOption.class || "",
            oncommand: menuitemOption.oncommand || ""
          },
          classList: menuitemOption.classList,
          styles: menuitemOption.styles || {},
          listeners: [],
          children: []
        };
        if (menuitemOption.icon) {
          if (!this.getGlobal("Zotero").isMac) if (menuitemOption.tag === "menu") elementOption.attributes.class += " menu-iconic";
          else elementOption.attributes.class += " menuitem-iconic";
          elementOption.styles["list-style-image"] = `url(${menuitemOption.icon})`;
        }
        if (menuitemOption.commandListener) elementOption.listeners?.push({
          type: "command",
          listener: menuitemOption.commandListener
        });
        if (menuitemOption.tag === "menuitem") {
          elementOption.attributes.type = menuitemOption.type || "";
          elementOption.attributes.checked = menuitemOption.checked || false;
        }
        const menuItem = this.ui.createElement(doc, menuitemOption.tag, elementOption);
        if (menuitemOption.isHidden || menuitemOption.getVisibility) popup?.addEventListener("popupshowing", async (ev) => {
          let hidden;
          if (menuitemOption.isHidden) hidden = await menuitemOption.isHidden(menuItem, ev);
          else if (menuitemOption.getVisibility) {
            const visible = await menuitemOption.getVisibility(menuItem, ev);
            hidden = typeof visible === "undefined" ? void 0 : !visible;
          }
          if (typeof hidden === "undefined") return;
          if (hidden) menuItem.setAttribute("hidden", "true");
          else menuItem.removeAttribute("hidden");
        });
        if (menuitemOption.isDisabled) popup?.addEventListener("popupshowing", async (ev) => {
          const disabled = await menuitemOption.isDisabled(menuItem, ev);
          if (typeof disabled === "undefined") return;
          if (disabled) menuItem.setAttribute("disabled", "true");
          else menuItem.removeAttribute("disabled");
        });
        if ((menuitemOption.tag === "menuitem" || menuitemOption.tag === "menuseparator") && menuitemOption.onShowing) popup?.addEventListener("popupshowing", async (ev) => {
          await menuitemOption.onShowing(menuItem, ev);
        });
        if (menuitemOption.tag === "menu") {
          const subPopup = this.ui.createElement(doc, "menupopup", {
            id: menuitemOption.popupId,
            attributes: { onpopupshowing: menuitemOption.onpopupshowing || "" }
          });
          menuitemOption.children?.forEach((childOption) => {
            subPopup.append(genMenuElement(childOption));
          });
          menuItem.append(subPopup);
        }
        return menuItem;
      };
      const topMenuItem = genMenuElement(options);
      if (popup.childElementCount) {
        if (!anchorElement) anchorElement = insertPosition === "after" ? popup.lastElementChild : popup.firstElementChild;
        anchorElement[insertPosition](topMenuItem);
      } else popup.appendChild(topMenuItem);
    }
    unregister(menuId) {
      this.getGlobal("document").querySelector(`#${menuId}`)?.remove();
    }
    unregisterAll() {
      this.ui.unregisterAll();
    }
  };
  var MenuSelector = /* @__PURE__ */ function(MenuSelector$1) {
    MenuSelector$1["menuFile"] = "#menu_FilePopup";
    MenuSelector$1["menuEdit"] = "#menu_EditPopup";
    MenuSelector$1["menuView"] = "#menu_viewPopup";
    MenuSelector$1["menuGo"] = "#menu_goPopup";
    MenuSelector$1["menuTools"] = "#menu_ToolsPopup";
    MenuSelector$1["menuHelp"] = "#menu_HelpPopup";
    MenuSelector$1["collection"] = "#zotero-collectionmenu";
    MenuSelector$1["item"] = "#zotero-itemmenu";
    return MenuSelector$1;
  }(MenuSelector || {});
  var Prompt = class {
    ui;
    base;
    get document() {
      return this.base.getGlobal("document");
    }
    /**
    * Record the last text entered
    */
    lastInputText = "";
    /**
    * Default text
    */
    defaultText = {
      placeholder: "Select a command...",
      empty: "No commands found."
    };
    /**
    * It controls the max line number of commands displayed in `commandsNode`.
    */
    maxLineNum = 12;
    /**
    * It controls the max number of suggestions.
    */
    maxSuggestionNum = 100;
    /**
    * The top-level HTML div node of `Prompt`
    */
    promptNode;
    /**
    * The HTML input node of `Prompt`.
    */
    inputNode;
    /**
    * Save all commands registered by all addons.
    */
    commands = [];
    /**
    * Initialize `Prompt` but do not create UI.
    */
    constructor() {
      this.base = new BasicTool();
      this.ui = new UITool();
      this.initializeUI();
    }
    /**
    * Initialize `Prompt` UI and then bind events on it.
    */
    initializeUI() {
      this.addStyle();
      this.createHTML();
      this.initInputEvents();
      this.registerShortcut();
    }
    createHTML() {
      this.promptNode = this.ui.createElement(this.document, "div", {
        styles: { display: "none" },
        children: [{
          tag: "div",
          styles: {
            position: "fixed",
            left: "0",
            top: "0",
            backgroundColor: "transparent",
            width: "100%",
            height: "100%"
          },
          listeners: [{
            type: "click",
            listener: () => {
              this.promptNode.style.display = "none";
            }
          }]
        }]
      });
      this.promptNode.appendChild(this.ui.createElement(this.document, "div", {
        id: `zotero-plugin-toolkit-prompt`,
        classList: ["prompt-container"],
        children: [
          {
            tag: "div",
            classList: ["input-container"],
            children: [{
              tag: "input",
              classList: ["prompt-input"],
              attributes: {
                type: "text",
                placeholder: this.defaultText.placeholder
              }
            }, {
              tag: "div",
              classList: ["cta"]
            }]
          },
          {
            tag: "div",
            classList: ["commands-containers"]
          },
          {
            tag: "div",
            classList: ["instructions"],
            children: [
              {
                tag: "div",
                classList: ["instruction"],
                children: [{
                  tag: "span",
                  classList: ["key"],
                  properties: { innerText: "\u2191\u2193" }
                }, {
                  tag: "span",
                  properties: { innerText: "to navigate" }
                }]
              },
              {
                tag: "div",
                classList: ["instruction"],
                children: [{
                  tag: "span",
                  classList: ["key"],
                  properties: { innerText: "enter" }
                }, {
                  tag: "span",
                  properties: { innerText: "to trigger" }
                }]
              },
              {
                tag: "div",
                classList: ["instruction"],
                children: [{
                  tag: "span",
                  classList: ["key"],
                  properties: { innerText: "esc" }
                }, {
                  tag: "span",
                  properties: { innerText: "to exit" }
                }]
              }
            ]
          }
        ]
      }));
      this.inputNode = this.promptNode.querySelector("input");
      this.document.documentElement.appendChild(this.promptNode);
    }
    /**
    * Show commands in a new `commandsContainer`
    * All other `commandsContainer` is hidden
    * @param commands Command[]
    * @param clear remove all `commandsContainer` if true
    */
    showCommands(commands, clear = false) {
      if (clear) this.promptNode.querySelectorAll(".commands-container").forEach((e) => e.remove());
      this.inputNode.placeholder = this.defaultText.placeholder;
      const commandsContainer = this.createCommandsContainer();
      for (const command of commands) {
        try {
          if (!command.name || command.when && !command.when()) continue;
        } catch {
          continue;
        }
        commandsContainer.appendChild(this.createCommandNode(command));
      }
    }
    /**
    * Create a `commandsContainer` div element, append to `commandsContainer` and hide others.
    * @returns commandsNode
    */
    createCommandsContainer() {
      const commandsContainer = this.ui.createElement(this.document, "div", { classList: ["commands-container"] });
      this.promptNode.querySelectorAll(".commands-container").forEach((e) => {
        e.style.display = "none";
      });
      this.promptNode.querySelector(".commands-containers").appendChild(commandsContainer);
      return commandsContainer;
    }
    /**
    * Return current displayed `commandsContainer`
    * @returns
    */
    getCommandsContainer() {
      return [...Array.from(this.promptNode.querySelectorAll(".commands-container"))].find((e) => {
        return e.style.display !== "none";
      });
    }
    /**
    * Create a command item for `Prompt` UI.
    * @param command
    * @returns
    */
    createCommandNode(command) {
      const commandNode = this.ui.createElement(this.document, "div", {
        classList: ["command"],
        children: [{
          tag: "div",
          classList: ["content"],
          children: [{
            tag: "div",
            classList: ["name"],
            children: [{
              tag: "span",
              properties: { innerText: command.name }
            }]
          }, {
            tag: "div",
            classList: ["aux"],
            children: command.label ? [{
              tag: "span",
              classList: ["label"],
              properties: { innerText: command.label }
            }] : []
          }]
        }],
        listeners: [{
          type: "mousemove",
          listener: () => {
            this.selectItem(commandNode);
          }
        }, {
          type: "click",
          listener: async () => {
            await this.execCallback(command.callback);
          }
        }]
      });
      commandNode.command = command;
      return commandNode;
    }
    /**
    * Called when `enter` key is pressed.
    */
    trigger() {
      [...Array.from(this.promptNode.querySelectorAll(".commands-container"))].find((e) => e.style.display !== "none").querySelector(".selected").click();
    }
    /**
    * Called when `escape` key is pressed.
    */
    exit() {
      this.inputNode.placeholder = this.defaultText.placeholder;
      if (this.promptNode.querySelectorAll(".commands-containers .commands-container").length >= 2) {
        this.promptNode.querySelector(".commands-container:last-child").remove();
        const commandsContainer = this.promptNode.querySelector(".commands-container:last-child");
        commandsContainer.style.display = "";
        commandsContainer.querySelectorAll(".commands").forEach((e) => e.style.display = "flex");
        this.inputNode.focus();
      } else this.promptNode.style.display = "none";
    }
    async execCallback(callback) {
      if (Array.isArray(callback)) this.showCommands(callback);
      else await callback(this);
    }
    /**
    * Match suggestions for user's entered text.
    */
    async showSuggestions(inputText) {
      const _w = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@[\]^_`{|}~]/;
      const jw = /\s/;
      const Ww = /[\u0F00-\u0FFF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF66-\uFF9F]/;
      function Yw(e$1, t, n, i) {
        if (e$1.length === 0) return 0;
        let r = 0;
        r -= Math.max(0, e$1.length - 1), r -= i / 10;
        const o = e$1[0][0];
        return r -= (e$1[e$1.length - 1][1] - o + 1 - t) / 100, r -= o / 1e3, r -= n / 1e4;
      }
      function $w(e$1, t, n, i) {
        if (e$1.length === 0) return null;
        for (var r = n.toLowerCase(), o = 0, a = 0, s = [], l = 0; l < e$1.length; l++) {
          const c = e$1[l];
          const u = r.indexOf(c, a);
          if (u === -1) return null;
          const h = n.charAt(u);
          if (u > 0 && !_w.test(h) && !Ww.test(h)) {
            const p = n.charAt(u - 1);
            if (h.toLowerCase() !== h && p.toLowerCase() !== p || h.toUpperCase() !== h && !_w.test(p) && !jw.test(p) && !Ww.test(p)) if (i) {
              if (u !== a) {
                a += c.length, l--;
                continue;
              }
            } else o += 1;
          }
          if (s.length === 0) s.push([u, u + c.length]);
          else {
            const d = s[s.length - 1];
            d[1] < u ? s.push([u, u + c.length]) : d[1] = u + c.length;
          }
          a = u + c.length;
        }
        return {
          matches: s,
          score: Yw(s, t.length, r.length, o)
        };
      }
      function Gw(e$1) {
        for (var t = e$1.toLowerCase(), n = [], i = 0, r = 0; r < t.length; r++) {
          const o = t.charAt(r);
          jw.test(o) ? (i !== r && n.push(t.substring(i, r)), i = r + 1) : (_w.test(o) || Ww.test(o)) && (i !== r && n.push(t.substring(i, r)), n.push(o), i = r + 1);
        }
        return i !== t.length && n.push(t.substring(i, t.length)), {
          query: e$1,
          tokens: n,
          fuzzy: t.split("")
        };
      }
      function Xw(e$1, t) {
        if (e$1.query === "") return {
          score: 0,
          matches: []
        };
        const n = $w(e$1.tokens, e$1.query, t, false);
        return n || $w(e$1.fuzzy, e$1.query, t, true);
      }
      const e = Gw(inputText);
      let container = this.getCommandsContainer();
      if (container.classList.contains("suggestions")) this.exit();
      if (inputText.trim() == "") return true;
      const suggestions = [];
      this.getCommandsContainer().querySelectorAll(".command").forEach((commandNode) => {
        const spanNode = commandNode.querySelector(".name span");
        const spanText = spanNode.innerText;
        const res = Xw(e, spanText);
        if (res) {
          commandNode = this.createCommandNode(commandNode.command);
          let spanHTML = "";
          let i = 0;
          for (let j = 0; j < res.matches.length; j++) {
            const [start, end] = res.matches[j];
            if (start > i) spanHTML += spanText.slice(i, start);
            spanHTML += `<span class="highlight">${spanText.slice(start, end)}</span>`;
            i = end;
          }
          if (i < spanText.length) spanHTML += spanText.slice(i, spanText.length);
          commandNode.querySelector(".name span").innerHTML = spanHTML;
          suggestions.push({
            score: res.score,
            commandNode
          });
        }
      });
      if (suggestions.length > 0) {
        suggestions.sort((a, b) => b.score - a.score).slice(this.maxSuggestionNum);
        container = this.createCommandsContainer();
        container.classList.add("suggestions");
        suggestions.forEach((suggestion) => {
          container.appendChild(suggestion.commandNode);
        });
        return true;
      } else {
        const anonymousCommand = this.commands.find((c) => !c.name && (!c.when || c.when()));
        if (anonymousCommand) await this.execCallback(anonymousCommand.callback);
        else this.showTip(this.defaultText.empty);
        return false;
      }
    }
    /**
    * Bind events of pressing `keydown` and `keyup` key.
    */
    initInputEvents() {
      this.promptNode.addEventListener("keydown", (event) => {
        if (["ArrowUp", "ArrowDown"].includes(event.key)) {
          event.preventDefault();
          let selectedIndex;
          const allItems = [...Array.from(this.getCommandsContainer().querySelectorAll(".command"))].filter((e) => e.style.display != "none");
          selectedIndex = allItems.findIndex((e) => e.classList.contains("selected"));
          if (selectedIndex != -1) {
            allItems[selectedIndex].classList.remove("selected");
            selectedIndex += event.key == "ArrowUp" ? -1 : 1;
          } else if (event.key == "ArrowUp") selectedIndex = allItems.length - 1;
          else selectedIndex = 0;
          if (selectedIndex == -1) selectedIndex = allItems.length - 1;
          else if (selectedIndex == allItems.length) selectedIndex = 0;
          allItems[selectedIndex].classList.add("selected");
          const commandsContainer = this.getCommandsContainer();
          commandsContainer.scrollTo(0, commandsContainer.querySelector(".selected").offsetTop - commandsContainer.offsetHeight + 7.5);
          allItems[selectedIndex].classList.add("selected");
        }
      });
      this.promptNode.addEventListener("keyup", async (event) => {
        if (event.key == "Enter") this.trigger();
        else if (event.key == "Escape") if (this.inputNode.value.length > 0) this.inputNode.value = "";
        else this.exit();
        else if (["ArrowUp", "ArrowDown"].includes(event.key)) return;
        const currentInputText = this.inputNode.value;
        if (currentInputText == this.lastInputText) return;
        this.lastInputText = currentInputText;
        window.setTimeout(async () => {
          await this.showSuggestions(currentInputText);
        });
      });
    }
    /**
    * Create a commandsContainer and display a text
    */
    showTip(text) {
      const tipNode = this.ui.createElement(this.document, "div", {
        classList: ["tip"],
        properties: { innerText: text }
      });
      const container = this.createCommandsContainer();
      container.classList.add("suggestions");
      container.appendChild(tipNode);
      return tipNode;
    }
    /**
    * Mark the selected item with class `selected`.
    * @param item HTMLDivElement
    */
    selectItem(item) {
      this.getCommandsContainer().querySelectorAll(".command").forEach((e) => e.classList.remove("selected"));
      item.classList.add("selected");
    }
    addStyle() {
      const style$1 = this.ui.createElement(this.document, "style", {
        namespace: "html",
        id: "prompt-style"
      });
      style$1.innerText = `
      .prompt-container * {
        box-sizing: border-box;
      }
      .prompt-container {
        ---radius---: 10px;
        position: fixed;
        left: 25%;
        top: 10%;
        width: 50%;
        border-radius: var(---radius---);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-size: 18px;
        box-shadow: 0px 1.8px 7.3px rgba(0, 0, 0, 0.071),
                    0px 6.3px 24.7px rgba(0, 0, 0, 0.112),
                    0px 30px 90px rgba(0, 0, 0, 0.2);
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Microsoft YaHei Light", sans-serif;
        background-color: var(--material-background) !important;
        border: var(--material-border-quarternary) !important;
      }
      
      /* input */
      .prompt-container .input-container  {
        width: 100%;
      }

      .input-container input {
        width: -moz-available;
        height: 40px;
        padding: 24px;
        border: none;
        outline: none;
        font-size: 18px;
        margin: 0 !important;
        border-radius: var(---radius---);
        background-color: var(--material-background);
      }
      
      .input-container .cta {
        border-bottom: var(--material-border-quarternary);
        margin: 5px auto;
      }
      
      /* results */
      .commands-containers {
        width: 100%;
        height: 100%;
      }
      .commands-container {
        max-height: calc(${this.maxLineNum} * 35.5px);
        width: calc(100% - 12px);
        margin-left: 12px;
        margin-right: 0%;
        overflow-y: auto;
        overflow-x: hidden;
      }
      
      .commands-container .command {
        display: flex;
        align-content: baseline;
        justify-content: space-between;
        border-radius: 5px;
        padding: 6px 12px;
        margin-right: 12px;
        margin-top: 2px;
        margin-bottom: 2px;
      }
      .commands-container .command .content {
        display: flex;
        width: 100%;
        justify-content: space-between;
        flex-direction: row;
        overflow: hidden;
      }
      .commands-container .command .content .name {
        white-space: nowrap; 
        text-overflow: ellipsis;
        overflow: hidden;
      }
      .commands-container .command .content .aux {
        display: flex;
        align-items: center;
        align-self: center;
        flex-shrink: 0;
      }
      
      .commands-container .command .content .aux .label {
        font-size: 15px;
        color: var(--fill-primary);
        padding: 2px 6px;
        background-color: var(--color-background);
        border-radius: 5px;
      }
      
      .commands-container .selected {
          background-color: var(--material-mix-quinary);
      }

      .commands-container .highlight {
        font-weight: bold;
      }

      .tip {
        color: var(--fill-primary);
        text-align: center;
        padding: 12px 12px;
        font-size: 18px;
      }

      /* instructions */
      .instructions {
        display: flex;
        align-content: center;
        justify-content: center;
        font-size: 15px;
        height: 2.5em;
        width: 100%;
        border-top: var(--material-border-quarternary);
        color: var(--fill-secondary);
        margin-top: 5px;
      }
      
      .instructions .instruction {
        margin: auto .5em;  
      }
      
      .instructions .key {
        margin-right: .2em;
        font-weight: 600;
      }
    `;
      this.document.documentElement.appendChild(style$1);
    }
    registerShortcut() {
      this.document.addEventListener("keydown", (event) => {
        if (event.shiftKey && event.key.toLowerCase() == "p") {
          if (event.originalTarget.isContentEditable || "value" in event.originalTarget || this.commands.length == 0) return;
          event.preventDefault();
          event.stopPropagation();
          if (this.promptNode.style.display == "none") {
            this.promptNode.style.display = "flex";
            if (this.promptNode.querySelectorAll(".commands-container").length == 1) this.showCommands(this.commands, true);
            this.promptNode.focus();
            this.inputNode.focus();
          } else this.promptNode.style.display = "none";
        }
      }, true);
    }
  };
  var PromptManager = class extends ManagerTool {
    prompt;
    /**
    * Save the commands registered from this manager
    */
    commands = [];
    constructor(base) {
      super(base);
      const globalCache = toolkitGlobal_default.getInstance()?.prompt;
      if (!globalCache) throw new Error("Prompt is not initialized.");
      if (!globalCache._ready) {
        globalCache._ready = true;
        globalCache.instance = new Prompt();
      }
      this.prompt = globalCache.instance;
    }
    /**
    * Register commands. Don't forget to call `unregister` on plugin exit.
    * @param commands Command[]
    * @example
    * ```ts
    * let getReader = () => {
    *   return BasicTool.getZotero().Reader.getByTabID(
    *     (Zotero.getMainWindow().Zotero_Tabs).selectedID
    *   )
    * }
    *
    * register([
    *   {
    *     name: "Split Horizontally",
    *     label: "Zotero",
    *     when: () => getReader() as boolean,
    *     callback: (prompt: Prompt) => getReader().menuCmd("splitHorizontally")
    *   },
    *   {
    *     name: "Split Vertically",
    *     label: "Zotero",
    *     when: () => getReader() as boolean,
    *     callback: (prompt: Prompt) => getReader().menuCmd("splitVertically")
    *   }
    * ])
    * ```
    */
    register(commands) {
      commands.forEach((c) => c.id ??= c.name);
      this.prompt.commands = [...this.prompt.commands, ...commands];
      this.commands = [...this.commands, ...commands];
      this.prompt.showCommands(this.commands, true);
    }
    /**
    * You can delete a command registed before by its name.
    * @remarks
    * There is a premise here that the names of all commands registered by a single plugin are not duplicated.
    * @param id Command.name
    */
    unregister(id) {
      this.prompt.commands = this.prompt.commands.filter((c) => c.id != id);
      this.commands = this.commands.filter((c) => c.id != id);
    }
    /**
    * Call `unregisterAll` on plugin exit.
    */
    unregisterAll() {
      this.prompt.commands = this.prompt.commands.filter((c) => {
        return this.commands.every((_c) => _c.id != c.id);
      });
      this.commands = [];
    }
  };
  var ExtraFieldTool = class extends BasicTool {
    /**
    * Get all extra fields
    * @param item
    */
    getExtraFields(item, backend = "custom") {
      const extraFiledRaw = item.getField("extra");
      if (backend === "default") return this.getGlobal("Zotero").Utilities.Internal.extractExtraFields(extraFiledRaw).fields;
      else {
        const map = /* @__PURE__ */ new Map();
        const nonStandardFields = [];
        extraFiledRaw.split("\n").forEach((line) => {
          const split = line.split(": ");
          if (split.length >= 2 && split[0]) map.set(split[0], split.slice(1).join(": "));
          else nonStandardFields.push(line);
        });
        map.set("__nonStandard__", nonStandardFields.join("\n"));
        return map;
      }
    }
    /**
    * Get extra field value by key. If it does not exists, return undefined.
    * @param item
    * @param key
    */
    getExtraField(item, key) {
      const fields = this.getExtraFields(item);
      return fields.get(key);
    }
    /**
    * Replace extra field of an item.
    * @param item
    * @param fields
    */
    async replaceExtraFields(item, fields) {
      const kvs = [];
      if (fields.has("__nonStandard__")) {
        kvs.push(fields.get("__nonStandard__"));
        fields.delete("__nonStandard__");
      }
      fields.forEach((v, k) => {
        kvs.push(`${k}: ${v}`);
      });
      item.setField("extra", kvs.join("\n"));
      await item.saveTx();
    }
    /**
    * Set an key-value pair to the item's extra field
    * @param item
    * @param key
    * @param value
    */
    async setExtraField(item, key, value) {
      const fields = this.getExtraFields(item);
      if (value === "" || typeof value === "undefined") fields.delete(key);
      else fields.set(key, value);
      await this.replaceExtraFields(item, fields);
    }
  };
  var ReaderTool = class extends BasicTool {
    /**
    * Get the selected tab reader.
    * @param waitTime Wait for n MS until the reader is ready
    */
    async getReader(waitTime = 5e3) {
      const Zotero_Tabs = this.getGlobal("Zotero_Tabs");
      if (Zotero_Tabs.selectedType !== "reader") return void 0;
      let reader = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID);
      let delayCount = 0;
      const checkPeriod = 50;
      while (!reader && delayCount * checkPeriod < waitTime) {
        await new Promise((resolve) => setTimeout(resolve, checkPeriod));
        reader = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID);
        delayCount++;
      }
      await reader?._initPromise;
      return reader;
    }
    /**
    * Get all window readers.
    */
    getWindowReader() {
      const Zotero_Tabs = this.getGlobal("Zotero_Tabs");
      const windowReaders = [];
      const tabs = Zotero_Tabs._tabs.map((e) => e.id);
      for (let i = 0; i < Zotero.Reader._readers.length; i++) {
        let flag = false;
        for (let j = 0; j < tabs.length; j++) if (Zotero.Reader._readers[i].tabID === tabs[j]) {
          flag = true;
          break;
        }
        if (!flag) windowReaders.push(Zotero.Reader._readers[i]);
      }
      return windowReaders;
    }
    /**
    * Get Reader tabpanel deck element.
    * @deprecated - use item pane api
    * @alpha
    */
    getReaderTabPanelDeck() {
      const deck = this.getGlobal("window").document.querySelector(".notes-pane-deck")?.previousElementSibling;
      return deck;
    }
    /**
    * Add a reader tabpanel deck selection change observer.
    * @deprecated - use item pane api
    * @alpha
    * @param callback
    */
    async addReaderTabPanelDeckObserver(callback) {
      await waitUtilAsync(() => !!this.getReaderTabPanelDeck());
      const deck = this.getReaderTabPanelDeck();
      const observer = new (this.getGlobal("MutationObserver"))(async (mutations) => {
        mutations.forEach(async (mutation) => {
          const target = mutation.target;
          if (target.classList.contains("zotero-view-tabbox") || target.tagName === "deck") callback();
        });
      });
      observer.observe(deck, {
        attributes: true,
        attributeFilter: ["selectedIndex"],
        subtree: true
      });
      return observer;
    }
    /**
    * Get the selected annotation data.
    * @param reader Target reader
    * @returns The selected annotation data.
    */
    getSelectedAnnotationData(reader) {
      const annotation = reader?._internalReader._lastView._selectionPopup?.annotation;
      return annotation;
    }
    /**
    * Get the text selection of reader.
    * @param reader Target reader
    * @returns The text selection of reader.
    */
    getSelectedText(reader) {
      return this.getSelectedAnnotationData(reader)?.text ?? "";
    }
  };
  var ZoteroToolkit = class extends BasicTool {
    static _version = BasicTool._version;
    UI = new UITool(this);
    Reader = new ReaderTool(this);
    ExtraField = new ExtraFieldTool(this);
    FieldHooks = new FieldHookManager(this);
    Keyboard = new KeyboardManager(this);
    Prompt = new PromptManager(this);
    Menu = new MenuManager(this);
    Clipboard = makeHelperTool(ClipboardHelper, this);
    FilePicker = makeHelperTool(FilePickerHelper, this);
    Patch = makeHelperTool(PatchHelper, this);
    ProgressWindow = makeHelperTool(ProgressWindowHelper, this);
    VirtualizedTable = makeHelperTool(VirtualizedTableHelper, this);
    Dialog = makeHelperTool(DialogHelper, this);
    LargePrefObject = makeHelperTool(LargePrefHelper, this);
    Guide = makeHelperTool(GuideHelper, this);
    constructor() {
      super();
    }
    /**
    * Unregister everything created by managers.
    */
    unregisterAll() {
      unregister(this);
    }
  };

  // package.json
  var version2 = "4.1.7";
  var config = {
    addonName: "Zotero PDF2zh",
    addonID: "pdf2zh@guaguastandup.com",
    addonRef: "pdf2zh",
    addonInstance: "pdf2zh",
    prefsPrefix: "extensions.zotero.pdf2zh"
  };

  // src/utils/locale.ts
  function initLocale() {
    const l10n = new (typeof Localization === "undefined" ? ztoolkit.getGlobal("Localization") : Localization)([`${config.addonRef}-addon.ftl`], true);
    addon.data.locale = {
      current: l10n
    };
  }
  function getString(...inputs) {
    if (inputs.length === 1) {
      return _getString(inputs[0]);
    } else if (inputs.length === 2) {
      if (typeof inputs[1] === "string") {
        return _getString(inputs[0], { branch: inputs[1] });
      } else {
        return _getString(inputs[0], inputs[1]);
      }
    } else {
      throw new Error("Invalid arguments");
    }
  }
  function _getString(localeString, options = {}) {
    const localStringWithPrefix = `${config.addonRef}-${localeString}`;
    const { branch, args } = options;
    const pattern = addon.data.locale?.current.formatMessagesSync([
      { id: localStringWithPrefix, args }
    ])[0];
    if (!pattern) {
      return localStringWithPrefix;
    }
    if (branch && pattern.attributes) {
      for (const attr of pattern.attributes) {
        if (attr.name === branch) {
          return attr.value;
        }
      }
      return pattern.attributes[branch] || localStringWithPrefix;
    } else {
      return pattern.value || localStringWithPrefix;
    }
  }

  // src/modules/pdf2zh.ts
  var PDF2zhBasicFactory = class {
    static registerPrefs() {
      Zotero.PreferencePanes.register({
        pluginID: addon.data.config.addonID,
        src: rootURI + "content/preferences.xhtml",
        label: getString("prefs-title"),
        image: `chrome://${addon.data.config.addonRef}/content/icons/favicon.svg`
      });
    }
  };
  var PDF2zhUIFactory = class {
    static registerRightClickMenuItem() {
      const menuIcon = `chrome://${addon.data.config.addonRef}/content/icons/favicon@0.5x.svg`;
      const MENU_ITEMS = [
        {
          id: "translate-pdf",
          label: getString("prefs-menu-translate"),
          command: "translatePDF"
        },
        {
          id: "crop-pdf",
          label: getString("prefs-menu-cut"),
          command: "cropPDF"
        },
        {
          id: "compare-pdf",
          label: getString("prefs-menu-compare"),
          command: "comparePDF"
        },
        {
          id: "crop-compare-pdf",
          label: getString("prefs-menu-crop-compare"),
          command: "crop-comparePDF"
        }
      ];
      const pdf2zhMenu = {
        tag: "menu",
        id: "zotero-itemmenu-pdf2zh",
        icon: menuIcon,
        label: `PDF2zh`,
        children: MENU_ITEMS.map(({ id, label, command }) => ({
          tag: "menuitem",
          id: `zotero-itemmenu-${id}`,
          label: `PDF2zh: ${label}`,
          commandListener: () => addon.hooks.onDialogEvents(command),
          icon: menuIcon
        }))
      };
      ztoolkit.Menu.register("item", pdf2zhMenu);
    }
  };

  // src/utils/prefs.ts
  function getPref(key) {
    return Zotero.Prefs.get(`${config.prefsPrefix}.${key}`, true);
  }
  function setPref(key, value) {
    return Zotero.Prefs.set(`${config.prefsPrefix}.${key}`, value, true);
  }

  // src/modules/pdf2zhFileProcessor.ts
  var FileProcessor = class _FileProcessor {
    constructor() {
      this.eventListeners = [];
    }
    static getInstance() {
      if (!_FileProcessor.instance) {
        _FileProcessor.instance = new _FileProcessor();
      }
      return _FileProcessor.instance;
    }
    addEventListener(listener) {
      this.eventListeners.push(listener);
      return () => {
        this.eventListeners = this.eventListeners.filter(
          (candidate) => candidate !== listener
        );
      };
    }
    emit(event, data) {
      [...this.eventListeners].forEach((listener) => {
        try {
          listener(event, data);
        } catch (error) {
          ztoolkit.log(`\u4E8B\u4EF6\u76D1\u542C\u5668\u9519\u8BEF:`, error);
        }
      });
    }
    // 批量处理文件
    async processBatch(tasks, onProgress) {
      this.emit("batchStarted", { totalTasks: tasks.length });
      let succeeded = 0;
      let failed = 0;
      for (let index = 0; index < tasks.length; index++) {
        const task = tasks[index];
        const report = (update) => {
          onProgress?.({
            ...update,
            current: index + 1,
            total: tasks.length
          });
        };
        try {
          await PDF2zhHelperFactory.processSingleFile(task, report);
          succeeded++;
        } catch {
          failed++;
        }
      }
      this.emit("batchCompleted", {
        total: tasks.length,
        succeeded,
        failed
      });
      return { total: tasks.length, succeeded, failed };
    }
  };

  // src/modules/pdf2zhAttachmentUtils.ts
  function containsBytes(bytes, needle, start, end) {
    const first = Math.max(0, start);
    const last = Math.min(bytes.length, end) - needle.length;
    for (let i = first; i <= last; i++) {
      let matched = true;
      for (let j = 0; j < needle.length; j++) {
        if (bytes[i + j] !== needle[j]) {
          matched = false;
          break;
        }
      }
      if (matched) {
        return true;
      }
    }
    return false;
  }
  function validatePDFBytes(bytes, fileName) {
    const hasHeader = containsBytes(
      bytes,
      [37, 80, 68, 70, 45],
      // %PDF-
      0,
      Math.min(bytes.length, 1024)
    );
    const hasEOF = containsBytes(
      bytes,
      [37, 37, 69, 79, 70],
      // %%EOF
      Math.max(0, bytes.length - 65536),
      bytes.length
    );
    if (!hasHeader || !hasEOF) {
      throw new Error(`\u4E0B\u8F7D\u5185\u5BB9\u4E0D\u662F\u5B8C\u6574 PDF: ${fileName}`);
    }
  }
  function stringList(value) {
    return Array.isArray(value) ? value.filter(
      (item) => typeof item === "string" && item.length > 0
    ) : [];
  }
  function taskIdFromPayload(task) {
    const raw = task.taskId ?? task.task_id ?? "";
    return typeof raw === "string" || typeof raw === "number" ? String(raw).trim() : "";
  }
  function taskFinishedWithoutFiles(task, taskId) {
    if (!task || taskIdFromPayload(task) !== taskId) {
      return false;
    }
    const nested = task.result && typeof task.result === "object" ? task.result : null;
    const status = String(task.status || nested?.status || "");
    const completed = task.finished === true || status === "\u5B8C\u6210" || status === "success" || nested?.status === "success";
    const failed = status === "\u5931\u8D25" || status === "failed" || nested?.status === "error";
    const files = stringList(nested?.fileList ?? task.fileList);
    const paths = stringList(nested?.filePaths ?? task.filePaths);
    return completed && !failed && files.length === 0 && paths.length === 0;
  }

  // src/modules/llmApiManager.ts
  var emptyLLMApi = {
    key: "",
    service: "",
    apiKey: "",
    apiUrl: "",
    model: "",
    activate: false,
    extraData: {}
  };
  var LLMApiManager = class {
    constructor() {
      this.data = /* @__PURE__ */ new Map();
    }
    updateLLMApi(llmApi) {
      let key = llmApi.key;
      if (!key) {
        key = Zotero.Utilities.generateObjectKey();
        llmApi.key = key;
      }
      if (llmApi.activate) {
        this.deactivateSameServiceModel(llmApi.service, key);
      }
      this.data.set(key, llmApi);
      return key;
    }
    // 停用相同service的其他条目
    deactivateSameServiceModel(service, excludeKey) {
      this.data.forEach((llmApi, key) => {
        if (key !== excludeKey && llmApi.service === service && llmApi.activate) {
          llmApi.activate = false;
          this.data.set(key, llmApi);
        }
      });
    }
    // 激活指定条目，同时停用相同service的其他条目
    activateLLMApi(key) {
      const llmApi = this.data.get(key);
      if (!llmApi) return false;
      this.deactivateSameServiceModel(llmApi.service, key);
      llmApi.activate = true;
      this.data.set(key, llmApi);
      return true;
    }
    // 停用指定条目
    deactivateLLMApi(key) {
      const llmApi = this.data.get(key);
      if (!llmApi) return false;
      llmApi.activate = false;
      this.data.set(key, llmApi);
      return true;
    }
    getLLMApi(key) {
      return this.data.get(key);
    }
    getAllLLMApis() {
      return Array.from(this.data.values());
    }
    deleteLLMApi(key) {
      return this.data.delete(key);
    }
    getActiveLLMApiByService(service) {
      for (const llmApi of this.data.values()) {
        if (llmApi.service === service && llmApi.activate) {
          return llmApi;
        }
      }
      return void 0;
    }
  };
  var llmApiManager = new LLMApiManager();
  function formatExtraDataForDisplay(extraData) {
    if (!extraData || typeof extraData !== "object" || Object.keys(extraData).length === 0) {
      return "";
    }
    const pairs = [];
    for (const [key, value] of Object.entries(extraData)) {
      if (key && key.trim()) {
        const displayValue = String(value || "").length > 10 ? String(value || "").substring(0, 10) + "..." : String(value || "");
        pairs.push(`${key}=${displayValue}`);
      }
    }
    const result = pairs.join(", ");
    return result.length > 50 ? result.substring(0, 47) + "..." : result;
  }

  // node_modules/axios/lib/helpers/bind.js
  function bind(fn, thisArg) {
    return function wrap() {
      return fn.apply(thisArg, arguments);
    };
  }

  // node_modules/axios/lib/utils.js
  var { toString } = Object.prototype;
  var { getPrototypeOf } = Object;
  var { iterator, toStringTag } = Symbol;
  var kindOf = /* @__PURE__ */ ((cache) => (thing) => {
    const str = toString.call(thing);
    return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
  })(/* @__PURE__ */ Object.create(null));
  var kindOfTest = (type) => {
    type = type.toLowerCase();
    return (thing) => kindOf(thing) === type;
  };
  var typeOfTest = (type) => (thing) => typeof thing === type;
  var { isArray } = Array;
  var isUndefined = typeOfTest("undefined");
  function isBuffer(val) {
    return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor) && isFunction(val.constructor.isBuffer) && val.constructor.isBuffer(val);
  }
  var isArrayBuffer = kindOfTest("ArrayBuffer");
  function isArrayBufferView(val) {
    let result;
    if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
      result = ArrayBuffer.isView(val);
    } else {
      result = val && val.buffer && isArrayBuffer(val.buffer);
    }
    return result;
  }
  var isString = typeOfTest("string");
  var isFunction = typeOfTest("function");
  var isNumber = typeOfTest("number");
  var isObject = (thing) => thing !== null && typeof thing === "object";
  var isBoolean = (thing) => thing === true || thing === false;
  var isPlainObject = (val) => {
    if (kindOf(val) !== "object") {
      return false;
    }
    const prototype3 = getPrototypeOf(val);
    return (prototype3 === null || prototype3 === Object.prototype || Object.getPrototypeOf(prototype3) === null) && !(toStringTag in val) && !(iterator in val);
  };
  var isEmptyObject = (val) => {
    if (!isObject(val) || isBuffer(val)) {
      return false;
    }
    try {
      return Object.keys(val).length === 0 && Object.getPrototypeOf(val) === Object.prototype;
    } catch (e) {
      return false;
    }
  };
  var isDate = kindOfTest("Date");
  var isFile = kindOfTest("File");
  var isBlob = kindOfTest("Blob");
  var isFileList = kindOfTest("FileList");
  var isStream = (val) => isObject(val) && isFunction(val.pipe);
  var isFormData = (thing) => {
    let kind;
    return thing && (typeof FormData === "function" && thing instanceof FormData || isFunction(thing.append) && ((kind = kindOf(thing)) === "formdata" || // detect form-data instance
    kind === "object" && isFunction(thing.toString) && thing.toString() === "[object FormData]"));
  };
  var isURLSearchParams = kindOfTest("URLSearchParams");
  var [isReadableStream, isRequest, isResponse, isHeaders] = ["ReadableStream", "Request", "Response", "Headers"].map(kindOfTest);
  var trim = (str) => str.trim ? str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
  function forEach(obj, fn, { allOwnKeys = false } = {}) {
    if (obj === null || typeof obj === "undefined") {
      return;
    }
    let i;
    let l;
    if (typeof obj !== "object") {
      obj = [obj];
    }
    if (isArray(obj)) {
      for (i = 0, l = obj.length; i < l; i++) {
        fn.call(null, obj[i], i, obj);
      }
    } else {
      if (isBuffer(obj)) {
        return;
      }
      const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
      const len = keys.length;
      let key;
      for (i = 0; i < len; i++) {
        key = keys[i];
        fn.call(null, obj[key], key, obj);
      }
    }
  }
  function findKey(obj, key) {
    if (isBuffer(obj)) {
      return null;
    }
    key = key.toLowerCase();
    const keys = Object.keys(obj);
    let i = keys.length;
    let _key;
    while (i-- > 0) {
      _key = keys[i];
      if (key === _key.toLowerCase()) {
        return _key;
      }
    }
    return null;
  }
  var _global = (() => {
    if (typeof globalThis !== "undefined") return globalThis;
    return typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : global;
  })();
  var isContextDefined = (context) => !isUndefined(context) && context !== _global;
  function merge() {
    const { caseless, skipUndefined } = isContextDefined(this) && this || {};
    const result = {};
    const assignValue = (val, key) => {
      const targetKey = caseless && findKey(result, key) || key;
      if (isPlainObject(result[targetKey]) && isPlainObject(val)) {
        result[targetKey] = merge(result[targetKey], val);
      } else if (isPlainObject(val)) {
        result[targetKey] = merge({}, val);
      } else if (isArray(val)) {
        result[targetKey] = val.slice();
      } else if (!skipUndefined || !isUndefined(val)) {
        result[targetKey] = val;
      }
    };
    for (let i = 0, l = arguments.length; i < l; i++) {
      arguments[i] && forEach(arguments[i], assignValue);
    }
    return result;
  }
  var extend = (a, b, thisArg, { allOwnKeys } = {}) => {
    forEach(b, (val, key) => {
      if (thisArg && isFunction(val)) {
        a[key] = bind(val, thisArg);
      } else {
        a[key] = val;
      }
    }, { allOwnKeys });
    return a;
  };
  var stripBOM = (content) => {
    if (content.charCodeAt(0) === 65279) {
      content = content.slice(1);
    }
    return content;
  };
  var inherits = (constructor, superConstructor, props, descriptors2) => {
    constructor.prototype = Object.create(superConstructor.prototype, descriptors2);
    constructor.prototype.constructor = constructor;
    Object.defineProperty(constructor, "super", {
      value: superConstructor.prototype
    });
    props && Object.assign(constructor.prototype, props);
  };
  var toFlatObject = (sourceObj, destObj, filter2, propFilter) => {
    let props;
    let i;
    let prop;
    const merged = {};
    destObj = destObj || {};
    if (sourceObj == null) return destObj;
    do {
      props = Object.getOwnPropertyNames(sourceObj);
      i = props.length;
      while (i-- > 0) {
        prop = props[i];
        if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
          destObj[prop] = sourceObj[prop];
          merged[prop] = true;
        }
      }
      sourceObj = filter2 !== false && getPrototypeOf(sourceObj);
    } while (sourceObj && (!filter2 || filter2(sourceObj, destObj)) && sourceObj !== Object.prototype);
    return destObj;
  };
  var endsWith = (str, searchString, position) => {
    str = String(str);
    if (position === void 0 || position > str.length) {
      position = str.length;
    }
    position -= searchString.length;
    const lastIndex = str.indexOf(searchString, position);
    return lastIndex !== -1 && lastIndex === position;
  };
  var toArray = (thing) => {
    if (!thing) return null;
    if (isArray(thing)) return thing;
    let i = thing.length;
    if (!isNumber(i)) return null;
    const arr = new Array(i);
    while (i-- > 0) {
      arr[i] = thing[i];
    }
    return arr;
  };
  var isTypedArray = /* @__PURE__ */ ((TypedArray) => {
    return (thing) => {
      return TypedArray && thing instanceof TypedArray;
    };
  })(typeof Uint8Array !== "undefined" && getPrototypeOf(Uint8Array));
  var forEachEntry = (obj, fn) => {
    const generator = obj && obj[iterator];
    const _iterator = generator.call(obj);
    let result;
    while ((result = _iterator.next()) && !result.done) {
      const pair = result.value;
      fn.call(obj, pair[0], pair[1]);
    }
  };
  var matchAll = (regExp, str) => {
    let matches;
    const arr = [];
    while ((matches = regExp.exec(str)) !== null) {
      arr.push(matches);
    }
    return arr;
  };
  var isHTMLForm = kindOfTest("HTMLFormElement");
  var toCamelCase = (str) => {
    return str.toLowerCase().replace(
      /[-_\s]([a-z\d])(\w*)/g,
      function replacer(m, p1, p2) {
        return p1.toUpperCase() + p2;
      }
    );
  };
  var hasOwnProperty = (({ hasOwnProperty: hasOwnProperty2 }) => (obj, prop) => hasOwnProperty2.call(obj, prop))(Object.prototype);
  var isRegExp = kindOfTest("RegExp");
  var reduceDescriptors = (obj, reducer) => {
    const descriptors2 = Object.getOwnPropertyDescriptors(obj);
    const reducedDescriptors = {};
    forEach(descriptors2, (descriptor, name) => {
      let ret;
      if ((ret = reducer(descriptor, name, obj)) !== false) {
        reducedDescriptors[name] = ret || descriptor;
      }
    });
    Object.defineProperties(obj, reducedDescriptors);
  };
  var freezeMethods = (obj) => {
    reduceDescriptors(obj, (descriptor, name) => {
      if (isFunction(obj) && ["arguments", "caller", "callee"].indexOf(name) !== -1) {
        return false;
      }
      const value = obj[name];
      if (!isFunction(value)) return;
      descriptor.enumerable = false;
      if ("writable" in descriptor) {
        descriptor.writable = false;
        return;
      }
      if (!descriptor.set) {
        descriptor.set = () => {
          throw Error("Can not rewrite read-only method '" + name + "'");
        };
      }
    });
  };
  var toObjectSet = (arrayOrString, delimiter) => {
    const obj = {};
    const define = (arr) => {
      arr.forEach((value) => {
        obj[value] = true;
      });
    };
    isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));
    return obj;
  };
  var noop = () => {
  };
  var toFiniteNumber = (value, defaultValue) => {
    return value != null && Number.isFinite(value = +value) ? value : defaultValue;
  };
  function isSpecCompliantForm(thing) {
    return !!(thing && isFunction(thing.append) && thing[toStringTag] === "FormData" && thing[iterator]);
  }
  var toJSONObject = (obj) => {
    const stack = new Array(10);
    const visit = (source, i) => {
      if (isObject(source)) {
        if (stack.indexOf(source) >= 0) {
          return;
        }
        if (isBuffer(source)) {
          return source;
        }
        if (!("toJSON" in source)) {
          stack[i] = source;
          const target = isArray(source) ? [] : {};
          forEach(source, (value, key) => {
            const reducedValue = visit(value, i + 1);
            !isUndefined(reducedValue) && (target[key] = reducedValue);
          });
          stack[i] = void 0;
          return target;
        }
      }
      return source;
    };
    return visit(obj, 0);
  };
  var isAsyncFn = kindOfTest("AsyncFunction");
  var isThenable = (thing) => thing && (isObject(thing) || isFunction(thing)) && isFunction(thing.then) && isFunction(thing.catch);
  var _setImmediate = ((setImmediateSupported, postMessageSupported) => {
    if (setImmediateSupported) {
      return setImmediate;
    }
    return postMessageSupported ? ((token, callbacks) => {
      _global.addEventListener("message", ({ source, data }) => {
        if (source === _global && data === token) {
          callbacks.length && callbacks.shift()();
        }
      }, false);
      return (cb) => {
        callbacks.push(cb);
        _global.postMessage(token, "*");
      };
    })(`axios@${Math.random()}`, []) : (cb) => setTimeout(cb);
  })(
    typeof setImmediate === "function",
    isFunction(_global.postMessage)
  );
  var asap = typeof queueMicrotask !== "undefined" ? queueMicrotask.bind(_global) : typeof process !== "undefined" && process.nextTick || _setImmediate;
  var isIterable = (thing) => thing != null && isFunction(thing[iterator]);
  var utils_default = {
    isArray,
    isArrayBuffer,
    isBuffer,
    isFormData,
    isArrayBufferView,
    isString,
    isNumber,
    isBoolean,
    isObject,
    isPlainObject,
    isEmptyObject,
    isReadableStream,
    isRequest,
    isResponse,
    isHeaders,
    isUndefined,
    isDate,
    isFile,
    isBlob,
    isRegExp,
    isFunction,
    isStream,
    isURLSearchParams,
    isTypedArray,
    isFileList,
    forEach,
    merge,
    extend,
    trim,
    stripBOM,
    inherits,
    toFlatObject,
    kindOf,
    kindOfTest,
    endsWith,
    toArray,
    forEachEntry,
    matchAll,
    isHTMLForm,
    hasOwnProperty,
    hasOwnProp: hasOwnProperty,
    // an alias to avoid ESLint no-prototype-builtins detection
    reduceDescriptors,
    freezeMethods,
    toObjectSet,
    toCamelCase,
    noop,
    toFiniteNumber,
    findKey,
    global: _global,
    isContextDefined,
    isSpecCompliantForm,
    toJSONObject,
    isAsyncFn,
    isThenable,
    setImmediate: _setImmediate,
    asap,
    isIterable
  };

  // node_modules/axios/lib/core/AxiosError.js
  function AxiosError(message, code, config2, request, response) {
    Error.call(this);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack;
    }
    this.message = message;
    this.name = "AxiosError";
    code && (this.code = code);
    config2 && (this.config = config2);
    request && (this.request = request);
    if (response) {
      this.response = response;
      this.status = response.status ? response.status : null;
    }
  }
  utils_default.inherits(AxiosError, Error, {
    toJSON: function toJSON() {
      return {
        // Standard
        message: this.message,
        name: this.name,
        // Microsoft
        description: this.description,
        number: this.number,
        // Mozilla
        fileName: this.fileName,
        lineNumber: this.lineNumber,
        columnNumber: this.columnNumber,
        stack: this.stack,
        // Axios
        config: utils_default.toJSONObject(this.config),
        code: this.code,
        status: this.status
      };
    }
  });
  var prototype = AxiosError.prototype;
  var descriptors = {};
  [
    "ERR_BAD_OPTION_VALUE",
    "ERR_BAD_OPTION",
    "ECONNABORTED",
    "ETIMEDOUT",
    "ERR_NETWORK",
    "ERR_FR_TOO_MANY_REDIRECTS",
    "ERR_DEPRECATED",
    "ERR_BAD_RESPONSE",
    "ERR_BAD_REQUEST",
    "ERR_CANCELED",
    "ERR_NOT_SUPPORT",
    "ERR_INVALID_URL"
    // eslint-disable-next-line func-names
  ].forEach((code) => {
    descriptors[code] = { value: code };
  });
  Object.defineProperties(AxiosError, descriptors);
  Object.defineProperty(prototype, "isAxiosError", { value: true });
  AxiosError.from = (error, code, config2, request, response, customProps) => {
    const axiosError = Object.create(prototype);
    utils_default.toFlatObject(error, axiosError, function filter2(obj) {
      return obj !== Error.prototype;
    }, (prop) => {
      return prop !== "isAxiosError";
    });
    const msg = error && error.message ? error.message : "Error";
    const errCode = code == null && error ? error.code : code;
    AxiosError.call(axiosError, msg, errCode, config2, request, response);
    if (error && axiosError.cause == null) {
      Object.defineProperty(axiosError, "cause", { value: error, configurable: true });
    }
    axiosError.name = error && error.name || "Error";
    customProps && Object.assign(axiosError, customProps);
    return axiosError;
  };
  var AxiosError_default = AxiosError;

  // node_modules/axios/lib/helpers/null.js
  var null_default = null;

  // node_modules/axios/lib/helpers/toFormData.js
  function isVisitable(thing) {
    return utils_default.isPlainObject(thing) || utils_default.isArray(thing);
  }
  function removeBrackets(key) {
    return utils_default.endsWith(key, "[]") ? key.slice(0, -2) : key;
  }
  function renderKey(path, key, dots) {
    if (!path) return key;
    return path.concat(key).map(function each(token, i) {
      token = removeBrackets(token);
      return !dots && i ? "[" + token + "]" : token;
    }).join(dots ? "." : "");
  }
  function isFlatArray(arr) {
    return utils_default.isArray(arr) && !arr.some(isVisitable);
  }
  var predicates = utils_default.toFlatObject(utils_default, {}, null, function filter(prop) {
    return /^is[A-Z]/.test(prop);
  });
  function toFormData(obj, formData, options) {
    if (!utils_default.isObject(obj)) {
      throw new TypeError("target must be an object");
    }
    formData = formData || new (null_default || FormData)();
    options = utils_default.toFlatObject(options, {
      metaTokens: true,
      dots: false,
      indexes: false
    }, false, function defined(option, source) {
      return !utils_default.isUndefined(source[option]);
    });
    const metaTokens = options.metaTokens;
    const visitor = options.visitor || defaultVisitor;
    const dots = options.dots;
    const indexes = options.indexes;
    const _Blob = options.Blob || typeof Blob !== "undefined" && Blob;
    const useBlob = _Blob && utils_default.isSpecCompliantForm(formData);
    if (!utils_default.isFunction(visitor)) {
      throw new TypeError("visitor must be a function");
    }
    function convertValue(value) {
      if (value === null) return "";
      if (utils_default.isDate(value)) {
        return value.toISOString();
      }
      if (utils_default.isBoolean(value)) {
        return value.toString();
      }
      if (!useBlob && utils_default.isBlob(value)) {
        throw new AxiosError_default("Blob is not supported. Use a Buffer instead.");
      }
      if (utils_default.isArrayBuffer(value) || utils_default.isTypedArray(value)) {
        return useBlob && typeof Blob === "function" ? new Blob([value]) : Buffer.from(value);
      }
      return value;
    }
    function defaultVisitor(value, key, path) {
      let arr = value;
      if (value && !path && typeof value === "object") {
        if (utils_default.endsWith(key, "{}")) {
          key = metaTokens ? key : key.slice(0, -2);
          value = JSON.stringify(value);
        } else if (utils_default.isArray(value) && isFlatArray(value) || (utils_default.isFileList(value) || utils_default.endsWith(key, "[]")) && (arr = utils_default.toArray(value))) {
          key = removeBrackets(key);
          arr.forEach(function each(el, index) {
            !(utils_default.isUndefined(el) || el === null) && formData.append(
              // eslint-disable-next-line no-nested-ternary
              indexes === true ? renderKey([key], index, dots) : indexes === null ? key : key + "[]",
              convertValue(el)
            );
          });
          return false;
        }
      }
      if (isVisitable(value)) {
        return true;
      }
      formData.append(renderKey(path, key, dots), convertValue(value));
      return false;
    }
    const stack = [];
    const exposedHelpers = Object.assign(predicates, {
      defaultVisitor,
      convertValue,
      isVisitable
    });
    function build(value, path) {
      if (utils_default.isUndefined(value)) return;
      if (stack.indexOf(value) !== -1) {
        throw Error("Circular reference detected in " + path.join("."));
      }
      stack.push(value);
      utils_default.forEach(value, function each(el, key) {
        const result = !(utils_default.isUndefined(el) || el === null) && visitor.call(
          formData,
          el,
          utils_default.isString(key) ? key.trim() : key,
          path,
          exposedHelpers
        );
        if (result === true) {
          build(el, path ? path.concat(key) : [key]);
        }
      });
      stack.pop();
    }
    if (!utils_default.isObject(obj)) {
      throw new TypeError("data must be an object");
    }
    build(obj);
    return formData;
  }
  var toFormData_default = toFormData;

  // node_modules/axios/lib/helpers/AxiosURLSearchParams.js
  function encode(str) {
    const charMap = {
      "!": "%21",
      "'": "%27",
      "(": "%28",
      ")": "%29",
      "~": "%7E",
      "%20": "+",
      "%00": "\0"
    };
    return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, function replacer(match) {
      return charMap[match];
    });
  }
  function AxiosURLSearchParams(params, options) {
    this._pairs = [];
    params && toFormData_default(params, this, options);
  }
  var prototype2 = AxiosURLSearchParams.prototype;
  prototype2.append = function append(name, value) {
    this._pairs.push([name, value]);
  };
  prototype2.toString = function toString2(encoder) {
    const _encode = encoder ? function(value) {
      return encoder.call(this, value, encode);
    } : encode;
    return this._pairs.map(function each(pair) {
      return _encode(pair[0]) + "=" + _encode(pair[1]);
    }, "").join("&");
  };
  var AxiosURLSearchParams_default = AxiosURLSearchParams;

  // node_modules/axios/lib/helpers/buildURL.js
  function encode2(val) {
    return encodeURIComponent(val).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+");
  }
  function buildURL(url, params, options) {
    if (!params) {
      return url;
    }
    const _encode = options && options.encode || encode2;
    if (utils_default.isFunction(options)) {
      options = {
        serialize: options
      };
    }
    const serializeFn = options && options.serialize;
    let serializedParams;
    if (serializeFn) {
      serializedParams = serializeFn(params, options);
    } else {
      serializedParams = utils_default.isURLSearchParams(params) ? params.toString() : new AxiosURLSearchParams_default(params, options).toString(_encode);
    }
    if (serializedParams) {
      const hashmarkIndex = url.indexOf("#");
      if (hashmarkIndex !== -1) {
        url = url.slice(0, hashmarkIndex);
      }
      url += (url.indexOf("?") === -1 ? "?" : "&") + serializedParams;
    }
    return url;
  }

  // node_modules/axios/lib/core/InterceptorManager.js
  var InterceptorManager = class {
    constructor() {
      this.handlers = [];
    }
    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    use(fulfilled, rejected, options) {
      this.handlers.push({
        fulfilled,
        rejected,
        synchronous: options ? options.synchronous : false,
        runWhen: options ? options.runWhen : null
      });
      return this.handlers.length - 1;
    }
    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     *
     * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
     */
    eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    }
    /**
     * Clear all interceptors from the stack
     *
     * @returns {void}
     */
    clear() {
      if (this.handlers) {
        this.handlers = [];
      }
    }
    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     *
     * @returns {void}
     */
    forEach(fn) {
      utils_default.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    }
  };
  var InterceptorManager_default = InterceptorManager;

  // node_modules/axios/lib/defaults/transitional.js
  var transitional_default = {
    silentJSONParsing: true,
    forcedJSONParsing: true,
    clarifyTimeoutError: false
  };

  // node_modules/axios/lib/platform/browser/classes/URLSearchParams.js
  var URLSearchParams_default = typeof URLSearchParams !== "undefined" ? URLSearchParams : AxiosURLSearchParams_default;

  // node_modules/axios/lib/platform/browser/classes/FormData.js
  var FormData_default = typeof FormData !== "undefined" ? FormData : null;

  // node_modules/axios/lib/platform/browser/classes/Blob.js
  var Blob_default = typeof Blob !== "undefined" ? Blob : null;

  // node_modules/axios/lib/platform/browser/index.js
  var browser_default = {
    isBrowser: true,
    classes: {
      URLSearchParams: URLSearchParams_default,
      FormData: FormData_default,
      Blob: Blob_default
    },
    protocols: ["http", "https", "file", "blob", "url", "data"]
  };

  // node_modules/axios/lib/platform/common/utils.js
  var utils_exports = {};
  __export(utils_exports, {
    hasBrowserEnv: () => hasBrowserEnv,
    hasStandardBrowserEnv: () => hasStandardBrowserEnv,
    hasStandardBrowserWebWorkerEnv: () => hasStandardBrowserWebWorkerEnv,
    navigator: () => _navigator,
    origin: () => origin
  });
  var hasBrowserEnv = typeof window !== "undefined" && typeof document !== "undefined";
  var _navigator = typeof navigator === "object" && navigator || void 0;
  var hasStandardBrowserEnv = hasBrowserEnv && (!_navigator || ["ReactNative", "NativeScript", "NS"].indexOf(_navigator.product) < 0);
  var hasStandardBrowserWebWorkerEnv = (() => {
    return typeof WorkerGlobalScope !== "undefined" && // eslint-disable-next-line no-undef
    self instanceof WorkerGlobalScope && typeof self.importScripts === "function";
  })();
  var origin = hasBrowserEnv && window.location.href || "http://localhost";

  // node_modules/axios/lib/platform/index.js
  var platform_default = {
    ...utils_exports,
    ...browser_default
  };

  // node_modules/axios/lib/helpers/toURLEncodedForm.js
  function toURLEncodedForm(data, options) {
    return toFormData_default(data, new platform_default.classes.URLSearchParams(), {
      visitor: function(value, key, path, helpers) {
        if (platform_default.isNode && utils_default.isBuffer(value)) {
          this.append(key, value.toString("base64"));
          return false;
        }
        return helpers.defaultVisitor.apply(this, arguments);
      },
      ...options
    });
  }

  // node_modules/axios/lib/helpers/formDataToJSON.js
  function parsePropPath(name) {
    return utils_default.matchAll(/\w+|\[(\w*)]/g, name).map((match) => {
      return match[0] === "[]" ? "" : match[1] || match[0];
    });
  }
  function arrayToObject(arr) {
    const obj = {};
    const keys = Object.keys(arr);
    let i;
    const len = keys.length;
    let key;
    for (i = 0; i < len; i++) {
      key = keys[i];
      obj[key] = arr[key];
    }
    return obj;
  }
  function formDataToJSON(formData) {
    function buildPath(path, value, target, index) {
      let name = path[index++];
      if (name === "__proto__") return true;
      const isNumericKey = Number.isFinite(+name);
      const isLast = index >= path.length;
      name = !name && utils_default.isArray(target) ? target.length : name;
      if (isLast) {
        if (utils_default.hasOwnProp(target, name)) {
          target[name] = [target[name], value];
        } else {
          target[name] = value;
        }
        return !isNumericKey;
      }
      if (!target[name] || !utils_default.isObject(target[name])) {
        target[name] = [];
      }
      const result = buildPath(path, value, target[name], index);
      if (result && utils_default.isArray(target[name])) {
        target[name] = arrayToObject(target[name]);
      }
      return !isNumericKey;
    }
    if (utils_default.isFormData(formData) && utils_default.isFunction(formData.entries)) {
      const obj = {};
      utils_default.forEachEntry(formData, (name, value) => {
        buildPath(parsePropPath(name), value, obj, 0);
      });
      return obj;
    }
    return null;
  }
  var formDataToJSON_default = formDataToJSON;

  // node_modules/axios/lib/defaults/index.js
  function stringifySafely(rawValue, parser, encoder) {
    if (utils_default.isString(rawValue)) {
      try {
        (parser || JSON.parse)(rawValue);
        return utils_default.trim(rawValue);
      } catch (e) {
        if (e.name !== "SyntaxError") {
          throw e;
        }
      }
    }
    return (encoder || JSON.stringify)(rawValue);
  }
  var defaults = {
    transitional: transitional_default,
    adapter: ["xhr", "http", "fetch"],
    transformRequest: [function transformRequest(data, headers) {
      const contentType = headers.getContentType() || "";
      const hasJSONContentType = contentType.indexOf("application/json") > -1;
      const isObjectPayload = utils_default.isObject(data);
      if (isObjectPayload && utils_default.isHTMLForm(data)) {
        data = new FormData(data);
      }
      const isFormData2 = utils_default.isFormData(data);
      if (isFormData2) {
        return hasJSONContentType ? JSON.stringify(formDataToJSON_default(data)) : data;
      }
      if (utils_default.isArrayBuffer(data) || utils_default.isBuffer(data) || utils_default.isStream(data) || utils_default.isFile(data) || utils_default.isBlob(data) || utils_default.isReadableStream(data)) {
        return data;
      }
      if (utils_default.isArrayBufferView(data)) {
        return data.buffer;
      }
      if (utils_default.isURLSearchParams(data)) {
        headers.setContentType("application/x-www-form-urlencoded;charset=utf-8", false);
        return data.toString();
      }
      let isFileList2;
      if (isObjectPayload) {
        if (contentType.indexOf("application/x-www-form-urlencoded") > -1) {
          return toURLEncodedForm(data, this.formSerializer).toString();
        }
        if ((isFileList2 = utils_default.isFileList(data)) || contentType.indexOf("multipart/form-data") > -1) {
          const _FormData = this.env && this.env.FormData;
          return toFormData_default(
            isFileList2 ? { "files[]": data } : data,
            _FormData && new _FormData(),
            this.formSerializer
          );
        }
      }
      if (isObjectPayload || hasJSONContentType) {
        headers.setContentType("application/json", false);
        return stringifySafely(data);
      }
      return data;
    }],
    transformResponse: [function transformResponse(data) {
      const transitional2 = this.transitional || defaults.transitional;
      const forcedJSONParsing = transitional2 && transitional2.forcedJSONParsing;
      const JSONRequested = this.responseType === "json";
      if (utils_default.isResponse(data) || utils_default.isReadableStream(data)) {
        return data;
      }
      if (data && utils_default.isString(data) && (forcedJSONParsing && !this.responseType || JSONRequested)) {
        const silentJSONParsing = transitional2 && transitional2.silentJSONParsing;
        const strictJSONParsing = !silentJSONParsing && JSONRequested;
        try {
          return JSON.parse(data, this.parseReviver);
        } catch (e) {
          if (strictJSONParsing) {
            if (e.name === "SyntaxError") {
              throw AxiosError_default.from(e, AxiosError_default.ERR_BAD_RESPONSE, this, null, this.response);
            }
            throw e;
          }
        }
      }
      return data;
    }],
    /**
     * A timeout in milliseconds to abort a request. If set to 0 (default) a
     * timeout is not created.
     */
    timeout: 0,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
    maxContentLength: -1,
    maxBodyLength: -1,
    env: {
      FormData: platform_default.classes.FormData,
      Blob: platform_default.classes.Blob
    },
    validateStatus: function validateStatus(status) {
      return status >= 200 && status < 300;
    },
    headers: {
      common: {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": void 0
      }
    }
  };
  utils_default.forEach(["delete", "get", "head", "post", "put", "patch"], (method) => {
    defaults.headers[method] = {};
  });
  var defaults_default = defaults;

  // node_modules/axios/lib/helpers/parseHeaders.js
  var ignoreDuplicateOf = utils_default.toObjectSet([
    "age",
    "authorization",
    "content-length",
    "content-type",
    "etag",
    "expires",
    "from",
    "host",
    "if-modified-since",
    "if-unmodified-since",
    "last-modified",
    "location",
    "max-forwards",
    "proxy-authorization",
    "referer",
    "retry-after",
    "user-agent"
  ]);
  var parseHeaders_default = (rawHeaders) => {
    const parsed = {};
    let key;
    let val;
    let i;
    rawHeaders && rawHeaders.split("\n").forEach(function parser(line) {
      i = line.indexOf(":");
      key = line.substring(0, i).trim().toLowerCase();
      val = line.substring(i + 1).trim();
      if (!key || parsed[key] && ignoreDuplicateOf[key]) {
        return;
      }
      if (key === "set-cookie") {
        if (parsed[key]) {
          parsed[key].push(val);
        } else {
          parsed[key] = [val];
        }
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ", " + val : val;
      }
    });
    return parsed;
  };

  // node_modules/axios/lib/core/AxiosHeaders.js
  var $internals = Symbol("internals");
  function normalizeHeader(header) {
    return header && String(header).trim().toLowerCase();
  }
  function normalizeValue(value) {
    if (value === false || value == null) {
      return value;
    }
    return utils_default.isArray(value) ? value.map(normalizeValue) : String(value);
  }
  function parseTokens(str) {
    const tokens = /* @__PURE__ */ Object.create(null);
    const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
    let match;
    while (match = tokensRE.exec(str)) {
      tokens[match[1]] = match[2];
    }
    return tokens;
  }
  var isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());
  function matchHeaderValue(context, value, header, filter2, isHeaderNameFilter) {
    if (utils_default.isFunction(filter2)) {
      return filter2.call(this, value, header);
    }
    if (isHeaderNameFilter) {
      value = header;
    }
    if (!utils_default.isString(value)) return;
    if (utils_default.isString(filter2)) {
      return value.indexOf(filter2) !== -1;
    }
    if (utils_default.isRegExp(filter2)) {
      return filter2.test(value);
    }
  }
  function formatHeader(header) {
    return header.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
      return char.toUpperCase() + str;
    });
  }
  function buildAccessors(obj, header) {
    const accessorName = utils_default.toCamelCase(" " + header);
    ["get", "set", "has"].forEach((methodName) => {
      Object.defineProperty(obj, methodName + accessorName, {
        value: function(arg1, arg2, arg3) {
          return this[methodName].call(this, header, arg1, arg2, arg3);
        },
        configurable: true
      });
    });
  }
  var AxiosHeaders = class {
    constructor(headers) {
      headers && this.set(headers);
    }
    set(header, valueOrRewrite, rewrite) {
      const self2 = this;
      function setHeader(_value, _header, _rewrite) {
        const lHeader = normalizeHeader(_header);
        if (!lHeader) {
          throw new Error("header name must be a non-empty string");
        }
        const key = utils_default.findKey(self2, lHeader);
        if (!key || self2[key] === void 0 || _rewrite === true || _rewrite === void 0 && self2[key] !== false) {
          self2[key || _header] = normalizeValue(_value);
        }
      }
      const setHeaders = (headers, _rewrite) => utils_default.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));
      if (utils_default.isPlainObject(header) || header instanceof this.constructor) {
        setHeaders(header, valueOrRewrite);
      } else if (utils_default.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
        setHeaders(parseHeaders_default(header), valueOrRewrite);
      } else if (utils_default.isObject(header) && utils_default.isIterable(header)) {
        let obj = {}, dest, key;
        for (const entry of header) {
          if (!utils_default.isArray(entry)) {
            throw TypeError("Object iterator must return a key-value pair");
          }
          obj[key = entry[0]] = (dest = obj[key]) ? utils_default.isArray(dest) ? [...dest, entry[1]] : [dest, entry[1]] : entry[1];
        }
        setHeaders(obj, valueOrRewrite);
      } else {
        header != null && setHeader(valueOrRewrite, header, rewrite);
      }
      return this;
    }
    get(header, parser) {
      header = normalizeHeader(header);
      if (header) {
        const key = utils_default.findKey(this, header);
        if (key) {
          const value = this[key];
          if (!parser) {
            return value;
          }
          if (parser === true) {
            return parseTokens(value);
          }
          if (utils_default.isFunction(parser)) {
            return parser.call(this, value, key);
          }
          if (utils_default.isRegExp(parser)) {
            return parser.exec(value);
          }
          throw new TypeError("parser must be boolean|regexp|function");
        }
      }
    }
    has(header, matcher) {
      header = normalizeHeader(header);
      if (header) {
        const key = utils_default.findKey(this, header);
        return !!(key && this[key] !== void 0 && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
      }
      return false;
    }
    delete(header, matcher) {
      const self2 = this;
      let deleted = false;
      function deleteHeader(_header) {
        _header = normalizeHeader(_header);
        if (_header) {
          const key = utils_default.findKey(self2, _header);
          if (key && (!matcher || matchHeaderValue(self2, self2[key], key, matcher))) {
            delete self2[key];
            deleted = true;
          }
        }
      }
      if (utils_default.isArray(header)) {
        header.forEach(deleteHeader);
      } else {
        deleteHeader(header);
      }
      return deleted;
    }
    clear(matcher) {
      const keys = Object.keys(this);
      let i = keys.length;
      let deleted = false;
      while (i--) {
        const key = keys[i];
        if (!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
          delete this[key];
          deleted = true;
        }
      }
      return deleted;
    }
    normalize(format) {
      const self2 = this;
      const headers = {};
      utils_default.forEach(this, (value, header) => {
        const key = utils_default.findKey(headers, header);
        if (key) {
          self2[key] = normalizeValue(value);
          delete self2[header];
          return;
        }
        const normalized = format ? formatHeader(header) : String(header).trim();
        if (normalized !== header) {
          delete self2[header];
        }
        self2[normalized] = normalizeValue(value);
        headers[normalized] = true;
      });
      return this;
    }
    concat(...targets) {
      return this.constructor.concat(this, ...targets);
    }
    toJSON(asStrings) {
      const obj = /* @__PURE__ */ Object.create(null);
      utils_default.forEach(this, (value, header) => {
        value != null && value !== false && (obj[header] = asStrings && utils_default.isArray(value) ? value.join(", ") : value);
      });
      return obj;
    }
    [Symbol.iterator]() {
      return Object.entries(this.toJSON())[Symbol.iterator]();
    }
    toString() {
      return Object.entries(this.toJSON()).map(([header, value]) => header + ": " + value).join("\n");
    }
    getSetCookie() {
      return this.get("set-cookie") || [];
    }
    get [Symbol.toStringTag]() {
      return "AxiosHeaders";
    }
    static from(thing) {
      return thing instanceof this ? thing : new this(thing);
    }
    static concat(first, ...targets) {
      const computed = new this(first);
      targets.forEach((target) => computed.set(target));
      return computed;
    }
    static accessor(header) {
      const internals = this[$internals] = this[$internals] = {
        accessors: {}
      };
      const accessors = internals.accessors;
      const prototype3 = this.prototype;
      function defineAccessor(_header) {
        const lHeader = normalizeHeader(_header);
        if (!accessors[lHeader]) {
          buildAccessors(prototype3, _header);
          accessors[lHeader] = true;
        }
      }
      utils_default.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);
      return this;
    }
  };
  AxiosHeaders.accessor(["Content-Type", "Content-Length", "Accept", "Accept-Encoding", "User-Agent", "Authorization"]);
  utils_default.reduceDescriptors(AxiosHeaders.prototype, ({ value }, key) => {
    let mapped = key[0].toUpperCase() + key.slice(1);
    return {
      get: () => value,
      set(headerValue) {
        this[mapped] = headerValue;
      }
    };
  });
  utils_default.freezeMethods(AxiosHeaders);
  var AxiosHeaders_default = AxiosHeaders;

  // node_modules/axios/lib/core/transformData.js
  function transformData(fns, response) {
    const config2 = this || defaults_default;
    const context = response || config2;
    const headers = AxiosHeaders_default.from(context.headers);
    let data = context.data;
    utils_default.forEach(fns, function transform(fn) {
      data = fn.call(config2, data, headers.normalize(), response ? response.status : void 0);
    });
    headers.normalize();
    return data;
  }

  // node_modules/axios/lib/cancel/isCancel.js
  function isCancel(value) {
    return !!(value && value.__CANCEL__);
  }

  // node_modules/axios/lib/cancel/CanceledError.js
  function CanceledError(message, config2, request) {
    AxiosError_default.call(this, message == null ? "canceled" : message, AxiosError_default.ERR_CANCELED, config2, request);
    this.name = "CanceledError";
  }
  utils_default.inherits(CanceledError, AxiosError_default, {
    __CANCEL__: true
  });
  var CanceledError_default = CanceledError;

  // node_modules/axios/lib/core/settle.js
  function settle(resolve, reject, response) {
    const validateStatus2 = response.config.validateStatus;
    if (!response.status || !validateStatus2 || validateStatus2(response.status)) {
      resolve(response);
    } else {
      reject(new AxiosError_default(
        "Request failed with status code " + response.status,
        [AxiosError_default.ERR_BAD_REQUEST, AxiosError_default.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
        response.config,
        response.request,
        response
      ));
    }
  }

  // node_modules/axios/lib/helpers/parseProtocol.js
  function parseProtocol(url) {
    const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
    return match && match[1] || "";
  }

  // node_modules/axios/lib/helpers/speedometer.js
  function speedometer(samplesCount, min) {
    samplesCount = samplesCount || 10;
    const bytes = new Array(samplesCount);
    const timestamps = new Array(samplesCount);
    let head = 0;
    let tail = 0;
    let firstSampleTS;
    min = min !== void 0 ? min : 1e3;
    return function push(chunkLength) {
      const now = Date.now();
      const startedAt = timestamps[tail];
      if (!firstSampleTS) {
        firstSampleTS = now;
      }
      bytes[head] = chunkLength;
      timestamps[head] = now;
      let i = tail;
      let bytesCount = 0;
      while (i !== head) {
        bytesCount += bytes[i++];
        i = i % samplesCount;
      }
      head = (head + 1) % samplesCount;
      if (head === tail) {
        tail = (tail + 1) % samplesCount;
      }
      if (now - firstSampleTS < min) {
        return;
      }
      const passed = startedAt && now - startedAt;
      return passed ? Math.round(bytesCount * 1e3 / passed) : void 0;
    };
  }
  var speedometer_default = speedometer;

  // node_modules/axios/lib/helpers/throttle.js
  function throttle(fn, freq) {
    let timestamp = 0;
    let threshold = 1e3 / freq;
    let lastArgs;
    let timer;
    const invoke = (args, now = Date.now()) => {
      timestamp = now;
      lastArgs = null;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      fn(...args);
    };
    const throttled = (...args) => {
      const now = Date.now();
      const passed = now - timestamp;
      if (passed >= threshold) {
        invoke(args, now);
      } else {
        lastArgs = args;
        if (!timer) {
          timer = setTimeout(() => {
            timer = null;
            invoke(lastArgs);
          }, threshold - passed);
        }
      }
    };
    const flush = () => lastArgs && invoke(lastArgs);
    return [throttled, flush];
  }
  var throttle_default = throttle;

  // node_modules/axios/lib/helpers/progressEventReducer.js
  var progressEventReducer = (listener, isDownloadStream, freq = 3) => {
    let bytesNotified = 0;
    const _speedometer = speedometer_default(50, 250);
    return throttle_default((e) => {
      const loaded = e.loaded;
      const total = e.lengthComputable ? e.total : void 0;
      const progressBytes = loaded - bytesNotified;
      const rate = _speedometer(progressBytes);
      const inRange = loaded <= total;
      bytesNotified = loaded;
      const data = {
        loaded,
        total,
        progress: total ? loaded / total : void 0,
        bytes: progressBytes,
        rate: rate ? rate : void 0,
        estimated: rate && total && inRange ? (total - loaded) / rate : void 0,
        event: e,
        lengthComputable: total != null,
        [isDownloadStream ? "download" : "upload"]: true
      };
      listener(data);
    }, freq);
  };
  var progressEventDecorator = (total, throttled) => {
    const lengthComputable = total != null;
    return [(loaded) => throttled[0]({
      lengthComputable,
      total,
      loaded
    }), throttled[1]];
  };
  var asyncDecorator = (fn) => (...args) => utils_default.asap(() => fn(...args));

  // node_modules/axios/lib/helpers/isURLSameOrigin.js
  var isURLSameOrigin_default = platform_default.hasStandardBrowserEnv ? /* @__PURE__ */ ((origin2, isMSIE) => (url) => {
    url = new URL(url, platform_default.origin);
    return origin2.protocol === url.protocol && origin2.host === url.host && (isMSIE || origin2.port === url.port);
  })(
    new URL(platform_default.origin),
    platform_default.navigator && /(msie|trident)/i.test(platform_default.navigator.userAgent)
  ) : () => true;

  // node_modules/axios/lib/helpers/cookies.js
  var cookies_default = platform_default.hasStandardBrowserEnv ? (
    // Standard browser envs support document.cookie
    {
      write(name, value, expires, path, domain, secure) {
        const cookie = [name + "=" + encodeURIComponent(value)];
        utils_default.isNumber(expires) && cookie.push("expires=" + new Date(expires).toGMTString());
        utils_default.isString(path) && cookie.push("path=" + path);
        utils_default.isString(domain) && cookie.push("domain=" + domain);
        secure === true && cookie.push("secure");
        document.cookie = cookie.join("; ");
      },
      read(name) {
        const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
        return match ? decodeURIComponent(match[3]) : null;
      },
      remove(name) {
        this.write(name, "", Date.now() - 864e5);
      }
    }
  ) : (
    // Non-standard browser env (web workers, react-native) lack needed support.
    {
      write() {
      },
      read() {
        return null;
      },
      remove() {
      }
    }
  );

  // node_modules/axios/lib/helpers/isAbsoluteURL.js
  function isAbsoluteURL(url) {
    return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
  }

  // node_modules/axios/lib/helpers/combineURLs.js
  function combineURLs(baseURL, relativeURL) {
    return relativeURL ? baseURL.replace(/\/?\/$/, "") + "/" + relativeURL.replace(/^\/+/, "") : baseURL;
  }

  // node_modules/axios/lib/core/buildFullPath.js
  function buildFullPath(baseURL, requestedURL, allowAbsoluteUrls) {
    let isRelativeUrl = !isAbsoluteURL(requestedURL);
    if (baseURL && (isRelativeUrl || allowAbsoluteUrls == false)) {
      return combineURLs(baseURL, requestedURL);
    }
    return requestedURL;
  }

  // node_modules/axios/lib/core/mergeConfig.js
  var headersToObject = (thing) => thing instanceof AxiosHeaders_default ? { ...thing } : thing;
  function mergeConfig(config1, config2) {
    config2 = config2 || {};
    const config3 = {};
    function getMergedValue(target, source, prop, caseless) {
      if (utils_default.isPlainObject(target) && utils_default.isPlainObject(source)) {
        return utils_default.merge.call({ caseless }, target, source);
      } else if (utils_default.isPlainObject(source)) {
        return utils_default.merge({}, source);
      } else if (utils_default.isArray(source)) {
        return source.slice();
      }
      return source;
    }
    function mergeDeepProperties(a, b, prop, caseless) {
      if (!utils_default.isUndefined(b)) {
        return getMergedValue(a, b, prop, caseless);
      } else if (!utils_default.isUndefined(a)) {
        return getMergedValue(void 0, a, prop, caseless);
      }
    }
    function valueFromConfig2(a, b) {
      if (!utils_default.isUndefined(b)) {
        return getMergedValue(void 0, b);
      }
    }
    function defaultToConfig2(a, b) {
      if (!utils_default.isUndefined(b)) {
        return getMergedValue(void 0, b);
      } else if (!utils_default.isUndefined(a)) {
        return getMergedValue(void 0, a);
      }
    }
    function mergeDirectKeys(a, b, prop) {
      if (prop in config2) {
        return getMergedValue(a, b);
      } else if (prop in config1) {
        return getMergedValue(void 0, a);
      }
    }
    const mergeMap = {
      url: valueFromConfig2,
      method: valueFromConfig2,
      data: valueFromConfig2,
      baseURL: defaultToConfig2,
      transformRequest: defaultToConfig2,
      transformResponse: defaultToConfig2,
      paramsSerializer: defaultToConfig2,
      timeout: defaultToConfig2,
      timeoutMessage: defaultToConfig2,
      withCredentials: defaultToConfig2,
      withXSRFToken: defaultToConfig2,
      adapter: defaultToConfig2,
      responseType: defaultToConfig2,
      xsrfCookieName: defaultToConfig2,
      xsrfHeaderName: defaultToConfig2,
      onUploadProgress: defaultToConfig2,
      onDownloadProgress: defaultToConfig2,
      decompress: defaultToConfig2,
      maxContentLength: defaultToConfig2,
      maxBodyLength: defaultToConfig2,
      beforeRedirect: defaultToConfig2,
      transport: defaultToConfig2,
      httpAgent: defaultToConfig2,
      httpsAgent: defaultToConfig2,
      cancelToken: defaultToConfig2,
      socketPath: defaultToConfig2,
      responseEncoding: defaultToConfig2,
      validateStatus: mergeDirectKeys,
      headers: (a, b, prop) => mergeDeepProperties(headersToObject(a), headersToObject(b), prop, true)
    };
    utils_default.forEach(Object.keys({ ...config1, ...config2 }), function computeConfigValue(prop) {
      const merge2 = mergeMap[prop] || mergeDeepProperties;
      const configValue = merge2(config1[prop], config2[prop], prop);
      utils_default.isUndefined(configValue) && merge2 !== mergeDirectKeys || (config3[prop] = configValue);
    });
    return config3;
  }

  // node_modules/axios/lib/helpers/resolveConfig.js
  var resolveConfig_default = (config2) => {
    const newConfig = mergeConfig({}, config2);
    let { data, withXSRFToken, xsrfHeaderName, xsrfCookieName, headers, auth } = newConfig;
    newConfig.headers = headers = AxiosHeaders_default.from(headers);
    newConfig.url = buildURL(buildFullPath(newConfig.baseURL, newConfig.url, newConfig.allowAbsoluteUrls), config2.params, config2.paramsSerializer);
    if (auth) {
      headers.set(
        "Authorization",
        "Basic " + btoa((auth.username || "") + ":" + (auth.password ? unescape(encodeURIComponent(auth.password)) : ""))
      );
    }
    if (utils_default.isFormData(data)) {
      if (platform_default.hasStandardBrowserEnv || platform_default.hasStandardBrowserWebWorkerEnv) {
        headers.setContentType(void 0);
      } else if (utils_default.isFunction(data.getHeaders)) {
        const formHeaders = data.getHeaders();
        const allowedHeaders = ["content-type", "content-length"];
        Object.entries(formHeaders).forEach(([key, val]) => {
          if (allowedHeaders.includes(key.toLowerCase())) {
            headers.set(key, val);
          }
        });
      }
    }
    if (platform_default.hasStandardBrowserEnv) {
      withXSRFToken && utils_default.isFunction(withXSRFToken) && (withXSRFToken = withXSRFToken(newConfig));
      if (withXSRFToken || withXSRFToken !== false && isURLSameOrigin_default(newConfig.url)) {
        const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies_default.read(xsrfCookieName);
        if (xsrfValue) {
          headers.set(xsrfHeaderName, xsrfValue);
        }
      }
    }
    return newConfig;
  };

  // node_modules/axios/lib/adapters/xhr.js
  var isXHRAdapterSupported = typeof XMLHttpRequest !== "undefined";
  var xhr_default = isXHRAdapterSupported && function(config2) {
    return new Promise(function dispatchXhrRequest(resolve, reject) {
      const _config = resolveConfig_default(config2);
      let requestData = _config.data;
      const requestHeaders = AxiosHeaders_default.from(_config.headers).normalize();
      let { responseType, onUploadProgress, onDownloadProgress } = _config;
      let onCanceled;
      let uploadThrottled, downloadThrottled;
      let flushUpload, flushDownload;
      function done() {
        flushUpload && flushUpload();
        flushDownload && flushDownload();
        _config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);
        _config.signal && _config.signal.removeEventListener("abort", onCanceled);
      }
      let request = new XMLHttpRequest();
      request.open(_config.method.toUpperCase(), _config.url, true);
      request.timeout = _config.timeout;
      function onloadend() {
        if (!request) {
          return;
        }
        const responseHeaders = AxiosHeaders_default.from(
          "getAllResponseHeaders" in request && request.getAllResponseHeaders()
        );
        const responseData = !responseType || responseType === "text" || responseType === "json" ? request.responseText : request.response;
        const response = {
          data: responseData,
          status: request.status,
          statusText: request.statusText,
          headers: responseHeaders,
          config: config2,
          request
        };
        settle(function _resolve(value) {
          resolve(value);
          done();
        }, function _reject(err) {
          reject(err);
          done();
        }, response);
        request = null;
      }
      if ("onloadend" in request) {
        request.onloadend = onloadend;
      } else {
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf("file:") === 0)) {
            return;
          }
          setTimeout(onloadend);
        };
      }
      request.onabort = function handleAbort() {
        if (!request) {
          return;
        }
        reject(new AxiosError_default("Request aborted", AxiosError_default.ECONNABORTED, config2, request));
        request = null;
      };
      request.onerror = function handleError(event) {
        const msg = event && event.message ? event.message : "Network Error";
        const err = new AxiosError_default(msg, AxiosError_default.ERR_NETWORK, config2, request);
        err.event = event || null;
        reject(err);
        request = null;
      };
      request.ontimeout = function handleTimeout() {
        let timeoutErrorMessage = _config.timeout ? "timeout of " + _config.timeout + "ms exceeded" : "timeout exceeded";
        const transitional2 = _config.transitional || transitional_default;
        if (_config.timeoutErrorMessage) {
          timeoutErrorMessage = _config.timeoutErrorMessage;
        }
        reject(new AxiosError_default(
          timeoutErrorMessage,
          transitional2.clarifyTimeoutError ? AxiosError_default.ETIMEDOUT : AxiosError_default.ECONNABORTED,
          config2,
          request
        ));
        request = null;
      };
      requestData === void 0 && requestHeaders.setContentType(null);
      if ("setRequestHeader" in request) {
        utils_default.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
          request.setRequestHeader(key, val);
        });
      }
      if (!utils_default.isUndefined(_config.withCredentials)) {
        request.withCredentials = !!_config.withCredentials;
      }
      if (responseType && responseType !== "json") {
        request.responseType = _config.responseType;
      }
      if (onDownloadProgress) {
        [downloadThrottled, flushDownload] = progressEventReducer(onDownloadProgress, true);
        request.addEventListener("progress", downloadThrottled);
      }
      if (onUploadProgress && request.upload) {
        [uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress);
        request.upload.addEventListener("progress", uploadThrottled);
        request.upload.addEventListener("loadend", flushUpload);
      }
      if (_config.cancelToken || _config.signal) {
        onCanceled = (cancel) => {
          if (!request) {
            return;
          }
          reject(!cancel || cancel.type ? new CanceledError_default(null, config2, request) : cancel);
          request.abort();
          request = null;
        };
        _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
        if (_config.signal) {
          _config.signal.aborted ? onCanceled() : _config.signal.addEventListener("abort", onCanceled);
        }
      }
      const protocol = parseProtocol(_config.url);
      if (protocol && platform_default.protocols.indexOf(protocol) === -1) {
        reject(new AxiosError_default("Unsupported protocol " + protocol + ":", AxiosError_default.ERR_BAD_REQUEST, config2));
        return;
      }
      request.send(requestData || null);
    });
  };

  // node_modules/axios/lib/helpers/composeSignals.js
  var composeSignals = (signals, timeout) => {
    const { length } = signals = signals ? signals.filter(Boolean) : [];
    if (timeout || length) {
      let controller = new AbortController();
      let aborted;
      const onabort = function(reason) {
        if (!aborted) {
          aborted = true;
          unsubscribe();
          const err = reason instanceof Error ? reason : this.reason;
          controller.abort(err instanceof AxiosError_default ? err : new CanceledError_default(err instanceof Error ? err.message : err));
        }
      };
      let timer = timeout && setTimeout(() => {
        timer = null;
        onabort(new AxiosError_default(`timeout ${timeout} of ms exceeded`, AxiosError_default.ETIMEDOUT));
      }, timeout);
      const unsubscribe = () => {
        if (signals) {
          timer && clearTimeout(timer);
          timer = null;
          signals.forEach((signal2) => {
            signal2.unsubscribe ? signal2.unsubscribe(onabort) : signal2.removeEventListener("abort", onabort);
          });
          signals = null;
        }
      };
      signals.forEach((signal2) => signal2.addEventListener("abort", onabort));
      const { signal } = controller;
      signal.unsubscribe = () => utils_default.asap(unsubscribe);
      return signal;
    }
  };
  var composeSignals_default = composeSignals;

  // node_modules/axios/lib/helpers/trackStream.js
  var streamChunk = function* (chunk, chunkSize) {
    let len = chunk.byteLength;
    if (!chunkSize || len < chunkSize) {
      yield chunk;
      return;
    }
    let pos = 0;
    let end;
    while (pos < len) {
      end = pos + chunkSize;
      yield chunk.slice(pos, end);
      pos = end;
    }
  };
  var readBytes = async function* (iterable, chunkSize) {
    for await (const chunk of readStream(iterable)) {
      yield* streamChunk(chunk, chunkSize);
    }
  };
  var readStream = async function* (stream) {
    if (stream[Symbol.asyncIterator]) {
      yield* stream;
      return;
    }
    const reader = stream.getReader();
    try {
      for (; ; ) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        yield value;
      }
    } finally {
      await reader.cancel();
    }
  };
  var trackStream = (stream, chunkSize, onProgress, onFinish) => {
    const iterator2 = readBytes(stream, chunkSize);
    let bytes = 0;
    let done;
    let _onFinish = (e) => {
      if (!done) {
        done = true;
        onFinish && onFinish(e);
      }
    };
    return new ReadableStream({
      async pull(controller) {
        try {
          const { done: done2, value } = await iterator2.next();
          if (done2) {
            _onFinish();
            controller.close();
            return;
          }
          let len = value.byteLength;
          if (onProgress) {
            let loadedBytes = bytes += len;
            onProgress(loadedBytes);
          }
          controller.enqueue(new Uint8Array(value));
        } catch (err) {
          _onFinish(err);
          throw err;
        }
      },
      cancel(reason) {
        _onFinish(reason);
        return iterator2.return();
      }
    }, {
      highWaterMark: 2
    });
  };

  // node_modules/axios/lib/adapters/fetch.js
  var DEFAULT_CHUNK_SIZE = 64 * 1024;
  var { isFunction: isFunction2 } = utils_default;
  var globalFetchAPI = (({ Request, Response }) => ({
    Request,
    Response
  }))(utils_default.global);
  var {
    ReadableStream: ReadableStream2,
    TextEncoder
  } = utils_default.global;
  var test = (fn, ...args) => {
    try {
      return !!fn(...args);
    } catch (e) {
      return false;
    }
  };
  var factory = (env) => {
    env = utils_default.merge.call({
      skipUndefined: true
    }, globalFetchAPI, env);
    const { fetch: envFetch, Request, Response } = env;
    const isFetchSupported = envFetch ? isFunction2(envFetch) : typeof fetch === "function";
    const isRequestSupported = isFunction2(Request);
    const isResponseSupported = isFunction2(Response);
    if (!isFetchSupported) {
      return false;
    }
    const isReadableStreamSupported = isFetchSupported && isFunction2(ReadableStream2);
    const encodeText = isFetchSupported && (typeof TextEncoder === "function" ? /* @__PURE__ */ ((encoder) => (str) => encoder.encode(str))(new TextEncoder()) : async (str) => new Uint8Array(await new Request(str).arrayBuffer()));
    const supportsRequestStream = isRequestSupported && isReadableStreamSupported && test(() => {
      let duplexAccessed = false;
      const hasContentType = new Request(platform_default.origin, {
        body: new ReadableStream2(),
        method: "POST",
        get duplex() {
          duplexAccessed = true;
          return "half";
        }
      }).headers.has("Content-Type");
      return duplexAccessed && !hasContentType;
    });
    const supportsResponseStream = isResponseSupported && isReadableStreamSupported && test(() => utils_default.isReadableStream(new Response("").body));
    const resolvers = {
      stream: supportsResponseStream && ((res) => res.body)
    };
    isFetchSupported && (() => {
      ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((type) => {
        !resolvers[type] && (resolvers[type] = (res, config2) => {
          let method = res && res[type];
          if (method) {
            return method.call(res);
          }
          throw new AxiosError_default(`Response type '${type}' is not supported`, AxiosError_default.ERR_NOT_SUPPORT, config2);
        });
      });
    })();
    const getBodyLength = async (body) => {
      if (body == null) {
        return 0;
      }
      if (utils_default.isBlob(body)) {
        return body.size;
      }
      if (utils_default.isSpecCompliantForm(body)) {
        const _request = new Request(platform_default.origin, {
          method: "POST",
          body
        });
        return (await _request.arrayBuffer()).byteLength;
      }
      if (utils_default.isArrayBufferView(body) || utils_default.isArrayBuffer(body)) {
        return body.byteLength;
      }
      if (utils_default.isURLSearchParams(body)) {
        body = body + "";
      }
      if (utils_default.isString(body)) {
        return (await encodeText(body)).byteLength;
      }
    };
    const resolveBodyLength = async (headers, body) => {
      const length = utils_default.toFiniteNumber(headers.getContentLength());
      return length == null ? getBodyLength(body) : length;
    };
    return async (config2) => {
      let {
        url,
        method,
        data,
        signal,
        cancelToken,
        timeout,
        onDownloadProgress,
        onUploadProgress,
        responseType,
        headers,
        withCredentials = "same-origin",
        fetchOptions
      } = resolveConfig_default(config2);
      let _fetch = envFetch || fetch;
      responseType = responseType ? (responseType + "").toLowerCase() : "text";
      let composedSignal = composeSignals_default([signal, cancelToken && cancelToken.toAbortSignal()], timeout);
      let request = null;
      const unsubscribe = composedSignal && composedSignal.unsubscribe && (() => {
        composedSignal.unsubscribe();
      });
      let requestContentLength;
      try {
        if (onUploadProgress && supportsRequestStream && method !== "get" && method !== "head" && (requestContentLength = await resolveBodyLength(headers, data)) !== 0) {
          let _request = new Request(url, {
            method: "POST",
            body: data,
            duplex: "half"
          });
          let contentTypeHeader;
          if (utils_default.isFormData(data) && (contentTypeHeader = _request.headers.get("content-type"))) {
            headers.setContentType(contentTypeHeader);
          }
          if (_request.body) {
            const [onProgress, flush] = progressEventDecorator(
              requestContentLength,
              progressEventReducer(asyncDecorator(onUploadProgress))
            );
            data = trackStream(_request.body, DEFAULT_CHUNK_SIZE, onProgress, flush);
          }
        }
        if (!utils_default.isString(withCredentials)) {
          withCredentials = withCredentials ? "include" : "omit";
        }
        const isCredentialsSupported = isRequestSupported && "credentials" in Request.prototype;
        const resolvedOptions = {
          ...fetchOptions,
          signal: composedSignal,
          method: method.toUpperCase(),
          headers: headers.normalize().toJSON(),
          body: data,
          duplex: "half",
          credentials: isCredentialsSupported ? withCredentials : void 0
        };
        request = isRequestSupported && new Request(url, resolvedOptions);
        let response = await (isRequestSupported ? _fetch(request, fetchOptions) : _fetch(url, resolvedOptions));
        const isStreamResponse = supportsResponseStream && (responseType === "stream" || responseType === "response");
        if (supportsResponseStream && (onDownloadProgress || isStreamResponse && unsubscribe)) {
          const options = {};
          ["status", "statusText", "headers"].forEach((prop) => {
            options[prop] = response[prop];
          });
          const responseContentLength = utils_default.toFiniteNumber(response.headers.get("content-length"));
          const [onProgress, flush] = onDownloadProgress && progressEventDecorator(
            responseContentLength,
            progressEventReducer(asyncDecorator(onDownloadProgress), true)
          ) || [];
          response = new Response(
            trackStream(response.body, DEFAULT_CHUNK_SIZE, onProgress, () => {
              flush && flush();
              unsubscribe && unsubscribe();
            }),
            options
          );
        }
        responseType = responseType || "text";
        let responseData = await resolvers[utils_default.findKey(resolvers, responseType) || "text"](response, config2);
        !isStreamResponse && unsubscribe && unsubscribe();
        return await new Promise((resolve, reject) => {
          settle(resolve, reject, {
            data: responseData,
            headers: AxiosHeaders_default.from(response.headers),
            status: response.status,
            statusText: response.statusText,
            config: config2,
            request
          });
        });
      } catch (err) {
        unsubscribe && unsubscribe();
        if (err && err.name === "TypeError" && /Load failed|fetch/i.test(err.message)) {
          throw Object.assign(
            new AxiosError_default("Network Error", AxiosError_default.ERR_NETWORK, config2, request),
            {
              cause: err.cause || err
            }
          );
        }
        throw AxiosError_default.from(err, err && err.code, config2, request);
      }
    };
  };
  var seedCache = /* @__PURE__ */ new Map();
  var getFetch = (config2) => {
    let env = config2 ? config2.env : {};
    const { fetch: fetch2, Request, Response } = env;
    const seeds = [
      Request,
      Response,
      fetch2
    ];
    let len = seeds.length, i = len, seed, target, map = seedCache;
    while (i--) {
      seed = seeds[i];
      target = map.get(seed);
      target === void 0 && map.set(seed, target = i ? /* @__PURE__ */ new Map() : factory(env));
      map = target;
    }
    return target;
  };
  var adapter = getFetch();

  // node_modules/axios/lib/adapters/adapters.js
  var knownAdapters = {
    http: null_default,
    xhr: xhr_default,
    fetch: {
      get: getFetch
    }
  };
  utils_default.forEach(knownAdapters, (fn, value) => {
    if (fn) {
      try {
        Object.defineProperty(fn, "name", { value });
      } catch (e) {
      }
      Object.defineProperty(fn, "adapterName", { value });
    }
  });
  var renderReason = (reason) => `- ${reason}`;
  var isResolvedHandle = (adapter2) => utils_default.isFunction(adapter2) || adapter2 === null || adapter2 === false;
  var adapters_default = {
    getAdapter: (adapters, config2) => {
      adapters = utils_default.isArray(adapters) ? adapters : [adapters];
      const { length } = adapters;
      let nameOrAdapter;
      let adapter2;
      const rejectedReasons = {};
      for (let i = 0; i < length; i++) {
        nameOrAdapter = adapters[i];
        let id;
        adapter2 = nameOrAdapter;
        if (!isResolvedHandle(nameOrAdapter)) {
          adapter2 = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];
          if (adapter2 === void 0) {
            throw new AxiosError_default(`Unknown adapter '${id}'`);
          }
        }
        if (adapter2 && (utils_default.isFunction(adapter2) || (adapter2 = adapter2.get(config2)))) {
          break;
        }
        rejectedReasons[id || "#" + i] = adapter2;
      }
      if (!adapter2) {
        const reasons = Object.entries(rejectedReasons).map(
          ([id, state]) => `adapter ${id} ` + (state === false ? "is not supported by the environment" : "is not available in the build")
        );
        let s = length ? reasons.length > 1 ? "since :\n" + reasons.map(renderReason).join("\n") : " " + renderReason(reasons[0]) : "as no adapter specified";
        throw new AxiosError_default(
          `There is no suitable adapter to dispatch the request ` + s,
          "ERR_NOT_SUPPORT"
        );
      }
      return adapter2;
    },
    adapters: knownAdapters
  };

  // node_modules/axios/lib/core/dispatchRequest.js
  function throwIfCancellationRequested(config2) {
    if (config2.cancelToken) {
      config2.cancelToken.throwIfRequested();
    }
    if (config2.signal && config2.signal.aborted) {
      throw new CanceledError_default(null, config2);
    }
  }
  function dispatchRequest(config2) {
    throwIfCancellationRequested(config2);
    config2.headers = AxiosHeaders_default.from(config2.headers);
    config2.data = transformData.call(
      config2,
      config2.transformRequest
    );
    if (["post", "put", "patch"].indexOf(config2.method) !== -1) {
      config2.headers.setContentType("application/x-www-form-urlencoded", false);
    }
    const adapter2 = adapters_default.getAdapter(config2.adapter || defaults_default.adapter, config2);
    return adapter2(config2).then(function onAdapterResolution(response) {
      throwIfCancellationRequested(config2);
      response.data = transformData.call(
        config2,
        config2.transformResponse,
        response
      );
      response.headers = AxiosHeaders_default.from(response.headers);
      return response;
    }, function onAdapterRejection(reason) {
      if (!isCancel(reason)) {
        throwIfCancellationRequested(config2);
        if (reason && reason.response) {
          reason.response.data = transformData.call(
            config2,
            config2.transformResponse,
            reason.response
          );
          reason.response.headers = AxiosHeaders_default.from(reason.response.headers);
        }
      }
      return Promise.reject(reason);
    });
  }

  // node_modules/axios/lib/env/data.js
  var VERSION = "1.12.2";

  // node_modules/axios/lib/helpers/validator.js
  var validators = {};
  ["object", "boolean", "number", "function", "string", "symbol"].forEach((type, i) => {
    validators[type] = function validator(thing) {
      return typeof thing === type || "a" + (i < 1 ? "n " : " ") + type;
    };
  });
  var deprecatedWarnings = {};
  validators.transitional = function transitional(validator, version3, message) {
    function formatMessage(opt, desc) {
      return "[Axios v" + VERSION + "] Transitional option '" + opt + "'" + desc + (message ? ". " + message : "");
    }
    return (value, opt, opts) => {
      if (validator === false) {
        throw new AxiosError_default(
          formatMessage(opt, " has been removed" + (version3 ? " in " + version3 : "")),
          AxiosError_default.ERR_DEPRECATED
        );
      }
      if (version3 && !deprecatedWarnings[opt]) {
        deprecatedWarnings[opt] = true;
        console.warn(
          formatMessage(
            opt,
            " has been deprecated since v" + version3 + " and will be removed in the near future"
          )
        );
      }
      return validator ? validator(value, opt, opts) : true;
    };
  };
  validators.spelling = function spelling(correctSpelling) {
    return (value, opt) => {
      console.warn(`${opt} is likely a misspelling of ${correctSpelling}`);
      return true;
    };
  };
  function assertOptions(options, schema, allowUnknown) {
    if (typeof options !== "object") {
      throw new AxiosError_default("options must be an object", AxiosError_default.ERR_BAD_OPTION_VALUE);
    }
    const keys = Object.keys(options);
    let i = keys.length;
    while (i-- > 0) {
      const opt = keys[i];
      const validator = schema[opt];
      if (validator) {
        const value = options[opt];
        const result = value === void 0 || validator(value, opt, options);
        if (result !== true) {
          throw new AxiosError_default("option " + opt + " must be " + result, AxiosError_default.ERR_BAD_OPTION_VALUE);
        }
        continue;
      }
      if (allowUnknown !== true) {
        throw new AxiosError_default("Unknown option " + opt, AxiosError_default.ERR_BAD_OPTION);
      }
    }
  }
  var validator_default = {
    assertOptions,
    validators
  };

  // node_modules/axios/lib/core/Axios.js
  var validators2 = validator_default.validators;
  var Axios = class {
    constructor(instanceConfig) {
      this.defaults = instanceConfig || {};
      this.interceptors = {
        request: new InterceptorManager_default(),
        response: new InterceptorManager_default()
      };
    }
    /**
     * Dispatch a request
     *
     * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
     * @param {?Object} config
     *
     * @returns {Promise} The Promise to be fulfilled
     */
    async request(configOrUrl, config2) {
      try {
        return await this._request(configOrUrl, config2);
      } catch (err) {
        if (err instanceof Error) {
          let dummy = {};
          Error.captureStackTrace ? Error.captureStackTrace(dummy) : dummy = new Error();
          const stack = dummy.stack ? dummy.stack.replace(/^.+\n/, "") : "";
          try {
            if (!err.stack) {
              err.stack = stack;
            } else if (stack && !String(err.stack).endsWith(stack.replace(/^.+\n.+\n/, ""))) {
              err.stack += "\n" + stack;
            }
          } catch (e) {
          }
        }
        throw err;
      }
    }
    _request(configOrUrl, config2) {
      if (typeof configOrUrl === "string") {
        config2 = config2 || {};
        config2.url = configOrUrl;
      } else {
        config2 = configOrUrl || {};
      }
      config2 = mergeConfig(this.defaults, config2);
      const { transitional: transitional2, paramsSerializer, headers } = config2;
      if (transitional2 !== void 0) {
        validator_default.assertOptions(transitional2, {
          silentJSONParsing: validators2.transitional(validators2.boolean),
          forcedJSONParsing: validators2.transitional(validators2.boolean),
          clarifyTimeoutError: validators2.transitional(validators2.boolean)
        }, false);
      }
      if (paramsSerializer != null) {
        if (utils_default.isFunction(paramsSerializer)) {
          config2.paramsSerializer = {
            serialize: paramsSerializer
          };
        } else {
          validator_default.assertOptions(paramsSerializer, {
            encode: validators2.function,
            serialize: validators2.function
          }, true);
        }
      }
      if (config2.allowAbsoluteUrls !== void 0) {
      } else if (this.defaults.allowAbsoluteUrls !== void 0) {
        config2.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls;
      } else {
        config2.allowAbsoluteUrls = true;
      }
      validator_default.assertOptions(config2, {
        baseUrl: validators2.spelling("baseURL"),
        withXsrfToken: validators2.spelling("withXSRFToken")
      }, true);
      config2.method = (config2.method || this.defaults.method || "get").toLowerCase();
      let contextHeaders = headers && utils_default.merge(
        headers.common,
        headers[config2.method]
      );
      headers && utils_default.forEach(
        ["delete", "get", "head", "post", "put", "patch", "common"],
        (method) => {
          delete headers[method];
        }
      );
      config2.headers = AxiosHeaders_default.concat(contextHeaders, headers);
      const requestInterceptorChain = [];
      let synchronousRequestInterceptors = true;
      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        if (typeof interceptor.runWhen === "function" && interceptor.runWhen(config2) === false) {
          return;
        }
        synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
        requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
      });
      const responseInterceptorChain = [];
      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
      });
      let promise;
      let i = 0;
      let len;
      if (!synchronousRequestInterceptors) {
        const chain = [dispatchRequest.bind(this), void 0];
        chain.unshift(...requestInterceptorChain);
        chain.push(...responseInterceptorChain);
        len = chain.length;
        promise = Promise.resolve(config2);
        while (i < len) {
          promise = promise.then(chain[i++], chain[i++]);
        }
        return promise;
      }
      len = requestInterceptorChain.length;
      let newConfig = config2;
      while (i < len) {
        const onFulfilled = requestInterceptorChain[i++];
        const onRejected = requestInterceptorChain[i++];
        try {
          newConfig = onFulfilled(newConfig);
        } catch (error) {
          onRejected.call(this, error);
          break;
        }
      }
      try {
        promise = dispatchRequest.call(this, newConfig);
      } catch (error) {
        return Promise.reject(error);
      }
      i = 0;
      len = responseInterceptorChain.length;
      while (i < len) {
        promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
      }
      return promise;
    }
    getUri(config2) {
      config2 = mergeConfig(this.defaults, config2);
      const fullPath = buildFullPath(config2.baseURL, config2.url, config2.allowAbsoluteUrls);
      return buildURL(fullPath, config2.params, config2.paramsSerializer);
    }
  };
  utils_default.forEach(["delete", "get", "head", "options"], function forEachMethodNoData(method) {
    Axios.prototype[method] = function(url, config2) {
      return this.request(mergeConfig(config2 || {}, {
        method,
        url,
        data: (config2 || {}).data
      }));
    };
  });
  utils_default.forEach(["post", "put", "patch"], function forEachMethodWithData(method) {
    function generateHTTPMethod(isForm) {
      return function httpMethod(url, data, config2) {
        return this.request(mergeConfig(config2 || {}, {
          method,
          headers: isForm ? {
            "Content-Type": "multipart/form-data"
          } : {},
          url,
          data
        }));
      };
    }
    Axios.prototype[method] = generateHTTPMethod();
    Axios.prototype[method + "Form"] = generateHTTPMethod(true);
  });
  var Axios_default = Axios;

  // node_modules/axios/lib/cancel/CancelToken.js
  var CancelToken = class _CancelToken {
    constructor(executor) {
      if (typeof executor !== "function") {
        throw new TypeError("executor must be a function.");
      }
      let resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });
      const token = this;
      this.promise.then((cancel) => {
        if (!token._listeners) return;
        let i = token._listeners.length;
        while (i-- > 0) {
          token._listeners[i](cancel);
        }
        token._listeners = null;
      });
      this.promise.then = (onfulfilled) => {
        let _resolve;
        const promise = new Promise((resolve) => {
          token.subscribe(resolve);
          _resolve = resolve;
        }).then(onfulfilled);
        promise.cancel = function reject() {
          token.unsubscribe(_resolve);
        };
        return promise;
      };
      executor(function cancel(message, config2, request) {
        if (token.reason) {
          return;
        }
        token.reason = new CanceledError_default(message, config2, request);
        resolvePromise(token.reason);
      });
    }
    /**
     * Throws a `CanceledError` if cancellation has been requested.
     */
    throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    }
    /**
     * Subscribe to the cancel signal
     */
    subscribe(listener) {
      if (this.reason) {
        listener(this.reason);
        return;
      }
      if (this._listeners) {
        this._listeners.push(listener);
      } else {
        this._listeners = [listener];
      }
    }
    /**
     * Unsubscribe from the cancel signal
     */
    unsubscribe(listener) {
      if (!this._listeners) {
        return;
      }
      const index = this._listeners.indexOf(listener);
      if (index !== -1) {
        this._listeners.splice(index, 1);
      }
    }
    toAbortSignal() {
      const controller = new AbortController();
      const abort = (err) => {
        controller.abort(err);
      };
      this.subscribe(abort);
      controller.signal.unsubscribe = () => this.unsubscribe(abort);
      return controller.signal;
    }
    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    static source() {
      let cancel;
      const token = new _CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token,
        cancel
      };
    }
  };
  var CancelToken_default = CancelToken;

  // node_modules/axios/lib/helpers/spread.js
  function spread(callback) {
    return function wrap(arr) {
      return callback.apply(null, arr);
    };
  }

  // node_modules/axios/lib/helpers/isAxiosError.js
  function isAxiosError(payload) {
    return utils_default.isObject(payload) && payload.isAxiosError === true;
  }

  // node_modules/axios/lib/helpers/HttpStatusCode.js
  var HttpStatusCode = {
    Continue: 100,
    SwitchingProtocols: 101,
    Processing: 102,
    EarlyHints: 103,
    Ok: 200,
    Created: 201,
    Accepted: 202,
    NonAuthoritativeInformation: 203,
    NoContent: 204,
    ResetContent: 205,
    PartialContent: 206,
    MultiStatus: 207,
    AlreadyReported: 208,
    ImUsed: 226,
    MultipleChoices: 300,
    MovedPermanently: 301,
    Found: 302,
    SeeOther: 303,
    NotModified: 304,
    UseProxy: 305,
    Unused: 306,
    TemporaryRedirect: 307,
    PermanentRedirect: 308,
    BadRequest: 400,
    Unauthorized: 401,
    PaymentRequired: 402,
    Forbidden: 403,
    NotFound: 404,
    MethodNotAllowed: 405,
    NotAcceptable: 406,
    ProxyAuthenticationRequired: 407,
    RequestTimeout: 408,
    Conflict: 409,
    Gone: 410,
    LengthRequired: 411,
    PreconditionFailed: 412,
    PayloadTooLarge: 413,
    UriTooLong: 414,
    UnsupportedMediaType: 415,
    RangeNotSatisfiable: 416,
    ExpectationFailed: 417,
    ImATeapot: 418,
    MisdirectedRequest: 421,
    UnprocessableEntity: 422,
    Locked: 423,
    FailedDependency: 424,
    TooEarly: 425,
    UpgradeRequired: 426,
    PreconditionRequired: 428,
    TooManyRequests: 429,
    RequestHeaderFieldsTooLarge: 431,
    UnavailableForLegalReasons: 451,
    InternalServerError: 500,
    NotImplemented: 501,
    BadGateway: 502,
    ServiceUnavailable: 503,
    GatewayTimeout: 504,
    HttpVersionNotSupported: 505,
    VariantAlsoNegotiates: 506,
    InsufficientStorage: 507,
    LoopDetected: 508,
    NotExtended: 510,
    NetworkAuthenticationRequired: 511
  };
  Object.entries(HttpStatusCode).forEach(([key, value]) => {
    HttpStatusCode[value] = key;
  });
  var HttpStatusCode_default = HttpStatusCode;

  // node_modules/axios/lib/axios.js
  function createInstance(defaultConfig) {
    const context = new Axios_default(defaultConfig);
    const instance = bind(Axios_default.prototype.request, context);
    utils_default.extend(instance, Axios_default.prototype, context, { allOwnKeys: true });
    utils_default.extend(instance, context, null, { allOwnKeys: true });
    instance.create = function create(instanceConfig) {
      return createInstance(mergeConfig(defaultConfig, instanceConfig));
    };
    return instance;
  }
  var axios = createInstance(defaults_default);
  axios.Axios = Axios_default;
  axios.CanceledError = CanceledError_default;
  axios.CancelToken = CancelToken_default;
  axios.isCancel = isCancel;
  axios.VERSION = VERSION;
  axios.toFormData = toFormData_default;
  axios.AxiosError = AxiosError_default;
  axios.Cancel = axios.CanceledError;
  axios.all = function all(promises) {
    return Promise.all(promises);
  };
  axios.spread = spread;
  axios.isAxiosError = isAxiosError;
  axios.mergeConfig = mergeConfig;
  axios.AxiosHeaders = AxiosHeaders_default;
  axios.formToJSON = (thing) => formDataToJSON_default(utils_default.isHTMLForm(thing) ? new FormData(thing) : thing);
  axios.getAdapter = adapters_default.getAdapter;
  axios.HttpStatusCode = HttpStatusCode_default;
  axios.default = axios;
  var axios_default = axios;

  // node_modules/axios/index.js
  var {
    Axios: Axios2,
    AxiosError: AxiosError2,
    CanceledError: CanceledError2,
    isCancel: isCancel2,
    CancelToken: CancelToken2,
    VERSION: VERSION2,
    all: all2,
    Cancel,
    isAxiosError: isAxiosError2,
    spread: spread2,
    toFormData: toFormData2,
    AxiosHeaders: AxiosHeaders2,
    HttpStatusCode: HttpStatusCode2,
    formToJSON,
    getAdapter,
    mergeConfig: mergeConfig2
  } = axios_default;

  // src/modules/preferenceScript.ts
  var PREF_UI_TEXT = {
    zh: {
      invalidFont: "\u6587\u4EF6\u7C7B\u578B\u65E0\u6548\uFF0C\u8BF7\u9009\u62E9 .ttf\u3001.otf\u3001.woff \u6216 .woff2 \u6587\u4EF6\u3002",
      colService: "\u670D\u52A1",
      colModel: "\u6A21\u578B",
      colApiUrl: "API URL",
      colApiKey: "API Key",
      colActivate: "\u6FC0\u6D3B",
      colExtraData: "\u989D\u5916\u53C2\u6570",
      serverAddressRequired: "\u8BF7\u5148\u8BBE\u7F6E Server IP \u5730\u5740",
      connectionTitle: "Server \u8FDE\u63A5\u68C0\u67E5",
      checking: "\u6B63\u5728\u68C0\u67E5 Server \u8FDE\u63A5...",
      unknown: "\u672A\u77E5",
      successLine: (version3) => `\u2713 \u8FDE\u63A5\u6210\u529F\uFF01Server \u7248\u672C: ${version3}`,
      successAlert: (url, version3) => `\u2713 \u8FDE\u63A5\u6210\u529F\uFF01

Server \u5730\u5740: ${url}
Server \u7248\u672C: ${version3}
\u72B6\u6001: \u6B63\u5E38\u8FD0\u884C`,
      badStatus: (status) => `Server \u8FD4\u56DE\u9519\u8BEF\u72B6\u6001: ${status}`,
      unknownError: "\u672A\u77E5\u9519\u8BEF",
      timeout: "\u8FDE\u63A5\u8D85\u65F6\uFF0810\u79D2\uFF09",
      timeoutHelp: "\u53EF\u80FD\u539F\u56E0:\n1. \u7F51\u7EDC\u8FDE\u63A5\u4E0D\u7A33\u5B9A\n2. \u9632\u706B\u5899\u963B\u6B62\u4E86\u8FDE\u63A5\n3. Server \u54CD\u5E94\u65F6\u95F4\u8FC7\u957F\n\n\u5EFA\u8BAE:\n- \u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5\n- \u4E34\u65F6\u5173\u95ED\u9632\u706B\u5899\u6D4B\u8BD5\n- \u786E\u8BA4 Server \u5DF2\u6B63\u5E38\u542F\u52A8",
      responseError: (status) => `Server \u8FD4\u56DE\u9519\u8BEF: ${status}`,
      responseHelp: "\u53EF\u80FD\u539F\u56E0:\n1. Server \u7248\u672C\u8FC7\u65E7\uFF0C\u4E0D\u652F\u6301 /health \u7AEF\u70B9\n2. Server \u914D\u7F6E\u9519\u8BEF\n\n\u5EFA\u8BAE:\n- \u66F4\u65B0 Server \u5230\u6700\u65B0\u7248\u672C\n- \u68C0\u67E5 Server \u65E5\u5FD7\u67E5\u770B\u9519\u8BEF\u8BE6\u60C5",
      cannotConnect: "\u65E0\u6CD5\u8FDE\u63A5\u5230 Server",
      cannotConnectHelp: (url) => "\u53EF\u80FD\u539F\u56E0:\n1. Server \u672A\u542F\u52A8\n2. \u63D2\u4EF6\u91CC\u7684\u5730\u5740/\u7AEF\u53E3\u548C\u7EC8\u7AEF\u4E0D\u4E00\u81F4\n3. \u8BE5\u7AEF\u53E3\u88AB\u5176\u4ED6\u7A0B\u5E8F\u5360\u7528\n\n\u5EFA\u8BAE:\n- \u6253\u5F00 Server \u7EC8\u7AEF\uFF0C\u770B\u5B83\u6253\u5370\u7684 http://127.0.0.1:\u7AEF\u53E3\n- \u628A\u63D2\u4EF6\u91CC\u7684 Python Server IP \u6539\u6210\u548C\u7EC8\u7AEF\u5B8C\u5168\u4E00\u6837\n- \u5F53\u524D\u68C0\u67E5\u7684\u662F: " + url,
      wrongService: "\u8FD9\u4E2A\u5730\u5740\u4E0A\u4E0D\u662F PDF2zh Server",
      wrongServiceHelp: (url) => "\u5F53\u524D\u68C0\u67E5\u7684\u662F " + url + "\n\u8FD9\u4E2A\u7AEF\u53E3\u6709\u54CD\u5E94\uFF0C\u4F46\u4E0D\u662F PDF2zh\uFF08\u5E38\u89C1\u662F\u88AB\u5176\u4ED6\u7A0B\u5E8F\u5360\u7528\uFF09\u3002\n\u8BF7\u770B Server \u7EC8\u7AEF\u91CC\u5B9E\u9645\u6253\u5370\u7684\u5730\u5740\uFF0C\u628A\u63D2\u4EF6\u91CC\u7684 Python Server IP \u6539\u6210\u90A3\u4E2A\u5730\u5740\u3002",
      genericHelp: "\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5\u548C Server \u72B6\u6001",
      failureLine: (message) => `\u2717 \u8FDE\u63A5\u5931\u8D25: ${message}`,
      failureAlert: (message, help) => `\u2717 \u8FDE\u63A5\u5931\u8D25

\u9519\u8BEF\u4FE1\u606F: ${message}

${help}`
    },
    en: {
      invalidFont: "Invalid file type. Select a .ttf, .otf, .woff, or .woff2 file.",
      colService: "Service",
      colModel: "Model",
      colApiUrl: "API URL",
      colApiKey: "API Key",
      colActivate: "Active",
      colExtraData: "Extra Parameters",
      serverAddressRequired: "Set the Server IP address first.",
      connectionTitle: "Server Connection Check",
      checking: "Checking Server connection...",
      unknown: "Unknown",
      successLine: (version3) => `\u2713 Connected. Server version: ${version3}`,
      successAlert: (url, version3) => `\u2713 Connected successfully.

Server: ${url}
Version: ${version3}
Status: Running`,
      badStatus: (status) => `Server returned status ${status}`,
      unknownError: "Unknown error",
      timeout: "Connection timed out (10 seconds)",
      timeoutHelp: "Possible causes:\n1. Unstable network\n2. A firewall is blocking the connection\n3. The Server is responding slowly\n\nTry:\n- Check your network\n- Temporarily test without the firewall\n- Confirm the Server is running",
      responseError: (status) => `Server returned error ${status}`,
      responseHelp: "Possible causes:\n1. The Server is too old to provide /health\n2. Server configuration error\n\nTry:\n- Update the Server\n- Check the Server terminal logs",
      cannotConnect: "Cannot connect to the Server",
      cannotConnectHelp: (url) => "Possible causes:\n1. The Server is not running\n2. The plugin URL/port does not match the terminal\n3. Another program is using that port\n\nTry:\n- Check the http://127.0.0.1:PORT printed in the Server terminal\n- Set Python Server IP in the plugin to that exact address\n- Currently checking: " + url,
      wrongService: "This address is not a PDF2zh Server",
      wrongServiceHelp: (url) => "Checked " + url + "\nSomething responded, but it is not PDF2zh (another program may be using this port).\nCopy the address printed in the Server terminal into Python Server IP.",
      genericHelp: "Check the network connection and Server status.",
      failureLine: (message) => `\u2717 Connection failed: ${message}`,
      failureAlert: (message, help) => `\u2717 Connection failed

Error: ${message}

${help}`
    }
  };
  function preferenceUiLanguage() {
    const locale = String(Zotero.locale || "en-US").toLowerCase();
    return locale.startsWith("zh") ? "zh" : "en";
  }
  function prefText(key, ...args) {
    const value = PREF_UI_TEXT[preferenceUiLanguage()][key];
    return typeof value === "function" ? value(...args) : value;
  }
  async function registerPrefsScripts(_window) {
    if (!addon.data.prefs) {
      addon.data.prefs = {
        window: _window,
        columns: [],
        rows: []
      };
    } else {
      addon.data.prefs.window = _window;
    }
    if (!addon.data.llmApis) {
      addon.data.llmApis = {
        map: /* @__PURE__ */ new Map(),
        cachedKeys: []
      };
    }
    bindPrefEvents();
    initTableUI();
    initializeEngineConfig();
  }
  function bindPrefEvents() {
    const { window: window2 } = addon.data.prefs ?? {};
    if (!window2) return;
    const doc = window2.document;
    if (!doc) return;
    const sourceLangSelect = doc.getElementById(
      `zotero-prefpane-${config.addonRef}-sourceLangSelect`
    );
    const targetLangSelect = doc.getElementById(
      `zotero-prefpane-${config.addonRef}-targetLangSelect`
    );
    for (const [langName, langCode] of Object.entries(lang_map)) {
      const option = doc.createElement("option");
      option.value = langCode;
      option.textContent = langName;
      sourceLangSelect?.appendChild(option.cloneNode(true));
      targetLangSelect?.appendChild(option.cloneNode(true));
    }
    const groupbox = doc.querySelector("groupbox");
    if (groupbox) {
      groupbox.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => {
          initializeEngineConfig();
        }, 200);
      });
    }
    doc.querySelector(`#zotero-prefpane-${config.addonRef}-engine`)?.addEventListener("change", (e) => {
      const value = e.target.value;
      if (value) {
        setPref("engine", value);
        handleEngineChange(value);
      }
    });
    doc.querySelector(`#zotero-prefpane-${config.addonRef}-engineSelect`)?.addEventListener("change", (e) => {
      const value = e.target.value;
      if (value) {
        setPref("engine", value);
        handleEngineChange(value);
      }
    });
    doc.querySelector(`#zotero-prefpane-${config.addonRef}-fontFile-clear`)?.addEventListener("click", () => {
      setPref("fontFile", "");
    });
    doc.getElementById(`zotero-prefpane-${config.addonRef}-fontFile`)?.addEventListener("change", function(event) {
      const file = event.target.files?.[0];
      ztoolkit.log("Selected font file:", getPref("fontFile"));
      if (file) {
        const validExtensions = [".ttf", ".otf", ".woff", ".woff2"];
        const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
        if (!validExtensions.includes(extension)) {
          alert(prefText("invalidFont"));
          setPref("fontFile", "");
          ztoolkit.log("Selected font file1:", file);
        } else {
          setPref("fontFile", file.mozFullPath);
          ztoolkit.log("Selected font file2:", getPref("fontFile"));
        }
      }
    });
    doc.querySelector(`#zotero-prefpane-${config.addonRef}-checkConnection`)?.addEventListener("click", async () => {
      await checkServerConnection();
    });
    doc.querySelector(
      `#zotero-prefpane-${config.addonRef}-llmapi-table-container`
    )?.addEventListener("showing", () => {
      ztoolkit.log("LLM API \u8868\u683C\u5BB9\u5668\u663E\u793A\u4E8B\u4EF6\u89E6\u53D1");
      updateLLMApiTableUI();
    });
    const addButton = doc.getElementById(
      `zotero-prefpane-${config.addonRef}-llmapi-add`
    );
    const removeButton = doc.getElementById(
      `zotero-prefpane-${config.addonRef}-llmapi-remove`
    );
    const editButton = doc.getElementById(
      `zotero-prefpane-${config.addonRef}-llmapi-edit`
    );
    const activateButton = doc.getElementById(
      `zotero-prefpane-${config.addonRef}-llmapi-activate`
    );
    const toTopButton = doc.getElementById(
      `zotero-prefpane-${config.addonRef}-llmapi-totop`
    );
    addButton?.addEventListener("command", async () => {
      await openLLMApiEditDialog();
    });
    removeButton?.addEventListener("command", () => {
      const selectedKeys = getLLMApiSelection();
      selectedKeys.forEach((key) => {
        if (key) {
          llmApiManager.deleteLLMApi(key);
          addon.data.llmApis?.map.delete(key);
        }
      });
      updateCachedLLMApiKeys();
      saveLLMApisToPrefs();
      updateLLMApiTableUI();
    });
    editButton?.addEventListener("command", async () => {
      const selectedKeys = getLLMApiSelection();
      if (selectedKeys.length === 1) {
        await openLLMApiEditDialog(selectedKeys[0]);
      }
    });
    activateButton?.addEventListener("command", () => {
      const selectedKeys = getLLMApiSelection();
      if (selectedKeys.length === 1) {
        const key = selectedKeys[0];
        const llmApi = addon.data.llmApis?.map.get(key);
        if (llmApi) {
          if (llmApi.activate) {
            llmApiManager.deactivateLLMApi(key);
          } else {
            llmApiManager.activateLLMApi(key);
          }
          addon.data.llmApis?.map.set(key, llmApiManager.getLLMApi(key));
          saveLLMApisToPrefs();
          updateLLMApiTableUI();
        }
      }
    });
    toTopButton?.addEventListener("command", () => {
      const selectedKeys = getLLMApiSelection();
      if (selectedKeys.length === 1) {
        const key = selectedKeys[0];
        const llmApi = addon.data.llmApis?.map.get(key);
        if (llmApi) {
          const llmApis = Array.from(
            addon.data.llmApis?.map.values() || []
          );
          const index = llmApis.findIndex((llmApi2) => llmApi2.key === key);
          if (index !== -1) {
            llmApis.splice(index, 1);
            llmApis.unshift(llmApi);
            addon.data.llmApis?.map.clear();
            llmApis.forEach((llmApi2) => {
              addon.data.llmApis?.map.set(llmApi2.key, llmApi2);
            });
            updateCachedLLMApiKeys();
            saveLLMApisToPrefs();
            updateLLMApiTableUI();
          }
        }
      }
    });
  }
  async function initTableUI() {
    if (!addon.data.prefs?.window) return;
    loadLLMApisFromPrefs();
    const renderLock = Zotero.Promise.defer();
    addon.data.prefs.tableHelper = new ztoolkit.VirtualizedTable(
      addon.data.prefs.window
    ).setContainerId(
      `zotero-prefpane-${config.addonRef}-llmapi-table-container`
    ).setProp({
      id: `zotero-prefpane-${config.addonRef}-llmapi-table`,
      columns: [
        {
          dataKey: "service",
          label: prefText("colService"),
          width: 150
        },
        { dataKey: "model", label: prefText("colModel"), width: 200 },
        { dataKey: "apiUrl", label: prefText("colApiUrl"), width: 140 },
        { dataKey: "apiKey", label: prefText("colApiKey"), width: 100 },
        {
          dataKey: "activate",
          label: prefText("colActivate"),
          width: 80
        },
        {
          dataKey: "extraData",
          label: prefText("colExtraData"),
          width: 200
        }
      ],
      showHeader: true,
      multiSelect: true,
      staticColumns: false,
      disableFontSizeScaling: true
    }).setProp(
      "getRowCount",
      () => addon.data.llmApis?.cachedKeys.length || 0
    ).setProp("getRowData", getRowData).setProp("onSelectionChange", (selection) => {
      const selectedKeys = getLLMApiSelection();
      addon.data.llmApis.selectedKey = selectedKeys[0];
      addon.data.prefs?.window?.document.querySelectorAll(".llmapi-selection")?.forEach(
        (e) => setButtonDisabled(
          e,
          selectedKeys.length === 0
        )
      );
      addon.data.prefs?.window?.document.querySelectorAll(".llmapi-selection-single")?.forEach(
        (e) => setButtonDisabled(
          e,
          selectedKeys.length !== 1
        )
      );
    }).setProp("onKeyDown", (event) => {
      if (event.key == "Delete" || Zotero.isMac && event.key == "Backspace") {
        const selectedKeys = getLLMApiSelection();
        selectedKeys.forEach((key) => {
          if (key) {
            llmApiManager.deleteLLMApi(key);
            addon.data.llmApis?.map.delete(key);
          }
        });
        updateCachedLLMApiKeys();
        saveLLMApisToPrefs();
        updateLLMApiTableUI();
        return false;
      }
      return true;
    }).render(-1, () => {
      renderLock.resolve();
    });
    await renderLock.promise;
    updateLLMApiTableUI();
    setTimeout(() => {
      ztoolkit.log("Forcing table refresh...");
      const tableHelper = addon.data.prefs.tableHelper;
      if (tableHelper && tableHelper.treeInstance) {
        const rowCount = addon.data.llmApis?.cachedKeys.length || 0;
        tableHelper.treeInstance.invalidate();
        tableHelper.render(-1, () => {
          ztoolkit.log("Forced table refresh completed");
        });
      }
    }, 500);
  }
  function updateCachedLLMApiKeys() {
    if (!addon.data.llmApis) return;
    addon.data.llmApis.cachedKeys = Array.from(addon.data.llmApis.map.keys());
  }
  async function openLLMApiEditDialog(key) {
    const llmApi = key ? addon.data.llmApis?.map.get(key) : emptyLLMApi;
    if (!llmApi) {
      return false;
    }
    const dialogData = {
      service: llmApi.service || "openai",
      model: llmApi.model || "",
      apiKey: llmApi.apiKey || "",
      apiUrl: llmApi.apiUrl || "",
      activate: llmApi.activate || false,
      extraData: llmApi.extraData || {}
    };
    const windowArgs = {
      _initPromise: Zotero.Promise.defer(),
      data: dialogData,
      isEdit: !!key
    };
    const dialogWindow = Zotero.getMainWindow().openDialog(
      `chrome://${config.addonRef}/content/llmApiEditor.xhtml`,
      `${config.addonRef}-llmApiEditor`,
      `chrome,centerscreen,resizable,status,dialog=no`,
      windowArgs
    );
    if (!dialogWindow) {
      return false;
    }
    await windowArgs._initPromise.promise;
    const result = await new Promise((resolve) => {
      const checkClosed = () => {
        if (dialogWindow.closed) {
          resolve(windowArgs.result);
        } else {
          setTimeout(checkClosed, 100);
        }
      };
      checkClosed();
    });
    if (!result || !result.success) {
      return false;
    }
    const userData = result.data;
    try {
      const newLLMApi = {
        key: key || Zotero.Utilities.generateObjectKey(),
        service: userData.service || userData.serviceselect || "",
        model: userData.model || userData.modelselect || "",
        apiKey: userData.apiKey,
        apiUrl: userData.apiUrl,
        activate: userData.activate,
        extraData: userData.extraData || {}
      };
      if (addon.data.llmApis) {
        addon.data.llmApis.map.set(newLLMApi.key, newLLMApi);
        updateCachedLLMApiKeys();
      }
      llmApiManager.updateLLMApi(newLLMApi);
      saveLLMApisToPrefs();
      updateLLMApiTableUI();
      return true;
    } catch (error) {
      return false;
    }
  }
  function saveLLMApisToPrefs() {
    if (!addon.data.llmApis) return;
    const llmApisArray = Array.from(addon.data.llmApis.map.values());
    const llmApisJson = JSON.stringify(llmApisArray);
    setPref("llmApis", llmApisJson);
  }
  function migrateLegacyDeepSeekConfig(llmApi) {
    if (llmApi.service !== "deepseek") return false;
    if (llmApi.model !== "deepseek-chat" && llmApi.model !== "deepseek-reasoner") {
      return false;
    }
    const legacyModel = llmApi.model;
    llmApi.model = "deepseek-v4-flash";
    llmApi.extraData = llmApi.extraData || {};
    if (!("deepseek_thinking_mode" in llmApi.extraData)) {
      if (legacyModel === "deepseek-reasoner") {
        llmApi.extraData.deepseek_thinking_mode = "enabled";
        llmApi.extraData.deepseek_reasoning_effort = "high";
      } else {
        llmApi.extraData.deepseek_thinking_mode = "disabled";
        delete llmApi.extraData.deepseek_reasoning_effort;
      }
    }
    return true;
  }
  function loadLLMApisFromPrefs() {
    const llmApisJson = getPref("llmApis");
    if (!llmApisJson || typeof llmApisJson !== "string") {
      ztoolkit.log("No valid data found in prefs");
      return;
    }
    try {
      const llmApisArray = JSON.parse(llmApisJson);
      if (Array.isArray(llmApisArray)) {
        let migratedLegacyDeepSeek = false;
        addon.data.llmApis?.map.clear();
        llmApisArray.forEach((llmApi) => {
          if (llmApi.key && llmApi.service) {
            if (migrateLegacyDeepSeekConfig(llmApi)) {
              migratedLegacyDeepSeek = true;
            }
            if (llmApi.activate === void 0) {
              llmApi.activate = false;
            }
            if (!llmApi.extraData) {
              llmApi.extraData = {};
            }
            let key = llmApi.key;
            if (!key) {
              key = Zotero.Utilities.generateObjectKey();
              llmApi.key = key;
            }
            addon.data.llmApis?.map.set(llmApi.key, llmApi);
            llmApiManager.updateLLMApi(llmApi);
          }
        });
        updateCachedLLMApiKeys();
        if (migratedLegacyDeepSeek) {
          saveLLMApisToPrefs();
          ztoolkit.log(
            "Migrated retired DeepSeek aliases to DeepSeek V4 Flash"
          );
        }
      } else {
        ztoolkit.log("Parsed data is not an array");
      }
    } catch (error) {
      ztoolkit.log("Error loading LLM APIs from prefs:", error);
    }
    ztoolkit.log("LLM APIs loaded from prefs:", addon.data.llmApis);
  }
  function updateLLMApiTableUI() {
    setTimeout(() => addon.data.prefs?.tableHelper?.treeInstance.invalidate());
  }
  function setButtonDisabled(button, disabled) {
    if (button) {
      button.disabled = disabled;
    }
  }
  function getRowData(index) {
    const keys = addon.data.llmApis?.cachedKeys || [];
    let llmApi = emptyLLMApi;
    if (keys && keys.length > index) {
      const key = keys[index];
      llmApi = addon.data.llmApis?.map.get(key) || emptyLLMApi;
    }
    return {
      key: llmApi.key || "",
      service: llmApi.service || "",
      model: llmApi.model || "",
      apiUrl: llmApi.apiUrl || "",
      apiKey: llmApi.apiKey || "",
      extraData: formatExtraDataForDisplay(llmApi.extraData),
      activate: llmApi.activate ? "\u2705" : ""
    };
  }
  function getLLMApiSelection() {
    const indices = addon.data.prefs?.tableHelper?.treeInstance?.selection.selected;
    if (!indices) {
      return [];
    }
    const keys = addon.data.llmApis?.cachedKeys || [];
    return Array.from(indices).map((i) => keys[i]) || [];
  }
  function initializeEngineConfig() {
    const { window: window2 } = addon.data.prefs ?? {};
    if (!window2) {
      ztoolkit.log("Window object not found");
      return;
    }
    setTimeout(() => {
      const engineSelect = window2.document.querySelector(
        `#zotero-prefpane-${config.addonRef}-engineSelect`
      );
      if (engineSelect) {
        const currentEngine = engineSelect.value;
        handleEngineChange(currentEngine);
      }
    }, 100);
  }
  function handleEngineChange(engine) {
    ztoolkit.log("\u5F15\u64CE\u5207\u6362\u5904\u7406\u51FD\u6570", engine);
    const { window: window2 } = addon.data.prefs ?? {};
    if (!window2) {
      ztoolkit.log("\u7A97\u53E3\u5BF9\u8C61\u4E0D\u5B58\u5728");
      return;
    }
    const pdf2xConfigs = window2.document.getElementsByClassName("pdf2x-config");
    for (const configElement of pdf2xConfigs) {
      configElement.style.display = engine === "pdf2zh_next" ? "block" : "none";
    }
    const pdf1xConfigs = window2.document.getElementsByClassName("pdf1x-config");
    for (const configElement of pdf1xConfigs) {
      configElement.style.display = engine === "pdf2zh_next" ? "none" : "block";
    }
  }
  var lang_map = {
    English: "en",
    "Simplified Chinese": "zh-CN",
    "Traditional Chinese - Hong Kong": "zh-HK",
    "Traditional Chinese - Taiwan": "zh-TW",
    Japanese: "ja",
    Korean: "ko",
    Polish: "pl",
    Russian: "ru",
    Spanish: "es",
    Portuguese: "pt",
    "Brazilian Portuguese": "pt-BR",
    French: "fr",
    Malay: "ms",
    Indonesian: "id",
    Turkmen: "tk",
    "Filipino (Tagalog)": "tl",
    Vietnamese: "vi",
    "Kazakh (Latin)": "kk",
    German: "de",
    Dutch: "nl",
    Irish: "ga",
    Italian: "it",
    Greek: "el",
    Swedish: "sv",
    Danish: "da",
    Norwegian: "no",
    Icelandic: "is",
    Finnish: "fi",
    Ukrainian: "uk",
    Czech: "cs",
    Romanian: "ro",
    Hungarian: "hu",
    Slovak: "sk",
    Croatian: "hr",
    Estonian: "et",
    Latvian: "lv",
    Lithuanian: "lt",
    Belarusian: "be",
    Macedonian: "mk",
    Albanian: "sq",
    "Serbian (Cyrillic)": "sr",
    Slovenian: "sl",
    Catalan: "ca",
    Bulgarian: "bg",
    Maltese: "mt",
    Swahili: "sw",
    Amharic: "am",
    Oromo: "om",
    Tigrinya: "ti",
    "Haitian Creole": "ht",
    Latin: "la",
    Lao: "lo",
    Malayalam: "ml",
    Gujarati: "gu",
    Thai: "th",
    Burmese: "my",
    Tamil: "ta",
    Telugu: "te",
    Oriya: "or",
    Armenian: "hy",
    "Mongolian (Cyrillic)": "mn",
    Georgian: "ka",
    Khmer: "km",
    Bosnian: "bs",
    Luxembourgish: "lb",
    Romansh: "rm",
    Turkish: "tr",
    Sinhala: "si",
    Uzbek: "uz",
    Kyrgyz: "ky",
    Tajik: "tg",
    Abkhazian: "ab",
    Afar: "aa",
    Afrikaans: "af",
    Akan: "ak",
    Aragonese: "an",
    Avaric: "av",
    Ewe: "ee",
    Aymara: "ay",
    Ojibwa: "oj",
    Occitan: "oc",
    Ossetian: "os",
    Pali: "pi",
    Bashkir: "ba",
    Basque: "eu",
    Breton: "br",
    Chamorro: "ch",
    Chechen: "ce",
    Chuvash: "cv",
    Tswana: "tn",
    "Ndebele, South": "nr",
    Ndonga: "ng",
    Faroese: "fo",
    Fijian: "fj",
    "Frisian, Western": "fy",
    Ganda: "lg",
    Kongo: "kg",
    Kalaallisut: "kl",
    "Church Slavic": "cu",
    Guarani: "gn",
    Interlingua: "ia",
    Herero: "hz",
    Kikuyu: "ki",
    Rundi: "rn",
    Kinyarwanda: "rw",
    Galician: "gl",
    Kanuri: "kr",
    Cornish: "kw",
    Komi: "kv",
    Xhosa: "xh",
    Corsican: "co",
    Cree: "cr",
    Quechua: "qu",
    "Kurdish (Latin)": "ku",
    Kuanyama: "kj",
    Limburgan: "li",
    Lingala: "ln",
    Manx: "gv",
    Malagasy: "mg",
    Marshallese: "mh",
    Maori: "mi",
    Navajo: "nv",
    Nauru: "na",
    Nyanja: "ny",
    "Norwegian Nynorsk": "nn",
    Sardinian: "sc",
    "Northern Sami": "se",
    Samoan: "sm",
    Sango: "sg",
    Shona: "sn",
    Esperanto: "eo",
    "Scottish Gaelic": "gd",
    Somali: "so",
    "Southern Sotho": "st",
    Tatar: "tt",
    Tahitian: "ty",
    Tongan: "to",
    Twi: "tw",
    Walloon: "wa",
    Welsh: "cy",
    Venda: "ve",
    Volap\u00FCk: "vo",
    Interlingue: "ie",
    "Hiri Motu": "ho",
    Igbo: "ig",
    Ido: "io",
    Inuktitut: "iu",
    Inupiaq: "ik",
    "Sichuan Yi": "ii",
    Yoruba: "yo",
    Zhuang: "za",
    Tsonga: "ts",
    Zulu: "zu"
  };
  async function checkServerConnection() {
    const serverUrl = getPref("new_serverip")?.toString() || "";
    if (!serverUrl) {
      ztoolkit.getGlobal("alert")(prefText("serverAddressRequired"));
      return;
    }
    const progressWindow = new ztoolkit.ProgressWindow(
      prefText("connectionTitle"),
      { closeOnClick: false, closeTime: -1 }
    ).createLine({
      text: prefText("checking"),
      type: "default",
      progress: 50
    });
    progressWindow.show();
    try {
      const response = await axios_default.get(`${serverUrl}/health`, {
        timeout: 1e4,
        headers: { "Content-Type": "application/json" }
      });
      if (response.status !== 200 || !response.data) {
        throw new Error(prefText("badStatus", response.status));
      }
      const data = response.data;
      if (!data || typeof data !== "object" || data.status !== "ok" && !data.version) {
        throw new Error(prefText("wrongService"));
      }
      const version3 = data.version || prefText("unknown");
      ztoolkit.log("Server connection succeeded:", data);
      progressWindow.changeLine({
        text: prefText("successLine", version3),
        type: "success",
        progress: 100
      });
      setTimeout(() => {
        progressWindow.close();
        ztoolkit.getGlobal("alert")(
          prefText("successAlert", serverUrl, version3)
        );
      }, 1e3);
    } catch (error) {
      ztoolkit.log("Server connection failed:", error);
      let errorMsg = prefText("unknownError");
      let troubleshooting = prefText("genericHelp");
      if (axios_default.isAxiosError(error)) {
        if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
          errorMsg = prefText("timeout");
          troubleshooting = prefText("timeoutHelp");
        } else if (error.response) {
          if (error.response.status === 401 || error.response.status === 403 || error.response.status === 404) {
            errorMsg = prefText("wrongService");
            troubleshooting = prefText("wrongServiceHelp", serverUrl);
          } else {
            errorMsg = prefText("responseError", error.response.status);
            troubleshooting = prefText("responseHelp");
          }
        } else if (error.request) {
          errorMsg = prefText("cannotConnect");
          troubleshooting = prefText("cannotConnectHelp", serverUrl);
        } else {
          errorMsg = error.message;
        }
      } else if (error instanceof Error) {
        errorMsg = error.message;
        if (errorMsg === prefText("wrongService")) {
          troubleshooting = prefText("wrongServiceHelp", serverUrl);
        }
      }
      progressWindow.changeLine({
        text: prefText("failureLine", errorMsg),
        type: "error",
        progress: 100
      });
      setTimeout(() => {
        progressWindow.close();
        ztoolkit.getGlobal("alert")(
          prefText("failureAlert", errorMsg, troubleshooting)
        );
      }, 1500);
    }
  }

  // src/modules/pdf2zhHelper.ts
  var PDF2zhHelperFactory = class {
    static {
      // 翻译请求本身不要重试，避免同一篇 PDF 被重复翻译。
      this.MAX_RETRIES = 1;
    }
    static {
      this.RETRY_DELAY = 2e3;
    }
    static {
      // 2秒
      // 下载/补拉附件可以多试几次：文件往往已经在 translated 目录里了。
      this.DOWNLOAD_MAX_RETRIES = 3;
    }
    static {
      // Server may report completion before its file metadata is visible to the
      // polling endpoint. Allow a short grace period, never the full job timeout.
      this.COMPLETED_FILE_GRACE_MS = 2e4;
    }
    // **** 由hooks.ts调用, main entries *****
    static async processWorker(endpoint) {
      const pane = ztoolkit.getGlobal("ZoteroPane");
      const selectedItems = pane.getSelectedItems();
      if (selectedItems.length == 0) {
        ztoolkit.getGlobal("alert")(
          getString("operation-error-no-selection")
        );
        return;
      }
      const tasks = [];
      for (const item of selectedItems) {
        try {
          const filepath = await this.validatePDFAttachment(item);
          const fileName = PathUtils.filename(filepath);
          const inputType = this.getFileType(fileName);
          const operationError = this.getOperationValidationError(
            endpoint,
            inputType
          );
          if (operationError) {
            throw new Error(operationError);
          }
          const config2 = this.getServerConfig();
          tasks.push({
            fileName,
            item,
            config: config2,
            endpoint
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : getString("operation-error-unknown");
          ztoolkit.getGlobal("alert")(
            getString("operation-error-prefix", {
              args: { message }
            })
          );
        }
      }
      if (tasks.length === 0) {
        return;
      }
      const progress = JobProgressPopup.open(
        tasks.map((task) => task.fileName)
      );
      const fileProcessor = FileProcessor.getInstance();
      try {
        const result = await fileProcessor.processBatch(tasks, (update) => {
          progress.updateFile(update);
        });
        progress.complete(result.succeeded, result.failed);
      } catch (error) {
        progress.complete(0, tasks.length);
        throw error;
      }
    }
    static operationActionLabel(endpoint) {
      if (endpoint === "crop") {
        return getString("operation-action-crop");
      }
      if (endpoint === "compare") {
        return getString("operation-action-compare");
      }
      if (endpoint === "crop-compare") {
        return getString("operation-action-crop-compare");
      }
      return getString("operation-action-translate");
    }
    static formatJobProgressText(update) {
      const action = this.operationActionLabel(update.endpoint);
      let text = "";
      switch (update.phase) {
        case "submitting":
          text = getString("operation-progress-submitting", {
            args: { fileName: update.fileName }
          });
          break;
        case "accepted":
          text = getString("operation-progress-accepted", {
            args: { fileName: update.fileName, action }
          });
          break;
        case "running": {
          const parts = [];
          if (typeof update.percent === "number" && Number.isFinite(update.percent) && update.percent > 0) {
            parts.push(`${Math.round(update.percent)}%`);
          }
          if (update.detail) {
            parts.push(update.detail);
          }
          text = getString("operation-progress-running", {
            args: {
              fileName: update.fileName,
              action,
              suffix: parts.length ? ` \xB7 ${parts.join(" \xB7 ")}` : ""
            }
          });
          break;
        }
        case "importing":
          text = getString("operation-progress-importing", {
            args: { fileName: update.fileName }
          });
          break;
        case "file-done":
          text = getString("operation-progress-file-done", {
            args: { fileName: update.fileName }
          });
          break;
        case "file-failed":
          text = getString("operation-progress-file-failed", {
            args: {
              fileName: update.fileName,
              message: this.shortProgressError(
                update.error || getString("operation-error-unknown")
              )
            }
          });
          break;
      }
      return text;
    }
    static shortProgressError(message) {
      const compact = message.replace(/\s+/g, " ").trim();
      if (compact.length <= 80) {
        return compact;
      }
      return `${compact.slice(0, 77)}...`;
    }
    static jobProgressPercent(update) {
      const fileFraction = (() => {
        if (update.phase === "submitting") {
          return 0.05;
        }
        if (update.phase === "accepted") {
          return 0.12;
        }
        if (update.phase === "running") {
          const raw = typeof update.percent === "number" && Number.isFinite(update.percent) ? Math.min(Math.max(update.percent, 0), 100) : 0;
          return 0.12 + raw / 100 * 0.73;
        }
        if (update.phase === "importing") {
          return 0.9;
        }
        return 1;
      })();
      return Math.round(
        (update.current - 1 + fileFraction) / update.total * 100
      );
    }
    static getOperationValidationError(endpoint, inputType) {
      const allowed = {
        translate: ["origin" /* ORIGIN */],
        crop: ["origin" /* ORIGIN */, "mono" /* MONO */, "dual" /* DUAL */],
        compare: ["origin" /* ORIGIN */, "dual" /* DUAL */],
        "crop-compare": ["origin" /* ORIGIN */, "dual" /* DUAL */, "dual-cut" /* DUAL_CUT */]
      };
      if (endpoint === "crop-compare" && inputType === "crop-compare" /* CROP_COMPARE */) {
        return getString("operation-error-crop-compare-terminal");
      }
      if (endpoint === "compare" && inputType === "compare" /* COMPARE */) {
        return getString("operation-error-compare-terminal");
      }
      const accepted = allowed[endpoint];
      if (!accepted || accepted.includes(inputType)) {
        return null;
      }
      const key = endpoint === "translate" ? "operation-error-translate" : endpoint === "crop" ? "operation-error-crop" : endpoint === "compare" ? "operation-error-compare" : "operation-error-crop-compare";
      return getString(key);
    }
    // 处理单个文件
    static async processSingleFile(params, onProgress) {
      const { fileName, item, config: config2, endpoint } = params;
      ztoolkit.log(
        `Processing Single File: ${fileName}, ServerConfig: ${config2}`
      );
      try {
        onProgress?.({ phase: "submitting", fileName, endpoint });
        const fileData = await this.prepareFileData(item);
        const response = await this.sendRequest(
          fileData,
          config2,
          endpoint,
          onProgress
        );
        onProgress?.({ phase: "importing", fileName, endpoint });
        await this.handleResponse(response, item, config2);
        onProgress?.({ phase: "file-done", fileName, endpoint });
      } catch (error) {
        ztoolkit.log(`\u5904\u7406\u5355\u4E2A\u6587\u4EF6\u5931\u8D25: ${fileName}, \u9519\u8BEF: ${error}`);
        const message = error instanceof Error ? error.message : getString("operation-error-unknown");
        onProgress?.({
          phase: "file-failed",
          fileName,
          endpoint,
          error: message
        });
        ztoolkit.getGlobal("alert")(
          getString("operation-error-single-file", {
            args: { fileName, message }
          })
        );
        throw error;
      }
    }
    // 准备文件数据
    static async prepareFileData(item) {
      const filepath = await this.validatePDFAttachment(item);
      const fileName = PathUtils.filename(filepath);
      const base64 = await this.readPDFAsBase64(filepath);
      return { fileName, base64 };
    }
    static async sendRequest(fileData, config2, endpoint, onProgress) {
      return this.retryOperation(async () => {
        let llmApiConfig;
        if (config2.engine == "pdf2zh") {
          llmApiConfig = this.getActiveLLMApiConfig(config2.service);
        } else {
          llmApiConfig = this.getActiveLLMApiConfig(config2.next_service);
        }
        const requestBody = {
          fileName: fileData.fileName,
          fileContent: fileData.base64,
          ...config2,
          // 发送config数据
          // 新协议：Server 立刻返回 accepted + taskId，插件再轮询。
          // 没带这个标记的旧插件（含 DCC 4.0.3）会走 Server 同步返回 fileList。
          asyncJob: true
        };
        ztoolkit.log("server config: ", config2);
        if (llmApiConfig) {
          requestBody.llm_api = llmApiConfig;
          ztoolkit.log("llmApiConfig", {
            service: llmApiConfig.service,
            model: llmApiConfig.model,
            apiUrl: llmApiConfig.apiUrl,
            apiKey: llmApiConfig.apiKey ? "********" : "",
            extraDataKeys: Object.keys(llmApiConfig.extraData || {})
          });
        }
        const response = await fetch(`${config2.serverUrl}/${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-PDF2zh-Protocol": "accepted",
            "X-PDF2zh-Plugin-Version": version2
          },
          body: JSON.stringify(requestBody),
          cache: "no-store"
        });
        const text = await response.text();
        let result;
        try {
          result = this.parseServerPayload(text);
        } catch (error) {
          ztoolkit.log(`response`, response, text);
          throw new Error(
            text || (error instanceof Error ? error.message : `\u670D\u52A1\u5668\u8FD4\u56DE\u9519\u8BEF HTTP ${response.status}`)
          );
        }
        if (!response.ok || result.status === "error" || result.status === "failed") {
          ztoolkit.log(`response`, response, result);
          throw new Error(result.message || "\u670D\u52A1\u5668\u8FD4\u56DE\u9519\u8BEF");
        }
        const taskId = this.taskIdFromPayload(result);
        if (result.status === "accepted" || taskId && result.status !== "success") {
          if (!taskId) {
            throw new Error("\u670D\u52A1\u5668\u5DF2\u63A5\u6536\u4EFB\u52A1\uFF0C\u4F46\u6CA1\u6709\u8FD4\u56DE taskId");
          }
          onProgress?.({
            phase: "accepted",
            fileName: fileData.fileName,
            endpoint
          });
          return this.waitForAcceptedTask(config2, taskId, (running) => {
            onProgress?.({
              phase: "running",
              fileName: fileData.fileName,
              endpoint,
              percent: running.percent,
              detail: running.message
            });
          });
        }
        return result;
      });
    }
    static parseServerPayload(text) {
      const trimmed = (text || "").trim();
      if (!trimmed) {
        throw new Error("\u670D\u52A1\u5668\u8FD4\u56DE\u4E3A\u7A7A");
      }
      return JSON.parse(trimmed);
    }
    static taskIdFromPayload(payload) {
      const raw = payload.taskId ?? payload.task_id ?? "";
      return typeof raw === "string" || typeof raw === "number" ? String(raw).trim() : "";
    }
    static stringList(value) {
      if (!Array.isArray(value)) {
        return [];
      }
      return value.filter(
        (item) => typeof item === "string" && item.length > 0
      );
    }
    static completedTaskPayload(task, taskId) {
      if (!task || Array.isArray(task.tasks) || Array.isArray(task.history)) {
        return null;
      }
      const id = this.taskIdFromPayload(task);
      if (!id || id !== taskId) {
        return null;
      }
      const nested = task.result && typeof task.result === "object" ? task.result : null;
      const status = String(task.status || nested?.status || "");
      const failed = status === "\u5931\u8D25" || status === "failed" || nested?.status === "error" || task.finished === true && status !== "\u5B8C\u6210" && status !== "success";
      if (failed) {
        return {
          status: "error",
          message: String(
            nested?.message || task.error || task.message || "\u7FFB\u8BD1\u5931\u8D25"
          )
        };
      }
      const files = this.stringList(nested?.fileList ?? task.fileList);
      const paths = this.stringList(nested?.filePaths ?? task.filePaths);
      const succeeded = (task.finished === true || status === "\u5B8C\u6210" || status === "success" || nested?.status === "success") && (files.length > 0 || paths.length > 0);
      if (!succeeded) {
        return null;
      }
      if (nested && nested.status === "success" && files.length > 0) {
        return nested;
      }
      return {
        status: "success",
        fileList: files,
        filePaths: paths,
        outputDir: String(nested?.outputDir || task.outputDir || "")
      };
    }
    static taskFinishedWithoutFiles(task, taskId) {
      return taskFinishedWithoutFiles(task, taskId);
    }
    static async fetchTaskRecord(config2, taskId) {
      const base = this.normalizeServerUrl(config2.serverUrl);
      try {
        const tasksRes = await fetch(`${base}/api/tasks`, {
          cache: "no-store"
        });
        const tasksData = tasksRes.ok ? await tasksRes.json() : { tasks: [] };
        const tasks = Array.isArray(tasksData.tasks) ? tasksData.tasks : [];
        const matched = tasks.find(
          (task) => this.taskIdFromPayload(task) === taskId
        );
        if (matched) {
          return matched;
        }
        const historyRes = await fetch(`${base}/api/history`, {
          cache: "no-store"
        });
        const historyData = historyRes.ok ? await historyRes.json() : { history: [] };
        const history = Array.isArray(historyData.history) ? historyData.history : [];
        return history.find(
          (task) => this.taskIdFromPayload(task) === taskId
        );
      } catch (error) {
        ztoolkit.log("\u8BFB\u53D6\u7FFB\u8BD1\u4EFB\u52A1\u72B6\u6001\u5931\u8D25:", error);
        return void 0;
      }
    }
    static async fetchCompletedTask(config2, taskId) {
      const task = await this.fetchTaskRecord(config2, taskId);
      return this.completedTaskPayload(task, taskId);
    }
    static async waitForAcceptedTask(config2, taskId, onRunning) {
      const deadline = Date.now() + 3 * 60 * 60 * 1e3;
      let completedWithoutFilesSince = null;
      while (Date.now() < deadline) {
        const task = await this.fetchTaskRecord(config2, taskId);
        const payload = this.completedTaskPayload(task, taskId);
        if (payload) {
          if (payload.status === "error") {
            throw new Error(payload.message || "\u7FFB\u8BD1\u5931\u8D25");
          }
          const files = this.stringList(payload.fileList);
          ztoolkit.log(
            `\u4EFB\u52A1 ${taskId} \u5DF2\u5B8C\u6210\uFF0C\u51C6\u5907\u5BFC\u5165 ${files.length} \u4E2A\u6587\u4EF6`
          );
          return payload;
        }
        if (this.taskFinishedWithoutFiles(task, taskId)) {
          completedWithoutFilesSince ??= Date.now();
          if (Date.now() - completedWithoutFilesSince >= this.COMPLETED_FILE_GRACE_MS) {
            throw new Error(
              getString("operation-error-completed-no-files")
            );
          }
          ztoolkit.log(
            `\u4EFB\u52A1 ${taskId} \u6807\u8BB0\u5B8C\u6210\u4F46\u8FD8\u6CA1\u6709\u6587\u4EF6\uFF0C\u7B49\u5F85 Server \u843D\u76D8`
          );
        } else {
          completedWithoutFilesSince = null;
        }
        if (task && task.finished !== true) {
          const raw = Number(task.progress);
          onRunning?.({
            percent: Number.isFinite(raw) ? raw : 0,
            message: String(task.message || task.status || "")
          });
        }
        await Zotero.Promise.delay(1e3);
      }
      throw new Error("\u7B49\u5F85\u7FFB\u8BD1\u7ED3\u679C\u8D85\u65F6");
    }
    static async handleResponse(response, item, config2) {
      ztoolkit.log("response", response);
      if (response.status === "accepted") {
        throw new Error("\u4EFB\u52A1\u4ECD\u5728\u5904\u7406\u4E2D\uFF0C\u5C1A\u672A\u5B8C\u6210");
      }
      if (response.status !== "success") {
        ztoolkit.log(`\u670D\u52A1\u5668\u8FD4\u56DE\u9519\u8BEF: ${response.message}`);
        throw new Error(String(response.message || "\u670D\u52A1\u5668\u8FD4\u56DE\u9519\u8BEF"));
      }
      if (!Array.isArray(response.fileList)) {
        ztoolkit.log(`\u670D\u52A1\u5668\u8FD4\u56DE\u7684 fileList \u4E0D\u662F\u6570\u7EC4`);
        throw new Error(getString("operation-error-no-files"));
      }
      const fileList = response.fileList;
      const outputDir = typeof response.outputDir === "string" ? response.outputDir : "";
      const filePaths = Array.isArray(response.filePaths) ? response.filePaths : [];
      const errors = [];
      let attached = 0;
      const attachKeys = /* @__PURE__ */ new Set();
      for (let i = 0; i < fileList.length; i++) {
        const fileName = fileList[i];
        const fileType = this.getFileType(fileName);
        const options = this.getPDFOptions(fileType);
        try {
          await this.fetchAndAttachPDF({
            fileName,
            config: config2,
            item,
            options,
            type: fileType,
            localPath: typeof filePaths[i] === "string" ? filePaths[i] : "",
            outputDir,
            attachKeys
          });
          attached++;
        } catch (error) {
          ztoolkit.log(`\u5904\u7406\u6587\u4EF6 ${fileName} \u65F6\u51FA\u9519:`, error);
          errors.push(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      }
      if (errors.length > 0) {
        throw new Error(
          getString("operation-error-partial-attachments", {
            args: {
              attached,
              total: fileList.length,
              message: errors.map((error) => error.message).join("; ")
            }
          })
        );
      }
      if (attached > 0) {
        return;
      }
      throw new Error(getString("operation-error-no-files"));
    }
    // ************* PDF Utils *************
    static async blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    static async safeExists(path) {
      try {
        return await IOUtils.exists(path);
      } catch (error) {
        ztoolkit.log(`\u68C0\u67E5\u8DEF\u5F84 ${path} \u65F6\u51FA\u9519:`, error);
        return false;
      }
    }
    static async getAttachmentItem(item) {
      let attachItem;
      if (item.isAttachment()) {
        attachItem = item;
      } else if (item.isRegularItem()) {
        const bestItem = await item.getBestAttachment();
        attachItem = bestItem;
      }
      if (!attachItem) return false;
      return attachItem;
    }
    static async validatePDFAttachment(item) {
      const attachItem = await this.getAttachmentItem(item);
      if (!attachItem) return "No valid attachment found";
      const filepath = attachItem.getFilePath().toString();
      if (!filepath?.endsWith(".pdf"))
        throw new Error("Please select a PDF attachment");
      const exists = await this.safeExists(filepath);
      if (!exists) throw new Error("PDF file not found");
      return filepath;
    }
    static async readPDFAsBase64(filepath) {
      const contentRaw = await IOUtils.read(filepath);
      const blob = new Blob([contentRaw], { type: "application/pdf" });
      return this.blobToBase64(blob);
    }
    static getPDFOptions(type) {
      return {
        rename: this.isTrue(getPref("rename")),
        openAfterProcess: this.isTrue(getPref(`${type}-open`))
      };
    }
    // *************** PDF文件类型管理 ***************
    // 这段逻辑应该放到server里面, 不需要在插件中
    static getFileType(fileName) {
      if (fileName.indexOf("mono.pdf") != -1) {
        return "mono" /* MONO */;
      } else if (fileName.indexOf("dual.pdf") != -1) {
        return "dual" /* DUAL */;
      } else if (fileName.indexOf("mono-cut.pdf") != -1) {
        return "mono-cut" /* MONO_CUT */;
      } else if (fileName.indexOf("dual-cut.pdf") != -1) {
        return "dual-cut" /* DUAL_CUT */;
      } else if (fileName.indexOf("crop-compare.pdf") != -1) {
        return "crop-compare" /* CROP_COMPARE */;
      } else if (fileName.indexOf("compare.pdf") != -1) {
        return "compare" /* COMPARE */;
      } else if (fileName.indexOf("cut.pdf") != -1) {
        return "origin-cut" /* ORIGIN_CUT */;
      } else {
        return "origin" /* ORIGIN */;
      }
    }
    // ************* 从 Server.py 获取PDF文件 *************
    static normalizeServerUrl(serverUrl) {
      return (serverUrl || "").trim().replace(/\/+$/, "");
    }
    static translatedFileUrl(serverUrl, fileName) {
      return `${this.normalizeServerUrl(serverUrl)}/translatedFile/${encodeURIComponent(fileName)}`;
    }
    static async downloadTranslatedFile(fileName, config2) {
      const url = this.translatedFileUrl(config2.serverUrl, fileName);
      const response = await fetch(url, { method: "GET" });
      if (!response.ok) {
        throw new Error(`\u4E0B\u8F7D\u5931\u8D25 HTTP ${response.status}: ${fileName}`);
      }
      const buffer = await response.arrayBuffer();
      if (!buffer || buffer.byteLength === 0) {
        throw new Error(`\u4E0B\u8F7D\u6587\u4EF6\u4E3A\u7A7A: ${fileName}`);
      }
      const bytes = new Uint8Array(buffer);
      validatePDFBytes(bytes, fileName);
      return bytes;
    }
    static storageLeafName(fileName) {
      const leaf = String(fileName || "").replace(/^.*[/\\]/, "").trim();
      return leaf || "translated.pdf";
    }
    static storageFileBaseName(fileName) {
      const leaf = this.storageLeafName(fileName);
      return leaf.replace(/\.pdf$/i, "") || leaf;
    }
    static safeStorageLeafName(fileName) {
      const leaf = this.storageLeafName(fileName);
      return Zotero.File.getValidFileName(leaf) || "translated.pdf";
    }
    static async writeTempPdf(bytes) {
      const tempName = `pdf2zh-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.pdf`;
      const tempPath = PathUtils.join(PathUtils.tempDir, tempName);
      await IOUtils.write(tempPath, bytes);
      return tempPath;
    }
    static localPathCandidates(fileName, localPath, outputDir) {
      const candidates = [localPath || ""];
      if (outputDir) {
        try {
          candidates.push(PathUtils.join(outputDir, fileName));
        } catch (error) {
          ztoolkit.log(
            `\u62FC\u63A5\u672C\u5730\u8F93\u51FA\u8DEF\u5F84\u5931\u8D25: ${outputDir} / ${fileName}`,
            error
          );
        }
      }
      return candidates.filter(
        (path, index, all3) => path && all3.indexOf(path) === index
      );
    }
    static async attachFromLocalPath(params) {
      const { localPath, fileName, item, config: config2, options, type, attachKeys } = params;
      if (!localPath) {
        return false;
      }
      const exists = await this.safeExists(localPath);
      if (!exists) {
        return false;
      }
      const service = config2.engine == "pdf2zh" ? config2.service : config2.next_service;
      const bytes = await IOUtils.read(localPath);
      const tempPath = await this.writeTempPdf(bytes);
      try {
        const attached = await this.addAttachment({
          item,
          filePath: tempPath,
          fileName,
          options,
          type,
          service,
          attachKeys
        });
        if (attached) {
          ztoolkit.log(`\u5DF2\u4ECE\u672C\u5730\u8DEF\u5F84\u6DFB\u52A0\u9644\u4EF6: ${localPath}`);
        }
        return attached;
      } finally {
        try {
          await IOUtils.remove(tempPath);
        } catch (error) {
          ztoolkit.log(`\u6E05\u7406\u4E34\u65F6\u6587\u4EF6\u5931\u8D25: ${tempPath}`, error);
        }
      }
    }
    static async fetchAndAttachPDF(params) {
      const { fileName, config: config2, item, options, type } = params;
      const service = config2.engine == "pdf2zh" ? config2.service : config2.next_service;
      let httpError;
      try {
        await this.retryOperation(
          async () => {
            const bytes = await this.downloadTranslatedFile(
              fileName,
              config2
            );
            const tempPath = await this.writeTempPdf(bytes);
            try {
              const attached = await this.addAttachment({
                item,
                filePath: tempPath,
                fileName,
                options,
                type,
                service,
                attachKeys: params.attachKeys
              });
              if (!attached) {
                throw new Error(`\u672A\u80FD\u6DFB\u52A0\u9644\u4EF6: ${fileName}`);
              }
              ztoolkit.log(`\u5DF2\u901A\u8FC7 HTTP \u6DFB\u52A0\u6587\u4EF6: ${fileName}`);
            } finally {
              try {
                await IOUtils.remove(tempPath);
              } catch (error) {
                ztoolkit.log(
                  `\u6E05\u7406\u4E34\u65F6\u6587\u4EF6\u5931\u8D25: ${tempPath}`,
                  error
                );
              }
            }
          },
          params.retries ?? this.DOWNLOAD_MAX_RETRIES,
          this.RETRY_DELAY
        );
        return;
      } catch (error) {
        httpError = error;
        ztoolkit.log(`HTTP \u4E0B\u8F7D\u9644\u4EF6\u5931\u8D25 ${fileName}\uFF0C\u5C1D\u8BD5\u672C\u673A\u8DEF\u5F84:`, error);
      }
      for (const localPath of this.localPathCandidates(
        fileName,
        params.localPath,
        params.outputDir
      )) {
        try {
          const attached = await this.attachFromLocalPath({
            localPath,
            fileName,
            item,
            config: config2,
            options,
            type,
            attachKeys: params.attachKeys
          });
          if (attached) {
            return;
          }
        } catch (error) {
          ztoolkit.log(`\u672C\u5730\u8DEF\u5F84\u5BFC\u5165\u5931\u8D25 ${localPath}:`, error);
        }
      }
      throw httpError instanceof Error ? httpError : new Error(`\u65E0\u6CD5\u5BFC\u5165\u6587\u4EF6: ${fileName}`);
    }
    static async addAttachment(params) {
      const { item, filePath, fileName, options, type, service, attachKeys } = params;
      const parentItemID = this.getParentItemID(item);
      let targetItem = item;
      if (item.isAttachment() && parentItemID) {
        targetItem = Zotero.Items.get(parentItemID);
      }
      const leafName = this.safeStorageLeafName(fileName);
      let newTitle = service + "-" + type;
      const shortTitle = targetItem.getField("shortTitle");
      if (shortTitle && shortTitle.length > 0) {
        newTitle = shortTitle + "-" + service + "-" + type;
      }
      const attachKey = `${parentItemID ?? "none"}::${service}::${type}::${leafName}`;
      if (attachKeys.has(attachKey)) {
        ztoolkit.log(`\u8DF3\u8FC7\u672C\u8F6E\u91CD\u590D\u9644\u4EF6: ${newTitle}`);
        return true;
      }
      const attachment = await Zotero.Attachments.importFromFile({
        file: filePath,
        parentItemID: parentItemID == void 0 ? void 0 : parentItemID,
        libraryID: item.libraryID,
        collections: parentItemID == void 0 ? this.getCollections(item) : void 0,
        fileBaseName: this.storageFileBaseName(leafName),
        title: options.rename ? newTitle : leafName
      });
      if (!attachment?.id) {
        ztoolkit.log(`importFromFile \u672A\u8FD4\u56DE\u9644\u4EF6: ${newTitle}`);
        return false;
      }
      attachKeys.add(attachKey);
      if (options.openAfterProcess) {
        try {
          Zotero.Reader.open(attachment.id);
        } catch (error) {
          ztoolkit.log(
            `\u9644\u4EF6\u5DF2\u6DFB\u52A0\uFF0C\u4F46\u6253\u5F00\u9605\u8BFB\u5668\u5931\u8D25: ${newTitle}`,
            error
          );
        }
      }
      return true;
    }
    // ************* Config *************
    static getServerConfig() {
      return {
        serverUrl: getPref("new_serverip")?.toString() || "",
        service: getPref("service")?.toString() || "",
        next_service: getPref("next_service")?.toString() || "",
        engine: getPref("engine")?.toString() || "",
        sourceLang: getPref("sourceLang")?.toString() || "",
        targetLang: getPref("targetLang")?.toString() || "",
        skipLastPages: getPref("skipLastPages")?.toString() || "",
        threadNum: getPref("threadNum")?.toString() || "",
        qps: getPref("qps")?.toString() || "10",
        poolSize: getPref("poolSize")?.toString() || "0",
        // generate
        mono: getPref("mono")?.toString() || "",
        dual: getPref("dual")?.toString() || "",
        mono_cut: getPref("mono-cut")?.toString() || "",
        dual_cut: getPref("dual-cut")?.toString() || "",
        crop_compare: getPref("crop-compare")?.toString() || "",
        compare: getPref("compare")?.toString() || "",
        // pdf1x专用配置
        babeldoc: getPref("babeldoc")?.toString() || "",
        skipSubsetFonts: getPref("skipSubsetFonts")?.toString() || "",
        fontFile: getPref("fontFile")?.toString() || "",
        // pdf2x专用配置
        // TODO: 如果noDual和noMono同时被选择, 我们默认不选择noDual
        fontFamily: getPref("fontFamily")?.toString() || "",
        dualMode: getPref("dualMode")?.toString() || "",
        transFirst: getPref("transFirst")?.toString() || "",
        ocr: getPref("ocr")?.toString() || "",
        autoOcr: getPref("autoOcr")?.toString() || "",
        noWatermark: getPref("noWatermark")?.toString() || "",
        saveGlossary: getPref("saveGlossary")?.toString() || "",
        disableGlossary: getPref("disableGlossary")?.toString() || "",
        noDual: getPref("noDual")?.toString() || "",
        noMono: getPref("noMono")?.toString() || "",
        skipClean: getPref("skipClean")?.toString() || "",
        disableRichTextTranslate: getPref("disableRichTextTranslate")?.toString() || "",
        enhanceCompatibility: getPref("enhanceCompatibility")?.toString() || "",
        translateTableText: getPref("translateTableText")?.toString() || "",
        onlyIncludeTranslatedPage: getPref("onlyIncludeTranslatedPage")?.toString() || ""
      };
    }
    static getActiveLLMApiConfig(service) {
      loadLLMApisFromPrefs();
      if (!addon.data.llmApis?.map) {
        return null;
      }
      for (const [key, llmApi] of addon.data.llmApis.map) {
        if (llmApi.activate && llmApi.service == service) {
          return {
            service: llmApi.service,
            model: llmApi.model,
            apiKey: llmApi.apiKey,
            apiUrl: llmApi.apiUrl,
            extraData: llmApi.extraData || {}
          };
        }
      }
      return null;
    }
    // **************** Utils ****************
    static isTrue(value) {
      if (value == void 0) return false;
      return value == true || value == "true" || value == "1" || value == "True" || value == "TRUE" || value == 1;
    }
    // 重试机制
    static async retryOperation(operation, maxRetries = this.MAX_RETRIES, delay = this.RETRY_DELAY) {
      let lastError;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          if (attempt === maxRetries) {
            throw lastError;
          }
          ztoolkit.log(
            `\u64CD\u4F5C\u5931\u8D25\uFF0C\u7B2C ${attempt} \u6B21\u91CD\u8BD5 (\u5171 ${maxRetries} \u6B21): ${lastError.message}`
          );
          await new Promise(
            (resolve) => setTimeout(resolve, delay * attempt)
          );
        }
      }
      throw lastError;
    }
    // 获取item的 partent itemID
    static getParentItemID(item) {
      let ID;
      if (item.isAttachment()) {
        const parentItemID = item.parentItemID;
        ID = parentItemID != null && parentItemID !== false ? parentItemID : void 0;
      } else {
        ID = item.id;
      }
      return ID;
    }
    // 获取item对应的分类(collections)
    static getCollections(item) {
      const collections = item.getCollections();
      return collections.length > 0 ? [collections[0]] : void 0;
    }
  };
  var JobProgressPopup = class _JobProgressPopup {
    constructor(fileNames) {
      this.done = 0;
      this.finishedFiles = /* @__PURE__ */ new Set();
      this.enabled = _JobProgressPopup.shouldShow();
      this.total = fileNames.length;
      this.fileIdx = [];
      this.summaryIdx = 0;
      if (!this.enabled) {
        this.window = null;
        return;
      }
      const firstOpen = !_JobProgressPopup.shared?.window;
      const shared = _JobProgressPopup.ensureWindow();
      this.window = shared.window;
      shared.batches += 1;
      shared.closeToken += 1;
      this.summaryIdx = shared.lineCount;
      this.createLine({
        text: getString("operation-batch-started", {
          args: { count: this.total }
        }),
        type: "default",
        progress: 0
      });
      this.fileIdx = fileNames.map((fileName) => {
        const idx = shared.lineCount;
        this.createLine({
          text: getString("operation-progress-waiting", {
            args: { fileName }
          }),
          type: "default",
          progress: 0
        });
        return idx;
      });
      if (firstOpen) {
        try {
          this.window.show();
        } catch (error) {
          ztoolkit.log("\u663E\u793A\u8FDB\u5EA6\u7A97\u53E3\u5931\u8D25:", error);
        }
      }
    }
    static {
      this.shared = null;
    }
    static shouldShow() {
      const raw = getPref("showProgress");
      if (raw === void 0 || raw === null || raw === "") {
        return true;
      }
      return PDF2zhHelperFactory.isTrue(raw);
    }
    static open(fileNames) {
      return new _JobProgressPopup(fileNames);
    }
    static ensureWindow() {
      if (!_JobProgressPopup.shared?.window) {
        const window2 = new ztoolkit.ProgressWindow(
          getString("operation-progress-title"),
          {
            closeOnClick: false,
            closeTime: -1,
            closeOtherProgressWindows: false
          }
        );
        _JobProgressPopup.shared = {
          window: window2,
          lineCount: 0,
          batches: 0,
          closeToken: 0
        };
      }
      return _JobProgressPopup.shared;
    }
    createLine(line) {
      if (!this.window || !_JobProgressPopup.shared) {
        return;
      }
      this.window.createLine(line);
      _JobProgressPopup.shared.lineCount += 1;
    }
    changeLine(idx, line) {
      if (!this.window) {
        return;
      }
      try {
        this.window.changeLine({ idx, ...line });
        this.window.show();
      } catch (error) {
        ztoolkit.log("\u66F4\u65B0\u8FDB\u5EA6\u7A97\u53E3\u5931\u8D25:", error);
      }
    }
    updateFile(update) {
      if (!this.enabled) {
        return;
      }
      const idx = this.fileIdx[update.current - 1];
      if (idx === void 0) {
        return;
      }
      const fileProgress = PDF2zhHelperFactory.jobProgressPercent({
        ...update,
        current: 1,
        total: 1
      });
      this.changeLine(idx, {
        text: PDF2zhHelperFactory.formatJobProgressText(update),
        type: update.phase === "file-failed" ? "error" : update.phase === "file-done" ? "success" : "default",
        progress: fileProgress
      });
      if (update.phase === "file-done" || update.phase === "file-failed") {
        if (!this.finishedFiles.has(update.current)) {
          this.finishedFiles.add(update.current);
          this.done = Math.min(this.total, this.done + 1);
        }
      }
      const overall = Math.min(
        99,
        Math.round(
          (this.done + (this.finishedFiles.has(update.current) ? 0 : fileProgress / 100)) / this.total * 100
        )
      );
      const percentText = update.phase === "running" && typeof update.percent === "number" && update.percent > 0 ? ` \xB7 ${Math.round(update.percent)}%` : "";
      this.changeLine(this.summaryIdx, {
        text: getString("operation-progress-summary", {
          args: { done: this.done, total: this.total }
        }) + percentText,
        type: "default",
        progress: overall
      });
    }
    complete(succeeded, failed) {
      if (!this.enabled) {
        return;
      }
      this.changeLine(this.summaryIdx, {
        text: getString("operation-batch-completed", {
          args: {
            succeeded,
            failed,
            kind: failed > 0 && succeeded === 0 ? "failed" : failed > 0 ? "mixed" : "success"
          }
        }),
        type: failed > 0 && succeeded === 0 ? "error" : failed > 0 ? "default" : "success",
        progress: 100
      });
      const shared = _JobProgressPopup.shared;
      if (!shared) {
        return;
      }
      shared.batches = Math.max(0, shared.batches - 1);
      if (shared.batches > 0) {
        return;
      }
      const token = ++shared.closeToken;
      Zotero.Promise.delay(8e3).then(() => {
        if (!_JobProgressPopup.shared || _JobProgressPopup.shared.closeToken !== token || _JobProgressPopup.shared.batches > 0) {
          return;
        }
        try {
          _JobProgressPopup.shared.window?.close();
        } catch (error) {
          ztoolkit.log("\u5173\u95ED\u8FDB\u5EA6\u7A97\u53E3\u5931\u8D25:", error);
        }
        _JobProgressPopup.shared = null;
      });
    }
  };

  // src/utils/ztoolkit.ts
  function createZToolkit() {
    const _ztoolkit = new MyToolkit();
    initZToolkit(_ztoolkit);
    return _ztoolkit;
  }
  function initZToolkit(_ztoolkit) {
    const env = "production";
    _ztoolkit.basicOptions.log.prefix = `[${config.addonName}]`;
    _ztoolkit.basicOptions.log.disableConsole = env === "production";
    _ztoolkit.UI.basicOptions.ui.enableElementJSONLog = env === "development";
    _ztoolkit.UI.basicOptions.ui.enableElementDOMLog = env === "development";
    _ztoolkit.basicOptions.debug.disableDebugBridgePassword = env === "development";
    _ztoolkit.ProgressWindow.setIconURI(
      "default",
      `chrome://${config.addonRef}/content/icons/favicon.png`
    );
  }
  var MyToolkit = class extends BasicTool {
    constructor() {
      super();
      this.UI = new UITool(this);
      this.Menu = new MenuManager(this);
      this.Clipboard = ClipboardHelper;
      this.FilePicker = FilePickerHelper;
      this.ProgressWindow = ProgressWindowHelper;
      this.VirtualizedTable = VirtualizedTableHelper;
      this.Dialog = DialogHelper;
      this.LargePref = LargePrefHelper;
      this.Guide = GuideHelper;
    }
    unregisterAll() {
      unregister(this);
    }
  };

  // src/hooks.ts
  async function onStartup() {
    await Promise.all([
      Zotero.initializationPromise,
      Zotero.unlockPromise,
      Zotero.uiReadyPromise
    ]);
    initLocale();
    PDF2zhBasicFactory.registerPrefs();
    await Promise.all(
      Zotero.getMainWindows().map((win) => onMainWindowLoad(win))
    );
  }
  async function onMainWindowLoad(win) {
    addon.data.ztoolkit = createZToolkit();
    PDF2zhUIFactory.registerRightClickMenuItem();
    await Zotero.Promise.delay(200);
    initTableUI();
  }
  async function onPrefsEvent(type, data) {
    switch (type) {
      case "load":
        registerPrefsScripts(data.window);
        break;
      default:
        return;
    }
  }
  async function onMainWindowUnload(win) {
    ztoolkit.unregisterAll();
    addon.data.dialog?.window?.close();
  }
  function onShutdown() {
    ztoolkit.unregisterAll();
    addon.data.dialog?.window?.close();
    addon.data.alive = false;
    delete Zotero[addon.data.config.addonInstance];
  }
  async function onNotify(event, type, ids, extraData) {
    return;
  }
  function onShortcuts(type) {
    switch (type) {
      default:
        break;
    }
  }
  function onDialogEvents(type) {
    switch (type) {
      case "translatePDF":
        PDF2zhHelperFactory.processWorker("translate");
        break;
      case "cropPDF":
        PDF2zhHelperFactory.processWorker("crop");
        break;
      case "crop-comparePDF":
        PDF2zhHelperFactory.processWorker("crop-compare");
        break;
      case "comparePDF":
        PDF2zhHelperFactory.processWorker("compare");
        break;
      default:
        break;
    }
  }
  var hooks_default = {
    onStartup,
    onShutdown,
    onMainWindowLoad,
    onMainWindowUnload,
    onNotify,
    onPrefsEvent,
    onShortcuts,
    onDialogEvents
  };

  // src/addon.ts
  var Addon = class {
    constructor() {
      this.data = {
        alive: true,
        config,
        env: "production",
        ztoolkit: createZToolkit(),
        llmApis: {
          map: /* @__PURE__ */ new Map(),
          cachedKeys: []
        }
      };
      this.hooks = hooks_default;
      this.api = {};
    }
  };
  var addon_default = Addon;

  // src/index.ts
  var basicTool2 = new BasicTool();
  if (!basicTool2.getGlobal("Zotero")[config.addonInstance]) {
    _globalThis.addon = new addon_default();
    defineGlobal("ztoolkit", () => {
      return _globalThis.addon.data.ztoolkit;
    });
    Zotero[config.addonInstance] = addon;
  }
  function defineGlobal(name, getter) {
    Object.defineProperty(_globalThis, name, {
      get() {
        return getter ? getter() : basicTool2.getGlobal(name);
      }
    });
  }
})();

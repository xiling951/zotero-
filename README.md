# Zotero 阅读器与 AI 插件整合包

面向 Windows x64 的 Zotero 阅读环境快照，包含当前阅读器、四个已安装插件、本地 PDF 翻译服务及公式排版修复源码。发布基线：2026-10-20。

**[下载完整整合包](https://github.com/xiling951/zotero-/releases/latest)**。程序二进制放在 Release，插件与可维护的本机修复代码同时保存在仓库。

本仓库是软件与改进方案的可分享版本，不是个人 Zotero 数据备份。下载后得到全新文献库，需要自行填写 AI 服务地址、模型和 API Key。

## 当前包含什么

- **Zotero 10.0.6，Windows x64**：Release 内提供干净的程序文件。
- **Zotero AI Sidebar 0.8.18**：PDF 伴读、选段提问、模型配置和笔记入口。
- **Translate for Zotero 2.4.8**：阅读中的文字翻译。
- **Zotero PDF2zh 4.1.7**：连接本地全文翻译服务。
- **AI 侧栏深色模式 1.0.3**：侧栏与模型设置页的主题及布局修复；1.0.3 只在侧栏样式表或排版菜单出现时刷新，不再随主窗口每次 DOM 变化重算（流式回答时尤为明显）。
- **本地 PDF2zh 服务与公式保护**：位图数学符号预处理、整页对照、公式数量和可检测重叠/越界检查。

完整版本、插件 ID、来源和 SHA-256 见 [manifest.json](manifest.json)。原发布中的插件字节保持不变；解包源码在 [src/plugins](src/plugins)。本地 Python 修复在 [tools](tools) 和 [pdf2zh/server](pdf2zh/server)。

**尚未实现：扫描 PDF 一键添加文字层。** 现有 AI 文档解析与 PDF 翻译中的 OCR 选项，不等于已经具备扫描教材文字层功能。不会把规划中的功能描述为已安装。

## 使用完整 Release 整合包

1. 从 Release 下载 `Zotero-Reader-and-Plugins-2026.10.20.zip` 并解压到可写目录。
2. 已具备 Git、Python 环境不代表已具备翻译依赖；安装 [uv](https://docs.astral.sh/uv/getting-started/installation/)，在解压目录运行：

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Setup.ps1
   ```

   该脚本联网准备独立 Python 3.12 环境和锁定的翻译依赖。首次下载可能需要时间；不会安装规划中的 OCR 模型。

3. 启动独立环境：

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Start-Zotero.ps1
   ```

4. 在 Zotero 设置中自行配置 AI Sidebar、翻译服务和 API Key。PDF2zh 选择 `pdf2zh_next`、本机服务地址 `http://127.0.0.1:8890`，并填写自己的翻译服务账号。不同模型服务的联网能力与额度由相应提供方决定。

运行数据放在本项目的 `runtime/`，不会读取旧电脑配置目录或自动导入私人文献。不要把新产生的运行目录提交回 Git。若 8890 已被另一套翻译服务占用，启动脚本会停止并提示；可指定 `-ServerPort`，并在 PDF2zh 设置中同步修改服务地址。

启动脚本的其他选项：

| 选项 | 作用 |
| --- | --- |
| `-ReaderOnly` | 只启动阅读器，不启动翻译服务 |
| `-ServerTimeoutSec 120` | 等待翻译服务就绪的秒数，默认 60；首次导入依赖较慢的电脑可调大 |
| `-StopServerOnExit` | 脚本保持运行，关闭 Zotero 后自动停止它启动的翻译服务 |

翻译服务在后台运行，进程号记录在 `runtime/pdf2zh.pid`；需要时运行 `scripts\Stop-Translation.ps1` 停止（只会结束本项目虚拟环境中的进程）。服务未能就绪时，脚本会结束该进程并显示错误日志末尾；上一次的日志保留为 `runtime/pdf2zh.log.1`。同一配置目录的 Zotero 已打开时，脚本不会重复启动。

浏览器打开 `http://127.0.0.1:8890/` 可查看翻译进度面板：跟随系统深浅色，运行中任务实时计时，服务重启后自动重连。

完整包已带阅读器程序。只克隆源码的用户，可将 Release 的 `Zotero-10.0.6-win-x64-clean.zip` 放在项目根目录，再执行 Setup；或通过 `-AppArchive` 指定文件。`-SkipPython` 仅准备独立阅读器与插件，全文翻译服务仍需后续安装依赖。从仓库运行 Setup 安装的是仓库内的插件版本（深色模式 1.0.3），比 2026.10.20 Release 压缩包中的 1.0.2 新。

## 隐私与发布边界

本次发布采用文件白名单重新组装，**没有复制现用的 profile 或 library**。不包含文献 PDF、笔记与批注数据库、聊天、解析缓存、译文、截图、日志、浏览器 Cookie、同步账号或 API Key。

仓库中的配置仅来自经过检查的示例模板。`runtime/`、真实配置文件、虚拟环境、翻译结果和日志均由 `.gitignore` 排除；Git 提交使用仓库专用名称和 GitHub noreply 邮箱，不携带本机 Git 作者邮箱。

发布前会扫描仓库及 Release 压缩包，包括插件内部文件；扫描摘要见 [docs/privacy-report.json](docs/privacy-report.json)。扫描只能降低误传风险，后续贡献仍应遵守 [隐私检查说明](docs/PRIVACY.md)。不要上传自己的配置目录来报告问题。

## 下一步改进方向

详细方案：[Zotero 扫描 PDF 文字层与 AI 选段提问实施方案](docs/zotero-pdf-text-layer-implementation-plan.zh-CN.md)。原 DeepTutor 计划作为设计参考保存在 [docs/pdf-text-layer-implementation-plan.zh-CN.md](docs/pdf-text-layer-implementation-plan.zh-CN.md)，本项目的实施主体是 Zotero。

按以下顺序推进：

1. **先固定当前源码基线。** 当前实际 AI Sidebar 为 0.8.18，历史本机记录曾是 0.8.17.5。旧分卷及联网定制源码留在 `development/legacy-local-patches/` 作为参考；不能据此假定它们已经包含在当前 XPI 中。先核对实际菜单、选区、联网、笔记和分卷，再合并差异。
2. **验证 OCR 内核。** 独立 RapidOCR CPU 环境，处理中文、英文、长行、旋转页和图注；只增加不可见文字，保持扫描页面外观。先完成样本验收，再处理整本教材。
3. **新增独立文字层插件和持久任务服务。** 支持当前页、页范围、全书、真实进度、取消、断点续跑、失败页重试，不依赖聊天会话或模型 API Key。
4. **将 OCR 副本放到同一文献条目下。** 保留原件、来源关系、页序和旧批注，不自动迁移 Zotero 数据库批注，不覆盖原附件。
5. **接通 AI 选段闭环。** 选区、页码和缓存绑定实际 OCR 附件；选段提问不要求先完成 MinerU 全书解析，也不受其单文件页数限制阻塞。
6. **验证质量和插件共存。** 检查中文选择/复制/搜索、位置、页面渲染、附件去重、中断恢复、深浅色界面和已有翻译保护，再交付真实教材验收报告。

实施方案里出现的样本页和历史检查数据仅是设计依据。真实教材、个人条目编号、资料 ID 和私人路径不随仓库发布；下一轮执行时由用户选择本地文件并重新读取页数和哈希。

## 开发与复现

```text
plugins/                      当前四个插件 XPI
src/plugins/                  XPI 中对应的解包脚本与资源
pdf2zh/server/                本地翻译服务与示例配置
pdf2zh/requirements-managed-lock.txt
pdf2zh/layout-runtime-requirements.txt
tools/                        公式保护、PDF 分卷内核、XPI 校验与打包
scripts/                      安装、启动与停止翻译服务脚本
tests/js/                     本地维护插件的 jsdom 测试
development/legacy-local-patches/
docs/                         方案、隐私与验证说明
licenses/                     上游许可证
```

翻译原环境与独立版面内核分别安装，避免把旧 `pdf2zh-next` 的依赖约束直接升级破坏。当前保护适用于已配置的 OpenAI、DeepSeek 或 OpenAICompatible 翻译路径；复杂版式不能保证百分之百还原，重要公式仍需对照原文。

常用检查（CI 在每次推送时于 Windows 上执行同样的步骤，见 [.github/workflows/ci.yml](.github/workflows/ci.yml)）：

```powershell
python tools\plugin_xpi.py check                     # XPI、manifest.json 与 src/plugins 逐字节一致
python tools\privacy_scan.py . --report $env:TEMP\privacy.json
cd pdf2zh\server; python -m pytest tests -q          # 合成 PDF 回归测试
cd tests\js; npm ci; npm test                        # 深色模式插件 jsdom 测试
```

修改 `src/plugins/<id>` 后，先在插件自己的 `manifest.json` 提升版本号，再运行 `python tools\plugin_xpi.py build <id>`：固定时间戳与文件顺序重建 XPI（同一源码总得到同一 SHA-256），并更新根目录 `manifest.json`。只重建确实修改过的插件，上游 XPI 保持原字节。`.gitattributes` 禁止 Git 改写 `src/plugins` 的换行符，否则 Windows 的 `core.autocrlf` 会让源码与 XPI 不一致。

公式预处理先用 PyMuPDF 找出含小位图的页面，只对这些页面运行 pypdf 内容流解析；结果与逐页解析完全相同，300 页合成文档上从约 5.7 秒降到 1.6 秒。

Release 还提供上游源码快照，以便获取原始开发工程。部署包中的解包 JavaScript 与当前插件一一对应；不要将它误称为完整 TypeScript 开发工程。后续改进应在对应上游源码中维护，保留本机修改并重建 XPI。

## 来源与许可

这是整合与本地改进项目，并非 Zotero 官方发行版。上游作者署名、商标与组件许可证保留，见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 和 [licenses](licenses)。各组件分别适用其原许可证，不把整个整合包视为单一自有软件。

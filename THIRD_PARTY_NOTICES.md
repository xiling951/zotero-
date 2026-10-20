# Third-party notices and source

This repository is an integration snapshot, not an official Zotero distribution. Each component retains its own copyright, license, author attribution and trademark notices. Upstream license texts are provided in `licenses/`; the Zotero application also includes the Mozilla platform notices in its original resources.

- Zotero 10.0.6: https://github.com/zotero/zotero/tree/10.0.6 — upstream source archive is included in the Release. See `licenses/zotero-LICENSE.txt` and the application's built-in licensing page.
- Zotero AI Sidebar 0.8.18: https://github.com/xuhan-rgb/zotero-ai-sidebar/tree/v0.8.18 — AGPL-3.0; see `licenses/ai-sidebar-LICENSE.txt`.
- Zotero PDF2zh 4.1.7: https://github.com/guaguastandup/zotero-pdf2zh/tree/v4.1.7 — AGPL-3.0; see `licenses/pdf2zh-LICENSE.txt`.
- Translate for Zotero 2.4.8: https://github.com/windingwind/zotero-pdf-translate/tree/v2.4.8 — AGPL-3.0; see `licenses/pdf-translate-LICENSE.txt`.
- Local sidebar dark theme and PDF layout changes are distributed with their corresponding readable scripts. Modifications derived from an upstream component follow that component's license. Standalone original integration scripts and documentation in this repository are released under AGPL-3.0-or-later; see `licenses/ai-sidebar-LICENSE.txt` for the license text.

The Python dependency lock is an installation specification, not a copy of the Python environment. Downloaded dependencies (including BabelDOC, PyMuPDF and their dependencies) retain their respective licenses. The OCR implementation is a plan, not a bundled OCR engine or model.

The current deployed XPI contents are unpacked under `src/plugins/`. The Release additionally provides the upstream source snapshots for the stated tags. The deployable local backend and tools are in this repository; the full original frontend development projects are in the upstream snapshots.

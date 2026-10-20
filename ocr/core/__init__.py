"""Offline OCR text layer for scanned PDFs (milestone M1 of
docs/zotero-pdf-text-layer-implementation-plan.zh-CN.md).

Adds invisible, selectable text on top of scanned pages without changing how
any page looks. Independent of Zotero, chat models and API keys.
"""

# Bump when recognition handling, placement or the writer changes: page
# checkpoints from another version are recomputed instead of reused.
CORE_VERSION = '1'

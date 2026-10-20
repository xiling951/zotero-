"""Decide per page whether OCR is needed."""
from dataclasses import dataclass, field
import numpy as np
import pymupdf

# A page with this many visible native characters already has a text layer.
NATIVE_MIN_CHARS = 120
# Fraction of dark pixels below which an image-free page counts as blank.
BLANK_MAX_INK = 0.0005


@dataclass
class PageClass:
    kind: str  # 'scan' | 'native_text' | 'existing_ocr' | 'blank'
    native_chars: int = 0
    invisible_chars: int = 0
    # Visible native text (page numbers, watermarks) that OCR must not repeat.
    native_rects: list = field(default_factory=list)


def classify_page(page):
    native_chars = invisible_chars = 0
    native_rects = []
    for span in page.get_texttrace():
        chars = [char for char in span['chars'] if not chr(char[0]).isspace()]
        if span.get('type') == 3:  # render mode 3: invisible, e.g. an OCR layer
            invisible_chars += len(chars)
        else:
            native_chars += len(chars)
            native_rects.extend(pymupdf.Rect(char[3]) for char in chars)
    if invisible_chars >= 10:
        # Never stack a second hidden layer on top of an unknown one.
        return PageClass('existing_ocr', native_chars, invisible_chars)
    if native_chars >= NATIVE_MIN_CHARS:
        return PageClass('native_text', native_chars)
    if not page.get_images() and not page.get_drawings() and _ink(page) < BLANK_MAX_INK:
        return PageClass('blank', native_chars)
    return PageClass('scan', native_chars, invisible_chars, native_rects)


def _ink(page):
    pix = page.get_pixmap(dpi=36, colorspace=pymupdf.csGRAY, alpha=False, annots=False)
    gray = np.frombuffer(pix.samples, dtype=np.uint8)
    return float((gray < 200).mean()) if gray.size else 0.0

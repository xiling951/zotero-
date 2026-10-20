"""Write recognized lines as invisible text (render mode 3)."""
import pymupdf
from .geometry import placement

FONT_NAME = 'ocrtext'


def load_font():
    """Droid Sans Fallback bundled with PyMuPDF: CJK plus Latin glyphs. It is
    embedded once, shared by all pages and subset before saving."""
    return pymupdf.Font('cjk')


def write_page(page, lines, font):
    """lines: [{'quad': view quad, 'text': str}] in reading order.
    Returns (placed, unplaced) lists for the report."""
    placed, unplaced = [], []
    if not lines:
        return placed, unplaced
    page.insert_font(fontname=FONT_NAME, fontbuffer=font.buffer)
    for line in lines:
        text = line['text']
        missing = sorted({char for char in text if not char.isspace() and not font.has_glyph(ord(char))})
        where = placement(line['quad'], text, font)
        if where is None:
            unplaced.append({**line, 'reason': 'degenerate_or_vertical_box'})
            continue
        page.insert_text(where.origin, text, fontname=FONT_NAME, fontsize=where.fontsize,
                         render_mode=3, morph=(where.origin, where.morph))
        placed.append({**line, 'rect': list(where.rect), 'missingGlyphs': missing})
    return placed, unplaced

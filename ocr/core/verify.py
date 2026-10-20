"""Acceptance checks for an OCR result against its source PDF.

Extractable text alone is not success: the result must look identical, keep
the document structure, and every hidden line must be found where it was
recognized.
"""
import re
import unicodedata
import numpy as np
import pymupdf

RENDER_DPI = 72


def normalize(text):
    return re.sub(r'\s+', '', unicodedata.normalize('NFKC', text or ''))


def _structure(doc):
    return {
        'pages': len(doc),
        'toc': doc.get_toc(simple=False),
        'labels': doc.get_page_labels(),
        'pageGeometry': [(tuple(p.mediabox), tuple(p.cropbox), p.rotation) for p in doc],
        'links': [len(p.get_links()) for p in doc],
        'annots': [len(list(p.annots() or [])) for p in doc],
    }


def _changed_pixels(a, b):
    first, second = (page.get_pixmap(dpi=RENDER_DPI, alpha=False, annots=True) for page in (a, b))
    if (first.width, first.height) != (second.width, second.height):
        return first.width * first.height
    left = np.frombuffer(first.samples, dtype=np.uint8).reshape(first.height, first.width, first.n)
    right = np.frombuffer(second.samples, dtype=np.uint8).reshape(second.height, second.width, second.n)
    return int(np.count_nonzero((left != right).any(axis=2)))


def _outside(page):
    bounds, count = page.rect, 0
    for block in page.get_text('rawdict')['blocks']:
        for row in block.get('lines', []):
            for span in row['spans']:
                for char in span['chars']:
                    box = pymupdf.Rect(char['bbox'])
                    if not box.is_empty and not bounds.contains(box):
                        count += 1
    return count


def _found(page, line):
    """The line's text must be extractable from (around) its own rectangle."""
    rect = pymupdf.Rect(line['rect'])
    margin = max(2.0, rect.height * 0.25)
    clip = pymupdf.Rect(rect.x0 - margin, rect.y0 - margin, rect.x1 + margin, rect.y1 + margin)
    return normalize(line['text']) in normalize(page.get_textbox(clip))


def verify(source_path, result_path, written):
    """written: {page_index: [placed lines]} for the pages that received text."""
    problems = []
    pages = {}
    with pymupdf.open(source_path) as source, pymupdf.open(result_path) as result:
        before, after = _structure(source), _structure(result)
        for key in before:
            if before[key] != after[key]:
                problems.append(f'document {key} changed')
        if len(source) != len(result):
            return {'passed': False, 'problems': problems, 'pages': pages}
        for index, lines in sorted(written.items()):
            src, out = source[index], result[index]
            changed = _changed_pixels(src, out)
            misplaced = [line['text'] for line in lines if not _found(out, line)]
            # Only characters pushed off the page by the new layer count.
            outside = max(0, _outside(out) - _outside(src))
            ok = changed == 0 and not misplaced and outside == 0
            pages[str(index + 1)] = {'passed': ok, 'changedPixels': changed, 'misplacedLines': misplaced[:10],
                                'misplacedCount': len(misplaced), 'charsOutsidePage': outside}
            if not ok:
                problems.append(f'page {index + 1} failed verification')
    return {'passed': not problems, 'problems': problems, 'pages': pages,
            'scope': 'rendering identical at 72 DPI, structure preserved, every hidden line extractable at its own position'}

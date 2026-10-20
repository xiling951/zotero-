"""Map OCR quads to hidden-text placement and order lines for reading.

All coordinates here are PyMuPDF *view* coordinates: the page as displayed,
after /Rotate and relative to the CropBox, y pointing down. That is what a
rendered pixmap shows, and Page.insert_text accepts the same space and applies
/Rotate itself (verified for 0/90/180/270 and offset CropBoxes in the tests).
"""
from dataclasses import dataclass
import math
import pymupdf


@dataclass(frozen=True)
class Placement:
    origin: pymupdf.Point
    fontsize: float
    morph: pymupdf.Matrix
    rect: pymupdf.Rect


def pixel_quad_to_view(quad, scale):
    """Rendered pixmaps use matrix Matrix(scale, scale) with no offset."""
    return tuple((x / scale, y / scale) for x, y in quad)


def quad_rect(quad):
    xs = [x for x, _ in quad]
    ys = [y for _, y in quad]
    return pymupdf.Rect(min(xs), min(ys), max(xs), max(ys))


def placement(quad, text, font):
    """Fit text exactly into quad (tl, tr, br, bl): font size from the line
    height, horizontal scale from the width, rotation from the baseline.
    Returns None for degenerate or vertical boxes, which go to the report."""
    tl, tr, br, bl = (pymupdf.Point(point) for point in quad)
    baseline = br - bl
    width = math.hypot(baseline.x, baseline.y)
    if width < 1 or not text:
        return None
    cos, sin = baseline.x / width, baseline.y / width
    # Height = distance of the top-left corner from the baseline.
    height = abs((tl - bl).x * -sin + (tl - bl).y * cos)
    if height < 1 or (height > 2 * width and len(text) > 1):
        return None  # vertical text is not supported in this version
    fontsize = height / (font.ascender - font.descender)
    natural = font.text_length(text, fontsize=fontsize)
    if natural <= 0:
        return None
    up = pymupdf.Point(sin, -cos)
    origin = bl + up * (-font.descender * fontsize)
    # morph is applied in PDF (y-up) orientation, hence the sign of sin.
    scale = width / natural
    morph = pymupdf.Matrix(scale * cos, -scale * sin, sin, cos, 0, 0)
    return Placement(origin, fontsize, morph, quad_rect(quad))


def reading_order(lines, page_width):
    """Order lines top-down; within a band between full-width lines, read a
    left column completely before the right one, so copying a paragraph from
    a two-column page does not interleave both columns."""
    if not lines:
        return []
    rects = [quad_rect(line['quad']) for line in lines]
    middle = page_width / 2
    narrow = [rect.width < 0.55 * page_width and (rect.x1 <= middle + 0.04 * page_width or rect.x0 >= middle - 0.04 * page_width)
              for rect in rects]
    two_columns = sum(narrow) >= 0.6 * len(lines) and any(r.x1 <= middle for r, n in zip(rects, narrow) if n) \
        and any(r.x0 >= middle for r, n in zip(rects, narrow) if n)
    indexed = sorted(range(len(lines)), key=lambda i: (rects[i].y0, rects[i].x0))
    if not two_columns:
        return [lines[i] for i in indexed]
    ordered, band = [], []

    def flush():
        left = [i for i in band if (rects[i].x0 + rects[i].x1) / 2 < middle]
        right = [i for i in band if i not in left]
        ordered.extend(lines[i] for i in left + right)
        band.clear()

    for i in indexed:
        if narrow[i]:
            band.append(i)
        else:  # a heading or figure caption spanning both columns
            flush()
            ordered.append(lines[i])
    flush()
    return ordered

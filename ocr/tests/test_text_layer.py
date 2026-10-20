"""Synthetic scans only: no user documents. Most tests use a scripted engine;
the RapidOCR test runs when rapidocr_onnxruntime is installed."""
from pathlib import Path
import difflib
import importlib.util
import json
import sys
import tempfile
import unittest
import numpy as np
import pymupdf

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from core.engine import OcrLine  # noqa: E402
from core.geometry import reading_order  # noqa: E402
from core.pipeline import JobError, Options, parse_pages, run  # noqa: E402
from core.verify import normalize  # noqa: E402
from core.writer import load_font, write_page  # noqa: E402

LINES = [
    ('第二章 纳米微粒的结构与物理特性', 'china-s', 16),
    ('纳米材料的表面效应与量子尺寸效应十分显著。', 'china-s', 12),
    ('Surface effects of nanomaterials are significant.', 'helv', 11),
    ('图 2.1 不同粒径下比表面积的变化', 'china-s', 10),
]


def native_page(document, lines=LINES, width=595, height=842):
    page = document.new_page(width=width, height=height)
    y = 110
    for text, font, size in lines:
        page.insert_text((60, y), text, fontname=font, fontsize=size)
        y += size * 3
    return page


def ground_truth(page):
    rows = []
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            text = ''.join(span['text'] for span in line['spans']).strip()
            if text:
                rows.append((pymupdf.Rect(line['bbox']), text))
    return rows


def _render(page, dpi=40):
    pix = page.get_pixmap(dpi=dpi, alpha=False, colorspace=pymupdf.csGRAY)
    return np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width).astype(int)


def build_scan(path, rotation=0, crop=False, extra_native=None, pages=1, toc=False):
    """Image-only pages whose *view* equals an upright native page, stored with
    /Rotate and/or an offset CropBox. Returns ground-truth lines (view space)."""
    native = pymupdf.open()
    source = native_page(native)
    truth = ground_truth(source)
    pix = source.get_pixmap(dpi=150, alpha=False)
    upright = pymupdf.open()
    upright.new_page(width=595, height=842).insert_image(pymupdf.Rect(0, 0, 595, 842), pixmap=pix)
    result = pymupdf.open()
    for _ in range(pages):
        width, height = (842, 595) if rotation in (90, 270) else (595, 842)
        for content_rotation in (rotation, -rotation % 360):
            pad = (60, 50) if crop else (0, 0)
            page = result.new_page(width=width + 2 * pad[0], height=height + 2 * pad[1])
            target = pymupdf.Rect(pad[0], pad[1], pad[0] + width, pad[1] + height)
            page.show_pdf_page(target, upright, 0, rotate=content_rotation)
            if crop:
                page.set_cropbox(target)
            page.set_rotation(rotation)
            if _render(page).shape == _render(upright[0]).shape and np.abs(_render(page) - _render(upright[0])).mean() < 2:
                break
            result.delete_page(-1)
        else:
            raise AssertionError('fixture could not reproduce the upright view')
        if extra_native:
            page.insert_text(*extra_native, fontname='helv', fontsize=9)
    if toc:
        result.set_toc([[1, 'Chapter', 1]])
        result[0].insert_link({'kind': pymupdf.LINK_URI, 'from': pymupdf.Rect(10, 10, 50, 30), 'uri': 'https://example.org'})
    result.save(path)
    return truth


class ScriptedEngine:
    """Returns given view-space lines as pixel quads, page after page."""
    identity = {'engine': 'scripted', 'version': '1'}

    def __init__(self, pages, dpi=200, fail_on=(), interrupt_on=None):
        self.pages, self.scale, self.calls = list(pages), dpi / 72, 0
        self.fail_on, self.interrupt_on = set(fail_on), interrupt_on

    def recognize(self, image):
        self.calls += 1
        if self.calls == self.interrupt_on:
            raise KeyboardInterrupt
        if self.calls in self.fail_on:
            raise RuntimeError('engine crashed')
        lines = self.pages[(self.calls - 1) % len(self.pages)]
        s = self.scale
        return [OcrLine(((r.x0 * s, r.y0 * s), (r.x1 * s, r.y0 * s), (r.x1 * s, r.y1 * s), (r.x0 * s, r.y1 * s)), text, 0.99)
                for r, text in lines]


def hidden_lines(page):
    rows = []
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            text = ''.join(span['text'] for span in line['spans']).strip()
            if text:
                rows.append((pymupdf.Rect(line['bbox']), text))
    return rows


def iou(a, b):
    inter = (a & b).get_area()
    return inter / max(1e-6, a.get_area() + b.get_area() - inter)


class TextLayerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.dir = Path(self.temp.name)

    def test_page_ranges(self):
        self.assertEqual(parse_pages('', 3), [0, 1, 2])
        self.assertEqual(parse_pages('2-3, 1，3', 5), [0, 1, 2])
        for bad in ('0', '4-2', '1-9', 'abc', ' , '):
            with self.assertRaises(JobError):
                parse_pages(bad, 5)

    def test_placement_matches_quad_for_rotations_and_cropboxes(self):
        font = load_font()
        quad = [[100, 200], [300, 210], [298.5, 240], [98.5, 230]]  # slightly skewed scan line
        expected = pymupdf.Rect(98.5, 200, 300, 240)
        for rotation in (0, 90, 180, 270):
            for crop in (False, True):
                document = pymupdf.open()
                page = document.new_page(width=600, height=800)
                if crop:
                    page.set_cropbox(pymupdf.Rect(50, 70, 550, 770))
                page.set_rotation(rotation)
                placed, unplaced = write_page(page, [{'quad': quad, 'text': 'Hello 纳米 World'}], font)
                page = pymupdf.open('pdf', document.tobytes())[0]
                chars = [c for b in page.get_text('rawdict')['blocks'] for l in b.get('lines', []) for s in l['spans'] for c in s['chars']]
                box = pymupdf.Rect()
                for char in chars:
                    box |= char['bbox']
                self.assertEqual(''.join(c['c'] for c in chars), 'Hello 纳米 World', (rotation, crop))
                for got, want in zip(box, expected):
                    self.assertAlmostEqual(got, want, delta=1.0, msg=(rotation, crop, box))

    def test_scan_gets_selectable_text_without_changing_appearance(self):
        source = self.dir / 'scan.pdf'
        truth = build_scan(source, rotation=90, crop=True)
        report = run(source, options=Options(), engine=ScriptedEngine([truth]))
        self.assertTrue(report['ready'], report)
        self.assertEqual(report['counts'], {'ocr': 1})
        self.assertEqual(report['verification']['pages']['1']['changedPixels'], 0)
        with pymupdf.open(report['output']) as document:
            page = document[0]
            found = hidden_lines(page)
            for (rect, text), (got_rect, got_text) in zip(truth, found):
                self.assertEqual(normalize(got_text), normalize(text))
                self.assertGreater(iou(rect, got_rect), 0.7, (rect, got_rect))
            self.assertTrue(page.search_for('量子尺寸效应'))
        self.assertTrue(Path(report['report']).is_file())

    def test_native_blank_and_existing_ocr_pages_are_skipped(self):
        source = self.dir / 'mixed.pdf'
        document = pymupdf.open()
        native_page(document, [('Native body text with a real text layer. ' * 4, 'helv', 9)] * 3)
        document.new_page()  # blank
        hidden = document.new_page()
        hidden.insert_text((50, 100), 'An earlier OCR layer of unknown quality', render_mode=3)
        document.save(source)
        engine = ScriptedEngine([[]])
        report = run(source, options=Options(), engine=engine)
        self.assertEqual(engine.calls, 0)
        self.assertEqual(report['counts'], {'skipped_native_text': 1, 'skipped_blank': 1, 'skipped_existing_ocr': 1})
        self.assertTrue(report['ready'])
        self.assertIsNone(report['output'])

    def test_cancel_resume_and_damaged_checkpoint(self):
        source = self.dir / 'book.pdf'
        truth = build_scan(source, pages=4)
        with self.assertRaises(KeyboardInterrupt):
            run(source, options=Options(), engine=ScriptedEngine([truth], interrupt_on=3))
        pages = self.dir / 'book.ocr.work' / 'pages'
        self.assertEqual(sorted(p.name for p in pages.glob('*.json')), ['000001.json', '000002.json'])
        (pages / '000002.json').write_text('{broken', encoding='utf-8')
        engine = ScriptedEngine([truth])
        report = run(source, options=Options(), engine=engine)
        self.assertEqual(engine.calls, 3)  # pages 2 (damaged), 3 and 4; page 1 reused
        self.assertTrue(report['ready'], report)
        with pymupdf.open(report['output']) as document:
            self.assertTrue(all(page.search_for('纳米微粒') for page in document))

    def test_changed_settings_need_restart(self):
        source = self.dir / 'scan.pdf'
        truth = build_scan(source)
        run(source, options=Options(), engine=ScriptedEngine([truth]))
        with self.assertRaisesRegex(JobError, '--restart'):
            run(source, options=Options(dpi=300), engine=ScriptedEngine([truth], dpi=300))
        report = run(source, options=Options(dpi=300, restart=True), engine=ScriptedEngine([truth], dpi=300))
        self.assertTrue(report['ready'])

    def test_failed_page_blocks_publication_until_retried(self):
        source = self.dir / 'book.pdf'
        truth = build_scan(source, pages=3)
        report = run(source, options=Options(), engine=ScriptedEngine([truth], fail_on={2}))
        self.assertFalse(report['ready'])
        self.assertEqual(report['failedPages'], [2])
        self.assertFalse((self.dir / 'book.ocr.pdf').exists())
        engine = ScriptedEngine([truth])
        report = run(source, options=Options(), engine=engine)
        self.assertEqual(engine.calls, 1)  # only the failed page
        self.assertTrue(report['ready'], report)

    def test_partial_range_keeps_every_page_and_structure(self):
        source = self.dir / 'book.pdf'
        truth = build_scan(source, pages=3, toc=True)
        report = run(source, options=Options(pages='2'), engine=ScriptedEngine([truth]))
        self.assertTrue(report['ready'], report)
        self.assertTrue(report['partial'])
        self.assertIn('局部文字层', report['message'])
        with pymupdf.open(report['output']) as document:
            self.assertEqual(len(document), 3)
            self.assertEqual(document.get_toc(), [[1, 'Chapter', 1]])
            self.assertEqual(len(document[0].get_links()), 1)
            self.assertEqual(document[0].get_text().strip(), '')
            self.assertTrue(document[1].search_for('纳米微粒'))

    def test_native_page_number_is_not_duplicated(self):
        source = self.dir / 'scan.pdf'
        truth = build_scan(source, extra_native=((290, 820), '17'))
        number = pymupdf.Rect(289, 811, 302, 823)
        report = run(source, options=Options(), engine=ScriptedEngine([truth + [(number, '17')]]))
        self.assertTrue(report['ready'], report)
        record = json.loads((self.dir / 'scan.ocr.work' / 'pages' / '000001.json').read_text(encoding='utf-8'))
        self.assertEqual(record['droppedDuplicates'], 1)

    def test_two_columns_are_read_column_by_column(self):
        def line(x, y, text, width=200):
            return {'quad': [[x, y], [x + width, y], [x + width, y + 12], [x, y + 12]], 'text': text}
        lines = [line(50, 60, 'TITLE', 495), line(50, 100, 'L1'), line(330, 100, 'R1'), line(50, 120, 'L2'),
                 line(330, 120, 'R2'), line(50, 300, 'CAPTION', 495), line(50, 340, 'L3'), line(330, 340, 'R3')]
        order = [row['text'] for row in reading_order(lines, 595)]
        self.assertEqual(order, ['TITLE', 'L1', 'L2', 'R1', 'R2', 'CAPTION', 'L3', 'R3'])

    @unittest.skipUnless(importlib.util.find_spec('rapidocr_onnxruntime'), 'rapidocr_onnxruntime not installed')
    def test_rapidocr_end_to_end(self):
        from core.engine import RapidOcrEngine
        engine = RapidOcrEngine()
        for rotation, crop in ((0, False), (90, True)):
            source = self.dir / f'scan-{rotation}.pdf'
            truth = build_scan(source, rotation=rotation, crop=crop)
            report = run(source, options=Options(), engine=engine)
            self.assertTrue(report['ready'], report)
            with pymupdf.open(report['output']) as document:
                found = hidden_lines(document[0])
                for rect, text in truth:
                    match = max(found, key=lambda row: iou(rect, row[0]))
                    self.assertGreater(iou(rect, match[0]), 0.5, (rotation, text, match))
                    similarity = difflib.SequenceMatcher(None, normalize(text), normalize(match[1])).ratio()
                    self.assertGreater(similarity, 0.85, (rotation, text, match[1]))
                self.assertTrue(document[0].search_for('纳米材料'), rotation)


if __name__ == '__main__':
    unittest.main()

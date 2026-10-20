"""Resumable page-by-page OCR job.

Every recognized page is written atomically to <work>/pages/NNNNNN.json, so a
cancelled or crashed run continues where it stopped. The result PDF is only
published after verification passes; otherwise it is kept as *.unverified.pdf
and never presented as a finished text layer.
"""
from dataclasses import dataclass
from pathlib import Path
import hashlib
import json
import os
import re
import shutil
import time
import numpy as np
import pymupdf
from . import CORE_VERSION
from .classify import classify_page
from .geometry import pixel_quad_to_view, quad_rect, reading_order
from .verify import verify
from .writer import load_font, write_page


class JobError(Exception):
    """A problem the user must resolve; the message is shown as is."""


@dataclass
class Options:
    pages: str = ''  # e.g. "16-20,25"; empty = whole document
    dpi: int = 200
    threads: int = 0  # 0 = ONNX Runtime default
    work_dir: Path = None
    restart: bool = False


def parse_pages(spec, page_count):
    """1-based PDF page ranges -> sorted 0-based indexes (duplicates merged)."""
    if not (spec or '').strip():
        return list(range(page_count))
    pages = set()
    for part in re.split(r'[,，]', spec):
        part = part.strip()
        if not part:
            continue
        match = re.fullmatch(r'(\d+)\s*(?:[-–~]\s*(\d+))?', part)
        if not match:
            raise JobError(f'无法识别的页码范围：{part}（示例：16-20,25）')
        first, last = int(match[1]), int(match[2] or match[1])
        if first < 1 or last > page_count or last < first:
            raise JobError(f'页码范围 {part} 无效：本 PDF 共 {page_count} 页，起始页不能大于结束页')
        pages.update(range(first - 1, last))
    if not pages:
        raise JobError('页码范围为空')
    return sorted(pages)


def describe_pages(indexes):
    """[0,1,2,5] -> '1-3,6'"""
    ranges, start = [], None
    for position, index in enumerate(indexes):
        if start is None:
            start = index
        if position + 1 == len(indexes) or indexes[position + 1] != index + 1:
            ranges.append(f'{start + 1}' if start == index else f'{start + 1}-{index + 1}')
            start = None
    return ','.join(ranges)


def file_sha256(path):
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for block in iter(lambda: handle.read(1 << 20), b''):
            digest.update(block)
    return digest.hexdigest()


def _write_json(path, data):
    temporary = path.with_name(path.name + '.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
    os.replace(temporary, path)


def _read_json(path):
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return None  # missing or damaged: the page is recomputed


def default_output(source):
    return source.with_name(source.stem + '.ocr.pdf')


def _sibling(output, suffix):
    return output.with_name(output.name[:-len(output.suffix)] + suffix if output.suffix else output.name + suffix)


def _recognize(page, index, engine, dpi):
    kind = classify_page(page)
    record = {'page': index + 1, 'nativeChars': kind.native_chars}
    if kind.kind != 'scan':
        return {**record, 'status': 'skipped_' + kind.kind}
    started = time.perf_counter()
    try:
        scale = dpi / 72
        pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), colorspace=pymupdf.csRGB, alpha=False, annots=False)
        image = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
        lines, duplicates = [], 0
        for line in engine.recognize(image):
            quad = pixel_quad_to_view(line.quad, scale)
            rect = quad_rect(quad)
            covered = sum((rect & native).get_area() for native in kind.native_rects if rect.intersects(native))
            if rect.get_area() and covered / rect.get_area() > 0.5:
                duplicates += 1  # already selectable as native text (page number, watermark)
                continue
            lines.append({'quad': [list(point) for point in quad], 'text': line.text, 'score': round(line.score, 4)})
    except Exception as exc:  # recorded per page; KeyboardInterrupt still cancels
        return {**record, 'status': 'failed', 'error': f'{type(exc).__name__}: {exc}'}
    lines = reading_order(lines, page.rect.width)
    return {**record, 'status': 'ocr' if lines else 'ocr_no_text', 'lines': lines,
            'droppedDuplicates': duplicates, 'seconds': round(time.perf_counter() - started, 2)}


def run(source, output=None, options=None, engine=None, progress=None):
    """Returns the report dict (also written next to the output).
    report['ready'] is True only when every requested page succeeded and the
    published PDF passed verification."""
    options = options or Options()
    progress = progress or (lambda event: None)
    source = Path(source).resolve()
    output = Path(output).resolve() if output else default_output(source)
    if output == source:
        raise JobError('输出文件不能覆盖原 PDF')
    if not source.is_file():
        raise JobError(f'找不到 PDF：{source}')
    with pymupdf.open(source) as document:
        if document.needs_pass or document.is_encrypted:
            raise JobError('加密 PDF 暂不支持，请先在有权限的软件中解除加密')
        page_count = len(document)
        requested = parse_pages(options.pages, page_count)
        signed = document.get_sigflags() > 0
    source_sha = file_sha256(source)

    if engine is None:
        from .engine import RapidOcrEngine
        progress({'event': 'loading_engine'})
        engine = RapidOcrEngine(threads=options.threads or None)
    work = Path(options.work_dir).resolve() if options.work_dir else _sibling(output, '.work')
    pages_dir = work / 'pages'
    specification = {'coreVersion': CORE_VERSION, 'sourceSha256': source_sha, 'dpi': options.dpi, 'engine': engine.identity}
    spec_path = work / 'specification.json'
    previous = _read_json(spec_path)
    if previous is not None and previous != specification:
        if not options.restart:
            raise JobError(f'工作目录 {work} 属于另一份源文件或不同参数（DPI、引擎或版本），'
                           '已保存的页面不能复用。加 --restart 清空后重新识别，或用 --work-dir 指定新目录。')
        shutil.rmtree(pages_dir, ignore_errors=True)
    pages_dir.mkdir(parents=True, exist_ok=True)
    _write_json(spec_path, specification)

    records = {}
    with pymupdf.open(source) as document:
        for done, index in enumerate(requested, 1):
            path = pages_dir / f'{index + 1:06d}.json'
            record = _read_json(path)
            resumed = bool(record) and record.get('page') == index + 1 and record.get('status') != 'failed'
            if not resumed:
                record = _recognize(document[index], index, engine, options.dpi)
                if record['status'] != 'failed':
                    _write_json(path, record)
            records[index] = record
            progress({'event': 'page', 'done': done, 'total': len(requested), 'page': index + 1,
                      'status': record['status'], 'resumed': resumed, 'error': record.get('error')})

    counts = {}
    for record in records.values():
        counts[record['status']] = counts.get(record['status'], 0) + 1
    failed = [record['page'] for record in records.values() if record['status'] == 'failed']
    report = {
        'ready': False, 'source': str(source), 'sourceSha256': source_sha, 'output': None,
        'pageCount': page_count, 'requestedPages': describe_pages(requested),
        'partial': len(requested) != page_count, 'counts': counts, 'failedPages': failed,
        'errors': {str(record['page']): record['error'] for record in records.values() if record.get('error')},
        'dpi': options.dpi, 'coreVersion': CORE_VERSION, 'engine': engine.identity, 'workDir': str(work),
        'warnings': ['PDF 带有数字签名：添加文字层后原签名不再有效'] if signed else [],
    }
    report_path = _sibling(output, '.report.json')
    report['report'] = str(report_path)
    if failed:
        report['message'] = f'{len(failed)} 页识别失败，未生成文字层 PDF。再次运行相同命令只重试失败页。'
        _write_json(report_path, report)
        return report

    progress({'event': 'assembling'})
    temporary = output.with_name(output.name + '.tmp')
    written, unplaced = {}, {}
    font = load_font()
    with pymupdf.open(source) as document:
        for index, record in sorted(records.items()):
            if record.get('lines'):
                placed, skipped = write_page(document[index], record['lines'], font)
                written[index] = placed
                if skipped:
                    unplaced[str(index + 1)] = [line['text'] for line in skipped]
        if not written:
            report.update(ready=True, message='请求范围内没有需要 OCR 的扫描页，未生成新文件。')
            _write_json(report_path, report)
            return report
        document.subset_fonts()
        document.save(temporary, garbage=1, deflate=True)

    progress({'event': 'verifying'})
    report['verification'] = verify(source, temporary, written)
    report['unplacedLines'] = unplaced
    report['missingGlyphs'] = sorted({char for lines in written.values() for line in lines for char in line['missingGlyphs']})
    try:
        if report['verification']['passed']:
            os.replace(temporary, output)
            report.update(ready=True, output=str(output), outputSha256=file_sha256(output),
                          message=('局部文字层：PDF 第 ' + report['requestedPages'] + ' 页' if report['partial'] else '完整文字层') + '，验证通过。')
        else:
            unverified = _sibling(output, '.unverified.pdf')
            os.replace(temporary, unverified)
            report.update(unverified=str(unverified), message='验证未通过，结果仅保存为 *.unverified.pdf 供排查，不应作为成品使用。')
    except PermissionError as exc:
        raise JobError(f'无法写入 {output}（可能正被 Zotero 或其他阅读器打开）：{exc}') from exc
    _write_json(report_path, report)
    return report

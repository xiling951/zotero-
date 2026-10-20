"""Losslessly split a local PDF at chapter/section boundaries (no network)."""
import hashlib
import json
from pathlib import Path
import re
import sys

import pymupdf


def split_pdf(options):
    source = Path(options['sourcePath'])
    destination = Path(options['destination'])
    maximum = int(options.get('maxPages', 200))
    if not 1 <= maximum <= 200:
        raise ValueError('每卷页数必须在 1 至 200 之间。')
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    destination.mkdir(parents=True, exist_ok=True)
    result_path = destination / 'volumes.json'
    if result_path.exists():
        prior = json.loads(result_path.read_text(encoding='utf-8'))
        if prior.get('sourceSha256') == digest and prior.get('maxPages') == maximum:
            if all(Path(volume['path']).exists() for volume in prior['volumes']):
                return prior
    with pymupdf.open(source) as original:
        if original.needs_pass:
            raise ValueError('PDF 已加密，请先使用密码解锁后再分卷。')
        count = len(original)
        if count <= maximum:
            return {'status': 'not-needed', 'totalPages': count, 'maxPages': maximum, 'volumes': []}
        toc = original.get_toc()
        chapters = []
        for index, page in enumerate(original):
            text = page.get_text()
            match = re.search(r'^Chapter\s+(\d+)\s*\n([^\n]+)', text, re.M)
            if match and match.start() < 300:
                chapters.append((index, match[2].strip()))
            else:
                match = re.search(r'^第[一二三四五六七八九十百\d]+章\s*([^\n]*)', text, re.M)
                if match and match.start() < 300:
                    chapters.append((index, match[0].strip()))
        if len(chapters) < 2:
            # Prefer the shallowest useful bookmark level, excluding repeated
            # destinations and front-matter table-of-contents entries.
            for level in sorted({row[0] for row in toc}):
                candidates = sorted({(page - 1, title) for depth, title, page in toc if depth == level and 1 <= page <= count})
                pages = {page for page, _ in candidates}
                if 2 <= len(pages) <= 80:
                    chapters = list(dict(candidates).items())
                    break
        boundaries = {0: 'Front matter'}
        boundaries.update(chapters)
        for _, title, page in toc:
            if title.strip().lower() in ('index', '索引') and page > count / 2:
                boundaries[page - 1] = title
        sections = sorted(boundaries.items())
        atoms = []
        for index, (begin, title) in enumerate(sections):
            end = sections[index + 1][0] if index + 1 < len(sections) else count
            while end - begin > maximum:
                choices = [page - 1 for depth, _, page in toc if depth <= 2 and begin + max(1, maximum // 2) <= page - 1 <= begin + maximum]
                cut = max(choices) if choices else begin + maximum
                atoms.append((begin, cut, title))
                begin = cut
            if end > begin:
                atoms.append((begin, end, title))
        groups = []
        for atom in atoms:
            if groups and atom[1] - groups[-1][0][0] <= maximum:
                groups[-1].append(atom)
            else:
                groups.append([atom])
        volumes = []
        checked = 0
        for number, group in enumerate(groups, 1):
            begin, end = group[0][0], group[-1][1]
            path = destination / f'Part-{number:02d}_pp{begin + 1:04d}-{end:04d}.pdf'
            with pymupdf.open() as volume:
                volume.insert_pdf(original, from_page=begin, to_page=end - 1)
                bookmarks = []
                previous_level = 0
                for level, title, page in toc:
                    if begin < page <= end:
                        level = min(level, previous_level + 1)
                        bookmarks.append([level, title, page - begin])
                        previous_level = level
                if bookmarks:
                    volume.set_toc(bookmarks)
                metadata = dict(original.metadata)
                metadata['title'] = f'{source.stem} - Part {number:02d} - pages {begin + 1}-{end}'
                volume.set_metadata(metadata)
                volume.save(path, garbage=4, deflate=True)
            with pymupdf.open(path) as volume:
                if len(volume) != end - begin or len(volume) > maximum:
                    raise ValueError('分卷页数检查失败。')
                for offset, page in enumerate(volume):
                    if page.get_text() != original[begin + offset].get_text():
                        raise ValueError('分卷文本校验失败。')
                    checked += 1
                for offset in {0, len(volume) - 1}:
                    old = original[begin + offset].get_pixmap(matrix=pymupdf.Matrix(.35, .35), alpha=False)
                    new = volume[offset].get_pixmap(matrix=pymupdf.Matrix(.35, .35), alpha=False)
                    if old.samples != new.samples:
                        raise ValueError('分卷页面显示校验失败。')
            volumes.append({'part': number, 'path': str(path), 'startPage': begin + 1, 'endPage': end,
                            'pages': end - begin, 'sections': list(dict.fromkeys(atom[2] for atom in group))})
        if checked != count or sum(volume['pages'] for volume in volumes) != count:
            raise ValueError('分卷完整性检查失败。')
        if hashlib.sha256(source.read_bytes()).hexdigest() != digest:
            raise ValueError('原文件校验失败。')
    result = {'status': 'success', 'sourceSha256': digest, 'totalPages': count, 'maxPages': maximum, 'volumes': volumes}
    result_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    return result


if __name__ == '__main__':
    output = Path(sys.argv[2])
    try:
        result = split_pdf(json.loads(Path(sys.argv[1]).read_text(encoding='utf-8')))
    except Exception as error:
        result = {'status': 'error', 'message': str(error)}
    output.write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')

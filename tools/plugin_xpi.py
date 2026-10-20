"""Verify or rebuild the bundled XPIs from their unpacked sources.

check  Every plugin listed in manifest.json must exist, match its recorded
       SHA-256 and version, and contain exactly the files in src/plugins/<id>.
build  Pack src/plugins/<id> into plugins/<id>.xpi reproducibly and record the
       new version and SHA-256 in manifest.json. Only rebuild plugins whose
       sources were actually changed; upstream XPIs keep their original bytes.

Usage: python tools/plugin_xpi.py check
       python tools/plugin_xpi.py build zotero-ai-sidebar-dark-mode@local
"""
from pathlib import Path
import argparse, hashlib, json, sys, zipfile

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'manifest.json'
# Fixed entry timestamp so identical sources always produce identical bytes.
EPOCH = (2026, 1, 1, 0, 0, 0)


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def source_files(source):
    return sorted(p.relative_to(source).as_posix() for p in source.rglob('*') if p.is_file())


def plugin_identity(data):
    meta = json.loads(data)
    return meta['applications']['zotero']['id'], meta['version']


def check_plugin(entry, root=ROOT):
    problems = []
    xpi = root / 'plugins' / entry['file']
    source = root / 'src/plugins' / entry['id']
    if not xpi.is_file():
        return [f'{entry["file"]}: XPI is missing']
    if sha256(xpi) != entry['sha256']:
        problems.append(f'{entry["file"]}: SHA-256 differs from manifest.json (rebuild with "build {entry["id"]}")')
    with zipfile.ZipFile(xpi) as archive:
        entries = {item.filename: item for item in archive.infolist() if not item.is_dir()}
        try:
            plugin_id, version = plugin_identity(archive.read('manifest.json'))
            if plugin_id != entry['id'] or version != entry['version']:
                problems.append(f'{entry["file"]}: contains {plugin_id} {version}, manifest.json lists {entry["id"]} {entry["version"]}')
        except (KeyError, ValueError) as exc:
            problems.append(f'{entry["file"]}: unreadable plugin manifest ({exc})')
        if not source.is_dir():
            problems.append(f'{entry["id"]}: unpacked source directory is missing')
            return problems
        files = source_files(source)
        for name in sorted(set(entries) - set(files)):
            problems.append(f'{entry["id"]}: {name} is in the XPI but not in src/plugins')
        for name in sorted(set(files) - set(entries)):
            problems.append(f'{entry["id"]}: {name} is in src/plugins but not in the XPI (rebuild needed)')
        for name in sorted(set(files) & set(entries)):
            if (source / name).read_bytes() != archive.read(name):
                problems.append(f'{entry["id"]}: {name} differs from the XPI (rebuild needed, or check core.autocrlf)')
    return problems


def build_plugin(entry, root=ROOT):
    source = root / 'src/plugins' / entry['id']
    plugin_id, version = plugin_identity((source / 'manifest.json').read_bytes())
    if plugin_id != entry['id']:
        raise SystemExit(f'{source}: manifest id {plugin_id} does not match {entry["id"]}')
    target = root / 'plugins' / entry['file']
    temporary = target.with_suffix('.xpi.tmp')
    with zipfile.ZipFile(temporary, 'w') as archive:
        for name in source_files(source):
            info = zipfile.ZipInfo(name, EPOCH)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, (source / name).read_bytes(), compresslevel=9)
    temporary.replace(target)
    entry['version'] = version
    entry['sha256'] = sha256(target)
    return entry


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    commands = parser.add_subparsers(dest='command', required=True)
    commands.add_parser('check')
    build = commands.add_parser('build')
    build.add_argument('ids', nargs='+', help='plugin id as listed in manifest.json')
    args = parser.parse_args(argv)
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    by_id = {entry['id']: entry for entry in manifest['plugins']}
    if args.command == 'build':
        for plugin_id in args.ids:
            if plugin_id not in by_id:
                raise SystemExit(f'Unknown plugin id: {plugin_id}')
            entry = build_plugin(by_id[plugin_id])
            print(f'built {entry["file"]} {entry["version"]} {entry["sha256"]}')
        MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')
    problems = [problem for entry in manifest['plugins'] for problem in check_plugin(entry)]
    for problem in problems:
        print('FAIL', problem)
    if not problems:
        print(f'OK: {len(manifest["plugins"])} XPIs match manifest.json and src/plugins')
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())

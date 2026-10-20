"""Scan a publication tree and archives without printing sensitive values.

Optional --private-root reads a local Zotero profile/config only for in-memory
exact-value comparisons. No private value is written into the report.
"""
from pathlib import Path
import argparse,io,json,re,tomllib,zipfile

TEXT={'.js','.ts','.tsx','.jsx','.json','.md','.py','.html','.xhtml','.xml','.txt','.toml','.ini','.yml','.yaml','.cfg','.conf','.ps1','.c','.cpp','.h','.css','.map','.rdf','.example','.lock'}
ARCHIVES={'.zip','.xpi','.oxt','.jar','.ja','.dotm'}
TOKEN=re.compile(rb'(?<![A-Za-z0-9_-])(?:sk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16})')
# Match the publishing user's actual home name; upstream public examples such
# as C:/Users/test are not this user's personal filesystem information.
PRIVATE=re.compile(rb'(?i)(?:[A-Z]:[\\/]+Users[\\/]+(?:'+re.escape(Path.home().name.encode())+rb')\b|https?://ws-[a-z0-9-]+\.[a-z0-9.-]+maas\.[a-z0-9.-]+)')
SECRET_FIELD=re.compile(r'(?i)(api.?key|token|secret|password|authorization)')

def private_values(root):
    found=set()
    def walk(value,key=''):
        if isinstance(value,dict):
            for k,v in value.items():walk(v,str(k))
        elif isinstance(value,list):
            for v in value:walk(v,key)
        elif isinstance(value,str):
            if SECRET_FIELD.search(key) and len(value)>=16 and value not in {'null','undefined'} and not value.startswith(('http:','https:')):found.add(value.encode())
            if re.search(r'(?i)(?:email|username)$',key) and '@' in value and len(value)>=6:found.add(value.encode())
            if value.startswith(('{','[')):
                try:walk(json.loads(value))
                except (ValueError,TypeError):pass
            for endpoint in re.findall(r'https?://ws-[a-z0-9-]+\.[a-z0-9.-]+maas\.[a-z0-9.-]+',value,re.I):found.add(endpoint.encode())
    if root:
        for p in (root/'pdf2zh/server/config').glob('*'):
            if p.name.endswith('.example'):continue
            try:
                if p.suffix=='.json':walk(json.loads(p.read_text(encoding='utf-8-sig')))
                elif p.suffix=='.toml':walk(tomllib.loads(p.read_text(encoding='utf-8-sig')))
            except (ValueError,OSError):pass
        prefs=root/'profile/prefs.js'
        if prefs.exists():
            for line in prefs.read_text(encoding='utf-8',errors='replace').splitlines():
                m=re.match(r'user_pref\("([^"]+)",\s*(.*)\);$',line)
                if m:
                    try:walk(json.loads(m[2]),m[1])
                    except ValueError:pass
    return found

def scan(root,assets,private_root=None):
    exact=private_values(private_root)
    findings=[];counts={'files':0,'archive_entries':0,'private_values_compared':len(exact)}
    def inspect(name,data,depth=0):
        counts['files' if depth==0 else 'archive_entries']+=1
        for secret in exact:
            if secret in data:findings.append({'path':name,'kind':'matches_local_private_value'});break
        suffix=Path(name).suffix.lower()
        if suffix in TEXT or Path(name).name in {'.gitignore','LICENSE','NOTICE'}:
            # A reviewed upstream tutorial contains only sk- followed by x's.
            # Exact local-private-value matching above is never exempted.
            hits=[m.group() for m in TOKEN.finditer(data)]
            if any(not (hit.startswith(b'sk-') and set(hit[3:])=={ord('x')}) for hit in hits):findings.append({'path':name,'kind':'credential_pattern'})
            if PRIVATE.search(data):findings.append({'path':name,'kind':'personal_path_or_private_endpoint'})
        if suffix in ARCHIVES and depth<5 and zipfile.is_zipfile(io.BytesIO(data)):
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                for item in archive.infolist():
                    if item.is_dir():continue
                    if '..' in Path(item.filename).parts or item.filename.startswith(('/', '\\')):findings.append({'path':name,'kind':'unsafe_archive_path'})
                    inspect(name+'!'+item.filename,archive.read(item),depth+1)
    forbidden={'prefs.js','user.js','logins.json','cookies.sqlite','zotero.sqlite','config.toml','config.json','venv.json'}
    for p in root.rglob('*'):
        if not p.is_file() or any(part in {'.git','__pycache__'} for part in p.relative_to(root).parts):continue
        relative=p.relative_to(root).as_posix()
        if p.name in forbidden and not relative.startswith('src/plugins/'):
            findings.append({'path':relative,'kind':'runtime_configuration_file'})
        if any(part in {'runtime','profile','library','storage','translated','__pycache__'} for part in p.relative_to(root).parts):
            findings.append({'path':relative,'kind':'runtime_data_directory'})
        inspect(relative,p.read_bytes())
    for p in assets:inspect('release/'+p.name,p.read_bytes())
    return {'passed':not findings,'scope':'allowlisted repository and recursive release/plugin/source archives; no private values in report','counts':counts,'findings':findings}

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('root',type=Path)
    parser.add_argument('--asset',type=Path,action='append',default=[])
    parser.add_argument('--private-root',type=Path)
    parser.add_argument('--report',type=Path,required=True)
    args=parser.parse_args()
    result=scan(args.root,args.asset,args.private_root)
    args.report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False))
    raise SystemExit(0 if result['passed'] else 1)

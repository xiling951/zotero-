param([string]$AppArchive='', [string]$UvPath='uv', [switch]$SkipPython)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$appRoot=Join-Path $projectRoot 'app'
$exe=Join-Path $appRoot 'Zotero_win-x64\zotero.exe'
if(-not(Test-Path -LiteralPath $exe)) {
 if(-not $AppArchive){$AppArchive=Join-Path $projectRoot 'Zotero-10.0.6-win-x64-clean.zip'}
 if(-not(Test-Path -LiteralPath $AppArchive)){throw 'Download the clean application archive from this repository Release, or pass -AppArchive.'}
 $manifest=Get-Content -LiteralPath (Join-Path $projectRoot 'manifest.json') -Raw | ConvertFrom-Json
 if((Get-FileHash -LiteralPath $AppArchive -Algorithm SHA256).Hash.ToLower() -ne $manifest.reader_archive.sha256){throw 'Application archive SHA-256 mismatch.'}
 Expand-Archive -LiteralPath $AppArchive -DestinationPath $appRoot
}
$runtime=Join-Path $projectRoot 'runtime'
$profile=Join-Path $runtime 'profile'
$library=Join-Path $runtime 'library'
$extensions=Join-Path $profile 'extensions'
New-Item -ItemType Directory -Path $extensions,$library -Force | Out-Null
$manifest=Get-Content -LiteralPath (Join-Path $projectRoot 'manifest.json') -Raw | ConvertFrom-Json
foreach($plugin in $manifest.plugins) {
 $source=Join-Path $projectRoot ('plugins\'+$plugin.file)
 if((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLower() -ne $plugin.sha256){throw ('Plugin SHA-256 mismatch: '+$plugin.file)}
 Copy-Item -LiteralPath $source -Destination (Join-Path $extensions $plugin.file) -Force
}
$userPrefs=Join-Path $profile 'user.js'
if(-not(Test-Path -LiteralPath $userPrefs)){
 $pathJson=ConvertTo-Json $library -Compress
 $lines=@(
  ('user_pref("extensions.zotero.dataDir", '+$pathJson+');'),
  'user_pref("extensions.zotero.useDataDir", true);',
  'user_pref("extensions.autoDisableScopes", 0);',
  'user_pref("extensions.zotero.pdf2zh.disableGlossary", true);'
 )
 [IO.File]::WriteAllLines($userPrefs,$lines,[Text.UTF8Encoding]::new($false))
}
if($SkipPython){Write-Output 'Clean reader and plugins prepared. Translation dependencies were skipped.';exit 0}
Get-Command $UvPath -ErrorAction Stop | Out-Null
$server=Join-Path $projectRoot 'pdf2zh\server'
$managed=Join-Path $server 'zotero-pdf2zh-next-venv'
if(-not(Test-Path -LiteralPath (Join-Path $managed 'Scripts\python.exe'))){
 & $UvPath venv $managed --python 3.12
 if($LASTEXITCODE){throw 'uv venv failed'}
}
$python=Join-Path $managed 'Scripts\python.exe'
& $UvPath pip install --python $python -r (Join-Path $projectRoot 'pdf2zh\requirements-managed-lock.txt')
if($LASTEXITCODE){throw 'Managed dependency installation failed'}
& $UvPath pip install --python $python --target (Join-Path $projectRoot 'pdf2zh\layout-runtime') --no-deps -r (Join-Path $projectRoot 'pdf2zh\layout-runtime-requirements.txt')
if($LASTEXITCODE){throw 'Isolated renderer installation failed'}
Write-Output 'Setup complete. Start Zotero and configure your own AI/translation account in settings.'

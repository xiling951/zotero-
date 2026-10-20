param()
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$pidFile=Join-Path $projectRoot 'runtime\pdf2zh.pid'
$python=Join-Path $projectRoot 'pdf2zh\server\zotero-pdf2zh-next-venv\Scripts\python.exe'
if(-not(Test-Path -LiteralPath $pidFile)){Write-Output 'No translation server was started by Start-Zotero.ps1.';exit 0}
$serverId=[int](Get-Content -LiteralPath $pidFile -Raw).Trim()
$process=Get-Process -Id $serverId -ErrorAction SilentlyContinue
# The PID may have been reused after a reboot: only stop this project's Python.
$path=$null
if($process){try{$path=$process.Path}catch{}}
if($process -and $path -and ([IO.Path]::GetFullPath($path) -eq [IO.Path]::GetFullPath($python))){
 # The venv python.exe is a launcher; /T also ends the interpreter it spawned.
 $null=& cmd.exe /c ('taskkill /PID '+$serverId+' /T /F >nul 2>&1')
 Write-Output ('Stopped translation server (PID '+$serverId+').')
}else{
 Write-Output 'The recorded translation server is no longer running.'
}
Remove-Item -LiteralPath $pidFile -ErrorAction SilentlyContinue

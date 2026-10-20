param([int]$ServerPort=8890,[switch]$ReaderOnly)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$exe=Join-Path $projectRoot 'app\Zotero_win-x64\zotero.exe'
$profile=Join-Path $projectRoot 'runtime\profile'
if(-not(Test-Path -LiteralPath $exe) -or -not(Test-Path -LiteralPath $profile)){throw 'Run scripts\Setup.ps1 first.'}
$env:PYTHONUTF8='1';$env:PYTHONIOENCODING='utf-8';$env:TTY_COMPATIBLE='1';$env:ZOTERO_PDF2ZH_DISABLE_QWEN_THINKING='1'
if(-not $ReaderOnly){
 $server=Join-Path $projectRoot 'pdf2zh\server'
 $python=Join-Path $server 'zotero-pdf2zh-next-venv\Scripts\python.exe'
 if(-not(Test-Path -LiteralPath $python)){throw 'Translation environment missing. Run Setup, or start with -ReaderOnly.'}
 $portInUse=$false
 $connection=[Net.Sockets.TcpClient]::new()
 try{$connection.Connect('127.0.0.1',$ServerPort);$portInUse=$true}catch{}finally{$connection.Dispose()}
 if($portInUse){
  $health=Invoke-RestMethod ('http://127.0.0.1:'+$ServerPort+'/health') -TimeoutSec 4
  if($health.outputDir -ne (Join-Path $server 'translated') -or $health.layoutSafety -ne 'bitmap-formula-protection-v1'){
   throw 'Port belongs to a different service. Choose -ServerPort and update the PDF2zh URL; no process was stopped.'
  }
 }else{
  Start-Process -FilePath $python -WorkingDirectory $server -ArgumentList @('-u','server.py','--host=127.0.0.1',('--port='+$ServerPort),'--check_update=False','--update_source=github','--skip_install=True','--enable_mirror=False') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectRoot 'runtime\pdf2zh.log') -RedirectStandardError (Join-Path $projectRoot 'runtime\pdf2zh-error.log')
  $ready=$false
  for($attempt=0;$attempt -lt 30;$attempt++){
   try{$health=Invoke-RestMethod ('http://127.0.0.1:'+$ServerPort+'/health') -TimeoutSec 2;if($health.layoutSafety -eq 'bitmap-formula-protection-v1'){$ready=$true;break}}catch{}
   Start-Sleep -Milliseconds 500
  }
  if(-not $ready){throw 'Translation server did not become ready; inspect the runtime logs.'}
 }
}
Start-Process -FilePath $exe -ArgumentList @('-no-remote','-profile',('"'+$profile+'"'))

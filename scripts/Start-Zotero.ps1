param([int]$ServerPort=8890,[switch]$ReaderOnly,[int]$ServerTimeoutSec=60,[switch]$StopServerOnExit)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$exe=Join-Path $projectRoot 'app\Zotero_win-x64\zotero.exe'
$runtime=Join-Path $projectRoot 'runtime'
$profileDir=Join-Path $runtime 'profile'
$pidFile=Join-Path $runtime 'pdf2zh.pid'
if(-not(Test-Path -LiteralPath $exe) -or -not(Test-Path -LiteralPath $profileDir)){throw 'Run scripts\Setup.ps1 first.'}

# Zotero holds parent.lock exclusively while this profile is open; a second
# -no-remote instance would only show a "profile in use" error.
$lock=Join-Path $profileDir 'parent.lock'
if(Test-Path -LiteralPath $lock){
 try{[IO.File]::Open($lock,'Open','ReadWrite','None').Dispose()}
 catch [IO.IOException]{Write-Output 'Zotero is already running with this profile; switch to the open window.';exit 0}
}

function Test-OwnServer($health){
 return $health.outputDir -eq (Join-Path $server 'translated') -and $health.layoutSafety -eq 'bitmap-formula-protection-v1'
}

$serverProcess=$null
if(-not $ReaderOnly){
 $server=Join-Path $projectRoot 'pdf2zh\server'
 $python=Join-Path $server 'zotero-pdf2zh-next-venv\Scripts\python.exe'
 if(-not(Test-Path -LiteralPath $python)){throw 'Translation environment missing. Run Setup, or start with -ReaderOnly.'}
 $env:PYTHONUTF8='1';$env:PYTHONIOENCODING='utf-8';$env:TTY_COMPATIBLE='1';$env:ZOTERO_PDF2ZH_DISABLE_QWEN_THINKING='1'
 $healthUrl='http://127.0.0.1:'+$ServerPort+'/health'
 $portInUse=$false
 $connection=[Net.Sockets.TcpClient]::new()
 try{$connection.Connect('127.0.0.1',$ServerPort);$portInUse=$true}catch{}finally{$connection.Dispose()}
 if($portInUse){
  $health=$null
  try{$health=Invoke-RestMethod $healthUrl -TimeoutSec 4}catch{}
  if(-not $health -or -not(Test-OwnServer $health)){
   throw ('Port '+$ServerPort+' belongs to a different service. Choose -ServerPort and update the PDF2zh URL; no process was stopped.')
  }
  Write-Output ('Reusing the translation server already running on port '+$ServerPort+'.')
 }else{
  $log=Join-Path $runtime 'pdf2zh.log';$errorLog=Join-Path $runtime 'pdf2zh-error.log'
  # Keep the previous run's logs for troubleshooting a failed start.
  foreach($file in @($log,$errorLog)){if(Test-Path -LiteralPath $file){Move-Item -LiteralPath $file -Destination ($file+'.1') -Force}}
  $serverProcess=Start-Process -FilePath $python -WorkingDirectory $server -ArgumentList @('-u','server.py','--host=127.0.0.1',('--port='+$ServerPort),'--check_update=False','--update_source=github','--skip_install=True','--enable_mirror=False') -WindowStyle Hidden -RedirectStandardOutput $log -RedirectStandardError $errorLog -PassThru
  $null=$serverProcess.Handle  # keeps ExitCode readable after the process ends
  Set-Content -LiteralPath $pidFile -Value $serverProcess.Id -Encoding ascii
  $ready=$false
  $deadline=(Get-Date).AddSeconds([Math]::Max(5,$ServerTimeoutSec))
  Write-Output ('Starting the translation server on port '+$ServerPort+' ...')
  while((Get-Date) -lt $deadline){
   if($serverProcess.HasExited){break}
   try{$health=Invoke-RestMethod $healthUrl -TimeoutSec 2;if(Test-OwnServer $health){$ready=$true;break}}catch{}
   Start-Sleep -Milliseconds 500
  }
  if(-not $ready){
   $tail=''
   if(Test-Path -LiteralPath $errorLog){$tail=(Get-Content -LiteralPath $errorLog -Tail 15 -Encoding UTF8) -join [Environment]::NewLine}
   # The venv python.exe is a launcher; /T also ends the interpreter it spawned.
   if(-not $serverProcess.HasExited){$null=& cmd.exe /c ('taskkill /PID '+$serverProcess.Id+' /T /F >nul 2>&1')}
   Remove-Item -LiteralPath $pidFile -ErrorAction SilentlyContinue
   $reason=if($serverProcess.HasExited){'exited with code '+$serverProcess.ExitCode}else{'did not answer within '+$ServerTimeoutSec+' s (raise -ServerTimeoutSec on slow machines)'}
   throw ('Translation server '+$reason+'. Logs: '+$errorLog+[Environment]::NewLine+$tail)
  }
  Write-Output ('Translation server ready: http://127.0.0.1:'+$ServerPort+'/')
 }
}

$zotero=Start-Process -FilePath $exe -ArgumentList @('-no-remote','-profile',('"'+$profileDir+'"')) -PassThru
if($StopServerOnExit -and $serverProcess){
 Write-Output 'Waiting for Zotero to close; the translation server stops with it.'
 $zotero.WaitForExit()
 & (Join-Path $PSScriptRoot 'Stop-Translation.ps1')
}

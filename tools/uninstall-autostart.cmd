@echo off
setlocal
rem Removes the metrics helper from Windows Startup and stops any running instance.

set "LNK=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Living-Terminal Metrics.lnk"

if exist "%LNK%" (
	del "%LNK%"
	echo [autostart] removed: "%LNK%"
) else (
	echo [autostart] no Startup shortcut found.
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
	"Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -like '*metrics-helper.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host '[autostart] stopped helper pid' $_.ProcessId }"
pause

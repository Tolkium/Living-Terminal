@echo off
setlocal
rem Adds the metrics helper to Windows Startup (hidden, no admin needed) and starts it now.
rem Undo with uninstall-autostart.cmd.

set "VBS=%~dp0metrics-helper-hidden.vbs"
set "LNK=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Living-Terminal Metrics.lnk"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
	"$s = (New-Object -ComObject WScript.Shell).CreateShortcut($env:LNK);" ^
	"$s.TargetPath = 'wscript.exe';" ^
	"$s.Arguments = '\"' + $env:VBS + '\"';" ^
	"$s.WorkingDirectory = (Split-Path $env:VBS);" ^
	"$s.Description = 'Living-Terminal wallpaper metrics helper';" ^
	"$s.Save()"
if errorlevel 1 (
	echo [autostart] failed to create Startup shortcut.
	pause
	exit /b 1
)

echo [autostart] installed: "%LNK%"
wscript.exe "%VBS%"
echo [autostart] helper started in background. Graphs should show live data within a few seconds.
pause

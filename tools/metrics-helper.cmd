@echo off
setlocal
pushd "%~dp0"

set "NODE_CMD="

where node >nul 2>nul
if not errorlevel 1 (
	set "NODE_CMD=node"
)

if not defined NODE_CMD (
	where fnm >nul 2>nul
	if not errorlevel 1 (
		set "NODE_CMD=fnm exec --using=default node"
		echo [metrics-helper] using fnm default node
	)
)

if not defined NODE_CMD (
	echo.
	echo [metrics-helper] Node.js not found in PATH.
	echo [metrics-helper] fnm also not available for fallback.
	echo Install Node.js or make fnm available in PATH, then run again.
	echo.
	pause
	popd
	exit /b 1
)

echo [metrics-helper] starting...
call %NODE_CMD% "%~dp0metrics-helper.js"
set EXIT_CODE=%ERRORLEVEL%

if not "%EXIT_CODE%"=="0" (
	echo.
	echo [metrics-helper] stopped with error code %EXIT_CODE%.
	echo Window kept open so you can read error above.
	echo.
	pause
)

popd
exit /b %EXIT_CODE%

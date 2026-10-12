' Starts metrics-helper.js with no console window.
' Used by the Windows Startup shortcut created by install-autostart.cmd.
' Output goes to %TEMP%\living-terminal-metrics.log for troubleshooting.

Option Explicit

Dim shell, fso, toolsDir, js, logFile, nodeCmd
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

toolsDir = fso.GetParentFolderName(WScript.ScriptFullName)
js = """" & toolsDir & "\metrics-helper.js"""
logFile = """" & shell.ExpandEnvironmentStrings("%TEMP%") & "\living-terminal-metrics.log"""

If shell.Run("cmd /c where node >nul 2>nul", 0, True) = 0 Then
	nodeCmd = "node"
ElseIf shell.Run("cmd /c where fnm >nul 2>nul", 0, True) = 0 Then
	nodeCmd = "fnm exec --using=default node"
Else
	MsgBox "Living-Terminal metrics helper: Node.js not found (neither node nor fnm in PATH).", vbExclamation, "Living-Terminal"
	WScript.Quit 1
End If

shell.Run "cmd /c """ & nodeCmd & " " & js & " > " & logFile & " 2>&1""", 0, False

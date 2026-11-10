@echo off
setlocal
cd /d "%~dp0"
"%~dp0runtime\node\node.exe" "%~dp0portable\launcher.mjs" start %*
if errorlevel 1 pause

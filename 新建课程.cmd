@echo off
setlocal
set "courseDestination="
set /p "courseDestination=New course folder (full path, no quotes): "
if not defined courseDestination exit /b 1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0New-Course.ps1" -Destination "%courseDestination%"
pause

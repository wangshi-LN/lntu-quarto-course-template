@echo off
if not exist "%~dp0layouts.html" (
  echo Run build.ps1 first.
  pause
  exit /b 1
)
start "" "%~dp0layouts.html"

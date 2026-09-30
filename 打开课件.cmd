@echo off
if not exist "%~dp0course.html" (
  echo Run build.ps1 first.
  pause
  exit /b 1
)
start "" "%~dp0course.html"

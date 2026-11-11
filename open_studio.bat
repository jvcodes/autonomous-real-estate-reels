@echo off
cd /d "%~dp0"
set "SITE_ARG=%~1"
if "%SITE_ARG%"=="" (
  node core\render.js studio
) else (
  node core\render.js studio "%SITE_ARG%"
)
pause

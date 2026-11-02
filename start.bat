@echo off
title Tumkur Real Estate Map & Reels
cd /d "%~dp0"
echo ========================================================
echo   Launching Tumkur Real Estate Map & Video Reels
echo ========================================================
echo.
timeout /t 1 >nul
start "" "http://localhost:3000"
node server.js
pause

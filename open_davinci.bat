@echo off
echo Opening DaVinci Resolve...
start "" "C:\Program Files\Blackmagic Design\DaVinci Resolve\Resolve.exe"
echo.
echo In DaVinci Resolve:
echo   - Recommended: Workspace ^> Scripts ^> Build_Reel_Studio
echo   - Manual XML:  Ctrl+Shift+I ^> import sites\^<your_site^>\out\^<timeline^>.xml
timeout /t 5 >nul

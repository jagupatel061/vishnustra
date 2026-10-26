@echo off
title Vishnustra server
cd /d "%~dp0"

rem 1) Node.js already on this computer?
where node >nul 2>nul
if %errorlevel%==0 (
  node server\server.js
  pause
  exit /b
)

rem 2) Portable Node.js unzipped inside this folder (no installation)
for /d %%D in ("%~dp0node-v*") do (
  if exist "%%D\node.exe" (
    "%%D\node.exe" server\server.js
    pause
    exit /b
  )
)

echo.
echo  Node.js was not found.
echo  1. Go to https://nodejs.org/en/download
echo  2. Choose Windows, then download the "Standalone Binary (.zip)" - NOT the installer.
echo  3. Unzip it INSIDE this vishnustra folder (you get a folder like node-v22.x.x-win-x64).
echo  4. Double-click START-VISHNUSTRA.bat again.
echo.
pause

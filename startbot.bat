@echo off
title WhatsApp Bot with Ngrok Integration

:: Set working directory to script location
cd /d %~dp0

:: 1. Start Ngrok using full path
echo Starting Ngrok tunnel on port 3000...
start "" "C:\MyTools\ngrok\ngrok.exe" http 3000

:: 2. Wait for Ngrok to initialize (5 sec)
echo Waiting for Ngrok to initialize...
timeout /t 5 >nul

:: 3. Run webhook updater to fetch Ngrok public URL
echo Fetching Ngrok public URL and updating config...
node getNgrokUrl.js
if %errorlevel% neq 0 (
  echo ❌ Webhook updater failed!
  pause
  exit /b %errorlevel%
)

:: 4. Start WhatsApp bot
echo Starting WhatsApp bot...
node index.js
if %errorlevel% neq 0 (
  echo ❌ WhatsApp bot failed to start!
  pause
  exit /b %errorlevel%
)

echo.
echo ✅ All services started successfully.
pause >nul

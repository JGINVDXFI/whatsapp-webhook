@echo off
cd /d C:\Users\Sony\Desktop\TRADING\vercel-whatsapp-webhook

:: Start ngrok on port 5000 in a new window
start "" "C:\MyTools\ngrok\ngrok.exe" http 5000

:: Wait 5 seconds for ngrok to initialize
timeout /t 5 > nul

:: Start your Node.js script
node startAll.js

pause

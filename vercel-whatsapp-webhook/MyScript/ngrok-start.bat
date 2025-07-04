@echo off
echo 🔴 Killing existing ngrok process (if any)...
taskkill /f /im ngrok.exe

echo 🚀 Starting Node & ngrok setup...
cd /d C:\Users\Sony\Desktop\TRADING\vercel-whatsapp-webhook
npm run start-all

pause

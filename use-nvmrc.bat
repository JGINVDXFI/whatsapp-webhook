@echo off
if not exist ".nvmrc" (
    echo .nvmrc file not found!
    exit /b 1
)
set /p version=<.nvmrc
echo Switching to Node.js version %version%
nvm use %version%

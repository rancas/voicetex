@echo off
title VoiceTeX
cd /d "%~dp0"
set NODE_ENV=production
set VOICETEX_DIST_PATH=%~dp0dist
set VOICETEX_DB_PATH=%APPDATA%\VoiceTeX\voicetex.db
start "" http://localhost:3001
voicetex-backend.exe

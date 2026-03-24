@echo off
cd /d "%~dp0"
echo Starting Metro (port 8082 will be freed first if in use)...
call npm run start
pause

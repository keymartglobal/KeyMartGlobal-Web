@echo off

cd /d "%~dp0"

echo.
echo =====================================
echo   Starting WhatsApp Automation...
echo =====================================
echo.

docker compose up -d --build

echo.
echo =====================================
echo   WhatsApp Automation Started!
echo =====================================
echo.
echo   The agent is now running in the
echo   background and polling for tasks.
echo.
echo   You can close this window.
echo.

pause

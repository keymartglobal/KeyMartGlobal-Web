@echo off

cd /d "%~dp0"

echo.
echo =====================================
echo   Stopping WhatsApp Automation...
echo =====================================
echo.

docker compose down

echo.
echo =====================================
echo   WhatsApp Automation Stopped!
echo =====================================
echo.

pause

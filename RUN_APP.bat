@echo off
chcp 65001 >nul
TITLE FinAnalyzer Launcher

echo ==================================================
echo      Starting Financial Analyzer Platform
echo ==================================================

echo.
echo [1/2] Starting Backend Server (FastAPI)...
start "FinAnalyzer Backend" /D "backend" cmd /k "launch.bat"

echo [2/2] Starting Frontend (React/Vite)...
start "FinAnalyzer Frontend" /D "frontend" cmd /k "set PATH=C:\Program Files\nodejs;%PATH% && npm run dev"

echo [3/3] Launching Web Browser...
timeout /t 5 >nul
start http://localhost:5173

echo.
echo Success! The application is starting up.
echo Backend will run on: http://localhost:8000
echo Frontend will run on: http://localhost:5173
echo.
echo You can close this window, the servers will keep running.
timeout /t 10

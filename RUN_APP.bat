@echo off
TITLE FinAnalyzer Launcher

echo ==================================================
echo      Starting Financial Analyzer Platform
echo ==================================================

echo.
echo [1/2] Starting Backend Server (FastAPI)...
start "FinAnalyzer Backend" /D "backend" cmd /k "if not exist venv\Scripts\activate.bat (echo Error: Virtual environment not found in backend/venv & pause & exit) else (call venv\Scripts\activate.bat && python -m uvicorn main:app --reload --port 8000)"

echo [2/2] Starting Frontend (React/Vite)...
start "FinAnalyzer Frontend" /D "frontend" cmd /k "set PATH=C:\Program Files\nodejs;%PATH% && npm run dev"

echo.
echo Success! The application is starting up.
echo Backend will run on: http://localhost:8000
echo Frontend will run on: http://localhost:5173
echo.
echo You can close this window, the servers will keep running.
timeout /t 10

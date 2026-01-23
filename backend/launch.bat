@echo off
TITLE FinAnalyzer Backend

if not exist venv\Scripts\activate.bat (
    echo.
    echo [ERROR] Virtual environment not found in "backend/venv".
    echo Please make sure you have set up the python environment.
    echo.
    pause
    exit /b 1
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Starting server...
python -m uvicorn main:app --reload --port 8000

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server crashed or failed to start.
    pause
)

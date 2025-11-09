@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo    CompeteHub - Setup and Start
echo ========================================
echo.

REM Change to project root directory
cd /d "%~dp0"

REM ===== Check Prerequisites =====
echo [1/6] Checking prerequisites...

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)
echo   [OK] Python found

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
echo   [OK] Node.js found

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed or not in PATH
    pause
    exit /b 1
)
echo   [OK] npm found
echo.

REM ===== Setup Python Virtual Environment =====
echo [2/6] Setting up Python virtual environment...

if not exist "venv" (
    echo   Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
    echo   [OK] Virtual environment created
) else (
    echo   [OK] Virtual environment already exists
)
echo.

REM ===== Install Backend Dependencies =====
echo [3/6] Installing backend dependencies...
call venv\Scripts\activate.bat

cd backend
echo   Installing Python packages...
pip install -r requirements.txt --quiet --disable-pip-version-check
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..
echo   [OK] Backend dependencies installed
echo.

REM ===== Install Frontend Dependencies =====
echo [4/6] Installing frontend dependencies...
cd frontend

if not exist "node_modules" (
    echo   Installing npm packages...
    npm install --loglevel=error
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo   [OK] Frontend dependencies installed
) else (
    echo   [OK] Frontend dependencies already installed
)
cd ..
echo.

REM ===== Create Required Directories =====
echo [5/6] Setting up data directories...
if not exist "data" mkdir data
if not exist "data\users" mkdir data\users
echo   [OK] Data directories ready
echo.

REM ===== Start Services =====
echo [6/6] Starting services...
echo.
echo   Starting Backend on port 8000...
start "CompeteHub Backend" cmd /k "cd /d "%~dp0" && call venv\Scripts\activate.bat && cd backend && python main.py"

REM Wait for backend to start
timeout /t 5 /nobreak > nul

echo   Starting Frontend on port 3000...
start "CompeteHub Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================
echo    CompeteHub Started Successfully!
echo ========================================
echo.
echo   Frontend:          http://localhost:3000
echo   Backend API:       http://localhost:8000
echo   API Docs:          http://localhost:8000/docs
echo   Health Check:      http://localhost:8000/health
echo.
echo ========================================
echo.
echo Services are running in separate windows.
echo Close those windows to stop the services.
echo.
echo Press any key to exit this setup window...
pause > nul

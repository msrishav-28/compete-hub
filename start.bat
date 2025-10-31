@echo off
echo.
echo ========================================
echo    CompeteHub - Starting Application
echo ========================================
echo.
echo Starting Backend on port 8000...
start "CompeteHub Backend" cmd /k "cd backend && python main.py"
timeout /t 3 /nobreak > nul
echo.
echo Starting Frontend on port 3000...
start "CompeteHub Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo ========================================
echo    Services Started Successfully
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
echo Press any key to exit...
pause > nul

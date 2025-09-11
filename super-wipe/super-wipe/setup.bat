@echo off
REM TrustWipe Setup Script for Windows
REM This script automates the initial setup of the TrustWipe application

echo.
echo 🚀 TrustWipe Setup Script
echo =========================
echo.

REM Check if Node.js is installed
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16 or higher.
    echo [INFO] Download from: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [INFO] Node.js found: %NODE_VERSION%

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [INFO] npm found: %NPM_VERSION%
echo.

REM Install dependencies
echo [INFO] Installing dependencies...
if not exist package.json (
    echo [ERROR] package.json not found. Are you in the correct directory?
    pause
    exit /b 1
)

npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [INFO] Dependencies installed successfully
echo.

REM Create logs directory
echo [INFO] Setting up directories...
if not exist logs mkdir logs
echo [INFO] Created logs directory
echo.

REM Run tests
echo [INFO] Running backend tests...
if exist test-backend.js (
    npm test
    if %errorlevel% equ 0 (
        echo [INFO] All tests passed! ✅
    ) else (
        echo [WARN] Some tests failed. Check the output above.
    )
) else (
    echo [WARN] test-backend.js not found. Skipping tests.
)
echo.

REM Check PowerShell execution policy
echo [INFO] Checking PowerShell execution policy...
powershell -Command "Get-ExecutionPolicy" >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] PowerShell execution policy may need adjustment
    echo [INFO] Run as Administrator: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
)
echo.

REM Display next steps
echo [INFO] Setup Complete! 🎉
echo.
echo [INFO] Next steps:
echo 1. Review and customize config.json if needed
echo 2. Change default credentials in config.json
echo 3. Start the application: npm start
echo 4. For development: npm run dev
echo 5. To build: npm run build
echo.
echo [WARN] IMPORTANT: Test with non-critical drives first!
echo.
echo [INFO] Documentation:
echo - README.md: General information
echo - IMPLEMENTATION_GUIDE.md: Detailed setup guide
echo - BACKEND_SUMMARY.md: Technical overview
echo.
pause

@echo off
REM Git Setup Script for Heirs Business Suite

echo ============================================
echo Git Setup for Heirs Business Suite
echo ============================================
echo.

REM Change to project directory
cd /d C:\Users\HP\heirsbizsuite

echo Initializing git repository...
git init

echo.
echo Configuring git user...
git config user.name "Your Name"
git config user.email "your-email@example.com"

echo.
echo Adding all files...
git add .

echo.
echo Creating initial commit...
git commit -m "Initial commit: Heirs Business Suite complete application"

echo.
echo ============================================
echo ✅ Git setup complete!
echo ============================================
echo.
echo NEXT STEPS:
echo.
echo 1. Go to https://github.com/new
echo 2. Create a new repository:
echo    - Name: heirs-business-suite
echo    - Description: Complete business management platform
echo    - Choose: Public
echo    - DO NOT initialize with README
echo    - Click "Create repository"
echo.
echo 3. Copy-paste the following commands into PowerShell:
echo    (Replace YOUR_USERNAME with your GitHub username)
echo.
echo    git remote add origin https://github.com/YOUR_USERNAME/heirs-business-suite.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 4. When prompted, enter your GitHub credentials or use GitHub CLI
echo.
echo ============================================
pause

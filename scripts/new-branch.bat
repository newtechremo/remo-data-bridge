@echo off
setlocal enabledelayedexpansion

REM New branch creation script
REM Usage: new-branch.bat branch-name "description"

if "%~1"=="" (
    echo Usage: new-branch.bat ^<branch-name^> "description"
    echo Example: new-branch.bat feature/login "Add login feature"
    exit /b 1
)

set BRANCH_NAME=%~1
set DESCRIPTION=%~2
for /f "tokens=1-3 delims=/" %%a in ('date /t') do set TODAY=%%c-%%a-%%b

REM Checkout main and create new branch
echo [1/4] Checking out main branch...
git checkout main 2>nul || git checkout -b main

echo [2/4] Creating new branch: %BRANCH_NAME%
git checkout -b %BRANCH_NAME%

REM Log to CHANGELOG.md
echo [3/4] Updating CHANGELOG.md...
set CHANGELOG=docs\CHANGELOG.md

echo. >> %CHANGELOG%
echo #### %BRANCH_NAME% - %TODAY% >> %CHANGELOG%
echo - **Description**: %DESCRIPTION% >> %CHANGELOG%
echo - **Status**: In Progress >> %CHANGELOG%
echo. >> %CHANGELOG%

echo [4/4] Done!
echo.
echo ========================================
echo Branch '%BRANCH_NAME%' created
echo Recorded in CHANGELOG.md
echo ========================================
echo.
echo Next steps:
echo 1. Write code
echo 2. Commit changes
echo 3. Run prepare-merge.bat before merge

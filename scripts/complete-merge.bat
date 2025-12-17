@echo off
setlocal enabledelayedexpansion

REM Complete merge process
REM Usage: complete-merge.bat branch-name

if "%~1"=="" (
    echo Usage: complete-merge.bat ^<branch-name^>
    echo Example: complete-merge.bat feature/login
    exit /b 1
)

set BRANCH_NAME=%~1
for /f "tokens=1-3 delims=/" %%a in ('date /t') do set TODAY=%%c-%%a-%%b

for /f "tokens=*" %%a in ('git branch --show-current') do set CURRENT_BRANCH=%%a

if not "%CURRENT_BRANCH%"=="main" (
    echo Error: Must run on main branch.
    echo Current branch: %CURRENT_BRANCH%
    exit /b 1
)

echo ========================================
echo Complete Merge: %BRANCH_NAME%
echo ========================================
echo.

set CHANGELOG=docs\CHANGELOG.md

echo. >> %CHANGELOG%
echo ## [Merge Complete] - %TODAY% >> %CHANGELOG%
echo ### Branch: `%BRANCH_NAME%` >> %CHANGELOG%
echo **Status**: Complete >> %CHANGELOG%
echo. >> %CHANGELOG%
echo --- >> %CHANGELOG%

echo [1/2] Logged completion to CHANGELOG.md

echo.
set /p DELETE_BRANCH="Delete branch '%BRANCH_NAME%'? (y/n): "

if /i "%DELETE_BRANCH%"=="y" (
    git branch -d %BRANCH_NAME%
    echo [2/2] Branch deleted
) else (
    echo [2/2] Branch kept
)

echo.
echo ========================================
echo Merge process complete!
echo ========================================

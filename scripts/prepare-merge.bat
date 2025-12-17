@echo off
setlocal enabledelayedexpansion

REM Prepare merge - update analysis document
REM Usage: prepare-merge.bat

for /f "tokens=1-3 delims=/" %%a in ('date /t') do set TODAY=%%c-%%a-%%b

for /f "tokens=*" %%a in ('git branch --show-current') do set BRANCH_NAME=%%a

if "%BRANCH_NAME%"=="main" (
    echo Error: Cannot run on main branch.
    echo Checkout to your working branch first.
    exit /b 1
)

echo ========================================
echo Prepare Merge: %BRANCH_NAME%
echo ========================================
echo.

set ANALYSIS=docs\ANALYSIS.md

echo [1/3] Analyzing changed files...
echo.

REM Write analysis
echo. >> %ANALYSIS%
echo --- >> %ANALYSIS%
echo. >> %ANALYSIS%
echo ### [%BRANCH_NAME%] - %TODAY% >> %ANALYSIS%
echo. >> %ANALYSIS%
echo #### 1. Overview >> %ANALYSIS%
echo - **Branch**: `%BRANCH_NAME%` >> %ANALYSIS%
echo - **Merge Prep Date**: %TODAY% >> %ANALYSIS%
echo. >> %ANALYSIS%
echo #### 2. Changed Files >> %ANALYSIS%
echo. >> %ANALYSIS%
echo ^| File ^| Status ^| >> %ANALYSIS%
echo ^|------|--------^| >> %ANALYSIS%

for /f "tokens=1,2" %%a in ('git diff --name-status main 2^>nul') do (
    set STATUS=%%a
    set FILE=%%b
    if "!STATUS!"=="A" set STATUS_TEXT=Added
    if "!STATUS!"=="M" set STATUS_TEXT=Modified
    if "!STATUS!"=="D" set STATUS_TEXT=Deleted
    echo ^| `%%b` ^| !STATUS_TEXT! ^| >> %ANALYSIS%
)

echo. >> %ANALYSIS%
echo #### 3. Commit Log >> %ANALYSIS%
echo ```>> %ANALYSIS%
git log main..HEAD --oneline >> %ANALYSIS% 2>nul
echo ```>> %ANALYSIS%
echo. >> %ANALYSIS%
echo #### 4. Review Checklist >> %ANALYSIS%
echo - [ ] Code review complete >> %ANALYSIS%
echo - [ ] Tests passed >> %ANALYSIS%
echo - [ ] Documentation updated >> %ANALYSIS%
echo. >> %ANALYSIS%

echo [2/3] ANALYSIS.md updated
echo.

echo [3/3] Change statistics:
git diff --stat main 2>nul
echo.

echo ========================================
echo Merge preparation complete!
echo ========================================
echo.
echo Next steps:
echo 1. Review docs/ANALYSIS.md
echo 2. git checkout main
echo 3. git merge --no-ff %BRANCH_NAME%
echo.

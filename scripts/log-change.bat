@echo off
setlocal enabledelayedexpansion

REM Log change to CHANGELOG
REM Usage: log-change.bat "change description"

if "%~1"=="" (
    echo Usage: log-change.bat "change description"
    exit /b 1
)

set CHANGE_DESC=%~1
set TIME_NOW=%time:~0,5%

for /f "tokens=*" %%a in ('git branch --show-current') do set BRANCH_NAME=%%a

set CHANGELOG=docs\CHANGELOG.md

echo - [%TIME_NOW%] %CHANGE_DESC% >> %CHANGELOG%

echo Change logged to CHANGELOG.md
echo Branch: %BRANCH_NAME%
echo Description: %CHANGE_DESC%

@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: 변경 내용 기록
:: 사용법: log-change.bat "변경 내용 설명"

if "%~1"=="" (
    echo 사용법: log-change.bat "변경 내용 설명"
    exit /b 1
)

set CHANGE_DESC=%~1
set TODAY=%date:~0,4%-%date:~5,2%-%date:~8,2%
set TIME_NOW=%time:~0,5%

:: 현재 브랜치명 가져오기
for /f "tokens=*" %%a in ('git branch --show-current') do set BRANCH_NAME=%%a

set CHANGELOG=docs\CHANGELOG.md

:: 변경 내용 추가
echo - [%TIME_NOW%] %CHANGE_DESC% >> %CHANGELOG%

echo 변경 내용이 CHANGELOG.md에 기록되었습니다.
echo 브랜치: %BRANCH_NAME%
echo 내용: %CHANGE_DESC%

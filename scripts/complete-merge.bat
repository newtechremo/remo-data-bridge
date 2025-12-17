@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: 머지 완료 처리
:: 사용법: complete-merge.bat <브랜치명>

if "%~1"=="" (
    echo 사용법: complete-merge.bat ^<브랜치명^>
    echo 예: complete-merge.bat feature/login
    exit /b 1
)

set BRANCH_NAME=%~1
set TODAY=%date:~0,4%-%date:~5,2%-%date:~8,2%

:: main 브랜치 확인
for /f "tokens=*" %%a in ('git branch --show-current') do set CURRENT_BRANCH=%%a

if not "%CURRENT_BRANCH%"=="main" (
    echo 오류: main 브랜치에서 실행해야 합니다.
    echo 현재 브랜치: %CURRENT_BRANCH%
    exit /b 1
)

echo ========================================
echo 머지 완료 처리: %BRANCH_NAME%
echo ========================================
echo.

:: CHANGELOG.md에 완료 기록
set CHANGELOG=docs\CHANGELOG.md

echo. >> %CHANGELOG%
echo ## [머지 완료] - %TODAY% >> %CHANGELOG%
echo ### 브랜치: `%BRANCH_NAME%` >> %CHANGELOG%
echo **상태**: 완료 >> %CHANGELOG%
echo. >> %CHANGELOG%
echo --- >> %CHANGELOG%

echo [1/2] CHANGELOG.md에 완료 기록 추가

:: 브랜치 삭제 확인
echo.
set /p DELETE_BRANCH="브랜치 '%BRANCH_NAME%'를 삭제하시겠습니까? (y/n): "

if /i "%DELETE_BRANCH%"=="y" (
    git branch -d %BRANCH_NAME%
    echo [2/2] 브랜치 삭제 완료
) else (
    echo [2/2] 브랜치 유지
)

echo.
echo ========================================
echo 머지 완료 처리 완료!
echo ========================================

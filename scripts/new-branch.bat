@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: 새 브랜치 생성 및 작업 시작 문서화
:: 사용법: new-branch.bat <브랜치타입/이름> "작업 설명"
:: 예: new-branch.bat feature/login "로그인 기능 추가"

if "%~1"=="" (
    echo 사용법: new-branch.bat ^<브랜치명^> "작업 설명"
    echo 예: new-branch.bat feature/login "로그인 기능 추가"
    exit /b 1
)

set BRANCH_NAME=%~1
set DESCRIPTION=%~2
set TODAY=%date:~0,4%-%date:~5,2%-%date:~8,2%

:: main 브랜치로 이동 후 최신화
echo [1/4] main 브랜치 체크아웃...
git checkout main 2>nul || git checkout -b main

:: 새 브랜치 생성
echo [2/4] 새 브랜치 생성: %BRANCH_NAME%
git checkout -b %BRANCH_NAME%

:: CHANGELOG.md에 작업 시작 기록
echo [3/4] CHANGELOG.md에 기록 중...
set CHANGELOG=docs\CHANGELOG.md

:: 임시 파일에 새 내용 작성
echo ## [작업 시작] - %TODAY% > temp_changelog.txt
echo ### 브랜치: `%BRANCH_NAME%` >> temp_changelog.txt
echo. >> temp_changelog.txt
echo **설명**: %DESCRIPTION% >> temp_changelog.txt
echo. >> temp_changelog.txt
echo **상태**: 진행 중 >> temp_changelog.txt
echo. >> temp_changelog.txt
echo --- >> temp_changelog.txt
echo. >> temp_changelog.txt

:: 기존 내용과 합치기
if exist %CHANGELOG% (
    type %CHANGELOG% >> temp_changelog.txt
)
move /y temp_changelog.txt %CHANGELOG% > nul

echo [4/4] 완료!
echo.
echo ========================================
echo 브랜치 '%BRANCH_NAME%' 생성 완료
echo 작업 시작이 CHANGELOG.md에 기록되었습니다.
echo ========================================
echo.
echo 다음 단계:
echo 1. 코드 작업 진행
echo 2. 변경사항 커밋
echo 3. 머지 전 prepare-merge.bat 실행

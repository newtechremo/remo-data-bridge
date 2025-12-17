@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: 머지 준비 - 분석 문서 업데이트
:: 사용법: prepare-merge.bat

set TODAY=%date:~0,4%-%date:~5,2%-%date:~8,2%

:: 현재 브랜치명 가져오기
for /f "tokens=*" %%a in ('git branch --show-current') do set BRANCH_NAME=%%a

if "%BRANCH_NAME%"=="main" (
    echo 오류: main 브랜치에서는 실행할 수 없습니다.
    echo 먼저 작업 브랜치로 체크아웃하세요.
    exit /b 1
)

echo ========================================
echo 머지 준비: %BRANCH_NAME%
echo ========================================
echo.

:: 변경된 파일 목록 가져오기
echo [1/3] 변경된 파일 분석 중...
echo.

set ANALYSIS=docs\ANALYSIS.md
set TEMP_FILE=temp_analysis.txt

:: 분석 내용 작성
echo. >> %ANALYSIS%
echo --- >> %ANALYSIS%
echo. >> %ANALYSIS%
echo ### [%BRANCH_NAME%] - %TODAY% >> %ANALYSIS%
echo. >> %ANALYSIS%
echo #### 1. 작업 개요 >> %ANALYSIS%
echo - **브랜치**: `%BRANCH_NAME%` >> %ANALYSIS%
echo - **머지 준비일**: %TODAY% >> %ANALYSIS%
echo. >> %ANALYSIS%
echo #### 2. 변경사항 요약 >> %ANALYSIS%
echo. >> %ANALYSIS%
echo ^| 파일 ^| 상태 ^| >> %ANALYSIS%
echo ^|------|------^| >> %ANALYSIS%

:: 변경된 파일 목록 추가
for /f "tokens=1,2" %%a in ('git diff --name-status main 2^>nul') do (
    set STATUS=%%a
    set FILE=%%b
    if "!STATUS!"=="A" set STATUS_KR=추가
    if "!STATUS!"=="M" set STATUS_KR=수정
    if "!STATUS!"=="D" set STATUS_KR=삭제
    echo ^| `%%b` ^| !STATUS_KR! ^| >> %ANALYSIS%
)

echo. >> %ANALYSIS%
echo #### 3. 커밋 로그 >> %ANALYSIS%
echo ```>> %ANALYSIS%
git log main..HEAD --oneline >> %ANALYSIS% 2>nul
echo ```>> %ANALYSIS%
echo. >> %ANALYSIS%
echo #### 4. 리뷰 체크리스트 >> %ANALYSIS%
echo - [ ] 코드 리뷰 완료 >> %ANALYSIS%
echo - [ ] 테스트 통과 >> %ANALYSIS%
echo - [ ] 문서 업데이트 확인 >> %ANALYSIS%
echo. >> %ANALYSIS%

echo [2/3] ANALYSIS.md 업데이트 완료
echo.

:: 변경 통계 출력
echo [3/3] 변경 통계:
git diff --stat main 2>nul
echo.

echo ========================================
echo 머지 준비 완료!
echo ========================================
echo.
echo 다음 단계:
echo 1. docs/ANALYSIS.md 확인 및 수정
echo 2. git checkout main
echo 3. git merge --no-ff %BRANCH_NAME%
echo.

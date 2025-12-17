# 개발 워크플로우 가이드

## 브랜치 전략

### 브랜치 명명 규칙
- `main` - 메인 브랜치 (배포용)
- `feature/<기능명>` - 새로운 기능 개발
- `fix/<버그명>` - 버그 수정
- `refactor/<대상>` - 리팩토링
- `docs/<문서명>` - 문서 작업

### 필수 워크플로우

#### 1. 작업 시작 전 - 브랜치 생성
```bash
# 스크립트 사용 (권장)
./scripts/new-branch.sh feature/기능명 "작업 설명"

# 또는 수동으로
git checkout -b feature/기능명
```

#### 2. 작업 중 - 변경 내용 문서화
모든 변경사항은 `docs/CHANGELOG.md`에 기록합니다.

```bash
# 스크립트 사용 (권장)
./scripts/log-change.sh "변경 내용 설명"
```

#### 3. 작업 완료 - 머지 전 분석 문서 업데이트
```bash
# 스크립트 사용 (권장)
./scripts/prepare-merge.sh

# 이 스크립트는:
# - 현재 브랜치의 모든 변경사항 요약
# - docs/ANALYSIS.md에 자동 기록
# - 머지 준비 상태 확인
```

#### 4. 머지
```bash
git checkout main
git merge --no-ff feature/기능명
```

---

## 체크리스트

### 브랜치 생성 시
- [ ] main에서 분기했는가?
- [ ] 브랜치명이 규칙을 따르는가?
- [ ] CHANGELOG.md에 작업 시작 기록했는가?

### 커밋 시
- [ ] 변경 내용이 명확한가?
- [ ] 테스트를 통과했는가?

### 머지 전
- [ ] ANALYSIS.md에 분석 내용 기록했는가?
- [ ] 코드 리뷰 완료했는가?
- [ ] 모든 변경사항이 문서화되었는가?

---

## 관련 문서
- [CHANGELOG.md](./CHANGELOG.md) - 변경 로그
- [ANALYSIS.md](./ANALYSIS.md) - 분석 문서

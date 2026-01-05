# Remo Data Bridge

데이터 분석 요청 및 파일 전송을 위한 웹 애플리케이션

## 주요 기능

- 사용자 인증 (로그인/로그아웃)
- 분석 요청 생성 및 관리
- 파일 업로드 (S3 저장)
- 분석 결과 확인 및 다운로드
- 다국어 지원 (한국어, 영어, 태국어)
- 관리자 대시보드

## 기술 스택

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS
- **Database:** Prisma ORM
- **Storage:** AWS S3
- **Authentication:** NextAuth.js
- **i18n:** next-intl

## 설치 및 실행

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env` 파일 생성:

```env
DATABASE_URL="your-database-url"
AUTH_SECRET="your-auth-secret"

AWS_REGION="ap-northeast-2"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"
```

### 3. 데이터베이스 설정

```bash
npm run db:push
npm run db:seed
```

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3015 에서 확인

## 사용자 매뉴얼

### 문서

- [한국어 매뉴얼 (PDF)](docs/USER_MANUAL_KO.pdf)
- [English Manual (PDF)](docs/USER_MANUAL_EN.pdf)
- [คู่มือภาษาไทย (PDF)](docs/USER_MANUAL_TH.pdf)

### 매뉴얼 재생성

```bash
# 스크린샷 캡처
npm run docs:screenshot

# PDF 생성
npm run docs:pdf
```

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (포트 3015) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run db:push` | 데이터베이스 스키마 적용 |
| `npm run db:seed` | 초기 데이터 생성 |
| `npm run db:studio` | Prisma Studio 실행 |
| `npm run docs:screenshot` | 매뉴얼 스크린샷 캡처 |
| `npm run docs:pdf` | 매뉴얼 PDF 생성 |

## 프로젝트 구조

```
├── docs/                    # 문서 및 매뉴얼
│   ├── screenshots/         # 스크린샷
│   ├── USER_MANUAL.md       # 한국어 매뉴얼
│   ├── USER_MANUAL_EN.md    # 영어 매뉴얼
│   └── USER_MANUAL_TH.md    # 태국어 매뉴얼
├── prisma/                  # 데이터베이스 스키마
├── scripts/                 # 자동화 스크립트
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React 컴포넌트
│   ├── i18n/                # 다국어 메시지
│   └── lib/                 # 유틸리티
└── public/                  # 정적 파일
```

## 라이선스

Private

## 문의

- Email: info@remo.re.kr

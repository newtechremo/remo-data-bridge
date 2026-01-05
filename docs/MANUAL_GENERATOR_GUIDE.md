# 매뉴얼 자동 생성 가이드

이 문서는 Playwright를 이용한 스크린샷 자동 캡처와 PDF 매뉴얼 생성 방법을 설명합니다.

---

## 1. 필요 패키지 설치

```bash
npm install -D playwright @playwright/test md-to-pdf tsx
npx playwright install chromium
```

---

## 2. 프로젝트 구조

```
project/
├── docs/
│   ├── screenshots/          # 스크린샷 저장 폴더
│   │   ├── 01_login.png
│   │   ├── 02_dashboard.png
│   │   └── ...
│   ├── USER_MANUAL.md        # 한국어 매뉴얼
│   ├── USER_MANUAL_EN.md     # 영어 매뉴얼
│   ├── USER_MANUAL_TH.md     # 태국어 매뉴얼
│   ├── USER_MANUAL_KO.pdf    # 한국어 PDF
│   ├── USER_MANUAL_EN.pdf    # 영어 PDF
│   └── USER_MANUAL_TH.pdf    # 태국어 PDF
├── scripts/
│   ├── capture-screenshots.ts  # 스크린샷 캡처 스크립트
│   └── generate-pdf.ts         # PDF 생성 스크립트
└── package.json
```

---

## 3. package.json 스크립트 추가

```json
{
  "scripts": {
    "docs:screenshot": "npx tsx scripts/capture-screenshots.ts",
    "docs:pdf": "npx tsx scripts/generate-pdf.ts"
  }
}
```

---

## 4. 스크린샷 캡처 스크립트 작성

### scripts/capture-screenshots.ts

```typescript
import { chromium, Browser, Page } from "playwright";
import * as path from "path";
import * as fs from "fs";

const BASE_URL = "http://localhost:3000";  // 앱 URL
const SCREENSHOT_DIR = path.join(__dirname, "..", "docs", "screenshots");

// 테스트 계정 정보
const TEST_USER = {
  email: "test@test.com",
  password: "test1234",
};

// 캡처할 페이지 목록
const PAGES_TO_CAPTURE = [
  { name: "01_login", path: "/login", requiresAuth: false, description: "로그인 페이지" },
  { name: "02_dashboard", path: "/dashboard", requiresAuth: true, description: "대시보드" },
  // 필요한 페이지 추가...
];

async function login(page: Page): Promise<void> {
  console.log("🔐 로그인 중...");
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");

  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');

  await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
  console.log("✅ 로그인 성공");
}

async function captureScreenshot(
  page: Page,
  pageName: string,
  pagePath: string,
  description: string
): Promise<void> {
  console.log(`📸 캡처 중: ${description} (${pagePath})`);

  await page.goto(`${BASE_URL}${pagePath}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  const screenshotPath = path.join(SCREENSHOT_DIR, `${pageName}.png`);
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });

  console.log(`✅ 저장됨: ${screenshotPath}`);
}

async function main(): Promise<void> {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log("🚀 스크린샷 캡처 시작\\n");

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: "ko-KR",
  });
  const page = await context.newPage();

  try {
    // 로그인이 필요없는 페이지 먼저 캡처
    for (const pageInfo of PAGES_TO_CAPTURE.filter(p => !p.requiresAuth)) {
      await captureScreenshot(page, pageInfo.name, pageInfo.path, pageInfo.description);
    }

    // 로그인
    await login(page);

    // 로그인이 필요한 페이지 캡처
    for (const pageInfo of PAGES_TO_CAPTURE.filter(p => p.requiresAuth)) {
      await captureScreenshot(page, pageInfo.name, pageInfo.path, pageInfo.description);
    }

    console.log("\\n🎉 모든 스크린샷 캡처 완료!");
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
```

---

## 5. PDF 생성 스크립트 작성

### scripts/generate-pdf.ts

```typescript
import { mdToPdf } from "md-to-pdf";
import * as path from "path";
import * as fs from "fs";

const DOCS_DIR = path.join(__dirname, "..", "docs");

const MANUALS = [
  { file: "USER_MANUAL.md", output: "USER_MANUAL_KO.pdf" },
  { file: "USER_MANUAL_EN.md", output: "USER_MANUAL_EN.pdf" },
  // 필요한 언어 추가...
];

const CSS_PATH = path.join(DOCS_DIR, "manual-style.css");
const CSS_CONTENT = `
body {
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  color: #333;
}
h1 {
  color: #1e3a5f;
  border-bottom: 2px solid #00d4aa;
  padding-bottom: 10px;
}
h2 {
  color: #1e3a5f;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
  page-break-before: always;
}
h2:first-of-type,
h2:nth-of-type(2) {
  page-break-before: avoid;
}
img {
  max-width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin: 15px 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
`;

async function generatePdf(inputFile: string, outputFile: string): Promise<void> {
  const inputPath = path.join(DOCS_DIR, inputFile);
  const outputPath = path.join(DOCS_DIR, outputFile);

  console.log(`📄 변환 중: ${inputFile} → ${outputFile}`);

  try {
    await mdToPdf(
      { path: inputPath },
      {
        dest: outputPath,
        stylesheet: [CSS_PATH],
        pdf_options: {
          format: "A4",
          margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
          printBackground: true,
        },
      }
    );
    console.log(`✅ 완료: ${outputFile}`);
  } catch (error) {
    console.error(`❌ 오류: ${inputFile} - ${error}`);
  }
}

async function main(): Promise<void> {
  console.log("🚀 PDF 생성 시작\\n");

  fs.writeFileSync(CSS_PATH, CSS_CONTENT);

  for (const manual of MANUALS) {
    await generatePdf(manual.file, manual.output);
  }

  console.log("\\n🎉 모든 PDF 생성 완료!");
}

main().catch(console.error);
```

---

## 6. 매뉴얼 마크다운 작성 팁

### 기본 구조

```markdown
# 프로젝트명 사용자 매뉴얼

**버전:** 1.0
**최종 수정일:** 2025-12-30

---

## 목차
1. [섹션1](#1-섹션1)
2. [섹션2](#2-섹션2)

---

## 1. 섹션1

![스크린샷](./screenshots/01_screenshot.png)

### 설명
- 설명 내용

### 사용 방법
1. 단계 1
2. 단계 2
```

### 페이지 나누기 추가

특정 위치에서 새 페이지로 시작하려면:

```markdown
<div style="page-break-before: always;"></div>

### 새 페이지에서 시작할 섹션
```

---

## 7. 사용 방법

### 스크린샷 캡처

```bash
# 앱이 실행 중인 상태에서
npm run docs:screenshot
```

### PDF 생성

```bash
npm run docs:pdf
```

### 전체 매뉴얼 갱신

```bash
npm run docs:screenshot && npm run docs:pdf
```

---

## 8. 주의사항

1. **앱 실행 필수**: 스크린샷 캡처 전 앱이 실행 중이어야 합니다.
2. **테스트 계정**: 스크립트에 올바른 테스트 계정 정보를 설정하세요.
3. **동적 라우트**: `/items/[id]` 같은 동적 라우트는 별도 처리가 필요합니다.
4. **팝업/모달**: 팝업이 있는 경우 sessionStorage 초기화 등 추가 처리가 필요합니다.
5. **다국어**: 각 언어별 마크다운 파일을 별도로 작성하세요.

---

## 9. 커스터마이징

### 뷰포트 크기 변경

```typescript
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },  // 원하는 크기로 변경
});
```

### PDF 스타일 변경

`CSS_CONTENT` 변수의 CSS를 수정하여 PDF 스타일을 변경할 수 있습니다.

### 헤더/푸터 추가

```typescript
pdf_options: {
  displayHeaderFooter: true,
  headerTemplate: '<div style="font-size:10px; text-align:center; width:100%;">매뉴얼 제목</div>',
  footerTemplate: '<div style="font-size:10px; text-align:center; width:100%;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
}
```

---

*이 가이드는 다른 프로젝트에서도 재사용할 수 있습니다.*

import { chromium, Browser, Page } from "playwright";
import * as path from "path";
import * as fs from "fs";

const BASE_URL = "http://localhost:3015";
const SCREENSHOT_DIR = path.join(__dirname, "..", "docs", "screenshots");

// 테스트 계정 정보
const TEST_USER = {
  email: "test@test.com",
  password: "test1234",
};

// 캡처할 페이지 목록 (일반 사용자용)
const PAGES_TO_CAPTURE = [
  { name: "01_login", path: "/login", requiresAuth: false, description: "로그인 페이지" },
  { name: "02_dashboard", path: "/dashboard", requiresAuth: true, description: "대시보드" },
  { name: "03_requests", path: "/requests", requiresAuth: true, description: "요청 목록" },
];

async function login(page: Page): Promise<void> {
  console.log("🔐 로그인 중...");
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");

  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');

  // 로그인 후 리다이렉트 대기
  await page.waitForURL(/\/(dashboard|requests)/, { timeout: 10000 });
  console.log("✅ 로그인 성공");
}

async function hideNextDevTools(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      nextjs-portal { display: none !important; }
      [data-nextjs-dialog-overlay] { display: none !important; }
      [data-nextjs-toast] { display: none !important; }
      #__next-build-indicator { display: none !important; }
      [data-next-mark] { display: none !important; }
      body > nextjs-portal { display: none !important; }
    `
  });
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

  // Next.js 개발 도구 숨기기
  await hideNextDevTools(page);

  // 추가 대기 (동적 콘텐츠 로딩)
  await page.waitForTimeout(1000);

  const screenshotPath = path.join(SCREENSHOT_DIR, `${pageName}.png`);
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });

  console.log(`✅ 저장됨: ${screenshotPath}`);
}

async function captureNewRequestWithConsent(page: Page): Promise<void> {
  // sessionStorage 초기화하여 동의 팝업이 나타나도록 함
  await page.goto(`${BASE_URL}/requests`);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => sessionStorage.removeItem("dataTransferConsent"));

  // 새 요청 페이지로 이동
  console.log(`📸 캡처 중: 새 요청 - 동의 팝업 (/requests/new)`);
  await page.goto(`${BASE_URL}/requests/new`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // 1. 동의 팝업 스크린샷
  const consentPath = path.join(SCREENSHOT_DIR, "04a_requests_new_consent.png");
  await page.screenshot({
    path: consentPath,
    fullPage: true,
  });
  console.log(`✅ 저장됨: ${consentPath}`);

  // 2. 체크박스 클릭
  console.log(`📸 캡처 중: 새 요청 - 폼 (/requests/new)`);
  const checkbox = page.locator('input[type="checkbox"]');
  await checkbox.click();
  await page.waitForTimeout(300);

  // 3. 확인 버튼 클릭 (다국어 지원: 동의 및 진행, Agree & Proceed, ยอมรับ)
  const confirmButton = page.locator('button:has-text("동의 및 진행"), button:has-text("Agree"), button:has-text("ยอมรับ")');
  await confirmButton.click();
  await page.waitForTimeout(1000);

  // 4. 폼 페이지 스크린샷
  const formPath = path.join(SCREENSHOT_DIR, "04b_requests_new_form.png");
  await page.screenshot({
    path: formPath,
    fullPage: true,
  });
  console.log(`✅ 저장됨: ${formPath}`);
}

async function captureRequestDetail(page: Page): Promise<boolean> {
  console.log(`📸 캡처 중: 요청 상세 (/requests/:id)`);

  // 요청 목록 페이지로 이동
  await page.goto(`${BASE_URL}/requests`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // 테이블 내의 첫 번째 요청 링크 찾기 (/requests/new 제외)
  const requestLink = page.locator('tbody a[href^="/requests/"]').first();
  const linkExists = await requestLink.count() > 0;

  if (!linkExists) {
    console.log("⚠️ 요청 상세 스킵됨: 요청이 없습니다");
    return false;
  }

  // 요청 상세 페이지로 이동
  await requestLink.click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  const screenshotPath = path.join(SCREENSHOT_DIR, "05_request_detail.png");
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });

  console.log(`✅ 저장됨: ${screenshotPath}`);
  return true;
}

async function main(): Promise<void> {
  // 스크린샷 디렉토리 확인
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log("🚀 Playwright 스크린샷 캡처 시작");
  console.log(`📁 저장 위치: ${SCREENSHOT_DIR}`);
  console.log("");

  const browser: Browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: "ko-KR",
  });

  const page = await context.newPage();

  // Next.js 개발 도구 숨기기
  await page.addStyleTag({
    content: `
      nextjs-portal { display: none !important; }
      [data-nextjs-dialog-overlay] { display: none !important; }
      [data-nextjs-toast] { display: none !important; }
      #__next-build-indicator { display: none !important; }
      [data-next-mark] { display: none !important; }
    `
  });

  try {
    // 로그인 페이지 캡처 (로그인 전)
    const loginPage = PAGES_TO_CAPTURE.find((p) => p.path === "/login");
    if (loginPage) {
      await captureScreenshot(page, loginPage.name, loginPage.path, loginPage.description);
    }

    // 로그인
    await login(page);

    // 정적 페이지 캡처
    for (const pageInfo of PAGES_TO_CAPTURE) {
      if (pageInfo.path === "/login") continue;

      try {
        await captureScreenshot(page, pageInfo.name, pageInfo.path, pageInfo.description);
      } catch (error) {
        console.log(`⚠️ 스킵됨: ${pageInfo.description} - ${error}`);
      }
    }

    // 새 요청 페이지 캡처 (동의 팝업 포함)
    await captureNewRequestWithConsent(page);

    // 요청 상세 페이지 캡처 (동적 라우트)
    await captureRequestDetail(page);

    console.log("");
    console.log("🎉 모든 스크린샷 캡처 완료!");

  } catch (error) {
    console.error("❌ 오류 발생:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch(console.error);

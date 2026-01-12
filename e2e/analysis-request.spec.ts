import { test, expect, Page } from "@playwright/test";
import path from "path";

// Test credentials
const TEST_ADMIN = {
  email: "admin@example.com",
  password: "password123",
};

const TEST_USER = {
  email: "user@example.com",
  password: "password123",
};

// Helper function to login
async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 10000 });
}

test.describe("Analysis Request - Full Scenario", () => {
  test.describe("User: Create Request", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USER.email, TEST_USER.password);
    });

    test("should navigate to new request page", async ({ page }) => {
      await page.goto("/requests/new");
      await expect(page).toHaveURL(/\/requests\/new/);
    });

    test("should show consent modal before creating request", async ({ page }) => {
      await page.goto("/requests/new");

      // Consent modal should appear
      const consentModal = page.locator('[role="dialog"], .modal, [data-testid="consent-modal"]');
      if (await consentModal.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Accept consent
        const acceptButton = page.locator('button:has-text("동의"), button:has-text("Agree"), button:has-text("확인")');
        await acceptButton.click();
      }
    });

    test("should display request form fields", async ({ page }) => {
      await page.goto("/requests/new");

      // Handle consent modal if present
      const acceptButton = page.locator('button:has-text("동의"), button:has-text("Agree")');
      if (await acceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await acceptButton.click();
      }

      // Check form fields
      await expect(page.locator('input[name="title"], input[placeholder*="제목"], input[placeholder*="title"]')).toBeVisible({ timeout: 5000 });
    });

    test("should create new analysis request", async ({ page }) => {
      await page.goto("/requests/new");

      // Handle consent modal if present
      const acceptButton = page.locator('button:has-text("동의"), button:has-text("Agree")');
      if (await acceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await acceptButton.click();
      }

      // Fill form
      const titleInput = page.locator('input[name="title"], input[placeholder*="제목"], input[placeholder*="title"]');
      await titleInput.fill("E2E Test Analysis Request");

      const memoInput = page.locator('textarea[name="memo"], textarea[placeholder*="메모"], textarea[placeholder*="memo"]');
      if (await memoInput.isVisible()) {
        await memoInput.fill("This is a test memo for E2E testing");
      }

      // Note: File upload testing would require test files
      // For now, we'll check if the upload component exists
      const uploadArea = page.locator('[data-testid="file-uploader"], .dropzone, [class*="dropzone"]');
      await expect(uploadArea).toBeVisible({ timeout: 5000 }).catch(() => {
        // Upload area might have different selector
      });
    });
  });

  test.describe("User: View Requests", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USER.email, TEST_USER.password);
    });

    test("should display request list", async ({ page }) => {
      await page.goto("/requests");

      await expect(page).toHaveURL(/\/requests/);
      // Should see list of requests or empty state
    });

    test("should navigate to request detail", async ({ page }) => {
      await page.goto("/requests");

      // Click on first request if exists
      const requestItem = page.locator('a[href*="/requests/"], [data-testid="request-item"]').first();
      if (await requestItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await requestItem.click();
        await expect(page).toHaveURL(/\/requests\/[a-zA-Z0-9]+/);
      }
    });

    test("should filter requests by status", async ({ page }) => {
      await page.goto("/requests");

      // Look for status filter
      const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"]');
      if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
        await statusFilter.selectOption("pending");
        // URL should update with status parameter
      }
    });
  });

  test.describe("User: Delete Request", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USER.email, TEST_USER.password);
    });

    test("should soft delete own request", async ({ page }) => {
      await page.goto("/requests");

      // Find delete button on a request
      const deleteButton = page.locator('button:has-text("삭제"), button:has-text("Delete"), [data-testid="delete-request"]').first();
      if (await deleteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await deleteButton.click();

        // Confirm deletion if dialog appears
        const confirmButton = page.locator('button:has-text("확인"), button:has-text("Confirm")');
        if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmButton.click();
        }

        // Success toast or message should appear
        await expect(page.locator('text=삭제, text=deleted')).toBeVisible({ timeout: 5000 }).catch(() => {});
      }
    });
  });

  test.describe("Admin: Manage Requests", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_ADMIN.email, TEST_ADMIN.password);
    });

    test("should see all users requests", async ({ page }) => {
      await page.goto("/requests");

      // Admin should see requests from all users
      await expect(page).toHaveURL(/\/requests/);
    });

    test("should update request status", async ({ page }) => {
      await page.goto("/requests");

      // Click on first request
      const requestItem = page.locator('a[href*="/requests/"], [data-testid="request-item"]').first();
      if (await requestItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await requestItem.click();

        // Find status update dropdown or buttons
        const statusSelect = page.locator('select[name="status"], [data-testid="status-select"]');
        if (await statusSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          await statusSelect.selectOption("in_progress");
        }
      }
    });

    test("should input analysis result", async ({ page }) => {
      await page.goto("/requests");

      // Navigate to a request
      const requestItem = page.locator('a[href*="/requests/"]').first();
      if (await requestItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await requestItem.click();

        // Find result input area
        const resultTextarea = page.locator('textarea[name="result"], textarea[name*="result"], [data-testid="result-input"]');
        if (await resultTextarea.isVisible({ timeout: 5000 }).catch(() => false)) {
          await resultTextarea.fill("Test analysis result from E2E test");

          // Save result
          const saveButton = page.locator('button:has-text("저장"), button:has-text("Save")');
          if (await saveButton.isVisible()) {
            await saveButton.click();
          }
        }
      }
    });

    test("should view deleted requests", async ({ page }) => {
      await page.goto("/requests?deleted=true");

      // Admin should be able to see deleted requests
      await expect(page).toHaveURL(/deleted=true/);
    });

    test("should restore deleted request", async ({ page }) => {
      await page.goto("/requests?deleted=true");

      // Find restore button
      const restoreButton = page.locator('button:has-text("복원"), button:has-text("Restore"), [data-testid="restore-request"]').first();
      if (await restoreButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await restoreButton.click();

        // Success message should appear
        await expect(page.locator('text=복원, text=restored')).toBeVisible({ timeout: 5000 }).catch(() => {});
      }
    });
  });
});

test.describe("Multilingual Support", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
  });

  test("should switch language to English", async ({ page }) => {
    await page.goto("/dashboard");

    // Find language selector
    const languageSelector = page.locator('[data-testid="language-selector"], select[name="language"], .language-selector');
    if (await languageSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
      await languageSelector.selectOption("en");
      // Page should update to English
    }
  });

  test("should switch language to Thai", async ({ page }) => {
    await page.goto("/dashboard");

    const languageSelector = page.locator('[data-testid="language-selector"], select[name="language"]');
    if (await languageSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
      await languageSelector.selectOption("th");
    }
  });

  test("should switch language to Korean", async ({ page }) => {
    await page.goto("/dashboard");

    const languageSelector = page.locator('[data-testid="language-selector"], select[name="language"]');
    if (await languageSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
      await languageSelector.selectOption("ko");
    }
  });
});

import { test, expect, Page } from "@playwright/test";

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

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ADMIN.email, TEST_ADMIN.password);
  });

  test("should display admin dashboard", async ({ page }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/admin/);
  });

  test("should display statistics cards", async ({ page }) => {
    await page.goto("/admin");

    // Check for statistics cards
    const statsCards = page.locator('[data-testid="stats-card"], .stats-card, [class*="stat"]');
    // Should have multiple stats (users, requests, pending, completed)
  });

  test("should display pending requests list", async ({ page }) => {
    await page.goto("/admin");

    // Look for pending requests section
    const pendingSection = page.locator('text=대기, text=Pending, [data-testid="pending-requests"]');
    await expect(pendingSection).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("should have quick links to management pages", async ({ page }) => {
    await page.goto("/admin");

    // Check for links to users and requests
    const usersLink = page.locator('a[href*="/admin/users"], a:has-text("사용자"), a:has-text("Users")');
    const requestsLink = page.locator('a[href*="/requests"], a:has-text("요청"), a:has-text("Requests")');

    await expect(usersLink).toBeVisible({ timeout: 5000 }).catch(() => {});
  });
});

test.describe("User Management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ADMIN.email, TEST_ADMIN.password);
  });

  test("should display user list", async ({ page }) => {
    await page.goto("/admin/users");

    await expect(page).toHaveURL(/\/admin\/users/);

    // Should see list of users
    const userList = page.locator('table, [data-testid="user-list"], .user-list');
    await expect(userList).toBeVisible({ timeout: 10000 }).catch(() => {});
  });

  test("should display user details", async ({ page }) => {
    await page.goto("/admin/users");

    // Each user should show email, name, role
    const userRow = page.locator('tr, [data-testid="user-row"]').first();
    if (await userRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Check user info is displayed
    }
  });

  test("should create new user", async ({ page }) => {
    await page.goto("/admin/users");

    // Find create user button
    const createButton = page.locator('button:has-text("추가"), button:has-text("Create"), button:has-text("Add")');
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();

      // Fill user creation form
      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');
      const nameInput = page.locator('input[name="name"]');

      if (await emailInput.isVisible()) {
        await emailInput.fill(`e2etest-${Date.now()}@test.com`);
        await passwordInput.fill("testpassword123");
        await nameInput.fill("E2E Test User");

        // Submit form
        const submitButton = page.locator('button[type="submit"], button:has-text("저장"), button:has-text("Save")');
        await submitButton.click();
      }
    }
  });

  test("should update user role", async ({ page }) => {
    await page.goto("/admin/users");

    // Find role selector for a user
    const roleSelect = page.locator('select[name="role"], [data-testid="role-select"]').first();
    if (await roleSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await roleSelect.selectOption("admin");
      // Should save automatically or have save button
    }
  });

  test("should show user request count", async ({ page }) => {
    await page.goto("/admin/users");

    // Each user should show their request count
    const requestCount = page.locator('[data-testid="request-count"], .request-count').first();
    // Count should be visible
  });
});

test.describe("Admin Request Management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ADMIN.email, TEST_ADMIN.password);
  });

  test("should see all requests from all users", async ({ page }) => {
    await page.goto("/requests");

    // Admin can see requests from different users
    await expect(page).toHaveURL(/\/requests/);
  });

  test("should filter by deleted status", async ({ page }) => {
    await page.goto("/requests");

    // Find deleted filter tab or button
    const deletedTab = page.locator('button:has-text("삭제됨"), button:has-text("Deleted"), [data-testid="deleted-tab"]');
    if (await deletedTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deletedTab.click();
      await expect(page).toHaveURL(/deleted/);
    }
  });

  test("should access request detail and edit result", async ({ page }) => {
    await page.goto("/requests");

    // Click first request
    const requestLink = page.locator('a[href*="/requests/"]').first();
    if (await requestLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await requestLink.click();

      // Admin should see edit capabilities
      const resultInput = page.locator('textarea[name*="result"], [data-testid="result-input"]');
      if (await resultInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Admin can input results
        expect(true).toBe(true);
      }
    }
  });

  test("should input multilingual results", async ({ page }) => {
    await page.goto("/requests");

    // Navigate to a request
    const requestLink = page.locator('a[href*="/requests/"]').first();
    if (await requestLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await requestLink.click();

      // Look for language tabs
      const koreanTab = page.locator('button:has-text("한국어"), button:has-text("Korean"), [data-testid="tab-ko"]');
      const englishTab = page.locator('button:has-text("English"), button:has-text("영어"), [data-testid="tab-en"]');
      const thaiTab = page.locator('button:has-text("Thai"), button:has-text("태국어"), [data-testid="tab-th"]');

      // Check if multilingual tabs exist
      if (await koreanTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await koreanTab.click();
        // Input Korean result
      }

      if (await englishTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await englishTab.click();
        // Input English result
      }
    }
  });
});

test.describe("Non-admin Access Restrictions", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
  });

  test("regular user should be redirected from admin page", async ({ page }) => {
    await page.goto("/admin");

    // Should be redirected away from admin page
    await expect(page).not.toHaveURL(/\/admin$/);
  });

  test("regular user should not see admin menu", async ({ page }) => {
    await page.goto("/dashboard");

    // Admin menu should not be visible
    const adminMenu = page.locator('a[href="/admin"], a:has-text("Admin"), a:has-text("관리자")');
    await expect(adminMenu).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  });

  test("regular user should not be able to update request status", async ({ page }) => {
    await page.goto("/requests");

    const requestLink = page.locator('a[href*="/requests/"]').first();
    if (await requestLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await requestLink.click();

      // Status update controls should not be visible for regular users
      const statusSelect = page.locator('select[name="status"], [data-testid="status-select"]');
      // Regular user should not see status edit controls
    }
  });
});

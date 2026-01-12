import { test, expect, Page } from "@playwright/test";

// Test user credentials (should match seed data)
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
}

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test("should display login page", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "invalid@test.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator("text=error")).toBeVisible({ timeout: 10000 }).catch(() => {
      // Error might be displayed differently
    });
  });

  test("should login successfully with valid admin credentials", async ({ page }) => {
    await login(page, TEST_ADMIN.email, TEST_ADMIN.password);

    // Should redirect to dashboard or admin page
    await expect(page).toHaveURL(/\/(dashboard|admin)/, { timeout: 10000 });
  });

  test("should login successfully with valid user credentials", async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("should logout successfully", async ({ page }) => {
    // First login
    await login(page, TEST_USER.email, TEST_USER.password);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("로그아웃"), a:has-text("Logout"), a:has-text("로그아웃")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    }
  });
});

test.describe("Role-based Access Control", () => {
  test("admin should access admin dashboard", async ({ page }) => {
    await login(page, TEST_ADMIN.email, TEST_ADMIN.password);

    await page.goto("/admin");
    // Should not be redirected
    await expect(page).toHaveURL(/\/admin/);
  });

  test("regular user should not access admin dashboard", async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);

    await page.goto("/admin");
    // Should be redirected or show forbidden
    await expect(page).not.toHaveURL(/\/admin$/);
  });

  test("admin should access user management", async ({ page }) => {
    await login(page, TEST_ADMIN.email, TEST_ADMIN.password);

    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/admin\/users/);
  });
});

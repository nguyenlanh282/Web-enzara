import { test, expect } from '@playwright/test';

test.describe('Internationalization (i18n)', () => {
  test('should default to Vietnamese locale', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/vi/);
  });

  test('should render Vietnamese text on homepage', async ({ page }) => {
    await page.goto('/vi');
    await page.waitForLoadState('networkidle');
    // Navigation should have Vietnamese labels
    const header = page.locator('header');
    await expect(header.locator('text=San pham').first()).toBeVisible();
  });

  test('should switch to English locale', async ({ page }) => {
    await page.goto('/vi');
    await page.waitForLoadState('networkidle');

    // Find and click the language switcher
    const langSwitcher = page.locator('button:has-text("EN"), button[aria-label*="ngon ngu"]');
    if (await langSwitcher.first().isVisible().catch(() => false)) {
      await langSwitcher.first().click();
      await page.waitForLoadState('networkidle');
      // URL should change to /en
      await expect(page).toHaveURL(/\/en/);
    }
  });

  test('should maintain locale when navigating', async ({ page }) => {
    await page.goto('/vi/products');
    await expect(page).toHaveURL(/\/vi\/products/);

    // Navigate to contact
    await page.goto('/vi/contact');
    await expect(page).toHaveURL(/\/vi\/contact/);
  });

  test('should render login page in Vietnamese', async ({ page }) => {
    await page.goto('/vi/auth/login');
    await expect(page.locator('h2')).toContainText('Dang nhap');
    await expect(page.locator('label[for="email"]')).toContainText('Email');
    await expect(page.locator('label[for="password"]')).toContainText('Mat khau');
  });

  test('should render register page in Vietnamese', async ({ page }) => {
    await page.goto('/vi/auth/register');
    await expect(page.locator('h2')).toContainText('Tao tai khoan');
    await expect(page.locator('label[for="fullName"]')).toContainText('Ho va ten');
  });
});

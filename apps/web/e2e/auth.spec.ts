import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/vi/auth/login');
      await expect(page.locator('h2')).toContainText('Dang nhap');
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/vi/auth/login');
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=Vui long nhap email')).toBeVisible();
    });

    test('should show validation error for invalid email', async ({ page }) => {
      await page.goto('/vi/auth/login');
      await page.locator('#email').fill('invalid-email');
      await page.locator('#password').fill('password123');
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=Email khong hop le')).toBeVisible();
    });

    test('should show validation error for short password', async ({ page }) => {
      await page.goto('/vi/auth/login');
      await page.locator('#email').fill('test@example.com');
      await page.locator('#password').fill('12345');
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=Mat khau toi thieu 6 ky tu')).toBeVisible();
    });

    test('should have link to register page', async ({ page }) => {
      await page.goto('/vi/auth/login');
      const registerLink = page.locator('a[href*="/auth/register"]');
      await expect(registerLink).toBeVisible();
      await registerLink.click();
      await expect(page).toHaveURL(/\/auth\/register/);
    });

    test('should have link to forgot password page', async ({ page }) => {
      await page.goto('/vi/auth/login');
      const forgotLink = page.locator('a[href*="/auth/forgot-password"]');
      await expect(forgotLink).toBeVisible();
    });
  });

  test.describe('Register Page', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/vi/auth/register');
      await expect(page.locator('h2')).toContainText('Tao tai khoan');
      await expect(page.locator('#fullName')).toBeVisible();
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#phone')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('#confirmPassword')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation errors for empty required fields', async ({ page }) => {
      await page.goto('/vi/auth/register');
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=Vui long nhap ho ten')).toBeVisible();
      await expect(page.locator('text=Vui long nhap email')).toBeVisible();
    });

    test('should show password mismatch error', async ({ page }) => {
      await page.goto('/vi/auth/register');
      await page.locator('#fullName').fill('Test User');
      await page.locator('#email').fill('test@example.com');
      await page.locator('#password').fill('password123');
      await page.locator('#confirmPassword').fill('differentpassword');
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=Mat khau xac nhan khong khop')).toBeVisible();
    });

    test('should have link to login page', async ({ page }) => {
      await page.goto('/vi/auth/register');
      const loginLink = page.locator('a[href*="/auth/login"]');
      await expect(loginLink).toBeVisible();
      await loginLink.click();
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });
});

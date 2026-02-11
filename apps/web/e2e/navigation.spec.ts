import { test, expect } from '@playwright/test';

test.describe('Navigation & Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/vi/);
    await expect(page.locator('text=Enzara')).toBeVisible();
  });

  test('should render header with logo and navigation', async ({ page }) => {
    await page.goto('/vi');
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.locator('text=Enzara').first()).toBeVisible();
  });

  test('should navigate to products page', async ({ page }) => {
    await page.goto('/vi');
    await page.locator('header a[href*="/products"]').first().click();
    await expect(page).toHaveURL(/\/products/);
  });

  test('should navigate to contact page', async ({ page }) => {
    await page.goto('/vi');
    await page.locator('header a[href*="/contact"]').first().click();
    await expect(page).toHaveURL(/\/contact/);
  });

  test('should navigate to order tracking page', async ({ page }) => {
    await page.goto('/vi/order-tracking');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should render footer', async ({ page }) => {
    await page.goto('/vi');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});

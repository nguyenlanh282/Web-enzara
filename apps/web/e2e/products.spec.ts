import { test, expect } from '@playwright/test';

test.describe('Product Browsing', () => {
  test('should display products listing page', async ({ page }) => {
    await page.goto('/vi/products');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display product cards', async ({ page }) => {
    await page.goto('/vi/products');
    // Wait for products to load (either cards or empty state)
    await page.waitForLoadState('networkidle');
    const productLinks = page.locator('a[href*="/products/"]');
    const count = await productLinks.count();
    // If products exist in DB, they should show as cards
    if (count > 0) {
      // Product cards should have images
      const firstCard = productLinks.first();
      await expect(firstCard).toBeVisible();
    }
  });

  test('should navigate to product detail from listing', async ({ page }) => {
    await page.goto('/vi/products');
    await page.waitForLoadState('networkidle');
    const productLinks = page.locator('a[href*="/products/"]');
    const count = await productLinks.count();

    if (count > 0) {
      const href = await productLinks.first().getAttribute('href');
      await productLinks.first().click();
      await expect(page).toHaveURL(/\/products\/.+/);
      // Product detail should show the product name in an h1
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });

  test('should display search page', async ({ page }) => {
    await page.goto('/vi/search?q=test');
    await expect(page).toHaveURL(/\/search/);
  });
});

test.describe('Product Detail', () => {
  test('should show product information', async ({ page }) => {
    await page.goto('/vi/products');
    await page.waitForLoadState('networkidle');
    const productLinks = page.locator('a[href*="/products/"]');
    const count = await productLinks.count();

    if (count > 0) {
      await productLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Product detail page elements
      await expect(page.locator('h1').first()).toBeVisible();
      // Price should be displayed (contains "d" for VND suffix)
      await expect(page.locator('text=/\\d+\\.\\d+đ/').first()).toBeVisible();
    }
  });
});

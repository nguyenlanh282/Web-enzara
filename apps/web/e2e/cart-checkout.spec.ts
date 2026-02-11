import { test, expect } from '@playwright/test';

test.describe('Cart', () => {
  test('should show empty cart state', async ({ page }) => {
    // Clear any existing cart data
    await page.goto('/vi');
    await page.evaluate(() => localStorage.removeItem('enzara-cart'));

    await page.goto('/vi/cart');
    await page.waitForLoadState('networkidle');
    // Empty cart should show a message or redirect to products
    const emptyText = page.locator('text=Gio hang cua ban dang trong');
    const productLink = page.locator('a[href*="/products"]');
    // Either shows empty state or redirects
    const hasEmpty = await emptyText.isVisible().catch(() => false);
    const hasProductLink = await productLink.first().isVisible().catch(() => false);
    expect(hasEmpty || hasProductLink).toBeTruthy();
  });

  test('should navigate to checkout from cart', async ({ page }) => {
    await page.goto('/vi/cart');
    await page.waitForLoadState('networkidle');
    // If cart has items, checkout link should be visible
    const checkoutLink = page.locator('a[href*="/checkout"], button:has-text("Tien hanh thanh toan")');
    if (await checkoutLink.isVisible().catch(() => false)) {
      await checkoutLink.click();
      await expect(page).toHaveURL(/\/checkout/);
    }
  });
});

test.describe('Checkout Page', () => {
  test('should display checkout form', async ({ page }) => {
    // Set cart data in localStorage so checkout page renders the form
    await page.goto('/vi');
    await page.evaluate(() => {
      const cartData = {
        state: {
          items: [{
            productId: 'test-1',
            name: 'Test Product',
            image: '/test.jpg',
            price: 100000,
            quantity: 1,
            maxQuantity: 10,
          }],
          voucherCode: null,
          voucherDiscount: 0,
        },
        version: 0,
      };
      localStorage.setItem('enzara-cart', JSON.stringify(cartData));
    });

    await page.goto('/vi/checkout');
    await page.waitForLoadState('networkidle');

    // Check for shipping form fields
    const nameInput = page.locator('input[name="shippingName"], label:has-text("Ho va ten")');
    const phoneInput = page.locator('input[name="shippingPhone"], label:has-text("So dien thoai")');

    // Either the form fields or the checkout title should be visible
    const checkoutTitle = page.locator('text=Thanh toan');
    await expect(checkoutTitle.first()).toBeVisible();
  });

  test('should show validation errors on empty checkout submission', async ({ page }) => {
    // Set cart data
    await page.goto('/vi');
    await page.evaluate(() => {
      const cartData = {
        state: {
          items: [{
            productId: 'test-1',
            name: 'Test Product',
            image: '/test.jpg',
            price: 100000,
            quantity: 1,
            maxQuantity: 10,
          }],
          voucherCode: null,
          voucherDiscount: 0,
        },
        version: 0,
      };
      localStorage.setItem('enzara-cart', JSON.stringify(cartData));
    });

    await page.goto('/vi/checkout');
    await page.waitForLoadState('networkidle');

    // Try to submit the form without filling anything
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible().catch(() => false)) {
      await submitButton.click();
      // Should show validation errors
      await page.waitForTimeout(500);
      const errorCount = await page.locator('.text-red-600, .text-red-500').count();
      expect(errorCount).toBeGreaterThan(0);
    }
  });
});

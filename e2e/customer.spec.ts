import { test, expect } from '@playwright/test';

test.describe('Customer Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to storefront homepage
        await page.goto('/');
    });

    test('should browse catalog and interact with the shopping cart', async ({ page }) => {
        // Verify catalog title (Curated Collections)
        const productsHeading = page.getByRole('heading', { name: 'Curated Collections' });
        await expect(productsHeading).toBeVisible();

        // Check that product cards are loaded (Crimson Romance is a seeded item)
        const crimsonRomanceCard = page.locator('div.group', { hasText: 'Crimson Romance' });
        await expect(crimsonRomanceCard).toBeVisible();

        // 1. Add item to cart
        const addBtn = crimsonRomanceCard.getByRole('button', { name: 'Add' });
        await expect(addBtn).toBeVisible();
        await addBtn.click();

        // Cart drawer should open automatically
        const cartDrawer = page.locator('div[role="dialog"]', { hasText: 'Shopping Cart' });
        await expect(cartDrawer).toBeVisible();

        // Verify cart item and count
        // Using .last() to target entering animation span because of AnimatePresence duplication
        const cartCount = page.locator('button[aria-label="Open Shopping Cart"] span').last();
        await expect(cartCount).toHaveText('1');
        await expect(cartDrawer.getByText('Crimson Romance')).toBeVisible();

        // 2. Increase quantity
        const increaseBtn = cartDrawer.getByRole('button', { name: '+' });
        await increaseBtn.click();
        await expect(cartCount).toHaveText('2');

        // 3. Decrease quantity
        const decreaseBtn = cartDrawer.getByRole('button', { name: '-' });
        await decreaseBtn.click();
        await expect(cartCount).toHaveText('1');

        // Close Cart Drawer
        await cartDrawer.getByLabel('Close cart').click();
        await expect(cartDrawer).not.toBeVisible();
    });

    test('should complete the full checkout flow', async ({ page }) => {
        // Add "Crimson Romance" to cart
        const crimsonRomanceCard = page.locator('div.group', { hasText: 'Crimson Romance' });
        await crimsonRomanceCard.getByRole('button', { name: 'Add' }).click();

        // Open Checkout Modal from Cart Drawer
        const cartDrawer = page.locator('div[role="dialog"]', { hasText: 'Shopping Cart' });
        await expect(cartDrawer).toBeVisible();
        
        const checkoutBtn = cartDrawer.getByRole('button', { name: 'Proceed to Checkout' });
        await expect(checkoutBtn).toBeVisible();
        await checkoutBtn.click();

        // Fill out Checkout Form
        const checkoutModal = page.locator('div[role="dialog"]', { hasText: 'Pickup Details' });
        await expect(checkoutModal).toBeVisible();

        // Resolve strict mode issues by using index selectors on input fields
        await checkoutModal.locator('input[type="text"]').first().fill('Jane Customer');
        await checkoutModal.locator('input[type="tel"]').fill('09123456789');

        // Set pickup date to tomorrow using local timezone
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        await checkoutModal.locator('input[type="date"]').fill(dateString);

        // Submit checkout
        await checkoutModal.getByRole('button', { name: 'Complete Pickup Order' }).click();

        // Verify Order Confirmation displays
        const summaryModal = page.locator('div[role="dialog"]', { hasText: 'Order Confirmation' });
        await expect(summaryModal).toBeVisible();
        await expect(summaryModal.getByText('Jane Customer')).toBeVisible();

        // Close summary modal
        await summaryModal.getByRole('button', { name: 'Close & Continue Shopping' }).click();
        await expect(summaryModal).not.toBeVisible();
    });
});

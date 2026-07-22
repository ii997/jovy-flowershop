import { test, expect } from '@playwright/test';

test.describe('Admin Panel Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to storefront homepage
        await page.goto('/');

        // Open login modal
        await page.getByRole('button', { name: 'Log In' }).click();

        // Click Admin quick login to authenticate as Rose Admin
        const modal = page.getByRole('dialog');
        const quickAdminBtn = modal.getByRole('button', { name: 'Admin', exact: true });
        await expect(quickAdminBtn).toBeVisible();
        await quickAdminBtn.click();

        // Confirm we are on the admin panel and URL redirects to /admin
        await expect(page).toHaveURL(/.*\/admin/);
        await expect(page.getByText('Sales Analytics Dashboard')).toBeVisible();
    });

    test('should view dashboard stats and navigate tabs', async ({ page }) => {
        // Dashboard Tab: verify stats are visible
        const grossSalesLabel = page.getByText('Gross Sales', { exact: true });
        await expect(grossSalesLabel).toBeVisible();

        // Navigate to Orders Queue
        const ordersTabBtn = page.getByRole('button', { name: 'Orders Queue' });
        await expect(ordersTabBtn).toBeVisible();
        await ordersTabBtn.click();

        // Verify orders queue layout / title
        await expect(page.getByRole('heading', { name: 'Orders Queue' })).toBeVisible();

        // Navigate to Inventory Tab
        const inventoryTabBtn = page.getByRole('button', { name: 'Inventory', exact: true });
        await expect(inventoryTabBtn).toBeVisible();
        await inventoryTabBtn.click();

        // Verify inventory list
        await expect(page.getByRole('heading', { name: 'Inventory Catalog' })).toBeVisible();
    });

    test('should manage product inventory details', async ({ page }) => {
        // Navigate to Inventory Tab
        const inventoryTabBtn = page.getByRole('button', { name: 'Inventory', exact: true });
        await inventoryTabBtn.click();

        // Verify Crimson Romance is visible in catalog list
        const productRow = page.locator('tr', { hasText: 'Crimson Romance' });
        await expect(productRow).toBeVisible();

        // Toggle availability status of Crimson Romance to Out of Stock
        const availabilityBtn = productRow.getByRole('button', { name: 'In Stock' });
        await expect(availabilityBtn).toBeVisible();
        await availabilityBtn.click();

        // Verify button toggles to Out of Stock
        const outOfStockBtn = productRow.getByRole('button', { name: 'Out of Stock' });
        await expect(outOfStockBtn).toBeVisible(); 

        // Toggle back to In Stock to keep the database state clean for other tests
        await outOfStockBtn.click();
        await expect(availabilityBtn).toBeVisible();
    });
});

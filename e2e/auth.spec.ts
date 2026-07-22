import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to storefront homepage before each test
        await page.goto('/');
    });

    test('should log in using credentials', async ({ page }) => {
        // Open Login Modal
        const loginBtn = page.getByRole('button', { name: 'Log In' });
        await expect(loginBtn).toBeVisible();
        await loginBtn.click();

        // Check if modal is visible
        const modal = page.getByRole('dialog');
        await expect(modal).toBeVisible();

        // Fill credentials inside the modal to avoid strict mode violations with the newsletter form
        await modal.locator('input[type="email"]').fill('customer@jovy.com');
        await modal.locator('input[type="password"]').fill('password');

        // Submit form
        await modal.getByRole('button', { name: 'Sign In' }).click();

        // Verify successful login (Header should show profile button with user name abbreviation or dropdown trigger)
        const profileBtn = page.getByRole('button', { name: 'Jane' });
        await expect(profileBtn).toBeVisible();
    });

    test('should log in using quick testing buttons', async ({ page }) => {
        // Open Login Modal
        await page.getByRole('button', { name: 'Log In' }).click();

        // Click "Admin" quick login button
        const modal = page.getByRole('dialog');
        const quickAdminBtn = modal.getByRole('button', { name: 'Admin', exact: true });
        await expect(quickAdminBtn).toBeVisible();
        await quickAdminBtn.click();

        // Verify admin panel is visible (Conditional rendering, URL doesn't change)
        await expect(page.getByText('Sales Analytics Dashboard')).toBeVisible();
    });

    test('should register a new customer account and log out', async ({ page }) => {
        // Open Login Modal
        await page.getByRole('button', { name: 'Log In' }).click();

        const modal = page.getByRole('dialog');
        // Switch to Sign Up tab
        const signUpTab = modal.getByRole('button', { name: 'Sign Up' });
        await expect(signUpTab).toBeVisible();
        await signUpTab.click();

        // Generate unique credentials to prevent duplication conflict
        const randomStr = Math.random().toString(36).substring(7);
        const name = `Test User ${randomStr}`;
        const email = `testuser_${randomStr}@example.com`;

        // Fill form fields inside modal
        await modal.locator('input[type="text"]').fill(name);
        await modal.locator('input[type="email"]').fill(email);
        await modal.locator('input[type="password"]').fill('securepassword');

        // Submit registration
        await modal.getByRole('button', { name: 'Create Account' }).click();

        // Verify logged in
        const profileBtn = page.locator('button', { hasText: 'Test' }).first();
        await expect(profileBtn).toBeVisible();

        // Log out
        await profileBtn.click();
        const logoutBtn = page.getByRole('button', { name: 'Log Out' });
        await expect(logoutBtn).toBeVisible();
        await logoutBtn.click();

        // Header should show "Log In" button again
        await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
    });
});

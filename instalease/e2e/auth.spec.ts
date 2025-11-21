/**
 * Authentication E2E Tests
 * 
 * End-to-end tests for authentication flows.
 * 
 * @module e2e/auth.spec
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('heading', { name: /Welcome to InstalEase/i })).toBeVisible();
    await expect(page.getByLabel(/email|phone/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/.*\/auth\/signup/);
    await expect(page.getByRole('heading', { name: /Create an Account/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Browser validation should prevent submission
    // Check if required fields are marked
    const emailInput = page.getByLabel(/email/i);
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeInvalid();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth/login');
    
    // Check that form is visible and usable on mobile
    await expect(page.getByRole('heading', { name: /Welcome to InstalEase/i })).toBeVisible();
    await expect(page.getByLabel(/email|phone/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });
});


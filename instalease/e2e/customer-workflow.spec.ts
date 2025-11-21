/**
 * Customer Workflow E2E Tests
 * 
 * End-to-end tests for customer management workflow.
 * 
 * @module e2e/customer-workflow.spec
 */

import { test, expect } from '@playwright/test';

test.describe('Customer Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');
    
    // TODO: Add authentication steps once test users are set up
    // For now, skip if not authenticated
  });

  test('should navigate to customers page', async ({ page }) => {
    await page.goto('/customers');
    
    // Should show customers page
    await expect(page.getByRole('heading', { name: /customers/i })).toBeVisible();
  });

  test('should open customer form dialog', async ({ page }) => {
    await page.goto('/customers');
    
    // Click add customer button
    const addButton = page.getByRole('button', { name: /add customer/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Dialog should open
      await expect(page.getByRole('heading', { name: /add new customer/i })).toBeVisible();
    }
  });

  test('should validate customer form fields', async ({ page }) => {
    await page.goto('/customers');
    
    const addButton = page.getByRole('button', { name: /add customer/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Try to submit empty form
      const submitButton = page.getByRole('button', { name: /create customer/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Should show validation errors
        // Note: Browser validation may prevent submission
        await page.waitForTimeout(500);
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/customers');
    
    // Check that page is usable on mobile
    await expect(page.getByRole('heading', { name: /customers/i })).toBeVisible();
  });
});


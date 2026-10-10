import { test, expect } from '@playwright/test';
import { setupApiMocks } from './fixtures/api-mock';

test.describe('Authoring Studio & Blueprint Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Authoring Studio' }).click();
    await expect(page.locator('app-authoring-studio')).toBeVisible();
  });

  test('should display active blueprint overview and metadata', async ({ page }) => {
    await expect(page.locator('app-authoring-studio h1')).toHaveText('Item Bank & Assessment Blueprints');

    // Blueprint summary card
    const summaryCard = page.locator('.blueprint-summary');
    await expect(summaryCard).toBeVisible();
    await expect(summaryCard.locator('.exam-select')).toBeVisible();

    // Duration and pass score cells
    await expect(summaryCard.locator('.meta-cell', { hasText: 'Duration' })).toContainText('60m');
    await expect(summaryCard.locator('.meta-cell', { hasText: 'Pass Score' })).toContainText('70%');
  });

  test('should open and close New Assessment blueprint modal', async ({ page }) => {
    await page.getByRole('button', { name: 'New Assessment' }).click();

    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toContainText('Create Assessment');

    // Close modal
    await modal.locator('.close-btn').click();
    await expect(modal).not.toBeVisible();
  });

  test('should open and close Add Item to Bank modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Item to Bank' }).click();

    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toContainText('Add New Question Item');

    // Close modal
    await modal.locator('.close-btn').click();
    await expect(modal).not.toBeVisible();
  });
});

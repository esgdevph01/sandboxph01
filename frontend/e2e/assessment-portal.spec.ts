import { test, expect } from '@playwright/test';
import { setupApiMocks } from './fixtures/api-mock';

test.describe('Assessment Portal Catalog & Launch Modal', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
  });

  test('should display portal stats and assessment catalog card', async ({ page }) => {
    // Check quick stats
    await expect(page.locator('.stat-card', { hasText: 'Published Assessments' })).toBeVisible();
    await expect(page.locator('.stat-card', { hasText: 'ISO 27001' })).toBeVisible();
    await expect(page.locator('.stat-card', { hasText: '99.98%' })).toBeVisible();

    // Check catalog card
    const card = page.locator('.assessment-card').first();
    await expect(card).toBeVisible();
    await expect(card.locator('.code-tag')).toHaveText('ICAS-CS-01');
    await expect(card.locator('.card-title')).toContainText('ICAS Computer Science');
    await expect(card.locator('.card-features')).toContainText('Active Proctoring');
  });

  test('should open candidate readiness modal and cancel', async ({ page }) => {
    // Click launch button on card
    await page.locator('.assessment-card').first().getByRole('button', { name: 'Launch Assessment' }).click();

    // Modal should be visible
    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toContainText('Candidate Identity & Exam Readiness');
    await expect(modal.locator('.readiness-checklist')).toBeVisible();

    // Close modal via close button
    await modal.locator('.close-btn').click();
    await expect(modal).not.toBeVisible();
  });

  test('should launch assessment via Candidate Verification modal', async ({ page }) => {
    // Click launch
    await page.locator('.assessment-card').first().getByRole('button', { name: 'Launch Assessment' }).click();

    // Fill candidate name and email
    const modal = page.locator('.modal-content');
    await modal.locator('#candidateName').fill('David Miller');
    await modal.locator('#candidateEmail').fill('david.miller@school.edu');

    // Click Start Exam Now
    await modal.getByRole('button', { name: 'Start Exam Now' }).click();

    // Candidate test player should now be active
    await expect(page.locator('app-test-player')).toBeVisible();
    await expect(page.locator('.exam-title')).toContainText('ICAS Computer Science');
  });
});

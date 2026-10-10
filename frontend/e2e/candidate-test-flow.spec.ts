import { test, expect } from '@playwright/test';
import { setupApiMocks } from './fixtures/api-mock';

test.describe('Candidate Test Taking & Examination Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');

    // Quick start exam
    await page.getByRole('button', { name: 'Quick Start ICAS Exam' }).click();
    await expect(page.locator('app-test-player')).toBeVisible();
  });

  test('should display test player header with countdown timer and candidate details', async ({ page }) => {
    // Top bar checks
    await expect(page.locator('.brand-badge')).toContainText('EG Delivery');
    await expect(page.locator('.exam-title')).toHaveText('ICAS Computer Science & Computational Thinking');
    await expect(page.locator('.candidate-tag')).toContainText('Alice Chen');
    await expect(page.locator('.timer-card')).toBeVisible();
    await expect(page.locator('.timer-caption')).toHaveText('Time Remaining');
  });

  test('should answer single-choice, multiple-choice, and essay questions', async ({ page }) => {
    // 1. Question 1: Single Choice
    await expect(page.locator('.question-prompt')).toContainText('worst-case time complexity');
    const optLog = page.locator('.option-card', { hasText: 'O(log n) logarithmic time' });
    await optLog.click();
    await expect(optLog).toHaveClass(/selected/);
    await expect(page.locator('.status-answered')).toContainText('Response Recorded');

    // 2. Navigate to Question 2 (Multiple Select)
    await page.getByRole('button', { name: 'Next Item' }).click();
    await expect(page.locator('.question-prompt')).toContainText('ACID principles');

    // Select options
    const optAtomicity = page.locator('.option-card', { hasText: 'Atomicity' });
    const optConsistency = page.locator('.option-card', { hasText: 'Consistency' });
    await optAtomicity.click();
    await optConsistency.click();
    await expect(optAtomicity).toHaveClass(/selected/);
    await expect(optConsistency).toHaveClass(/selected/);

    // 3. Navigate to Question 3 (Essay)
    await page.getByRole('button', { name: 'Next Item' }).click();
    await expect(page.locator('.question-prompt')).toContainText('tradeoffs between synchronous HTTP/REST');
    const essayArea = page.locator('.essay-textarea');
    await essayArea.fill('Asynchronous event-driven communication decouples services temporally and spatially.');
    await expect(page.locator('.word-counter')).toContainText('words');

    // 4. Test question palette navigation back to item 1
    const firstPaletteBtn = page.locator('.palette-drawer .palette-grid button').first();
    await firstPaletteBtn.click();
    await expect(page.locator('.question-prompt')).toContainText('worst-case time complexity');
  });

  test('should open review modal, submit assessment, and display scorecard', async ({ page }) => {
    // Click Review & Submit in footer
    await page.getByRole('button', { name: 'Review & Submit' }).click();

    // Verify Review Modal
    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toContainText('Confirm Assessment Submission');
    await expect(modal.locator('.review-stats-grid')).toBeVisible();

    // Confirm submission
    await modal.getByRole('button', { name: 'Seal & Submit Final Exam' }).click();

    // Scorecard should be presented
    await expect(page.locator('.results-container .scorecard')).toBeVisible();
    await expect(page.locator('.scorecard h2')).toContainText('Candidate Performance Scorecard');
    await expect(page.locator('.score-tile.primary .tile-val')).toHaveText('85%');
    await expect(page.locator('.score-tile .tile-lbl', { hasText: 'Integrity Index' })).toBeVisible();

    // Return to portal
    await page.getByRole('button', { name: 'Return to Assessments Portal' }).click();
    await expect(page.locator('app-assessment-portal')).toBeVisible();
  });
});

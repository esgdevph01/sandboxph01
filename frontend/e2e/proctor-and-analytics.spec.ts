import { test, expect } from '@playwright/test';
import { setupApiMocks } from './fixtures/api-mock';

test.describe('Proctoring Integrity & Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
  });

  test('should display proctoring session audit table and candidate telemetry', async ({ page }) => {
    await page.getByRole('button', { name: 'Proctoring & Marking' }).click();
    await expect(page.locator('app-proctor-marking')).toBeVisible();

    // Verify session table
    const table = page.locator('.session-table');
    await expect(table).toBeVisible();
    await expect(table.locator('tbody tr')).toHaveCount(1);
    await expect(table.locator('.cand-name')).toHaveText('Alice Chen');
    await expect(table.locator('.cand-id')).toHaveText('REG-2026-9901');

    // Refresh feed button
    await expect(page.getByRole('button', { name: 'Refresh Feed' })).toBeVisible();
  });

  test('should display psychometrics KPI cards and competency mastery chart', async ({ page }) => {
    await page.getByRole('button', { name: 'Psychometrics & Insights' }).click();
    await expect(page.locator('app-analytics-dashboard')).toBeVisible();

    // KPI cards
    const kpiGrid = page.locator('.kpi-grid');
    await expect(kpiGrid).toBeVisible();
    await expect(kpiGrid.locator('.kpi-card', { hasText: 'Overall Pass Rate' })).toContainText('88.5%');
    await expect(kpiGrid.locator('.kpi-card', { hasText: 'Cohort Mean Score' })).toContainText('79.2%');
    await expect(kpiGrid.locator('.kpi-card', { hasText: 'Security & Integrity Index' })).toContainText('96.8%');
    await expect(kpiGrid.locator('.kpi-card', { hasText: 'Exams Administered' })).toContainText('42');

    // Competency breakdown
    await expect(page.locator('.chart-card', { hasText: 'Curriculum Competency Mastery' })).toBeVisible();
  });
});

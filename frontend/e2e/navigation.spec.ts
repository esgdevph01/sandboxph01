import { test, expect } from '@playwright/test';
import { setupApiMocks } from './fixtures/api-mock';

test.describe('Platform Navigation & Shell', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
  });

  test('should display brand header and default to Assessment Portal', async ({ page }) => {
    await expect(page.locator('.brand-title')).toHaveText('EG');
    await expect(page.locator('.brand-sub')).toHaveText('Assessment Suite');

    // Default tab should be Assessment Portal
    const portalTab = page.locator('.nav-tab.active');
    await expect(portalTab).toContainText('Assessment Portal');

    // Main header in portal
    await expect(page.locator('app-assessment-portal h1')).toContainText('EG Digital Assessment Hub');
  });

  test('should navigate between Authoring Studio, Proctoring, and Analytics tabs', async ({ page }) => {
    // 1. Navigate to Authoring Studio
    await page.getByRole('button', { name: 'Authoring Studio' }).click();
    await expect(page.locator('app-authoring-studio')).toBeVisible();
    await expect(page.locator('app-authoring-studio h1')).toContainText('Item Bank & Assessment Blueprints');

    // 2. Navigate to Proctoring & Marking
    await page.getByRole('button', { name: 'Proctoring & Marking' }).click();
    await expect(page.locator('app-proctor-marking')).toBeVisible();
    await expect(page.locator('app-proctor-marking h1')).toContainText('Live Integrity Telemetry & Rubric Grading');

    // 3. Navigate to Psychometrics & Insights
    await page.getByRole('button', { name: 'Psychometrics & Insights' }).click();
    await expect(page.locator('app-analytics-dashboard')).toBeVisible();
    await expect(page.locator('app-analytics-dashboard h1')).toContainText('Psychometrics & Examination Analytics');

    // 4. Return to Assessment Portal
    await page.getByRole('button', { name: 'Assessment Portal' }).click();
    await expect(page.locator('app-assessment-portal')).toBeVisible();
  });
});

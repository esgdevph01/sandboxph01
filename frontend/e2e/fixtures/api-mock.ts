import { Page } from '@playwright/test';
import { mockAssessments, mockSession, mockSubmittedSession, mockAnalytics } from './mock-data';

export async function setupApiMocks(page: Page) {
  // Health check
  await page.route('**/api/health', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'healthy', platform: '.NET Framework 4.8' }),
    });
  });

  // Assessments list
  await page.route('**/api/assessments', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAssessments),
      });
    } else {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(mockAssessments[0]),
      });
    }
  });

  // Single assessment
  await page.route('**/api/assessments/*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockAssessments[0]),
    });
  });

  // Start Session
  await page.route('**/api/sessions/start', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSession),
    });
  });

  // Save Answer
  await page.route('**/api/sessions/*/answer', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSession),
    });
  });

  // Submit Exam
  await page.route('**/api/sessions/*/submit', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSubmittedSession),
    });
  });

  // Sessions list
  await page.route('**/api/sessions', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([mockSubmittedSession]),
    });
  });

  // Analytics
  await page.route('**/api/analytics*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockAnalytics),
    });
  });
}

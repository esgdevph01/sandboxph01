# Playwright Test Guidelines

When writing, refactoring, or running Playwright tests in this workspace, follow these conventions:

## 1. Locators & Selectors
- Prioritize user-facing, accessible locators over CSS/XPath:
  - Prefer `page.getByRole()`, `page.getByLabel()`, `page.getByText()`, and `page.getByTestId()`.
  - Avoid structural CSS classes (e.g., `.btn-primary`, `div > span:first-child`) and raw XPath.
- Always chain locators using standard Playwright methods rather than manual querying.

## 2. Asynchronous Flow & Assertions
- Use web-first assertions from `expect`:
  - Prefer `await expect(locator).toBeVisible()` or `await expect(locator).toHaveText()` instead of inspecting properties manually.
  - Never use manual delay helpers (e.g., `page.waitForTimeout()`). Rely on Playwright's automatic retry and polling.

## 3. Architecture & Test Design
- Organize complex workflows using the Page Object Model (POM):
  - Place page objects under `tests/pages/` or `pages/`.
  - Encapsulate page locators and actions inside page classes.
- Keep tests isolated: do not share state or rely on test execution order.
- Always use standard fixtures (`{ page }`, `{ context }`) rather than instantiating browsers directly in test cases.

## 4. Execution & Debugging
- When investigating test failures, run tests with `--headed` or inspect the trace using `npx playwright show-trace trace.zip`.
- Do not commit generated artifacts (`test-results/`, `playwright-report/`, `blob-report/`).


# CI/CD Guidelines for Playwright (GitHub Actions)

When creating, updating, or debugging GitHub Actions workflows for Playwright, enforce these rules:

## 1. Workflow Architecture & Triggers
- Place workflows under `.github/workflows/playwright.yml`.
- Trigger on `push` and `pull_request` against primary branches (`main`, `master`), plus `workflow_dispatch`.
- Set job timeouts explicitly (e.g., `timeout-minutes: 60`) to avoid hung runner billing.

## 2. Dependency & Browser Installation
- Always run `npx playwright install --with-deps` (or cache binaries) to ensure required system libraries exist on the runner.
- Pin Node.js version using `actions/setup-node@v4` with standard lockfile caching (`cache: 'npm'` or `'pnpm'`).

## 3. Sharding & Scalability
- For suites with more than 10 test files, recommend test sharding via build matrices:
  - Matrix strategy: `shardIndex: [1, 2, 3, 4]`, `shardTotal: [4]`.
  - Pass `--shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}` to `npx playwright test`.

## 4. Reports & Artifacts Handling
- Always upload the `playwright-report/` artifact on completion using `actions/upload-artifact@v4` with condition `if: ${{ !cancelled() }}`.
- Set retention limits (e.g., `retention-days: 14` or `30`) to control storage usage.

## 5. Standard Workflow Reference Template
---
title: Use Deferrable Views for Heavy and Non-Critical UI
impact: HIGH
impactDescription: Drastically cuts initial bundle size, improves Largest Contentful Paint (LCP), and defers rendering until needed.
tags: performance, defer, lcp, code-splitting
---

## Use Deferrable Views for Heavy and Non-Critical UI

**Impact: HIGH (lowers initial bundle size and accelerates time-to-interactive)**

Use Angular's built-in `@defer` blocks to lazy-load standalone components, directives, and pipes. The compiler automatically code-splits components referenced inside `@defer` into separate chunk files.

**Incorrect (eager loading heavy components):**

```html
<!-- Loads heavy chart library and rich editor on initial app startup -->
<div class="dashboard">
  <app-exam-stats-chart [stats]="stats()" />
  <app-rich-feedback-editor [studentId]="id()" />
</div>
```

**Correct (defer on viewport or interaction with placeholder):**

```html
<div class="dashboard">
  <!-- Chart loads only when scrolled into the viewport -->
  @defer (on viewport; prefetch on idle) {
    <app-exam-stats-chart [stats]="stats()" />
  } @placeholder {
    <div class="skeleton-chart" style="height: 300px;">Loading analytics...</div>
  } @loading (minimum 200ms) {
    <div class="spinner">Rendering chart...</div>
  } @error {
    <p>Failed to load analytics module.</p>
  }
</div>
```

Reference: [Angular Deferrable Views Guide](https://angular.dev/guide/defer)

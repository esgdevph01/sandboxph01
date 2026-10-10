---
title: Provide Unique Tracking Expressions in @for Loops
impact: CRITICAL
impactDescription: Prevents complete DOM destruction and re-creation on array mutations, preserving input focus, scroll, and animation states.
tags: template, performance, @for, track
---

## Provide Unique Tracking Expressions in @for Loops

**Impact: CRITICAL (DOM stability and high rendering performance)**

In modern Angular, `track` is mandatory in `@for` loops. Crucially, do NOT blindly track `$index` if the data items have a unique property like `id` or `code`. Tracking `$index` causes unnecessary re-renders and subtle UI bugs (like form controls preserving incorrect state) when items are inserted, deleted, or reordered.

**Incorrect (tracking index when items have distinct IDs):**

```html
<!-- Re-renders and confuses form inputs if an item is prepended or sorted -->
@for (item of questions(); track $index) {
  <app-question-card [question]="item" />
}
```

**Correct (tracking unique identifier):**

```html
<!-- Efficiently updates, moves, or removes only modified DOM elements -->
@for (item of questions(); track item.id) {
  <app-question-card [question]="item" />
}
```

*Note:* Use `track $index` only for static, immutable primitive arrays where items have no identifier and never change position.

Reference: [Angular @for tracking](https://angular.dev/guide/control-flow#for-loop)

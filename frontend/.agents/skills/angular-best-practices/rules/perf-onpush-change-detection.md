---
title: Always Enforce ChangeDetectionStrategy.OnPush
impact: CRITICAL
impactDescription: Eliminates 70-90% of redundant change detection checks across the component tree.
tags: performance, onpush, change-detection
---

## Always Enforce ChangeDetectionStrategy.OnPush

**Impact: CRITICAL (massive CPU and frame rate optimization)**

By default (`ChangeDetectionStrategy.Default`), Angular checks every single component in the entire application whenever any asynchronous event happens (click, timer, HTTP response). With `ChangeDetectionStrategy.OnPush`, Angular only checks the component if:
1. One of its `@Input` / `input()` signals has changed identity/value.
2. An event handler inside its template is triggered.
3. A signal read in its template notifies of a change.
4. `ChangeDetectorRef.markForCheck()` is explicitly called.

**Incorrect (Default change detection strategy):**

```typescript
@Component({
  selector: 'app-exam-timer',
  standalone: true,
  template: `<div>{{ formattedTime }}</div>`
  // Missing changeDetection -> defaults to Default!
})
export class ExamTimerComponent { ... }
```

**Correct (Explicit OnPush):**

```typescript
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'app-exam-timer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div>{{ formattedTime() }}</div>`
})
export class ExamTimerComponent {
  readonly formattedTime = signal('10:00');
}
```

Reference: [Angular OnPush Change Detection](https://angular.dev/best-practices/runtime-performance#onpush)

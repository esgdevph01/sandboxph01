---
title: Automatically Clean Up Subscriptions with takeUntilDestroyed
impact: HIGH
impactDescription: Prevents memory leaks, dangling listeners, and phantom execution when components are destroyed.
tags: rxjs, memory-leak, takeuntildestroyed, lifecycle
---

## Automatically Clean Up Subscriptions with takeUntilDestroyed

**Impact: HIGH (guarantees subscription disposal without ngOnDestroy boilerplate)**

Manually tracking subscriptions with `Subscription.unsubscribe()` or a `destroy$ = new Subject<void>()` pattern in `ngOnDestroy` is verbose and error-prone. Modern Angular provides `takeUntilDestroyed()`, which ties into Angular's `DestroyRef` automatically when used in an injection context (e.g. constructor or property initializer).

**Incorrect (manual Subscription tracking with risk of leaks):**

```typescript
export class TestMonitorComponent implements OnInit, OnDestroy {
  private sub?: Subscription;

  ngOnInit() {
    this.sub = this.telemetryService.pollStatus().subscribe(data => {
      this.handleUpdate(data);
    });
  }

  ngOnDestroy() {
    // If developer forgets this, subscription leaks forever!
    this.sub?.unsubscribe();
  }
}
```

**Correct (takeUntilDestroyed in injection context):**

```typescript
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-test-monitor',
  standalone: true,
  template: `...`
})
export class TestMonitorComponent {
  private readonly telemetry = inject(TelemetryService);

  constructor() {
    this.telemetry.pollStatus()
      .pipe(takeUntilDestroyed())
      .subscribe(data => this.handleUpdate(data));
  }
}
```

*Note:* If used outside an injection context (e.g., inside a method), pass `DestroyRef`: `.pipe(takeUntilDestroyed(this.destroyRef))`.

Reference: [Angular takeUntilDestroyed](https://angular.dev/ecosystem/rxjs-interop#takeuntildestroyed)

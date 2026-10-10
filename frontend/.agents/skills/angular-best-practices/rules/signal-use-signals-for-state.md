---
title: Use Signals for Synchronous Local State
impact: CRITICAL
impactDescription: Eliminates manual change detection triggers, enables zoneless readiness, and delivers fine-grained reactivity.
tags: signals, reactivity, state, performance
---

## Use Signals for Synchronous Local State

**Impact: CRITICAL (fine-grained reactivity and OnPush compatibility)**

In modern Angular (v16+ and especially v17-19+), local component state and view-model state should be managed using Angular Signals (`signal()`). Signals notify Angular precisely which template nodes need updating without checking the whole component tree, enabling seamless `OnPush` change detection and preparing the app for zoneless mode.

**Incorrect (raw mutable properties or manual change detection calls):**

```typescript
import { Component, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <button (click)="increment()">Count: {{ count }}</button>
  `
})
export class CounterComponent {
  count = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  increment() {
    this.count++;
    this.cdr.markForCheck(); // Fragile manual coordination
  }
}
```

**Correct (signal-based state):**

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button (click)="increment()">Count: {{ count() }}</button>
  `
})
export class CounterComponent {
  readonly count = signal(0);

  increment() {
    this.count.update(c => c + 1);
  }
}
```

Reference: [Angular Signals Guide](https://angular.dev/guide/signals)

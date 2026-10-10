---
title: Use Signal Inputs, Outputs, and Model
impact: HIGH
impactDescription: Eliminates decorator boilerplate, provides type safety and read-only guarantees, and enables reactive derivation.
tags: signals, inputs, outputs, model
---

## Use Signal Inputs, Outputs, and Model

**Impact: HIGH (simpler API, reliable change propagation)**

Prefer signal inputs (`input()`, `input.required()`), `output()`, and two-way `model()` over legacy `@Input()`, `@Output()`, and `EventEmitter`. Signal inputs produce read-only signals that integrate directly into `computed()` expressions and template reactivity.

**Incorrect (legacy decorators):**

```typescript
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-user-badge',
  template: `<span>{{ displayName }}</span>`
})
export class UserBadgeComponent implements OnChanges {
  @Input({ required: true }) firstName!: string;
  @Input({ required: true }) lastName!: string;
  @Output() selectUser = new EventEmitter<void>();

  displayName = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['firstName'] || changes['lastName']) {
      this.displayName = `${this.firstName} ${this.lastName}`;
    }
  }
}
```

**Correct (signal inputs & computed derivation):**

```typescript
import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-user-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span (click)="selectUser.emit()">{{ displayName() }}</span>
  `
})
export class UserBadgeComponent {
  readonly firstName = input.required<string>();
  readonly lastName = input.required<string>();
  readonly selectUser = output<void>();

  // Derived synchronously and reactively without ngOnChanges!
  readonly displayName = computed(() => `${this.firstName()} ${this.lastName()}`);
}
```

Reference: [Angular Signal Inputs](https://angular.dev/guide/signals/inputs)

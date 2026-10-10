---
title: Convert Observables to Signals for Template Consumption
impact: HIGH
impactDescription: Eliminates async pipe clutter, prevents duplicate subscriptions, and unifies reactive state access.
tags: rxjs, signals, tosignal, async-pipe
---

## Convert Observables to Signals for Template Consumption

**Impact: HIGH (cleaner templates, unified signal ergonomics, zero subscription leaks)**

When consuming asynchronous data streams in templates (such as HTTP calls, WebSocket events, or route params), convert the Observable into a Signal using `toSignal()`. `toSignal()` automatically subscribes, updates the signal on new values, and unregisters when the component or service is destroyed.

**Incorrect (multiple async pipe subscriptions or manual subscription fields):**

```html
<!-- Re-subscribes multiple times for the same Observable stream! -->
<div *ngIf="user$ | async as user">
  <h2>{{ (user$ | async)?.name }}</h2>
  <span>{{ (user$ | async)?.email }}</span>
</div>
```

**Correct (convert to Signal with toSignal):**

```typescript
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  template: `
    @if (user(); as u) {
      <h2>{{ u.name }}</h2>
      <span>{{ u.email }}</span>
    }
  `
})
export class UserProfileComponent {
  private readonly userService = inject(UserService);

  // Automatically manages subscription lifecycle
  readonly user = toSignal(this.userService.getCurrentUser(), { initialValue: null });
}
```

Reference: [Angular toSignal Interop](https://angular.dev/ecosystem/rxjs-interop#tosignal)

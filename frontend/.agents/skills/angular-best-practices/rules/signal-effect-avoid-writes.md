---
title: Avoid Writing to Signals Inside Effects
impact: CRITICAL
impactDescription: Prevents circular re-renders, unintended state cascades, and performance penalties.
tags: signals, effect, antipatterns
---

## Avoid Writing to Signals Inside Effects

**Impact: CRITICAL (prevents infinite dependency loops)**

Writing to signals inside an `effect()` is discouraged and requires `allowSignalWrites: true` as a code smell warning. Almost all use-cases where someone tries to set a signal inside an `effect()` can and should be modeled using `computed()` or an event handler.

**Incorrect (synchronizing state via effect write):**

```typescript
export class UserProfileComponent {
  readonly user = input.required<User>();
  readonly fullName = signal('');

  constructor() {
    // ❌ Anti-pattern: using effect to update another signal
    effect(() => {
      this.fullName.set(`${this.user().firstName} ${this.user().lastName}`);
    }, { allowSignalWrites: true });
  }
}
```

**Correct (derive synchronously via computed):**

```typescript
export class UserProfileComponent {
  readonly user = input.required<User>();
  
  // ✅ Declarative, synchronous, no cycles possible
  readonly fullName = computed(() => `${this.user().firstName} ${this.user().lastName}`);
}
```

Reference: [Angular Effects Guide](https://angular.dev/guide/signals#effects)

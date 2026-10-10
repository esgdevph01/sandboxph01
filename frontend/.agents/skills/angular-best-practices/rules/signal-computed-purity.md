---
title: Ensure Computed Signals Are Pure
impact: HIGH
impactDescription: Prevents unpredictable re-evaluations, infinite loops, and debugging nightmares.
tags: signals, computed, purity
---

## Ensure Computed Signals Are Pure

**Impact: HIGH (predictable execution, glitch-free reactivity)**

`computed()` signals must strictly be pure functions of other signals. Never trigger side effects (API calls, logging, mutating external variables) inside a `computed()` callback. Angular computes them lazily and memoizes their result until dependencies change.

**Incorrect (side-effect in computed):**

```typescript
readonly fullPrice = computed(() => {
  const base = this.basePrice();
  const tax = this.taxRate();
  const total = base * (1 + tax);
  // ❌ Side effects inside computed are strictly prohibited
  this.analytics.trackPriceCalculation(total);
  this.cachedLastTotal = total;
  return total;
});
```

**Correct (pure derivation):**

```typescript
readonly fullPrice = computed(() => {
  const base = this.basePrice();
  const tax = this.taxRate();
  return base * (1 + tax);
});

// Side-effects belong in event handlers or an explicit effect()
constructor() {
  effect(() => {
    const total = this.fullPrice();
    untracked(() => this.analytics.trackPriceCalculation(total));
  });
}
```

Reference: [Angular Computed Signals](https://angular.dev/guide/signals#computed-signals)

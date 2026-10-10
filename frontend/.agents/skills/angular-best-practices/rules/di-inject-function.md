---
title: Prefer the Functional inject() Over Constructor Injection
impact: MEDIUM-HIGH
impactDescription: Drastically simplifies inheritance, improves readability, and enables reusable injection utility functions.
tags: di, dependency-injection, inject
---

## Prefer the Functional inject() Over Constructor Injection

**Impact: MEDIUM-HIGH (cleaner inheritance, zero super() parameter drilling, composable DI helpers)**

Angular's `inject()` function is the modern standard for resolving dependencies. It removes the need for bulky constructor parameter lists, makes class inheritance much simpler (derived classes don't need to pass parent dependencies through `super(...)`), and allows creating reusable functional composition helpers.

**Incorrect (verbose constructor injection):**

```typescript
export class AssessmentBaseComponent {
  constructor(
    protected router: Router,
    protected api: AssessmentApiService,
    protected route: ActivatedRoute
  ) {}
}

export class CustomAssessmentComponent extends AssessmentBaseComponent {
  constructor(
    router: Router,
    api: AssessmentApiService,
    route: ActivatedRoute,
    private extraService: ExtraService
  ) {
    super(router, api, route); // ❌ Tedious parameter maintenance
  }
}
```

**Correct (inject() function):**

```typescript
export class AssessmentBaseComponent {
  protected readonly router = inject(Router);
  protected readonly api = inject(AssessmentApiService);
  protected readonly route = inject(ActivatedRoute);
}

export class CustomAssessmentComponent extends AssessmentBaseComponent {
  private readonly extraService = inject(ExtraService); // ✅ Clean and decoupled
}
```

Reference: [Angular Dependency Injection with inject()](https://angular.dev/guide/di/dependency-injection-context#inject)

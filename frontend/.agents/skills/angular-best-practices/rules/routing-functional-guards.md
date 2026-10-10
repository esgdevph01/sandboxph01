---
title: Use Functional Router Guards and Resolvers
impact: MEDIUM
impactDescription: Eliminates boilerplate injectable guard classes, tree-shakes unused guards, and simplifies testability.
tags: routing, guards, canactivatefn, resolvers
---

## Use Functional Router Guards and Resolvers

**Impact: MEDIUM (streamlined route configurations and smaller bundles)**

Class-based guards (`implements CanActivate`) and resolvers are deprecated in favor of functional guards (`CanActivateFn`, `CanMatchFn`, `CanDeactivateFn`) and resolvers (`ResolveFn`). Functional guards can directly use `inject()` within their body to retrieve services.

**Incorrect (class-based guard):**

```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ProctorAuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    return this.authService.isProctor() ? true : this.router.parseUrl('/unauthorized');
  }
}
```

**Correct (functional guard CanActivateFn):**

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const proctorAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isProctor()
    ? true
    : router.parseUrl('/unauthorized');
};
```

Reference: [Angular Functional Guards](https://angular.dev/guide/routing/common-router-tasks#preventing-unauthorized-access)

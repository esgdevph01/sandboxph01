---
title: Use Strictly Typed Reactive Forms with NonNullableFormBuilder
impact: MEDIUM-HIGH
impactDescription: Eliminates runtime null pointer errors and provides compiler-enforced form value typings.
tags: forms, reactive-forms, typed-forms, nonnullable
---

## Use Strictly Typed Reactive Forms with NonNullableFormBuilder

**Impact: MEDIUM-HIGH (end-to-end type safety in form values and controls)**

Untyped forms or loosely typed forms often cause runtime bugs when `.value` produces `null | undefined` for reset fields. Use `NonNullableFormBuilder` (or `FormRecord` for dynamic key-value maps) to ensure form values always preserve their intended initial types.

**Incorrect (untyped or loosely typed form):**

```typescript
export class CandidateRegistrationComponent {
  form = new FormGroup({
    email: new FormControl(''),
    fullName: new FormControl('')
  });

  submit() {
    // form.value.email is string | null | undefined!
    const email: string = this.form.value.email; // Type error or runtime null!
  }
}
```

**Correct (NonNullableFormBuilder with explicit interface):**

```typescript
import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, Validators, FormControl } from '@angular/forms';

interface CandidateRegistrationForm {
  email: FormControl<string>;
  fullName: FormControl<string>;
}

@Component({
  selector: 'app-candidate-registration',
  standalone: true,
  template: `...`
})
export class CandidateRegistrationComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group<CandidateRegistrationForm>({
    email: this.fb.control('', { validators: [Validators.required, Validators.email] }),
    fullName: this.fb.control('', { validators: [Validators.required] })
  });

  submit() {
    // form.getRawValue() is strictly { email: string; fullName: string }
    const payload = this.form.getRawValue();
    console.log(payload.email.toLowerCase());
  }
}
```

Reference: [Angular Strictly Typed Reactive Forms](https://angular.dev/guide/forms/typed-forms)

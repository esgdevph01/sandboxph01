---
name: angular-best-practices
description: Modern Angular (v17-v19+) best practices, performance optimization, signal-based reactivity, standalone architecture, and design patterns. Use when writing, reviewing, refactoring, or optimizing Angular components, services, templates, routing, state management, or forms.
license: MIT
metadata:
  version: "1.0.0"
---

# Angular Best Practices (v17-v19+)

Comprehensive architectural and performance guidelines for modern Angular applications. Contains actionable rules across 7 core categories, prioritized by impact to guide code generation, refactoring, and code reviews.

## When to Apply

Reference these guidelines when:
- Creating new Angular components, directives, pipes, or services
- Implementing component reactivity and state management
- Writing templates with modern control flow (`@if`, `@for`, `@defer`)
- Refactoring legacy decorator-based code (`@Input`, `@Output`, `@ViewChild`) to Signal APIs
- Managing asynchronous streams and RxJS subscriptions
- Setting up routes, guards, resolvers, and lazy loading
- Reviewing Angular code for performance, memory leaks, or maintainability

---

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | Focus |
|----------|----------|--------|--------|-------|
| 1 | Signal Reactivity & State | CRITICAL | `signal-` | Signals-first reactive model, immutability, computed derivation |
| 2 | Change Detection & Performance | CRITICAL | `perf-` | `OnPush`, zoneless readiness, deferrable views, image optimization |
| 3 | Modern Template Syntax | HIGH | `template-` | Built-in control flow, tracking, deferral, pure pipes |
| 4 | RxJS Interop & Resource Cleanup | HIGH | `rxjs-` | `takeUntilDestroyed`, `toSignal`, avoiding nested subscriptions |
| 5 | Dependency Injection & Services | MEDIUM-HIGH | `di-` | Functional `inject()`, singleton root vs feature scoping |
| 6 | Routing & Lazy Loading | MEDIUM | `routing-` | Functional guards, standalone route components, chunk splitting |
| 7 | Forms & Validation | MEDIUM | `forms-` | Typed reactive forms, validator composition, clean updates |

---

## Quick Reference

### 1. Signal Reactivity & State (CRITICAL)
- `signal-use-signals-for-state` - Use Angular Signals (`signal()`) for synchronous component and local state instead of raw properties or manual Subject/BehaviorSubject.
- `signal-signal-inputs-outputs` - Prefer signal inputs `input()`, `input.required()`, `output()`, and two-way `model()` over `@Input()` and `@Output()`.
- `signal-computed-purity` - Use `computed()` strictly for pure derived state; never perform side effects or mutate values inside computed.
- `signal-effect-avoid-writes` - Do not write to signals inside `effect()`; use `computed()` for dependencies or handle writes in event listeners.
- `signal-queries` - Use `viewChild()`, `viewChildren()`, `contentChild()`, and `contentChildren()` signal queries instead of decorator queries.
- `signal-immutable-updates` - Always update signals with immutable values via `.set()` or `.update(val => ({ ...val, prop }))`.

### 2. Change Detection & Performance (CRITICAL)
- `perf-onpush-change-detection` - Always set `changeDetection: ChangeDetectionStrategy.OnPush` on all components.
- `perf-deferrable-views` - Use `@defer` blocks to lazy-load below-the-fold or conditional heavy UI components.
- `perf-ng-optimized-image` - Use `NgOptimizedImage` (`ngSrc`, `priority`, explicit `width`/`height`) for all non-dynamic images.
- `perf-zoneless-readiness` - Avoid relying on Zone.js monkey patching; write signal-driven, zoneless-ready code.
- `perf-track-expressions` - Always provide a unique tracking key in `@for (item of items; track item.id)` rather than `track $index` when IDs exist.

### 3. Modern Template Syntax (HIGH)
- `template-modern-control-flow` - Use built-in `@if`, `@else if`, `@else`, `@switch`, `@case`, and `@for` instead of `*ngIf`, `*ngFor`, `*ngSwitch`.
- `template-empty-block` - Use `@empty` inside `@for` blocks instead of extra `@if (!items.length)` wrappers.
- `template-pure-pipes` - Use pure pipes for expensive template data formatting instead of calling component methods directly in templates.
- `template-avoid-function-calls` - Never invoke component methods in template interpolation `{{ calculateTotal() }}` unless it is a signal getter `{{ total() }}` or pure pipe.

### 4. RxJS Interop & Resource Cleanup (HIGH)
- `rxjs-take-until-destroyed` - Use `takeUntilDestroyed()` in an injection context to prevent subscription memory leaks.
- `rxjs-interop-to-signal` - Convert Observables to Signals with `toSignal()` when binding data to templates.
- `rxjs-avoid-nested-subscriptions` - Never call `.subscribe()` inside another `.subscribe()`; compose streams using `switchMap`, `concatMap`, or `exhaustMap`.
- `rxjs-async-pipe` - When using raw Observables in templates, always use the `async` pipe or convert to signals; do not manually store `.subscribe()` values on class fields without cleanup.

### 5. Dependency Injection & Services (MEDIUM-HIGH)
- `di-inject-function` - Prefer the `inject(Service)` function over constructor parameter injection for cleaner inheritance and typing.
- `di-provided-in-root` - Declare application-wide singleton services with `@Injectable({ providedIn: 'root' })`.
- `di-feature-providers` - Scope stateful services to routes or component `providers: [...]` when they should be destroyed with the feature.
- `di-injection-tokens` - Use typed `InjectionToken<T>` with `factory` functions for configuration and environment tokens.

### 6. Routing & Lazy Loading (MEDIUM)
- `routing-functional-guards` - Use functional guards (`CanActivateFn`, `CanMatchFn`) and resolvers (`ResolveFn`) instead of class-based guards.
- `routing-lazy-component` - Lazy load standalone route components with `loadComponent: () => import('./path').then(m => m.ComponentName)`.
- `routing-preload-strategy` - Configure preloading strategies for critical sub-routes to optimize perceived latency.

### 7. Forms & Validation (MEDIUM)
- `forms-typed-reactive-forms` - Use strictly typed `FormGroup`, `FormControl`, and `NonNullableFormBuilder` over untyped forms.
- `forms-patch-value` - Use `.patchValue()` for partial updates and `.setValue()` only when strictly enforcing all fields.
- `forms-signals-integration` - Synchronize form state with component signals using `toSignal(form.valueChanges)` or dedicated model bindings.

---

## Detailed Rules & Code Examples

### 1. Signal Reactivity

#### `signal-use-signals-for-state`
Hold mutable local component state in signals rather than plain mutable class properties or `BehaviorSubject`.

```typescript
// ❌ Incorrect: Raw mutable property requires default change detection or manual markForCheck()
export class CounterComponent {
  count = 0;
  increment() {
    this.count++;
  }
}

// ✅ Correct: Signal automatically coordinates fine-grained updates with OnPush
export class CounterComponent {
  readonly count = signal(0);
  
  increment() {
    this.count.update(c => c + 1);
  }
}
```

#### `signal-signal-inputs-outputs`
Use signal inputs and modern outputs for cleaner typing, read-only guarantees, and seamless derivation.

```typescript
// ❌ Incorrect: Legacy decorators
@Component({...})
export class UserCardComponent {
  @Input({ required: true }) userId!: string;
  @Input() role: string = 'guest';
  @Output() selected = new EventEmitter<string>();
}

// ✅ Correct: Signal inputs & modern output()
@Component({...})
export class UserCardComponent {
  readonly userId = input.required<string>();
  readonly role = input<string>('guest');
  readonly selected = output<string>();

  // Derived state updates automatically when userId changes
  readonly isVip = computed(() => this.role() === 'admin');
}
```

#### `signal-computed-purity`
Computed signals MUST be pure, read-only derivations. Never mutate state or trigger side effects inside a computed callback.

```typescript
// ❌ Incorrect: Performing side-effects inside computed
readonly filteredList = computed(() => {
  const items = this.items();
  this.logService.recordAnalytics(items.length); // Side effect!
  return items.filter(i => i.active);
});

// ✅ Correct: Pure derivation in computed; side effects belong in effects or event handlers
readonly filteredList = computed(() => {
  return this.items().filter(i => i.active);
});
```

#### `signal-effect-avoid-writes`
Avoid setting or updating signals inside an `effect()`. An effect is meant for non-reactive external side effects (DOM, localStorage, logging, canvas).

```typescript
// ❌ Incorrect: Writing to signal inside effect
effect(() => {
  const user = this.currentUser();
  this.userProfile.set(transform(user)); // Causes potential cycles & requires allowSignalWrites
});

// ✅ Correct: Use computed for derived signal values
readonly userProfile = computed(() => transform(this.currentUser()));
```

---

### 2. Change Detection & Performance

#### `perf-onpush-change-detection`
Always explicitly specify `ChangeDetectionStrategy.OnPush` on all components. Angular will skip checking the component subtree unless inputs change, signals notify, or template events fire.

```typescript
// ❌ Incorrect: Default change detection checks entire tree on any browser event
@Component({
  selector: 'app-report-table',
  standalone: true,
  templateUrl: './report-table.component.html'
})
export class ReportTableComponent {}

// ✅ Correct: OnPush ensures fast, predictable rendering
@Component({
  selector: 'app-report-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './report-table.component.html'
})
export class ReportTableComponent {}
```

#### `perf-deferrable-views`
Use `@defer` to split heavy template chunks into separate lazy bundles loaded on demand.

```html
<!-- ❌ Incorrect: Eagerly bundled heavy component loaded on initial render -->
<app-rich-text-editor [content]="question.content" />

<!-- ✅ Correct: Lazy loaded when user scrolls to it or during idle -->
@defer (on viewport; prefetch on idle) {
  <app-rich-text-editor [content]="question.content" />
} @placeholder {
  <div class="editor-skeleton">Loading editor...</div>
} @error {
  <p class="error-msg">Failed to load editor.</p>
}
```

#### `perf-ng-optimized-image`
Prevent Layout Shifts (CLS) and ensure optimal image delivery with `NgOptimizedImage`.

```html
<!-- ❌ Incorrect: Standard <img> without dimensions or priority -->
<img src="/assets/branding/logo.png" alt="Logo">

<!-- ✅ Correct: NgOptimizedImage with dimensions and LCP priority -->
<img 
  ngSrc="assets/branding/logo.png" 
  width="240" 
  height="60" 
  priority
  alt="Assessment Platform Logo">
```

---

### 3. Modern Template Syntax

#### `template-modern-control-flow`
Replace structural directives (`*ngIf`, `*ngFor`) with built-in control flow syntax.

```html
<!-- ❌ Incorrect: Legacy structural directives -->
<div *ngIf="user$ | async as user; else guestTpl">
  <h2>{{ user.name }}</h2>
  <ul>
    <li *ngFor="let item of user.tasks; let i = index">{{ item.title }}</li>
  </ul>
</div>
<ng-template #guestTpl>Please sign in</ng-template>

<!-- ✅ Correct: Built-in control flow with track and @empty -->
@if (user(); as u) {
  <h2>{{ u.name }}</h2>
  <ul>
    @for (item of u.tasks; track item.id) {
      <li>{{ item.title }}</li>
    } @empty {
      <li class="empty-state">No pending tasks</li>
    }
  }
} @else {
  <p>Please sign in</p>
}
```

#### `template-avoid-function-calls`
Do not invoke non-memoized component methods directly inside template bindings.

```html
<!-- ❌ Incorrect: calculateScore() is called every single change detection cycle -->
<span>Score: {{ calculateScore(question) }}</span>

<!-- ✅ Correct: Precompute via pure pipe or signal getter -->
<span>Score: {{ question | calculateScore }}</span>
<!-- OR -->
<span>Score: {{ questionScore() }}</span>
```

---

### 4. RxJS Interop & Resource Cleanup

#### `rxjs-take-until-destroyed`
Prevent memory leaks in Observable subscriptions by binding them to the component/service destruction lifecycle.

```typescript
// ❌ Incorrect: Leaked subscription if component unmounts
export class LiveTimerComponent implements OnInit {
  ngOnInit() {
    interval(1000).subscribe(() => this.tick());
  }
}

// ✅ Correct: Automatic unsubscription on destroy via takeUntilDestroyed
export class LiveTimerComponent {
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.tick());
  }
}
```

#### `rxjs-interop-to-signal`
Bridge Observable data streams to signals for clean, declarative template consumption.

```typescript
// ❌ Incorrect: Manually storing state and calling markForCheck()
export class AssessmentDetailsComponent implements OnInit {
  assessment: Assessment | null = null;
  private sub?: Subscription;

  ngOnInit() {
    this.sub = this.api.getAssessment(this.id).subscribe(data => {
      this.assessment = data;
    });
  }
}

// ✅ Correct: toSignal converts the stream into an OnPush-friendly Signal
export class AssessmentDetailsComponent {
  private readonly api = inject(AssessmentApiService);
  readonly assessment = toSignal(this.api.getAssessment(this.id), { initialValue: null });
}
```

#### `rxjs-avoid-nested-subscriptions`
Flatten nested asynchronous requests instead of subscribing inside subscriptions.

```typescript
// ❌ Incorrect: Nested subscriptions callback hell
this.authService.user$.subscribe(user => {
  this.examService.getExams(user.id).subscribe(exams => {
    this.exams = exams;
  });
});

// ✅ Correct: Use switchMap to cancel previous pending requests and flatten streams
readonly exams$ = this.authService.user$.pipe(
  filter(Boolean),
  switchMap(user => this.examService.getExams(user.id))
);
```

---

### 5. Dependency Injection

#### `di-inject-function`
Prefer `inject()` over constructor parameter injection for conciseness and flexible composability.

```typescript
// ❌ Incorrect: Verbose constructor parameter injection
export class ExamPlayerComponent {
  constructor(
    private router: Router,
    private api: AssessmentApiService,
    private cdr: ChangeDetectorRef
  ) {}
}

// ✅ Correct: Modern inject() function
export class ExamPlayerComponent {
  private readonly router = inject(Router);
  private readonly api = inject(AssessmentApiService);
}
```

---

### 6. Routing & Lazy Loading

#### `routing-functional-guards`
Declare guards and resolvers as lightweight functions rather than `@Injectable()` classes.

```typescript
// ❌ Incorrect: Class-based CanActivate guard
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate(): boolean { ... }
}

// ✅ Correct: Functional CanActivateFn guard
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};
```

---

### 7. Forms & Validation

#### `forms-typed-reactive-forms`
Always define strongly typed reactive forms using `NonNullableFormBuilder`.

```typescript
// ❌ Incorrect: Untyped forms prone to runtime errors
this.form = this.fb.group({
  candidateEmail: ['', [Validators.required, Validators.email]],
  agreeToRules: [false]
});

// ✅ Correct: Strongly typed Reactive Form with non-nullable defaults
interface CandidateConsentForm {
  candidateEmail: FormControl<string>;
  agreeToRules: FormControl<boolean>;
}

export class CandidateConsentComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group<CandidateConsentForm>({
    candidateEmail: this.fb.control('', { validators: [Validators.required, Validators.email] }),
    agreeToRules: this.fb.control(false, { validators: [Validators.requiredTrue] })
  });
}
```

---

## Architectural Checklist for Angular PRs & Code Generation

Before considering an Angular component, service, or feature complete, verify:
- [ ] Component is **standalone** (`standalone: true`).
- [ ] Component uses `changeDetection: ChangeDetectionStrategy.OnPush`.
- [ ] Dependencies are acquired via `inject(ServiceName)` instead of constructor arguments.
- [ ] Component state uses `signal()`, `computed()`, and `model()`.
- [ ] Control flow uses `@if`, `@for (...; track ...)`, and `@switch`.
- [ ] Long lists or below-the-fold components use `@defer (on viewport)`.
- [ ] All RxJS subscriptions either use `takeUntilDestroyed()`, `async` pipe, or `toSignal()`.
- [ ] Forms are strictly typed with `NonNullableFormBuilder` or explicit `FormControl<T>`.
- [ ] No direct DOM mutations via `document.querySelector` or `ElementRef.nativeElement` unless strictly necessary (use renderer or Angular bindings).

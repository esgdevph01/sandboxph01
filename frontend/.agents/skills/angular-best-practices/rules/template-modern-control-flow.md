---
title: Use Built-in Control Flow Over Structural Directives
impact: HIGH
impactDescription: Eliminates CommonModule imports, reduces bundle overhead, provides type narrowing, and improves readability.
tags: template, control-flow, @if, @for, @switch
---

## Use Built-in Control Flow Over Structural Directives

**Impact: HIGH (faster template compilation, superior ergonomics, automatic type narrowing)**

Replace legacy structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`) with modern built-in control flow: `@if`, `@else if`, `@else`, `@switch`, `@case`, `@default`, `@for`, and `@empty`.

**Incorrect (legacy structural directives):**

```html
<div *ngIf="session(); let s; else noSession">
  <h3>Session: {{ s.id }}</h3>
  <ul>
    <li *ngFor="let item of s.questions; let i = index">
      {{ i + 1 }}. {{ item.title }}
    </li>
  </ul>
</div>
<ng-template #noSession>
  <p>No active exam session.</p>
</ng-template>
```

**Correct (built-in control flow with @empty):**

```html
@if (session(); as s) {
  <h3>Session: {{ s.id }}</h3>
  <ul>
    @for (item of s.questions; track item.id; let i = $index) {
      <li>{{ i + 1 }}. {{ item.title }}</li>
    } @empty {
      <li class="empty-notice">No questions assigned in this session.</li>
    }
  </ul>
} @else {
  <p>No active exam session.</p>
}
```

Reference: [Angular Control Flow](https://angular.dev/guide/control-flow)

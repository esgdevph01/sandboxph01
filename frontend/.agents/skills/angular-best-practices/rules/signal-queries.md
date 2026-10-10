---
title: Use Signal Queries Instead of Decorator Queries
impact: MEDIUM-HIGH
impactDescription: Eliminates lifecycle hook timing issues (ngAfterViewInit), supports reactive computed transforms, and provides consistent Signal ergonomics.
tags: signals, viewchild, viewchildren, contentchild
---

## Use Signal Queries Instead of Decorator Queries

**Impact: MEDIUM-HIGH (robust query timing and signal integration)**

Use `viewChild()`, `viewChildren()`, `contentChild()`, and `contentChildren()` instead of `@ViewChild()`, `@ViewChildren()`, `@ContentChild()`, and `@ContentChildren()`. Signal queries return a signal that is updated when the DOM node or child component becomes available or changes.

**Incorrect (legacy @ViewChild with lifecycle timing):**

```typescript
import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-search-box',
  template: `<input #searchField type="text" />`
})
export class SearchBoxComponent implements AfterViewInit {
  @ViewChild('searchField') searchField?: ElementRef<HTMLInputElement>;

  ngAfterViewInit(): void {
    this.searchField?.nativeElement.focus();
  }
}
```

**Correct (signal query viewChild):**

```typescript
import { Component, viewChild, ElementRef, effect } from '@angular/core';

@Component({
  selector: 'app-search-box',
  standalone: true,
  template: `<input #searchField type="text" />`
})
export class SearchBoxComponent {
  readonly searchField = viewChild<ElementRef<HTMLInputElement>>('searchField');

  constructor() {
    effect(() => {
      const inputEl = this.searchField()?.nativeElement;
      if (inputEl) {
        inputEl.focus();
      }
    });
  }
}
```

Reference: [Angular Signal Queries](https://angular.dev/guide/signals/queries)

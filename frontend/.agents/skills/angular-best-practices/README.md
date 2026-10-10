# Angular Best Practices

A structured repository of modern Angular best practices (v17-v19+), optimized for agents and developers to guide architecture, code reviews, and automated refactoring.

## Overview

Modern Angular has undergone a major renaissance. This skill encodes the standard conventions and performance rules:
- **Reactivity & State**: Signals-first paradigm (`signal`, `computed`, `effect`, `input()`, `output()`, `model()`)
- **Templates**: Modern built-in control flow (`@if`, `@for`, `@switch`), mandatory `track`, and `@defer`
- **Architecture**: Standalone components, modern Dependency Injection with `inject()`
- **Change Detection**: Mandatory `ChangeDetectionStrategy.OnPush` and zoneless-ready patterns
- **RxJS Interoperability**: `toSignal`, `toObservable`, and `takeUntilDestroyed`
- **Performance**: Lazy loading (`loadComponent`), `NgOptimizedImage`, and fine-grained change detection

## Directory Structure

- `SKILL.md` - Primary skill entrypoint and rule reference for agents
- `rules/` - Individual focused rules with rationale, anti-patterns, and correct implementations

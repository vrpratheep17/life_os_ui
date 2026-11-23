---
name: feature-first-clean-architecture
description: Apply this project's feature-first clean architecture when creating, organizing, or refactoring application code.
---

# Coding Style Rules

Use feature-focused clean architecture for all project code. Follow this structure; ask before introducing a different architecture.

```text
src/
  app/          # Router, providers, global styles, app setup and mocks
  features/
    <feature>/
      domain/       # entity/, usecases/, ports/
      adapters/     # Implement domain ports for APIs and persistence
      presentation/ # hooks/, components/, pages/
      mocks/        # Handlers and fixtures
      index.ts      # Public feature exports
  shared/       # Reusable ui/ and types/
  main.tsx
```

- Keep business logic in domain; it must not depend on UI, frameworks, or adapters.
- Keep UI in presentation and external integrations in adapters.
- Colocate page and component styles in `*.module.css` files and use imported class mappings. Reserve global CSS for application-wide foundations.
- Access other features only through their public `index.ts` exports.
- Keep feature-specific code within its feature; share only genuinely reusable code.
- Follow [the UI design skill](../ui-design/SKILL.md) for all UI components and design.
- Use clear names and small, focused modules. Create folders only when needed.


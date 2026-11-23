---
name: ui-design
description: Design and implement this project's UI mobile-first using the approved component libraries when creating or changing pages, components, styling, or animations.
---

# UI Design Rules

Use colocated `ComponentName.module.css` files for page and component styles. Import them as `styles` and reference classes through that object to prevent styles leaking between features. Keep only shared resets, design tokens, and library imports in global CSS; scope element selectors under a local class and avoid `:global` overrides unless required by a library.

Always prioritize mobile-first design:

- Design and implement the smallest screens first, then enhance for tablet and desktop.
- Use mobile layouts as the base styles and `min-width` media queries for larger screens.
- Prioritize readable text, clear content hierarchy, accessible touch targets, and simple navigation. Prevent horizontal overflow.
- Verify every UI change on narrow mobile screens before checking larger layouts, including forms, menus, and interactive states.

Use only components from these libraries for this project's UI:

- [Magic UI](https://magicui.design/)
- [React Bits](https://reactbits.dev/)
- [Motion Primitives](https://motion-primitives.com/)
- [Fancy Components](https://www.fancycomponents.dev/)
- [HeroUI](https://heroui.com/)

Do not use other UI libraries, component sources, or custom UI components. Compose and style components from the approved libraries to meet project needs. If a required component is unavailable, ask before using anything outside this list.

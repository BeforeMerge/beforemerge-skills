---
title: "Organize components into atoms, molecules, organisms"
description: "Use atomic design to structure components: atoms (Button, Input), molecules (SearchBar, FormField), organisms (Header, Sidebar)."
impact: MEDIUM
impact_description: "Without structured organization, components become a flat list that's hard to navigate and creates unclear dependency hierarchies."
tags: [quality, react, project-structure, components]
---

## Organize components into atoms, molecules, organisms

**Impact: MEDIUM (Without structured organization, components become a flat list that's hard to navigate and creates unclear dependency hierarchies.)**

## Why This Matters

Atomic design creates predictable component hierarchy:
- **Atoms**: Independent, no dependencies (Button, Input, Badge)
- **Molecules**: Combine atoms (SearchBar = Input + Button)
- **Organisms**: Combine molecules (Header = Logo + Nav + SearchBar)

## Good

```
components/
  atoms/
    button.tsx
    input.tsx
    badge.tsx
  molecules/
    search-bar.tsx
    form-field.tsx
  organisms/
    header.tsx
    sidebar.tsx
```

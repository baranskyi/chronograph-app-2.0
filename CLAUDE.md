# Chronograph App - Claude Rules

## Auto-versioning

**IMPORTANT**: After each code change, automatically run:
```bash
npm run version:patch
```

This bumps the patch version (e.g., 1.0.2 → 1.0.3) so the app always shows the current version in the footer.

## Version Commands

- `npm run version:patch` - Bug fixes, small changes (1.0.X)
- `npm run version:minor` - New features (1.X.0)
- `npm run version:major` - Breaking changes (X.0.0)

## Tech Stack

- Vue 3 + Composition API
- Pinia for state management
- Tailwind CSS v4
- Vite
- TypeScript

## CSS Note

Due to CSS reset in `style.css`, use inline styles for padding/margin when Tailwind classes don't work:
```html
style="padding: 16px;"
```

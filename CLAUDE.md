# Chronograph App - Claude Rules

## Production Domain

**ВАЖНО**: Для тестирования используй production домен, НЕ localhost:
```
https://chronograph-app-20-production.up.railway.app
```

## Auto-versioning & Auto-commit

**IMPORTANT**: After each code change, automatically run:
```bash
npm run version:patch
git add -A && git commit -m "Auto-commit: description of change"
```

This:
1. Bumps the patch version (e.g., 1.0.2 → 1.0.3)
2. Commits changes to git (Railway auto-deploys on push to main)

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
- Supabase (Auth + Database)

## Supabase

- **Project URL**: https://zxrkwbmrspdkrpvyhlof.supabase.co
- **Tables**: rooms, timers, sessions
- **Auth**: Email/Password
- **SQL migrations**: `docs/supabase/`

## Deployment

- **Platform**: Railway
- **Environment Variables** (set in Railway):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## CSS Note

Due to CSS reset in `style.css`, use inline styles for padding/margin when Tailwind classes don't work:
```html
style="padding: 16px;"
```

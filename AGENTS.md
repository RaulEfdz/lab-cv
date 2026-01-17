# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds Next.js App Router routes (admin, API routes, layouts, pages) and `globals.css`.
- `components/` contains reusable UI building blocks, split by domain (e.g., `cv-lab/`, `admin/`, `ui/`).
- `lib/` hosts core logic (AI engine, parsers, PDF generation), Supabase clients, shared types, and utilities.
- `public/` is for static assets; `scripts/` is for helper scripts.
- Configuration lives at the repo root (`next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `vercel.json`).

## Build, Test, and Development Commands
- `pnpm dev`: run the local Next.js dev server at `http://localhost:3000`.
- `pnpm build`: create a production build.
- `pnpm start`: start the production server from a build.
- `pnpm lint`: run ESLint across the repo.

## Coding Style & Naming Conventions
- Indentation is 2 spaces; prefer single quotes and omit semicolons (match existing files).
- React components use PascalCase (e.g., `PagePaper.tsx`); route segments use kebab-case (e.g., `cv-lab`).
- Keep colocated helpers near their feature folders (`components/cv-lab`, `lib/cv-lab`).

## Testing Guidelines
- No dedicated test suite is defined yet; rely on `pnpm lint` and manual flows.
- If you add tests, document the framework and add a `pnpm test` script.
- Name tests with the feature or module they cover (e.g., `cv-lab-parser.test.ts`).

## Commit & Pull Request Guidelines
- Commit history favors conventional prefixes: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.
- Keep messages short and scoped (e.g., `fix: handle auth errors from URL hash`).
- PRs should include a clear description, steps to verify, and UI screenshots for visual changes.

## Configuration & Security Notes
- Environment values live in `.env`; avoid committing secrets or keys.
- Supabase credentials and OpenAI keys are required for full functionality; see `README.md` for setup details.

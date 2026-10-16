# SafeGuard SA — Build Reference (MVP)

Hackathon MVP for the Gauteng Youth Tech Expo 2026, challenge G12 (failing and distressed infrastructure).

**The product in one paragraph.** When someone in Gauteng reports an open manhole or sinkhole, today's systems open a repair ticket. Nobody can see whether the hole has been **made safe** (cones, barricade, temporary plate) while it waits to be **fixed**. SafeGuard SA tracks those as two separate outcomes. Each has to be verified by an authorised reviewer, and a **protection clock** shows how long people have been left unprotected.

**The core rule, enforced in code and copy:** a report is not protection, and recorded is not verified. Nothing turns green until the reviewer role approves it.

**Scope:** public infrastructure only (open manholes, sinkholes, exposed wires, sewage leaks, collapsed pavements). No restaurants, retail or hospitals. No live municipal integration, emergency dispatch, AI severity scores or "certified safe" wording. All demo data is fictional; every ops screen shows a "DEMO · simulated roles" banner.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript, pnpm, Node 24 (`.nvmrc`) |
| UI | Tailwind CSS v4 + shadcn/ui (button, card, badge, dialog, sheet, tabs, table, input, textarea, select, label, separator) |
| Database | SQLite via `@libsql/client` + Drizzle ORM. Local `DATABASE_URL=file:./data/safeguard.db`, WAL mode. Turso later with the same schema |
| Contracts | zod 4 schemas in `src/lib/contracts/`, shared by forms and server code |
| Auth | DB-backed sessions (`sessions` table, opaque token, HttpOnly + SameSite=Lax cookie, Secure in production only), `node:crypto` scrypt. Residents never log in |
| Evidence | `request.formData()` → `sharp().rotate().resize(1600).jpeg()` (strips EXIF/GPS; never `withMetadata()`). Client canvas compression to ≤1280px / ~200 KB first. Files in `./data/uploads/` named by UUID, never under `/public` |
| Tests | vitest (domain layer), Playwright (demo path) |
| Fonts | System font stack only; `ui-monospace` for reference numbers |

## Run it

```bash
pnpm install
cp .env.example .env.local      # edit DEMO_PASSWORD if you like
pnpm db:migrate                 # creates data/safeguard.db
pnpm db:seed                    # 7 fictional cases, 4 staff accounts
pnpm dev                        # http://localhost:3000
pnpm test                       # vitest, domain layer
pnpm test:e2e                   # Playwright demo path
```

Demo accounts (password = `DEMO_PASSWORD`): `community@demo.safeguard.test`, `ops@demo.safeguard.test`, `field@demo.safeguard.test`, `reviewer@demo.safeguard.test`. With `DEMO_MODE=true` the login page shows a role switcher.

## Folder map and tab ownership

```
src/app/(public)/   report, track/[ref], poster/[ref], safety      — FRONTEND
src/app/(ops)/      login, home (role tabs), dashboard, cases/[id] — FRONTEND
src/app/api/v1/     route handlers                                  — BACKEND
src/components/     ui/ (shadcn), case/, forms/, layout/            — FRONTEND
src/server/         db/ domain/ services/ actions/ auth/ storage/   — BACKEND
src/lib/contracts/  zod schemas + types (backend owns, both read)   — SHARED
scripts/seed.ts     seed data                                       — BACKEND
tests/              vitest unit tests, e2e/ Playwright              — BOTH
docs/               this reference pack
```

Rules between tabs:

1. Client Components never import from `src/server/**`. Server Components may call `src/server/services/*` for reads; forms call `src/server/actions/*` for writes.
2. The backend tab owns `src/lib/contracts/` and updates `docs/03-api-contract.md` whenever a signature changes.
3. `transition()` in `src/server/domain/workflow.ts` is the only code that writes `cases.status`.
4. Hiding a button is never access control: every action calls `can(user, action, case?)` server-side.

## Documents

- `01-domain-and-workflow.md` — statuses, transition table, roles, permissions, clock, public view, sightings
- `02-data-model.md` — Drizzle tables
- `03-api-contract.md` — server actions, route handlers, error shape
- `04-frontend-guide.md` — screens, components, tokens, accessibility
- `05-features-roadmap.md` — Phase 8 extras and cut order
- `06-demo-script.md` — the 8-step demo path and seed refs
- `reference/` — concept PDF, market-check PDF, original implementation plan

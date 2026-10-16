# SafeGuard SA

**A report is not protection. Recorded is not verified.**

SafeGuard SA is a hackathon MVP for the Gauteng Youth Tech Expo 2026 (challenge G12, failing and distressed infrastructure). When someone reports an open manhole or sinkhole, today's systems open a repair ticket. Nobody can see whether the hole has been **made safe** (cones, barricade, temporary plate) while it waits to be **fixed**. SafeGuard SA tracks those as two separate outcomes, each verified by an authorised reviewer, and shows a **protection clock**: how long people have been left unprotected.

Public infrastructure only. All demo data is fictional. The app records and tracks; it does not certify safety or replace municipal or emergency services.

## Run it locally

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm db:seed
pnpm dev          # http://localhost:3000
```

Staff sign-in is one tap on `/login`: pick Thandi (community worker), Sipho (ops manager), Field Team B or L. Naidoo (reviewer). No password. All four are fictional.

Tests: `pnpm test` (domain layer, vitest) · `pnpm test:e2e` (Playwright demo path).

## Where to read next

- `docs/00-README.md` — stack, folder map, tab ownership rules
- `docs/01-domain-and-workflow.md` — statuses, the transition table, roles, clock, public view, sightings
- `docs/07-user-flows.md` — who does what on which screen, and the exact display language
- `docs/06-demo-script.md` — seed cases and the 8-step demo path

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Drizzle ORM on SQLite (`@libsql/client`, Turso-ready) · zod 4 · sharp · vitest · Playwright. System fonts only, so it runs offline at the expo.

# CollabDocs

Lightweight collaborative document editor (Google Docs–inspired) built for an AI-native engineering assessment.

## Stack

- **Frontend**: Next.js App Router (`/src`), TypeScript, Tailwind CSS, Lucide React, TipTap
- **Backend**: Next.js Server Actions
- **Database**: Prisma + SQLite (`prisma/dev.db`)
- **Auth**: Simulated user switcher (Antonette / Bob / Charlie) via cookie

## Features

1. Document dashboard (owned + shared, with **Shared with me** badge)
2. TipTap rich-text editor with 1.75s debounced auto-save
3. Import `.txt` / `.md` files via `FileReader` into a new or existing document
4. Owner sharing with `view` / `edit` permissions (enforced in UI + Server Actions)
5. Permission helper tests + toast / error boundaries

## Setup (Windows PowerShell)

Run these commands from the project root:

```powershell
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> Tip: In PowerShell, chain commands with `;` (not `&&`), or run them one at a time as shown above.
> If `npm` is blocked by execution policy, use `npm.cmd` / `npx.cmd`.

### Vercel deployment

The production `build` script generates Prisma Client, pushes the SQLite schema, seeds Antonette/Bob/Charlie, then runs `next build`.

In the Vercel project settings, set:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `file:./dev.db` |

Do **not** commit `*.db` files — Vercel creates a fresh database during build.

### Useful scripts

```powershell
npm run dev
npm run build
npm test
npx prisma studio
```

## Seeded users

| Dropdown label         | Email               | Notes                                      |
|------------------------|---------------------|--------------------------------------------|
| Antonette (Owner)      | antonette@example.com | Default user; owns welcome document           |
| Bob (Colleague)        | bob@example.com       | Seeded edit access to Antonette's welcome doc |
| Charlie (Colleague)    | charlie@example.com   | No shares initially                           |

Switch users from the header dropdown to exercise ownership and sharing.

## Manual walkthrough

1. As **Antonette (Owner)**, open *Welcome to CollabDocs*, edit text, wait ~2s for **Saving...** → **All changes saved**.
2. Click **Share**, grant **Charlie** `view` access.
3. Switch to **Charlie (Colleague)** → document appears under Shared with Me (read-only).
4. Switch to **Bob (Colleague)** → welcome doc is editable (seeded share).
5. Use **Import Document** with a `.md` or `.txt` file.

## Project layout

```
prisma/                 schema + seed + SQLite db
src/app/                pages + server actions
src/app/documents/[id]/ editor route
src/components/         UI, editor, share modal, import
src/lib/                prisma, auth, permissions, markdown
tests/                  Vitest unit tests
```

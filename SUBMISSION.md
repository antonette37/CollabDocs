# Submission Manifest — CollabDocs

AJAAI assessment deliverable for a Google Docs–inspired collaborative editor with simulated multi-user sharing.

## 1. Deliverable Checklist

| Deliverable | Status | Location / notes |
| --- | --- | --- |
| Source code | Included | Full Next.js App Router app under `src/`, Prisma schema under `prisma/` |
| Local setup instructions | Included | `README.md` (PowerShell-friendly commands) |
| Architecture note | Included | `ARCHITECTURE.md` |
| AI workflow note | Included | `AI_WORKFLOW.md` |
| Automated tests | Included | `tests/` — run with `npm test` (13 passing) |
| Live deployment link | Placeholder | _Add production URL here after deploy (e.g. Vercel)._ |
| Demo video | Placeholder | _Add walkthrough recording URL here (sharing + import + auto-save)._ |

### Local bootstrap (Windows PowerShell)

```powershell
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```powershell
npm test
npm run build
```

## 2. Seeded Test Accounts

Use the header **Logged-in user** dropdown to switch identities instantly (cookie-backed; no passwords).

| Dropdown label | Email | Seeded posture |
| --- | --- | --- |
| **Antonette (Owner)** | antonette@example.com | Default session. Owns *Welcome to CollabDocs*. Can share. |
| **Bob (Colleague)** | bob@example.com | Owns *Bob's Notes*. Has **edit** access to Antonette’s welcome doc. |
| **Charlie (Colleague)** | charlie@example.com | No shares initially — ideal for testing new view/edit grants. |

### Reviewer access-control walkthrough

1. Stay as **Antonette (Owner)** → open the welcome document → confirm auto-save toasts (`Saving...` → inline **All changes saved**).
2. Click **Share** → grant **Charlie** `view` (or `edit`).
3. Switch to **Charlie (Colleague)** → confirm the doc appears under **Shared with me** with the badge → open it and verify TipTap/title are locked for `view`.
4. Switch to **Bob (Colleague)** → open the welcome doc → confirm edit access from the seeded share.
5. Use **Import Document** with a `.txt` or `.md` file from the dashboard or editor.

## 3. Future Roadmap (next 2–4 hours)

If more time were available, the next increments would be:

1. **Real-time presence** — Lightweight WebSocket channel for “who is viewing” indicators and optional live cursors, layered on top of the existing permission model rather than replacing Server Action saves.
2. **Version history** — A `DocumentRevision` (or delta snapshot) table capturing title/content hashes on save, with a restore UI for owners.
3. **Hardened sharing UX** — Email-style invite copy, bulk revoke, and an activity strip showing who gained/lost access.

The current submission intentionally stops at a complete, testable core: documents, TipTap editing, FileReader import, owner sharing, and enforced view/edit isolation.

# Architecture Notes — CollabDocs

CollabDocs is a lightweight collaborative document editor built for the AJAAI assessment. The system prioritizes a complete, reviewable end-to-end flow over expansive infrastructure.

## 1. Design Decisions

### SQLite as the persistence layer

Prisma is configured against a local SQLite file (`prisma/dev.db`).

> **Why SQLite:** Reviewers can clone, migrate, seed, and run the app with no cloud credentials, no Docker Compose stack, and no billed database instance. The data model is still relational and production-shaped; only the deployment topology is simplified.

Trade-offs accepted:

- No concurrent multi-process write scaling (irrelevant for a single-reviewer local demo)
- File-based backups instead of managed snapshots

### Next.js Server Actions over a separate API surface

Mutations (`createDocument`, `updateDocument`, `importDocumentContent`, `shareDocument`, `switchUser`) live as `"use server"` actions under `src/app/actions/`.

> **Why Server Actions:** They remove route-handler boilerplate, keep input validation next to the call site, and give the UI typed results (`{ ok: true } | { ok: false; error: string }`) without maintaining a parallel REST contract. For this product surface, the latency and DX benefits outweigh the need for a public HTTP API.

The App Router layout loads the active mock user via cookies (`collabdocs_user_id`) and revalidates dashboard/editor paths after each mutation.

## 2. State & Persistence

### Debounced auto-save instead of WebSockets

The TipTap editor and title input schedule persistence through a **1750ms debounce** window (within the 1.5–2s product requirement). On flush:

1. `setSaveState("saving")`
2. `toast.loading("Saving...", { id: "doc-autosave" })`
3. Server Action `updateDocument` writes title/content through Prisma
4. Success dismisses the toast and shows an inline Lucide check + “All changes saved”
5. Failure sets `saveState` to `"error"` and surfaces the toast/error message

> **Why not WebSockets / CRDT sync:** Real-time multiplayer presence and conflict resolution are valuable, but they expand scope into transport, reconnection, and merge semantics. Within a 4–6 hour timebox, debounced Server Action saves deliver a production-grade asynchronous save loop that reviewers can verify immediately, without standing up a socket server.

Client editor state remains the source of truth between saves; the database is the durable store after each successful action.

### Import path

`.txt` / `.md` files are read client-side with a Promise-wrapped `FileReader`, converted to HTML via `src/lib/markdown.ts`, then persisted through `importDocumentContent` (new document or overwrite of an editable draft).

## 3. Data Isolation & Permissions

### Schema-enforced access

Access is modeled explicitly:

| Model | Role |
| --- | --- |
| `User` | Seeded identities (Antonette, Bob, Charlie) |
| `Document` | Owned content (`ownerId`) |
| `DocumentShare` | Per-user grant with `accessLevel` of `view` or `edit`, unique on `(documentId, sharedWithUserId)` |

Authorization is computed in `src/lib/permissions.ts` via `getDocumentAccess()`:

- **Owner** → `canView` + `canEdit`
- **Shared `edit`** → `canView` + `canEdit`
- **Shared `view`** → `canView` only
- **No share** → denied (`role: "none"`)

### UI + server enforcement

Read-only mode is not cosmetic-only:

- TipTap is initialized with `editable: canEdit` and updated via `editor.setEditable(canEdit)`
- Toolbar commands are disabled when `readOnly` is true, so formatting shortcuts cannot mutate the document
- Title input is `readOnly` for view-only sessions
- Server Actions call `assertCanEdit()` / `assertCanView()` before writes or reads; unauthorized attempts return `"Unauthorized access"`

The dashboard labels non-owned rows with a **Shared with me** badge and owner metadata so access posture is visible before opening the editor.

### Simulated auth

A header dropdown maps seeded IDs to labels (`Antonette (Owner)`, `Bob (Colleague)`, `Charlie (Colleague)`) and persists the selection in an HTTP-only cookie. This preserves multi-user sharing verification without introducing NextAuth, OAuth providers, or an external identity store.

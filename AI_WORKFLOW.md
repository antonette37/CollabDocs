# AI-Native Workflow Note — CollabDocs

This note documents how AI assistance was used during the CollabDocs build: as an accelerator for mechanical work, not as a substitute for architecture or product judgment.

## 1. Accelerated Vectors

AI materially shortened the path on well-scoped, low-ambiguity tasks:

- **TipTap scaffolding** — Initial editor shell, StarterKit + Underline wiring, and toolbar button structure (Bold, Italic, Underline, H1/H2, bullet/ordered lists) were drafted quickly, then tightened for `editable` / `readOnly` gating and debounce integration.
- **Prisma schema & seed** — Structural models (`User`, `Document`, `DocumentShare`) and the Antonette / Bob / Charlie seed script were generated early so persistence and sharing demos were available before UI polish.
- **Boilerplate plumbing** — Next.js App Router layout/header patterns, Sonner toaster provider, and Vitest config for permission helper coverage were produced faster than hand-writing from scratch.

These areas share a common trait: established patterns with clear acceptance criteria. AI velocity here bought time for permission edge cases, import UX, and save-state polish.

## 2. Human Intervention & Rejections

AI suggestions that conflicted with the assessment constraints were rejected deliberately.

> **Rejected: NextAuth + external PostgreSQL + live WebSocket sync.**  
> An early recommendation proposed enterprise-style auth, a hosted Postgres adapter, and a real-time sync server. That stack would consume the majority of a 4–6 hour window before the document CRUD and sharing flows were even reviewable. I rejected it to protect the timebox, pivoting to:
>
> - Local SQLite via Prisma (zero-config for reviewers)
> - Cookie-backed simulated session switcher in the header
> - Debounced Server Action auto-save (1750ms) instead of sockets

Additional human overrides:

- Kept permission checks in a pure helper (`getDocumentAccess`) so both UI and Server Actions share one source of truth, rather than scattering role logic across components.
- Required client-side `FileReader` for imports (explicit assessment requirement) instead of uploading files to disk storage.
- Preferred dismissible loading toasts + inline “All changes saved” over noisy success toasts on every keystroke flush.

Judgment stayed with the engineer: AI proposed options; constraints and product goals selected the path.

## 3. Verification Rigor

Correctness was not left to “looks good in the browser”:

- **Automated suite** — Vitest runs **13 tests** covering permission outcomes (owner / view / edit / denied), assert helpers, and Markdown/HTML import conversion (including HTML escaping).
- **Static gates** — TypeScript compilation and ESLint were run after UI refinements (debounce/toast sync, FileReader helper, shared badges).
- **Local multi-user simulation** — Switching between Antonette, Bob, and Charlie against seeded shares validates owner-only Share modal access, view-only TipTap lockdown, and edit-capable shared sessions without a second machine.

> AI sped up scaffolding. Human review defined the architecture, rejected scope inflation, and demanded that sharing and save behavior remain enforceable under tests—not just visually plausible.

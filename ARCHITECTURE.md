# difflab — Architecture

## Overview

difflab is a Next.js 14 App Router application built on the T3 Stack. It is a single-page application in spirit: all primary views render within the root layout without full navigations. The two top-level modes — **Diff Mode** and **Drive Mode** — are controlled by client-side state and URL query params, not separate routes.

```
difflab.bluesix.dev/           → Main SPA (Diff Mode or Drive Mode)
difflab.bluesix.dev/share/[id] → Read-only public diff viewer
difflab.bluesix.dev/auth/...   → BetterAuth-managed auth pages
```

---

## Directory Structure

```
~/difflab/
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← Root layout, global providers
│   │   ├── page.tsx                ← SPA shell (sidebar + main area)
│   │   ├── share/
│   │   │   └── [id]/page.tsx       ← Public read-only diff viewer
│   │   └── auth/
│   │       └── [...]/page.tsx      ← BetterAuth pages
│   ├── components/
│   │   ├── diff/
│   │   │   ├── DiffEditor.tsx      ← Split CodeMirror panels
│   │   │   └── DiffViewer.tsx      ← react-diff-viewer-continued output
│   │   ├── drive/
│   │   │   ├── Sidebar.tsx         ← Folder tree + file list
│   │   │   ├── FolderTree.tsx
│   │   │   └── FileGrid.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Modal.tsx
│   ├── server/
│   │   ├── db/
│   │   │   ├── index.ts            ← Drizzle client
│   │   │   └── schema.ts           ← All table definitions
│   │   ├── api/
│   │   │   ├── root.ts
│   │   │   ├── trpc.ts
│   │   │   └── routers/
│   │   │       ├── documents.ts
│   │   │       ├── folders.ts
│   │   │       ├── storage.ts
│   │   │       └── share.ts
│   │   └── auth.ts                 ← BetterAuth config
│   ├── lib/
│   │   ├── diff.ts                 ← Diff computation helpers
│   │   ├── storage.ts              ← R2 client + upload/download helpers
│   │   └── utils.ts
│   ├── styles/
│   │   └── globals.css             ← CSS variables, base styles
│   └── env.js                      ← T3 env validation (Zod)
├── drizzle.config.ts
├── biome.json
└── package.json
```

---

## Database Schema

All tables use UUIDs as primary keys. PostgreSQL, managed via Drizzle ORM.

### `folders`

| Column      | Type        | Notes                              |
|-------------|-------------|------------------------------------|
| id          | uuid PK     | defaultRandom()                    |
| userId      | varchar     | BetterAuth user ID, not null       |
| name        | varchar(255)| not null                           |
| parentId    | uuid FK     | self-reference → folders.id, nullable (root = null) |
| createdAt   | timestamp   | defaultNow()                       |

### `documents`

| Column          | Type                          | Notes                                              |
|-----------------|-------------------------------|----------------------------------------------------|
| id              | uuid PK                       | defaultRandom()                                    |
| userId          | varchar                       | not null                                           |
| folderId        | uuid FK                       | → folders.id, nullable                             |
| name            | varchar(255)                  | not null                                           |
| type            | enum(text, diff, snippet)     | default "text"                                     |
| contentInline   | text                          | null if stored in R2                               |
| storageKey      | varchar                       | null if stored inline                              |
| baseSnapshotId  | uuid FK                       | → documents.id — for type="diff" only              |
| headSnapshotId  | uuid FK                       | → documents.id — for type="diff" only              |
| isPublic        | boolean                       | default false                                      |
| createdAt       | timestamp                     | defaultNow()                                       |
| updatedAt       | timestamp                     | defaultNow(), updated on every write               |

### `document_versions`

| Column        | Type      | Notes                              |
|---------------|-----------|------------------------------------|
| id            | uuid PK   | defaultRandom()                    |
| documentId    | uuid FK   | → documents.id, not null           |
| contentInline | text      | null if stored in R2               |
| storageKey    | varchar   | null if stored inline              |
| createdAt     | timestamp | defaultNow()                       |

### Storage Decision Logic

```
if (content.length < 65_536 bytes):
    store in documents.contentInline
else:
    upload to R2 → store key in documents.storageKey
```

This threshold (64 KB) is configurable via env var `INLINE_CONTENT_MAX_BYTES`.

---

## Diff Data Model

A `diff` document is a **pointer to two text snapshots**, not a stored diff string.

```
documents (type="diff")
  └── baseSnapshotId → documents (type="text")  [original/left panel]
  └── headSnapshotId → documents (type="text")  [modified/right panel]
```

Rendering flow:
1. Fetch both snapshot documents (content inline or from R2)
2. Pass both strings to `Diff.diffLines()` on the client
3. Render output with `react-diff-viewer-continued`

This model allows re-rendering with different diff options (ignore whitespace, word diff, etc.) without re-fetching or re-storing data.

---

## Auth Flow

BetterAuth is configured in `src/server/auth.ts`:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
});
```

tRPC context exposes the session via `getServerAuthSession()`. All document/folder mutations use `protectedProcedure`. Public share reads use `publicProcedure` with an `isPublic: true` guard.

---

## tRPC Router Map

### `documents`
- `getAll({ folderId? })` — list documents in a folder (or root)
- `getById({ id })` — fetch single document with content
- `create({ name, type, folderId?, content })` — create document, auto-route to inline/R2
- `update({ id, name?, content?, isPublic? })` — update, snapshot previous version
- `delete({ id })` — soft delete (set deletedAt)
- `getVersions({ documentId })` — list version history

### `folders`
- `getTree()` — recursive folder tree for sidebar
- `create({ name, parentId? })`
- `rename({ id, name })`
- `move({ id, newParentId })`
- `delete({ id })` — recursive delete with all children

### `storage`
- `getPresignedUploadUrl({ fileName, contentType })` — R2 presigned PUT
- `getPresignedDownloadUrl({ storageKey })` — R2 presigned GET

### `share`
- `makePublic({ documentId })` — set isPublic=true, return share URL
- `makePrivate({ documentId })` — set isPublic=false

---

## Object Storage (Cloudflare R2)

R2 is S3-compatible. The AWS SDK v3 client is used:

```typescript
// src/lib/storage.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const r2 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});
```

Storage keys follow the pattern: `users/{userId}/documents/{documentId}/{timestamp}.txt`

---

## Environment Variables

Add all of the following to `.env` and validate in `src/env.js`:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/difflab"
BETTER_AUTH_SECRET="<32+ char random string>"
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
R2_BUCKET_NAME="difflab-storage"
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
NEXT_PUBLIC_APP_URL="https://difflab.bluesix.dev"
INLINE_CONTENT_MAX_BYTES="65536"
```

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: [logo] [breadcrumb]               [theme] [user menu]   │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│  Sidebar     │   Main Area                                      │
│  ─────────   │                                                  │
│  [+ New Diff]│   DIFF MODE:                                     │
│  [+ New Doc] │   ┌──────────────────┬──────────────────┐       │
│              │   │  Left (Base)     │  Right (Head)    │       │
│  ▼ My Drive  │   │  CodeMirror 6    │  CodeMirror 6    │       │
│    ▶ Folder  │   └──────────────────┴──────────────────┘       │
│    ▶ Folder  │   ──────────── Diff Output ─────────────        │
│    📄 File   │   react-diff-viewer-continued                    │
│              │                                                  │
│  ─────────   │   DRIVE MODE:                                    │
│  Recent      │   File grid / list (toggle)                      │
│              │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

The sidebar is collapsible. Mode switches on file open (a diff document → Diff Mode, a text document → text editor). A blank diff session is always one click away from the sidebar.

---

## Performance Targets

| Metric | Target         |
|--------|----------------|
| LCP    | < 2.0s         |
| INP    | < 200ms        |
| CLS    | < 0.1          |
| JS bundle (initial) | < 200 KB gzipped |

Diff computation runs in a Web Worker to avoid blocking the main thread when documents exceed ~5,000 lines.

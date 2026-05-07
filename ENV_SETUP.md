# difflab Environment Setup Guide

This guide explains how to populate `.env` for local development and production without guessing what each variable means.

## Quick start

1. Copy `.env.example` to `.env`.
2. Fill in PostgreSQL.
3. Generate `BETTER_AUTH_SECRET`.
4. Create a GitHub OAuth app.
5. Create a Cloudflare R2 bucket and API token.
6. Set local URLs for development.
7. Update `src/env.js` to validate every variable you actually use.

---

## 1. Create `.env`

From the project root:

```bash
cp .env.example .env
```

For local development, the most common starting values are:

```env
NODE_ENV="development"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DATABASE_URL="postgresql://postgres:password@localhost:5432/difflab"
INLINE_CONTENT_MAX_BYTES="65536"
R2_BUCKET_NAME="difflab-storage"
```

---

## 2. PostgreSQL (`DATABASE_URL`)

You need a running PostgreSQL instance.

### Option A: local PostgreSQL

Example connection string:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/difflab"
```

Meaning:
- `postgres` before the colon = database username
- `password` = database password
- `localhost` = database host
- `5432` = PostgreSQL default port
- `difflab` = database name

### Option B: Docker one-liner

```bash
docker run --name difflab-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=difflab \
  -p 5432:5432 \
  -d postgres:16
```

Then use:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/difflab"
```

### Verify it works

```bash
psql "postgresql://postgres:password@localhost:5432/difflab"
```

If it connects, the URL is correct.

---

## 3. Better Auth secret (`BETTER_AUTH_SECRET`)

Better Auth uses a secret for signing/session security, and it should be set explicitly in production.[web:7]

### Generate one on macOS/Linux

```bash
openssl rand -hex 32
```

Example result:

```env
BETTER_AUTH_SECRET="b7b7f9d9f7d5c7f8d5bca6f6d97f8f9e0e64f5f1b2a3c4d5e6f7081920abc123"
```

Use a different secret in production than in local development.

### `BETTER_AUTH_URL`

Set this to the canonical URL your auth system should use.

Local:

```env
BETTER_AUTH_URL="http://localhost:3000"
```

Production:

```env
BETTER_AUTH_URL="https://difflab.bluesix.dev"
```

---

## 4. GitHub OAuth (`BETTER_AUTH_GITHUB_CLIENT_ID`, `BETTER_AUTH_GITHUB_CLIENT_SECRET`)

GitHub OAuth requires creating an OAuth App and then copying the Client ID and Client Secret from the app settings.[web:11][web:17]

### Create the OAuth app

1. Sign in to GitHub.
2. Open **Settings**.
3. Go to **Developer settings**.
4. Open **OAuth Apps**.
5. Click **New OAuth App**.

### Recommended values

#### Local development app
- **Application name:** `difflab local`
- **Homepage URL:** `http://localhost:3000`
- **Authorization callback URL:** use the callback path expected by your Better Auth GitHub provider route; keep it aligned with your auth handler URL configuration.

If your Better Auth handler is mounted under `/api/auth`, the callback path is commonly under that auth base path. Confirm the exact provider callback route in your auth implementation before saving the app.

#### Production app
- **Application name:** `difflab`
- **Homepage URL:** `https://difflab.bluesix.dev`
- **Authorization callback URL:** the production version of the same Better Auth callback route.

### Where to get the values

After creating the OAuth App:
- Copy **Client ID** into `BETTER_AUTH_GITHUB_CLIENT_ID`.[web:11]
- Generate or reveal **Client Secret** and copy it into `BETTER_AUTH_GITHUB_CLIENT_SECRET`.[web:11]

Example:

```env
BETTER_AUTH_GITHUB_CLIENT_ID="Iv1.1234567890abcdef"
BETTER_AUTH_GITHUB_CLIENT_SECRET="0123456789abcdef0123456789abcdef01234567"
```

### Why there are also `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

Some Better Auth examples and third-party integrations use the shorter variable names `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.[web:9][web:12] If your code only reads the `BETTER_AUTH_*` names, you can omit the aliases. They are included in `.env.example` for compatibility during experimentation.

---

## 5. Cloudflare R2 (`R2_*`)

Cloudflare R2 is S3-compatible object storage. difflab uses it for larger text blobs or uploaded files instead of storing everything directly in PostgreSQL.

Cloudflare documents state that you create an R2 bucket, then create an R2 API token, and use the resulting **Access Key ID**, **Secret Access Key**, and account endpoint in your S3 client.[web:10][web:16]

### Step A: Enable / access R2

1. Log in to the Cloudflare dashboard.
2. Open **Storage & databases**.
3. Open **R2**.
4. If prompted, enable or purchase access for R2 on the account first; Cloudflare notes you must have R2 enabled before generating an API token.[web:10]

### Step B: Create a bucket

1. In R2, click **Create bucket**.
2. Choose bucket name: `difflab-storage`
3. Pick a region/jurisdiction if Cloudflare asks.
4. Save.

That bucket name becomes:

```env
R2_BUCKET_NAME="difflab-storage"
```

### Step C: Create API credentials

Cloudflare's R2 docs say to open the R2 dashboard, choose **Manage** next to API Tokens, and create an API token; after creation you receive an **Access Key ID** and **Secret Access Key**, and the secret is only shown once.[web:10][web:16]

1. In **R2 Overview**, find **API Tokens**.
2. Click **Manage**.
3. Click **Create API Token** or **Create Account API Token**.
4. Grant the token access to the bucket you created.
5. Finish creation.
6. Copy:
   - **Access Key ID** → `R2_ACCESS_KEY_ID`[web:10][web:16]
   - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`[web:10][web:16]

Example:

```env
R2_ACCESS_KEY_ID="5d9f1d9d0d7c4b18a1234567890abcd1"
R2_SECRET_ACCESS_KEY="4f1c9f3b0f0d2f9e7e8a6f4b5c1d3e2f7a9c0b1d2e3f4a5b6c7d8e9f0a1b2c3"
```

### Step D: Get the endpoint

Cloudflare says the S3 endpoint format is:

```text
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

Use that as `R2_ENDPOINT`.[web:10] The R2 Overview and token confirmation screens also expose the endpoint location.[web:16]

Example:

```env
R2_ENDPOINT="https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com"
```

### Step E: Optional public base URL

If later you bind a custom domain or public bucket hostname, you can set:

```env
R2_PUBLIC_BASE_URL="https://files.difflab.bluesix.dev"
```

For a private-by-default storage model, you can leave this blank.

---

## 6. App URLs

### Local development

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
BETTER_AUTH_URL="http://localhost:3000"
```

### Production

```env
NEXT_PUBLIC_APP_URL="https://difflab.bluesix.dev"
BETTER_AUTH_URL="https://difflab.bluesix.dev"
```

Use the public browser-facing URL in both places unless your auth setup explicitly requires a different canonical base URL.

---

## 7. Inline storage threshold

`INLINE_CONTENT_MAX_BYTES` decides when difflab stores text directly in PostgreSQL versus pushing it to R2.

Recommended default:

```env
INLINE_CONTENT_MAX_BYTES="65536"
```

That is 64 KiB. Keep it as a string in `.env`; parse it as a number in `src/env.js` or a helper.

---

## 8. Suggested local `.env`

```env
NODE_ENV="development"
BETTER_AUTH_SECRET="replace-with-openssl-output"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_GITHUB_CLIENT_ID="replace-me"
BETTER_AUTH_GITHUB_CLIENT_SECRET="replace-me"
GITHUB_CLIENT_ID="replace-me"
GITHUB_CLIENT_SECRET="replace-me"
DATABASE_URL="postgresql://postgres:password@localhost:5432/difflab"
R2_BUCKET_NAME="difflab-storage"
R2_ACCESS_KEY_ID="replace-me"
R2_SECRET_ACCESS_KEY="replace-me"
R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_PUBLIC_BASE_URL=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
INLINE_CONTENT_MAX_BYTES="65536"
```

---

## 9. Production checklist

- `BETTER_AUTH_SECRET` is long and random, and differs from local.[web:7]
- GitHub OAuth app includes the exact production callback URL configured in the app.[web:11]
- `NEXT_PUBLIC_APP_URL` matches the real deployed domain.
- `BETTER_AUTH_URL` matches the real deployed domain.
- `DATABASE_URL` points to production PostgreSQL, not localhost.
- R2 token has access only to the intended bucket.[web:10][web:16]
- R2 secret has been saved securely because Cloudflare only shows it once at creation time.[web:16]
- `src/env.js` validates every variable listed in `.env.example`.

---

## 10. Practical next step for the repo

After adding these files to the repository root:

```bash
cp .env.example .env
pnpm install
pnpm db:push
pnpm dev
```

Then test:
- local database connection
- local sign-in
- GitHub OAuth login
- R2 upload of a test text blob

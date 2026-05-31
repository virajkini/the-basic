# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**Amgel Jodi** — a GSB Konkani matrimony platform with three frontends, an Express API server, Lambda functions, and a native Android app.

## Commands

### Root (runs all services concurrently)
```bash
npm run install:all      # Install deps for all packages
npm run dev              # Start server (3001) + home (3000) + app (3002)
npm run typecheck        # TypeScript check across all packages
```

### Server (`cd server`)
```bash
npm run dev              # tsx watch (hot reload)
npm run build            # tsc + copy assets to dist/
npm run init:db          # Create MongoDB indexes (prod)
npm run init:db:stage    # Create MongoDB indexes (stage)
npm run seed:stage       # Seed stage database with test data
npm run compute:base-score  # Run profile scoring lambda locally
```

### Client apps (`cd client/amgel-jodi-home` or `cd client/amgel-jodi-app`)
```bash
npm run dev              # Next.js dev server
npm run build            # Production build
npm run lint             # ESLint
```

There are no automated tests in this repo.

## Architecture

### Services and ports
| Service | Port | Notes |
|---|---|---|
| `server` | 3001 | Express API, all `/api/*` routes |
| `amgel-jodi-home` | 3000 | Marketing site, SSG (`output: 'export'`) |
| `amgel-jodi-app` | 3002 | Protected app, SSR (`output: 'standalone'`) |

### Server structure
`server/src/` follows a routes → services → DB pattern with no ORM:
- **routes/** — Express handlers, thin, delegate to services
- **services/** — Business logic (e.g. `profileManager.ts`, `connectionManager.ts`)
- **middleware/** — `auth.ts` (JWT), `admin.ts`, `otpRateLimit.ts`, `verifyOwnership.ts`
- **models/** — TypeScript types/schemas only (no Mongoose)
- **config/appEnv.ts** — Single source of truth for `APP_ENV` (`stage` | `prod`) and derived DB name

### Environment switching
The server uses `APP_ENV=stage` to switch database from `amgeljodi` → `amgeljodi_stage`. On stage, OTP verification accepts `STAGE_OTP_CODE` (default `1111`) to bypass MSG91.

### Authentication
OTP via MSG91 SMS → JWT issued by server → stored as an httpOnly cookie with `domain: .amgeljodi.com`. The protected Next.js layout (`app/(protected)/layout.tsx`) reads this cookie server-side via `cookies()` and redirects unauthenticated users to the home app.

### Client ↔ Server connection
Both client apps talk to the server via `NEXT_PUBLIC_API_BASE_URL`. The home app also needs `NEXT_PUBLIC_APP_URL`; the protected app needs `NEXT_PUBLIC_HOME_URL`.

```
# amgel-jodi-home/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3002

# amgel-jodi-app/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_HOME_URL=http://localhost:3000
```

Production URLs: `https://www.amgeljodi.com`, `https://app.amgeljodi.com`, `https://api.amgeljodi.com`.

### File uploads
Client requests a presigned S3 URL from `/api/files/*`, uploads directly to S3, then saves the key in the profile. Images are served via CloudFront (`static.amgeljodi.com`). Images are compressed in-browser before upload (`browser-image-compression`).

### Lambda functions (`server/lambda/`)
- **compute-base-score** — Nightly batch job scoring all profiles; can be run locally via `npm run compute:base-score`
- **image-blur-handler** — S3-triggered image processing

### Android app (`client/amgel-jodi-android/`)
Native Kotlin app wrapping the web app in a WebView. Exposes a JavaScript bridge at `window.AmgelJodiNative` for camera (`pickImages`, `takePhoto`), sharing, and biometric auth. Deep links to `amgeljodi.com` URLs open natively.

### CI/CD
GitHub Actions (`.github/workflows/deploy.yml`) triggers on pushes to `main` that touch `server/` — builds a Docker image and pushes to ECR. Client apps deploy separately via AWS Amplify.

## Key environment variables

| Variable | Where | Purpose |
|---|---|---|
| `APP_ENV` | server | `stage` or `prod` — drives DB selection |
| `MONGODB_URI` | server | Atlas connection string |
| `JWT_SECRET` | server | Token signing |
| `MSG91_WIDGET_ID` | server | OTP delivery |
| `S3_BUCKET_NAME` | server | Image uploads |
| `CLOUDFRONT_DOMAIN` | server | Image CDN |
| `CLIENT_URL` | server | Extra CORS origin (dynamic deployments) |
| `STAGE_OTP_CODE` | server | Bypass OTP on stage (default `1111`) |
| `NEXT_PUBLIC_API_BASE_URL` | both clients | Backend API base |

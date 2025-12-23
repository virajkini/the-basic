# Amgel Jodi App

SSR-protected application for authenticated users.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_HOME_URL=http://localhost:3000
```

3. Run development server:
```bash
npm run dev
```

The app will run on http://localhost:3002

## Features

- SSR (Server-Side Rendering) for protected routes
- Auth enforcement at layout level
- Protected routes: `/dashboard`, `/profile`, `/settings`
- Auto-redirect to home if not logged in


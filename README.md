# DED-Frontend

Next.js admin UI for DED (package name: `derin-frontend`). After login, organization admins and users can work with events, rules, notifications, activity, and monitoring, and manage team members and invites.

The NestJS API is in [DED-Backend](https://github.com/clintunn/DED-Backend).

## Tech stack

- Next.js 14 (App Router), React 18, TypeScript
- Tailwind CSS
- Vitest and Testing Library

## Features

- Email/password login, forgot and reset password, and change password
- Foundation registration and invite create/accept flows
- Role-aware sidebar (`ORG_ADMIN` and `USER`): dashboard, team members, invites, security, events, rules, notifications, activity, and monitor
- Events: list all or "my" events, create, and watch execution
- Rules: list and create (create is admin-only in the nav)
- Dashboard metrics, notifications, activity, and a monitor view

Auth and organization APIs go to DED-Backend. The client also has Next.js `/api` route handlers and mock fixtures under `lib/` for some dashboard data.

## Run locally

This repo has a `yarn.lock`. The backend should be running as well (see DED-Backend).

```bash
yarn install
cp .env.example .env.local
yarn dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to `/dashboard`.

### Environment

From `.env.example` and `lib/api.ts` (names only):

| Variable | Role |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Backend base URL (preferred) |
| `NEXT_PUBLIC_API_URL` | Fallback backend base URL |
| `VITE_API_URL` | Additional fallback backend base URL |

If none of those are set, the backend client defaults to `http://localhost:3000`. For server-side requests to this Next app's own `/api` routes you can also set `NEXT_PUBLIC_APP_URL` or `NEXT_PUBLIC_APP_ORIGIN` (`VERCEL_URL` is used automatically on Vercel).

Other scripts: `yarn dev:bind` binds `0.0.0.0:3000`; `yarn test` runs Vitest; `yarn build` / `yarn start` for production mode.

## Project structure

```
app/                 # App Router pages (auth, admin dashboard, events, rules, etc.)
components/          # UI for auth, dashboard, events, rules, monitoring, and invites
lib/api.ts           # Backend and local API client
lib/auth.ts          # Session helpers
types/               # Shared TypeScript types
tests/               # Vitest component and API client tests
```

Built by Clinton Nkamigbo · https://clinton-nkamigbo.vercel.app

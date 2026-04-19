# PXI Studio – Next.js frontend

Next.js frontend for PXI Studio. Backend runs separately (EC2). This repo is **frontend only**, deployable to Netlify.

## Project structure (Next.js standard)

All application code lives under **`src/`**. The **`app`** directory is inside **`src`** so routes and config stay together.

```
pxi-web-app/
├── src/
│   ├── app/                    # Next.js App Router (routes live here)
│   │   ├── layout.jsx         # Root layout
│   │   ├── globals.css
│   │   ├── (public)/           # Route group: Navbar + Footer
│   │   │   ├── layout.jsx
│   │   │   ├── page.jsx        # /
│   │   │   ├── about/page.jsx
│   │   │   ├── events/page.jsx
│   │   │   ├── events/[id]/page.jsx
│   │   │   ├── support/page.jsx
│   │   │   ├── terms_of_service/page.jsx
│   │   │   └── privacy_policy/page.jsx
│   │   ├── login/page.jsx
│   │   ├── login/email/page.jsx
│   │   ├── signup/page.jsx
│   │   ├── passport-required/page.jsx
│   │   ├── dashboard/          # Protected by middleware
│   │   │   ├── layout.jsx
│   │   │   ├── page.jsx
│   │   │   ├── passport/page.jsx
│   │   │   ├── vendor-upgrade/page.jsx
│   │   │   └── account/page.jsx
│   │   ├── 403/page.jsx
│   │   ├── 503/page.jsx
│   │   ├── not-found.jsx
│   │   └── api/auth/           # set-cookie, clear-cookie
│   ├── components/
│   ├── config/
│   ├── contexts/
│   ├── services/
│   ├── views/                   # Page content (used by app routes)
│   └── assets/
├── public/                     # Static assets (Next.js convention)
├── middleware.ts                # Edge RBAC for /dashboard/*
├── next.config.js
├── netlify.toml
└── .env.example
```

- **Why `app` is inside `src`:** Next.js allows either root `app/` or `src/app/`. Putting **`app` under `src`** keeps all app code in one place and matches the usual “use src” setup.
- **`middleware.ts`** stays at the **project root**; Next.js requires it there.
- **`public/`** stays at the **project root** for static files.

## Removed: `css/` and `js/` (legacy)

The **`css/`** and **`js/`** folders at the project root were from an older, non-Next.js setup (vanilla HTML/CSS/JS: e.g. `css/styles.css`, `js/main.js` for nav, cookie banner, etc.). They are **not used** by this Next.js app, which uses:

- **`src/app/globals.css`** for global styles
- React components and Next.js for behavior

They have been removed to avoid confusion. If you need that legacy code, restore it from git history.

## Removed (Vite/React legacy)

These files were from the old Vite + React setup and are not used by Next.js:

- `src/main.jsx` – Vite entry (Next uses `src/app/layout.jsx`)
- `src/index.css`, `src/index2.css`, `src/App.css` – global CSS (Next uses `src/app/globals.css`)
- `index.html` – Vite HTML (Next generates its own)
- `vite.config.js` – Vite config (project uses Next.js)
- `src/components/ProtectedRoute.jsx` – dashboard is protected by Edge middleware
- `src/layouts/PublicLayout.jsx` – replaced by `src/app/(public)/layout.jsx`
- `src/components/RouteListener.jsx` – React Router helper, unused with Next
- `COMPONENT_REFACTORING.md` – outdated refactor notes

## Local development

```bash
cp .env.example .env
# Edit .env and set values for your local environment
npm install
npm run dev
```

`.env` is gitignored. Next.js reads it automatically in development.

## Deployment (Netlify)

Deployed via `@netlify/plugin-nextjs` (defined in `netlify.toml`). Build output is `.next/`.

Set in **Netlify → Site settings → Environment variables**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL, no trailing slash |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `NEXT_PUBLIC_APPLE_SERVICE_ID` | Apple Sign-In service ID |
| `NEXT_PUBLIC_PASETO_PUBLIC_KEY` | Base64 Ed25519 public key (for Edge middleware) |

All client-exposed variables must use the `NEXT_PUBLIC_` prefix. After adding or changing any variable, trigger a new deploy for changes to take effect.

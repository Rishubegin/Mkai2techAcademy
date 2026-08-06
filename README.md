# M Kai² Tech Academy

Coaching-institute website and admin portal — school academics, competitive
exam prep, computer skills and programming, taught in person in Lucknow.

A React (Vite) frontend and an Express + MongoDB API, kept in one repository as
two independent npm projects.

```
.
├── client/    React 19 + Vite + Tailwind + shadcn/ui frontend
└── server/    Express 5 + Mongoose API
```

## Getting started

Both halves run independently. Start the API first — the client expects it on
port 7777.

```bash
cd server && npm install && npm run dev
```

```bash
cd client && npm install && npm run dev
```

Copy `.env.example` to `.env` in each directory and fill it in before the first
run. The server needs a MongoDB connection string, a JWT secret, and Cloudinary
credentials (all uploads go to Cloudinary, nothing is written to disk).

## Layout

### `client/src`

```
components/
  common/     Cross-cutting widgets — ThemeToggle, NoticeBanner,
              NotificationBell, ErrorBoundary, ProtectedRoute
  home/       Homepage sections — carousels, faculty, inquiry form
  layout/     Header and Footer, the app shell
  ui/         shadcn/ui primitives (generated; edit with care)
context/      Auth and Theme providers. Each provider is split into a
              .jsx (component) and a .js (context object) so react-refresh
              can hot-reload the provider.
hooks/        useAuth, useTheme
lib/          utils — cn(), media URL resolution
pages/
  public/     Unauthenticated pages, including HomePage
  auth/       Login / signup
  student/    Student dashboard and profile
  admin/      Admin portal, mounted under AdminLayout
services/     api.js — the configured axios instance
```

Import across folders with the `@/` alias (`@/components/ui/button`) rather
than relative paths; it is configured in both `vite.config.js` and
`jsconfig.json`.

Routes are declared in `App.jsx`. Everything except the layout shell and the
homepage is `lazy()`-loaded, so a first paint doesn't pull in the admin bundle.

### `server/src`

```
config/       Database and Cloudinary clients
middlewares/  auth (required), optionalAdmin (best-effort), authorize (roles),
              upload (multer), sanitize
models/       Mongoose schemas
routes/       One router per resource; each declares paths relative to /api
services/     email
utils/        cloudinaryUpload, enrollment helpers
```

`app.js` mounts every router through a single table. Routers are organised by
resource, not by HTTP verb — all ten `/users` endpoints live in `routes/user.js`.
Within a router, literal paths (`/users/me`) must be declared before
parameterised ones (`/users/:id`), or `:id` swallows them.

## Tests

```bash
cd server && npm test
```

69 integration tests run against a real MongoDB instance, redirected to a
`_test` database (see `tests/testUtils.js`). They must run sequentially —
`npm test` already passes `--runInBand`; invoking `jest` directly without it
lets parallel suites wipe each other's data.

# RoamCeylon Admin — Backend

The **RoamCeylon Admin** backend is a RESTful API server that powers the admin panel for tourism-industry partners in Sri Lanka. Built with [NestJS](https://nestjs.com/) 11 and [Prisma](https://www.prisma.io/) ORM, it provides CRUD operations, authentication, image uploads, and dashboard analytics for Hotel Managers, Activity Providers, Shop Partners, and Tour Guides.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | NestJS 11 (Express platform) |
| **Language** | TypeScript 5.7 (ES2023 target) |
| **ORM** | Prisma 5.22 with PostgreSQL |
| **Database** | PostgreSQL (hosted on [Nhost](https://nhost.io/)) via PgBouncer |
| **Auth** | Nhost JWT — custom `NhostJwtGuard` decodes Bearer tokens |
| **File Storage** | Nhost Storage — base64 image upload proxy via admin secret |
| **Validation** | `class-validator` + `class-transformer` with global `ValidationPipe` |
| **Testing** | Jest 30, Supertest 7 |
| **Linting** | ESLint 9 + Prettier |

---

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma              # Database schema (all models)
│
├── src/
│   ├── main.ts                    # App bootstrap — CORS, validation, payload limits
│   ├── app.module.ts              # Root module — imports all feature modules
│   ├── app.controller.ts          # Health-check endpoint (GET /)
│   ├── app.service.ts             # Root service
│   │
│   ├── common/
│   │   └── guards/
│   │       └── nhost-jwt.guard.ts # JWT auth guard — decodes Nhost tokens
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts       # Global Prisma module
│   │   └── prisma.service.ts      # Prisma client with retry & auto-reconnect
│   │
│   ├── admin-users/               # Partner profile management
│   │   ├── admin-users.module.ts
│   │   ├── admin-users.controller.ts
│   │   └── admin-users.service.ts
│   │
│   ├── users/                     # End-user (tourist) profile & bookings
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   └── users.service.ts
│   │
│   ├── shops/                     # Shop Partner module
│   │   ├── shops.module.ts
│   │   ├── shops.controller.ts
│   │   ├── shops.service.ts
│   │   ├── dto/
│   │   │   ├── create-shop.dto.ts
│   │   │   └── update-shop.dto.ts
│   │   └── entities/
│   │       └── shop.entity.ts
│   │
│   ├── activities/                # Activity Provider module
│   │   ├── activities.module.ts
│   │   ├── activities.controller.ts
│   │   ├── activities.service.ts
│   │   └── dto/
│   │       ├── create-activity.dto.ts
│   │       └── update-activity.dto.ts
│   │
│   ├── tour-guide/                # Tour Guide module
│   │   ├── tour-guide.module.ts
│   │   ├── tour-guide.controller.ts   # Authenticated guide endpoints
│   │   ├── public-tour.controller.ts  # Public endpoints (no auth)
│   │   ├── tour-guide.service.ts
│   │   ├── dto/
│   │   │   ├── create-package.dto.ts
│   │   │   ├── update-package.dto.ts
│   │   │   ├── create-booking.dto.ts
│   │   │   ├── update-booking-status.dto.ts
│   │   │   ├── create-inquiry.dto.ts
│   │   │   ├── convert-inquiry.dto.ts
│   │   │   ├── create-public-inquiry.dto.ts
│   │   │   ├── insights-response.dto.ts
│   │   │   └── revenue-response.dto.ts
│   │   └── entities/
│   │       └── tour-guide.entity.ts
│   │
│   └── notifications/             # Shared notification module
│       ├── notifications.module.ts
│       ├── notifications.controller.ts
│       └── notifications.service.ts
│
├── test/                          # E2E tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── package.json
├── tsconfig.json
├── nest-cli.json
├── eslint.config.mjs
├── .prettierrc
└── .env                           # Environment variables (see below)
```

---

## Modules & API Reference

### 🔧 App Root (`/`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | No | Health check — returns `"Hello World!"` |

---

### 👤 Admin Users (`/admin-users`)

Partner profile management (login sync, profile CRUD).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/admin-users/sync` | JWT | Upsert admin user profile on login |
| `GET` | `/admin-users/me` | JWT | Get current user's profile |
| `PATCH` | `/admin-users/me` | JWT | Update profile (name, phone, avatar, preferences) |
| `DELETE` | `/admin-users/me` | JWT | Deactivate (delete) profile |

**Key behaviors:**
- On sync, system roles (`user`, `me`, `anonymous`, `public`) from Nhost JWT never overwrite real app roles stored in the DB
- User lookup falls back from `id` → `email` for flexibility

---

### 👥 Users (`/users`)

End-user (tourist) profile and booking retrieval.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/users/me` | JWT | Get user profile (auto-creates if missing) |
| `PATCH` | `/users/me` | JWT | Update user profile |
| `GET` | `/users/me/tour-bookings` | JWT | Get user's tour booking history |

---

### 🛍️ Shops (`/shops`)

Shop Partner CRUD with owner-scoped access, image uploads, and status management.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/shops/stats` | JWT | Dashboard stats for authenticated partner |
| `GET` | `/shops/my` | JWT | List partner's own shops |
| `GET` | `/shops` | No | List all shops (optionally `?status=`) |
| `GET` | `/shops/:id` | No | Get single shop |
| `POST` | `/shops/upload-image` | JWT | Upload image to Nhost Storage (base64) |
| `POST` | `/shops` | JWT | Create shop (status: `under_review`) |
| `PUT` | `/shops/:id` | JWT | Update own shop (admin can update any) |
| `DELETE` | `/shops/:id` | JWT | Delete own shop (admin can delete any) |
| `PATCH` | `/shops/:id/status` | JWT | Update shop status (`active` / `under_review` / `inactive`) |

**Shop statuses:** `active`, `under_review`, `inactive`

---

### 🎯 Activities (`/activities`)

Activity Provider CRUD with dashboard analytics and scheduling.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/activities/dashboard` | JWT | Dashboard stats for activity provider |
| `GET` | `/activities/schedule` | JWT | Upcoming bookings schedule |
| `GET` | `/activities/list` | JWT | List provider's activities |
| `GET` | `/activities/list/:id` | JWT | Get single activity |
| `POST` | `/activities/list` | JWT | Create activity |
| `PUT` | `/activities/list/:id` | JWT | Update activity |
| `DELETE` | `/activities/list/:id` | JWT | Delete activity |
| `PATCH` | `/activities/list/:id/status` | JWT | Update activity status |
| `POST` | `/activities/upload-image` | JWT | Upload image to Nhost Storage (base64) |

**Activity statuses:** `active`, `inactive`

---

### 🧭 Tour Guide (`/tour-guide`)

Full tour guide management — packages, bookings, inquiries, dashboard, revenue, and insights.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| **Dashboard** |
| `GET` | `/tour-guide/dashboard` | JWT | Dashboard stats |
| `GET` | `/tour-guide/revenue` | JWT | Revenue statistics |
| `GET` | `/tour-guide/insights` | JWT | Business insights |
| **Packages** |
| `GET` | `/tour-guide/packages` | JWT | List guide's packages |
| `GET` | `/tour-guide/packages/:id` | JWT | Get single package |
| `POST` | `/tour-guide/packages` | JWT | Create package |
| `PUT` | `/tour-guide/packages/:id` | JWT | Update package |
| `DELETE` | `/tour-guide/packages/:id` | JWT | Delete package |
| `PATCH` | `/tour-guide/packages/:id/status` | JWT | Update package status |
| **Image Upload** |
| `POST` | `/tour-guide/upload-image` | JWT | Upload image to Nhost Storage |
| **Bookings** |
| `GET` | `/tour-guide/bookings` | JWT | List bookings (optionally `?status=`) |
| `GET` | `/tour-guide/bookings/:id` | JWT | Get single booking |
| `POST` | `/tour-guide/bookings` | JWT | Create booking |
| `PATCH` | `/tour-guide/bookings/:id/status` | JWT | Update booking status |
| **Inquiries** |
| `GET` | `/tour-guide/inquiries/stats` | JWT | Inquiry statistics |
| `GET` | `/tour-guide/inquiries` | JWT | List inquiries (optionally `?status=`) |
| `GET` | `/tour-guide/inquiries/:id` | JWT | Get single inquiry |
| `POST` | `/tour-guide/inquiries` | JWT | Create inquiry |
| `PATCH` | `/tour-guide/inquiries/:id/status` | JWT | Update inquiry status |
| `POST` | `/tour-guide/inquiries/:id/convert` | JWT | Convert inquiry to booking |
| **Notifications** |
| `GET` | `/tour-guide/notifications` | JWT | List guide's notifications |
| `PATCH` | `/tour-guide/notifications/read-all` | JWT | Mark all as read |
| `PATCH` | `/tour-guide/notifications/:id/read` | JWT | Mark one as read |

**Package statuses:** `active`, `draft`, `inactive`
**Booking statuses:** `confirmed`, `pending`, `completed`, `cancelled`
**Inquiry statuses:** `new`, `priority`, `responded`, `archived`
**Notification types:** `booking`, `chat`, `payment`, `system`

---

### 🌐 Public Tours (`/public-tours`)

Unauthenticated endpoints for the consumer-facing app.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/public-tours/packages` | No | List all active tour packages |
| `POST` | `/public-tours/inquiries` | No | Submit a public inquiry |

---

### 🔔 Notifications (`/notifications`)

Shared notification module (also mounted under `/tour-guide/notifications`).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/notifications` | JWT | List user's notifications |
| `GET` | `/notifications/unread-count` | JWT | Get unread notification count |
| `PATCH` | `/notifications/read-all` | JWT | Mark all as read |
| `PATCH` | `/notifications/:id/read` | JWT | Mark one as read |

---

## Database Schema

The Prisma schema defines the following domain models:

### Admin & User Models
| Model | Table | Description |
|---|---|---|
| `AdminUser` | `admin_users` | Partner profiles (name, email, phone, role, avatar, preferences) |
| `User` | `User` | End-user / tourist profiles |

### Shop Models
| Model | Table | Description |
|---|---|---|
| `Shop` | `shops` | Shop listings with owner, category, hours, social links, location |

### Tour Guide Models
| Model | Table | Description |
|---|---|---|
| `TourPackage` | `tour_packages` | Tour packages with gallery, highlights, pricing, duration |
| `TourBooking` | `tour_bookings` | Bookings linked to packages with customer info, dates, amounts |
| `TourInquiry` | `tour_inquiries` | Customer inquiries with pipeline value tracking |
| `TourNotification` | `tour_notifications` | In-app notifications (booking, chat, payment, system) |

### Activity Models
| Model | Table | Description |
|---|---|---|
| `Activity` | `activities` | Activity listings with difficulty, schedule, pricing, capacity |
| `ActivityBooking` | `activity_bookings` | Activity bookings with customer info and scheduling |

### Other Models (from main RoamCeylon app)
The schema also includes models shared with the main consumer app: `ChatSession`, `Message`, `SavedTrip`, `MarketPlace`, `RideRequest`, `DriverLocation`, `TransportSession`, `embeddings`, and various analytics/feedback tables.

---

## Authentication

The backend uses a custom `NhostJwtGuard` that:

1. Extracts the `Bearer <token>` from the `Authorization` header
2. Decodes the JWT payload (base64url) to extract:
   - `sub` → `userId`
   - `x-hasura-default-role` (from Hasura claims) or `role` → `role`
3. Attaches `{ userId, role }` to `req.user` for downstream handlers

> **Note:** Currently uses decode-only (no signature verification). For production, verify against Nhost's JWKS endpoint.

Owner-scoped access is enforced at the service layer — partners can only modify their own resources unless they have an `admin` or `super_admin` role.

---

## Prisma Service

The `PrismaService` extends `PrismaClient` with production-hardening features:

- **Retry with exponential backoff** — Up to 10 attempts on startup (handles Nhost free-tier DB sleep)
- **Auto-reconnect middleware** — Catches `P1001` / `P1017` errors and reconnects transparently
- **`ensureConnected()`** — On-demand connection health check
- **Graceful shutdown** — Disconnects cleanly via `onModuleDestroy`

---

## Image Upload Flow

All modules support image uploads through Nhost Storage:

```
Client (base64 image) → POST /[module]/upload-image
    → Backend decodes base64 to Buffer
    → Creates FormData with bucket-specific ID
    → POSTs to Nhost Storage API with admin secret
    → Returns { url: "https://...nhost.run/v1/files/{fileId}" }
```

Storage buckets: `Shops`, `TourPackages`, `Activities`

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (LTS)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- PostgreSQL database (or a [Nhost](https://nhost.io/) project)

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgres://<user>:<password>@<host>:<port>/<database>?schema=public&pgbouncer=true&connection_limit=10&sslmode=require
DIRECT_URL=postgres://<user>:<password>@<host>:<port>/<database>?schema=public&sslmode=require
PORT=3001
NODE_ENV=development
NHOST_SUBDOMAIN=<nhost-project-subdomain>
NHOST_REGION=<nhost-region>
NHOST_ADMIN_SECRET=<nhost-admin-secret>
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (via PgBouncer) |
| `DIRECT_URL` | Direct PostgreSQL connection (for Prisma migrations) |
| `PORT` | Server port (default: `3001`) |
| `NODE_ENV` | Environment (`development` / `production`) |
| `NHOST_SUBDOMAIN` | Nhost project subdomain |
| `NHOST_REGION` | Nhost region (e.g., `ap-southeast-1`) |
| `NHOST_ADMIN_SECRET` | Nhost admin secret for Storage API uploads |

### Installation & Running

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Generate Prisma Client**

   ```bash
   npx prisma generate
   ```

3. **Run database migrations** (if needed)

   ```bash
   npx prisma db push
   ```

4. **Start the development server**

   ```bash
   npm run start:dev
   ```

   The server will start at `http://localhost:3001` with hot-reload.

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `start` | `nest start` | Start in production mode |
| `start:dev` | `nest start --watch` | Start with hot-reload |
| `start:debug` | `nest start --debug --watch` | Start with debugger |
| `start:prod` | `node dist/main` | Run compiled production build |
| `build` | `nest build` | Compile TypeScript to `dist/` |
| `lint` | `eslint "{src,apps,libs,test}/**/*.ts" --fix` | Lint & auto-fix |
| `format` | `prettier --write "src/**/*.ts" "test/**/*.ts"` | Format code |
| `test` | `jest` | Run unit tests |
| `test:watch` | `jest --watch` | Run tests in watch mode |
| `test:cov` | `jest --coverage` | Run tests with coverage |
| `test:e2e` | `jest --config ./test/jest-e2e.json` | Run E2E tests |

---

## Server Configuration

The `main.ts` bootstrap configures:

- **CORS** — Open to all origins (`*`) for dev; allows `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- **Payload limits** — `50mb` for JSON and URL-encoded bodies (supports base64 image uploads)
- **Global ValidationPipe** — Whitelist mode, auto-transform, lenient on unknown fields
- **Shutdown hooks** — Graceful cleanup on `SIGTERM` / `SIGINT`

---

## License

This project is proprietary. See the project root for license details.

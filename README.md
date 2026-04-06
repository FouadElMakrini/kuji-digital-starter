# Kuji Digital Starter

Starter project for a digital Ichiban Kuji app with:

- **Admin interface** (`/admin`) for the seller
- **Client interface** (`/play`) for the iPad
- Multiple Kujis in parallel
- Access by **code**
- Visual grid with opened tickets greyed out
- Ticket history
- Single admin account

## Tech choices

This starter uses the **Next.js App Router**, which is the newer Next.js router, and uses **Route Handlers** for custom request handlers inside the `app` directory.

For the database, it uses **Prisma ORM** with **PostgreSQL**. Prisma documents Prisma ORM as a type-safe ORM that works with Postgres, and its PostgreSQL quickstarts show the standard setup flow with `npx prisma init`, schema definition, migrations, and Prisma Client.

I deliberately used a **simple custom admin login** instead of Auth.js because your app has exactly one seller account and you asked for the simplest possible setup. Auth.js is still a valid option for a later upgrade if you want multiple roles or external providers. Auth.js recommends a central `auth.ts` configuration pattern for framework integrations.

## 1. Prerequisites on your Mac

- Node.js 20.19+ or newer
- PostgreSQL
- VS Code

Prisma’s current Next.js guide lists Node.js `v20.19+`, `v22.12+`, or `v24.0+` as supported prerequisites for that guide.

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Copy the example file:

```bash
cp .env.example .env
```

Then edit `.env` with your own database URL, admin email, admin password, and session secret.

## 4. Create the database schema

Generate the Prisma client and apply the migration:

```bash
npm run db:migrate -- --name init
```

If you prefer a quick schema push during early testing:

```bash
npm run db:push
```

## 5. Create your admin account

```bash
npm run seed
```

This creates or updates the single admin account defined in `.env`.

## 6. Start the app

```bash
npm run dev
```

Then open:

- `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`
- Client iPad page: `http://localhost:3000/play`

## 7. First use flow

1. Log in as admin.
2. Create a Kuji.
3. Enter prize tiers and quantities.
4. The app generates all tickets automatically.
5. Open a Kuji detail page.
6. Create a client session with a number of paid draws.
7. Give the generated code to the customer.
8. On the iPad, the customer enters the code and opens tickets.

## 8. Notes

- Ticket positions are randomized **once** when the Kuji is created.
- Opened tickets stay grey in the same place.
- The code is linked to one Kuji only.
- The app records each draw in the history table.
- The opening route uses a database transaction to avoid opening the same ticket twice.

## 9. Recommended production deployment

For a simple online deployment:

- App: Vercel
- Database: Neon, Supabase Postgres, Railway, or another hosted Postgres

Prisma’s Next.js guide explicitly covers using Prisma with Next.js and Vercel, and Prisma’s Postgres docs describe Prisma Postgres / Postgres workflows including migrations, pooling, and queries.

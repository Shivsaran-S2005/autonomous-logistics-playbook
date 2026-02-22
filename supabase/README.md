# Supabase Database Setup

This project uses Supabase (PostgreSQL) for all backend data when configured.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a project
2. Copy the **Project URL** and **anon public** key from Settings → API

## 2. Configure Environment

Add to `.env` in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Run the Migration

In the **Supabase Dashboard → SQL Editor**, run the contents of:

- `supabase/migrations/00001_initial_schema.sql`

This creates: `suppliers`, `retailers`, `products`, `deliveries`, `retailer_requests`, `live_feed`, `supply_shifts`, `action_logs`, `governance_log`, `ares_world_state`.

## 4. Seed the Database

In the **SQL Editor**, run the contents of:

- `supabase/seed.sql`

This inserts sample suppliers, retailers, products, deliveries, and a live feed entry.

## 5. Run the App

```bash
npm install
npm run dev
```

The app will call `initDb()` on startup, fetch data from Supabase, and use it for all operations. Writes (new requests, resolve, live feed updates, etc.) persist to Supabase.

## Tables

| Table | Purpose |
|-------|---------|
| `suppliers` | Cadbury, Nestle, Ferrero, Mars, Hershey's |
| `retailers` | Mumbai, Delhi, Bangalore retailers (login: retailer@mumbai.com / retailer123) |
| `products` | Chocolate, candy, wafer products |
| `deliveries` | Live delivery tracking |
| `retailer_requests` | Restock/delay requests (Pending → Resolved) |
| `live_feed` | Stock shortage, transport delay errors |
| `supply_shifts` | Supplier A → B flow animation data |
| `action_logs` | Audit logs |
| `governance_log` | Mode changes, scenario triggers |
| `ares_world_state` | Optional simulation state persistence |

## Without Supabase

If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not set, the app falls back to in-memory data + localStorage (retailer requests). All features work; data does not persist across deployments.

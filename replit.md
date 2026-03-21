# Medicine API

A RESTful API serving data from the European Medicines Agency (EMA) database.

## Architecture

- **Runtime**: Bun 1.3
- **Framework**: ElysiaJS
- **Database**: SQLite via Drizzle ORM (bun:sqlite)
- **Validation**: Zod + TypeBox (via Elysia's `t`)
- **Error handling**: Effect (functional programming)
- **API Docs**: Swagger/Scalar at `/api-docs`

## Project Structure

- `index.ts` — Entry point; initializes DB and starts the server
- `server.ts` — All route definitions and API logic
- `db/` — Database connection, schema, migration, and seeding scripts
- `drizzle/` — Auto-generated SQL migrations
- `data/medicines.csv` — Source CSV with 2623 medicine records

## Setup

1. Copy `.env.example` to `.env` (sets `DB_FILE_NAME=mydb.sqlite`)
2. `bun install` — Install dependencies
3. `bun run build` — Generate migrations, run migrations, and seed the database
4. `bun run index.ts` — Start the server

## Environment Variables

- `DB_FILE_NAME` — Path to the SQLite database file (default: `mydb.sqlite`)
- `PORT` — Server port (default: 4000; Replit workflow uses 5000)

## API Endpoints

- `GET /health` — Health check
- `GET /medicines` — List/search medicines (supports pagination, filters)
- `GET /medicines/:id` — Get a single medicine by ID
- `GET /medicines/fields/:fieldName` — Get unique values for a field
- `GET /medicines/stats` — Aggregate statistics
- `GET /api-docs` — Interactive Swagger/Scalar documentation

## Workflow

- **Start application**: `PORT=5000 bun run index.ts` on port 5000

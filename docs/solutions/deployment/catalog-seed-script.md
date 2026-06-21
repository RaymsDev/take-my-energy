---
title: 'Catalog seed script: populate MongoDB with service definitions'
date: 2026-06-21
category: docs/solutions/deployment
module: catalog
problem_type: workflow_pattern
component: api
severity: low
symptoms:
  - 'GET /api/catalog returns an empty array after a fresh deploy or DB wipe'
  - 'Gift card creation fails with 404 — service not found — because the catalog collection is empty'
root_cause: catalog_not_seeded
resolution_type: operational_procedure
tags:
  - seed
  - mongodb
  - catalog
  - deployment
  - nx
---

## Context

Catalog services (massages, soins, etc.) are no longer stored in a static JSON
file in the frontend. They are persisted in MongoDB via the `CatalogServiceModel`
collection. The seed script is the **only** way to populate or update this data —
there is no admin CRUD UI.

The seed is idempotent: running it multiple times is safe. It uses `updateOne`
with `upsert: true`, keyed on the stable string `id` field (`'1'`–`'9'`), so
re-running never duplicates documents and always converges to the correct state.

## When to run

- **After every initial deploy** to a new environment (staging, production, fresh
  Render service)
- **After a DB wipe or restore** that does not include the catalog collection
- **When adding or editing a service** — update `SERVICES` in `catalog.seed.ts`,
  then re-run the script; existing documents are updated in place

## How to run

### Locally

```bash
# Requires MONGODB_URI in the environment (or a local .env)
npm exec nx run api:seed
```

### On Render (production)

In the Render dashboard, open the **api** service → **Shell** tab, then:

```bash
npm exec nx run api:seed
```

Alternatively, add it as a one-off job or a post-deploy hook in `render.yaml`
if you want it to run automatically on every deploy.

## Nx target definition

Defined in `apps/api/project.json` under the `seed` target:

```json
"seed": {
  "executor": "@nx/js:node",
  "options": {
    "buildTarget": "api:build",
    "args": ["apps/api/src/catalog/catalog.seed.ts"]
  }
}
```

## Source files

- **Script**: `apps/api/src/catalog/catalog.seed.ts` — contains the `SERVICES`
  array and the seed runner. Edit this file to add, rename, reprice, or remove a
  service.
- **Schema**: `apps/api/src/catalog/schemas/catalog-service.schema.ts`
- **Module registration**: `apps/api/src/catalog/catalog.module.ts`

## Adding or editing a service

1. Open `apps/api/src/catalog/catalog.seed.ts`
2. Edit the `SERVICES` array (add an entry, change `title`, `price`, etc.)
3. Re-run the seed — existing documents are updated, new ones are inserted

> **Do not change the `id` field** of an existing service. The `id` is embedded
> in QR code URLs generated for gift card PDFs
> (`/cadeau/service/:id`). Changing an id breaks all previously issued gift
> card PDFs that pointed to that service's landing page.

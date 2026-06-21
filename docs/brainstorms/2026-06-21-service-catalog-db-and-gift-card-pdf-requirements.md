---
date: 2026-06-21
topic: service-catalog-db-and-gift-card-pdf
---

# Service Catalog in DB, Public Service Pages & Gift Card PDF

## Summary

Three connected improvements: move the backend service catalog from a static config file into MongoDB (seed-only, no admin CRUD); add public service landing pages in the Angular frontend (`/cadeau/service/:id`) so each service has its own URL; and attach a PDFKit-generated PDF to the gift card email, containing a QR code that links the recipient directly to the service's landing page.

---

## Problem Frame

The service catalog is hardcoded in `apps/api/src/catalog/catalog.config.ts`. This makes it invisible to the database, difficult to extend, and impossible to link to a browsable URL. Gift card emails deliver a code in HTML only — the recipient has no visual artifact and no immediate way to discover what the service actually involves. Adding a PDF with a QR code bridges the email to the web experience and makes the gift feel more complete.

---

## Key Decisions

- **Seed-only catalog.** No admin UI to create, edit, or delete services. The 9 existing services are inserted into MongoDB by an idempotent seed script. Future changes to the catalog go through code or a DB migration, not an admin form. Keeps scope tight while making the catalog API-first.

- **New public service landing pages at `/cadeau/service/:id`.** The existing `massage/:type` editorial pages are content-heavy and were not designed for gift card recipients. A dedicated public route — lightweight, welcoming, focused on the service as a gift — is the right experience. No authentication, no gift card code required to view.

- **PDFKit for PDF generation.** Lightweight, code-driven, no headless browser. Generates a single-page PDF with service name, recipient/sender names, gift code, and a QR code image. Runs entirely in the NestJS process.

- **QR code encodes the frontend service page URL.** The `qrcode` npm package generates a PNG buffer that PDFKit embeds. The URL is constructed from a `FRONTEND_URL` env variable plus `/cadeau/service/:id`.

---

## Requirements

### R1 — Catalog persistence

- R1.1. A `CatalogServiceDocument` Mongoose schema is created at `apps/api/src/catalog/schemas/catalog-service.schema.ts` with fields: `id` (string, unique index), `title`, `price` (number), `currency`, `duration` (`{ value, unitText }`).
- R1.2. The `CatalogRegistryService` reads from MongoDB instead of the static array. `findAll()` and `findById()` become async and query the collection.
- R1.3. A seed script at `apps/api/src/catalog/catalog.seed.ts` inserts the 9 services from the former static config using an upsert on `id` (idempotent — safe to run multiple times).
- R1.4. `GET /catalog` returns all services (public, no JWT guard).
- R1.5. `GET /catalog/:id` is added to `CatalogController`, returns the service or 404.
- R1.6. The static `CATALOG_SERVICES` array in `catalog.config.ts` is removed once the seed script is verified.

### R2 — Public service landing pages

- R2.1. A new lazy-loaded Angular route `/cadeau/service/:id` is added to `apps/fiveOfHeart/src/app/app.routes.ts`.
- R2.2. The page component (`GiftCardServicePageComponent`) calls `GET /catalog/:id` on the public API and displays: service title, duration, price.
- R2.3. The page includes a welcoming message in French: e.g. _"Un cadeau vous a été offert pour ce soin."_ and a call-to-action to book (linking to the existing booking URL from `SITE_CONFIG`).
- R2.4. The page handles the 404 / loading state gracefully.
- R2.5. No authentication is required to view this page.

### R3 — Gift card PDF with QR code

- R3.1. `pdfkit` and `qrcode` are added to the API's dependencies.
- R3.2. A `PdfService` is created at `apps/api/src/pdf/pdf.service.ts`. It exposes a single method `generateGiftCardPdf(params)` returning a `Buffer`.
- R3.3. The PDF is a single A4 page and includes: service name, recipient name, sender name, the gift card code (monospace, large), and a QR code image.
- R3.4. The QR code encodes `${FRONTEND_URL}/cadeau/service/${serviceId}`.
- R3.5. `FRONTEND_URL` is added to the NestJS `ConfigService` configuration (env var, required).
- R3.6. `EmailService.sendGiftCard()` accepts an optional `pdfAttachment: Buffer` parameter. When present, it is included as an attachment in the Resend call (`content-type: application/pdf`, filename: `carte-cadeau.pdf`).
- R3.7. `GiftCardsService.create()` calls `PdfService` after persisting the card and passes the buffer to `EmailService`. PDF generation failure is logged and must not block card creation or email delivery of the HTML body.

### R4 — Shared contract update

- R4.1. The `CatalogService` interface in `libs/shared/interfaces` gains a `slug` field (optional, string) for future use — not required for this feature.
- R4.2. No new Zod DTOs are needed for the catalog read endpoints (they are read-only and unauthenticated).

---

## Scope Boundaries

**Deferred:**

- Admin UI to create, edit, or delete services
- Per-service images on the landing page (editorial content lives in `massages.json`, separate from the catalog)
- Gift card expiry or partial redemption
- Service-specific booking URL on the landing page (the catalog schema does not store per-office booking URLs — deferred to a future catalog enrichment)

**Out of scope:**

- Changes to the existing `massage/:type` editorial pages
- The Stripe/payment flow (tracked separately in the previous brainstorm)

---

## Dependencies & Assumptions

- MongoDB is already connected and running in the NestJS app (`@nestjs/mongoose`).
- Resend supports PDF attachments via the `attachments` field in `emails.send()`.
- `FRONTEND_URL` will be set to `https://cinqdecoeur.fr` in production and `http://localhost:4200` locally.
- The catalog `id` values (`'1'`–`'9'`) are stable and can be used as the `:id` path param in frontend routes.
